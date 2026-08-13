import {
  formatCompactCurrency,
  formatExactCurrency,
} from "../simulation/currency";
import type { JobSettlement, LedgerEvent } from "../simulation/types";

export interface SettlementPresentationInput {
  settlement: JobSettlement | null;
  workloadName: string | null;
  completedJobs: number;
  failureCause?: string;
  recoveryQuote?: { trend: string; grossQuote: number } | null;
  showNextCue: boolean;
}

export interface SettlementPresentation {
  settlement: JobSettlement | null;
  overview: string;
  outcome: string | null;
  netChange: string | null;
  recognition: string | null;
  failureCause: string | null;
  recovery: string | null;
  nextCue: string | null;
  accounting: {
    task: string;
    outcomeCounts: string;
    equation: string;
    payment: string;
    cashChange: string;
    precision: string;
  } | null;
}

function signedCurrency(
  amount: number,
  formatter: (amount: number) => string,
): string {
  return `${amount >= 0 ? "+" : "−"}${formatter(Math.abs(amount))}`;
}

/**
 * Settlement ledger sentences retain the accepted task ID. Match that durable
 * provenance instead of treating a later unrelated failure as the settlement's
 * cause; the ledger is intentionally bounded, so a missing retained record
 * remains an honest unknown handled by the presentation fallback.
 */
export function findSettlementFailureRecord(
  settlement: JobSettlement | null,
  ledger: readonly LedgerEvent[],
): LedgerEvent | null {
  if (!settlement || settlement.failed !== 1) return null;
  const taskMarker = ` task ${settlement.taskId} `;
  return (
    [...ledger]
      .reverse()
      .find(
        (event) =>
          event.kind === "failure" && event.message.includes(taskMarker),
      ) ?? null
  );
}

/**
 * The latest-settlement card is a local presentation selector, not an
 * accounting engine. It keeps the compact decision layer separate from the
 * exact, engine-owned settlement provenance shown by its single disclosure.
 */
export function selectSettlementPresentation({
  settlement,
  workloadName,
  completedJobs,
  failureCause,
  recoveryQuote,
  showNextCue,
}: SettlementPresentationInput): SettlementPresentation {
  if (!settlement) {
    return {
      settlement: null,
      overview: "No payout yet — queue a job.",
      outcome: null,
      netChange: null,
      recognition: null,
      failureCause: null,
      recovery: null,
      nextCue: null,
      accounting: null,
    };
  }

  // Worker settlement values are committed at mill precision. Re-round the
  // view's subtraction so a binary residue cannot turn a fully paid cost into
  // a misleading "$0.000 unpaid" partial-payment record.
  const paidCost =
    Math.round(
      Math.max(
        0,
        Math.min(
          settlement.operatingCost,
          settlement.grossPayout - settlement.netChange,
        ),
      ) * 1000,
    ) / 1000;
  const unpaidCost = Math.max(
    0,
    Math.round((settlement.operatingCost - paidCost) * 1000) / 1000,
  );
  const economicNet = settlement.grossPayout - settlement.operatingCost;
  const exact = (amount: number) => formatExactCurrency(amount);
  const workload = workloadName ?? "Selected workload";
  const failed = settlement.failed === 1;
  const defaultCause = "Delivery did not clear the modeled reliability check.";
  const recognition =
    settlement.completed === 1 && [1, 5, 12].includes(completedJobs)
      ? completedJobs === 1
        ? "First successful delivery recorded — no bonus applied."
        : completedJobs === 5
          ? "Five successful deliveries recorded — no bonus applied."
          : "Twelve successful deliveries recorded — no bonus applied."
      : null;
  const cause = failed ? (failureCause ?? defaultCause) : null;
  const recovery = failed
    ? `Recovery forecast: ${recoveryQuote?.trend ?? "steady"} quote ${formatCompactCurrency(recoveryQuote?.grossQuote ?? 0)} after time recovery. No recovery action was applied.`
    : null;

  return {
    settlement,
    overview: `${workload} ${failed ? "failed before delivery." : "delivered successfully."}`,
    outcome: failed ? "Failed delivery" : "Successful delivery",
    netChange: `${signedCurrency(settlement.netChange, formatCompactCurrency)} cash change`,
    recognition,
    failureCause: cause,
    recovery,
    nextCue: showNextCue
      ? failed
        ? "Next: repair the named constraint or choose a viable route before queueing again."
        : "Next: choose a workload or queue another job above."
      : null,
    accounting: {
      task: `Task ID ${settlement.taskId} · locked gross quote ${exact(settlement.lockedGrossQuote)}.`,
      outcomeCounts: `${settlement.completed} completed · ${settlement.failed} failed.`,
      equation: `${exact(settlement.grossPayout)} gross payout − ${exact(settlement.operatingCost)} configured actual cost = ${signedCurrency(economicNet, exact)} economic net.`,
      payment:
        unpaidCost > 0
          ? `${exact(settlement.operatingCost)} configured actual costs · ${exact(paidCost)} paid · ${exact(unpaidCost)} unpaid because cash cannot go below ${exact(0)}.`
          : `${exact(settlement.operatingCost)} configured actual costs · ${exact(paidCost)} paid in full.`,
      cashChange: `${signedCurrency(settlement.netChange, exact)} cash change after the cash floor.`,
      precision: "Three decimals shown to preserve sub-cent accounting.",
    },
  };
}
