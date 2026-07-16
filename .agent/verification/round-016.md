# Verification round 016

Candidate SHA: `a58cc625aefd89d78a5f57ae8f2282a9569eda52`

VERDICT: FAIL

## Scope and verdict basis

The applicable candidate is the owner-authorized **Workstation Expansion I**
slice in `plan.md` and D-007, together with inherited Milestone 0–1 and D-004
through D-006 behavior. D-007 permits independent automated acceptance of this
bounded slice without treating the still-unmeasured human exit gates as an
automatic blocker. It does not claim those human gates passed.

The candidate resolves all three round-015 findings: the displayed next quote
now equals the accepted locked quote, a pipeline without a model has zero
reliability, and live diagnostics remain bound to the active task. Canonical
static, implementation-test, balance, build, root PWA, Pages-subpath PWA,
persistence, offline, portrait, accessibility, and inherited regression checks
otherwise pass.

Two correctable economy-feedback defects prevent acceptance:

- a pipeline which is guaranteed to fail every accepted task still advertises
  a positive estimated net on the workload offer and selected-work money loop;
- if the player cannot fund a configured operating cost, settlement silently
  caps that cost to available funds and reports the reduced value as actual
  cost.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`; the Playwright CLI was used
  only for supplemental headed visual inspection.
- Clean-start gate: before any verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup` recreated the lockfile-defined dependency tree with
  repository-local npm and browser caches; audit reported zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before page
  creation. The exact repository-pinned browser commands were rerun outside
  that restriction and executed normally.
- Verifier-owned additions are this immutable report and two focused regression
  test files. No production code, prior report, decision, handoff, playtest
  record, or `plan.md` content was changed by the Verifier.

## Commands executed and results

