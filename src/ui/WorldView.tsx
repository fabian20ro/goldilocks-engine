import {
  audienceLabels,
  findCreator,
  toolOptions,
} from "../simulation/hypeFearCatalog";
import type {
  FearResponseId,
  NarrativeInstance,
  NarrativePrediction,
  NarrativeResponseId,
  SimulationCommand,
  SimulationState,
} from "../simulation/types";
import { StatusGauge } from "./commandDeck";

interface WorldViewProps {
  state: SimulationState;
  command: (command: SimulationCommand) => unknown;
}

const predictionChoices: readonly {
  id: NarrativePrediction;
  label: string;
  confidence: number;
}[] = [
  { id: "lands", label: "Predict it lands", confidence: 0.65 },
  { id: "partial", label: "Predict a narrower result", confidence: 0.5 },
  { id: "delayed", label: "Predict a delay", confidence: 0.35 },
];

const hypeResponses: readonly {
  id: NarrativeResponseId;
  label: string;
  detail: string;
}[] = [
  {
    id: "publish-evidence",
    label: "Publish supported evidence",
    detail: "Lower expectation debt; grow patient partners.",
  },
  {
    id: "acknowledge-uncertainty",
    label: "Acknowledge uncertainty",
    detail: "Make the confidence range legible to cautious reviewers.",
  },
  {
    id: "double-down",
    label: "Double down",
    detail: "Keep attention while selecting escalation-seeking stakeholders.",
  },
  {
    id: "go-quiet",
    label: "Go quiet",
    detail: "Reduce pressure and reach; momentum audiences remember the pause.",
  },
];

const fearResponses: readonly {
  id: FearResponseId;
  label: string;
  detail: string;
}[] = [
  {
    id: "stabilize",
    label: "Stabilize the system",
    detail: "Reduce fear and tool-switching panic through continuity.",
  },
  {
    id: "publish-boundaries",
    label: "Publish boundaries",
    detail: "Give researchers and customers a supported workload boundary.",
  },
  {
    id: "pause-and-measure",
    label: "Pause and measure",
    detail: "Keep uncertainty visible while evidence catches up.",
  },
  {
    id: "switch-tool",
    label: "Switch tool in response",
    detail: "Relieve urgency now; create durable continuity panic.",
  },
];

