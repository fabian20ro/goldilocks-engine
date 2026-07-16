import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  getHardware,
  modules,
  pipelineExpansions,
  slots,
  workloads,
} from "./catalog";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  getWorkloadQuote,
  hasValidStateIntegrity,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
  workloadUnlockProgress,
} from "./engine";
import { normalizeSeed } from "./rng";
import type { SimulationCommand, SimulationState } from "./types";

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

  it("settles successful workload payouts and operating costs visibly", () => {
    const initial = createInitialState(7);
    const queued = applyCommand(initial, { type: "QUEUE_JOBS", count: 5 });
    const settled = tick(queued, 60);
    const settlement = settled.lastSettlement;

    expect(settlement).not.toBeNull();
    expect(settled.jobs.completed + settled.jobs.failed).toBe(5);
    expect((settlement?.completed ?? 0) + (settlement?.failed ?? 0)).toBe(1);
    expect(settlement?.taskId).toMatch(/^task-/);
    expect(settlement?.lockedGrossQuote).toBeGreaterThan(0);
    expect(settled.jobs.grossEarned).toBeGreaterThan(0);
    expect(settled.jobs.grossEarned).toBeLessThanOrEqual(7);
    expect(settled.resources.money - queued.resources.money).toBeCloseTo(
      settled.jobs.grossEarned - settled.jobs.operatingCostsPaid,
      3,
    );
    expect(settlement?.netChange).toBeCloseTo(
      (settlement?.grossPayout ?? 0) - (settlement?.operatingCost ?? 0),
      3,
    );
    expect(settled.resources.money).toBeCloseTo(
      settled.resources.money - queued.resources.money,
      6,
    );
    expect(
      settled.ledger.some((event) => /gross payout/i.test(event.message)),
    ).toBe(true);
    expect(isStateValid(settled)).toBe(true);
  });

  it("keeps bounded time-speed tick schedules deterministic", () => {
    const run = (speed: 1 | 4 | 16 | 64) => {
      let state = applyCommand(createInitialState(91), {
        type: "QUEUE_JOBS",
        count: 40,
      });
      for (let step = 0; step < 24; step += 1) state = tick(state, 0.5 * speed);
      return state;
    };

    for (const speed of [1, 4, 16, 64] as const) {
      const left = run(speed);
      const right = run(speed);
      expect(right).toEqual(left);
      expect(isStateValid(left)).toBe(true);
      expect(left.tick).toBe(12_000 * speed);
      expect(new Set(left.ledger.map((event) => event.id)).size).toBe(
        left.ledger.length,
      );
    }
    expect(run(16).jobs.completed + run(16).jobs.failed).toBeGreaterThan(
      run(1).jobs.completed + run(1).jobs.failed,
    );
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

  it("keeps hardware alternatives mechanically distinct before purchase", () => {
    const state = applyCommand(createInitialState(), {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 25,
    });
    const used = calculateMetrics({
      ...state,
      hardwareId: "used-gpu",
    });
    expect(used.throughputPerMinute).toBeGreaterThan(
      state.metrics.throughputPerMinute,
    );
    expect(used.thermalPressure).toBeGreaterThan(state.metrics.thermalPressure);
    expect(getHardware("used-gpu").purchaseCost).toBeGreaterThan(0);
  });

  it("purchases modules and rigs exactly once before owned-only equip", () => {
    const initial = createInitialState(17);
    const lockedPlacement = applyCommand(initial, {
      type: "PLACE_MODULE",
      moduleId: "precision-cleaner",
      slotId: "prepare",
    });
    expect(lockedPlacement.slots).toEqual(initial.slots);
    expect(lockedPlacement.lastUpgradeNotice?.message).toMatch(/not owned/i);

    const insufficient = applyCommand(initial, {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(insufficient.resources.money).toBe(0);
    expect(insufficient.ownedHardwareIds).toEqual(initial.ownedHardwareIds);

    let state = {
      ...initial,
      resources: { ...initial.resources, money: 18 },
    };
    state = applyCommand(state, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    expect(state.resources.money).toBe(14);
    expect(state.ownedModuleIds).toContain("precision-cleaner");
    const afterFirstModulePurchase = state;
    state = applyCommand(state, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    expect(state.resources.money).toBe(14);
    expect(state.ownedModuleIds).toEqual(
      afterFirstModulePurchase.ownedModuleIds,
    );

    state = applyCommand(state, {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(state.resources.money).toBe(0);
    expect(state.ownedHardwareIds).toContain("used-gpu");
    const afterFirstRigPurchase = state;
    state = applyCommand(state, {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(state.resources.money).toBe(0);
    expect(state.ownedHardwareIds).toEqual(
      afterFirstRigPurchase.ownedHardwareIds,
    );

    const beforeEquip = state.metrics;
    state = applyCommand(state, {
      type: "EQUIP_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(state.hardwareId).toBe("used-gpu");
    expect(state.metrics).not.toEqual(beforeEquip);
    expect(state.lastUpgradeNotice?.message).toMatch(/observed delta/i);
    expect(isStateValid(state)).toBe(true);
  });

  it("rejects malformed, unknown, and incompatible equipment operations safely", () => {
    const initial = createInitialState(81);
    const commands = [
      { type: "BUY_MODULE", moduleId: "missing" },
      { type: "BUY_HARDWARE", hardwareId: "missing" },
      { type: "EQUIP_HARDWARE", hardwareId: "used-gpu" },
      { type: "PLACE_MODULE", moduleId: "missing", slotId: "runtime" },
      {
        type: "PLACE_MODULE",
        moduleId: "request-buffer",
        slotId: "runtime",
      },
    ] satisfies SimulationCommand[];
    for (const command of commands) {
      const next = applyCommand(initial, command);
      expect(next.resources.money).toBe(initial.resources.money);
      expect(next.slots).toEqual(initial.slots);
      expect(isStateValid(next)).toBe(true);
      expect(next.ledger.at(-1)?.kind).toBe("warning");
    }
  });

  it("restores current ownership and migrates safe schema-v3 state", () => {
    let current = {
      ...createInitialState(23),
      resources: { ...createInitialState(23).resources, money: 18 },
    };
    current = applyCommand(current, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });
    current = applyCommand(current, {
      type: "BUY_HARDWARE",
      hardwareId: "used-gpu",
    });
    current = applyCommand(current, {
      type: "EQUIP_HARDWARE",
      hardwareId: "used-gpu",
    });
    expect(restoreSimulationState(JSON.parse(JSON.stringify(current)))).toEqual(
      current,
    );

    const legacy = JSON.parse(JSON.stringify(createInitialState(29))) as Record<
      string,
      unknown
    >;
    legacy.schemaVersion = 3;
    legacy.contentVersion = "pipeline-toy-2";
    legacy.hardwareId = "used-gpu";
    delete legacy.ownedHardwareIds;
    delete legacy.ownedModuleIds;
    delete legacy.lastUpgradeNotice;
    const migrated = restoreSimulationState(legacy);
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.hardwareId).toBe("used-gpu");
    expect(migrated.ownedHardwareIds).toEqual(["bedroom-cpu", "used-gpu"]);
    expect(migrated.ownedModuleIds).toEqual(
      expect.arrayContaining(
        migrated.slots.flatMap((slot) =>
          slot.moduleId === null ? [] : [slot.moduleId],
        ),
      ),
    );
    expect(migrated.lastUpgradeNotice?.message).toMatch(/migrated/i);
    expect(isStateValid(migrated)).toBe(true);
  });

  it("falls back safely for malformed or stale persisted ownership", () => {
    const current = createInitialState(37);
    const malformed = {
      ...current,
      ownedHardwareIds: ["bedroom-cpu", "bedroom-cpu"],
      ownedModuleIds: [...current.ownedModuleIds, "missing"],
    };
    const restored = restoreSimulationState(malformed, 37);
    expect(restored).toEqual(createInitialState(37));
    expect(isStateValid(restored)).toBe(true);
    expect(restoreSimulationState({ schemaVersion: 2 }, 37)).toEqual(
      createInitialState(37),
    );
  });

  it("checks full snapshot integrity and safely reseals valid local recovery", () => {
    const initial = createInitialState(41);
    expect(initial.migration).toEqual({
      sourceSchemaVersion: 5,
      steps: [],
    });
    expect(initial.integrity.algorithm).toBe("fnv1a-32-json-v1");
    expect(hasValidStateIntegrity(initial)).toBe(true);

    const edited = {
      ...initial,
      resources: { ...initial.resources, money: 14 },
    };
    expect(hasValidStateIntegrity(edited)).toBe(false);
    const restored = restoreSimulationState(
      JSON.parse(JSON.stringify(edited)),
      41,
    );
    expect(restored.resources.money).toBe(14);
    expect(restored.migration.steps).toContain("integrity-resealed");
    expect(hasValidStateIntegrity(restored)).toBe(true);
    expect(isStateValid(restored)).toBe(true);
  });

  it("rejects malformed persisted fields before they can reach rendering", () => {
    const initial = createInitialState(43);
    const invalidStates: unknown[] = [
      { ...initial, workloadId: "missing" },
      { ...initial, branchEnabled: "yes" },
      { ...initial, jobs: { ...initial.jobs, paused: "no" } },
      { ...initial, baselineLabel: { malformed: true } },
      { ...initial, failedModuleId: "missing" },
      { ...initial, lastWarning: { malformed: true } },
      {
        ...initial,
        lastUpgradeNotice: { kind: "success", message: { malformed: true } },
      },
      {
        ...initial,
        metrics: {
          ...initial.metrics,
          dominantBottleneck: { malformed: true },
        },
      },
      {
        ...initial,
        metrics: { ...initial.metrics, orderWarnings: [{ malformed: true }] },
      },
      {
        ...initial,
        baselineMetrics: {
          ...initial.metrics,
          bottleneckSlotId: "missing",
        },
      },
      {
        ...initial,
        ledger: [{ ...initial.ledger[0]!, id: { malformed: true } }],
      },
      {
        ...initial,
        ledger: [{ ...initial.ledger[0]!, kind: "unknown" }],
      },
      {
        ...initial,
        ledger: [{ ...initial.ledger[0]!, message: { malformed: true } }],
      },
      {
        ...initial,
        ledger: [{ ...initial.ledger[0]!, directCause: { malformed: true } }],
      },
      {
        ...initial,
        ledger: [
          {
            ...initial.ledger[0]!,
            contributingCondition: { malformed: true },
          },
        ],
      },
    ];

    for (const malformed of invalidStates) {
      expect(restoreSimulationState(malformed, 43)).toEqual(initial);
    }

    const repairedMetadata = restoreSimulationState({
      ...initial,
      migration: {
        sourceSchemaVersion: 4,
        steps: ["duplicate", "duplicate"],
      },
    });
    expect(repairedMetadata.migration.steps).toEqual([
      "schema-v4-metadata-added",
      "integrity-resealed",
    ]);
    expect(isStateValid(repairedMetadata)).toBe(true);
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
    let state = {
      ...createInitialState(),
      resources: { ...createInitialState().resources, money: 40 },
    };
    state = applyCommand(state, {
      type: "BUY_HARDWARE",
      hardwareId: "workstation-gpu",
    });
    state = applyCommand(state, {
      type: "EQUIP_HARDWARE",
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

  it("rejects malformed operation numerics without changing any state", () => {
    const initial = createInitialState(73);
    const malformed = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      "12",
      null,
      undefined,
    ] as const;
    const commands = [
      (value: unknown): SimulationCommand => ({
        type: "SET_COMPUTE_ALLOCATION",
        percent: value as number,
      }),
      (value: unknown): SimulationCommand => ({
        type: "SET_MEMORY_RESERVE",
        percent: value as number,
      }),
      (value: unknown): SimulationCommand => ({
        type: "QUEUE_JOBS",
        count: value as number,
      }),
    ];

    for (const value of malformed) {
      expect(tick(initial, value as number)).toBe(initial);
      for (const command of commands)
        expect(applyCommand(initial, command(value))).toBe(initial);
      if (value !== undefined) {
        expect(
          applyCommand(initial, {
            type: "RESET",
            seed: value as number,
          }),
        ).toBe(initial);
      }
    }

    expect(initial).toEqual(createInitialState(73));
    expect(isStateValid(initial)).toBe(true);
  });

  it("normalizes finite numeric ranges and malformed standalone seeds safely", () => {
    const initial = createInitialState(5);
    const allocation = applyCommand(initial, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: Number.MAX_VALUE,
    });
    const reserve = applyCommand(initial, {
      type: "SET_MEMORY_RESERVE",
      percent: -Number.MAX_VALUE,
    });
    const queue = applyCommand(initial, {
      type: "QUEUE_JOBS",
      count: 2.9,
    });
    const elapsed = tick(initial, Number.MAX_VALUE);
    const fallbackSeed = normalizeSeed(Number.NaN);

    expect(allocation.computeAllocation).toBe(100);
    expect(reserve.memoryReserve).toBe(0);
    expect(queue.jobs.queued).toBe(2);
    expect(elapsed.tick).toBe(60_000);
    expect(createInitialState(Number.NaN).seed).toBe(fallbackSeed);
    expect(createInitialState(Number.POSITIVE_INFINITY).seed).toBe(
      fallbackSeed,
    );
    expect([allocation, reserve, queue, elapsed].every(isStateValid)).toBe(
      true,
    );
  });

  it("rejects a transition when a safe integer invariant would overflow", () => {
    const initial = createInitialState(19);
    const maxTick = sealSimulationState({
      ...initial,
      tick: Number.MAX_SAFE_INTEGER,
    } satisfies SimulationState);
    const maxSequence = sealSimulationState({
      ...initial,
      eventSequence: Number.MAX_SAFE_INTEGER,
    } satisfies SimulationState);

    expect(isStateValid(maxTick)).toBe(true);
    expect(isStateValid(maxSequence)).toBe(true);
    expect(tick(maxTick, 1)).toBe(maxTick);
    expect(applyCommand(maxSequence, { type: "QUEUE_JOBS", count: 1 })).toBe(
      maxSequence,
    );
  });

  it("validates every versioned numeric state category", () => {
    const initial = createInitialState(31);
    const invalidStates = [
      { ...initial, seed: Number.NaN },
      { ...initial, rngState: Number.POSITIVE_INFINITY },
      { ...initial, tick: 0.5 },
      { ...initial, computeAllocation: Number.NaN },
      { ...initial, memoryReserve: Number.NEGATIVE_INFINITY },
      {
        ...initial,
        resources: { ...initial.resources, reputation: Number.NaN },
      },
      {
        ...initial,
        jobs: { ...initial.jobs, processingCarry: Number.NaN },
      },
      {
        ...initial,
        jobs: { ...initial.jobs, grossEarned: Number.NaN },
      },
      {
        ...initial,
        lastSettlement: {
          tick: 0,
          workloadId: "interactive-chat",
          completed: 1,
          failed: 0,
          grossPayout: 1.4,
          operatingCost: 0.1,
          netChange: Number.NaN,
          taskId: "invalid-settlement",
          lockedGrossQuote: 1.4,
        },
      },
      {
        ...initial,
        metrics: { ...initial.metrics, thermalLoad: Number.NaN },
      },
      {
        ...initial,
        baselineMetrics: {
          ...initial.metrics,
          operatingCost: Number.POSITIVE_INFINITY,
        },
      },
      {
        ...initial,
        ledger: [{ ...initial.ledger[0]!, tick: Number.NaN }],
      },
    ];

    expect(invalidStates.some(isStateValid)).toBe(false);
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

  it("owns and activates Workstation Expansion I exactly once without auto-filling", () => {
    const spec = pipelineExpansions[0]!;
    let state = sealSimulationState({
      ...createInitialState(71),
      resources: {
        ...createInitialState(71).resources,
        money: spec.purchaseCost,
      },
    });
    const moneyBefore = state.resources.money;
    state = applyCommand(state, {
      type: "BUY_EXPANSION",
      expansionId: spec.id,
    });
    expect(state.resources.money).toBe(moneyBefore - spec.purchaseCost);
    expect(state.ownedExpansionIds).toEqual([spec.id]);
    const repeated = applyCommand(state, {
      type: "BUY_EXPANSION",
      expansionId: spec.id,
    });
    expect(repeated.resources.money).toBe(state.resources.money);
    state = applyCommand(repeated, {
      type: "SET_EXPANSION_ACTIVE",
      active: true,
    });
    expect(state.activeExpansionId).toBe(spec.id);
    expect(
      state.slots.filter(
        (slot) =>
          slots.find((item) => item.id === slot.slotId)?.type === "process",
      ),
    ).toHaveLength(6);
    expect(
      state.slots.filter((slot) => slot.slotId.startsWith("process-")),
    ).toEqual([
      { slotId: "process-4", moduleId: null },
      { slotId: "process-5", moduleId: null },
      { slotId: "process-6", moduleId: null },
    ]);
    expect(isStateValid(state)).toBe(true);
  });

  it("keeps per-task workload identity and queue-time quotes, then clears waiting only", () => {
    let state = createInitialState(73);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 3 });
    const accepted = [...state.jobs.waitingTasks];
    expect(accepted).toHaveLength(3);
    expect(
      accepted.every((task) => task.workloadId === "interactive-chat"),
    ).toBe(true);
    expect(accepted.map((task) => task.lockedGrossQuote)).toEqual(
      [...accepted.map((task) => task.lockedGrossQuote)].sort((a, b) => b - a),
    );
    state = tick(state, 0.5);
    const active = state.jobs.activeTask;
    const demandBefore = state.workloadDemand;
    const moneyBefore = state.resources.money;
    const rngBefore = state.rngState;
    expect(active?.progress).toBeGreaterThan(0);
    state = applyCommand(state, { type: "CLEAR_WAITING_TASKS" });
    expect(state.jobs.activeTask).toEqual(active);
    expect(state.jobs.waitingTasks).toEqual([]);
    expect(state.jobs.queued).toBe(1);
    expect(state.workloadDemand).toEqual(demandBefore);
    expect(state.resources.money).toBe(moneyBefore);
    expect(state.rngState).toBe(rngBefore);
    const emptyClear = applyCommand(state, { type: "CLEAR_WAITING_TASKS" });
    expect(emptyClear).toBe(state);
  });

  it("shows the exact next quote after accepted same-workload reservations", () => {
    let state = createInitialState(74);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 10 });

    const visibleNextQuote = getWorkloadQuote(
      state,
      "interactive-chat",
    ).grossQuote;
    const unrelatedQuote = getWorkloadQuote(
      state,
      "batch-classification",
    ).grossQuote;
    expect(
      getWorkloadQuote(state, "interactive-chat", Number.NaN).grossQuote,
    ).toBe(visibleNextQuote);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });

    expect(state.jobs.waitingTasks.at(-1)?.lockedGrossQuote).toBe(
      visibleNextQuote,
    );
    expect(unrelatedQuote).toBe(
      workloads.find((item) => item.id === "batch-classification")!.rewardMoney,
    );
  });

  it("keeps current diagnostics on active work while selecting a future offer", () => {
    let state = createInitialState(75);
    state = applyCommand(state, {
      type: "SET_WORKLOAD",
      workloadId: "long-document",
    });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 0.5);
    state = applyCommand(state, { type: "TOGGLE_PAUSE" });
    const activeMetrics = calculateMetrics({
      ...state,
      workloadId: "long-document",
    });
    const futureMetrics = calculateMetrics({
      ...state,
      workloadId: "interactive-chat",
    });

    state = applyCommand(state, {
      type: "SET_WORKLOAD",
      workloadId: "interactive-chat",
    });

    expect(state.jobs.activeTask?.workloadId).toBe("long-document");
    expect(state.workloadId).toBe("interactive-chat");
    expect(state.metrics).toEqual(activeMetrics);
    expect(state.metrics.memoryPressure).toBeGreaterThan(1);
    expect(futureMetrics.memoryPressure).toBeLessThan(1);
    expect(state.lastWarning).toMatch(/memory limit exceeded/i);
  });

  it("never delivers or pays normally without a model stage", () => {
    let state = createInitialState(76);
    for (const slotId of ["prepare", "runtime", "verify"])
      state = applyCommand(state, { type: "REMOVE_MODULE", slotId });

    expect(state.metrics.orderWarnings).toContain("no model stage");
    expect(state.metrics.reliability).toBe(0);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    for (let minute = 0; minute < 25 && state.jobs.queued > 0; minute += 1)
      state = tick(state, 60);

    expect(state.jobs.completed).toBe(0);
    expect(state.jobs.failed).toBe(1);
    expect(state.jobs.grossEarned).toBe(0);
    expect(state.lastSettlement?.grossPayout).toBe(0);
    expect(state.ledger.at(-1)?.directCause).toMatch(/no model stage/i);
  });

  it("saturates completed work, recovers neglected demand, and never earns by idling", () => {
    let state = createInitialState(79);
    const initialQuote = getWorkloadQuote(state, "interactive-chat").grossQuote;
    const initialMoney = state.resources.money;
    state = tick(state, 60);
    expect(state.resources.money).toBe(initialMoney);
    for (let index = 0; index < 12; index += 1) {
      state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
      state = tick(state, 60);
    }
    const saturated = getWorkloadQuote(state, "interactive-chat").grossQuote;
    expect(saturated).toBeLessThan(initialQuote);
    const batchBefore = getWorkloadQuote(
      state,
      "batch-classification",
    ).grossQuote;
    state = tick(state, 60);
    expect(
      getWorkloadQuote(state, "interactive-chat").grossQuote,
    ).toBeGreaterThan(saturated);
    expect(getWorkloadQuote(state, "batch-classification").grossQuote).toBe(
      batchBefore,
    );
    expect(state.resources.money).toBeGreaterThanOrEqual(0);
  });

  it("uses schedule-equivalent fixed quanta through 64x", () => {
    const queued = applyCommand(createInitialState(83), {
      type: "QUEUE_JOBS",
      count: 20,
    });
    const batched = tick(queued, 32);
    let stepped = queued;
    for (let index = 0; index < 64; index += 1) stepped = tick(stepped, 0.5);
    expect(stepped).toEqual(batched);
  });

  it("stages four initial and four deterministic later workload unlocks", () => {
    let state = createInitialState(89);
    expect(state.unlockedWorkloadIds).toHaveLength(4);
    expect(workloads).toHaveLength(8);
    expect(workloadUnlockProgress(state, "code-generation").unlocked).toBe(
      false,
    );
    state = sealSimulationState({
      ...state,
      jobs: { ...state.jobs, completed: 12 },
      resources: { ...state.resources, reputation: 0.3 },
    });
    state = applyCommand(state, {
      type: "SET_COMPUTE_ALLOCATION",
      percent: 75,
    });
    expect(state.unlockedWorkloadIds).toContain("code-generation");
    expect(workloadUnlockProgress(state, "code-generation").unlocked).toBe(
      true,
    );
  });

  it("migrates schema-v4 aggregate queued work into bounded task identities", () => {
    const source = applyCommand(createInitialState(97), {
      type: "QUEUE_JOBS",
      count: 3,
    });
    const legacy = JSON.parse(JSON.stringify(source)) as Record<
      string,
      unknown
    >;
    legacy.schemaVersion = 4;
    legacy.contentVersion = "pipeline-toy-3";
    delete legacy.ownedExpansionIds;
    delete legacy.activeExpansionId;
    delete legacy.unlockedWorkloadIds;
    delete legacy.workloadDemand;
    const jobs = legacy.jobs as Record<string, unknown>;
    delete jobs.activeTask;
    delete jobs.waitingTasks;
    delete jobs.nextTaskSequence;
    const migrated = restoreSimulationState(legacy, 97);
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.jobs.queued).toBe(3);
    expect(migrated.jobs.waitingTasks).toHaveLength(3);
    expect(
      migrated.jobs.waitingTasks.every(
        (task) =>
          task.workloadId === "interactive-chat" &&
          task.lockedGrossQuote === 1.4,
      ),
    ).toBe(true);
    expect(migrated.migration.steps).toContain(
      "schema-4-to-5-task-market-expansion",
    );
    expect(isStateValid(migrated)).toBe(true);
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
      type: fc.constant("BUY_EXPANSION" as const),
      expansionId: fc.constantFrom(
        ...pipelineExpansions.map((item) => item.id),
      ),
    }),
    fc.record({
      type: fc.constant("SET_EXPANSION_ACTIVE" as const),
      active: fc.boolean(),
    }),
    fc.record({
      type: fc.constant("REMOVE_MODULE" as const),
      slotId: fc.constantFrom(...slots.map((item) => item.id)),
    }),
    fc.record({
      type: fc.constant("PLACE_MODULE" as const),
      moduleId: fc.constantFrom(...modules.map((item) => item.id)),
      slotId: fc.constantFrom(...slots.map((item) => item.id)),
    }),
    fc.record({
      type: fc.constant("BUY_MODULE" as const),
      moduleId: fc.constantFrom(...modules.map((item) => item.id)),
    }),
    fc.record({
      type: fc.constant("BUY_HARDWARE" as const),
      hardwareId: fc.constantFrom("bedroom-cpu", "used-gpu", "workstation-gpu"),
    }),
    fc.record({
      type: fc.constant("EQUIP_HARDWARE" as const),
      hardwareId: fc.constantFrom("bedroom-cpu", "used-gpu", "workstation-gpu"),
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
    fc.constant({ type: "TOGGLE_BRANCH" as const }),
    fc.constant({ type: "TOGGLE_PAUSE" as const }),
    fc.constant({ type: "CLEAR_WAITING_TASKS" as const }),
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
