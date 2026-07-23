import { expect, test, type Page } from "@playwright/test";

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

async function setSavedMoney(page: Page, money: number) {
  await page.evaluate(
    ({ key, value }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = value;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY, value: money },
  );
  await page.reload();
}

test("first-session rail survives reload and placement requires an explicit handoff", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await waitForGuideStep(page, "step 1 of 3");

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
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
  await page.reload();
  await waitForGuideStep(page, "step 2 of 3");

  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "64×" }).click();
  await waitForGuideStep(page, "step 3 of 3");

  await setSavedMoney(page, 4);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
    .click();
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
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
});

for (const viewport of [
  { width: 320, height: 693 },
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
  await page.getByRole("button", { name: "64×" }).click();
  await expect(
    page.getByText("First successful delivery recorded"),
  ).toContainText("reduced motion", { timeout: 10_000 });
});
