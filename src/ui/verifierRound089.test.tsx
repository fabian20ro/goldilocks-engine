// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyCommand,
  createInitialState,
  sealSimulationState,
} from "../simulation/engine";
import { WorldView } from "./WorldView";

function recognizedState() {
  const initial = createInitialState(89005);
  return applyCommand(
    sealSimulationState({
      ...initial,
      resources: { ...initial.resources, reputation: 0.2 },
      jobs: { ...initial.jobs, completed: 1, paused: true },
    }),
    { type: "CAPTURE_BASELINE", label: "round-089 UI recognition" },
  );
}

describe("round 089 World UI adversarial coverage", () => {
  afterEach(() => cleanup());

  it("exposes the first narrative deadline before asking for coverage", () => {
    render(<WorldView state={recognizedState()} command={vi.fn()} />);
    // The first template has a 2.5 simulated-hour deadline. D-039 requires
    // deadline disclosure before the creator choice, not only after coverage.
    expect(screen.getByTestId("narrative-card")).toHaveTextContent("2.5H");
  });
});
