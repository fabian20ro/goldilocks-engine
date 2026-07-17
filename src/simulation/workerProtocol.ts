import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  tick,
} from "./engine";
import type { SimulationState, WorkerRequest } from "./types";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function reduceWorkerRequest(
  state: SimulationState,
  request: WorkerRequest,
): SimulationState {
  if (typeof request !== "object" || request === null) return state;
  switch (request.type) {
    case "INIT":
      if (request.seed !== undefined && !isFiniteNumber(request.seed))
        return state;
      if (request.savedState !== undefined)
        return restoreSimulationState(request.savedState, request.seed);
      return createInitialState(request.seed);
    case "COMMAND":
      if (typeof request.command !== "object" || request.command === null)
        return state;
      return applyCommand(state, request.command);
    case "COMMAND_BATCH":
      if (
        !Array.isArray(request.commands) ||
        request.commands.length === 0 ||
        request.commands.length > 32 ||
        request.commands.some(
          (command) => typeof command !== "object" || command === null,
        )
      )
        return state;
      return request.commands.reduce(applyCommand, state);
    case "TICK":
      return tick(state, request.seconds);
    default:
      return state;
  }
}
