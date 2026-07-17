/// <reference lib="webworker" />

import { createInitialState } from "./engine";
import type { SimulationState, WorkerRequest, WorkerResponse } from "./types";
import { reduceWorkerRequest } from "./workerProtocol";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
let state: SimulationState = createInitialState();

function requestIdFrom(request: unknown): number | undefined {
  if (typeof request !== "object" || request === null) return undefined;
  const requestId = (request as { requestId?: unknown }).requestId;
  return typeof requestId === "number" && Number.isFinite(requestId)
    ? requestId
    : undefined;
}

scope.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  state = reduceWorkerRequest(state, request);
  const response: WorkerResponse = {
    type: "STATE",
    state,
    requestId: requestIdFrom(request),
  };
  scope.postMessage(response);
});
