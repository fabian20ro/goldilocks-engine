import {
  findResearcher,
  findResearchProject,
  researchProjects,
  researchers,
} from "./researchCatalog";
import type {
  ResearchOutcome,
  ResearchOutcomeDefinition,
  ResearchProjectSpec,
  ResearchState,
} from "./types";

const RESEARCH_OUTCOME_KINDS = [
  "breakthrough",
  "partial",
  "failure",
  "useful-failure",
  "subset",
  "replication-failure",
] as const;

export interface ResearchContext {
  seed: number;
  jobsCompleted: number;
  reputation: number;
  privateCoverage: number;
  competitionSubmissions: number;
  productReleased: boolean;
}

export interface ResearchRequirementResult {
  unlocked: boolean;
  requirements: readonly string[];
}

export interface ResearchTeamProfile {
  execution: number;
  depth: number;
  taste: number;
  mentorship: number;
  integrity: number;
  influence: number;
  chemistry: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 3): number =>
  Number(value.toFixed(digits));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const positiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const uniqueStrings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string" && item.length > 0) &&
  new Set(value).size === value.length;

export function createInitialResearchState(): ResearchState {
  return {
    frontier: {
      discoveredProjectIds: ["context-reconstruction"],
      inspectedProjectIds: [],
      completedProjectIds: [],
    },
    goal: null,
    pendingDecision:
      "Inspect the first evidence card, then decide which uncertain question deserves scarce time and cash.",
    computeAllocation: 60,
    activeProject: null,
    availableResearcherIds: ["mira-voss"],
    recruitedResearcherIds: [],
    teamMemberIds: [],
    chemistry: 0,
    institutionalKnowledge: 0,
    retainedKnowledge: 0,
    tacitKnowledge: Object.fromEntries(researchers.map((item) => [item.id, 0])),
    toolIds: [],
    strategicOptionIds: [],
    firstPrinciplesUses: 0,
    lastOutcome: null,
  };
}

export function researchRecognition(context: ResearchContext): boolean {
  return (
    context.jobsCompleted >= 1 ||
    context.reputation >= 0.15 ||
    context.competitionSubmissions >= 1 ||
    context.productReleased
  );
}

export function researchUnlockRequirements(
  context: ResearchContext,
): ResearchRequirementResult {
  const requirements = [
    `${Math.min(1, context.jobsCompleted)}/1 accepted delivery`,
    `${Math.min(0.15, context.reputation).toFixed(2)}/0.15 reputation`,
  ];
  return {
    unlocked: researchRecognition(context),
    requirements,
  };
}

function hasPrerequisite(
  prerequisite: ResearchProjectSpec["prerequisites"][number],
  state: ResearchState,
  context: ResearchContext,
): boolean {
  switch (prerequisite.kind) {
    case "recognition":
      return researchRecognition(context);
    case "inspect":
      return state.frontier.inspectedProjectIds.includes(
        String(prerequisite.value),
      );
    case "coverage":
      return context.privateCoverage >= Number(prerequisite.value);
    case "completed-project":
      return state.frontier.completedProjectIds.includes(
        String(prerequisite.value),
      );
    case "knowledge":
      return (
        state.institutionalKnowledge + state.retainedKnowledge >=
        Number(prerequisite.value)
      );
    case "researcher":
      return state.recruitedResearcherIds.includes(String(prerequisite.value));
    default:
      return false;
  }
}

export function researchProjectRequirements(
  project: ResearchProjectSpec,
  state: ResearchState,
  context: ResearchContext,
): ResearchRequirementResult {
  const requirements = project.prerequisites.map((item) =>
    hasPrerequisite(item, state, context)
      ? `✓ ${item.label}`
      : `Need ${item.label}`,
  );
  return {
    unlocked:
      researchRecognition(context) &&
      project.prerequisites.every((item) =>
        hasPrerequisite(item, state, context),
      ),
    requirements,
  };
}

export function researchProjectVisible(
  project: ResearchProjectSpec,
  state: ResearchState,
): boolean {
  return (
    state.frontier.discoveredProjectIds.includes(project.id) &&
    (!project.hidden ||
      state.frontier.discoveredProjectIds.includes(project.id))
  );
}

export function researchTeamProfile(
  memberIds: readonly string[],
): ResearchTeamProfile {
  const members = memberIds.flatMap((id) => {
    const item = findResearcher(id);
    return item ? [item] : [];
  });
  if (members.length === 0)
    return {
      execution: 0,
      depth: 0,
      taste: 0,
      mentorship: 0,
      integrity: 0,
      influence: 0,
      chemistry: 0,
    };
  const average = (key: keyof (typeof members)[number]["traits"]) =>
    members.reduce((total, item) => total + item.traits[key], 0) /
    members.length;
  const disciplines = new Set(members.flatMap((item) => item.disciplines));
  const chemistry = clamp(
    0.45 +
      Math.min(0.28, (disciplines.size - 1) * 0.1) +
      Math.min(0.2, (members.length - 1) * 0.08),
    0,
    1,
  );
  return {
    execution: round(average("execution")),
    depth: round(average("depth")),
    taste: round(average("taste")),
    mentorship: round(average("mentorship")),
    integrity: round(average("integrity")),
    influence: round(average("influence")),
    chemistry: round(chemistry),
  };
}

