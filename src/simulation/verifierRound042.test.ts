import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import type { SimulationState } from "./types";

function paidStarterPurchase(seed: number): SimulationState {
  let state = createInitialState(seed);
  state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
  state = tick(state, 60);
  return applyCommand(
    { ...state, resources: { ...state.resources, money: 4 } },
    { type: "BUY_MODULE", moduleId: "precision-cleaner" },
  );
}

function stale(state: SimulationState): SimulationState {
  return { ...state, lastWarning: `${state.lastWarning} ` };
}

describe("round 042 independent first-session recovery probes", () => {
  it("preserves a real paid-but-uninstalled guide after later work, without a second deduction", () => {
    let state = paidStarterPurchase(4201);
    const starterTaskId = state.firstSession.starterTaskId;
    const moneyAfterPurchase = state.resources.money;

    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);
    expect(state.lastSettlement?.taskId).not.toBe(starterTaskId);

    const restored = restoreSimulationState(stale(state), 4201);
    expect(restored.firstSession).toMatchObject({
      step: "buy-and-install",
      starterTaskId,
      observedSettlementTaskId: starterTaskId,
      purchasedModuleId: "precision-cleaner",
    });
    expect(restored.ownedModuleIds).toContain("precision-cleaner");

    const duplicateBuy = applyCommand(restored, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    expect(duplicateBuy.resources.money).toBeCloseTo(
      restored.resources.money,
      6,
    );
    expect(duplicateBuy.resources.money).toBeGreaterThanOrEqual(
      moneyAfterPurchase,
    );
    const installed = applyCommand(duplicateBuy, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });
    expect(installed.firstSession.step).toBe("complete");
    expect(isStateValid(installed)).toBe(true);
  });

  it("fails closed after bounded ledger eviction removes either required onboarding record", () => {
    let state = paidStarterPurchase(4202);
    for (let attempt = 0; attempt < 50; attempt += 1) {
      state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
      state = tick(state, 60);
    }

    expect(state.ledger).toHaveLength(80);
    expect(
      state.ledger.some((event) =>
        event.message.includes("Precision Cleaner purchased for $4.000"),
      ),
    ).toBe(false);
    expect(
      state.ledger.some((event) =>
        event.message.includes("Interactive Chat task task-0-1 completed;"),
      ),
    ).toBe(false);

    const restored = restoreSimulationState(stale(state), 4202);
    const queueBatch = applyCommand(restored, {
      type: "QUEUE_JOBS",
      count: 10,
    });
    expect(restored.firstSession.step).toBe("queue-starter");
    expect(queueBatch.jobs.queued).toBe(0);
    expect(isStateValid(restored)).toBe(true);
  });

  it("keeps a valid pre-guide seal and later sealed reconfiguration authoritative", () => {
    const preGuide = structuredClone(
      createInitialState(4203),
    ) as unknown as Record<string, unknown>;
    delete preGuide.firstSession;
    const migrated = restoreSimulationState(
      sealSimulationState(preGuide as unknown as SimulationState),
      4203,
    );
    expect(migrated.firstSession).toEqual({
      step: "complete",
      starterTaskId: "legacy-session",
      observedSettlementTaskId: "legacy-session",
      purchasedModuleId: "legacy-session",
    });

    let completed = paidStarterPurchase(4204);
    completed = applyCommand(completed, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });
    const reconfigured = applyCommand(completed, {
      type: "REMOVE_MODULE",
      slotId: "prepare",
    });
    const restored = restoreSimulationState(reconfigured, 4204);
    expect(restored.firstSession.step).toBe("complete");
    expect(
      restored.slots.find((slot) => slot.slotId === "prepare")?.moduleId,
    ).toBeNull();
    expect(isStateValid(restored)).toBe(true);
  });
});
