import type { ResearcherSpec, ResearchProjectSpec } from "./types";

/**
 * Fictional research content. The catalog is deliberately small: every item
 * exposes a question, bounded uncertainty, an opportunity cost, and a useful
 * way to learn from an imperfect result.
 */
export const researchProjects: readonly ResearchProjectSpec[] = [
  {
    id: "context-reconstruction",
    name: "Context Reconstruction",
    question:
      "Which requests fail because the pipeline cannot see their context?",
    hypothesis:
      "A small, explicit context ledger will improve reliability more than a larger model tier.",
    currentEvidence:
      "Recent delivery logs show context-shaped failures, but no controlled comparison.",
    requiredExpertise: ["systems instrumentation", "evaluation design"],
    failedWorkValue:
      "Sampling notes and context traces remain reusable for a drift audit.",
    disciplines: ["systems", "evaluation"],
    prerequisites: [
      {
        kind: "recognition",
        value: "research",
        label: "Reach First Recognition through one accepted delivery.",
      },
    ],
    durationRange: { min: 0.3, max: 0.65 },
    costRange: { min: 0.25, max: 0.65 },
    usefulnessRange: { min: 0.25, max: 0.82 },
    strategicFit: ["reliability", "observability", "retained knowledge"],
    uncertainty: "The effect may only appear on long-tail requests.",
    hidden: false,
    revealsOnInspect: ["evidence-weave", "orin-kade", "evidence-budget"],
    outcomes: [
      {
        kind: "breakthrough",
        weight: 0.28,
        title: "The missing context was measurable",
        summary:
          "A compact context ledger isolates the failure mode and makes the next evaluation cheaper.",
        usefulness: { min: 0.68, max: 0.82 },
        knowledgeGained: 0.48,
        institutionalKnowledgeGained: 0.2,
        toolId: "context-ledger",
        reveals: ["negative-space"],
        strategicOptions: ["context-ledger-rollout"],
      },
      {
        kind: "partial",
        weight: 0.34,
        title: "Context helped, but only on a subset",
        summary:
          "The ledger improves traceability for a narrow request family; broader claims remain open.",
        usefulness: { min: 0.34, max: 0.56 },
        knowledgeGained: 0.3,
        institutionalKnowledgeGained: 0.1,
        toolId: "context-ledger",
        reveals: ["negative-space"],
        strategicOptions: ["context-ledger-rollout"],
      },
      {
        kind: "useful-failure",
        weight: 0.24,
        title: "The hypothesis failed usefully",
        summary:
          "Context was not the bottleneck; the negative result narrows the next experiment to measurement drift.",
        usefulness: { min: 0.24, max: 0.4 },
        knowledgeGained: 0.26,
        institutionalKnowledgeGained: 0.16,
        reveals: ["negative-space"],
        strategicOptions: ["drift-audit"],
      },
      {
        kind: "failure",
        weight: 0.14,
        title: "The sample was too noisy",
        summary:
          "The result is inconclusive, but the sampling notes preserve a cheaper replication design.",
        usefulness: { min: 0.08, max: 0.2 },
        knowledgeGained: 0.12,
        institutionalKnowledgeGained: 0.05,
        reveals: [],
        strategicOptions: ["replicate-with-controls"],
      },
    ],
  },
  {
    id: "evidence-weave",
    name: "Evidence Weave",
    question: "Can independent checks agree without hiding distribution shift?",
    hypothesis:
      "A small, diverse evaluation weave will reveal drift earlier than repeated public previews.",
    currentEvidence:
      "Private coverage exists, but repeated checks may share the same blind spot.",
    requiredExpertise: ["independent evaluation", "slice design"],
    failedWorkValue:
      "The failed replication protocol becomes a safer future control.",
    disciplines: ["evaluation", "data"],
    prerequisites: [
      {
        kind: "inspect",
        value: "context-reconstruction",
        label: "Inspect Context Reconstruction evidence.",
      },
      {
        kind: "coverage",
        value: 0.2,
        label: "Collect 20% private evaluation coverage.",
      },
    ],
    durationRange: { min: 0.4, max: 0.8 },
    costRange: { min: 0.4, max: 0.9 },
    usefulnessRange: { min: 0.2, max: 0.9 },
    strategicFit: ["evidence", "risk reduction", "model selection"],
    uncertainty:
      "Agreement can be real, accidental, or caused by shared blind spots.",
    hidden: true,
    revealsOnInspect: [
      "replication-frontier",
      "noor-adebayo",
      "evidence-budget",
    ],
    outcomes: [
      {
        kind: "breakthrough",
        weight: 0.22,
        title: "The checks separated cleanly",
        summary:
          "Independent slices agree on the decision boundary and expose a safer evaluation budget.",
        usefulness: { min: 0.7, max: 0.9 },
        knowledgeGained: 0.55,
        institutionalKnowledgeGained: 0.28,
        toolId: "evidence-weave",
        reveals: ["replication-frontier"],
        strategicOptions: ["evidence-budget"],
      },
      {
        kind: "subset",
        weight: 0.3,
        title: "Agreement held on one slice",
        summary:
          "The weave is credible for one workload family, while transfer to the wider frontier remains uncertain.",
        usefulness: { min: 0.38, max: 0.62 },
        knowledgeGained: 0.36,
        institutionalKnowledgeGained: 0.14,
        toolId: "evidence-weave",
        reveals: ["replication-frontier"],
        strategicOptions: ["slice-specific-routing"],
      },
      {
        kind: "useful-failure",
        weight: 0.28,
        title: "The weave found a shared blind spot",
        summary:
          "The checks disagreed for a useful reason; preserving the counterexample prevents false confidence.",
        usefulness: { min: 0.28, max: 0.5 },
        knowledgeGained: 0.33,
        institutionalKnowledgeGained: 0.2,
        reveals: ["replication-frontier"],
        strategicOptions: ["counterexample-library"],
      },
      {
        kind: "replication-failure",
        weight: 0.2,
        title: "Replication did not hold",
        summary:
          "A second run failed to reproduce the first signal; the protocol and failed sample remain reusable.",
        usefulness: { min: 0.12, max: 0.3 },
        knowledgeGained: 0.2,
        institutionalKnowledgeGained: 0.12,
        reveals: ["replication-frontier"],
        strategicOptions: ["replicate-with-controls"],
      },
    ],
  },
  {
    id: "negative-space",
    name: "Negative-Space Audit",
    question: "What evidence would falsify our current story?",
    hypothesis:
      "Searching for missing cases will improve decisions even when it produces no new capability.",
    currentEvidence:
      "The context result is promising on one family and silent about counterexamples.",
    requiredExpertise: ["counterexample design", "theory of measurement"],
    failedWorkValue:
      "The audit boundary and negative examples prevent overclaiming later.",
    disciplines: ["evaluation", "theory"],
    prerequisites: [
      {
        kind: "completed-project",
        value: "context-reconstruction",
        label: "Complete Context Reconstruction.",
      },
      {
        kind: "knowledge",
        value: 0.35,
        label: "Retain 0.35 research knowledge.",
      },
    ],
    durationRange: { min: 0.35, max: 0.75 },
    costRange: { min: 0.3, max: 0.7 },
    usefulnessRange: { min: 0.22, max: 0.78 },
    strategicFit: ["truthfulness", "risk", "decision quality"],
    uncertainty:
      "A convincing counterexample may change the direction entirely.",
    hidden: true,
    revealsOnInspect: ["eli-sato"],
    outcomes: [
      {
        kind: "partial",
        weight: 0.3,
        title: "A missing case became visible",
        summary:
          "The audit finds a narrow blind spot and leaves a concrete follow-up rather than a sweeping conclusion.",
        usefulness: { min: 0.4, max: 0.65 },
        knowledgeGained: 0.38,
        institutionalKnowledgeGained: 0.22,
        reveals: [],
        strategicOptions: ["counterexample-library"],
      },
      {
        kind: "useful-failure",
        weight: 0.36,
        title: "No new capability, better boundaries",
        summary:
          "The audit fails to improve output but makes the safe operating envelope explicit.",
        usefulness: { min: 0.3, max: 0.52 },
        knowledgeGained: 0.42,
        institutionalKnowledgeGained: 0.3,
        reveals: [],
        strategicOptions: ["safe-envelope"],
      },
      {
        kind: "breakthrough",
        weight: 0.16,
        title: "The counterexample redirected the plan",
        summary:
          "A hidden failure mode changes which project is strategically sensible next.",
        usefulness: { min: 0.62, max: 0.78 },
        knowledgeGained: 0.6,
        institutionalKnowledgeGained: 0.34,
        toolId: "counterexample-library",
        reveals: ["first-principles"],
        strategicOptions: ["reconstruction-plan"],
      },
      {
        kind: "failure",
        weight: 0.18,
        title: "The audit overfit its sample",
        summary:
          "The sample cannot support a general claim, but the audit protocol is kept for a safer rerun.",
        usefulness: { min: 0.1, max: 0.24 },
        knowledgeGained: 0.18,
        institutionalKnowledgeGained: 0.1,
        reveals: [],
        strategicOptions: ["replicate-with-controls"],
      },
    ],
  },
  {
    id: "first-principles",
    name: "First-Principles Reconstruction",
    question:
      "Can we rebuild the decision from constraints instead of inherited recipes?",
    hypothesis:
      "An educator-engineer can turn retained counterexamples into a durable, teachable method.",
    currentEvidence:
      "The team has useful notes, but the assumptions remain tacit and person-bound.",
    requiredExpertise: ["systems reconstruction", "technical mentorship"],
    failedWorkValue:
      "Written assumptions reveal where tacit knowledge still lives.",
    disciplines: ["theory", "education", "systems"],
    prerequisites: [
      {
        kind: "researcher",
        value: "orin-kade",
        label: "Collaborate with Orin Kade.",
      },
      {
        kind: "inspect",
        value: "negative-space",
        label: "Inspect Negative-Space Audit evidence.",
      },
    ],
    durationRange: { min: 0.55, max: 1.1 },
    costRange: { min: 0.7, max: 1.4 },
    usefulnessRange: { min: 0.35, max: 0.95 },
    strategicFit: ["institutional memory", "teaching", "long-term leverage"],
    uncertainty:
      "The method may be more valuable than any single benchmark gain.",
    hidden: true,
    revealsOnInspect: [],
    outcomes: [
      {
        kind: "breakthrough",
        weight: 0.32,
        title: "The method became teachable",
        summary:
          "Orin turns the evidence trail into a reconstruction worksheet that survives one person's departure.",
        usefulness: { min: 0.74, max: 0.95 },
        knowledgeGained: 0.72,
        institutionalKnowledgeGained: 0.68,
        toolId: "reconstruction-worksheet",
        reveals: [],
        strategicOptions: ["reconstruction-plan", "mentored-replication"],
      },
      {
        kind: "partial",
        weight: 0.38,
        title: "The reconstruction held with coaching",
        summary:
          "The method works for the current team and leaves a clear mentorship path for the next researcher.",
        usefulness: { min: 0.45, max: 0.68 },
        knowledgeGained: 0.56,
        institutionalKnowledgeGained: 0.42,
        toolId: "reconstruction-worksheet",
        reveals: [],
        strategicOptions: ["mentored-replication"],
      },
      {
        kind: "useful-failure",
        weight: 0.2,
        title: "The recipe was not portable",
        summary:
          "The reconstruction fails outside the original context, revealing exactly where tacit knowledge was hiding.",
        usefulness: { min: 0.3, max: 0.48 },
        knowledgeGained: 0.5,
        institutionalKnowledgeGained: 0.38,
        reveals: [],
        strategicOptions: ["mentored-replication", "safe-envelope"],
      },
      {
        kind: "failure",
        weight: 0.1,
        title: "The assumptions did not survive contact",
        summary:
          "The reconstruction is not ready, but its assumptions are now written down for the next team.",
        usefulness: { min: 0.14, max: 0.28 },
        knowledgeGained: 0.3,
        institutionalKnowledgeGained: 0.24,
        reveals: [],
        strategicOptions: ["replicate-with-controls"],
      },
    ],
  },
  {
    id: "replication-frontier",
    name: "Replication Frontier",
    question: "Which promising result still survives a clean rerun?",
    hypothesis:
      "A deliberately boring rerun will distinguish reusable knowledge from a lucky observation.",
    currentEvidence:
      "One evidence weave suggests a signal; no clean independent rerun exists yet.",
    requiredExpertise: ["replication protocol", "data controls"],
    failedWorkValue:
      "A failed rerun preserves the protocol and the cost of false confidence.",
    disciplines: ["evaluation", "data", "systems"],
    prerequisites: [
      {
        kind: "inspect",
        value: "evidence-weave",
        label: "Inspect Evidence Weave evidence.",
      },
      {
        kind: "knowledge",
        value: 1,
        label: "Accumulate 1.00 research knowledge.",
      },
    ],
    durationRange: { min: 0.45, max: 0.9 },
    costRange: { min: 0.45, max: 1.05 },
    usefulnessRange: { min: 0.2, max: 0.86 },
    strategicFit: ["reuse", "confidence", "publication"],
    uncertainty: "The result may be locally true and globally unhelpful.",
    hidden: true,
    revealsOnInspect: [],
    outcomes: [
      {
        kind: "breakthrough",
        weight: 0.2,
        title: "The result replicated",
        summary:
          "A clean rerun confirms the useful part and packages it for reuse by the wider team.",
        usefulness: { min: 0.64, max: 0.86 },
        knowledgeGained: 0.5,
        institutionalKnowledgeGained: 0.34,
        toolId: "replication-checklist",
        reveals: [],
        strategicOptions: ["publish-reproducible-eval"],
      },
      {
        kind: "subset",
        weight: 0.3,
        title: "Only the narrow result replicated",
        summary:
          "The core signal is real on one slice; the boundary is now part of the evidence rather than a footnote.",
        usefulness: { min: 0.38, max: 0.58 },
        knowledgeGained: 0.4,
        institutionalKnowledgeGained: 0.2,
        toolId: "replication-checklist",
        reveals: [],
        strategicOptions: ["slice-specific-routing"],
      },
      {
        kind: "useful-failure",
        weight: 0.28,
        title: "The rerun failed informatively",
        summary:
          "The failure identifies an interaction effect and protects the team from automating a fragile win.",
        usefulness: { min: 0.26, max: 0.46 },
        knowledgeGained: 0.34,
        institutionalKnowledgeGained: 0.24,
        reveals: [],
        strategicOptions: ["counterexample-library"],
      },
      {
        kind: "replication-failure",
        weight: 0.22,
        title: "The promising result was luck",
        summary:
          "Replication fails, but the retained protocol makes the cost of future false confidence visible.",
        usefulness: { min: 0.12, max: 0.27 },
        knowledgeGained: 0.24,
        institutionalKnowledgeGained: 0.18,
        reveals: [],
        strategicOptions: ["safe-envelope"],
      },
    ],
  },
];

