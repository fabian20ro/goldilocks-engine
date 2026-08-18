// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  tick,
} from "../simulation/engine";
import type { SimulationState } from "../simulation/types";
import { JobsView } from "./App";
import { selectFirstSessionPresentation } from "./firstSessionPresentation";

afterEach(cleanup);

describe("verifier round 080 settlement provenance recovery", () => {
  it("does not let stale-integrity recovery promote any settlement cause", () => {
    let state = createInitialState(80_080);
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);
    state = applyCommand(state, {
      type: "CAPTURE_BASELINE",
      label: "After failed delivery",
    });

    const settlement = state.lastSettlement;
    expect(settlement).toMatchObject({
      failed: 1,
      taskId: "task-0-1",
    });
    expect(state.ledger).toContainEqual(
      expect.objectContaining({
        directCause: "The active pipeline had no model stage.",
        kind: "failure",
      }),
    );

    // This is untrusted persisted state. D-047 backs it up and resets before
    // reading the genuine task event or the forged later record.
    const corrupted: SimulationState = structuredClone(state);
    const laterEvent = corrupted.ledger.at(-1);
    expect(laterEvent).toBeDefined();
    corrupted.ledger = corrupted.ledger.map((event) =>
      event.id === laterEvent?.id
        ? {
            ...event,
            kind: "failure" as const,
            message: `Unrelated later failure mentioned task ${settlement?.taskId} but did not settle it.`,
            directCause: "Forged unrelated cause.",
          }
        : event,
    );

    const restored = restoreSimulationState(corrupted, 80_080);
    expect(isStateValid(restored)).toBe(true);
    expect(restored).toEqual(createInitialState(80_080));

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

    expect(screen.queryByText("Failure record:")).toBeNull();
  });
});
