import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import type { SimulationState } from "./types";

function recognizedState(seed = 89001): SimulationState {
  const initial = createInitialState(seed);
  return applyCommand(
    sealSimulationState({
      ...initial,
      resources: { ...initial.resources, reputation: 0.2 },
      jobs: { ...initial.jobs, completed: 1, paused: true },
    }),
    { type: "CAPTURE_BASELINE", label: "round-089 recognition" },
  );
}

function resolveActiveNarrative(state: SimulationState): SimulationState {
  const narrative = state.hypeFear.narratives.find(
    (item) => item.id === state.hypeFear.activeNarrativeId,
  );
  if (!narrative) return state;
  let next = applyCommand(state, {
    type: "COVER_NARRATIVE",
    narrativeId: narrative.id,
    creatorId: narrative.sourceArchetypeId,
  });
  next = applyCommand(next, {
    type: "PUBLISH_PREDICTION",
    narrativeId: narrative.id,
    prediction: "partial",
    confidence: 0.5,
  });
  let seconds = Math.max(0, (narrative.deadlineTick - next.tick + 1) / 1000);
  while (seconds > 0) {
    const quantum = Math.min(60, seconds);
    next = tick(next, quantum);
    seconds -= quantum;
  }
  return next;
}

describe("round 089 Hype/Fear adversarial boundaries", () => {
  it("does not allow tool-switching panic before public-pressure recognition", () => {
    const initial = createInitialState(89002);
    const switched = applyCommand(initial, {
      type: "SWITCH_TOOL",
      toolId: "fast-new-runtime",
    });

    // Tool switching is a Milestone 5 response/effect. Before recognition the
    // locked World surface must remain a no-op, including its durable panic,
    // fear, expectation, and tool identity.
    expect(switched.hypeFear).toEqual(initial.hypeFear);
  });

  it("keeps valid narrative state durable across a Career neighbor and reload", () => {
    let state = recognizedState(89003);
    const narrative = state.hypeFear.narratives[0]!;
    state = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: narrative.sourceArchetypeId,
    });
    state = applyCommand(state, {
      type: "PUBLISH_PREDICTION",
      narrativeId: narrative.id,
      prediction: "delayed",
      confidence: 0.35,
    });
    const deadline = state.hypeFear.narratives[0]!.deadlineTick;
    state = applyCommand(state, {
      type: "SET_EVENING_ALLOCATION",
      route: "freelance",
      hours: 1,
    });
    const afterCareer = applyCommand(state, {
      type: "SET_EVENING_ALLOCATION",
      route: "competition",
      hours: 0,
    });
    expect(afterCareer.hypeFear.narratives[0]!.deadlineTick).toBe(deadline);
    expect(afterCareer.hypeFear.narratives[0]!.status).toBe("countdown");

    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(afterCareer)),
      afterCareer.seed,
    );
    expect(restored.hypeFear).toEqual(afterCareer.hypeFear);
    expect(isStateValid(restored)).toBe(true);
  });

  it("requires a response before a later narrative can be covered and keeps fear separate", () => {
    let state = recognizedState(89004);
    const first = state.hypeFear.narratives[0]!;
    state = resolveActiveNarrative(state);
    expect(state.hypeFear.pendingResponse?.narrativeId).toBe(first.id);
    expect(state.hypeFear.activeNarrativeId).toBe(first.id);

    const blocked = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: first.id,
      creatorId: "skeptic",
    });
    expect(blocked.hypeFear.pendingResponse).toEqual(
      state.hypeFear.pendingResponse,
    );
    const recovered = applyCommand(state, {
      type: "RESPOND_TO_NARRATIVE",
      response: "publish-evidence",
    });
    expect(recovered.hypeFear.pendingResponse).toBeNull();
    expect(recovered.hypeFear.activeNarrativeId).not.toBeNull();
    expect(isStateValid(recovered)).toBe(true);
  });
});
