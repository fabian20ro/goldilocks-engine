# Candidate handoff — Evaluation, Failure, and Replay repair (round 035)

## Implemented behavior summary

- Retains the deterministic single workstation, purchasing, expansion, queue, demand, Bedroom Career, local-tier, offline-policy, root/Pages PWA, and service-worker recovery product.
- Canonical Prettier checks exclude only immutable `.agent/verification/*.md` evidence; source, tests, scripts, configuration, and mutable documentation remain checked.
- Schema 7 / content `evaluation-replay-1` adds separate public benchmark previews and paid private evaluation. Public score is visible; private evidence is a categorical assessment plus coverage and cost, never an exact latent capability or private numeric score.
- Repeated public previews raise leakage risk; paid private evidence reduces leakage/shift uncertainty without guaranteeing an outcome. Insufficient cash is a durable no-op with a recorded explanation; later funding/retry succeeds exactly once.
- Ignoring an outstanding leakage, reliability, hardware, or tutorial warning now appends a bounded ledger warning with a direct cause and contributing condition; the aggregate ignored-warning counter remains bounded too.
- A competition submission can publish a public result but cannot mint a private category. Every non-`not-run` private assessment now requires positive paid sample count, positive coverage, and the exact accumulated private-evaluation cost.
- Current schema-7 saves validate private evidence against the runtime $0.750 sample cost and the 25–50% per-sample coverage bound. Valid-shaped but incoherent evidence normalizes only the evaluation record and records `schema-v7-evaluation-evidence-repaired`; malformed shapes or dangling postmortems still fall back safely.
- Every sealed runtime state now carries a compact causal checkpoint: its event sequence plus a deep copy of the complete evaluation record. Before the 80-event retention boundary, the complete ledger independently supports causal counters. After rollover, restore accepts causal counters only when the original integrity seal and checkpoint agree. A valid pre-checkpoint schema-7 save migrates once by adding the checkpoint; a stale, missing, or mismatched post-rollover checkpoint resets evaluation data with `schema-v7-causal-ledger-repaired` instead of resealing a manufactured ending.
- Released-product service work can accumulate distribution-shift risk, reliability incidents, service debt, and causal ledger evidence. Capital commitments against unresolved constraints can create hardware debt/unpaid-cost pressure. Model/quantization churn can accumulate tutorial-loop warnings.
- Five deterministic, command-reachable endings exist: Public Leaderboard Hero, Product Reliability Collapse, Hardware Debt Spiral, Tutorial Loop, and explicit Honest Independent Builder. Automatic endings require their recorded causal pattern and escalating ignored warnings; the honest ending requires player-confirmed visible evidence.
- A closed run freezes. Same-seed restart and next-seed replay reset the pipeline/economy while retaining only completed-ending history and explanation-only diagnostic unlocks. Unlocks grant no production, money, quality, reliability, or coverage modifier.
- Every ending has an accessible postmortem backed by retained bounded-ledger causal evidence: direct causes, contributing factors, correlations, player-visible hypotheses, and unknowns.
- Schema-6 Bedroom Career saves migrate in place with initialized evaluation/replay state; malformed current evaluation or dangling postmortem data safely recovers through integrity validation.

## Plan requirements covered

| Requirement                                                                     | Candidate evidence                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Distinct public/private evaluation; no exact latent capability disclosure       | Engine invariants reject unpaid categories/cost mismatches; `evaluationReplay.test.ts`; pinned 393px browser payment/recovery flow                                                   |
| Leakage/overfitting, costly coverage, distribution shift, reliability incidents | Deterministic engine scenarios and 121-seed `balance:evaluation` sweep                                                                                                               |
| Bounded causal ledger and accessible postmortems                                | Ignored-warning direct-cause/contributing-condition ledger regression; ending causal-evidence invariants; 320px Playwright postmortem with all five semantic categories              |
| Five causal, non-opaque endings and replay                                      | Fixed command scenarios, property tests, 121-seed sweep, browser Tutorial Loop/restart case                                                                                          |
| Information-only diagnostic meta-progression                                    | Metric equality assertion; serialized restart/reload and browser diagnostic-unlock coverage                                                                                          |
| Preserve existing Career and schema-6 saves                                     | Schema-6 unit/browser migration; current schema-7 bounded-coverage and causal-ledger normalization; retained Career/PWA regression suites                                            |
| Portrait/accessibility/motion/touch/reload/offline paths                        | 320/393 browser cases, keyboard and CDP touch input, 200% text, reduced motion, offline reload; canonical suites retain pointer/touch drag, PWA update, Pages, and recovery coverage |
| Determinism and viable distinct responses                                       | Arbitrary command/persisted JSON properties plus complete 121-seed ending/avoidability/non-dominance sweep with a scoped 20s CI test budget                                          |

