# Verification round 092 — Milestone 6 Local Laboratory endgame

Candidate SHA: `efd3e93c7ec4ff7f4039f8a0364ab276da38555b`

VERDICT: FAIL

## Scope and authority

Evaluated exactly candidate `efd3e93c7ec4ff7f4039f8a0364ab276da38555b`.
This is broad cross-milestone release verification. Read the complete
`plan.md`, `.agent/DECISIONS.md`, routing records, and retained verification
archive, with D-040 and `plan.md` §§16, 19, 20, 24, 27, 29 as the direct
Milestone 6 authorities. Handoff, implementation tests, comments, and routing
maps were treated as untrusted guidance.

Before verifier writes, `git rev-parse HEAD` returned the supplied candidate
SHA exactly. Production implementation was not modified. The only verifier
artifacts are the two probes named below and this immutable report.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1` and Chromium from ignored
  `.cache/ms-playwright`.
- Initial sandboxed Chromium launch failed before test bodies with macOS
  `MachPortRendezvousServer ... Permission denied`. The same pinned commands
  were rerun with scoped host authority; no browser lane was silently skipped.
- Playwright-managed preview servers and the independent UI probe server were
  cleaned up. Final evidence is retained in
  `.cache/verification/round-092-final`.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; `./scripts/agent-status --json` | Candidate SHA matched exactly; status parsed cleanly; worktree had only the new verifier probes before the report. |
| `npm run typecheck`; `npm run lint`; focused Vitest for Lab/engine/command deck | Passed; 66 focused tests. |
| `node --check .agent/verification/round-092-adversarial.mjs`; `node --check .agent/verification/round-092-ui-adversarial.mjs`; targeted ESLint and Prettier | Passed. |
| `node .agent/verification/round-092-adversarial.mjs` | Intentionally nonzero; normal, locked-prerequisite, offline, and restore/resume neighbors passed; it reported the two candidate defects below. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-092-ui-adversarial.mjs` | Intentionally nonzero at both 320px and 393px; reduced motion, touch activation, 200% text, no overflow, and no page/console errors passed; active-run founding defect reproduced at both widths. |
| Host-authorized `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- tests/e2e/laboratory.spec.ts` | Passed, 1/1. |
| Host-authorized `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e` | Passed, 235/235. |
| Host-authorized `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages` | Passed, 2/2. |
| Final `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright VERIFY_EVIDENCE_DIR=.cache/verification/round-092-final ./scripts/verify` | Passed setup, format, lint, typecheck, 66 files/303 tests, all balances, build, production audit (0 vulnerabilities), root 235/235, and Pages/offline 2/2. No executable verifier artifact changed after this gate. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| Milestone 6 coherent endgame: multiple machines, parallel pipelines, collaborators, reproducibility, culture, founding, scenarios, endings (`plan.md` §29; D-040) | Candidate source inspection; focused Lab tests; deterministic Lab balance (24/24 valid, completed, and ended; 17 passed experiments); focused Lab browser case. The independent probes expose the capacity/founding defects below. | Defective; findings block acceptance. |
| Four machines, three bounded pipelines, Researcher collaborator, reproducibility switches, retained documentation, three cultures | `laboratoryCatalog.ts`; focused unit route purchases/assigns a second machine and pipeline, invites Orin, sets all three switches/culture, documents, queues, and restores. Full canonical unit/balance lanes remain valid. | Evidence present; no separate defect found. |
| Deterministic Worker-only runs, routine failure traces, bounded queue/cost behavior, persistence/reload/resume, safe offline no queue/complete/found (D-040; `plan.md` §§19, 24, 27) | Focused engine tests and `round-092-adversarial.mjs`: queue cap/cost, failed-trace recovery, malformed save fallback, active restore/resume, offline Lab equality, and deterministic valid state. | Evidence present; founding lifecycle defect remains. |
| Founding transition and causal postmortem must close a coherent completed route (`plan.md` §16; D-040) | The valid balance route records Honest Foundation. The adversarial route has one completed Research run plus an active Reproducibility run; `FOUND_LAB` still records Honest Foundation, leaves the active run, and `tick(..., 60)` cannot advance it. The postmortem direct cause claims a bounded run was completed. | Fail — V-092-001. |
| Parallel capacity must be a deliberate machine/economy choice; machine and pipeline purchases deduct once (D-040; candidate Lab transition copy) | `round-092-adversarial.mjs` queues both pipelines with only the starter Bench Node. After one Worker tick, both are active with `machineIds: ["bench-node"]` and the machine inventory still contains only Bench Node. Purchase-once behavior itself passes canonical/unit checks. | Fail — V-092-002. |
| Lab entry/scenario gates and replay variation | `laboratoryEntryReadiness`, deterministic scenario unlock source, migration/shape validation, and Lab UI lock/ledger were inspected; focused locked-prerequisite test and canonical balance route pass. | Evidence present; no unresolved gate defect identified. |
| Schema 7 / `local-lab-1`, accepted prior content versions, malformed/stale/unsealed Lab fallback (D-040; `plan.md` §24) | Candidate restore path inspection; focused stale-object restore test; canonical migration and malformed-save regression lanes pass. | Evidence present. |
| Eighth primary destination, explicit lock gate, progressive details, 44px controls, portrait/text/reduced-motion behavior and user-visible consequences (D-040; `plan.md` §20) | Full root browser 235/235 and Pages 2/2; focused Lab browser; independent UI probe at 320/393 with touch, reduced motion, 200% text, no horizontal overflow, and no page/console errors. | Evidence present; founding action exposes V-092-001. |
| Inherited Career, Research, Hype/Fear, accounting, Worker, PWA, offline, security, and prior ending contracts | Final canonical gate: all 66/303 unit checks, all balance lanes, production audit, root PWA 235/235, Pages/offline 2/2; retained archive probes execute in the canonical suite. | Evidence present. |
| Reproducible setup/startup/process cleanup and exact-SHA verification | `./scripts/setup`; pinned local browser cache; Playwright-managed loopback servers; independent probe cleanup; exact candidate SHA captured and unchanged. | Evidence present. |

