/// <reference lib="webworker" />

import { createInitialState } from "./engine";
import type { SimulationState, WorkerRequest, WorkerResponse } from "./types";
import { reduceWorkerRequest } from "./workerProtocol";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
let state: SimulationState = createInitialState();

scope.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  state = reduceWorkerRequest(state, event.data);
  const response: WorkerResponse = { type: "STATE", state };
  scope.postMessage(response);
});
