import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import schema3 from "../../fixtures/save-fixtures/schema-3-pipeline-toy-2.json";
import schema4 from "../../fixtures/save-fixtures/schema-4-pipeline-toy-3.json";
import schema5 from "../../fixtures/save-fixtures/schema-5-pipeline-toy-4.json";
import schema6 from "../../fixtures/save-fixtures/schema-6-bedroom-career-1.json";
import schema7Evaluation from "../../fixtures/save-fixtures/schema-7-evaluation-replay-1.json";
import schema7Research from "../../fixtures/save-fixtures/schema-7-research-1.json";
import schema7HypeFear from "../../fixtures/save-fixtures/schema-7-hype-fear-1.json";
import schema7Lab from "../../fixtures/save-fixtures/schema-7-local-lab-1.json";
import boundaryFuture from "../../fixtures/save-fixtures/boundary-future-schema.json";
import boundaryMalformed from "../../fixtures/save-fixtures/boundary-malformed-json.json";
import boundaryStale from "../../fixtures/save-fixtures/boundary-stale-current.json";
import boundaryTampered from "../../fixtures/save-fixtures/boundary-tampered-current.json";
import boundaryUnsealed from "../../fixtures/save-fixtures/boundary-unsealed-current.json";
import boundaryUnsupported from "../../fixtures/save-fixtures/boundary-unsupported-schema.json";
import {
  createInitialState,
  hasValidStateIntegrity,
  isStateValid,
  restoreSimulationStateWithReport,
  serializeSimulationState,
} from "./engine";
import { SAVE_SUPPORT_POLICY_ID } from "./saveSupport";
import type { SimulationState } from "./types";

type GoldenFixture = {
  fixtureVersion: number;
  policy: string;
  id: string;
  source: {
    schemaVersion: number;
    contentVersion: string;
    supportTier: string;
  };
  payloadChecksum: { algorithm: string; value: string };
  expected: {
    seed: number;
    rngState: number;
    tick: number;
    workloadId: string;
    sourceTaskCount: number;
    sourceWaitingTaskIds: readonly string[];
    sourceLockedQuotes: readonly number[];
    sourceMoney: number;
    sourceEventIds: readonly string[];
    sourceSlotIds: readonly string[];
    sourceHasCareer: boolean;
    sourceHasResearch: boolean;
    sourceHasHypeFear: boolean;
    sourceHasLaboratory: boolean;
  };
  payload: unknown;
};

type BoundaryFixture = {
  fixtureVersion: number;
  policy: string;
  id: string;
  source: {
    kind: string;
    supportTier: string;
    derivation: string;
  };
  payloadChecksum: { algorithm: string; value: string };
  expected: { disposition: string; reason: string };
  rawPayload: string | null;
  payload: unknown;
};

const fixtures = [
  schema3,
  schema4,
  schema5,
  schema6,
  schema7Evaluation,
  schema7Research,
  schema7HypeFear,
  schema7Lab,
] as unknown as readonly GoldenFixture[];

const boundaryFixtures = [
  boundaryMalformed,
  boundaryStale,
  boundaryUnsealed,
  boundaryTampered,
  boundaryFuture,
  boundaryUnsupported,
] as unknown as readonly BoundaryFixture[];

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function textChecksum(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null)
    throw new Error("fixture payload is not an object");
  return value as Record<string, unknown>;
}

function unique<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

