import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
} from "./engine";

describe("verifier round 039 first-session recovery", () => {
  it("does not reseal an impossible completed guide into a Queue 10 bypass", () => {
    const malformed = structuredClone(createInitialState(39_001));
    malformed.firstSession = {
      step: "complete",
      starterTaskId: "not-a-task",
      observedSettlementTaskId: "not-a-task",
      purchasedModuleId: "not-a-module",
    };

    const restored = restoreSimulationState(malformed, 39_001);
    const queued = applyCommand(restored, { type: "QUEUE_JOBS", count: 10 });

    expect(restored.firstSession.step).toBe("queue-starter");
    expect(queued.jobs.queued).toBe(0);
  });

  it("keeps a recoverable starter path after clearing the sole waiting task and restarting", () => {
    let state = createInitialState(39_002);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = applyCommand(state, { type: "CLEAR_WAITING_TASKS" });
    state = restoreSimulationState(JSON.parse(JSON.stringify(state)), 39_002);

    const starterStillExists =
      state.jobs.activeTask?.id === state.firstSession.starterTaskId ||
      state.jobs.waitingTasks.some(
        (task) => task.id === state.firstSession.starterTaskId,
      );
    const resetForRetry = state.firstSession.step === "queue-starter";

    expect(starterStillExists || resetForRetry).toBe(true);
    if (resetForRetry) {
      const retry = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
      expect(retry.jobs.queued).toBe(1);
    }
  });
});
