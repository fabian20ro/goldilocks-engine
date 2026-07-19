# Verification round 031

Candidate SHA: `ab2d5eab950ca2fab8baddba7cce618819c6f7d7`

VERDICT: FAIL

## Scope and verdict basis

Independent verification of the frozen D-011 Evaluation, Failure, and Replay
candidate, plus inherited Pipeline Toy, Workstation Expansion I, Bedroom Career,
and root/Pages PWA regression scope. `plan.md`, D-001 through D-011, role
instructions, candidate production behavior, and prior finding history were read
independently. Handoff and candidate-authored tests were guidance only.

Before any verifier write, `git rev-parse HEAD` returned the supplied candidate
SHA and `git status --short` was empty.

The canonical command passes locally on the usable host browser path, but the
exact candidate's GitHub Actions canonical run fails on its declared 121-seed
evaluation sweep timeout. Acceptance fails because ignored warnings are not
recorded in the append-only ledger (V-035), semantically impossible current
evaluation saves are accepted and integrity-resealed instead of safely recovered
(V-036), and canonical verification is not CI-repeatable (V-037).

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Repository-pinned `@playwright/test` 1.61.1; Chromium in ignored
  `.cache/ms-playwright`.
- `./scripts/setup` used repository-local npm/browser caches.
- Sandboxed Chromium fails before page creation with macOS Mach-port permission
  denial. The same pinned canonical command and verifier browser probe were
  rerun with approved host launch; browser verification was not skipped.
- Verifier-authored artifacts: `src/simulation/verifierRound031.test.ts` and
  `tests/e2e/verifier-round-031.spec.ts`.
- GitHub Actions exact-SHA evidence: Verify run `29666899608`, job
  `88138775090`, Ubuntu 24.04 / Node 22 workflow configuration. The run is tied
  to this candidate SHA and concluded `failure`.

## Commands executed and results

