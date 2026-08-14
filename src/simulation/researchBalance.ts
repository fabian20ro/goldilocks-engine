import {
  applyCommand,
  createInitialState,
  isStateValid,
  sealSimulationState,
  tick,
} from "./engine";
import { researchProjects } from "./researchCatalog";
import type { ResearchOutcomeKind, SimulationState } from "./types";

export interface ResearchBalanceResult {
  seed: number;
  frontierReveals: boolean;
  prerequisiteGate: boolean;
  usefulOutcome: boolean;
  lifecycleRetention: boolean;
  offlineSafe: boolean;
  valid: boolean;
  outcomeKind: ResearchOutcomeKind | null;
}

function recognizedState(seed: number): SimulationState {
  const initial = createInitialState(seed);
  return sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 8, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
}

export function runResearchScenario(seed: number): ResearchBalanceResult {
  let state = recognizedState(seed);
  state = applyCommand(state, {
    type: "SET_RESEARCH_GOAL",
    text: "Find the safest useful evidence",
  });
  state = applyCommand(state, {
    type: "INSPECT_RESEARCH_PROJECT",
    projectId: "context-reconstruction",
  });
  const discovered =
    state.research.frontier.discoveredProjectIds.includes("evidence-weave");
  const beforeLockedInspect =
    state.research.frontier.inspectedProjectIds.length;
  state = applyCommand(state, {
    type: "INSPECT_RESEARCH_PROJECT",
    projectId: "evidence-weave",
  });
  const prerequisiteGate =
    state.research.frontier.inspectedProjectIds.length === beforeLockedInspect;
  state = applyCommand(state, {
    type: "RECRUIT_RESEARCHER",
    researcherId: "mira-voss",
  });
  state = applyCommand(state, {
    type: "SET_RESEARCH_TEAM",
    researcherIds: ["mira-voss"],
  });
  state = applyCommand(state, {
    type: "START_RESEARCH",
    projectId: "context-reconstruction",
  });
  const beforeOffline = state.research.activeProject?.elapsedHours ?? -1;
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
  const offlineSafe =
    (state.research.activeProject?.elapsedHours ?? -1) === beforeOffline;
  state = tick(state, 60);
  const outcome = state.research.lastOutcome;
  const tacit = state.research.tacitKnowledge["mira-voss"] ?? 0;
  state = applyCommand(state, {
    type: "RELEASE_RESEARCHER",
    researcherId: "mira-voss",
  });
  return {
    seed,
    frontierReveals: discovered,
    prerequisiteGate,
    usefulOutcome:
      outcome !== null &&
      outcome.knowledgeGained > 0 &&
      outcome.summary.length > 0,
    lifecycleRetention:
      state.research.retainedKnowledge > 0 &&
      state.research.tacitKnowledge["mira-voss"] === tacit,
    offlineSafe,
    valid: isStateValid(state),
    outcomeKind: outcome?.kind ?? null,
  };
}

export function validateResearchBalance(seed: number): boolean {
  const result = runResearchScenario(seed);
  return (
    result.frontierReveals &&
    result.prerequisiteGate &&
    result.usefulOutcome &&
    result.lifecycleRetention &&
    result.offlineSafe &&
    result.valid
  );
}

export function researchCatalogBalance(): boolean {
  return researchProjects.every(
    (project) =>
      project.outcomes.length >= 3 &&
      project.outcomes.every(
        (outcome) =>
          outcome.weight > 0 &&
          outcome.knowledgeGained > 0 &&
          outcome.summary.length > 0,
      ),
  );
}
