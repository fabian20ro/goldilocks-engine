import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
} from "./engine";
import { createInitialResearchState } from "./research";
import type { SimulationState } from "./types";

function recognizedState(seed = 88001): SimulationState {
  const initial = createInitialState(seed);
  return sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 10, reputation: 0.6 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
}

function prepareOrinContext(state = recognizedState()): SimulationState {
  let next = state;
  for (const command of [
    { type: "SET_RESEARCH_GOAL", text: "Find durable evidence" },
    { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
    { type: "RECRUIT_RESEARCHER", researcherId: "orin-kade" },
    { type: "SET_RESEARCH_TEAM", researcherIds: ["orin-kade"] },
  ] as const)
    next = applyCommand(next, command);
  return next;
}

describe("round 088 Research trust and lifecycle adversaries", () => {
  it("preserves sealed progression but clears it after an unrelated stale edit", () => {
    const authorized = applyCommand(prepareOrinContext(), {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    const sealedReload = restoreSimulationState(
      JSON.parse(JSON.stringify(authorized)),
      authorized.seed,
    );

    expect(sealedReload.research).toEqual(authorized.research);
    expect(isStateValid(sealedReload)).toBe(true);

    const stale = JSON.parse(JSON.stringify(authorized)) as SimulationState;
    stale.resources.money += 0.001;
    const recovered = restoreSimulationState(stale, authorized.seed);

    expect(recovered.research).toEqual(createInitialResearchState());
    expect(recovered.research.firstPrinciplesUses).toBe(0);
    expect(recovered.research.activeProject).toBeNull();
    expect(isStateValid(recovered)).toBe(true);

    const offlineConfigured = applyCommand(recovered, {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });
    const offline = applyCommand(offlineConfigured, {
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    expect(offline.research).toEqual(recovered.research);
    expect(isStateValid(offline)).toBe(true);
  });

  it("rejects shape-valid forged progression and active work at the stale boundary", () => {
    const forged = JSON.parse(
      JSON.stringify(recognizedState()),
    ) as SimulationState;
    forged.research.frontier = {
      discoveredProjectIds: ["context-reconstruction", "negative-space"],
      inspectedProjectIds: ["context-reconstruction", "negative-space"],
      completedProjectIds: ["context-reconstruction"],
    };
    forged.research.goal = {
      text: "Forged progression",
      createdAtTick: forged.tick,
      status: "pending",
    };
    forged.research.availableResearcherIds = [];
    forged.research.recruitedResearcherIds = ["mira-voss"];
    forged.research.teamMemberIds = ["mira-voss"];
    forged.research.institutionalKnowledge = 1;
    forged.research.activeProject = {
      projectId: "context-reconstruction",
      startedAtTick: forged.tick,
      elapsedHours: 0,
      expectedDurationHours: 0.5,
      committedCost: 0.4,
    };

    const recovered = restoreSimulationState(forged, forged.seed);

    expect(recovered.research).toEqual(createInitialResearchState());
    expect(recovered.research.frontier.discoveredProjectIds).toEqual([
      "context-reconstruction",
    ]);
    expect(recovered.research.activeProject).toBeNull();
    expect(recovered.research.goal).toBeNull();
    expect(isStateValid(recovered)).toBe(true);
  });

  it("bounds the signature across replay, departure, reload, and reset", () => {
    const authorized = prepareOrinContext();
    const once = applyCommand(authorized, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });
    const replay = applyCommand(once, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });

    expect(once.research.firstPrinciplesUses).toBe(1);
    expect(replay.research).toEqual(once.research);
    expect(replay.ledger.at(-1)?.message).toMatch(/already retained/i);

    const reloaded = restoreSimulationState(
      JSON.parse(JSON.stringify(once)),
      once.seed,
    );
    const released = applyCommand(reloaded, {
      type: "RELEASE_RESEARCHER",
      researcherId: "orin-kade",
    });
    const replayAfterDeparture = applyCommand(released, {
      type: "FIRST_PRINCIPLES_RECONSTRUCTION",
    });

    expect(reloaded.research).toEqual(once.research);
    expect(replayAfterDeparture.research).toEqual(released.research);
    expect(replayAfterDeparture.ledger.at(-1)?.message).toMatch(
      /recruit and add orin/i,
    );
    expect(isStateValid(replayAfterDeparture)).toBe(true);

    const reset = applyCommand(replayAfterDeparture, { type: "RESET" });
    expect(reset.research).toEqual(createInitialResearchState());
    expect(isStateValid(reset)).toBe(true);
  });
});
