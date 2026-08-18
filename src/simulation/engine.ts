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
import { findResearcher, findResearchProject } from "./researchCatalog";
import {
  creatorCoverageFit,
  findCreator,
  findNarrativeTemplate,
  findTool,
  narrativeTemplates,
} from "./hypeFearCatalog";
import {
  appendDoomFeed,
  createInitialHypeFearState,
  createNarrativeInstance,
  hypeFearRecognition,
  isHypeFearStateShapeValid,
  resolveNarrative,
  MAX_ATTENTION,
  MAX_EXPECTATION_DEBT,
  MAX_FEAR,
  MAX_TOOL_SWITCHING_PANIC,
  type HypeFearContext,
} from "./hypeFear";
import {
  createInitialResearchState,
  isResearchStateShapeValid,
  MAX_FIRST_PRINCIPLES_USES,
  researchEstimate,
  researchInspectReveals,
  researchProjectRequirements,
  researchRecognition,
  researchTeamChemistry,
  resolveResearchOutcome,
  type ResearchContext,
} from "./research";
import {
  createInitialLaboratoryState,
  isLaboratoryStateShapeValid,
  laboratoryEntryReadiness,
  laboratoryReproducibilityScore,
  laboratoryRunDuration,
  laboratoryRunOutcome,
  laboratoryScenarioUnlocks,
  laboratoryPipelineReadiness,
  refreshLaboratoryScore,
  chooseLaboratoryEnding,
} from "./laboratory";
import {
  findLaboratoryCulture,
  findLaboratoryMachine,
  findLaboratoryPipeline,
  findLaboratoryScenario,
} from "./laboratoryCatalog";
import {
  CONTENT_VERSION,
  PREVIOUS_CONTENT_VERSION,
  SAVE_INTEGRITY_ALGORITHM,
  SCHEMA_VERSION,
  type CausalEvidence,
  type CausalEvidenceSnapshot,
  type DiagnosticUnlockId,
  type EvaluationState,
  type FirstSessionProgress,
  type FirstSessionStep,
  isJobSettlementFailureCause,
  JOB_SETTLEMENT_FAILURE_CAUSE_TEXT,
  type JobSettlementFailureCause,
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
  type ResearchState,
  type SaveIntegrity,
  type SaveRecoveryStatus,
  type SimulationCommand,
  type SimulationState,
  type UpgradeNotice,
  type WorkloadDemandState,
  type WorkloadQuote,
  type AudienceId,
  type FearResponseId,
  type HypeFearState,
  type NarrativeInstance,
  type NarrativePrediction,
  type NarrativeResponseId,
  type ToolId,
} from "./types";
import { formatCurrency, formatExactCurrency } from "./currency";
import {
  allocateNextLedgerEvent,
  canonicalizeLedgerEventIds,
} from "./ledgerIdentity";
import { findSupportedSaveGeneration } from "./saveSupport";

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
export const PRIVATE_EVALUATION_COST = 0.75;
export const BEDROOM_EXIT_SAVINGS_REQUIRED = 24;
const MIN_PRIVATE_EVALUATION_COVERAGE_GAIN = 0.25;
const MAX_PRIVATE_EVALUATION_COVERAGE_GAIN = 0.5;
const MAX_EVALUATION_SPEND = 10_000;
const MAX_EVALUATION_COUNTER = 10_000;
const MAX_META_REPLAYS = 1_000_000;
const LEGACY_CONTENT_VERSION = "evaluation-replay-1";
const EARLIER_CONTENT_VERSION = "research-1";
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
  "viral-support-catastrophe",
  "maintainer-exhaustion",
  "panic-business",
  "invisible-laboratory",
  "honest-foundation",
];
export const SIMULATION_TIME_SCALE = 70;

export function getSimulationAgeHours(
  state: Pick<SimulationState, "tick">,
): number {
  return (state.tick * SIMULATION_TIME_SCALE) / 3_600_000;
}

