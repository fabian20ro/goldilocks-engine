import { describe, expect, it } from "vitest";
import { createCareerScheduleCommandBatch } from "../ui/careerScheduleDraft";
import {
  createInitialState,
  projectCareerEvening,
  sealSimulationState,
} from "./engine";
import { reduceWorkerRequest } from "./workerProtocol";
import type { CareerRoute, SimulationState } from "./types";

const empty = {
  freelance: 0,
  competition: 0,
  product: 0,
  maintenance: 0,
} as const;

function completedState(
  state: SimulationState,
  allocations: Record<CareerRoute, number>,
): SimulationState {
  return reduceWorkerRequest(state, {
    type: "COMMAND_BATCH",
    commands: createCareerScheduleCommandBatch(allocations),
  });
}

function delta(after: number, before: number, precision = 3): number {
  return Number((after - before).toFixed(precision));
}

describe("verifier round 055: Career estimates", () => {
  it("matches one actual atomic evening across income, progress, cost, and debt paths", () => {
    const initial = createInitialState(55_055);
    const releasedProduct = sealSimulationState({
      ...initial,
      resources: { ...initial.resources, money: 20 },
      career: {
        ...initial.career,
        product: {
          ...initial.career.product,
          buildProgress: 8,
          released: true,
          releases: 1,
          serviceDebt: 2,
        },
      },
    });
    const cases: readonly [SimulationState, Record<CareerRoute, number>][] = [
      [initial, { ...empty, freelance: 2, competition: 2 }],
      [releasedProduct, { ...empty, product: 2, maintenance: 2 }],
    ];

    for (const [before, allocations] of cases) {
      const serializedBefore = JSON.stringify(before);
      const estimate = projectCareerEvening(before, allocations);
      const after = completedState(before, allocations);

      expect(JSON.stringify(before)).toBe(serializedBefore);
      expect(after.career.schedule.completedEvenings).toBe(
        before.career.schedule.completedEvenings + 1,
      );
      expect(estimate.hours).toBe(4);
      expect(delta(after.resources.money, before.resources.money)).toBe(
        estimate.cashChange,
      );
      expect(
        delta(
          after.career.operatingCostsIncurred,
          before.career.operatingCostsIncurred,
        ),
      ).toBe(estimate.operatingCost);
      expect(
        delta(
          after.career.electricityCostsIncurred,
          before.career.electricityCostsIncurred,
        ),
      ).toBe(estimate.electricityCost);
      expect(delta(after.career.unpaidCosts, before.career.unpaidCosts)).toBe(
        estimate.unpaidCostChange,
      );
      expect(
        delta(
          after.career.competition.progress,
          before.career.competition.progress,
        ),
      ).toBe(estimate.competitionProgress);
      expect(
        delta(
          after.career.product.buildProgress,
          before.career.product.buildProgress,
        ),
      ).toBe(estimate.productBuildProgress);
      expect(
        delta(
          after.career.product.lifetimeRevenue,
          before.career.product.lifetimeRevenue,
        ),
      ).toBe(estimate.productRevenue);
      expect(
        delta(
          after.career.product.serviceDebt,
          before.career.product.serviceDebt,
        ),
      ).toBeCloseTo(-estimate.maintenanceDebtReduction, 3);
    }
  });
});
