import { expect, test, type Page } from "@playwright/test";
import { settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const LEGACY_SAVE_KEY = "goldilocks-simulation-save-v3";

async function waitForSavedState(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function setSavedMoney(page: Page, money: number) {
  await waitForSavedState(page);
  await page.evaluate(
    ({ key, money }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = money;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY, money },
  );
  await page.reload();
}

async function assertNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

async function openUpgrades(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();
}

test.describe("round 012 persistent upgrade economy and UX", () => {
  test("earns a first module, buys once, adds it, observes deltas, and keeps it offline", async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSavedState(page);
    const lockedDrawerUpgrade = page.locator(
      '.module-library [data-module-id="precision-cleaner"]',
    );
    await expect(lockedDrawerUpgrade).toHaveAccessibleName(
      /LOCKED · BUY \$4\.00/,
    );
    await lockedDrawerUpgrade.click();
    await openUpgrades(page);
    await expect(
      page.getByRole("heading", { name: "Upgrades", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Buy Precision Cleaner for $4.00",
      }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "16×" }).click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await settleStarterJob(page);
    // The early economy is deliberately about choosing a few visible jobs;
    // this keeps the upgrade pacing probe independent of an unattended batch.
    for (let job = 0; job < 3; job += 1)
      await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
            resources?: { money?: number };
            jobs?: { completed?: number };
          } | null;
          return (saved?.resources?.money ?? 0) >= 4;
        }, SAVE_KEY),
      )
      .toBe(true);
    const earned = await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
        jobs: { completed: number };
      };
      return { money: saved.resources.money, completed: saved.jobs.completed };
    }, SAVE_KEY);
    expect(earned.money).toBeGreaterThanOrEqual(4);
    expect(earned.completed).toBeLessThanOrEqual(5);

    await openUpgrades(page);
    await expect(page.getByLabel("Upgrade journey")).toContainText(
      "Money→Compare→Cost→Buy→Owned→Equip / add→Observe Δ",
    );
    const buy = page.getByRole("button", {
      name: "Buy Precision Cleaner for $4.00",
    });
    await expect(buy).toBeEnabled();
    await buy.click();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "purchased for $4.000 and is now owned",
    );
    await page
      .getByRole("button", { name: "Place Precision Cleaner in Build" })
      .click();
    await expect(page.locator(".placement-tray")).toContainText(
      "Place Precision Cleaner",
    );
    await expect(page.locator(".pipeline-slot.compatible")).toHaveCount(3);
    await page
      .getByTestId("slot-prepare")
      .getByRole("button", { name: "Snap here" })
      .click();
    await expect(page.getByTestId("slot-prepare")).toContainText(
      "Precision Cleaner",
    );
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "Observed delta",
    );

    await page.reload();
    await expect(page.getByTestId("slot-prepare")).toContainText(
      "Precision Cleaner",
    );
    await openUpgrades(page);
    await expect(
      page.getByRole("button", {
        name: "Place Precision Cleaner in Build",
      }),
    ).toBeVisible();

    await page.locator("html[data-offline-ready='true']").waitFor();
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Build", exact: true })
      .click();
    await expect(page.getByTestId("slot-prepare")).toContainText(
      "Precision Cleaner",
    );
    await context.setOffline(false);
    expect(errors).toEqual([]);
  });

  test("handles exact funds and a double hardware activation without duplicate deduction", async ({
    page,
  }) => {
    await page.goto("/");
    await setSavedMoney(page, 14);
    await openUpgrades(page);
    const buy = page.getByRole("button", {
      name: "Buy Used 12 GB GPU for $14.00",
    });
    await expect(buy).toBeEnabled();
    await buy.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expect(
      page.getByRole("button", { name: "Equip Used 12 GB GPU" }),
    ).toBeVisible();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      /already owned|purchased for \$14\.00/,
    );
    await expect(page.getByText("$0.00 available")).toBeVisible();
    await page.getByRole("button", { name: "Equip Used 12 GB GPU" }).click();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "Observed delta",
    );
    await expect(page.getByText(/24 GB Workstation/).first()).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Buy 24 GB Workstation for $40.00",
      }),
    ).toBeDisabled();
    await expect(page.getByText(/Need \$40\.00 more/)).toBeVisible();
    await page.reload();
    await openUpgrades(page);
    await expect(
      page.getByRole("button", { name: "Equipped now" }),
    ).toBeVisible();
  });

  for (const width of [320, 393]) {
    test(`keeps the complete upgrade journey usable at ${width}px and 200% text`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/");
      await setSavedMoney(page, 20);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px";
      });
      await openUpgrades(page);
      await expect(
        page.getByRole("heading", { name: "Upgrades", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("AFFORDABLE").first()).toBeVisible();
      await expect(
        page.getByText("LOCKED · INSUFFICIENT FUNDS").first(),
      ).toBeVisible();
      await expect(page.getByText("EQUIPPED").first()).toBeVisible();
      await assertNoHorizontalOverflow(page);
      const undersized = await page
        .locator("button:visible")
        .evaluateAll((buttons) =>
          buttons
            .map((button) => {
              const rect = button.getBoundingClientRect();
              return {
                name: button.getAttribute("aria-label") ?? button.textContent,
                width: rect.width,
                height: rect.height,
              };
            })
            .filter((item) => item.width < 44 || item.height < 44),
        );
      expect(undersized).toEqual([]);
      await expect(
        page.getByRole("button", { name: /Buy Precision Cleaner for \$4\.00/ }),
      ).toBeVisible();
    });
  }

  test("migrates a schema-v3 run and recovers safely from corrupt ownership", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate(
      ({ currentKey, legacyKey }) => {
        const state = JSON.parse(
          localStorage.getItem(currentKey) ?? "null",
        ) as Record<string, unknown>;
        state.schemaVersion = 3;
        state.contentVersion = "pipeline-toy-2";
        delete state.ownedHardwareIds;
        delete state.ownedModuleIds;
        delete state.lastUpgradeNotice;
        localStorage.setItem(legacyKey, JSON.stringify(state));
        localStorage.removeItem(currentKey);
      },
      { currentKey: SAVE_KEY, legacyKey: LEGACY_SAVE_KEY },
    );
    await page.reload();
    await expect(page.getByLabel("Latest upgrade action")).toContainText(
      "migrated to the ownership economy",
    );
    await expect(page.getByTestId("pipeline")).toBeVisible();

    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as Record<
        string,
        unknown
      >;
      state.ownedHardwareIds = ["bedroom-cpu", "bedroom-cpu"];
      state.ownedModuleIds = ["missing"];
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();
    await expect(page.getByTestId("pipeline")).toBeVisible();
    await openUpgrades(page);
    await expect(page.getByText("$0.00 available")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
