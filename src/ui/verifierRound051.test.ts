import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
} from "../simulation/engine";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import {
  createCareerScheduleCommandBatch,
  replaceCareerScheduleHours,
} from "./careerScheduleDraft";

describe("verifier round 051 restored Career schedule boundary", () => {
  it("runs a revised valid restored schedule as one evening", () => {
    let state = createInitialState(51_058);
    state = applyCommand(state, {
      type: "SET_EVENING_ALLOCATION",
      route: "competition",
      hours: 4,
    });
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    const clearedCompetition = replaceCareerScheduleHours(
      restored.career.schedule.allocations,
      "competition",
      0,
    );
    const revisedDraft = replaceCareerScheduleHours(
      clearedCompetition,
      "freelance",
      4,
    );

    const completed = reduceWorkerRequest(restored, {
      type: "COMMAND_BATCH",
      commands: createCareerScheduleCommandBatch(revisedDraft),
    });

    expect(completed.career.schedule.completedEvenings).toBe(1);
    expect(completed.career.freelanceHours).toBe(4);
    expect(completed.career.schedule.allocations).toEqual({
      freelance: 0,
      competition: 0,
      product: 0,
      maintenance: 0,
    });
    expect(completed.ledger.at(-1)?.message).toMatch(/Evening 1 closed/);
  });
});
