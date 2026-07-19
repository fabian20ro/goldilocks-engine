import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  getPostmortemEvent,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
} from "./engine";
import {
  runEndingScenario,
  validateEvaluationReplay,
} from "./evaluationBalance";
import {
  SCHEMA_VERSION,
  type RunEndingId,
  type SimulationCommand,
} from "./types";

const endingIds: readonly RunEndingId[] = [
  "public-leaderboard-hero",
  "product-reliability-collapse",
  "hardware-debt-spiral",
  "tutorial-loop",
  "honest-independent-builder",
];

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

describe("D-011 evaluation, failure, and replay", () => {
  it("reaches all five deterministic endings through recorded causal patterns", () => {
    for (const endingId of endingIds) {
      const state = runEndingScenario(11, endingId);
      const ending = state.career.runEnding;
      const postmortem = getPostmortemEvent(state);

      expect(ending?.id).toBe(endingId);
      expect(postmortem?.causal).toBeDefined();
      expect(postmortem?.causal).toMatchObject({
        directCauses: expect.any(Array),
        contributingFactors: expect.any(Array),
        correlations: expect.any(Array),
        hypotheses: expect.any(Array),
        unknowns: expect.any(Array),
      });
      expect(state.ledger.some((event) => event.id === ending?.eventId)).toBe(
        true,
      );
      expect(isStateValid(state)).toBe(true);
    }
  });

  it("keeps public score distinct from categorical private evidence and hides a latent exact score", () => {
    const state = runEndingScenario(12, "public-leaderboard-hero");
    const evaluation = state.career.evaluation as unknown as Record<
      string,
      unknown
    >;

    expect(evaluation.publicScore).toEqual(expect.any(Number));
    expect(["at-risk", "failed"]).toContain(evaluation.privateAssessment);
    expect(evaluation).not.toHaveProperty("actualCapability");
    expect(evaluation).not.toHaveProperty("privateScore");
    expect(getPostmortemEvent(state)?.causal?.unknowns.join(" ")).toMatch(
      /exact latent capability/i,
    );
  });

  it("does not let a competition result mint unpaid private evidence", () => {
    let state = createInitialState(65);
    for (let index = 0; index < 2; index += 1) {
      state = applyCommand(state, {
        type: "SET_EVENING_ALLOCATION",
        route: "competition",
        hours: 4,
      });
      state = applyCommand(state, { type: "RUN_EVENING" });
    }

    state = applyCommand(state, { type: "SUBMIT_COMPETITION" });

    expect(state.career.evaluation).toMatchObject({
      publicScore: expect.any(Number),
      privateAssessment: "not-run",
      coverage: 0,
      evaluationSpend: 0,
      privateEvaluations: 0,
    });
    expect(isStateValid(state)).toBe(true);
  });

  it("freezes a closed run, then restarts the same scenario with information-only meta memory", () => {
    const ended = runEndingScenario(13, "tutorial-loop");
    const frozen = applyCommand(ended, { type: "RUN_PUBLIC_EVALUATION" });
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(ended)),
      13,
    );
    const restarted = applyCommand(ended, {
      type: "RESET",
      seed: ended.seed,
    });

    expect(frozen).toBe(ended);
    expect(restored.career.runEnding).toEqual(ended.career.runEnding);
    expect(getPostmortemEvent(restored)?.causal).toBeDefined();
    expect(restarted.career.runEnding).toBeNull();
    expect(restarted.meta.unlockedDiagnosticIds).toContain("decision-history");
    expect(restarted.meta.completedEndingIds).toContain("tutorial-loop");
    expect(restarted.meta.replayCount).toBe(1);
    expect(restarted.metrics).toEqual(createInitialState(ended.seed).metrics);
    expect(isStateValid(restarted)).toBe(true);
  });

  it("migrates a deployed schema-6 save into schema 7 without losing its Career state", () => {
    const current = createInitialState(61);
    const schema6 = JSON.parse(JSON.stringify(current)) as Record<
      string,
      unknown
    >;
    schema6.schemaVersion = 6;
    schema6.contentVersion = "bedroom-career-1";
    schema6.migration = { sourceSchemaVersion: 6, steps: [] };
    const career = schema6.career as Record<string, unknown>;
    delete career.evaluation;
    delete career.runEnding;
    delete schema6.meta;

    const migrated = restoreSimulationState(schema6, 61);

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.career.schedule).toEqual(current.career.schedule);
    expect(migrated.career.evaluation.privateAssessment).toBe("not-run");
    expect(migrated.meta.unlockedDiagnosticIds).toEqual([]);
    expect(migrated.migration.steps).toContain(
      "schema-6-to-7-evaluation-replay",
    );
    expect(isStateValid(migrated)).toBe(true);
  });

  it("safely recovers malformed current evaluation and dangling postmortem data", () => {
    const current = JSON.parse(
      JSON.stringify(createInitialState(62)),
    ) as Record<string, unknown>;
    const career = current.career as Record<string, unknown>;
    const evaluation = career.evaluation as Record<string, unknown>;
    evaluation.coverage = "not-a-number";
    career.runEnding = {
      id: "tutorial-loop",
      title: "Tutorial Loop",
      outcome: "failure",
      eventId: "missing-event",
      diagnosticUnlockId: "decision-history",
      reachedAtTick: 0,
    };

    const recovered = restoreSimulationState(current, 62);

    expect(recovered).toEqual(createInitialState(62));
    expect(isStateValid(recovered)).toBe(true);
  });

  it("records ignored warnings and repairs incoherent current private evidence", () => {
    let state = createInitialState(66);
    for (let index = 0; index < 3; index += 1)
      state = applyCommand(state, {
        type: "SET_QUANTIZATION",
        profile: index % 2 === 0 ? "q8" : "q4",
      });
    const ledgerLength = state.ledger.length;
    state = applyCommand(state, { type: "SET_QUANTIZATION", profile: "q4" });

    expect(
      state.ledger
        .slice(ledgerLength)
        .find((event) => /ignored tutorial warning/i.test(event.message)),
    ).toMatchObject({
      kind: "warning",
      directCause: expect.stringMatching(/tutorial warning/i),
      contributingCondition: expect.stringMatching(/unresolved/i),
    });

    const forged = JSON.parse(JSON.stringify(createInitialState(66))) as Record<
      string,
      unknown
    >;
    const career = forged.career as Record<string, unknown>;
    career.evaluation = {
      ...(career.evaluation as Record<string, unknown>),
      privateAssessment: "credible",
      coverage: 0,
      evaluationSpend: 0,
      privateEvaluations: 0,
    };

    const recovered = restoreSimulationState(forged, 66);

    expect(recovered.career.evaluation).toEqual(
      createInitialState(66).career.evaluation,
    );
    expect(recovered.migration.steps).toContain(
      "schema-v7-evaluation-evidence-repaired",
    );
    expect(isStateValid(recovered)).toBe(true);
  });

  it("preserves runtime evidence while repairing impossible coverage and unrecorded causal counters", () => {
    let paid = createInitialState(67);
    paid = applyCommand(paid, { type: "WITHDRAW_SAVINGS", amount: 1 });
    paid = applyCommand(paid, { type: "RUN_PRIVATE_EVALUATION" });

    const paidRestored = restoreSimulationState(
      JSON.parse(JSON.stringify(paid)),
      67,
    );
    expect(paidRestored.career.evaluation).toEqual(paid.career.evaluation);

    const impossibleCoverage = JSON.parse(
      JSON.stringify(createInitialState(68)),
    ) as Record<string, unknown>;
    const impossibleCareer = impossibleCoverage.career as Record<
      string,
      unknown
    >;
    impossibleCareer.evaluation = {
      ...(impossibleCareer.evaluation as Record<string, unknown>),
      privateAssessment: "credible",
      privateEvaluations: 1,
      evaluationSpend: 0.75,
      coverage: 0.9,
    };

    const coverageRecovered = restoreSimulationState(impossibleCoverage, 68);
    expect(coverageRecovered.career.evaluation).toEqual(
      createInitialState(68).career.evaluation,
    );
    expect(coverageRecovered.migration.steps).toContain(
      "schema-v7-evaluation-evidence-repaired",
    );

    const unrecordedCounters = JSON.parse(
      JSON.stringify(createInitialState(69)),
    ) as Record<string, unknown>;
    const counterCareer = unrecordedCounters.career as Record<string, unknown>;
    counterCareer.evaluation = {
      ...(counterCareer.evaluation as Record<string, unknown>),
      modelSwitches: 8,
      ignoredWarnings: 2,
      warnings: {
        ...(counterCareer.evaluation as { warnings: Record<string, unknown> })
          .warnings,
        tutorial: 2,
      },
    };

    const causalityRecovered = restoreSimulationState(unrecordedCounters, 69);
    const advanced = applyCommand(causalityRecovered, {
      type: "RUN_PUBLIC_EVALUATION",
    });
    expect(causalityRecovered.career.evaluation).toEqual(
      createInitialState(69).career.evaluation,
    );
    expect(causalityRecovered.migration.steps).toContain(
      "schema-v7-causal-ledger-repaired",
    );
    expect(advanced.career.runEnding).toBeNull();
    expect(isStateValid(advanced)).toBe(true);
  });

  it("retains a complete causal history when its counters have ledger evidence", () => {
    let state = createInitialState(70);
    for (let index = 0; index < 8; index += 1)
      state = applyCommand(state, {
        type: "SET_QUANTIZATION",
        profile: index % 2 === 0 ? "q8" : "q4",
      });

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      70,
    );

    expect(restored.career.evaluation).toEqual(state.career.evaluation);
    expect(restored.career.runEnding).toEqual(state.career.runEnding);
    expect(getPostmortemEvent(restored)?.causal).toBeDefined();
    expect(isStateValid(restored)).toBe(true);

    let bounded = createInitialState(71);
    for (let index = 0; index < 85; index += 1)
      bounded = applyCommand(bounded, {
        type: "CAPTURE_BASELINE",
        label: `bounded-history-${index}`,
      });
    const boundedRestored = restoreSimulationState(
      JSON.parse(JSON.stringify(bounded)),
      71,
    );
    expect(boundedRestored.ledger).toHaveLength(80);
    expect(boundedRestored.career.evaluation).toEqual(
      bounded.career.evaluation,
    );
    expect(isStateValid(boundedRestored)).toBe(true);
  });

  it("pins saturated causal counters to sealed checkpoints and migrates valid legacy histories", () => {
    const seed = 72;
    let saturated = createInitialState(seed);
    for (let index = 0; index < 7; index += 1)
      saturated = applyCommand(saturated, {
        type: "SET_QUANTIZATION",
        profile: index % 2 === 0 ? "q8" : "q4",
      });
    for (let index = 0; index < 81; index += 1)
      saturated = applyCommand(saturated, {
        type: "CAPTURE_BASELINE",
        label: `checkpoint-history-${index}`,
      });

    expect(saturated.eventSequence).toBeGreaterThan(80);
    expect(saturated.ledger).toHaveLength(80);
    expect(saturated.career.runEnding).toBeNull();
    expect(saturated.causalEvidenceSnapshot).toMatchObject({
      eventSequence: saturated.eventSequence,
      evaluation: saturated.career.evaluation,
    });

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(saturated)),
      seed,
    );
    expect(restored.career.evaluation).toEqual(saturated.career.evaluation);
    expect(restored.causalEvidenceSnapshot).toMatchObject({
      eventSequence: restored.eventSequence,
      evaluation: restored.career.evaluation,
    });
    expect(isStateValid(restored)).toBe(true);

    const legacy = JSON.parse(JSON.stringify(saturated)) as Record<
      string,
      unknown
    >;
    delete legacy.causalEvidenceSnapshot;
    (legacy.integrity as { digest: string }).digest =
      legacyIntegrityDigest(legacy);
    const migratedLegacy = restoreSimulationState(legacy, seed);
    expect(migratedLegacy.career.evaluation).toEqual(
      saturated.career.evaluation,
    );
    expect(migratedLegacy.migration.steps).toContain(
      "schema-v7-causal-snapshot-added",
    );
    expect(isStateValid(migratedLegacy)).toBe(true);

    const forged = JSON.parse(JSON.stringify(saturated)) as Record<
      string,
      unknown
    >;
    const forgedCareer = forged.career as Record<string, unknown>;
    forgedCareer.unpaidCosts = 0.1;
    forgedCareer.evaluation = {
      ...(forgedCareer.evaluation as Record<string, unknown>),
      capitalCommitments: 3,
      hardwareDebt: 8,
      ignoredWarnings: 2,
      warnings: {
        ...(forgedCareer.evaluation as { warnings: Record<string, unknown> })
          .warnings,
        hardware: 2,
      },
    };
    (forged.causalEvidenceSnapshot as Record<string, unknown>).evaluation =
      JSON.parse(JSON.stringify(forgedCareer.evaluation));

    const recovered = restoreSimulationState(forged, seed);
    const advanced = applyCommand(recovered, {
      type: "RUN_PUBLIC_EVALUATION",
    });
    expect(recovered.career.evaluation).toEqual(
      createInitialState(seed).career.evaluation,
    );
    expect(recovered.migration.steps).toContain(
      "schema-v7-causal-ledger-repaired",
    );
    expect(advanced.career.runEnding).toBeNull();
    expect(getPostmortemEvent(advanced)).toBeNull();
  });

  it("proves diagnostics have zero flat production effect", () => {
    const base = createInitialState(63);
    const withDiagnostics = sealSimulationState({
      ...base,
      meta: {
        unlockedDiagnosticIds: [
          "leakage-warning",
          "shift-monitor",
          "bottleneck-map",
          "decision-history",
          "confidence-intervals",
        ],
        completedEndingIds: [],
        replayCount: 4,
      },
    });
    const baseNext = applyCommand(base, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 85,
    });
    const diagnosticNext = applyCommand(withDiagnostics, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 85,
    });

    expect(calculateMetrics(withDiagnostics)).toEqual(calculateMetrics(base));
    expect(diagnosticNext.metrics).toEqual(baseNext.metrics);
    expect(diagnosticNext.resources).toEqual(baseNext.resources);
    expect(diagnosticNext.career.evaluation).toEqual(
      baseNext.career.evaluation,
    );
  });

  // Coverage instrumentation can exceed Vitest's default 5s on CI. This
  // scoped budget preserves the complete deterministic 121-seed gate.
  it("passes the declared 121-seed balance sweep: endings reachable, avoidable, and non-dominant", () => {
    for (let seed = 1; seed <= 121; seed += 1) {
      const result = validateEvaluationReplay(seed);
      expect(result.allEndingsReachable).toBe(true);
      expect(result.noEndingUnavoidable).toBe(true);
      expect(result.noUniversallyDominantRoute).toBe(true);
      expect(result.materiallyDifferentResponses).toBe(true);
      expect(result.valid).toBe(true);
    }
  }, 20_000);
});

