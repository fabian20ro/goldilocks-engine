import {
  findHardware,
  findModule,
  findSlot,
  findWorkload,
  getHardware,
  getModule,
  getWorkload,
  hardware,
  modules,
  slots,
  starterModuleIds,
  STARTER_HARDWARE_ID,
  workloads,
} from "./catalog";
import { nextRandom, normalizeSeed } from "./rng";
import {
  CONTENT_VERSION,
  SCHEMA_VERSION,
  type LedgerEvent,
  type PipelineMetrics,
  type PipelineSlotState,
  type SimulationCommand,
  type SimulationState,
  type UpgradeNotice,
} from "./types";

const MAX_LEDGER_EVENTS = 80;
const ROLE_ORDER = ["preparation", "model", "evaluation"] as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const round = (value: number, digits = 2): number =>
  Number(value.toFixed(digits));
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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
  const dominantCandidate = candidates.reduce((dominant, candidate) =>
    candidate.score > dominant.score ? candidate : dominant,
  );
  const dominantBottleneck = dominantCandidate.label;
  const slowestModuleIndex = selectedModules.reduce(
    (slowest, module, index) =>
      module.throughput < selectedModules[slowest]!.throughput
        ? index
        : slowest,
    0,
  );
  const bottleneckSlotId =
    dominantBottleneck === "module throughput"
      ? (state.slots[slowestModuleIndex]?.slotId ?? "runtime")
      : dominantBottleneck === "stage ordering"
        ? "prepare"
        : "runtime";

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
    bottleneckSlotId,
    orderWarnings,
  };
}

function appendEvent(
  state: SimulationState,
  event: Omit<LedgerEvent, "id" | "tick">,
): SimulationState {
  const eventSequence = state.eventSequence + 1;
  const ledger = [
    ...state.ledger,
    {
      ...event,
      id: `evt-${state.tick}-${eventSequence}`,
      tick: state.tick,
    },
  ].slice(-MAX_LEDGER_EVENTS);
  return { ...state, eventSequence, ledger };
}

