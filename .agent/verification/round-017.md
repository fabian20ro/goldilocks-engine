# Verification round 017

Candidate SHA: `8b092aab5d8a31cb92a728975fd7fcab27702880`

VERDICT: FAIL

## Scope and verdict basis

The applicable candidate is the owner-authorized **Workstation Expansion I**
slice in `plan.md` and D-007, together with the inherited Milestone 0–1 and
D-004 through D-006 behavior on which that slice depends. D-007 permits
independent automated verification without treating the still-unmeasured human
exit gates as an automatic blocker. It does not claim those human gates passed.

The candidate resolves both round-016 findings. Guaranteed-failure offers now
show zero expected gross and negative expected net, and settlement preserves
the complete configured cost while distinguishing the amount actually paid from
the amount left unpaid. Canonical static, implementation-test, balance, build,
root PWA, Pages-subpath PWA, persistence, offline, portrait, accessibility, and
inherited regression checks otherwise pass.

One correctable settlement-feedback defect prevents acceptance. The simulation
tracks money and operating cost to three decimal places, but the settlement and
ledger independently round configured, paid, and unpaid amounts to two decimal
places. At a reachable half-cent boundary, the displayed paid and unpaid parts
sum to twice the displayed configured cost.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`; Playwright CLI was used only
  for supplemental headed inspection.
- Clean-start gate: before any Verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup` recreated the lockfile-defined dependency tree with
  repository-local npm and browser caches; audit reported zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before page
  creation. The exact repository-pinned browser commands were rerun outside
  that restriction and executed normally.
- Verifier-owned additions are this immutable report and two focused regression
  files. No production code, prior report, decision, handoff, playtest record,
  or `plan.md` content was changed by the Verifier.

## Commands executed and results

