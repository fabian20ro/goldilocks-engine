import { spawnSync } from "node:child_process";

const probe = String.raw`
import { applyCommand, isStateValid, restoreSimulationState, tick } from "./src/simulation/engine.ts";
import { createLaboratoryBalanceState, runLaboratoryBalance } from "./src/simulation/laboratoryBalance.ts";

const findings = [];

function prepare(seed = 29) {
  let state = createLaboratoryBalanceState(seed);
  for (const command of [
    { type: "BUY_LAB_MACHINE", machineId: "parallel-rack" },
    { type: "ADD_LAB_PIPELINE", pipelineId: "research" },
    {
      type: "ASSIGN_LAB_MACHINE",
      pipelineId: "research",
      machineId: "parallel-rack",
    },
    { type: "INVITE_LAB_COLLABORATOR", researcherId: "orin-kade" },
    { type: "SET_LAB_CULTURE", cultureId: "evidence-first" },
    { type: "DOCUMENT_LAB_RUN" },
  ])
    state = applyCommand(state, command);
  for (const field of [
    "versionedConfigs",
    "lockedSeeds",
    "independentEvaluation",
  ])
    state = applyCommand(state, {
      type: "SET_LAB_REPRODUCIBILITY",
      field,
      enabled: true,
    });
  return state;
}

function prepareWithOneMachine(seed = 29) {
  let state = createLaboratoryBalanceState(seed);
  for (const command of [
    { type: "ADD_LAB_PIPELINE", pipelineId: "research" },
    { type: "SET_LAB_CULTURE", cultureId: "evidence-first" },
    { type: "DOCUMENT_LAB_RUN" },
  ])
    state = applyCommand(state, command);
  for (const field of [
    "versionedConfigs",
    "lockedSeeds",
    "independentEvaluation",
  ])
    state = applyCommand(state, {
      type: "SET_LAB_REPRODUCIBILITY",
      field,
      enabled: true,
    });
  return state;
}

const normal = runLaboratoryBalance(20260715);
const malformedBase = createLaboratoryBalanceState(31);
const malformed = applyCommand(malformedBase, {
  type: "FOUND_LAB",
  decision: "independent-laboratory",
});
const activeInput = prepare();
const queued = applyCommand(
  applyCommand(activeInput, {
    type: "QUEUE_LAB_RUN",
    pipelineId: "reproducibility",
  }),
  { type: "QUEUE_LAB_RUN", pipelineId: "research" },
);
const active = tick(queued, 8);
const activeBeforeFounding = active.laboratory.pipelines.map((pipeline) => ({
  id: pipeline.id,
  waitingRuns: pipeline.waitingRuns,
  activeRun: pipeline.activeRun !== null,
  completedRuns: pipeline.completedRuns,
  failedRuns: pipeline.failedRuns,
}));
const founded = applyCommand(active, {
  type: "FOUND_LAB",
  decision: "independent-laboratory",
});
const frozen = tick(founded, 60);
const activeAfterFounding = founded.laboratory.pipelines
  .filter((pipeline) => pipeline.activeRun !== null || pipeline.waitingRuns > 0)
  .map((pipeline) => pipeline.id);
const offlineApplied = applyCommand(active, {
  type: "APPLY_OFFLINE_POLICY",
  requestedHours: 1,
});

if (normal.career.runEnding?.id !== "honest-foundation" || !isStateValid(normal))
  findings.push({
    name: "normal route",
    evidence: {
      ending: normal.career.runEnding?.id ?? null,
      valid: isStateValid(normal),
    },
  });
if (
  malformed.career.runEnding !== null ||
  malformed.resources.money !== malformedBase.resources.money ||
  malformed.laboratory.foundingDecision !== null
)
  findings.push({
    name: "locked prerequisite rejection",
    evidence: {
      ending: malformed.career.runEnding,
      moneyBefore: malformedBase.resources.money,
      moneyAfter: malformed.resources.money,
      decision: malformed.laboratory.foundingDecision,
    },
  });
if (activeAfterFounding.length > 0 && founded.career.runEnding !== null) {
  findings.push({
    name: "founding accepts an active or queued pipeline",
    evidence: {
      beforeFounding: activeBeforeFounding,
      activeAfterFounding,
      ending: founded.career.runEnding.id,
      frozenAfterTick: frozen.laboratory.pipelines.map((pipeline) => ({
        id: pipeline.id,
        waitingRuns: pipeline.waitingRuns,
        activeRun: pipeline.activeRun !== null,
        completedRuns: pipeline.completedRuns,
      })),
    },
  });
}
if (JSON.stringify(offlineApplied.laboratory) !== JSON.stringify(active.laboratory))
  findings.push({
    name: "safe offline mutates laboratory state",
    evidence: {
      before: active.laboratory,
      after: offlineApplied.laboratory,
    },
  });

const sharedMachine = applyCommand(
  applyCommand(
    applyCommand(prepareWithOneMachine(), {
      type: "QUEUE_LAB_RUN",
      pipelineId: "reproducibility",
    }),
    { type: "QUEUE_LAB_RUN", pipelineId: "research" },
  ),
  {
    type: "SET_LAB_REPRODUCIBILITY",
    field: "versionedConfigs",
    enabled: true,
  },
);
const sharedRunning = tick(sharedMachine, 1);
const sharedPipelines = sharedRunning.laboratory.pipelines.filter(
  (pipeline) => pipeline.activeRun !== null,
);
if (
  sharedRunning.laboratory.machines.length === 1 &&
  sharedPipelines.length === 2 &&
  sharedPipelines.every((pipeline) => pipeline.machineIds.length === 1)
)
  findings.push({
    name: "parallel execution without assigning second machine",
    evidence: {
      machines: sharedRunning.laboratory.machines,
      running: sharedPipelines.map((pipeline) => ({
        id: pipeline.id,
        machineIds: pipeline.machineIds,
      })),
    },
  });

const resumable = tick(
  applyCommand(prepare(17), {
    type: "QUEUE_LAB_RUN",
    pipelineId: "research",
  }),
  1,
);
const restored = restoreSimulationState(JSON.parse(JSON.stringify(resumable)));
const resumed = tick(restored, 60);
if (
  resumable.laboratory.pipelines.every((pipeline) => pipeline.activeRun === null) ||
  resumed.laboratory.lastRun === null ||
  !isStateValid(restored) ||
  !isStateValid(resumed)
)
  findings.push({
    name: "active-run restore/resume",
    evidence: {
      activeBeforeRestore: resumable.laboratory.pipelines.map((pipeline) =>
        pipeline.activeRun !== null,
      ),
      restoredValid: isStateValid(restored),
      resumedValid: isStateValid(resumed),
      lastRun: resumed.laboratory.lastRun,
    },
  });

console.log(JSON.stringify({ findings, activeBeforeFounding, activeAfterFounding }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
`;

const result = spawnSync("node_modules/.bin/tsx", ["-e", probe], {
  cwd: process.cwd(),
  encoding: "utf8",
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exitCode = result.status ?? 1;
