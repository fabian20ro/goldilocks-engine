# Verification round 014

Candidate SHA: `a3c1c32ef2fbfc5932f773ebf249d6cae9bf8cc3`

VERDICT: BLOCKED

## Scope and outcome basis

`plan.md` remains gate ordered. D-001 limits current production scope to
Milestones 0 and 1 until their human exit gates pass. D-006 adds only the
bounded purchase, ownership, inventory, equip/add, comparison, pacing, and
schema-v4 persistence redesign required before repeating the Pipeline Toy
playtest. The rest of Milestone 2 and all later content remain deferred.

No correctable candidate defect was confirmed. Canonical static,
unit/property, balance, build, root PWA, Pages-subpath PWA, accessibility,
persistence, offline, and independent recovery checks pass. The exact candidate
is now the remote implementation-branch head, the successful Pages workflow and
deployment SHA, and the source of the byte-identical live package. A fresh
direct-live probe completes the actual earn, purchase, add, observed-delta,
reload, and offline Worker flow without browser or HTTP errors. Prior
publication blocker B-007 is resolved.

Acceptance still cannot finish because the required external human Milestone 0
economy-interest evidence and Milestone 1 uninterrupted voluntary 30-minute
reconfiguration/tradeoff-comprehension evidence remain absent. B-005 therefore
determines BLOCKED.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-16 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any verifier change, `git rev-parse HEAD` returned
  the supplied candidate and `git status --short` was empty.
- `./scripts/setup` recreated locked dependencies through `npm ci`; audit
  reported zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before test
  runtime. Exact narrowly scoped browser reruns outside that host restriction
  executed normally and passed.
- Verifier-owned additions are this report and the focused direct-live
  Playwright config/spec. No production implementation, prior report, decision,
  handoff, or playtest record changed.

## Commands executed and results

