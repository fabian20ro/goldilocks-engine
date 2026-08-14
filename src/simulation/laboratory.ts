import { findResearcher } from "./researchCatalog";
import {
  findLaboratoryCulture,
  findLaboratoryMachine,
  findLaboratoryPipeline,
  findLaboratoryScenario,
  laboratoryCultures,
  laboratoryMachines,
  laboratoryPipelines,
  laboratoryScenarios,
} from "./laboratoryCatalog";
import type {
  HypeFearState,
  LaboratoryCultureId,
  LaboratoryFoundingDecision,
  LaboratoryMachineId,
  LaboratoryPipelineId,
  LaboratoryRunRecord,
  LaboratoryScenarioId,
  LaboratoryState,
  ResearchState,
  RunEndingId,
  SimulationState,
} from "./types";

export const MAX_LAB_PIPELINES = 3;
export const MAX_LAB_WAITING_RUNS = 8;
export const MAX_LAB_DOCUMENTED_RUNS = 1000;

const round = (value: number, digits = 3): number =>
  Number(value.toFixed(digits));

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const LAB_SCENARIO_IDS: readonly LaboratoryScenarioId[] =
  laboratoryScenarios.map((scenario) => scenario.id);

const LAB_PIPELINE_IDS: readonly LaboratoryPipelineId[] =
  laboratoryPipelines.map((pipeline) => pipeline.id);

const LAB_MACHINE_IDS: readonly LaboratoryMachineId[] = laboratoryMachines.map(
  (machine) => machine.id,
);

const LAB_CULTURE_IDS: readonly LaboratoryCultureId[] = laboratoryCultures.map(
  (culture) => culture.id,
);

function blankScenarioProgress(): Readonly<
  Record<LaboratoryScenarioId, number>
> {
  return Object.fromEntries(LAB_SCENARIO_IDS.map((id) => [id, 0])) as Readonly<
    Record<LaboratoryScenarioId, number>
  >;
}

function scenarioForSeed(seed: number): LaboratoryScenarioId {
  return LAB_SCENARIO_IDS[seed % LAB_SCENARIO_IDS.length] ?? "limited-hardware";
}

function initialPipeline(id: LaboratoryPipelineId) {
  return {
    id,
    machineIds: ["bench-node" as LaboratoryMachineId],
    waitingRuns: 0,
    activeRun: null,
    completedRuns: 0,
    failedRuns: 0,
    lastRunTick: null,
  };
}

export function createInitialLaboratoryState(seed: number): LaboratoryState {
  const scenarioId = scenarioForSeed(seed);
  return {
    unlocked: false,
    unlockedAtTick: null,
    scenarioId,
    scenarioUnlockIds: [],
    scenarioProgress: blankScenarioProgress(),
    machines: [{ id: "bench-node", acquiredAtTick: 0 }],
    pipelines: [initialPipeline("reproducibility")],
    collaboratorIds: [],
    cultureId: null,
    reproducibility: {
      versionedConfigs: false,
      lockedSeeds: false,
      independentEvaluation: false,
      documentedRuns: 0,
      score: 0,
    },
    foundingDecision: null,
    pendingDecision:
      "Complete one Research question and resolve one public-pressure response before opening the laboratory plan.",
    lastRun: null,
    totalOperatingCost: 0,
  };
}

export function laboratoryEntryReadiness(
  state: Pick<SimulationState, "career" | "research" | "hypeFear">,
): { ready: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  if (!state.career.exitAchieved)
    reasons.push("Complete the Bedroom Developer exit milestones.");
  if (state.research.frontier.completedProjectIds.length < 1)
    reasons.push("Complete one Research question and retain its result.");
  if (!state.hypeFear.unlocked)
    reasons.push(
      "Reach First Recognition before opening public-pressure history.",
    );
  if (state.hypeFear.lastResponse === null)
    reasons.push("Resolve one Hype or Fear deadline before founding the lab.");
  return { ready: reasons.length === 0, reasons };
}

export function laboratoryScenarioUnlocks(
  state: Pick<SimulationState, "seed" | "resources" | "research" | "hypeFear">,
): readonly LaboratoryScenarioId[] {
  const ids: LaboratoryScenarioId[] = ["limited-hardware"];
  if (state.research.frontier.completedProjectIds.length > 0)
    ids.push("academic-collaboration");
  if (state.hypeFear.attention >= 12) ids.push("creator-attention");
  if (state.hypeFear.fear >= 0.2) ids.push("high-public-fear");
  if (state.resources.money < 15) ids.push("weak-economy");
  if (state.seed % 3 === 0) ids.push("expensive-electricity");
  return [...new Set(ids)];
}

