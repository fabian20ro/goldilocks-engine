import {
  applyCommand,
  createInitialState,
  independentRunReadiness,
  isStateValid,
} from "./engine";
import type { CareerRoute, RunEndingId, SimulationState } from "./types";

export interface EvaluationScenarioResult {
  endingId: RunEndingId;
  reached: boolean;
  valid: boolean;
  responseRemainsViable: boolean;
  causalEvidenceRetained: boolean;
}

export interface EvaluationBalanceResult {
  seed: number;
  scenarios: readonly EvaluationScenarioResult[];
  allEndingsReachable: boolean;
  noEndingUnavoidable: boolean;
  noUniversallyDominantRoute: boolean;
  materiallyDifferentResponses: boolean;
  valid: boolean;
}

const ENDING_IDS: readonly RunEndingId[] = [
  "public-leaderboard-hero",
  "product-reliability-collapse",
  "hardware-debt-spiral",
  "tutorial-loop",
  "honest-independent-builder",
];

function evening(state: SimulationState, route: CareerRoute): SimulationState {
  return applyCommand(
    applyCommand(state, {
      type: "SET_EVENING_ALLOCATION",
      route,
      hours: 4,
    }),
    { type: "RUN_EVENING" },
  );
}

function competitionReady(state: SimulationState): SimulationState {
  let next = evening(state, "competition");
  next = evening(next, "competition");
  return next;
}

function productReleased(state: SimulationState): SimulationState {
  let next = evening(state, "product");
  next = evening(next, "product");
  return applyCommand(next, { type: "RELEASE_PRODUCT" });
}

function depositAllCash(state: SimulationState): SimulationState {
  return state.resources.money > 0
    ? applyCommand(state, {
        type: "DEPOSIT_SAVINGS",
        amount: state.resources.money,
      })
    : state;
}

function runPublicLeaderboardHero(seed: number): SimulationState {
  let state = competitionReady(createInitialState(seed));
  for (let index = 0; index < 3; index += 1)
    state = applyCommand(state, { type: "RUN_PUBLIC_EVALUATION" });
  return applyCommand(state, { type: "SUBMIT_COMPETITION" });
}

function runProductReliabilityCollapse(seed: number): SimulationState {
  let state = productReleased(createInitialState(seed));
  for (let index = 0; index < 8 && !state.career.runEnding; index += 1)
    state = evening(state, "product");
  return state;
}

function runHardwareDebtSpiral(seed: number): SimulationState {
  let state = createInitialState(seed);
  for (let index = 0; index < 4; index += 1)
    state = evening(state, "freelance");
  state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
  for (const moduleId of [
    "precision-cleaner",
    "trace-eval",
    "efficient-runtime",
    "resilient-delivery",
    "adaptive-context",
  ])
    state = applyCommand(state, { type: "BUY_MODULE", moduleId });
  state = depositAllCash(state);
  return evening(state, "competition");
}

function runTutorialLoop(seed: number): SimulationState {
  let state = createInitialState(seed);
  for (let index = 0; index < 8; index += 1) {
    state = applyCommand(state, {
      type: "SET_QUANTIZATION",
      profile: index % 2 === 0 ? "q8" : "q4",
    });
  }
  return state;
}

function runHonestIndependentBuilder(seed: number): SimulationState {
  let state = createInitialState(seed);
  state = competitionReady(state);
  state = applyCommand(state, { type: "SUBMIT_COMPETITION" });
  state = productReleased(state);
  for (let index = 0; index < 3; index += 1) state = evening(state, "product");
  state = competitionReady(state);
  state = applyCommand(state, { type: "SUBMIT_COMPETITION" });
  state = depositAllCash(state);
  state = applyCommand(state, { type: "WITHDRAW_SAVINGS", amount: 3 });
  for (let index = 0; index < 3; index += 1)
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
  if (!independentRunReadiness(state).ready) return state;
  return applyCommand(state, { type: "CONCLUDE_INDEPENDENT_RUN" });
}

function runCautiousPlan(seed: number): SimulationState {
  let state = createInitialState(seed);
  state = evening(state, "freelance");
  state = evening(state, "freelance");
  for (let index = 0; index < 2; index += 1)
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
  state = evening(state, "competition");
  state = evening(state, "product");
  state = evening(state, "maintenance");
  return state;
}