function researchContext(state: SimulationState): ResearchContext {
  return {
    seed: state.seed,
    jobsCompleted: state.jobs.completed,
    reputation: state.resources.reputation,
    privateCoverage: state.career.evaluation.coverage,
    competitionSubmissions: state.career.competition.submissions,
    productReleased: state.career.product.released,
  };
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
 * An intact save seal is authoritative historical evidence that the player
 * explicitly installed the recorded module. A damaged current save has no
 * such proof, so its completed guide needs the live topology as corroboration
 * before recovery may retain the Queue 10 boundary relaxation.
 */
function hasInstalledFirstSessionPurchase(state: SimulationState): boolean {
  const progress = state.firstSession;
  const purchasedModule = progress.purchasedModuleId
    ? findModule(progress.purchasedModuleId)
    : undefined;
  return (
    progress.step === "complete" &&
    purchasedModule !== undefined &&
    purchasedModule.purchaseCost > 0 &&
    state.ownedModuleIds.includes(purchasedModule.id) &&
    state.slots.some((slot) => slot.moduleId === purchasedModule.id)
  );
}

/**
 * The purchase event is the durable accounting record emitted by BUY_MODULE.
 * Keep its text in one place: stale-save recovery must verify the same exact
 * event that the command boundary writes, rather than infer a purchase from
 * current cash, inventory, or a module's position in the pipeline.
 */
function modulePurchaseLedgerMessage(
  moduleId: string,
  formatMoney: (amount: number) => string = formatExactCurrency,
): string | null {
  const item = findModule(moduleId);
  if (!item || item.purchaseCost <= 0) return null;
  return `${item.name} purchased for ${formatMoney(item.purchaseCost)} and is now owned. Add it to a compatible ${item.slotTypes.join("/")} slot in Build; purchase deducted exactly once.`;
}

function hasRecordedFirstSessionPurchase(state: SimulationState): boolean {
  const purchasedModuleId = state.firstSession.purchasedModuleId;
  if (!purchasedModuleId) return false;
  const item = findModule(purchasedModuleId);
  if (!item) return false;
  const messages = [
    modulePurchaseLedgerMessage(purchasedModuleId),
    // Existing saved purchase evidence predates exact ledger presentation.
    // Keep it as valid provenance during safe stale-save recovery; new events
    // always use the fixed-three default above.
    modulePurchaseLedgerMessage(purchasedModuleId, (amount) =>
      formatCurrency(amount, 2),
    ),
  ].filter((message): message is string => message !== null);
  return hasRecordedCapitalPurchase(state, {
    id: item.id,
    kind: "module",
    cost: item.purchaseCost,
    messages,
  });
}

function hasRecordedCapitalPurchase(
  state: Pick<SimulationState, "ledger">,
  purchase: {
    id: string;
    kind: "hardware" | "module" | "expansion";
    cost: number;
    messages: readonly (string | null)[];
  },
): boolean {
  const exactMessages = purchase.messages.filter(
    (message): message is string => message !== null,
  );
  return state.ledger.some(
    (event) =>
      event.kind === "success" &&
      exactMessages.includes(event.message) &&
      (event.capitalPurchaseId === undefined
        ? event.capitalPurchaseType === undefined &&
          event.capitalPurchaseCost === undefined
        : event.capitalPurchaseId === purchase.id &&
          event.capitalPurchaseType === purchase.kind &&
          event.capitalPurchaseCost === purchase.cost),
  );
}

function isCapitalPurchaseLedgerEvidence(event: LedgerEvent): boolean {
  if (event.kind !== "success") return false;
  if (
    event.capitalPurchaseId === undefined &&
    event.capitalPurchaseType === undefined &&
    event.capitalPurchaseCost === undefined
  )
    return EXACT_CAPITAL_PURCHASE_LEDGER_MESSAGES.has(event.message);
  if (
    event.capitalPurchaseId === undefined ||
    event.capitalPurchaseType === undefined ||
    event.capitalPurchaseCost === undefined
  )
    return false;
  if (
    event.capitalPurchaseType !== "hardware" &&
    event.capitalPurchaseType !== "module" &&
    event.capitalPurchaseType !== "expansion"
  )
    return false;
  const item =
    event.capitalPurchaseType === "hardware"
      ? findHardware(event.capitalPurchaseId)
      : event.capitalPurchaseType === "module"
        ? findModule(event.capitalPurchaseId)
        : findPipelineExpansion(event.capitalPurchaseId);
  if (!item || item.purchaseCost !== event.capitalPurchaseCost) return false;
  const messages =
    event.capitalPurchaseType === "hardware"
      ? [hardwarePurchaseLedgerMessage(item.id)]
      : event.capitalPurchaseType === "module"
        ? [
            modulePurchaseLedgerMessage(item.id),
            modulePurchaseLedgerMessage(item.id, (amount) =>
              formatCurrency(amount, 2),
            ),
          ]
        : [expansionPurchaseLedgerMessage(item.id)];
  return messages.includes(event.message);
}

function hardwarePurchaseLedgerMessage(hardwareId: string): string | null {
  const item = findHardware(hardwareId);
  if (!item || item.purchaseCost <= 0) return null;
  return `${item.name} purchased for ${formatExactCurrency(item.purchaseCost)} and is now owned. Equip it to apply its constraints; purchase deducted exactly once.`;
}

function expansionPurchaseLedgerMessage(expansionId: string): string | null {
  const item = findPipelineExpansion(expansionId);
  if (!item || item.purchaseCost <= 0) return null;
  return `${item.name} purchased for ${formatExactCurrency(item.purchaseCost)} and is now owned. Activate it explicitly; its three new positions start empty and no module was bought or filled automatically.`;
}

function expansionActivationLedgerMessage(expansionId: string): string | null {
  const item = findPipelineExpansion(expansionId);
  if (!item || item.purchaseCost <= 0) return null;
  return `${item.name} activated: six usable process positions in one ordered pipeline. Three new positions are empty/bypassed.`;
}

function allExactCapitalPurchaseLedgerMessages(): readonly string[] {
  const messages: string[] = [];
  for (const item of hardware) {
    const message = hardwarePurchaseLedgerMessage(item.id);
    if (message) messages.push(message);
  }
  for (const item of modules) {
    const current = modulePurchaseLedgerMessage(item.id);
    const legacy = modulePurchaseLedgerMessage(item.id, (amount) =>
      formatCurrency(amount, 2),
    );
    if (current) messages.push(current);
    if (legacy) messages.push(legacy);
  }
  for (const item of pipelineExpansions) {
    const message = expansionPurchaseLedgerMessage(item.id);
    if (message) messages.push(message);
  }
  return messages;
}

const EXACT_CAPITAL_PURCHASE_LEDGER_MESSAGES = new Set(
  allExactCapitalPurchaseLedgerMessages(),
);

function hasExactSuccessLedgerMessage(
  state: Pick<SimulationState, "ledger">,
  message: string | null,
  expansionId?: string,
): boolean {
  return (
    message !== null &&
    state.ledger.some(
      (event) =>
        event.kind === "success" &&
        event.message === message &&
        (expansionId === undefined
          ? event.expansionActivationId === undefined
          : event.expansionActivationId === undefined ||
            event.expansionActivationId === expansionId),
    )
  );
}

/**
 * Settlement events retain the accepted task ID, unlike lastSettlement, which
 * intentionally advances as later work completes. A damaged save may use this
 * bounded historical record to repair the starter rail only while that record
 * is still retained; an intact integrity seal remains authoritative once old
 * ledger events roll out of the window.
 */
function hasRecordedStarterSettlement(
  state: SimulationState,
  starterTaskId: string | null,
): boolean {
  if (!starterTaskId) return false;
  return state.ledger.some(
    (event) =>
      event.settlementTaskId === starterTaskId &&
      event.settlementWorkloadId === "interactive-chat" &&
      (event.kind === "success" || event.kind === "failure") &&
      isSettlementLedgerPayloadValid(event),
  );
}

/**
 * A current save with a broken integrity seal may be repaired and resealed for
 * benign persistence damage, but it must not manufacture progress past the
 * starter rail. Advanced guide stages need retained command/accounting records
 * for both the starter settlement and any paid first module before repair can
 * retain that progress. Current inventory, topology, and lastSettlement alone
 * are all mutable snapshots, not proof that those commands happened.
 */
function hasSafeUnsealedFirstSessionProgress(state: SimulationState): boolean {
  if (!hasCoherentFirstSessionProgress(state)) return false;
  const progress = state.firstSession;
  if (
    progress.step === "queue-starter" ||
    progress.step === "observe-settlement"
  )
    return true;
  const hasStarterSettlement =
    state.firstSession.starterTaskId !== null &&
    state.firstSession.observedSettlementTaskId ===
      state.firstSession.starterTaskId &&
    hasRecordedStarterSettlement(state, state.firstSession.starterTaskId);
  if (!hasStarterSettlement) return false;
  if (
    state.firstSession.purchasedModuleId !== null &&
    !hasRecordedFirstSessionPurchase(state)
  )
    return false;
  return (
    progress.step !== "complete" || hasInstalledFirstSessionPurchase(state)
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
    text?: unknown;
    projectId?: unknown;
    researcherId?: unknown;
    researcherIds?: unknown;
    narrativeId?: unknown;
    creatorId?: unknown;
    prediction?: unknown;
    confidence?: unknown;
    response?: unknown;
    toolId?: unknown;
    machineId?: unknown;
    pipelineId?: unknown;
    field?: unknown;
    cultureId?: unknown;
    scenarioId?: unknown;
    decision?: unknown;
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
    case "SET_RESEARCH_GOAL":
      return typeof input.text === "string";
    case "SET_RESEARCH_COMPUTE_ALLOCATION":
      return isFiniteNumber(input.percent);
    case "INSPECT_RESEARCH_PROJECT":
    case "START_RESEARCH":
      return typeof input.projectId === "string";
    case "RECRUIT_RESEARCHER":
    case "RELEASE_RESEARCHER":
      return typeof input.researcherId === "string";
    case "SET_RESEARCH_TEAM":
      return (
        Array.isArray(input.researcherIds) &&
        input.researcherIds.every((id) => typeof id === "string")
      );
    case "FIRST_PRINCIPLES_RECONSTRUCTION":
      return true;
    case "COVER_NARRATIVE":
      return (
        typeof input.narrativeId === "string" &&
        typeof input.creatorId === "string"
      );
    case "PUBLISH_PREDICTION":
      return (
        typeof input.narrativeId === "string" &&
        ["lands", "partial", "delayed"].includes(input.prediction as string) &&
        isFiniteNumber(input.confidence)
      );
    case "RESPOND_TO_NARRATIVE":
      return [
        "publish-evidence",
        "acknowledge-uncertainty",
        "double-down",
        "go-quiet",
      ].includes(input.response as string);
    case "RESPOND_TO_FEAR":
      return [
        "stabilize",
        "publish-boundaries",
        "pause-and-measure",
        "switch-tool",
      ].includes(input.response as string);
    case "SWITCH_TOOL":
      return [
        "stable-local-stack",
        "fast-new-runtime",
        "evidence-first-stack",
      ].includes(input.toolId as string);
    case "BUY_LAB_MACHINE":
      return typeof input.machineId === "string";
    case "ADD_LAB_PIPELINE":
      return typeof input.pipelineId === "string";
    case "ASSIGN_LAB_MACHINE":
      return (
        typeof input.pipelineId === "string" &&
        typeof input.machineId === "string"
      );
    case "INVITE_LAB_COLLABORATOR":
      return typeof input.researcherId === "string";
    case "SET_LAB_REPRODUCIBILITY":
      return (
        ["versionedConfigs", "lockedSeeds", "independentEvaluation"].includes(
          input.field as string,
        ) && typeof input.enabled === "boolean"
      );
    case "DOCUMENT_LAB_RUN":
      return true;
    case "SET_LAB_CULTURE":
      return ["evidence-first", "open-methods", "craft-and-care"].includes(
        input.cultureId as string,
      );
    case "SELECT_LAB_SCENARIO":
      return [
        "limited-hardware",
        "academic-collaboration",
        "creator-attention",
        "high-public-fear",
        "weak-economy",
        "expensive-electricity",
      ].includes(input.scenarioId as string);
    case "QUEUE_LAB_RUN":
      return (
        typeof input.pipelineId === "string" &&
        (input.count === undefined || isFiniteNumber(input.count))
      );
    case "FOUND_LAB":
      return [
        "independent-laboratory",
        "open-research-collective",
        "larger-organization-collaboration",
      ].includes(input.decision as string);
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
  const allocation = allocateNextLedgerEvent(state);
  // Callers may already have prepared a candidate state before appending its
  // audit event. Preserve the transactional boundary by making an exhausted
  // allocation structurally invalid, so the outer apply/tick returns its
  // original state instead of committing an unaudited mutation.
  if (!allocation)
    return { ...state, eventSequence: Number.MAX_SAFE_INTEGER + 1 };
  const ledger = [
    ...state.ledger,
    {
      ...event,
      id: allocation.id,
      tick: state.tick,
    },
  ].slice(-MAX_LEDGER_EVENTS);
  return { ...state, eventSequence: allocation.eventSequence, ledger };
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
  "viral-support-catastrophe": {
    title: "Viral Support Catastrophe",
    outcome: "failure",
    diagnosticUnlockId: "shift-monitor",
    nextRunResponse:
      "Keep a parallel delivery route bounded while public attention grows; do not promise support capacity that the lab cannot evidence.",
  },
  "maintainer-exhaustion": {
    title: "Maintainer Exhaustion",
    outcome: "failure",
    diagnosticUnlockId: "decision-history",
    nextRunResponse:
      "Document the method before opening the collective, and make collaboration reduce hero dependency rather than multiply coordination debt.",
  },
  "panic-business": {
    title: "Panic Business",
    outcome: "failure",
    diagnosticUnlockId: "leakage-warning",
    nextRunResponse:
      "Treat fear and tool-switching panic as evidence; negotiate a bounded collaboration instead of trading away the lab's method under pressure.",
  },
  "invisible-laboratory": {
    title: "Invisible Laboratory",
    outcome: "failure",
    diagnosticUnlockId: "bottleneck-map",
    nextRunResponse:
      "Retain a collaborator, run independent checks, and make the evidence trail visible before choosing a founding path.",
  },
  "honest-foundation": {
    title: "Honest Foundation",
    outcome: "success",
    diagnosticUnlockId: "confidence-intervals",
    nextRunResponse:
      "Carry the lab's bounded methods forward: preserve seeds, publish uncertainty, and keep a route for useful delivery alongside research.",
  },
};

function endingLedgerMessage(endingId: RunEndingId): string {
  return `Run ended: ${ENDING_DETAILS[endingId].title}. Review the evidence-backed postmortem in Career or Inspect before restarting.`;
}

function causalEvidenceMatches(
  left: CausalEvidence | undefined,
  right: CausalEvidence,
): boolean {
  return left !== undefined && JSON.stringify(left) === JSON.stringify(right);
}

/**
 * A stale ending is retained only when the retained event still carries the
 * exact engine message and the causal payload recomputes from the same state.
 * Allowed IDs and a shape-valid event are not enough: they permit swapping a
 * different ending identity onto an unrelated causal event.
 */
function hasMatchingEndingEvidence(
  state: SimulationState,
  ending: RunEnding | null,
): boolean {
  if (ending === null) return false;
  const detail = ENDING_DETAILS[ending.id];
  const event = state.ledger.find((entry) => entry.id === ending.eventId);
  return (
    event !== undefined &&
    event.kind === (detail.outcome === "success" ? "success" : "failure") &&
    event.message === endingLedgerMessage(ending.id) &&
    event.tick === ending.reachedAtTick &&
    causalEvidenceMatches(event.causal, endingCausalEvidence(state, ending.id))
  );
}

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
    case "viral-support-catastrophe":
      return {
        directCauses: [
          "The laboratory chose a public route while failed parallel runs outnumbered completed runs under support-heavy demand.",
        ],
        contributingFactors: [
          `Attention reached ${state.hypeFear.attention.toFixed(1)} while support-heavy users represented ${(state.hypeFear.stakeholderSelection.supportHeavyUsers * 100).toFixed(0)}% of the selected audience.`,
          `The laboratory retained ${state.laboratory.pipelines.reduce((sum, pipeline) => sum + pipeline.failedRuns, 0)} failed run(s) beside ${state.laboratory.pipelines.reduce((sum, pipeline) => sum + pipeline.completedRuns, 0)} completed run(s).`,
        ],
        correlations: [
          `The ${state.laboratory.cultureId ?? "unselected"} culture was active when attention and support pressure converged.`,
        ],
        hypotheses: [
          "Keeping evidence-first delivery bounded may have prevented the public promise from outrunning the lab.",
        ],
        unknowns: [
          "The ledger cannot prove how an unseen audience would have reacted to a slower launch.",
        ],
      };
    case "maintainer-exhaustion":
      return {
        directCauses: [
          "An open collective was founded with multiple collaborators before enough runs were documented for the method to survive its maintainer.",
        ],
        contributingFactors: [
          `${state.laboratory.collaboratorIds.length} collaborators joined while only ${state.laboratory.reproducibility.documentedRuns} run(s) were documented.`,
          `The reproducibility score was ${state.laboratory.reproducibility.score.toFixed(2)} at the transition.`,
        ],
        correlations: [
          `${state.laboratory.pipelines.length} pipelines shared the same retained method and evidence surface.`,
        ],
        hypotheses: [
          "A smaller team or an earlier documentation pass may have reduced the coordination load.",
        ],
        unknowns: [
          "The simulator does not model individual health or unrecorded social labor.",
        ],
      };
    case "panic-business":
      return {
        directCauses: [
          "The larger-organization route was chosen while recorded public fear or tool-switching panic remained high.",
        ],
        contributingFactors: [
          `Fear was ${(state.hypeFear.fear * 100).toFixed(0)}% and tool-switching panic was ${(state.hypeFear.toolSwitchingPanic * 100).toFixed(0)}%.`,
          `${state.laboratory.reproducibility.documentedRuns} documented run(s) bounded the claims available for negotiation.`,
        ],
        correlations: [
          `The active tool was ${state.hypeFear.currentToolId}; switching history remains ${state.hypeFear.toolSwitches}.`,
        ],
        hypotheses: [
          "Publishing boundaries and preserving an independent fallback may have changed the collaboration terms.",
        ],
        unknowns: [
          "The ledger cannot identify which future contract language would have protected the method.",
        ],
      };
    case "invisible-laboratory":
      return {
        directCauses: [
          "The laboratory reached a founding decision without a reproducible evidence trail and without a retained collaborator.",
        ],
        contributingFactors: [
          `Reproducibility score was ${state.laboratory.reproducibility.score.toFixed(2)}; collaborator count was ${state.laboratory.collaboratorIds.length}.`,
          `${state.laboratory.reproducibility.documentedRuns} run(s) were documented before the transition.`,
        ],
        correlations: [
          `The selected scenario was ${state.laboratory.scenarioId}, with ${state.laboratory.machines.length} machine(s) in the local inventory.`,
        ],
        hypotheses: [
          "A second perspective and an independent evaluation could have made the lab legible enough to sustain.",
        ],
        unknowns: [
          "The exact audience or institution that would have noticed the work remains unobserved.",
        ],
      };
    case "honest-foundation":
      return {
        directCauses: [
          "The laboratory completed a bounded run, retained collaborators, and recorded reproducibility evidence before choosing a founding path.",
        ],
        contributingFactors: [
          `The evidence score was ${state.laboratory.reproducibility.score.toFixed(2)} with ${state.laboratory.reproducibility.documentedRuns} documented run(s).`,
          `${state.laboratory.machines.length} machine(s) supported ${state.laboratory.pipelines.length} pipeline(s) without hiding their tradeoffs.`,
        ],
        correlations: [
          `The ${state.laboratory.cultureId ?? "unselected"} culture was active at the founding transition.`,
        ],
        hypotheses: [
          "Continuing to preserve seeds, methods, and failure traces may keep this foundation credible under another seed.",
        ],
        unknowns: [
          "Future workload mixes, collaborators, and operating costs are not known at the point of conclusion.",
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
  eventMetadata: Partial<
    Pick<
      LedgerEvent,
      | "capitalPurchaseId"
      | "capitalPurchaseType"
      | "capitalPurchaseCost"
      | "expansionActivationId"
      | "modulePlacementId"
      | "modulePlacementSlotId"
      | "modulePlacementFromSlotId"
      | "moduleRemovalId"
      | "moduleRemovalSlotId"
    >
  > = {},
): SimulationState {
  return appendEvent(
    { ...state, lastUpgradeNotice: notice },
    { ...notice, ...eventMetadata },
  );
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
    career.savings >= BEDROOM_EXIT_SAVINGS_REQUIRED &&
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
        message: `Bedroom Developer exit reached: ${formatExactCurrency(BEDROOM_EXIT_SAVINGS_REQUIRED)} durable savings, a submitted competition entry, a released local product, and the Kiln 13B tier are in place.`,
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

/**
 * Presentation-only estimate for the current Career draft. It reuses the
 * authoritative route calculations without issuing a command or mutating the
 * Worker state.
 */
export interface CareerRouteProjection {
  route: CareerRoute;
  hours: number;
  gross: number;
  operatingCost: number;
  electricityCost: number;
  electricityKwh: number;
  configuredCost: number;
  economicNet: number;
  cashChange: number;
  unpaidCostChange: number;
  competitionProgress: number;
  productBuildProgress: number;
  productRevenue: number;
  maintenanceDebtReduction: number;
  constraint: string;
}

export interface CareerEveningProjection {
  routes: readonly CareerRouteProjection[];
  hours: number;
  gross: number;
  operatingCost: number;
  electricityCost: number;
  electricityKwh: number;
  configuredCost: number;
  economicNet: number;
  cashChange: number;
  unpaidCostChange: number;
  competitionProgress: number;
  productBuildProgress: number;
  productRevenue: number;
  maintenanceDebtReduction: number;
  constraint: string;
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

function careerProjectionConstraint(
  state: SimulationState,
  route: CareerRoute,
  metrics: PipelineMetrics,
): string {
  if (metrics.memoryPressure > 1)
    return "Memory pressure blocks usable route work.";
  if (metrics.orderWarnings.includes("no model stage"))
    return "The pipeline needs a model stage before this route can produce its benefit.";
  if (route === "freelance" && metrics.reliability < 0.72)
    return "Low reliability can leave freelance work with no gross payout.";
  if (route === "competition" && state.career.evaluation.coverage < 0.3)
    return "Limited private coverage increases the entry's overfit risk.";
  if (route === "product" && !state.career.product.released)
    return "Build work creates no product income until Deskflow is released.";
  if (route === "product" && state.career.product.serviceDebt > 0)
    return "Existing service debt reduces released-product income.";
  if (route === "maintenance" && state.career.product.serviceDebt <= 0)
    return "No service debt is available to repay yet.";
  if (route === "maintenance")
    return "Maintenance protects product capacity but does not add direct cash.";
  return "Configured operating and electricity costs apply to every allocated hour.";
}

function projectCareerRouteFromState(
  state: SimulationState,
  route: CareerRoute,
  hours: number,
): { projection: CareerRouteProjection; state: SimulationState } {
  const boundedHours =
    Number.isFinite(hours) && hours > 0
      ? Math.min(
          EVENING_HOURS,
          Number(
            (
              Math.round(
                Math.min(EVENING_HOURS, hours) / CAREER_HOUR_INCREMENT,
              ) * CAREER_HOUR_INCREMENT
            ).toFixed(2),
          ),
        )
      : 0;
  const metrics = careerRouteMetrics(state, route);
  if (boundedHours === 0) {
    return {
      state,
      projection: {
        route,
        hours: 0,
        gross: 0,
        operatingCost: 0,
        electricityCost: 0,
        electricityKwh: 0,
        configuredCost: 0,
        economicNet: 0,
        cashChange: 0,
        unpaidCostChange: 0,
        competitionProgress: 0,
        productBuildProgress: 0,
        productRevenue: 0,
        maintenanceDebtReduction: 0,
        constraint: careerProjectionConstraint(state, route, metrics),
      },
    };
  }

  const result = runCareerRoute(state, route, boundedHours);
  const next = result.state;
  const configuredCost = round(
    result.operatingCost + result.electricityCost,
    3,
  );
  return {
    state: next,
    projection: {
      route,
      hours: boundedHours,
      gross: result.gross,
      operatingCost: result.operatingCost,
      electricityCost: result.electricityCost,
      electricityKwh: result.electricityKwh,
      configuredCost,
      economicNet: round(result.gross - configuredCost, 3),
      cashChange: round(next.resources.money - state.resources.money, 3),
      unpaidCostChange: round(
        next.career.unpaidCosts - state.career.unpaidCosts,
        3,
      ),
      competitionProgress: round(
        next.career.competition.progress - state.career.competition.progress,
        3,
      ),
      productBuildProgress: round(
        next.career.product.buildProgress - state.career.product.buildProgress,
        3,
      ),
      productRevenue: round(
        next.career.product.lifetimeRevenue -
          state.career.product.lifetimeRevenue,
        3,
      ),
      maintenanceDebtReduction: round(
        state.career.product.serviceDebt - next.career.product.serviceDebt,
        3,
      ),
      constraint: careerProjectionConstraint(state, route, metrics),
    },
  };
}

/** Returns the live single-route estimate used by the Career composer. */
export function projectCareerRoute(
  state: SimulationState,
  route: CareerRoute,
  hours: number,
): CareerRouteProjection {
  return projectCareerRouteFromState(state, route, hours).projection;
}

/**
 * Returns an ordered four-route evening estimate. This is deliberately a pure
 * read: it models the same route accounting but never creates ledger entries,
 * advances time, or changes the durable schedule.
 */
export function projectCareerEvening(
  state: SimulationState,
  allocations: Readonly<Record<CareerRoute, number>>,
): CareerEveningProjection {
  let remaining = EVENING_HOURS;
  let next = state;
  const routes: CareerRouteProjection[] = [];
  for (const route of CAREER_ROUTES) {
    const candidate = allocations[route];
    const hours =
      Number.isFinite(candidate) && candidate > 0
        ? Math.min(
            remaining,
            Number(
              (
                Math.round(
                  Math.min(EVENING_HOURS, candidate) / CAREER_HOUR_INCREMENT,
                ) * CAREER_HOUR_INCREMENT
              ).toFixed(2),
            ),
          )
        : 0;
    remaining = round(remaining - hours, 2);
    const projected = projectCareerRouteFromState(next, route, hours);
    next = projected.state;
    if (hours > 0) routes.push(projected.projection);
  }
  const configuredCost = round(
    next.career.operatingCostsIncurred -
      state.career.operatingCostsIncurred +
      next.career.electricityCostsIncurred -
      state.career.electricityCostsIncurred,
    3,
  );
  const operatingCost = round(
    next.career.operatingCostsIncurred - state.career.operatingCostsIncurred,
    3,
  );
  const electricityCost = round(
    next.career.electricityCostsIncurred -
      state.career.electricityCostsIncurred,
    3,
  );
  const gross = round(
    routes.reduce((total, route) => total + route.gross, 0),
    3,
  );
  const hours = round(
    routes.reduce((total, route) => total + route.hours, 0),
    2,
  );
  return {
    routes,
    hours,
    gross,
    operatingCost,
    electricityCost,
    electricityKwh: round(
      next.resources.electricityKwh - state.resources.electricityKwh,
      4,
    ),
    configuredCost,
    economicNet: round(gross - configuredCost, 3),
    cashChange: round(next.resources.money - state.resources.money, 3),
    unpaidCostChange: round(
      next.career.unpaidCosts - state.career.unpaidCosts,
      3,
    ),
    competitionProgress: round(
      next.career.competition.progress - state.career.competition.progress,
      3,
    ),
    productBuildProgress: round(
      next.career.product.buildProgress - state.career.product.buildProgress,
      3,
    ),
    productRevenue: round(
      next.career.product.lifetimeRevenue -
        state.career.product.lifetimeRevenue,
      3,
    ),
    maintenanceDebtReduction: round(
      state.career.product.serviceDebt - next.career.product.serviceDebt,
      3,
    ),
    constraint:
      routes.find((route) => route.constraint !== "")?.constraint ??
      "Allocate at least one quarter hour to estimate this evening.",
  };
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
    research: createInitialResearchState(),
    hypeFear: createInitialHypeFearState(),
    laboratory: createInitialLaboratoryState(normalizedSeed),
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

function researchWarning(
  state: SimulationState,
  message: string,
): SimulationState {
  return appendEvent(state, { kind: "warning", message });
}

function addResearchReveals(
  state: ResearchState,
  ids: readonly string[],
): ResearchState {
  const discoveredProjectIds = [...state.frontier.discoveredProjectIds];
  const availableResearcherIds = [...state.availableResearcherIds];
  const strategicOptionIds = [...state.strategicOptionIds];
  for (const id of ids) {
    if (findResearchProject(id)) {
      if (!discoveredProjectIds.includes(id)) discoveredProjectIds.push(id);
    } else if (findResearcher(id)) {
      if (
        !availableResearcherIds.includes(id) &&
        !state.recruitedResearcherIds.includes(id)
      )
        availableResearcherIds.push(id);
    } else if (!strategicOptionIds.includes(id)) {
      strategicOptionIds.push(id);
    }
  }
  return {
    ...state,
    frontier: { ...state.frontier, discoveredProjectIds },
    availableResearcherIds,
    strategicOptionIds,
  };
}

function researchTeamKnowledge(
  state: ResearchState,
  amount: number,
): Readonly<Record<string, number>> {
  const next = { ...state.tacitKnowledge };
  for (const id of state.teamMemberIds)
    next[id] = round((next[id] ?? 0) + amount * 0.35, 3);
  return next;
}

function advanceResearch(
  state: SimulationState,
  elapsedSeconds: number,
): SimulationState {
  const active = state.research.activeProject;
  if (!active || state.research.teamMemberIds.length === 0) return state;
  const project = findResearchProject(active.projectId);
  if (!project) return state;
  const chemistry = researchTeamChemistry(state.research.teamMemberIds);
  const team = state.research.teamMemberIds.flatMap((id) => {
    const researcher = findResearcher(id);
    return researcher ? [researcher] : [];
  });
  const execution =
    team.length === 0
      ? 0
      : team.reduce((sum, researcher) => sum + researcher.traits.execution, 0) /
        team.length;
  const simulatedHours = (elapsedSeconds * SIMULATION_TIME_SCALE) / 3600;
  const progressHours =
    simulatedHours *
    clamp(
      (0.7 + execution * 0.35 + chemistry * 0.2) *
        (0.65 + (state.research.computeAllocation / 100) * 0.35),
      0.55,
      1.4,
    );
  const nextElapsed = round(
    Math.min(active.expectedDurationHours, active.elapsedHours + progressHours),
    3,
  );
  if (nextElapsed < active.expectedDurationHours)
    return {
      ...state,
      research: {
        ...state.research,
        activeProject: { ...active, elapsedHours: nextElapsed },
      },
    };

  const outcome = resolveResearchOutcome(
    project,
    state.research,
    researchContext(state),
  );
  let research: ResearchState = {
    ...state.research,
    activeProject: null,
    lastOutcome: outcome,
    frontier: {
      ...state.research.frontier,
      completedProjectIds: state.research.frontier.completedProjectIds.includes(
        project.id,
      )
        ? state.research.frontier.completedProjectIds
        : [...state.research.frontier.completedProjectIds, project.id],
    },
    institutionalKnowledge: round(
      state.research.institutionalKnowledge +
        outcome.institutionalKnowledgeGained,
      3,
    ),
    tacitKnowledge: researchTeamKnowledge(
      state.research,
      outcome.knowledgeGained,
    ),
    pendingDecision: `Outcome: ${outcome.title}. Inspect the evidence and choose the next strategic question.`,
  };
  research = addResearchReveals(research, [
    ...outcome.revealedProjectIds,
    ...outcome.strategicOptionIds,
  ]);
  const reputationGain =
    outcome.kind === "breakthrough"
      ? 0.16
      : outcome.kind === "failure" || outcome.kind === "replication-failure"
        ? 0.025
        : 0.08;
  return appendEvent(
    {
      ...state,
      research,
      resources: {
        ...state.resources,
        reputation: round(state.resources.reputation + reputationGain, 3),
      },
    },
    {
      kind:
        outcome.kind === "breakthrough"
          ? "success"
          : outcome.kind === "failure" || outcome.kind === "replication-failure"
            ? "warning"
            : "info",
      message: `Research completed: ${outcome.title}. ${outcome.summary} Usefulness ${(outcome.usefulness * 100).toFixed(0)}%; retained knowledge and the failed path remain available for the next decision.`,
    },
  );
}

function hypeFearContext(state: SimulationState): HypeFearContext {
  const lastUsefulness = state.research.lastOutcome?.usefulness ?? 0;
  return {
    seed: state.seed,
    tick: state.tick,
    jobsCompleted: state.jobs.completed,
    reputation: state.resources.reputation,
    observedQuality: state.metrics.observedQuality,
    reliability: state.metrics.reliability,
    observability: state.metrics.observability,
    privateCoverage: state.career.evaluation.coverage,
    researchKnowledge: clamp(
      (state.research.institutionalKnowledge +
        state.research.retainedKnowledge) /
        2,
      0,
      1,
    ),
    latestResearchUsefulness: lastUsefulness,
    productReleased: state.career.product.released,
  };
}

function adjustAudienceReputation(
  state: HypeFearState,
  audiences: readonly AudienceId[],
  amount: number,
): HypeFearState["audienceReputation"] {
  const next = { ...state.audienceReputation };
  for (const audience of audiences)
    next[audience] = round(clamp(next[audience] + amount, 0, 1), 3);
  return next;
}

function adjustStakeholderSelection(
  state: HypeFearState,
  changes: Partial<HypeFearState["stakeholderSelection"]>,
): HypeFearState["stakeholderSelection"] {
  const next = { ...state.stakeholderSelection };
  for (const key of Object.keys(changes) as Array<
    keyof HypeFearState["stakeholderSelection"]
  >) {
    const amount = changes[key];
    if (amount === undefined) continue;
    next[key] = round(clamp(next[key] + amount, 0, 1), 3);
  }
  return next;
}

function activeNarrative(state: SimulationState): NarrativeInstance | null {
  const id = state.hypeFear.activeNarrativeId;
  if (!id) return null;
  return (
    state.hypeFear.narratives.find((narrative) => narrative.id === id) ?? null
  );
}

function ensureHypeFearNarrative(state: SimulationState): SimulationState {
  const context = hypeFearContext(state);
  const current = state.hypeFear;
  if (!current.unlocked && !hypeFearRecognition(context)) return state;
  let next = state;
  if (!current.unlocked) {
    // Recognition is a durable state transition, not a settlement event. Do
    // not append here: a job's accounting disclosure must remain the latest
    // ledger entry after a tick for existing settlement surfaces.
    next = {
      ...next,
      hypeFear: { ...next.hypeFear, unlocked: true },
    };
  }
  if (
    next.hypeFear.activeNarrativeId !== null ||
    next.hypeFear.nextNarrativeIndex >= narrativeTemplates.length
  )
    return next;
  const narrative = createNarrativeInstance(
    next.hypeFear.nextNarrativeIndex,
    hypeFearContext(next),
  );
  if (!narrative) return next;
  const nextHypeFear: HypeFearState = {
    ...next.hypeFear,
    narratives: [...next.hypeFear.narratives, narrative],
    activeNarrativeId: narrative.id,
    nextNarrativeIndex: next.hypeFear.nextNarrativeIndex + 1,
  };
  return { ...next, hypeFear: nextHypeFear };
}

function resolveDueHypeFearNarrative(state: SimulationState): SimulationState {
  const current = activeNarrative(state);
  if (
    !current ||
    (current.status !== "awaiting-prediction" &&
      current.status !== "countdown") ||
    state.tick < current.deadlineTick
  )
    return state;
  const resolution = resolveNarrative(
    current,
    hypeFearContext(state),
    state.hypeFear,
  );
  const resolvedNarrative: NarrativeInstance = {
    ...current,
    status: "awaiting-response",
    resolution,
  };
  let hypeFear: HypeFearState = {
    ...state.hypeFear,
    narratives: state.hypeFear.narratives.map((narrative) =>
      narrative.id === current.id ? resolvedNarrative : narrative,
    ),
    pendingResponse: {
      narrativeId: current.id,
      response: "pending",
      resolvedAtTick: state.tick,
      expectationDebtAfter: state.hypeFear.expectationDebt,
      stakeholderNote:
        current.kind === "hype"
          ? "Escalation-seeking stakeholders now remember the promise; patient partners are watching whether evidence or bravado follows."
          : "Cautious reviewers and support-heavy users now expect a bounded response to the fear signal.",
    },
  };
  if (current.kind === "fear") {
    hypeFear = appendDoomFeed(hypeFear, {
      id: `${current.id}-resolution`,
      narrativeId: current.id,
      sourceArchetypeId: current.sourceArchetypeId,
      headline: resolution.headline,
      uncertainty:
        current.counterevidence[0] ??
        "The warning remains bounded by the measured workload.",
      createdAtTick: state.tick,
      responseRequired: true,
    });
  }
  return appendEvent(
    { ...state, hypeFear },
    {
      kind: resolution.kind === "wrong" ? "failure" : "warning",
      message: `${current.kind === "hype" ? "Hype" : "Fear"} deadline resolved: ${resolution.headline} Confidence range ${Math.round(resolution.confidenceRange.min * 100)}–${Math.round(resolution.confidenceRange.max * 100)}%; choose a response before the next narrative.`,
      directCause: `The ${current.kind} narrative reached its deterministic deadline with the recorded prediction and evidence boundary.`,
      contributingCondition: resolution.supportedEvidence,
    },
  );
}

function advanceHypeFear(state: SimulationState): SimulationState {
  const unlocked = ensureHypeFearNarrative(state);
  return resolveDueHypeFearNarrative(unlocked);
}

function applyCoverNarrative(
  state: SimulationState,
  narrativeId: string,
  creatorId: string,
): SimulationState {
  if (!state.hypeFear.unlocked)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Narrative coverage rejected: recognition has not arrived yet. Complete one accepted delivery or build reputation first.",
    });
  if (state.hypeFear.pendingResponse)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Narrative coverage rejected: resolve the pending response before adding another attention signal.",
    });
  const narrative = activeNarrative(state);
  const creator = findCreator(creatorId);
  if (!creator || !narrative || narrative.id !== narrativeId)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Narrative coverage rejected: creator or active narrative is unavailable.",
    });
  if (narrative.status !== "available")
    return appendEvent(state, {
      kind: "warning",
      message:
        "Narrative coverage rejected: this narrative is already covered or awaiting its deadline.",
    });
  if (
    !creator.audienceIncentives.some((audience) =>
      narrative.targetAudiences.includes(audience),
    )
  )
    return appendEvent(state, {
      kind: "warning",
      message: `${creator.name} cannot credibly reach the target audiences for this narrative; choose a creator with a matching incentive.`,
    });
  const template = findNarrativeTemplate(narrative.templateId);
  const coverageFit = template
    ? creatorCoverageFit(creator, template)
    : { preferenceMatches: [], accessMatches: [], score: 0, eligible: false };
  if (!coverageFit.eligible)
    return appendEvent(state, {
      kind: "warning",
      message: `${creator.name} cannot cover this narrative: its stated preferences and access do not match the evidence context. No attention or expectation debt changed.`,
    });
  if (
    state.hypeFear.expectationDebt >= 0.9 &&
    narrative.kind === "hype" &&
    creator.id !== "skeptic"
  )
    return appendEvent(state, {
      kind: "warning",
      message:
        "Attention-only coverage rejected: expectation debt is already high. Publish evidence or choose a skeptical boundary before amplifying again.",
    });
  const overlap = creator.audienceIncentives.filter((audience) =>
    narrative.targetAudiences.includes(audience),
  );
  const fitMultiplier = 0.7 + coverageFit.score * 0.3;
  const attentionGain =
    (narrative.kind === "hype" ? 22 : 9) *
    creator.reach *
    narrative.reach *
    fitMultiplier *
    (1 - state.hypeFear.expectationDebt * 0.28);
  const debtGain =
    narrative.emotionalIntensity *
    narrative.reach *
    (narrative.kind === "hype" ? 0.24 : 0.14) *
    (0.85 + coverageFit.score * 0.15);
  const nextHypeFear: HypeFearState = {
    ...state.hypeFear,
    attention: round(
      clamp(state.hypeFear.attention + attentionGain, 0, MAX_ATTENTION),
      3,
    ),
    fear: round(
      clamp(
        state.hypeFear.fear +
          (narrative.kind === "fear"
            ? narrative.emotionalIntensity * 0.2
            : 0.015),
        0,
        MAX_FEAR,
      ),
      3,
    ),
    expectationDebt: round(
      clamp(state.hypeFear.expectationDebt + debtGain, 0, MAX_EXPECTATION_DEBT),
      3,
    ),
    audienceReputation: adjustAudienceReputation(
      state.hypeFear,
      overlap,
      creator.trust * 0.035,
    ),
    stakeholderSelection: adjustStakeholderSelection(
      state.hypeFear,
      narrative.kind === "hype"
        ? {
            escalationSeekers: narrative.emotionalIntensity * 0.1,
            supportHeavyUsers: 0.025,
          }
        : {
            cautiousReviewers: narrative.emotionalIntensity * 0.1,
            supportHeavyUsers: 0.04,
          },
    ),
    attentionOnlyActions: state.hypeFear.attentionOnlyActions + 1,
    narratives: state.hypeFear.narratives.map((item) =>
      item.id === narrative.id
        ? {
            ...item,
            status: "awaiting-prediction",
            coveredByCreatorIds: [creator.id],
          }
        : item,
    ),
  };
  return appendEvent(
    { ...state, hypeFear: nextHypeFear },
    {
      kind: narrative.kind === "hype" ? "info" : "warning",
      message: `${creator.name} covered the ${narrative.kind} narrative with ${Math.round(coverageFit.score * 100)}% preference/access fit. Attention +${attentionGain.toFixed(1)}; expectation debt is now ${Math.round(nextHypeFear.expectationDebt * 100)}%. Deadline and counterevidence remain visible.`,
      contributingCondition: `${creator.usefulness} Access: ${creator.access} Preferences matched: ${coverageFit.preferenceMatches.join(", ")}.`,
    },
  );
}

