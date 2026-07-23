import type {
  CareerRouteSpec,
  HardwareSpec,
  LocalModelTierSpec,
  ModuleSpec,
  PipelineExpansionSpec,
  SlotSpec,
  WorkloadSpec,
} from "./types";

export const STARTER_HARDWARE_ID = "bedroom-cpu";

/**
 * Fictional, versioned local models. These are durable gameplay tiers rather
 * than references to a transient vendor catalogue. They modify a model stage
 * already installed in the one pipeline; they do not create a second pipeline.
 */
export const localModelTiers: readonly LocalModelTierSpec[] = [
  {
    id: "lantern-3b",
    name: "Lantern 3B",
    shortName: "L3B",
    description:
      "Starter local model. Q4 fits the bedroom machine and establishes the baseline.",
    qualityBonus: 0,
    memoryMultiplier: 1,
    throughputMultiplier: 1,
    reliabilityBonus: 0,
    operatingCostPerHour: 0,
    unlockDescription: "Starter model; always available.",
  },
  {
    id: "harbor-7b",
    name: "Harbor 7B",
    shortName: "H7B",
    description:
      "A durable 7B local tier: stronger output, more memory pressure, modest nightly power draw.",
    qualityBonus: 7,
    memoryMultiplier: 1.32,
    throughputMultiplier: 0.9,
    reliabilityBonus: 0.004,
    operatingCostPerHour: 0.08,
    unlockDescription:
      "Unlock with $8 saved, one competition submission, or one product release.",
  },
  {
    id: "kiln-13b",
    name: "Kiln 13B",
    shortName: "K13B",
    description:
      "A durable 13B local tier: higher quality at a real memory, throughput, and operating-cost tradeoff.",
    qualityBonus: 15,
    memoryMultiplier: 1.9,
    throughputMultiplier: 0.72,
    reliabilityBonus: 0.007,
    operatingCostPerHour: 0.18,
    unlockDescription:
      "Unlock with $18 saved plus either the competition prize or $8 product revenue.",
  },
];

export const bedroomCareerRoutes: readonly CareerRouteSpec[] = [
  {
    id: "freelance",
    name: "Freelance delivery",
    description:
      "Cash now from small local delivery work. Sensitive to latency and reliability; it does not build the product or competition record.",
    workloadId: "interactive-chat",
    opportunityCost:
      "Every hour here displaces competition, product, or maintenance work.",
  },
  {
    id: "competition",
    name: "Bedroom Benchmark Cup",
    description:
      "One persistent competition. Build a verified score, then submit deliberately; weak evaluation raises overfit risk.",
    workloadId: "competition-run",
    opportunityCost: "No immediate cash while you build the entry.",
  },
  {
    id: "product",
    name: "Deskflow Local",
    description:
      "One persistent local utility. Initial build work earns nothing; released service hours earn durable product revenue and can create service debt.",
    workloadId: "interactive-chat",
    opportunityCost: "Build and service time replace direct freelance income.",
  },
  {
    id: "maintenance",
    name: "Product maintenance",
    description:
      "Pays down Deskflow service debt. It protects retained product income but creates no direct cash or competition progress.",
    workloadId: "batch-classification",
    opportunityCost: "Safety work consumes the same finite evening hours.",
  },
];

export const starterSlots: readonly SlotSpec[] = [
  { id: "source", name: "Input", type: "source" },
  { id: "prepare", name: "Prepare", type: "process" },
  { id: "runtime", name: "Runtime", type: "process" },
  { id: "verify", name: "Verify", type: "process" },
  { id: "sink", name: "Output", type: "sink" },
];

export const expansionSlots: readonly SlotSpec[] = [
  { id: "process-4", name: "Process 4", type: "process" },
  { id: "process-5", name: "Process 5", type: "process" },
  { id: "process-6", name: "Process 6", type: "process" },
];

export const slots: readonly SlotSpec[] = [
  ...starterSlots.slice(0, -1),
  ...expansionSlots,
  starterSlots.at(-1)!,
];

export const pipelineExpansions: readonly PipelineExpansionSpec[] = [
  {
    id: "workstation-expansion-i",
    name: "Workstation Expansion I",
    description:
      "Adds three empty process positions to this workstation's single ordered pipeline.",
    purchaseCost: 45,
    processSlots: 6,
    tradeoff:
      "More positions create flexibility, but every installed module adds memory, latency, failure exposure, and operating cost.",
  },
];

