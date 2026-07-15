import { getHardware, getModule, getSlot, getWorkload, slots } from "./catalog";
import { nextRandom, normalizeSeed } from "./rng";
import {
  CONTENT_VERSION,
  SCHEMA_VERSION,
  type LedgerEvent,
  type PipelineMetrics,
  type PipelineSlotState,
  type SimulationCommand,
  type SimulationState,
} from "./types";

const MAX_LEDGER_EVENTS = 80;
const ROLE_ORDER = ["preparation", "model", "evaluation"] as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const round = (value: number, digits = 2): number =>
  Number(value.toFixed(digits));

function modulesFor(state: Pick<SimulationState, "slots">) {
  return state.slots.map((slot) => getModule(slot.moduleId));
}

function calculateOrderWarnings(
  state: Pick<SimulationState, "slots">,
): string[] {
  const processRoles = state.slots
    .map((slot) => getModule(slot.moduleId).role)
    .filter((role): role is (typeof ROLE_ORDER)[number] =>
      ROLE_ORDER.includes(role as (typeof ROLE_ORDER)[number]),
    );
  const warnings: string[] = [];
  for (let index = 1; index < processRoles.length; index += 1) {
    const previous = processRoles[index - 1];
    const current = processRoles[index];
    if (
      previous &&
      current &&
      ROLE_ORDER.indexOf(current) < ROLE_ORDER.indexOf(previous)
    ) {
      warnings.push(`${current} runs after ${previous}`);
    }
  }
  if (!processRoles.includes("model")) warnings.push("no model stage");
  if (!processRoles.includes("evaluation"))
    warnings.push("no evaluation stage");
  return warnings;
}

