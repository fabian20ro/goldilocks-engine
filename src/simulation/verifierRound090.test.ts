import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import {
  creatorCoverageFit,
  findCreator,
  narrativeTemplates,
} from "./hypeFearCatalog";
import type { SimulationState } from "./types";

function recognizedState(seed = 90001): SimulationState {
  const initial = createInitialState(seed);
  return applyCommand(
    sealSimulationState({
      ...initial,
      resources: { ...initial.resources, reputation: 0.2 },
      jobs: { ...initial.jobs, completed: 1, paused: true },
    }),
    { type: "CAPTURE_BASELINE", label: "round-090 recognition" },
  );
}

function resolveAllNarratives(seed: number): SimulationState {
  let state = recognizedState(seed);
  for (const template of narrativeTemplates) {
    const narrative = state.hypeFear.narratives.find(
      (item) => item.id === state.hypeFear.activeNarrativeId,
    );
    if (!narrative) throw new Error("Expected an active finite narrative");
    expect(narrative.templateId).toBe(template.id);
    const creator = findCreator(template.sourceArchetypeId);
    if (!creator) throw new Error("Expected the narrative source creator");
    expect(creatorCoverageFit(creator, template).eligible).toBe(true);

    state = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: creator.id,
    });
    state = applyCommand(state, {
      type: "PUBLISH_PREDICTION",
      narrativeId: narrative.id,
      prediction: "partial",
      confidence: 0.5,
    });
    const deadline = state.hypeFear.narratives.find(
      (item) => item.id === narrative.id,
    )?.deadlineTick;
    if (deadline === undefined) throw new Error("Expected a deadline");
    while (state.tick < deadline) state = tick(state, 60);
    expect(state.hypeFear.pendingResponse?.narrativeId).toBe(narrative.id);
    state =
      narrative.kind === "hype"
        ? applyCommand(state, {
            type: "RESPOND_TO_NARRATIVE",
            response: "publish-evidence",
          })
        : applyCommand(state, {
            type: "RESPOND_TO_FEAR",
            response: "publish-boundaries",
          });
    expect(state.hypeFear.pendingResponse).toBeNull();
  }
  return state;
}

describe("round 090 Hype/Fear independent boundaries", () => {
  it("keeps every locked command inert before recognition", () => {
    const initial = createInitialState(90002);
    const commands = [
      { type: "SWITCH_TOOL", toolId: "fast-new-runtime" } as const,
      {
        type: "COVER_NARRATIVE",
        narrativeId: "forged-narrative",
        creatorId: "builder-opportunity",
      } as const,
      {
        type: "PUBLISH_PREDICTION",
        narrativeId: "forged-narrative",
        prediction: "lands",
        confidence: 0.9,
      } as const,
      { type: "RESPOND_TO_NARRATIVE", response: "double-down" } as const,
    ];
    for (const command of commands)
      expect(applyCommand(initial, command).hypeFear).toEqual(initial.hypeFear);
  });

  it("resolves the complete finite catalog deterministically with separate fear feed", () => {
    const first = resolveAllNarratives(90003);
    const second = resolveAllNarratives(90003);
    expect(first.hypeFear).toEqual(second.hypeFear);
    expect(first.tick).toBe(second.tick);
    expect(first.hypeFear.nextNarrativeIndex).toBe(narrativeTemplates.length);
    expect(first.hypeFear.activeNarrativeId).toBeNull();
    expect(first.hypeFear.doomFeed).toHaveLength(2);
    expect(
      first.hypeFear.doomFeed.every((entry) => entry.responseRequired),
    ).toBe(true);
    expect(first.hypeFear.attentionOnlyActions).toBe(narrativeTemplates.length);
    expect(isStateValid(first)).toBe(true);
  });

  it("rejects creator fit, malformed confidence, and pending-response neighbors without mutation", () => {
    let state = recognizedState(90004);
    const narrative = state.hypeFear.narratives[0]!;
    const beforeWrongCreator = state.hypeFear;
    const wrongCreator = findCreator("skeptic");
    if (!wrongCreator) throw new Error("Expected skeptic creator");
    const rejected = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: wrongCreator.id,
    });
    expect(rejected.hypeFear).toEqual(beforeWrongCreator);

    const source = findCreator(narrative.sourceArchetypeId);
    if (!source) throw new Error("Expected source creator");
    const originalPreferences = source.preferences;
    const originalAccess = source.access;
    try {
      source.preferences = [];
      source.access = "no access";
      expect(
        applyCommand(state, {
          type: "COVER_NARRATIVE",
          narrativeId: narrative.id,
          creatorId: source.id,
        }).hypeFear,
      ).toEqual(beforeWrongCreator);
    } finally {
      source.preferences = originalPreferences;
      source.access = originalAccess;
    }

    state = applyCommand(state, {
      type: "COVER_NARRATIVE",
      narrativeId: narrative.id,
      creatorId: source.id,
    });
    const beforePrediction = state.hypeFear;
    expect(
      applyCommand(state, {
        type: "PUBLISH_PREDICTION",
        narrativeId: narrative.id,
        prediction: "lands",
        confidence: Number.NaN,
      }).hypeFear,
    ).toEqual(beforePrediction);
    state = applyCommand(state, {
      type: "PUBLISH_PREDICTION",
      narrativeId: narrative.id,
      prediction: "lands",
      confidence: 0.65,
    });
    const beforePendingSwitch = state.hypeFear;
    while (state.tick < narrative.deadlineTick) state = tick(state, 60);
    expect(state.hypeFear.pendingResponse).not.toBeNull();
    expect(
      applyCommand(state, {
        type: "SWITCH_TOOL",
        toolId: "fast-new-runtime",
      }).hypeFear,
    ).not.toEqual(beforePendingSwitch);
    const pending = state.hypeFear;
    expect(
      applyCommand(state, {
        type: "SWITCH_TOOL",
        toolId: "fast-new-runtime",
      }).hypeFear,
    ).toEqual(pending);
  });

  it("keeps valid sealed state and clears an unsealed malformed addition", () => {
    const state = resolveAllNarratives(90005);
    const valid = restoreSimulationState(
      JSON.parse(JSON.stringify(state)),
      state.seed,
    );
    expect(valid.hypeFear).toEqual(state.hypeFear);
    expect(isStateValid(valid)).toBe(true);

    const forged = JSON.parse(JSON.stringify(state)) as SimulationState;
    const firstNarrative = forged.hypeFear.narratives[0];
    if (!firstNarrative) throw new Error("Expected retained narrative");
    forged.hypeFear = {
      ...forged.hypeFear,
      attention: 101,
      narratives: [
        ...forged.hypeFear.narratives,
        {
          ...firstNarrative,
          id: "forged",
          templateId: "unknown-template",
        },
      ],
    };
    const recovered = restoreSimulationState(forged, state.seed);
    expect(recovered).toEqual(createInitialState(state.seed));
    expect(isStateValid(recovered)).toBe(true);
  });

  it("does not resolve or switch narratives during the safe offline policy command", () => {
    let state = recognizedState(90006);
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
    const before = state.hypeFear;
    state = applyCommand(state, {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });
    state = applyCommand(state, {
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    expect(state.hypeFear).toEqual(before);
    expect(state.hypeFear.narratives[0]?.status).toBe("countdown");
    expect(isStateValid(state)).toBe(true);
  });
});
