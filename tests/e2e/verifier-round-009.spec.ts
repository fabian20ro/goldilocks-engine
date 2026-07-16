import { expect, test } from "@playwright/test";

test.describe("verifier round 009 comprehension boundaries", () => {
  test("Quick Start explicitly maps thermal pressure to its valid control", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");

    const tutorial = page.getByTestId("quick-start");
    await expect(tutorial).toBeVisible();
    await expect(tutorial).toContainText(
      /thermal[^.]*compute budget|compute budget[^.]*thermal/i,
    );
  });

  test("memory guidance does not advise lowering an already-zero reserve", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await page.locator('.module-library [data-module-id="full-model"]').click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByLabel("Memory reserve percentage").fill("0");
    await page.getByRole("button", { name: /Long Document/ }).click();

    await expect(page.getByLabel("Memory reserve percentage")).toHaveValue("0");
    const warning = page.getByLabel("Current warning and actions");
    await expect(warning).toContainText("Memory limit exceeded");
    await expect(warning).not.toContainText("Lower the reserve");
  });
});
