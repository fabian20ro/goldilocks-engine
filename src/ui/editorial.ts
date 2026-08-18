import {
  calculateMetrics,
  estimateWorkloadOffer,
  getWorkloadQuote,
  type CareerEveningProjection,
} from "../simulation/engine";
import { formatCompactCurrency } from "../simulation/currency";
import {
  bedroomCareerRoutes,
  getHardware,
  getSlot,
  getWorkload,
} from "../simulation/catalog";
import { laboratoryPipelineReadiness } from "../simulation/laboratory";
import { researchProjectRequirements } from "../simulation/research";
import { researchProjects } from "../simulation/researchCatalog";
import {
  laboratoryMachines,
  laboratoryPipelines,
} from "../simulation/laboratoryCatalog";
import type { SimulationState } from "../simulation/types";

export type EditorialDestination =
  | "Build"
  | "Jobs"
  | "Career"
  | "Upgrades"
  | "Inspect"
  | "Research"
  | "Lab"
  | "World";

export interface EditorialDecision {
  destination: EditorialDestination;
  currentState: string;
  consequence: string;
  costOrRisk: string;
  nextAction: string;
  detailsHint: string;
}

export interface EditorialOnboardingContext {
  active: boolean;
  action?: string;
  requiredTabLabel?: string;
}

const money = (amount: number) => formatCompactCurrency(amount);

function detailsHint(destination: EditorialDestination): string {
  return `${destination}: exact accounting, requirements, and evidence remain available in Details/evidence surfaces.`;
}

function decision(
  destination: EditorialDestination,
  values: Omit<EditorialDecision, "destination" | "detailsHint">,
): EditorialDecision {
  return {
    destination,
    ...values,
    detailsHint: detailsHint(destination),
  };
}

function onboardingNext(
  onboarding: EditorialOnboardingContext | undefined,
  fallback: string,
): string {
  if (!onboarding?.active) return fallback;
  return onboarding.requiredTabLabel
    ? `Follow the first-session step in ${onboarding.requiredTabLabel}; no duplicate action is added here.`
    : "Follow the first-session step above; no duplicate action is added here.";
}

export function presentBuildDecision(
  state: SimulationState,
  selectedStageId: string,
  onboarding?: EditorialOnboardingContext,
): EditorialDecision {
  const stage = state.slots.find((slot) => slot.slotId === selectedStageId);
  const stageName = stage ? getSlot(stage.slotId).name : "a compatible stage";
  const active = state.jobs.activeTask
    ? `${getWorkload(state.jobs.activeTask.workloadId).name} is ${Math.round(state.jobs.activeTask.progress * 100)}% through the rail.`
    : state.jobs.paused
      ? "The worker is paused with the current topology preserved."
      : `${state.slots.length} ordered stages are ready for observation.`;
  return decision("Build", {
    currentState: active,
    consequence:
      "The measured bottleneck is the next constraint; placement changes the observed pipeline tradeoff.",
    costOrRisk: `Risk: ${state.lastWarning}`,
    nextAction: onboardingNext(
      onboarding,
      `Select ${stageName}, then compare one compatible owned module before placing it.`,
    ),
  });
}

export function presentJobsDecision(
  state: SimulationState,
  onboarding?: EditorialOnboardingContext,
): EditorialDecision {
  const workload = getWorkload(
    onboarding?.active &&
      (onboarding.action === "queue-starter" ||
        onboarding.action === "observe-settlement")
      ? "interactive-chat"
      : state.workloadId,
  );
  const quote = getWorkloadQuote(state, workload.id);
  const metrics = calculateMetrics({ ...state, workloadId: workload.id });
  const offer = estimateWorkloadOffer(metrics, quote);
  const active = state.jobs.activeTask
    ? `${getWorkload(state.jobs.activeTask.workloadId).name} is active at ${Math.round(state.jobs.activeTask.progress * 100)}%.`
    : "One workload is selected; its current quote is held for comparison.";
  return decision("Jobs", {
    currentState: active,
    consequence: `A completed task locks this quote; modeled outcome is ${offer.expectedNet >= 0 ? "positive" : "negative"} net after configured cost.`,
    costOrRisk: offer.guaranteedFailure
      ? "Risk: this configuration guarantees failure and pays $0.00 gross."
      : `Cost / risk: ${money(metrics.operatingCost)} configured cost at ${Math.round(metrics.reliability * 100)}% modeled delivery.`,
    nextAction: onboardingNext(
      onboarding,
      state.jobs.activeTask
        ? "Observe the active settlement, then choose the next workload."
        : "Queue 1 selected workload; Queue 10 remains an explicit batching choice.",
    ),
  });
}

