import {
  applyCommand,
  createInitialState,
  isRuntimeSimulationCommand,
  restoreSimulationState,
  tick,
} from "./engine";
import type {
  CareerRoute,
  SimulationCommand,
  SimulationState,
  WorkerRequest,
} from "./types";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const CAREER_ROUTES: readonly CareerRoute[] = [
  "freelance",
  "competition",
  "product",
  "maintenance",
];
const EVENING_HOURS = 4;

function isValidCareerHours(value: number): boolean {
  return value >= 0 && value <= EVENING_HOURS && Number.isInteger(value * 4);
}

/**
 * The Career UI always submits one complete route replacement followed by Run.
 * Prepare that replacement against an empty unpublished schedule so a restored
 * valid allocation cannot reject a different valid draft on an intermediate
 * route command. Other command batches retain their established sequencing.
 */
function isCompleteCareerEveningBatch(
  commands: readonly SimulationCommand[],
): boolean {
  if (
    commands.length !== CAREER_ROUTES.length + 1 ||
    commands.at(-1)?.type !== "RUN_EVENING"
  )
    return false;
  const allocations = commands.slice(0, -1);
  if (
    !allocations.every(
      (
        command,
      ): command is Extract<
        SimulationCommand,
        { type: "SET_EVENING_ALLOCATION" }
      > =>
        command.type === "SET_EVENING_ALLOCATION" &&
        isValidCareerHours(command.hours),
    )
  )
    return false;
  const routes = allocations.map((command) => command.route);
  const hours = allocations.reduce(
    (total, command) => total + command.hours,
    0,
  );
  return (
    new Set(routes).size === CAREER_ROUTES.length &&
    CAREER_ROUTES.every((route) => routes.includes(route)) &&
    hours <= EVENING_HOURS
  );
}

function replaceCareerScheduleAtomically(
  state: SimulationState,
): SimulationState {
  return {
    ...state,
    career: {
      ...state.career,
      schedule: {
        ...state.career.schedule,
        allocations: {
          freelance: 0,
          competition: 0,
          product: 0,
          maintenance: 0,
        },
        hoursRemaining: EVENING_HOURS,
      },
    },
  };
}

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
      if (!isRuntimeSimulationCommand(request.command)) return state;
      return applyCommand(state, request.command);
    case "COMMAND_BATCH":
      if (
        !Array.isArray(request.commands) ||
        request.commands.length === 0 ||
        request.commands.length > 32 ||
        !request.commands.every(isRuntimeSimulationCommand)
      )
        return state;
      return request.commands.reduce(
        applyCommand,
        isCompleteCareerEveningBatch(request.commands)
          ? replaceCareerScheduleAtomically(state)
          : state,
      );
    case "TICK":
      return tick(state, request.seconds);
    default:
      return state;
  }
}
