import { describe, expect, it } from "vitest";
import {
  applyCommand,
  isRuntimeSimulationCommand,
  isStateValid,
  restoreSimulationState,
  tick,
} from "./engine";
import {
  createLaboratoryBalanceState,
  runLaboratoryBalance,
} from "./laboratoryBalance";
import { runEndingScenario } from "./evaluationBalance";
import {
  laboratoryEntryReadiness,
  laboratoryPipelineReadiness,
} from "./laboratory";

function preparedRun(seed = 20260715) {
  let state = createLaboratoryBalanceState(seed);
  state = applyCommand(state, {
    type: "BUY_LAB_MACHINE",
    machineId: "parallel-rack",
  });
  state = applyCommand(state, {
    type: "ADD_LAB_PIPELINE",
    pipelineId: "research",
  });
  state = applyCommand(state, {
    type: "ASSIGN_LAB_MACHINE",
    pipelineId: "research",
    machineId: "parallel-rack",
  });
  state = applyCommand(state, {
    type: "INVITE_LAB_COLLABORATOR",
    researcherId: "orin-kade",
  });
  state = applyCommand(state, {
    type: "SET_LAB_CULTURE",
    cultureId: "evidence-first",
  });
  for (const field of [
    "versionedConfigs",
    "lockedSeeds",
    "independentEvaluation",
  ] as const)
    state = applyCommand(state, {
      type: "SET_LAB_REPRODUCIBILITY",
      field,
      enabled: true,
    });
  state = applyCommand(state, { type: "DOCUMENT_LAB_RUN" });
  return applyCommand(state, { type: "QUEUE_LAB_RUN", pipelineId: "research" });
}

describe("Local Laboratory endgame", () => {
  it("supports a coherent multi-machine, parallel, reproducible route", () => {
    const state = runLaboratoryBalance(20260715);
    expect(isStateValid(state)).toBe(true);
    expect(state.laboratory.machines.length).toBeGreaterThanOrEqual(2);
    expect(state.laboratory.pipelines.length).toBeGreaterThanOrEqual(2);
    expect(state.laboratory.collaboratorIds).toContain("orin-kade");
    expect(state.laboratory.reproducibility.score).toBeGreaterThanOrEqual(0.55);
    expect(state.laboratory.lastRun).not.toBeNull();
    expect(state.laboratory.foundingDecision).toBe("independent-laboratory");
    expect(state.career.runEnding?.id).toBe("honest-foundation");
  });

  it("runs two queued pipelines in the same deterministic tick and retains both traces", () => {
    let state = preparedRun(29);
    state = applyCommand(state, {
      type: "QUEUE_LAB_RUN",
      pipelineId: "reproducibility",
    });
    state = tick(state, 60);
    const research = state.laboratory.pipelines.find(
      (pipeline) => pipeline.id === "research",
    );
    const reproducibility = state.laboratory.pipelines.find(
      (pipeline) => pipeline.id === "reproducibility",
    );
    expect((research?.completedRuns ?? 0) + (research?.failedRuns ?? 0)).toBe(
      1,
    );
    expect(
      (reproducibility?.completedRuns ?? 0) +
        (reproducibility?.failedRuns ?? 0),
    ).toBe(1);
    expect(
      state.ledger.filter((event) => event.message.includes("laboratory run"))
        .length,
    ).toBe(2);
  });

  it("keeps a divergent run as a recovery input instead of losing the queue", () => {
    let state = preparedRun(20260718);
    state = tick(state, 60);
    const first = state.laboratory.lastRun;
    expect(first?.completed).toBe(false);
    expect(first?.note).toContain("failed trace is retained");
    state = applyCommand(state, {
      type: "QUEUE_LAB_RUN",
      pipelineId: "research",
    });
    state = tick(state, 60);
    const pipeline = state.laboratory.pipelines.find(
      (item) => item.id === "research",
    );
    expect((pipeline?.completedRuns ?? 0) + (pipeline?.failedRuns ?? 0)).toBe(
      2,
    );
    expect(state.laboratory.lastRun?.startedAtTick).toBeGreaterThan(
      first?.startedAtTick ?? -1,
    );
  });

  it("rejects malformed input without spending cash or mutating lab inventory", () => {
    const state = createLaboratoryBalanceState(11);
    const cash = state.resources.money;
    expect(
      isRuntimeSimulationCommand({
        type: "SET_LAB_REPRODUCIBILITY",
        field: "forged-field",
        enabled: true,
      }),
    ).toBe(false);
    const rejected = applyCommand(state, {
      type: "BUY_LAB_MACHINE",
      machineId: "forged-machine",
    } as never);
    expect(rejected.resources.money).toBe(cash);
    expect(rejected.laboratory.machines).toEqual(state.laboratory.machines);
    expect(rejected.ledger.at(-1)?.kind).toBe("warning");
  });

  it("preserves an active run through restore and completes it deterministically", () => {
    const active = tick(preparedRun(17), 1);
    expect(
      active.laboratory.pipelines.find((pipeline) => pipeline.id === "research")
        ?.activeRun,
    ).not.toBeNull();
    const restored = restoreSimulationState(JSON.parse(JSON.stringify(active)));
    expect(isStateValid(restored)).toBe(true);
    const completed = tick(restored, 60);
    expect(completed.laboratory.lastRun).not.toBeNull();
    expect(
      completed.laboratory.pipelines.find(
        (pipeline) => pipeline.id === "research",
      )?.activeRun,
    ).toBeNull();
    expect(completed.laboratory.lastRun?.finishedAtTick).toBeGreaterThan(
      active.tick,
    );
  });

  it("recovers a stale laboratory object to safe defaults while retaining valid surrounding state", () => {
    const state = createLaboratoryBalanceState(23);
    const stale = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
    stale.laboratory = {
      ...(stale.laboratory as Record<string, unknown>),
      machines: [{ id: "forged-machine", acquiredAtTick: 0 }],
    };
    const restored = restoreSimulationState(stale);
    expect(isStateValid(restored)).toBe(true);
    expect(restored.laboratory.unlocked).toBe(false);
    expect(restored.laboratory.machines).toEqual([
      { id: "bench-node", acquiredAtTick: 0 },
    ]);
    expect(restored.research.recruitedResearcherIds).toEqual([]);
  });

  it("keeps unlock and founding prerequisites explicit", () => {
    const initial = createLaboratoryBalanceState(31);
    const locked = {
      ...initial,
      laboratory: {
        ...initial.laboratory,
        unlocked: false,
        scenarioUnlockIds: [],
      },
    };
    expect(laboratoryEntryReadiness(locked).ready).toBe(false);
    const incomplete = {
      ...initial.laboratory,
      collaboratorIds: [],
      cultureId: null,
      lastRun: null,
    };
    expect(laboratoryPipelineReadiness(incomplete).ready).toBe(false);
  });

  it("keeps each lab ending reachable with a distinct deterministic route", () => {
    for (const endingId of [
      "viral-support-catastrophe",
      "maintainer-exhaustion",
      "panic-business",
      "invisible-laboratory",
      "honest-foundation",
    ] as const) {
      const state = runEndingScenario(77, endingId);
      expect(isStateValid(state)).toBe(true);
      expect(state.career.runEnding?.id).toBe(endingId);
      expect(
        state.ledger.find(
          (event) => event.id === state.career.runEnding?.eventId,
        )?.causal,
      ).toBeDefined();
    }
  });
});
