import { expect, test, type Browser, type Page } from "@playwright/test";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openSavedStateBeforeBoot(browser: Browser, saved: string) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 742 },
    serviceWorkers: "allow",
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  await context.addInitScript(
    ({ key, serialized, marker }) => {
      // Do not mask a later reload with the fixture; only app boot receives it.
      if (sessionStorage.getItem(marker) === "seeded") return;
      sessionStorage.setItem(marker, "seeded");
      localStorage.setItem(key, serialized);
    },
    {
      key: SAVE_KEY,
      serialized: saved,
      marker: "verifier-round-041-preboot-save",
    },
  );
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`initial controls are above navigation without scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const initial = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".app-scroll-region")?.scrollTop,
    );
    expect(initial).toBe(0);
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .boundingBox();
    const resources = await page.getByLabel("Primary resources").boundingBox();
    const objective = await page
      .getByLabel("Current objective and bottleneck")
      .boundingBox();
    const firstPipelineControl = await page
      .getByTestId("pipeline")
      .getByRole("button")
      .first()
      .boundingBox();
    expect(nav).not.toBeNull();
    expect(resources).not.toBeNull();
    expect(objective).not.toBeNull();
    expect(firstPipelineControl).not.toBeNull();
    expect(resources!.y).toBeGreaterThanOrEqual(0);
    expect(objective!.y).toBeGreaterThanOrEqual(0);
    expect(firstPipelineControl!.y).toBeGreaterThanOrEqual(0);
    expect(
      firstPipelineControl!.y + firstPipelineControl!.height,
    ).toBeLessThanOrEqual(nav!.y);
  });

  test(`initial Jobs dispatch action is above navigation without scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .boundingBox();
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();
    const jobsInitial = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".app-scroll-region")?.scrollTop,
    );
    expect(jobsInitial).toBe(0);
    const selected = await page
      .getByLabel("Selected playable workload")
      .getByText("Interactive Chat", { exact: true })
      .boundingBox();
    const queue = await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
      })
      .boundingBox();
    expect(selected).not.toBeNull();
    expect(queue).not.toBeNull();
    expect(nav).not.toBeNull();
    expect(selected!.y + selected!.height).toBeLessThanOrEqual(nav!.y);
    expect(queue!.y + queue!.height).toBeLessThanOrEqual(nav!.y);
  });
}

test("a damaged save cannot use a forged installed module to skip the first purchase", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  const observeErrors = (observedPage: Page) => {
    observedPage.on("pageerror", (error) => errors.push(error.message));
    observedPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
  };
  observeErrors(page);

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession?: { step?: string };
        } | null;
        return persisted?.firstSession?.step;
      }, SAVE_KEY),
    )
    .toBe("buy-and-install");

  const forgedSave = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: {
        step: string;
        starterTaskId: string | null;
        observedSettlementTaskId: string | null;
        purchasedModuleId: string | null;
      };
      ownedModuleIds: string[];
      slots: { slotId: string; moduleId: string | null }[];
    };
    persisted.ownedModuleIds = [
      ...persisted.ownedModuleIds,
      "precision-cleaner",
    ];
    persisted.slots = persisted.slots.map((slot) =>
      slot.slotId === "prepare"
        ? { ...slot, moduleId: "precision-cleaner" }
        : slot,
    );
    persisted.firstSession = {
      step: "complete",
      starterTaskId: persisted.firstSession.starterTaskId,
      observedSettlementTaskId: persisted.firstSession.starterTaskId,
      purchasedModuleId: "precision-cleaner",
    };
    return JSON.stringify(persisted);
  }, SAVE_KEY);

  // A live page's Worker can overwrite localStorage while that page reloads.
  // Seed the forged record into an isolated context before the application boots.
  const restored = await openSavedStateBeforeBoot(browser, forgedSave);
  try {
    observeErrors(restored.page);
    await expect(
      restored.page.getByTestId("first-session-guide"),
    ).toContainText("step 1 of 3");
    await restored.page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();
    await expect(
      restored.page.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(0);
  } finally {
    await restored.context.close();
  }
  expect(errors).toEqual([]);
});

test("an invalid post-purchase save resets without reusing the purchase", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession?: { step?: string };
        } | null;
        return persisted?.firstSession?.step;
      }, SAVE_KEY),
    )
    .toBe("buy-and-install");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const money = await page.evaluate((key) => {
      const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      return persisted.resources.money;
    }, SAVE_KEY);
    if (money >= 4) break;
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs: { queued: number };
          };
          return persisted.jobs.queued;
        }, SAVE_KEY),
      )
      .toBe(0);
  }
  const funded = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    return persisted.resources.money;
  }, SAVE_KEY);
  expect(funded).toBeGreaterThanOrEqual(4);

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
    .click();
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Build", exact: true })
    .click();
  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("first-session-guide")).toHaveCount(0);

  const staleSave = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      lastUpgradeNotice: unknown;
    };
    persisted.lastUpgradeNotice = null;
    return JSON.stringify(persisted);
  }, SAVE_KEY);

  // This nearby stale-save regression has the same live-Worker boundary.
  // Its pass condition would otherwise also pass if the intended damage lost.
  const restored = await openSavedStateBeforeBoot(browser, staleSave);
  try {
    await expect(
      restored.page.getByTestId("save-recovery-status"),
    ).toContainText("invalid integrity");
    await expect(
      restored.page.getByTestId("first-session-guide"),
    ).toContainText("step 1 of 3");
    await expect(
      restored.page.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(0);
  } finally {
    await restored.context.close();
  }
});
