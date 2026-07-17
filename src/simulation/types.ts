export const SCHEMA_VERSION = 5;
export const CONTENT_VERSION = "pipeline-toy-4";
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

export interface LedgerEvent {
  id: string;
  tick: number;
  kind: EventKind;
  message: string;
  directCause?: string;
  contributingCondition?: string;
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
