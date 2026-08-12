import type { CareerEveningProjection } from "../simulation/engine";
import type { CareerScheduleDraft } from "./careerScheduleDraft";

/** One transient, localized Career recap; it is never part of saved state. */
export interface CareerCompletionFeedback {
  requestId: number;
  evening: number;
  projection: CareerEveningProjection;
  nextDecision: string;
}

/**
 * This is deliberately a Career-only UI-session registry, not a general
 * command/event abstraction. Each entry belongs to one existing Worker request
 * until its matching response is handled and its state is durably acknowledged.
 */
export type CareerFeedbackTransaction =
  | {
      kind: "scheduled-evening";
      requestId: number;
      allocations: CareerScheduleDraft;
      responseReceived: boolean;
      feedback: CareerCompletionFeedback | null;
    }
  | {
      kind: "safe-offline";
      requestId: number;
      responseReceived: boolean;
      feedback: CareerCompletionFeedback | null;
    };

export type NewCareerFeedbackTransaction =
  | {
      kind: "scheduled-evening";
      requestId: number;
      allocations: CareerScheduleDraft;
    }
  | {
      kind: "safe-offline";
      requestId: number;
    };

export type CareerFeedbackTransactionRegistry = Map<
  number,
  CareerFeedbackTransaction
>;

export function createCareerFeedbackTransactionRegistry(): CareerFeedbackTransactionRegistry {
  return new Map();
}

/** Register one relevant Career request without replacing an earlier entry. */
export function registerCareerFeedbackTransaction(
  registry: CareerFeedbackTransactionRegistry,
  transaction: NewCareerFeedbackTransaction,
): void {
  if (
    !Number.isSafeInteger(transaction.requestId) ||
    transaction.requestId < 1 ||
    registry.has(transaction.requestId)
  )
    return;

  if (transaction.kind === "scheduled-evening") {
    registry.set(transaction.requestId, {
      ...transaction,
      responseReceived: false,
      feedback: null,
    });
    return;
  }

  registry.set(transaction.requestId, {
    ...transaction,
    responseReceived: false,
    feedback: null,
  });
}

/** Claim exactly one matching Worker response; duplicate deliveries are inert. */
export function claimCareerFeedbackTransaction(
  registry: CareerFeedbackTransactionRegistry,
  requestId: number,
): CareerFeedbackTransaction | null {
  const transaction = registry.get(requestId);
  if (!transaction || transaction.responseReceived) return null;
  transaction.responseReceived = true;
  return transaction;
}

/** Store one completed recap after the transaction's exact response is claimed. */
export function completeCareerFeedbackTransaction(
  transaction: CareerFeedbackTransaction,
  feedback: CareerCompletionFeedback,
): boolean {
  if (!transaction.responseReceived || transaction.feedback !== null)
    return false;
  transaction.feedback = feedback;
  return true;
}

/** A non-completion can discard only its own request's transient recap. */
export function invalidateCareerFeedbackTransaction(
  registry: CareerFeedbackTransactionRegistry,
  requestId: number,
): void {
  registry.delete(requestId);
}

/**
 * D-020 acknowledgement boundary. Every entry at or behind the durable
 * Worker watermark is removed exactly once. Entries without feedback are
 * safely discarded as recovered/orphaned requests, bounding this UI map.
 */
export function drainDurablyAcknowledgedCareerFeedback(
  registry: CareerFeedbackTransactionRegistry,
  lastDurableRequestId: number,
): readonly CareerCompletionFeedback[] {
  if (!Number.isSafeInteger(lastDurableRequestId) || lastDurableRequestId < 1)
    return [];

  const acknowledged = [...registry.values()]
    .filter((transaction) => transaction.requestId <= lastDurableRequestId)
    .sort((left, right) => left.requestId - right.requestId);
  const feedback: CareerCompletionFeedback[] = [];
  for (const transaction of acknowledged) {
    registry.delete(transaction.requestId);
    if (transaction.feedback !== null) feedback.push(transaction.feedback);
  }
  return feedback;
}

/** End/replay lifecycle cleanup; transaction data is intentionally session-only. */
export function clearCareerFeedbackTransactions(
  registry: CareerFeedbackTransactionRegistry,
): void {
  registry.clear();
}