export function presentCareerDecision(
  state: SimulationState,
  draftHours: number,
  projection: CareerEveningProjection,
  runBlocked: boolean,
): EditorialDecision {
  const route = projection.routes.find((item) => item.hours > 0);
  const routeName = route
    ? bedroomCareerRoutes.find((item) => item.id === route.route)?.name
    : null;
  return decision("Career", {
    currentState: `Night ${state.career.schedule.day}: ${draftHours.toFixed(2)}h of 4.00h is drafted${routeName ? ` toward ${routeName}` : ""}.`,
    consequence: route
      ? `${routeName} forecasts ${route.economicNet >= 0 ? "cash" : "pressure"}; the Worker commits all four route allocations together.`
      : "Unallocated evening time creates no income or progress.",
    costOrRisk: `Cost / risk: ${projection.constraint}${runBlocked ? " The previous submission remains locked until durable acknowledgement." : ""}`,
    nextAction: runBlocked
      ? "Keep the draft; wait for durable acknowledgement or recovery guidance."
      : draftHours > 0
        ? "Review the estimate, then Run scheduled evening once."
        : "Allocate at least 0.25h to one route, then review its estimate.",
  });
}

export function presentUpgradesDecision(
  state: SimulationState,
  recommendedName: string | null,
  recommendedCost: number | null,
  placementPending: boolean,
): EditorialDecision {
  const rig = getHardware(state.hardwareId);
  const target = recommendedName
    ? `${recommendedName}${recommendedCost === null ? "" : ` at ${money(recommendedCost)}`}`
    : "the next affordable owned-compatible item";
  return decision("Upgrades", {
    currentState: `The current ledger balance is available; ${rig.name} is equipped.`,
    consequence: `Buying creates ownership; equipping or placing changes capacity, cost, and reliability rather than granting a free universal improvement.`,
    costOrRisk: `Cost / risk: ${target} is compared against ${rig.name}; exact deltas remain in Details.${placementPending ? " Placement is pending and has not installed anything." : ""}`,
    nextAction: placementPending
      ? "Open Build and choose one highlighted compatible position."
      : recommendedName
        ? `Compare ${target}, then buy or place it explicitly.`
        : "Choose one owned or affordable item to compare.",
  });
}

export function presentInspectDecision(
  state: SimulationState,
): EditorialDecision {
  const divergence = Math.abs(
    state.metrics.predictedQuality - state.metrics.observedQuality,
  );
  return decision("Inspect", {
    currentState: `Bottleneck: ${state.metrics.dominantBottleneck}; evidence is ${Math.round(state.metrics.observability * 100)}% observable.`,
    consequence: `Predicted / observed quality diverges by ${divergence.toFixed(2)}; baseline deltas make the next configuration comparison legible.`,
    costOrRisk: `Risk: ${state.lastWarning} Causal evidence distinguishes direct causes from contributors and unknowns.`,
    nextAction: state.baselineMetrics
      ? "Inspect the latest causal event, then change one configuration variable."
      : "Capture a baseline before changing the configuration.",
  });
}

export function presentResearchDecision(
  state: SimulationState,
): EditorialDecision {
  const recognized = state.research.frontier.discoveredProjectIds.length > 0;
  const active = state.research.activeProject;
  const visible = researchProjects.filter((project) =>
    state.research.frontier.discoveredProjectIds.includes(project.id),
  );
  const nextProject = visible.find(
    (project) =>
      !state.research.frontier.inspectedProjectIds.includes(project.id) &&
      researchProjectRequirements(project, state.research, {
        seed: state.seed,
        jobsCompleted: state.jobs.completed,
        reputation: state.resources.reputation,
        privateCoverage: state.career.evaluation.coverage,
        competitionSubmissions: state.career.competition.submissions,
        productReleased: state.career.product.released,
      }).unlocked,
  );
  return decision("Research", {
    currentState: !recognized
      ? "The frontier is not recognized; no project can be inspected yet."
      : active
        ? `${active.projectId} is measuring at ${active.elapsedHours.toFixed(2)}h.`
        : state.research.goal
          ? "A player-authored research goal is saved and ready for inspection."
          : "A research goal is required before an experiment can start.",
    consequence: active
      ? "The active experiment consumes bounded compute and may succeed, fail usefully, or reveal a narrower question."
      : "Evidence inspection narrows uncertainty and can reveal the next strategic option; failure retains reusable knowledge.",
    costOrRisk: active
      ? "Cost / risk: measurement duration and committed cost remain live in the project record."
      : "Cost / risk: project ranges, expertise, prerequisites, and failed-work reuse stay visible before commitment.",
    nextAction: !recognized
      ? "Complete one accepted delivery to unlock the first research question."
      : active
        ? "Keep the team intact until measurement completes."
        : !state.research.goal
          ? "Save one player-authored research goal."
          : nextProject
            ? `Inspect evidence for ${nextProject.name}.`
            : "Inspect an unlocked question, then start one bounded project.",
  });
}

