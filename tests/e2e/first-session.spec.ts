import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function waitForGuideStep(page: Page, step: string) {
  await expect(page.getByTestId("first-session-guide")).toContainText(step, {
    timeout: 10_000,
  });
}

async function waitForSave(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function setSavedMoney(page: Page, money: number): Promise<Page> {
  const [serialized, viewport] = await Promise.all([
    page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
  ]);
  if (serialized === null)
    throw new Error("Expected a persisted simulation state");

  const state = JSON.parse(serialized) as { resources: { money: number } };
  state.resources.money = money;

  // A live dedicated Worker can persist its older snapshot during reload.
  // Stop that page first, then seed the saved fixture before the next app boot.
  const context = page.context();
  await page.close();
  await context.addInitScript(
    ({ key, saved }) => localStorage.setItem(key, saved),
    { key: SAVE_KEY, saved: JSON.stringify(state) },
  );
  const restoredPage = await context.newPage();
  await restoredPage.setViewportSize(viewport);
  await restoredPage.goto("/");
  await waitForSave(restoredPage);
  return restoredPage;
}

test("first-session rail survives reload and placement requires an explicit handoff", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await waitForGuideStep(page, "step 1 of 3");
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "queue-starter",
  );
  await expect(page.getByTestId("onboarding-required-tab")).toHaveText(
    "Required tab · Jobs",
  );
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "Interactive Chat is the reliable first route",
  );
  await expect(
    page.getByLabel("Current objective and bottleneck"),
  ).toContainText("Queue one safe Interactive Chat job");
  await expect(
    page.getByLabel("Current objective and bottleneck"),
  ).not.toContainText("Workstation Expansion I");

  await openTab(page, "Jobs");
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^Batch Classification is available/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await waitForGuideStep(page, "step 2 of 3");
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "observe-settlement",
  );
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "locked quote, configured cost, and outcome",
  );
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
  await page.reload();
  await waitForGuideStep(page, "step 2 of 3");

  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Resume" }).click();
  await chooseSimulationSpeed(page, "64×");
  await waitForGuideStep(page, "step 3 of 3");
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "earn-remainder",
  );
  await expect(page.getByTestId("onboarding-required-tab")).toHaveText(
    "Required tab · Jobs",
  );
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "Precision Cleaner costs $4.00",
  );
  await expect(
    page.getByRole("button", { name: "Queue 1", exact: true }),
  ).toHaveAttribute("data-testid", "onboarding-primary-action");
  await expect(page.getByRole("button", { name: /^Queue 10/ })).toHaveClass(
    /secondary-action/,
  );

  page = await setSavedMoney(page, 4);
  await waitForGuideStep(page, "step 3 of 3");
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "buy-module",
  );
  await openTab(page, "Jobs");
  await expect(
    page.getByRole("button", { name: "Queue 1", exact: true }),
  ).toHaveClass(/secondary-action/);
  await openTab(page, "Upgrades");
  const recommendedModule = page.getByTestId("recommended-first-module");
  await expect(recommendedModule).toContainText("Precision Cleaner");
  const openUpgradeDetails = page.locator("article.upgrade-card details[open]");
  await expect(openUpgradeDetails).toHaveCount(1);
  await expect(recommendedModule.locator("details[open]")).toHaveCount(1);
  expect(
    await page.evaluate(() => {
      const recommended = document.querySelector(
        "[data-testid='recommended-first-module']",
      );
      const expansion = document.querySelector("#pipeline-store-title");
      return Boolean(
        recommended &&
          expansion &&
          recommended.compareDocumentPosition(expansion) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
  ).toBe(true);
  await expect(
    page.getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
    }),
  ).not.toHaveClass(/primary-action/);
  const buyPrecisionCleaner = page.getByRole("button", {
    name: "Buy Precision Cleaner for $4.00",
  });
  await expect(buyPrecisionCleaner).toBeEnabled();
  await buyPrecisionCleaner.click();
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "start-placement",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Upgrades", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const scrollRegion = page.locator(".app-scroll-region");
  await scrollRegion.evaluate((region) => {
    region.scrollTop = Math.min(80, region.scrollHeight - region.clientHeight);
  });
  const scrollBeforePlacement = await scrollRegion.evaluate(
    (region) => region.scrollTop,
  );
  expect(scrollBeforePlacement).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "place-module",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Upgrades", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("placement-handoff")).toContainText(
    "no navigation or install happened here",
  );
  await expect(page.locator(".placement-tray")).toHaveCount(0);
  await expect
    .poll(() => scrollRegion.evaluate((region) => region.scrollTop))
    .toBeGreaterThan(0);

  await openTab(page, "Build");
  await expect(page.locator(".placement-tray")).toContainText(
    "Place Precision Cleaner",
  );
  await expect(page.locator(".pipeline-slot.compatible")).toHaveCount(3);
  await page.getByRole("button", { name: "Cancel placement" }).click();

  const slotsBeforeDetails = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      slots: unknown;
    };
    return JSON.stringify(state.slots);
  }, SAVE_KEY);
  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.click();
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Snap here" })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Place Basic Cleaner in Build" })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel placement" }),
  ).toBeVisible();
  await openTab(page, "Jobs");
  await openTab(page, "Build");
  await expect(page.getByRole("button", { name: "Snap here" })).toHaveCount(0);
  expect(
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        slots: unknown;
      };
      return JSON.stringify(state.slots);
    }, SAVE_KEY),
  ).toBe(slotsBeforeDetails);

  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
  await openTab(page, "Build");
  await expect(page.locator(".placement-tray")).toContainText(
    "Place Precision Cleaner",
  );
  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("slot-prepare")).toContainText(
    "Precision Cleaner",
  );
  await expect(page.getByTestId("first-session-guide")).toHaveCount(0);

  await openTab(page, "Upgrades");
  await expect(openUpgradeDetails).toHaveCount(1);
  await expect(
    page.locator(
      "article.upgrade-card:has(#rig-title-bedroom-cpu) details[open]",
    ),
  ).toHaveCount(1);
});

