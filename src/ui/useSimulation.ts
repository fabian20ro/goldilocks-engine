import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialState } from "../simulation/engine";
import type {
  SimulationCommand,
  SimulationState,
  WorkerRequest,
  WorkerResponse,
} from "../simulation/types";

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() =>
    createInitialState(),
  );
  const workerRef = useRef<Worker | null>(null);

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
      worker.postMessage({ type: "TICK", seconds: 3 } satisfies WorkerRequest);
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

  return { state, command };
}
