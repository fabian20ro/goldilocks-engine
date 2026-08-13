// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "../simulation/engine";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import { JobsView } from "./App";
import { selectFirstSessionPresentation } from "./firstSessionPresentation";
import { findSettlementFailureRecord } from "./settlementPresentation";

afterEach(cleanup);

describe("latest settlement failure provenance", () => {
  it("keeps the task's own ledger cause after a later Career incident and restore", () => {
    let state = createInitialState(80_078);
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);

    expect(state.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
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

    render(
      <JobsView
        state={restored}
        command={vi.fn()}
        commandBatch={vi.fn()}
        reducedMotion={false}
        usefulTarget={null}
        onUsefulTargetChange={vi.fn()}
        onboarding={selectFirstSessionPresentation(restored)}
      />,
    );

    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "The active pipeline had no model stage.",
    );
  });
});
