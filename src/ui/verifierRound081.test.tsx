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

describe("verifier round 081 structural settlement provenance", () => {
  it("does not reseal a stale save's forged structural settlement relink as a known cause", () => {
    let state = failedStarter(81_101);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "Later unrelated record",
    });

    const corrupted = structuredClone(state);
    const decoy = corrupted.ledger.at(-1);
    expect(decoy).toBeDefined();
    expect(corrupted.lastSettlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });

    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === decoy?.id
        ? {
            ...event,
            kind: "failure" as const,
            settlementTaskId: corrupted.lastSettlement?.taskId,
            settlementFailureCause: "memory-capacity-exceeded" as const,
            directCause: "Forged unrelated direct cause.",
          }
        : event,
    );
    if (corrupted.lastSettlement)
      corrupted.lastSettlement.ledgerEventId = decoy?.id;

    const restored = restoreSimulationState(corrupted, 81_101);
    const cause = settlementFailureCauseText(
      findSettlementFailureRecord(restored.lastSettlement, restored.ledger),
    );

    // The entire typed relation is untrusted because the enclosing integrity
    // seal is stale. Recovery may reset the save or retain its settlement, but
    // it must not elevate a forged event/cause pair into player-visible fact.
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

  it("recovers a stale future event-ID collision instead of freezing the next settlement", () => {
    let state = failedStarter(81_102);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "Collision target",
    });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });

    const corrupted = structuredClone(state);
    const target = corrupted.ledger.find(
      (event) =>
        event.message === "Current configuration captured for comparison.",
    );
    expect(target).toBeDefined();
    const futureEventId = `evt-${corrupted.tick + 10_000}-${corrupted.eventSequence + 1}`;
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === target?.id ? { ...event, id: futureEventId } : event,
    );

    const restored = restoreSimulationState(corrupted, 81_102);
    const afterTick = tick(restored, 10);

    // An accepted/resealed malformed save must remain operable. The candidate
    // currently returns the pre-tick state because appendEvent produces a
    // duplicate ID and the transactional tick rejects its own result.
    expect(afterTick.tick).toBeGreaterThan(restored.tick);
  });
});
