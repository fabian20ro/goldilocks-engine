import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  sealSimulationState,
} from "../simulation/engine";
import {
  presentBuildDecision,
  presentCareerDecision,
  presentInspectDecision,
  presentJobsDecision,
  presentLaboratoryDecision,
  presentResearchDecision,
  presentUpgradesDecision,
  presentWorldDecision,
} from "./editorial";

const emptySchedule = {
  freelance: 0,
  competition: 0,
  product: 0,
  maintenance: 0,
} as const;

function assertContract(decision: ReturnType<typeof presentBuildDecision>) {
  expect(decision.destination).toBeTruthy();
  expect(decision.currentState).not.toBe("");
  expect(decision.consequence).not.toBe("");
  expect(decision.costOrRisk).not.toBe("");
  expect(decision.nextAction).not.toBe("");
  expect(decision.detailsHint).toMatch(/Details/);
}

describe("M7C editorial decision presenters", () => {
  it("normal: exposes state, consequence, cost/risk, and one next action for all eight destinations", () => {
    const state = createInitialState(7_301);
    const decisions = [
      presentBuildDecision(state, "prepare"),
      presentJobsDecision(state),
      presentCareerDecision(
        state,
        0,
        {
          ...emptySchedule,
          routes: [],
          hours: 0,
          gross: 0,
          operatingCost: 0,
          electricityCost: 0,
          electricityKwh: 0,
          configuredCost: 0,
          economicNet: 0,
          cashChange: 0,
          unpaidCostChange: 0,
          productRevenue: 0,
          competitionProgress: 0,
          productBuildProgress: 0,
          maintenanceDebtReduction: 0,
          constraint: "No route selected",
        },
        false,
      ),
      presentUpgradesDecision(state, null, null, false),
      presentInspectDecision(state),
      presentResearchDecision(state),
      presentLaboratoryDecision(state),
      presentWorldDecision(state),
    ];
    decisions.forEach(assertContract);
    expect(new Set(decisions.map((item) => item.destination)).size).toBe(8);
  });

  it("boundary: locked and risky state names requirements, preserved work, and recovery action", () => {
    const state = createInitialState(7_302);
    const lockedResearch = presentResearchDecision(state);
    const lockedLab = presentLaboratoryDecision(state);
    const lockedWorld = presentWorldDecision(state);
    expect(lockedResearch.currentState).toMatch(/not recognized|goal/i);
    expect(lockedLab.costOrRisk).toMatch(/requirement|progress/i);
    expect(lockedWorld.nextAction).toMatch(/accepted delivery|reputation/i);

    const malformedSafe = sealSimulationState({
      ...state,
      jobs: { ...state.jobs, activeTask: null, waitingTasks: [] },
      lastWarning:
        "A failed task preserved its queue identity; recovery is player-directed.",
    });
    const jobs = presentJobsDecision(malformedSafe);
    expect(jobs.costOrRisk).toMatch(/Risk|Cost/);
    expect(jobs.nextAction).toMatch(/Queue|Observe|choose/i);
  });

  it("lifecycle: active work and onboarding change the next action without mutating state", () => {
    const state = createInitialState(7_303);
    const before = JSON.stringify(state);
    const active = applyCommand(state, {
      type: "QUEUE_JOBS",
      count: 1,
    });
    const build = presentBuildDecision(active, "runtime", {
      active: true,
      action: "queue-starter",
      requiredTabLabel: "Jobs",
    });
    const jobs = presentJobsDecision(active, {
      active: true,
      action: "observe-settlement",
      requiredTabLabel: "Jobs",
    });
    expect(build.nextAction).toMatch(/first-session step/i);
    expect(jobs.nextAction).toMatch(/first-session step/i);
    expect(JSON.stringify(state)).toBe(before);
  });
});
