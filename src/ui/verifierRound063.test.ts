import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createEstablishedScenarioState,
} from "../simulation/engine";
import {
  moduleInventoryDefaultEntries,
  selectModuleInventory,
} from "./moduleInventory";

describe("verifier round 063: selected Build inventory", () => {
  it("keeps an owned compatible alternate in the compact Input handoff", () => {
    let state = createEstablishedScenarioState(63063);
    state = {
      ...state,
      resources: { ...state.resources, money: 30 },
    };
    for (const moduleId of [
      "precision-cleaner",
      "adaptive-context",
      "efficient-runtime",
    ])
      state = applyCommand(state, { type: "BUY_MODULE", moduleId });

    const owned = selectModuleInventory(state, "source", {
      prioritizeUnplacedOwned: true,
    }).find((section) => section.id === "owned");
    if (!owned) throw new Error("Expected an Owned inventory section");

    // D-027: the selected stage's installed module ranks first, followed by
    // compatible placement choices. Paid process modules cannot displace the
    // only alternate source from the default three-card handoff.
    expect(
      moduleInventoryDefaultEntries(owned).map((entry) => entry.module.id),
    ).toContain("stream-intake");
  });
});