## Verifier findings resolved

- No unresolved verifier finding from rounds 001–030 was carried forward; immutable reports remain untouched.
- **V-035:** `withIgnoredWarnings` now appends a bounded, named warning event with direct-cause and contributing-condition evidence before the triggering action event. Candidate and preserved verifier regression tests cover a Tutorial warning followed by a fourth quantization switch.
- **V-036:** cross-field private-evidence invariants now reject category/coverage/sample/cost mismatches. Current schema-7 values with a valid shape but incoherent evidence reset their evaluation state with `schema-v7-evaluation-evidence-repaired`; malformed shapes continue to fall back. Competition submission no longer creates free private evidence, and the Public Leaderboard Hero scenario pays for its at-risk sample.
- **V-037:** the unchanged five-assertion 121-seed test now has a documented, case-scoped 20s Vitest timeout. Full coverage and the canonical host run complete the entire loop; no seed or assertion was removed.
- **V-038:** private-evidence validation now bounds retained coverage by the actual 25–50% gain per paid sample as well as exact `$0.750` cost. A one-sample 90% forged save resets evaluation rather than being resealed; a runtime-funded sample round-trips unchanged.
- **V-039:** restore checks causal counters against retained ledger evidence while the entire history is present. Unsupported warning/ignored-warning/model-switch/capital/reliability counters reset evaluation and, if applicable, discard an unsupported frozen ending; valid tutorial-ending and post-cap bounded histories survive reload.
- **V-040:** `applyCommand` and `tick` no longer hash a snapshot a second time after they have just sealed it; they retain full structural validation, while `isStateValid` remains the external structural-plus-integrity gate. The untouched verifier mixed-stream test completed in 1.15s under local coverage instrumentation.
- **V-041:** post-rollover recovery no longer treats a full 80-entry ledger as causal proof. `CausalEvidenceSnapshot` is sealed atomically with every state and must exactly match `eventSequence` and every evaluation field before an integrity-valid saturated save is retained. A forged or stale full-history save resets evaluation and clears any unsupported frozen ending; valid pre-checkpoint schema-7 saves migrate with `schema-v7-causal-snapshot-added`. Candidate tests cover a real causal history after rollover, valid legacy migration, a forged hardware-ending pattern, and the preserved 320px Tutorial Loop browser regression.
- **Round 035 tooling repair:** immutable verifier report Markdown is excluded from Prettier’s repository-wide scan, preventing the formatter from proposing a rewrite of append-only verification evidence while retaining formatting checks for every other tracked applicable path.

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
- Private evidence is causally tied to paid sampling: `privateEvaluations > 0`, category, exact `$0.750`-per-sample spend, and the 25–50% bounded coverage gain are validated as one record. Current saved records that only violate this coherence are repaired narrowly; all other malformed state still uses transactional fallback.
- Causal-counter recovery is retention-aware and checkpointed: complete histories must supply matching ledger evidence; saturated histories must carry a coherent checkpoint under their original integrity seal. The checkpoint is bounded state, not an unbounded second ledger. A valid schema-7 save from before checkpoints can migrate once from its original integrity seal; an unverifiable saturated record takes conservative evaluation recovery rather than manufacturing history.
- The Public Leaderboard Hero balance scenario now demonstrates the intended contradiction explicitly: repeated public previews, one paid at-risk private sample, then a leakage-warning-ignoring submission.
- Ending completion appends causal evidence before freezing commands. The retained event ID is validated, so a postmortem cannot point at evicted/unrelated ledger data.
- Ending thresholds combine observed history, irreversible action, warning escalation, and ignored-warning decisions. `CONCLUDE_INDEPENDENT_RUN` is deliberately explicit rather than an automatic hidden success roll.
- Reset carries only diagnostic IDs, completed-ending IDs, and replay count. `calculateMetrics` and command economics do not inspect meta state for a bonus.
- Browser tests use pinned `@playwright/test`, repository-local Chromium cache, native keyboard controls, and CDP touch dispatch. Existing suites remain the drag, PWA update, root/Pages, malformed-state, and failure-recovery regression gates.