test("first-session handoff preserves a Career draft and scroll until the player changes tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await openTab(page, "Career");

  const freelance = page.getByLabel("Freelance delivery evening hours");
  await freelance.fill("1");
  await expect(freelance).toHaveValue("1");
  const scrollRegion = page.locator(".app-scroll-region");
  await scrollRegion.evaluate((region) => {
    region.scrollTop = Math.min(180, region.scrollHeight - region.clientHeight);
  });
  const careerScroll = await scrollRegion.evaluate(
    (region) => region.scrollTop,
  );
  expect(careerScroll).toBeGreaterThan(0);

  await expect(page.getByTestId("onboarding-handoff")).toContainText(
    "Use the bottom Jobs tab",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Career", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(freelance).toHaveValue("1");

  await openTab(page, "Upgrades");
  await openTab(page, "Career");
  await expect(freelance).toHaveValue("1");
  await expect
    .poll(() => scrollRegion.evaluate((region) => region.scrollTop))
    .toBeGreaterThan(0);
});

test("short portrait keeps the complete guide reason and first Jobs action clear of navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await waitForSave(page);
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "Interactive Chat is the reliable first route",
  );

  const initialGeometry = await page.evaluate(() => {
    const nav = document
      .querySelector("nav[aria-label='Primary']")
      ?.getBoundingClientRect();
    const guide = document
      .querySelector("[data-testid='first-session-guide']")
      ?.getBoundingClientRect();
    const explanation = document
      .querySelector("[data-testid='onboarding-explanation']")
      ?.getBoundingClientRect();
    const firstPipelineControl = document
      .querySelector("[data-testid='pipeline'] button")
      ?.getBoundingClientRect();
    return {
      guideContainsExplanation: Boolean(
        guide &&
          explanation &&
          explanation.top >= guide.top &&
          explanation.bottom <= guide.bottom,
      ),
      firstPipelineControlClearsNavigation: Boolean(
        nav && firstPipelineControl && firstPipelineControl.bottom <= nav.top,
      ),
    };
  });
  expect(initialGeometry.guideContainsExplanation).toBe(true);
  expect(initialGeometry.firstPipelineControlClearsNavigation).toBe(true);

  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await waitForGuideStep(page, "step 3 of 3");
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "Precision Cleaner costs $4.00",
  );

  const jobsGeometry = await page.evaluate(() => {
    const nav = document
      .querySelector("nav[aria-label='Primary']")
      ?.getBoundingClientRect();
    const queueOne = [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.trim() === "Queue 1")
      ?.getBoundingClientRect();
    const undersizedControls = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .flatMap((button) => {
        const bounds = button.getBoundingClientRect();
        return bounds.width < 44 || bounds.height < 44
          ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
          : [];
      });
    return {
      queueOneHasReserve: Boolean(
        nav && queueOne && queueOne.bottom <= nav.top - 8,
      ),
      noHorizontalOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
      undersizedControls,
    };
  });
  expect(jobsGeometry.queueOneHasReserve).toBe(true);
  expect(jobsGeometry.noHorizontalOverflow).toBe(true);
  expect(jobsGeometry.undersizedControls).toEqual([]);
});

