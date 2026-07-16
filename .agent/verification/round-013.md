# Verification round 013

Candidate SHA: `4aee5a8ca6f4b381f26c208c146f06e9258a3af0`

VERDICT: BLOCKED

## Scope and outcome basis

`plan.md` remains gate ordered. D-001 limits production scope to Milestones 0
and 1 until their human exit gates pass. D-006 adds only the bounded purchase,
ownership, inventory, equip/add, comparison, pacing, and schema-v4 persistence
redesign needed for a new Pipeline Toy playtest. Milestone 2's remaining
systems and all later content remain deferred.

The candidate resolves both correctable round-012 findings. Saved
configurations retain and load their own rig after the live rig changes
(V-016). Current saves carry migration metadata and a complete-snapshot digest;
render-bound malformed content falls back safely, and a stale digest is
annotated, resealed, and remains operable (V-017).

No correctable product defect was confirmed. Static, unit/property, balance,
build, root PWA, Pages-subpath PWA, offline, accessibility, persistence, and
independent recovery checks pass. Acceptance still cannot finish because the
required human milestone evidence is absent (B-005), and the exact candidate
has not been pushed, built by the Pages workflow, or deployed for live-package
verification (B-007).

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-16 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: `git rev-parse HEAD` returned the supplied candidate, and
  `git status --short` was empty before verifier changes.
- `./scripts/setup` recreated locked dependencies with `npm ci`; audit reported
  zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before test
  runtime. Exact scoped browser commands were rerun outside only that host
  restriction and passed.
- Verifier-owned artifact: `tests/e2e/verifier-round-013.spec.ts`. No production
  implementation, handoff, decision, playtest, or prior report was changed.

## Commands executed and results

