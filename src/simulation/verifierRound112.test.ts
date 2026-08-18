import { describe, expect, it } from "vitest";
import { createInitialState, restoreSimulationStateWithReport } from "./engine";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("round 112 independent M7D recovery adversaries", () => {
  it.each(["evaluation-replay-1", "research-1", "hype-fear-1"])(
    "reports reset for a malformed supported schema-7 %s record",
    (contentVersion) => {
      const result = restoreSimulationStateWithReport(
        { schemaVersion: 7, contentVersion },
        112_001,
        true,
      );

      expect(result.state).toEqual(createInitialState(112_001));
      expect(result.recovery.disposition).toBe("reset");
      expect(result.recovery.reason).toBe("invalid-integrity");
    },
  );

  it("does not treat a malformed capital ledger suffix as purchase corroboration", () => {
    const source = clone(createInitialState(112_002)) as unknown as Record<
      string,
      unknown
    >;
    delete source.integrity;
    source.hardwareId = "used-gpu";
    source.ownedHardwareIds = ["bedroom-cpu", "used-gpu"];
    source.ledger = (source.ledger as Array<Record<string, unknown>>).map(
      (event) =>
        event.id === "evt-0-1"
          ? {
              ...event,
              kind: "success",
              message:
                "Used 12 GB GPU purchased for $14.000 but this suffix is tampered",
            }
          : event,
    );

    const result = restoreSimulationStateWithReport(source, 112_002, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state.hardwareId).toBe("bedroom-cpu");
    expect(result.state.ownedHardwareIds).toEqual(["bedroom-cpu"]);
  });

  it("does not retain a forged causal counter from a malformed capital event", () => {
    const source = clone(createInitialState(112_003)) as unknown as Record<
      string,
      unknown
    >;
    delete source.integrity;
    const career = source.career as Record<string, unknown>;
    const evaluation = career.evaluation as Record<string, unknown>;
    evaluation.capitalCommitments = 1;
    source.ledger = (source.ledger as Array<Record<string, unknown>>).map(
      (event) =>
        event.id === "evt-0-1"
          ? {
              ...event,
              kind: "success",
              message:
                "Used 12 GB GPU purchased for $14.000 but this suffix is tampered",
            }
          : event,
    );

    const result = restoreSimulationStateWithReport(source, 112_003, true);

    expect(result.recovery.disposition).toBe("reset");
    expect(result.recovery.reason).toBe("invalid-integrity");
    expect(result.state.career.evaluation).toEqual(
      createInitialState(112_003).career.evaluation,
    );
  });
});
