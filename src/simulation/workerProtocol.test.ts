import { describe, expect, it } from "vitest";
import { createInitialState, isStateValid } from "./engine";
import type { SimulationCommand, WorkerRequest } from "./types";
import { reduceWorkerRequest } from "./workerProtocol";

describe("simulation worker numeric protocol", () => {
  it("rejects malformed numeric requests as exact no-ops", () => {
    const initial = createInitialState(101);
    const malformed = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      "4",
      null,
      undefined,
    ] as const;

    for (const value of malformed) {
      expect(
        reduceWorkerRequest(initial, {
          type: "TICK",
          seconds: value as number,
        }),
      ).toBe(initial);

      const commands: SimulationCommand[] = [
        {
          type: "SET_COMPUTE_ALLOCATION",
          percent: value as number,
        },
        { type: "SET_MEMORY_RESERVE", percent: value as number },
        { type: "QUEUE_JOBS", count: value as number },
      ];
      for (const command of commands) {
        expect(reduceWorkerRequest(initial, { type: "COMMAND", command })).toBe(
          initial,
        );
      }

      if (value !== undefined) {
        expect(
          reduceWorkerRequest(initial, {
            type: "INIT",
            seed: value as number,
          }),
        ).toBe(initial);
        expect(
          reduceWorkerRequest(initial, {
            type: "COMMAND",
            command: { type: "RESET", seed: value as number },
          }),
        ).toBe(initial);
      }
    }

    expect(isStateValid(initial)).toBe(true);
  });

  it("forwards valid requests deterministically", () => {
    const initial = createInitialState(1);
    const requests: WorkerRequest[] = [
      { type: "INIT", seed: 2026 },
      {
        type: "COMMAND",
        command: { type: "QUEUE_JOBS", count: 4 },
      },
      { type: "TICK", seconds: 2 },
    ];
    const run = () => requests.reduce(reduceWorkerRequest, initial);

    expect(run()).toEqual(run());
    expect(isStateValid(run())).toBe(true);
  });
});
