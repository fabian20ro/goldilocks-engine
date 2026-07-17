import { describe, expect, it } from "vitest";
import { createInitialState } from "./engine";
import { reduceWorkerRequest } from "./workerProtocol";
import type { WorkerRequest } from "./types";

describe("verifier round 023 Worker command boundary", () => {
  it("rejects an unknown direct command without throwing or mutating state", () => {
    const before = createInitialState(23);
    const request = {
      type: "COMMAND",
      command: { type: "UNKNOWN_COMMAND" },
    } as unknown as WorkerRequest;

    expect(() => reduceWorkerRequest(before, request)).not.toThrow();
    expect(reduceWorkerRequest(before, request)).toEqual(before);
  });

  it("rejects an unknown batched command without throwing or partially applying it", () => {
    const before = createInitialState(24);
    const request = {
      type: "COMMAND_BATCH",
      commands: [
        { type: "SET_COMPUTE_ALLOCATION", percent: 25 },
        { type: "UNKNOWN_COMMAND" },
      ],
    } as unknown as WorkerRequest;

    expect(() => reduceWorkerRequest(before, request)).not.toThrow();
    expect(reduceWorkerRequest(before, request)).toEqual(before);
  });
});
