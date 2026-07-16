# Verification round 018

Candidate SHA: `a37337b7ef6d37b77ccb1228bbf9faefc30e9b71`

VERDICT: BLOCKED

## Scope and verdict basis

The applicable candidate is the owner-authorized **Workstation Expansion I**
slice in `plan.md` and D-007, together with the inherited Milestone 0–1 and
D-004 through D-006 behavior on which that slice depends. D-007 permits
independent automated verification without treating the still-unmeasured human
exit gates as an automatic blocker. It does not claim those human gates passed.

No correctable product defect was confirmed. V-023 is resolved: successful and
failed settlement equations use one common two- or three-decimal precision, and
the configured/paid/unpaid partition remains additive at every reachable mill
boundary independently exercised. Canonical static, unit/property, balance,
build, root packaged-PWA, portrait, accessibility, persistence, and inherited
finding regressions otherwise pass.

PASS cannot be issued because two browser requirements could not be completed
fresh for this exact candidate. The required Pages-subpath/offline suite was
denied before page creation by the managed macOS Mach-port sandbox. Its scoped
outside-sandbox rerun was then rejected by the execution environment's external
usage-limit gate. The same gate prevented fresh headed Playwright inspection,
and the supplemental in-app Browser had no available backend. Static Pages
build, deterministic startup, and every named asset returned HTTP 200, but those
checks do not replace service-worker/offline browser execution or real visual
inspection. AGENTS.md requires BLOCKED when required browser infrastructure,
rather than a candidate defect, prevents verification.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any Verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup` recreated the lockfile-defined dependency tree with
  repository-local npm and browser caches; audit reported zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before page
  creation. One exact root-suite rerun outside that restriction succeeded. A
  later exact Pages-suite escalation was rejected by the environment's external
  usage-limit gate, not by repository behavior.
- Verifier-owned additions are this immutable report and
  `src/simulation/verifierRound018.test.ts`. No production code, prior report,
  decision, handoff, playtest record, or `plan.md` content was changed.

## Commands executed and results

| Command or probe                                                                                                                                              | Result                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`; `git rev-parse HEAD`                                                                                                                    | Clean start; exact supplied candidate matched.                                                                                                                                                                                                                                                    |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, round-017, prior finding index, and relevant handoff/source/test paths | Independent applicable checklist and finding history constructed.                                                                                                                                                                                                                                 |
| Candidate exact-parent diff and source inspection                                                                                                             | Change is limited to shared currency formatting, settlement ledger/UI use, tests, and handoff. No production scope expansion found.                                                                                                                                                               |
| `./scripts/verify` before Verifier additions                                                                                                                  | Setup, format, lint, typecheck, 70/70 tests, coverage, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and production build passed. Root Chromium then failed 47/47 at 0 ms before page creation with the sandbox Mach-port denial, so the wrapper could not reach Pages. |
| Exact `npm run test:e2e` outside the browser sandbox                                                                                                          | 47/47 root packaged-PWA cases passed, including V-018, V-020, V-021, and both V-023 regressions.                                                                                                                                                                                                  |
| Exact `npm run test:e2e:pages` inside the sandbox                                                                                                             | 0/2; both cases were denied before page creation by the same Mach-port restriction.                                                                                                                                                                                                               |
| Exact `npm run test:e2e:pages` requested outside the browser sandbox                                                                                          | Not executed: the environment rejected the scoped escalation because its external usage limit had been reached. No alternate command or policy workaround was attempted.                                                                                                                          |
| `npm run build:pages`; `./scripts/run-pages-e2e`; loopback HTTP probes                                                                                        | Pages build passed. Deterministic preview started at `/goldlocks-engine/`; index, manifest, service worker, main bundle, and Worker bundle each returned HTTP 200. No listener remained after bounded shutdown.                                                                                   |
| Fresh headed/in-app visual inspection attempt                                                                                                                 | Outside-sandbox headed execution unavailable after the usage-limit rejection. The supplemental in-app Browser reported no available backend. No visual substitute was claimed.                                                                                                                    |
| Canonical balance outputs                                                                                                                                     | Upgrade sweep: 20,001 seeds, zero failures, worst first module at 4 successes, first alternate rig at 14, maximum 23 attempts to 15 successes. Progression sweep: 41 seeds, zero failures, expansion at 13.1444–15.5944 hours and full catalogue at 40.6292–44.4014 hours.                        |
| `npx vitest run src/simulation/verifierRound018.test.ts --coverage.enabled=false`                                                                             | 2/2 independent settlement-equation probes passed. Every cash mill from $0.000 through $0.015 reconciled the no-model paid/unpaid boundary; a successful sub-cent gross/cost/net equation reconciled; save/restore preserved settlement and ledger evidence.                                      |
| `npm test` after Verifier additions                                                                                                                           | 72/72 unit/property/migration/economy/currency/verifier tests passed with required coverage thresholds.                                                                                                                                                                                           |
| `npm run format:check`; canonical `npm run lint`; `npm run typecheck` before browser artifact generation                                                      | Passed.                                                                                                                                                                                                                                                                                           |
| Focused formatter/lint/typecheck/diff checks after Verifier additions                                                                                         | Verifier test passed Prettier, ESLint, TypeScript, and `git diff --check`. The failed Pages run generated ignored HTML trace output that canonical ESLint enumerates if left present; this is verifier-created ignored output, not a tracked candidate defect.                                    |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                                                           | Status                                           | Independent evidence                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-007 owner authorization, bounded scope, and preservation of human-gate history                                                                                                                             | PASS                                             | `plan.md`, D-007, immutable playtest records, and candidate diff agree. No excluded later-scope system was introduced.                                                 |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                                                               | PASS for automated predicates                    | Canonical numeric prototype and balance checks pass. Subjective economy-interest remains unmeasured and is not inferred.                                               |
| Milestone 1 constrained portrait pipeline, compatible manipulation, queue, comparison, flow, constraints, and failure propagation                                                                            | PASS for inherited automated scope               | Root Chromium and retained engine regressions pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, recovery, and comparison behavior. |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                                                                   | PASS; V-012 remains resolved                     | Retained engine, Worker-boundary, migration, and property regressions pass. Ordinary malformed-state evidence remained high-level.                                     |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, animation/time separation, root and Pages PWA                                                                             | BLOCKED only for fresh Pages/offline execution   | Root comprehension, persistence, offline, and settlement cases pass. Exact Pages browser execution is B-008.                                                           |
| D-006 exact-once durable ownership, owned-only equip/add, decision information, observed deltas, pacing, and schema-v4 inheritance                                                                           | PASS                                             | Unit/Worker/root-browser regressions and the 20,001-seed sweep pass.                                                                                                   |
| Exact-once Workstation Expansion purchase; one pipeline grows from three to six positions; new positions begin empty                                                                                         | PASS                                             | Command tests and root-browser purchase/reload/offline flow pass.                                                                                                      |
| Empty positions valid; all six positions support owned compatible tap, keyboard, replacement/reorder, and touch drag                                                                                         | PASS in automated Chromium                       | Root expansion and accessibility cases pass all interaction alternatives. Fresh supplemental visual inspection is B-008.                                               |
| Complete ordered-graph metrics and active-task feedback                                                                                                                                                      | PASS; V-020 remains resolved                     | Retained independent/unit/browser regressions keep metrics, warning, and active identity bound to the active workload.                                                 |
| Eight durable workloads; four initial and four deterministic unlocks with visible exact progress; persistence/migration                                                                                      | PASS                                             | Catalog/engine inspection, unlock tests, eight-card assertions, and migration regressions pass.                                                                        |
| Per-task FIFO identity, queue-time locked gross, configuration-dependent actual cost, zero gross on failure, visible settlement net                                                                          | PASS; V-022/V-023 resolved                       | Root-browser regressions plus independent all-mill engine evidence preserve the full configured cost, exact paid/unpaid partition, economic net, and persistence.      |
| Current quote and demand visible before acceptance; reservation pressure reflected in next quote                                                                                                             | PASS; V-018 remains resolved                     | Retained engine/browser regressions show the displayed quote equals the newly accepted locked quote.                                                                   |
| Before acceptance, visible quote, demand/trend/reason, estimated cost/net or uncertainty, saturation/recovery explanation, and loss warning                                                                  | PASS; V-021 remains resolved                     | Retained all-workload and browser evidence make guaranteed failures zero expected gross and negative expected net.                                                     |
| Completion saturation, demand recovery, immutable accepted quotes, and no idle-only money                                                                                                                    | PASS                                             | Unit/property and balance evidence confirm isolated saturation, simulated-time recovery, locked quotes, and unchanged idle money.                                      |
| Single-workload farming eventually nonpositive; rotation/recovery retains profit                                                                                                                             | PASS for automated model                         | Structural floor regressions and progression balance pass; no-model graphs cannot deliver.                                                                             |
| Clear-waiting confirmation exact, transactional, and active-task preserving                                                                                                                                  | PASS                                             | Engine exact-state and root Chromium cases preserve active work and all unrelated economic/deterministic state.                                                        |
| Fixed 1×/4×/16×/64× schedule equivalence; separate animation and pause                                                                                                                                       | PASS                                             | Unit schedule-equivalence and root controls/reduced-motion cases pass.                                                                                                 |
| Pacing: first module by 5 successes, alternate rig by 15, expansion around 8–16 hours, full catalogue 24–72 hours                                                                                            | PASS for tested strategies                       | Both canonical deterministic sweeps satisfy every numeric bound.                                                                                                       |
| Bottom tabs sole global routing; progressive disclosure preserves density                                                                                                                                    | PASS in automated Chromium                       | Source inspection and root browser assertions pass.                                                                                                                    |
| 320/393 CSS pixels, 200% text, 44-pixel controls, no horizontal overflow, one-handed alternatives                                                                                                            | PASS in automated Chromium; fresh visual BLOCKED | Root cases pass both widths, scaling, targets, overflow, and interaction modes. B-008 prevents the separate real visual inspection.                                    |
| Reduced motion, color-independent meaning, screen-reader labels, offline reload/resume, failure/recovery                                                                                                     | PASS at root; Pages/offline BLOCKED              | Root accessibility/offline/recovery cases pass. B-008 prevents the required subpath/offline browser regression.                                                        |
| Schema-5/content-v4 state and presets preserve expansion, topology, task identity/quote, unlocks, demand, equipment, money, RNG, metadata, timestamp, and integrity; schema-3/4 and malformed values recover | PASS for tested paths                            | Unit/Worker migration, current/legacy root recovery, expanded preset reload, and independent settlement restore pass.                                                  |
| Root and Pages install/start/package paths, repository-local caches, deterministic loopback, process cleanup                                                                                                 | BLOCKED only for Pages browser behavior          | Root 47/47 passes; Pages static build/start/assets pass; Pages service-worker/offline behavior could not execute in Chromium. No port 4173 listener remained.          |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions as applicable.
- V-018 remains resolved: reservation-aware live quotes equal newly accepted
  locked quotes.