export function calculateMetrics(
  state: Pick<
    SimulationState,
    | "slots"
    | "hardwareId"
    | "workloadId"
    | "computeAllocation"
    | "memoryReserve"
    | "branchEnabled"
    | "rngState"
  >,
): PipelineMetrics {
  const selectedModules = modulesFor(state);
  const selectedHardware = getHardware(state.hardwareId);
  const workload = getWorkload(state.workloadId);
  const allocation = clamp(state.computeAllocation, 25, 100) / 100;
  const usableMemory =
    selectedHardware.memory * (1 - clamp(state.memoryReserve, 0, 30) / 100);
  const memoryUsed =
    workload.memoryDemand +
    selectedModules.reduce((total, item) => total + item.memory, 0);
  const memoryPressure = memoryUsed / Math.max(usableMemory, 0.1);
  const moduleThroughput = Math.min(
    ...selectedModules.map((item) => item.throughput),
  );
  const computeThroughput =
    (selectedHardware.compute * allocation * 10) / workload.computeDemand;
  const branchFactor = state.branchEnabled ? 0.82 : 1;
  const thermalLoad =
    selectedHardware.watts * allocation * (0.7 + workload.computeDemand / 70) +
    selectedModules.length * 1.5;
  const thermalPressure = thermalLoad / selectedHardware.thermalLimit;
  const thermalFactor =
    thermalPressure > 1 ? 1 / (1 + (thermalPressure - 1) * 1.7) : 1;
  const memoryFactor =
    memoryPressure > 1 ? 1 / (1 + (memoryPressure - 1) * 2.6) : 1;
  const orderWarnings = calculateOrderWarnings(state);
  const orderFactor = Math.pow(0.88, orderWarnings.length);
  const throughputPerMinute = Math.max(
    0.05,
    Math.min(moduleThroughput, computeThroughput) *
      branchFactor *
      thermalFactor *
      memoryFactor *
      orderFactor,
  );
  const baseLatency = selectedModules.reduce(
    (total, item) => total + item.latency,
    0.05,
  );
  const latencySeconds =
    baseLatency *
    (1 + workload.latencySensitivity * 0.3) *
    (computeThroughput < moduleThroughput
      ? moduleThroughput / Math.max(computeThroughput, 0.1)
      : 1) *
    (memoryPressure > 1 ? memoryPressure * 1.5 : 1);
  const moduleQuality = selectedModules.reduce(
    (total, item) => total + item.quality,
    0,
  );
  const qualityPenalty =
    Math.max(0, memoryPressure - 1) * 18 + orderWarnings.length * 9;
  const predictedQuality = clamp(
    workload.baseQuality +
      moduleQuality +
      (state.branchEnabled ? 3 : 0) -
      qualityPenalty,
    0,
    99,
  );
  const jitter =
    ((state.rngState % 997) / 996 - 0.5) *
    (16 - selectedModules.reduce((n, item) => n + item.observability, 0));
  const observedQuality = clamp(predictedQuality + jitter, 0, 99);
  const moduleReliability = selectedModules.reduce(
    (product, item) => product * item.reliability,
    1,
  );
  const reliability = clamp(
    moduleReliability *
      selectedHardware.reliability *
      orderFactor *
      (memoryPressure > 1 ? 1 / memoryPressure : 1),
    0.01,
    0.999,
  );
  const observability = clamp(
    selectedModules.reduce((total, item) => total + item.observability, 0) /
      selectedModules.length +
      (state.branchEnabled ? 0.08 : 0),
    0,
    1,
  );
  const evaluationModules = selectedModules.filter(
    (item) => item.role === "evaluation",
  );
  const evaluationCoverage = clamp(
    evaluationModules.reduce(
      (best, item) => Math.max(best, item.id === "robust-eval" ? 0.88 : 0.38),
      0,
    ) + (state.branchEnabled ? 0.1 : 0),
    0,
    1,
  );
  const operatingCost =
    selectedModules.reduce((total, item) => total + item.costPerJob, 0) +
    (selectedHardware.watts / 1000) * (latencySeconds / 3600) * 0.24 +
    selectedHardware.maintenance / 100;
  const candidates = [
    { label: "memory pressure", score: memoryPressure },
    { label: "thermal throttling", score: thermalPressure },
    {
      label: "compute capacity",
      score: moduleThroughput / Math.max(computeThroughput, 0.01),
    },
    {
      label: "module throughput",
      score: computeThroughput / Math.max(moduleThroughput, 0.01),
    },
    { label: "stage ordering", score: orderWarnings.length ? 1.6 : 0 },
  ];
  const dominantBottleneck =
    candidates.sort((left, right) => right.score - left.score)[0]?.label ??
    "none";

  return {
    throughputPerMinute: round(throughputPerMinute),
    latencySeconds: round(latencySeconds),
    memoryUsed: round(memoryUsed, 1),
    memoryAvailable: round(usableMemory, 1),
    memoryPressure: round(memoryPressure, 3),
    thermalLoad: round(thermalLoad, 1),
    thermalPressure: round(thermalPressure, 3),
    predictedQuality: round(predictedQuality, 1),
    observedQuality: round(observedQuality, 1),
    reliability: round(reliability, 4),
    observability: round(observability, 3),
    evaluationCoverage: round(evaluationCoverage, 3),
    operatingCost: round(operatingCost, 3),
    dominantBottleneck,
    orderWarnings,
  };
}

function appendEvent(
  state: SimulationState,
  event: Omit<LedgerEvent, "id" | "tick">,
): SimulationState {
  const ledger = [
    ...state.ledger,
    {
      ...event,
      id: `evt-${state.tick}-${state.ledger.length + 1}`,
      tick: state.tick,
    },
  ].slice(-MAX_LEDGER_EVENTS);
  return { ...state, ledger };
}

