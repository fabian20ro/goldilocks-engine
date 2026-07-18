import { describe, expect, it } from "vitest";
import { validateCareerEconomy } from "./careerBalance";

describe("Bedroom Developer balance sweep", () => {
  it("keeps all three funding routes viable without a wait-only or dominant route", () => {
    for (let seed = -50; seed <= 50; seed += 1) {
      const result = validateCareerEconomy(seed);
      expect(result.valid).toBe(true);
      expect(result.noWaitOnlyExploit).toBe(true);
      expect(result.noDominantRoute).toBe(true);
      expect(result.opportunityCostBounded).toBe(true);
      expect(result.routes).toHaveLength(3);
      for (const route of result.routes) {
        expect(route.exitAchieved).toBe(true);
        expect(route.honestCosts).toBe(true);
        expect(route.savings).toBeGreaterThanOrEqual(24);
      }
    }
  });
});