| Command or probe                                                                                                                            | Result                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`; `git rev-parse HEAD`                                                                                                  | Clean start; exact supplied candidate matched.                                                                                                                                                                                                                                                                                                                      |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, handoff, all prior reports, and all playtest records | Independent applicable checklist, history, and finding sequence constructed.                                                                                                                                                                                                                                                                                        |
| Candidate `git show`, diff/stat, package scripts, production engine/catalog/UI/Worker inspection                                            | Confirmed the three intended round-015 repairs and independently identified the offer-estimation and settlement-cost boundaries below.                                                                                                                                                                                                                              |
| `./scripts/verify`                                                                                                                          | Setup, format, lint, typecheck, 60/60 implementation unit/property tests, coverage thresholds, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and production build passed. The sandbox then denied Chromium launch before page creation, so the wrapper exited at the root browser stage.                                                  |
| Exact `npm run test:e2e` outside the browser sandbox, before verifier regressions                                                           | 44/44 root packaged-PWA cases passed, including the retained V-018 and V-020 regressions.                                                                                                                                                                                                                                                                           |
| Exact `npm run test:e2e:pages` outside the browser sandbox                                                                                  | 2/2 Pages-subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                                                                                                                                                               |
| Canonical balance outputs                                                                                                                   | Upgrade sweep: 20,001 seeds, zero failures, worst first module at 4 successes and first alternate rig at 14; maximum attempts to 15 successes was 23. Progression sweep: 41 seeds, zero failures, expansion at 13.1444–15.5944 simulated hours and full catalogue at 40.6292–44.4014 hours.                                                                         |
| Independent next-quote reservation matrix                                                                                                   | All 8 workloads at 0, 1, 7, and 48 pre-existing same-workload accepted reservations: 32/32 newly accepted locked quotes exactly equalled the immediately preceding `getWorkloadQuote` value.                                                                                                                                                                        |
| Independent active-diagnostics matrix                                                                                                       | All 8 active workload × 8 future selected workload combinations: 64/64 retained active identity and exact active-workload metrics after future selection.                                                                                                                                                                                                           |
| Independent demand-floor graph matrix                                                                                                       | 120 productive configurations across 3 hardware choices, available model modules, and 8 workloads. Maximum floor expected margin was `-0.019`; the no-model graph had reliability `0` and cost `0.010`.                                                                                                                                                             |
| Headed Playwright CLI against `./scripts/run` at 320 and 393 CSS pixels                                                                     | Starter and activated eight-stage Build states inspected through ordinary controls. The expanded snapshot exposed Process 4–6 and Output through the named internal pipeline scroll. Hierarchy, text, controls, drawer, and fixed bottom navigation remained legible without visible clipping or overlap. No application console error occurred during interaction. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` after verifier additions                                                        | Passed.                                                                                                                                                                                                                                                                                                                                                             |
| `npm test` after verifier additions                                                                                                         | Expected evidence failure: 60 passed, 1 failed. `verifierRound016.test.ts` observed configured cost `0.01` but settlement recorded `0`.                                                                                                                                                                                                                             |
| `npm run test:e2e` after verifier additions, outside the browser sandbox                                                                    | Expected evidence failure: the 44 inherited cases passed and the one new verifier case failed. The guaranteed-failure Interactive Chat offer displayed `Estimated $0.010 cost · +$1.39 net`.                                                                                                                                                                        |
| Bounded shutdown and `lsof -nP -iTCP:4173 -sTCP:LISTEN`                                                                                     | The headed CLI session had exited; the local server was stopped; no listener remained on port 4173.                                                                                                                                                                                                                                                                 |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                                                                  | Status                                       | Independent evidence                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-007 owner authorization, bounded scope, and preservation of human-gate history                                                                                                                                    | PASS                                         | `plan.md`, D-007, and immutable playtest records agree. No excluded later-scope system was introduced.                                                                           |
| M0 numeric prototype and automated balance predicates                                                                                                                                                               | PASS for automated predicates                | Canonical unit/property and numeric balance checks pass. Subjective economy-interest remains unmeasured and is not inferred.                                                     |
| M1 constrained portrait pipeline, compatible manipulation, queue, comparison, flow, constraints, and failure propagation                                                                                            | PASS for inherited scope                     | Retained engine/browser regressions pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, recovery, and comparison behavior.                     |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                                                                          | PASS; V-012 remains resolved                 | Retained engine, Worker-boundary, and property regressions pass. Ordinary malformed-state evidence stayed high-level.                                                            |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, and animation/time separation                                                                                                    | PASS except V-021's money-loop estimate      | Retained comprehension and pressure-boundary cases pass. V-021 is a new contradiction in the selected-work estimate under guaranteed failure.                                    |
| D-006 exact-once durable ownership, owned-only equip/add, decision information, observed deltas, pacing, and schema-v4 inheritance                                                                                  | PASS                                         | Unit/Worker/browser regressions and the 20,001-seed sweep pass.                                                                                                                  |
| Exact-once data-driven Workstation Expansion purchase; one pipeline grows from three to six process positions; new positions begin empty                                                                            | PASS                                         | Command tests, browser purchase/reload/offline flow, source inspection, and headed visual inspection confirm the behavior.                                                       |
| Empty/bypassed positions remain valid; all six unlocked positions support owned compatible tap, keyboard, replacement/reorder, and touch drag                                                                       | PASS for interaction and topology            | Root expansion cases and accessibility snapshots cover all six positions and the internal scroll. V-021 and V-022 concern the economy consequence of a supported no-model graph. |
| Complete ordered-graph metrics and current-processing feedback                                                                                                                                                      | PASS; V-020 resolved                         | The 64-case independent matrix and retained browser regression keep metrics, warning, and active identity bound to the active workload while future selection changes.           |
| At least eight durable workloads; four initial and four deterministic later unlocks with exact visible requirement/progress; persistence/migration without loss                                                     | PASS                                         | Catalog/engine inspection, unlock tests, eight-card Chromium assertions, and schema migration checks pass.                                                                       |
| Per-task FIFO identity, immutable queue-time gross quote, configuration-dependent actual cost, failed-job zero payout, and visible settlement net                                                                   | FAIL — V-022                                 | Identity, quote lock, and failed zero-gross payout pass. Settlement changes the configured cost according to available cash and presents the capped value as actual cost.        |
| Current quote and demand visible before queueing; accepted reservation pressure already reflected in the next displayed quote                                                                                       | PASS; V-018 resolved                         | The 32-case matrix and retained browser regression show exact equality between the displayed sequential offer and newly locked task quote.                                       |
| Before acceptance, cards expose gross quote, demand/trend, estimated cost/net or honest uncertainty, saturation/recovery explanation, and near/nonpositive warning                                                  | FAIL — V-021                                 | A no-model pipeline is explicitly guaranteed to fail and pay `$0` gross, yet both offer surfaces advertise `+$1.39` estimated net.                                               |
| Completion saturation, neglected-demand recovery, immutable accepted quotes, and no idle-only money                                                                                                                 | PASS                                         | Unit tests, source inspection, and focused probes confirm isolated saturation, deterministic recovery, locked quotes, and unchanged idle money.                                  |
| Repeated single-workload farming eventually becomes nonpositive for every valid graph; rotation/recovery restores alternatives                                                                                      | PASS; V-019 resolved                         | All workload quote floors are `$0.02`; the 120-case productive graph matrix had maximum floor expected margin `-0.019`; no-model reliability is zero.                            |
| Clear-waiting confirmation is exact, transactional, and active-task preserving                                                                                                                                      | PASS                                         | Engine exact-state assertions and root Chromium flow preserve active identity/progress/quote, money, demand, reputation, RNG, and settlement while removing only waiting tasks.  |
| Fixed deterministic 1×/4×/16×/64× controls remain schedule-equivalent and separate from animation and pause                                                                                                         | PASS                                         | Unit schedule-equivalence and browser controls/reduced-motion cases pass.                                                                                                        |
| Pacing: first module by 5 successes, alternate rig by 15 including purchase, expansion around 8–16 hours, full catalogue 24–72 hours                                                                                | PASS for tested deterministic strategies     | Canonical 20,001-seed and 41-seed outputs meet every numeric bound.                                                                                                              |
| Bottom tabs are the sole global navigation; compact summaries and progressive disclosure preserve portrait density                                                                                                  | PASS                                         | Source inspection, root browser assertions, and headed snapshots confirm bottom-only routing, details disclosure, and internal pipeline scroll cue.                              |
| Portrait 320/393, 200% text, 44-pixel controls, no horizontal overflow, one-handed alternatives, no pinch/rotation dependency                                                                                       | PASS in Chromium                             | Retained cases cover both widths, text scale, targets, overflow, and interaction modes. Fresh headed inspection found no visible cutoff or overlap.                              |
| Reduced motion, color-independent meanings, screen-reader labels, offline reload/resume, failure/recovery                                                                                                           | PASS in Chromium                             | Retained accessibility, offline, and recovery cases pass; visible text carries state independently of color.                                                                     |
| Schema-5/content-v4 state and presets preserve expansion, topology, task identity/quote, unlocks, demand, equipment, money, RNG, metadata, timestamp, and integrity; schema-3/4 and malformed values recover safely | PASS for tested paths                        | Unit/Worker migration, current/legacy browser recovery, expanded preset reload, stale-integrity recovery, and offline Worker flows pass.                                         |
| Deterministic TypeScript engine, typed Worker boundary, fixed update order, bounded unique ledger, reproducible setup/start/check, repository-local caches, deterministic loopback, cleanup                         | PASS except documented product-test failures | Static/build/Worker checks, canonical scripts, both browser suites, local caches, and bounded shutdown are reproducible. The two verifier regressions fail for V-021 and V-022.  |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions as applicable.
- V-018 is resolved: reservation-aware live quotes equal newly accepted locked
  quotes across the retained browser case and 32-case independent matrix.
