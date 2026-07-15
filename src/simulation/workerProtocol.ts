import { applyCommand, createInitialState, tick } from "./engine";
import type { SimulationState, WorkerRequest } from "./types";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function reduceWorkerRequest(
  state: SimulationState,
  request: WorkerRequest,
): SimulationState {
  switch (request.type) {
    case "INIT":
      if (request.seed !== undefined && !isFiniteNumber(request.seed))
        return state;
      return createInitialState(request.seed);
    case "COMMAND":
      return applyCommand(state, request.command);
    case "TICK":
      return tick(state, request.seconds);
    default:
      return state;
  }
}