export const modules: readonly ModuleSpec[] = [
  {
    id: "request-buffer",
    name: "Request Buffer",
    shortName: "BUFFER",
    description: "Reliable intake with a small queue.",
    slotTypes: ["source"],
    role: "source",
    throughput: 22,
    latency: 0.1,
    memory: 0.3,
    quality: 0,
    reliability: 0.997,
    observability: 0.65,
    costPerJob: 0,
    purchaseCost: 0,
  },
  {
    id: "stream-intake",
    name: "Stream Intake",
    shortName: "STREAM",
    description: "Faster intake; malformed bursts are harder to inspect.",
    slotTypes: ["source"],
    role: "source",
    throughput: 38,
    latency: 0.05,
    memory: 0.7,
    quality: -1,
    reliability: 0.976,
    observability: 0.35,
    costPerJob: 0,
    purchaseCost: 0,
  },
  {
    id: "basic-cleaner",
    name: "Basic Cleaner",
    shortName: "CLEAN",
    description: "Rejects malformed input and makes failures legible.",
    slotTypes: ["process"],
    role: "preparation",
    throughput: 13,
    latency: 0.7,
    memory: 0.8,
    quality: 8,
    reliability: 0.991,
    observability: 0.88,
    costPerJob: 0.01,
    purchaseCost: 0,
  },
  {
    id: "context-packer",
    name: "Context Packer",
    shortName: "PACK",
    description: "Improves long inputs but consumes KV-cache memory.",
    slotTypes: ["process"],
    role: "preparation",
    throughput: 9,
    latency: 1.1,
    memory: 2.8,
    quality: 12,
    reliability: 0.982,
    observability: 0.72,
    costPerJob: 0.02,
    purchaseCost: 0,
  },
  {
    id: "full-model",
    name: "Full Precision Model",
    shortName: "FP16",
    description: "Best quality, severe memory and throughput demands.",
    slotTypes: ["process"],
    role: "model",
    throughput: 4.5,
    latency: 3.8,
    memory: 8,
    quality: 34,
    reliability: 0.972,
    observability: 0.66,
    costPerJob: 0.08,
    purchaseCost: 0,
  },
  {
    id: "quantized-model",
    name: "Quantized Model",
    shortName: "Q4",
    description: "Fits modest hardware; trades some quality for speed.",
    slotTypes: ["process"],
    role: "model",
    throughput: 10,
    latency: 1.65,
    memory: 2.5,
    quality: 25,
    reliability: 0.963,
    observability: 0.61,
    costPerJob: 0.04,
    purchaseCost: 0,
  },
  {
    id: "batch-runtime",
    name: "Batch Runtime",
    shortName: "BATCH",
    description: "Excellent throughput; poor latency and fragile batches.",
    slotTypes: ["process"],
    role: "model",
    throughput: 17,
    latency: 4.4,
    memory: 4.5,
    quality: 20,
    reliability: 0.921,
    observability: 0.42,
    costPerJob: 0.025,
    purchaseCost: 0,
  },
  {
    id: "smoke-check",
    name: "Smoke Check",
    shortName: "SMOKE",
    description: "Fast validation with broad blind spots.",
    slotTypes: ["process"],
    role: "evaluation",
    throughput: 18,
    latency: 0.45,
    memory: 0.4,
    quality: 1,
    reliability: 0.989,
    observability: 0.57,
    costPerJob: 0.005,
    purchaseCost: 0,
  },
  {
    id: "robust-eval",
    name: "Robust Evaluation",
    shortName: "EVAL+",
    description: "Slower evidence across shifted inputs.",
    slotTypes: ["process"],
    role: "evaluation",
    throughput: 5.5,
    latency: 2.2,
    memory: 1.8,
    quality: 5,
    reliability: 0.995,
    observability: 0.94,
    costPerJob: 0.07,
    purchaseCost: 0,
  },
  {
    id: "delivery-gate",
    name: "Delivery Gate",
    shortName: "DELIVER",
    description: "Routes validated results and isolates failures.",
    slotTypes: ["sink"],
    role: "delivery",
    throughput: 20,
    latency: 0.15,
    memory: 0.2,
    quality: 0,
    reliability: 0.997,
    observability: 0.79,
    costPerJob: 0.01,
    purchaseCost: 0,
  },
  {
    id: "fast-export",
    name: "Fast Export",
    shortName: "EXPORT",
    description: "Immediate results with weaker failure isolation.",
    slotTypes: ["sink"],
    role: "delivery",
    throughput: 34,
    latency: 0.05,
    memory: 0.1,
    quality: 0,
    reliability: 0.958,
    observability: 0.31,
    costPerJob: 0,
    purchaseCost: 0,
  },
  {
    id: "precision-cleaner",
    name: "Precision Cleaner",
    shortName: "CLEAN+",
    description:
      "Stronger validation and tracing; lower throughput and higher cost.",
    slotTypes: ["process"],
    role: "preparation",
    throughput: 10.5,
    latency: 1,
    memory: 1.3,
    quality: 14,
    reliability: 0.997,
    observability: 0.97,
    costPerJob: 0.025,
    purchaseCost: 4,
  },
  {
    id: "adaptive-context",
    name: "Adaptive Context",
    shortName: "CTX+",
    description:
      "High-quality context routing; fast on short work but memory hungry.",
    slotTypes: ["process"],
    role: "preparation",
    throughput: 15,
    latency: 1.45,
    memory: 4,
    quality: 17,
    reliability: 0.976,
    observability: 0.79,
    costPerJob: 0.04,
    purchaseCost: 8,
  },
  {
    id: "efficient-runtime",
    name: "Efficient Runtime",
    shortName: "ECO-M",
    description:
      "Balanced model speed and quality; adds memory and operating cost.",
    slotTypes: ["process"],
    role: "model",
    throughput: 13,
    latency: 1.25,
    memory: 3.4,
    quality: 29,
    reliability: 0.971,
    observability: 0.7,
    costPerJob: 0.065,
    purchaseCost: 7,
  },
  {
    id: "guarded-batch",
    name: "Guarded Batch Runtime",
    shortName: "BATCH+",
    description:
      "Large batches with better fault isolation; slow response and high RAM.",
    slotTypes: ["process"],
    role: "model",
    throughput: 20,
    latency: 4.9,
    memory: 5.8,
    quality: 23,
    reliability: 0.958,
    observability: 0.67,
    costPerJob: 0.055,
    purchaseCost: 10,
  },
  {
    id: "trace-eval",
    name: "Trace Evaluation",
    shortName: "TRACE",
    description:
      "High-observability evidence; slower and costlier than a smoke check.",
    slotTypes: ["process"],
    role: "evaluation",
    throughput: 8,
    latency: 1.55,
    memory: 1.2,
    quality: 4,
    reliability: 0.998,
    observability: 0.99,
    costPerJob: 0.05,
    purchaseCost: 5,
  },
  {
    id: "resilient-delivery",
    name: "Resilient Delivery",
    shortName: "SHIP+",
    description:
      "Near-total failure isolation; lower capacity and higher per-job cost.",
    slotTypes: ["sink"],
    role: "delivery",
    throughput: 16,
    latency: 0.35,
    memory: 0.5,
    quality: 0,
    reliability: 0.999,
    observability: 0.96,
    costPerJob: 0.025,
    purchaseCost: 4,
  },
];

