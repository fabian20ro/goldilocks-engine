import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

test("verifier round 053: a pre-existing persistence failure disables Career Run", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const state = window as Window & {
      __verifierPersistenceFailure?: { failWrites: boolean };
    };
    const originalSetItem = Storage.prototype.setItem;
    state.__verifierPersistenceFailure = { failWrites: false };
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, candidateKey: string, value: string): void {
        if (
          candidateKey === key &&
          state.__verifierPersistenceFailure?.failWrites
        )
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
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await navigation.getByRole("button", { name: "Career", exact: true }).click();
  await page.getByLabel("Freelance delivery evening hours").fill("4");

  await page.evaluate(() => {
    const state = window as Window & {
      __verifierPersistenceFailure?: { failWrites: boolean };
    };
    if (!state.__verifierPersistenceFailure)
      throw new Error("Expected persistence-failure fixture");
    state.__verifierPersistenceFailure.failWrites = true;
  });
  await navigation.getByRole("button", { name: "Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await navigation.getByRole("button", { name: "Career", exact: true }).click();

  await expect(
    page.getByText(/Saving is temporarily unavailable/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run scheduled evening" }),
  ).toBeDisabled();
});
