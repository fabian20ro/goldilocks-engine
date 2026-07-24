import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  bedroomCareerRoutes,
  getHardware,
  getModule,
  getPipelineExpansion,
  getSlot,
  getWorkload,
  hardware,
  localModelTiers,
  modules,
  pipelineExpansions,
  slots as slotSpecs,
  workloads,
} from "../simulation/catalog";
import {
  calculateMetrics,
  endingNextRunResponse,
  estimateWorkloadOffer,
  getPostmortemEvent,
  getSimulationAgeHours,
  getWorkloadQuote,
  independentRunReadiness,
  localModelTierUnlockProgress,
  workloadUnlockProgress,
} from "../simulation/engine";
import {
  currencyDisplayPrecision,
  formatCurrencyMagnitude,
} from "../simulation/currency";
import type {
  CareerRoute,
  CausalEvidence,
  DiagnosticUnlockId,
  PipelineMetrics,
  PipelineSlotState,
  RunEndingId,
  SimulationCommand,
  SimulationState,
} from "../simulation/types";
import { TIME_SPEEDS, useSimulation, type TimeSpeed } from "./useSimulation";
import {
  DetailsSurface,
  ItemDetailsDisclosure,
  StatusGauge,
} from "./commandDeck";
import {
  careerGlyph,
  DecorativeGlyph,
  glyphs,
  navigationItems,
  pipelineGlyph,
  workloadGlyph,
} from "./glyphs";

type TabId = "build" | "jobs" | "career" | "upgrades" | "inspect";

interface DragState {
  moduleId: string;
  fromSlotId?: string;
  /** A library card must keep its native horizontal drawer pan until a drag is unambiguous. */
  allowHorizontalPan: boolean;
  x: number;
  y: number;
  originX: number;
  originY: number;
  dropSlotId?: string;
  active: boolean;
}

interface PendingPlacement {
  moduleId: string;
  fromSlotId?: string;
}

interface ModuleDetail {
  moduleId: string;
  fromSlotId?: string;
}

interface SavedPreset {
  id: string;
  name: string;
  slots: readonly PipelineSlotState[];
  hardwareId: string;
  workloadId: string;
  branchEnabled: boolean;
  computeAllocation: number;
  memoryReserve: number;
  activeExpansionId: string | null;
}

const PRESET_KEY = "goldilocks-pipeline-presets-v2";
const LEGACY_PRESET_KEY = "goldilocks-pipeline-presets-v1";
const TUTORIAL_KEY = "goldilocks-quick-start-dismissed-v1";
const TARGET_KEY = "goldilocks-next-useful-target-v1";

interface DeletedPreset {
  preset: SavedPreset;
  index: number;
}

const diagnosticCopy: Readonly<
  Record<DiagnosticUnlockId, { name: string; description: string }>
> = {
  "leakage-warning": {
    name: "Leakage warnings",
    description:
      "Makes repeated public-preview risk explicit. Information only; no production multiplier.",
  },
  "shift-monitor": {
    name: "Shift monitor",
    description:
      "Shows that product evidence may not cover changed inputs. Information only; no production multiplier.",
  },
  "bottleneck-map": {
    name: "Bottleneck map",
    description:
      "Keeps capital commitments beside the active constraint. Information only; no production multiplier.",
  },
  "decision-history": {
    name: "Decision history",
    description:
      "Keeps configuration churn visible across a replay. Information only; no production multiplier.",
  },
  "confidence-intervals": {
    name: "Confidence intervals",
    description:
      "Frames private evidence as bounded confidence rather than a capability guarantee. Information only; no production multiplier.",
  },
};

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function loadUsefulTarget(): string | null {
  try {
    const value = localStorage.getItem(TARGET_KEY);
    if (value === "dismissed") return null;
    return value && modules.some((item) => item.id === value)
      ? value
      : "precision-cleaner";
  } catch {
    return "precision-cleaner";
  }
}

function persistUsefulTarget(targetId: string | null): void {
  try {
    if (targetId === null) localStorage.setItem(TARGET_KEY, "dismissed");
    else localStorage.setItem(TARGET_KEY, targetId);
  } catch {
    // Target choice is advisory; a storage failure must not affect the run.
  }
}

function compatiblePositionCount(
  state: SimulationState,
  placement: PendingPlacement,
): number {
  const module = getModule(placement.moduleId);
  return state.slots.filter(
    (slot) =>
      slot.slotId !== placement.fromSlotId &&
      module.slotTypes.includes(getSlot(slot.slotId).type),
  ).length;
}

