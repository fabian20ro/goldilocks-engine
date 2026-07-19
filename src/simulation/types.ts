export const SCHEMA_VERSION = 7;
export const CONTENT_VERSION = "evaluation-replay-1";
export const SAVE_INTEGRITY_ALGORITHM = "fnv1a-32-json-v1";

export type SlotType = "source" | "process" | "sink";
export type ModuleRole =
  | "source"
  | "preparation"
  | "model"
  | "evaluation"
  | "delivery";

export interface ModuleSpec {
  id: string;
  name: string;
  shortName: string;
  description: string;
  slotTypes: readonly SlotType[];
  role: ModuleRole;
  throughput: number;
  latency: number;
  memory: number;
  quality: number;
  reliability: number;
  observability: number;
  costPerJob: number;
  purchaseCost: number;
}

export interface SlotSpec {
  id: string;
  name: string;
  type: SlotType;
}

export interface HardwareSpec {
  id: string;
  name: string;
  description: string;
  purchaseCost: number;
  compute: number;
  memory: number;
  thermalLimit: number;
  watts: number;
  reliability: number;
  maintenance: number;
  availableAfterHour?: number;
}

export interface WorkloadSpec {
  id: string;
  name: string;
  description: string;
  baseQuality: number;
  computeDemand: number;
  memoryDemand: number;
  latencySensitivity: number;
  throughputSensitivity: number;
  rewardMoney: number;
  rewardReputation: number;
  minimumQuote: number;
  saturationPerSuccess: number;
  recoveryPerHour: number;
  unlock: WorkloadUnlockRequirement;
}

export interface WorkloadUnlockRequirement {
  completedJobs: number;
  reputation: number;
  hardwareId?: string;
  expansionId?: string;
}

export interface PipelineExpansionSpec {
  id: string;
  name: string;
  description: string;
  purchaseCost: number;
  processSlots: number;
  tradeoff: string;
}

/** The deliberately finite after-hours choices in the Bedroom Developer loop. */
export type CareerRoute =
  | "freelance"
  | "competition"
  | "product"
  | "maintenance";

export type QuantizationProfile = "q4" | "q8";

export interface LocalModelTierSpec {
  id: string;
  name: string;
  shortName: string;
  description: string;
  qualityBonus: number;
  memoryMultiplier: number;
  throughputMultiplier: number;
  reliabilityBonus: number;
  operatingCostPerHour: number;
  unlockDescription: string;
}

export interface CareerRouteSpec {
  id: CareerRoute;
  name: string;
  description: string;
  workloadId: string;
  opportunityCost: string;
}

export interface EveningSchedule {
  day: number;
  hoursAvailable: number;
  hoursRemaining: number;
  allocations: Readonly<Record<CareerRoute, number>>;
  completedEvenings: number;
}

export interface CompetitionProgress {
  id: "bedroom-benchmark-cup";
  name: string;
  progress: number;
  submissions: number;
  bestScore: number;
  overfitRisk: number;
  prizeClaimed: boolean;
  lifetimePrizeMoney: number;
}

export interface ProductProgress {
  id: "deskflow-local";
  name: string;
  buildProgress: number;
  released: boolean;
  releases: number;
  serviceDebt: number;
  lifetimeRevenue: number;
  maintenanceHours: number;
}

export interface OfflinePolicyReport {
  requestedHours: number;
  appliedHours: number;
  route: "freelance";
  gross: number;
  configuredCost: number;
  stoppedReason: string;
}

/**
 * Offline automation has one intentionally narrow job: safe freelance work.
 * It cannot purchase, submit, release, or touch product/competition progress.
 */
export interface OfflinePolicy {
  enabled: boolean;
  route: "freelance";
  maxHours: number;
  maxElectricityCost: number;
  maxOperatingCost: number;
  minReliability: number;
  lastReport: OfflinePolicyReport | null;
}

/** A private evaluation reports an evidence band, never a latent exact score. */
export type PrivateAssessment =
  | "not-run"
  | "inconclusive"
  | "credible"
  | "at-risk"
  | "failed";

export interface EvaluationWarningCounts {
  leakage: number;
  reliability: number;
  hardware: number;
  tutorial: number;
}

