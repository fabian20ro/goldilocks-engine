import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  getPostmortemEvent,
  restoreSimulationState,
} from "./engine";

describe("verifier round 033: bounded causal-ledger recovery", () => {
  it("does not reseal forged causal counters after earlier events have been evicted", () => {
    const seed = 33_001;
    let state = createInitialState(seed);
    for (let index = 0; index < 81; index += 1)
      state = applyCommand(state, {
        type: "CAPTURE_BASELINE",
        label: `history-${index}`,
      });

    expect(state.eventSequence).toBeGreaterThan(80);
    expect(state.ledger).toHaveLength(80);
    expect(
      state.ledger.some((event) => /ignored .*warning/i.test(event.message)),
    ).toBe(false);

    const forged = JSON.parse(JSON.stringify(state));
    forged.career.evaluation = {
      ...forged.career.evaluation,
      modelSwitches: 8,
      ignoredWarnings: 2,
      warnings: {
        ...forged.career.evaluation.warnings,
        tutorial: 2,
      },
    };

    const restored = restoreSimulationState(forged, seed);
    const advanced = applyCommand(restored, {
      type: "RUN_PUBLIC_EVALUATION",
    });

    expect(restored.career.evaluation).toEqual(
      createInitialState(seed).career.evaluation,
    );
    expect(restored.migration.steps).toContain(
      "schema-v7-causal-ledger-repaired",
    );
    expect(advanced.career.runEnding).toBeNull();
    expect(getPostmortemEvent(advanced)).toBeNull();
  });
});
