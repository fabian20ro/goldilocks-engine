import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CareerRoute,
  SimulationCommand,
  SimulationState,
} from "../simulation/types";

/** One App-session draft; the Worker owns only the committed evening schedule. */
export type CareerScheduleDraft = Record<CareerRoute, number>;
export type CareerScheduleBatchSubmitter = (
  commands: readonly SimulationCommand[],
) => number | null;

export const CAREER_DRAFT_ROUTES: readonly CareerRoute[] = [
  "freelance",
  "competition",
  "product",
  "maintenance",
];

const EVENING_HOURS = 4;
const QUARTER_HOUR = 0.25;

function clampQuarterHour(value: number): number {
  const bounded = Math.min(EVENING_HOURS, Math.max(0, value));
  return Number((Math.round(bounded / QUARTER_HOUR) * QUARTER_HOUR).toFixed(2));
}

/**
 * Restored Worker data is already valid, but normalizing here keeps a draft
 * safe even when a browser input produces an intermediate decimal value.
 */
export function normalizeCareerScheduleDraft(
  allocations: Readonly<Record<CareerRoute, number>>,
): CareerScheduleDraft {
  let remaining = EVENING_HOURS;
  const normalized = {} as CareerScheduleDraft;
  for (const route of CAREER_DRAFT_ROUTES) {
    const candidate = allocations[route];
    const hours = Number.isFinite(candidate) ? clampQuarterHour(candidate) : 0;
    normalized[route] = Math.min(remaining, hours);
    remaining = Number((remaining - normalized[route]).toFixed(2));
  }
  return normalized;
}

export function replaceCareerScheduleHours(
  draft: CareerScheduleDraft,
  route: CareerRoute,
  value: number,
): CareerScheduleDraft {
  if (!Number.isFinite(value)) return draft;
  const normalized = normalizeCareerScheduleDraft(draft);
  const otherHours = CAREER_DRAFT_ROUTES.reduce(
    (total, candidate) =>
      total + (candidate === route ? 0 : normalized[candidate]),
    0,
  );
  return {
    ...normalized,
    [route]: Math.min(EVENING_HOURS - otherHours, clampQuarterHour(value)),
  };
}

export function careerScheduleDraftHours(
  draft: Readonly<Record<CareerRoute, number>>,
): number {
  return Number(
    CAREER_DRAFT_ROUTES.reduce(
      (total, route) => total + draft[route],
      0,
    ).toFixed(2),
  );
}

/** Keep the established four allocations plus one RUN_EVENING Worker batch. */
export function createCareerScheduleCommandBatch(
  draft: CareerScheduleDraft,
): readonly SimulationCommand[] {
  const normalized = normalizeCareerScheduleDraft(draft);
  return [
    ...CAREER_DRAFT_ROUTES.map((route) => ({
      type: "SET_EVENING_ALLOCATION" as const,
      route,
      hours: normalized[route],
    })),
    { type: "RUN_EVENING" },
  ];
}

/**
 * Object identity is deliberately absent: tick publications clone the Worker
 * snapshot. Only a completed evening, a replay/reset, or an ending may replace
 * the App-session draft with the Worker schedule.
 */
export function careerScheduleDraftBoundary(
  state: Pick<SimulationState, "seed" | "career" | "meta">,
): string {
  const ending = state.career.runEnding;
  return [
    state.seed,
    state.meta.replayCount,
    state.career.schedule.completedEvenings,
    ending?.id ?? "",
    ending?.eventId ?? "",
  ].join(":");
}

export function latestCareerScheduleWorkerRejection(
  state: Pick<SimulationState, "ledger">,
): string | null {
  for (const event of [...state.ledger].reverse()) {
    if (/^Evening \d+ closed after /.test(event.message)) return null;
    if (
      event.kind === "warning" &&
      /^(Evening allocation rejected:|No evening was run:)/.test(event.message)
    )
      return event.message;
  }
  return null;
}

export function useCareerScheduleDraft(
  state: Pick<SimulationState, "seed" | "career" | "meta">,
  lastDurableRequestId = 0,
  hasDurablePersistenceFailure = false,
) {
  const workerAllocations = state.career.schedule.allocations;
  const boundary = careerScheduleDraftBoundary(state);
  const lastBoundary = useRef(boundary);
  const [draft, setDraft] = useState<CareerScheduleDraft>(() =>
    normalizeCareerScheduleDraft(workerAllocations),
  );
  const pendingRunRequestId = useRef<number | null>(null);
  const [isRunPending, setIsRunPending] = useState(false);
  const isRunBlocked = isRunPending || hasDurablePersistenceFailure;

  useEffect(() => {
    if (lastBoundary.current === boundary) return;
    lastBoundary.current = boundary;
    setDraft(normalizeCareerScheduleDraft(workerAllocations));
  }, [boundary, workerAllocations]);

  const setRouteHours = useCallback((route: CareerRoute, value: number) => {
    setDraft((current) => replaceCareerScheduleHours(current, route, value));
  }, []);

  useEffect(() => {
    const requestId = pendingRunRequestId.current;
    if (requestId === null || requestId < 1 || lastDurableRequestId < requestId)
      return;
    pendingRunRequestId.current = null;
    setIsRunPending(false);
  }, [lastDurableRequestId]);

  const runScheduledEvening = useCallback(
    (submitBatch: CareerScheduleBatchSubmitter): boolean => {
      // Set the ref before posting so two synchronous pointer/click events can
      // never enqueue two Worker batches before React disables the control.
      if (hasDurablePersistenceFailure || pendingRunRequestId.current !== null)
        return false;
      pendingRunRequestId.current = -1;
      setIsRunPending(true);
      const requestId = submitBatch(createCareerScheduleCommandBatch(draft));
      if (
        requestId === null ||
        !Number.isSafeInteger(requestId) ||
        requestId < 1
      ) {
        pendingRunRequestId.current = null;
        setIsRunPending(false);
        return false;
      }
      pendingRunRequestId.current = requestId;
      if (lastDurableRequestId >= requestId) {
        pendingRunRequestId.current = null;
        setIsRunPending(false);
      }
      return true;
    },
    [draft, hasDurablePersistenceFailure, lastDurableRequestId],
  );

  return {
    draft,
    scheduledHours: useMemo(() => careerScheduleDraftHours(draft), [draft]),
    setRouteHours,
    isRunPending,
    isRunBlocked,
    runScheduledEvening,
  };
}
