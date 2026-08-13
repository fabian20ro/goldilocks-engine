// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  sealSimulationState,
  tick,
} from "../simulation/engine";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import { JobsView } from "./App";
import { selectFirstSessionPresentation } from "./firstSessionPresentation";

afterEach(cleanup);

describe("verifier round 079 latest-settlement causal provenance", () => {
  it("keeps a failed job's own direct cause after a later Career failure", () => {
    let state = createInitialState(79_001);
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);

    expect(state.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
    expect(state.ledger.at(-1)?.directCause).toBe(
      "The active pipeline had no model stage.",
    );

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

    expect(isStateValid(state)).toBe(true);
    expect(state.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
    expect(
      state.ledger.some(
        (event) =>
          event.kind === "failure" &&
          event.message.startsWith(
            "Distribution-shift reliability incident recorded",
          ),
      ),
    ).toBe(true);

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

    expect(screen.getByTestId("settlement-overview")).toHaveTextContent(
      "Failed delivery Interactive Chat failed before delivery.",
    );
    expect(screen.getByText("Failure record:").parentElement).toHaveTextContent(
      "The active pipeline had no model stage.",
    );
  });
});