- V-019 remains resolved: no-model graphs cannot deliver and productive demand
  floors remain nonpositive.
- V-020 remains resolved: active-task metrics and diagnostics do not switch to
  selected future work.
- V-021 remains resolved: deterministic failure produces zero expected gross
  and negative expected net at both acceptance surfaces.
- V-022 remains resolved: settlement preserves configured cost, distinguishes
  paid and unpaid portions, and keeps money nonnegative.
- V-023 is resolved: root Chromium passes both retained cases, and the new
  independent probe reconciles every reachable mill-level partial-payment
  boundary plus a successful sub-cent gross/cost/net equation across restore.
- B-007 was resolved for predecessor publication in round 014. Exact live
  publication of this production-changing candidate was not attempted and is
  not used as evidence here.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice. It does not become a PASS claim.

## Findings

### B-008 — Required exact-candidate browser verification infrastructure became unavailable

- Severity: Blocking infrastructure.
- Related requirement: AGENTS.md Browser and JavaScript testability; verifier
  role browser instructions; `plan.md` Sections 20 and 27; Milestone 2
  executable acceptance requiring Pages/offline browser coverage and real
  visual inspection at 320/393 CSS pixels.
- Expected behavior: The Verifier can execute the repository-pinned
  `npm run test:e2e:pages` suite in Chromium and perform fresh real visual
  inspection for the exact candidate after documented setup.
