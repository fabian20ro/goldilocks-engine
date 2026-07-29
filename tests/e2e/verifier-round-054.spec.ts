import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

test("verifier round 054: Career recovers across pre-submit and submitted save outages without duplicate work", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript((key) => {
    const state = window as Window & {
      __verifierRound054Storage?: { mode: "ok" | "all" | "result" };
    };
    const originalSetItem = Storage.prototype.setItem;
    state.__verifierRound054Storage = { mode: "ok" };
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, candidateKey: string, value: string): void {
        const mode = state.__verifierRound054Storage?.mode;
        if (candidateKey === key && mode === "all")
          throw new DOMException(
            "storage quota exhausted",
            "QuotaExceededError",
          );
        if (candidateKey === key && mode === "result") {
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
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await navigation.getByRole("button", { name: "Career", exact: true }).click();
  const freelance = page.getByLabel("Freelance delivery evening hours");
  await freelance.fill("4");
  const run = page.getByRole("button", { name: "Run scheduled evening" });

  await page.evaluate(() => {
    const state = window as Window & {
      __verifierRound054Storage?: { mode: "ok" | "all" | "result" };
    };
    if (!state.__verifierRound054Storage)
      throw new Error("Expected round-054 storage fixture");
    state.__verifierRound054Storage.mode = "all";
  });
  await navigation.getByRole("button", { name: "Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await navigation.getByRole("button", { name: "Career", exact: true }).click();

  await expect(
    page.getByText(/Saving is temporarily unavailable/i),
  ).toBeVisible();
  await expect(run).toBeDisabled();
  await expect(freelance).toHaveValue("4");
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
      __verifierRound054Storage?: { mode: "ok" | "all" | "result" };
    };
    if (!state.__verifierRound054Storage)
      throw new Error("Expected round-054 storage fixture");
    state.__verifierRound054Storage.mode = "ok";
  });
  await expect(run).toBeEnabled();
  await expect(
    page.getByText(/Saving is temporarily unavailable/i),
  ).toBeHidden();

  await page.evaluate(() => {
    const state = window as Window & {
      __verifierRound054Storage?: { mode: "ok" | "all" | "result" };
    };
    if (!state.__verifierRound054Storage)
      throw new Error("Expected round-054 storage fixture");
    state.__verifierRound054Storage.mode = "result";
  });
  await run.focus();
  await run.press("Enter");
  await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Saving is temporarily unavailable/i),
  ).toBeVisible();
  await expect(run).toBeDisabled();

  await page.evaluate(() => {
    const state = window as Window & {
      __verifierRound054Storage?: { mode: "ok" | "all" | "result" };
    };
    if (!state.__verifierRound054Storage)
      throw new Error("Expected round-054 storage fixture");
    state.__verifierRound054Storage.mode = "ok";
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
  expect(pageErrors).toEqual([]);
});