| Command or probe                                                                                                                                                           | Result                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short` before writes                                                                                                                   | PASS. Exact supplied SHA; clean start.                                                                                                                                                                                                                                                                            |
| `./scripts/verify` in sandbox                                                                                                                                              | Static/unit/balance/build phases pass; all browser launches fail only at Chromium Mach-port registration before a page exists.                                                                                                                                                                                    |
| `./scripts/verify` with approved host browser launch                                                                                                                       | PASS locally. Format, lint, typecheck, 103 candidate unit/property tests, numeric prototype, 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps; production build; 100 root and 2 Pages pinned Playwright tests. This does not supersede V-037's exact CI failure.         |
| `gh run view 29666899608 --repo fabian20ro/goldlocks-engine --json headSha,conclusion,jobs,url`; `gh run view 29666899608 --repo fabian20ro/goldlocks-engine --log-failed` | FAIL. Exact candidate Verify run failed in `Run canonical complete verification`: `evaluationReplay.test.ts`'s declared 121-seed sweep exceeded Vitest's 5,000 ms default (`7,710 ms` for that file). Logs show 102 passed / 1 failed unit tests; its later root 100-test and Pages 2-test browser phases passed. |
| `npm run format:check && npm run lint && npm run typecheck` after verifier artifacts                                                                                       | PASS.                                                                                                                                                                                                                                                                                                             |
| `npm test` after verifier artifacts                                                                                                                                        | FAIL only as expected: 20 retained candidate files / 103 tests pass; verifier file has 3 pass and V-035/V-036's 2 failing regressions (106 pass, 2 fail).                                                                                                                                                         |
| `npx vitest run --coverage.enabled=false src/simulation/verifierRound031.test.ts`                                                                                          | FAIL as expected: V-035 and V-036 fail; public/private payment-recovery, deterministic mixed-stream, and Worker batch freeze/replay probes pass.                                                                                                                                                                  |
| Current-save semantic mutation matrix (`npx tsx -e …`)                                                                                                                     | FAIL: `credible` with zero paid samples, nonzero coverage with zero samples, and an unpaid private sample all restore as schema-7 valid state with `integrity-resealed`; a non-finite field correctly falls back.                                                                                                 |
| `npm run test:e2e -- tests/e2e/verifier-round-031.spec.ts --reporter=line` with approved host browser launch                                                               | PASS. Actual keyboard tutorial-loop ending, postmortem, next-seed replay, reduced motion, no page/console errors, 44px controls, and no horizontal overflow at 320x742 and 393x742 with 200% text.                                                                                                                |
| Visual inspection of probe screenshots                                                                                                                                     | PASS for postmortem readability and no horizontal overflow at both widths. Bottom-tab labels wrap tightly at 200% text but remain visible and target-sized.                                                                                                                                                       |
| `./scripts/run`; HTTP probes for `/` and `/src/main.tsx`; Ctrl-C; `lsof -nP -iTCP:4173 -sTCP:LISTEN`                                                                       | PASS. Vite ready on deterministic loopback in 146ms; both endpoints 200; listener absent after shutdown.                                                                                                                                                                                                          |
| `git diff --check`                                                                                                                                                         | PASS.                                                                                                                                                                                                                                                                                                             |

## Requirement evidence matrix

| Applicable requirement                                                                                                                               | Evidence                                                                                                                                                                                                | Result                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Plan 2.3 primary gate; plan 6/8–10 constrained single-pipeline tradeoffs, queue identity, demand, recovery                                           | Canonical deterministic/balance/root-browser suite passed; candidate diff/source inspection retains the single pipeline and existing constraints.                                                       | PASS                                                           |
| D-007 Workstation Expansion I: topology, locks, quotes, demand, clearing, fixed time, migration, portrait regressions                                | Canonical 41-seed progression and retained root/Pages acceptance passed.                                                                                                                                | PASS                                                           |
| D-008 root and Pages PWA identity, atomic update, rollback, cache isolation, offline reload/save preservation                                        | Canonical host root 100/100 and Pages 2/2 suites passed, including update/integrity cases.                                                                                                              | PASS                                                           |
| D-010 four-hour Career loop, accounting, model tiers, bounded offline policy, schema-6 behavior                                                      | Canonical 101-seed Career balance and retained browser/migration/offline tests passed.                                                                                                                  | PASS                                                           |
| D-011 public benchmark proxy versus paid categorical private evidence; leakage; private payment failure/retry                                        | Source inspection and new verifier normal-flow probe: public score remains separate; insufficient cash is a no-op; funded retry records $0.750, coverage, and a category.                               | PASS for valid runtime flow; V-036 fails malformed persistence |
| D-011 product shift/reliability, hardware debt, tutorial warnings, bounded causal ledger                                                             | Local canonical fixed scenarios/121-seed balance pass; source inspection confirms incidents, debt, warnings, and postmortem categories. Ignored-warning ledger recording is absent.                     | FAIL — V-035                                                   |
| D-011 five deterministic command-reachable endings; accumulated causal pattern; frozen runs; explicit honest conclusion                              | Local canonical scenarios/121-seed sweep pass; new Worker-batch probe confirms a Tutorial Loop freezes later commands until RESET; root browser route confirms keyboard ending and next-seed replay.    | PASS                                                           |
| D-011 information-only diagnostic meta-progression                                                                                                   | Candidate source inspection and canonical/replay browser tests show reset preserves only diagnostic/history metadata; no metric/economy bonus path found.                                               | PASS                                                           |
| D-011 schema-6 migration, current malformed/dangling evaluation/postmortem recovery, retained frozen postmortem evidence                             | Schema-6 migration, dangling ending, offline reload, and retained postmortem paths pass. Current semantically impossible evaluation records survive as valid evidence.                                  | FAIL — V-036                                                   |
| D-011 320/393 portrait, 200% text, keyboard/touch, reduced motion, accessibility, reload/resume/offline                                              | Canonical pinned browser suites plus new 320/393 scaled postmortem/next-seed probe pass.                                                                                                                | PASS                                                           |
| D-011 scope boundary: no characters, creators/hype/fear, extra pipelines, startup/labor/laboratory, or transient catalogue                           | Candidate diff and production source inspection found only evaluation/failure/replay additions on the existing single Career pipeline.                                                                  | PASS                                                           |
| Runtime malformed input, deterministic/restart behavior, setup/startup/cleanup                                                                       | Retained canonical tests plus new mixed command/tick, Worker batch, startup, HTTP readiness, and cleanup probes.                                                                                        | PASS except V-036 current-save semantic recovery               |
| Repository testability and plan advancement evidence: deterministic/balance checks must pass through the canonical command on the declared candidate | Local host run passes, but exact GitHub Actions `Verify` run `29666899608` on this SHA fails its required 121-seed D-011 test solely because the test exceeds the unconfigured 5,000 ms Vitest timeout. | FAIL — V-037                                                   |

## Findings

### V-035 — Ignored warnings are counted but never recorded in the append-only ledger

- Severity: High.
- Related plan requirement: D-011 Failure contract; `plan.md` Sections 16–17 and 24.5.
- Expected behavior: An action taken after an outstanding warning must append
  durable causal evidence identifying the ignored warning. The bounded ledger,
  not only a mutable aggregate counter, must record warnings, ignored warnings,
  incidents, and ending causes.
- Actual behavior: `withIgnoredWarnings` increments
  `career.evaluation.ignoredWarnings` but returns no `appendEvent` result. With
  one Tutorial Loop warning already present, a fourth quantization switch makes
  the counter `1`; the only new ledger entry says `Q4 selected` and does not
  identify an ignored warning. The same helper is used by hardware commitments,
  product service, submissions, and release paths.
- Exact reproduction procedure:

  1. Run `npx vitest run --coverage.enabled=false src/simulation/verifierRound031.test.ts`.
  2. The ledger probe creates three alternating Q4/Q8 switches, observes the
     tutorial warning, then performs a fourth switch.
  3. It asserts that the new ledger slice contains an event naming the ignored
     tutorial warning.

- Concrete evidence: assertion at
  `src/simulation/verifierRound031.test.ts:67` receives `false` while
  `ignoredWarnings` is `1`. Direct engine output lists the warning followed
  only by `Q4 selected: the lower-memory, faster baseline quantization is active.`
- Blocks PASS: yes.

### V-036 — Current saves can invent private evidence and are integrity-resealed

- Severity: High.
- Related plan requirement: D-011 Evaluation and Persistence/compatibility
  contracts; D-004 transactional recovery principle; `plan.md` Sections 23.2,
  24.4, and 24.6.
- Expected behavior: A current save claiming `credible` private assessment with
  zero coverage, zero private samples, and zero paid evidence is malformed.
  Restore must safely normalize that evaluation record or fall back, never
  treat it as valid paid evidence.
- Actual behavior: `isEvaluationStateValid` checks independent type/range
  bounds only. `restoreSimulationState` accepts this impossible schema-7
  record, changes migration metadata to `integrity-resealed`, and returns a
  valid state still showing `credible` evidence without a private evaluation.
- Exact reproduction procedure:

  1. Run `npx vitest run --coverage.enabled=false src/simulation/verifierRound031.test.ts`.
  2. The second test serializes a fresh state, changes only
     `privateAssessment` to `credible`, leaving coverage, private evaluations,
     and evaluation spend at zero, then restores it.
  3. It asserts restored evaluation equals the initial `not-run` record.

- Concrete evidence: assertion at
  `src/simulation/verifierRound031.test.ts:87` receives `credible` instead of
  `not-run`; the mutation matrix also preserves nonzero zero-sample coverage
  and a one-sample/$0 private record, each with `integrity-resealed`.
- Blocks PASS: yes.

### V-037 — The exact candidate fails its canonical GitHub verification run

- Severity: High.
- Related plan requirement: plan advancement gate (`plan.md:79`), Milestone 3
  deterministic failure/replay balance evidence, and repository testability
  protocol.
- Expected behavior: The repository's canonical `./scripts/verify` command
  must complete all declared deterministic/balance checks, including the 121
  seeds, on the pinned GitHub Actions Ubuntu runner. A runtime budget may be
  scoped appropriately, but the declared coverage cannot be reduced or skipped.
- Actual behavior: Exact candidate Verify run `29666899608` fails in
  `src/simulation/evaluationReplay.test.ts` at the 121-seed test because
  Vitest's default 5,000 ms timeout expires. GitHub logs report that test file
  at 7,710 ms, with `Error: Test timed out in 5000ms.` The rest of the script
  continues, including passing root and Pages browser suites, but exits 1.
- Exact reproduction procedure:

  1. Open exact GitHub Actions run
     `https://github.com/fabian20ro/goldlocks-engine/actions/runs/29666899608`,
     or query it with repository-read credentials:

     ```sh
     gh run view 29666899608 --repo fabian20ro/goldlocks-engine --log-failed
     ```

  2. Inspect the `Run canonical complete verification` log under job
     `88138775090`.
  3. Observe the timeout from `evaluationReplay.test.ts:173`, whose loop runs
     seeds 1 through 121, and the final failure result.

