import { useCallback, useEffect, useRef, useState } from "react";
import { restoreSimulationStateWithReport } from "../simulation/engine";
import type {
  SimulationCommand,
  SimulationState,
  WorkerRequest,
  WorkerResponse,
} from "../simulation/types";
import {
  acknowledgeDurableState,
  markDurableCommandPending,
} from "./offlineReadiness";
import {
  persistSaveRecovery,
  readSaveRecoveryStatus,
  clearSaveRecoveryStatus,
} from "../simulation/saveRecovery";
import type { SaveRecoveryStatus } from "../simulation/types";

export const TIME_SPEEDS = [1, 4, 16, 64] as const;
export type TimeSpeed = (typeof TIME_SPEEDS)[number];
type DurableWorkerRequest =
  | { type: "COMMAND"; command: SimulationCommand }
  | { type: "COMMAND_BATCH"; commands: readonly SimulationCommand[] };

/**
 * One exact Worker command response, including the state immediately before it
 * ran. Consumers that need presentation-only command attribution must use this
 * boundary rather than a potentially stale React snapshot taken while requests
 * are still queued.
 */
export interface WorkerResponseBoundary {
  requestId: number;
  before: SimulationState;
  after: SimulationState;
}
// Keep the established storage address so verifier-owned browser probes and
// existing sessions observe the schema-6 migration in place. The payload's
// schemaVersion, not this opaque key, is the save contract.
export const SAVE_KEY = "goldilocks-simulation-save-v4";
export const LEGACY_SAVE_KEYS = ["goldilocks-simulation-save-v3"] as const;
export const OFFLINE_SAVED_AT_KEY = "goldilocks-simulation-offline-saved-at-v1";

const isTimeSpeed = (value: number): value is TimeSpeed =>
  TIME_SPEEDS.some((speed) => speed === value);

const isDurableRequestId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

interface SavedStateRecord {
  value: unknown;
  raw: string | null;
  sourceKey: string;
}

function loadSavedState(): SavedStateRecord {
  try {
    let sourceKey = SAVE_KEY;
    let serialized = localStorage.getItem(SAVE_KEY);
    if (serialized === null) {
      const legacy = LEGACY_SAVE_KEYS.map((key) => ({
        key,
        value: localStorage.getItem(key),
      })).find((entry) => entry.value !== null);
      sourceKey = legacy?.key ?? SAVE_KEY;
      serialized = legacy?.value ?? null;
    }
    if (serialized === null) return { value: undefined, raw: null, sourceKey };
    try {
      return {
        value: JSON.parse(serialized) as unknown,
        raw: serialized,
        sourceKey,
      };
    } catch {
      return { value: undefined, raw: serialized, sourceKey };
    }
  } catch {
    return { value: undefined, raw: null, sourceKey: SAVE_KEY };
  }
}

function persistState(state: SimulationState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    localStorage.setItem(OFFLINE_SAVED_AT_KEY, String(Date.now()));
    for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key);
    return true;
  } catch {
    // Storage failure leaves the current in-memory run operable.
    return false;
  }
}

function offlineElapsedHours(): number {
  try {
    const savedAt = Number(localStorage.getItem(OFFLINE_SAVED_AT_KEY));
    if (!Number.isFinite(savedAt) || savedAt <= 0) return 0;
    return Math.min(24, Math.max(0, (Date.now() - savedAt) / 3_600_000));
  } catch {
    return 0;
  }
}

export function persistBeforePublish<T>(
  value: T,
  persist: (next: T) => boolean,
  publish: (next: T) => void,
): boolean {
  const durable = persist(value);
  publish(value);
  return durable;
}

