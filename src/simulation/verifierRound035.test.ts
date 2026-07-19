import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  getPostmortemEvent,
  isStateValid,
  restoreSimulationState,
} from "./engine";
import type { SimulationState } from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function saturatedTutorialEnding(seed: number): SimulationState {
  let state = createInitialState(seed);
  while (state.eventSequence < 78)
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: `round-035-history-${state.eventSequence}`,
    });
  for (let index = 0; index < 8; index += 1)
    state = applyCommand(state, {
      type: "SET_QUANTIZATION",
      profile: index % 2 === 0 ? "q8" : "q4",
    });
  return state;
}

describe("verifier round 035: saturated ending integrity", () => {
  it("retains a sealed saturated ending but rejects a stale matching checkpoint forgery", () => {
    const seed = 35_001;
    const ended = saturatedTutorialEnding(seed);

    expect(ended.eventSequence).toBeGreaterThan(80);
    expect(ended.ledger).toHaveLength(80);
    expect(ended.career.runEnding?.id).toBe("tutorial-loop");
    expect(isStateValid(ended)).toBe(true);

    const trusted = restoreSimulationState(clone(ended), seed);
    expect(trusted.career.runEnding?.id).toBe("tutorial-loop");
    expect(getPostmortemEvent(trusted)?.causal).toBeDefined();
    expect(isStateValid(trusted)).toBe(true);

    const forged = clone(ended) as unknown as Record<string, unknown>;
    const career = forged.career as Record<string, unknown>;
    const evaluation = {
      ...(career.evaluation as Record<string, unknown>),
      capitalCommitments: 1,
      hardwareDebt: 1,
      warnings: {
        ...(career.evaluation as { warnings: Record<string, unknown> })
          .warnings,
        hardware: 1,
      },
    };
    career.evaluation = evaluation;
    (forged.causalEvidenceSnapshot as Record<string, unknown>).evaluation =
      clone(evaluation);

    const recovered = restoreSimulationState(forged, seed);
    const fresh = createInitialState(seed);
    expect(recovered.career.evaluation).toEqual(fresh.career.evaluation);
    expect(recovered.career.runEnding).toBeNull();
    expect(recovered.meta.completedEndingIds).not.toContain("tutorial-loop");
    expect(recovered.meta.unlockedDiagnosticIds).not.toContain(
      "decision-history",
    );
    expect(recovered.migration.steps).toContain(
      "schema-v7-causal-ledger-repaired",
    );
    expect(getPostmortemEvent(recovered)).toBeNull();
    expect(isStateValid(recovered)).toBe(true);
  });
});
