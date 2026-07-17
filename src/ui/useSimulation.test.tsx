// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../simulation/engine";
import type { WorkerRequest, WorkerResponse } from "../simulation/types";
import { reduceWorkerRequest } from "../simulation/workerProtocol";
import {
  resetOfflineReadinessForTest,
  setOfflineShellReady,
} from "./offlineReadiness";
import { persistBeforePublish, SAVE_KEY, useSimulation } from "./useSimulation";

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
});
