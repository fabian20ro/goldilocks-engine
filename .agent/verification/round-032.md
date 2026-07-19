# Verification round 032

Candidate SHA: `7ee2625a553edfdca477b2261d42237a94ddf6d0`

VERDICT: FAIL

## Scope and verdict basis

Independent verification of frozen D-011 Evaluation, Failure, and Replay,
plus inherited Pipeline Toy, Workstation Expansion I, Bedroom Career, and
root/Pages PWA regression scope. Read independently: `plan.md`,
`.agent/DECISIONS.md` D-001 through D-011, `AGENTS.md`, verifier role,
candidate production source, prior immutable reports. Handoff and candidate
tests used only as navigation aids.

Before any write, `git rev-parse HEAD` was exactly the supplied candidate SHA;
`git status --short` was empty. Candidate is rejected because current-schema
save restore accepts/reseals forged private evidence (V-038), can manufacture
an evidence-backed ending from unrecorded warning counters (V-039), and the
exact candidate's GitHub canonical Verify run fails (V-040).

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Repository-pinned `@playwright/test` 1.61.1; Chromium under ignored
  `.cache/ms-playwright`.
- `./scripts/setup` invoked by canonical verification; locked dependencies and
  repository-local browser/cache paths used.
- Sandboxed Chromium cannot register its macOS Mach port. Exact canonical and
  verifier browser probes rerun with approved host launch; browser verification
  was not skipped.
- Verifier-authored artifacts: `src/simulation/verifierRound032.test.ts` and
  `tests/e2e/verifier-round-032.spec.ts`.
- Exact remote evidence: GitHub Actions Verify run
  `29668459619`, job `88143062322`, head SHA
  `7ee2625a553edfdca477b2261d42237a94ddf6d0`, Ubuntu 24.04 / Node 22.

## Commands executed and results

