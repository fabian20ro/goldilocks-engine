import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  tick,
} from "./engine";

describe("verifier round 041: stale purchase provenance", () => {
  it("fails closed when a damaged save fabricates an owned and installed first purchase", () => {
    let forged = createInitialState(41_001);
    forged = applyCommand(forged, { type: "QUEUE_JOBS", count: 1 });
    forged = tick(forged, 60);
    const starterTaskId = forged.firstSession.starterTaskId;
    const moneyBeforeForgery = forged.resources.money;

    forged = {
      ...forged,
      ownedModuleIds: [...forged.ownedModuleIds, "precision-cleaner"],
    };
    forged = applyCommand(forged, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });
    forged = {
      ...forged,
      firstSession: {
        step: "complete",
        starterTaskId,
        observedSettlementTaskId: starterTaskId,
        purchasedModuleId: "precision-cleaner",
      },
    };

    const restored = restoreSimulationState(forged, 41_001);
    const batchAttempt = applyCommand(restored, {
      type: "QUEUE_JOBS",
      count: 10,
    });

    expect(forged.resources.money).toBe(moneyBeforeForgery);
    expect(restored.firstSession.step).toBe("queue-starter");
    expect(restored.ownedModuleIds).not.toContain("precision-cleaner");
    expect(
      restored.slots.find((slot) => slot.slotId === "prepare")?.moduleId,
    ).toBe("basic-cleaner");
    expect(batchAttempt.jobs.queued).toBe(0);
  });

  it("fails closed before placement when a damaged save fabricates only ownership", () => {
    let forged = createInitialState(41_003);
    forged = applyCommand(forged, { type: "QUEUE_JOBS", count: 1 });
    forged = tick(forged, 60);
    const starterTaskId = forged.firstSession.starterTaskId;
    forged = {
      ...forged,
      ownedModuleIds: [...forged.ownedModuleIds, "precision-cleaner"],
      firstSession: {
        step: "buy-and-install",
        starterTaskId,
        observedSettlementTaskId: starterTaskId,
        purchasedModuleId: "precision-cleaner",
      },
    };

    const restored = restoreSimulationState(forged, 41_003);
    const afterPlacement = applyCommand(restored, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });

    expect(restored.firstSession.step).toBe("queue-starter");
    expect(restored.ownedModuleIds).not.toContain("precision-cleaner");
    expect(afterPlacement.firstSession.step).toBe("queue-starter");
  });

  it("retains a damaged completed guide after a real paid purchase and install", () => {
    let completed = createInitialState(41_002);
    for (
      let attempt = 0;
      attempt < 20 && completed.resources.money < 4;
      attempt += 1
    ) {
      completed = applyCommand(completed, { type: "QUEUE_JOBS", count: 1 });
      completed = tick(completed, 60);
    }
    const moneyBeforePurchase = completed.resources.money;
    completed = applyCommand(completed, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    completed = applyCommand(completed, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });
    const damaged = { ...completed, lastUpgradeNotice: null };

    const restored = restoreSimulationState(damaged, 41_002);
    const batchAttempt = applyCommand(restored, {
      type: "QUEUE_JOBS",
      count: 10,
    });

    expect(completed.resources.money).toBe(moneyBeforePurchase - 4);
    expect(
      completed.ledger.some((event) =>
        event.message.includes("purchased for $4.000"),
      ),
    ).toBe(true);
    expect(restored.firstSession.step).toBe("complete");
    expect(batchAttempt.jobs.queued).toBe(10);
  });
});
