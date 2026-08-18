import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationStateWithReport,
  sealSimulationState,
  serializeSimulationState,
  tick,
} from "./engine";
import { runEndingScenario } from "./evaluationBalance";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function unsealed<T extends object>(value: T): T {
  const copy = clone(value) as T & Record<string, unknown>;
  delete copy.integrity;
  return copy;
}

describe("M7D sealed-only recovery invariants", () => {
  it("resets an unsealed queue transaction before reading its quote", () => {
    const queued = applyCommand(createInitialState(114_001), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    const valid = restoreSimulationStateWithReport(
      unsealed(queued),
      114_001,
      true,
    );
    expect(valid.recovery.disposition).toBe("reset");
    expect(valid.recovery.reason).toBe("invalid-integrity");
    expect(valid.state).toEqual(createInitialState(114_001));
    expect(isStateValid(valid.state)).toBe(true);

    const forged = unsealed(queued) as typeof queued;
    forged.jobs = {
      ...forged.jobs,
      waitingTasks: forged.jobs.waitingTasks.map((task) => ({
        ...task,
        lockedGrossQuote: 0.5,
      })),
    };
    const recovered = restoreSimulationStateWithReport(forged, 114_001, true);
    expect(recovered.recovery.disposition).toBe("reset");
    expect(recovered.recovery.reason).toBe("invalid-integrity");
    expect(recovered.state).toEqual(createInitialState(114_001));
    expect(isStateValid(recovered.state)).toBe(true);
  });

  it.each([
    [
      "Career",
      (state: ReturnType<typeof createInitialState>) => {
        state.career.savings = 99;
        state.career.costsPaid = 2;
      },
    ],
    [
      "Research",
      (state: ReturnType<typeof createInitialState>) => {
        state.research.retainedKnowledge = 99;
      },
    ],
    [
      "Hype/Fear",
      (state: ReturnType<typeof createInitialState>) => {
        state.hypeFear.attention = 99;
      },
    ],
    [
      "Laboratory",
      (state: ReturnType<typeof createInitialState>) => {
        state.laboratory.totalOperatingCost = 1;
      },
    ],
    [
      "workload selection",
      (state: ReturnType<typeof createInitialState>) => {
        state.workloadId = "long-document";
      },
    ],
    [
      "evaluation counter",
      (state: ReturnType<typeof createInitialState>) => {
        state.career.evaluation.capitalCommitments = 1;
      },
    ],
  ] as const)(
    "resets shape-valid unsealed %s substitutions",
    (_name, mutate) => {
      const source = unsealed(createInitialState(114_010));
      mutate(source);

      const result = restoreSimulationStateWithReport(source, 114_010, true);
      const baseline = createInitialState(114_010);
      expect(result.recovery.disposition).toBe("reset");
      expect(result.recovery.reason).toBe("invalid-integrity");
      expect(result.state).toEqual(baseline);
      expect(isStateValid(result.state)).toBe(true);
    },
  );

  it("retains only canonical topology for a corroborated expanded run", () => {
    const funded = sealSimulationState({
      ...createInitialState(114_020),
      resources: { ...createInitialState(114_020).resources, money: 100 },
    });
    const expanded = applyCommand(
      applyCommand(funded, {
        type: "BUY_EXPANSION",
        expansionId: "workstation-expansion-i",
      }),
      { type: "SET_EXPANSION_ACTIVE", active: true },
    );
    expect(expanded.slots).toHaveLength(8);
    expect(isStateValid(expanded)).toBe(true);

    const intact = restoreSimulationStateWithReport(expanded, 114_020, true);
    expect(intact.recovery.disposition).toBe("none");
    expect(intact.state.slots).toEqual(expanded.slots);

    const uncorroborated = unsealed(expanded) as typeof expanded;
    uncorroborated.ledger = uncorroborated.ledger.filter(
      (event) => !event.message.startsWith("Workstation Expansion I purchased"),
    );
    const recovered = restoreSimulationStateWithReport(
      uncorroborated,
      114_020,
      true,
    );
    expect(recovered.recovery.disposition).toBe("reset");
    expect(recovered.recovery.reason).toBe("invalid-integrity");
    expect(recovered.state).toEqual(createInitialState(114_020));
    expect(isStateValid(recovered.state)).toBe(true);
  });

  it("reconstructs settlement totals from typed evidence instead of mutable counters", () => {
    let settled = applyCommand(createInitialState(114_025), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    for (let minute = 0; minute < 60 && settled.jobs.queued > 0; minute += 1)
      settled = tick(settled, 60);
    expect(settled.jobs.queued).toBe(0);
    const forged = unsealed(settled) as typeof settled;
    forged.jobs = {
      ...forged.jobs,
      grossEarned: 999,
      operatingCostsPaid: 999,
    };
    const recovered = restoreSimulationStateWithReport(forged, 114_025, true);
    expect(recovered.recovery.disposition).toBe("reset");
    expect(recovered.recovery.reason).toBe("invalid-integrity");
    expect(recovered.state).toEqual(createInitialState(114_025));
    expect(isStateValid(recovered.state)).toBe(true);
  });

  it("binds a retained ending to its exact event semantics and resets its meta pair", () => {
    const sealed = runEndingScenario(114_030, "tutorial-loop");
    expect(isStateValid(sealed)).toBe(true);
    expect(
      restoreSimulationStateWithReport(sealed, 114_030, true).state.career
        .runEnding,
    ).toEqual(sealed.career.runEnding);

    const forged = unsealed(sealed) as typeof sealed;
    forged.career = {
      ...forged.career,
      runEnding: {
        ...forged.career.runEnding!,
        id: "public-leaderboard-hero",
        title: "Public Leaderboard Hero",
        diagnosticUnlockId: "leakage-warning",
      },
    };
    forged.meta = {
      ...forged.meta,
      unlockedDiagnosticIds: ["leakage-warning"],
      completedEndingIds: ["public-leaderboard-hero"],
    };
    const recovered = restoreSimulationStateWithReport(forged, 114_030, true);
    expect(recovered.recovery.disposition).toBe("reset");
    expect(recovered.recovery.reason).toBe("invalid-integrity");
    expect(recovered.state).toEqual(createInitialState(114_030));
    expect(isStateValid(recovered.state)).toBe(true);
  });

  it("is deterministic and idempotent across bounded progression substitutions", () => {
    const substitutions = [
      "career",
      "research",
      "hype",
      "lab",
      "workload",
    ] as const;
    fc.assert(
      fc.property(fc.constantFrom(...substitutions), (kind) => {
        const source = unsealed(createInitialState(114_040));
        if (kind === "career") source.career.savings = 99;
        if (kind === "research") source.research.retainedKnowledge = 99;
        if (kind === "hype") source.hypeFear.attention = 99;
        if (kind === "lab") source.laboratory.totalOperatingCost = 1;
        if (kind === "workload") source.workloadId = "long-document";

        const first = restoreSimulationStateWithReport(
          source,
          114_040,
          true,
        ).state;
        const second = restoreSimulationStateWithReport(
          JSON.parse(serializeSimulationState(first)) as unknown,
          114_040,
          true,
        ).state;
        expect(isStateValid(first)).toBe(true);
        expect(serializeSimulationState(second)).toBe(
          serializeSimulationState(first),
        );
      }),
      { numRuns: 12 },
    );
  });
});
