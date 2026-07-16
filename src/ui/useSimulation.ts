import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialState } from "../simulation/engine";
import type {
  SimulationCommand,
  SimulationState,
  WorkerRequest,
  WorkerResponse,
} from "../simulation/types";

export const TIME_SPEEDS = [1, 4, 16] as const;
export type TimeSpeed = (typeof TIME_SPEEDS)[number];

const isTimeSpeed = (value: number): value is TimeSpeed =>
  TIME_SPEEDS.some((speed) => speed === value);

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() =>
    createInitialState(),
  );
  const workerRef = useRef<Worker | null>(null);
  const speedRef = useRef<TimeSpeed>(1);
  const [timeSpeed, setTimeSpeedState] = useState<TimeSpeed>(1);

  useEffect(() => {
    const worker = new Worker(
      new URL("../simulation/worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) =>
      setState(event.data.state),
    );
    worker.postMessage({ type: "INIT" } satisfies WorkerRequest);
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
  }, []);

  const command = useCallback((next: SimulationCommand) => {
    workerRef.current?.postMessage({
      type: "COMMAND",
      command: next,
    } satisfies WorkerRequest);
  }, []);

  const setTimeSpeed = useCallback((next: number) => {
    if (!isTimeSpeed(next)) return;
    speedRef.current = next;
    setTimeSpeedState(next);
  }, []);

  return { state, command, timeSpeed, setTimeSpeed };
}
