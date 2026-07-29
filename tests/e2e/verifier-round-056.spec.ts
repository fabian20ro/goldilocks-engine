import { expect, test } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function offlineReadySave(): string {
  const state = createInitialState(56_062);
  return JSON.stringify(
    sealSimulationState({
      ...state,
      career: {
        ...state.career,
        offlinePolicy: {
          ...state.career.offlinePolicy,
          enabled: true,
          maxHours: 4,
          maxElectricityCost: 5,
          maxOperatingCost: 5,
          minReliability: 0.7,
        },
      },
    }),
  );
}

test("verifier round 056: concurrent Career commands retain the later completion identity", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: offlineReadySave() },
  );
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await page.getByLabel("Freelance delivery evening hours").fill("4");

  const disclosure = page
    .locator('summary[aria-label="Show Safe freelance-only automation"]')
    .locator("xpath=..");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  // Both inputs can be generated before either Worker response renders. The
  // second request must be projected from its own command boundary and label
  // the actual second completed evening, not the stale pre-batch snapshot.
  await page.locator("button").evaluateAll((buttons) => {
    const run = buttons.find(
      (button) => button.textContent?.trim() === "Run scheduled evening",
    ) as HTMLButtonElement | undefined;
    const offline = buttons.find(
      (button) =>
        button.textContent?.trim() === "Apply safe offline policy now",
    ) as HTMLButtonElement | undefined;
    if (!run || !offline) throw new Error("Missing concurrent Career actions");
    run.click();
    offline.click();
  });

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: {
            schedule?: { completedEvenings?: number };
            offlinePolicy?: { lastReport?: { appliedHours?: number } };
          };
        };
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? 0,
        };
      }, SAVE_KEY),
    )
    .toEqual({ completedEvenings: 2, offlineHours: 4 });

  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 2 result");
  await expect(result).toContainText("4.00h used");
  expect(pageErrors).toEqual([]);
});