- Concrete evidence: Run metadata names head SHA
  `ab2d5eab950ca2fab8baddba7cce618819c6f7d7` and conclusion `failure`; failed
  log records 102 passing and 1 failing unit tests, then the timeout above.
- Blocks PASS: yes.

## Unverified areas

- Physical mobile-device battery/thermal behavior, haptics/audio, non-Chromium
  engines, and actual platform screen-reader output.
- Exact-SHA deployment and public deployed build-identity confirmation are
  release/orchestration work; not claimed here.
- No exact-SHA successful GitHub Actions canonical run exists for this
  candidate. A corrected successor needs a fresh CI run; local host success is
  supporting evidence only.

## Residual risks

- Browser checks require approved host launch on this macOS environment because
  the managed sandbox denies Chromium's Mach-port registration. Repository-
  pinned host runs are reproducible; browser acceptance was completed there.
- At 200% text, five bottom-navigation labels wrap tightly at narrow portrait
  widths. The dedicated probe confirms they remain visible, target-sized, and
  non-overflowing; future visual refinement can improve scanability.
- Local save integrity is an accidental-corruption check rather than a
  server-side anti-cheat boundary. V-036 is nevertheless a required local
  malformed-state recovery defect.
- V-037 is CI execution reliability, not evidence that the 121-seed assertions
  themselves are unsound; their coverage must remain intact when repaired.
