import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  getHardware,
  getModule,
  getSlot,
  hardware,
  modules,
  slots as slotSpecs,
  workloads,
} from "../simulation/catalog";
import type {
  PipelineMetrics,
  PipelineSlotState,
  SimulationCommand,
  SimulationState,
} from "../simulation/types";
import { useSimulation } from "./useSimulation";

type TabId = "build" | "jobs" | "inspect";

interface DragState {
  moduleId: string;
  fromSlotId?: string;
  x: number;
  y: number;
}

interface SavedPreset {
  id: string;
  name: string;
  slots: readonly PipelineSlotState[];
  workloadId: string;
  branchEnabled: boolean;
  computeAllocation: number;
  memoryReserve: number;
}

const PRESET_KEY = "goldilocks-pipeline-presets-v1";

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function loadPresets(): SavedPreset[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(PRESET_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    return parsed
      .filter((value): value is SavedPreset => {
        if (typeof value !== "object" || value === null) return false;
        const preset = value as Record<string, unknown>;
        if (
          typeof preset.id !== "string" ||
          preset.id.length === 0 ||
          preset.id.length > 64 ||
          ids.has(preset.id) ||
          typeof preset.name !== "string" ||
          preset.name.trim().length === 0 ||
          preset.name.length > 64 ||
          typeof preset.branchEnabled !== "boolean" ||
          typeof preset.computeAllocation !== "number" ||
          !Number.isFinite(preset.computeAllocation) ||
          preset.computeAllocation < 25 ||
          preset.computeAllocation > 100 ||
          typeof preset.memoryReserve !== "number" ||
          !Number.isFinite(preset.memoryReserve) ||
          preset.memoryReserve < 0 ||
          preset.memoryReserve > 30 ||
          typeof preset.workloadId !== "string" ||
          !workloads.some((workload) => workload.id === preset.workloadId) ||
          !Array.isArray(preset.slots) ||
          preset.slots.length !== slotSpecs.length
        )
          return false;

        const validSlots = preset.slots.every((value, index) => {
          if (typeof value !== "object" || value === null) return false;
          const slotState = value as Record<string, unknown>;
          const slot = slotSpecs[index];
          const module = modules.find(
            (candidate) => candidate.id === slotState.moduleId,
          );
          return (
            typeof slotState.slotId === "string" &&
            slotState.slotId === slot?.id &&
            typeof slotState.moduleId === "string" &&
            module !== undefined &&
            module.slotTypes.includes(slot.type)
          );
        });
        if (validSlots) ids.add(preset.id);
        return validSlots;
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}

function ResourceStrip({ state }: { state: SimulationState }) {
  const values = [
    { label: "Money", value: `$${formatNumber(state.resources.money)}` },
    { label: "Time", value: `${formatNumber(state.resources.timeHours, 1)}h` },
    { label: "Compute", value: `${state.computeAllocation}%` },
    {
      label: "Memory",
      value: `${formatNumber(state.metrics.memoryUsed, 1)}/${formatNumber(state.metrics.memoryAvailable, 1)}`,
    },
    { label: "Rep", value: formatNumber(state.resources.reputation, 1) },
  ];
  return (
    <dl className="resource-strip" aria-label="Primary resources">
      {values.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Delta({
  current,
  baseline,
  suffix = "",
  inverse = false,
}: {
  current: number;
  baseline?: number;
  suffix?: string;
  inverse?: boolean;
}) {
  if (baseline === undefined) return <span className="delta neutral">—</span>;
  const difference = current - baseline;
  const good = inverse ? difference < 0 : difference > 0;
  return (
    <span
      className={`delta ${Math.abs(difference) < 0.005 ? "neutral" : good ? "good" : "bad"}`}
    >
      {difference > 0 ? "+" : ""}
      {formatNumber(difference, 2)}
      {suffix}
    </span>
  );
}

function ModuleCard({
  moduleId,
  slotId,
  selected,
  onSelect,
  onDragStart,
}: {
  moduleId: string;
  slotId?: string;
  selected: boolean;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
}) {
  const module = getModule(moduleId);
  return (
    <button
      type="button"
      className={`module-card ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      aria-label={`${module.name}. ${module.description}`}
      data-module-id={module.id}
      onClick={() => onSelect(module.id, slotId)}
      onPointerDown={(event) => onDragStart(event, module.id, slotId)}
    >
      <span className="module-code" aria-hidden="true">
        {module.shortName}
      </span>
      <span className="module-copy">
        <strong>{module.name}</strong>
        <small>
          {module.throughput}/m · {module.memory} GB ·{" "}
          {formatNumber(module.reliability * 100, 1)}%
        </small>
      </span>
      <span className="drag-grip" aria-hidden="true">
        ⠿
      </span>
    </button>
  );
}

function FlowConnector({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div
      className={`flow-connector ${active ? "active" : ""} ${reducedMotion ? "still" : ""}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

function Pipeline({
  state,
  selected,
  onSelect,
  onDragStart,
  onInstall,
  command,
  reducedMotion,
}: {
  state: SimulationState;
  selected: { moduleId: string; fromSlotId?: string } | null;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
  onInstall: (slotId: string) => void;
  command: (command: SimulationCommand) => void;
  reducedMotion: boolean;
}) {
  const failureIndex = state.failedModuleId
    ? state.slots.findIndex((slot) => slot.moduleId === state.failedModuleId)
    : -1;
  const queueSlot = state.metrics.bottleneckSlotId;
  return (
    <section className="panel pipeline-panel" aria-labelledby="pipeline-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Active pipeline</span>
          <h2 id="pipeline-title">Local inference rig</h2>
        </div>
        <span
          className={`status-chip ${state.jobs.paused ? "paused" : "live"}`}
        >
          {state.jobs.paused ? "Ⅱ Paused" : "● Live"}
        </span>
      </div>

      <div className="pipeline" data-testid="pipeline">
        {state.slots.map((slotState, index) => {
          const slot = getSlot(slotState.slotId);
          const module = getModule(slotState.moduleId);
          const compatible = selected
            ? module.id !== selected.moduleId &&
              getModule(selected.moduleId).slotTypes.includes(slot.type)
            : false;
          const failed = failureIndex === index;
          const propagated = failureIndex >= 0 && index > failureIndex;
          return (
            <div className="pipeline-stage-group" key={slot.id}>
              <div
                className={`pipeline-slot ${compatible ? "compatible" : ""} ${failed ? "failed" : ""} ${propagated ? "propagated" : ""}`}
                data-slot-id={slot.id}
                data-testid={`slot-${slot.id}`}
              >
                <div className="slot-meta">
                  <span>{slot.name}</span>
                  {state.jobs.queued > 0 && slot.id === queueSlot ? (
                    <span
                      className="queue-badge"
                      aria-label={`${state.jobs.queued} jobs queued at bottleneck`}
                    >
                      Q {state.jobs.queued}
                    </span>
                  ) : null}
                </div>
                <ModuleCard
                  moduleId={module.id}
                  slotId={slot.id}
                  selected={
                    selected?.moduleId === module.id &&
                    selected.fromSlotId === slot.id
                  }
                  onSelect={onSelect}
                  onDragStart={onDragStart}
                />
                {compatible ? (
                  <button
                    className="snap-action"
                    type="button"
                    onClick={() => onInstall(slot.id)}
                  >
                    Snap here
                  </button>
                ) : null}
                {failed ? (
                  <span className="failure-label">FAULT ORIGIN</span>
                ) : null}
                {propagated ? (
                  <span className="failure-label">OUTPUT REJECTED</span>
                ) : null}
              </div>
              {slot.id === "runtime" ? (
                <div
                  className={`branch-junction ${state.branchEnabled ? "enabled" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => command({ type: "TOGGLE_BRANCH" })}
                    aria-pressed={state.branchEnabled}
                  >
                    <span aria-hidden="true">⑂</span>
                    <span>
                      <strong>Shadow evaluation</strong>
                      <small>
                        {state.branchEnabled
                          ? "20% traffic · evidence +10%"
                          : "Branch disabled"}
                      </small>
                    </span>
                  </button>
                </div>
              ) : null}
              {index < state.slots.length - 1 ? (
                <FlowConnector
                  active={!state.jobs.paused && state.jobs.queued > 0}
                  reducedMotion={reducedMotion}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ModuleLibrary({
  selected,
  onSelect,
  onDragStart,
}: {
  selected: { moduleId: string; fromSlotId?: string } | null;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
}) {
  return (
    <section className="panel library-panel" aria-labelledby="library-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Module drawer</span>
          <h2 id="library-title">Drag or tap, then choose a slot</h2>
        </div>
      </div>
      <div className="module-library">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            moduleId={module.id}
            selected={selected?.moduleId === module.id && !selected.fromSlotId}
            onSelect={onSelect}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </section>
  );
}

function BuildView({
  state,
  command,
  selected,
  onSelect,
  onDragStart,
  onInstall,
  reducedMotion,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  selected: { moduleId: string; fromSlotId?: string } | null;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
  onInstall: (slotId: string) => void;
  reducedMotion: boolean;
}) {
  return (
    <>
      <section
        className="mission-card"
        aria-label="Current objective and bottleneck"
      >
        <div>
          <span className="eyebrow">Current objective</span>
          <strong>Complete 12 stable jobs</strong>
          <div
            className="progress-track"
            aria-label={`${Math.min(state.jobs.completed, 12)} of 12 jobs complete`}
          >
            <span
              style={{
                width: `${Math.min(100, (state.jobs.completed / 12) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div>
          <span className="eyebrow">Dominant bottleneck</span>
          <strong className="bottleneck">
            {state.metrics.dominantBottleneck}
          </strong>
        </div>
      </section>
      <Pipeline
        state={state}
        command={command}
        selected={selected}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onInstall={onInstall}
        reducedMotion={reducedMotion}
      />
      <ModuleLibrary
        selected={selected}
        onSelect={onSelect}
        onDragStart={onDragStart}
      />
    </>
  );
}

function JobsView({
  state,
  command,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
}) {
  return (
    <>
      <section className="panel" aria-labelledby="workload-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Route work</span>
            <h2 id="workload-title">Workloads</h2>
          </div>
          <span className="counter">{state.jobs.queued} queued</span>
        </div>
        <div className="choice-list">
          {workloads.map((workload) => (
            <button
              type="button"
              key={workload.id}
              className={
                state.workloadId === workload.id
                  ? "choice-card selected"
                  : "choice-card"
              }
              aria-pressed={state.workloadId === workload.id}
              onClick={() =>
                command({ type: "SET_WORKLOAD", workloadId: workload.id })
              }
            >
              <span>
                <strong>{workload.name}</strong>
                <small>{workload.description}</small>
              </span>
              <span className="choice-stat">{workload.computeDemand} CU</span>
            </button>
          ))}
        </div>
        <div className="job-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => command({ type: "QUEUE_JOBS", count: 1 })}
          >
            Queue 1
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={() => command({ type: "QUEUE_JOBS", count: 10 })}
          >
            Queue 10
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => command({ type: "TOGGLE_PAUSE" })}
          >
            {state.jobs.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="allocation-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Bounded policy</span>
            <h2 id="allocation-title">Resource allocation</h2>
          </div>
        </div>
        <label className="range-control">
          <span>
            Compute budget <strong>{state.computeAllocation}%</strong>
          </span>
          <input
            type="range"
            min="25"
            max="100"
            step="5"
            value={state.computeAllocation}
            aria-label="Compute budget percentage"
            onChange={(event) =>
              command({
                type: "SET_COMPUTE_ALLOCATION",
                percent: event.currentTarget.valueAsNumber,
              })
            }
          />
        </label>
        <label className="range-control">
          <span>
            Memory reserve <strong>{state.memoryReserve}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={state.memoryReserve}
            aria-label="Memory reserve percentage"
            onChange={(event) =>
              command({
                type: "SET_MEMORY_RESERVE",
                percent: event.currentTarget.valueAsNumber,
              })
            }
          />
        </label>
      </section>

      <section className="panel" aria-labelledby="hardware-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Capacity has consequences</span>
            <h2 id="hardware-title">Hardware</h2>
          </div>
        </div>
        <div className="choice-list">
          {hardware.map((item) => {
            const owned = state.ownedHardwareIds.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={
                  state.hardwareId === item.id
                    ? "choice-card selected"
                    : "choice-card"
                }
                aria-pressed={state.hardwareId === item.id}
                onClick={() =>
                  command({
                    type: owned ? "SELECT_HARDWARE" : "BUY_HARDWARE",
                    hardwareId: item.id,
                  })
                }
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.memory} GB · {item.compute} CU · {item.watts} W
                  </small>
                </span>
                <span className="choice-stat">
                  {owned
                    ? state.hardwareId === item.id
                      ? "ACTIVE"
                      : "OWNED"
                    : `$${item.purchaseCost}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function MetricRow({
  label,
  current,
  baseline,
  suffix,
  inverse = false,
}: {
  label: string;
  current: number;
  baseline?: number;
  suffix?: string;
  inverse?: boolean;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {formatNumber(current, 2)}
        {suffix}
      </td>
      <td>
        <Delta
          current={current}
          baseline={baseline}
          suffix={suffix}
          inverse={inverse}
        />
      </td>
    </tr>
  );
}

function Comparison({
  metrics,
  baseline,
  label,
}: {
  metrics: PipelineMetrics;
  baseline: PipelineMetrics | null;
  label: string | null;
}) {
  return (
    <table className="metrics-table">
      <caption>
        {baseline
          ? `Compared with ${label ?? "baseline"}`
          : "Capture a baseline to compare configurations."}
      </caption>
      <thead>
        <tr>
          <th>Signal</th>
          <th>Now</th>
          <th>Δ</th>
        </tr>
      </thead>
      <tbody>
        <MetricRow
          label="Throughput"
          current={metrics.throughputPerMinute}
          baseline={baseline?.throughputPerMinute}
          suffix="/m"
        />
        <MetricRow
          label="Latency"
          current={metrics.latencySeconds}
          baseline={baseline?.latencySeconds}
          suffix="s"
          inverse
        />
        <MetricRow
          label="Memory"
          current={metrics.memoryUsed}
          baseline={baseline?.memoryUsed}
          suffix=" GB"
          inverse
        />
        <MetricRow
          label="Predicted quality"
          current={metrics.predictedQuality}
          baseline={baseline?.predictedQuality}
        />
        <MetricRow
          label="Observed quality"
          current={metrics.observedQuality}
          baseline={baseline?.observedQuality}
        />
        <MetricRow
          label="Reliability"
          current={metrics.reliability * 100}
          baseline={baseline ? baseline.reliability * 100 : undefined}
          suffix="%"
        />
        <MetricRow
          label="Evaluation coverage"
          current={metrics.evaluationCoverage * 100}
          baseline={baseline ? baseline.evaluationCoverage * 100 : undefined}
          suffix="%"
        />
      </tbody>
    </table>
  );
}

function InspectView({
  state,
  command,
  presets,
  onSavePreset,
  onLoadPreset,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  presets: readonly SavedPreset[];
  onSavePreset: () => void;
  onLoadPreset: (preset: SavedPreset) => void;
}) {
  return (
    <>
      <section className="panel" aria-labelledby="inspector-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Predicted ≠ observed</span>
            <h2 id="inspector-title">Configuration inspector</h2>
          </div>
          <button
            type="button"
            className="text-action"
            onClick={() =>
              command({ type: "CAPTURE_BASELINE", label: "Manual baseline" })
            }
          >
            Capture
          </button>
        </div>
        <Comparison
          metrics={state.metrics}
          baseline={state.baselineMetrics}
          label={state.baselineLabel}
        />
        <div className="pressure-grid">
          <div
            className={
              state.metrics.memoryPressure > 1 ? "pressure danger" : "pressure"
            }
          >
            <span>Memory pressure</span>
            <strong>{formatNumber(state.metrics.memoryPressure * 100)}%</strong>
          </div>
          <div
            className={
              state.metrics.thermalPressure > 1 ? "pressure danger" : "pressure"
            }
          >
            <span>Thermal pressure</span>
            <strong>
              {formatNumber(state.metrics.thermalPressure * 100)}%
            </strong>
          </div>
          <div className="pressure">
            <span>Observability</span>
            <strong>{formatNumber(state.metrics.observability * 100)}%</strong>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="preset-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Player-authored preset</span>
            <h2 id="preset-title">Configurations</h2>
          </div>
          <button type="button" className="text-action" onClick={onSavePreset}>
            Save current
          </button>
        </div>
        {presets.length ? (
          <div className="choice-list">
            {presets.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className="choice-card"
                onClick={() => onLoadPreset(preset)}
              >
                <span>
                  <strong>{preset.name}</strong>
                  <small>
                    {getHardware(state.hardwareId).name} ·{" "}
                    {
                      getModule(preset.slots[2]?.moduleId ?? "quantized-model")
                        .name
                    }
                  </small>
                </span>
                <span className="choice-stat">LOAD</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No presets yet. Save a configuration before experimenting.
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="ledger-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Causal signals</span>
            <h2 id="ledger-title">Recent event log</h2>
          </div>
        </div>
        <ol className="event-log">
          {[...state.ledger]
            .reverse()
            .slice(0, 12)
            .map((event) => (
              <li key={event.id} className={event.kind}>
                <span className="event-mark" aria-hidden="true" />
                <div>
                  <p>{event.message}</p>
                  {event.directCause ? (
                    <small>Direct cause: {event.directCause}</small>
                  ) : null}
                  {event.contributingCondition ? (
                    <small>Contributing: {event.contributingCondition}</small>
                  ) : null}
                </div>
              </li>
            ))}
        </ol>
      </section>
    </>
  );
}

export function App() {
  const { state, command } = useSimulation();
  const [tab, setTab] = useState<TabId>("build");
  const [selected, setSelected] = useState<{
    moduleId: string;
    fromSlotId?: string;
  } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [presets, setPresets] = useState<SavedPreset[]>(loadPresets);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const selectedName = useMemo(
    () => (selected ? getModule(selected.moduleId).name : null),
    [selected],
  );

  const onSelect = (moduleId: string, fromSlotId?: string) => {
    setSelected((current) =>
      current?.moduleId === moduleId && current.fromSlotId === fromSlotId
        ? null
        : { moduleId, fromSlotId },
    );
  };

  const onInstall = (slotId: string) => {
    if (!selected) return;
    command({
      type: "PLACE_MODULE",
      moduleId: selected.moduleId,
      slotId,
      fromSlotId: selected.fromSlotId,
    });
    setSelected(null);
  };

  const onDragStart = (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ moduleId, fromSlotId, x: event.clientX, y: event.clientY });
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: event.clientX, y: event.clientY });
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    if (!drag) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-slot-id]");
    if (target?.dataset.slotId) {
      command({
        type: "PLACE_MODULE",
        moduleId: drag.moduleId,
        slotId: target.dataset.slotId,
        fromSlotId: drag.fromSlotId,
      });
    }
    setDrag(null);
    setSelected(null);
  };

  const savePreset = () => {
    const preset: SavedPreset = {
      id: `${Date.now()}`,
      name: `Preset ${presets.length + 1}`,
      slots: state.slots,
      workloadId: state.workloadId,
      branchEnabled: state.branchEnabled,
      computeAllocation: state.computeAllocation,
      memoryReserve: state.memoryReserve,
    };
    const next = [preset, ...presets].slice(0, 6);
    localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    setPresets(next);
  };

  const loadPreset = (preset: SavedPreset) => {
    for (const slot of preset.slots)
      command({
        type: "PLACE_MODULE",
        moduleId: slot.moduleId,
        slotId: slot.slotId,
      });
    command({ type: "SET_WORKLOAD", workloadId: preset.workloadId });
    command({
      type: "SET_COMPUTE_ALLOCATION",
      percent: preset.computeAllocation,
    });
    command({ type: "SET_MEMORY_RESERVE", percent: preset.memoryReserve });
    if (state.branchEnabled !== preset.branchEnabled)
      command({ type: "TOGGLE_BRANCH" });
    setTab("build");
  };

  return (
    <div
      className={`app-shell ${drag ? "dragging" : ""}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <a className="skip-link" href="#main-content">
        Skip to controls
      </a>
      <header className="app-header">
        <div className="brand-row">
          <div>
            <span className="brand-kicker">BEDROOM NODE / 01</span>
            <h1>Goldilocks Engine</h1>
          </div>
          <button
            type="button"
            className="motion-toggle"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            {reducedMotion ? "Motion off" : "Motion on"}
          </button>
        </div>
        <ResourceStrip state={state} />
      </header>

      <main id="main-content" className="main-content">
        <aside
          className={`warning-banner ${state.lastWarning.includes("inside") ? "nominal" : ""}`}
          aria-live="polite"
        >
          <span aria-hidden="true">
            {state.lastWarning.includes("inside") ? "✓" : "!"}
          </span>
          <p>{state.lastWarning}</p>
        </aside>
        {selectedName ? (
          <div className="selection-banner" role="status">
            <span>{selectedName} selected</span>
            <button type="button" onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        ) : null}

        {tab === "build" ? (
          <BuildView
            state={state}
            command={command}
            selected={selected}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onInstall={onInstall}
            reducedMotion={reducedMotion}
          />
        ) : tab === "jobs" ? (
          <JobsView state={state} command={command} />
        ) : (
          <InspectView
            state={state}
            command={command}
            presets={presets}
            onSavePreset={savePreset}
            onLoadPreset={loadPreset}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {(
          [
            ["build", "⌁", "Build"],
            ["jobs", "▤", "Jobs"],
            ["inspect", "⌕", "Inspect"],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            type="button"
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {drag ? (
        <div
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {getModule(drag.moduleId).shortName}
        </div>
      ) : null}
    </div>
  );
}
