// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../simulation/engine";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import type { WorkerRequest, WorkerResponse } from "../simulation/types";
import { useCareerScheduleDraft } from "./careerScheduleDraft";
import { resetOfflineReadinessForTest } from "./offlineReadiness";
import { useSimulation } from "./useSimulation";

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

class FailingStorage implements Storage {
  get length(): number {
    return 0;
  }

  clear(): void {}
  getItem(): string | null {
    return null;
  }
  key(): string | null {
    return null;
  }
  removeItem(): void {}
  setItem(): void {
    throw new DOMException("storage quota exhausted", "QuotaExceededError");
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

describe("verifier round 052 durable Career Run acknowledgement", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    resetOfflineReadinessForTest();
    vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
    vi.stubGlobal("localStorage", new FailingStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfflineReadinessForTest();
  });

  it("keeps a submitted evening locked when persistence fails", async () => {
    const { result, unmount } = renderHook(() => {
      const simulation = useSimulation();
      const schedule = useCareerScheduleDraft(
        simulation.state,
        simulation.lastDurableRequestId,
      );
      return { simulation, schedule };
    });
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected simulation Worker");
    const initial = createInitialState(52_001);

    act(() => worker.emit({ type: "STATE", state: initial }));
    act(() => result.current.schedule.setRouteHours("freelance", 4));
    act(() => {
      expect(
        result.current.schedule.runScheduledEvening(
          result.current.simulation.commandBatch,
        ),
      ).toBe(true);
    });

    const request = worker.requests.at(-1);
    expect(request?.type).toBe("COMMAND_BATCH");
    if (!request || request.type !== "COMMAND_BATCH")
      throw new Error("Expected Career command batch");
    const completed = reduceWorkerRequest(initial, request);
    expect(completed.career.schedule.completedEvenings).toBe(1);

    act(() => {
      worker.emit({
        type: "STATE",
        state: completed,
        requestId: request.requestId,
      });
    });

    await waitFor(() => {
      expect(result.current.schedule.isRunPending).toBe(true);
    });
    expect(
      result.current.schedule.runScheduledEvening(
        result.current.simulation.commandBatch,
      ),
    ).toBe(false);
    expect(worker.requests).toHaveLength(2); // INIT plus the first Run batch.
    unmount();
  });

  it("releases a failed Career Run only after a later durable acknowledgement", async () => {
    const { result, unmount } = renderHook(() => {
      const simulation = useSimulation();
      const schedule = useCareerScheduleDraft(
        simulation.state,
        simulation.lastDurableRequestId,
      );
      return { simulation, schedule };
    });
    const worker = FakeWorker.instances[0];
    if (!worker) throw new Error("Expected simulation Worker");
    const initial = createInitialState(52_002);

    act(() => worker.emit({ type: "STATE", state: initial }));
    act(() => result.current.schedule.setRouteHours("freelance", 4));
    act(() => {
      result.current.schedule.runScheduledEvening(
        result.current.simulation.commandBatch,
      );
    });
    const careerRequest = worker.requests.at(-1);
    if (!careerRequest || careerRequest.type !== "COMMAND_BATCH")
      throw new Error("Expected Career command batch");
    const completed = reduceWorkerRequest(initial, careerRequest);
    act(() => {
      worker.emit({
        type: "STATE",
        state: completed,
        requestId: careerRequest.requestId,
      });
    });

    vi.stubGlobal("localStorage", new MemoryStorage());
    let laterRequestId: number | null = null;
    act(() => {
      laterRequestId = result.current.simulation.command({
        type: "TOGGLE_PAUSE",
      });
    });
    const laterRequest = worker.requests.at(-1);
    if (
      laterRequestId === null ||
      !laterRequest ||
      laterRequest.type !== "COMMAND"
    )
      throw new Error("Expected later durable command");
    const acknowledgedRequestId = laterRequestId;
    const laterState = reduceWorkerRequest(completed, laterRequest);
    act(() => {
      worker.emit({
        type: "STATE",
        state: laterState,
        requestId: acknowledgedRequestId,
      });
    });

    await waitFor(() => {
      expect(result.current.schedule.isRunPending).toBe(false);
    });
    unmount();
  });
});
