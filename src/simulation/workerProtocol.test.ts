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

  it("applies a configuration batch as one worker request", () => {
    const initial = {
      ...createInitialState(2027),
      ownedExpansionIds: ["workstation-expansion-i"],
    };
    const request: WorkerRequest = {
      type: "COMMAND_BATCH",
      commands: [
        { type: "REMOVE_MODULE", slotId: "prepare" },
        { type: "SET_EXPANSION_ACTIVE", active: true },
        {
          type: "PLACE_MODULE",
          moduleId: "basic-cleaner",
          slotId: "process-4",
        },
      ],
    };

    const restored = reduceWorkerRequest(initial, request);

    expect(restored.activeExpansionId).toBe("workstation-expansion-i");
    expect(
      restored.slots.find((slot) => slot.slotId === "prepare")?.moduleId,
    ).toBeNull();
    expect(
      restored.slots.find((slot) => slot.slotId === "process-4")?.moduleId,
    ).toBe("basic-cleaner");
    expect(isStateValid(restored)).toBe(true);
    expect(
      reduceWorkerRequest(initial, { type: "COMMAND_BATCH", commands: [] }),
    ).toBe(initial);
  });

  it("commits all four Career allocations and one evening atomically", () => {
    const initial = createInitialState(2029);
    const request: WorkerRequest = {
      type: "COMMAND_BATCH",
      commands: [
        { type: "SET_EVENING_ALLOCATION", route: "freelance", hours: 3 },
        {
          type: "SET_EVENING_ALLOCATION",
          route: "competition",
          hours: 1,
        },
        { type: "SET_EVENING_ALLOCATION", route: "product", hours: 0 },
        {
          type: "SET_EVENING_ALLOCATION",
          route: "maintenance",
          hours: 0,
        },
        { type: "RUN_EVENING" },
      ],
    };

    const completed = reduceWorkerRequest(initial, request);

    expect(initial.career.schedule.completedEvenings).toBe(0);
    expect(initial.career.schedule.allocations).toEqual({
      freelance: 0,
      competition: 0,
      product: 0,
      maintenance: 0,
    });
    expect(completed.career.schedule.completedEvenings).toBe(1);
    expect(completed.career.schedule.day).toBe(2);
    expect(completed.career.schedule.hoursRemaining).toBe(4);
    expect(completed.career.schedule.allocations).toEqual({
      freelance: 0,
      competition: 0,
      product: 0,
      maintenance: 0,
    });
    expect(completed.career.freelanceHours).toBe(3);
    expect(completed.career.competition.progress).toBeGreaterThan(0);
    expect(completed.ledger.at(-1)?.message).toMatch(/Evening 1 closed/i);
    expect(isStateValid(completed)).toBe(true);
  });

  it("rejects an entire batch when a nested runtime command is malformed", () => {
    const initial = createInitialState(2028);
    const request = {
      type: "COMMAND_BATCH",
      commands: [
        { type: "SET_COMPUTE_ALLOCATION", percent: 25 },
        { type: "QUEUE_JOBS", count: Number.NaN },
      ],
    } as unknown as WorkerRequest;

    expect(reduceWorkerRequest(initial, request)).toBe(initial);
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