function slotAtPoint(x: number, y: number) {
  return document
    .elementsFromPoint(x, y)
    .map((element) => element.closest<HTMLElement>("[data-slot-id]"))
    .find((slot) => slot !== null)?.dataset.slotId;
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
      localStorage.getItem(PRESET_KEY) ??
        localStorage.getItem(LEGACY_PRESET_KEY) ??
        "[]",
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
          (preset.hardwareId !== undefined &&
            (typeof preset.hardwareId !== "string" ||
              !hardware.some((item) => item.id === preset.hardwareId))) ||
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
          ![5, slotSpecs.length].includes(preset.slots.length)
        )
          return false;

        const presetSlots = preset.slots;
        const expected =
          presetSlots.length === 5
            ? ["source", "prepare", "runtime", "verify", "sink"]
            : slotSpecs.map((slot) => slot.id);
        const validSlots = presetSlots.every((value, index) => {
          if (typeof value !== "object" || value === null) return false;
          const slotState = value as Record<string, unknown>;
          const slot = slotSpecs.find(
            (candidate) => candidate.id === expected[index],
          );
          const module =
            slotState.moduleId === null
              ? null
              : modules.find(
                  (candidate) => candidate.id === slotState.moduleId,
                );
          return (
            typeof slotState.slotId === "string" &&
            slotState.slotId === slot?.id &&
            ((slotState.moduleId === null && slot?.type === "process") ||
              (typeof slotState.moduleId === "string" &&
                module != null &&
                slot !== undefined &&
                module.slotTypes.includes(slot.type)))
          );
        });
        if (validSlots) {
          ids.add(preset.id);
          if (preset.hardwareId === undefined)
            (preset as Record<string, unknown>).hardwareId = "bedroom-cpu";
          const activeExpansionId =
            presetSlots.length === slotSpecs.length
              ? "workstation-expansion-i"
              : null;
          if (
            preset.activeExpansionId !== undefined &&
            preset.activeExpansionId !== null &&
            !pipelineExpansions.some(
              (item) => item.id === preset.activeExpansionId,
            )
          )
            return false;
          (preset as Record<string, unknown>).activeExpansionId =
            preset.activeExpansionId ?? activeExpansionId;
        }
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
    localStorage.removeItem(LEGACY_PRESET_KEY);
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
    {
      glyph: glyphs.resource.money,
      label: "Money",
      value: `$${formatNumber(state.resources.money)}`,
    },
    {
      glyph: glyphs.resource.time,
      label: "Sim age",
      value: `${formatNumber(getSimulationAgeHours(state), 1)}h`,
    },
    {
      glyph: glyphs.resource.compute,
      label: "Compute CU",
      value: `${formatNumber((rig.compute * state.computeAllocation) / 100, 1)}/${rig.compute}`,
    },
    {
      glyph: glyphs.resource.memory,
      label: "Memory use",
      value: `${formatNumber(state.metrics.memoryUsed, 1)}/${formatNumber(rig.memory, 1)}GB`,
    },
    {
      glyph: glyphs.resource.reputation,
      label: "Rep",
      value: formatNumber(state.resources.reputation, 1),
    },
  ];
  return (
    <dl className="resource-strip" aria-label="Primary resources">
      {values.map((item) => (
        <div key={item.label}>
          <dt>
            <DecorativeGlyph>{item.glyph}</DecorativeGlyph> {item.label}
          </dt>
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
            Use the bottom Jobs tab, choose an unlocked workload, then queue it.
            Every accepted task keeps its workload identity and queue-time gross
            quote. A successful completion pays that locked quote; the active
            configuration determines actual operating cost. A failed job earns
            no gross payout.
          </p>
          <p className="tutorial-detail">
            Gross per success: Interactive Chat $1.40 · Batch Classification
            $2.00 · Long Document $2.20 · Competition Training $0.20. These are
            fresh-demand launch quotes. Accepted bursts lock falling quotes;
            repeated success saturates one workload, while neglected demand
            recovers with simulated time.
          </p>
        </li>
        <li>
          <strong>
            Read CU, memory, and pressure before changing equipment.
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
          <strong>Earn, compare, buy, then equip or add.</strong>
          <p>
            Open Upgrades to compare price, CU, memory, power, reliability,
            throughput, latency, quality, running cost, and compatibility.
            Successful jobs fund purchases. Buying makes an item owned; it does
            not silently equip it. Equip an owned rig there, or choose an owned
            module's explicit Place in Build action, then choose a highlighted
            compatible Build slot by tap or touch-drag. Every faster or stronger
            option adds a constraint.
          </p>
          <p className="tutorial-detail">
            The cheapest module is reachable within five successful starter
            jobs. A used rig is reachable within fifteen even after that first
            module purchase. Workstation Expansion I is a later capital target:
            buy it once, activate it explicitly, then fill or bypass three new
            positions. It never auto-buys or auto-fills modules.
          </p>
        </li>
        <li>
          <strong>Separate time, animation, pause, and presets.</strong>
          <p>
            Simulation time 1×/4×/16×/64× changes how quickly work advances.
            Every speed uses the same fixed simulation quanta for long
            progression checks. Animations is visual only and never changes
            simulation time. Pause retains both active and waiting work. Jobs
            can clear waiting tasks after confirmation without clearing a
            partially processed active task or changing its locked quote. In
            Inspect, Save current stores the honest pipeline topology; use its
            labeled Delete button, confirm, then Undo if needed.
          </p>
        </li>
      </ol>
    </section>
  );
}

function FirstSessionGuide({ state }: { state: SimulationState }) {
  const guide = state.firstSession;
  if (guide.step === "complete") return null;
  const starterTask = [state.jobs.activeTask, ...state.jobs.waitingTasks].find(
    (task) => task?.id === guide.starterTaskId,
  );
  const content =
    guide.step === "queue-starter"
      ? {
          eyebrow: "First session · step 1 of 3",
          title: "Queue one safe Interactive Chat job",
          body: "Jobs contains the only queue action. Interactive Chat is the reliable starter route; its live quote and cost remain visible before you accept it.",
        }
      : guide.step === "observe-settlement"
        ? {
            eyebrow: "First session · step 2 of 3",
            title: "Observe that job settle",
            body: starterTask
              ? `${getWorkload(starterTask.workloadId).name} ${starterTask.id} is ${state.jobs.activeTask?.id === starterTask.id ? `${Math.round(starterTask.progress * 100)}% complete` : "waiting"}. Its locked quote will settle in Jobs; no follow-up was queued for you.`
              : "The accepted starter job is resolving. Its exact locked quote, cost, and outcome stay in the Jobs settlement record.",
          }
        : {
            eyebrow: "First session · step 3 of 3",
            title: "Buy and explicitly install one meaningful module",
            body: guide.purchasedModuleId
              ? `${getModule(guide.purchasedModuleId).name} is owned. Use its named Place in Build action; purchase never equips it automatically.`
              : "The settlement is recorded. Use the bottom Upgrades tab to compare a paid module, then place it explicitly in a compatible Build position.",
          };
  return (
    <section
      className="first-session-guide"
      aria-live="polite"
      aria-labelledby="first-session-guide-title"
      data-testid="first-session-guide"
    >
      <span className="eyebrow">{content.eyebrow}</span>
      <h2 id="first-session-guide-title">{content.title}</h2>
      <p>{content.body}</p>
    </section>
  );
}

function WarningBanner({ state }: { state: SimulationState }) {
  const rig = getHardware(state.hardwareId);
  const workload = getWorkload(
    state.jobs.activeTask?.workloadId ?? state.workloadId,
  );
  const reserveGb = rig.memory - state.metrics.memoryAvailable;
  const canLowerReserve = state.memoryReserve > 0;
  const canUseLighterModule = state.slots.some((slotState) => {
    if (!slotState.moduleId) return false;
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
  } else if (state.metrics.orderWarnings.includes("no model stage")) {
    guidance =
      "Add an owned model module to an empty compatible process position, or move one back into the active graph. A pipeline without a model cannot produce an answer: accepted tasks fail and pay $0 gross.";
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
      <DecorativeGlyph>
        {nominal ? glyphs.status.passed : glyphs.status.warning}
      </DecorativeGlyph>
      <div>
        <strong>{state.lastWarning}</strong>
        <details>
          <summary>Warning details and valid responses</summary>
          <p>{guidance}</p>
          <p className="navigation-hint">
            Use the bottom tabs for Build, Jobs, Career, Upgrades, and Inspect.
          </p>
        </details>
      </div>
    </aside>
  );
}

function SecondaryControls({
  state,
  timeSpeed,
  onTimeSpeedChange,
}: {
  state: SimulationState;
  timeSpeed: TimeSpeed;
  onTimeSpeedChange: (speed: number) => void;
}) {
  return (
    <div className="secondary-controls">
      <TimeSpeedControl value={timeSpeed} onChange={onTimeSpeedChange} />
      <WarningBanner state={state} />
    </div>
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
  owned = true,
  equipped = false,
  onSelect,
  onDragStart,
  onLocked,
}: {
  moduleId: string;
  slotId?: string;
  selected: boolean;
  owned?: boolean;
  equipped?: boolean;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
  onLocked?: () => void;
}) {
  const module = getModule(moduleId);
  const status = equipped
    ? "EQUIPPED"
    : owned
      ? "OWNED · DETAILS / DRAG"
      : `LOCKED · BUY $${module.purchaseCost.toFixed(2)}`;
  return (
    <button
      type="button"
      className={`module-card ${selected ? "selected" : ""} ${owned ? "owned" : "locked"}`}
      aria-pressed={selected}
      aria-label={`${module.name}. ${status}. ${module.description}`}
      data-module-id={module.id}
      onClick={() => (owned ? onSelect(module.id, slotId) : onLocked?.())}
      onPointerDown={(event) => {
        if (owned) onDragStart(event, module.id, slotId);
      }}
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
        <span className="module-status">{status}</span>
      </span>
      <span className="drag-grip" aria-hidden="true">
        ⠿
      </span>
    </button>
  );
}

function Pipeline({
  state,
  selected,
  detail,
  onOpenDetails,
  onCloseDetails,
  onBeginPlacement,
  onDragStart,
  onInstall,
  command,
  reducedMotion,
}: {
  state: SimulationState;
  selected: PendingPlacement | null;
  detail: ModuleDetail | null;
  onOpenDetails: (moduleId: string, fromSlotId?: string) => void;
  onCloseDetails: () => void;
  onBeginPlacement: (moduleId: string, fromSlotId?: string) => void;
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

      <div className="dispatch-strip" aria-label="Live dispatch">
        <span>
          <DecorativeGlyph>{glyphs.status.active}</DecorativeGlyph>
          {state.jobs.activeTask
            ? getWorkload(state.jobs.activeTask.workloadId).name
            : "Awaiting dispatch"}
        </span>
        <span>
          {state.jobs.activeTask
            ? `${Math.round(state.jobs.activeTask.progress * 100)}%`
            : "0%"}
        </span>
        <span>{state.jobs.queued} queued</span>
        <span>{getSlot(state.metrics.bottleneckSlotId).name}</span>
      </div>
      {state.activeExpansionId ? (
        <p className="pipeline-scroll-hint">
          Expanded: 8 stages. Process 4–6 and Output remain in this same ordered
          rail; page scroll reaches every position.
        </p>
      ) : null}
      <ol
        className={`pipeline ${reducedMotion ? "still" : ""}`}
        data-testid="pipeline"
        aria-label={`${state.slots.length} stage ordered pipeline`}
      >
        {state.slots.map((slotState, index) => {
          const slot = getSlot(slotState.slotId);
          const module = slotState.moduleId
            ? getModule(slotState.moduleId)
            : null;
          const compatible = selected
            ? module?.id !== selected.moduleId &&
              getModule(selected.moduleId).slotTypes.includes(slot.type)
            : false;
          const failed = failureIndex === index;
          const propagated = failureIndex >= 0 && index > failureIndex;
          return (
            <li className="pipeline-stage-group" key={slot.id}>
              <div
                className={`pipeline-slot ${compatible ? "compatible" : ""} ${failed ? "failed" : ""} ${propagated ? "propagated" : ""}`}
                data-slot-id={slot.id}
                data-testid={`slot-${slot.id}`}
              >
                <div className="slot-meta">
                  <span>
                    <b>{index + 1}</b> ·{" "}
                    <DecorativeGlyph>
                      {pipelineGlyph(module?.role ?? "empty", slot.type)}
                    </DecorativeGlyph>{" "}
                    {slot.name}
                  </span>
                  {state.jobs.queued > 0 && slot.id === queueSlot ? (
                    <span
                      className="queue-badge"
                      aria-label={`${state.jobs.queued} jobs queued at bottleneck`}
                    >
                      Q {state.jobs.queued}
                    </span>
                  ) : null}
                </div>
                {module ? (
                  <>
                    <ModuleCard
                      moduleId={module.id}
                      slotId={slot.id}
                      equipped
                      selected={
                        selected?.moduleId === module.id &&
                        selected.fromSlotId === slot.id
                      }
                      onSelect={onOpenDetails}
                      onDragStart={onDragStart}
                    />
                  </>
                ) : (
                  <div className="empty-module" role="status">
                    <strong>
                      <DecorativeGlyph>{glyphs.pipeline.empty}</DecorativeGlyph>{" "}
                      Empty / bypassed
                    </strong>
                    <small>
                      No memory, latency, cost, or processing effect.
                    </small>
                  </div>
                )}
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
                  <span className="failure-label">✕ FAULT ORIGIN</span>
                ) : null}
                {propagated ? (
                  <span className="failure-label">✕ OUTPUT REJECTED</span>
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
            </li>
          );
        })}
      </ol>
      {detail?.fromSlotId ? (
        <DetailsSurface
          title={getModule(detail.moduleId).name}
          glyph={pipelineGlyph(getModule(detail.moduleId).role, "process")}
          onClose={onCloseDetails}
        >
          <p>{getModule(detail.moduleId).description}</p>
          <dl className="compact-details-grid">
            <div>
              <dt>Throughput</dt>
              <dd>{getModule(detail.moduleId).throughput}/m</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{getModule(detail.moduleId).memory} GB</dd>
            </div>
            <div>
              <dt>Reliability</dt>
              <dd>
                {formatNumber(getModule(detail.moduleId).reliability * 100, 1)}%
              </dd>
            </div>
            <div>
              <dt>Operating cost</dt>
              <dd>${getModule(detail.moduleId).costPerJob.toFixed(3)}/job</dd>
            </div>
          </dl>
          <p>
            Details do not change the pipeline. Start placement explicitly to
            highlight compatible positions and inspect the resulting deltas.
          </p>
          <button
            type="button"
            className="equip-action"
            onClick={() => onBeginPlacement(detail.moduleId, detail.fromSlotId)}
          >
            Place {getModule(detail.moduleId).name} in Build
          </button>
          <button
            type="button"
            className="danger-action"
            aria-label={`Remove ${getModule(detail.moduleId).name} from ${getSlot(detail.fromSlotId).name} and bypass position`}
            onClick={() => {
              command({ type: "REMOVE_MODULE", slotId: detail.fromSlotId! });
              onCloseDetails();
            }}
          >
            Remove / bypass {getSlot(detail.fromSlotId).name}
          </button>
        </DetailsSurface>
      ) : null}
    </section>
  );
}

function ModuleLibrary({
  state,
  selected,
  detail,
  onOpenDetails,
  onCloseDetails,
  onBeginPlacement,
  onDragStart,
}: {
  state: SimulationState;
  selected: PendingPlacement | null;
  detail: ModuleDetail | null;
  onOpenDetails: (moduleId: string, fromSlotId?: string) => void;
  onCloseDetails: () => void;
  onBeginPlacement: (moduleId: string, fromSlotId?: string) => void;
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
          <h2 id="library-title">Inspect, then place in a slot</h2>
          <p className="section-note">
            Text labels show locked, owned, and equipped state. Locked cards
            require purchase in the bottom Upgrades tab; tap opens details,
            while touch-drag starts explicit placement.
          </p>
        </div>
      </div>
      <div className="module-library">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            moduleId={module.id}
            selected={selected?.moduleId === module.id && !selected.fromSlotId}
            owned={state.ownedModuleIds.includes(module.id)}
            equipped={state.slots.some((slot) => slot.moduleId === module.id)}
            onSelect={onOpenDetails}
            onDragStart={onDragStart}
          />
        ))}
      </div>
      {detail && !detail.fromSlotId ? (
        <DetailsSurface
          title={getModule(detail.moduleId).name}
          glyph={pipelineGlyph(getModule(detail.moduleId).role, "process")}
          onClose={onCloseDetails}
        >
          <p>{getModule(detail.moduleId).description}</p>
          <dl className="compact-details-grid">
            <div>
              <dt>Compatibility</dt>
              <dd>{getModule(detail.moduleId).slotTypes.join("/")}</dd>
            </div>
            <div>
              <dt>Throughput</dt>
              <dd>{getModule(detail.moduleId).throughput}/m</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{getModule(detail.moduleId).memory} GB</dd>
            </div>
            <div>
              <dt>Reliability</dt>
              <dd>
                {formatNumber(getModule(detail.moduleId).reliability * 100, 1)}%
              </dd>
            </div>
          </dl>
          {state.ownedModuleIds.includes(detail.moduleId) ? (
            <button
              type="button"
              className="equip-action"
              onClick={() => onBeginPlacement(detail.moduleId)}
            >
              Place {getModule(detail.moduleId).name} in Build
            </button>
          ) : (
            <p className="purchase-reason">
              This module is locked. Details are informational; buy it in
              Upgrades before placement is available.
            </p>
          )}
        </DetailsSurface>
      ) : null}
    </section>
  );
}

function PlacementTray({
  state,
  placement,
  onCancel,
}: {
  state: SimulationState;
  placement: PendingPlacement | null;
  onCancel: () => void;
}) {
  if (!placement) return null;
  const module = getModule(placement.moduleId);
  const compatible = compatiblePositionCount(state, placement);
  return (
    <aside className="placement-tray" role="status" aria-live="polite">
      <div>
        <span className="eyebrow">Placement ready</span>
        <strong>Place {module.name}</strong>
        <small>
          {compatible} compatible position{compatible === 1 ? "" : "s"} · choose
          Snap here or complete a touch-drag.
        </small>
      </div>
      <button type="button" onClick={onCancel}>
        Cancel placement
      </button>
    </aside>
  );
}

