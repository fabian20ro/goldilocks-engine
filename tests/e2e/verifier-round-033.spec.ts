import { expect, test, type Page } from "@playwright/test";
import { applyCommand, createInitialState } from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function forgedLongHistorySave() {
  const seed = 33_002;
  let state = createInitialState(seed);
  for (let index = 0; index < 81; index += 1)
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: `history-${index}`,
    });

  const forged = JSON.parse(JSON.stringify(state));
  forged.career.evaluation = {
    ...forged.career.evaluation,
    modelSwitches: 8,
    ignoredWarnings: 2,
    warnings: {
      ...forged.career.evaluation.warnings,
      tutorial: 2,
    },
  };
  return forged;
}

async function savedState(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as Record<
      string,
      unknown
    >;
  }, SAVE_KEY);
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
}

test("malformed full-history save cannot manufacture a user-visible causal ending", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 742 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)),
    { key: SAVE_KEY, saved: forgedLongHistorySave() },
  );
  await page.goto("/");
  await openCareer(page);
  const recovered = await savedState(page);
  expect
    .soft((recovered.career as { evaluation?: unknown }).evaluation)
    .toMatchObject({
      modelSwitches: 0,
      ignoredWarnings: 0,
      warnings: { tutorial: 0 },
    });
  await page
    .getByRole("button", { name: "Run public benchmark preview" })
    .click();
  await expect
    .poll(async () => {
      const saved = await savedState(page);
      return (
        saved.career as {
          evaluation?: { publicEvaluations?: unknown };
        }
      ).evaluation?.publicEvaluations;
    })
    .toBe(1);
  const advanced = await savedState(page);
  expect
    .soft((advanced.career as { runEnding?: unknown }).runEnding)
    .toBeNull();
  expect
    .soft(
      await page.getByRole("heading", { name: "Run postmortem" }).isVisible(),
    )
    .toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("forged-history-320.png"),
    fullPage: true,
  });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
