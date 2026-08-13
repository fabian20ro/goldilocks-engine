import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed, settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function setSavedMoney(page: Page, money: number) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
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
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function removeStarterProcessingModules(page: Page) {
  for (const [slotId, moduleName, stageName] of [
    ["prepare", "Basic Cleaner", "Prepare"],
    ["runtime", "Quantized Model", "Runtime"],
    ["verify", "Smoke Check", "Verify"],
  ] as const) {
    await page
      .getByTestId(`slot-${slotId}`)
      .getByRole("button", { name: new RegExp(`^${moduleName}`) })
      .click();
    await page
      .getByRole("button", {
        name: `Remove ${moduleName} from ${stageName} and bypass position`,
        exact: true,
      })
      .click();
  }
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test.describe("verifier round 069 exact and related money disclosures", () => {
  test("keeps model-tier card requirements on the compact cents-default policy", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openTab(page, "Career");

    const tiers = page.locator(".career-model-list");
    await expect(tiers).toContainText(
      "Unlock with $8.00 saved, one competition submission, or one product release.",
    );
    await expect(tiers).toContainText(
      "Unlock with $18.00 saved plus either the competition prize or $8.00 product revenue.",
    );
    expect(errors).toEqual([]);
  });

  test("keeps every member of a mill settlement equation at the promoted precision", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await setSavedMoney(page, 0.005);
    await removeStarterProcessingModules(page);

    await openTab(page, "Jobs");
    await chooseSimulationSpeed(page, "64×");
    await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
        exact: true,
      })
      .click();

    const latestSettlement = page
      .getByText("Latest settlement", { exact: true })
      .locator("..");
    await expect(latestSettlement).toContainText(
      "$0.010 configured actual costs · $0.005 paid · $0.005 unpaid because cash cannot go below $0.000",
      { timeout: 10_000 },
    );
    await expect(latestSettlement).toContainText(
      "Three decimals shown to preserve sub-cent accounting.",
    );
    expect(errors).toEqual([]);
  });

  test("keeps a persisted Inspect purchase record fixed at three decimals", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await setSavedMoney(page, 4);
    await openTab(page, "Jobs");
    await settleStarterJob(page);

    await openTab(page, "Upgrades");
    await page
      .getByRole("button", {
        name: "Buy Precision Cleaner for $4.00",
        exact: true,
      })
      .click();

    await openTab(page, "Inspect");
    const exactPurchase =
      "Precision Cleaner purchased for $4.000 and is now owned.";
    await expect(page.locator(".event-log")).toContainText(exactPurchase);

    await page.reload({ waitUntil: "domcontentloaded" });
    await openTab(page, "Inspect");
    await expect(page.locator(".event-log")).toContainText(exactPurchase);
    expect(errors).toEqual([]);
  });
});
