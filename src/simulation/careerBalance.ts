import { applyCommand, createInitialState, isStateValid, tick } from "./engine";
import type { CareerRoute, SimulationState } from "./types";

export type CareerFundingRoute = "freelance" | "competition" | "product";

export interface CareerRouteBalanceResult {
  seed: number;
  route: CareerFundingRoute;
  evenings: number;
  savings: number;
  cash: number;
  freelanceGross: number;
  competitionSubmissions: number;
  productRevenue: number;
  exitAchieved: boolean;
  honestCosts: boolean;
  valid: boolean;
}

export interface CareerBalanceResult {
  seed: number;
  routes: readonly CareerRouteBalanceResult[];
  noWaitOnlyExploit: boolean;
  noDominantRoute: boolean;
  opportunityCostBounded: boolean;
  valid: boolean;
}

function runEvening(
  state: SimulationState,
  route: CareerRoute,
  hours = 4,
): SimulationState {
  return applyCommand(
    applyCommand(state, {
      type: "SET_EVENING_ALLOCATION",
      route,
      hours,
    }),
    { type: "RUN_EVENING" },
  );
}

function submitCompetition(state: SimulationState): SimulationState {
  return applyCommand(state, { type: "SUBMIT_COMPETITION" });
}

function releaseProduct(state: SimulationState): SimulationState {
  return applyCommand(state, { type: "RELEASE_PRODUCT" });
}

function depositAllCash(state: SimulationState): SimulationState {
  return state.resources.money > 0
    ? applyCommand(state, {
        type: "DEPOSIT_SAVINGS",
        amount: state.resources.money,
      })
    : state;
}

/**
 * Three intentionally different funding plans. Every plan still establishes
 * the one persistent product and one persistent competition needed for the
 * Bedroom Developer exit; its funding source, timing, and risk differ.
 */
function runFundingPlan(
  seed: number,
  route: CareerFundingRoute,
): SimulationState {
  let state = createInitialState(seed);
  if (route === "freelance") {
    state = runEvening(state, "product");
    state = runEvening(state, "product");
    state = releaseProduct(state);
    state = runEvening(state, "competition");
    state = runEvening(state, "competition");
    state = submitCompetition(state);
    state = runEvening(state, "freelance");
    state = runEvening(state, "freelance");
  } else if (route === "competition") {
    state = runEvening(state, "competition");
    state = runEvening(state, "competition");
    state = submitCompetition(state);
    state = runEvening(state, "product");
    state = runEvening(state, "product");
    state = releaseProduct(state);
    state = runEvening(state, "product");
    state = runEvening(state, "product");
  } else {
    state = runEvening(state, "product");
    state = runEvening(state, "product");
    state = releaseProduct(state);
    state = runEvening(state, "product");
    state = runEvening(state, "product");
    state = runEvening(state, "product");
    state = runEvening(state, "competition");
    state = runEvening(state, "competition");
    state = submitCompetition(state);
  }
  return depositAllCash(state);
}

function hasHonestCosts(state: SimulationState): boolean {
  const incurred =
    state.career.operatingCostsIncurred + state.career.electricityCostsIncurred;
  return (
    Math.abs(incurred - state.career.costsPaid - state.career.unpaidCosts) <
    0.01
  );
}

function routeResult(
  seed: number,
  route: CareerFundingRoute,
): CareerRouteBalanceResult {
  const state = runFundingPlan(seed, route);
  return {
    seed,
    route,
    evenings: state.career.schedule.completedEvenings,
    savings: state.career.savings,
    cash: state.resources.money,
    freelanceGross: state.career.freelanceGross,
    competitionSubmissions: state.career.competition.submissions,
    productRevenue: state.career.product.lifetimeRevenue,
    exitAchieved: state.career.exitAchieved,
    honestCosts: hasHonestCosts(state),
    valid: isStateValid(state),
  };
}

function noWaitOnlyExploit(seed: number): boolean {
  const initial = createInitialState(seed);
  const waited = tick(initial, 60);
  return (
    waited.career.savings === initial.career.savings &&
    waited.career.freelanceGross === initial.career.freelanceGross &&
    waited.career.competition.progress ===
      initial.career.competition.progress &&
    waited.career.product.buildProgress ===
      initial.career.product.buildProgress &&
    waited.career.product.lifetimeRevenue ===
      initial.career.product.lifetimeRevenue
  );
}

function opportunityCostBounded(seed: number): boolean {
  let state = createInitialState(seed);
  state = applyCommand(state, {
    type: "SET_EVENING_ALLOCATION",
    route: "freelance",
    hours: 3,
  });
  const overbooked = applyCommand(state, {
    type: "SET_EVENING_ALLOCATION",
    route: "competition",
    hours: 2,
  });
  if (overbooked.career.schedule.allocations.competition !== 0) return false;
  state = applyCommand(state, {
    type: "SET_EVENING_ALLOCATION",
    route: "competition",
    hours: 1,
  });
  state = applyCommand(state, { type: "RUN_EVENING" });
  return (
    state.career.freelanceHours === 3 &&
    state.career.competition.progress > 0 &&
    state.career.product.buildProgress === 0 &&
    state.career.schedule.completedEvenings === 1
  );
}

/** Deterministic balance evidence for the D-010 Bedroom Developer economy. */
export function validateCareerEconomy(seed: number): CareerBalanceResult {
  const routes = (["freelance", "competition", "product"] as const).map(
    (route) => routeResult(seed, route),
  );
  const freelance = routes.find((item) => item.route === "freelance")!;
  const competition = routes.find((item) => item.route === "competition")!;
  const product = routes.find((item) => item.route === "product")!;
  const noDominantRoute =
    freelance.freelanceGross > 0 &&
    competition.competitionSubmissions > 0 &&
    product.productRevenue > competition.productRevenue &&
    product.productRevenue > freelance.productRevenue &&
    freelance.evenings < product.evenings;
  return {
    seed,
    routes,
    noWaitOnlyExploit: noWaitOnlyExploit(seed),
    noDominantRoute,
    opportunityCostBounded: opportunityCostBounded(seed),
    valid: routes.every(
      (result) =>
        result.exitAchieved &&
        result.honestCosts &&
        result.valid &&
        result.savings >= 24,
    ),
  };
}
