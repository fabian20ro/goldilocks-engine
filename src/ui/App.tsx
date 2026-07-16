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
  getWorkload,
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
import { TIME_SPEEDS, useSimulation, type TimeSpeed } from "./useSimulation";

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
const TUTORIAL_KEY = "goldilocks-quick-start-dismissed-v1";

interface DeletedPreset {
  preset: SavedPreset;
  index: number;
}

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function actionSentence(actions: readonly string[]): string {
  if (actions.length === 0) return "";
  const [first, ...rest] = actions;
  const capitalized = `${first?.charAt(0).toUpperCase()}${first?.slice(1)}`;
  if (rest.length === 0) return `${capitalized}.`;
  if (rest.length === 1) return `${capitalized} or ${rest[0]}.`;
  return `${capitalized}, ${rest.slice(0, -1).join(", ")}, or ${rest.at(-1)}.`;
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

function persistPresets(presets: readonly SavedPreset[]): boolean {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
    return true;
  } catch {
    return false;
  }
}

function shouldShowTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) !== "true";
  } catch {
    return true;
  }
}

function ResourceStrip({ state }: { state: SimulationState }) {
  const rig = getHardware(state.hardwareId);
  const values = [
    { label: "Money", value: `$${formatNumber(state.resources.money)}` },
    { label: "Time", value: `${formatNumber(state.resources.timeHours, 1)}h` },
    {
      label: "Compute CU",
      value: `${formatNumber((rig.compute * state.computeAllocation) / 100, 1)}/${rig.compute}`,
    },
    {
      label: "Memory use",
      value: `${formatNumber(state.metrics.memoryUsed, 1)}/${formatNumber(rig.memory, 1)}GB`,
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

function TimeSpeedControl({
  value,
  onChange,
}: {
  value: TimeSpeed;
  onChange: (speed: number) => void;
}) {
  return (
    <section className="time-controls" aria-labelledby="time-speed-title">
      <div>
        <strong id="time-speed-title">Simulation time</strong>
        <small>Runs queued work; separate from animation and pause.</small>
      </div>
      <div className="speed-options" role="group" aria-label="Time speed">
        {TIME_SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            aria-pressed={value === speed}
            onClick={() => onChange(speed)}
          >
            {speed}×
          </button>
        ))}
      </div>
    </section>
  );
}

function QuickStart({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section
      className="quick-start"
      aria-labelledby="quick-start-title"
      data-testid="quick-start"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">First run / always reopenable</span>
          <h2 id="quick-start-title">Quick start: earn, diagnose, improve</h2>
        </div>
        <button type="button" className="text-action" onClick={onDismiss}>
          Dismiss tutorial
        </button>
      </div>
      <ol className="tutorial-steps">
        <li>
          <strong>Earn money through completed work.</strong>
          <p>
            Open Jobs, choose a workload, then queue it. While processing is not
            paused, queued work runs through every stage. A successful
            completion pays its listed gross reward; every attempt also pays the
            current operating cost. A failed job earns no gross payout.
          </p>
          <p className="tutorial-detail">
            Gross per success: Interactive Chat $1.40 · Batch Classification
            $1.10 · Long Document $2.20 · Competition Training $0.20.
            Competition work trades cash for the highest reputation reward.
          </p>
        </li>
        <li>
          <strong>
            Read CU, memory, and pressure before changing the rig.
          </strong>
          <p>
            CU means normalized Compute Units: a stable comparison between rig
            capacity and workload demand, not a claim about physical FLOPS.
            Memory use includes workload plus installed modules. Rig capacity is
            total RAM; Memory reserve is RAM deliberately held back, so only the
            remainder is usable by this pipeline. To reduce thermal pressure,
            lower the compute budget or choose a workload with lower CU demand;
            the Animations control changes visuals only and does not affect heat
            or simulation time.
          </p>
        </li>
        <li>
          <strong>Improve this toy with configuration, not purchases.</strong>
          <p>
            Drag or tap compatible modules, keep preparation → model →
            evaluation order, adjust compute budget or memory reserve, change
            workload, and compare Shadow evaluation. Hardware purchasing is a
            Milestone 2 feature and stays unavailable until the Pipeline Toy
            human gate passes; there is no upgrade shop in this build.
          </p>
        </li>
        <li>
          <strong>Separate time, animation, pause, and presets.</strong>
          <p>
            Simulation time 1×/4×/16× changes how quickly work advances.
            Animations is visual only and never changes simulation time. Pause
            retains the queue. In Inspect, Save current creates a preset; use
            its labeled Delete button, confirm, then Undo if needed.
          </p>
        </li>
      </ol>
    </section>
  );
}

function WarningBanner({
  state,
  onOpenJobs,
  onOpenBuild,
}: {
  state: SimulationState;
  onOpenJobs: () => void;
  onOpenBuild: () => void;
}) {
  const rig = getHardware(state.hardwareId);
  const workload = getWorkload(state.workloadId);
  const reserveGb = rig.memory - state.metrics.memoryAvailable;
  const canLowerReserve = state.memoryReserve > 0;
  const canUseLighterModule = state.slots.some((slotState) => {
    const currentModule = getModule(slotState.moduleId);
    const slot = getSlot(slotState.slotId);
    return modules.some(
      (candidate) =>
        candidate.slotTypes.includes(slot.type) &&
        candidate.memory < currentModule.memory,
    );
  });
  const canUseLowerMemoryWorkload = workloads.some(
    (candidate) => candidate.memoryDemand < workload.memoryDemand,
  );
  const canLowerCompute = state.computeAllocation > 25;
  const canUseLowerCuWorkload = workloads.some(
    (candidate) => candidate.computeDemand < workload.computeDemand,
  );
  const nominal = state.lastWarning.includes("inside");
  let guidance =
    "Pressure is currently inside the modelled envelope. Queue work, then compare module order, policies, and observed results; this estimate does not prove future jobs will succeed.";
  if (state.metrics.memoryPressure > 1) {
    const actions = [
      canLowerReserve ? "lower the reserve" : null,
      canUseLighterModule
        ? "choose lighter compatible modules (drawer cards show GB)"
        : null,
      canUseLowerMemoryWorkload ? "choose a lower-memory workload" : null,
    ].filter((action): action is string => action !== null);
    const availableActions =
      actionSentence(actions) ||
      "Reserve, compatible-module memory, and workload memory demand are already at their current minima; this configuration cannot fit on the current rig.";
    const effectQualification = actions.length
      ? "These changes can reduce pressure; the warning does not assume one sole cause."
      : "The warning identifies a hard fit boundary, not one sole cause.";
    guidance = `This configuration needs ${formatNumber(state.metrics.memoryUsed, 1)} GB, but only ${formatNumber(state.metrics.memoryAvailable, 1)} GB is usable of ${formatNumber(rig.memory, 1)} GB total rig capacity; ${formatNumber(reserveGb, 1)} GB (${state.memoryReserve}%) is reserved. ${availableActions} ${effectQualification}`;
  } else if (state.metrics.thermalPressure > 1) {
    const actions = [
      canLowerCompute ? "lower compute budget" : null,
      canUseLowerCuWorkload ? "choose a workload with lower CU demand" : null,
    ].filter((action): action is string => action !== null);
    const availableActions =
      actionSentence(actions) ||
      "Compute budget and workload CU demand are already at their current minima; no current policy can reduce estimated heat further.";
    guidance = `Estimated thermal load is ${formatNumber(state.metrics.thermalLoad, 1)} against a ${rig.thermalLimit} limit. ${availableActions} Module swaps mainly change memory, throughput, quality, and reliability in this toy—not heat directly. The Animations control changes visuals only; it does not affect heat or simulation time. Throttling is predicted, not a certain hardware fault.`;
  } else if (state.metrics.orderWarnings.length > 0) {
    guidance =
      "Put preparation before model and evaluation after model. Reordering changes throughput, quality, and reliability together; compare the baseline instead of assuming every delta has one cause.";
  } else if (state.metrics.reliability < 0.82) {
    guidance =
      "Choose a more reliable compatible module or stronger evaluation. Low reliability raises failure risk, but the event log distinguishes a direct failure cause from contributing conditions.";
  } else if (state.metrics.evaluationCoverage < 0.4) {
    guidance =
      "Try Robust Evaluation or Shadow evaluation for more evidence. Both can reduce throughput, and more evidence narrows blind spots without guaranteeing correctness.";
  }
  return (
    <aside
      className={`warning-banner ${nominal ? "nominal" : ""}`}
      aria-live="polite"
      aria-label="Current warning and actions"
    >
      <span aria-hidden="true">{nominal ? "✓" : "!"}</span>
      <div>
        <strong>{state.lastWarning}</strong>
        <p>{guidance}</p>
        <div className="guidance-actions">
          <button type="button" onClick={onOpenJobs}>
            Policies &amp; workload
          </button>
          <button type="button" onClick={onOpenBuild}>
            Module drawer
          </button>
        </div>
      </div>
    </aside>
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

function MoneyLoop({ state }: { state: SimulationState }) {
  const workload = getWorkload(state.workloadId);
  const settlement = state.lastSettlement;
  const netClass = settlement && settlement.netChange < 0 ? "bad" : "good";
  return (
    <section className="money-loop" aria-labelledby="money-loop-title">
      <div className="money-loop-route" aria-label="Money loop">
        <span>1 Choose</span>
        <span aria-hidden="true">→</span>
        <span>2 Queue</span>
        <span aria-hidden="true">→</span>
        <span>3 Run</span>
        <span aria-hidden="true">→</span>
        <span>4 Complete</span>
        <span aria-hidden="true">→</span>
        <span>5 Payout</span>
      </div>
      <div className="money-loop-copy">
        <div>
          <span className="eyebrow">Selected-work payout</span>
          <h3 id="money-loop-title">{workload.name}</h3>
          <p>
            ${workload.rewardMoney.toFixed(2)} gross per successful completion ·
            ${formatNumber(state.metrics.operatingCost, 3)} operating cost per
            attempt · failed jobs receive $0 gross.
          </p>
        </div>
        <div className="settlement" aria-live="polite">
          <span className="eyebrow">Latest settlement</span>
          {settlement ? (
            <>
              <strong className={netClass}>
                {settlement.netChange >= 0 ? "+" : "−"}$
                {Math.abs(settlement.netChange).toFixed(2)} net
              </strong>
              <small>
                {settlement.completed} paid · {settlement.failed} failed · $
                {settlement.grossPayout.toFixed(2)} gross − $
                {settlement.operatingCost.toFixed(2)} costs
              </small>
            </>
          ) : (
            <strong>No payout yet — queue a job.</strong>
          )}
        </div>
      </div>
      <p className="earnings-total">
        Run totals: ${state.jobs.grossEarned.toFixed(2)} gross earned · $
        {state.jobs.operatingCostsPaid.toFixed(2)} operating costs paid.
      </p>
    </section>
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
        <MoneyLoop state={state} />
        <p className="concept-note">
          <strong>CU = normalized Compute Units.</strong> Use CU to compare this
          rig's capacity with workload demand; CU is not a physical FLOPS
          measurement.
        </p>
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
                <small>
                  {workload.description} ${workload.rewardMoney.toFixed(2)}
                  gross on success ·{" "}
                  {formatNumber(workload.rewardReputation, 2)}
                  rep.
                </small>
              </span>
              <span className="choice-stat">
                {workload.computeDemand} CU · {workload.memoryDemand} GB
              </span>
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
            Memory reserve (held back) <strong>{state.memoryReserve}%</strong>
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
        <p className="memory-accounting">
          Current memory: {formatNumber(state.metrics.memoryUsed, 1)} GB used /{" "}
          {formatNumber(getHardware(state.hardwareId).memory, 1)} GB rig
          capacity.{" "}
          {formatNumber(
            getHardware(state.hardwareId).memory -
              state.metrics.memoryAvailable,
            1,
          )}{" "}
          GB is reserved, leaving{" "}
          {formatNumber(state.metrics.memoryAvailable, 1)} GB usable by the
          pipeline.
        </p>
      </section>

      <section className="panel" aria-labelledby="hardware-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Current milestone boundary</span>
            <h2 id="hardware-title">Rig progression</h2>
          </div>
        </div>
        <div className="locked-rig">
          <span className="lock-badge">HARDWARE SHOP LOCKED</span>
          <strong>{getHardware(state.hardwareId).name}</strong>
          <p>
            {getHardware(state.hardwareId).compute} normalized CU ·{" "}
            {getHardware(state.hardwareId).memory} GB total memory ·{" "}
            {getHardware(state.hardwareId).watts} W modelled draw.
          </p>
          <p>
            Hardware purchasing belongs to Milestone 2 and remains unavailable
            until the Pipeline Toy human gate passes. Improve the current toy
            now through compatible module choice, preparation → model →
            evaluation order, compute budget, memory reserve, workload, and
            Shadow evaluation policy.
          </p>
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
  pendingDeleteId,
  deletedPreset,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onUndoDelete,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  presets: readonly SavedPreset[];
  onSavePreset: () => void;
  onLoadPreset: (preset: SavedPreset) => void;
  pendingDeleteId: string | null;
  deletedPreset: DeletedPreset | null;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onUndoDelete: () => void;
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
          <div className="preset-list">
            {presets.map((preset) => (
              <div className="preset-item" key={preset.id}>
                <div className="preset-row">
                  <button
                    type="button"
                    className="choice-card preset-load"
                    onClick={() => onLoadPreset(preset)}
                    aria-label={`Load ${preset.name}`}
                  >
                    <span>
                      <strong>{preset.name}</strong>
                      <small>
                        {getHardware(state.hardwareId).name} ·{" "}
                        {
                          getModule(
                            preset.slots[2]?.moduleId ?? "quantized-model",
                          ).name
                        }
                      </small>
                    </span>
                    <span className="choice-stat">LOAD</span>
                  </button>
                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => onRequestDelete(preset.id)}
                    aria-label={`Delete ${preset.name}`}
                  >
                    Delete
                  </button>
                </div>
                {pendingDeleteId === preset.id ? (
                  <div
                    className="delete-confirmation"
                    role="group"
                    aria-label={`Confirm deletion of ${preset.name}`}
                  >
                    <p>Delete {preset.name}? This removes its local copy.</p>
                    <button type="button" onClick={onCancelDelete}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="danger-action"
                      onClick={onConfirmDelete}
                    >
                      Confirm delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No presets yet. Save a configuration before experimenting.
          </p>
        )}
        {deletedPreset ? (
          <div className="undo-banner" role="status">
            <span>{deletedPreset.preset.name} deleted from local presets.</span>
            <button type="button" onClick={onUndoDelete}>
              Undo delete
            </button>
          </div>
        ) : null}
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
  const { state, command, timeSpeed, setTimeSpeed } = useSimulation();
  const [tab, setTab] = useState<TabId>("build");
  const [selected, setSelected] = useState<{
    moduleId: string;
    fromSlotId?: string;
  } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [presets, setPresets] = useState<SavedPreset[]>(loadPresets);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedPreset, setDeletedPreset] = useState<DeletedPreset | null>(
    null,
  );
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
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
    if (persistPresets(next)) {
      setPresets(next);
      setDeletedPreset(null);
    }
  };

  const dismissTutorial = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "true");
    } catch {
      // The tutorial still closes for this session when storage is unavailable.
    }
    setShowTutorial(false);
  };

  const requestPresetDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmPresetDelete = () => {
    if (!pendingDeleteId) return;
    const index = presets.findIndex((preset) => preset.id === pendingDeleteId);
    if (index < 0) {
      setPendingDeleteId(null);
      return;
    }
    const preset = presets[index];
    if (!preset) return;
    const next = presets.filter((item) => item.id !== pendingDeleteId);
    if (persistPresets(next)) {
      setPresets(next);
      setDeletedPreset({ preset, index });
      setPendingDeleteId(null);
    }
  };

  const undoPresetDelete = () => {
    if (!deletedPreset) return;
    const next = [...presets];
    next.splice(
      Math.min(deletedPreset.index, next.length),
      0,
      deletedPreset.preset,
    );
    const bounded = next.slice(0, 6);
    if (persistPresets(bounded)) {
      setPresets(bounded);
      setDeletedPreset(null);
    }
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
      className={`app-shell ${reducedMotion ? "motion-reduced" : ""} ${drag ? "dragging" : ""}`}
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
          <div className="header-actions">
            <button
              type="button"
              className="help-toggle"
              aria-expanded={showTutorial}
              aria-controls="quick-start-title"
              onClick={() => setShowTutorial(true)}
            >
              Help / Quick start
            </button>
            <div className="animation-control">
              <button
                type="button"
                className="motion-toggle"
                aria-pressed={reducedMotion}
                onClick={() => setReducedMotion((value) => !value)}
              >
                {reducedMotion ? "Animations off" : "Animations on"}
              </button>
              <small>Visual only</small>
            </div>
          </div>
        </div>
        <ResourceStrip state={state} />
        <TimeSpeedControl value={timeSpeed} onChange={setTimeSpeed} />
      </header>

      <main id="main-content" className="main-content">
        {showTutorial ? <QuickStart onDismiss={dismissTutorial} /> : null}
        <WarningBanner
          state={state}
          onOpenJobs={() => setTab("jobs")}
          onOpenBuild={() => setTab("build")}
        />
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
            pendingDeleteId={pendingDeleteId}
            deletedPreset={deletedPreset}
            onRequestDelete={requestPresetDelete}
            onCancelDelete={() => setPendingDeleteId(null)}
            onConfirmDelete={confirmPresetDelete}
            onUndoDelete={undoPresetDelete}
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
