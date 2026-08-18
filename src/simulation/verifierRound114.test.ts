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

function clone<T>(value: T): T {
  return structuredClone(value);
}

function unsealed<T extends object>(value: T): T {
  const copy = clone(value) as T & Record<string, unknown>;
  delete copy.integrity;
  return copy;
}

describe("round 114 independent closed-world recovery adversaries", () => {
  it("resets shape-valid forged evaluation additions when no ledger event proves them", () => {
    const seed = 114_101;
    const baseline = createInitialState(seed);
    const forged = unsealed(baseline) as typeof baseline;
    forged.career = {
      ...forged.career,
      evaluation: {
        ...forged.career.evaluation,
        publicScore: 99,
        leakageRisk: 1,
        distributionShiftRisk: 8,
      },
    };

    const result = restoreSimulationStateWithReport(forged, seed, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state.career.evaluation).toEqual(baseline.career.evaluation);
    expect(isStateValid(result.state)).toBe(true);
  });

  it("rejects a shape-valid placement record whose engine message was altered", () => {
    const seed = 114_102;
    const initial = createInitialState(seed);
    let source = sealSimulationState({
      ...initial,
      resources: { ...initial.resources, money: 20 },
    });
    source = applyCommand(source, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    source = applyCommand(source, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "verify",
    });
    const forged = unsealed(source) as typeof source;
    forged.ledger = forged.ledger.map((event) =>
      event.modulePlacementId === "precision-cleaner"
        ? { ...event, message: `${event.message} forged suffix` }
        : event,
    );

    const result = restoreSimulationStateWithReport(forged, seed, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state).toEqual(createInitialState(seed));
    expect(isStateValid(result.state)).toBe(true);
  });

  it("does not preserve a queue quote when the unsealed projection and ledger quote are both forged", () => {
    const seed = 114_103;
    const source = applyCommand(createInitialState(seed), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    const forged = unsealed(source) as typeof source;
    forged.jobs = {
      ...forged.jobs,
      waitingTasks: forged.jobs.waitingTasks.map((task) => ({
        ...task,
        lockedGrossQuote: 0.5,
      })),
    };
    forged.ledger = forged.ledger.map((event) =>
      event.queuedTaskQuotes !== undefined
        ? { ...event, queuedTaskQuotes: [0.5] }
        : event,
    );

    const result = restoreSimulationStateWithReport(forged, seed, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state).toEqual(createInitialState(seed));
    expect(isStateValid(result.state)).toBe(true);
  });

  it("does not count a settlement whose typed accounting payload was altered", () => {
    const seed = 114_105;
    let source = applyCommand(createInitialState(seed), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    source = tick(source, 60);
    const forged = unsealed(source) as typeof source;
    forged.ledger = forged.ledger.map((event) =>
      event.settlementTaskId === "task-0-1"
        ? {
            ...event,
            settlementGrossPayout: 1,
            settlementOperatingCost: 0,
            settlementOperatingCostPaid: 0,
            settlementNetChange: 1,
          }
        : event,
    );
    forged.lastSettlement = forged.lastSettlement
      ? {
          ...forged.lastSettlement,
          grossPayout: 1,
          operatingCost: 0,
          netChange: 1,
        }
      : null;

    const result = restoreSimulationStateWithReport(forged, seed, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state).toEqual(createInitialState(seed));
    expect(isStateValid(result.state)).toBe(true);
  });

  it("resets an unsealed settlement, while a sealed settlement reloads idempotently", () => {
    const seed = 114_104;
    let source = applyCommand(createInitialState(seed), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    source = tick(source, 60);
    expect(source.jobs.completed + source.jobs.failed).toBe(1);
    expect(
      source.ledger.some((event) => event.settlementTaskId !== undefined),
    ).toBe(true);

    const recovered = restoreSimulationStateWithReport(
      unsealed(source),
      seed,
      true,
    );
    expect(recovered.recovery.disposition).toBe("reset");
    expect(recovered.recovery.reason).toBe("invalid-integrity");
    expect(recovered.state).toEqual(createInitialState(seed));

    const sealed = restoreSimulationStateWithReport(source, seed, true);
    expect(sealed.recovery.disposition).toBe("none");
    expect(sealed.state.jobs.completed).toBe(source.jobs.completed);
    expect(sealed.state.jobs.failed).toBe(source.jobs.failed);
    expect(sealed.state.jobs.grossEarned).toBe(source.jobs.grossEarned);
    expect(isStateValid(recovered.state)).toBe(true);

    const reloaded = restoreSimulationStateWithReport(
      JSON.parse(serializeSimulationState(sealed.state)) as unknown,
      seed,
      true,
    );
    expect(reloaded.recovery.disposition).toBe("none");
    expect(serializeSimulationState(reloaded.state)).toBe(
      serializeSimulationState(sealed.state),
    );
  });
});