## Known limitations and risks

- Evaluation bands, warning thresholds, private-evaluation price, and endings are deterministic gameplay tuning—not real-world measurement, reliability forecasting, or hardware finance advice.
- Causal postmortems describe modeled evidence and bounded uncertainty; they intentionally cannot identify an exact latent capability or unseen production input.
- A legacy schema-7 save that contains only an old free private category is retained but its evaluation evidence is reset; it must collect paid evidence again. This is safer than treating the category as verified evidence.
- A saturated schema-7 save from before causal checkpoints whose original integrity seal is absent or stale cannot prove its evicted causal history, so restore preserves the non-causal run state but resets evaluation evidence and any unsupported ending. A valid old seal migrates the same history without loss.
- Physical mobile-device thermal/battery behavior, non-Chromium engines, and actual assistive-technology speech output remain unverified infrastructure areas.
- localStorage denial leaves an in-memory session playable but cannot preserve replay state across reload.
- No researchers/characters, attention economy, creators/hype/fear, extra pipelines, startup/labor/laboratory progression, narrative expansion, or transient model catalogues were added.
- Implementer does not push, deploy, merge, or accept the candidate. Fresh exact-SHA independent verification and release remain Orchestrator/Verifier work.

## Checks executed before candidate handoff

- `npm run typecheck` — PASS.
- `npm exec vitest -- run --no-coverage src/simulation/evaluationReplay.test.ts src/simulation/verifierRound031.test.ts src/simulation/verifierRound032.test.ts src/simulation/verifierRound033.test.ts` — PASS, 4 files / 23 tests; includes rollover, valid legacy saturated-history migration, forged hardware-ending recovery, and preserved V-041 regression coverage.
- `npm run test:e2e -- tests/e2e/verifier-round-033.spec.ts` — PASS, 1 test at 320×742 reduced motion; a forged full-history Tutorial Loop pattern resets before it can display a postmortem.
- `npm test` — PASS, 23 files / 117 tests with coverage; includes the complete 121-seed evidence loop and the unchanged round-031 mixed deterministic stream under instrumentation.
- `npm test -- src/simulation/verifierRound031.test.ts` — test body PASS in 1.15s under coverage instrumentation; the isolated command reports expected global coverage-threshold failures because it intentionally runs one file only.
- `./scripts/verify` — PASS (exit 0) from repository-local setup: formatting, lint, typecheck; 23 unit/property files / 117 tests with coverage; numeric prototype; 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation balance sweeps (all zero failures); production build; 104 root Playwright cases; and 2 Pages/offline cases.
- `npm run format:check` — exit 0; immutable verifier reports are excluded while every other applicable tracked path remains checked.
- `./scripts/verify` — exit 0 from repository-local setup: formatting, lint, typecheck; 24 unit/property files / 122 tests with coverage; numeric prototype; 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation balance sweeps (all zero failures); production build; 106 root Playwright cases; and 2 Pages/offline cases.

## Checks not run

- No Git push, deployment, live URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader testing; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes that optional feedback, not a release blocker.
- Sandboxed Chromium launch remains unavailable because macOS denies Mach-port registration; the repository-pinned host Chromium run above supplied the required browser evidence.
