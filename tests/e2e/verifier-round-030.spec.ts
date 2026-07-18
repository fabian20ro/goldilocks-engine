import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const OFFLINE_SAVED_AT_KEY = "goldilocks-simulation-offline-saved-at-v1";

type CareerSnapshot = {
  schemaVersion?: number;
  career?: {
    schedule?: {
      allocations?: Record<string, number>;
      completedEvenings?: number;
    };
    freelanceHours?: number;
    unpaidCosts?: number;
    competition?: { progress?: number; submissions?: number };
    product?: { buildProgress?: number; released?: boolean };
    offlinePolicy?: {
      enabled?: boolean;
      lastReport?: { appliedHours?: number; stoppedReason?: string };
    };
  };
};

async function savedState(page: Page): Promise<CareerSnapshot> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as CareerSnapshot;
  }, SAVE_KEY);
}

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
}

test("Career flow remains operable at 320px with 200% text and reduced motion", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await waitForSave(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await openCareer(page);

  const freelance = page.getByLabel("Freelance delivery evening hours");
  const competition = page.getByLabel("Bedroom Benchmark Cup evening hours");
  await freelance.fill("3");
  await competition.focus();
  await competition.fill("1");
  await competition.press("Tab");
  await page
    .getByRole("button", { name: "Run scheduled evening" })
    .press("Enter");
  await expect
    .poll(
      async () => (await savedState(page)).career?.schedule?.completedEvenings,
    )
    .toBe(1);

  await page
    .getByRole("button", { name: "Save safe offline policy" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Save safe offline policy" }),
  ).toBeVisible();
  const layout = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    ).filter((button) => {
      const style = getComputedStyle(button);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      undersized: buttons
        .map((button) => {
          const box = button.getBoundingClientRect();
          return {
            label: button.textContent?.trim(),
            width: box.width,
            height: box.height,
          };
        })
        .filter((item) => item.width < 44 || item.height < 44),
    };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
  expect(layout.undersized).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("career-320-scaled.png"),
    fullPage: true,
  });
});

test("Career overview remains readable at 393px with 200% text", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await openCareer(page);
  await page
    .getByRole("heading", { name: "Career loop", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText("Durable savings", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run scheduled evening" }),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({
    path: testInfo.outputPath("career-393-scaled.png"),
    fullPage: true,
  });
});

test("restored offline policy performs one bounded freelance-only recovery", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await openCareer(page);
  await page.getByLabel("Enable safe offline freelance").check();
  await page.getByLabel("Offline maximum hours").fill("1");
  await page.getByLabel("Offline maximum electricity cost").fill("0.1");
  await page.getByLabel("Offline maximum operating cost").fill("0.4");
  await page.getByLabel("Offline minimum reliability").fill("0.9");
  await page.getByRole("button", { name: "Save safe offline policy" }).click();
  await expect
    .poll(async () => (await savedState(page)).career?.offlinePolicy?.enabled)
    .toBe(true);
  await page.evaluate((key) => {
    localStorage.setItem(key, String(Date.now() - 4 * 3_600_000));
  }, OFFLINE_SAVED_AT_KEY);

  await page.reload();
  await openCareer(page);
  await expect
    .poll(async () => (await savedState(page)).career?.freelanceHours)
    .toBe(1);
  const recovered = await savedState(page);
  expect(recovered.career?.competition?.progress).toBe(0);
  expect(recovered.career?.competition?.submissions).toBe(0);
  expect(recovered.career?.product?.buildProgress).toBe(0);
  expect(recovered.career?.product?.released).toBe(false);
  expect(recovered.career?.unpaidCosts).toBe(0);
  expect(recovered.career?.offlinePolicy?.lastReport).toMatchObject({
    appliedHours: 1,
    stoppedReason: "completed within player bounds",
  });
  await page.screenshot({
    path: testInfo.outputPath("career-393-offline-recovery.png"),
    fullPage: true,
  });
});

test("malformed current career state safely falls back without a runtime error", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      career?: { schedule?: { allocations?: Record<string, unknown> } };
    };
    if (!saved.career?.schedule?.allocations) throw new Error("missing save");
    saved.career.schedule.allocations = {
      freelance: 4,
      competition: 4,
      product: 4,
      maintenance: 4,
    };
    localStorage.setItem(key, JSON.stringify(saved));
  }, SAVE_KEY);

  await page.reload();
  await waitForSave(page);
  await openCareer(page);
  const recovered = await savedState(page);
  expect(recovered.schemaVersion).toBe(6);
  expect(recovered.career?.schedule?.allocations).toEqual({
    freelance: 0,
    competition: 0,
    product: 0,
    maintenance: 0,
  });
  expect(recovered.career?.schedule?.completedEvenings).toBe(0);
  expect(pageErrors).toEqual([]);
});
