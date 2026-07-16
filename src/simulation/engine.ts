import {
  findHardware,
  findModule,
  findPipelineExpansion,
  findSlot,
  findWorkload,
  getHardware,
  getModule,
  getWorkload,
  hardware,
  modules,
  pipelineExpansions,
  slots,
  starterSlots,
  starterModuleIds,
  STARTER_HARDWARE_ID,
  workloads,
} from "./catalog";
import { nextRandom, normalizeSeed } from "./rng";
import {
  CONTENT_VERSION,
  SAVE_INTEGRITY_ALGORITHM,
  SCHEMA_VERSION,
  type LedgerEvent,
  type MigrationMetadata,
  type PipelineMetrics,
  type PipelineSlotState,
  type QueuedTask,
  type SaveIntegrity,
  type SimulationCommand,
  type SimulationState,
  type UpgradeNotice,
  type WorkloadDemandState,
  type WorkloadQuote,
} from "./types";

const MAX_LEDGER_EVENTS = 80;
const MAX_QUEUED_TASKS = 99;
const FIXED_TICK_SECONDS = 0.5;
export const SIMULATION_TIME_SCALE = 70;

export function getSimulationAgeHours(
  state: Pick<SimulationState, "tick">,
): number {
  return (state.tick * SIMULATION_TIME_SCALE) / 3_600_000;
}
const ROLE_ORDER = ["preparation", "model", "evaluation"] as const;
const EVENT_KINDS = ["info", "success", "warning", "failure"] as const;
const BOTTLENECKS = [
  "memory pressure",
  "thermal throttling",
  "compute capacity",
  "module throughput",
  "stage ordering",
] as const;
const EMPTY_INTEGRITY: SaveIntegrity = {
  algorithm: SAVE_INTEGRITY_ALGORITHM,
  digest: "00000000",
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const round = (value: number, digits = 2): number =>
  Number(value.toFixed(digits));
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function stateIntegrityDigest(state: SimulationState): string {
  const payload = { ...state } as Record<string, unknown>;
  delete payload.integrity;
  const serialized = JSON.stringify(payload);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Adds the deterministic corruption check carried by every runtime snapshot. */
export function sealSimulationState(state: SimulationState): SimulationState {
  return {
    ...state,
    integrity: {
      algorithm: SAVE_INTEGRITY_ALGORITHM,
      digest: stateIntegrityDigest(state),
    },
  };
}

export function hasValidStateIntegrity(state: SimulationState): boolean {
  try {
    return (
      state.integrity.algorithm === SAVE_INTEGRITY_ALGORITHM &&
      /^[0-9a-f]{8}$/.test(state.integrity.digest) &&
      state.integrity.digest === stateIntegrityDigest(state)
    );
  } catch {
    return false;
  }
}

function modulesFor(state: Pick<SimulationState, "slots">) {
  return state.slots.flatMap((slot) =>
    slot.moduleId ? [getModule(slot.moduleId)] : [],
  );
}

function calculateOrderWarnings(
  state: Pick<SimulationState, "slots">,
): string[] {
  const processRoles = state.slots
    .flatMap((slot) => (slot.moduleId ? [getModule(slot.moduleId).role] : []))
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
  const selectedSlots = state.slots.flatMap((slot) =>
    slot.moduleId ? [{ slot, module: getModule(slot.moduleId) }] : [],
  );
  const selectedModules = selectedSlots.map((entry) => entry.module);
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
      ? (selectedSlots[slowestModuleIndex]?.slot.slotId ?? "runtime")
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

function demandFor(
  state: Pick<SimulationState, "workloadDemand">,
  workloadId: string,
): WorkloadDemandState {
  return (
    state.workloadDemand.find((item) => item.workloadId === workloadId) ?? {
      workloadId,
      level: 1,
      previousQuote: getWorkload(workloadId).rewardMoney,
      successfulCompletions: 0,
    }
  );
}

export function getWorkloadQuote(
  state: Pick<SimulationState, "workloadDemand">,
  workloadId: string,
  pendingReservations = 0,
): WorkloadQuote {
  const workload = getWorkload(workloadId);
  const demand = demandFor(state, workloadId);
  const reservationPressure =
    Math.max(0, Math.trunc(pendingReservations)) *
    workload.saturationPerSuccess *
    0.45;
  const effectiveLevel = clamp(demand.level - reservationPressure, 0, 1);
  const grossQuote = round(
    workload.minimumQuote +
      (workload.rewardMoney - workload.minimumQuote) * effectiveLevel,
    3,
  );
  const difference = grossQuote - demand.previousQuote;
  const trend =
    difference > 0.004 ? "rising" : difference < -0.004 ? "falling" : "steady";
  const reason =
    pendingReservations > 0
      ? `${pendingReservations} accepted ${pendingReservations === 1 ? "task reserves" : "tasks reserve"} nearby demand; every task keeps its own quote.`
      : trend === "falling"
        ? "Recent successful completions saturated this workload."
        : trend === "rising"
          ? "Time without a completion is restoring demand."
          : demand.successfulCompletions === 0
            ? "Fresh demand; no successful completion has saturated it yet."
            : "Demand is stable between saturation and time recovery.";
  return {
    workloadId,
    grossQuote,
    demandPercent: Math.round(effectiveLevel * 100),
    trend,
    reason,
  };
}

export function workloadUnlockProgress(
  state: Pick<
    SimulationState,
    | "jobs"
    | "resources"
    | "ownedHardwareIds"
    | "ownedExpansionIds"
    | "unlockedWorkloadIds"
  >,
  workloadId: string,
): { unlocked: boolean; requirements: readonly string[] } {
  const workload = getWorkload(workloadId);
  const requirement = workload.unlock;
  const requirements: string[] = [];
  if (requirement.completedJobs > 0)
    requirements.push(
      `${Math.min(state.jobs.completed, requirement.completedJobs)}/${requirement.completedJobs} successful jobs`,
    );
  if (requirement.reputation > 0)
    requirements.push(
      `${Math.min(state.resources.reputation, requirement.reputation).toFixed(1)}/${requirement.reputation.toFixed(1)} reputation`,
    );
  if (requirement.hardwareId) {
    const rig = getHardware(requirement.hardwareId);
    requirements.push(
      `${state.ownedHardwareIds.includes(rig.id) ? "Owned" : "Need"} ${rig.name}`,
    );
  }
  if (requirement.expansionId) {
    const expansion = findPipelineExpansion(requirement.expansionId);
    if (expansion)
      requirements.push(
        `${state.ownedExpansionIds.includes(expansion.id) ? "Owned" : "Need"} ${expansion.name}`,
      );
  }
  const met =
    state.jobs.completed >= requirement.completedJobs &&
    state.resources.reputation >= requirement.reputation &&
    (!requirement.hardwareId ||
      state.ownedHardwareIds.includes(requirement.hardwareId)) &&
    (!requirement.expansionId ||
      state.ownedExpansionIds.includes(requirement.expansionId));
  return {
    unlocked: met || state.unlockedWorkloadIds.includes(workloadId),
    requirements,
  };
}

function refreshWorkloadUnlocks(state: SimulationState): SimulationState {
  let next = state;
  for (const workload of workloads) {
    if (next.unlockedWorkloadIds.includes(workload.id)) continue;
    if (!workloadUnlockProgress(next, workload.id).unlocked) continue;
    next = appendEvent(
      {
        ...next,
        unlockedWorkloadIds: [...next.unlockedWorkloadIds, workload.id],
      },
      {
        kind: "success",
        message: `${workload.name} unlocked. Its demand, quote, and operating tradeoffs are now available.`,
      },
    );
  }
  return next;
}

export function createInitialState(seed = 20260715): SimulationState {
  const normalizedSeed = normalizeSeed(seed);
  const base = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    migration: {
      sourceSchemaVersion: SCHEMA_VERSION,
      steps: [],
    },
    integrity: EMPTY_INTEGRITY,
    seed: normalizedSeed,
    rngState: normalizedSeed,
    tick: 0,
    hardwareId: STARTER_HARDWARE_ID,
    ownedHardwareIds: [STARTER_HARDWARE_ID],
    ownedModuleIds: starterModuleIds,
    ownedExpansionIds: [],
    activeExpansionId: null,
    unlockedWorkloadIds: workloads
      .filter(
        (workload) =>
          workload.unlock.completedJobs === 0 &&
          workload.unlock.reputation === 0 &&
          !workload.unlock.hardwareId &&
          !workload.unlock.expansionId,
      )
      .map((workload) => workload.id),
    workloadDemand: workloads.map((workload) => ({
      workloadId: workload.id,
      level: 1,
      previousQuote: workload.rewardMoney,
      successfulCompletions: 0,
    })),
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
      activeTask: null,
      waitingTasks: [],
      nextTaskSequence: 1,
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
  return sealSimulationState(
    appendEvent(recalculate(base), {
      kind: "info",
      message:
        "Pipeline initialized. Queue a workload, observe, then reconfigure.",
    }),
  );
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
    if (!sourceState || sourceState.moduleId !== moduleId) return null;
    const sourceSlot = findSlot(fromSlotId);
    const destinationModule = findModule(destinationState.moduleId);
    if (!sourceSlot) return null;
    if (
      destinationModule &&
      !destinationModule.slotTypes.includes(sourceSlot.type)
    )
      return null;
    return state.slots.map((item) => {
      if (item.slotId === slotId) return { ...item, moduleId };
      if (item.slotId === fromSlotId)
        return { ...item, moduleId: destinationState.moduleId };
      return item;
    });
  }

  const equippedSource = state.slots.find(
    (item) => item.moduleId === moduleId && item.slotId !== slotId,
  );
  if (equippedSource) {
    const sourceSlot = findSlot(equippedSource.slotId);
    const destinationModule = findModule(destinationState.moduleId);
    if (
      !sourceSlot ||
      (destinationModule &&
        !destinationModule.slotTypes.includes(sourceSlot.type))
    )
      return null;
    return state.slots.map((item) => {
      if (item.slotId === slotId) return { ...item, moduleId };
      if (item.slotId === equippedSource.slotId)
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
      if (!workloadUnlockProgress(state, workload.id).unlocked)
        return appendEvent(state, {
          kind: "warning",
          message: `${workload.name} is locked. Complete its listed progression requirements first.`,
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
      if (getSimulationAgeHours(state) < (item.availableAfterHour ?? 0))
        return withUpgradeNotice(state, {
          kind: "warning",
          message: `${item.name} becomes orderable at simulated hour ${item.availableAfterHour}. Current age: ${getSimulationAgeHours(state).toFixed(1)}h. No money was deducted.`,
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
    case "BUY_EXPANSION": {
      const item = findPipelineExpansion(command.expansionId);
      if (!item)
        return withUpgradeNotice(state, {
          kind: "warning",
          message: "Pipeline expansion purchase rejected: unknown item.",
        });
      if (state.ownedExpansionIds.includes(item.id))
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
          ownedExpansionIds: [...state.ownedExpansionIds, item.id],
          resources: {
            ...state.resources,
            money: round(state.resources.money - item.purchaseCost, 3),
          },
        },
        {
          kind: "success",
          message: `${item.name} purchased for $${item.purchaseCost.toFixed(2)} and is now owned. Activate it explicitly; its three new positions start empty and no module was bought or filled automatically.`,
        },
      );
    }
    case "SET_EXPANSION_ACTIVE": {
      const item = pipelineExpansions[0];
      if (!item) return state;
      if (command.active) {
        if (!state.ownedExpansionIds.includes(item.id))
          return withUpgradeNotice(state, {
            kind: "warning",
            message: `${item.name} is not owned. Buy it before activating it.`,
          });
        if (state.activeExpansionId === item.id) return state;
        const sink = state.slots.find((slot) => slot.slotId === "sink");
        const beforeSink = state.slots.filter((slot) => slot.slotId !== "sink");
        const next = recalculate({
          ...state,
          activeExpansionId: item.id,
          slots: [
            ...beforeSink,
            { slotId: "process-4", moduleId: null },
            { slotId: "process-5", moduleId: null },
            { slotId: "process-6", moduleId: null },
            ...(sink ? [sink] : []),
          ],
          baselineMetrics: state.metrics,
          baselineLabel: "Before pipeline expansion",
        });
        return withUpgradeNotice(next, {
          kind: "success",
          message: `${item.name} activated: six usable process positions in one ordered pipeline. Three new positions are empty/bypassed.`,
        });
      }
      if (state.activeExpansionId === null) return state;
      const occupiedExtra = state.slots.some(
        (slot) => slot.slotId.startsWith("process-") && slot.moduleId !== null,
      );
      if (occupiedExtra)
        return withUpgradeNotice(state, {
          kind: "warning",
          message:
            "Expansion remains active. Remove modules from Process 4–6 before returning to starter capacity.",
        });
      const next = recalculate({
        ...state,
        activeExpansionId: null,
        slots: starterSlots.map((slot) => {
          const current = state.slots.find((item) => item.slotId === slot.id);
          return current ?? { slotId: slot.id, moduleId: null };
        }),
      });
      return withUpgradeNotice(next, {
        kind: "info",
        message: "Starter three-position process capacity restored.",
      });
    }
    case "REMOVE_MODULE": {
      const slot = findSlot(command.slotId);
      const current = state.slots.find(
        (item) => item.slotId === command.slotId,
      );
      if (!slot || slot.type !== "process" || !current?.moduleId) return state;
      const item = getModule(current.moduleId);
      const next = recalculate({
        ...state,
        slots: state.slots.map((entry) =>
          entry.slotId === current.slotId
            ? { ...entry, moduleId: null }
            : entry,
        ),
        baselineMetrics: state.metrics,
        baselineLabel: "Before module bypass",
        failedModuleId: null,
      });
      return withUpgradeNotice(next, {
        kind: "info",
        message: `${item.name} removed from ${slot.name}; the empty position is bypassed and the owned module remains in inventory.`,
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
      const requested = clamp(Math.trunc(command.count), 1, 50);
      const count = Math.min(requested, MAX_QUEUED_TASKS - state.jobs.queued);
      if (count <= 0) return state;
      const pendingSameWorkload = [
        ...(state.jobs.activeTask ? [state.jobs.activeTask] : []),
        ...state.jobs.waitingTasks,
      ].filter((task) => task.workloadId === state.workloadId).length;
      const tasks: QueuedTask[] = Array.from({ length: count }, (_, index) => {
        const sequence = state.jobs.nextTaskSequence + index;
        return {
          id: `task-${state.tick}-${sequence}`,
          workloadId: state.workloadId,
          lockedGrossQuote: getWorkloadQuote(
            state,
            state.workloadId,
            pendingSameWorkload + index,
          ).grossQuote,
          acceptedAtTick: state.tick,
          progress: 0,
        };
      });
      return appendEvent(
        {
          ...state,
          jobs: {
            ...state.jobs,
            queued: state.jobs.queued + count,
            waitingTasks: [...state.jobs.waitingTasks, ...tasks],
            nextTaskSequence: state.jobs.nextTaskSequence + count,
          },
        },
        {
          kind: "info",
          message: `${count} ${getWorkload(state.workloadId).name.toLowerCase()} job${count === 1 ? "" : "s"} queued.`,
        },
      );
    }
    case "CLEAR_WAITING_TASKS": {
      const count = state.jobs.waitingTasks.length;
      if (count === 0) return state;
      return appendEvent(
        {
          ...state,
          jobs: {
            ...state.jobs,
            queued: state.jobs.activeTask ? 1 : 0,
            waitingTasks: [],
          },
        },
        {
          kind: "info",
          message: `${count} waiting task${count === 1 ? "" : "s"} cleared. Active work, accepted demand, money, and payouts were unchanged; no refund or settlement occurred.`,
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
  const applied = applyValidCommand(state, command);
  if (applied === state) return state;
  const next = sealSimulationState(refreshWorkloadUnlocks(applied));
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

function recoverWorkloadDemand(
  state: SimulationState,
  elapsedSeconds: number,
): SimulationState {
  const elapsedHours = (elapsedSeconds * SIMULATION_TIME_SCALE) / 3600;
  if (elapsedHours <= 0) return state;
  return {
    ...state,
    workloadDemand: state.workloadDemand.map((demand) => {
      if (demand.level >= 1) return demand;
      const workload = getWorkload(demand.workloadId);
      const previousQuote = getWorkloadQuote(
        state,
        demand.workloadId,
      ).grossQuote;
      return {
        ...demand,
        level: round(
          Math.min(1, demand.level + workload.recoveryPerHour * elapsedHours),
          6,
        ),
        previousQuote,
      };
    }),
  };
}

function startNextTask(state: SimulationState): SimulationState {
  if (state.jobs.activeTask || state.jobs.waitingTasks.length === 0)
    return state;
  const [first, ...rest] = state.jobs.waitingTasks;
  if (!first) return state;
  return {
    ...state,
    jobs: {
      ...state.jobs,
      activeTask: first,
      waitingTasks: rest,
      processingCarry: first.progress,
    },
  };
}

function advanceTickQuantum(
  state: SimulationState,
  elapsed: number,
): SimulationState {
  if (elapsed <= 0) return state;
  let next: SimulationState = {
    ...recoverWorkloadDemand(state, elapsed),
    tick: state.tick + Math.round(elapsed * 1000),
    resources: {
      ...state.resources,
      timeHours: Math.max(
        0,
        state.resources.timeHours - (elapsed * SIMULATION_TIME_SCALE) / 3600,
      ),
      electricityKwh:
        state.resources.electricityKwh +
        (getHardware(state.hardwareId).watts *
          (state.computeAllocation / 100) *
          elapsed) /
          3_600_000,
    },
  };
  if (next.jobs.paused) return recalculate(next);
  next = startNextTask(next);
  if (!next.jobs.activeTask) {
    return recalculate({
      ...next,
      jobs: { ...next.jobs, processingCarry: 0 },
    });
  }

  const task = next.jobs.activeTask;
  const workload = getWorkload(task.workloadId);
  const taskMetrics = calculateMetrics({
    ...next,
    workloadId: task.workloadId,
  });
  const progress =
    task.progress + (taskMetrics.throughputPerMinute * elapsed) / 60;
  if (progress < 1) {
    return recalculate({
      ...next,
      jobs: {
        ...next.jobs,
        activeTask: { ...task, progress: round(progress, 8) },
        processingCarry: round(progress, 8),
      },
    });
  }

  const moneyBeforeSettlement = next.resources.money;
  const sample = nextRandom(next.rngState);
  const memoryFailure = taskMetrics.memoryPressure > 1;
  const failed = memoryFailure || sample.value > taskMetrics.reliability;
  const grossPayout = failed ? 0 : task.lockedGrossQuote;
  const modelledCost = taskMetrics.operatingCost;
  const operatingCost = round(
    Math.min(modelledCost, moneyBeforeSettlement + grossPayout),
    3,
  );
  const moneyAfter = round(
    Math.max(0, moneyBeforeSettlement + grossPayout - operatingCost),
    3,
  );
  next = {
    ...next,
    rngState: sample.state,
    resources: {
      ...next.resources,
      money: moneyAfter,
      reputation: Math.max(
        0,
        next.resources.reputation +
          (failed ? -0.03 : workload.rewardReputation),
      ),
    },
    jobs: {
      ...next.jobs,
      queued: Math.max(0, next.jobs.queued - 1),
      completed: next.jobs.completed + (failed ? 0 : 1),
      failed: next.jobs.failed + (failed ? 1 : 0),
      processingCarry: 0,
      activeTask: null,
      grossEarned: round(next.jobs.grossEarned + grossPayout, 3),
      operatingCostsPaid: round(
        next.jobs.operatingCostsPaid + operatingCost,
        3,
      ),
    },
    failedModuleId: failed
      ? firstFailureModule(
          next,
          sample.value * (1 - taskMetrics.reliability + 0.001),
        )
      : null,
    lastSettlement: {
      tick: next.tick,
      workloadId: task.workloadId,
      completed: failed ? 0 : 1,
      failed: failed ? 1 : 0,
      grossPayout,
      operatingCost,
      netChange: round(moneyAfter - moneyBeforeSettlement, 3),
      taskId: task.id,
      lockedGrossQuote: task.lockedGrossQuote,
    },
  };

  if (!failed) {
    const demand = demandFor(next, task.workloadId);
    const previousQuote = getWorkloadQuote(next, task.workloadId).grossQuote;
    next = {
      ...next,
      workloadDemand: next.workloadDemand.map((item) =>
        item.workloadId === task.workloadId
          ? {
              ...item,
              level: round(
                Math.max(0, demand.level - workload.saturationPerSuccess),
                6,
              ),
              previousQuote,
              successfulCompletions: item.successfulCompletions + 1,
            }
          : item,
      ),
    };
    next = appendEvent(next, {
      kind: "success",
      message: `${workload.name} task ${task.id} completed; $${task.lockedGrossQuote.toFixed(2)} gross payout earned before operating cost (locked quote) − $${operatingCost.toFixed(2)} actual cost = ${moneyAfter - moneyBeforeSettlement >= 0 ? "+" : "−"}$${Math.abs(moneyAfter - moneyBeforeSettlement).toFixed(2)} net. Future ${workload.name} demand is lower and recovers with simulated time.`,
    });
  } else {
    next = appendEvent(next, {
      kind: "failure",
      message: memoryFailure
        ? `${workload.name} task ${task.id} failed before delivery: memory capacity exceeded. Locked quote paid $0 gross.`
        : `${workload.name} task ${task.id} produced unstable output and was rejected. Locked quote paid $0 gross.`,
      directCause: memoryFailure
        ? "Required memory exceeded available memory."
        : "A processor emitted malformed output.",
      contributingCondition:
        taskMetrics.observability < 0.6
          ? "Low observability delayed isolation."
          : undefined,
    });
  }
  return recalculate(refreshWorkloadUnlocks(next));
}

export function tick(state: SimulationState, seconds: number): SimulationState {
  if (!isFiniteNumber(seconds)) return state;
  const elapsed = clamp(seconds, 0, 60);
  if (elapsed === 0) return state;
  if (state.tick + Math.round(elapsed * 1000) > Number.MAX_SAFE_INTEGER)
    return state;
  let next = state;
  let remaining = elapsed;
  while (remaining > 0) {
    const quantum = Math.min(FIXED_TICK_SECONDS, remaining);
    next = advanceTickQuantum(next, quantum);
    remaining = round(remaining - quantum, 6);
  }
  next = sealSimulationState(next);
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

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.length <= maxLength;

const isEventKind = (value: unknown): value is LedgerEvent["kind"] =>
  EVENT_KINDS.includes(value as LedgerEvent["kind"]);

function isMigrationMetadataValid(value: unknown): value is MigrationMetadata {
  if (typeof value !== "object" || value === null) return false;
  const migration = value as MigrationMetadata;
  return (
    Number.isSafeInteger(migration.sourceSchemaVersion) &&
    migration.sourceSchemaVersion >= 1 &&
    migration.sourceSchemaVersion <= SCHEMA_VERSION &&
    Array.isArray(migration.steps) &&
    migration.steps.length <= 8 &&
    migration.steps.every((step) => isText(step, 64) && step.length > 0) &&
    new Set(migration.steps).size === migration.steps.length
  );
}

function isIntegrityShapeValid(value: unknown): value is SaveIntegrity {
  if (typeof value !== "object" || value === null) return false;
  const integrity = value as SaveIntegrity;
  return (
    integrity.algorithm === SAVE_INTEGRITY_ALGORITHM &&
    typeof integrity.digest === "string" &&
    /^[0-9a-f]{8}$/.test(integrity.digest)
  );
}

function areMetricsValid(value: unknown): value is PipelineMetrics {
  if (typeof value !== "object" || value === null) return false;
  const metrics = value as PipelineMetrics;
  return (
    metricNumbers(metrics).every(
      (number) => Number.isFinite(number) && number >= 0,
    ) &&
    metrics.predictedQuality <= 99 &&
    metrics.observedQuality <= 99 &&
    metrics.reliability <= 1 &&
    metrics.observability <= 1 &&
    metrics.evaluationCoverage <= 1 &&
    BOTTLENECKS.includes(
      metrics.dominantBottleneck as (typeof BOTTLENECKS)[number],
    ) &&
    findSlot(metrics.bottleneckSlotId) !== undefined &&
    Array.isArray(metrics.orderWarnings) &&
    metrics.orderWarnings.length <= slots.length &&
    metrics.orderWarnings.every((warning) => isText(warning, 200))
  );
}

function isQueuedTaskValid(
  value: unknown,
  tick: number,
  waiting: boolean,
): value is QueuedTask {
  if (typeof value !== "object" || value === null) return false;
  const task = value as QueuedTask;
  return (
    isText(task.id, 128) &&
    task.id.length > 0 &&
    findWorkload(task.workloadId) !== undefined &&
    Number.isFinite(task.lockedGrossQuote) &&
    task.lockedGrossQuote >= 0 &&
    task.lockedGrossQuote <= getWorkload(task.workloadId).rewardMoney &&
    Number.isSafeInteger(task.acceptedAtTick) &&
    task.acceptedAtTick >= 0 &&
    task.acceptedAtTick <= tick &&
    Number.isFinite(task.progress) &&
    task.progress >= 0 &&
    task.progress < 1 &&
    (!waiting || task.progress === 0)
  );
}

function isStateStructurallyValid(value: unknown): value is SimulationState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as SimulationState;
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
    const expansionIds = pipelineExpansions.map((item) => item.id);
    const workloadIds = workloads.map((item) => item.id);
    const expectedSlots = state.activeExpansionId ? slots : starterSlots;
    const taskIds = [
      ...(state.jobs.activeTask ? [state.jobs.activeTask.id] : []),
      ...state.jobs.waitingTasks.map((task) => task.id),
    ];
    return (
      state.schemaVersion === SCHEMA_VERSION &&
      state.contentVersion === CONTENT_VERSION &&
      isMigrationMetadataValid(state.migration) &&
      isIntegrityShapeValid(state.integrity) &&
      Number.isInteger(state.seed) &&
      state.seed > 0 &&
      state.seed <= 0xffff_ffff &&
      Number.isInteger(state.rngState) &&
      state.rngState > 0 &&
      state.rngState <= 0xffff_ffff &&
      Array.isArray(state.ownedHardwareIds) &&
      state.ownedHardwareIds.length > 0 &&
      state.ownedHardwareIds.every(
        (id) => typeof id === "string" && hardwareIds.includes(id),
      ) &&
      new Set(state.ownedHardwareIds).size === state.ownedHardwareIds.length &&
      typeof state.hardwareId === "string" &&
      state.ownedHardwareIds.includes(state.hardwareId) &&
      Array.isArray(state.ownedModuleIds) &&
      starterModuleIds.every((id) => state.ownedModuleIds.includes(id)) &&
      state.ownedModuleIds.every(
        (id) => typeof id === "string" && moduleIds.includes(id),
      ) &&
      new Set(state.ownedModuleIds).size === state.ownedModuleIds.length &&
      Array.isArray(state.ownedExpansionIds) &&
      state.ownedExpansionIds.every(
        (id) => typeof id === "string" && expansionIds.includes(id),
      ) &&
      new Set(state.ownedExpansionIds).size ===
        state.ownedExpansionIds.length &&
      (state.activeExpansionId === null ||
        (typeof state.activeExpansionId === "string" &&
          state.ownedExpansionIds.includes(state.activeExpansionId))) &&
      Array.isArray(state.unlockedWorkloadIds) &&
      state.unlockedWorkloadIds.length >= 4 &&
      state.unlockedWorkloadIds.every(
        (id) => typeof id === "string" && workloadIds.includes(id),
      ) &&
      new Set(state.unlockedWorkloadIds).size ===
        state.unlockedWorkloadIds.length &&
      workloads
        .filter(
          (workload) =>
            workload.unlock.completedJobs === 0 &&
            workload.unlock.reputation === 0 &&
            !workload.unlock.hardwareId &&
            !workload.unlock.expansionId,
        )
        .every((workload) => state.unlockedWorkloadIds.includes(workload.id)) &&
      Array.isArray(state.workloadDemand) &&
      state.workloadDemand.length === workloads.length &&
      workloads.every((workload) =>
        state.workloadDemand.some(
          (demand) => demand.workloadId === workload.id,
        ),
      ) &&
      state.workloadDemand.every(
        (demand) =>
          workloadIds.includes(demand.workloadId) &&
          Number.isFinite(demand.level) &&
          demand.level >= 0 &&
          demand.level <= 1 &&
          Number.isFinite(demand.previousQuote) &&
          demand.previousQuote >= 0 &&
          demand.previousQuote <= getWorkload(demand.workloadId).rewardMoney &&
          Number.isSafeInteger(demand.successfulCompletions) &&
          demand.successfulCompletions >= 0,
      ) &&
      typeof state.workloadId === "string" &&
      state.unlockedWorkloadIds.includes(state.workloadId) &&
      typeof state.branchEnabled === "boolean" &&
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
      typeof state.jobs.paused === "boolean" &&
      Array.isArray(state.jobs.waitingTasks) &&
      state.jobs.waitingTasks.every((task) =>
        isQueuedTaskValid(task, state.tick, true),
      ) &&
      (state.jobs.activeTask === null ||
        isQueuedTaskValid(state.jobs.activeTask, state.tick, false)) &&
      state.jobs.queued ===
        state.jobs.waitingTasks.length + (state.jobs.activeTask ? 1 : 0) &&
      state.jobs.processingCarry === (state.jobs.activeTask?.progress ?? 0) &&
      Number.isSafeInteger(state.jobs.nextTaskSequence) &&
      state.jobs.nextTaskSequence >= 1 &&
      new Set(taskIds).size === taskIds.length &&
      (state.baselineLabel === null || isText(state.baselineLabel, 64)) &&
      (state.failedModuleId === null ||
        (typeof state.failedModuleId === "string" &&
          findModule(state.failedModuleId) !== undefined)) &&
      isText(state.lastWarning, 800) &&
      (state.lastUpgradeNotice === null ||
        (isText(state.lastUpgradeNotice.message, 800) &&
          isEventKind(state.lastUpgradeNotice.kind))) &&
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
      (state.lastSettlement === null ||
        (isText(state.lastSettlement.taskId, 128) &&
          state.lastSettlement.taskId.length > 0 &&
          Number.isFinite(state.lastSettlement.lockedGrossQuote) &&
          state.lastSettlement.lockedGrossQuote >= 0 &&
          state.lastSettlement.lockedGrossQuote <=
            getWorkload(state.lastSettlement.workloadId).rewardMoney)) &&
      areMetricsValid(state.metrics) &&
      (state.baselineMetrics === null ||
        areMetricsValid(state.baselineMetrics)) &&
      Array.isArray(state.slots) &&
      state.slots.length === expectedSlots.length &&
      expectedSlots.every((slot) =>
        state.slots.some((current) => current.slotId === slot.id),
      ) &&
      state.slots.every((slotState) => {
        if (typeof slotState.slotId !== "string") return false;
        const slot = findSlot(slotState.slotId);
        if (!slot || !expectedSlots.some((item) => item.id === slot.id))
          return false;
        if (slotState.moduleId === null) return slot.type === "process";
        if (typeof slotState.moduleId !== "string") return false;
        const module = findModule(slotState.moduleId);
        return (
          module !== undefined &&
          state.ownedModuleIds.includes(module.id) &&
          module.slotTypes.includes(slot.type)
        );
      }) &&
      new Set(
        state.slots.flatMap((slot) =>
          slot.moduleId === null ? [] : [slot.moduleId],
        ),
      ).size === state.slots.filter((slot) => slot.moduleId !== null).length &&
      state.ledger.length <= MAX_LEDGER_EVENTS &&
      state.ledger.every(
        (event) =>
          isText(event.id, 128) &&
          event.id.length > 0 &&
          Number.isSafeInteger(event.tick) &&
          event.tick >= 0 &&
          event.tick <= state.tick &&
          isEventKind(event.kind) &&
          isText(event.message, 800) &&
          (event.directCause === undefined || isText(event.directCause, 800)) &&
          (event.contributingCondition === undefined ||
            isText(event.contributingCondition, 800)),
      ) &&
      state.eventSequence >= state.ledger.length &&
      new Set(eventIds).size === eventIds.length
    );
  } catch {
    return false;
  }
}

export function isStateValid(state: SimulationState): boolean {
  return isStateStructurallyValid(state) && hasValidStateIntegrity(state);
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function safeLegacySlots(value: unknown): readonly PipelineSlotState[] | null {
  if (!Array.isArray(value) || value.length !== starterSlots.length)
    return null;
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
    !starterSlots.every((slot) =>
      candidate.some((entry) => entry?.slotId === slot.id),
    )
  )
    return null;
  return candidate as readonly PipelineSlotState[];
}

function withMigrationStep(
  migration: MigrationMetadata,
  step: string,
): MigrationMetadata {
  return {
    ...migration,
    steps: [
      ...migration.steps.filter((current) => current !== step),
      step,
    ].slice(-8),
  };
}

/** Restores current saves or migrates schema-v3/v4 Pipeline Toy state. */
export function restoreSimulationState(
  value: unknown,
  fallbackSeed = 20260715,
): SimulationState {
  const fallback = createInitialState(fallbackSeed);
  if (typeof value !== "object" || value === null) return fallback;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion === SCHEMA_VERSION) {
    let migration = isMigrationMetadataValid(record.migration)
      ? record.migration
      : {
          sourceSchemaVersion: SCHEMA_VERSION,
          steps: ["schema-v4-metadata-added"],
        };
    const candidate = {
      ...record,
      migration,
      integrity: isIntegrityShapeValid(record.integrity)
        ? record.integrity
        : EMPTY_INTEGRITY,
    } as unknown as SimulationState;
    if (!isStateStructurallyValid(candidate)) return fallback;
    if (!isIntegrityShapeValid(record.integrity))
      migration = withMigrationStep(migration, "integrity-added");
    else if (!hasValidStateIntegrity(candidate))
      migration = withMigrationStep(migration, "integrity-resealed");
    const restored = sealSimulationState(
      recalculate({ ...candidate, migration }),
    );
    return isStateValid(restored) ? restored : fallback;
  }
  if (record.schemaVersion !== 3 && record.schemaVersion !== 4) return fallback;

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
  const legacySchema = record.schemaVersion;
  const safeHardwareIds =
    legacySchema === 4 && Array.isArray(record.ownedHardwareIds)
      ? record.ownedHardwareIds.flatMap((id) =>
          findHardware(id) ? [String(id)] : [],
        )
      : [];
  const safeModuleIds =
    legacySchema === 4 && Array.isArray(record.ownedModuleIds)
      ? record.ownedModuleIds.flatMap((id) =>
          findModule(id) ? [String(id)] : [],
        )
      : [];
  const queuedCount = clamp(
    Math.trunc(finiteOr(legacyJobs.queued, 0)),
    0,
    MAX_QUEUED_TASKS,
  );
  const legacyCarry =
    queuedCount > 0
      ? clamp(finiteOr(legacyJobs.processingCarry, 0), 0, 0.999)
      : 0;
  const migratedTasks: QueuedTask[] = Array.from(
    { length: queuedCount },
    (_, index) => ({
      id: `migration-task-${index + 1}`,
      workloadId: legacyWorkload.id,
      lockedGrossQuote: legacyWorkload.rewardMoney,
      acceptedAtTick: Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.trunc(finiteOr(record.tick, 0)),
      ),
      progress: index === 0 ? legacyCarry : 0,
    }),
  );
  const migratedActive = legacyCarry > 0 ? (migratedTasks[0] ?? null) : null;
  const migratedWaiting = migratedActive
    ? migratedTasks.slice(1)
    : migratedTasks;
  const migratedBase: SimulationState = {
    ...createInitialState(seed),
    migration: {
      sourceSchemaVersion: legacySchema,
      steps: [`schema-${legacySchema}-to-5-task-market-expansion`],
    },
    rngState: normalizeSeed(finiteOr(record.rngState, seed)),
    tick: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.trunc(finiteOr(record.tick, 0)),
    ),
    hardwareId: legacyHardware.id,
    ownedHardwareIds: [
      ...new Set([STARTER_HARDWARE_ID, legacyHardware.id, ...safeHardwareIds]),
    ],
    ownedModuleIds: [
      ...new Set([
        ...starterModuleIds,
        ...legacySlots.map((slot) => slot.moduleId),
        ...safeModuleIds,
      ]),
    ].filter((id): id is string => id !== null),
    ownedExpansionIds: [],
    activeExpansionId: null,
    unlockedWorkloadIds: workloads
      .filter(
        (workload) =>
          workload.unlock.completedJobs === 0 &&
          workload.unlock.reputation === 0 &&
          !workload.unlock.hardwareId &&
          !workload.unlock.expansionId,
      )
      .map((workload) => workload.id),
    workloadDemand: workloads.map((workload) => ({
      workloadId: workload.id,
      level: 1,
      previousQuote: workload.rewardMoney,
      successfulCompletions: 0,
    })),
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
      queued: queuedCount,
      completed: Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.trunc(finiteOr(legacyJobs.completed, 0)),
      ),
      failed: Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.trunc(finiteOr(legacyJobs.failed, 0)),
      ),
      processingCarry: migratedActive?.progress ?? 0,
      paused: typeof legacyJobs.paused === "boolean" && legacyJobs.paused,
      grossEarned: finiteOr(legacyJobs.grossEarned, 0),
      operatingCostsPaid: finiteOr(legacyJobs.operatingCostsPaid, 0),
      activeTask: migratedActive,
      waitingTasks: migratedWaiting,
      nextTaskSequence: queuedCount + 1,
    },
    lastSettlement: null,
    baselineMetrics: null,
    baselineLabel: null,
    failedModuleId: null,
    lastUpgradeNotice: {
      kind: "info",
      message:
        "Existing Pipeline Toy state migrated to the ownership economy, per-task quotes, staged demand, and expandable topology; queued work retained its current workload identity.",
    },
  };
  const migrated = sealSimulationState(recalculate(migratedBase));
  return isStateValid(migrated) ? migrated : fallback;
}
