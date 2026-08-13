import { describe, expect, it } from "vitest";
import { applyCommand, createInitialState, tick } from "../simulation/engine";
import type { SimulationState } from "../simulation/types";
import {
  FIRST_SESSION_RECOMMENDED_MODULE_ID,
  selectFirstSessionPresentation,
} from "./firstSessionPresentation";

function settledStarter(seed = 73001): SimulationState {
  let state = createInitialState(seed);
  state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
  return tick(state, 60);
}

describe("first-session primary-action presentation", () => {
  it("derives the queue and settlement steps from durable Worker state without mutation", () => {
    const initial = createInitialState(73002);
    const before = structuredClone(initial);

    expect(selectFirstSessionPresentation(initial)).toMatchObject({
      active: true,
      action: "queue-starter",
      requiredTab: "jobs",
      title: "Queue one safe Interactive Chat job",
      recommendedModuleId: FIRST_SESSION_RECOMMENDED_MODULE_ID,
    });
    expect(initial).toEqual(before);

    const accepted = applyCommand(initial, { type: "QUEUE_JOBS", count: 1 });
    const observing = selectFirstSessionPresentation(accepted);
    expect(observing).toMatchObject({
      action: "observe-settlement",
      requiredTab: "jobs",
      actionLabel: "Observe the Jobs settlement",
    });
    expect(observing.body).toContain("locked quote");
  });

  it("shows a live Jobs shortfall before the recommended purchase and promotes the module once affordable", () => {
    const settled = settledStarter();
    const earn = selectFirstSessionPresentation(settled);
    expect(earn).toMatchObject({
      action: "earn-remainder",
      requiredTab: "jobs",
      recommendedModuleId: FIRST_SESSION_RECOMMENDED_MODULE_ID,
    });
    expect(earn.remainingMoney).toBeGreaterThan(0);
    expect(earn.title).toMatch(/^Earn \$/);
    expect(earn.body).toContain("earn the remaining amount");

    const funded = {
      ...settled,
      resources: { ...settled.resources, money: 4 },
    };
    expect(selectFirstSessionPresentation(funded)).toMatchObject({
      action: "buy-module",
      requiredTab: "upgrades",
      title: "Buy the recommended Precision Cleaner",
      remainingMoney: 0,
    });
  });

  it("keeps a selected purchase explicit: Upgrades handoff first, Build placement second", () => {
    const settled = settledStarter(73003);
    const funded = {
      ...settled,
      resources: { ...settled.resources, money: 4 },
    };
    const bought = applyCommand(funded, {
      type: "BUY_MODULE",
      moduleId: FIRST_SESSION_RECOMMENDED_MODULE_ID,
    });

    expect(selectFirstSessionPresentation(bought)).toMatchObject({
      action: "start-placement",
      requiredTab: "upgrades",
      actionLabel: "Place Precision Cleaner in Build",
    });
    expect(
      selectFirstSessionPresentation(
        bought,
        FIRST_SESSION_RECOMMENDED_MODULE_ID,
      ),
    ).toMatchObject({
      action: "place-module",
      requiredTab: "build",
      actionLabel: "Snap Precision Cleaner into Build",
    });

    const installed = applyCommand(bought, {
      type: "PLACE_MODULE",
      moduleId: FIRST_SESSION_RECOMMENDED_MODULE_ID,
      slotId: "prepare",
    });
    expect(selectFirstSessionPresentation(installed)).toMatchObject({
      active: false,
      action: "complete",
      progressPercent: 100,
    });
  });

  it("names a failed starter without suppressing the Jobs recovery record", () => {
    let state = createInitialState(73004);
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId: "runtime" });
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);

    const presentation = selectFirstSessionPresentation(state);
    expect(state.lastSettlement?.failed).toBe(1);
    expect(presentation).toMatchObject({
      action: "earn-remainder",
      requiredTab: "jobs",
      title: "Review failed settlement; earn $4.00 more for Precision Cleaner",
    });
    expect(presentation.body).toContain("latest starter delivery failed");
    expect(presentation.body).toContain("Jobs settlement record");
    expect(presentation.body).toContain("repair that named constraint");
  });

  it("uses an already chosen valid paid module for the final handoff", () => {
    const settled = settledStarter(73005);
    const funded = {
      ...settled,
      resources: { ...settled.resources, money: 4 },
    };
    const boughtAlternative = applyCommand(funded, {
      type: "BUY_MODULE",
      moduleId: "resilient-delivery",
    });

    expect(selectFirstSessionPresentation(boughtAlternative)).toMatchObject({
      action: "start-placement",
      requiredTab: "upgrades",
      recommendedModuleId: "resilient-delivery",
      actionLabel: "Place Resilient Delivery in Build",
    });
  });
});