function withUpgradeNotice(
  state: SimulationState,
  notice: UpgradeNotice,
): SimulationState {
  return appendEvent({ ...state, lastUpgradeNotice: notice }, notice);
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
    hardwareId: STARTER_HARDWARE_ID,
    ownedHardwareIds: [STARTER_HARDWARE_ID],
    ownedModuleIds: starterModuleIds,
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
    resources: { money: 0, timeHours: 4, electricityKwh: 0, reputation: 0 },
    jobs: {
      queued: 0,
      completed: 0,
      failed: 0,
      processingCarry: 0,
      paused: false,
      grossEarned: 0,
      operatingCostsPaid: 0,
    },
    lastSettlement: null,
    metrics: {} as PipelineMetrics,
    baselineMetrics: null,
    baselineLabel: null,
    failedModuleId: null,
    lastWarning: "",
    lastUpgradeNotice: null,
    eventSequence: 0,
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
  const destination = findSlot(slotId);
  const module = findModule(moduleId);
  if (!destination || !module) return null;
  if (!module.slotTypes.includes(destination.type)) return null;
  const destinationState = state.slots.find((item) => item.slotId === slotId);
  if (!destinationState) return null;

  if (fromSlotId && fromSlotId !== slotId) {
    const sourceState = state.slots.find((item) => item.slotId === fromSlotId);
    if (!sourceState) return null;
    const sourceSlot = findSlot(fromSlotId);
    const destinationModule = findModule(destinationState.moduleId);
    if (!sourceSlot || !destinationModule) return null;
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

function hasValidNumericInput(command: SimulationCommand): boolean {
  switch (command.type) {
    case "SET_COMPUTE_ALLOCATION":
    case "SET_MEMORY_RESERVE":
      return isFiniteNumber(command.percent);
    case "QUEUE_JOBS":
      return isFiniteNumber(command.count);
    case "RESET":
      return command.seed === undefined || isFiniteNumber(command.seed);
    case "CAPTURE_BASELINE":
      return typeof command.label === "string";
    default:
      return true;
  }
}

function applyValidCommand(
  state: SimulationState,
  command: SimulationCommand,
): SimulationState {
  switch (command.type) {
    case "RESET":
      return createInitialState(command.seed ?? state.seed);
    case "PLACE_MODULE": {
      const module = findModule(command.moduleId);
      const slot = findSlot(command.slotId);
      if (!module || !slot) {
        return withUpgradeNotice(state, {
          kind: "warning",
          message: "Module change rejected: the item or slot is unavailable.",
        });
      }
      if (!state.ownedModuleIds.includes(module.id)) {
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${module.name} is not owned. Buy it in Upgrades before adding it.`,
        });
      }
      const nextSlots = updateSlots(
        state,
        command.moduleId,
        command.slotId,
        command.fromSlotId,
      );
      if (!nextSlots) {
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${module.name} is incompatible with ${slot.name}. Choose a ${module.slotTypes.join("/")} slot.`,
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
      return withUpgradeNotice(next, {
        kind: "info",
        message: `${module.name} equipped in ${slot.name}. Observed delta: ${previous.throughputPerMinute}/m → ${next.metrics.throughputPerMinute}/m throughput, ${previous.latencySeconds}s → ${next.metrics.latencySeconds}s latency, ${previous.memoryUsed} GB → ${next.metrics.memoryUsed} GB memory, ${previous.predictedQuality} → ${next.metrics.predictedQuality} predicted quality.`,
      });
    }
    case "SET_WORKLOAD": {
      const workload = findWorkload(command.workloadId);
      if (!workload)
        return appendEvent(state, {
          kind: "warning",
          message: "Workload change rejected: unknown workload.",
        });
      const next = recalculate({
        ...state,
        workloadId: command.workloadId,
        baselineMetrics: state.metrics,
        baselineLabel: "Previous workload",
        failedModuleId: null,
      });
      return appendEvent(next, {
        kind: "info",
        message: `Workload changed to ${workload.name}.`,
      });
    }
    case "BUY_HARDWARE": {
      const item = findHardware(command.hardwareId);
      if (!item)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: "Rig purchase rejected: unknown item.",
        });
      if (state.ownedHardwareIds.includes(item.id))
        return withUpgradeNotice(state, {
          kind: "info",
          message: `${item.name} is already owned. No money was deducted.`,
        });
      if (state.resources.money < item.purchaseCost)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${item.name} costs $${item.purchaseCost.toFixed(2)}; $${(item.purchaseCost - state.resources.money).toFixed(2)} more is required. No money was deducted.`,
        });
      return withUpgradeNotice(
        {
          ...state,
          ownedHardwareIds: [...state.ownedHardwareIds, item.id],
          resources: {
            ...state.resources,
            money: round(state.resources.money - item.purchaseCost, 3),
          },
        },
        {
          kind: "success",
          message: `${item.name} purchased for $${item.purchaseCost.toFixed(2)} and is now owned. Equip it to apply its constraints; purchase deducted exactly once.`,
        },
      );
    }
    case "EQUIP_HARDWARE": {
      const item = findHardware(command.hardwareId);
      if (!item)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: "Rig equip rejected: unknown item.",
        });
      if (!state.ownedHardwareIds.includes(item.id))
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${item.name} is not owned. Buy it before equipping it.`,
        });
      if (state.hardwareId === item.id)
        return withUpgradeNotice(state, {
          kind: "info",
          message: `${item.name} is already equipped.`,
        });
      const previous = state.metrics;
      const previousRig = getHardware(state.hardwareId);
      const next = recalculate({
        ...state,
        hardwareId: item.id,
        baselineMetrics: previous,
        baselineLabel: `Before ${item.name}`,
        failedModuleId: null,
      });
      return withUpgradeNotice(next, {
        kind: "success",
        message: `${item.name} equipped. Observed delta: ${previousRig.compute} → ${item.compute} CU, ${previousRig.memory} → ${item.memory} GB capacity, ${previous.throughputPerMinute}/m → ${next.metrics.throughputPerMinute}/m throughput, ${Math.round(previous.thermalPressure * 100)}% → ${Math.round(next.metrics.thermalPressure * 100)}% thermal pressure, $${previous.operatingCost.toFixed(3)} → $${next.metrics.operatingCost.toFixed(3)} per attempt.`,
      });
    }
    case "BUY_MODULE": {
      const item = findModule(command.moduleId);
      if (!item)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: "Module purchase rejected: unknown item.",
        });
      if (state.ownedModuleIds.includes(item.id))
        return withUpgradeNotice(state, {
          kind: "info",
          message: `${item.name} is already owned. No money was deducted.`,
        });
      if (item.purchaseCost <= 0)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${item.name} is starter equipment and should already be owned. No money was deducted.`,
        });
      if (state.resources.money < item.purchaseCost)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${item.name} costs $${item.purchaseCost.toFixed(2)}; $${(item.purchaseCost - state.resources.money).toFixed(2)} more is required. No money was deducted.`,
        });
      return withUpgradeNotice(
        {
          ...state,
          ownedModuleIds: [...state.ownedModuleIds, item.id],
          resources: {
            ...state.resources,
            money: round(state.resources.money - item.purchaseCost, 3),
          },
        },
        {
          kind: "success",
          message: `${item.name} purchased for $${item.purchaseCost.toFixed(2)} and is now owned. Add it to a compatible ${item.slotTypes.join("/")} slot in Build; purchase deducted exactly once.`,
        },
      );
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

