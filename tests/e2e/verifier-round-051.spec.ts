import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSavedState(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function completedEvenings(page: Page): Promise<number | undefined> {
  return page.evaluate((key) => {
    const serialized = localStorage.getItem(key);
    if (!serialized) return undefined;
    return (
      JSON.parse(serialized) as {
        career?: { schedule?: { completedEvenings?: number } };
      }
    ).career?.schedule?.completedEvenings;
  }, SAVE_KEY);
}

test("verifier round 051: two rapid Run activations commit only one evening", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSavedState(page);
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();

  await page.getByLabel("Freelance delivery evening hours").fill("4");
  const run = page.getByRole("button", { name: "Run scheduled evening" });
  await run.evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  // A pointer double-tap must not enqueue two separate command batches. Give
  // both Worker publications and at least two ordinary ticks time to settle.
  await page.waitForTimeout(1_150);
  expect(await completedEvenings(page)).toBe(1);
  expect(errors).toEqual([]);
});
