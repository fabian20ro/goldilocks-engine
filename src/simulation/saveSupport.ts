/**
 * D-046 audited save-generation policy.
 *
 * `public-deployment` means an immutable report or release receipt identifies
 * the build as public. `legacy-compatibility` means the current restore
 * boundary deliberately accepts the generation and its exact source commit,
 * but no independent public deployment receipt was found. The distinction is
 * intentional: test fixtures must not manufacture deployment history.
 */
export type SaveGenerationSupportTier =
  | "public-deployment"
  | "legacy-compatibility";

export interface SaveGenerationRecord {
  id: string;
  schemaVersion: number;
  contentVersion: string;
  sourceCommit: string;
  sourceDate: string;
  supportTier: SaveGenerationSupportTier;
  publicDeployment: {
    candidateCommit: string;
    buildId: string | null;
    evidence: string;
  } | null;
  derivation: string;
}

export const SAVE_SUPPORT_POLICY_ID = "D-046-save-support-v1" as const;

export const SUPPORTED_SAVE_GENERATIONS: readonly SaveGenerationRecord[] = [
  {
    id: "schema-3-pipeline-toy-2",
    schemaVersion: 3,
    contentVersion: "pipeline-toy-2",
    sourceCommit: "65ee04f5b8815a5d60d70f354d8057aab49713d9",
    sourceDate: "2026-07-16",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the schema-3 source commit and the committed engine migration boundary; no public deployment receipt survives.",
  },
  {
    id: "schema-4-pipeline-toy-3",
    schemaVersion: 4,
    contentVersion: "pipeline-toy-3",
    sourceCommit: "592838f825327f2c06c8233e13955e8844603b9c",
    sourceDate: "2026-07-16",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the schema-4 upgrade-economy source commit and migration tests; no public deployment receipt survives.",
  },
  {
    id: "schema-5-pipeline-toy-4",
    schemaVersion: 5,
    contentVersion: "pipeline-toy-4",
    sourceCommit: "cd1f1b00b969df097d05c7eb21a5199b12f20aac",
    sourceDate: "2026-07-17",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the schema-5 Workstation Expansion I source commit and migration tests; no public deployment receipt survives.",
  },
  {
    id: "schema-6-bedroom-career-1",
    schemaVersion: 6,
    contentVersion: "bedroom-career-1",
    sourceCommit: "0e65f560056cc81a4c3045aa34861415ad716c7b",
    sourceDate: "2026-07-18",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the schema-6 Career source commit and deployed-schema migration tests; the later live publication was schema 7.",
  },
  {
    id: "schema-7-evaluation-replay-1",
    schemaVersion: 7,
    contentVersion: "evaluation-replay-1",
    sourceCommit: "60c1b5c64a914ebd5a74a9b21bf833a4627b3ef3",
    sourceDate: "2026-07-29",
    supportTier: "public-deployment",
    publicDeployment: {
      candidateCommit: "60c1b5c64a914ebd5a74a9b21bf833a4627b3ef3",
      buildId: null,
      evidence:
        ".agent/verification/round-061.md live Pages inspection; the report identifies the owner publication commit and scope but does not record a build ID.",
    },
    derivation:
      "Extracted shape from the schema-7 evaluation source lineage; optional post-checkpoint fields are absent in the historical payload.",
  },
  {
    id: "schema-7-research-1",
    schemaVersion: 7,
    contentVersion: "research-1",
    sourceCommit: "457e28f6891e97910550c7097e8cbf542a88afea",
    sourceDate: "2026-08-14",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the committed Research source and its migration tests; no independent public deployment receipt exists.",
  },
  {
    id: "schema-7-hype-fear-1",
    schemaVersion: 7,
    contentVersion: "hype-fear-1",
    sourceCommit: "0324bebe476675f7fdf9120786d0ecac8b22875e",
    sourceDate: "2026-08-14",
    supportTier: "legacy-compatibility",
    publicDeployment: null,
    derivation:
      "Reconstructed from the committed Hype/Fear source and its migration tests; no independent public deployment receipt exists.",
  },
  {
    id: "schema-7-local-lab-1",
    schemaVersion: 7,
    contentVersion: "local-lab-1",
    sourceCommit: "efd3e93c7ec4ff7f4039f8a0364ab276da38555b",
    sourceDate: "2026-08-15",
    supportTier: "public-deployment",
    publicDeployment: {
      candidateCommit: "d25e80e6781de89e80fc3b3c240a922ada53d978",
      buildId: "dc97ee41f6dbbc0e29d2",
      evidence:
        ".agent/RELEASE_ACCEPTANCE.md D-043 receipt and .agent/verification/round-100.md live build-info inspection.",
    },
    derivation:
      "Reconstructed from the Local Laboratory source commit and exact deployed candidate receipt; the fixture is resealed with current deterministic integrity rules.",
  },
] as const;

export const PUBLIC_DEPLOYED_SAVE_GENERATIONS =
  SUPPORTED_SAVE_GENERATIONS.filter(
    (generation) => generation.supportTier === "public-deployment",
  );

export const UNSUPPORTED_SAVE_SCHEMA_VERSIONS = [1, 2] as const;

export function findSupportedSaveGeneration(
  schemaVersion: number,
  contentVersion: string,
): SaveGenerationRecord | undefined {
  return SUPPORTED_SAVE_GENERATIONS.find(
    (generation) =>
      generation.schemaVersion === schemaVersion &&
      generation.contentVersion === contentVersion,
  );
}