## Findings

### V-092-001 — Founding freezes an active laboratory run

- Severity: High
- Related requirements: D-040 offline/lifecycle and founding transition;
  `plan.md` §§16, 24, 27, 29.
- Expected behavior: founding must reject while any pipeline has an active or
  waiting run, or explicitly settle/cancel it while retaining an accurate trace
  before closing the run. A closed-run postmortem must not assert completed
  evidence that is still active.
- Actual behavior: `laboratoryPipelineReadiness` checks machine/pipeline/culture
  and `lastRun`, but not `activeRun` or `waitingRuns`. `FOUND_LAB` therefore
  finalizes Honest Foundation with Reproducibility still active. The ended-state
  guard then blocks both commands and Worker ticks, permanently freezing the
  active run.
- Reproduction: `node .agent/verification/round-092-adversarial.mjs`. With seed
  29, buy `parallel-rack`, add/assign Research, invite Orin, select Evidence
  first, enable all reproducibility switches, document, queue both pipelines,
  and `tick(state, 8)`. Output records Reproducibility active and Research
  completed once. Applying `FOUND_LAB` returns `ending: "honest-foundation"`
  with `activeAfterFounding: ["reproducibility"]`; `tick(..., 60)` leaves it
  active. The independent Playwright probe reproduces the same persisted state
  after tapping the visible founding button at both 320px and 393px.
- Concrete source evidence: `src/simulation/engine.ts:3922-3944` applies
  founding without an active/queue check; `src/simulation/engine.ts:5336-5337`
  and `5597-5598` freeze ended state; `src/simulation/engine.ts:1418-1425`
  describes Honest Foundation as having completed a bounded run.
- Blocks acceptance: yes.

### V-092-002 — Two pipelines run on one unassigned starter machine

- Severity: Medium
- Related requirements: D-040 multiple machines/parallel capacity and
  machine/pipeline economy; `plan.md` §§10, 24, 29.
- Expected behavior: the second pipeline should not obtain parallel capacity
  until a purchased machine is deliberately assigned (or the product should
  model and expose an explicit shared-machine capacity rule). The Lab copy and
  readiness gate state that a second machine is required for two pipelines to
  run in parallel.
- Actual behavior: adding a pipeline initializes it with `machineIds:
  ["bench-node"]`; `advanceLaboratory` starts every pipeline independently and
  never reserves machines. With only the starter machine, both pipelines become
  active in the same Worker tick. This bypasses the stated machine purchase and
  makes the visible capacity/economy choice non-binding.
- Reproduction: `node .agent/verification/round-092-adversarial.mjs`, the
  `parallel execution without assigning second machine` result: inventory is
  only Bench Node, while both Reproducibility and Research have active runs
  using `machineIds: ["bench-node"]`.
- Concrete source evidence: `src/simulation/engine.ts:3673-3687` initializes
  every added pipeline on Bench Node; `src/simulation/engine.ts:3493-3569`
  advances each pipeline without a machine allocation check; the readiness copy
  at `src/simulation/laboratory.ts:178-183` says two machines enable parallel
  runs.
- Blocks acceptance: yes; this violates a material Milestone 6 progression and
  tradeoff requirement.

## Unverified areas

- Native iOS/Android devices, battery/thermal measurements, non-Chromium
  engines, and platform screen-reader speech output were unavailable. Pinned
  Chromium supplied reproducible browser evidence.
- Hosted CI/deployment for this exact candidate was not run; the Orchestrator
  owns that exact-SHA release step.
- The independent UI probe seeds a valid Lab save to reach the endgame quickly;
  fresh progression is covered by the deterministic balance and gate source
  checks, while the canonical Lab browser test covers the reachable UI route.

## Residual risks

- Until V-092-001 is corrected, players can close a run while evidence work is
  still in flight, lose that work permanently, and receive an inaccurate
  postmortem.
- Until V-092-002 is corrected, a one-machine configuration can simulate the
  benefits of purchased parallel capacity and weaken the intended late-game
  economy.
- The sandboxed browser failure is an environment permission boundary only;
  host-authorized reruns passed all required browser lanes.
