// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState, sealSimulationState } from "../simulation/engine";
import { ResearchView } from "./ResearchView";

function stateWithResearch(
  overrides: Partial<ReturnType<typeof createInitialState>> = {},
) {
  const initial = createInitialState(17);
  return sealSimulationState({
    ...initial,
    ...overrides,
    resources: { ...initial.resources, money: 5, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
}

describe("ResearchView", () => {
  afterEach(() => cleanup());
  it("normal: exposes a goal, ranges, pending decision, and inspect action", () => {
    const command = vi.fn();
    render(<ResearchView state={stateWithResearch()} command={command} />);
    expect(
      screen.getByRole("heading", { name: "Research console" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Research goal")).toBeEnabled();
    expect(screen.getByText("Duration range")).toBeVisible();
    expect(screen.getByText("Current evidence:")).toBeVisible();
    expect(
      screen.getByRole("slider", { name: "Research compute allocation" }),
    ).toHaveValue("60");
    expect(screen.getByText(/Pending decision:/)).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      }),
    );
    expect(command).toHaveBeenCalledWith({
      type: "INSPECT_RESEARCH_PROJECT",
      projectId: "context-reconstruction",
    });
  });

  it("adversarial: keeps the frontier locked and goal input disabled before recognition", () => {
    const command = vi.fn();
    render(<ResearchView state={createInitialState(19)} command={command} />);
    expect(screen.getByText("Research is not recognized yet.")).toBeVisible();
    expect(screen.getByLabelText("Research goal")).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Inspect evidence for Context Reconstruction",
      }),
    ).toBeDisabled();
  });

  it("lifecycle: renders active progress, retained knowledge, and useful outcome evidence", () => {
    const initial = stateWithResearch();
    const state = sealSimulationState({
      ...initial,
      research: {
        ...initial.research,
        goal: {
          text: "Find the safest useful evidence",
          createdAtTick: 0,
          status: "pending",
        },
        activeProject: {
          projectId: "context-reconstruction",
          startedAtTick: 0,
          elapsedHours: 0.1,
          expectedDurationHours: 0.6,
          committedCost: 0.4,
        },
        recruitedResearcherIds: ["mira-voss"],
        teamMemberIds: ["mira-voss"],
        availableResearcherIds: [],
        chemistry: 0.45,
        retainedKnowledge: 0.33,
        lastOutcome: {
          projectId: "context-reconstruction",
          kind: "useful-failure",
          title: "The hypothesis failed usefully",
          summary: "The counterexample narrows the next question.",
          usefulness: 0.32,
          durationHours: 0.6,
          cost: 0.4,
          knowledgeGained: 0.24,
          institutionalKnowledgeGained: 0.16,
          toolId: null,
          revealedProjectIds: ["negative-space"],
          strategicOptionIds: ["drift-audit"],
        },
      },
    });
    render(<ResearchView state={state} command={vi.fn()} />);
    expect(screen.getByText("Measurement in progress")).toBeVisible();
    expect(screen.getByText(/retained knowledge 0.33/)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "The hypothesis failed usefully" }),
    ).toBeVisible();
    expect(
      screen.getByText(/failed paths and partial results remain/i),
    ).toBeVisible();
  });
});
