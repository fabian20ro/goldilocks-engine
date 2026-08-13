import { describe, expect, it } from "vitest";
import type { JobSettlement } from "../simulation/types";
import { selectSettlementPresentation } from "./settlementPresentation";

const successfulSettlement: JobSettlement = {
  tick: 12,
  workloadId: "interactive-chat",
  completed: 1,
  failed: 0,
  grossPayout: 1.4,
  operatingCost: 0.065,
  netChange: 1.335,
  taskId: "task-0-1",
  lockedGrossQuote: 1.4,
};

function presentation(
  settlement: JobSettlement | null,
  options: Partial<Parameters<typeof selectSettlementPresentation>[0]> = {},
) {
  return selectSettlementPresentation({
    settlement,
    workloadName: settlement ? "Interactive Chat" : null,
    completedJobs: settlement?.completed ?? 0,
    showNextCue: true,
    ...options,
  });
}

describe("latest settlement presentation", () => {
  it("keeps a first successful delivery concise while retaining exact provenance", () => {
    const result = presentation(successfulSettlement);

    expect(result).toMatchObject({
      overview: "Interactive Chat delivered successfully.",
      outcome: "Successful delivery",
      netChange: "+$1.335 cash change",
      recognition: "First successful delivery recorded — no bonus applied.",
      nextCue: "Next: choose a workload or queue another job above.",
    });
    expect(result.accounting).toEqual({
      task: "Task ID task-0-1 · locked gross quote $1.400.",
      outcomeCounts: "1 completed · 0 failed.",
      equation:
        "$1.400 gross payout − $0.065 configured actual cost = +$1.335 economic net.",
      payment: "$0.065 configured actual costs · $0.065 paid in full.",
      cashChange: "+$1.335 cash change after the cash floor.",
      precision: "Three decimals shown to preserve sub-cent accounting.",
    });
  });

  it("names a zero-payout failure and preserves its direct cause and recovery", () => {
    const result = presentation(
      {
        ...successfulSettlement,
        completed: 0,
        failed: 1,
        grossPayout: 0,
        operatingCost: 0.01,
        netChange: -0.01,
      },
      {
        completedJobs: 0,
        failureCause: "The active pipeline had no model stage.",
        recoveryQuote: { trend: "steady", grossQuote: 1.4 },
      },
    );

    expect(result).toMatchObject({
      overview: "Interactive Chat failed before delivery.",
      outcome: "Failed delivery",
      netChange: "−$0.01 cash change",
      failureCause: "The active pipeline had no model stage.",
      recovery:
        "Recovery forecast: steady quote $1.40 after time recovery. No recovery action was applied.",
      nextCue:
        "Next: repair the named constraint or choose a viable route before queueing again.",
    });
    expect(result.accounting).toMatchObject({
      equation:
        "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
      payment: "$0.010 configured actual costs · $0.010 paid in full.",
    });
  });

  it("distinguishes the cash-floor change from the exact partial-cost equation", () => {
    const result = presentation(
      {
        ...successfulSettlement,
        completed: 0,
        failed: 1,
        grossPayout: 0,
        operatingCost: 0.01,
        netChange: -0.005,
      },
      { completedJobs: 0 },
    );

    expect(result.netChange).toBe("−$0.005 cash change");
    expect(result.accounting).toMatchObject({
      equation:
        "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
      payment:
        "$0.010 configured actual costs · $0.005 paid · $0.005 unpaid because cash cannot go below $0.000.",
      cashChange: "−$0.005 cash change after the cash floor.",
    });
  });

  it("reports an unknown cause instead of inventing one when provenance is unavailable", () => {
    const result = presentation(
      {
        ...successfulSettlement,
        completed: 0,
        failed: 1,
        grossPayout: 0,
        operatingCost: 0.01,
        netChange: -0.01,
      },
      { completedJobs: 0 },
    );

    expect(result).toMatchObject({
      failureCause:
        "Cause unknown — the retained settlement record is unavailable.",
      nextCue:
        "Next: inspect the current configuration or choose a viable route before queueing again.",
    });
  });

  it("does not invent an outcome, accounting record, or next action before settlement", () => {
    expect(presentation(null)).toMatchObject({
      overview: "No payout yet — queue a job.",
      outcome: null,
      netChange: null,
      accounting: null,
      nextCue: null,
    });
  });

  it("does not duplicate the finite first-session action cue", () => {
    expect(
      presentation(successfulSettlement, { showNextCue: false }).nextCue,
    ).toBeNull();
  });
});
