// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  projectCareerRoute,
} from "../simulation/engine";
import { CareerView } from "./App";

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
