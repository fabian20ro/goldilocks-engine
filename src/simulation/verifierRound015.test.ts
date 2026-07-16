import { describe, expect, it } from "vitest";
import { getWorkload } from "./catalog";
import { applyCommand, calculateMetrics, createInitialState } from "./engine";

describe("verifier round 015 market boundaries", () => {
  it("makes saturated single-workload farming nonpositive even with valid bypassed positions", () => {
    let state = createInitialState(1519);
    for (const slotId of ["prepare", "runtime", "verify"])
      state = applyCommand(state, { type: "REMOVE_MODULE", slotId });

    const workload = getWorkload("interactive-chat");
    const metrics = calculateMetrics(state);
    expect(metrics.orderWarnings).toContain("no model stage");

    const expectedMarginAtDemandFloor =
      workload.minimumQuote * metrics.reliability - metrics.operatingCost;
    expect(expectedMarginAtDemandFloor).toBeLessThanOrEqual(0);
  });
});
