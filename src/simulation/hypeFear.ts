import {
  audienceLabels,
  findCreator,
  findNarrativeTemplate,
  narrativeTemplates,
} from "./hypeFearCatalog";
import type {
  AudienceId,
  AudienceReputation,
  DoomFeedEntry,
  HypeFearState,
  NarrativeInstance,
  NarrativePrediction,
  NarrativeResolution,
  NarrativeResolutionKind,
  NarrativeResponseId,
  FearResponseId,
  StakeholderSelection,
  ToolId,
} from "./types";

export const MAX_NARRATIVE_HISTORY = 12;
export const MAX_DOOM_FEED_ENTRIES = 12;
export const MAX_ATTENTION = 100;
export const MAX_EXPECTATION_DEBT = 1;
export const MAX_FEAR = 1;
export const MAX_TOOL_SWITCHING_PANIC = 1;
export const NARRATIVE_DEADLINE_TICKS_PER_HOUR = Math.round(3_600_000 / 70);

const AUDIENCES: readonly AudienceId[] = [
  "developers",
  "researchers",
  "enthusiasts",
  "entrepreneurs",
  "customers",
  "skeptics",
];
const NARRATIVE_STATUSES: readonly NarrativeInstance["status"][] = [
  "available",
  "awaiting-prediction",
  "countdown",
  "awaiting-response",
  "resolved",
];
const PREDICTIONS: readonly NarrativePrediction[] = [
  "lands",
  "partial",
  "delayed",
];
const RESOLUTIONS: readonly NarrativeResolutionKind[] = [
  "correct",
  "partly-correct",
  "wrong",
  "delayed",
  "unpredicted",
];
const TOOLS: readonly ToolId[] = [
  "stable-local-stack",
  "fast-new-runtime",
  "evidence-first-stack",
];

export interface HypeFearContext {
  seed: number;
  tick: number;
  jobsCompleted: number;
  reputation: number;
  observedQuality: number;
  reliability: number;
  observability: number;
  privateCoverage: number;
  researchKnowledge: number;
  latestResearchUsefulness: number;
  productReleased: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 3): number =>
  Number(value.toFixed(digits));

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const safeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const uniqueStrings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string" && item.length > 0) &&
  new Set(value).size === value.length;

const audienceRecord = (value = 0): AudienceReputation => ({
  developers: value,
  researchers: value,
  enthusiasts: value,
  entrepreneurs: value,
  customers: value,
  skeptics: value,
});

const selectionRecord = (): StakeholderSelection => ({
  escalationSeekers: 0,
  patientPartners: 0,
  supportHeavyUsers: 0,
  cautiousReviewers: 0,
});

export function createInitialHypeFearState(): HypeFearState {
  return {
    unlocked: false,
    attention: 0,
    fear: 0,
    expectationDebt: 0,
    audienceReputation: audienceRecord(),
    stakeholderSelection: selectionRecord(),
    currentToolId: "stable-local-stack",
    toolSwitchingPanic: 0,
    toolSwitches: 0,
    narratives: [],
    activeNarrativeId: null,
    nextNarrativeIndex: 0,
    pendingResponse: null,
    doomFeed: [],
    lastResponse: null,
    attentionOnlyActions: 0,
  };
}

export function hypeFearRecognition(
  context: Pick<
    HypeFearContext,
    "jobsCompleted" | "reputation" | "productReleased"
  >,
): boolean {
  return (
    context.jobsCompleted >= 1 ||
    context.reputation >= 0.15 ||
    context.productReleased
  );
}

export function narrativeDeadlineTicks(hours: number): number {
  return Math.max(
    1,
    Math.round(clamp(hours, 0.25, 24) * NARRATIVE_DEADLINE_TICKS_PER_HOUR),
  );
}

function unit(seed: number, key: string, tick: number): number {
  let hash = (seed ^ Math.imul(tick + 1, 0x45d9f3b)) >>> 0;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d) >>> 0;
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x1_0000_0000;
}

