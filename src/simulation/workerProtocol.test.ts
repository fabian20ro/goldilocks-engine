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

  it("rejects malformed envelopes and restores persisted ownership safely", () => {
    const initial = createInitialState(303);
    const malformed = [
      null,
      undefined,
      "COMMAND",
      {},
      { type: "COMMAND" },
      { type: "COMMAND", command: null },
      { type: "COMMAND", command: { type: "CAPTURE_BASELINE" } },
    ];
    for (const request of malformed)
      expect(reduceWorkerRequest(initial, request as WorkerRequest)).toEqual(
        initial,
      );

    const missingPurchaseId = reduceWorkerRequest(initial, {
      type: "COMMAND",
      command: { type: "BUY_MODULE" } as SimulationCommand,
    });
    expect(isStateValid(missingPurchaseId)).toBe(true);
    expect(missingPurchaseId.resources.money).toBe(initial.resources.money);
    expect(missingPurchaseId.lastUpgradeNotice?.message).toMatch(/unknown/i);

    const purchased = reduceWorkerRequest(
      { ...initial, resources: { ...initial.resources, money: 4 } },
      {
        type: "COMMAND",
        command: { type: "BUY_MODULE", moduleId: "precision-cleaner" },
      },
    );
    const restored = reduceWorkerRequest(initial, {
      type: "INIT",
      savedState: JSON.parse(JSON.stringify(purchased)) as unknown,
    });
    expect(restored).toEqual(purchased);
    expect(restored.ownedModuleIds).toContain("precision-cleaner");
    expect(isStateValid(restored)).toBe(true);
  });
});