/**
 * Evaluation state is deliberately legible but incomplete. Public benchmark
 * scores are visible; private evaluation returns only a categorical evidence
 * assessment so the UI never exposes an exact latent capability value.
 */
export interface EvaluationState {
  publicScore: number | null;
  privateAssessment: PrivateAssessment;
  coverage: number;
  evaluationSpend: number;
  publicEvaluations: number;
  privateEvaluations: number;
  leakageRisk: number;
  distributionShiftRisk: number;
  reliabilityIncidents: number;
  ignoredWarnings: number;
  warnings: EvaluationWarningCounts;
  modelSwitches: number;
  capitalCommitments: number;
  hardwareDebt: number;
}

export type DiagnosticUnlockId =
  | "leakage-warning"
  | "shift-monitor"
  | "bottleneck-map"
  | "decision-history"
  | "confidence-intervals";

export type RunEndingId =
  | "public-leaderboard-hero"
  | "product-reliability-collapse"
  | "hardware-debt-spiral"
  | "tutorial-loop"
  | "honest-independent-builder";

/** A run ending points only at evidence retained in the bounded ledger. */
export interface RunEnding {
  id: RunEndingId;
  title: string;
  outcome: "failure" | "success";
  eventId: string;
  diagnosticUnlockId: DiagnosticUnlockId;
  reachedAtTick: number;
}

/** Information-only institutional memory retained when a player restarts. */
export interface MetaProgression {
  unlockedDiagnosticIds: readonly DiagnosticUnlockId[];
  completedEndingIds: readonly RunEndingId[];
  replayCount: number;
}

export interface CareerState {
  schedule: EveningSchedule;
  savings: number;
  electricityCostsIncurred: number;
  operatingCostsIncurred: number;
  costsPaid: number;
  unpaidCosts: number;
  freelanceHours: number;
  freelanceGross: number;
  competition: CompetitionProgress;
  product: ProductProgress;
  unlockedModelTierIds: readonly string[];
  activeModelTierId: string;
  quantization: QuantizationProfile;
  offlinePolicy: OfflinePolicy;
  exitAchieved: boolean;
  evaluation: EvaluationState;
  runEnding: RunEnding | null;
}

export interface PipelineSlotState {
  slotId: string;
  moduleId: string | null;
}

export interface PipelineMetrics {
  throughputPerMinute: number;
  latencySeconds: number;
  memoryUsed: number;
  memoryAvailable: number;
  memoryPressure: number;
  thermalLoad: number;
  thermalPressure: number;
  predictedQuality: number;
  observedQuality: number;
  reliability: number;
  observability: number;
  evaluationCoverage: number;
  operatingCost: number;
  dominantBottleneck: string;
  bottleneckSlotId: string;
  orderWarnings: readonly string[];
}

export interface JobState {
  queued: number;
  completed: number;
  failed: number;
  processingCarry: number;
  paused: boolean;
  grossEarned: number;
  operatingCostsPaid: number;
  activeTask: QueuedTask | null;
  waitingTasks: readonly QueuedTask[];
  nextTaskSequence: number;
}

export interface QueuedTask {
  id: string;
  workloadId: string;
  lockedGrossQuote: number;
  acceptedAtTick: number;
  progress: number;
}

export interface WorkloadDemandState {
  workloadId: string;
  level: number;
  previousQuote: number;
  successfulCompletions: number;
}

export interface WorkloadQuote {
  workloadId: string;
  grossQuote: number;
  demandPercent: number;
  trend: "rising" | "steady" | "falling";
  reason: string;
}

export interface JobSettlement {
  tick: number;
  workloadId: string;
  completed: number;
  failed: number;
  grossPayout: number;
  operatingCost: number;
  netChange: number;
  taskId: string;
  lockedGrossQuote: number;
}

export interface UpgradeNotice {
  kind: EventKind;
  message: string;
}

export interface Resources {
  money: number;
  timeHours: number;
  electricityKwh: number;
  reputation: number;
}

export type EventKind = "info" | "success" | "warning" | "failure";

/**
 * Causal categories are evidence annotations, not an omniscient narrative.
 * A postmortem renders these records directly from its linked ledger event.
 */
export interface CausalEvidence {
  directCauses: readonly string[];
  contributingFactors: readonly string[];
  correlations: readonly string[];
  hypotheses: readonly string[];
  unknowns: readonly string[];
}