| Command or probe                                                                                                                                       | Result                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`; `git rev-parse HEAD`                                                                                                             | Clean start; exact supplied candidate matched.                                                                                                                                                                                                                                                                                                    |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, handoff, round-015/016 reports, and prior verdict/finding index | Independent applicable checklist, history, and finding sequence constructed.                                                                                                                                                                                                                                                                      |
| Candidate `git show`, exact parent diff, package scripts, production engine/UI/types/catalog inspection                                                | Confirmed the V-021/V-022 repair boundaries and identified the independent visible-precision boundary below.                                                                                                                                                                                                                                      |
| `./scripts/verify` before Verifier additions                                                                                                           | Setup, format, lint, typecheck, 61/61 implementation and retained verifier unit/property tests, coverage thresholds, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and production build passed. The sandbox then denied all 45 Chromium launches before page creation, so the wrapper exited at the root browser phase. |
| Exact `npm run test:e2e` outside the browser sandbox, before Verifier additions                                                                        | 45/45 root packaged-PWA cases passed, including retained V-018, V-020, and V-021 regressions.                                                                                                                                                                                                                                                     |
| Exact `npm run test:e2e:pages` outside the browser sandbox                                                                                             | 2/2 Pages-subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                                                                                                                                             |
| Canonical balance outputs                                                                                                                              | Upgrade sweep: 20,001 seeds, zero failures, worst first module at 4 successes, first alternate rig at 14, and maximum 23 attempts to 15 successes. Progression sweep: 41 seeds, zero failures, expansion at 13.1444–15.5944 simulated hours and full catalogue at 40.6292–44.4014 hours.                                                          |
| Independent guaranteed-failure offer matrix                                                                                                            | All 8 workloads on the supported no-model graph had zero expected gross and negative expected net. The independent memory-overload boundary also had zero expected gross and negative expected net. V-021 is resolved.                                                                                                                            |
| Independent settlement-accounting matrix                                                                                                               | Zero, partial, exact, and ample cash all preserved the full configured cost, exact cash-paid aggregate, nonnegative money delta, explicit unpaid state, valid state, and exact save/restore. V-022's engine and persistence behavior is resolved.                                                                                                 |
| Natural partial-cash progression probe                                                                                                                 | One ordinary successful starter task produced `$1.335`; ordinary no-model failed work reduced that balance to `$0.005`; the next `$0.010` configured-cost task stored `$0.005` paid and `$0.005` unpaid but displayed `$0.01` paid and `$0.01` unpaid.                                                                                            |
| `npx vitest run src/simulation/verifierRound017.test.ts --coverage.enabled=false`                                                                      | Expected evidence failure: 5 passed, 1 failed. Displayed paid plus unpaid was `0.02`; displayed configured cost was `0.01`.                                                                                                                                                                                                                       |
| `npm test` after Verifier additions                                                                                                                    | Expected evidence failure: 66 passed, 1 failed; only the V-023 regression failed.                                                                                                                                                                                                                                                                 |
| Focused repository-pinned Chromium on `tests/e2e/verifier-round-017.spec.ts` outside the browser sandbox                                               | 1 passed, 1 expected evidence failure. Zero-cash configured/paid/unpaid feedback passed; partial-cash UI displayed `$0.01` configured, `$0.01` paid, and `$0.01` unpaid.                                                                                                                                                                          |
| Full `npm run test:e2e` after Verifier additions, outside the browser sandbox                                                                          | 46 inherited/new cases passed; only the V-023 browser regression failed.                                                                                                                                                                                                                                                                          |
| Headed Playwright CLI against `./scripts/run` at 320 and 393 CSS pixels                                                                                | Fresh starter views inspected through ordinary controls. Tutorial and active game hierarchy, resources, time controls, warning, objective, pipeline, module cards, and fixed bottom navigation remained legible without visible clipping or overlap. Browser console reported zero errors and zero warnings.                                      |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` after Verifier additions                                               | Passed.                                                                                                                                                                                                                                                                                                                                           |
| Bounded browser/server shutdown and `lsof -nP -iTCP:4173 -sTCP:LISTEN`                                                                                 | Browser session and local server closed; no listener remained on port 4173.                                                                                                                                                                                                                                                                       |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                                                                  | Status                                   | Independent evidence                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007 owner authorization, bounded scope, and preservation of human-gate history                                                                                                                                    | PASS                                     | `plan.md`, D-007, and immutable playtest records agree. No excluded later-scope system was introduced.                                                                                           |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                                                                      | PASS for automated predicates            | Canonical unit/property and numeric balance checks pass. Subjective economy-interest remains unmeasured and is not inferred.                                                                     |
| Milestone 1 constrained portrait pipeline, compatible manipulation, queue, comparison, flow, constraints, and failure propagation                                                                                   | PASS for inherited scope                 | Retained engine/browser regressions pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, recovery, and comparison behavior.                                     |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                                                                          | PASS; V-012 remains resolved             | Retained engine, Worker-boundary, and property regressions pass. Ordinary malformed-state evidence stayed high-level.                                                                            |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, and animation/time separation                                                                                                    | FAIL only at V-023 settlement partition  | Retained comprehension cases and guaranteed-failure offer regression pass. V-023 makes the latest-settlement accounting contradictory at a reachable precision boundary.                         |
| D-006 exact-once durable ownership, owned-only equip/add, decision information, observed deltas, pacing, and schema-v4 inheritance                                                                                  | PASS                                     | Unit/Worker/browser regressions and the 20,001-seed sweep pass.                                                                                                                                  |
| Exact-once data-driven Workstation Expansion purchase; one pipeline grows from three to six process positions; new positions begin empty                                                                            | PASS                                     | Command tests, browser purchase/reload/offline flow, source inspection, and headed inspection confirm the behavior.                                                                              |
| Empty/bypassed positions remain valid; all six unlocked positions support owned compatible tap, keyboard, replacement/reorder, and touch drag                                                                       | PASS                                     | Root expansion cases and accessibility snapshots cover all six positions and the internal scroll.                                                                                                |
| Complete ordered-graph metrics and current-processing feedback                                                                                                                                                      | PASS; V-020 remains resolved             | Retained independent/unit/browser regressions keep metrics, warning, and active identity bound to the active workload while future selection changes.                                            |
| At least eight durable workloads; four initial and four deterministic later unlocks with exact visible requirement/progress; persistence/migration without loss                                                     | PASS                                     | Catalog/engine inspection, unlock tests, eight-card Chromium assertions, and schema migration checks pass.                                                                                       |
| Per-task FIFO identity, immutable queue-time gross quote, configuration-dependent actual cost, failed-job zero payout, and visible settlement net                                                                   | FAIL — V-023                             | Stored identity, quote, configured cost, paid cost, and cash delta are correct. Independently rounded visible paid/unpaid parts contradict the visible configured total at half-cent cash.       |
| Current quote and demand visible before queueing; accepted reservation pressure reflected in the next displayed quote                                                                                               | PASS; V-018 remains resolved             | Retained engine/browser regressions show equality between displayed next quote and newly accepted locked quote.                                                                                  |
| Before acceptance, cards expose quote, demand/trend, estimated cost/net or honest uncertainty, saturation/recovery explanation, and near/nonpositive warning                                                        | PASS; V-021 resolved                     | Retained Chromium and the independent all-workload/memory-boundary matrix show guaranteed failures at zero expected gross and negative expected net. Productive offers are reliability-weighted. |
| Completion saturation, neglected-demand recovery, immutable accepted quotes, and no idle-only money                                                                                                                 | PASS                                     | Unit tests, source inspection, and balance probes confirm isolated saturation, deterministic recovery, locked quotes, and unchanged idle money.                                                  |
| Repeated single-workload farming eventually becomes nonpositive for every valid graph; rotation/recovery restores alternatives                                                                                      | PASS; V-019 remains resolved             | Structural demand-floor checks and retained independent graph evidence remain negative for productive graphs; no-model graphs cannot deliver.                                                    |
| Clear-waiting confirmation is exact, transactional, and active-task preserving                                                                                                                                      | PASS                                     | Engine exact-state assertions and root Chromium flow preserve active identity/progress/quote, money, demand, reputation, RNG, and settlement while removing only waiting tasks.                  |
| Fixed deterministic 1×/4×/16×/64× controls remain schedule-equivalent and separate from animation and pause                                                                                                         | PASS                                     | Unit schedule-equivalence and browser controls/reduced-motion cases pass.                                                                                                                        |
| Pacing: first module by 5 successes, alternate rig by 15 including purchase, expansion around 8–16 hours, full catalogue 24–72 hours                                                                                | PASS for tested deterministic strategies | Canonical 20,001-seed and 41-seed outputs meet every numeric bound.                                                                                                                              |
| Bottom tabs are the sole global navigation; compact summaries and progressive disclosure preserve portrait density                                                                                                  | PASS                                     | Source inspection, root browser assertions, and headed snapshots confirm bottom-only routing and progressive disclosure.                                                                         |
| Portrait 320/393, 200% text, 44-pixel controls, no horizontal overflow, one-handed alternatives, no pinch/rotation dependency                                                                                       | PASS in Chromium                         | Retained cases cover both widths, 200% text, targets, overflow, and interaction modes. Fresh headed inspection at both widths found no visible cutoff or overlap.                                |
| Reduced motion, color-independent meanings, screen-reader labels, offline reload/resume, and failure/recovery                                                                                                       | PASS in Chromium                         | Retained accessibility, offline, and recovery cases pass; visible text carries state independently of color.                                                                                     |
| Schema-5/content-v4 state and presets preserve expansion, topology, task identity/quote, unlocks, demand, equipment, money, RNG, metadata, timestamp, and integrity; schema-3/4 and malformed values recover safely | PASS for tested paths                    | Unit/Worker migration, current/legacy browser recovery, expanded preset reload, stale-integrity recovery, offline Worker flows, and round-017 settlement restore pass.                           |
| Deterministic TypeScript engine, typed Worker boundary, fixed update order, bounded unique ledger, reproducible setup/start/check, repository-local caches, deterministic loopback, and cleanup                     | PASS except V-023 regression             | Static/build/Worker checks, canonical scripts, browser suites, local caches, and bounded shutdown are reproducible. The two Verifier regressions intentionally expose V-023.                     |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions as applicable.
- V-018 remains resolved: reservation-aware live quotes equal newly accepted
  locked quotes.
