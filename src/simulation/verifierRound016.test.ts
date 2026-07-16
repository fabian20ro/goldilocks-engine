import { describe, expect, it } from "vitest";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  tick,
} from "./engine";

describe("verifier round 016 settlement boundaries", () => {
  it("does not relabel an unaffordable configured operating cost as zero actual cost", () => {
    let state = createInitialState(1622);
    for (const slotId of ["prepare", "runtime", "verify"])
      state = applyCommand(state, { type: "REMOVE_MODULE", slotId });

    const configuredCost = calculateMetrics(state).operatingCost;
    expect(configuredCost).toBeGreaterThan(0);
    expect(state.resources.money).toBe(0);

    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    for (let minute = 0; minute < 25 && state.jobs.queued > 0; minute += 1)
      state = tick(state, 60);

    expect(state.lastSettlement?.failed).toBe(1);
    expect(state.lastSettlement?.grossPayout).toBe(0);
    expect(state.lastSettlement?.operatingCost).toBe(configuredCost);
  });
});
