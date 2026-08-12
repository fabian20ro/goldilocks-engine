import { describe, expect, it } from "vitest";
import type { CareerEveningProjection } from "../simulation/engine";
import {
  claimCareerFeedbackTransaction,
  completeCareerFeedbackTransaction,
  createCareerFeedbackTransactionRegistry,
  drainDurablyAcknowledgedCareerFeedback,
  invalidateCareerFeedbackTransaction,
  registerCareerFeedbackTransaction,
  type CareerCompletionFeedback,
} from "./careerFeedbackTransactions";

function feedback(requestId: number): CareerCompletionFeedback {
  return {
    requestId,
    evening: requestId,
    projection: {} as CareerEveningProjection,
    nextDecision: `next-${requestId}`,
  };
}

describe("verifier round 059 Career feedback transaction cleanup", () => {
  it("keeps a bounded batch request-keyed and drains every acknowledged or rejected entry exactly once", () => {
    const registry = createCareerFeedbackTransactionRegistry();
    const expected: CareerCompletionFeedback[] = [];
    for (let requestId = 1; requestId <= 128; requestId += 1) {
      registerCareerFeedbackTransaction(registry, {
        kind: "safe-offline",
        requestId,
      });
      const transaction = claimCareerFeedbackTransaction(registry, requestId);
      expect(transaction).not.toBeNull();
      if (!transaction) throw new Error("Expected registered transaction");
      if (requestId % 2 === 0) {
        const completed = feedback(requestId);
        expected.push(completed);
        expect(completeCareerFeedbackTransaction(transaction, completed)).toBe(
          true,
        );
      } else {
        invalidateCareerFeedbackTransaction(registry, requestId);
      }
    }

    expect(registry).toHaveLength(64);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 127)).toHaveLength(
      63,
    );
    expect(registry).toHaveLength(1);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 128)).toEqual([
      expected.at(-1),
    ]);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 128)).toEqual([]);
    expect(registry).toHaveLength(0);
  });

  it("rejects malformed request keys without retaining UI-session state", () => {
    const registry = createCareerFeedbackTransactionRegistry();
    for (const requestId of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5])
      registerCareerFeedbackTransaction(registry, {
        kind: "safe-offline",
        requestId,
      });
    expect(registry).toHaveLength(0);
    expect(
      drainDurablyAcknowledgedCareerFeedback(registry, Number.NaN),
    ).toEqual([]);
  });
});