function applyPrediction(
  state: SimulationState,
  narrativeId: string,
  prediction: NarrativePrediction,
  confidence: number,
): SimulationState {
  const narrative = activeNarrative(state);
  if (
    !narrative ||
    narrative.id !== narrativeId ||
    narrative.status !== "awaiting-prediction"
  )
    return appendEvent(state, {
      kind: "warning",
      message:
        "Prediction rejected: the active narrative is not awaiting a prediction.",
    });
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Prediction rejected: confidence must stay between 0% and 100%; no narrative state changed.",
    });
  const nextHypeFear: HypeFearState = {
    ...state.hypeFear,
    narratives: state.hypeFear.narratives.map((item) =>
      item.id === narrative.id
        ? {
            ...item,
            status: "countdown",
            prediction: {
              prediction,
              confidence: round(confidence, 3),
              submittedAtTick: state.tick,
            },
          }
        : item,
    ),
  };
  return appendEvent(
    { ...state, hypeFear: nextHypeFear },
    {
      kind: "info",
      message: `Prediction recorded: ${prediction} with ${Math.round(confidence * 100)}% confidence. The deadline will resolve against measured capability, not confidence alone.`,
    },
  );
}

function completeNarrativeResponse(
  state: SimulationState,
  narrative: NarrativeInstance,
  response: NarrativeResponseId | FearResponseId,
  stakeholderNote: string,
  hypeFear: HypeFearState,
): SimulationState {
  const expectationDebtAfter = round(hypeFear.expectationDebt, 3);
  const record = {
    narrativeId: narrative.id,
    response,
    resolvedAtTick: state.tick,
    expectationDebtAfter,
    stakeholderNote,
  } as const;
  const nextHypeFear: HypeFearState = {
    ...hypeFear,
    narratives: hypeFear.narratives.map((item) =>
      item.id === narrative.id ? { ...item, status: "resolved" } : item,
    ),
    activeNarrativeId: null,
    pendingResponse: null,
    lastResponse: record,
  };
  return appendEvent(
    { ...state, hypeFear: nextHypeFear },
    {
      kind: response === "double-down" ? "warning" : "success",
      message: `Response recorded: ${response.replaceAll("-", " ")}. Expectation debt is now ${Math.round(expectationDebtAfter * 100)}%; ${stakeholderNote}`,
    },
  );
}

