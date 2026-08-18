import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
} from "./engine";

function activeResearchState() {
  const initial = createInitialState(86001);
  let state = sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 8, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
  for (const command of [
    { type: "SET_RESEARCH_GOAL", text: "Validate temporal evidence" },
    {
      type: "INSPECT_RESEARCH_PROJECT",
      projectId: "context-reconstruction",
    },
    { type: "RECRUIT_RESEARCHER", researcherId: "mira-voss" },
    { type: "SET_RESEARCH_TEAM", researcherIds: ["mira-voss"] },
    { type: "START_RESEARCH", projectId: "context-reconstruction" },
  ] as const) {
    state = applyCommand(state, command);
  }
  return state;
}

describe("round 086 malformed Research temporal recovery", () => {
  it("does not restore a project or goal created after the current simulation tick", () => {
    const valid = activeResearchState();
    const malformed = JSON.parse(JSON.stringify(valid)) as typeof valid;
    malformed.research.goal!.createdAtTick = 1;
    malformed.research.activeProject!.startedAtTick = 1;

    const restored = restoreSimulationState(malformed, valid.seed);

    expect(restored).toEqual(createInitialState(valid.seed));
    expect(isStateValid(restored)).toBe(true);
  });
});