export function useSimulation() {
  const savedRecordRef = useRef<SavedStateRecord>(loadSavedState());
  const savedStateRef = useRef<unknown>(savedRecordRef.current.value);
  const initialRestoreRef = useRef(
    restoreSimulationStateWithReport(
      savedStateRef.current,
      20260715,
      savedRecordRef.current.raw !== null,
    ),
  );
  const [state, setState] = useState<SimulationState>(
    () => initialRestoreRef.current.state,
  );
  const [saveRecoveryStatus, setSaveRecoveryStatus] =
    useState<SaveRecoveryStatus | null>(() => {
      const initial = initialRestoreRef.current.recovery;
      if (initial.disposition !== "none") return initial;
      return readSaveRecoveryStatus();
    });
  const shouldApplyInitialOfflineRef = useRef(
    savedStateRef.current !== undefined && state.career.offlinePolicy.enabled,
  );
  const workerRef = useRef<Worker | null>(null);
  const workerStateRef = useRef(state);
  const nextRequestIdRef = useRef(1);
  // A later Worker publication includes every command processed before it.
  // Keep that watermark separate from the last *persisted* acknowledgement.
  const highestWorkerRequestIdRef = useRef(0);
  const initialOfflineHoursRef = useRef(offlineElapsedHours());
  const initialOfflineAppliedRef = useRef(false);
  const speedRef = useRef<TimeSpeed>(1);
  const [timeSpeed, setTimeSpeedState] = useState<TimeSpeed>(1);
  // React can batch several Worker callbacks into one render. Keep each exact
  // command boundary until the App has processed it, rather than replacing an
  // earlier boundary with the latest response snapshot.
  const [workerResponseBoundaries, setWorkerResponseBoundaries] = useState<
    readonly WorkerResponseBoundary[]
  >([]);
  const [lastDurableRequestId, setLastDurableRequestId] = useState(0);
  const [hasDurablePersistenceFailure, setHasDurablePersistenceFailure] =
    useState(false);
  const dismissSaveRecoveryStatus = useCallback(() => {
    clearSaveRecoveryStatus();
    setSaveRecoveryStatus(null);
  }, []);

  const postDurableRequest = useCallback((request: DurableWorkerRequest) => {
    const worker = workerRef.current;
    if (!worker) return null;
    const requestId = nextRequestIdRef.current++;
    markDurableCommandPending(requestId);
    worker.postMessage({ ...request, requestId } as WorkerRequest);
    return requestId;
  }, []);

  const consumeWorkerResponseBoundariesThrough = useCallback(
    (requestId: number) => {
      if (!isDurableRequestId(requestId)) return;
      setWorkerResponseBoundaries((current) => {
        const firstUnconsumed = current.findIndex(
          (boundary) => boundary.requestId > requestId,
        );
        return firstUnconsumed < 0 ? [] : current.slice(firstUnconsumed);
      });
    },
    [],
  );

  useEffect(() => {
    const recovery = initialRestoreRef.current.recovery;
    if (recovery.disposition !== "none") {
      const backupCreated =
        savedRecordRef.current.raw !== null &&
        persistSaveRecovery(
          { ...recovery, backupCreated: savedRecordRef.current.raw !== null },
          savedRecordRef.current.raw,
          savedStateRef.current,
          localStorage,
          Date.now(),
          savedRecordRef.current.sourceKey,
        );
      setSaveRecoveryStatus({ ...recovery, backupCreated });
    }
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("../simulation/worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const before = workerStateRef.current;
        workerStateRef.current = event.data.state;
        const requestId = event.data.requestId;
        if (isDurableRequestId(requestId)) {
          setWorkerResponseBoundaries((current) => [
            ...current,
            {
              requestId,
              before,
              after: event.data.state,
            },
          ]);
          highestWorkerRequestIdRef.current = Math.max(
            highestWorkerRequestIdRef.current,
            requestId,
          );
        }
        const durable = persistBeforePublish(
          event.data.state,
          persistState,
          setState,
        );
        acknowledgeDurableState(event.data.requestId, durable);
        setHasDurablePersistenceFailure(!durable);
        // A Worker response is not itself a durable acknowledgement. Only a
        // successful write may release Career's exact-once Run lock. A later
        // persisted tick/response safely covers every previously observed
        // command because this Worker processes requests in order.
        if (durable && highestWorkerRequestIdRef.current > 0)
          setLastDurableRequestId((current) =>
            Math.max(current, highestWorkerRequestIdRef.current),
          );
        if (
          !initialOfflineAppliedRef.current &&
          savedStateRef.current !== undefined &&
          shouldApplyInitialOfflineRef.current &&
          initialOfflineHoursRef.current > 0
        ) {
          initialOfflineAppliedRef.current = true;
          postDurableRequest({
            type: "COMMAND",
            command: {
              type: "APPLY_OFFLINE_POLICY",
              requestedHours: initialOfflineHoursRef.current,
            },
          });
        }
      },
    );
    worker.postMessage({
      type: "INIT",
      savedState: savedStateRef.current,
    } satisfies WorkerRequest);
    const interval = window.setInterval(() => {
      worker.postMessage({
        type: "TICK",
        seconds: 0.5 * speedRef.current,
      } satisfies WorkerRequest);
    }, 500);
    return () => {
      window.clearInterval(interval);
      worker.terminate();
      workerRef.current = null;
    };
  }, [postDurableRequest]);

  const command = useCallback(
    (next: SimulationCommand) => {
      return postDurableRequest({
        type: "COMMAND",
        command: next,
      });
    },
    [postDurableRequest],
  );

  const commandBatch = useCallback(
    (commands: readonly SimulationCommand[]) => {
      return postDurableRequest({ type: "COMMAND_BATCH", commands });
    },
    [postDurableRequest],
  );

  const setTimeSpeed = useCallback((next: number) => {
    if (!isTimeSpeed(next)) return;
    speedRef.current = next;
    setTimeSpeedState(next);
  }, []);

  return {
    state,
    command,
    commandBatch,
    hasDurablePersistenceFailure,
    workerResponseBoundaries,
    consumeWorkerResponseBoundariesThrough,
    lastDurableRequestId,
    saveRecoveryStatus,
    dismissSaveRecoveryStatus,
    timeSpeed,
    setTimeSpeed,
  };
}