export function applyCommand(
  state: SimulationState,
  command: SimulationCommand,
): SimulationState {
  if (typeof command !== "object" || command === null) return state;
  if (!hasValidNumericInput(command)) return state;
  const next = applyValidCommand(state, command);
  return isStateValid(next) ? next : state;
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

function advanceTick(state: SimulationState, seconds: number): SimulationState {
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
  if (next.jobs.paused) return recalculate(next);
  if (next.jobs.queued === 0) {
    return recalculate({
      ...next,
      jobs: { ...next.jobs, processingCarry: 0 },
    });
  }

  const potential =
    next.jobs.processingCarry +
    (next.metrics.throughputPerMinute * elapsed) / 60;
  const resolved = Math.min(next.jobs.queued, Math.floor(potential));
  const queued = next.jobs.queued - resolved;
  next = {
    ...next,
    jobs: {
      ...next.jobs,
      queued,
      processingCarry: queued > 0 ? potential - resolved : 0,
    },
  };
  const workload = getWorkload(next.workloadId);
  const moneyBeforeSettlement = next.resources.money;
  const completedBeforeSettlement = next.jobs.completed;
  const failedBeforeSettlement = next.jobs.failed;
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
  const completedNow = next.jobs.completed - completedBeforeSettlement;
  const failedNow = next.jobs.failed - failedBeforeSettlement;
  if (resolved > 0) {
    const grossPayout = round(completedNow * workload.rewardMoney, 3);
    const operatingCost = round(resolved * next.metrics.operatingCost, 3);
    const netChange = round(next.resources.money - moneyBeforeSettlement, 3);
    next = {
      ...next,
      jobs: {
        ...next.jobs,
        grossEarned: round(next.jobs.grossEarned + grossPayout, 3),
        operatingCostsPaid: round(
          next.jobs.operatingCostsPaid + operatingCost,
          3,
        ),
      },
      lastSettlement: {
        tick: next.tick,
        workloadId: next.workloadId,
        completed: completedNow,
        failed: failedNow,
        grossPayout,
        operatingCost,
        netChange,
      },
    };
  }
  if (resolved > 0 && failedNow === 0) {
    next = appendEvent(next, {
      kind: "success",
      message: `${completedNow} job${completedNow === 1 ? "" : "s"} completed; $${round(completedNow * workload.rewardMoney, 2).toFixed(2)} gross payout earned before operating cost.`,
    });
  }
  return recalculate(next);
}

export function tick(state: SimulationState, seconds: number): SimulationState {
  if (!isFiniteNumber(seconds)) return state;
  const next = advanceTick(state, seconds);
  return isStateValid(next) ? next : state;
}

const metricNumbers = (metrics: PipelineMetrics): readonly number[] => [
  metrics.throughputPerMinute,
  metrics.latencySeconds,
  metrics.memoryUsed,
  metrics.memoryAvailable,
  metrics.memoryPressure,
  metrics.thermalLoad,
  metrics.thermalPressure,
  metrics.predictedQuality,
  metrics.observedQuality,
  metrics.reliability,
  metrics.observability,
  metrics.evaluationCoverage,
  metrics.operatingCost,
];

function areMetricsValid(metrics: PipelineMetrics): boolean {
  return (
    metricNumbers(metrics).every(
      (value) => Number.isFinite(value) && value >= 0,
    ) &&
    metrics.predictedQuality <= 99 &&
    metrics.observedQuality <= 99 &&
    metrics.reliability <= 1 &&
    metrics.observability <= 1 &&
    metrics.evaluationCoverage <= 1
  );
}

export function isStateValid(state: SimulationState): boolean {
  try {
    const nonnegativeNumbers = [
      state.resources.money,
      state.resources.timeHours,
      state.resources.electricityKwh,
      state.resources.reputation,
      state.jobs.processingCarry,
      state.jobs.grossEarned,
      state.jobs.operatingCostsPaid,
    ];
    const nonnegativeIntegers = [
      state.tick,
      state.jobs.queued,
      state.jobs.completed,
      state.jobs.failed,
      state.eventSequence,
    ];
    const eventIds = state.ledger.map((event) => event.id);
    const hardwareIds = hardware.map((item) => item.id);
    const moduleIds = modules.map((item) => item.id);
    return (
      state.schemaVersion === SCHEMA_VERSION &&
      state.contentVersion === CONTENT_VERSION &&
      Number.isInteger(state.seed) &&
      state.seed > 0 &&
      state.seed <= 0xffff_ffff &&
      Number.isInteger(state.rngState) &&
      state.rngState > 0 &&
      state.rngState <= 0xffff_ffff &&
      Array.isArray(state.ownedHardwareIds) &&
      state.ownedHardwareIds.length > 0 &&
      state.ownedHardwareIds.every((id) => hardwareIds.includes(id)) &&
      new Set(state.ownedHardwareIds).size === state.ownedHardwareIds.length &&
      state.ownedHardwareIds.includes(state.hardwareId) &&
      Array.isArray(state.ownedModuleIds) &&
      starterModuleIds.every((id) => state.ownedModuleIds.includes(id)) &&
      state.ownedModuleIds.every((id) => moduleIds.includes(id)) &&
      new Set(state.ownedModuleIds).size === state.ownedModuleIds.length &&
      nonnegativeNumbers.every(
        (value) => Number.isFinite(value) && value >= 0,
      ) &&
      nonnegativeIntegers.every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      ) &&
      Number.isInteger(state.computeAllocation) &&
      state.computeAllocation >= 25 &&
      state.computeAllocation <= 100 &&
      Number.isInteger(state.memoryReserve) &&
      state.memoryReserve >= 0 &&
      state.memoryReserve <= 30 &&
      state.jobs.queued <= 99 &&
      state.jobs.processingCarry < 1 &&
      (state.lastUpgradeNotice === null ||
        (typeof state.lastUpgradeNotice.message === "string" &&
          state.lastUpgradeNotice.message.length <= 800 &&
          ["info", "success", "warning", "failure"].includes(
            state.lastUpgradeNotice.kind,
          ))) &&
      (state.lastSettlement === null ||
        (Number.isSafeInteger(state.lastSettlement.tick) &&
          state.lastSettlement.tick >= 0 &&
          state.lastSettlement.tick <= state.tick &&
          workloads.some(
            (workload) => workload.id === state.lastSettlement?.workloadId,
          ) &&
          Number.isSafeInteger(state.lastSettlement.completed) &&
          state.lastSettlement.completed >= 0 &&
          Number.isSafeInteger(state.lastSettlement.failed) &&
          state.lastSettlement.failed >= 0 &&
          [
            state.lastSettlement.grossPayout,
            state.lastSettlement.operatingCost,
            state.lastSettlement.netChange,
          ].every(Number.isFinite) &&
          state.lastSettlement.grossPayout >= 0 &&
          state.lastSettlement.operatingCost >= 0)) &&
      areMetricsValid(state.metrics) &&
      (state.baselineMetrics === null ||
        areMetricsValid(state.baselineMetrics)) &&
      Array.isArray(state.slots) &&
      state.slots.length === slots.length &&
      slots.every((slot) =>
        state.slots.some((current) => current.slotId === slot.id),
      ) &&
      state.slots.every((slotState) => {
        const module = findModule(slotState.moduleId);
        const slot = findSlot(slotState.slotId);
        return (
          module !== undefined &&
          slot !== undefined &&
          state.ownedModuleIds.includes(module.id) &&
          module.slotTypes.includes(slot.type)
        );
      }) &&
      state.ledger.length <= MAX_LEDGER_EVENTS &&
      state.ledger.every(
        (event) =>
          Number.isSafeInteger(event.tick) &&
          event.tick >= 0 &&
          event.tick <= state.tick,
      ) &&
      new Set(eventIds).size === eventIds.length
    );
  } catch {
    return false;
  }
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function safeLegacySlots(value: unknown): readonly PipelineSlotState[] | null {
  if (!Array.isArray(value) || value.length !== slots.length) return null;
  const candidate = value.map((entry) => {
    if (typeof entry !== "object" || entry === null) return null;
    const record = entry as Record<string, unknown>;
    const slot = findSlot(record.slotId);
    const module = findModule(record.moduleId);
    if (!slot || !module || !module.slotTypes.includes(slot.type)) return null;
    return { slotId: slot.id, moduleId: module.id };
  });
  if (candidate.some((entry) => entry === null)) return null;
  if (
    !slots.every((slot) => candidate.some((entry) => entry?.slotId === slot.id))
  )
    return null;
  return candidate as readonly PipelineSlotState[];
}

/** Restores current saves or migrates the former schema-v3 Pipeline Toy state. */
export function restoreSimulationState(
  value: unknown,
  fallbackSeed = 20260715,
): SimulationState {
  const fallback = createInitialState(fallbackSeed);
  if (typeof value !== "object" || value === null) return fallback;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion === SCHEMA_VERSION) {
    const candidate = value as SimulationState;
    return isStateValid(candidate) ? recalculate(candidate) : fallback;
  }
  if (record.schemaVersion !== 3) return fallback;

  const legacySlots = safeLegacySlots(record.slots);
  const legacyHardware = findHardware(record.hardwareId);
  const legacyWorkload = findWorkload(record.workloadId);
  if (!legacySlots || !legacyHardware || !legacyWorkload) return fallback;
  const legacyResources =
    typeof record.resources === "object" && record.resources !== null
      ? (record.resources as Record<string, unknown>)
      : {};
  const legacyJobs =
    typeof record.jobs === "object" && record.jobs !== null
      ? (record.jobs as Record<string, unknown>)
      : {};
  const seed = normalizeSeed(finiteOr(record.seed, fallback.seed));
  const migratedBase: SimulationState = {
    ...createInitialState(seed),
    rngState: normalizeSeed(finiteOr(record.rngState, seed)),
    tick: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.trunc(finiteOr(record.tick, 0)),
    ),
    hardwareId: legacyHardware.id,
    ownedHardwareIds: [...new Set([STARTER_HARDWARE_ID, legacyHardware.id])],
    ownedModuleIds: [
      ...new Set([
        ...starterModuleIds,
        ...legacySlots.map((slot) => slot.moduleId),
      ]),
    ],
    workloadId: legacyWorkload.id,
    slots: legacySlots,
    branchEnabled:
      typeof record.branchEnabled === "boolean" ? record.branchEnabled : false,
    computeAllocation: clamp(
      Math.round(finiteOr(record.computeAllocation, 80)),
      25,
      100,
    ),
    memoryReserve: clamp(Math.round(finiteOr(record.memoryReserve, 10)), 0, 30),
    resources: {
      money: finiteOr(legacyResources.money, 0),
      timeHours: finiteOr(legacyResources.timeHours, 4),
      electricityKwh: finiteOr(legacyResources.electricityKwh, 0),
      reputation: finiteOr(legacyResources.reputation, 0),
    },
    jobs: {
      queued: clamp(Math.trunc(finiteOr(legacyJobs.queued, 0)), 0, 99),
      completed: Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.trunc(finiteOr(legacyJobs.completed, 0)),
      ),
      failed: Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.trunc(finiteOr(legacyJobs.failed, 0)),
      ),
      processingCarry: clamp(finiteOr(legacyJobs.processingCarry, 0), 0, 0.999),
      paused: typeof legacyJobs.paused === "boolean" && legacyJobs.paused,
      grossEarned: finiteOr(legacyJobs.grossEarned, 0),
      operatingCostsPaid: finiteOr(legacyJobs.operatingCostsPaid, 0),
    },
    lastSettlement: null,
    baselineMetrics: null,
    baselineLabel: null,
    failedModuleId: null,
    lastUpgradeNotice: {
      kind: "info",
      message:
        "Existing Pipeline Toy state migrated to the ownership economy; active starter equipment remains owned.",
    },
  };
  const migrated = recalculate(migratedBase);
  return isStateValid(migrated) ? migrated : fallback;
}
