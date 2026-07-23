import {
  bedroomCareerRoutes,
  findHardware,
  findLocalModelTier,
  findModule,
  findPipelineExpansion,
  findSlot,
  findWorkload,
  getHardware,
  getLocalModelTier,
  getModule,
  getWorkload,
  hardware,
  localModelTiers,
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
  type CausalEvidence,
  type CausalEvidenceSnapshot,
  type DiagnosticUnlockId,
  type EvaluationState,
  type FirstSessionProgress,
  type FirstSessionStep,
  type LedgerEvent,
  type CareerRoute,
  type CareerState,
  type MetaProgression,
  type MigrationMetadata,
  type PipelineMetrics,
  type PipelineSlotState,
  type PrivateAssessment,
  type QueuedTask,
  type QuantizationProfile,
  type RunEnding,
  type RunEndingId,
  type SaveIntegrity,
  type SimulationCommand,
  type SimulationState,
  type UpgradeNotice,
  type WorkloadDemandState,
  type WorkloadQuote,
} from "./types";
import { currencyDisplayPrecision, formatCurrencyMagnitude } from "./currency";

const MAX_LEDGER_EVENTS = 80;
const MAX_QUEUED_TASKS = 99;
const FIXED_TICK_SECONDS = 0.5;
const EVENING_HOURS = 4;
const ELECTRICITY_RATE = 0.24;
const CAREER_HOUR_INCREMENT = 0.25;
const CAREER_ROUTES: readonly CareerRoute[] = [
  "freelance",
  "competition",
  "product",
  "maintenance",
];
const QUANTIZATION_PROFILES: readonly QuantizationProfile[] = ["q4", "q8"];
const MAX_OFFLINE_HOURS = 4;
const PRIVATE_EVALUATION_COST = 0.75;
const MIN_PRIVATE_EVALUATION_COVERAGE_GAIN = 0.25;
const MAX_PRIVATE_EVALUATION_COVERAGE_GAIN = 0.5;
const MAX_EVALUATION_SPEND = 10_000;
const MAX_EVALUATION_COUNTER = 10_000;
const MAX_META_REPLAYS = 1_000_000;
const PRIVATE_ASSESSMENTS: readonly PrivateAssessment[] = [
  "not-run",
  "inconclusive",
  "credible",
  "at-risk",
  "failed",
];
const DIAGNOSTIC_UNLOCK_IDS: readonly DiagnosticUnlockId[] = [
  "leakage-warning",
  "shift-monitor",
  "bottleneck-map",
  "decision-history",
  "confidence-intervals",
];
const RUN_ENDING_IDS: readonly RunEndingId[] = [
  "public-leaderboard-hero",
  "product-reliability-collapse",
  "hardware-debt-spiral",
  "tutorial-loop",
  "honest-independent-builder",
];
export const SIMULATION_TIME_SCALE = 70;

export function getSimulationAgeHours(
  state: Pick<SimulationState, "tick">,
): number {
  return (state.tick * SIMULATION_TIME_SCALE) / 3_600_000;
}
const ROLE_ORDER = ["preparation", "model", "evaluation"] as const;
const EVENT_KINDS = ["info", "success", "warning", "failure"] as const;
const FIRST_SESSION_STEPS: readonly FirstSessionStep[] = [
  "queue-starter",
  "observe-settlement",
  "buy-and-install",
  "complete",
];
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

function createInitialFirstSessionProgress(): FirstSessionProgress {
  return {
    step: "queue-starter",
    starterTaskId: null,
    observedSettlementTaskId: null,
    purchasedModuleId: null,
  };
}

function isFirstSessionProgressValid(
  value: unknown,
): value is FirstSessionProgress {
  if (typeof value !== "object" || value === null) return false;
  const progress = value as FirstSessionProgress;
  const validId = (id: unknown) => id === null || isText(id, 128);
  if (
    !FIRST_SESSION_STEPS.includes(progress.step) ||
    !validId(progress.starterTaskId) ||
    !validId(progress.observedSettlementTaskId) ||
    !validId(progress.purchasedModuleId)
  )
    return false;
  switch (progress.step) {
    case "queue-starter":
      return (
        progress.starterTaskId === null &&
        progress.observedSettlementTaskId === null &&
        progress.purchasedModuleId === null
      );
    case "observe-settlement":
      return (
        progress.starterTaskId !== null &&
        progress.observedSettlementTaskId === null &&
        progress.purchasedModuleId === null
      );
    case "buy-and-install":
      return (
        progress.starterTaskId !== null &&
        progress.observedSettlementTaskId !== null
      );
    case "complete":
      return (
        progress.starterTaskId !== null &&
        progress.observedSettlementTaskId !== null &&
        progress.purchasedModuleId !== null
      );
  }
}

/** Existing saves predate the optional guide, so leave their established run alone. */
function legacyFirstSessionProgress(): FirstSessionProgress {
  return {
    step: "complete",
    starterTaskId: "legacy-session",
    observedSettlementTaskId: "legacy-session",
    purchasedModuleId: "legacy-session",
  };
}

function isLegacyFirstSessionProgress(progress: FirstSessionProgress): boolean {
  return (
    progress.step === "complete" &&
    progress.starterTaskId === "legacy-session" &&
    progress.observedSettlementTaskId === "legacy-session" &&
    progress.purchasedModuleId === "legacy-session"
  );
}

/**
 * A guide is persisted player progress, not an authorization flag. Its IDs
 * must describe reachable simulation facts before a restored state may use
 * them to relax the first-session command boundary.
 */
function hasCoherentFirstSessionProgress(state: SimulationState): boolean {
  const progress = state.firstSession;
  if (!isFirstSessionProgressValid(progress)) return false;
  if (isLegacyFirstSessionProgress(progress)) return true;

  const activeAndWaiting = [
    ...(state.jobs.activeTask ? [state.jobs.activeTask] : []),
    ...state.jobs.waitingTasks,
  ];
  const starterTask = activeAndWaiting.find(
    (task) => task.id === progress.starterTaskId,
  );
  const hasObservedStarterSettlement =
    progress.starterTaskId !== null &&
    progress.observedSettlementTaskId === progress.starterTaskId &&
    state.jobs.completed + state.jobs.failed > 0;
  const purchasedModule = progress.purchasedModuleId
    ? findModule(progress.purchasedModuleId)
    : undefined;
  const hasMeaningfulOwnedPurchase =
    purchasedModule !== undefined &&
    purchasedModule.purchaseCost > 0 &&
    state.ownedModuleIds.includes(purchasedModule.id);

  switch (progress.step) {
    case "queue-starter":
      return activeAndWaiting.length === 0;
    case "observe-settlement":
      return (
        starterTask !== undefined &&
        starterTask.workloadId === "interactive-chat" &&
        activeAndWaiting.length === 1
      );
    case "buy-and-install":
      return (
        hasObservedStarterSettlement &&
        (progress.purchasedModuleId === null || hasMeaningfulOwnedPurchase)
      );
    case "complete":
      return hasObservedStarterSettlement && hasMeaningfulOwnedPurchase;
  }
}

/**
 * A current save with a broken integrity seal may be repaired and resealed for
 * benign persistence damage, but it must not manufacture progress past the
 * starter rail. Advanced guide stages need a concrete settlement record for
 * the initial Interactive Chat task before repair can retain that progress.
 */
function hasSafeUnsealedFirstSessionProgress(state: SimulationState): boolean {
  if (!hasCoherentFirstSessionProgress(state)) return false;
  const progress = state.firstSession;
  if (
    progress.step === "queue-starter" ||
    progress.step === "observe-settlement"
  )
    return true;
  const settlement = state.lastSettlement;
  return (
    settlement !== null &&
    progress.starterTaskId !== null &&
    progress.observedSettlementTaskId === progress.starterTaskId &&
    settlement.taskId === progress.starterTaskId &&
    settlement.workloadId === "interactive-chat" &&
    settlement.completed + settlement.failed === 1
  );
}

/**
 * Worker messages are structured-cloned runtime input, not TypeScript values.
 * Keep the discriminator boundary explicit before an exhaustive command switch.
 */
export function isRuntimeSimulationCommand(command: unknown): boolean {
  if (typeof command !== "object" || command === null) return false;
  const input = command as {
    type?: unknown;
    percent?: unknown;
    count?: unknown;
    seed?: unknown;
    label?: unknown;
    active?: unknown;
    amount?: unknown;
    hours?: unknown;
    route?: unknown;
    modelTierId?: unknown;
    profile?: unknown;
    enabled?: unknown;
    maxHours?: unknown;
    maxElectricityCost?: unknown;
    maxOperatingCost?: unknown;
    minReliability?: unknown;
    requestedHours?: unknown;
  };

  switch (input.type) {
    case "SET_COMPUTE_ALLOCATION":
    case "SET_MEMORY_RESERVE":
      return isFiniteNumber(input.percent);
    case "QUEUE_JOBS":
      return isFiniteNumber(input.count);
    case "RESET":
      return input.seed === undefined || isFiniteNumber(input.seed);
    case "CAPTURE_BASELINE":
      return typeof input.label === "string";
    case "SET_EVENING_ALLOCATION":
      return (
        CAREER_ROUTES.includes(input.route as CareerRoute) &&
        isFiniteNumber(input.hours)
      );
    case "DEPOSIT_SAVINGS":
    case "WITHDRAW_SAVINGS":
      return isFiniteNumber(input.amount);
    case "SELECT_LOCAL_MODEL_TIER":
      return typeof input.modelTierId === "string";
    case "SET_QUANTIZATION":
      return QUANTIZATION_PROFILES.includes(
        input.profile as QuantizationProfile,
      );
    case "SET_OFFLINE_POLICY":
      return (
        typeof input.enabled === "boolean" &&
        isFiniteNumber(input.maxHours) &&
        isFiniteNumber(input.maxElectricityCost) &&
        isFiniteNumber(input.maxOperatingCost) &&
        isFiniteNumber(input.minReliability)
      );
    case "APPLY_OFFLINE_POLICY":
      return isFiniteNumber(input.requestedHours);
    case "SET_EXPANSION_ACTIVE":
      return typeof input.active === "boolean";
    case "PLACE_MODULE":
    case "SET_WORKLOAD":
    case "BUY_HARDWARE":
    case "EQUIP_HARDWARE":
    case "BUY_MODULE":
    case "BUY_EXPANSION":
    case "REMOVE_MODULE":
    case "TOGGLE_BRANCH":
    case "CLEAR_WAITING_TASKS":
    case "TOGGLE_PAUSE":
    case "RUN_EVENING":
    case "SUBMIT_COMPETITION":
    case "RELEASE_PRODUCT":
    case "RUN_PUBLIC_EVALUATION":
    case "RUN_PRIVATE_EVALUATION":
    case "CONCLUDE_INDEPENDENT_RUN":
      return true;
    default:
      return false;
  }
}

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

function cloneEvaluationState(evaluation: EvaluationState): EvaluationState {
  return {
    ...evaluation,
    warnings: { ...evaluation.warnings },
  };
}

function createCausalEvidenceSnapshot(
  state: Pick<SimulationState, "career" | "eventSequence">,
): CausalEvidenceSnapshot {
  return {
    eventSequence: state.eventSequence,
    evaluation: cloneEvaluationState(state.career.evaluation),
  };
}