| Command or probe                                                                                                                                      | Result                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short`                                                                                                            | Clean start; exact supplied candidate matched.                                                                                                                                                                                |
| Complete reads of `AGENTS.md`, all 1,807 lines of `plan.md`, verifier role, decisions, prior unresolved findings, handoff hints, and playtest records | Independent applicable requirement checklist constructed.                                                                                                                                                                     |
| `./scripts/verify`                                                                                                                                    | Setup, format, lint, typecheck, 44/44 unit/property/workflow tests, both balance models, and root build passed. Managed-host Chromium launch then failed before every browser test because Mach-port registration was denied. |
| Exact scoped `npm run test:e2e` outside the browser sandbox before verifier changes                                                                   | 36/36 root packaged-PWA cases passed, including retained 320/393 px, 200% text, touch/pointer, reduced-motion, persistence, offline, and prior-finding regressions.                                                           |
| Exact scoped `npm run test:e2e:pages` outside the browser sandbox                                                                                     | 2/2 Pages-subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                         |
| `npm run test:e2e -- --grep "verifier round 013"` outside the browser sandbox                                                                         | Initial verifier test code had one ambiguous locator; after correcting only that verifier-owned selector, 2/2 product probes passed.                                                                                          |
| Final exact scoped `npm run test:e2e` outside the browser sandbox                                                                                     | 38/38 passed, including both new verifier-owned probes.                                                                                                                                                                       |
| Independent `validateUpgradeEconomy(seed)` sweep from -50,000 through 50,000                                                                          | 100,001/100,001 valid; zero pacing or exact-once failures; worst first module at 4 successful jobs, first alternate rig at 14, and 23 attempts to 15 successes.                                                               |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C                                                                                             | Deterministic `127.0.0.1:4173` startup; both resources returned HTTP 200; bounded stop.                                                                                                                                       |
| `git ls-remote --heads origin agent/implementation main`; `gh run list`; `gh api .../pages`                                                           | Origin implementation head and latest successful Pages workflow remain `f08996b`; candidate `4aee5a8` is absent remotely. Pages URL remains configured from `main`.                                                           |
| Focused Prettier, ESLint, TypeScript, `git diff --check`, and process cleanup checks                                                                  | Passed; no repository Vite, Playwright, Chromium, or port-4173 process remained.                                                                                                                                              |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                     | Status                                  | Independent evidence                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering and D-006-only exception before the Pipeline Toy exit gate                                                                               | PASS                                    | Tree/source inspection found the bounded purchasing redesign but no personal schedule, research characters, hype/fear, longer pipelines, workforce, startup, or laboratory systems.                               |
| M0 numeric prototype: time/money, three hardware choices, four workloads, aggregate competition/product/creator/research inputs, three outcomes        | PASS                                    | Source inspection, 44-case unit/property/workflow suite, and `npm run balance`.                                                                                                                                   |
| M0 path viability, non-dominance, and upgrade constraints                                                                                              | PASS for automation; human gate open    | Canonical numeric balance passes. Catalog inspection preserves capital, workload, power/thermal, memory, latency, reliability, observability, and operating-cost tradeoffs. Automation cannot establish interest. |
| M1 constrained portrait pipeline; compatible replacement/reordering; defined branch; compute/memory allocation; pause; queue; configurations           | PASS                                    | Root browser flows, retained verifier regressions, V-016 regression, and new actual saved-rig load probe.                                                                                                         |
| M1 animated flow; queue at actual bottleneck; memory/thermal/latency/throughput constraints; failure propagation; configuration comparison             | PASS                                    | Engine/property checks and packaged-browser regressions, including failure/recovery and queue-location evidence.                                                                                                  |
| Four workloads create distinct latency, throughput, memory, quality/reliability, money, and reputation pressures                                       | PASS                                    | Catalog/engine inspection, settlement tests, and workload browser flows.                                                                                                                                          |
| Predicted versus observed signals, uncertainty, observability, bottlenecks, and decision-relevant default properties                                   | PASS                                    | Engine metric checks, Inspector flows, qualified pressure guidance, and visible comparison/delta behavior.                                                                                                        |
| D-004 malformed/non-finite operation numerics are exact no-ops; finite inputs remain bounded                                                           | PASS; V-012 remains resolved            | Retained engine and Worker boundary/property tests pass.                                                                                                                                                          |
| D-005 tutorial, money loop, preset deletion/undo, CU/memory definitions, valid pressure guidance, animation/time separation                            | PASS                                    | Retained first-session and boundary suites pass in the final 38-case run.                                                                                                                                         |
| D-006 settlements fund durable exact-once module/rig ownership; owned-only equip/add; safe insufficient/exact/repeated/unknown/incompatible operations | PASS for tested command behavior        | Unit/Worker tests, root purchase flows, and independent 100,001-seed sweep.                                                                                                                                       |
| D-006 comparison information and tradeoffs before purchase; visible observed deltas after equip/add                                                    | PASS                                    | Rig/module cards and source expose applicable price, CU, memory, power/thermal, reliability, throughput/latency, quality, maintenance/cost, observability, compatibility, and post-change deltas.                 |
| D-006 pacing: meaningful module by 5 successes and first alternate rig by 15 including the module purchase                                             | PASS                                    | Independent 100,001-seed sweep: worst 4 and 14 successful jobs.                                                                                                                                                   |
| D-006 320/393 px and 200% text journey; text/keyboard/screen-reader/touch states; no horizontal document overflow                                      | PASS in Chromium                        | Final root suite covers both widths, 200% text, 44 px controls, touch/drag/pan, accessible names/states, and overflow.                                                                                            |
| D-006 schema-v4 migration and persistence of money, ownership, rig, modules, and run state across reload/offline; malformed/stale recovery             | PASS; V-017 resolved                    | Unit/Worker migration tests, root offline cases, unchanged malformed-event regression, and new stale-digest recovery/continued-operation probe.                                                                   |
| Versioned save carries schema/content/migration/time/integrity data from the first persisted prototype                                                 | PASS; V-017 resolved                    | Source and persisted-state probes confirm metadata plus a deterministic full-snapshot digest; valid restores remain deterministic.                                                                                |
| Saved configurations identify and restore their own hardware independent of later live equipment                                                       | PASS; V-016 resolved                    | Unchanged round-012 label regression and new round-013 end-to-end load probe both pass.                                                                                                                           |
| Main screen: one objective, one dominant bottleneck, five resources, one warning, one pipeline                                                         | PASS                                    | Source/DOM inspection and portrait browser cases.                                                                                                                                                                 |
| Portrait, one-handed, 44 px targets, color-independent state, reduced motion, scalable text, actionable screen-reader labels                           | PASS in Chromium                        | Retained 320/393, 150/200% text, target-size, motion, touch, status-text, and label checks.                                                                                                                       |
| TypeScript PWA; typed commands; deterministic headless engine; Worker separation; bounded unique event ledger                                          | PASS                                    | Static/build checks, deterministic/property tests, Worker tests, and root/Pages online/offline cases.                                                                                                             |
| Reproducible setup/startup/checking; repository-local caches; deterministic loopback; cleanup                                                          | PASS with documented host-browser retry | Locked setup, complete non-browser canonical stages, exact scoped browser suites, direct startup probes, and empty process audit.                                                                                 |
| Exact-candidate GitHub Pages publication and live-package verification                                                                                 | BLOCKED                                 | Origin, recent Actions runs, and Pages state still identify predecessor `f08996b`; candidate `4aee5a8` has no remote workflow or deployment.                                                                      |
| M0 economy-interest and M1 uninterrupted voluntary 30-minute reconfiguration/tradeoff-explanation exit gates                                           | BLOCKED                                 | Both immutable playtest records explicitly omit the required duration/device/reconfiguration/prompting/tradeoff/conclusion evidence.                                                                              |

## Prior finding regression results

- V-001 through V-015 remain resolved in current static, unit/property,
  browser, workflow, or local Pages evidence as applicable.
- V-016 is resolved: the preset card uses its stored rig, and loading that preset
  after live divergence actually re-equips the stored rig.
- V-017 is resolved: current state has migration/integrity metadata, malformed
  render-bound content falls back without an Inspect crash, and stale integrity
  data is resealed into a valid operable state.
- B-005 remains open.
- B-007 remains open for this exact candidate; predecessor deployment evidence
  cannot establish candidate behavior.

## Findings

No correctable implementation defect was confirmed.

## External blocking conditions

### B-005 — Required human milestone-gate evidence remains absent

- Severity: Acceptance blocker.
- Related requirement: Milestone 0 economy-interest exit gate; Milestone 1
  voluntary 30-minute reconfiguration/tradeoff-explanation exit gate; D-001 and
  D-006 reversal conditions.
- Expected behavior/evidence: A dated record tied to the deployed purchase
  candidate and tested device, assessing whether the economy is interesting and
  documenting an uninterrupted voluntary 30-minute session, reconfiguration
  timestamps/count, prompting status, at least two participant-explained
  tradeoffs, and a proceed/redesign conclusion.
- Actual behavior/evidence: The newest purchase-loop record concerns predecessor
  `f08996b`, explicitly states a session under 30 minutes, and lists the required
  gate facts as absent.
- Exact reproduction procedure: Inspect `.agent/playtests/`, D-001, D-006, and
  repository history for a later candidate-tied gate record.
- Concrete evidence: Both dated playtest records say the human gates remain open;
  no later record exists in the candidate tree.
- Blocks PASS: Yes. Automation and short verifier sessions cannot prove sustained
  enjoyment or participant comprehension.

### B-007 — Exact product candidate is not remotely deployed

- Severity: Publication evidence blocker.
- Related requirement: Retained GitHub Pages publication path and exact-candidate
  live verification scope.
- Expected behavior/evidence: The exact candidate on the configured deployment
  branch, a successful Pages workflow at that SHA, and live-package validation.
- Actual behavior/evidence: Origin `agent/implementation` and the latest
  successful Pages workflow remain at predecessor `f08996b`; candidate
  `4aee5a8` is local only.
- Exact reproduction procedure: Query remote branch heads, recent Pages workflow
  runs, and repository Pages configuration; compare their SHA with the candidate.
- Concrete evidence: `git ls-remote`, `gh run list`, and `gh api` show no remote
  run or deployment for `4aee5a8ca6f4b381f26c208c146f06e9258a3af0`.
- Blocks PASS: Yes for exact-SHA live evidence. Remote mutation is outside the
  Verifier role.

## Exact work required for a future acceptance round

1. Through an authorized non-Verifier role, push and deploy the exact accepted
   product candidate, then supply its successful workflow/live package for fresh
   verification.
2. Record the deployed candidate's human gate session with the B-005 evidence
   fields.
3. Start a fresh Verifier against the exact post-evidence candidate SHA.

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
