import { describe, expect, it } from "vitest";
import { validateProgressionEconomy } from "./progressionBalance";

describe("Workstation Expansion I progression balance", () => {
  it.each([1, 7, 41, 20260716, -10_000, 10_000])(
    "seed %s preserves pacing, market rotation, and catalogue bounds",
    (seed) => {
      const result = validateProgressionEconomy(seed);
      expect(result.firstModuleSuccess).toBeLessThanOrEqual(5);
      expect(result.firstRigSuccess).toBeLessThanOrEqual(15);
      expect(result.expansionHour).toBeGreaterThanOrEqual(8);
      expect(result.expansionHour).toBeLessThanOrEqual(16);
      expect(result.fullCatalogueHour).toBeGreaterThanOrEqual(24);
      expect(result.fullCatalogueHour).toBeLessThanOrEqual(72);
      expect(result.singleWorkloadEventuallyNonpositive).toBe(true);
      expect(result.rotationRestoresProfit).toBe(true);
      expect(result.noIdleMoney).toBe(true);
      expect(result.valid).toBe(true);
    },
  );
});
