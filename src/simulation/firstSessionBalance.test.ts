import { describe, expect, it } from "vitest";
import { validateFirstSessionEconomy } from "./firstSessionBalance";

describe("first-session route balance", () => {
  it.each([1, 7, 41, 20260716, -10_000, 10_000])(
    "seed %s keeps two forecastable routes and makes long unattended queues non-dominant",
    (seed) => {
      const result = validateFirstSessionEconomy(seed);

      expect(result.safeRoute.reliability).toBeGreaterThanOrEqual(0.9);
      expect(result.safeRoute.expectedNet).toBeGreaterThan(0);
      expect(result.riskyRoute.reliability).toBeLessThan(
        result.safeRoute.reliability,
      );
      expect(result.riskyRoute.expectedNet).toBeGreaterThan(0);
      expect(result.safeRouteReachedModule).toBe(true);
      expect(result.riskyRouteReachedModule).toBe(true);

      expect(result.chatQueueTen.finalQuote).toBeLessThan(
        result.chatQueueTen.firstQuote,
      );
      expect(result.batchQueueTen.finalQuote).toBeLessThan(
        result.batchQueueTen.firstQuote,
      );
      expect(result.chatGuidedFour.expectedNet).toBeGreaterThan(
        result.chatQueueTen.expectedNet,
      );
      expect(result.batchGuidedFive.expectedNet).toBeGreaterThan(
        result.batchQueueTen.expectedNet,
      );
      expect(result.recoveryRaisesQuote).toBe(true);
      expect(result.noIdleMoney).toBe(true);
      expect(result.valid).toBe(true);
    },
  );
});