export function narrativeEvidenceStrength(
  context: HypeFearContext,
  templateEvidence: number,
): number {
  return round(
    clamp(
      templateEvidence * 0.42 +
        context.observability * 0.18 +
        context.privateCoverage * 0.2 +
        context.researchKnowledge * 0.08 +
        (context.latestResearchUsefulness ?? 0) * 0.12,
      0.05,
      0.95,
    ),
  );
}

export function createNarrativeInstance(
  templateIndex: number,
  context: HypeFearContext,
): NarrativeInstance | null {
  const template = narrativeTemplates[templateIndex];
  if (!template) return null;
  const id = `${template.id}-${templateIndex + 1}`;
  return {
    id,
    templateId: template.id,
    kind: template.kind,
    claim: template.claim,
    sourceArchetypeId: template.sourceArchetypeId,
    targetAudiences: [...template.targetAudiences],
    deadlineTick: context.tick + narrativeDeadlineTicks(template.deadlineHours),
    startedAtTick: context.tick,
    evidenceStrength: narrativeEvidenceStrength(
      context,
      template.evidenceStrength,
    ),
    emotionalIntensity: template.emotionalIntensity,
    reach: template.reach,
    beneficiaries: [...template.beneficiaries],
    counterevidence: [...template.counterevidence],
    activeEffects: [...template.activeEffects],
    resolutionRules: [...template.resolutionRules],
    status: "available",
    coveredByCreatorIds: [],
    prediction: null,
    resolution: null,
  };
}

function actualCapability(
  context: HypeFearContext,
  state: HypeFearState,
): number {
  return clamp(
    (context.observedQuality / 99) * 0.36 +
      context.reliability * 0.28 +
      context.privateCoverage * 0.16 +
      context.observability * 0.08 +
      context.latestResearchUsefulness * 0.12 -
      state.toolSwitchingPanic * 0.12,
    0,
    1,
  );
}

export function resolveNarrative(
  narrative: NarrativeInstance,
  context: HypeFearContext,
  state: HypeFearState,
): NarrativeResolution {
  const capability = actualCapability(context, state);
  const evidence = narrative.evidenceStrength;
  const random = unit(context.seed, narrative.id, narrative.deadlineTick);
  let kind: NarrativeResolutionKind;
  if (!narrative.prediction) kind = "unpredicted";
  else if (narrative.kind === "hype") {
    if (capability >= 0.68 && evidence >= 0.48) kind = "correct";
    else if (capability >= 0.46)
      kind = random < 0.55 ? "partly-correct" : "delayed";
    else kind = random < 0.55 ? "wrong" : "delayed";
  } else if (capability <= 0.44 || context.privateCoverage < 0.22) {
    kind = "correct";
  } else if (capability <= 0.62) {
    kind = "partly-correct";
  } else {
    kind = random < 0.65 ? "wrong" : "delayed";
  }
  const confidence = clamp(
    0.38 +
      evidence * 0.42 +
      context.observability * 0.18 -
      state.toolSwitchingPanic * 0.16,
    0.2,
    0.94,
  );
  const confidenceRange = {
    min: round(clamp(confidence - 0.14, 0.05, 0.95)),
    max: round(clamp(confidence + 0.14, 0.1, 0.99)),
  };
  const headline: Record<NarrativeResolutionKind, string> = {
    correct: "The claim landed inside the measured boundary.",
    "partly-correct": "The claim held for a narrower audience or workload.",
    wrong: "The countdown outran the evidence.",
    delayed: "The capability may be real, but the deadline slipped.",
    unpredicted: "The deadline arrived without a player prediction.",
  };
  return {
    kind,
    headline: headline[kind],
    supportedEvidence: `Observed capability remains a bounded estimate; evidence confidence ${Math.round(confidenceRange.min * 100)}–${Math.round(confidenceRange.max * 100)}%. ${narrative.counterevidence[0] ?? "Counterevidence remains available."}`,
    confidenceRange,
    resolvedAtTick: context.tick,
  };
}

