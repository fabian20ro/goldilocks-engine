// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyCommand, createInitialState } from "../simulation/engine";
import type { WorkerRequest, WorkerResponse } from "../simulation/types";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import {
  resetOfflineReadinessForTest,
  setOfflineShellReady,
} from "./offlineReadiness";
import {
  OFFLINE_SAVED_AT_KEY,
  persistBeforePublish,
  SAVE_KEY,
  useSimulation,
} from "./useSimulation";
import {
  createCareerScheduleCommandBatch,
  normalizeCareerScheduleDraft,
  replaceCareerScheduleHours,
  useCareerScheduleDraft,
} from "./careerScheduleDraft";

class FakeWorker {
  static instances: FakeWorker[] = [];

  readonly requests: WorkerRequest[] = [];
  private readonly listeners = new Set<
    (event: MessageEvent<WorkerResponse>) => void
  >();

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void {
    if (type === "message") this.listeners.add(listener);
  }

  postMessage(request: WorkerRequest): void {
    this.requests.push(request);
  }

  terminate(): void {
    this.listeners.clear();
  }

  emit(response: WorkerResponse): void {
    const event = new MessageEvent<WorkerResponse>("message", {
      data: response,
    });
    for (const listener of this.listeners) listener(event);
  }
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class FlakyStorage extends MemoryStorage {
  failWrites = false;

  override setItem(key: string, value: string): void {
    if (this.failWrites && key === SAVE_KEY)
      throw new DOMException("storage quota exhausted", "QuotaExceededError");
    super.setItem(key, value);
  }
}

describe("durable Worker state publication", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    resetOfflineReadinessForTest();
    vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfflineReadinessForTest();
  });

  it("persists before making the next state observable", () => {
    const order: string[] = [];
    const durable = persistBeforePublish(
      "expanded topology",
      () => {
        order.push("localStorage");
        return true;
      },
      () => order.push("React"),
    );

    expect(durable).toBe(true);
    expect(order).toEqual(["localStorage", "React"]);
  });

  it("acknowledges one atomic preset batch only after React and localStorage agree", async () => {
    const { result, unmount } = renderHook(() => useSimulation());
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected the simulation Worker");

    const owned = {
      ...createInitialState(2028),
      ownedExpansionIds: ["workstation-expansion-i"],
    };
    act(() => {
      worker.emit({ type: "STATE", state: owned });
    });
    setOfflineShellReady(true);
    expect(document.documentElement.dataset.offlineReady).toBe("true");

    act(() => {
      result.current.commandBatch([
        { type: "REMOVE_MODULE", slotId: "prepare" },
        { type: "SET_EXPANSION_ACTIVE", active: true },
        {
          type: "PLACE_MODULE",
          moduleId: "basic-cleaner",
          slotId: "process-4",
        },
      ]);
    });

    expect(document.documentElement.dataset.offlineReady).toBe("false");
    const batch = worker.requests.at(-1);
    expect(batch?.type).toBe("COMMAND_BATCH");
    if (!batch || batch.type !== "COMMAND_BATCH")
      throw new Error("Expected one preset command batch");
    const expanded = reduceWorkerRequest(owned, batch);

    act(() => {
      worker.emit({
        type: "STATE",
        state: expanded,
        requestId: batch.requestId,
      });
    });

    await waitFor(() => {
      expect(
        result.current.state.slots.find((slot) => slot.slotId === "process-4")
          ?.moduleId,
      ).toBe("basic-cleaner");
    });
    const durable = JSON.parse(
      localStorage.getItem(SAVE_KEY) ?? "null",
    ) as typeof expanded;
    expect(durable).toEqual(result.current.state);
    expect(
      durable.slots.find((slot) => slot.slotId === "process-4")?.moduleId,
    ).toBe("basic-cleaner");
    expect(document.documentElement.dataset.offlineReady).toBe("true");

    unmount();
  });

  it("persists a full Career evening only after its one Worker batch completes", async () => {
    const { result, unmount } = renderHook(() => useSimulation());
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected the simulation Worker");

    const initial = createInitialState(2031);
    act(() => worker.emit({ type: "STATE", state: initial }));
    const draft = replaceCareerScheduleHours(
      replaceCareerScheduleHours(
        normalizeCareerScheduleDraft(initial.career.schedule.allocations),
        "freelance",
        3,
      ),
      "competition",
      1,
    );
    const commands = createCareerScheduleCommandBatch(draft);

    act(() => result.current.commandBatch(commands));
    const batch = worker.requests.at(-1);
    expect(batch?.type).toBe("COMMAND_BATCH");
    if (!batch || batch.type !== "COMMAND_BATCH")
      throw new Error("Expected one Career command batch");
    expect(batch.commands).toEqual(commands);
    const beforeCompletion = JSON.parse(
      localStorage.getItem(SAVE_KEY) ?? "null",
    ) as typeof initial;
    expect(beforeCompletion.career.schedule.completedEvenings).toBe(0);
    expect(beforeCompletion.career.freelanceHours).toBe(0);

    const completed = reduceWorkerRequest(initial, batch);
    act(() => {
      worker.emit({
        type: "STATE",
        state: completed,
        requestId: batch.requestId,
      });
    });

    await waitFor(() => {
      expect(result.current.state.career.schedule.completedEvenings).toBe(1);
    });
    expect(result.current.lastDurableRequestId).toBe(batch.requestId);
    const durable = JSON.parse(
      localStorage.getItem(SAVE_KEY) ?? "null",
    ) as typeof completed;
    expect(durable).toEqual(result.current.state);
    expect(durable.career.freelanceHours).toBe(3);
    expect(durable.career.competition.progress).toBeGreaterThan(0);
    expect(durable.career.schedule.allocations).toEqual({
      freelance: 0,
      competition: 0,
      product: 0,
      maintenance: 0,
    });
    unmount();
  });

  it("retains every ordered Career Worker boundary when responses batch before render", async () => {
    const { result, unmount } = renderHook(() => useSimulation());
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected the simulation Worker");
    const initial = applyCommand(createInitialState(2057), {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 4,
      maxElectricityCost: 5,
      maxOperatingCost: 5,
      minReliability: 0.7,
    });

    act(() => worker.emit({ type: "STATE", state: initial }));
    const draft = replaceCareerScheduleHours(
      normalizeCareerScheduleDraft(initial.career.schedule.allocations),
      "freelance",
      4,
    );
    act(() =>
      result.current.commandBatch(createCareerScheduleCommandBatch(draft)),
    );
    const run = worker.requests.at(-1);
    if (!run || run.type !== "COMMAND_BATCH")
      throw new Error("Expected one Career command batch");

    act(() => {
      result.current.command({
        type: "APPLY_OFFLINE_POLICY",
        requestedHours: 4,
      });
    });
    const offline = worker.requests.at(-1);
    if (!offline || offline.type !== "COMMAND")
      throw new Error("Expected one safe offline command");
    const runRequestId = run.requestId;
    const offlineRequestId = offline.requestId;
    if (runRequestId === undefined || offlineRequestId === undefined)
      throw new Error("Expected numbered Career Worker requests");

    const afterRun = reduceWorkerRequest(initial, run);
    const afterOffline = reduceWorkerRequest(afterRun, offline);
    act(() => {
      worker.emit({
        type: "STATE",
        state: afterRun,
        requestId: runRequestId,
      });
      worker.emit({
        type: "STATE",
        state: afterOffline,
        requestId: offlineRequestId,
      });
    });

    await waitFor(() => {
      expect(result.current.workerResponseBoundaries).toMatchObject([
        {
          requestId: runRequestId,
          before: initial,
          after: afterRun,
        },
        {
          requestId: offlineRequestId,
          before: afterRun,
          after: afterOffline,
        },
      ]);
    });
    expect(result.current.workerResponseBoundaries).toHaveLength(2);
    expect(result.current.lastDurableRequestId).toBe(offlineRequestId);
    act(() =>
      result.current.consumeWorkerResponseBoundariesThrough(offlineRequestId),
    );
    await waitFor(() => {
      expect(result.current.workerResponseBoundaries).toEqual([]);
    });
    unmount();
  });

  it("keeps Career Run locked until a later persisted Worker state covers a failed save", async () => {
    const storage = new FlakyStorage();
    vi.stubGlobal("localStorage", storage);
    const { result, unmount } = renderHook(() => {
      const simulation = useSimulation();
      const schedule = useCareerScheduleDraft(
        simulation.state,
        simulation.lastDurableRequestId,
        simulation.hasDurablePersistenceFailure,
      );
      return { simulation, schedule };
    });
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected the simulation Worker");
    const initial = createInitialState(2033);

    act(() => worker.emit({ type: "STATE", state: initial }));
    setOfflineShellReady(true);
    act(() => result.current.schedule.setRouteHours("freelance", 4));
    act(() => {
      expect(
        result.current.schedule.runScheduledEvening(
          result.current.simulation.commandBatch,
        ),
      ).toBe(true);
    });
    const batch = worker.requests.at(-1);
    if (!batch || batch.type !== "COMMAND_BATCH")
      throw new Error("Expected one Career command batch");

    storage.failWrites = true;
    const completed = reduceWorkerRequest(initial, batch);
    act(() => {
      worker.emit({
        type: "STATE",
        state: completed,
        requestId: batch.requestId,
      });
    });

    await waitFor(() => {
      expect(
        result.current.simulation.state.career.schedule.completedEvenings,
      ).toBe(1);
    });
    expect(result.current.simulation.lastDurableRequestId).toBe(0);
    expect(result.current.simulation.hasDurablePersistenceFailure).toBe(true);
    expect(result.current.schedule.isRunPending).toBe(true);
    expect(result.current.schedule.isRunBlocked).toBe(true);
    expect(document.documentElement.dataset.offlineReady).toBe("false");
    expect(
      JSON.parse(storage.getItem(SAVE_KEY) ?? "null").career.schedule
        .completedEvenings,
    ).toBe(0);

    storage.failWrites = false;
    // A normal later tick publication contains this completed command state.
    act(() => worker.emit({ type: "STATE", state: completed }));

    await waitFor(() => {
      expect(result.current.simulation.lastDurableRequestId).toBe(
        batch.requestId,
      );
      expect(result.current.simulation.hasDurablePersistenceFailure).toBe(
        false,
      );
      expect(result.current.schedule.isRunPending).toBe(false);
      expect(result.current.schedule.isRunBlocked).toBe(false);
    });
    expect(document.documentElement.dataset.offlineReady).toBe("true");
    expect(JSON.parse(storage.getItem(SAVE_KEY) ?? "null")).toEqual(completed);
    unmount();
  });

  it("applies only the persisted bounded offline policy after a restored session", async () => {
    const saved = applyCommand(createInitialState(2030), {
      type: "SET_OFFLINE_POLICY",
      enabled: true,
      maxHours: 1,
      maxElectricityCost: 0.1,
      maxOperatingCost: 0.4,
      minReliability: 0.9,
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    localStorage.setItem(OFFLINE_SAVED_AT_KEY, String(Date.now() - 3_600_000));

    const { result, unmount } = renderHook(() => useSimulation());
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected the simulation Worker");
    act(() => worker.emit({ type: "STATE", state: saved }));

    await waitFor(() => {
      const request = worker.requests.find(
        (candidate) =>
          candidate.type === "COMMAND" &&
          candidate.command.type === "APPLY_OFFLINE_POLICY",
      );
      expect(request).toBeDefined();
      if (!request || request.type !== "COMMAND")
        throw new Error("Expected offline command");
      expect(request.command.type).toBe("APPLY_OFFLINE_POLICY");
      if (request.command.type !== "APPLY_OFFLINE_POLICY")
        throw new Error("Expected offline command");
      expect(request.command.requestedHours).toBeGreaterThanOrEqual(1);
    });
    const request = worker.requests.find(
      (candidate) =>
        candidate.type === "COMMAND" &&
        candidate.command.type === "APPLY_OFFLINE_POLICY",
    );
    if (!request || request.type !== "COMMAND")
      throw new Error("Expected offline command");
    const advanced = reduceWorkerRequest(saved, request);
    act(() => {
      worker.emit({
        type: "STATE",
        state: advanced,
        requestId: request.requestId,
      });
    });
    await waitFor(() => {
      expect(
        result.current.state.career.offlinePolicy.lastReport?.appliedHours,
      ).toBe(1);
    });
    expect(result.current.state.career.competition.progress).toBe(0);
    expect(result.current.state.career.product.buildProgress).toBe(0);
    unmount();
  });
});