describe("evaluation/replay runtime boundary properties", () => {
  const commands = fc.oneof(
    fc.constant({ type: "RUN_PUBLIC_EVALUATION" } as const),
    fc.constant({ type: "RUN_PRIVATE_EVALUATION" } as const),
    fc.constant({ type: "CONCLUDE_INDEPENDENT_RUN" } as const),
    fc.constant({ type: "SET_QUANTIZATION", profile: "q4" } as const),
    fc.constant({ type: "SET_QUANTIZATION", profile: "q8" } as const),
    fc.record({
      type: fc.constant("SET_EVENING_ALLOCATION" as const),
      route: fc.constantFrom(
        "freelance",
        "competition",
        "product",
        "maintenance",
      ),
      hours: fc.constantFrom(0, 0.25, 1, 2, 4),
    }),
    fc.constant({ type: "RUN_EVENING" } as const),
  );

  it("keeps arbitrary command streams deterministic, valid, and causally bounded", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),
        fc.array(commands, { maxLength: 70 }),
        (seed, stream) => {
          const play = () =>
            stream.reduce(
              (state, command) =>
                applyCommand(state, command as SimulationCommand),
              createInitialState(seed),
            );
          const state = play();
          expect(play()).toEqual(state);
          expect(isStateValid(state)).toBe(true);
          expect(state.ledger.length).toBeLessThanOrEqual(80);
          if (state.career.runEnding) {
            const event = getPostmortemEvent(state);
            expect(event?.id).toBe(state.career.runEnding.eventId);
            expect(event?.causal).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("never throws or returns invalid state for arbitrary persisted JSON", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        let restored = createInitialState(64);
        expect(() => {
          restored = restoreSimulationState(value, 64);
        }).not.toThrow();
        expect(isStateValid(restored)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});
