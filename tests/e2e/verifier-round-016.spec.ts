import { expect, test, type Page } from "@playwright/test";
import { formatCompactCurrency } from "../../src/simulation/currency";
import { settleStarterJob } from "./helpers";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

test.describe("verifier round 016 market feedback", () => {
  test("a guaranteed-failure pipeline does not advertise positive estimated net", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");

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

    await expect(page.getByLabel("Current warning and actions")).toContainText(
      `accepted tasks fail and pay ${formatCompactCurrency(0)} gross`,
    );

    await openTab(page, "Jobs");
    await settleStarterJob(page);
    const card = page.getByRole("button", {
      name: /^Interactive Chat\. Current quote/,
    });
    const moneyLoop = page
      .getByText("Selected-work live quote")
      .locator("xpath=..");

    await expect(card).not.toContainText(/\+\$\d+(?:\.\d+)? net/);
    await expect(moneyLoop).not.toContainText(
      /\+\$\d+(?:\.\d+)? estimated net/,
    );
    await expect(card).toContainText("Not safe in this configuration");
    await expect(card).toHaveAccessibleName(/Guaranteed failure/);
  });
});