export const researchers: readonly ResearcherSpec[] = [
  {
    id: "mira-voss",
    name: "Mira Voss",
    archetype: "systems experimentalist",
    disciplines: ["systems", "evaluation"],
    traits: {
      depth: 0.66,
      taste: 0.62,
      execution: 0.78,
      mentorship: 0.38,
      integrity: 0.82,
      influence: 0.34,
    },
    preferences: ["small instruments", "failure logs"],
    description:
      "Mira makes the smallest instrument that can falsify a claim, then leaves a crisp trail.",
    legendary: false,
    recruitCost: 0.38,
    minimumReputation: 0,
  },
  {
    id: "noor-adebayo",
    name: "Noor Adebayo",
    archetype: "evaluation cartographer",
    disciplines: ["evaluation", "data"],
    traits: {
      depth: 0.72,
      taste: 0.8,
      execution: 0.58,
      mentorship: 0.56,
      integrity: 0.9,
      influence: 0.52,
    },
    preferences: ["counterexamples", "independent slices"],
    description:
      "Noor maps what the evidence does not cover and refuses a clean chart with dirty boundaries.",
    legendary: false,
    recruitCost: 0.72,
    minimumReputation: 0.2,
  },
  {
    id: "eli-sato",
    name: "Eli Sato",
    archetype: "theory-to-practice mentor",
    disciplines: ["theory", "education"],
    traits: {
      depth: 0.84,
      taste: 0.68,
      execution: 0.48,
      mentorship: 0.88,
      integrity: 0.8,
      influence: 0.62,
    },
    preferences: ["written assumptions", "slow replication"],
    description:
      "Eli turns half-formed explanations into teachable questions and remembers why a shortcut was unsafe.",
    legendary: false,
    recruitCost: 0.9,
    minimumReputation: 0.4,
  },
  {
    id: "orin-kade",
    name: "Orin Kade",
    archetype: "legendary educator-engineer",
    disciplines: ["theory", "education", "systems"],
    traits: {
      depth: 0.98,
      taste: 0.94,
      execution: 0.72,
      mentorship: 0.98,
      integrity: 0.96,
      influence: 0.9,
    },
    preferences: ["first principles", "durable teaching"],
    description:
      "Orin rebuilds an idea from constraints at a blackboard, then makes the method legible to someone new.",
    signatureAction: "First-Principles Reconstruction",
    legendary: true,
    recruitCost: 1.35,
    minimumReputation: 0.55,
  },
];

export const findResearchProject = (
  id: unknown,
): ResearchProjectSpec | undefined =>
  typeof id === "string"
    ? researchProjects.find((project) => project.id === id)
    : undefined;

export const findResearcher = (id: unknown): ResearcherSpec | undefined =>
  typeof id === "string"
    ? researchers.find((item) => item.id === id)
    : undefined;
