import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createInitialState, isStateValid } from "./engine";
import type { WorkerRequest } from "./types";
import { reduceWorkerRequest } from "./workerProtocol";

describe("verifier round 024 malformed Worker protocol recovery", () => {
  it("keeps every arbitrary JSON envelope non-throwing and state-valid", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (request) => {
        const before = createInitialState(2_024);
        let next = before;
        expect(() => {
          next = reduceWorkerRequest(before, request as WorkerRequest);
        }).not.toThrow();
        expect(isStateValid(next)).toBe(true);
      }),
      { numRuns: 1_000 },
    );
  });

  it("preflights malformed nested runtime payloads before a valid prefix", () => {
    const malformedCommands: readonly unknown[] = [
      { type: "SET_COMPUTE_ALLOCATION", percent: "25" },
      { type: "SET_MEMORY_RESERVE", percent: null },
      { type: "QUEUE_JOBS", count: Number.NaN },
      { type: "RESET", seed: false },
      { type: "CAPTURE_BASELINE", label: 42 },
      { type: "SET_EXPANSION_ACTIVE", active: "true" },
      { type: "UNKNOWN_COMMAND" },
    ];

    for (const command of malformedCommands) {
      const before = createInitialState(2_025);
      const batch = {
        type: "COMMAND_BATCH",
        commands: [{ type: "SET_COMPUTE_ALLOCATION", percent: 25 }, command],
      } as unknown as WorkerRequest;

      expect(() => reduceWorkerRequest(before, batch)).not.toThrow();
      expect(reduceWorkerRequest(before, batch)).toBe(before);
    }
  });
});
