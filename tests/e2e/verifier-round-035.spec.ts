import { expect, test, type Page } from "@playwright/test";
import { applyCommand, createInitialState } from "../../src/simulation/engine";
import type { SimulationState } from "../../src/simulation/types";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function saturatedTutorialEnding(seed: number): SimulationState {
  let state = createInitialState(seed);
  while (state.eventSequence < 78)
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: `round-035-browser-history-${state.eventSequence}`,
    });
  for (let index = 0; index < 8; index += 1)
    state = applyCommand(state, {
      type: "SET_QUANTIZATION",
      profile: index % 2 === 0 ? "q8" : "q4",
    });
  return state;
}

function forgedSaturatedEnding(
  state: SimulationState,
): Record<string, unknown> {
  const forged = clone(state) as unknown as Record<string, unknown>;
  const career = forged.career as Record<string, unknown>;
  const evaluation = {
    ...(career.evaluation as Record<string, unknown>),
    capitalCommitments: 1,
    hardwareDebt: 1,
    warnings: {
      ...(career.evaluation as { warnings: Record<string, unknown> }).warnings,
      hardware: 1,
    },
  };
  career.evaluation = evaluation;
  (forged.causalEvidenceSnapshot as Record<string, unknown>).evaluation =
    clone(evaluation);
  return forged;
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Career", exact: true }),
  ).toHaveAttribute("aria-current", "page");
}

async function openCareerDisclosure(page: Page, title: string): Promise<void> {
  const summary = page.locator(`summary[aria-label="Show ${title}"]`);
  const disclosure = summary.locator("xpath=..");
  await expect(summary).toHaveCount(1);
  if (!(await disclosure.evaluate((element) => element.hasAttribute("open"))))
    await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
}

async function savedState(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as Record<
      string,
      unknown
    >;
  }, SAVE_KEY);
}

async function touchTap(page: Page, label: string): Promise<void> {
  const control = page.getByRole("button", { name: label });
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  const session = await page.context().newCDPSession(page);
  const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...point, id: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

async function assertNoErrorsOrOverflow(
  page: Page,
  pageErrors: readonly string[],
  consoleErrors: readonly string[],
): Promise<void> {
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("preserves a sealed saturated ending through offline reload and touch restart at 320px", async ({
  page,
  context,
}, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 742 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const seed = 35_101;
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    { key: SAVE_KEY, save: saturatedTutorialEnding(seed) },
  );
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await openCareer(page);
  await expect(
    page.getByRole("heading", { name: "Run postmortem" }),
  ).toBeVisible();
  await page.locator("html[data-offline-ready='true']").waitFor();
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await openCareer(page);
  await expect(
    page.getByRole("heading", { name: "Run postmortem" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("sealed-postmortem-320.png"),
    fullPage: true,
  });
  await context.setOffline(false);

  await touchTap(page, "Restart this scenario");
  await openCareerDisclosure(page, "Evaluation discipline");
  await expect(
    page.getByRole("heading", { name: "Evaluation discipline" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const meta = (await savedState(page)).meta as {
        completedEndingIds?: readonly string[];
        unlockedDiagnosticIds?: readonly string[];
      };
      return {
        completed: meta.completedEndingIds,
        unlocked: meta.unlockedDiagnosticIds,
      };
    })
    .toEqual({
      completed: ["tutorial-loop"],
      unlocked: ["decision-history"],
    });
  await assertNoErrorsOrOverflow(page, pageErrors, consoleErrors);
});

test("resets a stale matching saturated checkpoint before it reaches the 393px UI", async ({
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
  const seed = 35_102;
  await page.addInitScript(
    ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
    {
      key: SAVE_KEY,
      save: forgedSaturatedEnding(saturatedTutorialEnding(seed)),
    },
  );
  await page.goto("/");
  await expect(page.getByTestId("save-recovery-status")).toContainText(
    "invalid integrity",
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  const saved = await savedState(page);
  expect(saved).toEqual(createInitialState(20260715));
  await assertNoErrorsOrOverflow(page, pageErrors, consoleErrors);
  await page.screenshot({
    path: testInfo.outputPath("recovered-career-393.png"),
    fullPage: true,
  });
});