function BuildView({
  state,
  command,
  selected,
  detail,
  onOpenDetails,
  onCloseDetails,
  onBeginPlacement,
  onCancelPlacement,
  onDragStart,
  onInstall,
  reducedMotion,
  secondaryControls,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  selected: PendingPlacement | null;
  detail: ModuleDetail | null;
  onOpenDetails: (moduleId: string, fromSlotId?: string) => void;
  onCloseDetails: () => void;
  onBeginPlacement: (moduleId: string, fromSlotId?: string) => void;
  onCancelPlacement: () => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
  onInstall: (slotId: string) => void;
  reducedMotion: boolean;
  secondaryControls: ReactNode;
}) {
  const [presentation, setPresentation] = useState<"build" | "run">("build");
  const expansion = pipelineExpansions[0];
  const expansionOwned = expansion
    ? state.ownedExpansionIds.includes(expansion.id)
    : false;
  const objective = !expansionOwned
    ? `Fund ${expansion?.name ?? "pipeline expansion"}`
    : state.activeExpansionId
      ? "Configure six process positions"
      : "Activate the owned expansion";
  const objectiveProgress = !expansionOwned
    ? Math.min(
        100,
        (state.resources.money / (expansion?.purchaseCost ?? 1)) * 100,
      )
    : state.activeExpansionId
      ? Math.min(
          100,
          (state.slots.filter(
            (slot) => getSlot(slot.slotId).type === "process" && slot.moduleId,
          ).length /
            6) *
            100,
        )
      : 0;
  return (
    <>
      <section
        className="mission-card"
        aria-label="Current objective and bottleneck"
      >
        <div>
          <span className="eyebrow">Current objective</span>
          <strong>{objective}</strong>
          <div
            className="progress-track"
            aria-label={`${Math.round(objectiveProgress)} percent of current objective`}
          >
            <span
              style={{
                width: `${objectiveProgress}%`,
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
        <div
          className="presentation-toggle"
          role="group"
          aria-label="Pipeline presentation"
        >
          <button
            type="button"
            aria-pressed={presentation === "build"}
            aria-label="Edit pipeline presentation"
            onClick={() => setPresentation("build")}
          >
            🛠️ Edit
          </button>
          <button
            type="button"
            aria-pressed={presentation === "run"}
            onClick={() => setPresentation("run")}
          >
            ▶ Run
          </button>
        </div>
      </section>
      <Pipeline
        state={state}
        command={command}
        selected={presentation === "build" ? selected : null}
        detail={presentation === "build" ? detail : null}
        onOpenDetails={
          presentation === "build" ? onOpenDetails : () => undefined
        }
        onCloseDetails={
          presentation === "build" ? onCloseDetails : () => undefined
        }
        onBeginPlacement={
          presentation === "build" ? onBeginPlacement : () => undefined
        }
        onDragStart={presentation === "build" ? onDragStart : () => undefined}
        onInstall={presentation === "build" ? onInstall : () => undefined}
        reducedMotion={reducedMotion}
      />
      {secondaryControls}
      {presentation === "build" ? (
        <>
          <PlacementTray
            state={state}
            placement={selected}
            onCancel={onCancelPlacement}
          />
          <ModuleLibrary
            state={state}
            selected={selected}
            detail={detail}
            onOpenDetails={onOpenDetails}
            onCloseDetails={onCloseDetails}
            onBeginPlacement={onBeginPlacement}
            onDragStart={onDragStart}
          />
        </>
      ) : (
        <p className="observation-note">
          <DecorativeGlyph>{glyphs.resource.evidence}</DecorativeGlyph>{" "}
          Observation presentation: worker progress, queue, stage state, and
          settlement feedback remain live. Return to Build to edit the rail.
        </p>
      )}
    </>
  );
}

function MoneyLoop({
  state,
  reducedMotion,
  targetId,
  onTargetChange,
}: {
  state: SimulationState;
  reducedMotion: boolean;
  targetId: string | null;
  onTargetChange: (targetId: string | null) => void;
}) {
  const workload = getWorkload(state.workloadId);
  const quote = getWorkloadQuote(state, workload.id);
  const offerMetrics = calculateMetrics({
    ...state,
    workloadId: workload.id,
  });
  const offer = estimateWorkloadOffer(offerMetrics, quote);
  const settlement = state.lastSettlement;
  const settlementNet = settlement
    ? settlement.grossPayout - settlement.operatingCost
    : 0;
  const settlementPaidCost = settlement
    ? Math.max(
        0,
        Math.min(
          settlement.operatingCost,
          settlement.grossPayout - settlement.netChange,
        ),
      )
    : 0;
  const settlementUnpaidCost = settlement
    ? Math.max(0, settlement.operatingCost - settlementPaidCost)
    : 0;
  const settlementCurrencyPrecision = currencyDisplayPrecision(
    settlement
      ? [
          settlement.lockedGrossQuote,
          settlement.grossPayout,
          settlement.operatingCost,
          settlementNet,
          settlementPaidCost,
          settlementUnpaidCost,
        ]
      : [],
  );
  const settlementCurrency = (amount: number) =>
    formatCurrencyMagnitude(amount, settlementCurrencyPrecision);
  const targetOptions = modules
    .filter(
      (item) =>
        item.purchaseCost > 0 && !state.ownedModuleIds.includes(item.id),
    )
    .sort((left, right) => left.purchaseCost - right.purchaseCost);
  const target = targetOptions.find((item) => item.id === targetId) ?? null;
  const celebration =
    settlement?.completed === 1 && [1, 5, 12].includes(state.jobs.completed)
      ? state.jobs.completed === 1
        ? "First successful delivery recorded — no bonus applied."
        : state.jobs.completed === 5
          ? "Five successful deliveries recorded — no bonus applied."
          : "Twelve successful deliveries recorded — no bonus applied."
      : null;
  const failureEvent =
    settlement?.failed === 1
      ? [...state.ledger].reverse().find((event) => event.kind === "failure")
      : null;
  const recoveryQuote = settlement
    ? getWorkloadQuote(state, settlement.workloadId)
    : null;
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
          <span className="eyebrow">Selected-work live quote</span>
          <h3 id="money-loop-title">{workload.name}</h3>
          <p>
            ${quote.grossQuote.toFixed(2)} gross if accepted now · $
            {formatNumber(offerMetrics.operatingCost, 3)} estimated operating
            cost · {offer.expectedNet >= 0 ? "+" : "−"}$
            {Math.abs(offer.expectedNet).toFixed(2)} expected net at{" "}
            {Math.round(offerMetrics.reliability * 100)}% modeled delivery.
            Demand {quote.demandPercent}% · {quote.trend}.{" "}
            {offer.guaranteedFailure
              ? "Guaranteed failure in this configuration: $0 expected gross."
              : "Failed jobs receive $0 gross."}
          </p>
          <small>
            {quote.reason} Actual cost is locked only by the configuration that
            completes the task.
          </small>
        </div>
        <div
          className={`settlement ${settlement?.failed ? "failure" : ""} ${celebration ? "settlement-pulse" : ""}`}
          aria-live="polite"
        >
          <span className="eyebrow">Latest settlement</span>
          {settlement ? (
            <>
              <strong className={settlementNet < 0 ? "bad" : "good"}>
                {settlementNet >= 0 ? "+" : "−"}$
                {settlementCurrency(settlementNet)} net
              </strong>
              <small>
                {getWorkload(settlement.workloadId).name} · task{" "}
                {settlement.taskId} · $
                {settlementCurrency(settlement.lockedGrossQuote)} locked gross ·{" "}
                {settlement.completed} paid · {settlement.failed} failed · $
                {settlementCurrency(settlement.grossPayout)} settled gross − $
                {settlementCurrency(settlement.operatingCost)} configured actual
                costs
                {settlementUnpaidCost > 0
                  ? ` · $${settlementCurrency(settlementPaidCost)} paid · $${settlementCurrency(settlementUnpaidCost)} unpaid because cash cannot go below $0`
                  : " · paid in full"}
                {settlementCurrencyPrecision === 3
                  ? " · Three decimals shown to preserve sub-cent accounting."
                  : ""}
              </small>
              {celebration ? (
                <p className="settlement-recognition">
                  {celebration}
                  {reducedMotion
                    ? " Recorded immediately (reduced motion)."
                    : ""}
                </p>
              ) : null}
              {settlement.failed ? (
                <p className="settlement-recovery">
                  <strong>Failure record:</strong>{" "}
                  {failureEvent?.directCause ??
                    "Delivery did not clear the modeled reliability check."}{" "}
                  Gross $0; configured cost remains visible above. Recovery
                  forecast: {recoveryQuote?.trend ?? "steady"} quote $
                  {recoveryQuote?.grossQuote.toFixed(2) ?? "0.00"} after time
                  recovery. No recovery action was applied.
                </p>
              ) : null}
            </>
          ) : (
            <strong>No payout yet — queue a job.</strong>
          )}
        </div>
      </div>
      <section className="next-target" aria-label="Next useful target">
        <div>
          <span className="eyebrow">Next useful target</span>
          {target ? (
            <strong>
              {target.name} · ${target.purchaseCost.toFixed(2)} ·{" "}
              {state.resources.money >= target.purchaseCost
                ? "affordable now"
                : `$${(target.purchaseCost - state.resources.money).toFixed(2)} remaining`}
            </strong>
          ) : targetOptions.length ? (
            <strong>No target selected</strong>
          ) : (
            <strong>All paid modules owned</strong>
          )}
        </div>
        {targetOptions.length ? (
          <div className="target-controls">
            <label>
              <span className="visually-hidden">Next useful target</span>
              <select
                value={targetId ?? ""}
                onChange={(event) =>
                  onTargetChange(event.currentTarget.value || null)
                }
              >
                <option value="">No target</option>
                {targetOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · ${item.purchaseCost.toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
            {target ? (
              <button type="button" onClick={() => onTargetChange(null)}>
                Dismiss target
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
      <p className="earnings-total">
        Run totals: ${state.jobs.grossEarned.toFixed(2)} gross earned · $
        {state.jobs.operatingCostsPaid.toFixed(2)} operating costs paid.
      </p>
    </section>
  );
}

function UpgradeFeedback({ state }: { state: SimulationState }) {
  if (!state.lastUpgradeNotice) return null;
  return (
    <div
      className={`upgrade-feedback ${state.lastUpgradeNotice.kind}`}
      role="status"
      aria-label="Latest upgrade action"
    >
      <strong>Upgrade result</strong>
      <span>{state.lastUpgradeNotice.message}</span>
    </div>
  );
}

function UpgradeRoute() {
  return (
    <div className="upgrade-route" aria-label="Upgrade journey">
      <span>Money</span>
      <span aria-hidden="true">→</span>
      <span>Compare</span>
      <span aria-hidden="true">→</span>
      <span>Cost</span>
      <span aria-hidden="true">→</span>
      <span>Buy</span>
      <span aria-hidden="true">→</span>
      <span>Owned</span>
      <span aria-hidden="true">→</span>
      <span>Equip / add</span>
      <span aria-hidden="true">→</span>
      <span>Observe Δ</span>
    </div>
  );
}

function RigUpgradeCard({
  state,
  hardwareId,
  command,
  detailOpen,
  onOpenDetails,
  onCloseDetails,
}: {
  state: SimulationState;
  hardwareId: string;
  command: (command: SimulationCommand) => void;
  detailOpen: boolean;
  onOpenDetails: () => void;
  onCloseDetails: () => void;
}) {
  const item = getHardware(hardwareId);
  const equipped = state.hardwareId === item.id;
  const owned = state.ownedHardwareIds.includes(item.id);
  const timeReady =
    getSimulationAgeHours(state) >= (item.availableAfterHour ?? 0);
  const affordable = state.resources.money >= item.purchaseCost && timeReady;
  const current = getHardware(state.hardwareId);
  const reasonId = `rig-reason-${item.id}`;
  return (
    <article
      className={`upgrade-card ${equipped ? "equipped" : owned ? "owned" : "locked"}`}
      aria-labelledby={`rig-title-${item.id}`}
    >
      <div className="upgrade-card-heading">
        <div>
          <span className="equipment-state">
            {equipped
              ? "EQUIPPED"
              : owned
                ? "OWNED"
                : affordable
                  ? "AFFORDABLE"
                  : !timeReady
                    ? `LOCKED · HOUR ${item.availableAfterHour}`
                    : "LOCKED · INSUFFICIENT FUNDS"}
          </span>
          <h3 id={`rig-title-${item.id}`}>
            <DecorativeGlyph>{glyphs.equipment.rig}</DecorativeGlyph>{" "}
            {item.name}
          </h3>
        </div>
        <strong className="upgrade-price">
          {item.purchaseCost === 0
            ? "STARTER"
            : `$${item.purchaseCost.toFixed(2)}`}
        </strong>
      </div>
      <p>{item.description}</p>
      <p
        className="decision-deltas"
        aria-label={`Key comparison with equipped ${current.name}`}
      >
        <span>
          {item.compute - current.compute >= 0 ? "+" : ""}
          {item.compute - current.compute} CU
        </span>
        <span>
          {item.memory - current.memory >= 0 ? "+" : ""}
          {item.memory - current.memory} GB
        </span>
        <span>
          {item.watts - current.watts >= 0 ? "+" : ""}
          {item.watts - current.watts} W
        </span>
      </p>
      <ItemDetailsDisclosure
        summary="Compare rig details and tradeoffs"
        title={item.name}
        open={detailOpen}
        onOpen={onOpenDetails}
        onClose={onCloseDetails}
      >
        <dl className="stat-grid">
          <div>
            <dt>Compute</dt>
            <dd>{item.compute} CU</dd>
          </div>
          <div>
            <dt>Memory</dt>
            <dd>{item.memory} GB</dd>
          </div>
          <div>
            <dt>Power / heat</dt>
            <dd>
              {item.watts} W · {item.thermalLimit} limit
            </dd>
          </div>
          <div>
            <dt>Reliability</dt>
            <dd>{formatNumber(item.reliability * 100, 1)}%</dd>
          </div>
          <div>
            <dt>Maintenance</dt>
            <dd>${item.maintenance.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Versus equipped</dt>
            <dd>
              {item.compute - current.compute >= 0 ? "+" : ""}
              {item.compute - current.compute} CU ·{" "}
              {item.memory - current.memory >= 0 ? "+" : ""}
              {item.memory - current.memory} GB ·{" "}
              {item.watts - current.watts >= 0 ? "+" : ""}
              {item.watts - current.watts} W
            </dd>
          </div>
        </dl>
      </ItemDetailsDisclosure>
      {!owned ? (
        <button
          type="button"
          className="purchase-action"
          disabled={!affordable}
          aria-describedby={reasonId}
          onClick={() => command({ type: "BUY_HARDWARE", hardwareId: item.id })}
        >
          Buy {item.name} for ${item.purchaseCost.toFixed(2)}
        </button>
      ) : equipped ? (
        <button type="button" className="owned-action" disabled>
          Equipped now
        </button>
      ) : (
        <button
          type="button"
          className="equip-action"
          onClick={() =>
            command({ type: "EQUIP_HARDWARE", hardwareId: item.id })
          }
        >
          Equip {item.name}
        </button>
      )}
      <p id={reasonId} className="purchase-reason">
        {owned
          ? equipped
            ? "Its CU, memory, power, reliability, and running cost are active."
            : "Owned permanently for this run; equipping does not charge again."
          : affordable
            ? "Affordable now. Buying creates ownership; equipping is a separate choice."
            : !timeReady
              ? `Need $${Math.max(0, item.purchaseCost - state.resources.money).toFixed(2)} more at current funds. Order window opens at simulated hour ${item.availableAfterHour}; current age ${getSimulationAgeHours(state).toFixed(1)}h. Money alone cannot bypass this catalogue pacing gate.`
              : `Need $${(item.purchaseCost - state.resources.money).toFixed(2)} more. Queue successful jobs; no partial or duplicate deduction occurs.`}
      </p>
    </article>
  );
}

function ModuleUpgradeCard({
  state,
  moduleId,
  command,
  onChoose,
  detailOpen,
  onOpenDetails,
  onCloseDetails,
}: {
  state: SimulationState;
  moduleId: string;
  command: (command: SimulationCommand) => void;
  onChoose: (moduleId: string) => void;
  detailOpen: boolean;
  onOpenDetails: () => void;
  onCloseDetails: () => void;
}) {
  const item = getModule(moduleId);
  const owned = state.ownedModuleIds.includes(item.id);
  const equipped = state.slots.some((slot) => slot.moduleId === item.id);
  const affordable = state.resources.money >= item.purchaseCost;
  const comparison = state.slots
    .flatMap((slot) => (slot.moduleId ? [getModule(slot.moduleId)] : []))
    .find((candidate) => candidate.role === item.role);
  const reasonId = `module-reason-${item.id}`;
  return (
    <article
      className={`upgrade-card ${equipped ? "equipped" : owned ? "owned" : "locked"}`}
      aria-labelledby={`module-title-${item.id}`}
    >
      <div className="upgrade-card-heading">
        <div>
          <span className="equipment-state">
            {equipped
              ? "EQUIPPED"
              : owned
                ? "OWNED"
                : affordable
                  ? "AFFORDABLE"
                  : "LOCKED · INSUFFICIENT FUNDS"}
          </span>
          <h3 id={`module-title-${item.id}`}>
            <DecorativeGlyph>
              {pipelineGlyph(item.role, "process")}
            </DecorativeGlyph>{" "}
            {item.name}
          </h3>
        </div>
        <strong className="upgrade-price">
          ${item.purchaseCost.toFixed(2)}
        </strong>
      </div>
      <p>{item.description}</p>
      {comparison ? (
        <p
          className="decision-deltas"
          aria-label={`Key comparison with ${comparison.name}`}
        >
          <span>
            {item.throughput - comparison.throughput >= 0 ? "+" : ""}
            {formatNumber(item.throughput - comparison.throughput, 1)}/m
          </span>
          <span>
            {item.memory - comparison.memory >= 0 ? "+" : ""}
            {formatNumber(item.memory - comparison.memory, 1)} GB
          </span>
          <span>
            {item.costPerJob - comparison.costPerJob >= 0 ? "+" : ""}$
            {formatNumber(item.costPerJob - comparison.costPerJob, 3)}/job
          </span>
        </p>
      ) : null}
      <ItemDetailsDisclosure
        summary="Compare module details and tradeoffs"
        title={item.name}
        open={detailOpen}
        onOpen={onOpenDetails}
        onClose={onCloseDetails}
      >
        <dl className="stat-grid module-stats">
          <div>
            <dt>Compatibility</dt>
            <dd>
              {item.role} · {item.slotTypes.join("/")}
            </dd>
          </div>
          <div>
            <dt>Throughput</dt>
            <dd>{item.throughput}/m</dd>
          </div>
          <div>
            <dt>Latency</dt>
            <dd>{item.latency}s</dd>
          </div>
          <div>
            <dt>Memory</dt>
            <dd>{item.memory} GB</dd>
          </div>
          <div>
            <dt>Quality</dt>
            <dd>+{item.quality}</dd>
          </div>
          <div>
            <dt>Reliability</dt>
            <dd>{formatNumber(item.reliability * 100, 1)}%</dd>
          </div>
          <div>
            <dt>Observability</dt>
            <dd>{formatNumber(item.observability * 100)}%</dd>
          </div>
          <div>
            <dt>Operating cost</dt>
            <dd>${item.costPerJob.toFixed(3)}/job</dd>
          </div>
        </dl>
        {comparison ? (
          <p className="comparison-copy">
            Versus equipped {comparison.name}:{" "}
            {item.throughput - comparison.throughput >= 0 ? "+" : ""}
            {formatNumber(item.throughput - comparison.throughput, 1)}/m
            throughput · {item.memory - comparison.memory >= 0 ? "+" : ""}
            {formatNumber(item.memory - comparison.memory, 1)} GB ·{" "}
            {item.quality - comparison.quality >= 0 ? "+" : ""}
            {item.quality - comparison.quality} quality ·{" "}
            {item.costPerJob - comparison.costPerJob >= 0 ? "+" : ""}$
            {formatNumber(item.costPerJob - comparison.costPerJob, 3)}/job.
          </p>
        ) : null}
      </ItemDetailsDisclosure>
      {!owned ? (
        <button
          type="button"
          className="purchase-action"
          disabled={!affordable}
          aria-describedby={reasonId}
          onClick={() => command({ type: "BUY_MODULE", moduleId: item.id })}
        >
          Buy {item.name} for ${item.purchaseCost.toFixed(2)}
        </button>
      ) : (
        <button
          type="button"
          className="equip-action"
          onClick={() => onChoose(item.id)}
        >
          Place {item.name} in Build
        </button>
      )}
      <p id={reasonId} className="purchase-reason">
        {owned
          ? "Owned permanently for this run. Details stay informational; Place in Build is the explicit handoff that highlights compatible targets."
          : affordable
            ? "Affordable now. Buy once, then add it from Build."
            : `Need $${(item.purchaseCost - state.resources.money).toFixed(2)} more. Its cost and tradeoffs remain visible while locked.`}
      </p>
    </article>
  );
}

function PipelineExpansionCard({
  state,
  command,
  detailOpen,
  onOpenDetails,
  onCloseDetails,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  detailOpen: boolean;
  onOpenDetails: () => void;
  onCloseDetails: () => void;
}) {
  const spec = getPipelineExpansion("workstation-expansion-i");
  const owned = state.ownedExpansionIds.includes(spec.id);
  const active = state.activeExpansionId === spec.id;
  const affordable = state.resources.money >= spec.purchaseCost;
  const occupiedExtra = state.slots.some(
    (slot) => slot.slotId.startsWith("process-") && slot.moduleId !== null,
  );
  return (
    <article
      className={`upgrade-card expansion-card ${active ? "equipped" : owned ? "owned" : "locked"}`}
      aria-labelledby="expansion-title"
    >
      <div className="upgrade-card-heading">
        <div>
          <span className="equipment-state">
            {active
              ? "ACTIVE · 6 PROCESS POSITIONS"
              : owned
                ? "OWNED · READY TO ACTIVATE"
                : affordable
                  ? "AFFORDABLE"
                  : "LOCKED · INSUFFICIENT FUNDS"}
          </span>
          <h3 id="expansion-title">
            <DecorativeGlyph>{glyphs.equipment.expansion}</DecorativeGlyph>{" "}
            {spec.name}
          </h3>
        </div>
        <strong className="upgrade-price">
          ${spec.purchaseCost.toFixed(2)}
        </strong>
      </div>
      <div className="capacity-route" aria-label="Pipeline capacity change">
        <span>3 process positions</span>
        <span aria-hidden="true">→</span>
        <strong>6 process positions</strong>
      </div>
      <div
        className="empty-position-symbols"
        aria-label="Three new empty bypassed positions"
      >
        <span>◇ 4 · EMPTY</span>
        <span>◇ 5 · EMPTY</span>
        <span>◇ 6 · EMPTY</span>
      </div>
      <ItemDetailsDisclosure
        summary="Compare expansion details and tradeoffs"
        title={spec.name}
        open={detailOpen}
        onOpen={onOpenDetails}
        onClose={onCloseDetails}
      >
        <p>{spec.description}</p>
        <p>{spec.tradeoff}</p>
        <p className="purchase-reason">
          Three new positions begin empty/bypassed. Purchase never buys, clones,
          or auto-fills a module. Owned modules remain movable across all active
          compatible positions.
        </p>
      </ItemDetailsDisclosure>
      {!owned ? (
        <button
          type="button"
          className="purchase-action"
          disabled={!affordable}
          onClick={() =>
            command({ type: "BUY_EXPANSION", expansionId: spec.id })
          }
        >
          Buy {spec.name} for ${spec.purchaseCost.toFixed(2)}
        </button>
      ) : !active ? (
        <button
          type="button"
          className="equip-action"
          onClick={() =>
            command({ type: "SET_EXPANSION_ACTIVE", active: true })
          }
        >
          Activate six-position pipeline
        </button>
      ) : (
        <button
          type="button"
          className="owned-action"
          disabled={occupiedExtra}
          onClick={() =>
            command({ type: "SET_EXPANSION_ACTIVE", active: false })
          }
        >
          {occupiedExtra
            ? "Empty Process 4–6 to deactivate"
            : "Return to starter capacity"}
        </button>
      )}
      {!owned ? (
        <p className="purchase-reason">
          ${Math.min(state.resources.money, spec.purchaseCost).toFixed(2)} / $
          {spec.purchaseCost.toFixed(2)} funded ·{" "}
          {Math.round(
            Math.min(100, (state.resources.money / spec.purchaseCost) * 100),
          )}
          %
        </p>
      ) : null}
    </article>
  );
}

function UpgradesView({
  state,
  command,
  onChooseModule,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  onChooseModule: (moduleId: string) => void;
}) {
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(
    `rig:${state.hardwareId}`,
  );
  const detailProps = (id: string) => ({
    detailOpen: selectedDetailId === id,
    onOpenDetails: () => setSelectedDetailId(id),
    onCloseDetails: () => setSelectedDetailId(null),
  });
  return (
    <>
      <section className="panel store-intro" aria-labelledby="upgrades-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Persistent equipment economy</span>
            <h2 id="upgrades-title">Upgrades</h2>
          </div>
          <strong className="store-money">
            ${state.resources.money.toFixed(2)} available
          </strong>
        </div>
        <UpgradeRoute />
        <p>
          Successful settlements fund equipment. Prices deduct exactly once;
          ownership survives reload and offline play. Compare the equipped item
          before buying: every option trades capability for power, memory,
          latency, reliability, observability, or operating cost.
        </p>
      </section>
      <section className="panel" aria-labelledby="pipeline-store-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Single-pipeline capacity</span>
            <h2 id="pipeline-store-title">Workstation expansion</h2>
          </div>
        </div>
        <PipelineExpansionCard
          state={state}
          command={command}
          {...detailProps("expansion:workstation-expansion-i")}
        />
      </section>
      <section className="panel" aria-labelledby="rig-store-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Capacity with consequences</span>
            <h2 id="rig-store-title">Rigs</h2>
          </div>
        </div>
        <div className="upgrade-list">
          {[...hardware]
            .sort((a, b) => {
              const rank = (id: string, cost: number) =>
                state.ownedHardwareIds.includes(id)
                  ? 0
                  : cost <= state.resources.money
                    ? 1
                    : 2;
              return (
                rank(a.id, a.purchaseCost) - rank(b.id, b.purchaseCost) ||
                a.purchaseCost - b.purchaseCost
              );
            })
            .map((item) => (
              <RigUpgradeCard
                key={item.id}
                state={state}
                hardwareId={item.id}
                command={command}
                {...detailProps(`rig:${item.id}`)}
              />
            ))}
        </div>
      </section>
      <section className="panel" aria-labelledby="module-store-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Pipeline tradeoffs</span>
            <h2 id="module-store-title">Module upgrades</h2>
          </div>
        </div>
        <div className="upgrade-list">
          {[...modules]
            .filter((item) => item.purchaseCost > 0)
            .sort((a, b) => {
              const rank = (id: string, cost: number) =>
                state.ownedModuleIds.includes(id)
                  ? 0
                  : cost <= state.resources.money
                    ? 1
                    : 2;
              return (
                rank(a.id, a.purchaseCost) - rank(b.id, b.purchaseCost) ||
                a.purchaseCost - b.purchaseCost
              );
            })
            .map((item) => (
              <ModuleUpgradeCard
                key={item.id}
                state={state}
                moduleId={item.id}
                command={command}
                onChoose={onChooseModule}
                {...detailProps(`module:${item.id}`)}
              />
            ))}
        </div>
      </section>
    </>
  );
}

function JobsView({
  state,
  command,
  commandBatch,
  reducedMotion,
  usefulTarget,
  onUsefulTargetChange,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  commandBatch: (commands: readonly SimulationCommand[]) => void;
  reducedMotion: boolean;
  usefulTarget: string | null;
  onUsefulTargetChange: (targetId: string | null) => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const waitingCount = state.jobs.waitingTasks.length;
  const selectedWorkload = getWorkload(state.workloadId);
  const guidingStarter = state.firstSession.step === "queue-starter";
  const observingStarter = state.firstSession.step === "observe-settlement";
  const queueControlsLocked = guidingStarter || observingStarter;
  const displayedWorkload = queueControlsLocked
    ? getWorkload("interactive-chat")
    : selectedWorkload;
  const selectedQuote = getWorkloadQuote(state, displayedWorkload.id);
  const selectedMetrics = calculateMetrics({
    ...state,
    workloadId: displayedWorkload.id,
  });
  const selectedOffer = estimateWorkloadOffer(selectedMetrics, selectedQuote);
  const queueTenQuotes = Array.from(
    { length: 10 },
    (_, index) => getWorkloadQuote(state, state.workloadId, index).grossQuote,
  );
  const queueTenFirst = queueTenQuotes[0] ?? 0;
  const queueTenLast = queueTenQuotes.at(-1) ?? 0;
  const queueStarter = () => {
    commandBatch([
      { type: "SET_WORKLOAD", workloadId: "interactive-chat" },
      { type: "QUEUE_JOBS", count: 1 },
    ]);
  };
  return (
    <>
      <section className="panel" aria-labelledby="workload-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Route work</span>
            <h2 id="workload-title">Workloads</h2>
          </div>
          <span className="counter">
            {state.jobs.activeTask ? "1 active · " : ""}
            {waitingCount} waiting
          </span>
        </div>
        <article
          className="dispatch-card selected-dispatch"
          aria-label="Selected playable workload"
        >
          <div>
            <DecorativeGlyph>
              {workloadGlyph(displayedWorkload.id)}
            </DecorativeGlyph>
            <span>
              <small>
                {guidingStarter
                  ? "SAFE STARTER · STEP 1"
                  : observingStarter
                    ? "ACCEPTED STARTER · STEP 2"
                    : "SELECTED · PLAYABLE NOW"}
              </small>
              <strong>{displayedWorkload.name}</strong>
              <em>{displayedWorkload.description}</em>
            </span>
            <b>${selectedQuote.grossQuote.toFixed(2)}</b>
          </div>
          <p>
            {Math.round(selectedMetrics.reliability * 100)}% modeled delivery ·{" "}
            {selectedOffer.expectedNet >= 0 ? "+" : "−"}$
            {Math.abs(selectedOffer.expectedNet).toFixed(2)} expected after
            cost. A failed delivery pays $0 gross.
          </p>
          {observingStarter ? (
            <p className="starter-queue-note">
              One Interactive Chat job is accepted. Observe its locked quote,
              cost, and outcome below before queue controls unlock.
            </p>
          ) : (
            <button
              type="button"
              className="primary-action queue-one"
              onClick={
                guidingStarter
                  ? queueStarter
                  : () => command({ type: "QUEUE_JOBS", count: 1 })
              }
            >
              {guidingStarter
                ? "Queue one safe Interactive Chat job"
                : "Queue 1"}
            </button>
          )}
          <details>
            <summary>Quote, cost, and uncertainty details</summary>
            <p>
              Queue-time gross quote ${selectedQuote.grossQuote.toFixed(2)} ·
              configured operating cost $
              {selectedMetrics.operatingCost.toFixed(3)}. Success pays the
              locked quote; failure pays $0 gross. Demand{" "}
              {selectedQuote.demandPercent}% {selectedQuote.trend}.{" "}
              {selectedQuote.reason}
            </p>
          </details>
        </article>
        <MoneyLoop
          state={state}
          reducedMotion={reducedMotion}
          targetId={usefulTarget}
          onTargetChange={onUsefulTargetChange}
        />
        <p className="concept-note">
          <strong>CU = normalized Compute Units.</strong> Use CU to compare this
          rig's capacity with workload demand; CU is not a physical FLOPS
          measurement.
        </p>
        <div className="choice-list">
          {workloads.map((workload) => {
            const unlock = workloadUnlockProgress(state, workload.id);
            const heldForStarter = queueControlsLocked;
            const quote = getWorkloadQuote(state, workload.id);
            const metrics = calculateMetrics({
              ...state,
              workloadId: workload.id,
            });
            const offer = estimateWorkloadOffer(metrics, quote);
            const estimatedNet = offer.expectedNet;
            const risky =
              estimatedNet <= Math.max(0.05, quote.grossQuote * 0.15);
            return (
              <button
                type="button"
                key={workload.id}
                className={`${state.workloadId === workload.id ? "choice-card selected" : "choice-card"} ${unlock.unlocked ? "" : "locked"} ${risky ? "margin-warning" : ""}`}
                aria-pressed={state.workloadId === workload.id}
                disabled={!unlock.unlocked || heldForStarter}
                aria-label={
                  heldForStarter
                    ? `${workload.name} is available to compare, but the first-session route queues one Interactive Chat job before workload selection.`
                    : unlock.unlocked
                      ? `${workload.name}. Current quote $${quote.grossQuote.toFixed(2)}. Estimated cost $${metrics.operatingCost.toFixed(3)}. ${offer.guaranteedFailure ? "Guaranteed failure; expected gross is $0." : `Expected net ${estimatedNet >= 0 ? "plus" : "minus"} $${Math.abs(estimatedNet).toFixed(2)} at ${Math.round(metrics.reliability * 100)} percent modeled delivery.`} Demand ${quote.demandPercent} percent, ${quote.trend}.`
                      : `${workload.name} locked. ${unlock.requirements.join("; ")}`
                }
                onClick={() =>
                  command({ type: "SET_WORKLOAD", workloadId: workload.id })
                }
              >
                <span>
                  <strong>
                    <DecorativeGlyph>
                      {workloadGlyph(workload.id)}
                    </DecorativeGlyph>{" "}
                    {workload.name} ·{" "}
                    {unlock.unlocked
                      ? `$${quote.grossQuote.toFixed(2)} quote`
                      : "LOCKED"}
                  </strong>
                  <small>
                    {unlock.unlocked
                      ? offer.guaranteedFailure
                        ? "Not safe in this configuration: delivery pays $0 gross."
                        : `${Math.round(metrics.reliability * 100)}% modeled delivery · ${estimatedNet >= 0 ? "+" : "−"}$${Math.abs(estimatedNet).toFixed(2)} expected after cost.`
                      : `Requires ${unlock.requirements.join(" · ")}.`}
                  </small>
                  {unlock.unlocked && risky ? (
                    <small className="cost-warning">
                      COST WARNING: estimated cost approaches or exceeds this
                      quote. Queueing remains your explicit choice.
                    </small>
                  ) : null}
                </span>
                <span className="choice-stat">
                  {workload.computeDemand} CU · {workload.memoryDemand} GB
                </span>
              </button>
            );
          })}
        </div>
        <div className="job-actions">
          {!queueControlsLocked ? (
            <button
              type="button"
              className="primary-action"
              onClick={() => command({ type: "QUEUE_JOBS", count: 10 })}
            >
              Queue 10 · locks ${queueTenFirst.toFixed(2)} → $
              {queueTenLast.toFixed(2)}
            </button>
          ) : (
            <p className="starter-queue-note">
              Batch queue controls unlock after this one starter job settles.
            </p>
          )}
          <button
            type="button"
            className="secondary-action"
            onClick={() => command({ type: "TOGGLE_PAUSE" })}
          >
            {state.jobs.paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="secondary-action"
            disabled={waitingCount === 0}
            onClick={() => setConfirmClear(true)}
          >
            Clear waiting tasks ({waitingCount})
          </button>
        </div>
        {confirmClear ? (
          <div
            className="clear-confirmation"
            role="group"
            aria-label="Confirm clearing waiting tasks"
          >
            <p>
              Clear {waitingCount} waiting task{waitingCount === 1 ? "" : "s"}?
              The active task stays, and there is no payout, refund, or demand
              change.
            </p>
            <button type="button" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => {
                command({ type: "CLEAR_WAITING_TASKS" });
                setConfirmClear(false);
              }}
            >
              Confirm clear waiting
            </button>
          </div>
        ) : null}
        <div className="task-queue" aria-label="Accepted task queue">
          <div>
            <span className="eyebrow">Active task</span>
            {state.jobs.activeTask ? (
              <strong>
                {getWorkload(state.jobs.activeTask.workloadId).name} · $
                {state.jobs.activeTask.lockedGrossQuote.toFixed(2)} locked ·{" "}
                {Math.round(state.jobs.activeTask.progress * 100)}%
              </strong>
            ) : (
              <strong>None processing</strong>
            )}
          </div>
          <details>
            <summary>
              {waitingCount} waiting · inspect locked identities and quotes
            </summary>
            {state.jobs.waitingTasks.length ? (
              <ol>
                {state.jobs.waitingTasks.slice(0, 12).map((task) => (
                  <li key={task.id}>
                    {getWorkload(task.workloadId).name} · {task.id} · $
                    {task.lockedGrossQuote.toFixed(2)} locked
                  </li>
                ))}
              </ol>
            ) : (
              <p>No waiting tasks.</p>
            )}
          </details>
          <small>Changing the selected workload affects new tasks only.</small>
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
            <span className="eyebrow">Equipped capacity</span>
            <h2 id="hardware-title">Current rig</h2>
          </div>
        </div>
        <div className="current-rig">
          <span className="equipment-state">EQUIPPED</span>
          <strong>{getHardware(state.hardwareId).name}</strong>
          <p>
            {getHardware(state.hardwareId).compute} normalized CU ·{" "}
            {getHardware(state.hardwareId).memory} GB total memory ·{" "}
            {getHardware(state.hardwareId).watts} W modelled draw.
          </p>
          <p>
            Compare and buy alternate rigs in Upgrades via the bottom tab.
            Higher CU and memory also change power, heat, reliability,
            maintenance, and per-attempt cost; purchases do not automatically
            equip.
          </p>
        </div>
      </section>
    </>
  );
}

const causalCategoryLabels: readonly [keyof CausalEvidence, string][] = [
  ["directCauses", "Direct causes"],
  ["contributingFactors", "Contributing factors"],
  ["correlations", "Correlated conditions"],
  ["hypotheses", "Player-visible hypotheses"],
  ["unknowns", "Unknowns"],
];

function DiagnosticMemory({ state }: { state: SimulationState }) {
  const unlocked = state.meta.unlockedDiagnosticIds;
  return (
    <section className="panel diagnostic-memory" aria-labelledby="memory-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Replay memory / information only</span>
          <h2 id="memory-title">Diagnostic unlocks</h2>
        </div>
        <span className="counter">{unlocked.length}/5 retained</span>
      </div>
      <p className="concept-note">
        Endings retain diagnostic language, never flat production, money,
        quality, reliability, or coverage bonuses. Every new run starts its
        pipeline and economy fresh.
      </p>
      {unlocked.length ? (
        <ul className="diagnostic-list" aria-label="Unlocked diagnostics">
          {unlocked.map((id) => (
            <li key={id}>
              <strong>{diagnosticCopy[id].name}</strong>
              <span>{diagnosticCopy[id].description}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">
          Complete a run to retain one diagnostic lens for replay. It will not
          change production outcomes.
        </p>
      )}
    </section>
  );
}

function CausalPostmortem({ state }: { state: SimulationState }) {
  const ending = state.career.runEnding;
  const event = getPostmortemEvent(state);
  const causal = event?.causal;
  if (!ending || !event || !causal) return null;
  return (
    <section className="panel postmortem" aria-labelledby="postmortem-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            Bounded causal ledger / recorded evidence
          </span>
          <h2 id="postmortem-title">Run postmortem</h2>
        </div>
        <span
          className={
            ending.outcome === "success" ? "equipment-state" : "counter"
          }
        >
          {ending.outcome === "success" ? "SUCCESS" : "RUN CLOSED"}
        </span>
      </div>
      <p className="postmortem-outcome" role="status">
        <strong>{ending.title}</strong> · Evidence event {event.id}
      </p>
      <dl className="causal-evidence-list">
        {causalCategoryLabels.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              <ul>
                {causal[key].map((statement) => (
                  <li key={statement}>{statement}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <p className="next-run-response">
        <strong>Next-run response:</strong>{" "}
        {endingNextRunResponse(ending.id as RunEndingId)}
      </p>
    </section>
  );
}

function RunEndingView({
  state,
  command,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
}) {
  const ending = state.career.runEnding;
  if (!ending) return null;
  const nextSeed = state.seed >= 0xffff_ffff ? 1 : state.seed + 1;
  return (
    <>
      <section
        className="panel career-overview run-ending"
        aria-labelledby="career-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Deterministic run conclusion</span>
            <h2 id="career-title">Career loop</h2>
          </div>
          <span
            className={
              ending.outcome === "success" ? "equipment-state" : "counter"
            }
          >
            {ending.outcome === "success" ? "COMPLETE" : "CLOSED"}
          </span>
        </div>
        <h3>{ending.title}</h3>
        <p>
          This run is frozen so its postmortem stays tied to retained ledger
          evidence. Restart to replay the same deterministic scenario, or move
          to the next deterministic seed.
        </p>
        <div className="career-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => command({ type: "RESET", seed: state.seed })}
          >
            Restart this scenario
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => command({ type: "RESET", seed: nextSeed })}
          >
            Replay next scenario
          </button>
        </div>
      </section>
      <CausalPostmortem state={state} />
      <DiagnosticMemory state={state} />
    </>
  );
}

function CareerView({
  state,
  command,
  commandBatch,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  commandBatch: (commands: readonly SimulationCommand[]) => void;
}) {
  const career = state.career;
  const [savingsAmount, setSavingsAmount] = useState(1);
  const [scheduleDraft, setScheduleDraft] = useState<
    Record<CareerRoute, number>
  >(() => ({ ...career.schedule.allocations }));
  const [offlineDraft, setOfflineDraft] = useState(() => ({
    enabled: career.offlinePolicy.enabled,
    maxHours: career.offlinePolicy.maxHours,
    maxElectricityCost: career.offlinePolicy.maxElectricityCost,
    maxOperatingCost: career.offlinePolicy.maxOperatingCost,
    minReliability: career.offlinePolicy.minReliability,
  }));

  useEffect(() => {
    setScheduleDraft({ ...career.schedule.allocations });
  }, [career.schedule.allocations, career.schedule.completedEvenings]);

  if (career.runEnding)
    return <RunEndingView state={state} command={command} />;

  const conclusion = independentRunReadiness(state);

  const updateRouteHours = (route: CareerRoute, value: number) => {
    if (!Number.isFinite(value)) return;
    setScheduleDraft((draft) => {
      const otherHours = (Object.keys(draft) as CareerRoute[]).reduce(
        (total, candidate) =>
          total + (candidate === route ? 0 : draft[candidate]),
        0,
      );
      return {
        ...draft,
        [route]: Math.max(0, Math.min(4 - otherHours, value)),
      };
    });
  };
  const scheduledDraftHours = Object.values(scheduleDraft).reduce(
    (total, hours) => total + hours,
    0,
  );
  const runDraft = () => {
    commandBatch([
      ...bedroomCareerRoutes.map((route) => ({
        type: "SET_EVENING_ALLOCATION" as const,
        route: route.id,
        hours: scheduleDraft[route.id],
      })),
      { type: "RUN_EVENING" },
    ]);
  };

  return (
    <div className="career-deck">
      <section className="panel career-overview" aria-labelledby="career-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Bedroom Developer / finite evenings</span>
            <h2 id="career-title">Career loop</h2>
          </div>
          <span className={career.exitAchieved ? "equipment-state" : "counter"}>
            {career.exitAchieved
              ? "EXIT READY"
              : `Night ${career.schedule.day}`}
          </span>
        </div>
        <p className="concept-note">
          One local pipeline; four after-work hours per evening. Allocate real
          work, then run the evening. Idle simulation time never creates career
          money, savings, product work, or competition progress.
        </p>
        <dl className="career-stat-grid" aria-label="Bedroom career resources">
          <div>
            <dt>Durable savings</dt>
            <dd>${career.savings.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Liquid cash</dt>
            <dd>${state.resources.money.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Career costs</dt>
            <dd>
              $
              {(
                career.operatingCostsIncurred + career.electricityCostsIncurred
              ).toFixed(3)}
            </dd>
          </div>
          <div>
            <dt>Unpaid costs</dt>
            <dd>${career.unpaidCosts.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Electricity</dt>
            <dd>
              {career.electricityCostsIncurred.toFixed(3)} /{" "}
              {state.resources.electricityKwh.toFixed(3)} kWh
            </dd>
          </div>
          <div>
            <dt>Evening window</dt>
            <dd>{career.schedule.hoursRemaining.toFixed(2)}h open</dd>
          </div>
        </dl>
        <p className="career-exit" role="status">
          Bedroom Developer exit: save $24, submit one Cup entry, release
          Deskflow Local, and unlock Kiln 13B. Current: $
          {career.savings.toFixed(2)} · {career.competition.submissions}/1
          submission ·{" "}
          {career.product.released ? "product released" : "product unreleased"}{" "}
          ·{" "}
          {career.unlockedModelTierIds.includes("kiln-13b")
            ? "Kiln unlocked"
            : "Kiln locked"}
          .
        </p>
      </section>

      <section className="panel evening-panel" aria-labelledby="evening-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Player-authored schedule</span>
            <h2 id="evening-title">Tonight's four hours</h2>
          </div>
          <strong className="store-money">
            {Math.max(0, 4 - scheduledDraftHours).toFixed(2)}h unallocated
          </strong>
        </div>
        <div className="career-route-list">
          {bedroomCareerRoutes.map((route) => (
            <div className="career-route" key={route.id}>
              <span>
                <strong>
                  <DecorativeGlyph>{careerGlyph(route.id)}</DecorativeGlyph>{" "}
                  {route.name}
                </strong>
                <small>{route.description}</small>
                <em>{route.opportunityCost}</em>
              </span>
              <span className="career-hours-control">
                <span
                  className="hour-tokens"
                  aria-label={`${route.name} hour allocation tokens`}
                >
                  {[1, 2, 3, 4].map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={
                        scheduleDraft[route.id] >= hour ? "filled" : ""
                      }
                      aria-label={`Allocate ${hour} hours to ${route.name}`}
                      aria-pressed={scheduleDraft[route.id] === hour}
                      onClick={() => updateRouteHours(route.id, hour)}
                    >
                      {scheduleDraft[route.id] >= hour ? "●" : "○"}
                    </button>
                  ))}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="4"
                  step="0.25"
                  value={scheduleDraft[route.id]}
                  aria-label={`${route.name} evening hours`}
                  onChange={(event) =>
                    updateRouteHours(
                      route.id,
                      event.currentTarget.valueAsNumber,
                    )
                  }
                />
              </span>
            </div>
          ))}
        </div>
        <div className="career-actions">
          <button type="button" className="primary-action" onClick={runDraft}>
            Run scheduled evening
          </button>
          <p>
            Scheduled: {scheduledDraftHours.toFixed(2)}h. Route work uses the
            currently equipped rig, local model, and configured pipeline costs.
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="funding-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Three funding routes</span>
            <h2 id="funding-title">Persistent work, not parallel pipelines</h2>
          </div>
        </div>
        <div className="career-project-grid">
          <article>
            <span className="eyebrow">Freelance / cash now</span>
            <strong>
              ${career.freelanceGross.toFixed(3)} gross from{" "}
              {career.freelanceHours.toFixed(2)}h
            </strong>
            <p>
              Sensitive to the pipeline's latency and reliability. This is the
              fastest cash route, but it does not build product progress or a
              Cup entry.
            </p>
          </article>
          <article>
            <span className="eyebrow">One competition / reputation</span>
            <strong>
              {career.competition.progress.toFixed(2)} / 8.00 progress · best{" "}
              {career.competition.bestScore.toFixed(1)}
            </strong>
            <p>
              Bedroom Benchmark Cup has{" "}
              {career.competition.overfitRisk.toFixed(2)} overfit risk. Better
              evaluation lowers the score penalty; submitting clears the current
              entry work without destroying the run.
            </p>
            <button
              type="button"
              className="secondary-action"
              onClick={() => command({ type: "SUBMIT_COMPETITION" })}
            >
              Submit Cup entry
            </button>
          </article>
          <article>
            <span className="eyebrow">One product / durable revenue</span>
            <strong>
              {career.product.released
                ? `Released · $${career.product.lifetimeRevenue.toFixed(3)} revenue`
                : `${career.product.buildProgress.toFixed(2)} / 8.00 build`}
            </strong>
            <p>
              Deskflow Local has {career.product.serviceDebt.toFixed(2)} service
              debt. Product hours before release build it; after release they
              earn revenue but can add debt. Maintenance pays debt down.
            </p>
            <button
              type="button"
              className="secondary-action"
              onClick={() => command({ type: "RELEASE_PRODUCT" })}
            >
              Release Deskflow Local
            </button>
          </article>
        </div>
      </section>

      <section
        className="panel evaluation-panel"
        aria-labelledby="evaluation-title"
      >
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Public proxy / private evidence</span>
            <h2 id="evaluation-title">Evaluation discipline</h2>
          </div>
          <span className="counter">
            {(career.evaluation.coverage * 100).toFixed(0)}% covered
          </span>
        </div>
        <p className="concept-note">
          Public previews are visible benchmark proxies. Private evaluation
          costs cash and returns an evidence band, not an exact
          actual-capability number. Coverage reduces leakage and shifted-input
          uncertainty but does not guarantee a result.
        </p>
        <dl className="evaluation-stat-grid" aria-label="Evaluation evidence">
          <div>
            <dt>Public score</dt>
            <dd>
              {career.evaluation.publicScore === null
                ? "Not run"
                : career.evaluation.publicScore.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt>Private assessment</dt>
            <dd>{career.evaluation.privateAssessment}</dd>
          </div>
          <div>
            <dt>Leakage risk</dt>
            <dd>{(career.evaluation.leakageRisk * 100).toFixed(0)}%</dd>
          </div>
          <div>
            <dt>Shift risk</dt>
            <dd>
              {(career.evaluation.distributionShiftRisk * 100).toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt>Reliability incidents</dt>
            <dd>{career.evaluation.reliabilityIncidents}</dd>
          </div>
          <div>
            <dt>Paid evidence</dt>
            <dd>${career.evaluation.evaluationSpend.toFixed(3)}</dd>
          </div>
        </dl>
        <div className="career-actions evaluation-actions">
          <button
            type="button"
            className="secondary-action"
            aria-label="Run public benchmark preview"
            onClick={() => command({ type: "RUN_PUBLIC_EVALUATION" })}
          >
            Run public preview
          </button>
          <button
            type="button"
            className="primary-action"
            aria-label="Run paid private evaluation"
            onClick={() => command({ type: "RUN_PRIVATE_EVALUATION" })}
          >
            Run private evaluation · $0.750
          </button>
          <p>
            {career.evaluation.publicEvaluations} public preview
            {career.evaluation.publicEvaluations === 1 ? "" : "s"} ·{" "}
            {career.evaluation.privateEvaluations} paid private sample
            {career.evaluation.privateEvaluations === 1 ? "" : "s"}. Warnings
            remain evidence in the causal ledger; ignoring an escalating warning
            is a durable run decision.
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="savings-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Explicit reserves</span>
            <h2 id="savings-title">Savings and costs</h2>
          </div>
        </div>
        <p className="concept-note">
          All route costs are charged as configured operating cost plus local
          electricity at $0.24/kWh. Cash cannot go below zero; unpaid costs stay
          visible and future route income pays them first.
        </p>
        <div className="savings-controls">
          <label>
            Amount
            <input
              type="number"
              inputMode="decimal"
              min="0.001"
              step="0.25"
              value={savingsAmount}
              aria-label="Savings transfer amount"
              onChange={(event) =>
                setSavingsAmount(event.currentTarget.valueAsNumber)
              }
            />
          </label>
          <button
            type="button"
            className="secondary-action"
            onClick={() =>
              command({ type: "DEPOSIT_SAVINGS", amount: savingsAmount })
            }
          >
            Deposit savings
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() =>
              command({ type: "WITHDRAW_SAVINGS", amount: savingsAmount })
            }
          >
            Withdraw savings
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="model-tier-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Durable local models</span>
            <h2 id="model-tier-title">Model tiers and quantization</h2>
          </div>
        </div>
        <p className="concept-note">
          A tier modifies a model stage in the one current pipeline. It is not a
          new work queue, vendor countdown, or second pipeline.
        </p>
        <div className="career-model-list">
          {localModelTiers.map((tier) => {
            const unlock = localModelTierUnlockProgress(state, tier.id);
            const active = career.activeModelTierId === tier.id;
            return (
              <button
                type="button"
                key={tier.id}
                className={`${active ? "choice-card selected" : "choice-card"} ${unlock.unlocked ? "" : "locked"}`}
                aria-pressed={active}
                onClick={() =>
                  command({
                    type: "SELECT_LOCAL_MODEL_TIER",
                    modelTierId: tier.id,
                  })
                }
              >
                <span>
                  <strong>
                    {tier.name} · {tier.shortName}
                  </strong>
                  <small>
                    {tier.description} {unlock.requirement}
                  </small>
                </span>
                <span className="choice-stat">
                  {unlock.unlocked ? (active ? "ACTIVE" : "SELECT") : "LOCKED"}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="quantization-controls"
          role="group"
          aria-label="Local model quantization"
        >
          {(["q4", "q8"] as const).map((profile) => (
            <button
              type="button"
              key={profile}
              aria-pressed={career.quantization === profile}
              className={
                career.quantization === profile
                  ? "primary-action"
                  : "secondary-action"
              }
              onClick={() => command({ type: "SET_QUANTIZATION", profile })}
            >
              {profile.toUpperCase()}{" "}
              {profile === "q4"
                ? "fast / lower memory"
                : "quality / higher memory"}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="offline-policy-title">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Bounded offline policy</span>
            <h2 id="offline-policy-title">Safe freelance-only automation</h2>
          </div>
        </div>
        <p className="concept-note">
          Player-authored only. It can perform bounded freelance work when safe;
          it can never buy, submit, release, schedule product/competition work,
          or create unpaid cost. A pending player schedule always wins.
        </p>
        <div className="offline-policy-form">
          <label className="policy-toggle">
            <input
              type="checkbox"
              checked={offlineDraft.enabled}
              onChange={(event) => {
                const enabled = event.currentTarget.checked;
                setOfflineDraft((draft) => ({
                  ...draft,
                  enabled,
                }));
              }}
            />
            Enable safe offline freelance
          </label>
          <label>
            Maximum hours
            <input
              type="number"
              min="0"
              max="4"
              step="0.25"
              value={offlineDraft.maxHours}
              aria-label="Offline maximum hours"
              onChange={(event) => {
                const maxHours = event.currentTarget.valueAsNumber;
                setOfflineDraft((draft) => ({
                  ...draft,
                  maxHours,
                }));
              }}
            />
          </label>
          <label>
            Max electricity cost
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              value={offlineDraft.maxElectricityCost}
              aria-label="Offline maximum electricity cost"
              onChange={(event) => {
                const maxElectricityCost = event.currentTarget.valueAsNumber;
                setOfflineDraft((draft) => ({
                  ...draft,
                  maxElectricityCost,
                }));
              }}
            />
          </label>
          <label>
            Max operating cost
            <input
              type="number"
              min="0"
              max="5"
              step="0.01"
              value={offlineDraft.maxOperatingCost}
              aria-label="Offline maximum operating cost"
              onChange={(event) => {
                const maxOperatingCost = event.currentTarget.valueAsNumber;
                setOfflineDraft((draft) => ({
                  ...draft,
                  maxOperatingCost,
                }));
              }}
            />
          </label>
          <label>
            Minimum reliability
            <input
              type="number"
              min="0.7"
              max="0.999"
              step="0.001"
              value={offlineDraft.minReliability}
              aria-label="Offline minimum reliability"
              onChange={(event) => {
                const minReliability = event.currentTarget.valueAsNumber;
                setOfflineDraft((draft) => ({
                  ...draft,
                  minReliability,
                }));
              }}
            />
          </label>
        </div>
        <div className="career-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={() =>
              command({ type: "SET_OFFLINE_POLICY", ...offlineDraft })
            }
          >
            Save safe offline policy
          </button>
          <button
            type="button"
            className="primary-action"
            onClick={() =>
              command({ type: "APPLY_OFFLINE_POLICY", requestedHours: 4 })
            }
          >
            Apply safe offline policy now
          </button>
        </div>
        {career.offlinePolicy.lastReport ? (
          <p className="offline-report" role="status">
            Offline report:{" "}
            {career.offlinePolicy.lastReport.appliedHours.toFixed(2)}h applied ·
            ${career.offlinePolicy.lastReport.gross.toFixed(3)} gross · $
            {career.offlinePolicy.lastReport.configuredCost.toFixed(3)}{" "}
            configured cost · {career.offlinePolicy.lastReport.stoppedReason}.
          </p>
        ) : null}
      </section>

      <section
        className="panel conclusion-panel"
        aria-labelledby="conclusion-title"
      >
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Explicit success condition</span>
            <h2 id="conclusion-title">Independent conclusion</h2>
          </div>
          <span className={conclusion.ready ? "equipment-state" : "counter"}>
            {conclusion.ready ? "READY" : "EVIDENCE NEEDED"}
          </span>
        </div>
        <p className="concept-note">
          The honest ending is never a hidden roll. It requires the existing
          Bedroom Developer exit plus credible private evidence, adequate
          coverage, paid costs, and restrained incident history.
        </p>
        {conclusion.reasons.length ? (
          <ul className="conclusion-reasons">
            {conclusion.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="conclusion-ready" role="status">
            Evidence is sufficient for a deliberate independent conclusion.
          </p>
        )}
        <div className="career-actions">
          <button
            type="button"
            className="primary-action"
            disabled={!conclusion.ready}
            aria-describedby="conclusion-status"
            onClick={() => command({ type: "CONCLUDE_INDEPENDENT_RUN" })}
          >
            Conclude independent run
          </button>
          <p id="conclusion-status">
            {conclusion.ready
              ? "This irreversible conclusion opens its recorded postmortem and diagnostic unlock."
              : "The listed evidence gaps keep this conclusion unavailable; no progress is lost."}
          </p>
        </div>
      </section>

      <DiagnosticMemory state={state} />
    </div>
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
      <CausalPostmortem state={state} />
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
        <div className="instrument-grid" aria-label="Live instrument gauges">
          <StatusGauge
            label="Memory pressure"
            value={state.metrics.memoryPressure * 100}
            display={`${formatNumber(state.metrics.memoryPressure * 100)}%`}
            tone={state.metrics.memoryPressure > 1 ? "failure" : "signal"}
          />
          <StatusGauge
            label="Thermal pressure"
            value={state.metrics.thermalPressure * 100}
            display={`${formatNumber(state.metrics.thermalPressure * 100)}%`}
            tone={state.metrics.thermalPressure > 1 ? "failure" : "warning"}
          />
          <StatusGauge
            label="Observability / evidence"
            value={state.metrics.observability * 100}
            display={`${formatNumber(state.metrics.observability * 100)}%`}
            tone="evidence"
          />
          <StatusGauge
            label="Predicted / observed divergence"
            value={Math.abs(
              state.metrics.predictedQuality - state.metrics.observedQuality,
            )}
            display={formatNumber(
              Math.abs(
                state.metrics.predictedQuality - state.metrics.observedQuality,
              ),
              2,
            )}
            tone="evidence"
          />
        </div>
        <details className="metrics-disclosure" open>
          <summary>Exact values and complete baseline comparison</summary>
          <Comparison
            metrics={state.metrics}
            baseline={state.baselineMetrics}
            label={state.baselineLabel}
          />
        </details>
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
                        {getHardware(preset.hardwareId).name} ·{" "}
                        {
                          preset.slots.filter(
                            (slot) => getSlot(slot.slotId).type === "process",
                          ).length
                        }{" "}
                        process positions ·{" "}
                        {(() => {
                          const model = preset.slots
                            .flatMap((slot) =>
                              slot.moduleId ? [getModule(slot.moduleId)] : [],
                            )
                            .find((module) => module.role === "model");
                          return model?.name ?? "No model";
                        })()}
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
                  {event.causal ? (
                    <small>
                      Recorded causal evidence: {event.causal.directCauses[0]}
                    </small>
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
  const { state, command, commandBatch, timeSpeed, setTimeSpeed } =
    useSimulation();
  const [tab, setTab] = useState<TabId>("build");
  const [selected, setSelected] = useState<PendingPlacement | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetail | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [presets, setPresets] = useState<SavedPreset[]>(loadPresets);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedPreset, setDeletedPreset] = useState<DeletedPreset | null>(
    null,
  );
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [usefulTarget, setUsefulTarget] = useState<string | null>(
    loadUsefulTarget,
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const scrollRegionRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const detailOriginRef = useRef<HTMLElement | null>(null);
  const placementOriginRef = useRef<HTMLElement | null>(null);
  const tabScrollPositions = useRef<Record<TabId, number>>({
    build: 0,
    jobs: 0,
    career: 0,
    upgrades: 0,
    inspect: 0,
  });

  const clearPlacement = useCallback((restoreFocus = false) => {
    const origin = placementOriginRef.current;
    placementOriginRef.current = null;
    setSelected(null);
    setDrag(null);
    dragRef.current = null;
    if (!restoreFocus || !origin) return;
    requestAnimationFrame(() => {
      if (origin.isConnected) origin.focus();
    });
  }, []);

  const closeDetails = useCallback(() => {
    detailOriginRef.current = null;
    setModuleDetail(null);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    persistUsefulTarget(usefulTarget);
  }, [usefulTarget]);

  useEffect(() => {
    if (!usefulTarget || !state.ownedModuleIds.includes(usefulTarget)) return;
    const next = modules
      .filter(
        (item) =>
          item.purchaseCost > 0 && !state.ownedModuleIds.includes(item.id),
      )
      .sort((left, right) => left.purchaseCost - right.purchaseCost)[0];
    setUsefulTarget(next?.id ?? null);
  }, [state.ownedModuleIds, usefulTarget]);

  useEffect(() => {
    if (!selected) return;
    const module = modules.find((item) => item.id === selected.moduleId);
    const compatible = module
      ? compatiblePositionCount(state, selected) > 0
      : false;
    if (!module || !state.ownedModuleIds.includes(module.id) || !compatible) {
      clearPlacement();
    }
  }, [clearPlacement, selected, state]);

  useEffect(() => {
    if (!selected) return;
    const cancelPlacement = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      clearPlacement(true);
    };
    document.addEventListener("keydown", cancelPlacement);
    return () => document.removeEventListener("keydown", cancelPlacement);
  }, [clearPlacement, selected]);

  const selectedName = useMemo(
    () => (selected ? getModule(selected.moduleId).name : null),
    [selected],
  );

  const switchTab = (next: TabId, preservePlacement = false) => {
    const region = scrollRegionRef.current;
    if (region) tabScrollPositions.current[tab] = region.scrollTop;
    closeDetails();
    if (next !== "build" || !preservePlacement) {
      clearPlacement();
    }
    setTab(next);
    requestAnimationFrame(() => {
      scrollRegionRef.current?.scrollTo({
        top: tabScrollPositions.current[next],
        behavior: "auto",
      });
    });
  };

  const onOpenDetails = (moduleId: string, fromSlotId?: string) => {
    if (!state.ownedModuleIds.includes(moduleId)) return;
    detailOriginRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setModuleDetail({ moduleId, fromSlotId });
  };

  const beginPlacement = (moduleId: string, fromSlotId?: string) => {
    if (!state.ownedModuleIds.includes(moduleId)) return;
    placementOriginRef.current =
      detailOriginRef.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    detailOriginRef.current = null;
    setModuleDetail(null);
    setSelected({ moduleId, fromSlotId });
  };

  const onInstall = (slotId: string) => {
    if (!selected) return;
    command({
      type: "PLACE_MODULE",
      moduleId: selected.moduleId,
      slotId,
      fromSlotId: selected.fromSlotId,
    });
    clearPlacement();
    setModuleDetail(null);
  };

  const onDragStart = (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!state.ownedModuleIds.includes(moduleId)) return;
    detailOriginRef.current = null;
    placementOriginRef.current =
      event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    const allowHorizontalPan =
      event.pointerType === "touch" &&
      fromSlotId === undefined &&
      event.currentTarget.closest(".module-library") !== null;
    if (!allowHorizontalPan)
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic and assistive pointer events may not own a browser capture;
        // the document-level move/up handlers still provide safe placement.
      }
    const nextDrag = {
      moduleId,
      fromSlotId,
      allowHorizontalPan,
      x: event.clientX,
      y: event.clientY,
      originX: event.clientX,
      originY: event.clientY,
      active: false,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const currentDrag = dragRef.current;
    if (!currentDrag) return;
    const deltaX = event.clientX - currentDrag.originX;
    const deltaY = event.clientY - currentDrag.originY;
    const distance = Math.hypot(deltaX, deltaY);
    if (!currentDrag.active && distance < 8) return;
    if (
      !currentDrag.active &&
      currentDrag.allowHorizontalPan &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      // The library is a scrollable touch drawer. A horizontal swipe must pan
      // it rather than becoming an accidental placement transaction.
      dragRef.current = null;
      setDrag(null);
      return;
    }
    if (!currentDrag.active) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Continue with the app-level capture handlers when capture is absent.
      }
      beginPlacement(currentDrag.moduleId, currentDrag.fromSlotId);
    }
    event.preventDefault();
    const nextDrag = {
      ...currentDrag,
      x: event.clientX,
      y: event.clientY,
      dropSlotId: slotAtPoint(event.clientX, event.clientY),
      active: true,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const onPointerUp = (event: ReactPointerEvent) => {
    const currentDrag = dragRef.current;
    if (!currentDrag) return;
    if (!currentDrag.active) {
      dragRef.current = null;
      setDrag(null);
      return;
    }
    event.preventDefault();
    const slotId =
      currentDrag.dropSlotId ?? slotAtPoint(event.clientX, event.clientY);
    if (slotId) {
      command({
        type: "PLACE_MODULE",
        moduleId: currentDrag.moduleId,
        slotId,
        fromSlotId: currentDrag.fromSlotId,
      });
    }
    clearPlacement();
    setModuleDetail(null);
  };

  const onPointerCancel = () => {
    if (dragRef.current?.active) clearPlacement();
    else {
      dragRef.current = null;
      setDrag(null);
    }
  };

  const savePreset = () => {
    const preset: SavedPreset = {
      id: `${Date.now()}`,
      name: `Preset ${presets.length + 1}`,
      slots: state.slots,
      hardwareId: state.hardwareId,
      workloadId: state.workloadId,
      branchEnabled: state.branchEnabled,
      computeAllocation: state.computeAllocation,
      memoryReserve: state.memoryReserve,
      activeExpansionId: state.activeExpansionId,
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
    const commands: SimulationCommand[] = [
      { type: "EQUIP_HARDWARE", hardwareId: preset.hardwareId },
    ];
    for (const slotId of [
      "prepare",
      "runtime",
      "verify",
      "process-4",
      "process-5",
      "process-6",
    ])
      commands.push({ type: "REMOVE_MODULE", slotId });
    commands.push({
      type: "SET_EXPANSION_ACTIVE",
      active: preset.activeExpansionId !== null,
    });
    for (const slot of preset.slots)
      if (slot.moduleId)
        commands.push({
          type: "PLACE_MODULE",
          moduleId: slot.moduleId,
          slotId: slot.slotId,
        });
    commands.push({
      type: "SET_WORKLOAD",
      workloadId: preset.workloadId,
    });
    commands.push({
      type: "SET_COMPUTE_ALLOCATION",
      percent: preset.computeAllocation,
    });
    commands.push({
      type: "SET_MEMORY_RESERVE",
      percent: preset.memoryReserve,
    });
    if (state.branchEnabled !== preset.branchEnabled)
      commands.push({ type: "TOGGLE_BRANCH" });
    commandBatch(commands);
    clearPlacement();
    closeDetails();
    setTab("build");
  };

  const secondaryControls = (
    <SecondaryControls
      state={state}
      timeSpeed={timeSpeed}
      onTimeSpeedChange={setTimeSpeed}
    />
  );

  return (
    <div
      className={`app-shell ${reducedMotion ? "motion-reduced" : ""} ${drag?.active ? "dragging" : ""}`}
      onPointerMoveCapture={onPointerMove}
      onPointerUpCapture={onPointerUp}
      onPointerCancelCapture={onPointerCancel}
    >
      <a className="skip-link" href="#main-content">
        Skip to controls
      </a>
      <div className="app-scroll-region" ref={scrollRegionRef}>
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
                onClick={() => {
                  setShowTutorial(true);
                }}
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
        </header>

        <main id="main-content" className="main-content">
          {tab !== "build" ? secondaryControls : null}
          <FirstSessionGuide state={state} />
          <UpgradeFeedback state={state} />

          {tab === "build" ? (
            <BuildView
              state={state}
              command={command}
              selected={selected}
              detail={moduleDetail}
              onOpenDetails={onOpenDetails}
              onCloseDetails={closeDetails}
              onBeginPlacement={beginPlacement}
              onCancelPlacement={() => clearPlacement(true)}
              onDragStart={onDragStart}
              onInstall={onInstall}
              reducedMotion={reducedMotion}
              secondaryControls={secondaryControls}
            />
          ) : tab === "jobs" ? (
            <JobsView
              state={state}
              command={command}
              commandBatch={commandBatch}
              reducedMotion={reducedMotion}
              usefulTarget={usefulTarget}
              onUsefulTargetChange={setUsefulTarget}
            />
          ) : tab === "career" ? (
            <CareerView
              state={state}
              command={command}
              commandBatch={commandBatch}
            />
          ) : tab === "upgrades" ? (
            <UpgradesView
              state={state}
              command={command}
              onChooseModule={(moduleId) => {
                const equippedSlot = state.slots.find(
                  (slot) => slot.moduleId === moduleId,
                );
                beginPlacement(moduleId, equippedSlot?.slotId);
                switchTab("build", true);
              }}
            />
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
          {showTutorial ? <QuickStart onDismiss={dismissTutorial} /> : null}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Primary">
        {navigationItems.map(([id, icon, label]) => (
          <button
            type="button"
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            aria-label={label}
            onClick={() => switchTab(id)}
          >
            <DecorativeGlyph>{icon}</DecorativeGlyph>
            {label}
            {id === "build" && selectedName ? <small>1 pending</small> : null}
          </button>
        ))}
      </nav>

      {drag?.active ? (
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
