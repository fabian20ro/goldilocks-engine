import type {
  AudienceId,
  CreatorArchetypeId,
  NarrativeKind,
  ToolId,
} from "./types";

export interface CreatorArchetypeSpec {
  id: CreatorArchetypeId;
  name: string;
  label: string;
  audienceIncentives: readonly AudienceId[];
  preferences: readonly string[];
  access: string;
  usefulness: string;
  trust: number;
  reach: number;
}

export interface NarrativeTemplate {
  id: string;
  kind: NarrativeKind;
  claim: string;
  sourceArchetypeId: CreatorArchetypeId;
  targetAudiences: readonly AudienceId[];
  creatorPreferenceSignals: readonly string[];
  creatorAccessSignals: readonly string[];
  deadlineHours: number;
  evidenceStrength: number;
  emotionalIntensity: number;
  reach: number;
  beneficiaries: readonly string[];
  counterevidence: readonly string[];
  activeEffects: readonly string[];
  resolutionRules: readonly string[];
  uncertainty: string;
}

export const creators: readonly CreatorArchetypeSpec[] = [
  {
    id: "developer-tastemaker",
    name: "Juno Park",
    label: "Developer tastemaker",
    audienceIncentives: ["developers", "enthusiasts"],
    preferences: ["usability", "latency", "price", "reliability"],
    access: "Trusted by hands-on builders who can test a tool in an afternoon.",
    usefulness: "Turns a real workflow into a legible recommendation.",
    trust: 0.88,
    reach: 0.62,
  },
  {
    id: "ai-news-amplifier",
    name: "Cass Orbit",
    label: "AI-news amplifier",
    audienceIncentives: ["enthusiasts", "entrepreneurs", "customers"],
    preferences: ["broad implications", "labor stories", "momentum"],
    access:
      "Fast reach across people who fear missing the next capability jump.",
    usefulness:
      "Makes a narrow result culturally visible, sometimes too early.",
    trust: 0.54,
    reach: 0.95,
  },
  {
    id: "builder-opportunity",
    name: "Rhea Sol",
    label: "Builder-opportunity creator",
    audienceIncentives: ["entrepreneurs", "customers", "developers"],
    preferences: ["products", "tutorials", "small-business adoption"],
    access: "Reaches practical adopters looking for a useful path this week.",
    usefulness: "Connects demonstrated capability to a concrete next action.",
    trust: 0.7,
    reach: 0.76,
  },
  {
    id: "skeptic",
    name: "Mara Keene",
    label: "Skeptic",
    audienceIncentives: ["skeptics", "researchers", "developers"],
    preferences: ["benchmarks", "failed demos", "independent scrutiny"],
    access: "Can lower the temperature by asking whether the evidence travels.",
    usefulness:
      "Finds counterevidence before a claim hardens into expectation.",
    trust: 0.92,
    reach: 0.48,
  },
] as const;

/**
 * Four finite narrative objects are enough to show the full loop. A response
 * is required before the next object becomes coverable, so attention cannot be
 * farmed forever without carrying the expectation and stakeholder cost.
 */
