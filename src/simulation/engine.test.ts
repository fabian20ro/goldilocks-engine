import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { hardware, modules, slots, workloads } from "./catalog";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  isStateValid,
  tick,
} from "./engine";
import type { SimulationCommand } from "./types";

describe("deterministic simulation engine", () => {
  it("creates a valid, operable default pipeline", () => {
    const state = createInitialState(7);
    expect(isStateValid(state)).toBe(true);
    expect(state.metrics.memoryPressure).toBeLessThan(1);
    expect(state.metrics.throughputPerMinute).toBeGreaterThan(0);
    expect(state.ledger).toHaveLength(1);
  });

  it("replays an ordered command stream identically", () => {
    const commands: SimulationCommand[] = [
      { type: "SET_WORKLOAD", workloadId: "batch-classification" },
      { type: "PLACE_MODULE", moduleId: "batch-runtime", slotId: "runtime" },
      { type: "TOGGLE_BRANCH" },
      { type: "QUEUE_JOBS", count: 12 },
      { type: "SET_COMPUTE_ALLOCATION", percent: 95 },
    ];
    const run = () =>
      commands.reduce(
        (state, command) => applyCommand(state, command),
        createInitialState(99),
      );
    const left = tick(run(), 60);
    const right = tick(run(), 60);
    expect(right).toEqual(left);
  });

  it("rejects incompatible placement without corrupting the graph", () => {
    const state = createInitialState();
    const next = applyCommand(state, {
      type: "PLACE_MODULE",
      moduleId: "full-model",
      slotId: "source",
    });
    expect(next.slots).toEqual(state.slots);
    expect(next.ledger.at(-1)?.message).toMatch(/incompatible/i);
    expect(isStateValid(next)).toBe(true);
  });

  it("reorders compatible active modules by swapping them", () => {
    const state = createInitialState();
    const next = applyCommand(state, {
      type: "PLACE_MODULE",
      moduleId: "basic-cleaner",
      fromSlotId: "prepare",
      slotId: "runtime",
    });
    expect(next.slots.find((slot) => slot.slotId === "runtime")?.moduleId).toBe(
      "basic-cleaner",
    );
    expect(next.slots.find((slot) => slot.slotId === "prepare")?.moduleId).toBe(
      "quantized-model",
    );
    expect(next.metrics.orderWarnings.length).toBeGreaterThan(0);
  });

  it("records capacity failures and prevents normal output", () => {
    let state = createInitialState(13);
    state = applyCommand(state, {
      type: "SET_WORKLOAD",
      workloadId: "long-document",
    });
    state = applyCommand(state, {
      type: "PLACE_MODULE",
      moduleId: "full-model",
      slotId: "runtime",
    });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    expect(state.metrics.memoryPressure).toBeGreaterThan(1);
    state = tick(state, 60);
    expect(state.jobs.failed).toBe(1);
    expect(state.jobs.completed).toBe(0);
    expect(state.failedModuleId).not.toBeNull();
    expect(state.ledger.at(-1)?.directCause).toMatch(/memory/i);
  });

  it("makes upgrades improve capacity while introducing cost and heat", () => {
    const state = applyCommand(createInitialState(), {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 25,
    });
    const used = applyCommand(state, {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(used.resources.money).toBe(state.resources.money - 560);
    expect(used.metrics.throughputPerMinute).toBeGreaterThan(
      state.metrics.throughputPerMinute,
    );
    expect(used.metrics.thermalPressure).toBeGreaterThan(
      state.metrics.thermalPressure,
    );
    expect(used.ledger.at(-1)?.message).toMatch(/constraints/i);
  });

  it("blocks unavailable purchases and supports owned hardware switching", () => {
    const poor = {
      ...createInitialState(),
      resources: { ...createInitialState().resources, money: 10 },
    };
    const blocked = applyCommand(poor, {
      type: "BUY_HARDWARE",
      hardwareId: "workstation-gpu",
    });
    expect(blocked.hardwareId).toBe("bedroom-cpu");
    expect(blocked.ledger.at(-1)?.message).toMatch(/blocked/i);
    const bought = applyCommand(createInitialState(), {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    const switched = applyCommand(bought, {
      type: "SELECT_HARDWARE",
      hardwareId: "bedroom-cpu",
    });
    expect(switched.hardwareId).toBe("bedroom-cpu");
  });

  it("exposes branch and policy tradeoffs in metrics", () => {
    const state = createInitialState();
    const branched = applyCommand(state, { type: "TOGGLE_BRANCH" });
    expect(branched.metrics.evaluationCoverage).toBeGreaterThan(
      state.metrics.evaluationCoverage,
    );
    expect(branched.metrics.throughputPerMinute).toBeLessThan(
      state.metrics.throughputPerMinute,
    );
    const reserved = applyCommand(state, {
      type: "SET_MEMORY_RESERVE",
      percent: 30,
    });
    expect(reserved.metrics.memoryAvailable).toBeLessThan(
      state.metrics.memoryAvailable,
    );
  });

  it("identifies the active module slot that limits throughput", () => {
    let state = createInitialState();
    state = applyCommand(state, {
      type: "BUY_HARDWARE",
      hardwareId: "workstation-gpu",
    });
    state = applyCommand(state, {
      type: "PLACE_MODULE",
      moduleId: "robust-eval",
      slotId: "verify",
    });
    expect(state.metrics.dominantBottleneck).toBe("module throughput");
    expect(state.metrics.bottleneckSlotId).toBe("verify");
  });

  it("bounds queues, allocations, elapsed time, and retained ledger history", () => {
    let state = createInitialState();
    state = applyCommand(state, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 999,
    });
    state = applyCommand(state, { type: "SET_MEMORY_RESERVE", percent: -4 });
    for (let index = 0; index < 100; index += 1)
      state = applyCommand(state, { type: "QUEUE_JOBS", count: 50 });
    state = tick(state, -100);
    expect(state.computeAllocation).toBe(100);
    expect(state.memoryReserve).toBe(0);
    expect(state.jobs.queued).toBeLessThanOrEqual(99);
    expect(state.ledger.length).toBeLessThanOrEqual(80);
    expect(isStateValid(state)).toBe(true);
  });

  it("does not bank unused throughput after a queue drains", () => {
    let state = applyCommand(createInitialState(1), {
      type: "QUEUE_JOBS",
      count: 1,
    });
    state = tick(state, 60);
    expect(state.jobs.queued).toBe(0);
    expect(state.jobs.processingCarry).toBeLessThan(1);

    const resolvedBefore = state.jobs.completed + state.jobs.failed;
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 0.001);
    expect(state.jobs.completed + state.jobs.failed).toBe(resolvedBefore);
    expect(state.jobs.queued).toBe(1);
  });

  it("keeps bounded ledger event identifiers unique", () => {
    let state = createInitialState();
    for (let index = 0; index < 120; index += 1)
      state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });

    const ids = state.ledger.map((event) => event.id);
    expect(ids).toHaveLength(80);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("calculates observed uncertainty without mutating state", () => {
    const state = createInitialState(123);
    const before = structuredClone(state);
    const metrics = calculateMetrics(state);
    expect(state).toEqual(before);
    expect(metrics.observedQuality).not.toBe(metrics.predictedQuality);
    expect(metrics.observability).toBeGreaterThan(0);
  });
});

describe("simulation properties", () => {
  const commandArbitrary = fc.oneof(
    fc.record({
      type: fc.constant("SET_WORKLOAD" as const),
      workloadId: fc.constantFrom(...workloads.map((item) => item.id)),
    }),
    fc.record({
      type: fc.constant("PLACE_MODULE" as const),
      moduleId: fc.constantFrom(...modules.map((item) => item.id)),
      slotId: fc.constantFrom(...slots.map((item) => item.id)),
    }),
    fc.record({
      type: fc.constant("QUEUE_JOBS" as const),
      count: fc.integer({ min: -50, max: 200 }),
    }),
    fc.record({
      type: fc.constant("SET_COMPUTE_ALLOCATION" as const),
      percent: fc.integer({ min: -100, max: 300 }),
    }),
    fc.record({
      type: fc.constant("SET_MEMORY_RESERVE" as const),
      percent: fc.integer({ min: -100, max: 100 }),
    }),
    fc.record({
      type: fc.constant("SELECT_HARDWARE" as const),
      hardwareId: fc.constantFrom(...hardware.map((item) => item.id)),
    }),
    fc.constant({ type: "TOGGLE_BRANCH" as const }),
    fc.constant({ type: "TOGGLE_PAUSE" as const }),
  );

  it("same seeds and commands always produce identical state", () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(commandArbitrary, { maxLength: 60 }),
        (seed, commands) => {
          const play = () =>
            tick(
              commands.reduce(
                (state, command) => applyCommand(state, command),
                createInitialState(seed),
              ),
              23,
            );
          expect(play()).toEqual(play());
        },
      ),
      { numRuns: 120 },
    );
  });

  it("arbitrary commands and ticks preserve resource and graph invariants", () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(commandArbitrary, { maxLength: 100 }),
        fc.float({ min: -100, max: 200, noNaN: true }),
        (seed, commands, seconds) => {
          const state = tick(
            commands.reduce(
              (current, command) => applyCommand(current, command),
              createInitialState(seed),
            ),
            seconds,
          );
          expect(isStateValid(state)).toBe(true);
          expect(
            state.jobs.completed + state.jobs.failed,
          ).toBeGreaterThanOrEqual(0);
          expect(new Set(state.ledger.map((event) => event.id)).size).toBe(
            state.ledger.length,
          );
        },
      ),
      { numRuns: 150 },
    );
  });
});