export const starterModuleIds: readonly string[] = modules
  .filter((module) => module.purchaseCost === 0)
  .map((module) => module.id);

export const hardware: readonly HardwareSpec[] = [
  {
    id: "bedroom-cpu",
    name: "Bedroom CPU",
    description: "No purchase cost; compute is the first hard constraint.",
    purchaseCost: 0,
    compute: 7,
    memory: 8,
    thermalLimit: 52,
    watts: 65,
    reliability: 0.993,
    maintenance: 0.03,
  },
  {
    id: "used-gpu",
    name: "Used 12 GB GPU",
    description: "More compute; tighter power, heat, and reliability margins.",
    purchaseCost: 14,
    compute: 24,
    memory: 12,
    thermalLimit: 84,
    watts: 235,
    reliability: 0.964,
    maintenance: 0.11,
  },
  {
    id: "workstation-gpu",
    name: "24 GB Workstation",
    description: "Large capacity with a punishing capital and energy cost.",
    purchaseCost: 40,
    compute: 46,
    memory: 24,
    thermalLimit: 112,
    watts: 420,
    reliability: 0.985,
    maintenance: 0.18,
    availableAfterHour: 24,
  },
];

export const workloads: readonly WorkloadSpec[] = [
  {
    id: "interactive-chat",
    name: "Interactive Chat",
    description:
      "Reliable local assistant requests; repeated accepted work cools its quote quickly.",
    baseQuality: 30,
    computeDemand: 8,
    memoryDemand: 2.5,
    latencySensitivity: 1,
    throughputSensitivity: 0.2,
    rewardMoney: 1.4,
    rewardReputation: 0.05,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.07,
    recoveryPerHour: 0.052,
    unlock: { completedJobs: 0, reputation: 0 },
  },
  {
    id: "batch-classification",
    name: "Batch Classification",
    description:
      "Higher-paying labels with a recoverable delivery risk and forgiving latency.",
    baseQuality: 35,
    computeDemand: 12,
    memoryDemand: 1.5,
    latencySensitivity: 0.1,
    throughputSensitivity: 1,
    rewardMoney: 2,
    rewardReputation: 0.03,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.05,
    recoveryPerHour: 0.09,
    deliveryReliabilityMultiplier: 0.8,
    unlock: { completedJobs: 0, reputation: 0 },
  },
  {
    id: "long-document",
    name: "Long Document",
    description: "Context pressure exposes memory bottlenecks.",
    baseQuality: 26,
    computeDemand: 11,
    memoryDemand: 7,
    latencySensitivity: 0.55,
    throughputSensitivity: 0.4,
    rewardMoney: 2.2,
    rewardReputation: 0.08,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.06,
    recoveryPerHour: 0.025,
    unlock: { completedJobs: 0, reputation: 0 },
  },
  {
    id: "competition-run",
    name: "Competition Training",
    description:
      "Compute-intensive experiments with quality-sensitive results.",
    baseQuality: 20,
    computeDemand: 28,
    memoryDemand: 3,
    latencySensitivity: 0,
    throughputSensitivity: 0.85,
    rewardMoney: 0.2,
    rewardReputation: 0.2,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.03,
    recoveryPerHour: 0.018,
    unlock: { completedJobs: 0, reputation: 0 },
  },
  {
    id: "code-generation",
    name: "Code Generation",
    description: "Quality-sensitive code tasks punish weak evaluation.",
    baseQuality: 34,
    computeDemand: 16,
    memoryDemand: 4,
    latencySensitivity: 0.7,
    throughputSensitivity: 0.35,
    rewardMoney: 2.6,
    rewardReputation: 0.09,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.105,
    recoveryPerHour: 0.045,
    unlock: { completedJobs: 12, reputation: 0.3 },
  },
  {
    id: "evaluation-audit",
    name: "Evaluation Audit",
    description: "Evidence-heavy audits reward observability over raw speed.",
    baseQuality: 38,
    computeDemand: 14,
    memoryDemand: 3.5,
    latencySensitivity: 0.25,
    throughputSensitivity: 0.55,
    rewardMoney: 2.9,
    rewardReputation: 0.14,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.12,
    recoveryPerHour: 0.05,
    unlock: { completedJobs: 22, reputation: 0.8 },
  },
  {
    id: "small-finetune",
    name: "Small Fine-tune",
    description:
      "Long, memory-heavy adaptation with valuable but fragile output.",
    baseQuality: 42,
    computeDemand: 34,
    memoryDemand: 9,
    latencySensitivity: 0.05,
    throughputSensitivity: 0.9,
    rewardMoney: 4.8,
    rewardReputation: 0.18,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.15,
    recoveryPerHour: 0.06,
    unlock: {
      completedJobs: 32,
      reputation: 1.5,
      expansionId: "workstation-expansion-i",
    },
  },
  {
    id: "tool-agent",
    name: "Tool-use Agent",
    description:
      "Multi-step tool work values reliability, evaluation, and memory together.",
    baseQuality: 36,
    computeDemand: 30,
    memoryDemand: 8,
    latencySensitivity: 0.45,
    throughputSensitivity: 0.45,
    rewardMoney: 5.2,
    rewardReputation: 0.22,
    minimumQuote: 0.02,
    saturationPerSuccess: 0.16,
    recoveryPerHour: 0.065,
    unlock: {
      completedJobs: 44,
      reputation: 2.2,
      hardwareId: "used-gpu",
    },
  },
];

