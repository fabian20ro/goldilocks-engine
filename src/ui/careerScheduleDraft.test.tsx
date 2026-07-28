// @vitest-environment jsdom

import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
} from "../simulation/engine";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import type { SimulationState } from "../simulation/types";
import {
  careerScheduleDraftBoundary,
  createCareerScheduleCommandBatch,
  latestCareerScheduleWorkerRejection,
  normalizeCareerScheduleDraft,
  replaceCareerScheduleHours,
  useCareerScheduleDraft,
} from "./careerScheduleDraft";

const emptyDraft = normalizeCareerScheduleDraft(
  createInitialState(4051).career.schedule.allocations,
);

function DraftOwnerHarness() {
  const [state, setState] = useState(() => createInitialState(4052));
  const [tab, setTab] = useState<"career" | "inspect">("career");
  const schedule = useCareerScheduleDraft(state);
  return (
    <>
      <button type="button" onClick={() => setTab("career")}>
        Career
      </button>
      <button type="button" onClick={() => setTab("inspect")}>
        Inspect
      </button>
      <button
        type="button"
        onClick={() =>
          setState((current) =>
            reduceWorkerRequest(current, { type: "TICK", seconds: 0.5 }),
          )
        }
      >
        Worker tick
      </button>
      {tab === "career" ? (
        <input
          type="number"
          aria-label="Freelance delivery evening hours"
          value={schedule.draft.freelance}
          onChange={(event) =>
            schedule.setRouteHours(
              "freelance",
              event.currentTarget.valueAsNumber,
            )
          }
        />
      ) : null}
    </>
  );
}

