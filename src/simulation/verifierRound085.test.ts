import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
} from "./engine";

function activeResearchState() {
  const initial = createInitialState(85001);
  let state = sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 8, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
  for (const command of [
    { type: "SET_RESEARCH_GOAL", text: "Find robust evidence" },
    { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
    { type: "RECRUIT_RESEARCHER", researcherId: "mira-voss" },
    { type: "SET_RESEARCH_TEAM", researcherIds: ["mira-voss"] },
    { type: "START_RESEARCH", projectId: "context-reconstruction" },
  ] as const) {
    state = applyCommand(state, command);
  }
  return state;
}

describe("round 085 malformed Research recovery", () => {
  it("does not restore an active project when its required goal is absent", () => {
    const valid = activeResearchState();
    const malformed = JSON.parse(JSON.stringify(valid)) as typeof valid;
    malformed.research.goal = null;

    const restored = restoreSimulationState(malformed, valid.seed);

    expect(restored.research.activeProject).toBeNull();
    expect(restored.research.goal).toBeNull();
    expect(restored.research.teamMemberIds).toEqual([]);
    expect(restored.resources.money).toBe(valid.resources.money);
    expect(isStateValid(restored)).toBe(true);
  });
});