function recalculate(state: SimulationState): SimulationState {
  const metrics = calculateMetrics(state);
  let lastWarning = "System operating inside predicted limits.";
  if (metrics.memoryPressure > 1)
    lastWarning = "Memory limit exceeded — failures will propagate.";
  else if (metrics.thermalPressure > 1)
    lastWarning = "Thermal throttling reduces effective throughput.";
  else if (metrics.orderWarnings.length)
    lastWarning = `Pipeline order anomaly: ${metrics.orderWarnings[0]}.`;
  else if (metrics.reliability < 0.82)
    lastWarning = "Unstable modules may corrupt downstream results.";
  else if (metrics.evaluationCoverage < 0.4)
    lastWarning = "Evaluation blind spots widen observed uncertainty.";
  return { ...state, metrics, lastWarning };
}

export function createInitialState(seed = 20260715): SimulationState {
  const normalizedSeed = normalizeSeed(seed);
  const base = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    seed: normalizedSeed,
    rngState: normalizedSeed,
    tick: 0,
    hardwareId: "bedroom-cpu",
    ownedHardwareIds: ["bedroom-cpu"],
    workloadId: "interactive-chat",
    slots: [
      { slotId: "source", moduleId: "request-buffer" },
      { slotId: "prepare", moduleId: "basic-cleaner" },
      { slotId: "runtime", moduleId: "quantized-model" },
      { slotId: "verify", moduleId: "smoke-check" },
      { slotId: "sink", moduleId: "delivery-gate" },
    ],
    branchEnabled: false,
    computeAllocation: 80,
    memoryReserve: 10,
    resources: { money: 1800, timeHours: 4, electricityKwh: 0, reputation: 0 },
    jobs: {
      queued: 0,
      completed: 0,
      failed: 0,
      processingCarry: 0,
      paused: false,
    },
    metrics: {} as PipelineMetrics,
    baselineMetrics: null,
    baselineLabel: null,
    failedModuleId: null,
    lastWarning: "",
    ledger: [],
  } satisfies SimulationState;
  return appendEvent(recalculate(base), {
    kind: "info",
    message:
      "Pipeline initialized. Queue a workload, observe, then reconfigure.",
  });
}

function updateSlots(
  state: SimulationState,
  moduleId: string,
  slotId: string,
  fromSlotId?: string,
): readonly PipelineSlotState[] | null {
  const destination = getSlot(slotId);
  const module = getModule(moduleId);
  if (!module.slotTypes.includes(destination.type)) return null;
  const destinationState = state.slots.find((item) => item.slotId === slotId);
  if (!destinationState) return null;

  if (fromSlotId && fromSlotId !== slotId) {
    const sourceState = state.slots.find((item) => item.slotId === fromSlotId);
    if (!sourceState) return null;
    const sourceSlot = getSlot(fromSlotId);
    const destinationModule = getModule(destinationState.moduleId);
    if (!destinationModule.slotTypes.includes(sourceSlot.type)) return null;
    return state.slots.map((item) => {
      if (item.slotId === slotId) return { ...item, moduleId };
      if (item.slotId === fromSlotId)
        return { ...item, moduleId: destinationState.moduleId };
      return item;
    });
  }

  return state.slots.map((item) =>
    item.slotId === slotId ? { ...item, moduleId } : item,
  );
}

