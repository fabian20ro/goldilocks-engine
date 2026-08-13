// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  tick,
} from "../simulation/engine";
import type { SimulationState } from "../simulation/types";
import { JobsView } from "./App";
import { selectFirstSessionPresentation } from "./firstSessionPresentation";
import {
  findSettlementFailureRecord,
  settlementFailureCauseText,
} from "./settlementPresentation";

afterEach(cleanup);

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

describe("verifier round 082 stale canonical provenance", () => {
  it("does not treat canonical-looking IDs as proof of an altered failure marker", () => {
    const state = failedStarter(82_001);
    const corrupted = structuredClone(state);

    // The tail and link remain byte-for-byte canonical-looking. Only a typed
    // event field is changed, so a stale integrity seal cannot authenticate
    // this as the original failure cause.
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === corrupted.lastSettlement?.ledgerEventId
        ? {
            ...event,
            settlementFailureCause: "memory-capacity-exceeded" as const,
          }
        : event,
    );

    const restored = restoreSimulationState(corrupted, 82_001);
    const cause = settlementFailureCauseText(
      findSettlementFailureRecord(restored.lastSettlement, restored.ledger),
    );

    // A damaged seal may retain usable state, but must not elevate modified
    // provenance into a precise engine explanation.
    expect(cause).toBeUndefined();

    if (restored.lastSettlement) {
      renderJobs(restored);
      expect(
        screen.getByText("Failure record:").parentElement,
      ).toHaveTextContent(
        "Cause unknown — the retained settlement record is unavailable.",
      );
    }
  });
});
