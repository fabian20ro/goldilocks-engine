import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import type { SimulationState } from "./types";

function withoutGuide(seed: number): Record<string, unknown> {
  const persisted = JSON.parse(
    JSON.stringify(createInitialState(seed)),
  ) as Record<string, unknown>;
  delete persisted.firstSession;
  return persisted;
}

describe("verifier round 040: legacy-guide migration boundary", () => {
  it("fails closed when an unsealed current save deletes its first-session guide", () => {
    const restored = restoreSimulationState(withoutGuide(40_001), 40_001);
    const batchAttempt = applyCommand(restored, {
      type: "QUEUE_JOBS",
      count: 10,
    });

    expect(restored.firstSession).toMatchObject({ step: "queue-starter" });
    expect(batchAttempt.jobs.queued).toBe(0);
  });

  it("retains the documented migration path for an integrity-valid pre-guide save", () => {
    const legacy = withoutGuide(40_002);
    const integrityValidLegacy = sealSimulationState(
      legacy as unknown as SimulationState,
    );
    const restored = restoreSimulationState(integrityValidLegacy, 40_002);
    const batch = applyCommand(restored, { type: "QUEUE_JOBS", count: 10 });

    expect(restored.firstSession).toMatchObject({ step: "complete" });
    expect(restored.migration.steps).toContain(
      "schema-v7-first-session-guide-added",
    );
    expect(batch.jobs.queued).toBe(10);
  });

  it("does not accept an unsealed completed rail with a fabricated uninstalled purchase", () => {
    let forged = createInitialState(40_003);
    forged = applyCommand(forged, { type: "QUEUE_JOBS", count: 1 });
    forged = tick(forged, 60);
    const starterTaskId = forged.firstSession.starterTaskId;

    forged = {
      ...forged,
      ownedModuleIds: [...forged.ownedModuleIds, "precision-cleaner"],
      firstSession: {
        step: "complete",
        starterTaskId,
        observedSettlementTaskId: starterTaskId,
        purchasedModuleId: "precision-cleaner",
      },
    };

    const restored = restoreSimulationState(forged, 40_003);
    const batchAttempt = applyCommand(restored, {
      type: "QUEUE_JOBS",
      count: 10,
    });

    expect(restored.firstSession).toMatchObject({ step: "queue-starter" });
    expect(restored.ownedModuleIds).not.toContain("precision-cleaner");
    expect(batchAttempt.jobs.queued).toBe(0);
  });
});