- V-019 is resolved: the no-model graph cannot complete normally and the 120
  productive-graph floor matrix is strictly negative.
- V-020 is resolved: active-task identity, metrics, warning, and pressure remain
  aligned across all 64 active/future workload combinations.
- B-007 was resolved for predecessor publication in round 014. Exact live
  publication of this production-changing candidate was not attempted and is
  not used as evidence here.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice. It does not become a PASS claim.

## Findings

### V-021 — Guaranteed-failure offer advertises positive estimated net

- Severity: High.
- Related requirement: `plan.md` Sections 6 and 9; Milestone 2 Workstation
  Expansion I task/economy contract; D-005 money-loop feedback; D-007
  task/economy contract.
- Expected behavior: Before acceptance, estimated net incorporates a known
  guaranteed failure, or the offer gives honest uncertainty and clearly states
  that this configuration cannot earn the quote. A task certain to pay `$0`
  gross must not be advertised as positive-net work.
- Actual behavior: Removing the starter process modules produces an explicit
  warning that accepted tasks fail and pay `$0` gross. Jobs still shows the
  Interactive Chat offer as `Estimated $0.010 cost · +$1.39 net`, and the
  selected-work money loop uses the same positive estimate.
- Exact reproduction procedure: Use the supported Remove / bypass controls on
  Prepare, Runtime, and Verify. Confirm the no-model guaranteed-failure warning,
  open Jobs, and inspect the Interactive Chat card and selected-work live quote.
