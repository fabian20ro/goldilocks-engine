import { getModule } from "./catalog";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  estimateWorkloadOffer,
  getWorkloadQuote,
  isStateValid,
  tick,
} from "./engine";
import type { SimulationState } from "./types";

export interface RouteForecast {
  workloadId: string;
  count: number;
  firstQuote: number;
  finalQuote: number;
  expectedNet: number;
  reliability: number;
}

export interface FirstSessionBalanceResult {
  seed: number;
  safeRoute: RouteForecast;
  riskyRoute: RouteForecast;
  chatQueueTen: RouteForecast;
  chatGuidedFour: RouteForecast;
  batchQueueTen: RouteForecast;
  batchGuidedFive: RouteForecast;
  safeRouteReachedModule: boolean;
  riskyRouteReachedModule: boolean;
  recoveryRaisesQuote: boolean;
  noIdleMoney: boolean;
  valid: boolean;
}

function forecast(
  state: SimulationState,
  workloadId: string,
  count: number,
): RouteForecast {
  const metrics = calculateMetrics({ ...state, workloadId });
  const quotes = Array.from({ length: count }, (_, index) =>
    getWorkloadQuote(state, workloadId, index),
  );
  const expectedNet = quotes.reduce(
    (total, quote) => total + estimateWorkloadOffer(metrics, quote).expectedNet,
    0,
  );
  return {
    workloadId,
    count,
    firstQuote: quotes[0]?.grossQuote ?? 0,
    finalQuote: quotes.at(-1)?.grossQuote ?? 0,
    expectedNet: Number(expectedNet.toFixed(3)),
    reliability: metrics.reliability,
  };
}

function settleOne(
  state: SimulationState,
  workloadId: string,
): SimulationState {
  let next = applyCommand(state, { type: "SET_WORKLOAD", workloadId });
  next = applyCommand(next, { type: "QUEUE_JOBS", count: 1 });
  const settledBefore = next.jobs.completed + next.jobs.failed;
  for (
    let quantum = 0;
    quantum < 1_000 && next.jobs.completed + next.jobs.failed === settledBefore;
    quantum += 1
  )
    next = tick(next, 0.5);
  return next;
}

function reachesFirstModule(
  seed: number,
  workloadId: string,
): { state: SimulationState; reached: boolean } {
  let state = createInitialState(seed);
  // The deterministic first-session contract always records one safe starter
  // settlement before an alternative workload route is available.
  if (workloadId !== "interactive-chat")
    state = settleOne(state, "interactive-chat");
  const module = getModule("precision-cleaner");
  for (
    let attempt = 0;
    attempt < 12 && state.resources.money < module.purchaseCost;
    attempt += 1
  )
    state = settleOne(state, workloadId);
  return { state, reached: state.resources.money >= module.purchaseCost };
}

/** Deterministic evidence for the two intentional first-session work routes. */
export function validateFirstSessionEconomy(
  seed: number,
): FirstSessionBalanceResult {
  const initial = createInitialState(seed);
  const safeRoute = forecast(initial, "interactive-chat", 1);
  const riskyRoute = forecast(initial, "batch-classification", 1);
  const chatQueueTen = forecast(initial, "interactive-chat", 10);
  const chatGuidedFour = forecast(initial, "interactive-chat", 4);
  const batchQueueTen = forecast(initial, "batch-classification", 10);
  const batchGuidedFive = forecast(initial, "batch-classification", 5);
  const safeRun = reachesFirstModule(seed, "interactive-chat");
  const riskyRun = reachesFirstModule(seed, "batch-classification");

  let saturated = createInitialState(seed);
  saturated = settleOne(saturated, "interactive-chat");
  const quoteAfterSettlement = getWorkloadQuote(
    saturated,
    "interactive-chat",
  ).grossQuote;
  const recovered = tick(saturated, 60);
  const quoteAfterRecovery = getWorkloadQuote(
    recovered,
    "interactive-chat",
  ).grossQuote;
  const idle = tick(createInitialState(seed), 60);

  return {
    seed: initial.seed,
    safeRoute,
    riskyRoute,
    chatQueueTen,
    chatGuidedFour,
    batchQueueTen,
    batchGuidedFive,
    safeRouteReachedModule: safeRun.reached,
    riskyRouteReachedModule: riskyRun.reached,
    recoveryRaisesQuote: quoteAfterRecovery > quoteAfterSettlement,
    noIdleMoney: idle.resources.money === 0,
    valid:
      isStateValid(initial) &&
      isStateValid(safeRun.state) &&
      isStateValid(riskyRun.state) &&
      isStateValid(saturated) &&
      isStateValid(recovered) &&
      isStateValid(idle),
  };
}
