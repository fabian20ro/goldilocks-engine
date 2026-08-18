import {
  findLaboratoryMachine,
  findLaboratoryPipeline,
  findLaboratoryScenario,
  laboratoryCultures,
  laboratoryMachines,
  laboratoryPipelines,
  laboratoryScenarios,
} from "../simulation/laboratoryCatalog";
import { laboratoryPipelineReadiness } from "../simulation/laboratory";
import { findResearcher } from "../simulation/researchCatalog";
import type { SimulationCommand, SimulationState } from "../simulation/types";
import { DecisionSummary, LockedState } from "./commandDeck";
import { presentLaboratoryDecision } from "./editorial";

interface LaboratoryViewProps {
  state: SimulationState;
  command: (command: SimulationCommand) => unknown;
}

const money = (amount: number) => `$${amount.toFixed(3)}`;

function Meter({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="laboratory-meter">
      <div className="laboratory-meter-label">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <progress
        max={1}
        value={Math.min(1, Math.max(0, value))}
        aria-label={label}
      />
    </div>
  );
}

export function LaboratoryView({ state, command }: LaboratoryViewProps) {
  const lab = state.laboratory;
  const readiness = laboratoryPipelineReadiness(lab);
  const activeScenario = findLaboratoryScenario(lab.scenarioId);
  const recruited = state.research.recruitedResearcherIds
    .map((id) => findResearcher(id))
    .filter(
      (researcher): researcher is NonNullable<typeof researcher> =>
        researcher !== undefined,
    );

  return (
    <>
      <section
        className="panel laboratory-hero"
        aria-labelledby="laboratory-title"
      >
        <span className="eyebrow">Milestone 6 · local evidence at scale</span>
        <h2 id="laboratory-title">Local Laboratory</h2>
        <p>
          Turn retained Research and Hype/Fear evidence into a small, legible
          laboratory. Parallel capacity is purchased deliberately; failures,
          seeds, configurations, and collaborators stay inspectable.
        </p>
        {!lab.unlocked ? (
          <div className="laboratory-locked" role="status">
            <LockedState
              requirement="Bedroom exit + one Research question + First Recognition + one resolved Hype/Fear deadline."
              progress={`${state.career.exitAchieved ? 1 : 0}/1 exit · ${Math.min(1, state.research.frontier.completedProjectIds.length)}/1 research · ${state.hypeFear.unlocked ? 1 : 0}/1 recognition · ${state.hypeFear.lastResponse ? 1 : 0}/1 deadline`}
              nextAction="Complete the first unmet requirement listed here; no lab purchase or founding action is available while locked."
            />
          </div>
        ) : (
          <div className="laboratory-status" role="status">
            <strong>{activeScenario?.name ?? "Local scenario"}</strong>
            <span>{activeScenario?.description}</span>
            <small>{lab.pendingDecision}</small>
          </div>
        )}
        <DecisionSummary decision={presentLaboratoryDecision(state)} />
      </section>

      {lab.unlocked ? (
        <>
          <section className="panel" aria-labelledby="laboratory-rail-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Visible capacity</span>
                <h2 id="laboratory-rail-title">The lab rail</h2>
              </div>
              <span className="choice-stat">
                {lab.machines.length} machines · {lab.pipelines.length}{" "}
                pipelines
              </span>
            </div>
            <div className="laboratory-meter-grid">
              <Meter
                label="Reproducibility"
                value={lab.reproducibility.score}
                detail={`${Math.round(lab.reproducibility.score * 100)}%`}
              />
              <Meter
                label="Scenario progress"
                value={lab.scenarioProgress[lab.scenarioId] ?? 0}
                detail={`${Math.round((lab.scenarioProgress[lab.scenarioId] ?? 0) * 100)}%`}
              />
              <Meter
                label="Collaborator continuity"
                value={Math.min(1, lab.collaboratorIds.length / 2)}
                detail={`${lab.collaboratorIds.length} retained`}
              />
            </div>
            <p className="laboratory-accounting">
              Lab reserve committed:{" "}
              <strong>{money(lab.totalOperatingCost)}</strong> · liquid cash:{" "}
              <strong>{money(state.resources.money)}</strong>. Purchases and
              queued runs deduct exactly once before work starts.
            </p>
          </section>

          <section className="panel" aria-labelledby="laboratory-machine-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Capital, heat, and evidence</span>
                <h2 id="laboratory-machine-title">Machines</h2>
              </div>
              <span className="choice-stat">{lab.machines.length}/4 owned</span>
            </div>
            <div className="laboratory-card-grid">
              {laboratoryMachines.map((machine) => {
                const owned = lab.machines.some(
                  (item) => item.id === machine.id,
                );
                return (
                  <article
                    className={`laboratory-card ${owned ? "is-owned" : ""}`}
                    key={machine.id}
                  >
                    <span className="eyebrow">
                      {owned ? "Owned" : "Available"}
                    </span>
                    <h3>{machine.name}</h3>
                    <p>{machine.description}</p>
                    <small>
                      Compute {machine.compute.toFixed(1)} · memory{" "}
                      {machine.memory} GB · reliability{" "}
                      {Math.round(machine.reliability * 100)}% · electricity{" "}
                      {machine.electricityCost.toFixed(3)}/h
                    </small>
                    <button
                      type="button"
                      className={owned ? "quiet-action" : "primary-action"}
                      disabled={
                        owned || state.resources.money < machine.purchaseCost
                      }
                      onClick={() =>
                        command({
                          type: "BUY_LAB_MACHINE",
                          machineId: machine.id,
                        })
                      }
                    >
                      {owned
                        ? "In inventory"
                        : `Acquire ${machine.name} · ${money(machine.purchaseCost)}`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="panel"
            aria-labelledby="laboratory-pipeline-title"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  One reference rail, then parallel choices
                </span>
                <h2 id="laboratory-pipeline-title">Pipelines</h2>
              </div>
              <span className="choice-stat">
                {lab.pipelines.reduce(
                  (sum, pipeline) => sum + pipeline.completedRuns,
                  0,
                )}{" "}
                complete
              </span>
            </div>
            <div className="laboratory-card-grid">
              {lab.pipelines.map((pipeline) => {
                const spec = findLaboratoryPipeline(pipeline.id);
                const duration = spec?.baseDurationHours ?? 0;
                return (
                  <article className="laboratory-card" key={pipeline.id}>
                    <span className="eyebrow">
                      {spec?.purpose ?? "bounded run"}
                    </span>
                    <h3>{spec?.name ?? pipeline.id}</h3>
                    <p>{spec?.description}</p>
                    <small>
                      Machines:{" "}
                      {pipeline.machineIds
                        .map((id) => findLaboratoryMachine(id)?.name ?? id)
                        .join(" · ") || "none assigned"}{" "}
                      · queue {pipeline.waitingRuns} · {pipeline.completedRuns}{" "}
                      passed / {pipeline.failedRuns} failed
                    </small>
                    {pipeline.activeRun ? (
                      <progress
                        max={pipeline.activeRun.expectedDurationHours}
                        value={pipeline.activeRun.elapsedHours}
                        aria-label={`${spec?.name ?? pipeline.id} progress`}
                      />
                    ) : null}
                    <div className="laboratory-card-actions">
                      <button
                        type="button"
                        className="primary-action"
                        disabled={
                          pipeline.machineIds.length === 0 ||
                          state.resources.money < (spec?.baseCost ?? 1)
                        }
                        onClick={() =>
                          command({
                            type: "QUEUE_LAB_RUN",
                            pipelineId: pipeline.id,
                          })
                        }
                      >
                        Queue bounded run · ~{duration.toFixed(2)}h
                      </button>
                      {lab.machines
                        .filter(
                          (machine) =>
                            !pipeline.machineIds.includes(machine.id) &&
                            !lab.pipelines.some(
                              (other) =>
                                other.id !== pipeline.id &&
                                other.machineIds.includes(machine.id),
                            ),
                        )
                        .map((machine) => (
                          <button
                            type="button"
                            className="text-action"
                            key={machine.id}
                            onClick={() =>
                              command({
                                type: "ASSIGN_LAB_MACHINE",
                                pipelineId: pipeline.id,
                                machineId: machine.id,
                              })
                            }
                          >
                            Assign {machine.id}
                          </button>
                        ))}
                      {pipeline.machineIds.length === 0 &&
                      !lab.machines.some(
                        (machine) =>
                          !lab.pipelines.some(
                            (other) =>
                              other.id !== pipeline.id &&
                              other.machineIds.includes(machine.id),
                          ),
                      ) ? (
                        <small>
                          No free machine. Acquire another machine before
                          queueing this pipeline.
                        </small>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {laboratoryPipelines
                .filter(
                  (spec) =>
                    !lab.pipelines.some((pipeline) => pipeline.id === spec.id),
                )
                .map((spec) => (
                  <article
                    className="laboratory-card laboratory-card-add"
                    key={spec.id}
                  >
                    <span className="eyebrow">Next route</span>
                    <h3>{spec.name}</h3>
                    <p>{spec.description}</p>
                    <button
                      type="button"
                      className="text-action"
                      disabled={
                        state.resources.money < spec.baseCost * 10 ||
                        lab.pipelines.length >= 3
                      }
                      onClick={() =>
                        command({
                          type: "ADD_LAB_PIPELINE",
                          pipelineId: spec.id,
                        })
                      }
                    >
                      Add pipeline · {money(spec.baseCost * 10)}
                    </button>
                  </article>
                ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="laboratory-people-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Research becomes a team practice
                </span>
                <h2 id="laboratory-people-title">Collaborators</h2>
              </div>
              <span className="choice-stat">
                {lab.collaboratorIds.length} retained
              </span>
            </div>
            <p>
              Only recruited Research people can join. Retained knowledge is a
              prerequisite, not an automatic staffing bonus. Research retained
              knowledge: {state.research.retainedKnowledge.toFixed(2)}.
            </p>
            <div className="laboratory-card-grid">
              {recruited.map((researcher) => {
                const joined = lab.collaboratorIds.includes(researcher.id);
                return (
                  <article
                    className={`laboratory-card ${joined ? "is-owned" : ""}`}
                    key={researcher.id}
                  >
                    <span className="eyebrow">
                      {joined ? "Collaborator" : "Research roster"}
                    </span>
                    <h3>{researcher.name}</h3>
                    <p>
                      {researcher.archetype} · {researcher.description}
                    </p>
                    <button
                      type="button"
                      className={joined ? "quiet-action" : "text-action"}
                      disabled={joined}
                      onClick={() =>
                        command({
                          type: "INVITE_LAB_COLLABORATOR",
                          researcherId: researcher.id,
                        })
                      }
                    >
                      {joined ? "Retained in lab" : `Invite ${researcher.name}`}
                    </button>
                  </article>
                );
              })}
            </div>
            {recruited.length === 0 ? (
              <p className="empty-state">
                Recruit and retain one Researcher before asking for
                collaboration.
              </p>
            ) : null}
          </section>

          <section
            className="panel"
            aria-labelledby="laboratory-evidence-title"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Reproducibility is a sequence of choices
                </span>
                <h2 id="laboratory-evidence-title">Method and culture</h2>
              </div>
              <span className="choice-stat">
                {lab.reproducibility.documentedRuns} documented
              </span>
            </div>
            <div className="laboratory-toggle-list">
              {(
                [
                  "versionedConfigs",
                  "lockedSeeds",
                  "independentEvaluation",
                ] as const
              ).map((field) => (
                <label className="laboratory-toggle" key={field}>
                  <input
                    type="checkbox"
                    checked={lab.reproducibility[field]}
                    onChange={(event) =>
                      command({
                        type: "SET_LAB_REPRODUCIBILITY",
                        field,
                        enabled: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>
                      {field === "versionedConfigs"
                        ? "Versioned configurations"
                        : field === "lockedSeeds"
                          ? "Locked seeds"
                          : "Independent evaluation"}
                    </strong>
                    <small>
                      {lab.reproducibility[field]
                        ? "Recorded in the method trail."
                        : "Not yet part of the claim."}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="text-action"
              onClick={() => command({ type: "DOCUMENT_LAB_RUN" })}
            >
              Document the current method
            </button>
            <div
              className="laboratory-culture-list"
              role="list"
              aria-label="Laboratory cultures"
            >
              {laboratoryCultures.map((culture) => (
                <button
                  type="button"
                  className={`laboratory-culture ${lab.cultureId === culture.id ? "selected" : ""}`}
                  key={culture.id}
                  aria-pressed={lab.cultureId === culture.id}
                  onClick={() =>
                    command({ type: "SET_LAB_CULTURE", cultureId: culture.id })
                  }
                >
                  <strong>{culture.name}</strong>
                  <span>{culture.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section
            className="panel"
            aria-labelledby="laboratory-scenario-title"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  Replay variation, retained evidence
                </span>
                <h2 id="laboratory-scenario-title">Scenario ledger</h2>
              </div>
              <span className="choice-stat">
                {lab.scenarioUnlockIds.length} unlocked
              </span>
            </div>
            <div className="laboratory-scenario-list">
              {laboratoryScenarios.map((scenario) => {
                const unlocked = lab.scenarioUnlockIds.includes(scenario.id);
                return (
                  <button
                    type="button"
                    className={`laboratory-scenario ${lab.scenarioId === scenario.id ? "selected" : ""}`}
                    key={scenario.id}
                    disabled={!unlocked}
                    aria-pressed={lab.scenarioId === scenario.id}
                    onClick={() =>
                      command({
                        type: "SELECT_LAB_SCENARIO",
                        scenarioId: scenario.id,
                      })
                    }
                  >
                    <strong>
                      {unlocked ? scenario.name : "Locked scenario"}
                    </strong>
                    <span>
                      {unlocked ? scenario.description : scenario.unlock}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className="panel laboratory-founding"
            aria-labelledby="laboratory-founding-title"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">Endgame transition</span>
                <h2 id="laboratory-founding-title">
                  Choose what the lab becomes
                </h2>
              </div>
              <span className={`choice-stat ${readiness.ready ? "ready" : ""}`}>
                {!readiness.ready
                  ? "BUILD EVIDENCE"
                  : readiness.credible
                    ? "READY"
                    : "READY WITH RISKS"}
              </span>
            </div>
            <ul
              className="laboratory-readiness"
              aria-label="Laboratory founding requirements"
            >
              {readiness.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
              {readiness.ready && readiness.credible ? (
                <li>
                  All founding requirements are met; the selected route will
                  close this run with an evidence-backed postmortem.
                </li>
              ) : null}
              {readiness.ready && !readiness.credible ? (
                <li>
                  The core transition is available, but the missing evidence
                  will shape the selected ending.
                </li>
              ) : null}
            </ul>
            <div className="laboratory-founding-actions">
              {(
                [
                  [
                    "independent-laboratory",
                    "Independent laboratory",
                    "Keep the method small, direct, and locally accountable.",
                  ],
                  [
                    "open-research-collective",
                    "Open research collective",
                    "Teach the method outward; collaboration can multiply both care and coordination.",
                  ],
                  [
                    "larger-organization-collaboration",
                    "Larger organization collaboration",
                    "Trade reach for negotiation pressure; fear and tool panic remain visible.",
                  ],
                ] as const
              ).map(([decision, title, description]) => (
                <button
                  type="button"
                  className="laboratory-decision"
                  key={decision}
                  disabled={!readiness.ready}
                  onClick={() => command({ type: "FOUND_LAB", decision })}
                >
                  <strong>{title}</strong>
                  <span>{description}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
