import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type SavedState = {
  eventSequence: number;
  jobs: { queued: number };
  lastSettlement: { failed: number; ledgerEventId?: string } | null;
  ledger: Array<{ id: string; message: string }>;
  tick: number;
};

async function openTab(page: Page, name: "Build" | "Inspect" | "Jobs") {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function savedState(page: Page): Promise<SavedState> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Simulation save is not available.");
    return JSON.parse(raw) as SavedState;
  }, SAVE_KEY);
}

async function waitForSave(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function removeRuntime(page: Page) {
  await openTab(page, "Build");
  await page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /^Quantized Model/ })
    .click();
  await page
    .getByRole("button", {
      name: "Remove Quantized Model from Runtime and bypass position",
      exact: true,
    })
    .click();
}

async function settleFailedStarter(page: Page) {
  await openTab(page, "Jobs");
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(async () => (await savedState(page)).lastSettlement?.failed)
    .toBe(1);
}

async function captureBaseline(page: Page) {
  await openTab(page, "Inspect");
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await expect
    .poll(async () => (await savedState(page)).ledger.at(-1)?.message)
    .toBe("Current configuration captured for comparison.");
}

async function writeForgedSettlementRelink(page: Page) {
  await captureBaseline(page);
  await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Simulation save is not available.");
    const state = JSON.parse(raw) as {
      ledger: Array<{
        directCause?: string;
        id: string;
        kind?: string;
        settlementFailureCause?: string;
        settlementTaskId?: string;
      }>;
      lastSettlement: {
        ledgerEventId?: string;
        taskId: string;
      } | null;
    };
    const decoy = state.ledger.at(-1);
    if (!decoy || !state.lastSettlement)
      throw new Error("Expected a captured event and failed settlement.");
    decoy.kind = "failure";
    decoy.settlementTaskId = state.lastSettlement.taskId;
    decoy.settlementFailureCause = "memory-capacity-exceeded";
    decoy.directCause = "Forged unrelated direct cause.";
    state.lastSettlement.ledgerEventId = decoy.id;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
}

async function expectUnknownSettlementCause(page: Page) {
  await openTab(page, "Jobs");
  const record = page.locator(".settlement-recovery");
  await expect(record).toContainText(
    "Cause unknown — the retained settlement record is unavailable.",
  );
  await expect(record).not.toContainText(
    "Required memory exceeded available memory.",
  );
}

test("keeps a forged stale settlement link unknown through reload and offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await waitForSave(page);
  await removeRuntime(page);
  await settleFailedStarter(page);
  await writeForgedSettlementRelink(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await expectUnknownSettlementCause(page);

  await page.locator("html[data-offline-ready='true']").waitFor({
    timeout: 15_000,
  });
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await expectUnknownSettlementCause(page);
  } finally {
    await context.setOffline(false);
  }
});

test("repairs a stale future ledger ID and keeps restored progress unique", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await removeRuntime(page);
  await settleFailedStarter(page);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await captureBaseline(page);
  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Queue 1", exact: true }).click();
  await expect.poll(async () => (await savedState(page)).jobs.queued).toBe(1);

  const before = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Simulation save is not available.");
    const state = JSON.parse(raw) as SavedState;
    const target = state.ledger.find(
      (event) =>
        event.message === "Current configuration captured for comparison.",
    );
    if (!target) throw new Error("Expected captured ledger event.");
    target.id = `evt-${state.tick + 10_000}-${state.eventSequence + 1}`;
    localStorage.setItem(key, JSON.stringify(state));
    return { tick: state.tick };
  }, SAVE_KEY);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  const restored = await savedState(page);
  expect(new Set(restored.ledger.map((event) => event.id)).size).toBe(
    restored.ledger.length,
  );

  await openTab(page, "Jobs");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(async () => (await savedState(page)).tick)
    .toBeGreaterThan(before.tick);
  const progressed = await savedState(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(async () => (await savedState(page)).tick)
    .toBeGreaterThan(progressed.tick);
  const resumed = await savedState(page);
  expect(new Set(resumed.ledger.map((event) => event.id)).size).toBe(
    resumed.ledger.length,
  );
});
