import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import { researchProjects } from "./researchCatalog";
import { isResearchStateShapeValid, researchTeamProfile } from "./research";
import type { SimulationState } from "./types";

function recognizedState(seed = 20260814): SimulationState {
  return sealSimulationState({
    ...createInitialState(seed),
    resources: {
      ...createInitialState(seed).resources,
      money: 8,
      reputation: 0.2,
    },
    jobs: { ...createInitialState(seed).jobs, completed: 1, paused: true },
  });
}

function prepareContext(state = recognizedState()): SimulationState {
  let next = applyCommand(state, {
    type: "SET_RESEARCH_GOAL",
    text: "Find the safest useful evidence",
  });
  next = applyCommand(next, {
    type: "INSPECT_RESEARCH_PROJECT",
    projectId: "context-reconstruction",
  });
  next = applyCommand(next, {
    type: "RECRUIT_RESEARCHER",
    researcherId: "mira-voss",
  });
  next = applyCommand(next, {
    type: "SET_RESEARCH_TEAM",
    researcherIds: ["mira-voss"],
  });
  return next;
}

describe("Research pipeline", () => {
  it("normal: inspects, commits, measures, and leaves a useful pending decision", () => {
    let state = prepareContext();
    expect(state.research.frontier.discoveredProjectIds).toContain(
      "evidence-weave",
    );
    state = applyCommand(state, {
      type: "START_RESEARCH",
      projectId: "context-reconstruction",
    });
    expect(state.research.activeProject?.projectId).toBe(
      "context-reconstruction",
    );
    const cashAfterCommit = state.resources.money;
    state = tick(state, 60);
    expect(state.research.activeProject).toBeNull();
    expect(state.research.lastOutcome?.projectId).toBe(
      "context-reconstruction",
    );
    expect(state.research.pendingDecision).toMatch(/Outcome:/);
    expect(state.research.institutionalKnowledge).toBeGreaterThan(0);
    expect(state.resources.money).toBe(cashAfterCommit);
    expect(isStateValid(state)).toBe(true);
  });

  it("adversarial: hidden, malformed, and unaffordable paths preserve state", () => {
    const state = recognizedState();
    const malformedGoal = applyCommand(state, {
      type: "SET_RESEARCH_GOAL",
      text: "no",
    });
    expect(malformedGoal.research.goal).toBeNull();
    expect(malformedGoal.resources.money).toBe(state.resources.money);
    const hidden = applyCommand(state, {
      type: "START_RESEARCH",
      projectId: "evidence-weave",
    });
    expect(hidden.research.activeProject).toBeNull();
    expect(hidden.resources.money).toBe(state.resources.money);
    const inspected = applyCommand(
      applyCommand(state, {
        type: "SET_RESEARCH_GOAL",
        text: "Find the safest useful evidence",
      }),
      { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
    );
    const locked = applyCommand(inspected, {
      type: "INSPECT_RESEARCH_PROJECT",
      projectId: "evidence-weave",
    });
    expect(locked.research.frontier.inspectedProjectIds).not.toContain(
      "evidence-weave",
    );
    const malformed = {
      ...state,
      research: { ...state.research, teamMemberIds: ["unknown"] },
    };
    const recovered = restoreSimulationState(malformed, state.seed);
    expect(recovered.research.teamMemberIds).toEqual([]);
    expect(recovered.resources.money).toBe(state.resources.money);
    expect(isStateValid(recovered)).toBe(true);
  });

  it("lifecycle: retained knowledge and migration survive departure/reload; offline policy does not run research", () => {
    let state = prepareContext();
    state = applyCommand(state, {
      type: "START_RESEARCH",
      projectId: "context-reconstruction",
    });
    const activeBeforeOffline = state.research.activeProject;
    state = applyCommand(state, {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });
    state = applyCommand(state, {
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    expect(state.research.activeProject?.elapsedHours).toBe(
      activeBeforeOffline?.elapsedHours,
    );
    state = tick(state, 60);
    const beforeRelease = state.research.tacitKnowledge["mira-voss"] ?? 0;
    state = applyCommand(state, {
      type: "RELEASE_RESEARCHER",
      researcherId: "mira-voss",
    });
    expect(state.research.retainedKnowledge).toBeGreaterThan(0);
    expect(state.research.tacitKnowledge["mira-voss"]).toBe(beforeRelease);
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    expect(restored.research.retainedKnowledge).toBe(
      state.research.retainedKnowledge,
    );
    expect(isStateValid(restored)).toBe(true);
  });

  it("determinism/property: fixed seeds keep outcome and every generated state valid", () => {
    const commandSequence = (seed: number) => {
      let state = prepareContext(recognizedState(seed));
      state = applyCommand(state, {
        type: "START_RESEARCH",
        projectId: "context-reconstruction",
      });
      return tick(state, 60);
    };
    expect(commandSequence(42).research.lastOutcome).toEqual(
      commandSequence(42).research.lastOutcome,
    );
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 0xffff_ffff }), (seed) => {
        const state = commandSequence(seed);
        expect(isStateValid(state)).toBe(true);
        expect(isResearchStateShapeValid(state.research)).toBe(true);
      }),
      { numRuns: 40 },
    );
    expect(
      researchProjects.every(
        (project) =>
          project.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0) >
          0,
      ),
    ).toBe(true);
    expect(
      researchTeamProfile(["mira-voss", "noor-adebayo"]).chemistry,
    ).toBeGreaterThan(0.45);
  });
});