for (const viewport of [
  { width: 320, height: 693 },
  { width: 375, height: 667 },
  { width: 393, height: 742 },
]) {
  test(`first-session rail remains usable at ${viewport.width}px and 200% text`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForSave(page);
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await expect(page.getByTestId("first-session-guide")).toBeVisible();
    await expect(page.getByTestId("onboarding-explanation")).toContainText(
      "Interactive Chat is the reliable first route",
    );
    const initialGeometry = await page.evaluate(() => {
      const pipeline = document.querySelector("[data-testid='pipeline']");
      const undersizedControls = [...document.querySelectorAll("button")]
        .filter((button) => {
          const style = getComputedStyle(button);
          return style.display !== "none" && style.visibility !== "hidden";
        })
        .flatMap((button) => {
          const bounds = button.getBoundingClientRect();
          return bounds.width < 44 || bounds.height < 44
            ? [button.getAttribute("aria-label") ?? button.textContent?.trim()]
            : [];
        });
      return {
        noHorizontalOverflow:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
        noNestedRailScroll: pipeline
          ? pipeline.scrollHeight <= pipeline.clientHeight
          : true,
        undersizedControls,
      };
    });
    expect(initialGeometry.noHorizontalOverflow).toBe(true);
    expect(initialGeometry.noNestedRailScroll).toBe(true);
    expect(initialGeometry.undersizedControls).toEqual([]);
    await openTab(page, "Jobs");
    await expect(
      page.getByRole("button", { name: "Queue one safe Interactive Chat job" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}

test("a failed starter keeps its visible reason and surviving work through manual recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await waitForSave(page);

  await page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /^Quantized Model/ })
    .click();
  await page
    .getByRole("button", { name: /Remove Quantized Model from Runtime/ })
    .click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          slots: { slotId: string; moduleId: string | null }[];
        };
        return state.slots.find((slot) => slot.slotId === "runtime")?.moduleId;
      }, SAVE_KEY),
    )
    .toBeNull();
  const slotsAfterRemoval = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      slots: unknown;
    };
    return JSON.stringify(state.slots);
  }, SAVE_KEY);

  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect(page.getByTestId("first-session-guide")).toHaveAttribute(
    "data-onboarding-action",
    "earn-remainder",
    { timeout: 10_000 },
  );
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "Review failed settlement",
  );
  await expect(page.getByTestId("onboarding-explanation")).toContainText(
    "latest starter delivery failed",
  );
  await expect(page.locator(".settlement-recovery")).toContainText(
    "Failure record",
  );
  expect(
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        lastSettlement: { failed: number } | null;
        slots: unknown;
      };
      return {
        failed: state.lastSettlement?.failed,
        slots: JSON.stringify(state.slots),
      };
    }, SAVE_KEY),
  ).toEqual({ failed: 1, slots: slotsAfterRemoval });

  await page.getByRole("button", { name: "Pause" }).click();
  await openTab(page, "Build");
  let runtimeCard = page
    .locator('.module-library [data-module-id="quantized-model"]')
    .first();
  if ((await runtimeCard.count()) === 0) {
    await page.getByRole("button", { name: "Show every module (17)" }).click();
    runtimeCard = page
      .locator('.module-library [data-module-id="quantized-model"]')
      .first();
  }
  await runtimeCard.click();
  await page
    .getByRole("button", { name: "Place Quantized Model in Build" })
    .click();
  await page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("slot-runtime")).toContainText(
    "Quantized Model",
  );

  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Queue 1", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          jobs: { activeTask: unknown; waitingTasks: unknown[] };
        };
        return (
          Number(Boolean(state.jobs.activeTask)) +
          state.jobs.waitingTasks.length
        );
      }, SAVE_KEY),
    )
    .toBeGreaterThan(0);
});

test("touch-drag starts placement only after movement and cancellation changes no slot", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  const slotsBefore = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      slots: unknown;
    };
    return JSON.stringify(state.slots);
  }, SAVE_KEY);
  const libraryCleaner = page
    .locator('.module-library [data-module-id="basic-cleaner"]')
    .first();
  const box = await libraryCleaner.boundingBox();
  if (!box) throw new Error("Library module did not render");
  await libraryCleaner.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId: 7,
    clientX: box.x + 12,
    clientY: box.y + 12,
  });
  await page.waitForTimeout(20);
  await page.locator(".app-shell").dispatchEvent("pointermove", {
    pointerType: "touch",
    pointerId: 7,
    clientX: box.x + 34,
    clientY: box.y + 34,
  });
  await expect(
    page.getByRole("button", { name: "Cancel placement" }),
  ).toBeVisible();
  await page.locator(".app-shell").dispatchEvent("pointercancel", {
    pointerType: "touch",
    pointerId: 7,
  });
  await expect(
    page.getByRole("button", { name: "Cancel placement" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        slots: unknown;
      };
      return JSON.stringify(state.slots);
    }, SAVE_KEY),
  ).toBe(slotsBefore);
});

for (const cancellation of ["Escape", "Cancel placement"] as const) {
  test(`${cancellation} clears pending placement and returns focus to its detail origin`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    const cleaner = page
      .getByTestId("slot-prepare")
      .getByRole("button", { name: /^Basic Cleaner/ });
    await cleaner.click();
    await page
      .getByRole("button", { name: "Place Basic Cleaner in Build" })
      .click();
    const cancel = page.getByRole("button", { name: "Cancel placement" });
    await expect(cancel).toBeVisible();

    if (cancellation === "Escape") await page.keyboard.press("Escape");
    else await cancel.click();

    await expect(cancel).toHaveCount(0);
    await expect(cleaner).toBeFocused();
  });
}

test("reduced motion records first settlement without an animation-only cue", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect(
    page.getByText("First successful delivery recorded"),
  ).toContainText("reduced motion", { timeout: 10_000 });
});
