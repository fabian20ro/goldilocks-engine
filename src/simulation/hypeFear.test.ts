import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isRuntimeSimulationCommand,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import {
  creatorCoverageFit,
  findCreator,
  findNarrativeTemplate,
} from "./hypeFearCatalog";
import type { SimulationState } from "./types";

function recognizedState(seed = 7701): SimulationState {
  const initial = createInitialState(seed);
  const recognized = sealSimulationState({
    ...initial,
    resources: { ...initial.resources, reputation: 0.2 },
    jobs: { ...initial.jobs, completed: 1, paused: true },
  });
  return applyCommand(recognized, {
    type: "CAPTURE_BASELINE",
    label: "recognition",
  });
}

function runToDeadline(state: SimulationState): SimulationState {
  const narrative = state.hypeFear.activeNarrativeId
    ? state.hypeFear.narratives.find(
        (item) => item.id === state.hypeFear.activeNarrativeId,
      )
    : null;
  if (!narrative) return state;
  let next = state;
  let remaining = Math.max(0, (narrative.deadlineTick - next.tick + 1) / 1000);
  while (remaining > 0) {
    const quantum = Math.min(60, remaining);
    next = tick(next, quantum);
    remaining -= quantum;
  }
  return next;
}

function coverAndPredict(
  state: SimulationState,
  prediction: "lands" | "partial" | "delayed" = "partial",
): SimulationState {
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
    prediction,
    confidence: 0.5,
  });
  return next;
}

describe("Hype/Fear narrative loop", () => {
  it("covers a normal narrative, resolves its deadline, and records recovery consequences", () => {
    let state = recognizedState();
    expect(state.hypeFear.unlocked).toBe(true);
    const narrative = state.hypeFear.narratives[0]!;
    state = coverAndPredict(state);
    expect(state.hypeFear.attention).toBeGreaterThan(0);
    expect(state.hypeFear.expectationDebt).toBeGreaterThan(0);
    expect(
      state.hypeFear.stakeholderSelection.escalationSeekers,
    ).toBeGreaterThan(0);
    state = runToDeadline(state);
    expect(state.hypeFear.pendingResponse?.narrativeId).toBe(narrative.id);
    expect(
      state.hypeFear.narratives[0]?.resolution?.confidenceRange.min,
    ).toBeGreaterThan(0);
    const beforeDebt = state.hypeFear.expectationDebt;
    state = applyCommand(state, {
      type: "RESPOND_TO_NARRATIVE",
      response: "publish-evidence",
    });
    expect(state.hypeFear.pendingResponse).toBeNull();
    expect(state.hypeFear.expectationDebt).toBeLessThan(beforeDebt);
    expect(state.hypeFear.stakeholderSelection.patientPartners).toBeGreaterThan(
      0,
    );
    expect(state.hypeFear.activeNarrativeId).not.toBeNull();
    expect(isStateValid(state)).toBe(true);
  });

  it("rejects malformed or unsafe narrative commands without changing the narrative seam", () => {
    const state = recognizedState();
    const narrative = state.hypeFear.narratives[0]!;
    expect(
      isRuntimeSimulationCommand({
        type: "PUBLISH_PREDICTION",
        narrativeId: narrative.id,
        prediction: "lands",
        confidence: Number.NaN,
      }),
    ).toBe(false);
    const unknownCoverage = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: "not-a-narrative",
      creatorId: "skeptic",
    });
    expect(unknownCoverage.hypeFear).toEqual(state.hypeFear);
    const before = state.hypeFear.narratives[0];
    const covered = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: narrative.sourceArchetypeId,
    });
    const unsafe = applyCommand(covered, {
      type: "PUBLISH_PREDICTION",
      narrativeId: narrative.id,
      prediction: "lands",
      confidence: 2,
    });
    expect(unsafe.hypeFear.narratives[0]).toEqual({
      ...covered.hypeFear.narratives[0],
    });
    expect(before?.status).toBe("available");
  });

  it("keeps locked tool switching inert and makes creator fit data-driven", () => {
    const initial = createInitialState(7710);
    const lockedSwitch = applyCommand(initial, {
      type: "SWITCH_TOOL",
      toolId: "fast-new-runtime",
    });
    expect(lockedSwitch.hypeFear).toEqual(initial.hypeFear);

    const recognized = recognizedState(7711);
    const narrative = recognized.hypeFear.narratives[0]!;
    const creator = findCreator(narrative.sourceArchetypeId)!;
    const template = findNarrativeTemplate(narrative.templateId)!;
    const originalPreferences = creator.preferences;
    const originalAccess = creator.access;
    try {
      const fit = creatorCoverageFit(creator, template);
      expect(fit.eligible).toBe(true);
      const covered = applyCommand(recognized, {
        type: "COVER_NARRATIVE",
        narrativeId: narrative.id,
        creatorId: creator.id,
      });
      expect(covered.hypeFear.narratives[0]?.status).toBe(
        "awaiting-prediction",
      );

      creator.preferences = [];
      creator.access = "no access";
      const rejected = applyCommand(recognized, {
        type: "COVER_NARRATIVE",
        narrativeId: narrative.id,
        creatorId: creator.id,
      });
      expect(rejected.hypeFear).toEqual(recognized.hypeFear);
    } finally {
      creator.preferences = originalPreferences;
      creator.access = originalAccess;
    }
  });

  it("preserves deadline state across offline and research neighbors, while stale additions recover safely", () => {
    let state = coverAndPredict(recognizedState());
    const beforeDeadline = state.hypeFear.narratives[0]!.deadlineTick;
    state = applyCommand(state, {
      type: "SET_RESEARCH_GOAL",
      text: "Measure a safe boundary",
    });
    state = applyCommand(state, {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });
    const afterOffline = applyCommand(state, {
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    expect(afterOffline.hypeFear.narratives[0]!.deadlineTick).toBe(
      beforeDeadline,
    );
    expect(afterOffline.hypeFear.narratives[0]!.status).toBe("countdown");
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(afterOffline)),
    );
    expect(restored.hypeFear).toEqual(afterOffline.hypeFear);
    const forged = JSON.parse(JSON.stringify(afterOffline)) as SimulationState;
    forged.hypeFear.attention = 99;
    const recovered = restoreSimulationState(forged);
    expect(recovered.hypeFear).toEqual(
      createInitialState(afterOffline.seed).hypeFear,
    );
    expect(isStateValid(restored)).toBe(true);
  });
});
