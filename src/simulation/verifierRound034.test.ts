import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  getPostmortemEvent,
  isStateValid,
  restoreSimulationState,
  sealSaveRecord,
} from "./engine";
import { runEndingScenario } from "./evaluationBalance";
import type { RunEndingId, SimulationState } from "./types";

const endingIds: readonly RunEndingId[] = [
  "public-leaderboard-hero",
  "product-reliability-collapse",
  "hardware-debt-spiral",
  "tutorial-loop",
  "honest-independent-builder",
];

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
      label: `verifier-history-${state.eventSequence}`,
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
  const snapshot = forged.causalEvidenceSnapshot as Record<string, unknown>;
  snapshot.evaluation = clone(evaluation);
  // Deliberately retain the original integrity seal: a local stale save must
  // not become trusted merely because its mutable checkpoint looks coherent.
  return forged;
}

describe("verifier round 034: causal checkpoint boundaries", () => {
  it("rejects stale coherent causal snapshots at 79/80/81+ retention boundaries", () => {
    for (const eventSequence of [79, 80, 81, 82]) {
      const seed = 34_000 + eventSequence;
      const state = historyAtEventSequence(seed, eventSequence);
      const validRestore = restoreSimulationState(clone(state), seed);
      const recovered = restoreSimulationState(
        staleCoherentForgery(state),
        seed,
      );
      const advanced = applyCommand(recovered, {
        type: "RUN_PUBLIC_EVALUATION",
      });

      expect(state.eventSequence).toBe(eventSequence);
      expect(state.ledger).toHaveLength(Math.min(eventSequence, 80));
      expect(validRestore.career.evaluation).toEqual(state.career.evaluation);
      expect(isStateValid(validRestore)).toBe(true);
      expect(recovered.career.evaluation).toEqual(
        createInitialState(seed).career.evaluation,
      );
      expect(recovered.migration.steps).toEqual([]);
      expect(advanced.career.runEnding).toBeNull();
      expect(getPostmortemEvent(advanced)).toBeNull();
      expect(isStateValid(advanced)).toBe(true);
    }
  });

  it("preserves original-seal saturated history and adds a checkpoint to valid legacy schema-7 saves", () => {
    const seed = 34_101;
    let saturated = createInitialState(seed);
    for (let index = 0; index < 7; index += 1)
      saturated = applyCommand(saturated, {
        type: "SET_QUANTIZATION",
        profile: index % 2 === 0 ? "q8" : "q4",
      });
    while (saturated.eventSequence < 83)
      saturated = applyCommand(saturated, {
        type: "CAPTURE_BASELINE",
        label: `sealed-history-${saturated.eventSequence}`,
      });

    const originalSealRestore = restoreSimulationState(clone(saturated), seed);
    expect(originalSealRestore.career.evaluation).toEqual(
      saturated.career.evaluation,
    );
    expect(isStateValid(originalSealRestore)).toBe(true);

    const legacy = clone(saturated) as unknown as Record<string, unknown>;
    delete legacy.causalEvidenceSnapshot;
    (legacy.integrity as { digest: string }).digest =
      legacyIntegrityDigest(legacy);
    const migrated = restoreSimulationState(sealSaveRecord(legacy), seed);

    expect(migrated.career.evaluation).toEqual(saturated.career.evaluation);
    expect(migrated.causalEvidenceSnapshot).toMatchObject({
      eventSequence: migrated.eventSequence,
      evaluation: migrated.career.evaluation,
    });
    expect(migrated.migration.steps).toContain(
      "schema-v7-causal-snapshot-added",
    );
    expect(isStateValid(migrated)).toBe(true);
  });

  it("retains causal postmortems through repeated restores and resets replay state without a meta bonus", () => {
    for (const endingId of endingIds) {
      const seed = 34_200;
      let restored = runEndingScenario(seed, endingId);
      const endingEventId = restored.career.runEnding?.eventId;
      for (let reload = 0; reload < 5; reload += 1)
        restored = restoreSimulationState(clone(restored), seed);

      expect(restored.career.runEnding?.id).toBe(endingId);
      expect(getPostmortemEvent(restored)?.id).toBe(endingEventId);
      expect(getPostmortemEvent(restored)?.causal).toBeDefined();
      expect(isStateValid(restored)).toBe(true);
      expect(applyCommand(restored, { type: "RUN_PUBLIC_EVALUATION" })).toBe(
        restored,
      );

      const sameSeedReplay = applyCommand(restored, {
        type: "RESET",
        seed,
      });
      const nextSeedReplay = applyCommand(restored, {
        type: "RESET",
        seed: seed + 1,
      });
      for (const replay of [sameSeedReplay, nextSeedReplay]) {
        expect(replay.career.runEnding).toBeNull();
        expect(replay.meta.completedEndingIds).toContain(endingId);
        expect(replay.meta.unlockedDiagnosticIds).toContain(
          restored.career.runEnding?.diagnosticUnlockId,
        );
        expect(replay.career.evaluation).toEqual(
          createInitialState(replay.seed).career.evaluation,
        );
        expect(isStateValid(replay)).toBe(true);
      }
    }
  });

  it("migrates schema-6 career state while rejecting malformed current checkpoints", () => {
    const seed = 34_301;
    const current = createInitialState(seed);
    const legacy = clone(current) as unknown as Record<string, unknown>;
    legacy.schemaVersion = 6;
    legacy.contentVersion = "bedroom-career-1";
    delete legacy.causalEvidenceSnapshot;
    delete (legacy.career as Record<string, unknown>).evaluation;
    delete (legacy.career as Record<string, unknown>).runEnding;
    delete legacy.meta;

    const migrated = restoreSimulationState(sealSaveRecord(legacy), seed);
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.career.schedule).toEqual(current.career.schedule);
    expect(migrated.career.evaluation).toEqual(current.career.evaluation);
    expect(migrated.meta).toEqual({
      unlockedDiagnosticIds: [],
      completedEndingIds: [],
      replayCount: 0,
    });
    expect(migrated.migration.steps).toContain(
      "schema-6-to-7-evaluation-replay",
    );
    expect(isStateValid(migrated)).toBe(true);

    const malformed = clone(current) as unknown as Record<string, unknown>;
    malformed.causalEvidenceSnapshot = {
      eventSequence: -1,
      evaluation: (current.causalEvidenceSnapshot as { evaluation: unknown })
        .evaluation,
    };
    const recovered = restoreSimulationState(malformed, seed);
    expect(recovered).toEqual(createInitialState(seed));
    expect(isStateValid(recovered)).toBe(true);
  });

  it("keeps private evidence paid, categorical, and retryable without a latent score", () => {
    let state = createInitialState(34_401);
    const unfunded = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    expect(unfunded.career.evaluation).toMatchObject({
      privateAssessment: "not-run",
      privateEvaluations: 0,
      evaluationSpend: 0,
      coverage: 0,
    });
    expect(unfunded.resources.money).toBe(state.resources.money);
    expect(unfunded.ledger.at(-1)?.message).toMatch(
      /needs \$0\.750 liquid cash/i,
    );
    expect(isStateValid(unfunded)).toBe(true);

    state = applyCommand(state, { type: "WITHDRAW_SAVINGS", amount: 1 });
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    const firstPaid = state.career.evaluation;
    expect(firstPaid.privateEvaluations).toBe(1);
    expect(firstPaid.evaluationSpend).toBe(0.75);
    expect(firstPaid.coverage).toBeGreaterThanOrEqual(0.25);
    expect(firstPaid.coverage).toBeLessThanOrEqual(0.5);
    expect(firstPaid.privateAssessment).not.toBe("not-run");
    expect(firstPaid as unknown as Record<string, unknown>).not.toHaveProperty(
      "actualCapability",
    );
    expect(firstPaid as unknown as Record<string, unknown>).not.toHaveProperty(
      "privateScore",
    );

    state = applyCommand(state, { type: "WITHDRAW_SAVINGS", amount: 1 });
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    expect(state.career.evaluation.privateEvaluations).toBe(2);
    expect(state.career.evaluation.evaluationSpend).toBe(1.5);
    expect(state.career.evaluation.coverage).toBeGreaterThanOrEqual(0.5);
    expect(state.career.evaluation.coverage).toBeLessThanOrEqual(1);
    expect(isStateValid(state)).toBe(true);
  });
});
