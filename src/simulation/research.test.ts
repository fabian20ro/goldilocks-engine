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

function prepareOrinContext(): SimulationState {
  const base = recognizedState();
  let next = sealSimulationState({
    ...base,
    resources: { ...base.resources, money: 10, reputation: 0.6 },
  });
  for (const command of [
    { type: "SET_RESEARCH_GOAL", text: "Find durable evidence" },
    { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
    { type: "RECRUIT_RESEARCHER", researcherId: "orin-kade" },
    { type: "SET_RESEARCH_TEAM", researcherIds: ["orin-kade"] },
  ] as const)
    next = applyCommand(next, command);
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
    const restoredActive = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    expect(restoredActive.research.activeProject).toEqual(
      state.research.activeProject,
    );
    expect(restoredActive.research.goal?.text).toBe(state.research.goal?.text);
    expect(restoredActive.research.goal?.createdAtTick).toBeLessThanOrEqual(
      restoredActive.tick,
    );
    expect(
      restoredActive.research.activeProject?.startedAtTick,
    ).toBeLessThanOrEqual(restoredActive.tick);
    expect(isStateValid(restoredActive)).toBe(true);
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
    const restoredCompleted = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    expect(restoredCompleted.research).toEqual(state.research);
    expect(isStateValid(restoredCompleted)).toBe(true);
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
    let active = prepareContext();
    active = applyCommand(active, {
      type: "START_RESEARCH",
      projectId: "context-reconstruction",
    });
    const malformedActive = JSON.parse(
      JSON.stringify(active),
    ) as SimulationState;
    malformedActive.research.goal = null;
    const recoveredActive = restoreSimulationState(
      malformedActive,
      active.seed,
    );
    expect(recoveredActive.research.activeProject).toBeNull();
    expect(recoveredActive.research.goal).toBeNull();
    expect(recoveredActive.research.teamMemberIds).toEqual([]);
    expect(recoveredActive.resources.money).toBe(active.resources.money);
    expect(isStateValid(recoveredActive)).toBe(true);
    const malformed = {
      ...state,
      research: { ...state.research, teamMemberIds: ["unknown"] },
    };
    const recovered = restoreSimulationState(malformed, state.seed);
    expect(recovered.research.teamMemberIds).toEqual([]);
    expect(recovered.resources.money).toBe(state.resources.money);
    expect(isStateValid(recovered)).toBe(true);
  });

  it("adversarial: forged frontier and knowledge clear, then offline recovery remains usable", () => {
    const state = recognizedState();
    const malformed = JSON.parse(JSON.stringify(state)) as SimulationState;
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

    const recovered = restoreSimulationState(malformed, state.seed);
    expect(recovered.research.frontier).toEqual({
      discoveredProjectIds: ["context-reconstruction"],
      inspectedProjectIds: [],
      completedProjectIds: [],
    });
    expect(recovered.research.goal).toBeNull();
    expect(recovered.research.availableResearcherIds).toEqual(["mira-voss"]);
    expect(recovered.research.recruitedResearcherIds).toEqual([]);
    expect(recovered.research.teamMemberIds).toEqual([]);
    expect(recovered.research.institutionalKnowledge).toBe(0);

    const offlineConfigured = applyCommand(recovered, {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });
    const resumed = applyCommand(offlineConfigured, {
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    expect(resumed.research.frontier).toEqual(recovered.research.frontier);
    expect(isStateValid(resumed)).toBe(true);
  });

  it("adversarial: future-dated goals and projects clear on restore", () => {
    let active = prepareContext();
    active = applyCommand(active, {
      type: "START_RESEARCH",
      projectId: "context-reconstruction",
    });
    const malformed = JSON.parse(JSON.stringify(active)) as SimulationState;
    malformed.research.goal!.createdAtTick = malformed.tick + 1;
    malformed.research.activeProject!.startedAtTick = malformed.tick + 1;

    const recovered = restoreSimulationState(malformed, active.seed);

    expect(recovered.research.activeProject).toBeNull();
    expect(recovered.research.goal).toBeNull();
    expect(recovered.research.teamMemberIds).toEqual([]);
    expect(recovered.resources.money).toBe(active.resources.money);
    expect(isStateValid(recovered)).toBe(true);
  });

  it("lifecycle: retained knowledge and migration survive departure/reload; offline policy does not run research", () => {
    let state = prepareContext();
    state = applyCommand(state, {
      type: "START_RESEARCH",
      projectId: "context-reconstruction",
    });
    const restoredWhileActive = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    expect(restoredWhileActive.research.activeProject).toEqual(
      state.research.activeProject,
    );
    expect(restoredWhileActive.research.goal).not.toBeNull();
    expect(isStateValid(restoredWhileActive)).toBe(true);
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
    expect(state.research.goal?.createdAtTick).toBeLessThanOrEqual(state.tick);
    if (state.research.activeProject !== null)
      expect(state.research.activeProject.startedAtTick).toBeLessThanOrEqual(
        state.tick,
      );
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

  it("normal: First-Principles Reconstruction is available once to its authorized team", () => {
    const state = prepareOrinContext();
    const once = applyCommand(state, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });

    expect(once.research.firstPrinciplesUses).toBe(1);
    expect(once.research.institutionalKnowledge).toBe(0.3);
    expect(once.research.tacitKnowledge["orin-kade"]).toBeGreaterThan(0);
    expect(once.research.strategicOptionIds).toContain("reconstruction-plan");
    expect(isStateValid(once)).toBe(true);
  });

  it("adversarial: replay and missing authority cannot accumulate signature knowledge", () => {
    const authorized = prepareOrinContext();
    const once = applyCommand(authorized, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    const replayed = applyCommand(once, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    expect(replayed.research).toEqual(once.research);

    const unauthorized = prepareContext();
    const rejected = applyCommand(unauthorized, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    expect(rejected.research).toEqual(unauthorized.research);
    expect(isStateValid(replayed)).toBe(true);
    expect(isStateValid(rejected)).toBe(true);
  });

  it("lifecycle: the signature bound survives reload and researcher departure", () => {
    const once = applyCommand(prepareOrinContext(), {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(once)),
      once.seed,
    );
    expect(restored.research).toEqual(once.research);

    const released = applyCommand(restored, {
      type: "RELEASE_RESEARCHER",
      researcherId: "orin-kade",
    });
    expect(released.research.retainedKnowledge).toBeGreaterThan(0);
    const replayedAfterDeparture = applyCommand(released, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    expect(replayedAfterDeparture.research).toEqual(released.research);
    expect(isStateValid(replayedAfterDeparture)).toBe(true);
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
