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
