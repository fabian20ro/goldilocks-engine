# Candidate handoff — Evaluation, Failure, and Replay

## Implemented behavior summary

- Retains the deterministic single workstation, purchasing, expansion, queue, demand, Bedroom Career, local-tier, offline-policy, root/Pages PWA, and service-worker recovery product.
- Schema 7 / content `evaluation-replay-1` adds separate public benchmark previews and paid private evaluation. Public score is visible; private evidence is a categorical assessment plus coverage and cost, never an exact latent capability or private numeric score.
- Repeated public previews raise leakage risk; paid private evidence reduces leakage/shift uncertainty without guaranteeing an outcome. Insufficient cash is a durable no-op with a recorded explanation; later funding/retry succeeds exactly once.
- Released-product service work can accumulate distribution-shift risk, reliability incidents, service debt, and causal ledger evidence. Capital commitments against unresolved constraints can create hardware debt/unpaid-cost pressure. Model/quantization churn can accumulate tutorial-loop warnings.
- Five deterministic, command-reachable endings exist: Public Leaderboard Hero, Product Reliability Collapse, Hardware Debt Spiral, Tutorial Loop, and explicit Honest Independent Builder. Automatic endings require their recorded causal pattern and escalating ignored warnings; the honest ending requires player-confirmed visible evidence.
- A closed run freezes. Same-seed restart and next-seed replay reset the pipeline/economy while retaining only completed-ending history and explanation-only diagnostic unlocks. Unlocks grant no production, money, quality, reliability, or coverage modifier.
- Every ending has an accessible postmortem backed by retained bounded-ledger causal evidence: direct causes, contributing factors, correlations, player-visible hypotheses, and unknowns.
- Schema-6 Bedroom Career saves migrate in place with initialized evaluation/replay state; malformed current evaluation or dangling postmortem data safely recovers through integrity validation.

## Plan requirements covered

| Requirement                                                                     | Candidate evidence                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Distinct public/private evaluation; no exact latent capability disclosure       | Engine model/validation tests; `evaluationReplay.test.ts`; pinned 393px browser payment/recovery flow                                                                                |
| Leakage/overfitting, costly coverage, distribution shift, reliability incidents | Deterministic engine scenarios and 121-seed `balance:evaluation` sweep                                                                                                               |
| Bounded causal ledger and accessible postmortems                                | Ending causal-evidence invariants; 320px Playwright postmortem with all five semantic categories                                                                                     |
| Five causal, non-opaque endings and replay                                      | Fixed command scenarios, property tests, 121-seed sweep, browser Tutorial Loop/restart case                                                                                          |
| Information-only diagnostic meta-progression                                    | Metric equality assertion; serialized restart/reload and browser diagnostic-unlock coverage                                                                                          |
| Preserve existing Career and schema-6 saves                                     | Schema-6 unit/browser migration; retained Career/PWA regression suites                                                                                                               |
| Portrait/accessibility/motion/touch/reload/offline paths                        | 320/393 browser cases, keyboard and CDP touch input, 200% text, reduced motion, offline reload; canonical suites retain pointer/touch drag, PWA update, Pages, and recovery coverage |
| Determinism and viable distinct responses                                       | Arbitrary command/persisted JSON properties plus 121-seed ending/avoidability/non-dominance sweep                                                                                    |

## Verifier findings resolved

- No unresolved verifier finding from rounds 001–030 was carried forward; immutable reports remain untouched.
- D-011 adds regression coverage for schema-6 migration, malformed evaluation/postmortem recovery, causal-ended-state serialization, bounded ledger references, deterministic ending patterns, and browser replay state persistence.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First setup needs network access for the lockfile dependencies and Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

`./scripts/setup` uses ignored repository-local caches only:

```text
npm cache:       .cache/npm
Chromium cache:  .cache/ms-playwright
test artifacts:  playwright-report/, playwright-pages-report/, test-results/
```

On Linux hosts requiring browser libraries:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Focused D-011 commands:

```sh
npx vitest run --no-coverage src/simulation/engine.test.ts src/simulation/evaluationReplay.test.ts
npm run balance:evaluation
npm run test:e2e -- tests/e2e/evaluation-replay.spec.ts
```

Canonical full check:

```sh
./scripts/verify
```

`./scripts/verify` runs setup, formatting, lint, typecheck, unit/property coverage, all deterministic balance sweeps, root build, root Playwright, and Pages Playwright. `playwright.config.ts` starts `./scripts/run-e2e` on deterministic `127.0.0.1:4173`, waits for it, and tears it down. No global package, user-home browser cache, profile, or in-app Browser is required.

## Important architectural decisions

- The simulation engine is sole authority: React renders Worker snapshots and sends typed commands only.
- `EvaluationState`, ending metadata, causal evidence, and `MetaProgression` are sealed/validated schema state. The only public/private bridge is a visible public score and a categorical private assessment; no latent numeric field is persisted.
- Ending completion appends causal evidence before freezing commands. The retained event ID is validated, so a postmortem cannot point at evicted/unrelated ledger data.
- Ending thresholds combine observed history, irreversible action, warning escalation, and ignored-warning decisions. `CONCLUDE_INDEPENDENT_RUN` is deliberately explicit rather than an automatic hidden success roll.
- Reset carries only diagnostic IDs, completed-ending IDs, and replay count. `calculateMetrics` and command economics do not inspect meta state for a bonus.
- Browser tests use pinned `@playwright/test`, repository-local Chromium cache, native keyboard controls, and CDP touch dispatch. Existing suites remain the drag, PWA update, root/Pages, malformed-state, and failure-recovery regression gates.

## Known limitations and risks

- Evaluation bands, warning thresholds, private-evaluation price, and endings are deterministic gameplay tuning—not real-world measurement, reliability forecasting, or hardware finance advice.
- Causal postmortems describe modeled evidence and bounded uncertainty; they intentionally cannot identify an exact latent capability or unseen production input.
- Physical mobile-device thermal/battery behavior, non-Chromium engines, and actual assistive-technology speech output remain unverified infrastructure areas.
- localStorage denial leaves an in-memory session playable but cannot preserve replay state across reload.
- No researchers/characters, attention economy, creators/hype/fear, extra pipelines, startup/labor/laboratory progression, narrative expansion, or transient model catalogues were added.
- Implementer does not push, deploy, merge, or accept the candidate. Fresh exact-SHA independent verification and release remain Orchestrator/Verifier work.

## Checks executed before candidate handoff

- `npm run typecheck` — PASS.
- `npx vitest run --no-coverage src/simulation/engine.test.ts src/simulation/evaluationReplay.test.ts` — PASS, 2 files / 50 tests.
- `npm run balance:evaluation` — PASS, 121 seeds / zero failures.
- `npm run test:e2e -- tests/e2e/evaluation-replay.spec.ts` — PASS, 2/2 browser cases (run with repository-cached Chromium).
- `./scripts/verify` — PASS. Fresh repository-local setup; format, lint, typecheck; 20 files / 103 unit-property tests; retained numeric prototype; 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation balance sweeps; root build; 100 root Playwright cases; and 2 Pages/offline cases completed. Fresh root/Pages reports contain no failed-test artifacts and final `.last-run.json` is `{"status":"passed","failedTests":[]}`.

## Checks not run

- No Git push, deployment, live URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader testing; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes that optional feedback, not a release blocker.
