import { hardware, modules, pipelineExpansions, workloads } from "./catalog";
import {
  applyCommand,
  calculateMetrics,
  createEstablishedScenarioState,
  createInitialState,
  estimateWorkloadOffer,
  getSimulationAgeHours,
  getWorkloadQuote,
  isStateValid,
  tick,
  workloadUnlockProgress,
} from "./engine";
import type { SimulationState } from "./types";

export interface ProgressionBalanceResult {
  seed: number;
  expansionHour: number;
  fullCatalogueHour: number;
  firstModuleSuccess: number;
  firstRigSuccess: number;
  singleWorkloadEventuallyNonpositive: boolean;
  rotationRestoresProfit: boolean;
  noIdleMoney: boolean;
  valid: boolean;
}

function expectedMargin(state: SimulationState, workloadId: string): number {
  const metrics = calculateMetrics({ ...state, workloadId });
  return estimateWorkloadOffer(metrics, getWorkloadQuote(state, workloadId))
    .expectedNet;
}

function everyValidConfigurationHasASafeDemandFloor(): boolean {
  const noModelState = ["prepare", "runtime", "verify"].reduce(
    (state, slotId) => applyCommand(state, { type: "REMOVE_MODULE", slotId }),
    createInitialState(1),
  );
  const lowestModelCost = Math.min(
    ...modules
      .filter((module) => module.role === "model")
      .map((module) => module.costPerJob),
  );
  const lowestMaintenance = Math.min(
    ...hardware.map((item) => item.maintenance / 100),
  );
  const lowestProductiveCost = lowestModelCost + lowestMaintenance;

  // A graph without a model has zero delivery reliability. Every productive
  // graph must pay at least one model plus rig maintenance; all other module
  // and energy costs are nonnegative, while reliability is capped below one.
  return (
    calculateMetrics(noModelState).reliability === 0 &&
    workloads.every(
      (workload) => workload.minimumQuote * 0.999 <= lowestProductiveCost,
    )
  );
}

function runOneAcceptedTask(state: SimulationState): SimulationState {
  const before = state.jobs.completed + state.jobs.failed;
  let next = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
  for (
    let quantum = 0;
    quantum < 1_000 && next.jobs.completed + next.jobs.failed === before;
    quantum += 1
  )
    next = tick(next, 0.5);
  return next;
}

function chooseCompetentWorkload(state: SimulationState): string {
  return workloads
    .filter((workload) => workloadUnlockProgress(state, workload.id).unlocked)
    .map((workload) => ({
      id: workload.id,
      margin: expectedMargin(state, workload.id),
    }))
    .sort((left, right) =>
      right.margin === left.margin
        ? left.id.localeCompare(right.id)
        : right.margin - left.margin,
    )[0]!.id;
}

function buyIfAffordable(
  state: SimulationState,
  type: "BUY_MODULE" | "BUY_HARDWARE",
  id: string,
): SimulationState {
  return type === "BUY_MODULE"
    ? applyCommand(state, { type, moduleId: id })
    : applyCommand(state, { type, hardwareId: id });
}

export function validateProgressionEconomy(
  seed: number,
): ProgressionBalanceResult {
  // This sweep evaluates long-run expansion pacing, not the newly protected
  // first-session rail. The explicit established fixture keeps that distinction
  // reproducible without exposing a player command that skips onboarding.
  let state = createEstablishedScenarioState(seed);
  let firstModuleSuccess = Number.POSITIVE_INFINITY;
  let firstRigSuccess = Number.POSITIVE_INFINITY;
  let expansionHour = Number.POSITIVE_INFINITY;
  let fullCatalogueHour = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    state = applyCommand(state, {
      type: "SET_WORKLOAD",
      workloadId: chooseCompetentWorkload(state),
    });
    state = runOneAcceptedTask(state);

    if (
      !state.ownedModuleIds.includes("precision-cleaner") &&
      state.resources.money >= 4
    ) {
      firstModuleSuccess = state.jobs.completed;
      state = buyIfAffordable(state, "BUY_MODULE", "precision-cleaner");
    }
    if (
      !state.ownedHardwareIds.includes("used-gpu") &&
      state.jobs.completed >= 15 &&
      state.resources.money >= 14
    ) {
      firstRigSuccess = state.jobs.completed;
      state = buyIfAffordable(state, "BUY_HARDWARE", "used-gpu");
      state = applyCommand(state, {
        type: "EQUIP_HARDWARE",
        hardwareId: "used-gpu",
      });
    }

    const expansion = pipelineExpansions[0]!;
    if (
      state.ownedHardwareIds.includes("used-gpu") &&
      !state.ownedExpansionIds.includes(expansion.id) &&
      state.resources.money >= expansion.purchaseCost
    ) {
      state = applyCommand(state, {
        type: "BUY_EXPANSION",
        expansionId: expansion.id,
      });
      state = applyCommand(state, {
        type: "SET_EXPANSION_ACTIVE",
        active: true,
      });
      expansionHour = getSimulationAgeHours(state);
    }

    if (state.ownedExpansionIds.includes(expansion.id)) {
      for (const item of modules.filter((module) => module.purchaseCost > 0))
        if (
          !state.ownedModuleIds.includes(item.id) &&
          state.resources.money >= item.purchaseCost
        )
          state = buyIfAffordable(state, "BUY_MODULE", item.id);
      for (const item of hardware)
        if (
          !state.ownedHardwareIds.includes(item.id) &&
          state.resources.money >= item.purchaseCost
        )
          state = buyIfAffordable(state, "BUY_HARDWARE", item.id);
    }

    if (
      hardware.every((item) => state.ownedHardwareIds.includes(item.id)) &&
      modules
        .filter((item) => item.purchaseCost > 0)
        .every((item) => state.ownedModuleIds.includes(item.id)) &&
      pipelineExpansions.every((item) =>
        state.ownedExpansionIds.includes(item.id),
      )
    ) {
      fullCatalogueHour = getSimulationAgeHours(state);
      break;
    }
  }

  const farm = createInitialState(seed);
  const singleWorkloadEventuallyNonpositive =
    everyValidConfigurationHasASafeDemandFloor();
  const rotationRestoresProfit = workloads
    .filter((workload) => workload.id !== "interactive-chat")
    .some(
      (workload) =>
        workloadUnlockProgress(farm, workload.id).unlocked &&
        expectedMargin(farm, workload.id) > 0,
    );
  const idle = tick(createInitialState(seed), 60);

  return {
    seed: state.seed,
    expansionHour,
    fullCatalogueHour,
    firstModuleSuccess,
    firstRigSuccess,
    singleWorkloadEventuallyNonpositive,
    rotationRestoresProfit,
    noIdleMoney: idle.resources.money === 0,
    valid: isStateValid(state) && isStateValid(farm) && isStateValid(idle),
  };
}
