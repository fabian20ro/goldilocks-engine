import { describe, expect, it } from "vitest";
import schema3 from "../../fixtures/save-fixtures/schema-3-pipeline-toy-2.json";
import schema4 from "../../fixtures/save-fixtures/schema-4-pipeline-toy-3.json";
import schema5 from "../../fixtures/save-fixtures/schema-5-pipeline-toy-4.json";
import schema6 from "../../fixtures/save-fixtures/schema-6-bedroom-career-1.json";
import schema7Evaluation from "../../fixtures/save-fixtures/schema-7-evaluation-replay-1.json";
import schema7Research from "../../fixtures/save-fixtures/schema-7-research-1.json";
import schema7HypeFear from "../../fixtures/save-fixtures/schema-7-hype-fear-1.json";
import schema7Lab from "../../fixtures/save-fixtures/schema-7-local-lab-1.json";
import {
  createInitialState,
  isStateValid,
  restoreSimulationStateWithReport,
  serializeSimulationState,
} from "./engine";

const SUPPORTED = [
  schema3,
  schema4,
  schema5,
  schema6,
  schema7Evaluation,
  schema7Research,
  schema7HypeFear,
  schema7Lab,
] as const;

function cloneRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null)
    throw new Error("expected object fixture");
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function independentFNV1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Independent fixture tool: create a valid seal without production helpers. */
function independentlySeal(value: Record<string, unknown>) {
  const payload = { ...value };
  delete payload.integrity;
  return {
    ...payload,
    integrity: {
      algorithm: "fnv1a-32-json-v1",
      digest: independentFNV1a(JSON.stringify(payload) ?? ""),
    },
  };
}

function expectFreshReset(
  result: ReturnType<typeof restoreSimulationStateWithReport>,
  seed: number,
  reason: string,
) {
  expect(result.recovery.disposition).toBe("reset");
  expect(result.recovery.reason).toBe(reason);
  expect(result.state).toEqual(createInitialState(seed));
  expect(isStateValid(result.state)).toBe(true);
}

describe("round 115 independent D-047 trust-boundary checks", () => {
  it("migrates every exact sealed generation and remains idempotent", () => {
    for (const fixture of SUPPORTED) {
      const payload = fixture.payload as unknown;
      const seed = fixture.expected.seed;
      const first = restoreSimulationStateWithReport(payload, seed, true);
      expect(isStateValid(first.state)).toBe(true);
      expect(first.state.seed).toBe(seed);
      expect(first.state.jobs.queued).toBe(fixture.expected.sourceTaskCount);
      expect(first.recovery.disposition).toBe(
        fixture.source.contentVersion === "local-lab-1" ? "none" : "migrated",
      );

      const reloaded = restoreSimulationStateWithReport(
        JSON.parse(serializeSimulationState(first.state)) as unknown,
        seed,
        true,
      );
      expect(reloaded.recovery.disposition).toBe("none");
      expect(serializeSimulationState(reloaded.state)).toBe(
        serializeSimulationState(first.state),
      );
    }
  });

  it("resets stale, missing, and invalid seals before reading progression", () => {
    const source = cloneRecord(schema7Lab.payload);
    const variants = [
      (() => {
        const value = cloneRecord(source);
        (value.resources as Record<string, unknown>).money = 999;
        return value;
      })(),
      (() => {
        const value = cloneRecord(source);
        delete value.integrity;
        (value.career as Record<string, unknown>).savings = 999;
        return value;
      })(),
      (() => {
        const value = cloneRecord(source);
        (value.integrity as Record<string, unknown>).digest = "00000000";
        (value.meta as Record<string, unknown>).completedEndingIds = [
          "honest-foundation",
        ];
        return value;
      })(),
    ];
    for (const value of variants)
      expectFreshReset(
        restoreSimulationStateWithReport(value, 115_001, true),
        115_001,
        "invalid-integrity",
      );
  });

  it("rejects exact-pair changes, future records, unsupported records, and malformed JSON", () => {
    const source = cloneRecord(schema3.payload);
    const unknownContent = cloneRecord(source);
    unknownContent.contentVersion = "unknown-content";
    expectFreshReset(
      restoreSimulationStateWithReport(unknownContent, 115_002, true),
      115_002,
      "unsupported-save-generation",
    );

    const future = cloneRecord(schema7Lab.payload);
    future.schemaVersion = 8;
    future.contentVersion = "future-content";
    expectFreshReset(
      restoreSimulationStateWithReport(future, 115_003, true),
      115_003,
      "future-schema",
    );

    expectFreshReset(
      restoreSimulationStateWithReport(
        { schemaVersion: 2, contentVersion: "pipeline-toy-1" },
        115_004,
        true,
      ),
      115_004,
      "unsupported-save-generation",
    );
    expectFreshReset(
      restoreSimulationStateWithReport("{malformed", 115_005, true),
      115_005,
      "malformed-save",
    );
  });

  it("rejects a validly sealed but structurally malformed current record", () => {
    const malformed = cloneRecord(schema7Lab.payload);
    (malformed.resources as Record<string, unknown>).money = "forged";
    const sealedMalformed = independentlySeal(malformed);
    expectFreshReset(
      restoreSimulationStateWithReport(sealedMalformed, 115_006, true),
      115_006,
      "malformed-save",
    );
  });

  it("rejects a validly sealed but structurally malformed legacy record", () => {
    const malformed = cloneRecord(schema3.payload);
    (malformed.jobs as Record<string, unknown>).queued = "forged";
    const sealedMalformed = independentlySeal(malformed);
    expectFreshReset(
      restoreSimulationStateWithReport(sealedMalformed, 115_007, true),
      115_007,
      "malformed-or-uncorroborated-save",
    );
  });

  it("keeps no-save status distinct from a malformed source", () => {
    const none = restoreSimulationStateWithReport(undefined, 115_008, false);
    expect(none.recovery.disposition).toBe("none");
    expect(none.recovery.reason).toBe("no-save");

    const malformed = restoreSimulationStateWithReport(
      undefined,
      115_009,
      true,
    );
    expectFreshReset(malformed, 115_009, "malformed-save");
  });
});