/** Adds the deterministic corruption check carried by every runtime snapshot. */
export function sealSimulationState(state: SimulationState): SimulationState {
  const snapshotState: SimulationState = {
    ...state,
    causalEvidenceSnapshot: createCausalEvidenceSnapshot(state),
  };
  return {
    ...snapshotState,
    integrity: {
      algorithm: SAVE_INTEGRITY_ALGORITHM,
      digest: stateIntegrityDigest(snapshotState),
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
  > &
    Partial<Pick<SimulationState, "career">>,
): PipelineMetrics {
  const selectedSlots = state.slots.flatMap((slot) =>
    slot.moduleId ? [{ slot, module: getModule(slot.moduleId) }] : [],
  );
  const selectedModules = selectedSlots.map((entry) => entry.module);
  const selectedHardware = getHardware(state.hardwareId);
  const workload = getWorkload(state.workloadId);
  const activeTier =
    findLocalModelTier(state.career?.activeModelTierId) ?? localModelTiers[0]!;
  const quantization = state.career?.quantization ?? "q4";
  const quantizationMemoryMultiplier = quantization === "q8" ? 1.28 : 1;
  const quantizationThroughputMultiplier = quantization === "q8" ? 0.86 : 1;
  const quantizationQualityBonus = quantization === "q8" ? 3 : 0;
  const quantizationReliabilityBonus = quantization === "q8" ? 0.003 : 0;
  const tunedMemory = (item: (typeof selectedModules)[number]) =>
    item.memory *
    (item.role === "model"
      ? activeTier.memoryMultiplier * quantizationMemoryMultiplier
      : 1);
  const tunedThroughput = (item: (typeof selectedModules)[number]) =>
    item.throughput *
    (item.role === "model"
      ? activeTier.throughputMultiplier * quantizationThroughputMultiplier
      : 1);
  const allocation = clamp(state.computeAllocation, 25, 100) / 100;
  const usableMemory =
    selectedHardware.memory * (1 - clamp(state.memoryReserve, 0, 30) / 100);
  const memoryUsed =
    workload.memoryDemand +
    selectedModules.reduce((total, item) => total + tunedMemory(item), 0);
  const memoryPressure = memoryUsed / Math.max(usableMemory, 0.1);
  const moduleThroughput = Math.min(
    ...selectedModules.map((item) => tunedThroughput(item)),
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
  const modelStageCount = selectedModules.filter(
    (item) => item.role === "model",
  ).length;
  const qualityPenalty =
    Math.max(0, memoryPressure - 1) * 18 + orderWarnings.length * 9;
  const predictedQuality = clamp(
    workload.baseQuality +
      moduleQuality +
      modelStageCount * (activeTier.qualityBonus + quantizationQualityBonus) +
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
  const hasModelStage = selectedModules.some((item) => item.role === "model");
  const pipelineReliability =
    moduleReliability *
      selectedHardware.reliability *
      orderFactor *
      (memoryPressure > 1 ? 1 / memoryPressure : 1) +
    activeTier.reliabilityBonus +
    quantizationReliabilityBonus;
  const reliability = hasModelStage
    ? clamp(
        pipelineReliability * (workload.deliveryReliabilityMultiplier ?? 1),
        0.01,
        0.999,
      )
    : 0;
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

type EvaluationWarningKey = keyof EvaluationState["warnings"];

const ENDING_DETAILS: Readonly<
  Record<
    RunEndingId,
    {
      title: string;
      outcome: RunEnding["outcome"];
      diagnosticUnlockId: DiagnosticUnlockId;
      nextRunResponse: string;
    }
  >
> = {
  "public-leaderboard-hero": {
    title: "Public Leaderboard Hero",
    outcome: "failure",
    diagnosticUnlockId: "leakage-warning",
    nextRunResponse:
      "Budget private evaluation before another public submission, then stop optimizing the public preview once it disagrees with private evidence.",
  },
  "product-reliability-collapse": {
    title: "Product Reliability Collapse",
    outcome: "failure",
    diagnosticUnlockId: "shift-monitor",
    nextRunResponse:
      "Hold service growth after the first shift warning; fund broader private coverage and maintenance before taking more product work.",
  },
  "hardware-debt-spiral": {
    title: "Hardware Debt Spiral",
    outcome: "failure",
    diagnosticUnlockId: "bottleneck-map",
    nextRunResponse:
      "Compare the active bottleneck before another capital commitment, retain operating reserve, and earn down unpaid costs before expanding the rig.",
  },
  "tutorial-loop": {
    title: "Tutorial Loop",
    outcome: "failure",
    diagnosticUnlockId: "decision-history",
    nextRunResponse:
      "Freeze one configuration long enough to finish a small competition or product milestone, then change it only against recorded evidence.",
  },
  "honest-independent-builder": {
    title: "Honest Independent Builder",
    outcome: "success",
    diagnosticUnlockId: "confidence-intervals",
    nextRunResponse:
      "Keep the same discipline: preserve evidence coverage, pay costs before expansion, and treat private uncertainty as an operational constraint.",
  },
};

function privateAssessmentFor(
  state: SimulationState,
  coverage = state.career.evaluation.coverage,
): PrivateAssessment {
  const evaluation = state.career.evaluation;
  // This intermediate is intentionally transient. Only the categorical result
  // is persisted or rendered, so exact latent capability is never exposed.
  const privateSignal =
    state.metrics.observedQuality +
    state.metrics.reliability * 14 +
    coverage * 8 -
    evaluation.leakageRisk * 32 -
    evaluation.distributionShiftRisk * 14 -
    state.career.product.serviceDebt * 0.35;
  if (privateSignal >= 65) return "credible";
  if (privateSignal >= 53) return "inconclusive";
  if (privateSignal >= 40) return "at-risk";
  return "failed";
}

function evaluationCoverageGain(state: SimulationState): number {
  return round(
    clamp(
      0.22 +
        state.metrics.evaluationCoverage * 0.25 +
        state.metrics.observability * 0.1,
      MIN_PRIVATE_EVALUATION_COVERAGE_GAIN,
      MAX_PRIVATE_EVALUATION_COVERAGE_GAIN,
    ),
    3,
  );
}

function publicScoreFor(state: SimulationState, nextRisk: number): number {
  const evaluation = state.career.evaluation;
  return round(
    clamp(
      state.metrics.predictedQuality +
        (evaluation.publicEvaluations + 1) * 4 +
        nextRisk * 16,
      0,
      99,
    ),
    1,
  );
}

function withIgnoredWarnings(
  state: SimulationState,
  warningKeys: readonly EvaluationWarningKey[],
): SimulationState {
  const evaluation = state.career.evaluation;
  const ignored = warningKeys.filter((key) => evaluation.warnings[key] > 0);
  if (
    ignored.length === 0 ||
    evaluation.ignoredWarnings >= MAX_EVALUATION_COUNTER
  )
    return state;
  const next = {
    ...state,
    career: {
      ...state.career,
      evaluation: {
        ...evaluation,
        ignoredWarnings: Math.min(
          MAX_EVALUATION_COUNTER,
          evaluation.ignoredWarnings + 1,
        ),
      },
    },
  };
  const warningNames = ignored.map((warning) => `${warning} warning`);
  const namedWarnings =
    warningNames.length === 1
      ? warningNames[0]!
      : `${warningNames.slice(0, -1).join(", ")} and ${warningNames.at(-1)}`;
  return appendEvent(next, {
    kind: "warning",
    message: `Ignored ${namedWarnings}: the next action proceeded despite the recorded warning.`,
    directCause: `The player continued after the recorded ${namedWarnings}.`,
    contributingCondition: `The ${namedWarnings} remained unresolved when this action was chosen.`,
  });
}

function recordEvaluationWarning(
  state: SimulationState,
  warning: EvaluationWarningKey,
  level: number,
  message: string,
): SimulationState {
  const evaluation = state.career.evaluation;
  if (evaluation.warnings[warning] >= level) return state;
  return appendEvent(
    {
      ...state,
      career: {
        ...state.career,
        evaluation: {
          ...evaluation,
          warnings: { ...evaluation.warnings, [warning]: level },
        },
      },
    },
    { kind: "warning", message },
  );
}

function refreshEvaluationWarnings(state: SimulationState): SimulationState {
  let next = state;
  const evaluation = () => next.career.evaluation;
  if (evaluation().leakageRisk >= 0.34)
    next = recordEvaluationWarning(
      next,
      "leakage",
      1,
      "Leakage warning: repeated public previews are becoming a target. Private evidence is still incomplete.",
    );
  if (evaluation().leakageRisk >= 0.58)
    next = recordEvaluationWarning(
      next,
      "leakage",
      2,
      "Leakage warning escalated: public optimization can now overstate private reliability. Submit only with stronger private coverage.",
    );
  if (evaluation().distributionShiftRisk >= 0.7)
    next = recordEvaluationWarning(
      next,
      "reliability",
      1,
      "Distribution-shift warning: released product work exceeds the evidence gathered for changed inputs.",
    );
  if (evaluation().distributionShiftRisk >= 1.35)
    next = recordEvaluationWarning(
      next,
      "reliability",
      2,
      "Reliability warning escalated: continued product service is likely to repeat an incident unless coverage or maintenance changes.",
    );
  if (evaluation().hardwareDebt >= 5)
    next = recordEvaluationWarning(
      next,
      "hardware",
      1,
      "Hardware commitment warning: capital outlay is outrunning the operating reserve while the active bottleneck remains visible.",
    );
  if (evaluation().hardwareDebt >= 8)
    next = recordEvaluationWarning(
      next,
      "hardware",
      2,
      "Hardware commitment warning escalated: another purchase without resolving the current bottleneck risks unpaid operating cost.",
    );
  if (evaluation().modelSwitches >= 3)
    next = recordEvaluationWarning(
      next,
      "tutorial",
      1,
      "Tutorial-loop warning: configuration changes are accumulating without a finished competition or product milestone.",
    );
  if (evaluation().modelSwitches >= 6)
    next = recordEvaluationWarning(
      next,
      "tutorial",
      2,
      "Tutorial-loop warning escalated: freeze a configuration and finish work before switching again.",
    );
  return next;
}

function recordCapitalCommitment(
  state: SimulationState,
  purchaseCost: number,
): SimulationState {
  const evaluation = state.career.evaluation;
  const unresolvedBottleneck =
    state.metrics.orderWarnings.length > 0 ||
    (state.metrics.dominantBottleneck !== "compute capacity" &&
      state.metrics.dominantBottleneck !== "memory pressure");
  const reserveGap = Math.max(0, 6 - state.resources.money);
  const debtAdded = round(
    purchaseCost * (unresolvedBottleneck ? 0.45 : 0.2) + reserveGap * 0.35,
    3,
  );
  const next = {
    ...state,
    career: {
      ...state.career,
      evaluation: {
        ...evaluation,
        capitalCommitments: Math.min(
          MAX_EVALUATION_COUNTER,
          evaluation.capitalCommitments + 1,
        ),
        hardwareDebt: round(
          Math.min(MAX_EVALUATION_SPEND, evaluation.hardwareDebt + debtAdded),
          3,
        ),
      },
    },
  };
  return withIgnoredWarnings(next, ["hardware"]);
}

function recordModelSwitch(state: SimulationState): SimulationState {
  const evaluation = state.career.evaluation;
  const next = {
    ...state,
    career: {
      ...state.career,
      evaluation: {
        ...evaluation,
        modelSwitches: Math.min(
          MAX_EVALUATION_COUNTER,
          evaluation.modelSwitches + 1,
        ),
      },
    },
  };
  return withIgnoredWarnings(next, ["tutorial"]);
}

function endingCausalEvidence(
  state: SimulationState,
  endingId: RunEndingId,
): CausalEvidence {
  const { evaluation } = state.career;
  switch (endingId) {
    case "public-leaderboard-hero":
      return {
        directCauses: [
          "An irreversible Cup submission relied on a strong public score while the recorded private assessment was at risk or failed.",
        ],
        contributingFactors: [
          `${evaluation.publicEvaluations} public previews increased leakage risk to ${(evaluation.leakageRisk * 100).toFixed(0)}%.`,
          `Only ${(evaluation.coverage * 100).toFixed(0)}% private coverage was recorded before submission.`,
        ],
        correlations: [
          `The active ${state.career.quantization.toUpperCase()} configuration was present when the public score was submitted.`,
        ],
        hypotheses: [
          "A paid private evaluation before submission may have revealed the divergence early enough to change the entry.",
        ],
        unknowns: [
          "The simulator intentionally does not expose an exact latent capability score.",
        ],
      };
    case "product-reliability-collapse":
      return {
        directCauses: [
          `${evaluation.reliabilityIncidents} recorded distribution-shift reliability incidents occurred after the irreversible product release.`,
        ],
        contributingFactors: [
          `Shift risk reached ${(evaluation.distributionShiftRisk * 100).toFixed(0)}% with ${(evaluation.coverage * 100).toFixed(0)}% private coverage.`,
          `${state.career.product.serviceDebt.toFixed(2)} service debt increased the cost of recovering each incident.`,
        ],
        correlations: [
          `${state.career.product.maintenanceHours.toFixed(2)}h of maintenance had been recorded alongside the incidents.`,
        ],
        hypotheses: [
          "Pausing service work for broader private coverage and maintenance may have prevented a further incident.",
        ],
        unknowns: [
          "Current instrumentation cannot identify the exact unseen input mix behind each shifted request.",
        ],
      };
    case "hardware-debt-spiral":
      return {
        directCauses: [
          `${evaluation.capitalCommitments} irreversible capital commitments left $${state.career.unpaidCosts.toFixed(3)} of recorded operating cost unpaid.`,
        ],
        contributingFactors: [
          `Hardware commitment pressure reached ${evaluation.hardwareDebt.toFixed(2)} while ${state.metrics.dominantBottleneck} remained the active bottleneck.`,
          `${evaluation.warnings.hardware} hardware warnings were recorded before the run closed.`,
        ],
        correlations: [
          `${state.resources.electricityKwh.toFixed(3)} kWh of modeled electricity had been used in this run.`,
        ],
        hypotheses: [
          "Keeping a cash reserve and addressing the measured bottleneck before the next purchase may have broken the spiral.",
        ],
        unknowns: [
          "The ledger cannot prove which future purchase would have been sufficient without a counterfactual run.",
        ],
      };
    case "tutorial-loop":
      return {
        directCauses: [
          `${evaluation.modelSwitches} model or quantization changes accumulated without a finished competition submission or product release.`,
        ],
        contributingFactors: [
          `${evaluation.warnings.tutorial} tutorial-loop warnings and ${evaluation.ignoredWarnings} ignored-warning decisions were recorded.`,
        ],
        correlations: [
          `The current local tier remained ${state.career.activeModelTierId} at run close.`,
        ],
        hypotheses: [
          "Committing one configuration to a bounded milestone may have converted comparison work into durable progress.",
        ],
        unknowns: [
          "The ledger cannot infer whether a different model would have been better without a completed comparison plan.",
        ],
      };
    case "honest-independent-builder":
      return {
        directCauses: [
          "The player explicitly concluded after the Bedroom Developer exit, credible private evidence, and no unpaid career costs were recorded.",
        ],
        contributingFactors: [
          `${(evaluation.coverage * 100).toFixed(0)}% private coverage and a ${evaluation.privateAssessment} assessment were recorded before conclusion.`,
          `${evaluation.reliabilityIncidents} reliability incidents remained in the run history.`,
        ],
        correlations: [
          `${state.career.competition.submissions} Cup submission(s) and ${state.career.product.releases} product release(s) were completed.`,
        ],
        hypotheses: [
          "Keeping evidence, maintenance, and cash reserves explicit may preserve this independent route under a different seed.",
        ],
        unknowns: [
          "Future workload mixes and costs are not known at the point of conclusion.",
        ],
      };
  }
}

function finalizeRunEnding(
  state: SimulationState,
  endingId: RunEndingId,
): SimulationState {
  if (state.career.runEnding) return state;
  const detail = ENDING_DETAILS[endingId];
  const recorded = appendEvent(state, {
    kind: detail.outcome === "success" ? "success" : "failure",
    message: `Run ended: ${detail.title}. Review the evidence-backed postmortem in Career or Inspect before restarting.`,
    causal: endingCausalEvidence(state, endingId),
  });
  const endingEvent = recorded.ledger.at(-1);
  if (!endingEvent) return state;
  const meta: MetaProgression = {
    unlockedDiagnosticIds: [
      ...new Set([
        ...recorded.meta.unlockedDiagnosticIds,
        detail.diagnosticUnlockId,
      ]),
    ],
    completedEndingIds: [
      ...new Set([...recorded.meta.completedEndingIds, endingId]),
    ],
    replayCount: recorded.meta.replayCount,
  };
  return {
    ...recorded,
    meta,
    career: {
      ...recorded.career,
      runEnding: {
        id: endingId,
        title: detail.title,
        outcome: detail.outcome,
        eventId: endingEvent.id,
        diagnosticUnlockId: detail.diagnosticUnlockId,
        reachedAtTick: recorded.tick,
      },
    },
  };
}

function resolveRunEnding(state: SimulationState): SimulationState {
  if (state.career.runEnding) return state;
  const { career } = state;
  const evaluation = career.evaluation;
  if (
    career.product.released &&
    evaluation.reliabilityIncidents >= 2 &&
    evaluation.warnings.reliability >= 2 &&
    evaluation.ignoredWarnings >= 2
  )
    return finalizeRunEnding(state, "product-reliability-collapse");
  if (
    evaluation.capitalCommitments >= 3 &&
    evaluation.hardwareDebt >= 8 &&
    career.unpaidCosts >= 0.1 &&
    evaluation.warnings.hardware >= 2 &&
    evaluation.ignoredWarnings >= 2
  )
    return finalizeRunEnding(state, "hardware-debt-spiral");
  if (
    evaluation.modelSwitches >= 8 &&
    evaluation.warnings.tutorial >= 2 &&
    evaluation.ignoredWarnings >= 2 &&
    career.competition.submissions === 0 &&
    career.product.releases === 0
  )
    return finalizeRunEnding(state, "tutorial-loop");
  if (
    career.competition.submissions >= 1 &&
    evaluation.publicScore !== null &&
    evaluation.publicScore >= 64 &&
    (evaluation.privateAssessment === "at-risk" ||
      evaluation.privateAssessment === "failed") &&
    evaluation.publicEvaluations >= 3 &&
    evaluation.warnings.leakage >= 2 &&
    evaluation.ignoredWarnings >= 1
  )
    return finalizeRunEnding(state, "public-leaderboard-hero");
  return state;
}

export function independentRunReadiness(state: SimulationState): {
  ready: boolean;
  reasons: readonly string[];
} {
  const { career } = state;
  const evaluation = career.evaluation;
  const reasons: string[] = [];
  if (!career.exitAchieved)
    reasons.push("Complete the Bedroom Developer exit milestones.");
  if (evaluation.coverage < 0.72)
    reasons.push("Record at least 72% private evaluation coverage.");
  if (evaluation.privateAssessment !== "credible")
    reasons.push("Reach a credible private assessment.");
  if (career.unpaidCosts > 0)
    reasons.push("Pay all recorded career operating costs.");
  if (evaluation.reliabilityIncidents > 1)
    reasons.push("Keep reliability incidents to at most one.");
  if (evaluation.ignoredWarnings > 1)
    reasons.push("Do not carry more than one ignored escalating warning.");
  return { ready: reasons.length === 0, reasons };
}

export function getPostmortemEvent(
  state: Pick<SimulationState, "career" | "ledger">,
): LedgerEvent | null {
  const ending = state.career.runEnding;
  if (!ending) return null;
  const event = state.ledger.find((entry) => entry.id === ending.eventId);
  return event?.causal ? event : null;
}

export function endingNextRunResponse(endingId: RunEndingId): string {
  return ENDING_DETAILS[endingId].nextRunResponse;
}

function withUpgradeNotice(
  state: SimulationState,
  notice: UpgradeNotice,
): SimulationState {
  return appendEvent({ ...state, lastUpgradeNotice: notice }, notice);
}

function recalculate(state: SimulationState): SimulationState {
  const metrics = calculateMetrics({
    ...state,
    workloadId: state.jobs.activeTask?.workloadId ?? state.workloadId,
  });
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

function emptyEveningAllocations(): Record<CareerRoute, number> {
  return {
    freelance: 0,
    competition: 0,
    product: 0,
    maintenance: 0,
  };
}

function createInitialEvaluationState(): EvaluationState {
  return {
    publicScore: null,
    privateAssessment: "not-run",
    coverage: 0,
    evaluationSpend: 0,
    publicEvaluations: 0,
    privateEvaluations: 0,
    leakageRisk: 0,
    distributionShiftRisk: 0,
    reliabilityIncidents: 0,
    ignoredWarnings: 0,
    warnings: {
      leakage: 0,
      reliability: 0,
      hardware: 0,
      tutorial: 0,
    },
    modelSwitches: 0,
    capitalCommitments: 0,
    hardwareDebt: 0,
  };
}

function createInitialMetaProgression(): MetaProgression {
  return {
    unlockedDiagnosticIds: [],
    completedEndingIds: [],
    replayCount: 0,
  };
}

function createInitialCareerState(): CareerState {
  return {
    schedule: {
      day: 1,
      hoursAvailable: EVENING_HOURS,
      hoursRemaining: EVENING_HOURS,
      allocations: emptyEveningAllocations(),
      completedEvenings: 0,
    },
    // A small emergency reserve makes the initial laptop-and-power constraints
    // concrete without changing the pre-existing pipeline cash balance.
    savings: 3,
    electricityCostsIncurred: 0,
    operatingCostsIncurred: 0,
    costsPaid: 0,
    unpaidCosts: 0,
    freelanceHours: 0,
    freelanceGross: 0,
    competition: {
      id: "bedroom-benchmark-cup",
      name: "Bedroom Benchmark Cup",
      progress: 0,
      submissions: 0,
      bestScore: 0,
      overfitRisk: 0,
      prizeClaimed: false,
      lifetimePrizeMoney: 0,
    },
    product: {
      id: "deskflow-local",
      name: "Deskflow Local",
      buildProgress: 0,
      released: false,
      releases: 0,
      serviceDebt: 0,
      lifetimeRevenue: 0,
      maintenanceHours: 0,
    },
    unlockedModelTierIds: [localModelTiers[0]!.id],
    activeModelTierId: localModelTiers[0]!.id,
    quantization: "q4",
    offlinePolicy: {
      enabled: false,
      route: "freelance",
      maxHours: 1,
      maxElectricityCost: 0.1,
      maxOperatingCost: 0.4,
      minReliability: 0.9,
      lastReport: null,
    },
    exitAchieved: false,
    evaluation: createInitialEvaluationState(),
    runEnding: null,
  };
}

function isTierEligible(career: CareerState, tierId: string): boolean {
  switch (tierId) {
    case "lantern-3b":
      return true;
    case "harbor-7b":
      return (
        career.savings >= 8 ||
        career.competition.submissions >= 1 ||
        career.product.released
      );
    case "kiln-13b":
      return (
        career.savings >= 18 &&
        (career.competition.prizeClaimed || career.product.lifetimeRevenue >= 8)
      );
    default:
      return false;
  }
}

export function localModelTierUnlockProgress(
  state: Pick<SimulationState, "career">,
  tierId: string,
): { unlocked: boolean; requirement: string } {
  const tier = getLocalModelTier(tierId);
  return {
    unlocked: state.career.unlockedModelTierIds.includes(tier.id),
    requirement: tier.unlockDescription,
  };
}

function careerExitSatisfied(career: CareerState): boolean {
  return (
    career.savings >= 24 &&
    career.competition.submissions >= 1 &&
    career.product.released &&
    career.unlockedModelTierIds.includes("kiln-13b")
  );
}

function refreshCareerUnlocks(state: SimulationState): SimulationState {
  let next = state;
  for (const tier of localModelTiers) {
    if (next.career.unlockedModelTierIds.includes(tier.id)) continue;
    if (!isTierEligible(next.career, tier.id)) continue;
    next = appendEvent(
      {
        ...next,
        career: {
          ...next.career,
          unlockedModelTierIds: [...next.career.unlockedModelTierIds, tier.id],
        },
      },
      {
        kind: "success",
        message: `${tier.name} unlocked. Its durable local-model tradeoff is now selectable in Career.`,
      },
    );
  }
  if (!next.career.exitAchieved && careerExitSatisfied(next.career)) {
    next = appendEvent(
      {
        ...next,
        career: { ...next.career, exitAchieved: true },
      },
      {
        kind: "success",
        message:
          "Bedroom Developer exit reached: $24 durable savings, a submitted competition entry, a released local product, and the Kiln 13B tier are in place.",
      },
    );
  }
  return next;
}

function scheduledHours(career: CareerState): number {
  return CAREER_ROUTES.reduce(
    (total, route) => total + career.schedule.allocations[route],
    0,
  );
}

function isQuarterHour(value: number): boolean {
  return (
    Math.abs(
      value / CAREER_HOUR_INCREMENT - Math.round(value / CAREER_HOUR_INCREMENT),
    ) < 0.000_001
  );
}

function careerRouteMetrics(
  state: SimulationState,
  route: CareerRoute,
): PipelineMetrics {
  const spec = bedroomCareerRoutes.find((item) => item.id === route);
  if (!spec) return state.metrics;
  return calculateMetrics({ ...state, workloadId: spec.workloadId });
}

function careerCosts(
  state: SimulationState,
  metrics: PipelineMetrics,
  hours: number,
): { operatingCost: number; electricityCost: number; electricityKwh: number } {
  const tier = getLocalModelTier(state.career.activeModelTierId);
  const watts =
    getHardware(state.hardwareId).watts * (state.computeAllocation / 100);
  const electricityKwh = round((watts * hours) / 1000, 4);
  return {
    operatingCost: round(
      hours * (metrics.operatingCost * 1.5 + tier.operatingCostPerHour),
      3,
    ),
    electricityCost: round(electricityKwh * ELECTRICITY_RATE, 3),
    electricityKwh,
  };
}

function settleCareerAccounting(
  state: SimulationState,
  gross: number,
  operatingCost: number,
  electricityCost: number,
): SimulationState {
  const configuredCost = round(operatingCost + electricityCost, 3);
  const due = round(state.career.unpaidCosts + configuredCost, 3);
  const available = round(state.resources.money + gross, 3);
  const paid = round(Math.min(available, due), 3);
  return {
    ...state,
    resources: {
      ...state.resources,
      money: round(Math.max(0, available - due), 3),
    },
    career: {
      ...state.career,
      electricityCostsIncurred: round(
        state.career.electricityCostsIncurred + electricityCost,
        3,
      ),
      operatingCostsIncurred: round(
        state.career.operatingCostsIncurred + operatingCost,
        3,
      ),
      costsPaid: round(state.career.costsPaid + paid, 3),
      unpaidCosts: round(Math.max(0, due - paid), 3),
    },
  };
}

function freelanceGross(metrics: PipelineMetrics, hours: number): number {
  if (
    metrics.memoryPressure > 1 ||
    metrics.orderWarnings.includes("no model stage") ||
    metrics.reliability < 0.72
  )
    return 0;
  const qualityFactor = clamp(metrics.predictedQuality / 55, 0.55, 1.65);
  const latencyFactor = clamp(1.35 - metrics.latencySeconds / 12, 0.45, 1.2);
  return round(
    hours *
      (1.15 + qualityFactor * 0.85 + latencyFactor * 0.35) *
      metrics.reliability,
    3,
  );
}

interface CareerRouteResult {
  state: SimulationState;
  gross: number;
  operatingCost: number;
  electricityCost: number;
  electricityKwh: number;
}

function runCareerRoute(
  state: SimulationState,
  route: CareerRoute,
  hours: number,
): CareerRouteResult {
  const metrics = careerRouteMetrics(state, route);
  const costs = careerCosts(state, metrics, hours);
  let gross = 0;
  let next = state;
  let reliabilityIncident = false;
  let incidentShiftRisk = 0;
  const usable =
    metrics.memoryPressure <= 1 &&
    !metrics.orderWarnings.includes("no model stage");

  switch (route) {
    case "freelance":
      gross = freelanceGross(metrics, hours);
      next = {
        ...next,
        career: {
          ...next.career,
          freelanceHours: round(next.career.freelanceHours + hours, 2),
          freelanceGross: round(next.career.freelanceGross + gross, 3),
        },
      };
      break;
    case "competition": {
      const progressRate = usable
        ? clamp(
            0.45 +
              metrics.predictedQuality / 100 +
              metrics.evaluationCoverage * 0.35,
            0.4,
            1.65,
          )
        : 0;
      const risk = usable
        ? hours * clamp(0.72 - metrics.evaluationCoverage, 0, 0.72) * 0.14
        : 0;
      next = {
        ...next,
        career: {
          ...next.career,
          competition: {
            ...next.career.competition,
            progress: round(
              next.career.competition.progress + hours * progressRate,
              3,
            ),
            overfitRisk: round(
              clamp(next.career.competition.overfitRisk + risk, 0, 8),
              3,
            ),
          },
        },
      };
      break;
    }
    case "product": {
      if (!next.career.product.released) {
        const buildRate = usable
          ? clamp(0.5 + metrics.predictedQuality / 105, 0.35, 1.5)
          : 0;
        next = {
          ...next,
          career: {
            ...next.career,
            product: {
              ...next.career.product,
              buildProgress: round(
                next.career.product.buildProgress + hours * buildRate,
                3,
              ),
            },
          },
        };
      } else {
        const debtFactor = clamp(
          1 - next.career.product.serviceDebt / 20,
          0.25,
          1,
        );
        const serviceFactor = usable
          ? clamp(
              metrics.reliability * (metrics.predictedQuality / 60),
              0.35,
              1.55,
            )
          : 0;
        gross = round(hours * (1.25 + serviceFactor * 0.95) * debtFactor, 3);
        const debtAdded = usable
          ? hours * clamp((0.965 - metrics.reliability) * 9 + 0.08, 0.08, 1.1)
          : hours;
        const evaluation = next.career.evaluation;
        const shiftAdded =
          hours *
          (clamp(0.72 - evaluation.coverage, 0, 0.72) * 0.13 +
            clamp(0.975 - metrics.reliability, 0, 0.2) * 0.35);
        const distributionShiftRisk = round(
          clamp(evaluation.distributionShiftRisk + shiftAdded, 0, 8),
          3,
        );
        const incidentBandBefore = Math.floor(
          evaluation.distributionShiftRisk / 1.1,
        );
        const incidentBandAfter = Math.floor(distributionShiftRisk / 1.1);
        reliabilityIncident = incidentBandAfter > incidentBandBefore;
        incidentShiftRisk = distributionShiftRisk;
        next = {
          ...next,
          career: {
            ...next.career,
            product: {
              ...next.career.product,
              serviceDebt: round(
                clamp(next.career.product.serviceDebt + debtAdded, 0, 20),
                3,
              ),
              lifetimeRevenue: round(
                next.career.product.lifetimeRevenue + gross,
                3,
              ),
            },
            evaluation: {
              ...evaluation,
              distributionShiftRisk,
              reliabilityIncidents: Math.min(
                MAX_EVALUATION_COUNTER,
                evaluation.reliabilityIncidents + (reliabilityIncident ? 1 : 0),
              ),
            },
          },
        };
      }
      break;
    }
    case "maintenance": {
      const repair = usable
        ? hours * (1.5 + metrics.evaluationCoverage * 2.5)
        : 0;
      next = {
        ...next,
        career: {
          ...next.career,
          product: {
            ...next.career.product,
            serviceDebt: round(
              Math.max(0, next.career.product.serviceDebt - repair),
              3,
            ),
            maintenanceHours: round(
              next.career.product.maintenanceHours + hours,
              2,
            ),
          },
        },
      };
      break;
    }
  }

  next = settleCareerAccounting(
    next,
    gross,
    costs.operatingCost,
    costs.electricityCost,
  );
  next = {
    ...next,
    resources: {
      ...next.resources,
      electricityKwh: round(
        next.resources.electricityKwh + costs.electricityKwh,
        4,
      ),
    },
  };
  if (route === "product" && state.career.product.released)
    next = withIgnoredWarnings(next, ["reliability"]);
  if (reliabilityIncident) {
    next = appendEvent(next, {
      kind: "failure",
      message: `Distribution-shift reliability incident recorded after released product work. Shift risk reached ${(incidentShiftRisk * 100).toFixed(0)}%; service debt and recovery work remain visible.`,
      causal: {
        directCauses: [
          "Released product work crossed a recorded distribution-shift risk band and produced a reliability incident.",
        ],
        contributingFactors: [
          `${(next.career.evaluation.coverage * 100).toFixed(0)}% private evaluation coverage was recorded at the incident.`,
          `${(metrics.reliability * 100).toFixed(1)}% modeled pipeline reliability applied to the service work.`,
        ],
        correlations: [
          `${next.career.product.serviceDebt.toFixed(2)} service debt was present after the route.`,
        ],
        hypotheses: [
          "Broader private evaluation or maintenance before more service work may reduce later shift risk.",
        ],
        unknowns: [
          "The local evidence set cannot identify the exact unseen input that triggered this modeled incident.",
        ],
      },
    });
  }
  const totalCost = round(costs.operatingCost + costs.electricityCost, 3);
  const routeName =
    bedroomCareerRoutes.find((item) => item.id === route)?.name ?? route;
  next = appendEvent(next, {
    kind: gross > 0 || route !== "freelance" ? "info" : "warning",
    message: `${routeName}: ${hours.toFixed(2)}h allocated; $${gross.toFixed(3)} gross, $${totalCost.toFixed(3)} configured operating + electricity cost, $${next.career.unpaidCosts.toFixed(3)} career cost still unpaid.`,
  });
  return { ...costs, state: next, gross };
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
  state: Pick<SimulationState, "jobs" | "workloadDemand">,
  workloadId: string,
  additionalReservations = 0,
): WorkloadQuote {
  const workload = getWorkload(workloadId);
  const demand = demandFor(state, workloadId);
  const acceptedReservations = [
    ...(state.jobs.activeTask ? [state.jobs.activeTask] : []),
    ...state.jobs.waitingTasks,
  ].filter((task) => task.workloadId === workloadId).length;
  const pendingReservations =
    acceptedReservations +
    (isFiniteNumber(additionalReservations)
      ? Math.max(0, Math.trunc(additionalReservations))
      : 0);
  const reservationCount = Math.max(0, Math.trunc(pendingReservations));
  // A long burst reserves a finite local demand window. The increasing term
  // makes a ten-job convenience queue legible but not a free dominant route;
  // each accepted task still locks this exact displayed quote.
  const reservationPressure =
    reservationCount *
    (1 + Math.max(0, reservationCount - 1)) *
    workload.saturationPerSuccess;
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
    reservationCount > 0
      ? `${reservationCount} accepted ${reservationCount === 1 ? "task reserves" : "tasks reserve"} nearby demand; later reservations fall faster, and every task keeps its own quote.`
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

export function estimateWorkloadOffer(
  metrics: PipelineMetrics,
  quote: WorkloadQuote,
): {
  guaranteedFailure: boolean;
  expectedGrossPayout: number;
  expectedNet: number;
} {
  const guaranteedFailure =
    metrics.memoryPressure > 1 ||
    metrics.orderWarnings.includes("no model stage");
  const expectedGrossPayout = guaranteedFailure
    ? 0
    : round(quote.grossQuote * metrics.reliability, 3);
  return {
    guaranteedFailure,
    expectedGrossPayout,
    expectedNet: round(expectedGrossPayout - metrics.operatingCost, 3),
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
    career: createInitialCareerState(),
    meta: createInitialMetaProgression(),
    firstSession: createInitialFirstSessionProgress(),
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

/**
 * Deterministic scenario fixture for balance tools and non-onboarding tests.
 * Production startup always uses createInitialState(), whose durable rail is
 * guarded by applyCommand. This fixture models an established pre-guide run
 * without adding a production command that could skip player progression.
 */
export function createEstablishedScenarioState(
  seed = 20260715,
): SimulationState {
  return sealSimulationState({
    ...createInitialState(seed),
    firstSession: legacyFirstSessionProgress(),
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

function applyValidCommand(
  state: SimulationState,
  command: SimulationCommand,
): SimulationState {
  switch (command.type) {
    case "RESET": {
      const fresh = createInitialState(command.seed ?? state.seed);
      return appendEvent(
        {
          ...fresh,
          meta: {
            ...state.meta,
            replayCount: Math.min(MAX_META_REPLAYS, state.meta.replayCount + 1),
          },
        },
        {
          kind: "info",
          message:
            "New deterministic run started. Diagnostic unlocks are retained as information only; production metrics begin fresh.",
        },
      );
    }
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
        firstSession:
          state.firstSession.step === "buy-and-install" &&
          state.firstSession.purchasedModuleId === module.id
            ? {
                ...state.firstSession,
                step: "complete",
              }
            : state.firstSession,
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
      return recordCapitalCommitment(
        withUpgradeNotice(
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
        ),
        item.purchaseCost,
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
      const purchased = {
        ...state,
        ownedModuleIds: [...state.ownedModuleIds, item.id],
        resources: {
          ...state.resources,
          money: round(state.resources.money - item.purchaseCost, 3),
        },
        firstSession:
          state.firstSession.step === "buy-and-install" &&
          state.firstSession.purchasedModuleId === null
            ? {
                ...state.firstSession,
                purchasedModuleId: item.id,
              }
            : state.firstSession,
      };
      return recordCapitalCommitment(
        withUpgradeNotice(purchased, {
          kind: "success",
          message: `${item.name} purchased for $${item.purchaseCost.toFixed(2)} and is now owned. Add it to a compatible ${item.slotTypes.join("/")} slot in Build; purchase deducted exactly once.`,
        }),
        item.purchaseCost,
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
      return recordCapitalCommitment(
        withUpgradeNotice(
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
        ),
        item.purchaseCost,
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
      if (state.firstSession.step === "observe-settlement")
        return appendEvent(state, {
          kind: "warning",
          message:
            "First-session route: let the accepted Interactive Chat job settle before queueing more work.",
        });
      if (
        state.firstSession.step === "queue-starter" &&
        (state.workloadId !== "interactive-chat" || requested !== 1)
      )
        return appendEvent(state, {
          kind: "warning",
          message:
            "First-session route: queue one Interactive Chat job from the guided Jobs action before using other workload or batch controls.",
        });
      const count = Math.min(requested, MAX_QUEUED_TASKS - state.jobs.queued);
      if (count <= 0) return state;
      const tasks: QueuedTask[] = Array.from({ length: count }, (_, index) => {
        const sequence = state.jobs.nextTaskSequence + index;
        return {
          id: `task-${state.tick}-${sequence}`,
          workloadId: state.workloadId,
          lockedGrossQuote: getWorkloadQuote(state, state.workloadId, index)
            .grossQuote,
          acceptedAtTick: state.tick,
          progress: 0,
        };
      });
      return appendEvent(
        {
          ...state,
          firstSession:
            state.firstSession.step === "queue-starter" &&
            state.workloadId === "interactive-chat" &&
            count === 1
              ? {
                  ...state.firstSession,
                  step: "observe-settlement",
                  starterTaskId: tasks[0]?.id ?? null,
                }
              : state.firstSession,
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
      const clearedGuidedStarter =
        state.firstSession.step === "observe-settlement" &&
        state.firstSession.starterTaskId !== null &&
        state.jobs.waitingTasks.some(
          (task) => task.id === state.firstSession.starterTaskId,
        );
      return appendEvent(
        {
          ...state,
          firstSession: clearedGuidedStarter
            ? createInitialFirstSessionProgress()
            : state.firstSession,
          jobs: {
            ...state.jobs,
            queued: state.jobs.activeTask ? 1 : 0,
            waitingTasks: [],
          },
        },
        {
          kind: "info",
          message: `${count} waiting task${count === 1 ? "" : "s"} cleared.${clearedGuidedStarter ? " The first-session guide reset so you can queue one new safe starter." : ""} Active work, accepted demand, money, and payouts were unchanged; no refund or settlement occurred.`,
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
    case "SET_EVENING_ALLOCATION": {
      if (
        command.hours < 0 ||
        command.hours > EVENING_HOURS ||
        !isQuarterHour(command.hours)
      )
        return appendEvent(state, {
          kind: "warning",
          message:
            "Evening allocation rejected: use a finite 0.25-hour increment between 0 and 4.",
        });
      const allocations = state.career.schedule.allocations;
      const otherHours = CAREER_ROUTES.reduce(
        (total, route) =>
          total + (route === command.route ? 0 : allocations[route]),
        0,
      );
      if (otherHours + command.hours > EVENING_HOURS + 0.000_001)
        return appendEvent(state, {
          kind: "warning",
          message:
            "Evening allocation rejected: the four-hour after-work window cannot be overbooked.",
        });
      const nextAllocations = {
        ...allocations,
        [command.route]: command.hours,
      };
      const total = round(otherHours + command.hours, 2);
      return appendEvent(
        {
          ...state,
          career: {
            ...state.career,
            schedule: {
              ...state.career.schedule,
              allocations: nextAllocations,
              hoursRemaining: round(EVENING_HOURS - total, 2),
            },
          },
        },
        {
          kind: "info",
          message: `${command.hours.toFixed(2)}h scheduled for ${bedroomCareerRoutes.find((route) => route.id === command.route)?.name ?? command.route}. ${Math.max(0, EVENING_HOURS - total).toFixed(2)}h remains unallocated tonight.`,
        },
      );
    }
    case "RUN_EVENING": {
      const planned = CAREER_ROUTES.filter(
        (route) => state.career.schedule.allocations[route] > 0,
      );
      if (planned.length === 0)
        return appendEvent(state, {
          kind: "warning",
          message:
            "No evening was run: schedule at least 0.25h of real work. Advancing time alone never creates career money or progress.",
        });
      let next = state;
      for (const route of planned) {
        next = runCareerRoute(
          next,
          route,
          next.career.schedule.allocations[route],
        ).state;
      }
      const usedHours = scheduledHours(next.career);
      next = {
        ...next,
        career: {
          ...next.career,
          schedule: {
            day: next.career.schedule.day + 1,
            hoursAvailable: EVENING_HOURS,
            hoursRemaining: EVENING_HOURS,
            allocations: emptyEveningAllocations(),
            completedEvenings: next.career.schedule.completedEvenings + 1,
          },
        },
      };
      return appendEvent(next, {
        kind: "info",
        message: `Evening ${state.career.schedule.day} closed after ${usedHours.toFixed(2)}h of allocated work. Tomorrow has a fresh four-hour window; unused time produced no money or progress.`,
      });
    }
    case "DEPOSIT_SAVINGS": {
      if (command.amount <= 0 || command.amount > state.resources.money)
        return appendEvent(state, {
          kind: "warning",
          message:
            "Savings deposit rejected: move only available liquid money; unpaid costs are never hidden by a deposit.",
        });
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - command.amount, 3),
          },
          career: {
            ...state.career,
            savings: round(state.career.savings + command.amount, 3),
          },
        },
        {
          kind: "success",
          message: `$${command.amount.toFixed(3)} moved into durable savings. It is no longer available for immediate pipeline purchases or operating costs.`,
        },
      );
    }
    case "WITHDRAW_SAVINGS": {
      if (command.amount <= 0 || command.amount > state.career.savings)
        return appendEvent(state, {
          kind: "warning",
          message:
            "Savings withdrawal rejected: the requested amount exceeds the durable reserve.",
        });
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money + command.amount, 3),
          },
          career: {
            ...state.career,
            savings: round(state.career.savings - command.amount, 3),
          },
        },
        {
          kind: "info",
          message: `$${command.amount.toFixed(3)} withdrawn from durable savings to liquid operating cash.`,
        },
      );
    }
    case "SELECT_LOCAL_MODEL_TIER": {
      const tier = findLocalModelTier(command.modelTierId);
      if (!tier || !state.career.unlockedModelTierIds.includes(tier.id))
        return appendEvent(state, {
          kind: "warning",
          message:
            "Local model selection rejected: unlock that durable tier through the Bedroom Developer loop first.",
        });
      if (tier.id === state.career.activeModelTierId) return state;
      const next = recalculate({
        ...state,
        career: { ...state.career, activeModelTierId: tier.id },
        baselineMetrics: state.metrics,
        baselineLabel: "Before local model tier change",
      });
      return appendEvent(recordModelSwitch(next), {
        kind: "info",
        message: `${tier.name} selected. Its memory, throughput, quality, reliability, and nightly operating tradeoffs now apply to model stages.`,
      });
    }
    case "SET_QUANTIZATION": {
      if (command.profile === state.career.quantization) return state;
      const next = recalculate({
        ...state,
        career: { ...state.career, quantization: command.profile },
        baselineMetrics: state.metrics,
        baselineLabel: "Before quantization change",
      });
      return appendEvent(recordModelSwitch(next), {
        kind: "info",
        message:
          command.profile === "q8"
            ? "Q8 selected: quality and reliability improve, while model memory and throughput costs rise."
            : "Q4 selected: the lower-memory, faster baseline quantization is active.",
      });
    }
    case "SUBMIT_COMPETITION": {
      if (state.career.competition.progress < 8)
        return appendEvent(state, {
          kind: "warning",
          message: `Competition submission needs 8.00 verified progress; ${state.career.competition.progress.toFixed(2)} is ready.`,
        });
      const metrics = careerRouteMetrics(state, "competition");
      const score = round(
        clamp(
          metrics.predictedQuality * 0.64 +
            metrics.observedQuality * 0.22 +
            metrics.evaluationCoverage * 14 -
            state.career.competition.overfitRisk * 10,
          0,
          99,
        ),
        1,
      );
      const qualifies = score >= 45;
      const prize =
        qualifies && !state.career.competition.prizeClaimed ? 12 : 0;
      let next = settleCareerAccounting(state, prize, 0, 0);
      const publicScore =
        state.career.evaluation.publicScore ??
        round(
          clamp(score + state.career.evaluation.leakageRisk * 12, 0, 99),
          1,
        );
      const privateAssessment = next.career.evaluation.privateAssessment;
      next = {
        ...next,
        resources: {
          ...next.resources,
          reputation: round(
            next.resources.reputation + (qualifies ? 1.2 : 0.08),
            3,
          ),
        },
        career: {
          ...next.career,
          competition: {
            ...next.career.competition,
            progress: 0,
            submissions: next.career.competition.submissions + 1,
            bestScore: Math.max(next.career.competition.bestScore, score),
            overfitRisk: round(next.career.competition.overfitRisk * 0.35, 3),
            prizeClaimed: next.career.competition.prizeClaimed || prize > 0,
            lifetimePrizeMoney: round(
              next.career.competition.lifetimePrizeMoney + prize,
              3,
            ),
          },
          evaluation: {
            ...next.career.evaluation,
            publicScore,
          },
        },
      };
      next = withIgnoredWarnings(next, ["leakage"]);
      const privateEvidenceSummary =
        privateAssessment === "not-run"
          ? "no paid private assessment"
          : `paid private assessment ${privateAssessment}`;
      return appendEvent(next, {
        kind: qualifies ? "success" : "warning",
        message: qualifies
          ? `Bedroom Benchmark Cup submitted with public score ${publicScore.toFixed(1)} and ${privateEvidenceSummary}. ${prize > 0 ? "$12.000 prize paid into the same explicit cost ledger." : "The one-time prize was already claimed; this submission added technical reputation only."} Exact latent capability remains intentionally unreported.`
          : `Bedroom Benchmark Cup submitted with public score ${publicScore.toFixed(1)} and ${privateEvidenceSummary}; the entry missed the 45.0 verified threshold. No prize was paid and no run state was destroyed. Exact latent capability remains intentionally unreported.`,
      });
    }
    case "RELEASE_PRODUCT": {
      if (state.career.product.released) return state;
      if (state.career.product.buildProgress < 8)
        return appendEvent(state, {
          kind: "warning",
          message: `Deskflow Local needs 8.00 build progress before release; ${state.career.product.buildProgress.toFixed(2)} is ready.`,
        });
      return appendEvent(
        withIgnoredWarnings(
          {
            ...state,
            career: {
              ...state.career,
              product: {
                ...state.career.product,
                released: true,
                releases: state.career.product.releases + 1,
              },
            },
          },
          ["reliability"],
        ),
        {
          kind: "success",
          message:
            "Deskflow Local released. Future product hours provide service revenue, while reliability debt may require maintenance time.",
        },
      );
    }
    case "RUN_PUBLIC_EVALUATION": {
      const evaluation = state.career.evaluation;
      const nextRisk = round(
        clamp(
          evaluation.leakageRisk +
            clamp(0.24 - evaluation.coverage * 0.16, 0.08, 0.24),
          0,
          1,
        ),
        3,
      );
      const publicScore = publicScoreFor(state, nextRisk);
      return appendEvent(
        {
          ...state,
          career: {
            ...state.career,
            evaluation: {
              ...evaluation,
              publicScore,
              publicEvaluations: Math.min(
                MAX_EVALUATION_COUNTER,
                evaluation.publicEvaluations + 1,
              ),
              leakageRisk: nextRisk,
            },
          },
        },
        {
          kind: "info",
          message: `Public preview recorded ${publicScore.toFixed(1)}. It is a visible benchmark signal, not an exact capability claim; repeated previews increase leakage risk.`,
        },
      );
    }
    case "RUN_PRIVATE_EVALUATION": {
      if (state.resources.money < PRIVATE_EVALUATION_COST)
        return appendEvent(state, {
          kind: "warning",
          message: `Private evaluation needs $${PRIVATE_EVALUATION_COST.toFixed(3)} liquid cash for the evidence sample. No coverage or cost changed.`,
        });
      const accounted = settleCareerAccounting(
        state,
        0,
        PRIVATE_EVALUATION_COST,
        0,
      );
      const previous = accounted.career.evaluation;
      const coverage = round(
        clamp(previous.coverage + evaluationCoverageGain(accounted), 0, 1),
        3,
      );
      const candidate = {
        ...accounted,
        career: {
          ...accounted.career,
          evaluation: {
            ...previous,
            coverage,
            evaluationSpend: round(
              previous.evaluationSpend + PRIVATE_EVALUATION_COST,
              3,
            ),
            privateEvaluations: Math.min(
              MAX_EVALUATION_COUNTER,
              previous.privateEvaluations + 1,
            ),
            leakageRisk: round(Math.max(0, previous.leakageRisk - 0.22), 3),
            distributionShiftRisk: round(
              Math.max(0, previous.distributionShiftRisk - 0.18),
              3,
            ),
          },
        },
      };
      const privateAssessment = privateAssessmentFor(candidate, coverage);
      return appendEvent(
        {
          ...candidate,
          career: {
            ...candidate.career,
            evaluation: {
              ...candidate.career.evaluation,
              privateAssessment,
            },
          },
        },
        {
          kind: "success",
          message: `Private evidence sample paid for $${PRIVATE_EVALUATION_COST.toFixed(3)}. Coverage is now ${(coverage * 100).toFixed(0)}%; private assessment: ${privateAssessment}. Exact latent capability remains intentionally unreported.`,
        },
      );
    }
    case "CONCLUDE_INDEPENDENT_RUN": {
      const readiness = independentRunReadiness(state);
      if (!readiness.ready)
        return appendEvent(state, {
          kind: "warning",
          message: `Independent conclusion is not ready: ${readiness.reasons.join(" ")}`,
        });
      return finalizeRunEnding(state, "honest-independent-builder");
    }
    case "SET_OFFLINE_POLICY": {
      const maxHours = round(
        Math.floor(
          clamp(command.maxHours, 0, MAX_OFFLINE_HOURS) / CAREER_HOUR_INCREMENT,
        ) * CAREER_HOUR_INCREMENT,
        2,
      );
      const maxElectricityCost = round(
        clamp(command.maxElectricityCost, 0, 5),
        3,
      );
      const maxOperatingCost = round(clamp(command.maxOperatingCost, 0, 5), 3);
      const minReliability = round(
        clamp(command.minReliability, 0.7, 0.999),
        3,
      );
      return appendEvent(
        {
          ...state,
          career: {
            ...state.career,
            offlinePolicy: {
              ...state.career.offlinePolicy,
              enabled: command.enabled,
              maxHours,
              maxElectricityCost,
              maxOperatingCost,
              minReliability,
            },
          },
        },
        {
          kind: "info",
          message: command.enabled
            ? `Safe offline policy enabled: freelance only, ≤${maxHours.toFixed(2)}h, ≤$${maxOperatingCost.toFixed(3)} operating and ≤$${maxElectricityCost.toFixed(3)} electricity cost, ≥${(minReliability * 100).toFixed(1)}% reliability.`
            : "Safe offline policy disabled. No background work will be authorized.",
        },
      );
    }
    case "APPLY_OFFLINE_POLICY": {
      const policy = state.career.offlinePolicy;
      const report = (
        appliedHours: number,
        gross: number,
        configuredCost: number,
        stoppedReason: string,
      ) => ({
        ...state,
        career: {
          ...state.career,
          offlinePolicy: {
            ...state.career.offlinePolicy,
            lastReport: {
              requestedHours: round(Math.max(0, command.requestedHours), 2),
              appliedHours: round(appliedHours, 2),
              route: "freelance" as const,
              gross: round(gross, 3),
              configuredCost: round(configuredCost, 3),
              stoppedReason,
            },
          },
        },
      });
      if (!policy.enabled)
        return appendEvent(report(0, 0, 0, "policy disabled"), {
          kind: "info",
          message: "Offline policy did nothing because the player disabled it.",
        });
      if (scheduledHours(state.career) > 0)
        return appendEvent(report(0, 0, 0, "player schedule pending"), {
          kind: "info",
          message:
            "Offline policy deferred: a player-authored evening schedule is pending and takes priority.",
        });
      const hours = round(
        Math.floor(
          Math.min(command.requestedHours, policy.maxHours, EVENING_HOURS) /
            CAREER_HOUR_INCREMENT,
        ) * CAREER_HOUR_INCREMENT,
        2,
      );
      if (hours <= 0)
        return appendEvent(report(0, 0, 0, "zero bounded hours"), {
          kind: "info",
          message:
            "Offline policy did nothing: its bounded hour allowance is zero.",
        });
      const metrics = careerRouteMetrics(state, "freelance");
      const costs = careerCosts(state, metrics, hours);
      const gross = freelanceGross(metrics, hours);
      const configuredCost = round(
        costs.operatingCost + costs.electricityCost,
        3,
      );
      const unsafeReason =
        metrics.reliability < policy.minReliability
          ? "reliability below player minimum"
          : metrics.memoryPressure > 1 ||
              metrics.orderWarnings.includes("no model stage")
            ? "pipeline safety check failed"
            : costs.electricityCost > policy.maxElectricityCost
              ? "electricity cap reached"
              : costs.operatingCost > policy.maxOperatingCost
                ? "operating-cost cap reached"
                : state.resources.money + gross <
                    state.career.unpaidCosts + configuredCost
                  ? "cash reserve would create unpaid cost"
                  : null;
      if (unsafeReason)
        return appendEvent(report(0, 0, configuredCost, unsafeReason), {
          kind: "warning",
          message: `Offline policy stopped safely: ${unsafeReason}. No route progress, spending, purchase, release, or submission occurred.`,
        });
      let next = runCareerRoute(state, "freelance", hours).state;
      next = {
        ...next,
        career: {
          ...next.career,
          schedule: {
            day: next.career.schedule.day + 1,
            hoursAvailable: EVENING_HOURS,
            hoursRemaining: EVENING_HOURS,
            allocations: emptyEveningAllocations(),
            completedEvenings: next.career.schedule.completedEvenings + 1,
          },
          offlinePolicy: {
            ...next.career.offlinePolicy,
            lastReport: {
              requestedHours: round(Math.max(0, command.requestedHours), 2),
              appliedHours: hours,
              route: "freelance",
              gross,
              configuredCost,
              stoppedReason: "completed within player bounds",
            },
          },
        },
      };
      return appendEvent(next, {
        kind: "success",
        message: `Offline policy completed ${hours.toFixed(2)}h of bounded freelance only. It did not purchase, submit, release, or alter product/competition progress.`,
      });
    }
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
    default:
      return state;
  }
}

export function applyCommand(
  state: SimulationState,
  command: SimulationCommand,
): SimulationState {
  if (!isRuntimeSimulationCommand(command)) return state;
  if (state.career.runEnding && command.type !== "RESET") return state;
  const applied = applyValidCommand(state, command);
  if (applied === state) return state;
  const next = sealSimulationState(
    resolveRunEnding(
      refreshEvaluationWarnings(
        refreshCareerUnlocks(refreshWorkloadUnlocks(applied)),
      ),
    ),
  );
  // `sealSimulationState` just produced this digest. Rehashing the complete
  // snapshot here adds no corruption protection, while structural validation
  // still prevents an invalid transition from escaping the engine.
  return isStateStructurallyValid(next) ? next : state;
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
  const missingModel = taskMetrics.orderWarnings.includes("no model stage");
  const failed =
    memoryFailure || missingModel || sample.value > taskMetrics.reliability;
  const grossPayout = failed ? 0 : task.lockedGrossQuote;
  const operatingCost = taskMetrics.operatingCost;
  const operatingCostPaid = round(
    Math.min(operatingCost, moneyBeforeSettlement + grossPayout),
    3,
  );
  const unpaidOperatingCost = round(operatingCost - operatingCostPaid, 3);
  const economicNet = round(grossPayout - operatingCost, 3);
  const settlementCurrencyPrecision = currencyDisplayPrecision([
    task.lockedGrossQuote,
    grossPayout,
    operatingCost,
    operatingCostPaid,
    unpaidOperatingCost,
    economicNet,
  ]);
  const settlementCurrency = (amount: number) =>
    formatCurrencyMagnitude(amount, settlementCurrencyPrecision);
  const settlementPrecisionNote =
    settlementCurrencyPrecision === 3
      ? " Amounts use three decimals to preserve sub-cent accounting."
      : "";
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
        next.jobs.operatingCostsPaid + operatingCostPaid,
        3,
      ),
    },
    failedModuleId: failed
      ? firstFailureModule(
          next,
          sample.value * (1 - taskMetrics.reliability + 0.001),
        )
      : null,
    firstSession:
      next.firstSession.step === "observe-settlement" &&
      next.firstSession.starterTaskId === task.id
        ? {
            ...next.firstSession,
            step: "buy-and-install",
            observedSettlementTaskId: task.id,
          }
        : next.firstSession,
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
      message: `${workload.name} task ${task.id} completed; $${settlementCurrency(task.lockedGrossQuote)} gross payout earned before operating cost (locked quote) − $${settlementCurrency(operatingCost)} configured actual cost = ${economicNet >= 0 ? "+" : "−"}$${settlementCurrency(economicNet)} net. ${unpaidOperatingCost > 0 ? `$${settlementCurrency(operatingCostPaid)} was paid and $${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below $0.` : "The configured cost was paid in full."}${settlementPrecisionNote} Future ${workload.name} demand is lower and recovers with simulated time.`,
    });
  } else {
    next = appendEvent(next, {
      kind: "failure",
      message: missingModel
        ? `${workload.name} task ${task.id} failed before delivery: no model stage produced an answer. Locked quote paid $0 gross; configured actual cost was $${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `$${settlementCurrency(operatingCostPaid)} was paid and $${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below $0.` : "The configured cost was paid in full."}${settlementPrecisionNote}`
        : memoryFailure
          ? `${workload.name} task ${task.id} failed before delivery: memory capacity exceeded. Locked quote paid $0 gross; configured actual cost was $${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `$${settlementCurrency(operatingCostPaid)} was paid and $${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below $0.` : "The configured cost was paid in full."}${settlementPrecisionNote}`
          : `${workload.name} task ${task.id} produced unstable output and was rejected. Locked quote paid $0 gross; configured actual cost was $${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `$${settlementCurrency(operatingCostPaid)} was paid and $${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below $0.` : "The configured cost was paid in full."}${settlementPrecisionNote}`,
      directCause: missingModel
        ? "The active pipeline had no model stage."
        : memoryFailure
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
  if (state.career.runEnding) return state;
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
  // See applyCommand: the freshly sealed digest is known-good at this point.
  return isStateStructurallyValid(next) ? next : state;
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

function isCausalEvidenceValid(value: unknown): value is CausalEvidence {
  if (typeof value !== "object" || value === null) return false;
  const evidence = value as CausalEvidence;
  const categories = [
    evidence.directCauses,
    evidence.contributingFactors,
    evidence.correlations,
    evidence.hypotheses,
    evidence.unknowns,
  ];
  return categories.every(
    (items) =>
      Array.isArray(items) &&
      items.length > 0 &&
      items.length <= 4 &&
      items.every((item) => isText(item, 400)) &&
      new Set(items).size === items.length,
  );
}

function isEvaluationStateShapeValid(value: unknown): value is EvaluationState {
  if (typeof value !== "object" || value === null) return false;
  const evaluation = value as EvaluationState;
  const warnings = evaluation.warnings;
  if (typeof warnings !== "object" || warnings === null) return false;
  const warningKeys: readonly EvaluationWarningKey[] = [
    "leakage",
    "reliability",
    "hardware",
    "tutorial",
  ];
  const finiteCounters = [
    evaluation.evaluationSpend,
    evaluation.publicEvaluations,
    evaluation.privateEvaluations,
    evaluation.reliabilityIncidents,
    evaluation.ignoredWarnings,
    evaluation.modelSwitches,
    evaluation.capitalCommitments,
    evaluation.hardwareDebt,
  ];
  return (
    (evaluation.publicScore === null ||
      (Number.isFinite(evaluation.publicScore) &&
        evaluation.publicScore >= 0 &&
        evaluation.publicScore <= 99)) &&
    PRIVATE_ASSESSMENTS.includes(evaluation.privateAssessment) &&
    Number.isFinite(evaluation.coverage) &&
    evaluation.coverage >= 0 &&
    evaluation.coverage <= 1 &&
    Number.isFinite(evaluation.leakageRisk) &&
    evaluation.leakageRisk >= 0 &&
    evaluation.leakageRisk <= 1 &&
    Number.isFinite(evaluation.distributionShiftRisk) &&
    evaluation.distributionShiftRisk >= 0 &&
    evaluation.distributionShiftRisk <= 8 &&
    finiteCounters.every(
      (item) =>
        Number.isFinite(item) && item >= 0 && item <= MAX_EVALUATION_SPEND,
    ) &&
    Number.isSafeInteger(evaluation.publicEvaluations) &&
    Number.isSafeInteger(evaluation.privateEvaluations) &&
    Number.isSafeInteger(evaluation.reliabilityIncidents) &&
    Number.isSafeInteger(evaluation.ignoredWarnings) &&
    Number.isSafeInteger(evaluation.modelSwitches) &&
    Number.isSafeInteger(evaluation.capitalCommitments) &&
    Object.keys(warnings).length === warningKeys.length &&
    warningKeys.every(
      (key) =>
        Number.isSafeInteger(warnings[key]) &&
        warnings[key] >= 0 &&
        warnings[key] <= MAX_EVALUATION_COUNTER,
    )
  );
}

function hasCoherentPrivateEvaluationEvidence(
  evaluation: EvaluationState,
): boolean {
  if (evaluation.privateEvaluations === 0)
    return (
      evaluation.coverage === 0 &&
      evaluation.evaluationSpend === 0 &&
      evaluation.privateAssessment === "not-run"
    );
  const expectedSpend = round(
    evaluation.privateEvaluations * PRIVATE_EVALUATION_COST,
    3,
  );
  const minimumCoverage = Math.min(
    1,
    round(
      evaluation.privateEvaluations * MIN_PRIVATE_EVALUATION_COVERAGE_GAIN,
      3,
    ),
  );
  const maximumCoverage = Math.min(
    1,
    round(
      evaluation.privateEvaluations * MAX_PRIVATE_EVALUATION_COVERAGE_GAIN,
      3,
    ),
  );
  return (
    evaluation.coverage >= minimumCoverage - 0.000_001 &&
    evaluation.coverage <= maximumCoverage + 0.000_001 &&
    Math.abs(evaluation.evaluationSpend - expectedSpend) < 0.000_001 &&
    evaluation.privateAssessment !== "not-run"
  );
}

function isEvaluationStateValid(value: unknown): value is EvaluationState {
  return (
    isEvaluationStateShapeValid(value) &&
    hasCoherentPrivateEvaluationEvidence(value)
  );
}

function evaluationStatesMatch(
  left: EvaluationState,
  right: EvaluationState,
): boolean {
  return (
    left.publicScore === right.publicScore &&
    left.privateAssessment === right.privateAssessment &&
    left.coverage === right.coverage &&
    left.evaluationSpend === right.evaluationSpend &&
    left.publicEvaluations === right.publicEvaluations &&
    left.privateEvaluations === right.privateEvaluations &&
    left.leakageRisk === right.leakageRisk &&
    left.distributionShiftRisk === right.distributionShiftRisk &&
    left.reliabilityIncidents === right.reliabilityIncidents &&
    left.ignoredWarnings === right.ignoredWarnings &&
    left.modelSwitches === right.modelSwitches &&
    left.capitalCommitments === right.capitalCommitments &&
    left.hardwareDebt === right.hardwareDebt &&
    left.warnings.leakage === right.warnings.leakage &&
    left.warnings.reliability === right.warnings.reliability &&
    left.warnings.hardware === right.warnings.hardware &&
    left.warnings.tutorial === right.warnings.tutorial
  );
}

function isCausalEvidenceSnapshotShapeValid(
  value: unknown,
): value is CausalEvidenceSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const snapshot = value as CausalEvidenceSnapshot;
  return (
    Number.isSafeInteger(snapshot.eventSequence) &&
    snapshot.eventSequence >= 0 &&
    isEvaluationStateValid(snapshot.evaluation)
  );
}

function hasCoherentCausalEvidenceSnapshot(
  state: Pick<
    SimulationState,
    "career" | "causalEvidenceSnapshot" | "eventSequence"
  >,
): boolean {
  const snapshot = state.causalEvidenceSnapshot;
  return (
    isCausalEvidenceSnapshotShapeValid(snapshot) &&
    snapshot.eventSequence === state.eventSequence &&
    evaluationStatesMatch(snapshot.evaluation, state.career.evaluation)
  );
}

const warningLedgerPrefixes: Readonly<
  Record<EvaluationWarningKey, readonly string[]>
> = {
  leakage: ["Leakage warning"],
  reliability: ["Distribution-shift warning", "Reliability warning"],
  hardware: ["Hardware commitment warning"],
  tutorial: ["Tutorial-loop warning"],
};

function hasRetainedCausalLedgerEvidence(
  state: Pick<SimulationState, "career" | "eventSequence" | "ledger">,
): boolean {
  const { evaluation } = state.career;
  const { ledger } = state;

  // Complete retained history can independently verify causal counters. Once
  // the bounded window has evicted an event, restoration must instead rely on
  // the integrity-sealed causal checkpoint; a full ledger is not evidence by
  // itself.
  if (state.eventSequence > MAX_LEDGER_EVENTS) return false;
  if (ledger.length !== state.eventSequence) return false;

  const ignoredWarningEvents = ledger.filter(
    (event) =>
      event.kind === "warning" &&
      event.message.startsWith("Ignored ") &&
      event.directCause !== undefined &&
      event.contributingCondition !== undefined,
  ).length;
  if (evaluation.ignoredWarnings > ignoredWarningEvents) return false;

  for (const warning of Object.keys(
    warningLedgerPrefixes,
  ) as EvaluationWarningKey[]) {
    const evidence = ledger.filter(
      (event) =>
        event.kind === "warning" &&
        warningLedgerPrefixes[warning].some((prefix) =>
          event.message.startsWith(prefix),
        ),
    ).length;
    if (evaluation.warnings[warning] > evidence) return false;
  }

  const modelSwitchEvents = ledger.filter(
    (event) =>
      event.kind === "info" &&
      (/^Q[48] selected:/.test(event.message) ||
        event.message.endsWith(
          "selected. Its memory, throughput, quality, reliability, and nightly operating tradeoffs now apply to model stages.",
        )),
  ).length;
  if (evaluation.modelSwitches > modelSwitchEvents) return false;

  const capitalCommitmentEvents = ledger.filter(
    (event) =>
      event.kind === "success" && event.message.includes(" purchased for $"),
  ).length;
  if (evaluation.capitalCommitments > capitalCommitmentEvents) return false;

  const reliabilityIncidentEvents = ledger.filter(
    (event) =>
      event.kind === "failure" &&
      event.message.startsWith(
        "Distribution-shift reliability incident recorded",
      ),
  ).length;
  if (evaluation.reliabilityIncidents > reliabilityIncidentEvents) return false;

  return true;
}

function isMetaProgressionValid(value: unknown): value is MetaProgression {
  if (typeof value !== "object" || value === null) return false;
  const meta = value as MetaProgression;
  return (
    Array.isArray(meta.unlockedDiagnosticIds) &&
    meta.unlockedDiagnosticIds.length <= DIAGNOSTIC_UNLOCK_IDS.length &&
    meta.unlockedDiagnosticIds.every((id) =>
      DIAGNOSTIC_UNLOCK_IDS.includes(id),
    ) &&
    new Set(meta.unlockedDiagnosticIds).size ===
      meta.unlockedDiagnosticIds.length &&
    Array.isArray(meta.completedEndingIds) &&
    meta.completedEndingIds.length <= RUN_ENDING_IDS.length &&
    meta.completedEndingIds.every((id) => RUN_ENDING_IDS.includes(id)) &&
    new Set(meta.completedEndingIds).size === meta.completedEndingIds.length &&
    Number.isSafeInteger(meta.replayCount) &&
    meta.replayCount >= 0 &&
    meta.replayCount <= MAX_META_REPLAYS
  );
}

function isRunEndingValid(
  value: unknown,
  ledger: readonly LedgerEvent[],
  tick: number,
): value is RunEnding | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const ending = value as RunEnding;
  const detail = RUN_ENDING_IDS.includes(ending.id)
    ? ENDING_DETAILS[ending.id]
    : undefined;
  const event = ledger.find((entry) => entry.id === ending.eventId);
  return (
    detail !== undefined &&
    ending.title === detail.title &&
    ending.outcome === detail.outcome &&
    ending.diagnosticUnlockId === detail.diagnosticUnlockId &&
    isText(ending.eventId, 128) &&
    ending.eventId.length > 0 &&
    Number.isSafeInteger(ending.reachedAtTick) &&
    ending.reachedAtTick >= 0 &&
    ending.reachedAtTick <= tick &&
    event !== undefined &&
    event.tick === ending.reachedAtTick &&
    event.causal !== undefined &&
    isCausalEvidenceValid(event.causal)
  );
}

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

function isCareerStateValid(value: unknown): value is CareerState {
  if (typeof value !== "object" || value === null) return false;
  const career = value as CareerState;
  try {
    const schedule = career.schedule;
    const allocations = schedule.allocations;
    const allocationKeys = Object.keys(allocations);
    const allocationTotal = CAREER_ROUTES.reduce(
      (total, route) => total + allocations[route],
      0,
    );
    const nonnegative = [
      career.savings,
      career.electricityCostsIncurred,
      career.operatingCostsIncurred,
      career.costsPaid,
      career.unpaidCosts,
      career.freelanceHours,
      career.freelanceGross,
      career.competition.progress,
      career.competition.bestScore,
      career.competition.overfitRisk,
      career.competition.lifetimePrizeMoney,
      career.product.buildProgress,
      career.product.serviceDebt,
      career.product.lifetimeRevenue,
      career.product.maintenanceHours,
    ];
    const report = career.offlinePolicy.lastReport;
    const reportValid =
      report === null ||
      (typeof report === "object" &&
        report.route === "freelance" &&
        [
          report.requestedHours,
          report.appliedHours,
          report.gross,
          report.configuredCost,
        ].every((number) => Number.isFinite(number) && number >= 0) &&
        report.appliedHours <= EVENING_HOURS &&
        isText(report.stoppedReason, 160));
    return (
      Number.isSafeInteger(schedule.day) &&
      schedule.day >= 1 &&
      schedule.hoursAvailable === EVENING_HOURS &&
      Number.isFinite(schedule.hoursRemaining) &&
      schedule.hoursRemaining >= 0 &&
      schedule.hoursRemaining <= EVENING_HOURS &&
      Number.isSafeInteger(schedule.completedEvenings) &&
      schedule.completedEvenings >= 0 &&
      allocationKeys.length === CAREER_ROUTES.length &&
      CAREER_ROUTES.every(
        (route) =>
          Number.isFinite(allocations[route]) &&
          allocations[route] >= 0 &&
          allocations[route] <= EVENING_HOURS &&
          isQuarterHour(allocations[route]),
      ) &&
      allocationTotal <= EVENING_HOURS + 0.000_001 &&
      Math.abs(schedule.hoursRemaining - (EVENING_HOURS - allocationTotal)) <
        0.000_001 &&
      nonnegative.every((number) => Number.isFinite(number) && number >= 0) &&
      career.competition.id === "bedroom-benchmark-cup" &&
      isText(career.competition.name, 80) &&
      Number.isSafeInteger(career.competition.submissions) &&
      career.competition.submissions >= 0 &&
      typeof career.competition.prizeClaimed === "boolean" &&
      career.product.id === "deskflow-local" &&
      isText(career.product.name, 80) &&
      typeof career.product.released === "boolean" &&
      Number.isSafeInteger(career.product.releases) &&
      career.product.releases >= 0 &&
      Array.isArray(career.unlockedModelTierIds) &&
      career.unlockedModelTierIds.includes(localModelTiers[0]!.id) &&
      career.unlockedModelTierIds.every((id) => findLocalModelTier(id)) &&
      new Set(career.unlockedModelTierIds).size ===
        career.unlockedModelTierIds.length &&
      career.unlockedModelTierIds.includes(career.activeModelTierId) &&
      QUANTIZATION_PROFILES.includes(career.quantization) &&
      typeof career.offlinePolicy.enabled === "boolean" &&
      career.offlinePolicy.route === "freelance" &&
      Number.isFinite(career.offlinePolicy.maxHours) &&
      career.offlinePolicy.maxHours >= 0 &&
      career.offlinePolicy.maxHours <= MAX_OFFLINE_HOURS &&
      isQuarterHour(career.offlinePolicy.maxHours) &&
      Number.isFinite(career.offlinePolicy.maxElectricityCost) &&
      career.offlinePolicy.maxElectricityCost >= 0 &&
      career.offlinePolicy.maxElectricityCost <= 5 &&
      Number.isFinite(career.offlinePolicy.maxOperatingCost) &&
      career.offlinePolicy.maxOperatingCost >= 0 &&
      career.offlinePolicy.maxOperatingCost <= 5 &&
      Number.isFinite(career.offlinePolicy.minReliability) &&
      career.offlinePolicy.minReliability >= 0.7 &&
      career.offlinePolicy.minReliability <= 0.999 &&
      reportValid &&
      typeof career.exitAchieved === "boolean" &&
      (!career.exitAchieved || careerExitSatisfied(career)) &&
      isEvaluationStateValid(career.evaluation) &&
      (career.runEnding === null ||
        (typeof career.runEnding === "object" && career.runEnding !== null))
    );
  } catch {
    return false;
  }
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
      (state.causalEvidenceSnapshot === undefined ||
        isCausalEvidenceSnapshotShapeValid(state.causalEvidenceSnapshot)) &&
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
      isCareerStateValid(state.career) &&
      isMetaProgressionValid(state.meta) &&
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
      hasCoherentFirstSessionProgress(state) &&
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
            isText(event.contributingCondition, 800)) &&
          (event.causal === undefined || isCausalEvidenceValid(event.causal)),
      ) &&
      state.eventSequence >= state.ledger.length &&
      new Set(eventIds).size === eventIds.length &&
      isRunEndingValid(state.career.runEnding, state.ledger, state.tick) &&
      (state.career.runEnding === null ||
        (state.meta.unlockedDiagnosticIds.includes(
          state.career.runEnding.diagnosticUnlockId,
        ) &&
          state.meta.completedEndingIds.includes(state.career.runEnding.id)))
    );
  } catch {
    return false;
  }
}

export function isStateValid(state: SimulationState): boolean {
  return (
    isStateStructurallyValid(state) &&
    hasCoherentCausalEvidenceSnapshot(state) &&
    hasValidStateIntegrity(state)
  );
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

/** Restores current saves or migrates legacy Pipeline Toy/Career saves safely. */
export function restoreSimulationState(
  value: unknown,
  fallbackSeed = 20260715,
): SimulationState {
  const fallback = createInitialState(fallbackSeed);
  if (typeof value !== "object" || value === null) return fallback;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion === SCHEMA_VERSION) {
    const storedFirstSession = record.firstSession;
    if (
      storedFirstSession !== undefined &&
      !isFirstSessionProgressValid(storedFirstSession)
    )
      return fallback;
    const originalIntegrityValid =
      isIntegrityShapeValid(record.integrity) &&
      hasValidStateIntegrity(record as unknown as SimulationState);
    let migration = isMigrationMetadataValid(record.migration)
      ? record.migration
      : {
          sourceSchemaVersion: SCHEMA_VERSION,
          steps: ["schema-v7-metadata-added"],
        };
    let candidate = {
      ...record,
      firstSession: storedFirstSession ?? legacyFirstSessionProgress(),
      migration,
      integrity: isIntegrityShapeValid(record.integrity)
        ? record.integrity
        : EMPTY_INTEGRITY,
    } as unknown as SimulationState;
    if (storedFirstSession === undefined)
      migration = withMigrationStep(
        migration,
        "schema-v7-first-session-guide-added",
      );
    const structurallyValid = isStateStructurallyValid(candidate);
    if (
      storedFirstSession !== undefined &&
      !originalIntegrityValid &&
      structurallyValid &&
      !hasSafeUnsealedFirstSessionProgress(candidate)
    )
      return fallback;
    const career =
      typeof candidate.career === "object" && candidate.career !== null
        ? candidate.career
        : null;
    const evaluation = career?.evaluation;
    const evaluationEvidenceInvalid =
      isEvaluationStateShapeValid(evaluation) &&
      !isEvaluationStateValid(evaluation);
    const hasRetainedCausalEvidence =
      structurallyValid && hasRetainedCausalLedgerEvidence(candidate);
    const hasCoherentCausalSnapshot =
      structurallyValid && hasCoherentCausalEvidenceSnapshot(candidate);
    const hasTrustedCausalSnapshot =
      candidate.causalEvidenceSnapshot !== undefined &&
      originalIntegrityValid &&
      hasCoherentCausalSnapshot;
    // Schema-7 saves written before causal checkpoints can still prove their
    // bounded history through their original integrity seal. The first restore
    // upgrades that proof into an explicit checkpoint.
    const hasTrustedLegacyCausalHistory =
      candidate.causalEvidenceSnapshot === undefined &&
      originalIntegrityValid &&
      structurallyValid;
    const causalEvidenceInvalid =
      structurallyValid &&
      !hasRetainedCausalEvidence &&
      !hasTrustedCausalSnapshot &&
      !hasTrustedLegacyCausalHistory;
    if (!structurallyValid || causalEvidenceInvalid) {
      if (
        career === null ||
        !isEvaluationStateShapeValid(evaluation) ||
        (!evaluationEvidenceInvalid && !causalEvidenceInvalid)
      )
        return fallback;

      const invalidEnding = causalEvidenceInvalid ? career.runEnding : null;
      candidate = {
        ...candidate,
        meta:
          invalidEnding !== null
            ? {
                ...candidate.meta,
                completedEndingIds: candidate.meta.completedEndingIds.filter(
                  (id) => id !== invalidEnding.id,
                ),
                unlockedDiagnosticIds:
                  candidate.meta.unlockedDiagnosticIds.filter(
                    (id) => id !== invalidEnding.diagnosticUnlockId,
                  ),
              }
            : candidate.meta,
        career: {
          ...career,
          evaluation: createInitialEvaluationState(),
          runEnding: invalidEnding === null ? career.runEnding : null,
        },
      };
      candidate = {
        ...candidate,
        causalEvidenceSnapshot: createCausalEvidenceSnapshot(candidate),
      };
      if (evaluationEvidenceInvalid)
        migration = withMigrationStep(
          migration,
          "schema-v7-evaluation-evidence-repaired",
        );
      if (causalEvidenceInvalid)
        migration = withMigrationStep(
          migration,
          "schema-v7-causal-ledger-repaired",
        );
      if (
        !isStateStructurallyValid(candidate) ||
        !hasCoherentCausalEvidenceSnapshot(candidate)
      )
        return fallback;
    } else if (candidate.causalEvidenceSnapshot === undefined) {
      candidate = {
        ...candidate,
        causalEvidenceSnapshot: createCausalEvidenceSnapshot(candidate),
      };
      migration = withMigrationStep(
        migration,
        "schema-v7-causal-snapshot-added",
      );
    } else if (!hasCoherentCausalSnapshot) {
      // Complete retained history independently proves this non-saturated
      // evaluation, so rebuild only its stale checkpoint before resealing.
      candidate = {
        ...candidate,
        causalEvidenceSnapshot: createCausalEvidenceSnapshot(candidate),
      };
      migration = withMigrationStep(
        migration,
        "schema-v7-causal-snapshot-rebuilt",
      );
    }
    if (!isIntegrityShapeValid(record.integrity))
      migration = withMigrationStep(migration, "integrity-added");
    else if (!originalIntegrityValid)
      migration = withMigrationStep(migration, "integrity-resealed");
    const restored = sealSimulationState(
      recalculate({ ...candidate, migration }),
    );
    return isStateValid(restored) ? restored : fallback;
  }
  if (record.schemaVersion === 6) {
    const inheritedMigration = isMigrationMetadataValid(record.migration)
      ? record.migration
      : { sourceSchemaVersion: 6, steps: [] };
    let migration = withMigrationStep(
      inheritedMigration,
      "schema-6-to-7-evaluation-replay",
    );
    migration = withMigrationStep(
      migration,
      "schema-v7-first-session-guide-added",
    );
    const legacyCareer =
      typeof record.career === "object" && record.career !== null
        ? (record.career as Record<string, unknown>)
        : {};
    const candidate = {
      ...record,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      migration,
      integrity: EMPTY_INTEGRITY,
      firstSession: legacyFirstSessionProgress(),
      career: {
        ...legacyCareer,
        evaluation: createInitialEvaluationState(),
        runEnding: null,
      },
      meta: createInitialMetaProgression(),
    } as unknown as SimulationState;
    if (!isStateStructurallyValid(candidate)) return fallback;
    const migrated = sealSimulationState(recalculate(candidate));
    return isStateValid(migrated) ? migrated : fallback;
  }
  if (record.schemaVersion === 5) {
    const inheritedMigration = isMigrationMetadataValid(record.migration)
      ? record.migration
      : { sourceSchemaVersion: 5, steps: [] };
    let migration = withMigrationStep(
      inheritedMigration,
      "schema-5-to-6-bedroom-career",
    );
    migration = withMigrationStep(migration, "schema-6-to-7-evaluation-replay");
    migration = withMigrationStep(
      migration,
      "schema-v7-first-session-guide-added",
    );
    const candidate = {
      ...record,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      migration,
      integrity: EMPTY_INTEGRITY,
      firstSession: legacyFirstSessionProgress(),
      career: createInitialCareerState(),
      meta: createInitialMetaProgression(),
    } as unknown as SimulationState;
    if (!isStateStructurallyValid(candidate)) return fallback;
    const migrated = sealSimulationState(recalculate(candidate));
    return isStateValid(migrated) ? migrated : fallback;
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
      steps: [
        `schema-${legacySchema}-to-6-bedroom-career`,
        "schema-6-to-7-evaluation-replay",
        "schema-v7-first-session-guide-added",
      ],
    },
    firstSession: legacyFirstSessionProgress(),
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
