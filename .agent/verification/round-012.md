# Verification round 012

Candidate SHA: `592838f825327f2c06c8233e13955e8844603b9c`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` is gate ordered. D-001 keeps production scope at Milestones 0 and 1,
their applicable deterministic simulation, portrait PWA, accessibility,
testability, and publication requirements. D-006 explicitly adds only the
bounded rig/module purchase, ownership, inventory, equip/add, comparison,
pacing, and schema-v4 persistence redesign. The rest of Milestone 2 and all
later content remain deferred.

The candidate passes its canonical non-browser checks, both balance models, all
34 pre-existing root browser cases, and both Pages-subpath browser cases. An
independent 100,001-seed purchase sweep also meets the D-006 pacing bounds.

Two correctable defects prevent acceptance. A saved configuration displays the
currently equipped rig rather than its own saved rig after the live rig changes
(V-016). Current-schema save validation also accepts malformed event content
that crashes the Inspect view; the stored state has no separate integrity field
(V-017). The required human milestone evidence and exact-candidate deployment
are independently absent, but correctable product defects determine this round.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-16 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: `git rev-parse HEAD` returned the supplied candidate and
  `git status --short` was empty before verifier changes.
- `./scripts/setup` recreated locked dependencies with `npm ci`; audit reported
  zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration. Exact
  scoped browser reruns outside that host restriction executed normally.
- Verifier-owned artifact: `tests/e2e/verifier-round-012.spec.ts`. No production
  implementation, decision, handoff, playtest, or prior report was changed.

## Commands executed and results

| Command or probe                                                                                                                  | Result                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short --branch`                                                                               | Clean start; exact supplied candidate matched.                                                                                                                                                                                        |
| Complete reads of `AGENTS.md`, all 1,807 lines of `plan.md`, verifier role, decisions, prior report history, and playtest records | Applicable checklist constructed independently.                                                                                                                                                                                       |
| `./scripts/verify`                                                                                                                | Setup, format, lint, typecheck, 42/42 unit/property/workflow tests, both balance models, and root build passed. The wrapper then exited at browser launch because the managed host denied every Chromium process before test runtime. |
| Exact scoped `npm run test:e2e` outside the browser sandbox, before verifier tests                                                | 34/34 root packaged-PWA cases passed, including 320/393 px, 200% text, touch/pointer, reduced motion, persistence, offline, and all retained regressions.                                                                             |
| Exact scoped `npm run test:e2e:pages` outside the browser sandbox                                                                 | 2/2 Pages subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                                 |
| `npm run test:e2e -- --grep "verifier round 012 persistence boundaries"` outside the browser sandbox                              | 0/2 passed. Saved preset expected `Used 12 GB GPU` but displayed `Bedroom CPU`; malformed current save caused a React render error when Inspect opened.                                                                               |
| Independent `validateUpgradeEconomy(seed)` sweep from -50,000 through 50,000                                                      | 100,001/100,001 valid; zero pacing/exact-once failures; worst first module at 4 successful jobs, first alternate rig at 14, and 23 attempts to 15 successes.                                                                          |
| Source/catalog tradeoff inspection                                                                                                | All six paid modules and both alternate rigs add at least one workload/capital/power/heat/memory/latency/reliability/observability/operating-cost constraint; no universal upgrade was identified.                                    |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C                                                                         | Deterministic `127.0.0.1:4173` startup; both requests returned HTTP 200; bounded stop.                                                                                                                                                |
| `git ls-remote --heads origin agent/implementation main`; read-only Actions/Pages/live checks                                     | Remote implementation head and latest successful deployment are `f08996b`, not the candidate; live site is HTTP 200 for that predecessor.                                                                                             |
| `lsof` and filtered process-table audit                                                                                           | No listener on port 4173 and no repository Vite, Playwright, or repository-local Chromium process remained.                                                                                                                           |
| Focused Prettier, ESLint, TypeScript, and `git diff --check` for verifier artifact                                                | Passed.                                                                                                                                                                                                                               |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                 | Status                                     | Independent evidence                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering and D-006-only exception before the Pipeline Toy exit gate                                                                                           | PASS                                       | Tree and source inspection found the bounded purchase redesign but no personal schedule, research characters, hype/fear, longer pipelines, workforce, startup, or laboratory systems.                                      |
| M0 numeric prototype: time/money, three hardware choices, four workloads, aggregate competition/product/creator/research inputs, three outcomes                    | PASS                                       | Source inspection, canonical unit/property suite, and `npm run balance`.                                                                                                                                                   |
| M0 path viability, non-dominance, and upgrade constraints                                                                                                          | PASS for automation; human gate open       | Canonical numeric balance passes; catalog inspection confirms resource constraints. Automation cannot establish whether the economy is interesting.                                                                        |
| M1 constrained portrait pipeline, compatible replacement/reordering, branch, allocation, pause, queue, and presets                                                 | PARTIAL / FAIL                             | Core interactions and preset load pass retained tests, but V-016 makes saved hardware identity misleading after the live rig changes.                                                                                      |
| M1 animated flow, correct queue location, memory/thermal/latency/throughput constraints, failure propagation, and comparison                                       | PASS                                       | Unit/property checks and root browser regressions pass, including prior pressure boundaries and failure/recovery.                                                                                                          |
| Four workloads exert distinct latency, throughput, memory, quality/reliability, money, and reputation pressure                                                     | PASS                                       | Catalog/engine inspection, settlement tests, and browser workload flows.                                                                                                                                                   |
| Predicted versus observed signals, uncertainty, observability, bottlenecks, and decision-relevant default properties                                               | PASS                                       | Engine metric checks, Inspector behavior on valid state, queue-location regression, and qualified pressure guidance.                                                                                                       |
| D-004 malformed/non-finite numeric commands are exact no-ops and finite inputs stay bounded                                                                        | PASS; V-012 remains resolved               | Retained engine/worker regressions and canonical property tests pass.                                                                                                                                                      |
| D-005 tutorial, money loop, preset deletion/undo, CU/memory definitions, pressure guidance, animation/time separation                                              | PASS except V-016's saved-rig presentation | All retained first-session and verifier boundary cases pass; V-016 is isolated to configuration hardware labeling.                                                                                                         |
| D-006 successful settlements fund durable, exact-once module/rig ownership; owned-only equip/add; safe insufficient/exact/repeated/unknown/incompatible operations | PASS for tested command behavior           | Engine/worker tests, 34-case browser suite, and 100,001-seed independent sweep. Money remains nonnegative and purchases do not silently equip.                                                                             |
| D-006 decision information and tradeoffs before purchase; visible observed deltas after equip/add                                                                  | PASS                                       | Rig/module cards expose price and applicable CU, memory, power/thermal, reliability, throughput/latency, quality, maintenance/operating cost, observability, compatibility, comparisons, and post-change deltas.           |
| D-006 pacing: module by 5 successes and first alternate rig by 15 including module purchase                                                                        | PASS                                       | Independent 100,001-seed sweep: worst 4 and 14 successful jobs.                                                                                                                                                            |
| D-006 320/393 px and 200% text journey; text/keyboard/screen-reader/touch states; no horizontal document overflow                                                  | PASS in Chromium                           | Existing 34-case suite covers new Upgrades at both widths/text scale plus retained touch, target-size, drawer-pan, labeling, and overflow checks. Focused verifier flow also exercised purchase/equip/navigation controls. |
| D-006 schema-v4 migration and persistence of money, ownership, rig, modules, and run state across reload/offline; malformed/stale recovery                         | FAIL                                       | Valid ownership/equipment migration and offline flows pass; V-017 shows incomplete current-schema validation and an Inspect crash.                                                                                         |
| Versioned save contains schema/content/migration/time/integrity information from the first persisted prototype                                                     | FAIL                                       | Schema/content/tick data exist and v3 migration works; V-017 confirms no stored integrity field and incomplete validation of user-visible event data.                                                                      |
| Main screen: one objective, one dominant bottleneck, five resources, one warning, one pipeline                                                                     | PASS                                       | Source/DOM inspection and portrait cases.                                                                                                                                                                                  |
| Portrait, one-handed, 44 px targets, color-independent status, reduced motion, scalable text, actionable screen-reader labels                                      | PASS in Chromium                           | Retained 320/393, 150/200% text, target-size, motion, touch, and label checks pass.                                                                                                                                        |
| TypeScript PWA; typed commands; deterministic headless engine; Worker separation; bounded unique ledger                                                            | PASS on valid state                        | Static/build checks, deterministic/property tests, Worker flows, and root/Pages online/offline cases. V-017 concerns rejected-state validation, not valid-state determinism.                                               |
| Reproducible setup/startup/checking, repository-local caches, deterministic loopback, cleanup                                                                      | PASS with documented host-browser retry    | Locked setup, static/unit/build stages, exact scoped browser runs, direct startup probes, and empty project-process audit.                                                                                                 |
| Exact-candidate GitHub Pages publication                                                                                                                           | BLOCKED                                    | Origin, latest successful Actions run, and live package remain at `f08996b`; candidate `592838f` is local only.                                                                                                            |
| M0 economy-interest and M1 uninterrupted voluntary 30-minute reconfiguration/tradeoff-explanation gates                                                            | BLOCKED                                    | Both dated records explicitly omit the required duration/device/reconfiguration/prompting/tradeoff/conclusion evidence; the purchase-loop record promises a later post-deployment session.                                 |