export function appendDoomFeed(
  state: HypeFearState,
  entry: DoomFeedEntry,
): HypeFearState {
  return {
    ...state,
    doomFeed: [...state.doomFeed, entry].slice(-MAX_DOOM_FEED_ENTRIES),
  };
}

export function narrativeResponseLabel(
  response: NarrativeResponseId | FearResponseId,
): string {
  return response.replaceAll("-", " ");
}

export function isHypeFearStateShapeValid(
  value: unknown,
  simulationTick?: number,
): value is HypeFearState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as HypeFearState;
  const maxTick = simulationTick ?? Number.MAX_SAFE_INTEGER;
  if (!safeInteger(maxTick)) return false;
  const audienceValues = AUDIENCES.map((id) => state.audienceReputation?.[id]);
  const selectionValues = state.stakeholderSelection
    ? Object.values(state.stakeholderSelection)
    : [];
  if (
    typeof state.unlocked !== "boolean" ||
    !finite(state.attention) ||
    state.attention < 0 ||
    state.attention > MAX_ATTENTION ||
    !finite(state.fear) ||
    state.fear < 0 ||
    state.fear > MAX_FEAR ||
    !finite(state.expectationDebt) ||
    state.expectationDebt < 0 ||
    state.expectationDebt > MAX_EXPECTATION_DEBT ||
    !state.audienceReputation ||
    audienceValues.some((item) => !finite(item) || item < 0 || item > 1) ||
    !state.stakeholderSelection ||
    selectionValues.some((item) => !finite(item) || item < 0 || item > 1) ||
    !TOOLS.includes(state.currentToolId) ||
    !finite(state.toolSwitchingPanic) ||
    state.toolSwitchingPanic < 0 ||
    state.toolSwitchingPanic > MAX_TOOL_SWITCHING_PANIC ||
    !safeInteger(state.toolSwitches) ||
    state.toolSwitches > 1000 ||
    !Array.isArray(state.narratives) ||
    state.narratives.length > MAX_NARRATIVE_HISTORY ||
    !safeInteger(state.nextNarrativeIndex) ||
    state.nextNarrativeIndex > narrativeTemplates.length ||
    !safeInteger(state.attentionOnlyActions) ||
    state.attentionOnlyActions > 1000 ||
    !Array.isArray(state.doomFeed) ||
    state.doomFeed.length > MAX_DOOM_FEED_ENTRIES
  )
    return false;
  const narrativeIds = new Set<string>();
  for (const narrative of state.narratives) {
    if (
      typeof narrative !== "object" ||
      narrative === null ||
      typeof narrative.id !== "string" ||
      narrative.id.length === 0 ||
      narrativeIds.has(narrative.id) ||
      !findNarrativeTemplate(narrative.templateId) ||
      !["hype", "fear"].includes(narrative.kind) ||
      typeof narrative.claim !== "string" ||
      narrative.claim.length === 0 ||
      !findCreator(narrative.sourceArchetypeId) ||
      !uniqueStrings(narrative.targetAudiences) ||
      narrative.targetAudiences.some(
        (id: unknown) => !AUDIENCES.includes(id as AudienceId),
      ) ||
      !safeInteger(narrative.startedAtTick) ||
      narrative.startedAtTick > maxTick ||
      !safeInteger(narrative.deadlineTick) ||
      narrative.deadlineTick < narrative.startedAtTick ||
      narrative.deadlineTick > maxTick + narrativeDeadlineTicks(24) ||
      !finite(narrative.evidenceStrength) ||
      narrative.evidenceStrength < 0 ||
      narrative.evidenceStrength > 1 ||
      !finite(narrative.emotionalIntensity) ||
      narrative.emotionalIntensity < 0 ||
      narrative.emotionalIntensity > 1 ||
      !finite(narrative.reach) ||
      narrative.reach < 0 ||
      narrative.reach > 1 ||
      !uniqueStrings(narrative.beneficiaries) ||
      !uniqueStrings(narrative.counterevidence) ||
      !uniqueStrings(narrative.activeEffects) ||
      !uniqueStrings(narrative.resolutionRules) ||
      !NARRATIVE_STATUSES.includes(narrative.status) ||
      !Array.isArray(narrative.coveredByCreatorIds) ||
      narrative.coveredByCreatorIds.some((id: unknown) => !findCreator(id)) ||
      narrative.coveredByCreatorIds.length > 4
    )
      return false;
    narrativeIds.add(narrative.id);
    if (narrative.prediction !== null) {
      if (
        !PREDICTIONS.includes(narrative.prediction.prediction) ||
        !finite(narrative.prediction.confidence) ||
        narrative.prediction.confidence < 0 ||
        narrative.prediction.confidence > 1 ||
        !safeInteger(narrative.prediction.submittedAtTick) ||
        narrative.prediction.submittedAtTick > maxTick
      )
        return false;
    }
    if (narrative.resolution !== null) {
      if (
        !RESOLUTIONS.includes(narrative.resolution.kind) ||
        typeof narrative.resolution.headline !== "string" ||
        typeof narrative.resolution.supportedEvidence !== "string" ||
        !finite(narrative.resolution.confidenceRange.min) ||
        !finite(narrative.resolution.confidenceRange.max) ||
        narrative.resolution.confidenceRange.min < 0 ||
        narrative.resolution.confidenceRange.max > 1 ||
        narrative.resolution.confidenceRange.min >
          narrative.resolution.confidenceRange.max ||
        !safeInteger(narrative.resolution.resolvedAtTick) ||
        narrative.resolution.resolvedAtTick > maxTick
      )
        return false;
    }
    if (
      (narrative.status === "available" ||
        narrative.status === "awaiting-prediction") &&
      narrative.resolution !== null
    )
      return false;
    if (narrative.status === "countdown" && narrative.prediction === null)
      return false;
    if (
      (narrative.status === "awaiting-response" ||
        narrative.status === "resolved") &&
      narrative.resolution === null
    )
      return false;
  }
  if (
    state.activeNarrativeId !== null &&
    !narrativeIds.has(state.activeNarrativeId)
  )
    return false;
  if (
    state.pendingResponse !== null &&
    (!narrativeIds.has(state.pendingResponse.narrativeId) ||
      state.narratives.find(
        (narrative) => narrative.id === state.pendingResponse?.narrativeId,
      )?.status !== "awaiting-response" ||
      state.pendingResponse.response !== "pending" ||
      !safeInteger(state.pendingResponse.resolvedAtTick) ||
      state.pendingResponse.resolvedAtTick > maxTick ||
      !finite(state.pendingResponse.expectationDebtAfter) ||
      state.pendingResponse.expectationDebtAfter < 0 ||
      state.pendingResponse.expectationDebtAfter > 1 ||
      typeof state.pendingResponse.stakeholderNote !== "string")
  )
    return false;
  if (
    state.lastResponse !== null &&
    (!narrativeIds.has(state.lastResponse.narrativeId) ||
      state.narratives.find(
        (narrative) => narrative.id === state.lastResponse?.narrativeId,
      )?.status !== "resolved" ||
      !safeInteger(state.lastResponse.resolvedAtTick) ||
      state.lastResponse.resolvedAtTick > maxTick ||
      !finite(state.lastResponse.expectationDebtAfter) ||
      state.lastResponse.expectationDebtAfter < 0 ||
      state.lastResponse.expectationDebtAfter > 1 ||
      typeof state.lastResponse.stakeholderNote !== "string" ||
      state.lastResponse.response === "pending")
  )
    return false;
  const feedIds = new Set<string>();
  for (const item of state.doomFeed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.id !== "string" ||
      feedIds.has(item.id) ||
      !narrativeIds.has(item.narrativeId) ||
      !findCreator(item.sourceArchetypeId) ||
      typeof item.headline !== "string" ||
      typeof item.uncertainty !== "string" ||
      !safeInteger(item.createdAtTick) ||
      item.createdAtTick > maxTick ||
      typeof item.responseRequired !== "boolean"
    )
      return false;
    feedIds.add(item.id);
  }
  return true;
}

export function audienceName(id: AudienceId): string {
  return audienceLabels[id];
}
