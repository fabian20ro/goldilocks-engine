import { getModule, getWorkload } from "../simulation/catalog";
import { formatCompactCurrency } from "../simulation/currency";
import type { SimulationState } from "../simulation/types";

export type OnboardingTab =
  | "build"
  | "jobs"
  | "career"
  | "upgrades"
  | "inspect";

export type FirstSessionAction =
  | "complete"
  | "queue-starter"
  | "observe-settlement"
  | "earn-remainder"
  | "buy-module"
  | "start-placement"
  | "place-module";

export interface FirstSessionPresentation {
  active: boolean;
  action: FirstSessionAction;
  requiredTab: OnboardingTab | null;
  requiredTabLabel: string | null;
  title: string | null;
  body: string | null;
  actionLabel: string | null;
  progressPercent: number;
  recommendedModuleId: string | null;
  remainingMoney: number | null;
}

/**
 * Presentation-only recommendation for the finite first purchase. The engine
 * still accepts any valid paid module, and a player-owned alternative is
 * always the module named by the final placement handoff.
 */
export const FIRST_SESSION_RECOMMENDED_MODULE_ID = "precision-cleaner";

const tabLabels: Record<OnboardingTab, string> = {
  build: "Build",
  jobs: "Jobs",
  career: "Career",
  upgrades: "Upgrades",
  inspect: "Inspect",
};

function presentation({
  action,
  requiredTab,
  title,
  body,
  actionLabel,
  progressPercent,
  recommendedModuleId,
  remainingMoney = null,
}: Omit<
  FirstSessionPresentation,
  "active" | "requiredTabLabel" | "remainingMoney"
> & {
  requiredTab: OnboardingTab;
  remainingMoney?: number | null;
}): FirstSessionPresentation {
  return {
    active: true,
    action,
    requiredTab,
    requiredTabLabel: tabLabels[requiredTab],
    title,
    body,
    actionLabel,
    progressPercent,
    recommendedModuleId,
    remainingMoney,
  };
}

/**
 * One thin view selector for the finite onboarding rail. It observes only
 * durable simulation state plus the transient explicit placement transaction;
 * it never dispatches, navigates, persists, or changes the economy.
 */
