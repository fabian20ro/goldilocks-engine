// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "../simulation/engine";
import type { SimulationState } from "../simulation/types";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import { JobsView } from "./App";
import { selectFirstSessionPresentation } from "./firstSessionPresentation";
import { findSettlementFailureRecord } from "./settlementPresentation";

afterEach(cleanup);

describe("latest settlement failure provenance", () => {
  function failedStarter(seed: number): SimulationState {
    let state = createInitialState(seed);
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    return tick(state, 60);
  }

  function renderJobs(state: SimulationState) {
    render(
      <JobsView
        state={state}
        command={vi.fn()}
        commandBatch={vi.fn()}
        reducedMotion={false}
        usefulTarget={null}
        onUsefulTargetChange={vi.fn()}
        onboarding={selectFirstSessionPresentation(state)}
      />,
    );
  }

  it("keeps the task's own ledger cause after a later Career incident and restore", () => {
    let state = failedStarter(80_078);

    expect(state.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
    expect(state.lastSettlement?.ledgerEventId).toEqual(expect.any(String));
    expect(
      findSettlementFailureRecord(state.lastSettlement, state.ledger),
    ).toMatchObject({
      directCause: "The active pipeline had no model stage.",
    });

    state = sealSimulationState({
      ...state,
      career: {
        ...state.career,
        product: {
          ...state.career.product,
          buildProgress: 8,
          released: true,
          releases: 1,
        },
        evaluation: {
          ...state.career.evaluation,
          distributionShiftRisk: 1.09,
        },
      },
    });
    state = reduceWorkerRequest(state, {
      type: "COMMAND_BATCH",
      commands: [
        { type: "SET_EVENING_ALLOCATION", route: "freelance", hours: 0 },
        { type: "SET_EVENING_ALLOCATION", route: "competition", hours: 0 },
        { type: "SET_EVENING_ALLOCATION", route: "product", hours: 4 },
        { type: "SET_EVENING_ALLOCATION", route: "maintenance", hours: 0 },
        { type: "RUN_EVENING" },
      ],
    });

    const laterCareerFailure = state.ledger.find((event) =>
      event.message.startsWith("Distribution-shift reliability incident"),
    );
    expect(laterCareerFailure?.kind).toBe("failure");

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      80_078,
    );
    const settlementRecord = findSettlementFailureRecord(
      restored.lastSettlement,
      restored.ledger,
    );

    expect(restored.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
    expect(settlementRecord).toMatchObject({
      directCause: "The active pipeline had no model stage.",
    });
    expect(settlementRecord?.id).not.toBe(laterCareerFailure?.id);

    renderJobs(restored);

    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "The active pipeline had no model stage.",
    );
  });

  it("uses the persisted event identity, not a later same-task decoy", () => {
    let state = failedStarter(81_001);
    const settlementEventId = state.lastSettlement?.ledgerEventId;
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "After failed delivery",
    });

    const corrupted = structuredClone(state);
    const decoy = corrupted.ledger.at(-1);
    expect(decoy).toBeDefined();
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === decoy?.id
        ? {
            ...event,
            kind: "failure" as const,
            message: `Unrelated later failure mentioned task ${corrupted.lastSettlement?.taskId} but did not settle it.`,
            directCause: "Forged unrelated cause.",
          }
        : event,
    );

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(corrupted)),
      81_001,
    );
    const settlementRecord = findSettlementFailureRecord(
      restored.lastSettlement,
      restored.ledger,
    );

    expect(isStateValid(restored)).toBe(true);
    expect(restored.lastSettlement?.ledgerEventId).toBe(settlementEventId);
    expect(settlementRecord).toMatchObject({
      directCause: "The active pipeline had no model stage.",
    });
    expect(settlementRecord?.id).not.toBe(decoy?.id);

    renderJobs(restored);
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "The active pipeline had no model stage.",
    );
    expect(
      screen.getByText("Failure record:").parentElement,
    ).not.toHaveTextContent("Forged unrelated cause.");
  });

  it("uses the settlement record's closed cause instead of mutable ledger prose", () => {
    const state = failedStarter(81_003);
    const corrupted = structuredClone(state);
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === corrupted.lastSettlement?.ledgerEventId
        ? { ...event, directCause: "Forged unrelated cause." }
        : event,
    );

    const restored = restoreSimulationState(corrupted, 81_003);

    expect(isStateValid(restored)).toBe(true);
    expect(
      findSettlementFailureRecord(restored.lastSettlement, restored.ledger),
    ).toMatchObject({
      directCause: "Forged unrelated cause.",
      settlementFailureCause: "no-model-stage",
    });

    renderJobs(restored);
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "The active pipeline had no model stage.",
    );
    expect(
      screen.getByText("Failure record:").parentElement,
    ).not.toHaveTextContent("Forged unrelated cause.");
  });

  it("does not reseal a forged structural relink as a precise failure", () => {
    let state = failedStarter(81_004);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "After failed delivery",
    });
    const corrupted = structuredClone(state);
    const decoy = corrupted.ledger.at(-1);
    expect(decoy).toBeDefined();
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === decoy?.id
        ? {
            ...event,
            kind: "failure" as const,
            settlementTaskId: corrupted.lastSettlement?.taskId,
            settlementFailureCause: "memory-capacity-exceeded" as const,
            directCause: "Required memory exceeded available memory.",
          }
        : event,
    );
    if (corrupted.lastSettlement)
      corrupted.lastSettlement.ledgerEventId = decoy?.id;

    const restored = restoreSimulationState(corrupted, 81_004);

    expect(isStateValid(restored)).toBe(true);
    expect(
      findSettlementFailureRecord(restored.lastSettlement, restored.ledger),
    ).toBeNull();

    renderJobs(restored);
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "Cause unknown — the retained settlement record is unavailable.",
    );
    expect(
      screen.getByText("Failure record:").parentElement,
    ).not.toHaveTextContent("Forged unrelated cause.");
  });

  it("does not trust a reordered stale tail as settlement provenance", () => {
    let state = failedStarter(81_005);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "After failed delivery",
    });
    const corrupted = structuredClone(state);
    const settlementIndex = corrupted.ledger.findIndex(
      (event) => event.id === corrupted.lastSettlement?.ledgerEventId,
    );
    const decoyIndex = corrupted.ledger.length - 1;
    expect(settlementIndex).toBeGreaterThanOrEqual(0);
    expect(decoyIndex).toBeGreaterThan(settlementIndex);
    const reordered = [...corrupted.ledger];
    const settlementEvent = reordered[settlementIndex];
    reordered[settlementIndex] = reordered[decoyIndex]!;
    reordered[decoyIndex] = settlementEvent!;
    corrupted.ledger = reordered;
    if (corrupted.lastSettlement)
      corrupted.lastSettlement.ledgerEventId = reordered[settlementIndex]?.id;

    const restored = restoreSimulationState(corrupted, 81_005);

    expect(isStateValid(restored)).toBe(true);
    expect(restored.lastSettlement?.ledgerEventId).toBeUndefined();
    expect(
      findSettlementFailureRecord(restored.lastSettlement, restored.ledger),
    ).toBeNull();

    renderJobs(restored);
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "Cause unknown — the retained settlement record is unavailable.",
    );
  });

  it("keeps legacy or malformed provenance as an honest unknown", () => {
    let state = failedStarter(81_002);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "After failed delivery",
    });
    const legacy = structuredClone(state);
    const decoy = legacy.ledger.at(-1);
    expect(legacy.lastSettlement).not.toBeNull();
    if (legacy.lastSettlement) delete legacy.lastSettlement.ledgerEventId;
    legacy.ledger = legacy.ledger.map((event) =>
      event.id === decoy?.id
        ? {
            ...event,
            kind: "failure" as const,
            message: `Unrelated later failure mentioned task ${legacy.lastSettlement?.taskId} but did not settle it.`,
            directCause: "Forged unrelated cause.",
          }
        : event,
    );

    const restoredLegacy = restoreSimulationState(
      JSON.parse(JSON.stringify(legacy)),
      81_002,
    );
    const malformed = structuredClone(legacy);
    if (malformed.lastSettlement)
      malformed.lastSettlement.ledgerEventId = 42 as never;
    const restoredMalformed = restoreSimulationState(malformed, 81_002);

    expect(isStateValid(restoredLegacy)).toBe(true);
    expect(isStateValid(restoredMalformed)).toBe(true);
    expect(restoredMalformed.lastSettlement).toBeNull();
    expect(
      findSettlementFailureRecord(
        restoredLegacy.lastSettlement,
        restoredLegacy.ledger,
      ),
    ).toBeNull();
    expect(
      findSettlementFailureRecord(
        restoredMalformed.lastSettlement,
        restoredMalformed.ledger,
      ),
    ).toBeNull();

    renderJobs(restoredLegacy);
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "Cause unknown — the retained settlement record is unavailable.",
    );
    expect(
      screen.getByText("Failure record:").parentElement,
    ).not.toHaveTextContent("Forged unrelated cause.");
  });
});
