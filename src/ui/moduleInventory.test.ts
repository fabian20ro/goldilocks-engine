import { describe, expect, it } from "vitest";
import { applyCommand, createInitialState } from "../simulation/engine";
import { selectModuleInventory } from "./moduleInventory";

function section(
  state: ReturnType<typeof createInitialState>,
  id: "owned" | "available" | "locked",
  selectedStageId: string | null = null,
) {
  const result = selectModuleInventory(state, selectedStageId).find(
    (candidate) => candidate.id === id,
  );
  if (!result) throw new Error(`Missing ${id} inventory section`);
  return result;
}

describe("live Build and Upgrades module inventory", () => {
  it("orders owned, live affordable, then locked catalogue items", () => {
    const state = createInitialState(6301);
    state.resources.money = 4;

    const inventory = selectModuleInventory(state, "prepare");
    expect(inventory.map((item) => item.id)).toEqual([
      "owned",
      "available",
      "locked",
    ]);
    expect(section(state, "owned", "prepare").entries[0]?.owned).toBe(true);
    expect(
      section(state, "available", "prepare").entries.map(
        (entry) => entry.module.id,
      ),
    ).toContain("precision-cleaner");
    expect(
      section(state, "locked", "prepare").entries.map(
        (entry) => entry.module.id,
      ),
    ).toContain("adaptive-context");
  });

  it("uses current money rather than a cached affordability state", () => {
    const state = createInitialState(6302);
    state.resources.money = 3.99;
    expect(
      section(state, "locked").entries.find(
        (entry) => entry.module.id === "precision-cleaner",
      )?.requirement,
    ).toContain("Need $0.01 more");

    state.resources.money = 4;
    expect(
      section(state, "available").entries.find(
        (entry) => entry.module.id === "precision-cleaner",
      )?.requirement,
    ).toContain("Available now for $4.00");
  });

  it("names ownership, installed status, stage compatibility, and exact lock requirement", () => {
    const state = createInitialState(6303);
    const ownedCleaner = section(state, "owned", "prepare").entries.find(
      (entry) => entry.module.id === "basic-cleaner",
    );
    expect(ownedCleaner).toMatchObject({
      owned: true,
      equipped: true,
      compatibleWithSelectedStage: true,
    });
    expect(ownedCleaner?.requirement).toContain("Equipped in Prepare");

    const incompatibleModel = section(state, "owned", "source").entries.find(
      (entry) => entry.module.id === "quantized-model",
    );
    expect(incompatibleModel).toMatchObject({
      owned: true,
      compatibleWithSelectedStage: false,
    });
    expect(incompatibleModel?.requirement).toContain(
      "not compatible with Input",
    );
  });

  it("puts a newly owned, unplaced module first for its explicit placement handoff", () => {
    let state = createInitialState(6304);
    state = {
      ...state,
      resources: { ...state.resources, money: 4 },
    };
    state = applyCommand(state, {
      type: "BUY_MODULE",
      moduleId: "precision-cleaner",
    });

    expect(
      selectModuleInventory(state, null, {
        prioritizeUnplacedOwned: true,
      }).find((candidate) => candidate.id === "owned")?.entries[0]?.module.id,
    ).toBe("precision-cleaner");

    expect(section(state, "owned").entries[0]?.module.id).toBe(
      "precision-cleaner",
    );
  });
});
