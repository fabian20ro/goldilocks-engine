import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  projectCareerEvening,
  projectCareerRoute,
} from "./engine";

describe("Career presentation projections", () => {
  it("reuses authoritative route accounting without changing the simulation", () => {
    const state = createInitialState(20_702);
    const before = JSON.stringify(state);
    const freelance = projectCareerRoute(state, "freelance", 2);
    const evening = projectCareerEvening(state, {
      freelance: 2,
      competition: 1,
      product: 1,
      maintenance: 0,
    });

    expect(JSON.stringify(state)).toBe(before);
    expect(freelance).toMatchObject({
      route: "freelance",
      hours: 2,
      configuredCost: freelance.operatingCost + freelance.electricityCost,
      economicNet: freelance.gross - freelance.configuredCost,
    });
    expect(evening.hours).toBe(4);
    expect(evening.routes.map((route) => route.route)).toEqual([
      "freelance",
      "competition",
      "product",
    ]);
    expect(evening.configuredCost).toBe(
      evening.operatingCost + evening.electricityCost,
    );
  });

  it("uses the current configuration rather than a duplicated route table", () => {
    const state = createInitialState(20_703);
    const highCompute = projectCareerRoute(state, "freelance", 4);
    const constrained = applyCommand(state, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 25,
    });
    const lowCompute = projectCareerRoute(constrained, "freelance", 4);

    expect(lowCompute.electricityCost).toBeLessThan(
      highCompute.electricityCost,
    );
    expect(lowCompute.constraint).toBe(highCompute.constraint);
    expect(lowCompute.gross).not.toBe(highCompute.gross);
  });

  it("uses the same quarter-hour and four-hour boundaries as the Career composer", () => {
    const state = createInitialState(20_704);

    expect(projectCareerRoute(state, "freelance", 0.13).hours).toBe(0.25);
    expect(projectCareerRoute(state, "freelance", 9).hours).toBe(4);
    expect(
      projectCareerEvening(state, {
        freelance: 3.9,
        competition: 1,
        product: 1,
        maintenance: 1,
      }),
    ).toMatchObject({
      hours: 4,
      routes: [{ route: "freelance", hours: 4 }],
    });
  });
});