export function getModule(id: string): ModuleSpec {
  const found = modules.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown module: ${id}`);
  return found;
}

export function findModule(id: unknown): ModuleSpec | undefined {
  return typeof id === "string"
    ? modules.find((item) => item.id === id)
    : undefined;
}

export function getHardware(id: string): HardwareSpec {
  const found = hardware.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown hardware: ${id}`);
  return found;
}

export function findHardware(id: unknown): HardwareSpec | undefined {
  return typeof id === "string"
    ? hardware.find((item) => item.id === id)
    : undefined;
}

export function getWorkload(id: string): WorkloadSpec {
  const found = workloads.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown workload: ${id}`);
  return found;
}

export function findWorkload(id: unknown): WorkloadSpec | undefined {
  return typeof id === "string"
    ? workloads.find((item) => item.id === id)
    : undefined;
}

export function getSlot(id: string): SlotSpec {
  const found = slots.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown slot: ${id}`);
  return found;
}

export function findSlot(id: unknown): SlotSpec | undefined {
  return typeof id === "string"
    ? slots.find((item) => item.id === id)
    : undefined;
}

export function getPipelineExpansion(id: string): PipelineExpansionSpec {
  const found = pipelineExpansions.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown pipeline expansion: ${id}`);
  return found;
}

export function findPipelineExpansion(
  id: unknown,
): PipelineExpansionSpec | undefined {
  return typeof id === "string"
    ? pipelineExpansions.find((item) => item.id === id)
    : undefined;
}

export function getLocalModelTier(id: string): LocalModelTierSpec {
  const found = localModelTiers.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown local model tier: ${id}`);
  return found;
}

export function findLocalModelTier(
  id: unknown,
): LocalModelTierSpec | undefined {
  return typeof id === "string"
    ? localModelTiers.find((item) => item.id === id)
    : undefined;
}

export function getBedroomCareerRoute(id: string): CareerRouteSpec {
  const found = bedroomCareerRoutes.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown bedroom career route: ${id}`);
  return found;
}
