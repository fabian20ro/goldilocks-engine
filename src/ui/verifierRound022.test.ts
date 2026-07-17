// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acknowledgeDurableState,
  markDurableCommandPending,
  resetOfflineReadinessForTest,
  setOfflineShellReady,
} from "./offlineReadiness";

describe("verifier round 022 durable readiness boundary", () => {
  beforeEach(() => resetOfflineReadinessForTest());
  afterEach(() => resetOfflineReadinessForTest());

  it("waits for every in-flight command acknowledgement", () => {
    setOfflineShellReady(true);
    expect(document.documentElement.dataset.offlineReady).toBe("true");

    markDurableCommandPending(41);
    markDurableCommandPending(42);
    expect(document.documentElement.dataset.offlineReady).toBe("false");

    acknowledgeDurableState(41, true);
    expect(document.documentElement.dataset.offlineReady).toBe("false");

    acknowledgeDurableState(undefined, true);
    expect(document.documentElement.dataset.offlineReady).toBe("false");

    acknowledgeDurableState(42, true);
    expect(document.documentElement.dataset.offlineReady).toBe("true");
  });

  it("stays unready after a failed persistence until a later state is durable", () => {
    setOfflineShellReady(true);
    markDurableCommandPending(73);

    acknowledgeDurableState(73, false);
    expect(document.documentElement.dataset.offlineReady).toBe("false");

    acknowledgeDurableState(undefined, true);
    expect(document.documentElement.dataset.offlineReady).toBe("true");
  });
});
