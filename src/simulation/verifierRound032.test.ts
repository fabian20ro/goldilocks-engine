import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  getPostmortemEvent,
  isStateValid,
  restoreSimulationState,
} from "./engine";

describe("verifier round 032: semantic evaluation-save recovery", () => {
  it("keeps evidence produced by an actual paid private evaluation", () => {
    let state = createInitialState(32_001);
    state = applyCommand(state, { type: "WITHDRAW_SAVINGS", amount: 1 });
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      32_001,
    );

    expect(restored.career.evaluation).toEqual(state.career.evaluation);
    expect(isStateValid(restored)).toBe(true);
  });

  it("does not reseal a one-sample record that claims impossible private coverage", () => {
    const initial = createInitialState(32_002);
    const forged = JSON.parse(JSON.stringify(initial)) as Record<
      string,
      unknown
    >;
    const career = forged.career as Record<string, unknown>;
    career.evaluation = {
      ...(career.evaluation as Record<string, unknown>),
      privateAssessment: "credible",
      privateEvaluations: 1,
      evaluationSpend: 0.75,
      // A private evaluation adds at most 50% coverage from a zero-coverage run.
      coverage: 0.9,
    };

    const restored = restoreSimulationState(forged, 32_002);

    expect(restored.career.evaluation).toEqual(initial.career.evaluation);
    expect(restored.migration.steps).toEqual([]);
    expect(isStateValid(restored)).toBe(true);
  });

  it("does not let unrecorded warning counters manufacture a causal ending", () => {
    const initial = createInitialState(32_003);
    const forged = JSON.parse(JSON.stringify(initial)) as Record<
      string,
      unknown
    >;
    const career = forged.career as Record<string, unknown>;
    career.evaluation = {
      ...(career.evaluation as Record<string, unknown>),
      modelSwitches: 8,
      ignoredWarnings: 2,
      warnings: {
        ...(career.evaluation as { warnings: Record<string, unknown> })
          .warnings,
        tutorial: 2,
      },
    };

    const restored = restoreSimulationState(forged, 32_003);
    const advanced = applyCommand(restored, { type: "RUN_PUBLIC_EVALUATION" });

    expect(restored.career.evaluation).toEqual(initial.career.evaluation);
    expect(advanced.career.runEnding).toBeNull();
    expect(getPostmortemEvent(advanced)).toBeNull();
    expect(isStateValid(advanced)).toBe(true);
  });
});