export function laboratoryReproducibilityScore(
  state: Pick<
    LaboratoryState,
    "reproducibility" | "cultureId" | "collaboratorIds"
  >,
): number {
  const reproducibility = state.reproducibility;
  const switches = [
    reproducibility.versionedConfigs,
    reproducibility.lockedSeeds,
    reproducibility.independentEvaluation,
  ].filter(Boolean).length;
  const documentation = Math.min(1, reproducibility.documentedRuns / 4);
  const culture =
    findLaboratoryCulture(state.cultureId ?? "")?.reproducibility ?? 0;
  const collaboration = Math.min(1, state.collaboratorIds.length / 2) * 0.08;
  return round(
    clamp(
      switches * 0.18 + documentation * 0.2 + culture + collaboration,
      0,
      1,
    ),
  );
}

export function refreshLaboratoryScore(
  state: LaboratoryState,
): LaboratoryState {
  const score = laboratoryReproducibilityScore(state);
  return score === state.reproducibility.score
    ? state
    : { ...state, reproducibility: { ...state.reproducibility, score } };
}

export function laboratoryPipelineReadiness(
  state: Pick<
    LaboratoryState,
    | "machines"
    | "pipelines"
    | "collaboratorIds"
    | "cultureId"
    | "reproducibility"
    | "lastRun"
  >,
): { ready: boolean; credible: boolean; reasons: readonly string[] } {
  const coreReasons: string[] = [];
  const credibilityReasons: string[] = [];
  if (state.machines.length < 2)
    coreReasons.push(
      "Acquire a second machine so two pipelines can run in parallel.",
    );
  if (state.pipelines.length < 2)
    coreReasons.push("Add a second pipeline beside the reproducibility bench.");
  if (state.pipelines.some((pipeline) => pipeline.machineIds.length === 0))
    coreReasons.push(
      "Assign every pipeline to an available machine before founding the lab.",
    );
  if (!state.cultureId) coreReasons.push("Choose an early laboratory culture.");
  if (!state.lastRun) coreReasons.push("Complete one bounded laboratory run.");
  if (
    state.pipelines.some(
      (pipeline) => pipeline.activeRun !== null || pipeline.waitingRuns > 0,
    )
  )
    coreReasons.push(
      "Finish all active and queued laboratory runs before founding the lab.",
    );
  if (state.collaboratorIds.length < 1)
    credibilityReasons.push(
      "Invite one Research collaborator with retained context.",
    );
  if (state.reproducibility.score < 0.55)
    credibilityReasons.push(
      "Record versioned, seeded, independently evaluated runs.",
    );
  return {
    ready: coreReasons.length === 0,
    credible: coreReasons.length === 0 && credibilityReasons.length === 0,
    reasons: [...coreReasons, ...credibilityReasons],
  };
}

export function chooseLaboratoryEnding(
  state: Pick<SimulationState, "hypeFear" | "research"> & {
    laboratory: LaboratoryState;
  },
  decision: LaboratoryFoundingDecision,
): RunEndingId {
  const lab = state.laboratory;
  const score = lab.reproducibility.score;
  if (
    state.hypeFear.attention >= 55 &&
    state.hypeFear.stakeholderSelection.supportHeavyUsers >= 0.52 &&
    lab.pipelines.some(
      (pipeline) => pipeline.failedRuns > pipeline.completedRuns,
    )
  )
    return "viral-support-catastrophe";
  if (
    decision === "open-research-collective" &&
    lab.collaboratorIds.length >= 2 &&
    lab.reproducibility.documentedRuns < 2
  )
    return "maintainer-exhaustion";
  if (
    decision === "larger-organization-collaboration" &&
    (state.hypeFear.toolSwitchingPanic >= 0.45 || state.hypeFear.fear >= 0.45)
  )
    return "panic-business";
  if (score < 0.55 || lab.collaboratorIds.length === 0)
    return "invisible-laboratory";
  return "honest-foundation";
}

export function foundingDecisionLabel(
  decision: LaboratoryFoundingDecision,
): string {
  switch (decision) {
    case "independent-laboratory":
      return "Remain an independent laboratory";
    case "open-research-collective":
      return "Build an open research collective";
    case "larger-organization-collaboration":
      return "Collaborate with a larger organization";
  }
}

function deterministicUnit(
  seed: number,
  pipelineId: string,
  tick: number,
): number {
  let hash = (seed ^ Math.imul(tick + 1, 0x45d9f3b)) >>> 0;
  for (const character of pipelineId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d) >>> 0;
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x1_0000_0000;
}

