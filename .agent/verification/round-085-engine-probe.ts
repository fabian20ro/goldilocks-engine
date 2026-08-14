import { strict as assert } from "node:assert";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "../../src/simulation/engine";
import { researchProjects } from "../../src/simulation/researchCatalog";

const commandSequence = [
  { type: "SET_RESEARCH_GOAL", text: "Find robust evidence" },
  { type: "INSPECT_RESEARCH_PROJECT", projectId: "context-reconstruction" },
  { type: "RECRUIT_RESEARCHER", researcherId: "mira-voss" },
  { type: "SET_RESEARCH_TEAM", researcherIds: ["mira-voss"] },
  { type: "START_RESEARCH", projectId: "context-reconstruction" },
] as const;

function recognizedState(seed: number) {
  const state = sealSimulationState({
    ...createInitialState(seed),
    resources: {
      ...createInitialState(seed).resources,
      money: 8,
      reputation: 0.2,
    },
    jobs: { ...createInitialState(seed).jobs, completed: 1, paused: true },
  });
  return state;
}

function startContext(seed: number) {
  let state = recognizedState(seed);
  for (const command of commandSequence) state = applyCommand(state, command);
  assert.ok(
    state.research.activeProject,
    `seed ${seed} did not start Research`,
  );
  return state;
}

function completeContext(seed: number) {
  let state = startContext(seed);
  for (let attempt = 0; attempt < 12 && state.research.activeProject; attempt++)
    state = tick(state, 60);
  assert.ok(
    state.research.lastOutcome,
    `seed ${seed} did not complete Research`,
  );
  assert.equal(state.research.activeProject, null);
  assert.ok(
    state.research.frontier.completedProjectIds.includes(
      "context-reconstruction",
    ),
  );
  assert.ok(isStateValid(state));
  return state;
}

function completeEvidenceWeave(seed: number) {
  let state = completeContext(seed);
  for (
    let attempt = 0;
    attempt < 5 && state.career.evaluation.coverage < 0.2;
    attempt++
  )
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
  state = applyCommand(state, {
    type: "INSPECT_RESEARCH_PROJECT",
    projectId: "evidence-weave",
  });
  state = applyCommand(state, {
    type: "RECRUIT_RESEARCHER",
    researcherId: "noor-adebayo",
  });
  state = applyCommand(state, {
    type: "SET_RESEARCH_TEAM",
    researcherIds: ["mira-voss", "noor-adebayo"],
  });
  state = applyCommand(state, {
    type: "START_RESEARCH",
    projectId: "evidence-weave",
  });
  assert.ok(state.research.activeProject, `seed ${seed} did not start Weave`);
  for (let attempt = 0; attempt < 12 && state.research.activeProject; attempt++)
    state = tick(state, 60);
  assert.ok(state.research.lastOutcome, `seed ${seed} did not complete Weave`);
  assert.equal(state.research.activeProject, null);
  assert.ok(isStateValid(state));
  return state;
}

const initial = recognizedState(85002);
const legacy = JSON.parse(JSON.stringify(createInitialState(85005))) as Record<
  string,
  unknown
>;
delete legacy.research;
legacy.contentVersion = "evaluation-replay-1";
const migrated = restoreSimulationState(
  sealSimulationState(legacy as never),
  85005,
);
assert.equal(
  migrated.research.frontier.discoveredProjectIds[0],
  "context-reconstruction",
);
assert.ok(migrated.migration.steps.includes("content-evaluation-to-research"));
assert.ok(isStateValid(migrated));

const hiddenAttempt = applyCommand(initial, {
  type: "INSPECT_RESEARCH_PROJECT",
  projectId: "evidence-weave",
});
assert.deepEqual(
  hiddenAttempt.research.frontier.inspectedProjectIds,
  initial.research.frontier.inspectedProjectIds,
);
assert.equal(researchProjects.filter((project) => !project.hidden).length, 1);

const invalidAllocation = applyCommand(initial, {
  type: "SET_RESEARCH_COMPUTE_ALLOCATION",
  percent: 101,
});
assert.equal(invalidAllocation.research.computeAllocation, 60);
const noCash = applyCommand(
  applyCommand(
    applyCommand(applyCommand(initial, commandSequence[0]), commandSequence[1]),
    commandSequence[2],
  ),
  { type: "SET_RESEARCH_TEAM", researcherIds: ["mira-voss"] },
);
const insufficientCash = applyCommand(
  { ...noCash, resources: { ...noCash.resources, money: 0 } },
  { type: "START_RESEARCH", projectId: "context-reconstruction" },
);
assert.equal(insufficientCash.resources.money, 0);
assert.equal(insufficientCash.research.activeProject, null);