- Concrete evidence: `tests/e2e/verifier-round-016.spec.ts`; repository-pinned
  Chromium resolves the offer card and fails on its positive-net text. Source
  inspection shows both estimates subtract operating cost from gross quote
  without accounting for deterministic zero payout.
- Blocks PASS: Yes. The offer contradicts known processing behavior at the
  decision point and makes guaranteed loss look profitable.

### V-022 — Unaffordable configured cost is silently reported as zero actual cost

- Severity: High.
- Related requirement: `plan.md` Sections 6 and 9; Milestone 2 requirement for
  configuration-dependent actual cost and visible settlement net; D-007
  task/economy contract.
- Expected behavior: If accepted work incurs a configured operating cost, the
  settlement preserves that consequence. If nonnegative-money policy prevents
  collection, acceptance must be blocked or the unpaid/capped amount must be
  represented explicitly rather than relabelled as actual cost.
- Actual behavior: Settlement computes the configured cost, then caps the
  recorded `operatingCost` to `moneyBeforeSettlement + grossPayout`. With zero
  cash and a guaranteed failed no-model task, the configuration advertises and
  calculates `$0.010` cost, but `lastSettlement.operatingCost` is `0` and the UI
  reports `$0.00 actual costs`.
- Exact reproduction procedure: At a fresh zero-money state, remove/bypass the
  three starter process modules, record the calculated operating cost, accept
  one task, advance until its guaranteed failure settles, and inspect the
  settlement cost and net.
- Concrete evidence: `src/simulation/verifierRound016.test.ts` fails with
  expected configured cost `0.01`, received settlement cost `0`. Production
  source inspection confirms the availability cap before settlement storage.
- Blocks PASS: Yes. Actual cost is no longer configuration-dependent alone and
  the visible settlement silently erases a known economic consequence.

## Unverified areas

- The original Milestone 0 economy-interest and Milestone 1 uninterrupted
  voluntary 30-minute reconfiguration/tradeoff-explanation gates. D-007 permits
  this bounded slice to proceed without claiming them.
- Exact-candidate GitHub Pages publication and direct-live package equality;
  the candidate was not pushed or deployed for this round.
- Physical-device battery, CPU, thermal, platform touch, and actual
  screen-reader output; browser checking used Chromium desktop emulation.
- Browsers other than Chromium.
- Deferred Milestone 2 systems and Milestones 3–7/expansions excluded by D-007.

## Residual risks

- The 41-seed progression model verifies one encoded competent strategy; it
  does not exhaustively prove strategy non-dominance.
- Offer estimates currently treat gross quote as certain even though task
  reliability can be below one. V-021 proves the deterministic endpoint is
  wrong; stochastic expected-value communication beyond that endpoint remains
  a product-design risk.
- Any V-022 repair must preserve the valid nonnegative-state invariant while
  making task affordability or unpaid cost explicit and deterministic.
- Short automated and headed sessions cannot establish sustained enjoyment,
  physical-device performance, or assistive-technology quality.
- localStorage denial leaves the in-memory session operable but cannot provide
  cross-reload durability, as the handoff already discloses.