describe("D-046 golden save fixture boundary", () => {
  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))(
    "%s has provenance, checksum, and semantic invariants",
    (_id, fixture) => {
      expect(fixture.fixtureVersion).toBe(1);
      expect(fixture.policy).toBe(SAVE_SUPPORT_POLICY_ID);
      expect(fixture.source.supportTier).toMatch(
        /^(public-deployment|legacy-compatibility)$/,
      );
      expect(fixture.payloadChecksum.algorithm).toBe("sha256-json-v1");
      expect(checksum(fixture.payload)).toBe(fixture.payloadChecksum.value);
      expect(fixture.expected.seed).toBe(record(fixture.payload).seed);
      expect(fixture.expected.rngState).toBe(record(fixture.payload).rngState);
      expect(fixture.expected.workloadId).toBe(
        record(fixture.payload).workloadId,
      );
      expect(fixture.expected.sourceSlotIds.length).toBeGreaterThan(0);
    },
  );

  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))(
    "%s migrates deterministically and restores idempotently",
    (_id, fixture) => {
      const payload = record(fixture.payload);
      const first = restoreSimulationStateWithReport(
        fixture.payload,
        fixture.expected.seed,
        true,
      );
      const second = restoreSimulationStateWithReport(
        JSON.parse(serializeSimulationState(first.state)) as unknown,
        fixture.expected.seed,
        true,
      );
      expect(isStateValid(first.state)).toBe(true);
      expect(isStateValid(second.state)).toBe(true);
      expect(serializeSimulationState(second.state)).toBe(
        serializeSimulationState(first.state),
      );
      expect(first.state.seed).toBe(fixture.expected.seed);
      expect(first.state.rngState).toBe(fixture.expected.rngState);
      expect(first.state.tick).toBe(fixture.expected.tick);
      expect(first.state.workloadId).toBe(fixture.expected.workloadId);
      expect(first.state.resources.money).toBe(fixture.expected.sourceMoney);
      expect(unique(first.state.ledger.map((event) => event.id))).toBe(true);
      expect(first.state.eventSequence).toBeGreaterThanOrEqual(
        first.state.ledger.length,
      );
      expect(first.state.jobs.queued).toBe(fixture.expected.sourceTaskCount);
      expect(first.state.slots.map((slot) => slot.slotId)).toEqual(
        expect.arrayContaining([...fixture.expected.sourceSlotIds]),
      );
      expect(second.state.resources.money).toBe(first.state.resources.money);
      expect(second.state.jobs.queued).toBe(first.state.jobs.queued);
      expect(second.state.ledger.map((event) => event.id)).toEqual(
        first.state.ledger.map((event) => event.id),
      );
      if (fixture.source.schemaVersion === 7) {
        expect(
          hasValidStateIntegrity(payload as unknown as SimulationState),
        ).toBe(true);
        expect(first.state.career.schedule).toEqual(
          (payload.career as SimulationState["career"]).schedule,
        );
        expect(first.state.research).toEqual(payload.research);
        expect(first.state.hypeFear).toEqual(payload.hypeFear);
        expect(first.state.laboratory).toEqual(payload.laboratory);
      }
      expect(first.recovery.disposition).toBe(
        fixture.source.contentVersion === "local-lab-1" ? "none" : "migrated",
      );
    },
  );

  it("keeps old aggregate task counts without inventing a payout or duplicate event", () => {
    for (const fixture of fixtures.slice(0, 3)) {
      const result = restoreSimulationStateWithReport(
        fixture.payload,
        fixture.expected.seed,
        true,
      );
      expect(result.state.jobs.queued).toBe(fixture.expected.sourceTaskCount);
      expect(result.state.jobs.waitingTasks).toHaveLength(
        fixture.expected.sourceTaskCount,
      );
      expect(result.state.jobs.activeTask).toBeNull();
      expect(result.state.lastSettlement).toBeNull();
      expect(result.state.resources.money).toBe(fixture.expected.sourceMoney);
      expect(
        unique(result.state.jobs.waitingTasks.map((task) => task.id)),
      ).toBe(true);
    }
  });

  it("admits only exact audited legacy content pairs", () => {
    for (const fixture of fixtures.slice(0, 4)) {
      const payload = record(
        JSON.parse(JSON.stringify(fixture.payload)) as unknown,
      );
      payload.contentVersion = `unknown-${fixture.source.schemaVersion}`;
      const unknown = restoreSimulationStateWithReport(
        payload,
        fixture.expected.seed,
        true,
      );
      expect(unknown.recovery.disposition).toBe("reset");
      expect(unknown.state).toEqual(createInitialState(fixture.expected.seed));

      const malformed = restoreSimulationStateWithReport(
        {
          schemaVersion: fixture.source.schemaVersion,
          contentVersion: fixture.source.contentVersion,
        },
        fixture.expected.seed,
        true,
      );
      expect(malformed.recovery.disposition).toBe("reset");
      expect(malformed.state).toEqual(
        createInitialState(fixture.expected.seed),
      );
    }
  });

  it("does not call a valid sealed initial save a reset", () => {
    const source = createInitialState(46_050);
    const result = restoreSimulationStateWithReport(source, source.seed, true);
    expect(result.recovery.disposition).toBe("none");
    expect(result.recovery.reason).toBe("sealed-current-save");
  });

  it.each(boundaryFixtures.map((fixture) => [fixture.id, fixture] as const))(
    "%s has provenance/checksum and resolves its explicit adversarial boundary",
    (_id, fixture) => {
      expect(fixture.fixtureVersion).toBe(1);
      expect(fixture.policy).toBe(SAVE_SUPPORT_POLICY_ID);
      expect(fixture.source.kind).toBe("adversarial-boundary");
      expect(fixture.source.supportTier).toBe("boundary");
      expect(fixture.source.derivation.length).toBeGreaterThan(0);
      const payloadChecksum =
        fixture.rawPayload === null
          ? checksum(fixture.payload)
          : textChecksum(fixture.rawPayload);
      expect(fixture.payloadChecksum.value).toBe(payloadChecksum);
      expect(fixture.payloadChecksum.algorithm).toBe(
        fixture.rawPayload === null ? "sha256-json-v1" : "sha256-text-v1",
      );
      const result = restoreSimulationStateWithReport(
        fixture.rawPayload === null ? fixture.payload : undefined,
        4700,
        true,
      );
      expect(result.recovery.disposition).toBe(fixture.expected.disposition);
      expect(result.recovery.reason).toBe(fixture.expected.reason);
      expect(isStateValid(result.state)).toBe(true);
    },
  );

  it("preserves only corroborated state for a stale current save", () => {
    const source = createInitialState(46_100);
    const stale = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
    const staleResources = stale.resources as Record<string, unknown>;
    const staleCareer = stale.career as Record<string, unknown>;
    delete stale.integrity;
    staleResources.money = 3;
    stale.hardwareId = "used-gpu";
    stale.ownedHardwareIds = ["bedroom-cpu", "used-gpu"];
    stale.ownedModuleIds = [...source.ownedModuleIds, "precision-cleaner"];
    (stale.meta as Record<string, unknown>).completedEndingIds = [
      "honest-foundation",
    ];
    staleCareer.savings = 99;
    const result = restoreSimulationStateWithReport(stale, 46_100, true);
    expect(result.recovery.disposition).toBe("recovered");
    expect(result.state.resources.money).toBe(3);
    expect(result.state.hardwareId).toBe(source.hardwareId);
    expect(result.state.ownedHardwareIds).toEqual(source.ownedHardwareIds);
    expect(result.state.ownedModuleIds).toEqual(source.ownedModuleIds);
    expect(result.state.meta).toEqual(source.meta);
    expect(result.state.career.savings).toBe(source.career.savings);
    expect(result.state.research).toEqual(source.research);
    expect(result.state.hypeFear).toEqual(source.hypeFear);
    expect(result.state.laboratory).toEqual(source.laboratory);
    expect(isStateValid(result.state)).toBe(true);
  });

  it("fails closed for malformed, tampered-guide, unsupported, and future records", () => {
    const source = record(schema7Lab.payload);
    const sourceResources = source.resources as Record<string, unknown>;
    const malformed = restoreSimulationStateWithReport(
      { schemaVersion: 7, contentVersion: "local-lab-1", resources: null },
      46_200,
      true,
    );
    expect(malformed.recovery.disposition).toBe("reset");
    expect(malformed.state).toEqual(createInitialState(46_200));

    const tampered = JSON.parse(JSON.stringify(source)) as Record<
      string,
      unknown
    >;
    tampered.firstSession = {
      step: "complete",
      starterTaskId: "forged",
      observedSettlementTaskId: "forged",
      purchasedModuleId: "precision-cleaner",
    };
    delete tampered.integrity;
    const tamperedResult = restoreSimulationStateWithReport(
      tampered,
      46_201,
      true,
    );
    expect(tamperedResult.recovery.disposition).toBe("reset");
    expect(tamperedResult.state.firstSession.step).toBe("queue-starter");

    for (const value of [
      { schemaVersion: 7, contentVersion: "future-content" },
      {
        schemaVersion: 8,
        contentVersion: "future-content",
        resources: source.resources,
      },
      {
        schemaVersion: 2,
        contentVersion: "pipeline-toy-1",
        resources: source.resources,
      },
    ]) {
      const result = restoreSimulationStateWithReport(value, 46_202, true);
      expect(result.recovery.disposition).toBe("reset");
      expect(result.state).toEqual(createInitialState(46_202));
      expect(result.state.resources.money).not.toBe(sourceResources.money);
    }
  });
});
