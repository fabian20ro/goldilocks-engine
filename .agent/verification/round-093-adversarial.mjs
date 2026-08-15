import { spawnSync } from "node:child_process";

// Independent Milestone 6 engine probe.  It intentionally uses the named
// established-lab fixture so the endgame seam is exercised without treating
// UI seed data or candidate-authored tests as proof of the command boundary.
const probe = String.raw`
import {
  applyCommand,
  isStateValid,
  restoreSimulationState,
  tick,
} from "./src/simulation/engine.ts";
import {
  createLaboratoryBalanceState,
  prepareLaboratoryBalanceRun,
  runLaboratoryBalance,
} from "./src/simulation/laboratoryBalance.ts";

const findings = [];
const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const record = (name, evidence) => findings.push({ name, evidence });

// Normal route: all balance seeds must leave a valid, closed run with no
// active or queued work and an honest bounded run trace.
const normal = Array.from({ length: 24 }, (_, index) =>
  runLaboratoryBalance(20260715 + index),
);
const invalidNormal = normal.find((state) => !isStateValid(state));
if (invalidNormal)
  record("normal route is structurally invalid", {
    ending: invalidNormal.career.runEnding?.id ?? null,
  });
const openNormal = normal.find((state) =>
  state.laboratory.pipelines.some(
    (pipeline) => pipeline.activeRun !== null || pipeline.waitingRuns > 0,
  ),
);
if (openNormal)
  record("normal route ends with laboratory work open", {
    ending: openNormal.career.runEnding?.id ?? null,
    pipelines: openNormal.laboratory.pipelines,
  });
if (
  normal.some(
    (state) =>
      state.career.runEnding?.id !== "honest-foundation" ||
      state.laboratory.lastRun === null ||
      state.laboratory.lastRun.finishedAtTick <
        state.laboratory.lastRun.startedAtTick,
  )
)
  record(
    "normal route lacks a completed founding trace",
    normal.map((state) => ({
      ending: state.career.runEnding?.id ?? null,
      lastRun: state.laboratory.lastRun,
    })),
  );

// A prepared, completed route with new waiting work must not be closable;
// the rejection must preserve economy, trace, and queued work.
let waiting = prepareLaboratoryBalanceRun(29);
waiting = applyCommand(waiting, {
  type: "QUEUE_LAB_RUN",
  pipelineId: "reproducibility",
});
const waitingBefore = clone(waiting);
const waitingFound = applyCommand(waiting, {
  type: "FOUND_LAB",
  decision: "independent-laboratory",
});
if (
  waitingFound.career.runEnding !== null ||
  waitingFound.laboratory.foundingDecision !== null ||
  waitingFound.resources.money !== waitingBefore.resources.money ||
  !same(
    waitingFound.laboratory.pipelines,
    waitingBefore.laboratory.pipelines,
  ) ||
  !same(waitingFound.laboratory.lastRun, waitingBefore.laboratory.lastRun) ||
  !isStateValid(waitingFound)
)
  record("founding accepts or mutates a waiting run", {
    before: {
      money: waitingBefore.resources.money,
      pipelines: waitingBefore.laboratory.pipelines,
      lastRun: waitingBefore.laboratory.lastRun,
    },
    after: {
      money: waitingFound.resources.money,
      ending: waitingFound.career.runEnding,
      foundingDecision: waitingFound.laboratory.foundingDecision,
      pipelines: waitingFound.laboratory.pipelines,
      lastRun: waitingFound.laboratory.lastRun,
    },
  });

// The same rejection must survive a valid persisted active run and the safe
// offline policy; only a Worker tick may settle it.
let active = tick(waiting, 1);
if (
  !active.laboratory.pipelines.some((pipeline) => pipeline.activeRun !== null)
)
  record("queued run did not become active on an assigned machine", {
    pipelines: active.laboratory.pipelines,
  });
const activeBefore = clone(active);
const activeFound = applyCommand(active, {
  type: "FOUND_LAB",
  decision: "independent-laboratory",
});
if (
  activeFound.career.runEnding !== null ||
  activeFound.laboratory.foundingDecision !== null ||
  !same(activeFound.laboratory.pipelines, activeBefore.laboratory.pipelines) ||
  activeFound.resources.money !== activeBefore.resources.money ||
  !isStateValid(activeFound)
)
  record("founding accepts or mutates an active run", {
    before: activeBefore.laboratory.pipelines,
    after: activeFound.laboratory.pipelines,
    ending: activeFound.career.runEnding,
  });
const restoredActive = restoreSimulationState(clone(active));
const offlineActive = applyCommand(restoredActive, {
  type: "APPLY_OFFLINE_POLICY",
  requestedHours: 1,
});
if (!same(offlineActive.laboratory, restoredActive.laboratory))
  record("safe offline policy mutates laboratory work", {
    before: restoredActive.laboratory,
    after: offlineActive.laboratory,
  });
const settled = tick(offlineActive, 60);
if (
  !isStateValid(settled) ||
  settled.laboratory.pipelines.some(
    (pipeline) => pipeline.activeRun !== null || pipeline.waitingRuns > 0,
  )
)
  record("persisted active run fails to settle through Worker tick", {
    valid: isStateValid(settled),
    pipelines: settled.laboratory.pipelines,
  });

// Added pipelines start unassigned.  A conflicting assignment, insufficient
// capacity, and repeated machine purchase must all be transactional; two
// explicitly assigned machines must then permit real parallel progress.
let capacity = createLaboratoryBalanceState(29);
capacity = applyCommand(capacity, {
  type: "ADD_LAB_PIPELINE",
  pipelineId: "research",
});
const afterAddMoney = capacity.resources.money;
const unassignedQueue = applyCommand(capacity, {
  type: "QUEUE_LAB_RUN",
  pipelineId: "research",
});
const researchAfterAdd = unassignedQueue.laboratory.pipelines.find(
  (pipeline) => pipeline.id === "research",
);
if (
  unassignedQueue.resources.money !== afterAddMoney ||
  researchAfterAdd?.waitingRuns !== 0 ||
  researchAfterAdd?.activeRun !== null
)
  record("unassigned pipeline queues or spends", {
    moneyBefore: afterAddMoney,
    moneyAfter: unassignedQueue.resources.money,
    pipeline: researchAfterAdd,
  });
const conflict = applyCommand(capacity, {
  type: "ASSIGN_LAB_MACHINE",
  pipelineId: "research",
  machineId: "bench-node",
});
if (
  conflict.laboratory.pipelines.find((pipeline) => pipeline.id === "research")
    ?.machineIds.length !== 0
)
  record("machine assignment steals a machine from another pipeline", {
    pipelines: conflict.laboratory.pipelines,
  });
const cashBeforeMachine = capacity.resources.money;
capacity = applyCommand(capacity, {
  type: "BUY_LAB_MACHINE",
  machineId: "parallel-rack",
});
const cashAfterMachine = capacity.resources.money;
capacity = applyCommand(capacity, {
  type: "BUY_LAB_MACHINE",
  machineId: "parallel-rack",
});
if (
  capacity.resources.money !== cashAfterMachine ||
  cashAfterMachine >= cashBeforeMachine
)
  record("machine purchase is not exactly once", {
    cashBeforeMachine,
    cashAfterMachine,
    cashAfterRepeat: capacity.resources.money,
  });
capacity = applyCommand(capacity, {
  type: "ASSIGN_LAB_MACHINE",
  pipelineId: "research",
  machineId: "parallel-rack",
});
capacity = applyCommand(capacity, {
  type: "QUEUE_LAB_RUN",
  pipelineId: "reproducibility",
});
capacity = applyCommand(capacity, {
  type: "QUEUE_LAB_RUN",
  pipelineId: "research",
});
const parallel = tick(capacity, 1);
const running = parallel.laboratory.pipelines.filter(
  (pipeline) => pipeline.activeRun !== null,
);
if (
  running.length !== 2 ||
  new Set(running.flatMap((pipeline) => pipeline.machineIds)).size !== 2 ||
  !isStateValid(parallel)
)
  record("explicit machines do not provide bounded parallel runs", {
    machines: parallel.laboratory.machines,
    running: running.map((pipeline) => ({
      id: pipeline.id,
      machineIds: pipeline.machineIds,
      activeRun: pipeline.activeRun,
    })),
    valid: isStateValid(parallel),
  });

// Third pipeline and third machine exercise the capacity neighbor, while a
// non-finite queue count must remain an exact no-op at the runtime boundary.
let three = createLaboratoryBalanceState(29);
for (const command of [
  { type: "BUY_LAB_MACHINE", machineId: "parallel-rack" },
  { type: "BUY_LAB_MACHINE", machineId: "evidence-rig" },
  { type: "ADD_LAB_PIPELINE", pipelineId: "research" },
  { type: "ADD_LAB_PIPELINE", pipelineId: "delivery" },
  {
    type: "ASSIGN_LAB_MACHINE",
    pipelineId: "research",
    machineId: "parallel-rack",
  },
  {
    type: "ASSIGN_LAB_MACHINE",
    pipelineId: "delivery",
    machineId: "evidence-rig",
  },
])
  three = applyCommand(three, command);
for (const pipelineId of ["reproducibility", "research", "delivery"])
  three = applyCommand(three, { type: "QUEUE_LAB_RUN", pipelineId });
const beforeNonFinite = clone(three);
const nonFinite = applyCommand(three, {
  type: "QUEUE_LAB_RUN",
  pipelineId: "research",
  count: Number.NaN,
});
if (!same(nonFinite, beforeNonFinite))
  record("non-finite laboratory queue count mutates state", {
    before: beforeNonFinite,
    after: nonFinite,
  });
const threeRunning = tick(three, 1).laboratory.pipelines.filter(
  (pipeline) => pipeline.activeRun !== null,
);
if (threeRunning.length !== 3)
  record("three assigned pipelines lack independent capacity", {
    machines: three.laboratory.machines,
    pipelines: threeRunning,
  });

// A stale duplicate allocation or active run without a machine must not be
// accepted as optional lab provenance during restore.
const malformed = clone(active);
malformed.integrity = undefined;
malformed.laboratory.pipelines[1].machineIds = ["bench-node"];
malformed.laboratory.pipelines[1].activeRun = {
  startedAtTick: malformed.tick,
  elapsedHours: 0,
  expectedDurationHours: 1,
  committedCost: 0.2,
};
const recovered = restoreSimulationState(malformed);
if (!isStateValid(recovered))
  record("malformed laboratory restore leaves invalid state", {
    laboratory: recovered.laboratory,
  });
if (
  recovered.laboratory.pipelines.some(
    (pipeline) => pipeline.activeRun !== null && pipeline.machineIds.length === 0,
  )
)
  record("malformed active run survives without machine capacity", {
    pipelines: recovered.laboratory.pipelines,
  });

console.log(JSON.stringify({
  findings,
  normalRuns: normal.length,
  activePipelines: active.laboratory.pipelines,
  parallelPipelines: running,
  threePipelineRuns: threeRunning.length,
  recoveredLaboratory: recovered.laboratory,
}, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
`;

const result = spawnSync("node_modules/.bin/tsx", ["-e", probe], {
  cwd: process.cwd(),
  encoding: "utf8",
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exitCode = result.status ?? 1;