function simulatedHoursUntil(state: SimulationState, tick: number): number {
  return Math.max(0, ((tick - state.tick) * 70) / 3_600_000);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function NarrativeDetails({ narrative }: { narrative: NarrativeInstance }) {
  const source = findCreator(narrative.sourceArchetypeId);
  return (
    <>
      <p className="world-narrative-claim">{narrative.claim}</p>
      <p className="world-narrative-source">
        <strong>{source?.name ?? "Original creator"}</strong> · {source?.label}
        {source ? ` · ${source.usefulness}` : null}
      </p>
      <dl className="world-fact-grid">
        <div>
          <dt>Target audiences</dt>
          <dd>
            {narrative.targetAudiences
              .map((id) => audienceLabels[id])
              .join(" · ")}
          </dd>
        </div>
        <div>
          <dt>Evidence strength</dt>
          <dd>
            {formatPercent(narrative.evidenceStrength)} · bounded estimate
          </dd>
        </div>
        <div>
          <dt>Beneficiaries</dt>
          <dd>{narrative.beneficiaries.join(" · ")}</dd>
        </div>
        <div>
          <dt>Counterevidence</dt>
          <dd>{narrative.counterevidence.join(" ")}</dd>
        </div>
        <div>
          <dt>Active effects</dt>
          <dd>{narrative.activeEffects.join(" ")}</dd>
        </div>
        <div>
          <dt>Resolution rules</dt>
          <dd>{narrative.resolutionRules.join(" ")}</dd>
        </div>
      </dl>
    </>
  );
}

function ResponsePanel({
  narrative,
  command,
}: {
  narrative: NarrativeInstance;
  command: (command: SimulationCommand) => unknown;
}) {
  const choices = narrative.kind === "hype" ? hypeResponses : fearResponses;
  return (
    <section
      className="panel world-response"
      aria-labelledby="world-response-title"
      data-testid="pending-narrative-response"
    >
      <span className="eyebrow">Response required · {narrative.kind}</span>
      <h2 id="world-response-title">The deadline has an audience now</h2>
      <p>
        <strong>{narrative.resolution?.headline}</strong>{" "}
        {narrative.resolution?.supportedEvidence}
      </p>
      <p className="world-uncertainty">
        Supported uncertainty: confidence range{" "}
        {formatPercent(narrative.resolution?.confidenceRange.min ?? 0)}–
        {formatPercent(narrative.resolution?.confidenceRange.max ?? 0)}. A
        response changes stakeholder selection and expectation debt.
      </p>
      <div className="world-response-actions">
        {choices.map((choice, index) => (
          <button
            type="button"
            key={choice.id}
            className={index === 0 ? "primary-action" : "text-action"}
            onClick={() =>
              command(
                narrative.kind === "hype"
                  ? {
                      type: "RESPOND_TO_NARRATIVE",
                      response: choice.id as NarrativeResponseId,
                    }
                  : {
                      type: "RESPOND_TO_FEAR",
                      response: choice.id as FearResponseId,
                    },
              )
            }
          >
            <strong>{choice.label}</strong>
            <small>{choice.detail}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function NarrativeCard({
  state,
  narrative,
  command,
}: {
  state: SimulationState;
  narrative: NarrativeInstance;
  command: (command: SimulationCommand) => unknown;
}) {
  const eligibleCreators = [
    "developer-tastemaker",
    "ai-news-amplifier",
    "builder-opportunity",
    "skeptic",
  ]
    .map((id) => findCreator(id))
    .filter(
      (creator): creator is NonNullable<ReturnType<typeof findCreator>> =>
        creator !== undefined &&
        creator.audienceIncentives.some((audience) =>
          narrative.targetAudiences.includes(audience),
        ),
    );
  const hours = simulatedHoursUntil(state, narrative.deadlineTick);
  return (
    <article
      className={`panel world-narrative ${narrative.kind}`}
      data-testid="narrative-card"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {narrative.kind === "hype" ? "Hype signal" : "Fear signal"} ·{" "}
            {narrative.status}
          </span>
          <h2>
            {narrative.kind === "hype"
              ? "A promise is circulating"
              : "A warning is circulating"}
          </h2>
        </div>
        <span className="choice-stat">
          {narrative.status === "available"
            ? "COVER NEXT"
            : narrative.status === "awaiting-prediction"
              ? `${hours.toFixed(1)}H TO PREDICT`
              : narrative.status === "countdown"
                ? `${hours.toFixed(1)}H LEFT`
                : "RESOLVED"}
        </span>
      </div>
      <NarrativeDetails narrative={narrative} />
      {narrative.status === "available" ? (
        <div className="world-actions" aria-label="Choose creator coverage">
          <strong>Choose a creator with a matching audience incentive.</strong>
          {eligibleCreators.map((creator) => (
            <button
              type="button"
              className="primary-action"
              key={creator.id}
              onClick={() =>
                command({
                  type: "COVER_NARRATIVE",
                  narrativeId: narrative.id,
                  creatorId: creator.id,
                })
              }
            >
              Cover with {creator.name}
            </button>
          ))}
        </div>
      ) : null}
      {narrative.status === "awaiting-prediction" ? (
        <div className="world-actions" aria-label="Choose deadline prediction">
          <strong>
            Make one explicit prediction before the countdown resolves.
          </strong>
          {predictionChoices.map((choice) => (
            <button
              type="button"
              className="primary-action"
              key={choice.id}
              onClick={() =>
                command({
                  type: "PUBLISH_PREDICTION",
                  narrativeId: narrative.id,
                  prediction: choice.id,
                  confidence: choice.confidence,
                })
              }
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
      {narrative.status === "countdown" ? (
        <p className="world-countdown" role="status" aria-live="polite">
          Countdown active. The result is deterministic, but the evidence range
          remains uncertain until the deadline.
        </p>
      ) : null}
    </article>
  );
}

export function WorldView({ state, command }: WorldViewProps) {
  const hypeFear = state.hypeFear;
  const narrative = hypeFear.activeNarrativeId
    ? (hypeFear.narratives.find(
        (item) => item.id === hypeFear.activeNarrativeId,
      ) ?? null)
    : null;
  const pendingNarrative = hypeFear.pendingResponse
    ? (hypeFear.narratives.find(
        (item) => item.id === hypeFear.pendingResponse?.narrativeId,
      ) ?? null)
    : null;
  return (
    <>
      <section
        className="panel world-hero"
        aria-labelledby="world-title"
        data-testid="world-view"
      >
        <span className="eyebrow">Milestone 5 · bounded public pressure</span>
        <h2 id="world-title">Hype &amp; Fear</h2>
        <p>
          Original creators turn demonstrated capability into public narratives.
          Attention is bounded; deadlines resolve against measured capability,
          and every response leaves a stakeholder consequence.
        </p>
        {!hypeFear.unlocked ? (
          <div className="world-locked" role="status">
            <strong>Public narratives are not recognized yet.</strong>
            <span>
              Complete one accepted delivery or build reputation to meet the
              first audience.
            </span>
          </div>
        ) : null}
      </section>

      <section
        className="panel world-meters"
        aria-labelledby="world-meters-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Visible pressure</span>
            <h2 id="world-meters-title">What the audience is carrying</h2>
          </div>
          <span className="choice-stat">BOUNDED</span>
        </div>
        <div className="world-meter-grid">
          <StatusGauge
            label="Attention"
            value={hypeFear.attention}
            display={`${hypeFear.attention.toFixed(1)} / 100`}
          />
          <StatusGauge
            label="Fear"
            value={hypeFear.fear * 100}
            display={formatPercent(hypeFear.fear)}
            tone="warning"
          />
          <StatusGauge
            label="Expectation debt"
            value={hypeFear.expectationDebt * 100}
            display={formatPercent(hypeFear.expectationDebt)}
            tone="failure"
          />
          <StatusGauge
            label="Tool-switching panic"
            value={hypeFear.toolSwitchingPanic * 100}
            display={formatPercent(hypeFear.toolSwitchingPanic)}
            tone="evidence"
          />
        </div>
        <p className="world-uncertainty">
          Attention cannot exceed 100. Expectation debt and fear are pressures,
          not capability proof; the resolution range is always shown with the
          narrative.
        </p>
      </section>

      {pendingNarrative ? (
        <ResponsePanel narrative={pendingNarrative} command={command} />
      ) : null}
      {narrative && !hypeFear.pendingResponse ? (
        <NarrativeCard state={state} narrative={narrative} command={command} />
      ) : null}

      <section
        className="panel world-audiences"
        aria-labelledby="world-audiences-title"
        data-testid="audience-reputation"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Audience-specific reputation</span>
            <h2 id="world-audiences-title">Who is still listening?</h2>
          </div>
          <span className="choice-stat">DURABLE</span>
        </div>
        <div className="world-audience-grid">
          {Object.entries(hypeFear.audienceReputation).map(([id, value]) => (
            <div className="world-audience" key={id}>
              <span>{audienceLabels[id as keyof typeof audienceLabels]}</span>
              <strong>{formatPercent(value)}</strong>
            </div>
          ))}
        </div>
        <p>
          Stakeholder selection · escalation seekers{" "}
          {formatPercent(hypeFear.stakeholderSelection.escalationSeekers)} ·
          patient partners{" "}
          {formatPercent(hypeFear.stakeholderSelection.patientPartners)} ·
          support-heavy users{" "}
          {formatPercent(hypeFear.stakeholderSelection.supportHeavyUsers)} ·
          cautious reviewers{" "}
          {formatPercent(hypeFear.stakeholderSelection.cautiousReviewers)}.
        </p>
      </section>

      <section
        className="panel world-tools"
        aria-labelledby="world-tools-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fear response neighbor</span>
            <h2 id="world-tools-title">Tool-switching panic</h2>
          </div>
          <span className="choice-stat">{hypeFear.toolSwitches} SWITCHES</span>
        </div>
        <p>
          Current tool:{" "}
          <strong>
            {
              toolOptions.find((tool) => tool.id === hypeFear.currentToolId)
                ?.name
            }
          </strong>
          . Switching is reversible, but evidence continuity is not free.
        </p>
        <div className="world-tool-grid">
          {toolOptions.map((tool) => (
            <button
              type="button"
              className="text-action"
              key={tool.id}
              disabled={
                tool.id === hypeFear.currentToolId ||
                Boolean(hypeFear.pendingResponse)
              }
              onClick={() => command({ type: "SWITCH_TOOL", toolId: tool.id })}
            >
              <strong>{tool.name}</strong>
              <small>{tool.tradeoff}</small>
            </button>
          ))}
        </div>
      </section>

      <section
        className="panel world-feed"
        aria-labelledby="world-feed-title"
        data-testid="doom-feed"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Doom feed · uncertainty retained</span>
            <h2 id="world-feed-title">What the audience remembers</h2>
          </div>
          <span className="choice-stat">
            {hypeFear.doomFeed.length} ENTRIES
          </span>
        </div>
        {hypeFear.doomFeed.length === 0 ? (
          <p>
            No fear response has entered the feed. A response-required item will
            remain here after a deadline.
          </p>
        ) : (
          <ol className="world-feed-list">
            {hypeFear.doomFeed
              .slice()
              .reverse()
              .map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.headline}</strong>
                  <span>{entry.uncertainty}</span>
                  {entry.responseRequired ? (
                    <small>
                      Response required was recorded above; this item is not a
                      feed-only grind.
                    </small>
                  ) : null}
                </li>
              ))}
          </ol>
        )}
      </section>
    </>
  );
}
