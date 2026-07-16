import { getHardware, getModule } from "./catalog";
import { applyCommand, createInitialState, isStateValid, tick } from "./engine";

export interface UpgradeBalanceResult {
  seed: number;
  moduleAffordableAtSuccess: number;
  rigAffordableAtSuccess: number;
  attempts: number;
  valid: boolean;
  purchaseDeductedOnce: boolean;
}

export function validateUpgradeEconomy(seed: number): UpgradeBalanceResult {
  let state = createInitialState(seed);
  let attempts = 0;
  let moduleAffordableAtSuccess = Number.POSITIVE_INFINITY;
  let rigAffordableAtSuccess = Number.POSITIVE_INFINITY;
  const module = getModule("precision-cleaner");
  const rig = getHardware("used-gpu");

  while (state.jobs.completed < 15 && attempts < 200) {
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);
    attempts += 1;
    if (
      !Number.isFinite(moduleAffordableAtSuccess) &&
      state.resources.money >= module.purchaseCost
    ) {
      moduleAffordableAtSuccess = state.jobs.completed;
      const moneyBefore = state.resources.money;
      state = applyCommand(state, {
        type: "BUY_MODULE",
        moduleId: module.id,
      });
      const moneyAfter = state.resources.money;
      state = applyCommand(state, {
        type: "BUY_MODULE",
        moduleId: module.id,
      });
      if (
        Math.abs(moneyBefore - moneyAfter - module.purchaseCost) > 0.000_1 ||
        state.resources.money !== moneyAfter
      )
        break;
    }
    if (
      Number.isFinite(moduleAffordableAtSuccess) &&
      !Number.isFinite(rigAffordableAtSuccess) &&
      state.resources.money >= rig.purchaseCost
    )
      rigAffordableAtSuccess = state.jobs.completed;
  }

  const moduleOwned = state.ownedModuleIds.includes(module.id);
  const moneyBeforeRepeat = state.resources.money;
  const repeated = applyCommand(state, {
    type: "BUY_MODULE",
    moduleId: module.id,
  });
  return {
    seed: state.seed,
    moduleAffordableAtSuccess,
    rigAffordableAtSuccess,
    attempts,
    valid: isStateValid(state) && isStateValid(repeated),
    purchaseDeductedOnce:
      moduleOwned && repeated.resources.money === moneyBeforeRepeat,
  };
}
