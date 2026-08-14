import {
  applyCommand,
  createInitialState,
  isStateValid,
  sealSimulationState,
  tick,
} from "./engine";
import {
  creatorCoverageFit,
  creators,
  narrativeTemplates,
} from "./hypeFearCatalog";
import type { SimulationState } from "./types";

export interface HypeFearBalanceResult {
  seed: number;
  recognized: boolean;
  boundedAttention: boolean;
  durableStakeholders: boolean;
  responseRecovery: boolean;
  fearFeed: boolean;
  creatorSelection: boolean;
  deterministic: boolean;
  lifecycleValid: boolean;
  valid: boolean;
}

function recognizedState(seed: number): SimulationState {
  const initial = createInitialState(seed);
  return sealSimulationState({
    ...initial,
    resources: { ...initial.resources, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
}

function advanceToDeadline(state: SimulationState): SimulationState {
  const narrative = state.hypeFear.activeNarrativeId
    ? state.hypeFear.narratives.find(
        (item) => item.id === state.hypeFear.activeNarrativeId,
      )
    : null;
  if (!narrative) return state;
  const seconds = Math.max(0, (narrative.deadlineTick - state.tick + 1) / 1000);
  let next = state;
  let remaining = seconds;
  while (remaining > 0) {
    const quantum = Math.min(60, remaining);
    next = tick(next, quantum);
    remaining -= quantum;
  }
  return next;
}

function firstLoop(seed: number): SimulationState {
  let state = recognizedState(seed);
  state = applyCommand(state, {
    type: "CAPTURE_BASELINE",
    label: "recognition",
  });
  const first = state.hypeFear.narratives[0];
  if (!first) return state;
  state = applyCommand(state, {
    type: "COVER_NARRATIVE",
    narrativeId: first.id,
    creatorId: first.sourceArchetypeId,
  });
  state = applyCommand(state, {
    type: "PUBLISH_PREDICTION",
    narrativeId: first.id,
    prediction: "partial",
    confidence: 0.5,
  });
  return advanceToDeadline(state);
}

function creatorSelectionIsBounded(): boolean {
  const sourceFits = narrativeTemplates.every((template) => {
    const source = creators.find(
      (creator) => creator.id === template.sourceArchetypeId,
    );
    return source ? creatorCoverageFit(source, template).eligible : false;
  });
  const coverageCounts = creators.map(
    (creator) =>
      narrativeTemplates.filter(
        (template) => creatorCoverageFit(creator, template).eligible,
      ).length,
  );
  return (
    sourceFits &&
    coverageCounts.every((count) => count < narrativeTemplates.length)
  );
}

export function runHypeFearScenario(seed: number): HypeFearBalanceResult {
  const before = recognizedState(seed);
  const resolved = firstLoop(seed);
  const pending = resolved.hypeFear.pendingResponse;
  const debtBeforeResponse = resolved.hypeFear.expectationDebt;
  const escalationBeforeResponse =
    resolved.hypeFear.stakeholderSelection.escalationSeekers;
  const afterResponse = pending
    ? applyCommand(resolved, {
        type: "RESPOND_TO_NARRATIVE",
        response: "publish-evidence",
      })
    : resolved;
  const next = afterResponse.hypeFear.activeNarrativeId
    ? afterResponse.hypeFear.narratives.find(
        (item) => item.id === afterResponse.hypeFear.activeNarrativeId,
      )
    : null;

  let fearState = afterResponse;
  if (next) {
    fearState = applyCommand(fearState, {
      type: "COVER_NARRATIVE",
      narrativeId: next.id,
      creatorId: next.sourceArchetypeId,
    });
    fearState = applyCommand(fearState, {
      type: "PUBLISH_PREDICTION",
      narrativeId: next.id,
      prediction: "delayed",
      confidence: 0.35,
    });
    fearState = advanceToDeadline(fearState);
  }
  const fearPending = fearState.hypeFear.pendingResponse;
  const fearRecovered = fearPending
    ? applyCommand(fearState, {
        type: "RESPOND_TO_FEAR",
        response: "publish-boundaries",
      })
    : fearState;

  const deterministic =
    JSON.stringify(firstLoop(seed)) === JSON.stringify(firstLoop(seed));
  const restored = sealSimulationState(
    JSON.parse(JSON.stringify(fearRecovered)) as SimulationState,
  );
  const malformed = applyCommand(fearRecovered, {
    type: "COVER_NARRATIVE",
    narrativeId: "unknown",
    creatorId: "skeptic",
  });

  return {
    seed,
    recognized: resolved.hypeFear.unlocked,
    boundedAttention:
      resolved.hypeFear.attention <= 100 &&
      resolved.hypeFear.attentionOnlyActions <= narrativeTemplates.length,
    durableStakeholders:
      escalationBeforeResponse > 0 &&
      debtBeforeResponse > 0 &&
      afterResponse.hypeFear.stakeholderSelection.patientPartners > 0,
    responseRecovery:
      next !== null &&
      afterResponse.hypeFear.pendingResponse === null &&
      afterResponse.hypeFear.expectationDebt < debtBeforeResponse,
    fearFeed:
      fearPending !== null &&
      fearState.hypeFear.doomFeed.some((entry) => entry.responseRequired) &&
      fearRecovered.hypeFear.fear < fearState.hypeFear.fear,
    creatorSelection: creatorSelectionIsBounded(),
    deterministic,
    lifecycleValid:
      isStateValid(restored) &&
      malformed.hypeFear.expectationDebt ===
        fearRecovered.hypeFear.expectationDebt,
    valid: isStateValid(fearRecovered) && isStateValid(before),
  };
}

export function validateHypeFearBalance(seed: number): boolean {
  const result = runHypeFearScenario(seed);
  return (
    result.recognized &&
    result.boundedAttention &&
    result.durableStakeholders &&
    result.responseRecovery &&
    result.fearFeed &&
    result.creatorSelection &&
    result.deterministic &&
    result.lifecycleValid &&
    result.valid
  );
}