## Prior finding regression results

- V-001 through V-015 remain resolved in current static, unit/property,
  browser, workflow, or local Pages evidence as applicable.
- The prior B-007 evidence applied to predecessor `667a1c0`; the current product
  candidate is not remotely published, so exact-candidate publication is open
  again.
- B-005 remains open.

## Findings

### V-016 — Saved configuration shows the live rig instead of its saved rig

- Severity: Medium.
- Related requirement: Plan sections 8.1 and 20.2 configuration/preset
  legibility; D-005 validated local presets; D-006 persistent equipped-rig
  state and discoverable ownership/equipment state.
- Expected behavior: A saved configuration continues to identify the rig stored
  in that preset, independent of later live equipment changes.
- Actual behavior: A preset saved with `Used 12 GB GPU` initially shows that rig,
  but its label changes to `Bedroom CPU` after the live rig is switched back.
  Loading the preset still targets its stored rig, so the visible description
  disagrees with the action.
- Exact reproduction procedure: Start with $14; buy and equip Used 12 GB GPU;
  save the current configuration; equip Bedroom CPU; return to Inspect and read
  the same preset card.
- Concrete evidence: `tests/e2e/verifier-round-012.spec.ts` expected the preset
  to retain `Used 12 GB GPU` but received `Preset 1 Bedroom CPU · Quantized
Model LOAD`. Source inspection shows the card reads the live
  `state.hardwareId` rather than `preset.hardwareId`.
