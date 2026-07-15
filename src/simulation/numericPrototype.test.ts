import { describe, expect, it } from "vitest";
import { hardware } from "./catalog";
import {
  prototypeContent,
  simulateFundingPath,
  validatePrototype,
  type FundingPath,
} from "./numericPrototype";

describe("Milestone 0 numeric prototype", () => {
  it("contains the scoped competition, product, creator event, research, and three endings", () => {
    expect(prototypeContent.competition.id).toBeTruthy();
    expect(prototypeContent.product.id).toBeTruthy();
    expect(prototypeContent.creatorEvent.id).toBeTruthy();
    expect(prototypeContent.researchProject.failedWorkValue).toBeGreaterThan(0);
    expect(prototypeContent.endings).toHaveLength(3);
  });

  it("keeps competition, product, and creator paths viable without a universal winner", () => {
    const report = validatePrototype(41);
    expect(report.viable).toBe(true);
    expect(report.noDominantStrategy).toBe(true);
    expect(report.upgradeTradeoffs).toBe(true);
    expect(new Set(report.results.map((result) => result.ending))).toHaveLength(
      3,
    );
  });

  it.each([
    "competition-first",
    "product-first",
    "creator-first",
  ] satisfies FundingPath[])(
    "%s is deterministic and retains failed-research value",
    (path) => {
      const left = simulateFundingPath(path, 1);
      const right = simulateFundingPath(path, 1);
      expect(left).toEqual(right);
      expect(left.capability).toBeGreaterThan(22);
    },
  );

  it("ensures every compute upgrade creates cost and energy constraints", () => {
    for (let index = 1; index < hardware.length; index += 1) {
      const previous = hardware[index - 1]!;
      const current = hardware[index]!;
      expect(current.compute).toBeGreaterThan(previous.compute);
      expect(current.watts).toBeGreaterThan(previous.watts);
      expect(current.purchaseCost).toBeGreaterThan(previous.purchaseCost);
    }
  });
});
