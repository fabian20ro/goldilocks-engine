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
  BEDROOM_EXIT_SAVINGS_REQUIRED,
  endingNextRunResponse,
  estimateWorkloadOffer,
  getPostmortemEvent,
  getSimulationAgeHours,
  getWorkloadQuote,
  independentRunReadiness,
  localModelTierUnlockProgress,
  PRIVATE_EVALUATION_COST,
  projectCareerEvening,
  projectCareerRoute,
  type CareerEveningProjection,
  type CareerRouteProjection,
  workloadUnlockProgress,
} from "../simulation/engine";
import {
  formatCompactCurrency,
  formatExactCurrency,
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
  ComparisonDelta,
  DetailsSurface,
  ItemDetailsDisclosure,
  StatusGauge,
} from "./commandDeck";
import {
  moduleInventoryDefaultEntries,
  selectModuleInventory,
  type ModuleInventoryEntry,
} from "./moduleInventory";
import {
  selectFirstSessionPresentation,
  type FirstSessionPresentation,
} from "./firstSessionPresentation";
import {
  findSettlementFailureRecord,
  selectSettlementPresentation,
  settlementFailureCauseText,
} from "./settlementPresentation";
import {
  latestCareerScheduleWorkerRejection,
  type CareerScheduleDraft,
  useCareerScheduleDraft,
} from "./careerScheduleDraft";
import {
  claimCareerFeedbackTransaction,
  clearCareerFeedbackTransactions,
  completeCareerFeedbackTransaction,
  createCareerFeedbackTransactionRegistry,
  drainDurablyAcknowledgedCareerFeedback,
  invalidateCareerFeedbackTransaction,
  registerCareerFeedbackTransaction,
  type CareerCompletionFeedback,
} from "./careerFeedbackTransactions";
import {
  careerGlyph,
  DecorativeGlyph,
  glyphs,
  navigationItems,
  pipelineGlyph,
  workloadGlyph,
} from "./glyphs";
import { ResearchView } from "./ResearchView";
import { WorldView } from "./WorldView";

type TabId =
  | "build"
  | "jobs"
  | "career"
  | "upgrades"
  | "inspect"
  | "research"
  | "world";

/** Model-tier requirement copy is a compact card disclosure, not accounting. */
function formatModelTierRequirement(requirement: string): string {
  return requirement.replace(/\$(\d+(?:\.\d+)?)/g, (_, amount: string) =>
    formatCompactCurrency(Number(amount)),
  );
}

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

/**
 * The offline Worker report owns the applied freelance hours. Reuse the same
 * pure route accounting against the exact pre-command snapshot for its recap.
 */