/** Different preventative routes for each ending; all remain operable. */
function responseStates(seed: number): readonly SimulationState[] {
  let leaderboard = evening(createInitialState(seed), "freelance");
  for (let index = 0; index < 3; index += 1)
    leaderboard = applyCommand(leaderboard, { type: "RUN_PRIVATE_EVALUATION" });
  leaderboard = competitionReady(leaderboard);
  for (let index = 0; index < 3; index += 1)
    leaderboard = applyCommand(leaderboard, { type: "RUN_PUBLIC_EVALUATION" });
  leaderboard = applyCommand(leaderboard, { type: "SUBMIT_COMPETITION" });

  let reliability = productReleased(createInitialState(seed));
  reliability = evening(reliability, "product");
  reliability = evening(reliability, "product");
  reliability = evening(reliability, "freelance");
  for (let index = 0; index < 3; index += 1)
    reliability = applyCommand(reliability, { type: "RUN_PRIVATE_EVALUATION" });
  reliability = evening(reliability, "maintenance");

  let hardware = createInitialState(seed);
  for (let index = 0; index < 4; index += 1)
    hardware = evening(hardware, "freelance");
  hardware = applyCommand(hardware, { type: "RUN_PRIVATE_EVALUATION" });

  let tutorial = createInitialState(seed);
  tutorial = applyCommand(tutorial, {
    type: "SET_QUANTIZATION",
    profile: "q8",
  });
  tutorial = applyCommand(tutorial, {
    type: "SET_QUANTIZATION",
    profile: "q4",
  });
  tutorial = productReleased(tutorial);

  return [leaderboard, reliability, hardware, tutorial];
}

export function runEndingScenario(
  seed: number,
  endingId: RunEndingId,
): SimulationState {
  switch (endingId) {
    case "public-leaderboard-hero":
      return runPublicLeaderboardHero(seed);
    case "product-reliability-collapse":
      return runProductReliabilityCollapse(seed);
    case "hardware-debt-spiral":
      return runHardwareDebtSpiral(seed);
    case "tutorial-loop":
      return runTutorialLoop(seed);
    case "honest-independent-builder":
      return runHonestIndependentBuilder(seed);
  }
}

/**
 * Deterministic Monte Carlo-style seed sweep for D-011. It demonstrates that
 * every ending has a command-reachable scenario, a cautious plan is not forced
 * into an ending, and prevention needs distinct viable responses.
 */
export function validateEvaluationReplay(
  seed: number,
): EvaluationBalanceResult {
  const responses = responseStates(seed);
  const responsesRemainViable = responses.every(
    (response) => isStateValid(response) && response.career.runEnding === null,
  );
  const scenarios = ENDING_IDS.map((endingId) => {
    const state = runEndingScenario(seed, endingId);
    const ending = state.career.runEnding;
    const event = ending
      ? state.ledger.find((entry) => entry.id === ending.eventId)
      : undefined;
    return {
      endingId,
      reached: ending?.id === endingId,
      valid: isStateValid(state),
      responseRemainsViable: responsesRemainViable,
      causalEvidenceRetained:
        event?.causal !== undefined &&
        ending !== null &&
        state.ledger.some((entry) => entry.id === ending?.eventId),
    } satisfies EvaluationScenarioResult;
  });
  const cautious = runCautiousPlan(seed);
  const materiallyDifferentResponses =
    new Set(
      responses.map((state) =>
        JSON.stringify({
          public: state.career.evaluation.publicEvaluations,
          private: state.career.evaluation.privateEvaluations,
          maintenance: state.career.product.maintenanceHours,
          commitments: state.career.evaluation.capitalCommitments,
          switches: state.career.evaluation.modelSwitches,
          released: state.career.product.released,
        }),
      ),
    ).size === responses.length;
  return {
    seed,
    scenarios,
    allEndingsReachable: scenarios.every((scenario) => scenario.reached),
    noEndingUnavoidable:
      cautious.career.runEnding === null && isStateValid(cautious),
    noUniversallyDominantRoute:
      responsesRemainViable && materiallyDifferentResponses,
    materiallyDifferentResponses,
    valid: scenarios.every(
      (scenario) =>
        scenario.valid &&
        scenario.causalEvidenceRetained &&
        scenario.responseRemainsViable,
    ),
  };
}
