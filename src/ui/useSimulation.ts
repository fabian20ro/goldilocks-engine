import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialState,
  restoreSimulationState,
} from "../simulation/engine";
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

export const TIME_SPEEDS = [1, 4, 16, 64] as const;
export type TimeSpeed = (typeof TIME_SPEEDS)[number];
type DurableWorkerRequest =
  | { type: "COMMAND"; command: SimulationCommand }
  | { type: "COMMAND_BATCH"; commands: readonly SimulationCommand[] };
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

function loadSavedState(): unknown {
  try {
    const serialized =
      localStorage.getItem(SAVE_KEY) ??
      LEGACY_SAVE_KEYS.map((key) => localStorage.getItem(key)).find(
        (value) => value !== null,
      );
    return serialized == null ? undefined : (JSON.parse(serialized) as unknown);
  } catch {
    return undefined;
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
  const savedStateRef = useRef<unknown>(loadSavedState());
  const [state, setState] = useState<SimulationState>(() =>
    savedStateRef.current === undefined
      ? createInitialState()
      : restoreSimulationState(savedStateRef.current),
  );
  const shouldApplyInitialOfflineRef = useRef(
    savedStateRef.current !== undefined && state.career.offlinePolicy.enabled,
  );
  const workerRef = useRef<Worker | null>(null);
  const nextRequestIdRef = useRef(1);
  // A later Worker publication includes every command processed before it.
  // Keep that watermark separate from the last *persisted* acknowledgement.
  const highestWorkerRequestIdRef = useRef(0);
  const initialOfflineHoursRef = useRef(offlineElapsedHours());
  const initialOfflineAppliedRef = useRef(false);
  const speedRef = useRef<TimeSpeed>(1);
  const [timeSpeed, setTimeSpeedState] = useState<TimeSpeed>(1);
  // This identifies the exact Worker response currently published in memory.
  // It is intentionally separate from the durable acknowledgement watermark.
  const [lastWorkerRequestId, setLastWorkerRequestId] = useState<number | null>(
    null,
  );
  const [lastDurableRequestId, setLastDurableRequestId] = useState(0);
  const [hasDurablePersistenceFailure, setHasDurablePersistenceFailure] =
    useState(false);

  const postDurableRequest = useCallback((request: DurableWorkerRequest) => {
    const worker = workerRef.current;
    if (!worker) return null;
    const requestId = nextRequestIdRef.current++;
    markDurableCommandPending(requestId);
    worker.postMessage({ ...request, requestId } as WorkerRequest);
    return requestId;
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
        if (isDurableRequestId(event.data.requestId))
          setLastWorkerRequestId(event.data.requestId);
        if (isDurableRequestId(event.data.requestId))
          highestWorkerRequestIdRef.current = Math.max(
            highestWorkerRequestIdRef.current,
            event.data.requestId,
          );
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
    lastWorkerRequestId,
    lastDurableRequestId,
    timeSpeed,
    setTimeSpeed,
  };
}
