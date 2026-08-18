import { expect, test, type Page } from "@playwright/test";
import { applyCommand, createInitialState } from "../../src/simulation/engine";
import type { SimulationState } from "../../src/simulation/types";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function legacyIntegrityDigest(save: Record<string, unknown>): string {
  const payload = { ...save };
  delete payload.integrity;
  const serialized = JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function historyAtEventSequence(
  seed: number,
  eventSequence: number,
): SimulationState {
  let state = createInitialState(seed);
  while (state.eventSequence < eventSequence)
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: `browser-history-${state.eventSequence}`,
    });
  return state;
}

function staleCoherentForgery(state: SimulationState): Record<string, unknown> {
  const forged = clone(state) as unknown as Record<string, unknown>;
  const career = forged.career as Record<string, unknown>;
  const evaluation = {
    ...(career.evaluation as Record<string, unknown>),
    modelSwitches: 8,
    ignoredWarnings: 2,
    warnings: {
      ...(career.evaluation as { warnings: Record<string, unknown> }).warnings,
      tutorial: 2,
    },
  };
  career.evaluation = evaluation;
  (forged.causalEvidenceSnapshot as Record<string, unknown>).evaluation =
    clone(evaluation);
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

async function assertNoPageOrConsoleErrors(
  pageErrors: readonly string[],
  consoleErrors: readonly string[],
  page: Page,
): Promise<void> {
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("resets an unsealed forged evaluation before the 320px run", async ({
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
  const seed = 34_501;
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    {
      key: SAVE_KEY,
      save: staleCoherentForgery(historyAtEventSequence(seed, 81)),
    },
  );
  await page.goto("/");
  await expect(page.getByTestId("save-recovery-status")).toContainText(
    "invalid integrity",
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  const recovered = await savedState(page);
  expect(recovered).toEqual(createInitialState(20260715));
  await assertNoPageOrConsoleErrors(pageErrors, consoleErrors, page);
  await page.screenshot({
    path: testInfo.outputPath("causal-recovery-320.png"),
    fullPage: true,
  });
});

test("migrates a valid original-seal saturated legacy schema-7 save at 393px", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 393, height: 742 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const seed = 34_502;
  let saturated = historyAtEventSequence(seed, 83);
  for (let index = 0; index < 7; index += 1)
    saturated = applyCommand(saturated, {
      type: "SET_QUANTIZATION",
      profile: index % 2 === 0 ? "q8" : "q4",
    });
  while (saturated.eventSequence < 91)
    saturated = applyCommand(saturated, {
      type: "CAPTURE_BASELINE",
      label: `legacy-browser-history-${saturated.eventSequence}`,
    });

  const legacy = clone(saturated) as unknown as Record<string, unknown>;
  delete legacy.causalEvidenceSnapshot;
  (legacy.integrity as { digest: string }).digest =
    legacyIntegrityDigest(legacy);
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    { key: SAVE_KEY, save: legacy },
  );
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await openCareer(page);

  await expect
    .poll(async () => {
      const saved = await savedState(page);
      return (saved.migration as { steps?: readonly string[] }).steps?.includes(
        "schema-v7-causal-snapshot-added",
      );
    })
    .toBe(true);
  const migrated = await savedState(page);
  const evaluation = (
    migrated.career as {
      evaluation: { modelSwitches: unknown };
    }
  ).evaluation;
  expect(evaluation.modelSwitches).toBe(7);
  expect(migrated.causalEvidenceSnapshot).toMatchObject({
    eventSequence: migrated.eventSequence,
    evaluation,
  });
  await assertNoPageOrConsoleErrors(pageErrors, consoleErrors, page);
  await page.screenshot({
    path: testInfo.outputPath("legacy-migration-393.png"),
    fullPage: true,
  });
});
