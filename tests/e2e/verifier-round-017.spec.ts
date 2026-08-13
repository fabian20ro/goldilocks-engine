import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed, STARTER_QUEUE_NAME } from "./helpers";

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

async function removeProcessModules(page: Page) {
  for (const [slotId, moduleName, name] of [
    [
      "prepare",
      "Basic Cleaner",
      "Remove Basic Cleaner from Prepare and bypass position",
    ],
    [
      "runtime",
      "Quantized Model",
      "Remove Quantized Model from Runtime and bypass position",
    ],
    [
      "verify",
      "Smoke Check",
      "Remove Smoke Check from Verify and bypass position",
    ],
  ] as const) {
    await page
      .getByTestId(`slot-${slotId}`)
      .getByRole("button", { name: new RegExp(`^${moduleName}`) })
      .click();
    await page.getByRole("button", { name }).click();
  }
}

test.describe("verifier round 017 settlement feedback", () => {
  test("shows configured, paid, and unpaid cost when cash cannot cover work", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });

    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");

    await removeProcessModules(page);

    await openTab(page, "Jobs");
    await expect(
      page.getByText("Selected-work live quote").locator(".."),
    ).toContainText("Guaranteed failure in this configuration");
    await chooseSimulationSpeed(page, "64×");
    await page.getByRole("button", { name: STARTER_QUEUE_NAME }).click();

    const latestSettlement = page
      .getByText("Latest settlement", { exact: true })
      .locator("..");
    await expect(latestSettlement).toContainText(
      "$0.01 configured actual costs · $0.00 paid · $0.01 unpaid",
      { timeout: 10_000 },
    );
    await expect(latestSettlement).toContainText(/[−-]\$0\.01 net/);
    await expect(page.getByText(/Run totals:/)).toContainText(
      "$0.00 operating costs paid",
    );

    await openTab(page, "Inspect");
    await expect(
      page.getByText(/remains unpaid because cash cannot go below/),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("does not display paid plus unpaid as more than configured cost", async ({
    page,
  }) => {
    await page.goto("/");
    await setSavedMoney(page, 0.005);
    await removeProcessModules(page);
    await openTab(page, "Jobs");
    await chooseSimulationSpeed(page, "64×");
    await page.getByRole("button", { name: STARTER_QUEUE_NAME }).click();

    const latestSettlement = page
      .getByText("Latest settlement", { exact: true })
      .locator("..");
    await expect(latestSettlement).toContainText("configured actual costs", {
      timeout: 10_000,
    });
    await expect(latestSettlement).not.toContainText(
      "$0.01 configured actual costs · $0.01 paid · $0.01 unpaid",
    );
  });
});