- Actual behavior: Sandboxed Chromium is denied at Mach-port registration
  before page creation. The exact root suite ran once outside that restriction
  and passed 47/47. The subsequent exact Pages-suite escalation was rejected by
  the execution environment's external usage-limit gate. Supplemental in-app
  Browser discovery returned no available backend, so fresh visual inspection
  was also unavailable.
- Exact reproduction procedure: From the clean candidate after
  `./scripts/setup`, run `npm run test:e2e:pages` in the managed sandbox; both
  cases fail at browser launch before page creation with the Mach-port denial.
  Request the same exact command outside the sandbox; this session's execution
  environment rejects it because its external usage limit has been reached.
- Concrete evidence: The exact sandboxed Pages command reported 0/2 at 0 ms,
  both with the same launch denial. The scoped escalation returned an
  environment rejection before command execution. Static Pages build/start and
  HTTP probes all passed, isolating the missing evidence to browser execution.
- Blocks PASS: Yes. Required Pages/offline and fresh visual browser evidence is
  absent for the exact candidate; protocol forbids silently skipping it.

## Unverified areas

- Exact-candidate Pages-subpath service-worker registration, scope, cache
  isolation, and offline reload in Chromium due B-008.
- Fresh real visual inspection of the exact candidate at 320 and 393 CSS pixels
  due B-008. Automated headless portrait assertions passed.
- The original Milestone 0 economy-interest and Milestone 1 uninterrupted
  voluntary 30-minute reconfiguration/tradeoff-explanation gates. D-007 permits
  this bounded slice without claiming those gates passed.
- Exact-candidate GitHub Pages publication and direct-live package equality;
  the candidate was not pushed or deployed for this round.
- Physical-device battery, CPU, thermal, platform touch, actual screen-reader
  output, and browsers other than Chromium.
- Deferred Milestone 2 systems and Milestones 3–7/expansions excluded by D-007.

## Residual risks

- The 41-seed progression model verifies one encoded competent strategy; it
  does not exhaustively prove strategy non-dominance.
- Reliability-weighted offers are expectations over the deterministic model,
  not promises for individual tasks; individual settlements remain discrete.
- Paid cost remains derived from configured cost, gross, and cash delta rather
  than stored as a dedicated settlement field. Current derivation is exact and
  independently tested but remains coupled to settlement accounting.
- Short automated sessions cannot establish sustained enjoyment,
  physical-device performance, or assistive-technology quality.
- localStorage denial leaves the in-memory session operable but cannot provide
  cross-reload durability, as the handoff discloses.

To unblock a fresh verification round, provide execution capacity that permits
the exact repository-pinned Pages Chromium suite and headed 320/393 inspection
outside the managed Mach-port sandbox (for example, retry after the external
usage limit is restored). No product change or product decision is currently
requested.