export function selectFirstSessionPresentation(
  state: SimulationState,
  pendingPlacementModuleId: string | null = null,
): FirstSessionPresentation {
  const guide = state.firstSession;
  const recommendedModule = getModule(FIRST_SESSION_RECOMMENDED_MODULE_ID);

  if (guide.step === "complete") {
    return {
      active: false,
      action: "complete",
      requiredTab: null,
      requiredTabLabel: null,
      title: null,
      body: null,
      actionLabel: null,
      progressPercent: 100,
      recommendedModuleId: null,
      remainingMoney: null,
    };
  }

  if (guide.step === "queue-starter") {
    return presentation({
      action: "queue-starter",
      requiredTab: "jobs",
      title: "Queue one safe Interactive Chat job",
      body: "Interactive Chat is the reliable first route. Its live quote and configured cost remain visible before you accept it; nothing is queued for you.",
      actionLabel: "Queue one safe Interactive Chat job",
      progressPercent: 0,
      recommendedModuleId: recommendedModule.id,
    });
  }

  if (guide.step === "observe-settlement") {
    const starterTask = [
      state.jobs.activeTask,
      ...state.jobs.waitingTasks,
    ].find((task) => task?.id === guide.starterTaskId);
    const taskStatus = starterTask
      ? state.jobs.activeTask?.id === starterTask.id
        ? `${Math.round(starterTask.progress * 100)}% complete`
        : "waiting"
      : "resolving";
    return presentation({
      action: "observe-settlement",
      requiredTab: "jobs",
      title: "Observe the starter settlement",
      body: `${getWorkload("interactive-chat").name} ${guide.starterTaskId ?? "job"} is ${taskStatus}. Its locked quote, configured cost, and outcome appear in the Jobs settlement record; no follow-up was queued for you.`,
      actionLabel: "Observe the Jobs settlement",
      progressPercent: 34,
      recommendedModuleId: recommendedModule.id,
    });
  }

  const purchasedModuleId = guide.purchasedModuleId;
  const purchasedModule = purchasedModuleId
    ? getModule(purchasedModuleId)
    : null;
  const targetModule = purchasedModule ?? recommendedModule;
  const targetOwned = state.ownedModuleIds.includes(targetModule.id);
  const targetInstalled = state.slots.some(
    (slot) => slot.moduleId === targetModule.id,
  );

  if (targetOwned && targetInstalled) {
    // The Worker moves the durable guide to complete with the placement command.
    // This fallback is intentionally inert for the brief render before it lands.
    return {
      active: false,
      action: "complete",
      requiredTab: null,
      requiredTabLabel: null,
      title: null,
      body: null,
      actionLabel: null,
      progressPercent: 100,
      recommendedModuleId: null,
      remainingMoney: null,
    };
  }

  if (targetOwned && pendingPlacementModuleId === targetModule.id) {
    return presentation({
      action: "place-module",
      requiredTab: "build",
      title: `Place ${targetModule.name} in Build`,
      body: `Your explicit placement handoff is ready. Choose a highlighted compatible Build position; nothing installs automatically, and Cancel remains available.`,
      actionLabel: `Snap ${targetModule.name} into Build`,
      progressPercent: 90,
      recommendedModuleId: targetModule.id,
    });
  }

  if (targetOwned) {
    return presentation({
      action: "start-placement",
      requiredTab: "upgrades",
      title: `Start explicit placement for ${targetModule.name}`,
      body: `${targetModule.name} is owned. Use its named Place in Build action in Upgrades, then choose Build yourself to select a compatible position. This handoff never navigates or equips automatically.`,
      actionLabel: `Place ${targetModule.name} in Build`,
      progressPercent: 78,
      recommendedModuleId: targetModule.id,
    });
  }

  const remainingMoney = Math.max(
    0,
    recommendedModule.purchaseCost - state.resources.money,
  );
  const failedStarter = state.lastSettlement?.failed === 1;
  const failurePrefix = failedStarter
    ? "The latest starter delivery failed, so it paid no gross. Its reason remains in the Jobs settlement record; repair that named constraint or choose a viable route there before queueing again. "
    : "";
  const earningInstruction = failedStarter
    ? "Use Jobs to review the failure, choose a viable recovery route, and earn the remaining amount"
    : "Queue a current viable job in Jobs to earn the remaining amount";

  if (remainingMoney > 0) {
    return presentation({
      action: "earn-remainder",
      requiredTab: "jobs",
      title: failedStarter
        ? `Review failed settlement; earn ${formatCompactCurrency(remainingMoney)} more for ${recommendedModule.name}`
        : `Earn ${formatCompactCurrency(remainingMoney)} more for ${recommendedModule.name}`,
      body: `${failurePrefix}${recommendedModule.name} costs ${formatCompactCurrency(recommendedModule.purchaseCost)}. ${earningInstruction}; workload, quote, cost, and any recovery reason stay visible before you decide.`,
      actionLabel: `Queue 1 toward ${recommendedModule.name}`,
      progressPercent: Math.min(
        66,
        Math.round(
          (state.resources.money /
            Math.max(1, recommendedModule.purchaseCost)) *
            66,
        ),
      ),
      recommendedModuleId: recommendedModule.id,
      remainingMoney,
    });
  }

  return presentation({
    action: "buy-module",
    requiredTab: "upgrades",
    title: `Buy the recommended ${recommendedModule.name}`,
    body: `${recommendedModule.name} is now affordable at ${formatCompactCurrency(recommendedModule.purchaseCost)}. Compare its live tradeoffs, buy it explicitly, then choose its named Build placement handoff.`,
    actionLabel: `Buy ${recommendedModule.name}`,
    progressPercent: 66,
    recommendedModuleId: recommendedModule.id,
    remainingMoney: 0,
  });
}