function offlineCareerCompletionProjection(
  before: SimulationState,
  after: SimulationState,
): CareerEveningProjection | null {
  const report = after.career.offlinePolicy.lastReport;
  if (!report || report.appliedHours <= 0) return null;

  return projectCareerEvening(before, {
    freelance: report.appliedHours,
    competition: 0,
    product: 0,
    maintenance: 0,
  });
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
      value: formatCompactCurrency(state.resources.money),
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

function FirstSessionGuide({
  presentation,
  currentTab,
}: {
  presentation: FirstSessionPresentation;
  currentTab: TabId;
}) {
  if (!presentation.active) return null;
  const inRequiredTab = presentation.requiredTab === currentTab;
  const step =
    presentation.action === "queue-starter"
      ? "1"
      : presentation.action === "observe-settlement"
        ? "2"
        : "3";
  return (
    <section
      className="first-session-guide"
      aria-live="polite"
      aria-labelledby="first-session-guide-title"
      data-testid="first-session-guide"
      data-onboarding-action={presentation.action}
    >
      <div className="onboarding-guide-heading">
        <span className="eyebrow">First session · step {step} of 3</span>
        <span
          className="onboarding-required-tab"
          data-testid="onboarding-required-tab"
        >
          Required tab · {presentation.requiredTabLabel}
        </span>
      </div>
      <h2 id="first-session-guide-title">{presentation.title}</h2>
      <p
        className="onboarding-explanation"
        data-testid="onboarding-explanation"
      >
        {presentation.body}
      </p>
      {inRequiredTab ? null : (
        <p className="onboarding-handoff" data-testid="onboarding-handoff">
          Use the bottom {presentation.requiredTabLabel} tab. This handoff does
          not navigate or change your current work.
        </p>
      )}
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
    guidance = `Add an owned model module to an empty compatible process position, or move one back into the active graph. A pipeline without a model cannot produce an answer: accepted tasks fail and pay ${formatCompactCurrency(0)} gross.`;
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
  const simulationContextRef = useRef<HTMLDetailsElement>(null);
  const nominal = state.lastWarning.includes("inside");
  const chooseTimeSpeed = (speed: number) => {
    onTimeSpeedChange(speed);
    // A speed choice is immediate. Return to the tab's dominant decision
    // instead of leaving secondary global controls over its first viewport.
    simulationContextRef.current?.removeAttribute("open");
  };
  return (
    <section className="secondary-controls" aria-label="Simulation context">
      <details
        className="simulation-context"
        data-testid="simulation-context"
        ref={simulationContextRef}
      >
        <summary
          aria-label={`Simulation time ${timeSpeed}×. ${state.lastWarning} Open controls and warning details.`}
        >
          <span className="simulation-context-speed">
            <DecorativeGlyph>{glyphs.resource.time}</DecorativeGlyph>
            <strong>Simulation</strong>
            <small>{timeSpeed}×</small>
          </span>
          <span
            className={`simulation-context-status ${nominal ? "nominal" : "warning"}`}
          >
            <DecorativeGlyph>
              {nominal ? glyphs.status.passed : glyphs.status.warning}
            </DecorativeGlyph>
            <span>{state.lastWarning}</span>
          </span>
        </summary>
        <div className="simulation-context-panel">
          <TimeSpeedControl value={timeSpeed} onChange={chooseTimeSpeed} />
          <WarningBanner state={state} />
        </div>
      </details>
    </section>
  );
}

function ModuleCard({
  moduleId,
  slotId,
  selected,
  owned = true,
  equipped = false,
  statusOverride,
  requirement,
  compatibleWithSelectedStage,
  onSelect,
  onDragStart,
}: {
  moduleId: string;
  slotId?: string;
  selected: boolean;
  owned?: boolean;
  equipped?: boolean;
  statusOverride?: string;
  requirement?: string;
  compatibleWithSelectedStage?: boolean;
  onSelect: (moduleId: string, fromSlotId?: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    moduleId: string,
    fromSlotId?: string,
  ) => void;
}) {
  const module = getModule(moduleId);
  const status =
    statusOverride ??
    (equipped
      ? "EQUIPPED"
      : owned
        ? "OWNED · DETAILS / DRAG"
        : `LOCKED · BUY ${formatCompactCurrency(module.purchaseCost)}`);
  return (
    <button
      type="button"
      className={`module-card ${selected ? "selected" : ""} ${owned ? "owned" : "locked"} ${compatibleWithSelectedStage === false ? "incompatible" : ""}`}
      aria-pressed={selected}
      aria-label={`${module.name}. ${status}. ${requirement ? `${requirement} ` : ""}${module.description}`}
      data-module-id={module.id}
      onClick={() => onSelect(module.id, slotId)}
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
        {requirement ? (
          <small className="module-requirement">{requirement}</small>
        ) : null}
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
  selectedStageId,
  detail,
  onSelectStage,
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
  selectedStageId: string;
  detail: ModuleDetail | null;
  onSelectStage: (slotId: string) => void;
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
          const stageSelected = selectedStageId === slot.id;
          return (
            <li className="pipeline-stage-group" key={slot.id}>
              <div
                className={`pipeline-slot ${compatible ? "compatible" : ""} ${failed ? "failed" : ""} ${propagated ? "propagated" : ""} ${stageSelected ? "selected-stage" : ""}`}
                data-slot-id={slot.id}
                data-testid={`slot-${slot.id}`}
              >
                <div className="slot-meta">
                  <button
                    type="button"
                    className="stage-select"
                    aria-pressed={stageSelected}
                    aria-label={`Select ${slot.name} stage`}
                    onClick={() => onSelectStage(slot.id)}
                  >
                    <b>{index + 1}</b> ·{" "}
                    <DecorativeGlyph>
                      {pipelineGlyph(module?.role ?? "empty", slot.type)}
                    </DecorativeGlyph>{" "}
                    {slot.name}
                  </button>
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
                      onSelect={(moduleId, fromSlotId) => {
                        onSelectStage(slot.id);
                        onOpenDetails(moduleId, fromSlotId);
                      }}
                      onDragStart={onDragStart}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    className="empty-module stage-empty-action"
                    aria-pressed={stageSelected}
                    aria-label={`Select ${slot.name} empty bypassed stage`}
                    onClick={() => onSelectStage(slot.id)}
                  >
                    <strong>
                      <DecorativeGlyph>{glyphs.pipeline.empty}</DecorativeGlyph>{" "}
                      Empty / bypassed
                    </strong>
                    <small>
                      No memory, latency, cost, or processing effect.
                    </small>
                  </button>
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
              <dd>
                {formatExactCurrency(getModule(detail.moduleId).costPerJob)}/job
              </dd>
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
  selectedStageId,
  detail,
  onOpenDetails,
  onCloseDetails,
  onBeginPlacement,
  onDragStart,
}: {
  state: SimulationState;
  selected: PendingPlacement | null;
  selectedStageId: string;
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
  const [showEveryModule, setShowEveryModule] = useState(false);
  const selectedSlot = state.slots.find(
    (slot) => slot.slotId === selectedStageId,
  );
  const selectedSlotSpec = selectedSlot ? getSlot(selectedSlot.slotId) : null;
  const inventory = selectModuleInventory(state, selectedStageId, {
    prioritizeUnplacedOwned: true,
  });
  const compatibleOwnedCount = inventory
    .find((section) => section.id === "owned")
    ?.entries.filter((entry) => entry.compatibleWithSelectedStage).length;
  const detailEntry = detail
    ? inventory
        .flatMap((section) => section.entries)
        .find((entry) => entry.module.id === detail.moduleId)
    : null;
  return (
    <section className="panel library-panel" aria-labelledby="library-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Selected-stage inventory</span>
          <h2 id="library-title">Inspect, then place in Build</h2>
          <p className="section-note">
            The selected rail stage stays above this compact inventory. Drag an
            owned card or use its named placement action; buying remains in the
            bottom Upgrades tab.
          </p>
        </div>
      </div>
      {selectedSlotSpec ? (
        <div
          className="selected-stage-context"
          aria-label="Selected stage context"
        >
          <span className="eyebrow">Selected stage</span>
          <strong>
            {selectedSlotSpec.name} · {selectedSlotSpec.type}
          </strong>
          <small>
            {compatibleOwnedCount ?? 0} compatible owned module
            {compatibleOwnedCount === 1 ? "" : "s"} · all cards name live
            ownership, price, and compatibility.
          </small>
        </div>
      ) : null}
      <div className="module-inventory-sections">
        {inventory.map((section) => {
          const entries = showEveryModule
            ? section.entries
            : moduleInventoryDefaultEntries(section);
          return (
            <section
              className={`module-inventory-section ${section.id}`}
              key={section.id}
              aria-labelledby={`module-inventory-${section.id}`}
            >
              <div className="module-inventory-heading">
                <h3 id={`module-inventory-${section.id}`}>{section.label}</h3>
                <span>{section.entries.length}</span>
              </div>
              {entries.length ? (
                <div
                  className="module-library"
                  data-inventory-section={section.id}
                >
                  {entries.map((entry) => (
                    <ModuleCard
                      key={entry.module.id}
                      moduleId={entry.module.id}
                      selected={
                        selected?.moduleId === entry.module.id &&
                        !selected.fromSlotId
                      }
                      owned={entry.owned}
                      equipped={entry.equipped}
                      compatibleWithSelectedStage={
                        entry.compatibleWithSelectedStage
                      }
                      statusOverride={
                        entry.equipped
                          ? "EQUIPPED"
                          : entry.owned
                            ? "OWNED · DETAILS / DRAG"
                            : entry.affordable
                              ? `AFFORDABLE · BUY ${formatCompactCurrency(entry.module.purchaseCost)}`
                              : `LOCKED · BUY ${formatCompactCurrency(entry.module.purchaseCost)}`
                      }
                      requirement={entry.requirement}
                      onSelect={onOpenDetails}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              ) : (
                <p className="inventory-empty">
                  No modules currently match this live state.
                </p>
              )}
            </section>
          );
        })}
      </div>
      {!showEveryModule ? (
        <button
          type="button"
          className="catalogue-toggle"
          onClick={() => setShowEveryModule(true)}
        >
          Show every module ({modules.length})
        </button>
      ) : (
        <button
          type="button"
          className="catalogue-toggle"
          onClick={() => setShowEveryModule(false)}
        >
          Show compact next choices
        </button>
      )}
      {detail && !detail.fromSlotId && detailEntry ? (
        <DetailsSurface
          title={detailEntry.module.name}
          glyph={pipelineGlyph(detailEntry.module.role, "process")}
          onClose={onCloseDetails}
        >
          <p>{detailEntry.module.description}</p>
          <dl className="compact-details-grid">
            <div>
              <dt>Compatibility</dt>
              <dd>{detailEntry.module.slotTypes.join("/")}</dd>
            </div>
            <div>
              <dt>Throughput</dt>
              <dd>{detailEntry.module.throughput}/m</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{detailEntry.module.memory} GB</dd>
            </div>
            <div>
              <dt>Reliability</dt>
              <dd>{formatNumber(detailEntry.module.reliability * 100, 1)}%</dd>
            </div>
          </dl>
          <p className="purchase-reason">{detailEntry.requirement}</p>
          {detailEntry.owned ? (
            <button
              type="button"
              className="equip-action"
              onClick={() => onBeginPlacement(detail.moduleId)}
            >
              Place {detailEntry.module.name} in Build
            </button>
          ) : (
            <p className="purchase-reason">
              Details do not begin placement. Buy this exact module in the
              bottom Upgrades tab, then return to Build to choose a compatible
              position.
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
  onboarding,
  selected,
  selectedStageId,
  detail,
  onSelectStage,
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
  onboarding: FirstSessionPresentation;
  selected: PendingPlacement | null;
  selectedStageId: string;
  detail: ModuleDetail | null;
  onSelectStage: (slotId: string) => void;
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
  const objective = onboarding.active
    ? onboarding.title
    : !expansionOwned
      ? `Fund ${expansion?.name ?? "pipeline expansion"}`
      : state.activeExpansionId
        ? "Configure six process positions"
        : "Activate the owned expansion";
  const objectiveProgress = onboarding.active
    ? onboarding.progressPercent
    : !expansionOwned
      ? Math.min(
          100,
          (state.resources.money / (expansion?.purchaseCost ?? 1)) * 100,
        )
      : state.activeExpansionId
        ? Math.min(
            100,
            (state.slots.filter(
              (slot) =>
                getSlot(slot.slotId).type === "process" && slot.moduleId,
            ).length /
              6) *
              100,
          )
        : 0;
  return (
    <>
      <section
        className={`mission-card ${onboarding.active ? "onboarding-mission" : ""}`}
        aria-label="Current objective and bottleneck"
      >
        <div>
          <span className="eyebrow">
            {onboarding.active ? "First-session action" : "Current objective"}
          </span>
          <strong>{objective}</strong>
          {onboarding.active ? (
            <small className="objective-handoff">
              Required tab · {onboarding.requiredTabLabel}
            </small>
          ) : null}
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
            aria-label="Configure current pipeline presentation"
            onClick={() => setPresentation("build")}
          >
            🛠️ Configure
          </button>
          <button
            type="button"
            aria-pressed={presentation === "run"}
            aria-label="Observe current pipeline presentation"
            onClick={() => setPresentation("run")}
          >
            ▶ Observe
          </button>
        </div>
      </section>
      <Pipeline
        state={state}
        command={command}
        selected={presentation === "build" ? selected : null}
        selectedStageId={selectedStageId}
        detail={presentation === "build" ? detail : null}
        onSelectStage={
          presentation === "build" ? onSelectStage : () => undefined
        }
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
            selectedStageId={selectedStageId}
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
  onboardingActive,
}: {
  state: SimulationState;
  reducedMotion: boolean;
  targetId: string | null;
  onTargetChange: (targetId: string | null) => void;
  onboardingActive: boolean;
}) {
  const workload = getWorkload(state.workloadId);
  const quote = getWorkloadQuote(state, workload.id);
  const offerMetrics = calculateMetrics({
    ...state,
    workloadId: workload.id,
  });
  const offer = estimateWorkloadOffer(offerMetrics, quote);
  const settlement = state.lastSettlement;
  // A quote card is a compact summary, so each figure earns mill precision
  // only when that figure needs it. Exact settlement accounting remains in
  // the local presentation selector's native Details disclosure below.
  const quoteMoney = (amount: number) => formatCompactCurrency(amount);
  const targetOptions = modules
    .filter(
      (item) =>
        item.purchaseCost > 0 && !state.ownedModuleIds.includes(item.id),
    )
    .sort((left, right) => left.purchaseCost - right.purchaseCost);
  const target = targetOptions.find((item) => item.id === targetId) ?? null;
  const failureEvent = findSettlementFailureRecord(settlement, state.ledger);
  const recoveryQuote = settlement
    ? getWorkloadQuote(state, settlement.workloadId)
    : null;
  const settlementPresentation = selectSettlementPresentation({
    settlement,
    workloadName: settlement ? getWorkload(settlement.workloadId).name : null,
    completedJobs: state.jobs.completed,
    failureCause: settlementFailureCauseText(failureEvent),
    recoveryQuote,
    // The finite guide already owns the exact current first-session action;
    // repeating it in the settlement would create duplicate onboarding copy.
    showNextCue: !onboardingActive,
  });
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
            {quoteMoney(quote.grossQuote)} gross if accepted now ·{" "}
            {quoteMoney(offerMetrics.operatingCost)} estimated operating cost ·{" "}
            {offer.expectedNet >= 0 ? "+" : ""}
            {quoteMoney(offer.expectedNet)} expected net at{" "}
            {Math.round(offerMetrics.reliability * 100)}% modeled delivery.
            Demand {quote.demandPercent}% · {quote.trend}.{" "}
            {offer.guaranteedFailure
              ? `Guaranteed failure in this configuration: ${quoteMoney(0)} expected gross.`
              : `Failed jobs receive ${quoteMoney(0)} gross.`}
          </p>
          <small>
            {quote.reason} Actual cost is locked only by the configuration that
            completes the task.
          </small>
        </div>
        <div
          className={`settlement ${settlement?.failed ? "failure" : ""} ${settlementPresentation.recognition ? "settlement-pulse" : ""}`}
          aria-live="polite"
        >
          <span className="eyebrow">Latest settlement</span>
          {settlementPresentation.settlement &&
          settlementPresentation.accounting ? (
            <>
              <strong
                className={
                  settlementPresentation.settlement.netChange < 0
                    ? "bad"
                    : "good"
                }
              >
                {settlementPresentation.netChange}
              </strong>
              <p
                className="settlement-overview"
                data-testid="settlement-overview"
              >
                <strong>{settlementPresentation.outcome}</strong>{" "}
                {settlementPresentation.overview}
              </p>
              {settlementPresentation.recognition ? (
                <p className="settlement-recognition">
                  {settlementPresentation.recognition}
                  {reducedMotion
                    ? " Recorded immediately (reduced motion)."
                    : ""}
                </p>
              ) : null}
              {settlementPresentation.failureCause ? (
                <p className="settlement-recovery">
                  <strong>Failure record:</strong>{" "}
                  {settlementPresentation.failureCause}{" "}
                  {settlementPresentation.recovery}
                </p>
              ) : null}
              {settlementPresentation.nextCue ? (
                <p className="settlement-next-cue">
                  {settlementPresentation.nextCue}
                </p>
              ) : null}
              <details
                className="settlement-accounting"
                data-testid="settlement-accounting"
              >
                <summary>Settlement accounting and provenance</summary>
                <div className="settlement-accounting-body">
                  <p>{settlementPresentation.accounting.task}</p>
                  <p>{settlementPresentation.accounting.outcomeCounts}</p>
                  <p>{settlementPresentation.accounting.equation}</p>
                  <p>{settlementPresentation.accounting.payment}</p>
                  <p>{settlementPresentation.accounting.cashChange}</p>
                  <p>{settlementPresentation.accounting.precision}</p>
                </div>
              </details>
            </>
          ) : (
            <strong data-testid="settlement-overview">
              {settlementPresentation.overview}
            </strong>
          )}
        </div>
      </div>
      {!onboardingActive ? (
        <section className="next-target" aria-label="Next useful target">
          <div>
            <span className="eyebrow">Next useful target</span>
            {target ? (
              <strong>
                {target.name} · {formatCompactCurrency(target.purchaseCost)} ·{" "}
                {state.resources.money >= target.purchaseCost
                  ? "affordable now"
                  : `${formatCompactCurrency(target.purchaseCost - state.resources.money)} remaining`}
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
                      {item.name} · {formatCompactCurrency(item.purchaseCost)}
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
      ) : null}
      <p className="earnings-total">
        Run totals: {formatCompactCurrency(state.jobs.grossEarned)} gross earned
        · {formatCompactCurrency(state.jobs.operatingCostsPaid)} operating costs
        paid.
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
            : formatCompactCurrency(item.purchaseCost)}
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
            <dd>{formatExactCurrency(item.maintenance)}</dd>
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
          Buy {item.name} for {formatCompactCurrency(item.purchaseCost)}
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
              ? `Need ${formatCompactCurrency(Math.max(0, item.purchaseCost - state.resources.money))} more at current funds. Order window opens at simulated hour ${item.availableAfterHour}; current age ${getSimulationAgeHours(state).toFixed(1)}h. Money alone cannot bypass this catalogue pacing gate.`
              : `Need ${formatCompactCurrency(item.purchaseCost - state.resources.money)} more. Queue successful jobs; no partial or duplicate deduction occurs.`}
      </p>
    </article>
  );
}

function ModuleUpgradeCard({
  state,
  entry,
  command,
  onChoose,
  detailOpen,
  onOpenDetails,
  onCloseDetails,
  recommended = false,
  placementPending = false,
}: {
  state: SimulationState;
  entry: ModuleInventoryEntry;
  command: (command: SimulationCommand) => void;
  onChoose: (moduleId: string) => void;
  detailOpen: boolean;
  onOpenDetails: () => void;
  onCloseDetails: () => void;
  recommended?: boolean;
  placementPending?: boolean;
}) {
  const item = entry.module;
  const { affordable, equipped, owned } = entry;
  const comparison = state.slots
    .flatMap((slot) => (slot.moduleId ? [getModule(slot.moduleId)] : []))
    .find((candidate) => candidate.role === item.role);
  const reasonId = `module-reason-${item.id}`;
  return (
    <article
      className={`upgrade-card ${equipped ? "equipped" : owned ? "owned" : "locked"} ${recommended ? "recommended-upgrade" : ""}`}
      aria-labelledby={`module-title-${item.id}`}
      data-testid={recommended ? "recommended-first-module" : undefined}
    >
      <div className="upgrade-card-heading">
        <div>
          {recommended ? (
            <span className="onboarding-recommendation-label">
              Recommended next module
            </span>
          ) : null}
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
          {formatCompactCurrency(item.purchaseCost)}
        </strong>
      </div>
      <p>{item.description}</p>
      {comparison ? (
        <p
          className="decision-deltas"
          aria-label={`Key comparison with ${comparison.name}`}
        >
          <ComparisonDelta
            label="Throughput compared with equipped module"
            current={item.throughput}
            baseline={comparison.throughput}
            suffix="/m"
            digits={1}
          />
          <ComparisonDelta
            label="Memory compared with equipped module"
            current={item.memory}
            baseline={comparison.memory}
            suffix=" GB"
            inverse
            digits={1}
          />
          <ComparisonDelta
            label="Operating cost compared with equipped module"
            current={item.costPerJob}
            baseline={comparison.costPerJob}
            suffix="/job"
            inverse
            digits={3}
          />
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
            <dd>{formatExactCurrency(item.costPerJob)}/job</dd>
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
          className={`${recommended ? "primary-action " : ""}purchase-action`}
          disabled={!affordable}
          aria-describedby={reasonId}
          onClick={() => command({ type: "BUY_MODULE", moduleId: item.id })}
          data-testid={recommended ? "onboarding-primary-action" : undefined}
        >
          Buy {item.name} for {formatCompactCurrency(item.purchaseCost)}
        </button>
      ) : placementPending ? (
        <p
          className="placement-handoff"
          role="status"
          data-testid="placement-handoff"
        >
          Placement ready in Build. Use the Build tab to choose a highlighted
          compatible position; no navigation or install happened here.
        </p>
      ) : (
        <button
          type="button"
          className={`${recommended ? "primary-action " : ""}equip-action`}
          onClick={() => onChoose(item.id)}
          data-testid={recommended ? "onboarding-primary-action" : undefined}
        >
          Place {item.name} in Build
        </button>
      )}
      <p id={reasonId} className="purchase-reason">
        {owned
          ? "Owned permanently for this run. Details stay informational; Place in Build is the explicit handoff that highlights compatible targets."
          : entry.requirement}
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
          {formatCompactCurrency(spec.purchaseCost)}
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
          Buy {spec.name} for {formatCompactCurrency(spec.purchaseCost)}
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
          {formatCompactCurrency(
            Math.min(state.resources.money, spec.purchaseCost),
          )}{" "}
          / {formatCompactCurrency(spec.purchaseCost)} funded ·{" "}
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
  onboarding,
  pendingPlacementModuleId,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  onChooseModule: (moduleId: string) => void;
  onboarding: FirstSessionPresentation;
  pendingPlacementModuleId: string | null;
}) {
  const moduleInventory = selectModuleInventory(state);
  const recommendedEntry = onboarding.recommendedModuleId
    ? moduleInventory
        .flatMap((section) => section.entries)
        .find((entry) => entry.module.id === onboarding.recommendedModuleId)
    : null;
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(() =>
    onboarding.active && recommendedEntry
      ? `module:${recommendedEntry.module.id}`
      : `rig:${state.hardwareId}`,
  );
  const [showEveryModule, setShowEveryModule] = useState(false);
  const catalogueInventory =
    onboarding.active && recommendedEntry
      ? moduleInventory.map((section) => ({
          ...section,
          entries: section.entries.filter(
            (entry) => entry.module.id !== recommendedEntry.module.id,
          ),
        }))
      : moduleInventory;
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
            {formatCompactCurrency(state.resources.money)} available
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
      {onboarding.active && recommendedEntry ? (
        <section
          className="panel onboarding-recommendation"
          aria-labelledby="onboarding-recommendation-title"
        >
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">First-session next choice</span>
              <h2 id="onboarding-recommendation-title">
                Recommended module before expansion
              </h2>
              <p className="section-note">
                {onboarding.action === "earn-remainder"
                  ? `Earn ${formatCompactCurrency(onboarding.remainingMoney ?? 0)} more in Jobs before this purchase.`
                  : onboarding.action === "buy-module"
                    ? "This is the next paid module to compare and buy. Expansion and rigs remain available after this focused choice."
                    : "This module remains the first-session handoff. Expansion and rigs stay available below without displacing it."}
              </p>
            </div>
          </div>
          <div className="upgrade-list">
            <ModuleUpgradeCard
              state={state}
              entry={recommendedEntry}
              command={command}
              onChoose={onChooseModule}
              recommended
              placementPending={
                pendingPlacementModuleId === recommendedEntry.module.id
              }
              {...detailProps(`module:${recommendedEntry.module.id}`)}
            />
          </div>
        </section>
      ) : null}
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
            <span className="eyebrow">
              Pipeline tradeoffs · compact catalogue
            </span>
            <h2 id="module-store-title">Module upgrades</h2>
            <p className="section-note">
              Current ownership and cash sort the next valid choices first.
              Every exact module, requirement, and comparison remains available
              below on request.
            </p>
          </div>
        </div>
        <div className="upgrade-inventory-sections">
          {catalogueInventory.map((section) => {
            const entries = showEveryModule
              ? section.entries
              : moduleInventoryDefaultEntries(section);
            return (
              <section
                className={`upgrade-inventory-section ${section.id}`}
                key={section.id}
                aria-labelledby={`upgrade-inventory-${section.id}`}
              >
                <div className="module-inventory-heading">
                  <h3 id={`upgrade-inventory-${section.id}`}>
                    {section.label}
                  </h3>
                  <span>{section.entries.length}</span>
                </div>
                {entries.length ? (
                  <div className="upgrade-list">
                    {entries.map((entry) => (
                      <ModuleUpgradeCard
                        key={entry.module.id}
                        state={state}
                        entry={entry}
                        command={command}
                        onChoose={onChooseModule}
                        {...detailProps(`module:${entry.module.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="inventory-empty">
                    No modules currently match this live state.
                  </p>
                )}
              </section>
            );
          })}
        </div>
        {!showEveryModule ? (
          <button
            type="button"
            className="catalogue-toggle"
            onClick={() => setShowEveryModule(true)}
          >
            Show every module ({modules.length})
          </button>
        ) : (
          <button
            type="button"
            className="catalogue-toggle"
            onClick={() => setShowEveryModule(false)}
          >
            Show compact next choices
          </button>
        )}
      </section>
    </>
  );
}

export function JobsView({
  state,
  command,
  commandBatch,
  reducedMotion,
  usefulTarget,
  onUsefulTargetChange,
  onboarding,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  commandBatch: (commands: readonly SimulationCommand[]) => void;
  reducedMotion: boolean;
  usefulTarget: string | null;
  onUsefulTargetChange: (targetId: string | null) => void;
  onboarding: FirstSessionPresentation;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const waitingCount = state.jobs.waitingTasks.length;
  const selectedWorkload = getWorkload(state.workloadId);
  const guidingStarter = state.firstSession.step === "queue-starter";
  const observingStarter = state.firstSession.step === "observe-settlement";
  const earningRecommendedModule = onboarding.action === "earn-remainder";
  const queueOneIsPrimary =
    !onboarding.active || guidingStarter || earningRecommendedModule;
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
  // Queue 10 is a non-additive range. Its visible endpoints are independent
  // compact summaries, so undisplayed intervening reservations cannot promote
  // either label to mills.
  const queueTenFirst = getWorkloadQuote(state, state.workloadId, 0).grossQuote;
  const queueTenLast = getWorkloadQuote(state, state.workloadId, 9).grossQuote;
  const queueStarter = () => {
    commandBatch([
      { type: "SET_WORKLOAD", workloadId: "interactive-chat" },
      { type: "QUEUE_JOBS", count: 1 },
    ]);
  };
  return (
    <>
      <section
        className="panel workload-panel"
        aria-labelledby="workload-title"
      >
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
            <b>{formatCompactCurrency(selectedQuote.grossQuote)}</b>
          </div>
          <p>
            {Math.round(selectedMetrics.reliability * 100)}% modeled delivery ·{" "}
            {selectedOffer.expectedNet >= 0 ? "+" : ""}
            {formatCompactCurrency(selectedOffer.expectedNet)} expected after
            cost. A failed delivery pays {formatCompactCurrency(0)} gross.
          </p>
          {observingStarter ? (
            <p className="starter-queue-note">
              One Interactive Chat job is accepted. Observe its locked quote,
              cost, and outcome below before queue controls unlock.
            </p>
          ) : (
            <button
              type="button"
              className={`${queueOneIsPrimary ? "primary-action" : "secondary-action"} queue-one`}
              onClick={
                guidingStarter
                  ? queueStarter
                  : () => command({ type: "QUEUE_JOBS", count: 1 })
              }
              data-testid={
                queueOneIsPrimary &&
                (guidingStarter || earningRecommendedModule)
                  ? "onboarding-primary-action"
                  : undefined
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
              Queue-time gross quote{" "}
              {formatExactCurrency(selectedQuote.grossQuote)} · configured
              operating cost{" "}
              {formatExactCurrency(selectedMetrics.operatingCost)}. Success pays
              the locked quote; failure pays {formatExactCurrency(0)} gross.
              Demand {selectedQuote.demandPercent}% {selectedQuote.trend}.{" "}
              {selectedQuote.reason}
            </p>
          </details>
        </article>
        <MoneyLoop
          state={state}
          reducedMotion={reducedMotion}
          targetId={usefulTarget}
          onTargetChange={onUsefulTargetChange}
          onboardingActive={onboarding.active}
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
                      ? `${workload.name}. Current quote ${formatCompactCurrency(quote.grossQuote)}. Estimated cost ${formatCompactCurrency(metrics.operatingCost, [quote.grossQuote, metrics.operatingCost, estimatedNet])}. ${offer.guaranteedFailure ? `Guaranteed failure; expected gross is ${formatCompactCurrency(0)}.` : `Expected net ${estimatedNet >= 0 ? "plus" : "minus"} ${formatCompactCurrency(estimatedNet)} at ${Math.round(metrics.reliability * 100)} percent modeled delivery.`} Demand ${quote.demandPercent} percent, ${quote.trend}.`
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
                      ? `${formatCompactCurrency(quote.grossQuote)} quote`
                      : "LOCKED"}
                  </strong>
                  <small>
                    {unlock.unlocked
                      ? offer.guaranteedFailure
                        ? `Not safe in this configuration: delivery pays ${formatCompactCurrency(0)} gross.`
                        : `${Math.round(metrics.reliability * 100)}% modeled delivery · ${estimatedNet >= 0 ? "+" : ""}${formatCompactCurrency(estimatedNet)} expected after cost.`
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
              className={
                onboarding.active ? "secondary-action" : "primary-action"
              }
              onClick={() => command({ type: "QUEUE_JOBS", count: 10 })}
            >
              Queue 10 · locks {formatCompactCurrency(queueTenFirst)} →{" "}
              {formatCompactCurrency(queueTenLast)}
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
                {getWorkload(state.jobs.activeTask.workloadId).name} ·{" "}
                {formatCompactCurrency(state.jobs.activeTask.lockedGrossQuote)}{" "}
                locked · {Math.round(state.jobs.activeTask.progress * 100)}%
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
                    {getWorkload(task.workloadId).name} · {task.id} ·{" "}
                    {formatCompactCurrency(task.lockedGrossQuote)} locked
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

function CareerDisclosure({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="career-disclosure">
      <summary aria-label={`Show ${title}`}>
        <span>
          <span className="eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
        </span>
        <span aria-hidden="true">Details</span>
      </summary>
      {children}
    </details>
  );
}

function careerRouteRequirement(route: CareerRoute): string {
  switch (route) {
    case "freelance":
      return "Available from the first evening. A usable, reliable pipeline is still required for a payout.";
    case "competition":
      return "Available from the first evening. Submit only after the Cup entry reaches 8.00 progress.";
    case "product":
      return "Available from the first evening. Product revenue remains locked until Deskflow reaches 8.00 build progress and is released.";
    case "maintenance":
      return "Available from the first evening. Its repair benefit is unavailable until released product work creates service debt.";
  }
}

function careerProjectionOutcome(
  route: CareerRoute,
  projection: ReturnType<typeof projectCareerRoute>,
  money: (amount: number) => string,
): string {
  switch (route) {
    case "freelance":
      return `${projection.economicNet >= 0 ? "+" : ""}${money(projection.economicNet)} expected net`;
    case "competition":
      return `+${projection.competitionProgress.toFixed(2)} Cup progress`;
    case "product":
      return projection.productBuildProgress > 0
        ? `+${projection.productBuildProgress.toFixed(2)} Deskflow build`
        : `${projection.productRevenue >= 0 ? "+" : ""}${money(projection.productRevenue)} product revenue`;
    case "maintenance":
      return projection.maintenanceDebtReduction > 0
        ? `-${projection.maintenanceDebtReduction.toFixed(2)} service debt`
        : "No debt repair available";
  }
}

type CareerMoneyProjection = Pick<
  CareerRouteProjection,
  | "gross"
  | "operatingCost"
  | "electricityCost"
  | "configuredCost"
  | "economicNet"
  | "cashChange"
  | "unpaidCostChange"
  | "productRevenue"
>;

/** A route or evening equation shares its own compact precision, never another's. */
function formatCareerProjectionCurrency(
  projection: CareerMoneyProjection,
  amount: number,
): string {
  return formatCompactCurrency(amount, [
    projection.gross,
    projection.operatingCost,
    projection.electricityCost,
    projection.configuredCost,
    projection.economicNet,
    projection.cashChange,
    projection.unpaidCostChange,
    projection.productRevenue,
  ]);
}

function careerProgressSummary(
  projection: CareerEveningProjection,
  money: (amount: number) => string,
): string {
  const progress: string[] = [];
  if (projection.competitionProgress > 0)
    progress.push(`Cup +${projection.competitionProgress.toFixed(2)}`);
  if (projection.productBuildProgress > 0)
    progress.push(
      `Deskflow build +${projection.productBuildProgress.toFixed(2)}`,
    );
  if (projection.productRevenue > 0)
    progress.push(`Product revenue +${money(projection.productRevenue)}`);
  if (projection.maintenanceDebtReduction > 0)
    progress.push(
      `Service debt -${projection.maintenanceDebtReduction.toFixed(2)}`,
    );
  return progress.length ? progress.join(" · ") : "No durable progress change";
}

function nextCareerDecision(state: SimulationState): string {
  const career = state.career;
  if (!career.product.released && career.product.buildProgress >= 8)
    return "Release Deskflow Local in Career progress.";
  if (career.competition.progress >= 8)
    return "Submit the Bedroom Benchmark Cup entry in Career progress.";
  if (career.exitAchieved)
    return "Review the independent conclusion checklist.";
  if (career.savings < 24)
    return "Choose tomorrow's route or move available cash into savings.";
  return "Allocate tomorrow's four-hour evening.";
}

export function CareerView({
  state,
  command,
  scheduleDraft,
  scheduledDraftHours,
  onScheduleDraftChange,
  hasDurablePersistenceFailure,
  isRunBlocked,
  onRunScheduledEvening,
  onApplySafeOfflinePolicyNow,
  completionFeedback,
}: {
  state: SimulationState;
  command: (command: SimulationCommand) => void;
  scheduleDraft: CareerScheduleDraft;
  scheduledDraftHours: number;
  onScheduleDraftChange: (route: CareerRoute, value: number) => void;
  hasDurablePersistenceFailure: boolean;
  isRunBlocked: boolean;
  onRunScheduledEvening: () => boolean;
  onApplySafeOfflinePolicyNow: () => void;
  completionFeedback?: CareerCompletionFeedback | null;
}) {
  const career = state.career;
  const [routeDetails, setRouteDetails] = useState<CareerRoute | null>(null);
  const routeDetailsOriginRef = useRef<HTMLElement | null>(null);
  const [savingsAmount, setSavingsAmount] = useState(1);
  const [offlineDraft, setOfflineDraft] = useState(() => ({
    enabled: career.offlinePolicy.enabled,
    maxHours: career.offlinePolicy.maxHours,
    maxElectricityCost: career.offlinePolicy.maxElectricityCost,
    maxOperatingCost: career.offlinePolicy.maxOperatingCost,
    minReliability: career.offlinePolicy.minReliability,
  }));

  if (career.runEnding)
    return <RunEndingView state={state} command={command} />;

  const conclusion = independentRunReadiness(state);
  const workerScheduleRejection = latestCareerScheduleWorkerRejection(state);
  const routeProjections = bedroomCareerRoutes.map((route) =>
    projectCareerRoute(state, route.id, scheduleDraft[route.id]),
  );
  const eveningProjection = projectCareerEvening(state, scheduleDraft);
  const compactMoney = (amount: number) => formatCompactCurrency(amount);
  const completionMoney = (amount: number) =>
    completionFeedback
      ? formatCareerProjectionCurrency(completionFeedback.projection, amount)
      : compactMoney(amount);
  const exactMoney = (amount: number) => formatExactCurrency(amount);
  const detailRoute = routeDetails
    ? (bedroomCareerRoutes.find((route) => route.id === routeDetails) ?? null)
    : null;
  const detailProjection = detailRoute
    ? routeProjections.find((projection) => projection.route === detailRoute.id)
    : null;
  const detailMetrics = detailRoute
    ? calculateMetrics({ ...state, workloadId: detailRoute.workloadId })
    : null;
  const activeTier =
    localModelTiers.find((tier) => tier.id === career.activeModelTierId) ??
    localModelTiers[0]!;
  const runStatus = hasDurablePersistenceFailure
    ? "Blocked: waiting for a successful durable save before another evening can start."
    : isRunBlocked
      ? "Blocked: the submitted evening is waiting for its durable Worker acknowledgement."
      : scheduledDraftHours === 0
        ? "Blocking reason: allocate at least 0.25h before the Worker can run tonight."
        : "Ready: the Worker will commit all four allocations as one evening.";
  const visibleConstraint =
    eveningProjection.routes.find(
      (projection) => !projection.constraint.startsWith("Configured operating"),
    )?.constraint ?? eveningProjection.constraint;
  const completionConstraint = completionFeedback
    ? (completionFeedback.projection.routes.find(
        (projection) =>
          !projection.constraint.startsWith("Configured operating"),
      )?.constraint ?? completionFeedback.projection.constraint)
    : visibleConstraint;

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
        <p className="career-objective" data-testid="career-objective">
          <strong>Tonight:</strong> spend one four-hour evening on cash, a Cup
          entry, Deskflow, or maintenance. Idle time creates no career income or
          progress.
        </p>
        <dl
          className="career-quick-resources"
          aria-label="Tonight's Career resources"
        >
          <div>
            <dt>Cash</dt>
            <dd>{compactMoney(state.resources.money)}</dd>
          </div>
          <div>
            <dt>Savings</dt>
            <dd>{compactMoney(career.savings)}</dd>
          </div>
          <div>
            <dt>Tonight</dt>
            <dd>{scheduledDraftHours.toFixed(2)} / 4.00h</dd>
          </div>
          <div>
            <dt>Constraint</dt>
            <dd>{state.metrics.dominantBottleneck}</dd>
          </div>
        </dl>
      </section>

      <section
        className="panel evening-panel career-composer"
        aria-labelledby="evening-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Player-authored schedule</span>
            <h2 id="evening-title">Tonight's four hours</h2>
          </div>
          <strong className="store-money" data-testid="career-unallocated">
            {Math.max(0, 4 - scheduledDraftHours).toFixed(2)}h open
          </strong>
        </div>
        <div className="career-route-list">
          {bedroomCareerRoutes.map((route, index) => {
            const projection = routeProjections[index]!;
            return (
              <div className="career-route" key={route.id}>
                <div className="career-route-summary">
                  <span>
                    <strong>
                      <DecorativeGlyph>{careerGlyph(route.id)}</DecorativeGlyph>{" "}
                      {route.name}
                    </strong>
                    <span className="career-allocation">
                      {scheduleDraft[route.id].toFixed(2)}h allocated
                    </span>
                  </span>
                  <p>
                    <strong>Benefit:</strong> {route.primaryBenefit}
                  </p>
                  <p>
                    <strong>Tradeoff:</strong> {route.opportunityCost}
                  </p>
                  <button
                    type="button"
                    className="secondary-action career-details-action"
                    aria-expanded={detailRoute?.id === route.id}
                    onClick={(event) => {
                      routeDetailsOriginRef.current = event.currentTarget;
                      setRouteDetails(route.id);
                    }}
                  >
                    {route.name} details
                  </button>
                </div>
                <p
                  className="career-route-projection"
                  data-testid={`career-projection-${route.id}`}
                >
                  <strong>Estimate · {projection.hours.toFixed(2)}h:</strong>{" "}
                  {careerProjectionOutcome(route.id, projection, (amount) =>
                    formatCareerProjectionCurrency(projection, amount),
                  )}
                  {projection.hours > 0
                    ? ` · ${formatCareerProjectionCurrency(
                        projection,
                        projection.configuredCost,
                      )} configured cost`
                    : " · assign time to estimate costs"}
                </p>
                <span className="career-route-constraint">
                  <DecorativeGlyph>{glyphs.status.warning}</DecorativeGlyph>{" "}
                  {projection.constraint}
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
                        onClick={() => onScheduleDraftChange(route.id, hour)}
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
                      onScheduleDraftChange(
                        route.id,
                        event.currentTarget.valueAsNumber,
                      )
                    }
                  />
                </span>
              </div>
            );
          })}
        </div>
        {detailRoute && detailProjection && detailMetrics ? (
          <DetailsSurface
            title={detailRoute.name}
            glyph={careerGlyph(detailRoute.id)}
            onClose={() => setRouteDetails(null)}
            returnFocus={routeDetailsOriginRef}
          >
            <p>{detailRoute.description}</p>
            <dl className="career-detail-grid">
              <div>
                <dt>Primary benefit</dt>
                <dd>{detailRoute.primaryBenefit}</dd>
              </div>
              <div>
                <dt>Opportunity cost</dt>
                <dd>{detailRoute.opportunityCost}</dd>
              </div>
              <div>
                <dt>Availability / unlock</dt>
                <dd>{careerRouteRequirement(detailRoute.id)}</dd>
              </div>
              <div>
                <dt>Exact estimate at {detailProjection.hours.toFixed(2)}h</dt>
                <dd>
                  {exactMoney(detailProjection.gross)} gross ·{" "}
                  {exactMoney(detailProjection.operatingCost)} operating ·{" "}
                  {exactMoney(detailProjection.electricityCost)} electricity ·{" "}
                  {exactMoney(detailProjection.economicNet)} economic net
                </dd>
              </div>
              <div>
                <dt>Rig / model effect</dt>
                <dd>
                  {getHardware(state.hardwareId).name} · {activeTier.name} ·{" "}
                  {career.quantization.toUpperCase()} ·{" "}
                  {detailMetrics.latencySeconds.toFixed(2)}s latency ·{" "}
                  {(detailMetrics.reliability * 100).toFixed(1)}% reliability
                </dd>
              </div>
              <div>
                <dt>Evidence qualification</dt>
                <dd>
                  {detailRoute.id === "competition"
                    ? `${(career.evaluation.coverage * 100).toFixed(0)}% private coverage; ${career.evaluation.privateAssessment} assessment. Coverage narrows risk but never guarantees a private result.`
                    : detailRoute.id === "product"
                      ? `${(career.evaluation.distributionShiftRisk * 100).toFixed(0)}% modeled shift risk; released service can still add debt or a reliability incident.`
                      : "This is a configuration-derived estimate. Exact configured costs and settled amounts remain in Inspect and the ledger."}
                </dd>
              </div>
            </dl>
          </DetailsSurface>
        ) : null}
        <div className="career-actions">
          <button
            type="button"
            className="primary-action career-run-action"
            disabled={isRunBlocked}
            aria-busy={isRunBlocked || undefined}
            aria-describedby={
              hasDurablePersistenceFailure
                ? "career-persistence-recovery"
                : undefined
            }
            onClick={onRunScheduledEvening}
          >
            Run scheduled evening
          </button>
          <p className="career-run-status" data-testid="career-run-status">
            <strong>
              Scheduled: {scheduledDraftHours.toFixed(2)}h / 4.00h.
            </strong>{" "}
            {Math.max(0, 4 - scheduledDraftHours).toFixed(2)}h unallocated.{" "}
            {runStatus}
          </p>
        </div>
        {hasDurablePersistenceFailure ? (
          <p
            id="career-persistence-recovery"
            className="career-schedule-feedback"
            role="status"
          >
            <strong>Saving is temporarily unavailable.</strong> This tab is
            retrying the latest Worker state. Keep it open and free storage; a
            submitted evening stays locked until its result is stored.
          </p>
        ) : null}
        {workerScheduleRejection ? (
          <p className="career-schedule-feedback" role="status">
            <strong>Worker rejected the scheduled evening:</strong>{" "}
            {workerScheduleRejection}
          </p>
        ) : null}
      </section>

      {completionFeedback ? (
        <section
          className="career-completion-feedback"
          aria-label="Latest evening result"
          role="status"
        >
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Completed locally</span>
              <h2>Night {completionFeedback.evening} result</h2>
            </div>
            <span className="equipment-state">READY</span>
          </div>
          <dl>
            <div>
              <dt>Hours</dt>
              <dd>{completionFeedback.projection.hours.toFixed(2)}h used</dd>
            </div>
            <div>
              <dt>Money / progress</dt>
              <dd>
                {completionFeedback.projection.cashChange >= 0 ? "+" : ""}
                {completionMoney(
                  completionFeedback.projection.cashChange,
                )} ·{" "}
                {careerProgressSummary(
                  completionFeedback.projection,
                  completionMoney,
                )}
              </dd>
            </div>
            <div>
              <dt>Electricity / operating</dt>
              <dd>
                {completionMoney(completionFeedback.projection.electricityCost)}{" "}
                electricity ·{" "}
                {completionMoney(completionFeedback.projection.operatingCost)}{" "}
                operating
              </dd>
            </div>
            <div>
              <dt>Constraint</dt>
              <dd>{completionConstraint}</dd>
            </div>
            <div>
              <dt>Next decision</dt>
              <dd>{completionFeedback.nextDecision}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <CareerDisclosure
        eyebrow="Current progress and lifetime totals"
        title="Career progress and route actions"
      >
        <section className="panel" aria-labelledby="funding-title">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Three funding routes</span>
              <h2 id="funding-title">
                Persistent work, not parallel pipelines
              </h2>
            </div>
          </div>
          <div className="career-project-grid">
            <article>
              <span className="eyebrow">Freelance / cash now</span>
              <strong>
                {compactMoney(career.freelanceGross)} gross from{" "}
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
                evaluation lowers the score penalty; submitting clears the
                current entry work without destroying the run.
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
                  ? `Released · ${compactMoney(career.product.lifetimeRevenue)} revenue`
                  : `${career.product.buildProgress.toFixed(2)} / 8.00 build`}
              </strong>
              <p>
                Deskflow Local has {career.product.serviceDebt.toFixed(2)}{" "}
                service debt. Product hours before release build it; after
                release they earn revenue but can add debt. Maintenance pays
                debt down.
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
      </CareerDisclosure>

      <CareerDisclosure
        eyebrow="Public proxy / private evidence"
        title="Evaluation discipline"
      >
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
              <dd>{exactMoney(career.evaluation.evaluationSpend)}</dd>
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
              Run private evaluation ·{" "}
              {formatCompactCurrency(PRIVATE_EVALUATION_COST)}
            </button>
            <p>
              {career.evaluation.publicEvaluations} public preview
              {career.evaluation.publicEvaluations === 1 ? "" : "s"} ·{" "}
              {career.evaluation.privateEvaluations} paid private sample
              {career.evaluation.privateEvaluations === 1 ? "" : "s"}. Warnings
              remain evidence in the causal ledger; ignoring an escalating
              warning is a durable run decision.
            </p>
          </div>
        </section>
      </CareerDisclosure>

      <CareerDisclosure eyebrow="Explicit reserves" title="Savings and costs">
        <section className="panel" aria-labelledby="savings-title">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Explicit reserves</span>
              <h2 id="savings-title">Savings and costs</h2>
            </div>
          </div>
          <p className="concept-note">
            All route costs are charged as configured operating cost plus local
            electricity at $0.24/kWh. Cash cannot go below zero; unpaid costs
            stay visible and future route income pays them first.
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
      </CareerDisclosure>

      <CareerDisclosure
        eyebrow="Durable local models"
        title="Model tiers and quantization"
      >
        <section className="panel" aria-labelledby="model-tier-title">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Durable local models</span>
              <h2 id="model-tier-title">Model tiers and quantization</h2>
            </div>
          </div>
          <p className="concept-note">
            A tier modifies a model stage in the one current pipeline. It is not
            a new work queue, vendor countdown, or second pipeline.
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
                      {tier.description}{" "}
                      {formatModelTierRequirement(unlock.requirement)}
                    </small>
                  </span>
                  <span className="choice-stat">
                    {unlock.unlocked
                      ? active
                        ? "ACTIVE"
                        : "SELECT"
                      : "LOCKED"}
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
      </CareerDisclosure>

      <CareerDisclosure
        eyebrow="Bounded offline policy"
        title="Safe freelance-only automation"
      >
        <section className="panel" aria-labelledby="offline-policy-title">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Bounded offline policy</span>
              <h2 id="offline-policy-title">Safe freelance-only automation</h2>
            </div>
          </div>
          <p className="concept-note">
            Player-authored only. It can perform bounded freelance work when
            safe; it can never buy, submit, release, schedule
            product/competition work, or create unpaid cost. A pending player
            schedule always wins.
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
              onClick={onApplySafeOfflinePolicyNow}
            >
              Apply safe offline policy now
            </button>
          </div>
          {career.offlinePolicy.lastReport ? (
            <p className="offline-report" role="status">
              Offline report:{" "}
              {career.offlinePolicy.lastReport.appliedHours.toFixed(2)}h applied
              · {exactMoney(career.offlinePolicy.lastReport.gross)} gross ·{" "}
              {exactMoney(career.offlinePolicy.lastReport.configuredCost)}{" "}
              configured cost · {career.offlinePolicy.lastReport.stoppedReason}.
            </p>
          ) : null}
        </section>
      </CareerDisclosure>

      <CareerDisclosure
        eyebrow="Exit checklist and irreversible conclusion"
        title="Independent conclusion"
      >
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
          <p className="career-exit" role="status">
            Bedroom Developer exit: save{" "}
            {compactMoney(BEDROOM_EXIT_SAVINGS_REQUIRED)}, submit one Cup entry,
            release Deskflow Local, and unlock Kiln 13B. Current:{" "}
            {exactMoney(career.savings)} · {career.competition.submissions}/1
            submission ·{" "}
            {career.product.released
              ? "product released"
              : "product unreleased"}{" "}
            ·{" "}
            {career.unlockedModelTierIds.includes("kiln-13b")
              ? "Kiln unlocked"
              : "Kiln locked"}
            .
          </p>
        </section>
      </CareerDisclosure>

      <CareerDisclosure
        eyebrow="Information-only replay memory"
        title="Diagnostics"
      >
        <DiagnosticMemory state={state} />
      </CareerDisclosure>
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
        <ComparisonDelta
          label={`${label} comparison`}
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

function InspectPriority({ state }: { state: SimulationState }) {
  const latestEvidence = [...state.ledger]
    .reverse()
    .find(
      (event) =>
        event.directCause || event.contributingCondition || event.causal,
    );
  const latestCause =
    latestEvidence?.directCause ??
    latestEvidence?.causal?.directCauses[0] ??
    latestEvidence?.contributingCondition ??
    null;
  const bottleneckSlot = getSlot(state.metrics.bottleneckSlotId);

  return (
    <section
      className="inspect-priority"
      aria-label="Current diagnostic priorities"
      data-testid="inspect-priority"
    >
      <article>
        <h3>
          <DecorativeGlyph>{glyphs.status.warning}</DecorativeGlyph> Dominant
          bottleneck
        </h3>
        <strong>{state.metrics.dominantBottleneck}</strong>
        <small>{bottleneckSlot.name} is the current constrained stage.</small>
      </article>
      <article>
        <h3>
          <DecorativeGlyph>{glyphs.status.active}</DecorativeGlyph> Baseline
          delta
        </h3>
        {state.baselineMetrics ? (
          <strong>
            <ComparisonDelta
              label="Throughput compared with baseline"
              current={state.metrics.throughputPerMinute}
              baseline={state.baselineMetrics.throughputPerMinute}
              suffix="/m"
              digits={1}
            />
          </strong>
        ) : (
          <strong>Capture a baseline</strong>
        )}
        <small>
          {state.baselineMetrics
            ? `${state.baselineLabel ?? "Saved baseline"} remains available in exact comparison.`
            : "Save this configuration before testing a change."}
        </small>
      </article>
      <article>
        <h3>
          <DecorativeGlyph>{glyphs.resource.evidence}</DecorativeGlyph> Latest
          causal evidence
        </h3>
        <strong>{latestCause ?? "No causal record yet"}</strong>
        <small>
          {latestEvidence
            ? `Recorded event ${latestEvidence.id}; see the recent event log for full accounting details.`
            : "Queue and settle a job to record a configuration result."}
        </small>
      </article>
    </section>
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
  supplemental,
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
  supplemental?: ReactNode;
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
        <InspectPriority state={state} />
        {supplemental ? (
          <div className="inspect-supplemental">{supplemental}</div>
        ) : null}
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
  const {
    state,
    command,
    commandBatch,
    hasDurablePersistenceFailure,
    workerResponseBoundaries,
    consumeWorkerResponseBoundariesThrough,
    lastDurableRequestId,
    timeSpeed,
    setTimeSpeed,
  } = useSimulation();
  // CareerView is conditionally mounted by tab. Keep this unsubmitted schedule
  // at App scope so Worker ticks and tab visits cannot erase player edits.
  const careerScheduleDraft = useCareerScheduleDraft(
    state,
    lastDurableRequestId,
    hasDurablePersistenceFailure,
  );
  const [careerCompletionFeedback, setCareerCompletionFeedback] =
    useState<CareerCompletionFeedback | null>(null);
  const [tab, setTab] = useState<TabId>("build");
  const [selected, setSelected] = useState<PendingPlacement | null>(null);
  const [selectedStageId, setSelectedStageId] = useState("prepare");
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
  const headerSettingsRef = useRef<HTMLDetailsElement>(null);
  const helpOriginRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const detailOriginRef = useRef<HTMLElement | null>(null);
  const placementOriginRef = useRef<HTMLElement | null>(null);
  const careerFeedbackTransactionsRef = useRef(
    createCareerFeedbackTransactionRegistry(),
  );
  const tabScrollPositions = useRef<Record<TabId, number>>({
    build: 0,
    jobs: 0,
    career: 0,
    upgrades: 0,
    inspect: 0,
    research: 0,
    world: 0,
  });

  const clearCareerCompletionFeedbackForRequest = useCallback(
    (requestId: number) => {
      setCareerCompletionFeedback((current) =>
        current?.requestId === requestId ? null : current,
      );
    },
    [],
  );

  const runCareerEvening = useCallback(() => {
    const allocations = { ...careerScheduleDraft.draft };
    let requestId: number | null = null;
    const accepted = careerScheduleDraft.runScheduledEvening(
      commandBatch,
      (submittedRequestId) => {
        requestId = submittedRequestId;
      },
    );
    if (!accepted || requestId === null) return false;
    registerCareerFeedbackTransaction(careerFeedbackTransactionsRef.current, {
      kind: "scheduled-evening",
      allocations,
      requestId,
    });
    return true;
  }, [careerScheduleDraft, commandBatch]);

  const applySafeOfflinePolicyNow = useCallback(() => {
    const requestId = command({
      type: "APPLY_OFFLINE_POLICY",
      requestedHours: 4,
    });
    if (requestId === null) return;
    registerCareerFeedbackTransaction(careerFeedbackTransactionsRef.current, {
      kind: "safe-offline",
      requestId,
    });
  }, [command]);

  useEffect(() => {
    if (state.career.runEnding) {
      clearCareerFeedbackTransactions(careerFeedbackTransactionsRef.current);
      setCareerCompletionFeedback(null);
    } else {
      for (const boundary of workerResponseBoundaries) {
        const transaction = claimCareerFeedbackTransaction(
          careerFeedbackTransactionsRef.current,
          boundary.requestId,
        );
        if (!transaction) continue;

        const completedEvening =
          boundary.after.career.schedule.completedEvenings >
          boundary.before.career.schedule.completedEvenings;
        if (!completedEvening) {
          // A rejection/non-completion invalidates only this exact request;
          // previously completed request entries remain independently durable.
          invalidateCareerFeedbackTransaction(
            careerFeedbackTransactionsRef.current,
            boundary.requestId,
          );
          clearCareerCompletionFeedbackForRequest(boundary.requestId);
          continue;
        }

        const projection =
          transaction.kind === "scheduled-evening"
            ? projectCareerEvening(boundary.before, transaction.allocations)
            : offlineCareerCompletionProjection(
                boundary.before,
                boundary.after,
              );
        if (!projection) {
          invalidateCareerFeedbackTransaction(
            careerFeedbackTransactionsRef.current,
            boundary.requestId,
          );
          clearCareerCompletionFeedbackForRequest(boundary.requestId);
          continue;
        }

        completeCareerFeedbackTransaction(transaction, {
          requestId: boundary.requestId,
          evening: boundary.after.career.schedule.completedEvenings,
          projection,
          nextDecision: nextCareerDecision(boundary.after),
        });
      }

      const completed = drainDurablyAcknowledgedCareerFeedback(
        careerFeedbackTransactionsRef.current,
        lastDurableRequestId,
      );
      if (completed.length > 0) {
        const latest = completed.reduce((current, candidate) =>
          candidate.requestId > current.requestId ? candidate : current,
        );
        setCareerCompletionFeedback((current) =>
          current !== null && current.requestId > latest.requestId
            ? current
            : latest,
        );
      }
    }

    const lastBoundary = workerResponseBoundaries.at(-1);
    if (lastBoundary)
      consumeWorkerResponseBoundariesThrough(lastBoundary.requestId);
  }, [
    clearCareerCompletionFeedbackForRequest,
    consumeWorkerResponseBoundariesThrough,
    lastDurableRequestId,
    state.career.runEnding,
    workerResponseBoundaries,
  ]);

  useEffect(() => {
    setCareerCompletionFeedback((current) =>
      current && state.career.schedule.completedEvenings < current.evening
        ? null
        : current,
    );
  }, [state.career.schedule.completedEvenings]);

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
    if (state.slots.some((slot) => slot.slotId === selectedStageId)) return;
    const nextStage = state.slots.find(
      (slot) => getSlot(slot.slotId).type === "process",
    );
    setSelectedStageId(
      nextStage?.slotId ?? state.slots[0]?.slotId ?? "prepare",
    );
  }, [selectedStageId, state.slots]);

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
  const onboarding = selectFirstSessionPresentation(
    state,
    selected?.moduleId ?? null,
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
    if (!modules.some((module) => module.id === moduleId)) return;
    if (fromSlotId) setSelectedStageId(fromSlotId);
    detailOriginRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setModuleDetail({ moduleId, fromSlotId });
  };

  const selectStage = (slotId: string) => {
    setSelectedStageId(slotId);
    // A stage-specific Details surface owns remove/bypass. Do not leave it
    // actionable after the player has selected another rail position.
    setModuleDetail((current) =>
      current?.fromSlotId && current.fromSlotId !== slotId ? null : current,
    );
  };

  const beginPlacement = (moduleId: string, fromSlotId?: string) => {
    if (!state.ownedModuleIds.includes(moduleId)) return;
    if (fromSlotId) setSelectedStageId(fromSlotId);
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
    const origin = helpOriginRef.current;
    helpOriginRef.current = null;
    if (origin)
      requestAnimationFrame(() => {
        if (origin.isConnected) origin.focus();
      });
  };

  const openQuickStart = () => {
    helpOriginRef.current =
      headerSettingsRef.current?.querySelector<HTMLElement>("summary") ?? null;
    headerSettingsRef.current?.removeAttribute("open");
    setShowTutorial(true);
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
  const inspectSupplemental = (
    <>
      <UpgradeFeedback state={state} />
      {secondaryControls}
    </>
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
            <details className="header-settings" ref={headerSettingsRef}>
              <summary aria-label="Help and motion settings">
                Help &amp; motion
              </summary>
              <div className="header-settings-panel">
                <button
                  type="button"
                  className="help-toggle"
                  aria-label="Help / Quick start"
                  aria-expanded={showTutorial}
                  aria-controls="quick-start-title"
                  onClick={openQuickStart}
                >
                  Open quick start
                </button>
                <div className="animation-control">
                  <button
                    type="button"
                    className="motion-toggle"
                    aria-label={
                      reducedMotion ? "Animations off" : "Animations on"
                    }
                    aria-pressed={reducedMotion}
                    onClick={() => setReducedMotion((value) => !value)}
                  >
                    {reducedMotion ? "Motion off" : "Motion on"}
                  </button>
                  <small>Visual only; simulation time is unchanged.</small>
                </div>
              </div>
            </details>
          </div>
          <ResourceStrip state={state} />
        </header>

        <main id="main-content" className={`main-content ${tab}-content`}>
          {tab !== "build" && tab !== "inspect" ? secondaryControls : null}
          {tab !== "inspect" && tab !== "jobs" ? (
            <FirstSessionGuide presentation={onboarding} currentTab={tab} />
          ) : null}
          {tab !== "inspect" ? <UpgradeFeedback state={state} /> : null}

          {tab === "build" ? (
            <BuildView
              state={state}
              command={command}
              onboarding={onboarding}
              selected={selected}
              selectedStageId={selectedStageId}
              detail={moduleDetail}
              onSelectStage={selectStage}
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
            <>
              <FirstSessionGuide presentation={onboarding} currentTab={tab} />
              <JobsView
                state={state}
                command={command}
                commandBatch={commandBatch}
                reducedMotion={reducedMotion}
                usefulTarget={usefulTarget}
                onUsefulTargetChange={setUsefulTarget}
                onboarding={onboarding}
              />
            </>
          ) : tab === "career" ? (
            <CareerView
              state={state}
              command={command}
              scheduleDraft={careerScheduleDraft.draft}
              scheduledDraftHours={careerScheduleDraft.scheduledHours}
              onScheduleDraftChange={careerScheduleDraft.setRouteHours}
              hasDurablePersistenceFailure={hasDurablePersistenceFailure}
              isRunBlocked={careerScheduleDraft.isRunBlocked}
              onRunScheduledEvening={runCareerEvening}
              onApplySafeOfflinePolicyNow={applySafeOfflinePolicyNow}
              completionFeedback={careerCompletionFeedback}
            />
          ) : tab === "upgrades" ? (
            <UpgradesView
              state={state}
              command={command}
              onboarding={onboarding}
              pendingPlacementModuleId={selected?.moduleId ?? null}
              onChooseModule={(moduleId) => {
                const equippedSlot = state.slots.find(
                  (slot) => slot.moduleId === moduleId,
                );
                beginPlacement(moduleId, equippedSlot?.slotId);
                // The first-session handoff intentionally leaves the player on
                // Upgrades: they choose when to switch to Build, preserving the
                // current scroll position and any in-progress comparison.
                if (
                  onboarding.active &&
                  moduleId === onboarding.recommendedModuleId
                )
                  return;
                switchTab("build", true);
              }}
            />
          ) : tab === "research" ? (
            <ResearchView state={state} command={command} />
          ) : tab === "world" ? (
            <WorldView state={state} command={command} />
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
              supplemental={inspectSupplemental}
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
            onClick={() => switchTab(id, id === "build" && selected !== null)}
          >
            <DecorativeGlyph>{icon}</DecorativeGlyph>
            <span className="tab-label">{label}</span>
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
