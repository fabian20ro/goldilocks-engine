import type {
  LaboratoryCultureId,
  LaboratoryMachineId,
  LaboratoryPipelineId,
  LaboratoryScenarioId,
} from "./types";

export interface LaboratoryMachineSpec {
  id: LaboratoryMachineId;
  name: string;
  description: string;
  purchaseCost: number;
  compute: number;
  memory: number;
  reliability: number;
  electricityCost: number;
  bestFor: string;
}

export interface LaboratoryPipelineSpec {
  id: LaboratoryPipelineId;
  name: string;
  purpose: string;
  description: string;
  baseDurationHours: number;
  baseCost: number;
}

export interface LaboratoryCultureSpec {
  id: LaboratoryCultureId;
  name: string;
  description: string;
  reproducibility: number;
  collaboration: number;
  attentionPressure: number;
}

export interface LaboratoryScenarioSpec {
  id: LaboratoryScenarioId;
  name: string;
  description: string;
  unlock: string;
}

export const laboratoryMachines: readonly LaboratoryMachineSpec[] = [
  {
    id: "bench-node",
    name: "Bench Node",
    description:
      "The original workstation, retained as a reference machine for reproducible small runs.",
    purchaseCost: 0,
    compute: 1,
    memory: 8,
    reliability: 0.82,
    electricityCost: 0.02,
    bestFor: "reference runs",
  },
  {
    id: "parallel-rack",
    name: "Parallel Rack",
    description:
      "Two reliable nodes in one rack. More throughput, more heat, and a larger maintenance surface.",
    purchaseCost: 12,
    compute: 2.2,
    memory: 16,
    reliability: 0.86,
    electricityCost: 0.06,
    bestFor: "parallel experiments",
  },
  {
    id: "evidence-rig",
    name: "Evidence Rig",
    description:
      "A slower, instrumented machine whose independent checks make claims easier to reproduce.",
    purchaseCost: 15,
    compute: 1.5,
    memory: 12,
    reliability: 0.94,
    electricityCost: 0.045,
    bestFor: "replication and evaluation",
  },
  {
    id: "archive-node",
    name: "Archive Node",
    description:
      "Low-throughput storage and replay capacity. It protects retained knowledge from hero dependency.",
    purchaseCost: 9,
    compute: 0.8,
    memory: 24,
    reliability: 0.9,
    electricityCost: 0.025,
    bestFor: "documentation and replay",
  },
];

export const laboratoryPipelines: readonly LaboratoryPipelineSpec[] = [
  {
    id: "reproducibility",
    name: "Reproducibility Bench",
    purpose: "repeat a result",
    description:
      "Replays a measured run against a locked seed and versioned configuration.",
    baseDurationHours: 0.28,
    baseCost: 0.18,
  },
  {
    id: "research",
    name: "Research Pipeline",
    purpose: "test a hypothesis",
    description:
      "Runs a bounded research question beside the reference pipeline.",
    baseDurationHours: 0.34,
    baseCost: 0.22,
  },
  {
    id: "delivery",
    name: "Delivery Pipeline",
    purpose: "serve a useful workload",
    description:
      "Keeps a useful route alive while research and replication consume capacity.",
    baseDurationHours: 0.24,
    baseCost: 0.2,
  },
];

export const laboratoryCultures: readonly LaboratoryCultureSpec[] = [
  {
    id: "evidence-first",
    name: "Evidence first",
    description:
      "Slow claims until independent checks agree; favors durable trust over reach.",
    reproducibility: 0.2,
    collaboration: 0.04,
    attentionPressure: -0.04,
  },
  {
    id: "open-methods",
    name: "Open methods",
    description:
      "Teach the method outward; gains collaborators while adding coordination work.",
    reproducibility: 0.1,
    collaboration: 0.14,
    attentionPressure: 0.03,
  },
  {
    id: "craft-and-care",
    name: "Craft and care",
    description:
      "Protect a small team and useful delivery; modest scale, strong continuity.",
    reproducibility: 0.08,
    collaboration: 0.08,
    attentionPressure: -0.01,
  },
];

export const laboratoryScenarios: readonly LaboratoryScenarioSpec[] = [
  {
    id: "limited-hardware",
    name: "Limited hardware",
    description:
      "The lab begins with a narrow capital envelope. Reuse and evidence beat brute force.",
    unlock: "A seed or prior run exposes a constrained machine path.",
  },
  {
    id: "academic-collaboration",
    name: "Academic collaboration",
    description:
      "Retained research knowledge makes a careful external collaboration possible.",
    unlock: "Complete useful Research and retain a question worth sharing.",
  },
  {
    id: "creator-attention",
    name: "Creator attention",
    description:
      "An audience is waiting. Distribution can fund the lab or consume its attention.",
    unlock: "Carry meaningful attention into the laboratory transition.",
  },
  {
    id: "high-public-fear",
    name: "High public fear",
    description:
      "Skeptics need boundaries and evidence before the lab can grow safely.",
    unlock: "Resolve a fear narrative without hiding its uncertainty.",
  },
  {
    id: "weak-economy",
    name: "Weak economy",
    description:
      "Every machine and run competes with the reserve that keeps the lab alive.",
    unlock: "Reach the lab with a thin cash reserve.",
  },
  {
    id: "expensive-electricity",
    name: "Expensive electricity",
    description:
      "Parallelism is attractive but operating cost must remain visible and bounded.",
    unlock: "A deterministic seed exposes a high-energy local market.",
  },
];

export function findLaboratoryMachine(
  id: string,
): LaboratoryMachineSpec | undefined {
  return laboratoryMachines.find((machine) => machine.id === id);
}

export function findLaboratoryPipeline(
  id: string,
): LaboratoryPipelineSpec | undefined {
  return laboratoryPipelines.find((pipeline) => pipeline.id === id);
}

export function findLaboratoryCulture(
  id: string,
): LaboratoryCultureSpec | undefined {
  return laboratoryCultures.find((culture) => culture.id === id);
}

export function findLaboratoryScenario(
  id: string,
): LaboratoryScenarioSpec | undefined {
  return laboratoryScenarios.find((scenario) => scenario.id === id);
}
