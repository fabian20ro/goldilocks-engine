import { useState, type FormEvent } from "react";
import {
  findResearchProject,
  findResearcher,
  researchProjects,
} from "../simulation/researchCatalog";
import {
  researchEstimate,
  researchProjectRequirements,
  researchRecognition,
  researchTeamProfile,
} from "../simulation/research";
import type {
  ResearchProjectSpec,
  SimulationCommand,
  SimulationState,
} from "../simulation/types";

interface ResearchViewProps {
  state: SimulationState;
  command: (command: SimulationCommand) => unknown;
}

const formatRange = (range: { min: number; max: number }, suffix = "") =>
  `${range.min.toFixed(2)}–${range.max.toFixed(2)}${suffix}`;

function contextFor(state: SimulationState) {
  return {
    seed: state.seed,
    jobsCompleted: state.jobs.completed,
    reputation: state.resources.reputation,
    privateCoverage: state.career.evaluation.coverage,
    competitionSubmissions: state.career.competition.submissions,
    productReleased: state.career.product.released,
  };
}

function ProjectCard({
  project,
  state,
  command,
}: {
  project: ResearchProjectSpec;
  state: SimulationState;
  command: (command: SimulationCommand) => unknown;
}) {
  const context = contextFor(state);
  const requirements = researchProjectRequirements(
    project,
    state.research,
    context,
  );
  const inspected = state.research.frontier.inspectedProjectIds.includes(
    project.id,
  );
  const completed = state.research.frontier.completedProjectIds.includes(
    project.id,
  );
  const estimate = researchEstimate(project, state.research);
  return (
    <article
      className="research-project-card"
      data-testid={`research-project-${project.id}`}
    >
      <div className="research-card-heading">
        <div>
          <span className="eyebrow">
            {completed
              ? "Measured"
              : inspected
                ? "Evidence inspected"
                : "Uncertain question"}
          </span>
          <h3>{project.name}</h3>
        </div>
        <span className="research-fit">{project.strategicFit[0]}</span>
      </div>
      <p className="research-question">{project.question}</p>
      <p>{project.hypothesis}</p>
      <p className="research-evidence">
        <strong>Current evidence:</strong> {project.currentEvidence}
      </p>
      <p className="research-evidence">
        <strong>Required expertise:</strong>{" "}
        {project.requiredExpertise.join(" · ")}
      </p>
      <dl className="research-range-grid">
        <div>
          <dt>Duration range</dt>
          <dd>{formatRange(project.durationRange, "h")}</dd>
        </div>
        <div>
          <dt>Cost range</dt>
          <dd>{formatRange(project.costRange, " cash")}</dd>
        </div>
        <div>
          <dt>Usefulness range</dt>
          <dd>{formatRange(project.usefulnessRange)}</dd>
        </div>
        <div>
          <dt>Uncertainty</dt>
          <dd>{project.uncertainty}</dd>
        </div>
      </dl>
      <p className="research-strategy">
        <strong>Strategic fit:</strong> {project.strategicFit.join(" · ")}
      </p>
      <p className="research-strategy">
        <strong>Failed-work reuse:</strong> {project.failedWorkValue}
      </p>
      <ul
        className="research-requirements"
        aria-label={`${project.name} prerequisites`}
      >
        {requirements.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
      <div className="research-card-actions">
        {!inspected ? (
          <button
            type="button"
            className="text-action"
            disabled={!requirements.unlocked}
            onClick={() =>
              command({
                type: "INSPECT_RESEARCH_PROJECT",
                projectId: project.id,
              })
            }
          >
            Inspect evidence for {project.name}
          </button>
        ) : null}
        {inspected && !completed ? (
          <button
            type="button"
            className="primary-action"
            disabled={
              Boolean(state.research.activeProject) ||
              !state.research.goal ||
              state.research.teamMemberIds.length === 0 ||
              !requirements.unlocked
            }
            onClick={() =>
              command({ type: "START_RESEARCH", projectId: project.id })
            }
          >
            Start {project.name} · ~{estimate.durationHours.toFixed(2)}h / $
            {estimate.cost.toFixed(3)}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ResearchView({ state, command }: ResearchViewProps) {
  const [goalDraft, setGoalDraft] = useState(state.research.goal?.text ?? "");
  const recognized = researchRecognition(contextFor(state));
  const team = researchTeamProfile(state.research.teamMemberIds);
  const visibleProjects = researchProjects.filter((project) =>
    state.research.frontier.discoveredProjectIds.includes(project.id),
  );
  const submitGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    command({ type: "SET_RESEARCH_GOAL", text: goalDraft });
  };

  return (
    <>
      <section className="panel research-hero" aria-labelledby="research-title">
        <span className="eyebrow">Milestone 4 · evidence before certainty</span>
        <h2 id="research-title">Research console</h2>
        <p>
          The frontier is partly hidden. Inspect evidence, assemble people with
          complementary strengths, and spend one bounded experiment at a time. A
          failure can still improve the next decision.
        </p>
        {!recognized ? (
          <div className="research-locked" role="status">
            <strong>Research is not recognized yet.</strong>
            <span>
              Complete one accepted delivery to open the first question.
            </span>
          </div>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="research-goal-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Player-authored direction</span>
            <h2 id="research-goal-title">Short research goal</h2>
          </div>
          <span className="choice-stat">
            {state.research.goal ? "PENDING DECISION" : "REQUIRED"}
          </span>
        </div>
        <form className="research-goal-form" onSubmit={submitGoal}>
          <label htmlFor="research-goal">
            What should this team learn next?
          </label>
          <textarea
            id="research-goal"
            aria-label="Research goal"
            value={goalDraft}
            maxLength={120}
            minLength={8}
            onChange={(event) => setGoalDraft(event.target.value)}
            placeholder="e.g. Find the smallest evidence that makes delivery safer"
            disabled={!recognized}
          />
          <div className="research-goal-actions">
            <small>
              {goalDraft.length}/120 · preserved locally with the simulation
            </small>
            <button
              type="submit"
              className="primary-action"
              disabled={!recognized || goalDraft.trim().length < 8}
            >
              Save research goal
            </button>
          </div>
        </form>
        <p className="pending-decision">
          <strong>Pending decision:</strong> {state.research.pendingDecision}
        </p>
      </section>

      {state.research.activeProject ? (
        <section
          className="panel research-active"
          aria-labelledby="active-research-title"
        >
          <span className="eyebrow">Measurement in progress</span>
          <h2 id="active-research-title">
            {findResearchProject(state.research.activeProject.projectId)
              ?.name ?? "Research project"}
          </h2>
          <progress
            max={state.research.activeProject.expectedDurationHours}
            value={state.research.activeProject.elapsedHours}
          />
          <p>
            {state.research.activeProject.elapsedHours.toFixed(2)} /{" "}
            {state.research.activeProject.expectedDurationHours.toFixed(2)}{" "}
            simulated hours. Keep the team intact until measurement completes.
          </p>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="research-frontier-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Question-dependent frontier</span>
            <h2 id="research-frontier-title">Open questions</h2>
          </div>
          <span className="choice-stat">{visibleProjects.length} visible</span>
        </div>
        <div className="research-project-list">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              state={state}
              command={command}
            />
          ))}
        </div>
        <p className="research-frontier-note">
          More questions appear only when evidence, prerequisites, or useful
          failures justify them. No omniscient project list.
        </p>
      </section>

      <section className="panel" aria-labelledby="research-team-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">People are processors</span>
            <h2 id="research-team-title">Research team</h2>
          </div>
          <span className="choice-stat">
            Chemistry {team.chemistry.toFixed(2)}
          </span>
        </div>
        <p className="research-team-summary">
          Execution {team.execution.toFixed(2)} · depth {team.depth.toFixed(2)}{" "}
          · mentorship {team.mentorship.toFixed(2)} · integrity{" "}
          {team.integrity.toFixed(2)}
        </p>
        <label className="research-compute-control" htmlFor="research-compute">
          <span>
            <strong>Research compute allocation</strong>
            <small>
              {state.research.computeAllocation}% · more effort shortens
              measurement but consumes scarce compute.
            </small>
          </span>
          <input
            id="research-compute"
            aria-label="Research compute allocation"
            type="range"
            min={25}
            max={100}
            step={5}
            value={state.research.computeAllocation}
            onChange={(event) =>
              command({
                type: "SET_RESEARCH_COMPUTE_ALLOCATION",
                percent: Number(event.target.value),
              })
            }
          />
        </label>
        <div className="researcher-list">
          {state.research.availableResearcherIds.map((id) => {
            const researcher = findResearcher(id);
            if (!researcher) return null;
            return (
              <article className="researcher-card" key={id}>
                <span className="eyebrow">
                  {researcher.legendary ? "Legendary" : researcher.archetype}
                </span>
                <h3>{researcher.name}</h3>
                <p>{researcher.description}</p>
                <small>
                  Traits: depth {researcher.traits.depth.toFixed(2)} · taste{" "}
                  {researcher.traits.taste.toFixed(2)} · execution{" "}
                  {researcher.traits.execution.toFixed(2)} · mentorship{" "}
                  {researcher.traits.mentorship.toFixed(2)}
                </small>
                {researcher.signatureAction ? (
                  <small>Signature action: {researcher.signatureAction}</small>
                ) : null}
                <button
                  type="button"
                  className="text-action"
                  disabled={
                    !recognized ||
                    state.resources.money < researcher.recruitCost ||
                    state.resources.reputation < researcher.minimumReputation
                  }
                  onClick={() =>
                    command({
                      type: "RECRUIT_RESEARCHER",
                      researcherId: researcher.id,
                    })
                  }
                >
                  Recruit {researcher.name} · $
                  {researcher.recruitCost.toFixed(3)}
                </button>
              </article>
            );
          })}
          {state.research.recruitedResearcherIds.map((id) => {
            const researcher = findResearcher(id);
            if (!researcher) return null;
            const onTeam = state.research.teamMemberIds.includes(id);
            return (
              <article
                className={`researcher-card ${onTeam ? "on-team" : ""}`}
                key={id}
              >
                <span className="eyebrow">
                  {onTeam ? "On team" : "Recruited"}
                </span>
                <h3>{researcher.name}</h3>
                <p>{researcher.description}</p>
                <div className="researcher-actions">
                  <button
                    type="button"
                    className="text-action"
                    disabled={
                      !onTeam && state.research.teamMemberIds.length >= 3
                    }
                    onClick={() =>
                      command({
                        type: "SET_RESEARCH_TEAM",
                        researcherIds: onTeam
                          ? state.research.teamMemberIds.filter(
                              (memberId) => memberId !== id,
                            )
                          : [...state.research.teamMemberIds, id],
                      })
                    }
                  >
                    {onTeam
                      ? `Remove ${researcher.name} from team`
                      : `Add ${researcher.name} to research team`}
                  </button>
                  <button
                    type="button"
                    className="quiet-action"
                    onClick={() =>
                      command({ type: "RELEASE_RESEARCHER", researcherId: id })
                    }
                  >
                    Release
                  </button>
                </div>
                {researcher.signatureAction && onTeam ? (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() =>
                      command({ type: "FIRST_PRINCIPLES_RECONSTRUCTION" })
                    }
                  >
                    Use {researcher.signatureAction}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
        {state.research.recruitedResearcherIds.length === 0 ? (
          <p className="empty-state">
            Recruit one researcher to turn an inspected question into a runnable
            experiment.
          </p>
        ) : null}
        <p className="research-knowledge">
          Institutional knowledge{" "}
          {state.research.institutionalKnowledge.toFixed(2)} · retained
          knowledge {state.research.retainedKnowledge.toFixed(2)} · team tacit
          knowledge survives through documentation and mentorship.
        </p>
      </section>

      {state.research.lastOutcome ? (
        <section
          className="panel research-outcome"
          aria-labelledby="research-outcome-title"
        >
          <span className="eyebrow">Latest measurement</span>
          <h2 id="research-outcome-title">
            {state.research.lastOutcome.title}
          </h2>
          <p>{state.research.lastOutcome.summary}</p>
          <p>
            <strong>Outcome:</strong>{" "}
            {state.research.lastOutcome.kind.replaceAll("-", " ")} · usefulness{" "}
            {state.research.lastOutcome.usefulness.toFixed(2)} · knowledge +
            {state.research.lastOutcome.knowledgeGained.toFixed(2)}
          </p>
          <p>
            Failed paths and partial results remain in the frontier as evidence,
            not as wasted points.
          </p>
        </section>
      ) : null}
    </>
  );
}