| Command or probe                                                                                                                        | Result                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short` before writes                                                                                | PASS. Exact supplied SHA; clean start.                                                                                                                                                                                                                                           |
| `./scripts/verify` in sandbox                                                                                                           | Static/unit/balance/build phases passed; browser launch failed only before page creation with macOS Mach-port permission denial.                                                                                                                                                 |
| `./scripts/verify` with approved host browser launch                                                                                    | PASS locally. Format, lint, typecheck, 110 candidate unit/property tests, numeric prototype, 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed Evaluation sweeps; production build; 101 root and 2 Pages pinned Playwright tests. Does not override V-040. |
| `gh run list --commit 7ee…`; `gh run view 29668459619 --log-failed`                                                                     | FAIL. Exact Verify run failed. `verifierRound031.test.ts` deterministic mixed-command probe timed out at 5,000 ms after 5,775 ms; 109 other unit tests plus root/Pages browser suites passed.                                                                                    |
| `npx tsx -e …` normal five-ending ledger probe                                                                                          | PASS. All five command-reachable endings valid; normal leakage/reliability/hardware/tutorial ignored-warning actions append named causal ledger events.                                                                                                                          |
| `npx tsx -e …` current-save mutation matrix                                                                                             | Partial PASS. Zero-sample private evidence repairs; dangling postmortem and non-finite evaluation fall back. One-sample 90% private coverage and unrecorded causal counters are accepted/resealed; V-038/V-039.                                                                  |
| `npx vitest run --coverage.enabled=false src/simulation/verifierRound032.test.ts`                                                       | FAIL as expected. One valid paid-evidence restore passes; V-038 and V-039 regressions fail.                                                                                                                                                                                      |
| `npm run test:e2e -- tests/e2e/verifier-round-032.spec.ts --reporter=line` with approved host browser launch                            | FAIL as expected. Reloaded real app persists and displays forged `credible`, 90%-coverage, one-sample evidence; V-038.                                                                                                                                                           |
| `npm run test:e2e -- tests/e2e/verifier-round-032.spec.ts --grep "portrait-readable" --reporter=line` with approved host browser launch | PASS. 320/393 CSS pixels, 200% text, reduced motion, visible Career/Evaluation UI, 44px controls, no horizontal document overflow, no page/console errors.                                                                                                                       |
| Visual inspection of current 320/393 scaled Playwright screenshots                                                                      | PASS for visible controls/no horizontal overflow. 393px title wrapping is awkward at 200% text; residual UX risk only.                                                                                                                                                           |
| `./scripts/run`; loopback HTTP probes; Ctrl-C; `lsof -nP -iTCP:4173 -sTCP:LISTEN`                                                       | PASS. Vite ready in 88 ms; root and module endpoints served 200; no port-4173 listener after shutdown.                                                                                                                                                                           |
| `npm run format:check && npm run lint && npm run typecheck`; `git diff --check`                                                         | PASS after verifier artifacts.                                                                                                                                                                                                                                                   |

## Requirement evidence matrix

| Applicable requirement                                                                                                                              | Independent evidence                                                                                                                                                                                         | Result                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Plan 2.3 primary gate; Sections 6 and 8–10 constrained one-pipeline configuration, queue identity, demand/recovery, legible tradeoffs               | Full local canonical deterministic, balance, and root browser suite; source scope inspection.                                                                                                                | PASS                                                          |
| D-007 Workstation Expansion I: capacity, locks, queue quotes, saturation/recovery, clear waiting, time equivalence, migration, portrait interaction | Canonical 41-seed progression sweep and retained 320/393 touch/keyboard/drag/offline browser coverage.                                                                                                       | PASS                                                          |
| D-008 root/Pages PWA atomic update, cache isolation, failed update recovery, save/offline preservation                                              | Canonical root 101-test suite includes root/Pages update fixtures; Pages suite 2/2 passed locally.                                                                                                           | PASS locally                                                  |
| D-010 four-hour Career schedule, costs/savings, durable model tiers, bounded offline policy, schema-6 migration                                     | Canonical 101-seed Career balance and browser/migration/offline coverage passed locally.                                                                                                                     | PASS                                                          |
| D-011 public benchmark proxy distinct from paid categorical private evidence; failed payment/retry                                                  | Manual no-paid submission leaves assessment `not-run`; normal paid evidence restore passes; canonical browser payment/reload coverage passes.                                                                | PASS for valid runtime flows; V-038 fails forged current save |
| D-011 product-shift, hardware-debt, tutorial-loop warnings; bounded causal ledger                                                                   | Five-ending normal ledger probe: named ignored warning events with direct/contributing text for leakage, reliability, hardware, tutorial. Current save can still fabricate causal counters; V-039.           | FAIL                                                          |
| D-011 five deterministic command-reachable endings; accumulated patterns; frozen run; explicit honest conclusion                                    | Canonical fixed scenarios/121-seed sweep and retained worker/replay browser tests pass locally.                                                                                                              | PASS for valid command streams                                |
| D-011 information-only diagnostic meta-progression                                                                                                  | Canonical deterministic/replay tests and source inspection: reset retains diagnostics/history, no metric/economy bonus path.                                                                                 | PASS                                                          |
| D-011 schema-6 migration; malformed/dangling current evaluation/postmortem recovery; retained ending evidence                                       | Manual matrix: schema-6/current baseline recovery paths pass, but semantically impossible current private evidence and causal counters are resealed.                                                         | FAIL — V-038, V-039                                           |
| D-011 320/393 portrait, 200% text, keyboard/touch, reduced motion, reload/resume/offline, labels/no color-only meaning                              | Canonical browser suites plus independent 320/393 reduced-motion visual/accessibility probe.                                                                                                                 | PASS                                                          |
| D-011 scope boundary: no characters, hype/fear/audience economy, extra/parallel pipelines, startup/labor/laboratory, transient catalogue            | Candidate diff and production source inspection; only bounded Evaluation/Replay changes over one Career pipeline. Numeric-prototype aggregate creator data remains D-001-authorized non-player-facing scope. | PASS                                                          |
| Runtime malformed input, recovery, determinism, startup, cleanup                                                                                    | Canonical/property coverage, manual malformed restore matrix, independent startup/cleanup probe.                                                                                                             | FAIL only for semantic current-save recovery — V-038, V-039   |
| Repository testability; all declared deterministic/balance/browser gates through canonical command                                                  | Host local `./scripts/verify` passes. Exact GitHub candidate run `29668459619` fails its required canonical test.                                                                                            | FAIL — V-040                                                  |

## Findings

### V-038 — Current save can forge impossible private-evaluation coverage

- Severity: High.
- Related plan requirement: D-011 Evaluation and Persistence/compatibility;
  D-004 transactional recovery; plan Sections 23.2, 24.4, and 24.6.
- Expected behavior: A current save claiming one paid private sample, `$0.750`
  spend, and 90% coverage is malformed. From zero private coverage one command
  can add only 25–50% (`evaluationCoverageGain` bound); restore must normalize
  that evidence or fall back, never re-seal it as player-earned.
- Actual behavior: `hasCoherentPrivateEvaluationEvidence` requires only
  positive coverage and count/spend equality. `restoreSimulationState` accepts
  90% coverage for one sample, adds `integrity-resealed`, and persists a
  `credible` assessment.
- Exact reproduction procedure:
  1. Run `npx vitest run --coverage.enabled=false src/simulation/verifierRound032.test.ts`.
  2. The second test serializes `createInitialState(32002)`, changes only
     private assessment to `credible`, sample count to `1`, spend to `0.75`,
     and coverage to `0.9`, then restores it.
  3. Observe the restored evaluation remains forged instead of initial.
  4. Run the targeted round-032 Playwright test to reproduce the same failure
     through localStorage, reload, Worker initialization, and visible UI.
- Concrete evidence: unit assertion at
  `src/simulation/verifierRound032.test.ts:40` receives coverage `0.9`, spend
  `0.75`, `credible`, count `1` instead of the initial record. Browser probe
  reports the same persisted values after reload.
- Blocks PASS: yes.

### V-039 — Unrecorded warning counters can manufacture an evidence-backed ending

- Severity: High.
- Related plan requirement: D-011 Failure/Ending/Persistence contracts; plan
  Sections 16–17 and 24.5.
- Expected behavior: A restored current save must not claim ignored warnings
  or an accumulated ending pattern unsupported by its durable causal ledger.
  A postmortem may record only what the simulation supports.
- Actual behavior: A fresh current save can be altered to `modelSwitches: 8`,
  `warnings.tutorial: 2`, and `ignoredWarnings: 2`. Restore accepts and
  reseals it. One `RUN_PUBLIC_EVALUATION` then freezes a Tutorial Loop at
  tick zero. The postmortem asserts two ignored-warning decisions although the
  ledger has no ignored-warning event.
- Exact reproduction procedure:
  1. Run `npx vitest run --coverage.enabled=false src/simulation/verifierRound032.test.ts`.
  2. The third test mutates only those evaluation counters on a fresh current
     save, restores it, then issues `RUN_PUBLIC_EVALUATION`.
  3. Observe `career.runEnding.id === "tutorial-loop"`; inspect the ledger
     for no `Ignored … warning` event.
- Concrete evidence: assertion at
  `src/simulation/verifierRound032.test.ts:64` shows restored forged counters;
  direct probe produced a `tutorial-loop` postmortem with contributing text
  "2 ignored-warning decisions were recorded" and an empty ignored-event list.
- Blocks PASS: yes.

### V-040 — Exact candidate fails canonical GitHub verification

- Severity: High.
- Related plan requirement: plan Section 2.4 advancement evidence; Milestone 3
  deterministic failure/replay evidence; repository testability protocol.
- Expected behavior: `./scripts/verify` must complete all declared checks,
  including verifier regression tests, on the pinned GitHub Actions Ubuntu
  runner.
- Actual behavior: Exact Verify run `29668459619` failed. Candidate increased
  the timeout for `evaluationReplay.test.ts`, but
  `verifierRound031.test.ts` still uses Vitest's 5,000 ms default and its mixed
  deterministic stream ran 5,775 ms on CI.
- Exact reproduction procedure:
  1. Open `https://github.com/fabian20ro/goldlocks-engine/actions/runs/29668459619`.
  2. Inspect job `88143062322`, step `Run canonical complete verification`.
  3. Observe `verifierRound031.test.ts > keeps mixed evaluation, failure,
replay, and timing commands deterministic` timing out at 5,000 ms.
- Concrete evidence: run metadata names candidate SHA
  `7ee2625a553edfdca477b2261d42237a94ddf6d0` and conclusion `failure`; log
  reports 20 unit files passed, `verifierRound031.test.ts` failed, 109 passing
  / 1 failing tests, while later root 101/101 and Pages 2/2 browser phases
  passed.
- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal behavior, haptics/audio, non-Chromium
  engines, and platform screen-reader output.
- Deployment of a fresh accepted SHA/build identity. Candidate Verify is
  failing, so it cannot supply accepted-release evidence.

## Residual risks

- At 393px with 200% text, the Evaluation title wraps awkwardly into several
  short fragments. No overflow, undersized control, page error, or console
  error observed; retain as UX refinement risk.
- Local host canonical pass does not make the exact failed CI run acceptable.
