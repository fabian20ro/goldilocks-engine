import { describe, expect, it } from "vitest";
import schema3 from "../../fixtures/save-fixtures/schema-3-pipeline-toy-2.json";
import schema4 from "../../fixtures/save-fixtures/schema-4-pipeline-toy-3.json";
import schema5 from "../../fixtures/save-fixtures/schema-5-pipeline-toy-4.json";
import schema6 from "../../fixtures/save-fixtures/schema-6-bedroom-career-1.json";
import { createInitialState, restoreSimulationStateWithReport } from "./engine";
import { persistSaveRecovery } from "./saveRecovery";

type PayloadFixture = { payload: Record<string, unknown> };

const legacyFixtures = [
  schema3,
  schema4,
  schema5,
  schema6,
] as unknown as readonly PayloadFixture[];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("round 111 independent M7D save adversaries", () => {
  it.each(
    legacyFixtures.map((fixture, index) => [index + 3, fixture] as const),
  )(
    "fails closed for unknown content paired with schema %s",
    (schemaVersion, fixture) => {
      const payload = clone(fixture.payload);
      payload.contentVersion = `unrecognized-content-${schemaVersion}`;

      const result = restoreSimulationStateWithReport(
        payload,
        47_100 + schemaVersion,
        true,
      );

      expect(result.recovery.disposition).toBe("reset");
      expect(result.state).toEqual(createInitialState(47_100 + schemaVersion));
    },
  );

  it.each(
    legacyFixtures.map((fixture, index) => [index + 3, fixture] as const),
  )(
    "reports reset, rather than migration, when schema %s is malformed",
    (schemaVersion, fixture) => {
      const payload = {
        schemaVersion,
        contentVersion: fixture.payload.contentVersion,
      };

      const result = restoreSimulationStateWithReport(
        payload,
        47_200 + schemaVersion,
        true,
      );

      expect(result.state).toEqual(createInitialState(47_200 + schemaVersion));
      expect(result.recovery.disposition).toBe("reset");
    },
  );

  it.each([
    [
      "hardware ownership",
      (state: ReturnType<typeof createInitialState>) => {
        state.hardwareId = "used-gpu";
        state.ownedHardwareIds = ["bedroom-cpu", "used-gpu"];
      },
    ],
    [
      "module ownership",
      (state: ReturnType<typeof createInitialState>) => {
        state.ownedModuleIds = [...state.ownedModuleIds, "precision-cleaner"];
      },
    ],
    [
      "meta progression",
      (state: ReturnType<typeof createInitialState>) => {
        state.meta.completedEndingIds = ["honest-foundation"];
      },
    ],
    [
      "Career progression",
      (state: ReturnType<typeof createInitialState>) => {
        state.career.savings = 99;
      },
    ],
  ] as const)("does not retain unsealed %s", (_name, mutate) => {
    const source = clone(createInitialState(47_300));
    const unsealedRecord = clone(source) as unknown as Record<string, unknown>;
    delete unsealedRecord.integrity;
    const unsealed = unsealedRecord as unknown as typeof source;
    mutate(unsealed);

    const result = restoreSimulationStateWithReport(unsealed, 47_300, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state).toEqual(createInitialState(47_300));
  });

  it("keeps a storage failure best-effort during recovery backup", () => {
    const storage = {
      setItem() {
        throw new Error("quota");
      },
    } as unknown as Storage;
    const status = {
      formatVersion: 1 as const,
      disposition: "reset" as const,
      reason: "malformed-save",
      preserved: [],
      reset: ["the saved run"],
      nextAction: "Start a new run.",
      backupCreated: false,
    };

    expect(() =>
      persistSaveRecovery(status, "{bad", { schemaVersion: 7 }, storage, 1),
    ).not.toThrow();
    expect(
      persistSaveRecovery(status, "{bad", { schemaVersion: 7 }, storage, 1),
    ).toBe(false);
  });
});
