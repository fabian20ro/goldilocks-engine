import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
} from "./engine";

function recognizedState() {
  const initial = createInitialState(87001);
  return sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 8, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
}

describe("round 087 Research restore adversaries", () => {
  it("does not trust forged frontier progress or researcher knowledge", () => {
    const valid = recognizedState();
    const malformed = JSON.parse(JSON.stringify(valid)) as typeof valid;
    malformed.research.frontier = {
      discoveredProjectIds: ["context-reconstruction", "negative-space"],
      inspectedProjectIds: ["context-reconstruction", "negative-space"],
      completedProjectIds: ["context-reconstruction"],
    };
    malformed.research.goal = {
      text: "Forged progression",
      createdAtTick: malformed.tick,
      status: "pending",
    };
    malformed.research.availableResearcherIds = [];
    malformed.research.recruitedResearcherIds = ["mira-voss"];
    malformed.research.teamMemberIds = ["mira-voss"];
    malformed.research.institutionalKnowledge = 1;

    const restored = restoreSimulationState(malformed, valid.seed);

    expect(restored.research.frontier.discoveredProjectIds).toEqual([
      "context-reconstruction",
    ]);
    expect(restored.research.frontier.inspectedProjectIds).toEqual([]);
    expect(restored.research.frontier.completedProjectIds).toEqual([]);
    expect(restored.research.goal).toBeNull();
    expect(restored.research.recruitedResearcherIds).toEqual([]);
    expect(restored.research.teamMemberIds).toEqual([]);
    expect(restored.research.institutionalKnowledge).toBe(0);
    expect(isStateValid(restored)).toBe(true);
  });

  it("does not turn a repeated signature action into free knowledge", () => {
    let state = sealSimulationState({
      ...recognizedState(),
      resources: { ...recognizedState().resources, money: 10, reputation: 0.6 },
    });
    for (const command of [
      { type: "SET_RESEARCH_GOAL", text: "Find durable evidence" },
      { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
      { type: "RECRUIT_RESEARCHER", researcherId: "orin-kade" },
      { type: "SET_RESEARCH_TEAM", researcherIds: ["orin-kade"] },
    ] as const)
      state = applyCommand(state, command);

    const once = applyCommand(state, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    const twice = applyCommand(once, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });

    expect(twice.research.firstPrinciplesUses).toBe(
      once.research.firstPrinciplesUses,
    );
    expect(twice.research.institutionalKnowledge).toBe(
      once.research.institutionalKnowledge,
    );
    expect(twice.research.tacitKnowledge).toEqual(once.research.tacitKnowledge);
    expect(isStateValid(twice)).toBe(true);
  });
});