describe("App-session Career schedule draft", () => {
  it("initializes from the restored Worker schedule and begins blank after malformed recovery", () => {
    const restored = applyCommand(createInitialState(4050), {
      type: "SET_EVENING_ALLOCATION",
      route: "freelance",
      hours: 2,
    });
    const restoredHook = renderHook(() => useCareerScheduleDraft(restored));
    expect(restoredHook.result.current.draft.freelance).toBe(2);

    const recovered = restoreSimulationState(null, 4050);
    const recoveredHook = renderHook(() => useCareerScheduleDraft(recovered));
    expect(recoveredHook.result.current.draft).toEqual(emptyDraft);
  });

  it("normalizes quarter-hour replacements, caps, full schedules, and zero", () => {
    expect(
      replaceCareerScheduleHours(emptyDraft, "freelance", 0.38),
    ).toMatchObject({
      freelance: 0.5,
    });
    const capped = replaceCareerScheduleHours(
      replaceCareerScheduleHours(emptyDraft, "freelance", 3),
      "competition",
      2,
    );
    expect(capped).toMatchObject({ freelance: 3, competition: 1 });
    expect(replaceCareerScheduleHours(capped, "freelance", 2)).toMatchObject({
      freelance: 2,
      competition: 1,
    });
    const full = replaceCareerScheduleHours(emptyDraft, "product", 4);
    expect(replaceCareerScheduleHours(full, "maintenance", 1)).toMatchObject({
      product: 4,
      maintenance: 0,
    });
    expect(replaceCareerScheduleHours(full, "product", 0)).toMatchObject({
      product: 0,
    });
  });

  it("constructs exactly four allocation commands followed by RUN_EVENING", () => {
    const commands = createCareerScheduleCommandBatch(
      replaceCareerScheduleHours(emptyDraft, "freelance", 3),
    );
    expect(commands).toEqual([
      { type: "SET_EVENING_ALLOCATION", route: "freelance", hours: 3 },
      { type: "SET_EVENING_ALLOCATION", route: "competition", hours: 0 },
      { type: "SET_EVENING_ALLOCATION", route: "product", hours: 0 },
      { type: "SET_EVENING_ALLOCATION", route: "maintenance", hours: 0 },
      { type: "RUN_EVENING" },
    ]);
  });

  it("keeps unsubmitted edits through Worker ticks, pause publications, and ordinary rerenders", () => {
    const initial = createInitialState(4053);
    const { result, rerender } = renderHook(
      ({ state }: { state: SimulationState }) => useCareerScheduleDraft(state),
      { initialProps: { state: initial } },
    );

    act(() => result.current.setRouteHours("freelance", 3));
    expect(result.current.draft.freelance).toBe(3);

    const afterTick = structuredClone(
      reduceWorkerRequest(initial, { type: "TICK", seconds: 0.5 }),
    );
    expect(afterTick.career.schedule.allocations).not.toBe(
      initial.career.schedule.allocations,
    );
    rerender({ state: afterTick });
    expect(result.current.draft.freelance).toBe(3);

    const paused = applyCommand(afterTick, { type: "TOGGLE_PAUSE" });
    rerender({ state: paused });
    expect(result.current.draft.freelance).toBe(3);
    rerender({ state: { ...paused } });
    expect(result.current.draft.freelance).toBe(3);
  });

  it("resets only after a completed Worker evening, a reset/replay, or an ending", async () => {
    const initial = createInitialState(4054);
    const { result, rerender } = renderHook(
      ({ state }: { state: SimulationState }) => useCareerScheduleDraft(state),
      { initialProps: { state: initial } },
    );
    act(() => result.current.setRouteHours("freelance", 3));
    expect(result.current.draft.freelance).toBe(3);

    const completed = reduceWorkerRequest(initial, {
      type: "COMMAND_BATCH",
      commands: createCareerScheduleCommandBatch(result.current.draft),
    });
    expect(completed.career.schedule.completedEvenings).toBe(1);
    rerender({ state: completed });
    await waitFor(() => expect(result.current.draft.freelance).toBe(0));

    act(() => result.current.setRouteHours("competition", 2));
    const replay = applyCommand(completed, {
      type: "RESET",
      seed: completed.seed,
    });
    expect(careerScheduleDraftBoundary(replay)).not.toBe(
      careerScheduleDraftBoundary(completed),
    );
    rerender({ state: replay });
    await waitFor(() => expect(result.current.draft.competition).toBe(0));

    act(() => result.current.setRouteHours("product", 2));
    const ending: SimulationState = {
      ...replay,
      career: {
        ...replay.career,
        runEnding: {
          id: "honest-independent-builder",
          title: "Test ending",
          outcome: "success",
          eventId: "evt-test-ending",
          diagnosticUnlockId: "decision-history",
          reachedAtTick: replay.tick,
        },
      },
    };
    rerender({ state: ending });
    await waitFor(() => expect(result.current.draft.product).toBe(0));
  });

  it("retains a valid local draft when the Worker rejects an evening", () => {
    const initial = createInitialState(4055);
    const { result, rerender } = renderHook(
      ({ state }: { state: SimulationState }) => useCareerScheduleDraft(state),
      { initialProps: { state: initial } },
    );
    act(() => result.current.setRouteHours("freelance", 3));
    const rejected = applyCommand(initial, { type: "RUN_EVENING" });
    rerender({ state: rejected });

    expect(result.current.draft.freelance).toBe(3);
    expect(latestCareerScheduleWorkerRejection(rejected)).toMatch(
      /No evening was run/i,
    );

    const completed = reduceWorkerRequest(rejected, {
      type: "COMMAND_BATCH",
      commands: createCareerScheduleCommandBatch(result.current.draft),
    });
    expect(latestCareerScheduleWorkerRejection(completed)).toBeNull();
  });

  it("keeps the App-owned draft when the Career tab unmounts", () => {
    render(<DraftOwnerHarness />);
    const freelance = screen.getByLabelText("Freelance delivery evening hours");
    fireEvent.change(freelance, { target: { value: "3" } });
    expect(freelance).toHaveValue(3);
    fireEvent.click(screen.getByRole("button", { name: "Worker tick" }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    fireEvent.click(screen.getByRole("button", { name: "Career" }));
    expect(
      screen.getByLabelText("Freelance delivery evening hours"),
    ).toHaveValue(3);
  });
});
