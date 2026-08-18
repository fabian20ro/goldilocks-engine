import { describe, expect, it } from "vitest";
import schema3 from "../../fixtures/save-fixtures/schema-3-pipeline-toy-2.json";
import schema4 from "../../fixtures/save-fixtures/schema-4-pipeline-toy-3.json";
import { runEndingScenario } from "./evaluationBalance";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationStateWithReport,
  sealSimulationState,
} from "./engine";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("round 113 independent M7D save adversaries", () => {
  it.each([
    [3, schema3.payload],
    [4, schema4.payload],
  ] as const)(
    "fails closed for malformed numeric fields in exact schema-%s legacy saves",
    (schemaVersion, sourcePayload) => {
      const payload = clone(sourcePayload) as Record<string, unknown>;
      (payload.jobs as Record<string, unknown>).queued = "not-a-number";

      const result = restoreSimulationStateWithReport(
        payload,
        113_100 + schemaVersion,
        true,
      );

      expect(result.recovery.disposition).toBe("reset");
      expect(result.recovery.reason).toMatch(/malformed|uncorroborated/i);
      expect(result.state).toEqual(createInitialState(113_100 + schemaVersion));
    },
  );

  it("resets an unsealed ending whose identity does not match its causal event", () => {
    const source = runEndingScenario(113_101, "tutorial-loop");
    expect(isStateValid(source)).toBe(true);
    const forged = clone(source) as unknown as Record<string, unknown>;
    delete forged.integrity;
    const career = forged.career as Record<string, unknown>;
    const originalEnding = career.runEnding as Record<string, unknown>;
    career.runEnding = {
      ...originalEnding,
      id: "public-leaderboard-hero",
      title: "Public Leaderboard Hero",
      diagnosticUnlockId: "leakage-warning",
    };
    const meta = forged.meta as Record<string, unknown>;
    meta.unlockedDiagnosticIds = ["decision-history", "leakage-warning"];
    meta.completedEndingIds = ["tutorial-loop", "public-leaderboard-hero"];

    const result = restoreSimulationStateWithReport(forged, 113_101, true);

    expect(result.recovery.disposition).toBe("recovered");
    expect(result.state.career.runEnding).toBeNull();
    expect(result.state.meta).toEqual(createInitialState(113_101).meta);
    expect(isStateValid(result.state)).toBe(true);
  });

  it("recovers an uncorroborated expanded topology to starter capacity without discarding core state", () => {
    const initial = createInitialState(113_102);
    const funded = sealSimulationState({
      ...initial,
      resources: { ...initial.resources, money: 100 },
    });
    const purchased = applyCommand(funded, {
      type: "BUY_EXPANSION",
      expansionId: "workstation-expansion-i",
    });
    const expanded = applyCommand(purchased, {
      type: "SET_EXPANSION_ACTIVE",
      active: true,
    });
    expect(expanded.activeExpansionId).toBe("workstation-expansion-i");
    expect(expanded.slots).toHaveLength(8);
    expect(isStateValid(expanded)).toBe(true);

    const forged = clone(expanded) as unknown as Record<string, unknown>;
    delete forged.integrity;
    forged.ledger = (forged.ledger as Array<Record<string, unknown>>).filter(
      (event) =>
        !event.message
          ?.toString()
          .startsWith("Workstation Expansion I purchased"),
    );
    const result = restoreSimulationStateWithReport(forged, 113_102, true);

    expect(result.recovery.disposition).toBe("recovered");
    expect(result.state.resources.money).toBe(expanded.resources.money);
    expect(result.state.activeExpansionId).toBeNull();
    expect(result.state.ownedExpansionIds).toEqual([]);
    expect(result.state.slots).toHaveLength(5);
    expect(isStateValid(result.state)).toBe(true);
  });
});