export function researchTeamChemistry(memberIds: readonly string[]): number {
  return researchTeamProfile(memberIds).chemistry;
}

export function researchEstimate(
  project: ResearchProjectSpec,
  state: ResearchState,
): { durationHours: number; cost: number } {
  const profile = researchTeamProfile(state.teamMemberIds);
  const allocation = clamp(state.computeAllocation, 25, 100) / 100;
  const executionBonus = clamp(
    profile.execution * 0.12 + profile.chemistry * 0.08,
    0,
    0.2,
  );
  const durationHours = round(
    project.durationRange.max -
      (project.durationRange.max - project.durationRange.min) *
        executionBonus *
        allocation +
      (1 - allocation) * 0.12,
    3,
  );
  const cost = round(
    project.costRange.min +
      (project.costRange.max - project.costRange.min) *
        clamp(
          0.8 - profile.execution * 0.25 + (allocation - 0.6) * 0.12,
          0.35,
          0.9,
        ),
    3,
  );
  return { durationHours, cost };
}

function deterministicUnit(
  seed: number,
  projectId: string,
  tick: number,
): number {
  let hash = (seed ^ Math.imul(tick + 1, 0x45d9f3b)) >>> 0;
  for (let index = 0; index < projectId.length; index += 1) {
    hash ^= projectId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d) >>> 0;
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x1_0000_0000;
}

function weightedOutcome(
  outcomes: readonly ResearchOutcomeDefinition[],
  unit: number,
  quality: number,
): ResearchOutcomeDefinition {
  const adjusted = outcomes.map((outcome) => {
    const qualityBias =
      quality > 0.72 && outcome.kind === "breakthrough"
        ? 1.12
        : quality < 0.42 &&
            (outcome.kind === "failure" ||
              outcome.kind === "replication-failure")
          ? 1.1
          : 1;
    return { outcome, weight: outcome.weight * qualityBias };
  });
  const total = adjusted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = unit * total;
  for (const item of adjusted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.outcome;
  }
  return outcomes.at(-1)!;
}

export function resolveResearchOutcome(
  project: ResearchProjectSpec,
  state: ResearchState,
  context: ResearchContext,
): ResearchOutcome {
  const profile = researchTeamProfile(state.teamMemberIds);
  const quality = clamp(
    profile.depth * 0.25 +
      profile.taste * 0.2 +
      profile.execution * 0.2 +
      profile.integrity * 0.2 +
      profile.chemistry * 0.15 +
      context.privateCoverage * 0.12,
    0,
    1,
  );
  const definition = weightedOutcome(
    project.outcomes,
    deterministicUnit(
      context.seed,
      project.id,
      state.activeProject?.startedAtTick ?? 0,
    ),
    quality,
  );
  const usefulnessUnit = deterministicUnit(
    context.seed ^ 0x9e3779b9,
    `${project.id}:usefulness`,
    state.activeProject?.startedAtTick ?? 0,
  );
  const usefulness = round(
    definition.usefulness.min +
      (definition.usefulness.max - definition.usefulness.min) * usefulnessUnit,
  );
  const estimate = researchEstimate(project, state);
  const newKnowledge = round(
    definition.knowledgeGained * (0.9 + quality * 0.1),
  );
  const institutional = round(
    definition.institutionalKnowledgeGained *
      (0.85 + profile.mentorship * 0.15),
  );
  return {
    projectId: project.id,
    kind: definition.kind,
    title: definition.title,
    summary: definition.summary,
    usefulness,
    durationHours: estimate.durationHours,
    cost: state.activeProject?.committedCost ?? estimate.cost,
    knowledgeGained: newKnowledge,
    institutionalKnowledgeGained: institutional,
    toolId: definition.toolId ?? null,
    revealedProjectIds: definition.reveals,
    strategicOptionIds: definition.strategicOptions,
  };
}

export function researchInspectReveals(
  project: ResearchProjectSpec,
): readonly string[] {
  return project.revealsOnInspect;
}

