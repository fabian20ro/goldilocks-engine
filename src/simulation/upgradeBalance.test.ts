import { describe, expect, it } from "vitest";
import { modules } from "./catalog";
import { validateUpgradeEconomy } from "./upgradeBalance";

describe("bounded equipment economy", () => {
  it.each([1, 7, 41, 20260716, -10_000, 10_000])(
    "seed %s funds a module by five successes and a rig by fifteen",
    (seed) => {
      const result = validateUpgradeEconomy(seed);
      expect(result.moduleAffordableAtSuccess).toBeLessThanOrEqual(5);
      expect(result.rigAffordableAtSuccess).toBeLessThanOrEqual(15);
      expect(result.purchaseDeductedOnce).toBe(true);
      expect(result.valid).toBe(true);
    },
  );

  it("gives every paid module a material benefit and a constraint", () => {
    const paid = modules.filter((module) => module.purchaseCost > 0);
    for (const item of paid) {
      const peers = modules.filter(
        (candidate) =>
          candidate.purchaseCost === 0 && candidate.role === item.role,
      );
      const hasBenefit = peers.some(
        (peer) =>
          item.throughput > peer.throughput ||
          item.latency < peer.latency ||
          item.memory < peer.memory ||
          item.quality > peer.quality ||
          item.reliability > peer.reliability ||
          item.observability > peer.observability,
      );
      const hasConstraint = peers.some(
        (peer) =>
          item.throughput < peer.throughput ||
          item.latency > peer.latency ||
          item.memory > peer.memory ||
          item.quality < peer.quality ||
          item.reliability < peer.reliability ||
          item.observability < peer.observability ||
          item.costPerJob > peer.costPerJob,
      );
      expect(hasBenefit, item.name).toBe(true);
      expect(hasConstraint, item.name).toBe(true);
    }
  });
});
