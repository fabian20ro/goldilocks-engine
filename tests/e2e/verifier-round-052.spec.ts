import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

test("verifier round 052: failed durable persistence keeps Career Run locked", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const originalSetItem = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, candidateKey: string, value: string): void {
        if (candidateKey === key)
          throw new DOMException(
            "storage quota exhausted",
            "QuotaExceededError",
          );
        originalSetItem.call(this, candidateKey, value);
      },
    });
  }, SAVE_KEY);

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await page.getByLabel("Freelance delivery evening hours").fill("4");

  const run = page.getByRole("button", { name: "Run scheduled evening" });
  await run.click();
  await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
  await page.waitForTimeout(100);
  await expect(run).toBeDisabled();
});