export function laboratoryRunOutcome(
  state: Pick<SimulationState, "seed" | "tick"> & {
    laboratory: LaboratoryState;
  },
  pipelineId: LaboratoryPipelineId,
  startedAtTick: number,
): { completed: boolean; note: string } {
  const pipeline = state.laboratory.pipelines.find(
    (item) => item.id === pipelineId,
  );
  const machineReliability =
    pipeline?.machineIds.reduce(
      (sum, id) => sum + (findLaboratoryMachine(id)?.reliability ?? 0),
      0,
    ) ?? 0;
  const averageReliability = pipeline?.machineIds.length
    ? machineReliability / pipeline.machineIds.length
    : 0;
  const culture = findLaboratoryCulture(state.laboratory.cultureId ?? "");
  const threshold = clamp(
    averageReliability * 0.65 +
      state.laboratory.reproducibility.score * 0.3 +
      (culture?.reproducibility ?? 0) * 0.2,
    0.2,
    0.96,
  );
  const completed =
    deterministicUnit(state.seed, pipelineId, startedAtTick) <= threshold;
  return {
    completed,
    note: completed
      ? "The run reproduced its bounded result; the configuration, seed, and evidence trail remain inspectable."
      : "The parallel run diverged. The failed trace is retained as a recovery input, not silently discarded.",
  };
}

export function laboratoryRunDuration(
  state: Pick<LaboratoryState, "pipelines" | "cultureId">,
  pipelineId: LaboratoryPipelineId,
): { hours: number; cost: number } {
  const pipeline = findLaboratoryPipeline(pipelineId);
  const active = state.pipelines.find((item) => item.id === pipelineId);
  if (!pipeline || !active) return { hours: 1, cost: 1 };
  const machineCompute = active.machineIds.reduce(
    (sum, id) => sum + (findLaboratoryMachine(id)?.compute ?? 0),
    0,
  );
  const culture = findLaboratoryCulture(state.cultureId ?? "");
  return {
    hours: round(
      clamp(
        pipeline.baseDurationHours / Math.max(1, machineCompute * 0.75) -
          (culture?.collaboration ?? 0) * 0.03,
        0.08,
        1,
      ),
      3,
    ),
    cost: round(
      pipeline.baseCost +
        active.machineIds.reduce(
          (sum, id) => sum + (findLaboratoryMachine(id)?.electricityCost ?? 0),
          0,
        ),
      3,
    ),
  };
}

