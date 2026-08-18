import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type SavedState = {
  eventSequence: number;
  jobs: { paused?: boolean; queued: number };
  lastSettlement: { failed: number; ledgerEventId?: string } | null;
  ledger: Array<{
    id: string;
    message: string;
    settlementFailureCause?: string;
  }>;
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

async function armForgedSettlementMarkerForNextDocument(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("r083-stale-integrity") !== null) return;
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("Simulation save is not available.");
    const state = JSON.parse(raw) as {
      integrity?: { digest?: string };
      ledger: Array<{
        id: string;
        settlementFailureCause?: string;
      }>;
      lastSettlement: {
        ledgerEventId?: string;
      } | null;
    };
    const eventId = state.lastSettlement?.ledgerEventId;
    const settlementEvent = state.ledger.find((event) => event.id === eventId);
    if (!settlementEvent)
      throw new Error("Expected a linked failed settlement event.");
    settlementEvent.settlementFailureCause = "memory-capacity-exceeded";
    const payload = { ...state } as Record<string, unknown>;
    delete payload.integrity;
    const serialized = JSON.stringify(payload);
    let hash = 0x811c9dc5;
    for (let index = 0; index < serialized.length; index += 1) {
      hash ^= serialized.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    sessionStorage.setItem(
      "r083-stale-integrity",
      JSON.stringify({
        computed: (hash >>> 0).toString(16).padStart(8, "0"),
        marker: settlementEvent.settlementFailureCause,
        stored: state.integrity?.digest,
      }),
    );
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
}

async function expectInvalidIntegrityReset(page: Page) {
  await expect(page.getByTestId("save-recovery-status")).toContainText(
    "invalid integrity",
  );
  const state = await savedState(page);
  expect(state.jobs.queued).toBe(0);
  expect(state.lastSettlement).toBeNull();
}

async function reopenWithUnsealedRecord(
  page: Page,
  serialized: string,
  marker: string,
): Promise<Page> {
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const context = page.context();
  await context.addInitScript(
    ({ key, marker: markerKey, serialized: next }) => {
      if (sessionStorage.getItem(markerKey) === "seeded") return;
      localStorage.setItem(key, next);
      sessionStorage.setItem(markerKey, "seeded");
    },
    { key: SAVE_KEY, marker, serialized },
  );
  await page.close();
  const reopened = await context.newPage();
  await reopened.setViewportSize(viewport);
  await reopened.goto("/", { waitUntil: "domcontentloaded" });
  return reopened;
}

test("resets a forged settlement link through reload and offline", async ({
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
  await expectInvalidIntegrityReset(page);

  await page.locator("html[data-offline-ready='true']").waitFor({
    timeout: 15_000,
  });
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await expectInvalidIntegrityReset(page);
  } finally {
    await context.setOffline(false);
  }
});

test("resets a stale settlement marker through restore and offline reload", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await waitForSave(page);
  await removeRuntime(page);
  await settleFailedStarter(page);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => (await savedState(page)).jobs.paused)
    .toBe(true);
  await armForgedSettlementMarkerForNextDocument(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  const staleIntegrity = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("r083-stale-integrity") ?? "null") as {
        computed: string;
        marker: string;
        stored: string;
      },
  );
  expect(staleIntegrity.computed).not.toBe(staleIntegrity.stored);
  expect(staleIntegrity.marker).toBe("memory-capacity-exceeded");
  await expectInvalidIntegrityReset(page);
  const restored = await savedState(page);
  expect(restored.lastSettlement).toBeNull();

  await page.locator("html[data-offline-ready='true']").waitFor({
    timeout: 15_000,
  });
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSave(page);
    await expectInvalidIntegrityReset(page);
    const offlineRestored = await savedState(page);
    expect(offlineRestored.lastSettlement).toBeNull();
  } finally {
    await context.setOffline(false);
  }
});

test("resets a stale future ledger ID before offline resume", async ({
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

  const forged = await page.evaluate((key) => {
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
    return localStorage.getItem(key);
  }, SAVE_KEY);
  if (forged === null) throw new Error("Expected forged save");

  page = await reopenWithUnsealedRecord(
    page,
    forged,
    "jobs-settlement-provenance-stale-future-ledger",
  );
  await waitForSave(page);
  await expect.poll(async () => (await savedState(page)).jobs.queued).toBe(0);
  await expect
    .poll(async () => (await savedState(page)).lastSettlement)
    .toBeNull();
  await expect(page.getByTestId("save-recovery-status")).toContainText(
    "invalid integrity",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  expect((await savedState(page)).jobs.queued).toBe(0);
});