export const narrativeTemplates: readonly NarrativeTemplate[] = [
  {
    id: "local-builder-wave",
    kind: "hype",
    claim:
      "A small local tool can make solo builders meaningfully faster this week.",
    sourceArchetypeId: "builder-opportunity",
    targetAudiences: ["developers", "entrepreneurs", "customers"],
    creatorPreferenceSignals: [
      "products",
      "tutorials",
      "small-business adoption",
    ],
    creatorAccessSignals: ["practical adopters", "useful path"],
    deadlineHours: 2.5,
    evidenceStrength: 0.46,
    emotionalIntensity: 0.62,
    reach: 0.72,
    beneficiaries: ["early adopters", "practical builders"],
    counterevidence: [
      "The result may only hold for Interactive Chat.",
      "Support capacity has not been tested under attention.",
    ],
    activeEffects: [
      "Attention rises for the named audiences.",
      "Expectation debt grows until capability is demonstrated.",
    ],
    resolutionRules: [
      "Reliability and observed quality support a correct or partial claim.",
      "A low-evidence result resolves as delayed or wrong rather than certain.",
    ],
    uncertainty:
      "The demo may be useful without generalizing to every workflow.",
  },
  {
    id: "adopt-or-fall-behind",
    kind: "fear",
    claim:
      "Adopt the newest automation tool now or lose the next wave of work.",
    sourceArchetypeId: "ai-news-amplifier",
    targetAudiences: ["customers", "entrepreneurs", "enthusiasts"],
    creatorPreferenceSignals: [
      "broad implications",
      "labor stories",
      "momentum",
    ],
    creatorAccessSignals: ["fast reach", "fear missing", "capability jump"],
    deadlineHours: 2,
    evidenceStrength: 0.31,
    emotionalIntensity: 0.9,
    reach: 0.88,
    beneficiaries: ["tool sellers", "fast adopters"],
    counterevidence: [
      "A tool switch can hide a measurement problem.",
      "Existing local work may still be reliable at lower cost.",
    ],
    activeEffects: [
      "Fear pushes purchases and tool switching.",
      "A doom-feed item asks for a bounded response before the deadline.",
    ],
    resolutionRules: [
      "Tool-switching panic weakens confidence in fast adoption.",
      "Stable evidence can make the countdown overstated.",
    ],
    uncertainty:
      "Urgency is emotionally strong but its capability claim is weakly measured.",
  },
  {
    id: "reproducible-demo-day",
    kind: "hype",
    claim:
      "A reproducible local evaluation will land before the next demo day.",
    sourceArchetypeId: "developer-tastemaker",
    targetAudiences: ["developers", "researchers", "skeptics"],
    creatorPreferenceSignals: ["usability", "latency", "reliability"],
    creatorAccessSignals: ["hands-on builders", "afternoon"],
    deadlineHours: 3.5,
    evidenceStrength: 0.64,
    emotionalIntensity: 0.48,
    reach: 0.58,
    beneficiaries: ["independent evaluators", "careful adopters"],
    counterevidence: [
      "Private coverage is still a sample, not a guarantee.",
      "Research may reveal a narrower workload boundary.",
    ],
    activeEffects: [
      "Evidence-minded audiences gain a reason to inspect the pipeline.",
      "A missed deadline is remembered by patient partners and skeptics.",
    ],
    resolutionRules: [
      "Research usefulness and private coverage narrow the uncertainty range.",
      "A pending Research result keeps the prediction partly unresolved.",
    ],
    uncertainty:
      "The evaluation can be honest and still arrive later than promised.",
  },
  {
    id: "benchmark-cliff",
    kind: "fear",
    claim: "The public benchmark hides a reliability cliff for real users.",
    sourceArchetypeId: "skeptic",
    targetAudiences: ["skeptics", "researchers", "customers"],
    creatorPreferenceSignals: [
      "benchmarks",
      "failed demos",
      "independent scrutiny",
    ],
    creatorAccessSignals: ["lower the temperature", "evidence travels"],
    deadlineHours: 2.75,
    evidenceStrength: 0.57,
    emotionalIntensity: 0.74,
    reach: 0.52,
    beneficiaries: ["independent reviewers", "risk-aware customers"],
    counterevidence: [
      "The sampled workload mix may not represent every user.",
      "A visible failure is not proof of universal collapse.",
    ],
    activeEffects: [
      "Fear lowers appetite for unverified launches.",
      "A careful response can improve skeptic and researcher standing.",
    ],
    resolutionRules: [
      "Observed reliability and private assessment determine whether the warning lands.",
      "The exact workload boundary remains an uncertainty, not a global verdict.",
    ],
    uncertainty:
      "The warning may identify a narrow real boundary rather than total failure.",
  },
] as const;

export const toolOptions: readonly {
  id: ToolId;
  name: string;
  tradeoff: string;
}[] = [
  {
    id: "stable-local-stack",
    name: "Stable local stack",
    tradeoff:
      "Lower panic; slower visible novelty; preserves evidence continuity.",
  },
  {
    id: "fast-new-runtime",
    name: "Fast new runtime",
    tradeoff:
      "Quick attention signal; increases switching panic and evidence debt.",
  },
  {
    id: "evidence-first-stack",
    name: "Evidence-first stack",
    tradeoff: "Slower reach; reduces fear when private coverage is available.",
  },
] as const;

export const audienceLabels: Readonly<Record<AudienceId, string>> = {
  developers: "Developers",
  researchers: "Researchers",
  enthusiasts: "AI enthusiasts",
  entrepreneurs: "Entrepreneurs",
  customers: "Customers",
  skeptics: "Skeptics",
};

export const findCreator = (id: unknown): CreatorArchetypeSpec | undefined =>
  creators.find((creator) => creator.id === id);

export interface CreatorCoverageFit {
  preferenceMatches: readonly string[];
  accessMatches: readonly string[];
  score: number;
  eligible: boolean;
}

function normalized(value: unknown): string {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    : "";
}

function phraseMatches(source: unknown, signal: string): boolean {
  const sourceText = normalized(source);
  const signalText = normalized(signal);
  return (
    signalText.length > 0 &&
    (sourceText.includes(signalText) || signalText.includes(sourceText))
  );
}

/**
 * Coverage is a forecastable informed choice, not an ad-slot lookup. The
 * finite narrative template names the signals it needs; a creator supplies
 * them through the existing preference and access fields.
 */
export function creatorCoverageFit(
  creator: CreatorArchetypeSpec,
  template: NarrativeTemplate,
): CreatorCoverageFit {
  const preferences = Array.isArray(creator.preferences)
    ? creator.preferences
    : [];
  const preferenceMatches = template.creatorPreferenceSignals.filter((signal) =>
    preferences.some((preference) => phraseMatches(preference, signal)),
  );
  const accessMatches = template.creatorAccessSignals.filter((signal) =>
    phraseMatches(creator.access, signal),
  );
  const preferenceScore =
    preferenceMatches.length /
    Math.max(1, template.creatorPreferenceSignals.length);
  const accessScore =
    accessMatches.length / Math.max(1, template.creatorAccessSignals.length);
  const score = Number((preferenceScore * 0.6 + accessScore * 0.4).toFixed(3));
  return {
    preferenceMatches,
    accessMatches,
    score,
    eligible: preferenceMatches.length > 0 && accessMatches.length > 0,
  };
}

export const findNarrativeTemplate = (
  id: unknown,
): NarrativeTemplate | undefined =>
  narrativeTemplates.find((template) => template.id === id);

export const findTool = (id: unknown) =>
  toolOptions.find((tool) => tool.id === id);