function applyNarrativeResponse(
  state: SimulationState,
  response: NarrativeResponseId,
): SimulationState {
  const pending = state.hypeFear.pendingResponse;
  const narrative = pending
    ? state.hypeFear.narratives.find((item) => item.id === pending.narrativeId)
    : null;
  if (!pending || !narrative || narrative.kind !== "hype")
    return appendEvent(state, {
      kind: "warning",
      message:
        "Hype response rejected: no resolved hype narrative is waiting for a response.",
    });
  let hypeFear = state.hypeFear;
  let note =
    "Patient partners now have a durable record of the chosen response.";
  switch (response) {
    case "publish-evidence":
      hypeFear = {
        ...hypeFear,
        expectationDebt: round(clamp(hypeFear.expectationDebt - 0.2, 0, 1), 3),
        audienceReputation: adjustAudienceReputation(
          hypeFear,
          ["developers", "researchers", "skeptics"],
          0.045,
        ),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          patientPartners: 0.14,
          escalationSeekers: -0.06,
        }),
      };
      note =
        "Evidence-first response grows patient partners and lowers escalation demand.";
      break;
    case "acknowledge-uncertainty":
      hypeFear = {
        ...hypeFear,
        expectationDebt: round(clamp(hypeFear.expectationDebt - 0.12, 0, 1), 3),
        fear: round(clamp(hypeFear.fear - 0.05, 0, 1), 3),
        audienceReputation: adjustAudienceReputation(
          hypeFear,
          ["researchers", "skeptics"],
          0.05,
        ),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          patientPartners: 0.08,
          cautiousReviewers: 0.07,
        }),
      };
      note =
        "Uncertainty is explicit; cautious reviewers can distinguish a bounded claim from a promise.";
      break;
    case "double-down":
      hypeFear = {
        ...hypeFear,
        attention: round(clamp(hypeFear.attention + 4, 0, MAX_ATTENTION), 3),
        expectationDebt: round(clamp(hypeFear.expectationDebt + 0.16, 0, 1), 3),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          escalationSeekers: 0.16,
          supportHeavyUsers: 0.08,
        }),
      };
      note =
        "Doubling down retains attention but selects escalation-seeking stakeholders and adds expectation debt.";
      break;
    case "go-quiet":
      hypeFear = {
        ...hypeFear,
        attention: round(clamp(hypeFear.attention - 2, 0, MAX_ATTENTION), 3),
        expectationDebt: round(clamp(hypeFear.expectationDebt - 0.08, 0, 1), 3),
        audienceReputation: adjustAudienceReputation(
          hypeFear,
          ["developers", "enthusiasts"],
          -0.025,
        ),
      };
      note =
        "Quiet reduces pressure and reach, but momentum-seeking audiences remember the pause.";
      break;
  }
  return completeNarrativeResponse(state, narrative, response, note, hypeFear);
}

function applyFearResponse(
  state: SimulationState,
  response: FearResponseId,
): SimulationState {
  const pending = state.hypeFear.pendingResponse;
  const narrative = pending
    ? state.hypeFear.narratives.find((item) => item.id === pending.narrativeId)
    : null;
  if (!pending || !narrative || narrative.kind !== "fear")
    return appendEvent(state, {
      kind: "warning",
      message:
        "Fear response rejected: no resolved fear narrative is waiting for a response.",
    });
  let hypeFear = state.hypeFear;
  let note = "The fear response remains bounded by the measured workload.";
  switch (response) {
    case "stabilize":
      hypeFear = {
        ...hypeFear,
        fear: round(clamp(hypeFear.fear - 0.25, 0, 1), 3),
        toolSwitchingPanic: round(
          clamp(hypeFear.toolSwitchingPanic - 0.12, 0, 1),
          3,
        ),
        expectationDebt: round(clamp(hypeFear.expectationDebt - 0.08, 0, 1), 3),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          patientPartners: 0.1,
          cautiousReviewers: 0.08,
        }),
      };
      note =
        "Stabilization lowers panic and selects patient partners who value continuity.";
      break;
    case "publish-boundaries":
      hypeFear = {
        ...hypeFear,
        fear: round(clamp(hypeFear.fear - 0.18, 0, 1), 3),
        expectationDebt: round(clamp(hypeFear.expectationDebt - 0.1, 0, 1), 3),
        audienceReputation: adjustAudienceReputation(
          hypeFear,
          ["researchers", "skeptics"],
          0.07,
        ),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          patientPartners: 0.12,
          cautiousReviewers: 0.1,
        }),
      };
      note =
        "Published boundaries improve standing with researchers and skeptics without promising universal safety.";
      break;
    case "pause-and-measure":
      hypeFear = {
        ...hypeFear,
        fear: round(clamp(hypeFear.fear - 0.14, 0, 1), 3),
        toolSwitchingPanic: round(
          clamp(hypeFear.toolSwitchingPanic - 0.12, 0, 1),
          3,
        ),
        audienceReputation: adjustAudienceReputation(
          hypeFear,
          ["researchers", "customers"],
          0.04,
        ),
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          cautiousReviewers: 0.13,
          patientPartners: 0.08,
        }),
      };
      note =
        "A pause keeps the uncertainty visible while measurement catches up.";
      break;
    case "switch-tool":
      hypeFear = {
        ...hypeFear,
        currentToolId: "fast-new-runtime",
        fear: round(clamp(hypeFear.fear + 0.04, 0, 1), 3),
        toolSwitchingPanic: round(
          clamp(hypeFear.toolSwitchingPanic + 0.16, 0, 1),
          3,
        ),
        expectationDebt: round(clamp(hypeFear.expectationDebt + 0.06, 0, 1), 3),
        toolSwitches: hypeFear.toolSwitches + 1,
        stakeholderSelection: adjustStakeholderSelection(hypeFear, {
          escalationSeekers: 0.1,
          supportHeavyUsers: 0.08,
        }),
      };
      note =
        "Switching tools relieves the immediate fear signal but creates durable panic and continuity cost.";
      break;
  }
  return completeNarrativeResponse(state, narrative, response, note, hypeFear);
}

function applyToolSwitch(
  state: SimulationState,
  toolId: ToolId,
): SimulationState {
  const tool = findTool(toolId);
  if (!tool)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Tool switch rejected: unknown tool; no fear or attention state changed.",
    });
  if (!state.hypeFear.unlocked)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Tool switch rejected: public-pressure recognition has not arrived; the locked World state remains unchanged.",
    });
  if (state.hypeFear.pendingResponse)
    return appendEvent(state, {
      kind: "warning",
      message:
        "Tool switch rejected: respond to the pending fear or hype consequence before changing the stack.",
    });
  if (state.hypeFear.currentToolId === tool.id)
    return appendEvent(state, {
      kind: "info",
      message: `${tool.name} is already active. No panic or evidence continuity cost was added.`,
    });
  const panicGain = tool.id === "fast-new-runtime" ? 0.18 : 0.06;
  let hypeFear: HypeFearState = {
    ...state.hypeFear,
    currentToolId: tool.id,
    toolSwitches: state.hypeFear.toolSwitches + 1,
    toolSwitchingPanic: round(
      clamp(
        state.hypeFear.toolSwitchingPanic + panicGain,
        0,
        MAX_TOOL_SWITCHING_PANIC,
      ),
      3,
    ),
    fear: round(
      clamp(
        state.hypeFear.fear + (tool.id === "fast-new-runtime" ? 0.05 : -0.03),
        0,
        MAX_FEAR,
      ),
      3,
    ),
    expectationDebt: round(
      clamp(
        state.hypeFear.expectationDebt +
          (tool.id === "fast-new-runtime" ? 0.08 : -0.02),
        0,
        MAX_EXPECTATION_DEBT,
      ),
      3,
    ),
  };
  if (tool.id === "evidence-first-stack")
    hypeFear = {
      ...hypeFear,
      audienceReputation: adjustAudienceReputation(
        hypeFear,
        ["researchers", "skeptics"],
        0.025,
      ),
    };
  if (hypeFear.narratives.length > 0)
    hypeFear = appendDoomFeed(hypeFear, {
      id: `tool-switch-${hypeFear.toolSwitches}`,
      narrativeId: hypeFear.narratives[0]!.id,
      sourceArchetypeId: "ai-news-amplifier",
      headline: `Tool switch to ${tool.name} triggered panic about evidence continuity.`,
      uncertainty: tool.tradeoff,
      createdAtTick: state.tick,
      responseRequired: false,
    });
  return appendEvent(
    { ...state, hypeFear },
    {
      kind: "warning",
      message: `Tool switched to ${tool.name}. Panic is ${Math.round(hypeFear.toolSwitchingPanic * 100)}%; ${tool.tradeoff}`,
    },
  );
}

function laboratoryWarning(
  state: SimulationState,
  message: string,
): SimulationState {
  return appendEvent(state, { kind: "warning", message });
}

function refreshLaboratoryAccess(state: SimulationState): SimulationState {
  const readiness = laboratoryEntryReadiness(state);
  if (!state.laboratory.unlocked && readiness.ready) {
    const scenarioUnlockIds = laboratoryScenarioUnlocks(state);
    const scenarioId = scenarioUnlockIds.includes(state.laboratory.scenarioId)
      ? state.laboratory.scenarioId
      : (scenarioUnlockIds[0] ?? "limited-hardware");
    return appendEvent(
      {
        ...state,
        laboratory: {
          ...state.laboratory,
          unlocked: true,
          unlockedAtTick: state.tick,
          scenarioId,
          scenarioUnlockIds,
          scenarioProgress: {
            ...state.laboratory.scenarioProgress,
            ...Object.fromEntries(scenarioUnlockIds.map((id) => [id, 1])),
          },
          pendingDecision:
            "Choose a machine, a second pipeline, and one collaborator before founding the lab.",
        },
      },
      {
        kind: "success",
        message:
          "Local Laboratory unlocked. Machines, parallel pipelines, collaborators, reproducibility, and founding routes are now visible.",
      },
    );
  }
  if (!state.laboratory.unlocked) return state;
  const scenarioUnlockIds = laboratoryScenarioUnlocks(state);
  const mergedScenarioUnlockIds = [
    ...new Set([...state.laboratory.scenarioUnlockIds, ...scenarioUnlockIds]),
  ];
  const scenarioId = mergedScenarioUnlockIds.includes(
    state.laboratory.scenarioId,
  )
    ? state.laboratory.scenarioId
    : (mergedScenarioUnlockIds[0] ?? "limited-hardware");
  const updated = refreshLaboratoryScore({
    ...state.laboratory,
    scenarioId,
    scenarioUnlockIds: mergedScenarioUnlockIds,
    scenarioProgress: {
      ...state.laboratory.scenarioProgress,
      ...Object.fromEntries(scenarioUnlockIds.map((id) => [id, 1])),
    },
  });
  return updated === state.laboratory
    ? state
    : { ...state, laboratory: updated };
}

function startLaboratoryRun(
  laboratory: SimulationState["laboratory"],
  pipeline: SimulationState["laboratory"]["pipelines"][number],
  tick: number,
): SimulationState["laboratory"]["pipelines"][number] {
  if (
    pipeline.activeRun ||
    pipeline.waitingRuns <= 0 ||
    pipeline.machineIds.length === 0
  )
    return pipeline;
  const occupiedMachineIds = new Set(
    laboratory.pipelines
      .filter((item) => item.id !== pipeline.id && item.activeRun !== null)
      .flatMap((item) => item.machineIds),
  );
  if (
    pipeline.machineIds.some((machineId) => occupiedMachineIds.has(machineId))
  )
    return pipeline;
  const duration = laboratoryRunDuration(laboratory, pipeline.id);
  return {
    ...pipeline,
    waitingRuns: pipeline.waitingRuns - 1,
    activeRun: {
      startedAtTick: tick,
      elapsedHours: 0,
      expectedDurationHours: duration.hours,
      committedCost: duration.cost,
    },
  };
}

function advanceLaboratory(
  state: SimulationState,
  elapsedSeconds: number,
): SimulationState {
  if (!state.laboratory.unlocked || elapsedSeconds <= 0) return state;
  const elapsedHours = (elapsedSeconds * SIMULATION_TIME_SCALE) / 3_600;
  let next = refreshLaboratoryAccess(state);
  const completedEvents: {
    kind: "success" | "failure";
    message: string;
  }[] = [];
  const pipelines = next.laboratory.pipelines.map((pipeline) => {
    const updated = startLaboratoryRun(next.laboratory, pipeline, next.tick);
    if (!updated.activeRun) return updated;
    const active = updated.activeRun;
    const progress = active.elapsedHours + elapsedHours;
    if (progress < active.expectedDurationHours) {
      return {
        ...updated,
        activeRun: { ...active, elapsedHours: round(progress, 4) },
      };
    }
    const outcome = laboratoryRunOutcome(
      next,
      updated.id,
      active.startedAtTick,
    );
    const finishedAtTick = next.tick;
    const runRecord = {
      pipelineId: updated.id,
      completed: outcome.completed,
      startedAtTick: active.startedAtTick,
      finishedAtTick,
      reproducibilityScore: next.laboratory.reproducibility.score,
      note: outcome.note,
    };
    const scenarioProgress = {
      ...next.laboratory.scenarioProgress,
      [next.laboratory.scenarioId]: round(
        Math.min(
          1,
          (next.laboratory.scenarioProgress[next.laboratory.scenarioId] ?? 0) +
            (outcome.completed ? 0.25 : 0.1),
        ),
        3,
      ),
    };
    next = {
      ...next,
      laboratory: {
        ...next.laboratory,
        lastRun: runRecord,
        scenarioProgress,
        pipelines: next.laboratory.pipelines.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                activeRun: null,
                completedRuns: item.completedRuns + (outcome.completed ? 1 : 0),
                failedRuns: item.failedRuns + (outcome.completed ? 0 : 1),
                lastRunTick: finishedAtTick,
              }
            : item,
        ),
      },
    };
    completedEvents.push({
      kind: outcome.completed ? "success" : "failure",
      message: `${updated.id} laboratory run ${outcome.completed ? "completed" : "failed"}. ${outcome.note}`,
    });
    const refreshed = next.laboratory.pipelines.find(
      (item) => item.id === updated.id,
    );
    return refreshed
      ? startLaboratoryRun(next.laboratory, refreshed, next.tick)
      : updated;
  });
  next = {
    ...next,
    laboratory: refreshLaboratoryScore({ ...next.laboratory, pipelines }),
  };
  return completedEvents.reduce(
    (current, event) => appendEvent(current, event),
    next,
  );
}