export function isLaboratoryStateShapeValid(
  value: unknown,
  simulationTick = Number.MAX_SAFE_INTEGER,
): value is LaboratoryState {
  if (typeof value !== "object" || value === null) return false;
  const lab = value as LaboratoryState;
  try {
    const machineIds = lab.machines.map((machine) => machine.id);
    const pipelineIds = lab.pipelines.map((pipeline) => pipeline.id);
    const collaboratorIds = lab.collaboratorIds;
    const activeScenario = findLaboratoryScenario(lab.scenarioId);
    const progressKeys = Object.keys(lab.scenarioProgress);
    const machineIdSet = new Set(machineIds);
    return (
      typeof lab.unlocked === "boolean" &&
      (lab.unlockedAtTick === null ||
        (Number.isSafeInteger(lab.unlockedAtTick) &&
          lab.unlockedAtTick >= 0 &&
          lab.unlockedAtTick <= simulationTick)) &&
      activeScenario !== undefined &&
      Array.isArray(lab.scenarioUnlockIds) &&
      lab.scenarioUnlockIds.length <= LAB_SCENARIO_IDS.length &&
      lab.scenarioUnlockIds.every((id) => LAB_SCENARIO_IDS.includes(id)) &&
      new Set(lab.scenarioUnlockIds).size === lab.scenarioUnlockIds.length &&
      lab.scenarioUnlockIds.includes(lab.scenarioId) === lab.unlocked &&
      typeof lab.scenarioProgress === "object" &&
      lab.scenarioProgress !== null &&
      progressKeys.length === LAB_SCENARIO_IDS.length &&
      LAB_SCENARIO_IDS.every(
        (id) =>
          Number.isFinite(lab.scenarioProgress[id]) &&
          lab.scenarioProgress[id] >= 0 &&
          lab.scenarioProgress[id] <= 1,
      ) &&
      Array.isArray(lab.machines) &&
      lab.machines.length >= 1 &&
      lab.machines.length <= LAB_MACHINE_IDS.length &&
      lab.machines.every(
        (machine) =>
          LAB_MACHINE_IDS.includes(machine.id) &&
          Number.isSafeInteger(machine.acquiredAtTick) &&
          machine.acquiredAtTick >= 0 &&
          machine.acquiredAtTick <= simulationTick,
      ) &&
      new Set(machineIds).size === machineIds.length &&
      machineIds.includes("bench-node") &&
      Array.isArray(lab.pipelines) &&
      lab.pipelines.length >= 1 &&
      lab.pipelines.length <= MAX_LAB_PIPELINES &&
      lab.pipelines.every((pipeline) => {
        const active = pipeline.activeRun;
        return (
          LAB_PIPELINE_IDS.includes(pipeline.id) &&
          Array.isArray(pipeline.machineIds) &&
          pipeline.machineIds.length >= 0 &&
          pipeline.machineIds.every((id: LaboratoryMachineId) =>
            machineIdSet.has(id),
          ) &&
          Number.isSafeInteger(pipeline.waitingRuns) &&
          pipeline.waitingRuns >= 0 &&
          pipeline.waitingRuns <= MAX_LAB_WAITING_RUNS &&
          Number.isSafeInteger(pipeline.completedRuns) &&
          pipeline.completedRuns >= 0 &&
          Number.isSafeInteger(pipeline.failedRuns) &&
          pipeline.failedRuns >= 0 &&
          (active === null || pipeline.machineIds.length > 0) &&
          (pipeline.lastRunTick === null ||
            (Number.isSafeInteger(pipeline.lastRunTick) &&
              pipeline.lastRunTick >= 0 &&
              pipeline.lastRunTick <= simulationTick)) &&
          (active === null ||
            (Number.isSafeInteger(active.startedAtTick) &&
              active.startedAtTick >= 0 &&
              active.startedAtTick <= simulationTick &&
              Number.isFinite(active.elapsedHours) &&
              active.elapsedHours >= 0 &&
              Number.isFinite(active.expectedDurationHours) &&
              active.expectedDurationHours > 0 &&
              active.elapsedHours <= active.expectedDurationHours &&
              Number.isFinite(active.committedCost) &&
              active.committedCost >= 0))
        );
      }) &&
      new Set(pipelineIds).size === pipelineIds.length &&
      new Set(lab.pipelines.flatMap((pipeline) => pipeline.machineIds)).size ===
        lab.pipelines.flatMap((pipeline) => pipeline.machineIds).length &&
      Array.isArray(collaboratorIds) &&
      collaboratorIds.length <= 6 &&
      collaboratorIds.every(
        (id) =>
          typeof id === "string" &&
          id.length > 0 &&
          id.length <= 64 &&
          findResearcher(id) !== undefined,
      ) &&
      new Set(collaboratorIds).size === collaboratorIds.length &&
      (lab.cultureId === null || LAB_CULTURE_IDS.includes(lab.cultureId)) &&
      typeof lab.reproducibility === "object" &&
      lab.reproducibility !== null &&
      typeof lab.reproducibility.versionedConfigs === "boolean" &&
      typeof lab.reproducibility.lockedSeeds === "boolean" &&
      typeof lab.reproducibility.independentEvaluation === "boolean" &&
      Number.isSafeInteger(lab.reproducibility.documentedRuns) &&
      lab.reproducibility.documentedRuns >= 0 &&
      lab.reproducibility.documentedRuns <= MAX_LAB_DOCUMENTED_RUNS &&
      Number.isFinite(lab.reproducibility.score) &&
      lab.reproducibility.score >= 0 &&
      lab.reproducibility.score <= 1 &&
      (lab.foundingDecision === null ||
        [
          "independent-laboratory",
          "open-research-collective",
          "larger-organization-collaboration",
        ].includes(lab.foundingDecision)) &&
      typeof lab.pendingDecision === "string" &&
      lab.pendingDecision.length <= 400 &&
      (lab.lastRun === null ||
        (LAB_PIPELINE_IDS.includes(lab.lastRun.pipelineId) &&
          typeof lab.lastRun.completed === "boolean" &&
          Number.isSafeInteger(lab.lastRun.startedAtTick) &&
          Number.isSafeInteger(lab.lastRun.finishedAtTick) &&
          lab.lastRun.startedAtTick >= 0 &&
          lab.lastRun.finishedAtTick >= lab.lastRun.startedAtTick &&
          lab.lastRun.finishedAtTick <= simulationTick &&
          Number.isFinite(lab.lastRun.reproducibilityScore) &&
          lab.lastRun.reproducibilityScore >= 0 &&
          lab.lastRun.reproducibilityScore <= 1 &&
          typeof lab.lastRun.note === "string" &&
          lab.lastRun.note.length <= 400)) &&
      Number.isFinite(lab.totalOperatingCost) &&
      lab.totalOperatingCost >= 0
    );
  } catch {
    return false;
  }
}

export function laboratoryContextReady(
  research: ResearchState,
  hypeFear: HypeFearState,
): boolean {
  return (
    research.frontier.completedProjectIds.length > 0 &&
    hypeFear.unlocked &&
    hypeFear.lastResponse !== null
  );
}

export function laboratoryFoundingDecisionRecord(
  laboratory: LaboratoryState,
): LaboratoryRunRecord | null {
  return laboratory.lastRun;
}
