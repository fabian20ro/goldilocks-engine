/// <reference lib="webworker" />

import { applyCommand, createInitialState, tick } from "./engine";
import type { SimulationState, WorkerRequest, WorkerResponse } from "./types";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
let state: SimulationState = createInitialState();

scope.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "INIT") state = createInitialState(request.seed);
  else if (request.type === "COMMAND")
    state = applyCommand(state, request.command);
  else state = tick(state, request.seconds);
  const response: WorkerResponse = { type: "STATE", state };
  scope.postMessage(response);
});
