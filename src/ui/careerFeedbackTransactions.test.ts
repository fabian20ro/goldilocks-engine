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
    nextDecision: `next ${requestId}`,
  };
}

describe("Career feedback transactions", () => {
  it("keeps multiple batched request entries independent of an unrelated response", () => {
    const registry = createCareerFeedbackTransactionRegistry();
    registerCareerFeedbackTransaction(registry, {
      kind: "safe-offline",
      requestId: 41,
    });
    registerCareerFeedbackTransaction(registry, {
      kind: "safe-offline",
      requestId: 43,
    });

    // One React task can deliver completed apply, policy save, and zero-hour
    // apply in Worker order. The policy save has no recap transaction.
    const completed = claimCareerFeedbackTransaction(registry, 41);
    expect(claimCareerFeedbackTransaction(registry, 42)).toBeNull();
    const zeroHour = claimCareerFeedbackTransaction(registry, 43);
    expect(completed).not.toBeNull();
    expect(zeroHour).not.toBeNull();
    if (!completed || !zeroHour) throw new Error("Expected both apply entries");

    const firstFeedback = feedback(41);
    expect(completeCareerFeedbackTransaction(completed, firstFeedback)).toBe(
      true,
    );
    expect(completeCareerFeedbackTransaction(completed, feedback(41))).toBe(
      false,
    );
    expect(claimCareerFeedbackTransaction(registry, 41)).toBeNull();
    invalidateCareerFeedbackTransaction(registry, zeroHour.requestId);

    expect(drainDurablyAcknowledgedCareerFeedback(registry, 40)).toEqual([]);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 43)).toEqual([
      firstFeedback,
    ]);
    expect(registry).toHaveLength(0);
  });

  it("waits for D-020 durability acknowledgement and removes a recap exactly once", () => {
    const registry = createCareerFeedbackTransactionRegistry();
    registerCareerFeedbackTransaction(registry, {
      kind: "scheduled-evening",
      requestId: 7,
      allocations: {
        freelance: 4,
        competition: 0,
        product: 0,
        maintenance: 0,
      },
    });
    const transaction = claimCareerFeedbackTransaction(registry, 7);
    expect(transaction).not.toBeNull();
    if (!transaction) throw new Error("Expected scheduled-evening entry");
    const completed = feedback(7);
    expect(completeCareerFeedbackTransaction(transaction, completed)).toBe(
      true,
    );

    expect(drainDurablyAcknowledgedCareerFeedback(registry, 6)).toEqual([]);
    expect(registry).toHaveLength(1);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 7)).toEqual([
      completed,
    ]);
    expect(drainDurablyAcknowledgedCareerFeedback(registry, 7)).toEqual([]);
    expect(registry).toHaveLength(0);
  });
});
