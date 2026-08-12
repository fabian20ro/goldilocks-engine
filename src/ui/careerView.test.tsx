// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createEstablishedScenarioState,
  createInitialState,
  getWorkloadQuote,
  projectCareerRoute,
} from "../simulation/engine";
import { CareerView, JobsView } from "./App";

const emptySchedule = {
  freelance: 0,
  competition: 0,
  product: 0,
  maintenance: 0,
} as const;

afterEach(cleanup);

describe("Career Phase 2 action hierarchy", () => {
  it("renders catalog/state-derived route summaries and live projections", () => {
    const state = createInitialState(20_704);
    const draft = { ...emptySchedule, freelance: 2 };
    const onScheduleDraftChange = vi.fn();
    const { rerender } = render(
      <CareerView
        state={state}
        command={vi.fn()}
        scheduleDraft={draft}
        scheduledDraftHours={2}
        onScheduleDraftChange={onScheduleDraftChange}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    const initial = projectCareerRoute(state, "freelance", 2);
    expect(screen.getByTestId("career-objective")).toHaveTextContent(
      "spend one four-hour evening",
    );
    expect(screen.getByTestId("career-projection-freelance")).toHaveTextContent(
      "Estimate · 2.00h",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Freelance delivery details" }),
    );
    expect(
      screen.getByLabelText("Freelance delivery details"),
    ).toHaveTextContent(`$${initial.operatingCost.toFixed(3)} operating`);

    const constrained = applyCommand(state, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 25,
    });
    const constrainedProjection = projectCareerRoute(
      constrained,
      "freelance",
      2,
    );
    rerender(
      <CareerView
        state={constrained}
        command={vi.fn()}
        scheduleDraft={draft}
        scheduledDraftHours={2}
        onScheduleDraftChange={onScheduleDraftChange}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText("Freelance delivery details"),
    ).toHaveTextContent(
      `$${constrainedProjection.electricityCost.toFixed(3)} electricity`,
    );
  });

  it("replaces Career Details and restores focus to the replacement origin", async () => {
    const state = createInitialState(20_705);
    render(
      <CareerView
        state={state}
        command={vi.fn()}
        scheduleDraft={emptySchedule}
        scheduledDraftHours={0}
        onScheduleDraftChange={vi.fn()}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    const freelance = screen.getByRole("button", {
      name: "Freelance delivery details",
    });
    const competition = screen.getByRole("button", {
      name: "Bedroom Benchmark Cup details",
    });
    fireEvent.click(freelance);
    expect(screen.getByLabelText("Freelance delivery details")).toBeVisible();
    fireEvent.click(competition);
    expect(screen.queryByLabelText("Freelance delivery details")).toBeNull();
    expect(
      screen.getByLabelText("Bedroom Benchmark Cup details"),
    ).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(competition).toHaveFocus();
        resolve();
      });
    });
  });
});

describe("Phase 4 compact money boundaries", () => {
  it("keeps quick resources independent while the Freelance equation retains mills", () => {
    const state = createInitialState(20_706);
    render(
      <CareerView
        state={state}
        command={vi.fn()}
        scheduleDraft={{ ...emptySchedule, freelance: 1 }}
        scheduledDraftHours={1}
        onScheduleDraftChange={vi.fn()}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Tonight's Career resources"),
    ).toHaveTextContent("Cash$0.00Savings$3.00");
    expect(screen.getByTestId("career-projection-freelance")).toHaveTextContent(
      "$2.166 expected net · $0.110 configured cost",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Freelance delivery details" }),
    );
    expect(
      screen.getByLabelText("Freelance delivery details"),
    ).toHaveTextContent(
      "$2.276 gross · $0.098 operating · $0.012 electricity · $2.166 economic net",
    );
  });

  it("formats the selected Jobs failed payout through the shared compact policy", () => {
    render(
      <JobsView
        state={createInitialState(20_706)}
        command={vi.fn()}
        commandBatch={vi.fn()}
        reducedMotion={false}
        usefulTarget={null}
        onUsefulTargetChange={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Selected playable workload"),
    ).toHaveTextContent("A failed delivery pays $0.00 gross.");
  });

  it("formats the private evaluation action as an independent compact cost", () => {
    render(
      <CareerView
        state={createInitialState(20_709)}
        command={vi.fn()}
        scheduleDraft={emptySchedule}
        scheduledDraftHours={0}
        onScheduleDraftChange={vi.fn()}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Show Evaluation discipline"));

    expect(
      screen.getByRole("button", { name: "Run paid private evaluation" }),
    ).toHaveTextContent("Run private evaluation · $0.75");
  });

  it("formats model-tier card requirements with compact cents", () => {
    render(
      <CareerView
        state={createInitialState(20_710)}
        command={vi.fn()}
        scheduleDraft={emptySchedule}
        scheduledDraftHours={0}
        onScheduleDraftChange={vi.fn()}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Show Model tiers and quantization"));

    expect(screen.getByText(/Unlock with \$8\.00 saved/)).toBeVisible();
    expect(
      screen.getByText(
        /Unlock with \$18\.00 saved plus either the competition prize or \$8\.00 product revenue/,
      ),
    ).toBeVisible();
  });

  it("formats the exit target compactly while retaining current savings exactly", () => {
    render(
      <CareerView
        state={createInitialState(20_711)}
        command={vi.fn()}
        scheduleDraft={emptySchedule}
        scheduledDraftHours={0}
        onScheduleDraftChange={vi.fn()}
        hasDurablePersistenceFailure={false}
        isRunBlocked={false}
        onRunScheduledEvening={() => true}
        onApplySafeOfflinePolicyNow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Show Independent conclusion"));

    expect(screen.getByText(/Bedroom Developer exit:/)).toHaveTextContent(
      "Bedroom Developer exit: save $24.00, submit one Cup entry, release Deskflow Local, and unlock Kiln 13B. Current: $3.000",
    );
  });

  it("keeps Queue 10 range endpoints compact despite middle mill quotes", () => {
    const state = createEstablishedScenarioState();
    const quotes = Array.from(
      { length: 10 },
      (_, index) => getWorkloadQuote(state, state.workloadId, index).grossQuote,
    );

    expect(quotes).toEqual([
      1.4, 1.303, 1.014, 0.531, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02,
    ]);
    render(
      <JobsView
        state={state}
        command={vi.fn()}
        commandBatch={vi.fn()}
        reducedMotion={false}
        usefulTarget={null}
        onUsefulTargetChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /^Queue 10/ })).toHaveTextContent(
      "Queue 10 · locks $1.40 → $0.02",
    );
  });
});
