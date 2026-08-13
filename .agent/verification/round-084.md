# Verification round 084 — live status and routing contract

Candidate SHA: `b9079e1834522704288e24623f9bd3feebecdbea`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `b9079e1834522704288e24623f9bd3feebecdbea`. It exactly matched the supplied
  candidate SHA.
- Initial `git status --short --branch` was clean apart from the expected
  branch-ahead metadata; no tracked or untracked worktree changes existed.
- The candidate delta is limited to read-only status tooling, frozen routing
  documentation, role/protocol routing text, and workflow tests. No product
  implementation or `scripts/verify` change is present after round 083.
- This is a lean status-routing verification. The routing maps were treated as
  navigation only; the cited plan, decisions, and immutable reports were read
  for the applicable gate and provenance boundaries.

## Independent requirement checklist

1. `scripts/agent-status` must be read-only, parse one exact immutable report
   record, expose deterministic human and JSON status, and fail closed on
   malformed or uncommitted report evidence.
2. Latest PASS-at-report-commit, committed descendants, latest FAIL with an
   earlier accepted PASS, ancestry/rebase mismatch, missing reports, duplicate
   rounds, malformed fields, report mutation, and report/candidate identity
   cases must produce the correct state or a nonzero fail-closed result.
3. `CURRENT_SCOPE.md` and `verification/INDEX.md` must remain frozen routing
   maps: they name historical provenance scope and exact authorities without
   claiming live HEAD, latest verdict, acceptance, unresolved state, or next
   gate.
4. AGENTS and all role prompts must require status before routing maps, retain
   full-read escalation triggers and verifier independence, and keep the
   implementer/verifier profiles pinned to Luna with maximum reasoning.
5. The cited plan/decision boundaries (plan §§2.4, 17, 19, 20.7, 24.1,
   24.5–24.6; D-030, D-033–D-036; Milestones 3.6–4) must remain represented
   by stable source mappings and retained adversarial evidence. No status-only
   change may silently alter product or canonical verification behavior.

## Environment and setup

- macOS/Darwin arm64; repository Node toolchain exercised through
  `npm exec --yes --package=node@22` with ignored `.cache/npm`.
- Temporary Git fixtures used isolated repositories under `/tmp`; each fixture
  configured its own commit identity and was removed after the probe.
- No browser, balance, production build, or full canonical gate was required:
  this candidate contains no product or `scripts/verify` executable change.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch`; `git diff --check` | Pass. Exact frozen candidate SHA; clean initial tree; no whitespace errors. |
| `sh -n scripts/agent-status` | Pass. |
| `./scripts/agent-status` and `./scripts/agent-status --json`, with a JSON parse and human/JSON field cross-check | Pass. Human and JSON agree on branch, HEAD, latest round/verdict/candidate/report commit, accepted verifier, ancestry, state, and next action. Real repository state is `unverified-later-changes` for the frozen candidate descendant of round-083's verifier commit. |
| Independent temporary-Git status harness | Pass. Accepted PASS at report/HEAD is `accepted-pass`; a committed descendant is `unverified-later-changes`; latest FAIL retains the earlier accepted PASS and reports `unresolved-latest-fail`; report-added-later and candidate/report commit identities resolve to the expected report and candidate SHAs. |
| Independent malformed/recovery fixtures: multiple, missing, or malformed verdict; missing/multiple/malformed candidate; duplicate normalized round; malformed round filename; no report directory; changed report after its creation commit; nonancestor candidate and rebased/copied-report candidate | Pass. Every malformed, stale, or ancestry-invalid fixture emits no JSON and exits nonzero with a specific fail-closed diagnostic. |
| Python `tomllib` parse of `.codex/agents/{implementer,verifier,orchestrator}.toml` | Pass. Implementer and verifier are `gpt-5.6-luna`, `model_reasoning_effort = "max"`, and `workspace-write`; orchestrator remains root-only. |
| Node-22 focused Vitest: `src/test/agentStatus.test.ts`, `src/test/agentWorkflowRouting.test.ts`, `src/test/verifierRound083Workflow.test.ts`, `src/test/verifyWorkflow.test.ts` | Pass: 4 files, 21 tests. |
| `npm exec --yes --package=node@22 -- npm run format:check` | Pass. |
| `npm exec --yes --package=node@22 -- npm run lint` | Pass. |
| `npm exec --yes --package=node@22 -- npm run typecheck` | Pass. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| Plan §2.4: independent verification and exact accepted-SHA discipline | Candidate SHA was captured before verifier writes; status derives live Git/report facts; temporary fixtures reject malformed, mutated, and nonancestor report evidence; no product repair or acceptance shortcut was used. | Pass |
| Plan §17 and D-034–D-036 provenance truthfulness | Frozen scope/index map the valid-integrity, stale-integrity, structural-relink, future-ID, and canonical-marker findings to immutable reports, regressions, and retained probes; round-083 remains the product/provenance acceptance authority. | Pass |
| Plan §§19–20.7 and 24.1/24.5/24.6 recovery, persistence, portrait, deterministic ledger boundaries | Scope/index preserve the frozen repair boundary, Rule-of-Three cases, canonical lanes, and offline/reload/PWA regression mappings. The candidate does not modify those executable seams. | Pass for this status-only candidate |
| Milestones 3.6–4 gate and Research block | Routing docs retain the exact full-read/release triggers and the requirement for fresh independent PASS plus exact-SHA deployment before Research; neither map makes a live acceptance claim. | Pass |
| AGENTS progressive disclosure and verifier independence | Protocol and role prompts require status before `CURRENT_SCOPE.md`/`INDEX.md`, treat routing and handoff material as untrusted, preserve full-read escalation triggers, Rule-of-Three coverage, max-checkpoint policy, and no-delegation verifier behavior. | Pass |
| Human/JSON status contract | Real repository output parses as JSON and agrees with human fields; temporary Git cases cover valid state, descendant, FAIL, malformed fields, missing reports, duplicate rounds, report mutation, ancestry/rebase, and report/candidate identity. | Pass |
| Immutable routing maps | `CURRENT_SCOPE.md` and `INDEX.md` explicitly label frozen history/navigation and avoid volatile current-head/latest/acceptance/next-gate claims; exact plan, decision, report, regression, and probe references remain present. | Pass |
| Luna/max role configuration | `tomllib` parsing and focused workflow tests confirm implementer/verifier `gpt-5.6-luna` with `model_reasoning_effort = "max"`; verifier remains `Do not delegate`. | Pass |
| Canonical product/browser/install lanes | Not rerun under the lean rule: no product implementation, dependency, startup, browser, balance, or `scripts/verify` executable delta since accepted round 083. Round-083's immutable report remains the prior product evidence; this round evaluates only status/routing behavior. | Scoped skip, not a candidate defect |

## Findings

None. No status, routing, role-configuration, or scope-boundary defect was
reproduced. No production implementation was modified.

## Unverified areas

- No product balance, browser/PWA, deployment, or hosted exact-SHA checks were
  rerun because the candidate changes only status/routing tooling and tests;
  the lean scope explicitly excludes those unchanged lanes.
- No non-Chromium or native screen-reader session was applicable to this
  read-only Git/report command.

## Residual risks

- Exact-SHA hosted verification/deployment remains the post-PASS owner gate;
  this report does not authorize push, deployment, or Research.
- The status command is operational metadata, not authority for product
  behavior; immutable plan, decisions, and reports remain authoritative.
