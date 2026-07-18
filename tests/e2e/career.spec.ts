import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSavedState(page: Page): Promise<void> {
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

async function savedCareer(page: Page): Promise<{
  schemaVersion?: number;
  migration?: { steps?: string[] };
  career?: {
    schedule?: {
      completedEvenings?: number;
      allocations?: Record<string, number>;
    };
    freelanceHours?: number;
    offlinePolicy?: {
      enabled?: boolean;
      lastReport?: { appliedHours?: number };
    };
  };
}> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as {
      schemaVersion?: number;
      migration?: { steps?: string[] };
      career?: {
        schedule?: {
          completedEvenings?: number;
          allocations?: Record<string, number>;
        };
        freelanceHours?: number;
        offlinePolicy?: {
          enabled?: boolean;
          lastReport?: { appliedHours?: number };
        };
      };
    };
  }, SAVE_KEY);
}

async function assertPortraitControls(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  const undersized = await page.locator("button:visible").evaluateAll((items) =>
    items
      .map((item) => {
        const box = item.getBoundingClientRect();
        return {
          label: item.textContent?.trim(),
          width: box.width,
          height: box.height,
        };
      })
      .filter((item) => item.width < 44 || item.height < 44),
  );
  expect(undersized).toEqual([]);
}

test.describe("Bedroom Developer career acceptance", () => {
  for (const width of [320, 393]) {
    test(`schedules finite keyboard-accessible evenings at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 742 });
      await page.goto("/");
      await waitForSavedState(page);
      await openCareer(page);

      const freelanceHours = page.getByLabel(
        "Freelance delivery evening hours",
      );
      const competitionHours = page.getByLabel(
        "Bedroom Benchmark Cup evening hours",
      );
      await freelanceHours.fill("3");
      await expect(freelanceHours).toHaveValue("3");
      await competitionHours.focus();
      await competitionHours.fill("1");
      await competitionHours.press("Tab");
      await expect(competitionHours).toHaveValue("1");

      const run = page.getByRole("button", { name: "Run scheduled evening" });
      await run.focus();
      await page.keyboard.press("Enter");
      await expect
        .poll(
          async () =>
            (await savedCareer(page)).career?.schedule?.completedEvenings,
        )
        .toBe(1);
      await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
      await assertPortraitControls(page);
    });
  }

  test("migrates a deployed schema-v5 save and persists career work through reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as Record<
        string,
        unknown
      >;
      state.schemaVersion = 5;
      state.contentVersion = "pipeline-toy-4";
      state.migration = { sourceSchemaVersion: 5, steps: [] };
      delete state.career;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();
    await openCareer(page);
    await expect(page.getByText("Durable savings")).toBeVisible();
    await expect
      .poll(async () => {
        const state = await savedCareer(page);
        return {
          schemaVersion: state.schemaVersion,
          migrated: state.migration?.steps?.includes(
            "schema-5-to-6-bedroom-career",
          ),
        };
      })
      .toEqual({ schemaVersion: 6, migrated: true });

    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect
      .poll(async () => (await savedCareer(page)).career?.freelanceHours)
      .toBe(4);
    await page.reload();
    await openCareer(page);
    await expect(page.getByText(/gross from 4\.00h/)).toBeVisible();
  });

  test("keeps offline policy bounded, recovers visibly, and persists through an offline reload", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByLabel("Enable safe offline freelance").check();
    await page.getByLabel("Offline maximum hours").fill("1");
    await page.getByLabel("Offline minimum reliability").fill("0.999");
    await page
      .getByRole("button", { name: "Save safe offline policy" })
      .click();
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await expect(
      page.getByText(/Offline report: 0\.00h applied/),
    ).toBeVisible();
    await expect(
      page.getByText(/reliability below player minimum/),
    ).toBeVisible();

    await page.getByLabel("Offline minimum reliability").fill("0.9");
    await page
      .getByRole("button", { name: "Save safe offline policy" })
      .click();
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await expect(
      page.getByText(/Offline report: 1\.00h applied/),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.offlinePolicy?.lastReport
            ?.appliedHours,
      )
      .toBe(1);

    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await openCareer(page);
    await expect(
      page.getByLabel("Enable safe offline freelance"),
    ).toBeChecked();
    await context.setOffline(false);
  });

  test("remains readable at 200 percent text with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openCareer(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await expect(
      page.getByRole("heading", { name: "Safe freelance-only automation" }),
    ).toBeVisible();
    await page.getByLabel("Offline maximum hours").scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Offline maximum hours")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