- Blocks PASS: Yes. The game misrepresents a player-authored configuration at
  the point where a rig choice must be compared and restored.

### V-017 — Malformed current save can crash the Inspect view

- Severity: High.
- Related requirement: Plan section 24.6 save integrity and migration from the
  first persisted prototype; D-006 malformed/stale schema-v4 recovery without
  corruption.
- Expected behavior: Current-schema restoration validates all persisted fields
  that reach rendering, or rejects the save and recovers to a safe state. The
  stored save includes an integrity mechanism appropriate to the versioned
  format.
- Actual behavior: The schema-v4 state has no separate integrity field, and its
  validator checks event ticks/IDs but not the event text fields. Malformed event
  content is accepted on reload; Build appears, but opening Inspect triggers a
  React render error and removes the view.
- Exact reproduction procedure: Save a normal schema-v4 run; replace one event
  message with a non-text JSON value; reload; open Inspect.
- Concrete evidence: `tests/e2e/verifier-round-012.spec.ts` records a React
  render error and cannot find `Recent event log`. `SimulationState` has no
  integrity member, and `isStateValid` does not validate persisted ledger text.
- Blocks PASS: Yes. A required recovery path instead produces a user-visible
  crash.

## External blocking conditions

### B-005 — Required human milestone-gate evidence remains absent

- Severity: Acceptance blocker.
- Related requirement: Milestone 0 economy-interest exit gate; Milestone 1
  voluntary 30-minute reconfiguration/tradeoff-explanation exit gate; D-001 and
  D-006 reversal conditions.
- Expected evidence: A dated record tied to the deployed purchase candidate and
  device(s), assessing economy interest and documenting an uninterrupted
  voluntary 30-minute session, reconfiguration timestamps/count, prompting
  status, at least two participant-explained tradeoffs, and a proceed/redesign
  conclusion.
- Actual evidence: The purchase-loop record concerns predecessor `f08996b`, says
  the session was under 30 minutes, and explicitly lists every required gate
  fact as absent.
- Exact reproduction procedure: Inspect `.agent/playtests/`, D-001, D-006, and
  Git history for later dated records.
- Concrete evidence: `.agent/playtests/2026-07-16-purchase-loop.md` says both
  human gates remain open pending a post-deployment session.
- Blocks PASS: Yes. Automated checks cannot establish sustained enjoyment or
  participant comprehension.

### B-007 — Exact product candidate is not remotely deployed

- Severity: Publication evidence blocker.
- Related requirement: Retained GitHub Pages publication path and
  exact-candidate live verification scope.
- Expected evidence: The intended product candidate on an allowed deployment
  branch, a successful workflow run at that exact SHA, and live-package
  validation.
- Actual evidence: Origin `agent/implementation`, latest successful Pages run
  `29488553777`, and the live site name `f08996b`; candidate `592838f` has no
  remote run or deployment.
- Exact reproduction procedure: Query the two remote heads, list recent Pages
  workflow runs, query Pages configuration, and request the live URL.
- Concrete evidence: `git ls-remote` and `gh run list` both identify `f08996b`
  as the newest deployment head; the candidate is absent.
- Blocks PASS: Yes for exact-SHA live evidence. Remote mutation is outside the
  Verifier role.

## Exact work required for a future acceptance round

1. Correct V-016 and V-017 while preserving the verifier regressions; provide a
   new committed candidate SHA.
2. Through an authorized non-Verifier role, publish that exact corrected SHA and
   provide its successful live deployment for fresh verification.
3. Record the deployed corrected candidate's human gate session with the B-005
   evidence fields.

## Unverified areas

- The two required human milestone exit gates.
- Exact-candidate live CDN/service-worker upgrade behavior.
- Physical-device battery, CPU, thermal, platform touch, and actual
  screen-reader output; mobile checking used Chromium emulation.
- Browsers other than Chromium.
- Milestones 2–7 and expansions, excluded by gate ordering.

## Residual risks

- Automated viability and a 100,001-seed sweep cannot establish enjoyment or
  exclude a strategy discovered only through sustained human play.
- Queued work remains aggregate; changing workload before resolution changes
  processing and payout basis. Existing copy does not define retention
  semantics, so a future multi-workload queue needs an explicit product rule.
- Short browser/headless sessions do not replace physical-device performance or
  accessibility profiling.
