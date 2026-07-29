import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

test("verifier round 052: failed durable persistence keeps Career Run locked", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const state = window as Window & {
      __verifierRound052PersistenceFailure?: {
        failSubmittedEvening: boolean;
      };
    };
    const originalSetItem = Storage.prototype.setItem;
    state.__verifierRound052PersistenceFailure = {
      failSubmittedEvening: false,
    };
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, candidateKey: string, value: string): void {
        if (
          candidateKey === key &&
          state.__verifierRound052PersistenceFailure?.failSubmittedEvening
        ) {
          const saved = JSON.parse(value) as {
            career?: { schedule?: { completedEvenings?: number } };
          };
          if ((saved.career?.schedule?.completedEvenings ?? 0) > 0)
            throw new DOMException(
              "storage quota exhausted",
              "QuotaExceededError",
            );
        }
        originalSetItem.call(this, candidateKey, value);
      },
    });
  }, SAVE_KEY);

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  // A Career result failure is distinct from startup storage unavailability:
  // establish the durable baseline before arming the submitted-evening fault.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await page.getByLabel("Freelance delivery evening hours").fill("4");
  await page.evaluate(() => {
    const state = window as Window & {
      __verifierRound052PersistenceFailure?: {
        failSubmittedEvening: boolean;
      };
    };
    if (!state.__verifierRound052PersistenceFailure)
      throw new Error("Expected submitted-evening persistence fixture");
    state.__verifierRound052PersistenceFailure.failSubmittedEvening = true;
  });

  const run = page.getByRole("button", { name: "Run scheduled evening" });
  await run.click();
  await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
  await page.waitForTimeout(100);
  await expect(run).toBeDisabled();
  await expect
    .poll(async () => {
      const saved = await page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: { schedule?: { completedEvenings?: number } };
        };
      }, SAVE_KEY);
      return saved.career?.schedule?.completedEvenings;
    })
    .toBe(0);

  await page.evaluate(() => {
    const state = window as Window & {
      __verifierRound052PersistenceFailure?: {
        failSubmittedEvening: boolean;
      };
    };
    if (!state.__verifierRound052PersistenceFailure)
      throw new Error("Expected submitted-evening recovery fixture");
    state.__verifierRound052PersistenceFailure.failSubmittedEvening = false;
  });
  await expect
    .poll(async () => {
      const saved = await page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: { schedule?: { completedEvenings?: number } };
        };
      }, SAVE_KEY);
      return saved.career?.schedule?.completedEvenings;
    })
    .toBe(1);
  await expect(run).toBeEnabled();
  await page.waitForTimeout(1_100);
  await expect
    .poll(async () => {
      const saved = await page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: { schedule?: { completedEvenings?: number } };
        };
      }, SAVE_KEY);
      return saved.career?.schedule?.completedEvenings;
    })
    .toBe(1);
});
