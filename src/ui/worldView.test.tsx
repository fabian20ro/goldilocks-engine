// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  sealSimulationState,
} from "../simulation/engine";
import { WorldView } from "./WorldView";

function recognizedState() {
  const initial = createInitialState(8801);
  return applyCommand(
    sealSimulationState({
      ...initial,
      resources: { ...initial.resources, reputation: 0.2 },
      jobs: { ...initial.jobs, completed: 1, paused: true },
    }),
    { type: "CAPTURE_BASELINE", label: "recognition" },
  );
}

describe("WorldView", () => {
  afterEach(() => cleanup());

  it("shows the narrative, uncertainty, audience standing, and doom-feed seam", () => {
    render(<WorldView state={recognizedState()} command={vi.fn()} />);
    expect(screen.getByTestId("world-view")).toBeVisible();
    expect(screen.getByTestId("narrative-card")).toBeVisible();
    expect(screen.getByTestId("narrative-card")).toHaveTextContent("2.5H");
    expect(screen.getByText(/bounded estimate/i)).toBeVisible();
    expect(screen.getByTestId("audience-reputation")).toBeVisible();
    expect(screen.getByTestId("doom-feed")).toHaveTextContent(
      "No fear response",
    );
  });

  it("keeps one explicit prediction action after coverage", () => {
    const command = vi.fn();
    const initial = recognizedState();
    const narrative = initial.hypeFear.narratives[0]!;
    const covered = applyCommand(initial, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: narrative.sourceArchetypeId,
    });
    render(<WorldView state={covered} command={command} />);
    expect(screen.getByText(/Make one explicit prediction/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Predict it lands" }));
    expect(command).toHaveBeenCalledWith({
      type: "PUBLISH_PREDICTION",
      narrativeId: narrative.id,
      prediction: "lands",
      confidence: 0.65,
    });
  });

  it("keeps pending response above the feed for a returning player", () => {
    const initial = recognizedState();
    const narrative = initial.hypeFear.narratives[0]!;
    const pending = {
      ...applyCommand(
        applyCommand(initial, {
          type: "COVER_NARRATIVE",
          narrativeId: narrative.id,
          creatorId: narrative.sourceArchetypeId,
        }),
        {
          type: "PUBLISH_PREDICTION",
          narrativeId: narrative.id,
          prediction: "partial",
          confidence: 0.5,
        },
      ),
      hypeFear: {
        ...initial.hypeFear,
        unlocked: true,
        narratives: [
          {
            ...narrative,
            status: "awaiting-response" as const,
            prediction: {
              prediction: "partial" as const,
              confidence: 0.5,
              submittedAtTick: 0,
            },
            resolution: {
              kind: "partly-correct" as const,
              headline: "A narrower result arrived.",
              supportedEvidence: "Bounded evidence.",
              confidenceRange: { min: 0.4, max: 0.6 },
              resolvedAtTick: 1,
            },
          },
        ],
        activeNarrativeId: narrative.id,
        pendingResponse: {
          narrativeId: narrative.id,
          response: "pending" as const,
          resolvedAtTick: 1,
          expectationDebtAfter: 0.2,
          stakeholderNote: "Response needed.",
        },
      },
    };
    render(<WorldView state={pending} command={vi.fn()} />);
    expect(screen.getByTestId("pending-narrative-response")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /deadline has an audience/i }),
    ).toBeVisible();
    expect(screen.getByTestId("doom-feed")).toBeVisible();
  });

  it("locks tool switching until recognition", () => {
    render(<WorldView state={createInitialState(8802)} command={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Fast new runtime" }),
    ).toBeDisabled();
  });
});