| Command or probe                                                                                                                                          | Result                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git rev-parse HEAD`; `git status --short --branch`                                                                                                       | Clean start; exact supplied candidate matched.                                                                                                                                                                                                         |
| Complete reads of `AGENTS.md`, all 1,807 lines of `plan.md`, verifier role, decisions, prior unresolved history, handoff hints, and both playtest records | Independent applicable checklist constructed.                                                                                                                                                                                                          |
| `git show`, `git log`, and candidate-history inspection                                                                                                   | Candidate adds only the immutable round-013 report and verifier-owned tests over the accepted production commit; production behavior is unchanged.                                                                                                     |
| `./scripts/verify`                                                                                                                                        | Setup, format, lint, typecheck, 44/44 unit/property/workflow tests with coverage thresholds, both balance models, and root build passed. Managed-host Chromium launch then failed before every browser test because Mach-port registration was denied. |
| Exact scoped `npm run test:e2e` outside the browser sandbox                                                                                               | 38/38 root packaged-PWA cases passed, including 320/393 px, 200% text, pointer/touch, reduced motion, persistence, malformed recovery, offline, purchase, and retained findings.                                                                       |
| Exact scoped `npm run test:e2e:pages` outside the browser sandbox                                                                                         | 2/2 Pages-subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                                                  |
| `playwright test --config=.agent/verification/round-014-live.config.ts` outside the browser sandbox                                                       | 1/1 direct live-site case passed at 393 px: scoped v6 service worker/cache/assets, real earn-to-purchase/add/delta flow, reload persistence, offline reload, offline Worker queueing, and zero page/console/request/HTTP errors.                       |
| Independent `validatePrototype(seed)` sweep from -10,000 through 10,000                                                                                   | 20,001/20,001 passed viability, declared non-dominance, and upgrade-constraint predicates.                                                                                                                                                             |
| Independent `validateUpgradeEconomy(seed)` sweep from -50,000 through 50,000                                                                              | 100,001/100,001 valid; zero pacing/exact-once failures; worst first module at 4 successful jobs, first alternate rig at 14, and 23 attempts to 15 successes.                                                                                           |
| `git ls-remote`; read-only Actions, Pages, deployment, and deployment-status APIs                                                                         | Remote `agent/implementation`, successful run `29515529021`, successful build/deploy jobs, deployment `5476795737`, and successful deployment status all name exact candidate `a3c1c32`.                                                               |
| Fresh `npm run build:pages`; SHA-256 comparison of local and live HTML, service worker, manifest, asset manifest, icon, CSS, main JS, and Worker JS       | All eight live files are byte-identical to the exact-candidate local Pages build. Live root returned HTTP 200.                                                                                                                                         |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C                                                                                                 | Deterministic `127.0.0.1:4173` startup; both resources returned HTTP 200; bounded stop.                                                                                                                                                                |
| Focused Prettier, ESLint, TypeScript, `git diff --check`, listener audit, and process audit                                                               | Verifier artifacts passed; no port-4173 listener or repository Vite, Playwright, or Chromium process remained.                                                                                                                                         |
| `.agent/playtests/`, D-001, D-005, D-006, and history inspection                                                                                          | Blocker evidence: both records explicitly disclaim the required human gate facts; no later qualifying record exists.                                                                                                                                   |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                  | Status                                  | Independent evidence                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering and D-006-only exception before the Pipeline Toy exit gate                                                                            | PASS                                    | Tree/source inspection found the bounded purchasing redesign but no personal schedule, research characters, hype/fear, longer pipelines, workforce, startup, or laboratory systems.                               |
| M0 numeric prototype: time/money, three hardware choices, four workloads, aggregate competition/product/creator/research inputs, and three outcomes | PASS                                    | Source inspection, canonical unit/property suite, balance command, and independent 20,001-seed sweep.                                                                                                             |
| M0 path viability, non-dominance, and upgrade constraints                                                                                           | PASS for automation; human gate open    | All swept seeds pass implemented predicates; catalog preserves capital, workload, power/thermal, memory, latency, reliability, observability, and operating-cost tradeoffs. Automation cannot establish interest. |
| M1 constrained portrait pipeline; compatible replacement/reordering; defined branch; bounded allocation; pause; queue; configurations               | PASS                                    | Root browser suite covers tap/snap, pointer and real touch drag, drawer pan, reorder, branch, policy controls, pause, queue, presets, and saved-rig restoration.                                                  |
| M1 animated flow; actual-bottleneck queue; memory/thermal/latency/throughput constraints; failure propagation; comparison                           | PASS                                    | Engine/property tests and packaged-browser regressions cover queue location, pressure boundaries, fixed-time quanta, fault/recovery, Inspector, and reduced motion.                                               |
| Four workloads exert distinct latency, throughput, memory, reliability/quality, cash, and reputation pressures                                      | PASS                                    | Catalog/engine inspection, settlement tests, workload cards, and browser flows.                                                                                                                                   |
| Predicted versus observed signals, uncertainty, observability, bottlenecks, and decision-relevant properties                                        | PASS                                    | Metric tests, Inspector behavior, qualified pressure guidance, store comparisons, and visible observed deltas.                                                                                                    |
| D-004 malformed/non-finite operation numerics are transactional no-ops and finite inputs remain bounded                                             | PASS; V-012 remains resolved            | Retained engine, Worker-boundary, and property regressions pass.                                                                                                                                                  |
| D-005 tutorial, money loop, preset delete/undo, CU/memory definitions, reachable pressure guidance, animation/time separation                       | PASS                                    | Retained first-session, settlement, accessibility, and pressure-boundary browser suites pass.                                                                                                                     |
| D-006 durable exact-once ownership; owned-only equip/add; safe insufficient/exact/repeated/unknown/incompatible operations                          | PASS for tested command behavior        | Unit/Worker tests, root purchase cases, direct-live purchase flow, and 100,001-seed sweep.                                                                                                                        |
| D-006 decision information and tradeoffs before purchase; visible observed consequences after equip/add                                             | PASS                                    | Rig/module cards expose applicable price, CU, memory, thermal/power, reliability, throughput/latency, quality, cost/maintenance, observability, compatibility, comparisons, and deltas.                           |
| D-006 pacing: meaningful module by 5 successes and first alternate rig by 15 including the module purchase                                          | PASS                                    | Independent sweep worst cases are 4 and 14 successful jobs.                                                                                                                                                       |
| D-006 320/393 px and 200% text journey; text, keyboard, screen-reader, touch states; no horizontal overflow                                         | PASS in Chromium                        | Root cases cover both widths, stressed text, 44 px controls, accessible names/states, touch/pan/drag, and overflow; direct live flow passes at 393 px.                                                            |
| D-006 schema-v4 migration and persistence of money, ownership, rig, modules, and run state across reload/offline; malformed/stale recovery          | PASS; V-017 remains resolved            | Unit/Worker migrations, root recovery/offline cases, stale-digest recovery, and direct-live purchase persistence/offline operation pass.                                                                          |
| Versioned save carries schema/content/migration/time/integrity data from the first persisted prototype                                              | PASS                                    | State/source inspection and persistence probes confirm metadata, deterministic full-snapshot digest, safe validation, and deterministic restores.                                                                 |
| Saved configurations identify and restore their own hardware after later live divergence                                                            | PASS; V-016 remains resolved            | Both retained label and actual-load regressions pass.                                                                                                                                                             |
| Main screen shows one objective, one dominant bottleneck, five resources, one warning, and one pipeline                                             | PASS                                    | DOM/source inspection and portrait browser cases.                                                                                                                                                                 |
| Portrait, one-handed, 44 px targets, color-independent state, reduced motion, scalable text, actionable screen-reader labels                        | PASS in Chromium                        | Retained 320/393, 150/200% text, target-size, motion, touch, status-text, and label checks.                                                                                                                       |
| TypeScript PWA; typed command boundary; deterministic headless engine; Worker separation; bounded unique event ledger                               | PASS                                    | Static/build checks, deterministic/property tests, Worker tests, and local/live online/offline behavior.                                                                                                          |
| Reproducible setup/startup/checking; repository-local caches; deterministic loopback; cleanup                                                       | PASS with documented host-browser retry | Locked setup, complete non-browser stages, exact scoped browser suites, direct startup probes, and empty process audit.                                                                                           |
| Exact-candidate GitHub Pages publication and live-package verification                                                                              | PASS; B-007 resolved                    | Exact remote head, successful exact-SHA workflow/jobs/deployment/status, eight matching hashes, HTTP 200, and direct-live online/offline purchase flow.                                                           |
| M0 economy-interest and M1 uninterrupted voluntary 30-minute reconfiguration/tradeoff-explanation gates                                             | BLOCKED                                 | Both immutable playtest records expressly omit duration/device/reconfiguration/prompting/tradeoff/conclusion evidence; no later record exists.                                                                    |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in current static, unit/property,
  browser, workflow, or live-publication evidence as applicable.
- B-007 is resolved for exact candidate `a3c1c32`: it is the remote deployment
  branch head, successful workflow and deployment SHA, byte-identical live
  package source, and the package exercised by direct pinned Chromium.
- B-005 remains open and is the sole acceptance blocker.

## Findings

No correctable candidate defect was confirmed.

## External blocking condition

### B-005 — Required human milestone-gate evidence remains absent

- Severity: Acceptance blocker.
- Related requirement: Milestone 0 economy-interest exit gate; Milestone 1
  voluntary 30-minute reconfiguration/tradeoff-explanation exit gate; D-001 and
  D-006 reversal conditions.
- Expected behavior/evidence: A dated record tied to deployed candidate
  `a3c1c32` and the tested device, assessing whether the economy is interesting
  and documenting an uninterrupted voluntary 30-minute session,
  reconfiguration timestamps/count, prompting status, at least two
  participant-explained purchase/pipeline tradeoffs, and a proceed/redesign
  conclusion.
- Actual behavior/evidence: The newest purchase-loop record concerns deployed
  predecessor `f08996b`, says the session was under 30 minutes, and explicitly
  lists every required gate fact as absent. No record covers the deployed
  purchasing candidate.
- Exact reproduction procedure: Inspect `.agent/playtests/`, D-001, D-006, and
  repository history for a later candidate-tied gate record.
- Concrete evidence: Both dated playtest records state that the human gates
  remain open; the candidate tree contains no later record.
- Blocks PASS: Yes. Automated checks and short verifier sessions cannot prove
  sustained enjoyment or participant comprehension.

## Exact input required for a future acceptance round

Complete the promised uninterrupted 30-minute session on deployed candidate
`a3c1c32`. Record the device, date, exact duration, voluntary reconfiguration
timestamps/count, prompting status, at least two participant-explained
purchase/pipeline tradeoffs, whether the economy is interesting without
narrative spectacle, and an explicit proceed/redesign conclusion. Commit and
publish that immutable record, then start a fresh Verifier on the exact
post-evidence candidate SHA.

## Unverified areas

- The two required human milestone exit gates.
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
