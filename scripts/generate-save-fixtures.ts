import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  applyCommand,
  createInitialState,
  createEstablishedScenarioState,
  hasValidSaveRecordIntegrity,
  hasValidStateIntegrity,
  sealSaveRecord,
  sealSimulationState,
} from "../src/simulation/engine";
import {
  SAVE_SUPPORT_POLICY_ID,
  SUPPORTED_SAVE_GENERATIONS,
} from "../src/simulation/saveSupport";
import type { SimulationState } from "../src/simulation/types";

const outputDirectory = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../fixtures/save-fixtures",
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function textChecksum(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sealWithContent(state: SimulationState, contentVersion: string) {
  return sealSimulationState({ ...state, contentVersion });
}

function establishedProgress(seed: number): SimulationState {
  let state = createEstablishedScenarioState(seed);
  state = applyCommand(state, {
    type: "QUEUE_JOBS",
    count: 2,
  });
  state = applyCommand(state, {
    type: "SET_EVENING_ALLOCATION",
    route: "freelance",
    hours: 2,
  });
  state = applyCommand(state, {
    type: "SET_EVENING_ALLOCATION",
    route: "maintenance",
    hours: 2,
  });
  return applyCommand(state, { type: "RUN_EVENING" });
}

function legacyPipelinePayload(
  state: SimulationState,
  schemaVersion: 3 | 4 | 5,
  contentVersion: string,
): Record<string, unknown> {
  const activeTask = state.jobs.activeTask;
  const schemaFiveFields =
    schemaVersion === 5
      ? {
          // Schema 5 was the first released generation with per-task queues.
          // Keep the complete pre-Career bookkeeping shape so the production
          // schema-5 boundary can prove queue/ledger preservation rather than
          // silently treating an incomplete record as a fresh run.
          jobs: state.jobs,
          eventSequence: state.eventSequence,
          ledger: state.ledger,
          metrics: state.metrics,
          baselineMetrics: state.baselineMetrics,
          baselineLabel: state.baselineLabel,
          failedModuleId: state.failedModuleId,
          lastWarning: state.lastWarning,
          lastUpgradeNotice: state.lastUpgradeNotice,
          lastSettlement: state.lastSettlement,
        }
      : {
          jobs: {
            queued: state.jobs.queued,
            completed: state.jobs.completed,
            failed: state.jobs.failed,
            processingCarry: activeTask?.progress ?? state.jobs.processingCarry,
            paused: state.jobs.paused,
            grossEarned: state.jobs.grossEarned,
            operatingCostsPaid: state.jobs.operatingCostsPaid,
          },
        };
  return {
    schemaVersion,
    contentVersion,
    seed: state.seed,
    rngState: state.rngState,
    tick: state.tick,
    hardwareId: state.hardwareId,
    ...(schemaVersion >= 4
      ? {
          ownedHardwareIds: state.ownedHardwareIds,
          ownedModuleIds: state.ownedModuleIds,
        }
      : {}),
    ...(schemaVersion >= 5
      ? {
          ownedExpansionIds: [],
          activeExpansionId: null,
          unlockedWorkloadIds: state.unlockedWorkloadIds,
          workloadDemand: state.workloadDemand,
        }
      : {}),
    workloadId: state.workloadId,
    slots: state.slots.slice(0, 5),
    branchEnabled: state.branchEnabled,
    computeAllocation: state.computeAllocation,
    memoryReserve: state.memoryReserve,
    resources: state.resources,
    ...schemaFiveFields,
  };
}

function buildPayload(id: string, seed: number): unknown {
  const state = establishedProgress(seed);
  switch (id) {
    case "schema-3-pipeline-toy-2":
      return sealSaveRecord(legacyPipelinePayload(state, 3, "pipeline-toy-2"));
    case "schema-4-pipeline-toy-3":
      return sealSaveRecord(legacyPipelinePayload(state, 4, "pipeline-toy-3"));
    case "schema-5-pipeline-toy-4":
      return sealSaveRecord(legacyPipelinePayload(state, 5, "pipeline-toy-4"));
    case "schema-6-bedroom-career-1": {
      const legacy = clone(state) as unknown as Record<string, unknown>;
      legacy.schemaVersion = 6;
      legacy.contentVersion = "bedroom-career-1";
      legacy.migration = { sourceSchemaVersion: 6, steps: [] };
      delete (legacy.career as Record<string, unknown>).evaluation;
      delete (legacy.career as Record<string, unknown>).runEnding;
      delete legacy.meta;
      delete legacy.causalEvidenceSnapshot;
      delete legacy.integrity;
      return sealSaveRecord(legacy);
    }
    case "schema-7-evaluation-replay-1":
      return sealWithContent(state, "evaluation-replay-1");
    case "schema-7-research-1":
      return sealWithContent(state, "research-1");
    case "schema-7-hype-fear-1":
      return sealWithContent(state, "hype-fear-1");
    case "schema-7-local-lab-1":
      return sealWithContent(state, "local-lab-1");
    default:
      throw new Error(`unknown save fixture ${id}`);
  }
}

type BoundaryFixture = {
  id: string;
  kind:
    | "malformed"
    | "stale"
    | "unsealed"
    | "tampered"
    | "future"
    | "unsupported";
  rawPayload?: string;
  payload?: unknown;
  expected: {
    disposition: "reset";
    reason: string;
  };
  derivation: string;
};

function boundaryFixtures(): readonly BoundaryFixture[] {
  const stale = clone(createInitialState(4700)) as unknown as Record<
    string,
    unknown
  >;
  const staleResources = stale.resources as Record<string, unknown>;
  staleResources.money = 3;
  // Keep the old seal-shaped metadata while changing a durable field: this
  // is the stale-integrity boundary, distinct from an omitted seal below.
  const unsealed = clone(createInitialState(4701)) as unknown as Record<
    string,
    unknown
  >;
  delete unsealed.integrity;
  (unsealed.resources as Record<string, unknown>).money = 3;
  const tampered = clone(createInitialState(4702)) as unknown as Record<
    string,
    unknown
  >;
  delete tampered.integrity;
  tampered.firstSession = {
    step: "complete",
    starterTaskId: "forged",
    observedSettlementTaskId: "forged",
    purchasedModuleId: "precision-cleaner",
  };
  const future = clone(createInitialState(4703)) as unknown as Record<
    string,
    unknown
  >;
  future.schemaVersion = 8;
  future.contentVersion = "future-content";
  const unsupported = {
    schemaVersion: 2,
    contentVersion: "pipeline-toy-1",
    seed: 4704,
  };
  return [
    {
      id: "boundary-malformed-json",
      kind: "malformed",
      rawPayload: "{malformed save",
      expected: { disposition: "reset", reason: "malformed-save" },
      derivation:
        "Fixed malformed text exercises the browser storage parse boundary; it is intentionally not JSON.",
    },
    {
      id: "boundary-stale-current",
      kind: "stale",
      payload: stale,
      expected: { disposition: "reset", reason: "invalid-integrity" },
      derivation:
        "Current initial state with a durable field changed while retaining stale integrity-shaped metadata.",
    },
    {
      id: "boundary-unsealed-current",
      kind: "unsealed",
      payload: unsealed,
      expected: { disposition: "reset", reason: "invalid-integrity" },
      derivation:
        "Current initial state with the integrity seal omitted; no simulation field is trusted at the reset boundary.",
    },
    {
      id: "boundary-tampered-current",
      kind: "tampered",
      payload: tampered,
      expected: {
        disposition: "reset",
        reason: "invalid-integrity",
      },
      derivation:
        "Current unsealed state with forged first-session identifiers; invalid progression is not retained.",
    },
    {
      id: "boundary-future-schema",
      kind: "future",
      payload: future,
      expected: { disposition: "reset", reason: "future-schema" },
      derivation:
        "Current state marked with the next schema and unknown content to prove no partial future interpretation.",
    },
    {
      id: "boundary-unsupported-schema",
      kind: "unsupported",
      payload: unsupported,
      expected: { disposition: "reset", reason: "unsupported-save-generation" },
      derivation:
        "Schema 2 pipeline-toy-1 is retained as an explicit unsupported historical boundary under D-047.",
    },
  ];
}

function expectedInvariants(payload: unknown): Record<string, unknown> {
  if (typeof payload !== "object" || payload === null)
    throw new Error("fixture payload must be an object");
  const state = payload as Record<string, unknown>;
  const jobs = isRecord(state.jobs) ? state.jobs : undefined;
  const resources = isRecord(state.resources) ? state.resources : undefined;
  const waitingTasks = Array.isArray(jobs?.waitingTasks)
    ? jobs.waitingTasks.filter(isRecord)
    : [];
  const ledger = Array.isArray(state.ledger)
    ? state.ledger.filter(isRecord)
    : [];
  const slots = Array.isArray(state.slots) ? state.slots.filter(isRecord) : [];
  return {
    seed: state.seed,
    rngState: state.rngState,
    tick: state.tick,
    workloadId: state.workloadId,
    sourceTaskCount: jobs?.queued ?? null,
    sourceWaitingTaskIds: waitingTasks.flatMap((task) =>
      typeof task.id === "string" ? [task.id] : [],
    ),
    sourceLockedQuotes: waitingTasks.flatMap((task) =>
      typeof task.lockedGrossQuote === "number" ? [task.lockedGrossQuote] : [],
    ),
    sourceMoney: resources?.money ?? null,
    sourceEventIds: ledger.flatMap((event) =>
      typeof event.id === "string" ? [event.id] : [],
    ),
    sourceSlotIds: slots.flatMap((slot) =>
      typeof slot.slotId === "string" ? [slot.slotId] : [],
    ),
    sourceHasCareer: state.career !== undefined,
    sourceHasResearch: state.research !== undefined,
    sourceHasHypeFear: state.hypeFear !== undefined,
    sourceHasLaboratory: state.laboratory !== undefined,
  };
}

mkdirSync(outputDirectory, { recursive: true });
for (const [index, generation] of SUPPORTED_SAVE_GENERATIONS.entries()) {
  const seed = 4600 + index;
  const payload = buildPayload(generation.id, seed);
  if (
    !hasValidSaveRecordIntegrity(payload) ||
    (generation.schemaVersion === 7 &&
      !hasValidStateIntegrity(payload as SimulationState))
  )
    throw new Error(`${generation.id} was not a valid sealed source payload`);
  const fixture = {
    fixtureVersion: 1,
    policy: SAVE_SUPPORT_POLICY_ID,
    id: generation.id,
    source: generation,
    payloadChecksum: {
      algorithm: "sha256-json-v1",
      value: checksum(payload),
    },
    expected: expectedInvariants(payload),
    payload,
  };
  writeFileSync(
    resolve(outputDirectory, `${generation.id}.json`),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
}

for (const boundary of boundaryFixtures()) {
  const payloadChecksum = {
    algorithm: boundary.rawPayload ? "sha256-text-v1" : "sha256-json-v1",
    value: boundary.rawPayload
      ? textChecksum(boundary.rawPayload)
      : checksum(boundary.payload),
  };
  const fixture = {
    fixtureVersion: 1,
    policy: SAVE_SUPPORT_POLICY_ID,
    id: boundary.id,
    source: {
      kind: "adversarial-boundary",
      supportTier: "boundary",
      derivation: boundary.derivation,
    },
    payloadChecksum,
    expected: boundary.expected,
    rawPayload: boundary.rawPayload ?? null,
    payload: boundary.payload ?? null,
  };
  writeFileSync(
    resolve(outputDirectory, `${boundary.id}.json`),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
}