export function applyCommand(
  state: SimulationState,
  command: SimulationCommand,
): SimulationState {
  switch (command.type) {
    case "RESET":
      return createInitialState(command.seed ?? state.seed);
    case "PLACE_MODULE": {
      const nextSlots = updateSlots(
        state,
        command.moduleId,
        command.slotId,
        command.fromSlotId,
      );
      if (!nextSlots) {
        return appendEvent(state, {
          kind: "warning",
          message: "Module rejected: incompatible slot.",
        });
      }
      const previous = state.metrics;
      const next = recalculate({
        ...state,
        slots: nextSlots,
        baselineMetrics: previous,
        baselineLabel: "Before module change",
        failedModuleId: null,
      });
      return appendEvent(next, {
        kind: "info",
        message: `${getModule(command.moduleId).name} snapped into ${getSlot(command.slotId).name}.`,
      });
    }
    case "SET_WORKLOAD": {
      getWorkload(command.workloadId);
      const next = recalculate({
        ...state,
        workloadId: command.workloadId,
        baselineMetrics: state.metrics,
        baselineLabel: "Previous workload",
        failedModuleId: null,
      });
      return appendEvent(next, {
        kind: "info",
        message: `Workload changed to ${getWorkload(command.workloadId).name}.`,
      });
    }
    case "BUY_HARDWARE": {
      const nextHardware = getHardware(command.hardwareId);
      if (state.ownedHardwareIds.includes(command.hardwareId)) {
        return applyCommand(state, {
          type: "SELECT_HARDWARE",
          hardwareId: command.hardwareId,
        });
      }
      if (state.resources.money < nextHardware.purchaseCost) {
        return appendEvent(state, {
          kind: "warning",
          message: `Purchase blocked: need $${nextHardware.purchaseCost}.`,
        });
      }
      const next = recalculate({
        ...state,
        hardwareId: command.hardwareId,
        ownedHardwareIds: [...state.ownedHardwareIds, command.hardwareId],
        resources: {
          ...state.resources,
          money: state.resources.money - nextHardware.purchaseCost,
        },
        baselineMetrics: state.metrics,
        baselineLabel: "Previous hardware",
      });
      return appendEvent(next, {
        kind: "success",
        message: `${nextHardware.name} purchased. New constraints: power, heat, and maintenance.`,
      });
    }
    case "SELECT_HARDWARE": {
      if (!state.ownedHardwareIds.includes(command.hardwareId)) {
        return appendEvent(state, {
          kind: "warning",
          message: "Hardware must be purchased before selection.",
        });
      }
      const next = recalculate({
        ...state,
        hardwareId: command.hardwareId,
        baselineMetrics: state.metrics,
        baselineLabel: "Previous hardware",
      });
      return appendEvent(next, {
        kind: "info",
        message: `${getHardware(command.hardwareId).name} selected.`,
      });
    }
    case "SET_COMPUTE_ALLOCATION":
      return recalculate({
        ...state,
        computeAllocation: clamp(Math.round(command.percent), 25, 100),
      });
    case "SET_MEMORY_RESERVE":
      return recalculate({
        ...state,
        memoryReserve: clamp(Math.round(command.percent), 0, 30),
      });
    case "TOGGLE_BRANCH": {
      const next = recalculate({
        ...state,
        branchEnabled: !state.branchEnabled,
        baselineMetrics: state.metrics,
        baselineLabel: "Before branch change",
      });
      return appendEvent(next, {
        kind: "info",
        message: next.branchEnabled
          ? "Shadow evaluation branch enabled: more evidence, less throughput."
          : "Shadow evaluation branch merged back into the main flow.",
      });
    }
    case "QUEUE_JOBS": {
      const count = clamp(Math.trunc(command.count), 1, 50);
      return appendEvent(
        {
          ...state,
          jobs: {
            ...state.jobs,
            queued: Math.min(99, state.jobs.queued + count),
          },
        },
        {
          kind: "info",
          message: `${count} ${getWorkload(state.workloadId).name.toLowerCase()} job${count === 1 ? "" : "s"} queued.`,
        },
      );
    }
    case "TOGGLE_PAUSE":
      return appendEvent(
        { ...state, jobs: { ...state.jobs, paused: !state.jobs.paused } },
        {
          kind: "info",
          message: state.jobs.paused
            ? "Processing resumed."
            : "Processing paused; queued work retained.",
        },
      );
    case "CAPTURE_BASELINE":
      return appendEvent(
        {
          ...state,
          baselineMetrics: state.metrics,
          baselineLabel: command.label.slice(0, 32) || "Saved baseline",
        },
        {
          kind: "success",
          message: "Current configuration captured for comparison.",
        },
      );
  }
}