function applyLaboratoryCommand(
  state: SimulationState,
  command: Extract<
    SimulationCommand,
    {
      type:
        | "BUY_LAB_MACHINE"
        | "ADD_LAB_PIPELINE"
        | "ASSIGN_LAB_MACHINE"
        | "INVITE_LAB_COLLABORATOR"
        | "SET_LAB_REPRODUCIBILITY"
        | "DOCUMENT_LAB_RUN"
        | "SET_LAB_CULTURE"
        | "SELECT_LAB_SCENARIO"
        | "QUEUE_LAB_RUN"
        | "FOUND_LAB";
    }
  >,
): SimulationState {
  const lab = state.laboratory;
  if (!lab.unlocked)
    return laboratoryWarning(
      state,
      `Local Laboratory is locked. ${laboratoryEntryReadiness(state).reasons.join(" ")}`,
    );
  switch (command.type) {
    case "BUY_LAB_MACHINE": {
      const machine = findLaboratoryMachine(command.machineId);
      if (!machine)
        return laboratoryWarning(state, "Unknown laboratory machine.");
      if (lab.machines.some((item) => item.id === machine.id))
        return laboratoryWarning(
          state,
          `${machine.name} is already in the lab inventory.`,
        );
      if (state.resources.money < machine.purchaseCost)
        return laboratoryWarning(
          state,
          `${machine.name} needs $${machine.purchaseCost.toFixed(3)}; no cash was spent.`,
        );
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - machine.purchaseCost, 3),
          },
          laboratory: {
            ...lab,
            machines: [
              ...lab.machines,
              { id: machine.id, acquiredAtTick: state.tick },
            ],
            pendingDecision:
              "Assign the new machine to a second pipeline, then queue a bounded run.",
            totalOperatingCost: round(
              lab.totalOperatingCost + machine.purchaseCost,
              3,
            ),
          },
        },
        {
          kind: "success",
          message: `${machine.name} acquired for $${machine.purchaseCost.toFixed(3)}. Its reliability, memory, and electricity tradeoffs remain visible.`,
        },
      );
    }
    case "ADD_LAB_PIPELINE": {
      const pipeline = findLaboratoryPipeline(command.pipelineId);
      if (!pipeline)
        return laboratoryWarning(state, "Unknown laboratory pipeline.");
      if (lab.pipelines.some((item) => item.id === pipeline.id))
        return laboratoryWarning(state, `${pipeline.name} is already active.`);
      if (lab.pipelines.length >= 3)
        return laboratoryWarning(
          state,
          "The local lab supports three bounded pipelines in this release.",
        );
      const purchaseCost = round(pipeline.baseCost * 10, 3);
      if (state.resources.money < purchaseCost)
        return laboratoryWarning(
          state,
          `${pipeline.name} needs $${purchaseCost.toFixed(3)}; no cash was spent.`,
        );
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - purchaseCost, 3),
          },
          laboratory: {
            ...lab,
            pipelines: [
              ...lab.pipelines,
              {
                id: pipeline.id,
                machineIds: [],
                waitingRuns: 0,
                activeRun: null,
                completedRuns: 0,
                failedRuns: 0,
                lastRunTick: null,
              },
            ],
            pendingDecision:
              "Assign machines explicitly: parallel capacity is a choice, not an automatic bonus.",
            totalOperatingCost: round(lab.totalOperatingCost + purchaseCost, 3),
          },
        },
        {
          kind: "success",
          message: `${pipeline.name} added for $${purchaseCost.toFixed(3)}.`,
        },
      );
    }
    case "ASSIGN_LAB_MACHINE": {
      const machine = findLaboratoryMachine(command.machineId);
      const pipeline = lab.pipelines.find(
        (item) => item.id === command.pipelineId,
      );
      if (
        !machine ||
        !pipeline ||
        !lab.machines.some((item) => item.id === machine.id)
      )
        return laboratoryWarning(
          state,
          "Machine assignment rejected: acquire the machine and pipeline first.",
        );
      if (pipeline.machineIds.includes(machine.id)) return state;
      const assignedPipeline = lab.pipelines.find(
        (item) =>
          item.id !== pipeline.id && item.machineIds.includes(machine.id),
      );
      if (assignedPipeline)
        return laboratoryWarning(
          state,
          `${machine.name} is already allocated to ${assignedPipeline.id}. Acquire another machine for parallel capacity.`,
        );
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            pipelines: lab.pipelines.map((item) =>
              item.id === pipeline.id
                ? { ...item, machineIds: [...item.machineIds, machine.id] }
                : item,
            ),
            pendingDecision: `${machine.name} assigned to ${pipeline.id}. Queue only within the visible reserve.`,
          },
        },
        {
          kind: "info",
          message: `${machine.name} assigned to ${pipeline.id}.`,
        },
      );
    }
    case "INVITE_LAB_COLLABORATOR": {
      const researcher = findResearcher(command.researcherId);
      if (
        !researcher ||
        !state.research.recruitedResearcherIds.includes(command.researcherId)
      )
        return laboratoryWarning(
          state,
          "Invite rejected: recruit and retain this Researcher first.",
        );
      if (lab.collaboratorIds.includes(researcher.id)) return state;
      if (lab.collaboratorIds.length >= 4)
        return laboratoryWarning(
          state,
          "The local laboratory holds four collaborators in this release.",
        );
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            collaboratorIds: [...lab.collaboratorIds, researcher.id],
            pendingDecision: `${researcher.name} is retained as a collaborator. Document the method so the lab is not dependent on one hero.`,
          },
        },
        {
          kind: "success",
          message: `${researcher.name} joined the laboratory collaboration.`,
        },
      );
    }
    case "SET_LAB_REPRODUCIBILITY": {
      const reproducibility = {
        ...lab.reproducibility,
        [command.field]: command.enabled,
      };
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            reproducibility: {
              ...reproducibility,
              score: laboratoryReproducibilityScore({
                ...lab,
                reproducibility,
              }),
            },
            pendingDecision:
              "A reproducible claim needs a versioned configuration, a locked seed, and an independent evaluation.",
          },
        },
        {
          kind: "info",
          message: `${command.field} ${command.enabled ? "recorded" : "cleared"}.`,
        },
      );
    }
    case "DOCUMENT_LAB_RUN": {
      const documentedRuns = lab.reproducibility.documentedRuns + 1;
      if (documentedRuns > 1000)
        return laboratoryWarning(
          state,
          "Documentation limit reached; retain the existing archive.",
        );
      const reproducibility = { ...lab.reproducibility, documentedRuns };
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            reproducibility: {
              ...reproducibility,
              score: laboratoryReproducibilityScore({
                ...lab,
                reproducibility,
              }),
            },
            pendingDecision:
              "The archive now preserves a method, not only a result. Run the next bounded comparison when ready.",
          },
        },
        {
          kind: "success",
          message:
            "Laboratory run documentation retained with its configuration and seed trail.",
        },
      );
    }
    case "SET_LAB_CULTURE": {
      const culture = findLaboratoryCulture(command.cultureId);
      if (!culture)
        return laboratoryWarning(state, "Unknown laboratory culture.");
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            cultureId: culture.id,
            reproducibility: {
              ...lab.reproducibility,
              score: laboratoryReproducibilityScore({
                ...lab,
                cultureId: culture.id,
              }),
            },
            pendingDecision: `${culture.name} selected. Its collaboration and evidence tradeoffs are explicit in the laboratory ledger.`,
          },
        },
        { kind: "info", message: `Laboratory culture set to ${culture.name}.` },
      );
    }
    case "SELECT_LAB_SCENARIO": {
      const scenario = findLaboratoryScenario(command.scenarioId);
      if (!scenario || !lab.scenarioUnlockIds.includes(command.scenarioId))
        return laboratoryWarning(
          state,
          "Scenario is not unlocked by the retained run evidence.",
        );
      return appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            scenarioId: scenario.id,
            pendingDecision: scenario.description,
          },
        },
        {
          kind: "info",
          message: `Laboratory scenario selected: ${scenario.name}.`,
        },
      );
    }
    case "QUEUE_LAB_RUN": {
      const pipeline = lab.pipelines.find(
        (item) => item.id === command.pipelineId,
      );
      if (!pipeline)
        return laboratoryWarning(
          state,
          "Run queue rejected: unknown laboratory pipeline.",
        );
      if (pipeline.machineIds.length === 0)
        return laboratoryWarning(
          state,
          "Assign at least one machine before queueing a run.",
        );
      const remaining = 8 - pipeline.waitingRuns;
      const count = clamp(
        Math.trunc(command.count ?? 1),
        1,
        Math.max(0, remaining),
      );
      if (count <= 0)
        return laboratoryWarning(
          state,
          "That pipeline's bounded queue is full.",
        );
      const duration = laboratoryRunDuration(lab, pipeline.id);
      const cost = round(duration.cost * count, 3);
      const pipelineName =
        findLaboratoryPipeline(pipeline.id)?.name ?? pipeline.id;
      if (state.resources.money < cost)
        return laboratoryWarning(
          state,
          `The bounded run reserve needs $${cost.toFixed(3)}; no cash was spent.`,
        );
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - cost, 3),
          },
          laboratory: {
            ...lab,
            pipelines: lab.pipelines.map((item) =>
              item.id === pipeline.id
                ? { ...item, waitingRuns: item.waitingRuns + count }
                : item,
            ),
            totalOperatingCost: round(lab.totalOperatingCost + cost, 3),
            pendingDecision: `${count} bounded ${pipelineName} run${count === 1 ? "" : "s"} queued. Results will retain both successes and failures.`,
          },
        },
        {
          kind: "info",
          message: `${count} ${pipelineName} run${count === 1 ? "" : "s"} queued for $${cost.toFixed(3)}.`,
        },
      );
    }
    case "FOUND_LAB": {
      const readiness = laboratoryPipelineReadiness(lab);
      if (!readiness.ready)
        return laboratoryWarning(
          state,
          `Founding decision is not ready: ${readiness.reasons.join(" ")}`,
        );
      const endingId = chooseLaboratoryEnding(state, command.decision);
      const decisionState = appendEvent(
        {
          ...state,
          laboratory: {
            ...lab,
            foundingDecision: command.decision,
            pendingDecision: `Founding route selected: ${command.decision}. The evidence trail is retained in the postmortem.`,
          },
        },
        {
          kind: "success",
          message: `Founding decision recorded: ${command.decision}.`,
        },
      );
      return finalizeRunEnding(decisionState, endingId);
    }
  }
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
      return withUpgradeNotice(
        next,
        {
          kind: "info",
          message: `${module.name} equipped in ${slot.name}. Observed delta: ${previous.throughputPerMinute}/m → ${next.metrics.throughputPerMinute}/m throughput, ${previous.latencySeconds}s → ${next.metrics.latencySeconds}s latency, ${previous.memoryUsed} GB → ${next.metrics.memoryUsed} GB memory, ${previous.predictedQuality} → ${next.metrics.predictedQuality} predicted quality.`,
        },
        {
          modulePlacementId: module.id,
          modulePlacementSlotId: slot.id,
          modulePlacementFromSlotId: command.fromSlotId,
        },
      );
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
          message: `${item.name} costs ${formatExactCurrency(item.purchaseCost)}; ${formatExactCurrency(item.purchaseCost - state.resources.money)} more is required. No money was deducted.`,
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
            message: `${item.name} purchased for ${formatExactCurrency(item.purchaseCost)} and is now owned. Equip it to apply its constraints; purchase deducted exactly once.`,
          },
          {
            capitalPurchaseId: item.id,
            capitalPurchaseType: "hardware",
            capitalPurchaseCost: item.purchaseCost,
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
          message: `${item.name} costs ${formatExactCurrency(item.purchaseCost)}; ${formatExactCurrency(item.purchaseCost - state.resources.money)} more is required. No money was deducted.`,
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
        withUpgradeNotice(
          purchased,
          {
            kind: "success",
            message: modulePurchaseLedgerMessage(item.id)!,
          },
          {
            capitalPurchaseId: item.id,
            capitalPurchaseType: "module",
            capitalPurchaseCost: item.purchaseCost,
          },
        ),
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
          message: `${item.name} costs ${formatExactCurrency(item.purchaseCost)}; ${formatExactCurrency(item.purchaseCost - state.resources.money)} more is required. No money was deducted.`,
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
            message: `${item.name} purchased for ${formatExactCurrency(item.purchaseCost)} and is now owned. Activate it explicitly; its three new positions start empty and no module was bought or filled automatically.`,
          },
          {
            capitalPurchaseId: item.id,
            capitalPurchaseType: "expansion",
            capitalPurchaseCost: item.purchaseCost,
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
        return withUpgradeNotice(
          next,
          {
            kind: "success",
            message: `${item.name} activated: six usable process positions in one ordered pipeline. Three new positions are empty/bypassed.`,
          },
          { expansionActivationId: item.id },
        );
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
      return withUpgradeNotice(
        next,
        {
          kind: "info",
          message: `${item.name} removed from ${slot.name}; the empty position is bypassed and the owned module remains in inventory.`,
        },
        { moduleRemovalId: item.id, moduleRemovalSlotId: slot.id },
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
          queuedTaskIds: tasks.map((task) => task.id),
          queuedTaskWorkloadIds: tasks.map((task) => task.workloadId),
          queuedTaskQuotes: tasks.map((task) => task.lockedGrossQuote),
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
    case "SET_RESEARCH_GOAL": {
      const text = command.text.trim();
      if (!researchRecognition(researchContext(state)))
        return researchWarning(
          state,
          "Research is not recognized yet. Complete one accepted delivery before writing a research goal.",
        );
      if (text.length < 8 || text.length > 120)
        return researchWarning(
          state,
          "Research goal must be 8–120 characters so the pending decision stays legible.",
        );
      return appendEvent(
        {
          ...state,
          research: {
            ...state.research,
            goal: { text, createdAtTick: state.tick, status: "pending" },
            pendingDecision:
              "Inspect the frontier, then commit scarce cash and team time to one question.",
          },
        },
        { kind: "info", message: `Research goal saved: “${text}”` },
      );
    }
    case "SET_RESEARCH_COMPUTE_ALLOCATION": {
      if (
        !Number.isInteger(command.percent) ||
        command.percent < 25 ||
        command.percent > 100
      )
        return researchWarning(
          state,
          "Research compute allocation must stay between 25% and 100%.",
        );
      return appendEvent(
        {
          ...state,
          research: {
            ...state.research,
            computeAllocation: command.percent,
            pendingDecision: state.research.activeProject
              ? `Compute allocation set to ${command.percent}%. The active measurement remains bounded and deterministic.`
              : `Compute allocation set to ${command.percent}%. Review the opportunity cost before starting a project.`,
          },
        },
        {
          kind: "info",
          message: `Research compute allocation set to ${command.percent}%.`,
        },
      );
    }
    case "INSPECT_RESEARCH_PROJECT": {
      const project = findResearchProject(command.projectId);
      if (!project)
        return researchWarning(
          state,
          "Research evidence inspection rejected: unknown project.",
        );
      if (!researchRecognition(researchContext(state)))
        return researchWarning(
          state,
          "Research frontier is still hidden. Complete one accepted delivery first.",
        );
      if (!state.research.frontier.discoveredProjectIds.includes(project.id))
        return researchWarning(
          state,
          "That research question is still hidden. Follow the visible evidence first.",
        );
      if (state.research.frontier.inspectedProjectIds.includes(project.id))
        return state;
      const requirements = researchProjectRequirements(
        project,
        state.research,
        researchContext(state),
      );
      if (!requirements.unlocked)
        return researchWarning(
          state,
          `Inspect blocked: ${requirements.requirements.filter((item) => item.startsWith("Need")).join(" ")}`,
        );
      const inspected = {
        ...state.research,
        frontier: {
          ...state.research.frontier,
          inspectedProjectIds: [
            ...state.research.frontier.inspectedProjectIds,
            project.id,
          ],
        },
      };
      const revealed = addResearchReveals(
        inspected,
        researchInspectReveals(project),
      );
      return appendEvent(
        {
          ...state,
          research: {
            ...revealed,
            pendingDecision: `Evidence inspected for ${project.name}. Choose whether its uncertainty is worth the opportunity cost.`,
          },
        },
        {
          kind: "info",
          message: `Evidence inspected: ${project.name}. New researchers and questions may now be visible.`,
        },
      );
    }
    case "RECRUIT_RESEARCHER": {
      const researcher = findResearcher(command.researcherId);
      if (!researcher)
        return researchWarning(
          state,
          "Researcher recruitment rejected: unknown researcher.",
        );
      if (!researchRecognition(researchContext(state)))
        return researchWarning(
          state,
          "Recruitment is unavailable before Research recognition.",
        );
      if (!state.research.availableResearcherIds.includes(researcher.id))
        return researchWarning(
          state,
          `${researcher.name} is not currently available to recruit.`,
        );
      if (state.resources.reputation < researcher.minimumReputation)
        return researchWarning(
          state,
          `${researcher.name} needs ${researcher.minimumReputation.toFixed(2)} reputation; no cash was spent.`,
        );
      if (state.resources.money < researcher.recruitCost)
        return researchWarning(
          state,
          `${researcher.name} needs $${researcher.recruitCost.toFixed(3)}; no cash was spent.`,
        );
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - researcher.recruitCost, 3),
          },
          research: {
            ...state.research,
            availableResearcherIds:
              state.research.availableResearcherIds.filter(
                (id) => id !== researcher.id,
              ),
            recruitedResearcherIds: [
              ...state.research.recruitedResearcherIds,
              researcher.id,
            ],
            tacitKnowledge: {
              ...state.research.tacitKnowledge,
              [researcher.id]: 0,
            },
            pendingDecision: `${researcher.name} joined. Add a complementary team before committing an experiment.`,
          },
        },
        {
          kind: "success",
          message: `${researcher.name} recruited as ${researcher.archetype}.`,
        },
      );
    }
    case "RELEASE_RESEARCHER": {
      const researcher = findResearcher(command.researcherId);
      if (
        !researcher ||
        !state.research.recruitedResearcherIds.includes(command.researcherId)
      )
        return researchWarning(
          state,
          "Researcher release rejected: researcher is not on the roster.",
        );
      if (
        state.research.activeProject &&
        state.research.teamMemberIds.length <= 1 &&
        state.research.teamMemberIds.includes(researcher.id)
      )
        return researchWarning(
          state,
          "The active experiment needs one researcher. Finish or add a teammate before releasing this person.",
        );
      const tacit = state.research.tacitKnowledge[researcher.id] ?? 0;
      const retained = round(
        tacit * (0.35 + researcher.traits.mentorship * 0.35),
        3,
      );
      const nextTeam = state.research.teamMemberIds.filter(
        (id) => id !== researcher.id,
      );
      return appendEvent(
        {
          ...state,
          research: {
            ...state.research,
            recruitedResearcherIds:
              state.research.recruitedResearcherIds.filter(
                (id) => id !== researcher.id,
              ),
            teamMemberIds: nextTeam,
            availableResearcherIds: [
              ...state.research.availableResearcherIds,
              researcher.id,
            ],
            chemistry: researchTeamChemistry(nextTeam),
            retainedKnowledge: round(
              state.research.retainedKnowledge + retained,
              3,
            ),
            pendingDecision: `${researcher.name} left. ${retained.toFixed(2)} tacit knowledge was retained through notes and mentorship.`,
          },
        },
        {
          kind: "info",
          message: `${researcher.name} released; retained knowledge preserved ${retained.toFixed(2)}.`,
        },
      );
    }
    case "SET_RESEARCH_TEAM": {
      if (
        new Set(command.researcherIds).size !== command.researcherIds.length ||
        command.researcherIds.length > 3
      )
        return researchWarning(
          state,
          "Research team needs 0–3 distinct researchers.",
        );
      if (
        !command.researcherIds.every((id) =>
          state.research.recruitedResearcherIds.includes(id),
        )
      )
        return researchWarning(
          state,
          "Research team can only include recruited researchers.",
        );
      if (state.research.activeProject && command.researcherIds.length === 0)
        return researchWarning(
          state,
          "An active experiment needs at least one researcher.",
        );
      return appendEvent(
        {
          ...state,
          research: {
            ...state.research,
            teamMemberIds: [...command.researcherIds],
            chemistry: researchTeamChemistry(command.researcherIds),
            pendingDecision:
              command.researcherIds.length === 0
                ? "Recruit a researcher, then assemble a team with complementary strengths."
                : `Team ready. Chemistry ${researchTeamChemistry(command.researcherIds).toFixed(2)}; choose a question to run.`,
          },
        },
        {
          kind: "info",
          message:
            command.researcherIds.length === 0
              ? "Research team cleared."
              : "Research team updated; chemistry and execution are now visible.",
        },
      );
    }
    case "START_RESEARCH": {
      const project = findResearchProject(command.projectId);
      if (!project)
        return researchWarning(
          state,
          "Research start rejected: unknown project.",
        );
      if (!researchRecognition(researchContext(state)))
        return researchWarning(state, "Research is not recognized yet.");
      if (state.research.activeProject)
        return researchWarning(
          state,
          "Another experiment is active. Interpret its result before starting a second project.",
        );
      if (!state.research.goal)
        return researchWarning(
          state,
          "Write a short research goal first; it keeps the pending decision explicit.",
        );
      if (!state.research.frontier.inspectedProjectIds.includes(project.id))
        return researchWarning(
          state,
          "Inspect the evidence card before committing to this question.",
        );
      const requirements = researchProjectRequirements(
        project,
        state.research,
        researchContext(state),
      );
      if (!requirements.unlocked)
        return researchWarning(
          state,
          `Research start blocked: ${requirements.requirements.filter((item) => item.startsWith("Need")).join(" ")}`,
        );
      if (state.research.teamMemberIds.length === 0)
        return researchWarning(
          state,
          "Add at least one researcher to the team before starting.",
        );
      const estimate = researchEstimate(project, state.research);
      if (state.resources.money < estimate.cost)
        return researchWarning(
          state,
          `This experiment needs $${estimate.cost.toFixed(3)}; no cash was spent.`,
        );
      return appendEvent(
        {
          ...state,
          resources: {
            ...state.resources,
            money: round(state.resources.money - estimate.cost, 3),
          },
          research: {
            ...state.research,
            activeProject: {
              projectId: project.id,
              startedAtTick: state.tick,
              elapsedHours: 0,
              expectedDurationHours: estimate.durationHours,
              committedCost: estimate.cost,
            },
            pendingDecision: `Experiment running: ${project.name}. Interpret the result when measurement completes.`,
          },
        },
        {
          kind: "info",
          message: `${project.name} started for $${estimate.cost.toFixed(3)}; expected duration ${estimate.durationHours.toFixed(2)}h. Failure remains informative.`,
        },
      );
    }
    case "FIRST_PRINCIPLES_RECONSTRUCTION": {
      if (!researchRecognition(researchContext(state)))
        return researchWarning(
          state,
          "First-Principles Reconstruction requires Research recognition.",
        );
      if (
        !state.research.recruitedResearcherIds.includes("orin-kade") ||
        !state.research.teamMemberIds.includes("orin-kade")
      )
        return researchWarning(
          state,
          "Recruit and add Orin Kade to the research team before using First-Principles Reconstruction.",
        );
      if (state.research.goal === null)
        return researchWarning(
          state,
          "Write a research goal before using First-Principles Reconstruction.",
        );
      if (state.research.firstPrinciplesUses >= MAX_FIRST_PRINCIPLES_USES)
        return researchWarning(
          state,
          "First-Principles Reconstruction is already retained for this run; interpret its assumptions before using another signature action.",
        );
      const nextTacit = researchTeamKnowledge(state.research, 0.24);
      return appendEvent(
        {
          ...state,
          research: {
            ...state.research,
            institutionalKnowledge: round(
              state.research.institutionalKnowledge + 0.3,
              3,
            ),
            tacitKnowledge: nextTacit,
            strategicOptionIds: state.research.strategicOptionIds.includes(
              "reconstruction-plan",
            )
              ? state.research.strategicOptionIds
              : [...state.research.strategicOptionIds, "reconstruction-plan"],
            firstPrinciplesUses: state.research.firstPrinciplesUses + 1,
            pendingDecision:
              "First principles exposed the assumptions. Choose whether to run the reconstructed plan or teach it through replication.",
          },
        },
        {
          kind: "success",
          message:
            "First-Principles Reconstruction completed: assumptions, constraints, and a teachable plan are now retained.",
        },
      );
    }
    case "COVER_NARRATIVE":
      return applyCoverNarrative(state, command.narrativeId, command.creatorId);
    case "PUBLISH_PREDICTION":
      return applyPrediction(
        state,
        command.narrativeId,
        command.prediction,
        command.confidence,
      );
    case "RESPOND_TO_NARRATIVE":
      return applyNarrativeResponse(state, command.response);
    case "RESPOND_TO_FEAR":
      return applyFearResponse(state, command.response);
    case "SWITCH_TOOL":
      return applyToolSwitch(state, command.toolId);
    case "BUY_LAB_MACHINE":
    case "ADD_LAB_PIPELINE":
    case "ASSIGN_LAB_MACHINE":
    case "INVITE_LAB_COLLABORATOR":
    case "SET_LAB_REPRODUCIBILITY":
    case "DOCUMENT_LAB_RUN":
    case "SET_LAB_CULTURE":
    case "SELECT_LAB_SCENARIO":
    case "QUEUE_LAB_RUN":
    case "FOUND_LAB":
      return applyLaboratoryCommand(state, command);
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
  const applied = advanceHypeFear(applyValidCommand(state, command));
  if (applied === state) return state;
  const next = sealSimulationState(
    resolveRunEnding(
      refreshEvaluationWarnings(
        refreshLaboratoryAccess(
          refreshCareerUnlocks(refreshWorkloadUnlocks(applied)),
        ),
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
  next = advanceResearch(next, elapsed);
  next = advanceLaboratory(next, elapsed);
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
  const settlementFailureCause: JobSettlementFailureCause | null = failed
    ? missingModel
      ? "no-model-stage"
      : memoryFailure
        ? "memory-capacity-exceeded"
        : "malformed-output"
    : null;
  const grossPayout = failed ? 0 : task.lockedGrossQuote;
  const operatingCost = taskMetrics.operatingCost;
  const operatingCostPaid = round(
    Math.min(operatingCost, moneyBeforeSettlement + grossPayout),
    3,
  );
  const unpaidOperatingCost = round(operatingCost - operatingCostPaid, 3);
  const economicNet = round(grossPayout - operatingCost, 3);
  // Ledger settlement sentences are accounting disclosures: every term of the
  // equation stays fixed at three decimals, including a zero payout or floor.
  const settlementCurrency = (amount: number) => formatExactCurrency(amount);
  const signedSettlementCurrency = (amount: number) =>
    `${amount >= 0 ? "+" : "−"}${formatExactCurrency(Math.abs(amount))}`;
  const settlementLedgerEventId = allocateNextLedgerEvent(next)?.id;
  if (!settlementLedgerEventId) return state;
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
      ledgerEventId: settlementLedgerEventId,
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
      settlementTaskId: task.id,
      settlementWorkloadId: task.workloadId,
      settlementLockedGrossQuote: task.lockedGrossQuote,
      settlementGrossPayout: grossPayout,
      settlementOperatingCost: operatingCost,
      settlementOperatingCostPaid: operatingCostPaid,
      settlementNetChange: round(moneyAfter - moneyBeforeSettlement, 3),
      message: `${workload.name} task ${task.id} completed; ${settlementCurrency(task.lockedGrossQuote)} gross payout earned before operating cost (locked quote) − ${settlementCurrency(operatingCost)} configured actual cost = ${signedSettlementCurrency(economicNet)} net. ${unpaidOperatingCost > 0 ? `${settlementCurrency(operatingCostPaid)} was paid and ${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below ${settlementCurrency(0)}.` : "The configured cost was paid in full."} Future ${workload.name} demand is lower and recovers with simulated time.`,
    });
  } else {
    next = appendEvent(next, {
      kind: "failure",
      settlementTaskId: task.id,
      settlementFailureCause: settlementFailureCause ?? undefined,
      settlementWorkloadId: task.workloadId,
      settlementLockedGrossQuote: task.lockedGrossQuote,
      settlementGrossPayout: grossPayout,
      settlementOperatingCost: operatingCost,
      settlementOperatingCostPaid: operatingCostPaid,
      settlementNetChange: round(moneyAfter - moneyBeforeSettlement, 3),
      message: missingModel
        ? `${workload.name} task ${task.id} failed before delivery: no model stage produced an answer. Locked quote paid ${settlementCurrency(0)} gross; configured actual cost was ${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `${settlementCurrency(operatingCostPaid)} was paid and ${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below ${settlementCurrency(0)}.` : "The configured cost was paid in full."}`
        : memoryFailure
          ? `${workload.name} task ${task.id} failed before delivery: memory capacity exceeded. Locked quote paid ${settlementCurrency(0)} gross; configured actual cost was ${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `${settlementCurrency(operatingCostPaid)} was paid and ${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below ${settlementCurrency(0)}.` : "The configured cost was paid in full."}`
          : `${workload.name} task ${task.id} produced unstable output and was rejected. Locked quote paid ${settlementCurrency(0)} gross; configured actual cost was ${settlementCurrency(operatingCost)}. ${unpaidOperatingCost > 0 ? `${settlementCurrency(operatingCostPaid)} was paid and ${settlementCurrency(unpaidOperatingCost)} remains unpaid because cash cannot go below ${settlementCurrency(0)}.` : "The configured cost was paid in full."}`,
      directCause:
        settlementFailureCause === null
          ? undefined
          : JOB_SETTLEMENT_FAILURE_CAUSE_TEXT[settlementFailureCause],
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
  next = refreshLaboratoryAccess(advanceHypeFear(next));
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

  const capitalCommitmentEvents = ledger.filter((event) =>
    isCapitalPurchaseLedgerEvidence(event),
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

function isSettlementLedgerPayloadValid(event: LedgerEvent): boolean {
  const fields = [
    event.settlementWorkloadId,
    event.settlementLockedGrossQuote,
    event.settlementGrossPayout,
    event.settlementOperatingCost,
    event.settlementOperatingCostPaid,
    event.settlementNetChange,
  ];
  if (fields.every((field) => field === undefined)) return true;
  if (
    event.settlementTaskId === undefined ||
    fields.some((field) => field === undefined) ||
    event.kind === "info" ||
    event.kind === "warning"
  )
    return false;
  const workloadId = event.settlementWorkloadId;
  const lockedGrossQuote = event.settlementLockedGrossQuote;
  const grossPayout = event.settlementGrossPayout;
  const operatingCost = event.settlementOperatingCost;
  const operatingCostPaid = event.settlementOperatingCostPaid;
  const netChange = event.settlementNetChange;
  const workload = findWorkload(workloadId);
  return (
    workload !== undefined &&
    workloadId !== undefined &&
    lockedGrossQuote !== undefined &&
    grossPayout !== undefined &&
    operatingCost !== undefined &&
    operatingCostPaid !== undefined &&
    netChange !== undefined &&
    Number.isFinite(lockedGrossQuote) &&
    lockedGrossQuote >= 0 &&
    lockedGrossQuote <= workload.rewardMoney &&
    Number.isFinite(grossPayout) &&
    grossPayout >= 0 &&
    grossPayout <= lockedGrossQuote &&
    Number.isFinite(operatingCost) &&
    operatingCost >= 0 &&
    Number.isFinite(operatingCostPaid) &&
    operatingCostPaid >= 0 &&
    operatingCostPaid <= operatingCost &&
    Number.isFinite(netChange)
  );
}

function isCapitalPurchaseLedgerPayloadValid(event: LedgerEvent): boolean {
  const fields = [
    event.capitalPurchaseId,
    event.capitalPurchaseType,
    event.capitalPurchaseCost,
  ];
  if (fields.every((field) => field === undefined)) return true;
  return (
    fields.every((field) => field !== undefined) &&
    Number.isFinite(event.capitalPurchaseCost) &&
    isCapitalPurchaseLedgerEvidence(event)
  );
}

function isExpansionActivationLedgerPayloadValid(event: LedgerEvent): boolean {
  if (event.expansionActivationId === undefined) return true;
  const item = findPipelineExpansion(event.expansionActivationId);
  return (
    event.kind === "success" &&
    item !== undefined &&
    event.message === expansionActivationLedgerMessage(item.id)
  );
}

function isModuleTopologyLedgerPayloadValid(event: LedgerEvent): boolean {
  const placementFields = [
    event.modulePlacementId,
    event.modulePlacementSlotId,
    event.modulePlacementFromSlotId,
  ];
  const removalFields = [event.moduleRemovalId, event.moduleRemovalSlotId];
  if (
    placementFields.every((field) => field === undefined) &&
    removalFields.every((field) => field === undefined)
  )
    return true;
  const hasPlacement = placementFields.some((field) => field !== undefined);
  const hasRemoval = removalFields.some((field) => field !== undefined);
  if (
    event.kind !== "info" ||
    (event.modulePlacementId === undefined) !==
      (event.modulePlacementSlotId === undefined) ||
    (event.moduleRemovalId === undefined) !==
      (event.moduleRemovalSlotId === undefined) ||
    (hasPlacement && hasRemoval)
  )
    return false;
  if (event.modulePlacementId !== undefined) {
    const module = findModule(event.modulePlacementId);
    const slot =
      event.modulePlacementSlotId === undefined
        ? undefined
        : findSlot(event.modulePlacementSlotId);
    const fromSlot =
      event.modulePlacementFromSlotId === undefined
        ? undefined
        : findSlot(event.modulePlacementFromSlotId);
    return (
      module !== undefined &&
      slot !== undefined &&
      slot.type === "process" &&
      module.slotTypes.includes(slot.type) &&
      (fromSlot === undefined ||
        (fromSlot.id !== slot.id && fromSlot.type === "process")) &&
      event.message.startsWith(`${module.name} equipped in ${slot.name}.`)
    );
  }
  const module =
    event.moduleRemovalId === undefined
      ? undefined
      : findModule(event.moduleRemovalId);
  const slot =
    event.moduleRemovalSlotId === undefined
      ? undefined
      : findSlot(event.moduleRemovalSlotId);
  return (
    module !== undefined &&
    slot !== undefined &&
    slot.type === "process" &&
    event.message.startsWith(
      `${module.name} removed from ${slot.name}; the empty position is bypassed`,
    )
  );
}

function isQueueLedgerPayloadValid(event: LedgerEvent): boolean {
  const ids = event.queuedTaskIds;
  const workloadIds = event.queuedTaskWorkloadIds;
  const quotes = event.queuedTaskQuotes;
  if (ids === undefined && workloadIds === undefined && quotes === undefined)
    return true;
  return (
    event.kind === "info" &&
    Array.isArray(ids) &&
    Array.isArray(workloadIds) &&
    Array.isArray(quotes) &&
    ids.length > 0 &&
    ids.length <= MAX_QUEUED_TASKS &&
    ids.length === workloadIds.length &&
    ids.length === quotes.length &&
    ids.every((id) => isText(id, 128) && id.length > 0) &&
    new Set(ids).size === ids.length &&
    workloadIds.every((id) => findWorkload(id) !== undefined) &&
    quotes.every((quote) => Number.isFinite(quote) && quote >= 0)
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
      isResearchStateShapeValid(state.research, state.tick) &&
      isHypeFearStateShapeValid(state.hypeFear, state.tick) &&
      isLaboratoryStateShapeValid(state.laboratory, state.tick) &&
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
          (state.lastSettlement.ledgerEventId === undefined ||
            (isText(state.lastSettlement.ledgerEventId, 128) &&
              state.lastSettlement.ledgerEventId.length > 0)) &&
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
          (event.settlementTaskId === undefined ||
            (isText(event.settlementTaskId, 128) &&
              event.settlementTaskId.length > 0)) &&
          (event.settlementFailureCause === undefined ||
            (event.kind === "failure" &&
              event.settlementTaskId !== undefined &&
              isJobSettlementFailureCause(event.settlementFailureCause))) &&
          isSettlementLedgerPayloadValid(event) &&
          isCapitalPurchaseLedgerPayloadValid(event) &&
          isExpansionActivationLedgerPayloadValid(event) &&
          isModuleTopologyLedgerPayloadValid(event) &&
          isQueueLedgerPayloadValid(event) &&
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

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isKnownUniqueIdArray(
  value: unknown,
  lookup: (id: string) => unknown,
): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((id) => typeof id === "string" && lookup(id) !== undefined) &&
    new Set(value).size === value.length
  );
}

/**
 * Schema 3/4 are the only migrations that intentionally coerce old aggregate
 * fields. Validate their complete required source shape first so a supported
 * label cannot turn an invalid type into a plausible defaulted save.
 */
function isLegacyPipelineToyRecordValid(
  record: Record<string, unknown>,
): boolean {
  const schemaVersion = record.schemaVersion;
  if (schemaVersion !== 3 && schemaVersion !== 4) return false;
  if (
    !isNonNegativeSafeInteger(record.seed) ||
    record.seed === 0 ||
    record.seed > 0xffff_ffff ||
    !isNonNegativeSafeInteger(record.rngState) ||
    record.rngState === 0 ||
    record.rngState > 0xffff_ffff ||
    !isNonNegativeSafeInteger(record.tick) ||
    typeof record.hardwareId !== "string" ||
    findHardware(record.hardwareId) === undefined ||
    typeof record.workloadId !== "string" ||
    findWorkload(record.workloadId) === undefined ||
    typeof record.branchEnabled !== "boolean" ||
    typeof record.computeAllocation !== "number" ||
    !Number.isInteger(record.computeAllocation) ||
    record.computeAllocation < 25 ||
    record.computeAllocation > 100 ||
    typeof record.memoryReserve !== "number" ||
    !Number.isInteger(record.memoryReserve) ||
    record.memoryReserve < 0 ||
    record.memoryReserve > 30 ||
    safeLegacySlots(record.slots) === null
  )
    return false;

  const resources = record.resources;
  if (
    typeof resources !== "object" ||
    resources === null ||
    !isNonNegativeFinite((resources as Record<string, unknown>).money) ||
    !isNonNegativeFinite((resources as Record<string, unknown>).timeHours) ||
    !isNonNegativeFinite(
      (resources as Record<string, unknown>).electricityKwh,
    ) ||
    !isNonNegativeFinite((resources as Record<string, unknown>).reputation)
  )
    return false;

  const jobs = record.jobs;
  if (
    typeof jobs !== "object" ||
    jobs === null ||
    !isNonNegativeSafeInteger((jobs as Record<string, unknown>).queued) ||
    ((jobs as Record<string, unknown>).queued as number) > MAX_QUEUED_TASKS ||
    !isNonNegativeSafeInteger((jobs as Record<string, unknown>).completed) ||
    !isNonNegativeSafeInteger((jobs as Record<string, unknown>).failed) ||
    !isNonNegativeFinite((jobs as Record<string, unknown>).processingCarry) ||
    ((jobs as Record<string, unknown>).processingCarry as number) >= 1 ||
    typeof (jobs as Record<string, unknown>).paused !== "boolean" ||
    !isNonNegativeFinite((jobs as Record<string, unknown>).grossEarned) ||
    !isNonNegativeFinite((jobs as Record<string, unknown>).operatingCostsPaid)
  )
    return false;

  if (schemaVersion === 4) {
    const ownedHardwareIds = record.ownedHardwareIds;
    const ownedModuleIds = record.ownedModuleIds;
    if (
      !isKnownUniqueIdArray(ownedHardwareIds, findHardware) ||
      !isKnownUniqueIdArray(ownedModuleIds, findModule) ||
      !ownedHardwareIds.includes(STARTER_HARDWARE_ID) ||
      !ownedHardwareIds.includes(record.hardwareId) ||
      !starterModuleIds.every((id) => ownedModuleIds.includes(id))
    )
      return false;
  }
  return true;
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

/**
 * A stale save can retain gameplay state after the established semantic
 * recovery checks, but its ledger IDs and optional settlement provenance are
 * input, not historical proof. Rebuild the deterministic ID tail solely to
 * keep future appends operable, then remove the optional causal link before
 * resealing. Canonical-looking IDs, order, task fields, and typed markers are
 * all mutable with a stale seal and cannot authenticate a precise cause.
 */
function normalizeUntrustedLedgerState(
  state: SimulationState,
): SimulationState {
  if (
    !Array.isArray(state.ledger) ||
    !state.ledger.every((event) => typeof event === "object" && event !== null)
  )
    return state;
  const ledger = canonicalizeLedgerEventIds(state.ledger, state.eventSequence);
  if (!ledger) return state;
  const settlement = state.lastSettlement;
  if (settlement === null || typeof settlement !== "object")
    return { ...state, ledger };
  return {
    ...state,
    ledger,
    lastSettlement: { ...settlement, ledgerEventId: undefined },
  };
}

function queuedJobsLedgerMessage(
  count: number,
  workloadId: string,
): string | null {
  const workload = findWorkload(workloadId);
  if (!workload || !Number.isSafeInteger(count) || count <= 0) return null;
  return `${count} ${workload.name.toLowerCase()} job${count === 1 ? "" : "s"} queued.`;
}

function hasCorroboratedQueuedTasks(state: SimulationState): boolean {
  const tasks = [
    ...(state.jobs.activeTask ? [state.jobs.activeTask] : []),
    ...state.jobs.waitingTasks,
  ];
  if (tasks.length === 0) return state.jobs.queued === 0;
  if (
    state.eventSequence > MAX_LEDGER_EVENTS ||
    state.ledger.length !== state.eventSequence ||
    state.jobs.queued !== tasks.length
  )
    return false;

  const taskIds = new Set<string>();
  for (const task of tasks) {
    const sequence = /^task-(\d+)-(\d+)$/.exec(task.id);
    if (
      sequence === null ||
      Number(sequence[1]) !== task.acceptedAtTick ||
      !Number.isSafeInteger(Number(sequence[2])) ||
      Number(sequence[2]) < 1 ||
      taskIds.has(task.id)
    )
      return false;
    taskIds.add(task.id);
  }

  const queueEvents = state.ledger.filter(
    (event) =>
      event.kind === "info" &&
      event.queuedTaskIds !== undefined &&
      event.queuedTaskWorkloadIds !== undefined &&
      event.queuedTaskQuotes !== undefined,
  );
  if (queueEvents.length === 0) return false;
  return tasks.every((task) =>
    queueEvents.some((event) => {
      const ids = event.queuedTaskIds ?? [];
      const workloadIds = event.queuedTaskWorkloadIds ?? [];
      const quotes = event.queuedTaskQuotes ?? [];
      const index = ids.indexOf(task.id);
      const message = queuedJobsLedgerMessage(ids.length, task.workloadId);
      return (
        index >= 0 &&
        workloadIds[index] === task.workloadId &&
        event.tick === task.acceptedAtTick &&
        message !== null &&
        event.message === message &&
        quotes[index] === task.lockedGrossQuote
      );
    }),
  );
}

function taskSequenceFromId(id: string): number | null {
  const match = /^task-\d+-(\d+)$/.exec(id);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) && sequence > 0 ? sequence : null;
}

function safeNextTaskSequence(state: SimulationState): number {
  const ids = [
    ...(state.jobs.activeTask ? [state.jobs.activeTask.id] : []),
    ...state.jobs.waitingTasks.map((task) => task.id),
    ...state.ledger.flatMap((event) =>
      event.settlementTaskId ? [event.settlementTaskId] : [],
    ),
  ];
  const maximum = ids.reduce((current, id) => {
    const sequence = taskSequenceFromId(id);
    return sequence === null ? current : Math.max(current, sequence);
  }, 0);
  return Math.max(1, maximum + 1);
}

function matchingSettlementEvent(
  state: SimulationState,
  settlement: SimulationState["lastSettlement"],
): LedgerEvent | undefined {
  if (!settlement) return undefined;
  return state.ledger.find(
    (event) =>
      event.settlementTaskId === settlement.taskId &&
      event.tick === settlement.tick &&
      (event.kind === "success" || event.kind === "failure") &&
      isSettlementLedgerPayloadValid(event) &&
      event.settlementWorkloadId === settlement.workloadId &&
      event.settlementLockedGrossQuote === settlement.lockedGrossQuote &&
      event.settlementGrossPayout === settlement.grossPayout &&
      event.settlementOperatingCost === settlement.operatingCost &&
      event.settlementNetChange === settlement.netChange,
  );
}

function hasCompleteRetainedLedger(state: SimulationState): boolean {
  return (
    state.eventSequence <= MAX_LEDGER_EVENTS &&
    state.ledger.length === state.eventSequence
  );
}

function reconstructUnsealedJobs(
  state: SimulationState,
  fallback: SimulationState,
): {
  jobs: SimulationState["jobs"];
  lastSettlement: SimulationState["lastSettlement"];
} {
  const completeLedger = hasCompleteRetainedLedger(state);
  const settlementEvents = state.ledger.filter(
    (event) =>
      event.settlementTaskId !== undefined &&
      (event.kind === "success" || event.kind === "failure"),
  );
  const corroboratedSettlements = completeLedger
    ? settlementEvents.filter(
        (event) =>
          isSettlementLedgerPayloadValid(event) &&
          event.settlementWorkloadId !== undefined &&
          event.settlementLockedGrossQuote !== undefined &&
          event.settlementGrossPayout !== undefined &&
          event.settlementOperatingCost !== undefined &&
          event.settlementOperatingCostPaid !== undefined &&
          event.settlementNetChange !== undefined,
      )
    : [];
  const completed = corroboratedSettlements.filter(
    (event) => event.kind === "success",
  ).length;
  const failed = corroboratedSettlements.filter(
    (event) => event.kind === "failure",
  ).length;
  const tasksCorroborated = completeLedger && hasCorroboratedQueuedTasks(state);
  const lastSettlement = matchingSettlementEvent(state, state.lastSettlement)
    ? state.lastSettlement && {
        ...state.lastSettlement,
        ledgerEventId: undefined,
      }
    : null;
  const jobs = {
    ...fallback.jobs,
    completed,
    failed,
    grossEarned: completeLedger
      ? round(
          corroboratedSettlements.reduce(
            (total, event) => total + (event.settlementGrossPayout ?? 0),
            0,
          ),
          3,
        )
      : 0,
    operatingCostsPaid: completeLedger
      ? round(
          corroboratedSettlements.reduce(
            (total, event) => total + (event.settlementOperatingCostPaid ?? 0),
            0,
          ),
          3,
        )
      : 0,
    activeTask: tasksCorroborated ? state.jobs.activeTask : null,
    waitingTasks: tasksCorroborated ? state.jobs.waitingTasks : [],
    queued: tasksCorroborated ? state.jobs.queued : 0,
    processingCarry: tasksCorroborated
      ? (state.jobs.activeTask?.progress ?? 0)
      : 0,
    paused: state.jobs.paused,
    nextTaskSequence: safeNextTaskSequence(state),
  };
  return { jobs, lastSettlement };
}

function reconstructUnsealedFirstSession(
  state: SimulationState,
  fallback: SimulationState,
  ownedModuleIds: readonly string[],
  tasksCorroborated: boolean,
): SimulationState["firstSession"] {
  const progress = state.firstSession;
  if (isLegacyFirstSessionProgress(progress)) return progress;
  if (!isFirstSessionProgressValid(progress)) return fallback.firstSession;
  if (progress.step === "queue-starter") return fallback.firstSession;
  if (progress.step === "observe-settlement")
    return tasksCorroborated ? progress : fallback.firstSession;
  const hasStarterSettlement =
    progress.starterTaskId !== null &&
    progress.observedSettlementTaskId === progress.starterTaskId &&
    hasRecordedStarterSettlement(state, progress.starterTaskId);
  if (!hasStarterSettlement) return fallback.firstSession;
  const hasPurchase =
    progress.purchasedModuleId === null ||
    (ownedModuleIds.includes(progress.purchasedModuleId) &&
      hasRecordedFirstSessionPurchase(state));
  if (!hasPurchase)
    return {
      ...progress,
      step: "buy-and-install",
      purchasedModuleId: null,
    };
  return {
    ...progress,
    // Completion is corroborated by the retained starter settlement, paid
    // purchase, and the pre-restore installed topology check. The slot map
    // itself is not authority and is rebuilt canonically below.
    step: progress.step,
  };
}

function canonicalRecoverySlots(
  fallback: SimulationState,
  activeExpansionId: string | null,
  state: Pick<SimulationState, "ledger">,
  ownedModuleIds: readonly string[],
): readonly PipelineSlotState[] {
  const topology = activeExpansionId === null ? starterSlots : slots;
  const recovered = topology.map((slot) => {
    const baseline = fallback.slots.find((entry) => entry.slotId === slot.id);
    return baseline ?? { slotId: slot.id, moduleId: null };
  });
  const slotState = (slotId: string) =>
    recovered.find((entry) => entry.slotId === slotId);
  for (const event of state.ledger) {
    if (!isModuleTopologyLedgerPayloadValid(event)) continue;
    if (
      event.moduleRemovalId !== undefined &&
      event.moduleRemovalSlotId !== undefined
    ) {
      const slot = slotState(event.moduleRemovalSlotId);
      if (slot?.moduleId === event.moduleRemovalId) slot.moduleId = null;
      continue;
    }
    if (
      event.modulePlacementId === undefined ||
      event.modulePlacementSlotId === undefined ||
      !ownedModuleIds.includes(event.modulePlacementId)
    )
      continue;
    const destination = slotState(event.modulePlacementSlotId);
    if (!destination) continue;
    const source =
      event.modulePlacementFromSlotId === undefined
        ? undefined
        : slotState(event.modulePlacementFromSlotId);
    if (event.modulePlacementFromSlotId !== undefined) {
      if (!source || source.moduleId !== event.modulePlacementId) continue;
      const displaced = destination.moduleId;
      destination.moduleId = event.modulePlacementId;
      source.moduleId = displaced;
      continue;
    }
    const previous = recovered.find(
      (entry) =>
        entry.moduleId === event.modulePlacementId &&
        entry.slotId !== destination.slotId,
    );
    if (previous) previous.moduleId = destination.moduleId;
    destination.moduleId = event.modulePlacementId;
  }
  return recovered;
}

/**
 * Rebuild an unsealed snapshot from the safe seed baseline. Every retained
 * progression group has an explicit engine-owned corroborator: exact purchase
 * text for inventory, purchase plus activation for expanded topology, typed
 * settlement/queue records for task accounting, and recomputed causal evidence
 * for evaluation/ending identity. Shape-valid projections are never copied as
 * authority merely because they pass the structural validator.
 */
function normalizeUnsealedProgressionState(
  state: SimulationState,
  fallback: SimulationState,
): SimulationState {
  const ownedHardwareIds = [
    STARTER_HARDWARE_ID,
    ...state.ownedHardwareIds.filter((id) => {
      const item = findHardware(id);
      return (
        item !== undefined &&
        id !== STARTER_HARDWARE_ID &&
        hasRecordedCapitalPurchase(state, {
          id: item.id,
          kind: "hardware",
          cost: item.purchaseCost,
          messages: [hardwarePurchaseLedgerMessage(item.id)],
        })
      );
    }),
  ];
  const ownedModuleIds = [
    ...starterModuleIds,
    ...state.ownedModuleIds.filter((id) => {
      const item = findModule(id);
      return (
        item !== undefined &&
        !starterModuleIds.includes(id) &&
        hasRecordedCapitalPurchase(state, {
          id: item.id,
          kind: "module",
          cost: item.purchaseCost,
          messages: [
            modulePurchaseLedgerMessage(item.id),
            modulePurchaseLedgerMessage(item.id, (amount) =>
              formatCurrency(amount, 2),
            ),
          ],
        })
      );
    }),
  ];
  const ownedExpansionIds = state.ownedExpansionIds.filter((id) => {
    const item = findPipelineExpansion(id);
    return (
      item !== undefined &&
      hasRecordedCapitalPurchase(state, {
        id: item.id,
        kind: "expansion",
        cost: item.purchaseCost,
        messages: [expansionPurchaseLedgerMessage(item.id)],
      })
    );
  });
  const activeExpansionItem =
    state.activeExpansionId !== null &&
    ownedExpansionIds.includes(state.activeExpansionId)
      ? findPipelineExpansion(state.activeExpansionId)
      : undefined;
  const safeActiveExpansionId =
    activeExpansionItem &&
    hasExactSuccessLedgerMessage(
      state,
      expansionActivationLedgerMessage(activeExpansionItem.id),
      activeExpansionItem.id,
    )
      ? activeExpansionItem.id
      : null;
  const { jobs, lastSettlement } = reconstructUnsealedJobs(state, fallback);
  const sourceCareer = state.career;
  const causalEvidenceCorroborated =
    isEvaluationStateValid(sourceCareer.evaluation) &&
    hasRetainedCausalLedgerEvidence(state);
  const endingCorroborated =
    causalEvidenceCorroborated &&
    hasMatchingEndingEvidence(state, sourceCareer.runEnding);
  const safeEnding = endingCorroborated ? sourceCareer.runEnding : null;
  const safeMeta = safeEnding
    ? {
        ...fallback.meta,
        unlockedDiagnosticIds: [safeEnding.diagnosticUnlockId],
        completedEndingIds: [safeEnding.id],
      }
    : fallback.meta;
  const safeCareer: CareerState = {
    ...fallback.career,
    evaluation: causalEvidenceCorroborated
      ? sourceCareer.evaluation
      : fallback.career.evaluation,
    runEnding: safeEnding,
  };
  const firstSession = reconstructUnsealedFirstSession(
    state,
    fallback,
    ownedModuleIds,
    jobs.queued > 0 || state.firstSession.step !== "observe-settlement",
  );
  const causalEvidenceSnapshot =
    state.causalEvidenceSnapshot !== undefined &&
    isCausalEvidenceSnapshotShapeValid(state.causalEvidenceSnapshot) &&
    evaluationStatesMatch(
      state.causalEvidenceSnapshot.evaluation,
      safeCareer.evaluation,
    )
      ? state.causalEvidenceSnapshot
      : undefined;
  return {
    ...state,
    hardwareId: STARTER_HARDWARE_ID,
    ownedHardwareIds: [...new Set(ownedHardwareIds)],
    ownedModuleIds: [...new Set(ownedModuleIds)],
    ownedExpansionIds: [...new Set(ownedExpansionIds)],
    activeExpansionId: safeActiveExpansionId,
    unlockedWorkloadIds: fallback.unlockedWorkloadIds,
    workloadDemand: fallback.workloadDemand,
    // Workload selection is a mutable projection, not a retained transition
    // record. Rebuild it from the canonical starter baseline at this trust
    // boundary; queue/task identity is retained only through the typed ledger
    // corroborator above.
    workloadId: fallback.workloadId,
    slots: canonicalRecoverySlots(
      fallback,
      safeActiveExpansionId,
      state,
      ownedModuleIds,
    ),
    branchEnabled: fallback.branchEnabled,
    // Core runtime controls remain bounded, structurally validated state. They
    // do not authorize progression, ownership, or causal evidence, and keeping
    // them preserves a paused stale save across a worker/PWA restart.
    computeAllocation: state.computeAllocation,
    memoryReserve: state.memoryReserve,
    career: safeCareer,
    research: fallback.research,
    hypeFear: fallback.hypeFear,
    laboratory: fallback.laboratory,
    meta: safeMeta,
    firstSession,
    jobs,
    lastSettlement,
    metrics: fallback.metrics,
    baselineMetrics: null,
    baselineLabel: null,
    failedModuleId: null,
    lastWarning: fallback.lastWarning,
    lastUpgradeNotice: null,
    causalEvidenceSnapshot,
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
  if (!isSupportedRestoreRecord(record)) return fallback;
  if (record.schemaVersion === SCHEMA_VERSION) {
    if (
      record.contentVersion !== CONTENT_VERSION &&
      record.contentVersion !== PREVIOUS_CONTENT_VERSION &&
      record.contentVersion !== EARLIER_CONTENT_VERSION &&
      record.contentVersion !== LEGACY_CONTENT_VERSION
    )
      return fallback;
    const storedFirstSession = record.firstSession;
    if (
      storedFirstSession !== undefined &&
      !isFirstSessionProgressValid(storedFirstSession)
    )
      return fallback;
    const originalIntegrityValid =
      isIntegrityShapeValid(record.integrity) &&
      hasValidStateIntegrity(record as unknown as SimulationState);
    // Missing guide state is a documented pre-guide schema-7 migration only
    // when the original record proves it was not deleted after persistence.
    // Do this before substituting the legacy-complete sentinel below.
    if (storedFirstSession === undefined && !originalIntegrityValid)
      return fallback;
    let migration = isMigrationMetadataValid(record.migration)
      ? record.migration
      : {
          sourceSchemaVersion: SCHEMA_VERSION,
          steps: ["schema-v7-metadata-added"],
        };
    const storedResearch = record.research;
    const storedHypeFear = record.hypeFear;
    const storedLaboratory = record.laboratory;
    const restoreTick =
      typeof record.tick === "number" ? record.tick : Number.NaN;
    const researchShapeValid = isResearchStateShapeValid(
      storedResearch,
      restoreTick,
    );
    // A shape-valid Research object is not historical proof. Preserve frontier,
    // team, goal, and knowledge only when the complete save was sealed before
    // the object was supplied to restore; otherwise recover the safe default.
    const researchIsValid = originalIntegrityValid && researchShapeValid;
    const research = researchIsValid
      ? storedResearch
      : createInitialResearchState();
    const hypeFearShapeValid = isHypeFearStateShapeValid(
      storedHypeFear,
      restoreTick,
    );
    // Hype/Fear is a durable semantic layer. Like Research, a shape-valid
    // object is retained only when the complete pre-restore record was sealed;
    // stale or forged additions recover to the safe default.
    const hypeFearIsValid = originalIntegrityValid && hypeFearShapeValid;
    const hypeFear = hypeFearIsValid
      ? storedHypeFear
      : createInitialHypeFearState();
    const laboratoryShapeValid = isLaboratoryStateShapeValid(
      storedLaboratory,
      restoreTick,
    );
    const laboratoryIsValid = originalIntegrityValid && laboratoryShapeValid;
    const laboratory = laboratoryIsValid
      ? storedLaboratory
      : createInitialLaboratoryState(
          typeof record.seed === "number" && Number.isFinite(record.seed)
            ? normalizeSeed(record.seed)
            : fallback.seed,
        );
    let candidate = {
      ...record,
      contentVersion: CONTENT_VERSION,
      firstSession: storedFirstSession ?? legacyFirstSessionProgress(),
      research,
      hypeFear,
      laboratory,
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
    if (
      record.contentVersion === PREVIOUS_CONTENT_VERSION ||
      record.contentVersion === LEGACY_CONTENT_VERSION ||
      storedResearch === undefined ||
      !researchShapeValid
    )
      migration = withMigrationStep(
        migration,
        "content-evaluation-to-research",
      );
    if (
      record.contentVersion !== CONTENT_VERSION ||
      storedHypeFear === undefined ||
      !hypeFearShapeValid
    )
      migration = withMigrationStep(migration, "content-research-to-hype-fear");
    if (
      record.contentVersion !== CONTENT_VERSION ||
      storedLaboratory === undefined ||
      !laboratoryShapeValid
    )
      migration = withMigrationStep(
        migration,
        "content-hype-fear-to-local-lab",
      );
    if (!originalIntegrityValid)
      candidate = normalizeUntrustedLedgerState(candidate);
    let structurallyValid = isStateStructurallyValid(candidate);
    let unsealedCausalEvidenceRepaired = false;
    if (
      storedFirstSession !== undefined &&
      !originalIntegrityValid &&
      structurallyValid &&
      !hasSafeUnsealedFirstSessionProgress(candidate)
    )
      return fallback;
    if (!originalIntegrityValid && structurallyValid) {
      unsealedCausalEvidenceRepaired =
        !isEvaluationStateValid(candidate.career.evaluation) ||
        !hasRetainedCausalLedgerEvidence(candidate) ||
        !hasCoherentCausalEvidenceSnapshot(candidate) ||
        (candidate.career.runEnding !== null &&
          !hasMatchingEndingEvidence(candidate, candidate.career.runEnding));
      candidate = normalizeUnsealedProgressionState(candidate, fallback);
      structurallyValid = isStateStructurallyValid(candidate);
      if (unsealedCausalEvidenceRepaired)
        migration = withMigrationStep(
          migration,
          "schema-v7-causal-ledger-repaired",
        );
    }
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
      research: createInitialResearchState(),
      hypeFear: createInitialHypeFearState(),
      laboratory: createInitialLaboratoryState(
        typeof record.seed === "number" && Number.isFinite(record.seed)
          ? normalizeSeed(record.seed)
          : fallback.seed,
      ),
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
      research: createInitialResearchState(),
      hypeFear: createInitialHypeFearState(),
      laboratory: createInitialLaboratoryState(
        typeof record.seed === "number" && Number.isFinite(record.seed)
          ? normalizeSeed(record.seed)
          : fallback.seed,
      ),
      career: createInitialCareerState(),
      meta: createInitialMetaProgression(),
    } as unknown as SimulationState;
    if (!isStateStructurallyValid(candidate)) return fallback;
    const migrated = sealSimulationState(recalculate(candidate));
    return isStateValid(migrated) ? migrated : fallback;
  }
  if (record.schemaVersion !== 3 && record.schemaVersion !== 4) return fallback;

  if (!isLegacyPipelineToyRecordValid(record)) return fallback;

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

function isSupportedRestoreRecord(record: Record<string, unknown>): boolean {
  return (
    typeof record.schemaVersion === "number" &&
    typeof record.contentVersion === "string" &&
    findSupportedSaveGeneration(record.schemaVersion, record.contentVersion) !==
      undefined
  );
}

function isFallbackState(
  state: SimulationState,
  fallbackSeed: number,
): boolean {
  const fallback = createInitialState(fallbackSeed);
  return (
    state.seed === fallback.seed &&
    state.tick === fallback.tick &&
    state.eventSequence === fallback.eventSequence &&
    state.integrity.digest === fallback.integrity.digest &&
    JSON.stringify(state) === JSON.stringify(fallback)
  );
}

function recoveryStatusFor(
  value: unknown,
  state: SimulationState,
  fallbackSeed: number,
  sourcePresent: boolean,
): SaveRecoveryStatus {
  const base = {
    formatVersion: 1 as const,
    preserved: [] as readonly string[],
    reset: [] as readonly string[],
    backupCreated: false,
  };
  if (!sourcePresent)
    return {
      ...base,
      disposition: "none",
      reason: "no-save",
      preserved: [],
      reset: [],
      nextAction: "Start a run.",
    };
  if (typeof value !== "object" || value === null)
    return {
      ...base,
      disposition: "reset",
      reason: "malformed-save",
      reset: ["the saved run"],
      nextAction:
        "Start a new run; the recovery backup is available for inspection.",
    };
  const record = value as Record<string, unknown>;
  const schemaVersion = record.schemaVersion;
  if (typeof schemaVersion !== "number" || !Number.isSafeInteger(schemaVersion))
    return {
      ...base,
      disposition: "reset",
      reason: "malformed-save-version",
      reset: ["the saved run"],
      nextAction:
        "Start a new run; the recovery backup is available for inspection.",
    };
  if (schemaVersion > SCHEMA_VERSION)
    return {
      ...base,
      disposition: "reset",
      reason: "future-schema",
      reset: ["unsupported future save fields"],
      nextAction:
        "Keep this build installed, then retry after a compatible update.",
    };
  if (!isSupportedRestoreRecord(record))
    return {
      ...base,
      disposition: "reset",
      reason: "unsupported-save-generation",
      reset: ["unsupported schema or content fields"],
      nextAction: "Start a new run on this supported build.",
    };
  if (schemaVersion < SCHEMA_VERSION) {
    if (isFallbackState(state, fallbackSeed))
      return {
        ...base,
        disposition: "reset",
        reason: "malformed-or-uncorroborated-save",
        reset: ["untrusted save fields"],
        nextAction:
          "Start a new run; the recovery backup is available for inspection.",
      };
    return {
      ...base,
      disposition: "migrated",
      reason: `schema-${schemaVersion}-migration`,
      preserved: [
        "seed and RNG state",
        "pipeline topology and task progress",
        "money and Career state supported by the source generation",
        "retained event history with unique IDs",
      ],
      reset: ["features introduced after the source generation"],
      nextAction: "Continue the migrated run and make one normal save.",
    };
  }
  if (record.contentVersion !== CONTENT_VERSION) {
    if (isFallbackState(state, fallbackSeed))
      return {
        ...base,
        disposition: "reset",
        reason: "malformed-or-uncorroborated-save",
        reset: ["untrusted save fields"],
        nextAction:
          "Start a new run; the recovery backup is available for inspection.",
      };
    return {
      ...base,
      disposition: "migrated",
      reason: "content-generation-migration",
      preserved: [
        "seed and RNG state",
        "pipeline, tasks, quotes, and accounting",
        "Career, Research, Hype, Laboratory, and history where present",
      ],
      reset: ["content-only additions absent from the source generation"],
      nextAction: "Continue the upgraded run and make one normal save.",
    };
  }
  if (hasValidStateIntegrity(record as unknown as SimulationState))
    return {
      ...base,
      disposition: "none",
      reason: "sealed-current-save",
      preserved: ["the complete sealed run"],
      reset: [],
      nextAction: "Continue playing.",
    };
  if (isFallbackState(state, fallbackSeed))
    return {
      ...base,
      disposition: "reset",
      reason: "malformed-or-uncorroborated-save",
      reset: ["untrusted save fields"],
      nextAction:
        "Start a new run; the recovery backup is available for inspection.",
    };
  return {
    ...base,
    disposition: "recovered",
    reason: "stale-or-unsealed-save",
    preserved: [
      "structurally valid core progress",
      "corroborated task IDs, locked quotes, and accounting",
      "seed and RNG state",
      "event history with rebuilt unique IDs",
    ],
    reset: [
      "untrusted progression additions and causal links",
      "unsealed Research, Hype, or Laboratory fields when not corroborated",
    ],
    nextAction:
      "Review the recovery note, then continue and make one normal save.",
  };
}

export interface RestoreSimulationResult {
  state: SimulationState;
  recovery: SaveRecoveryStatus;
}

export function restoreSimulationStateWithReport(
  value: unknown,
  fallbackSeed = 20260715,
  sourcePresent = value !== undefined,
): RestoreSimulationResult {
  const state = restoreSimulationState(value, fallbackSeed);
  return {
    state,
    recovery: recoveryStatusFor(value, state, fallbackSeed, sourcePresent),
  };
}

export function serializeSimulationState(state: SimulationState): string {
  return JSON.stringify(state);
}
