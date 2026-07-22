import { expect, test } from "@playwright/test";

test("Upgrades exposes at most one primary item-details surface", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();

  const openItemDetails = page.locator("article.upgrade-card details[open]");
  await expect(openItemDetails).toHaveCount(1);

  const comparisonSummaries = page.getByText(
    /Compare (rig|module) details and tradeoffs/,
  );
  await comparisonSummaries.nth(1).click();
  await expect(openItemDetails).toHaveCount(1);
  await expect(comparisonSummaries.nth(1).locator("xpath=..")).toHaveAttribute(
    "open",
    "",
  );
});

test("all four Career hour tokens remain inside the 393px portrait viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();

  const tokens = page.getByRole("button", {
    name: /Allocate \d hours to Freelance delivery/,
  });
  await expect(tokens).toHaveCount(4);
  for (const token of await tokens.all()) {
    const box = await token.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(393);
  }
});