export function isResearchStateShapeValid(
  value: unknown,
): value is ResearchState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as ResearchState;
  const projectIds = new Set(researchProjects.map((item) => item.id));
  const researcherIds = new Set(researchers.map((item) => item.id));
  const frontier = state.frontier;
  if (typeof frontier !== "object" || frontier === null) return false;
  if (
    !uniqueStrings(frontier.discoveredProjectIds) ||
    !uniqueStrings(frontier.inspectedProjectIds) ||
    !uniqueStrings(frontier.completedProjectIds) ||
    !frontier.discoveredProjectIds.every((id) => projectIds.has(id)) ||
    !frontier.inspectedProjectIds.every((id) => projectIds.has(id)) ||
    !frontier.completedProjectIds.every((id) => projectIds.has(id)) ||
    !frontier.inspectedProjectIds.every((id) =>
      frontier.discoveredProjectIds.includes(id),
    ) ||
    !frontier.completedProjectIds.every((id) =>
      frontier.discoveredProjectIds.includes(id),
    )
  )
    return false;
  if (
    state.goal !== null &&
    (typeof state.goal !== "object" ||
      !isFiniteNumber(state.goal.createdAtTick) ||
      !positiveInteger(state.goal.createdAtTick) ||
      state.goal.createdAtTick < 0 ||
      typeof state.goal.text !== "string" ||
      state.goal.text.length < 8 ||
      state.goal.text.length > 120 ||
      state.goal.status !== "pending")
  )
    return false;
  if (
    typeof state.pendingDecision !== "string" ||
    state.pendingDecision.length > 400 ||
    !Number.isSafeInteger(state.computeAllocation) ||
    state.computeAllocation < 25 ||
    state.computeAllocation > 100 ||
    !uniqueStrings(state.availableResearcherIds) ||
    !uniqueStrings(state.recruitedResearcherIds) ||
    !uniqueStrings(state.teamMemberIds) ||
    !state.availableResearcherIds.every((id) => researcherIds.has(id)) ||
    !state.recruitedResearcherIds.every((id) => researcherIds.has(id)) ||
    !state.teamMemberIds.every((id) =>
      state.recruitedResearcherIds.includes(id),
    ) ||
    state.teamMemberIds.length > 3 ||
    state.availableResearcherIds.some((id) =>
      state.recruitedResearcherIds.includes(id),
    ) ||
    !isFiniteNumber(state.chemistry) ||
    state.chemistry < 0 ||
    state.chemistry > 1 ||
    !isFiniteNumber(state.institutionalKnowledge) ||
    state.institutionalKnowledge < 0 ||
    state.institutionalKnowledge > 100 ||
    !isFiniteNumber(state.retainedKnowledge) ||
    state.retainedKnowledge < 0 ||
    state.retainedKnowledge > 100 ||
    typeof state.tacitKnowledge !== "object" ||
    state.tacitKnowledge === null ||
    !researchers.every((item) => {
      const value = state.tacitKnowledge[item.id];
      return isFiniteNumber(value) && value >= 0 && value <= 100;
    }) ||
    !uniqueStrings(state.toolIds) ||
    !uniqueStrings(state.strategicOptionIds) ||
    !positiveInteger(state.firstPrinciplesUses) ||
    state.firstPrinciplesUses > 1000
  )
    return false;
  if (state.activeProject !== null) {
    const project = findResearchProject(state.activeProject.projectId);
    if (
      !project ||
      state.goal === null ||
      !positiveInteger(state.activeProject.startedAtTick) ||
      !isFiniteNumber(state.activeProject.elapsedHours) ||
      state.activeProject.elapsedHours < 0 ||
      !isFiniteNumber(state.activeProject.expectedDurationHours) ||
      state.activeProject.expectedDurationHours <= 0 ||
      state.activeProject.elapsedHours >
        state.activeProject.expectedDurationHours ||
      !isFiniteNumber(state.activeProject.committedCost) ||
      state.activeProject.committedCost < 0 ||
      state.activeProject.committedCost > 100 ||
      state.teamMemberIds.length === 0 ||
      !state.frontier.inspectedProjectIds.includes(project.id)
    )
      return false;
  }
  if (state.lastOutcome !== null) {
    const outcome = state.lastOutcome;
    if (
      !findResearchProject(outcome.projectId) ||
      !RESEARCH_OUTCOME_KINDS.includes(outcome.kind) ||
      typeof outcome.title !== "string" ||
      typeof outcome.summary !== "string" ||
      !isFiniteNumber(outcome.usefulness) ||
      outcome.usefulness < 0 ||
      outcome.usefulness > 1 ||
      !isFiniteNumber(outcome.durationHours) ||
      outcome.durationHours < 0 ||
      !isFiniteNumber(outcome.cost) ||
      outcome.cost < 0 ||
      !isFiniteNumber(outcome.knowledgeGained) ||
      outcome.knowledgeGained < 0 ||
      !isFiniteNumber(outcome.institutionalKnowledgeGained) ||
      outcome.institutionalKnowledgeGained < 0 ||
      (outcome.toolId !== null && typeof outcome.toolId !== "string") ||
      !uniqueStrings(outcome.revealedProjectIds) ||
      !uniqueStrings(outcome.strategicOptionIds)
    )
      return false;
  }
  return true;
}