const outcomeKinds = new Set<string>();
let usefulContext = completeContext(1);
for (let seed = 1; seed <= 121; seed++) {
  const completed = completeContext(seed);
  outcomeKinds.add(completed.research.lastOutcome?.kind ?? "missing");
  if ((completed.research.lastOutcome?.knowledgeGained ?? 0) >= 0.35)
    usefulContext = completed;
}
assert.deepEqual([...outcomeKinds].sort(), [
  "breakthrough",
  "failure",
  "partial",
  "useful-failure",
]);

const weaveOutcomeKinds = new Set<string>();
for (let seed = 1; seed <= 121; seed++)
  weaveOutcomeKinds.add(
    completeEvidenceWeave(seed).research.lastOutcome?.kind ?? "missing",
  );
assert.deepEqual([...weaveOutcomeKinds].sort(), [
  "breakthrough",
  "replication-failure",
  "subset",
  "useful-failure",
]);

let withCoverage = usefulContext;
for (
  let attempt = 0;
  attempt < 5 && withCoverage.career.evaluation.coverage < 0.2;
  attempt++
)
  withCoverage = applyCommand(withCoverage, {
    type: "RUN_PRIVATE_EVALUATION",
  });
assert.ok(withCoverage.career.evaluation.coverage >= 0.2);
assert.ok(isStateValid(withCoverage));
const evidenceBlocked = applyCommand(withCoverage, {
  type: "INSPECT_RESEARCH_PROJECT",
  projectId: "evidence-weave",
});
assert.ok(
  evidenceBlocked.research.frontier.discoveredProjectIds.includes(
    "evidence-weave",
  ),
);
assert.ok(
  evidenceBlocked.research.frontier.inspectedProjectIds.includes(
    "evidence-weave",
  ),
);

const highReputation = sealSimulationState({
  ...evidenceBlocked,
  resources: { ...evidenceBlocked.resources, reputation: 0.6 },
});
const orinRecruited = applyCommand(highReputation, {
  type: "RECRUIT_RESEARCHER",
  researcherId: "orin-kade",
});
const orinTeam = applyCommand(orinRecruited, {
  type: "SET_RESEARCH_TEAM",
  researcherIds: ["orin-kade"],
});
const reconstructed = applyCommand(orinTeam, {
  type: "FIRST_PRINCIPLES_RECONSTRUCTION",
});
assert.equal(reconstructed.research.firstPrinciplesUses, 1);
assert.ok(
  reconstructed.research.strategicOptionIds.includes("reconstruction-plan"),
);
assert.ok(reconstructed.research.institutionalKnowledge >= 0.3);

const noorRecruited = applyCommand(highReputation, {
  type: "RECRUIT_RESEARCHER",
  researcherId: "noor-adebayo",
});
const twoPersonTeam = applyCommand(noorRecruited, {
  type: "SET_RESEARCH_TEAM",
  researcherIds: ["mira-voss", "noor-adebayo"],
});
const activeWeave = applyCommand(twoPersonTeam, {
  type: "START_RESEARCH",
  projectId: "evidence-weave",
});
assert.ok(activeWeave.research.activeProject);
const afterDeparture = applyCommand(activeWeave, {
  type: "RELEASE_RESEARCHER",
  researcherId: "mira-voss",
});
assert.deepEqual(afterDeparture.research.teamMemberIds, ["noor-adebayo"]);
assert.ok(afterDeparture.research.activeProject);
const blockedTeamClear = applyCommand(afterDeparture, {
  type: "SET_RESEARCH_TEAM",
  researcherIds: [],
});
assert.deepEqual(blockedTeamClear.research.teamMemberIds, ["noor-adebayo"]);

let lifecycle = startContext(85003);
const beforeOffline = lifecycle.research.activeProject;
lifecycle = applyCommand(lifecycle, {
  type: "SET_OFFLINE_POLICY",
  enabled: true,
  maxHours: 2,
  maxElectricityCost: 2,
  maxOperatingCost: 2,
  minReliability: 0,
});
lifecycle = applyCommand(lifecycle, {
  type: "APPLY_OFFLINE_POLICY",
  requestedHours: 2,
});
assert.deepEqual(lifecycle.research.activeProject, beforeOffline);
assert.equal(lifecycle.research.lastOutcome, null);
assert.ok(isStateValid(lifecycle));

console.log(
  JSON.stringify(
    {
      hiddenProjects: researchProjects.filter((project) => project.hidden)
        .length,
      outcomeKinds: [...outcomeKinds].sort(),
      weaveOutcomeKinds: [...weaveOutcomeKinds].sort(),
      firstPrinciplesUses: reconstructed.research.firstPrinciplesUses,
      offlineActiveProjectPreserved: true,
    },
    null,
    2,
  ),
);