export function presentLaboratoryDecision(
  state: SimulationState,
): EditorialDecision {
  const lab = state.laboratory;
  const readiness = laboratoryPipelineReadiness(lab);
  const active = lab.pipelines.find((pipeline) => pipeline.activeRun);
  const freeMachine = laboratoryMachines.find(
    (machine) =>
      !lab.machines.some((owned) => owned.id === machine.id) &&
      state.resources.money >= machine.purchaseCost,
  );
  const nextPipeline = laboratoryPipelines.find(
    (pipeline) => !lab.pipelines.some((owned) => owned.id === pipeline.id),
  );
  return decision("Lab", {
    currentState: !lab.unlocked
      ? "The laboratory bench is locked."
      : active
        ? `${active.id} is active; ${lab.machines.length} machines and ${lab.pipelines.length} pipelines are retained.`
        : `${lab.machines.length}/4 machines and ${lab.pipelines.length}/3 pipelines are available.`,
    consequence: lab.unlocked
      ? `Reproducibility is ${Math.round(lab.reproducibility.score * 100)}%; founding readiness is ${readiness.ready ? "available" : "not yet available"}.`
      : "The locked bench preserves prior Research, World, exit, and deadline evidence; no purchase is consumed.",
    costOrRisk: lab.unlocked
      ? `Cost / risk: queued runs and machine/pipeline purchases deduct once; ${readiness.reasons[0] ?? "selected founding evidence remains visible"}.`
      : "Requirement / progress: complete the listed exit, Research, recognition, and deadline evidence to unlock the lab.",
    nextAction: !lab.unlocked
      ? "Complete the first unmet requirement listed above."
      : active
        ? "Observe the active run and retain its evidence through reload."
        : freeMachine
          ? `Acquire ${freeMachine.name}, then assign a free machine to one pipeline.`
          : nextPipeline
            ? `Add ${nextPipeline.name} when its cost and machine capacity are ready.`
            : readiness.ready
              ? "Choose one founding route after reviewing the readiness evidence."
              : "Resolve the first unmet founding requirement.",
  });
}

export function presentWorldDecision(
  state: SimulationState,
): EditorialDecision {
  const world = state.hypeFear;
  const narrative = world.activeNarrativeId
    ? world.narratives.find((item) => item.id === world.activeNarrativeId)
    : undefined;
  const pending = world.pendingResponse !== null;
  return decision("World", {
    currentState: !world.unlocked
      ? "Public pressure is not recognized yet."
      : pending
        ? "A resolved narrative is waiting for your stakeholder response."
        : narrative
          ? `${narrative.kind === "hype" ? "Hype" : "Fear"} narrative: ${narrative.status}.`
          : "No active narrative; audience standing remains durable.",
    consequence: `Attention ${world.attention.toFixed(1)}/100; expectation debt ${Math.round(world.expectationDebt * 100)}% and fear ${Math.round(world.fear * 100)}% shape who remains involved.`,
    costOrRisk: `Risk: tool-switching panic is ${Math.round(world.toolSwitchingPanic * 100)}%; supported evidence ranges are not capability guarantees.`,
    nextAction: !world.unlocked
      ? "Complete one accepted delivery or build reputation to meet the first audience."
      : pending
        ? "Choose one response; it changes stakeholder selection and expectation debt."
        : narrative?.status === "available"
          ? "Choose a creator whose access and audience fit the claim."
          : narrative?.status === "awaiting-prediction"
            ? "Publish one explicit prediction before the countdown resolves."
            : narrative
              ? "Observe the countdown and keep the evidence range visible."
              : "Review audience standing and the next available narrative.",
  });
}
