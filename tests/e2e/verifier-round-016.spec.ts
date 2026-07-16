import { expect, test, type Page } from "@playwright/test";

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

    for (const name of [
      "Remove Basic Cleaner from Prepare and bypass position",
      "Remove Quantized Model from Runtime and bypass position",
      "Remove Smoke Check from Verify and bypass position",
    ])
      await page.getByRole("button", { name }).click();

    await expect(page.getByLabel("Current warning and actions")).toContainText(
      "accepted tasks fail and pay $0 gross",
    );

    await openTab(page, "Jobs");
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
    await expect(card).toContainText(
      /guaranteed failure|−\$\d+(?:\.\d+)? net/i,
    );
  });
});