function firstFailureModule(
  state: SimulationState,
  randomValue: number,
): string {
  const selected = modulesFor(state);
  let cursor = randomValue;
  for (const module of selected) {
    cursor -= 1 - module.reliability;
    if (cursor <= 0) return module.id;
  }
  return selected[0]?.id ?? "request-buffer";
}

export function tick(state: SimulationState, seconds: number): SimulationState {
  const elapsed = clamp(seconds, 0, 60);
  if (elapsed === 0) return state;
  let next: SimulationState = {
    ...state,
    tick: state.tick + Math.round(elapsed * 1000),
    resources: {
      ...state.resources,
      timeHours: Math.max(0, state.resources.timeHours - elapsed / 3600),
      electricityKwh:
        state.resources.electricityKwh +
        (getHardware(state.hardwareId).watts *
          (state.computeAllocation / 100) *
          elapsed) /
          3_600_000,
    },
  };
  if (next.jobs.paused || next.jobs.queued === 0) return recalculate(next);

  const potential =
    next.jobs.processingCarry +
    (next.metrics.throughputPerMinute * elapsed) / 60;
  const resolved = Math.min(next.jobs.queued, Math.floor(potential));
  next = {
    ...next,
    jobs: {
      ...next.jobs,
      queued: next.jobs.queued - resolved,
      processingCarry: potential - resolved,
    },
  };
  const workload = getWorkload(next.workloadId);
  for (let index = 0; index < resolved; index += 1) {
    const sample = nextRandom(next.rngState);
    const memoryFailure = next.metrics.memoryPressure > 1;
    const failed = memoryFailure || sample.value > next.metrics.reliability;
    const cost = next.metrics.operatingCost;
    next = {
      ...next,
      rngState: sample.state,
      resources: {
        ...next.resources,
        money: Math.max(
          0,
          next.resources.money - cost + (failed ? 0 : workload.rewardMoney),
        ),
        reputation: Math.max(
          0,
          next.resources.reputation +
            (failed ? -0.03 : workload.rewardReputation),
        ),
      },
      jobs: {
        ...next.jobs,
        completed: next.jobs.completed + (failed ? 0 : 1),
        failed: next.jobs.failed + (failed ? 1 : 0),
      },
      failedModuleId: failed
        ? firstFailureModule(
            next,
            sample.value * (1 - next.metrics.reliability + 0.001),
          )
        : null,
    };
    if (failed) {
      next = appendEvent(next, {
        kind: "failure",
        message: memoryFailure
          ? "Job failed before delivery: memory capacity exceeded."
          : "Unstable output rejected at delivery.",
        directCause: memoryFailure
          ? "Required memory exceeded available memory."
          : "A processor emitted malformed output.",
        contributingCondition:
          next.metrics.observability < 0.6
            ? "Low observability delayed isolation."
            : undefined,
      });
    }
  }
  if (resolved > 0 && next.jobs.failed === state.jobs.failed) {
    next = appendEvent(next, {
      kind: "success",
      message: `${resolved} job${resolved === 1 ? "" : "s"} completed inside policy limits.`,
    });
  }
  return recalculate(next);
}

export function isStateValid(state: SimulationState): boolean {
  const numeric = [
    state.resources.money,
    state.resources.timeHours,
    state.resources.electricityKwh,
    state.resources.reputation,
    state.jobs.queued,
    state.jobs.completed,
    state.jobs.failed,
    state.metrics.throughputPerMinute,
    state.metrics.latencySeconds,
    state.metrics.memoryPressure,
  ];
  return (
    numeric.every((value) => Number.isFinite(value) && value >= 0) &&
    slots.every((slot) =>
      state.slots.some((current) => current.slotId === slot.id),
    ) &&
    state.slots.every((slot) =>
      getModule(slot.moduleId).slotTypes.includes(getSlot(slot.slotId).type),
    )
  );
}
