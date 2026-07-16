export const SCHEMA_VERSION = 4;
export const CONTENT_VERSION = "pipeline-toy-3";
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
}

export interface PipelineSlotState {
  slotId: string;
  moduleId: string;
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
}

export interface JobSettlement {
  tick: number;
  workloadId: string;
  completed: number;
  failed: number;
  grossPayout: number;
  operatingCost: number;
  netChange: number;
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
  | { type: "SET_COMPUTE_ALLOCATION"; percent: number }
  | { type: "SET_MEMORY_RESERVE"; percent: number }
  | { type: "TOGGLE_BRANCH" }
  | { type: "QUEUE_JOBS"; count: number }
  | { type: "TOGGLE_PAUSE" }
  | { type: "CAPTURE_BASELINE"; label: string }
  | { type: "RESET"; seed?: number };

export type WorkerRequest =
  | { type: "INIT"; seed?: number; savedState?: unknown }
  | { type: "COMMAND"; command: SimulationCommand }
  | { type: "TICK"; seconds: number };

export type WorkerResponse = { type: "STATE"; state: SimulationState };