- V-019 remains resolved: no-model graphs cannot deliver and productive demand
  floors remain nonpositive.
- V-020 remains resolved: active-task identity, metrics, warning, and pressure
  remain aligned after future workload selection.
- V-021 is resolved: the shared offer estimator accounts for modeled delivery,
  and deterministic failure produces zero expected gross and negative expected
  net in both offer surfaces.
- V-022 is resolved at the state/accounting level: settlement stores full
  configured cost, caps only cash actually paid, exposes unpaid cost, and
  survives save/restore. V-023 is a distinct presentation-precision defect in
  that explicit partition.
- B-007 was resolved for predecessor publication in round 014. Exact live
  publication of this production-changing candidate was not attempted and is
  not used as evidence here.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice. It does not become a PASS claim.

## Findings

### V-023 — Displayed paid and unpaid costs can exceed configured cost

- Severity: Medium.
- Related requirement: `plan.md` Sections 6 and 9; Milestone 2 requirement for
  configuration-dependent actual cost and visible settlement net; D-005 money
  loop; D-007 task/economy contract.
- Expected behavior: The visible paid and unpaid partition must reconcile to
  the visible configured operating cost. Display precision may vary, but it
  must not report more cost distributed than the task incurred.
- Actual behavior: At a `$0.005` cash balance and `$0.010` configured cost, the
  engine correctly stores `$0.005` paid and `$0.005` unpaid. The ledger and
  latest settlement independently format both halves as `$0.01`, so the player
  sees `$0.01` configured cost, `$0.01` paid, and `$0.01` unpaid.
- Exact reproduction procedure: Complete one starter task, use ordinary
  supported bypass/work controls until the cash balance is `$0.005`, then
  complete one more `$0.010`-cost task and inspect Latest settlement or the
  ledger. The committed engine regression deterministically performs this
  ordinary command sequence; the browser regression starts from the same valid
  state boundary to isolate the visible result.
- Concrete evidence: `src/simulation/verifierRound017.test.ts` observes a
  displayed partition of `0.02` against displayed configured cost `0.01` after
  reaching the boundary through normal commands. Repository-pinned Chromium in
  `tests/e2e/verifier-round-017.spec.ts` renders the contradictory three values
  in Latest settlement.
- Blocks PASS: Yes. The bounded slice explicitly requires visible, honest
  configured cost and settlement net; the player-facing accounting contradicts
  itself at a reachable normal-state boundary.

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
- Reliability-weighted offers are expectations over the deterministic model,
  not promises for individual tasks; individual settlements remain discrete.
- The current paid/unpaid amount is derivable from configured cost, gross, and
  cash delta rather than stored as dedicated settlement fields. The tested
  derivation is exact, but future accounting changes could make that coupling
  fragile.
- Short automated and headed sessions cannot establish sustained enjoyment,
  physical-device performance, or assistive-technology quality.
- localStorage denial leaves the in-memory session operable but cannot provide
  cross-reload durability, as the handoff already discloses.