export interface LedgerEvent {
  id: string;
  tick: number;
  kind: EventKind;
  message: string;
  directCause?: string;
  contributingCondition?: string;
  causal?: CausalEvidence;
}

export interface MigrationMetadata {
  sourceSchemaVersion: number;
  steps: readonly string[];
}

export interface SaveIntegrity {
  algorithm: typeof SAVE_INTEGRITY_ALGORITHM;
  digest: string;
}

export interface SimulationState {
  schemaVersion: typeof SCHEMA_VERSION;
  contentVersion: typeof CONTENT_VERSION;
  migration: MigrationMetadata;
  integrity: SaveIntegrity;
  seed: number;
  rngState: number;
  tick: number;
  hardwareId: string;
  ownedHardwareIds: readonly string[];
  ownedModuleIds: readonly string[];
  ownedExpansionIds: readonly string[];
  activeExpansionId: string | null;
  unlockedWorkloadIds: readonly string[];
  workloadDemand: readonly WorkloadDemandState[];
  workloadId: string;
  slots: readonly PipelineSlotState[];
  branchEnabled: boolean;
  computeAllocation: number;
  memoryReserve: number;
  resources: Resources;
  career: CareerState;
  meta: MetaProgression;
  jobs: JobState;
  lastSettlement: JobSettlement | null;
  metrics: PipelineMetrics;
  baselineMetrics: PipelineMetrics | null;
  baselineLabel: string | null;
  failedModuleId: string | null;
  lastWarning: string;
  lastUpgradeNotice: UpgradeNotice | null;
  eventSequence: number;
  ledger: readonly LedgerEvent[];
}

export type SimulationCommand =
  | {
      type: "PLACE_MODULE";
      moduleId: string;
      slotId: string;
      fromSlotId?: string;
    }
  | { type: "SET_WORKLOAD"; workloadId: string }
  | { type: "BUY_HARDWARE"; hardwareId: string }
  | { type: "EQUIP_HARDWARE"; hardwareId: string }
  | { type: "BUY_MODULE"; moduleId: string }
  | { type: "BUY_EXPANSION"; expansionId: string }
  | { type: "SET_EXPANSION_ACTIVE"; active: boolean }
  | { type: "REMOVE_MODULE"; slotId: string }
  | { type: "SET_COMPUTE_ALLOCATION"; percent: number }
  | { type: "SET_MEMORY_RESERVE"; percent: number }
  | { type: "TOGGLE_BRANCH" }
  | { type: "QUEUE_JOBS"; count: number }
  | { type: "CLEAR_WAITING_TASKS" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "CAPTURE_BASELINE"; label: string }
  | { type: "SET_EVENING_ALLOCATION"; route: CareerRoute; hours: number }
  | { type: "RUN_EVENING" }
  | { type: "DEPOSIT_SAVINGS"; amount: number }
  | { type: "WITHDRAW_SAVINGS"; amount: number }
  | { type: "SELECT_LOCAL_MODEL_TIER"; modelTierId: string }
  | { type: "SET_QUANTIZATION"; profile: QuantizationProfile }
  | { type: "SUBMIT_COMPETITION" }
  | { type: "RELEASE_PRODUCT" }
  | { type: "RUN_PUBLIC_EVALUATION" }
  | { type: "RUN_PRIVATE_EVALUATION" }
  | { type: "CONCLUDE_INDEPENDENT_RUN" }
  | {
      type: "SET_OFFLINE_POLICY";
      enabled: boolean;
      maxHours: number;
      maxElectricityCost: number;
      maxOperatingCost: number;
      minReliability: number;
    }
  | { type: "APPLY_OFFLINE_POLICY"; requestedHours: number }
  | { type: "RESET"; seed?: number };

export type WorkerRequest = (
  | { type: "INIT"; seed?: number; savedState?: unknown }
  | { type: "COMMAND"; command: SimulationCommand }
  | { type: "COMMAND_BATCH"; commands: readonly SimulationCommand[] }
  | { type: "TICK"; seconds: number }
) & { requestId?: number };

export type WorkerResponse = {
  type: "STATE";
  state: SimulationState;
  requestId?: number;
};
