import {
  applyCommand,
  createInitialState,
  isStateValid,
  sealSimulationState,
  tick,
} from "./engine";
import type { SimulationState } from "./types";

/**
 * Established local-lab fixture for deterministic balance and acceptance
 * checks. Production startup never skips into this state; it is deliberately
 * explicit so a verifier can replay the endgame without UI-specific setup.
 */
export function createLaboratoryBalanceState(seed: number): SimulationState {
  const initial = createInitialState(seed);
  return sealSimulationState({
    ...initial,
    resources: { ...initial.resources, money: 100 },
    research: {
      ...initial.research,
      recruitedResearcherIds: ["orin-kade"],
    },
    laboratory: {
      ...initial.laboratory,
      unlocked: true,
      unlockedAtTick: 0,
      scenarioUnlockIds: ["limited-hardware"],
      scenarioProgress: {
        ...initial.laboratory.scenarioProgress,
        "limited-hardware": 1,
      },
    },
  });
}

export function prepareLaboratoryBalanceRun(seed: number): SimulationState {
  let state = createLaboratoryBalanceState(seed);
  state = applyCommand(state, {
    type: "BUY_LAB_MACHINE",
    machineId: "parallel-rack",
  });
  state = applyCommand(state, {
    type: "ADD_LAB_PIPELINE",
    pipelineId: "research",
  });
  state = applyCommand(state, {
    type: "ASSIGN_LAB_MACHINE",
    pipelineId: "research",
    machineId: "parallel-rack",
  });
  state = applyCommand(state, {
    type: "INVITE_LAB_COLLABORATOR",
    researcherId: "orin-kade",
  });
  state = applyCommand(state, {
    type: "SET_LAB_CULTURE",
    cultureId: "evidence-first",
  });
  for (const field of [
    "versionedConfigs",
    "lockedSeeds",
    "independentEvaluation",
  ] as const)
    state = applyCommand(state, {
      type: "SET_LAB_REPRODUCIBILITY",
      field,
      enabled: true,
    });
  state = applyCommand(state, { type: "DOCUMENT_LAB_RUN" });
  state = applyCommand(state, {
    type: "QUEUE_LAB_RUN",
    pipelineId: "research",
  });
  return tick(state, 60);
}

export function runLaboratoryBalance(seed: number): SimulationState {
  let state = prepareLaboratoryBalanceRun(seed);
  state = applyCommand(state, {
    type: "FOUND_LAB",
    decision: "independent-laboratory",
  });
  return state;
}

export function laboratoryBalanceSummary(seedCount = 24) {
  const runs = Array.from({ length: seedCount }, (_, index) =>
    runLaboratoryBalance(20260715 + index),
  );
  return {
    seedCount,
    validRuns: runs.filter(isStateValid).length,
    completedRuns: runs.filter((state) => state.laboratory.lastRun !== null)
      .length,
    endings: runs.filter((state) => state.career.runEnding !== null).length,
    passedExperiments: runs.filter(
      (state) => state.laboratory.lastRun?.completed,
    ).length,
  };
}
