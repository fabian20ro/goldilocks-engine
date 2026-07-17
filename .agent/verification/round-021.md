# Verification round 021

Candidate SHA: `ac986c0610eeb3e2b1300104e7d7a9ee8ec47444`

VERDICT: FAIL

## Scope and verdict basis

Applicable scope: owner-authorized **Workstation Expansion I** in `plan.md` and
D-007, plus inherited Milestone 0–1 and D-004 through D-006 behavior. D-007
permits automated verification without converting the original unmeasured
human gates into acceptance evidence.

The candidate's intrinsic module-card reflow resolves V-026. Exact root
Chromium, retained V-025/V-026 cases, fresh screenshots, and an independent
pipeline-and-drawer probe show readable decision copy at both 320 and 393 CSS
pixels with 200% text. V-024 also remains resolved: lint is rerunnable with all
generated browser outputs present.

One correctable persistence defect prevents acceptance. The retained expanded
preset/offline path intermittently reloads Process 4 as empty after the UI has
shown the loaded `Basic Cleaner` preset and reported offline readiness. The
final full suite reproduced this once, and an exact ten-repeat run reproduced it
twice. This violates required deterministic offline topology persistence and
canonical test reliability (V-027).

The exact Pages-subpath browser suite was separately infrastructure-limited:
sandboxed Chromium was denied before page creation, and the narrowly scoped
outside-sandbox request was rejected by the environment's usage-limit gate with
an instruction not to attempt a workaround. Correctable V-027 independently
determines FAIL rather than BLOCKED.

## Environment and setup

- Host: macOS 26.5.2 / Darwin 25.5.0, arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any Verifier change, `git rev-parse HEAD` exactly
  matched the supplied candidate and `git status --short` was empty.
- `./scripts/setup`, through the canonical command, recreated locked
  dependencies in repository-local caches; npm reported zero vulnerabilities.
- Verifier-owned additions: this immutable report and
  `tests/e2e/verifier-round-021.spec.ts`. No production code, decision, handoff,
  playtest, prior report, or `plan.md` content was changed.

## Commands executed and results

| Command or probe                                                                                                                                   | Result                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean `git` identity/status; complete reads of `AGENTS.md`, all 1,879 plan lines, verifier role, decisions, handoff, playtests, and rounds 001–020 | Exact candidate confirmed; independent scope/checklist and next stable finding ID constructed.                                                                                                                                                                                  |
| Candidate/parent diff and production CSS/source inspection                                                                                         | Product delta is intrinsic module reflow only: pipeline slots and module drawer become named inline-size containers with an `em`-based two-row condition. No simulation or deferred-scope change.                                                                               |
| `./scripts/verify` before Verifier additions                                                                                                       | Setup, format, lint, typecheck, 73/73 tests with coverage, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and root build passed. Root Chromium then failed 50/50 at 0 ms due sandbox-denied Mach registration, so the wrapper stopped before Pages.    |
| Exact `npm run test:e2e` outside the browser sandbox, before Verifier additions                                                                    | PASS: 50/50 root packaged-PWA cases, including every retained finding regression and V-025/V-026 portrait cases.                                                                                                                                                                |
| Fresh screenshot inspection                                                                                                                        | Normal and 200%-text captures at 320/393 showed complete `Delivery Gate`, throughput/memory/reliability, and `EQUIPPED`; normal 393 retained horizontal composition; stressed layouts used readable two-row composition without clipping or overlap.                            |
| New `tests/e2e/verifier-round-021.spec.ts` focused run                                                                                             | PASS: 2/2. At 320 and 393, normal composition matched the intrinsic threshold; 200% text activated grid composition. Every pipeline and drawer module field had no clipping, ellipsis, or first-word fragmentation; document overflow stayed bounded; zero page/console errors. |
| Final full `npm run test:e2e` outside the browser sandbox                                                                                          | FAIL: 51/52. Every other case, including both new probes and V-001–V-026 regressions, passed. Expanded preset/offline resume reloaded Process 4 as empty (V-027).                                                                                                               |
| Exact V-027 case with `--repeat-each=10`                                                                                                           | FAIL: 8/10 passed, 2/10 reproduced the same empty Process 4 after offline reload.                                                                                                                                                                                               |
| Exact `npm run test:e2e:pages` in the managed sandbox                                                                                              | 0/2 before page creation; repository-local Chromium hit the established Mach-port permission denial.                                                                                                                                                                            |
| Exact scoped outside-sandbox Pages rerun request                                                                                                   | Not executed: environment usage-limit rejection explicitly prohibited workaround/indirect execution.                                                                                                                                                                            |
| `npm run build:pages` and Pages artifact output                                                                                                    | PASS for `/goldlocks-engine/`; HTML, CSS, main JS, Worker JS, manifest, service worker, and asset manifest emitted.                                                                                                                                                             |
| `npm run lint` after root/Pages/result/trace/visual artifacts; focused round-019 workflow regression                                               | PASS; V-024 remains resolved and canonical lint is rerunnable.                                                                                                                                                                                                                  |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C; port audit                                                                              | PASS: deterministic `127.0.0.1:4173` readiness, both resources HTTP 200, bounded shutdown, no listener remained.                                                                                                                                                                |
| Canonical balance outputs                                                                                                                          | Upgrade: 20,001 seeds, zero failures, first module by 4 successes, alternate rig by 14, maximum 23 attempts to 15 successes. Progression: 41 seeds, zero failures, expansion 13.1444–15.5944 hours and full catalogue 40.6292–44.4014 hours.                                    |
| Final format/lint/typecheck/diff checks                                                                                                            | PASS for all Verifier-owned artifacts.                                                                                                                                                                                                                                          |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                             | Status                                 | Independent evidence                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-007 authorization, bounded scope, and preservation of original human-gate history                                                                            | PASS                                   | Plan, decision log, playtest history, tree, and candidate diff agree. No researcher, hype/fear, parallel-pipeline, startup, labor, or later system was introduced.                                 |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                 | PASS for automated predicates          | Covered tests and base balance pass. The subjective economy-interest gate remains unmeasured and is not inferred.                                                                                  |
| Milestone 1 constrained portrait pipeline, compatible manipulation, branch, queue, comparison, flows, constraints, failure/recovery                            | PASS except V-027 persistence          | Root Chromium and engine evidence pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, pressure, and recovery behavior. Offline topology resume is intermittent.  |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                     | PASS; V-012 remains resolved           | Retained engine, Worker-boundary, migration, and property regressions pass. Malformed-input evidence remained high-level.                                                                          |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, animation/time separation, PWA behavior                                     | PASS at root; Pages browser unverified | Fresh retained root comprehension, persistence, offline, animation, and settlement cases pass except V-027's expanded topology boundary. Exact Pages browser execution was infrastructure-limited. |
| D-006 exact-once ownership, owned-only equip/add, decision information, deltas, pacing, schema-v4 inheritance                                                  | PASS                                   | Unit/Worker/root-browser regressions and the 20,001-seed sweep pass.                                                                                                                               |
| Exact-once expansion purchase; one active pipeline grows from three to six positions; new positions begin empty                                                | PASS                                   | Engine and browser purchase, double-activation, topology, and reload cases pass before V-027's offline resume boundary.                                                                            |
| Empty positions valid; all six support compatible tap, keyboard, replacement/reorder, and touch drag                                                           | PASS functionally                      | Retained expansion/accessibility cases pass all interaction alternatives.                                                                                                                          |
| Complete ordered-graph metrics and active-task feedback                                                                                                        | PASS; V-020 remains resolved           | Retained engine/browser regressions keep bottleneck, warning, pressure, and queue feedback tied to in-flight work.                                                                                 |
| Eight durable workloads; four initial and four deterministic visible unlocks; persistence/migration                                                            | PASS                                   | Catalog/engine inspection, unlock tests, eight-card assertions, and migration regressions pass.                                                                                                    |
| Per-task FIFO identity, immutable queue-time quote, configuration-dependent cost, zero failed gross, visible additive settlement                               | PASS; V-022/V-023 remain resolved      | Unit and browser regressions preserve configured, paid, unpaid, gross, and net equations across restore.                                                                                           |
| Current quote/demand visible before acceptance; reservations included; cost/net or uncertainty and loss warning                                                | PASS; V-018/V-021 remain resolved      | Retained engine/browser cases align shown and locked quotes and honestly report deterministic failure.                                                                                             |
| Saturation/recovery, immutable quotes, no idle money, nonpositive repeated farming, profitable rotation                                                        | PASS for automated model               | Unit/property, structural-floor, and progression checks pass; no-model graphs cannot deliver.                                                                                                      |
| Clear waiting confirmed, exact, transactional, and active-task preserving                                                                                      | PASS                                   | Exact-state and browser cases preserve active and unrelated deterministic/economic state.                                                                                                          |
| Fixed 1×/4×/16×/64× schedule equivalence, separate animation, and pause                                                                                        | PASS                                   | Unit schedule-equivalence and browser controls/reduced-motion cases pass.                                                                                                                          |
| Pacing: module by 5 successes, alternate rig by 15, expansion about 8–16 hours, catalogue after 24 and by 72 hours                                             | PASS for tested strategies             | Fresh 20,001- and 41-seed outputs meet every numeric bound.                                                                                                                                        |
| Bottom tabs sole global routing and progressive disclosure                                                                                                     | PASS                                   | Source inspection and browser assertions find no duplicate global page-opening CTA.                                                                                                                |
| 320/393 CSS pixels, 200% scalable/readable text, 44-pixel controls, bounded overflow, one-handed alternatives                                                  | PASS; V-025/V-026 resolved             | Exact retained cases, fresh screenshots, and new all-card pipeline/drawer measurements pass at both widths.                                                                                        |
| Reduced motion, color-independent meaning, screen-reader labels, reload/resume, failure/recovery                                                               | PARTIAL / FAIL at V-027                | Root accessibility and ordinary recovery cases pass. Expanded offline resume intermittently loses the loaded Process 4 placement.                                                                  |
| Schema-5/content-v4 state and presets preserve topology, task/quote, unlock, demand, equipment, money, RNG, metadata, timestamp, integrity; schema-3/4 recover | FAIL — V-027                           | Unit/current/legacy migrations pass, but repeated real offline reload does not reliably restore the loaded expanded preset topology.                                                               |
| Root and Pages install/start/package paths, repository-local caches, deterministic loopback, process cleanup                                                   | PARTIAL                                | Root exact suite, static Pages build, startup, cache paths, lint rerun, and cleanup pass. Exact Pages/offline Chromium is infrastructure-unverified.                                               |

## Prior finding and blocker regression results

- V-001 through V-024 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions.
- V-025 remains resolved: 320/200% output decision copy is readable.
- V-026 is resolved: 393/200% output copy and every stressed pipeline/drawer
  module field are readable without clipping, ellipsis, or word fragmentation.
- B-005 remains historically unmeasured; D-007 waives it as an automatic
  blocker for this bounded slice without making it a PASS claim.
- B-008 recurred for exact Pages Chromium because the sandbox denied launch and
  external execution capacity was rejected. V-027 independently requires FAIL.

## Findings

### V-027 — Expanded preset placement intermittently disappears on offline reload

- Severity: High persistence and recovery defect.
- Related plan requirement: `plan.md` Sections 8.1, 19, 24.4–24.6, 27, and
  Milestone 2 executable acceptance for expanded topology persistence,
  reload/resume, offline operation, and recovery; D-007 persistence contract.
- Expected behavior: After `Load Preset 1` visibly restores `Basic Cleaner` to
  Process 4 and the application reports offline readiness, an ordinary offline
  reload deterministically preserves that complete active topology.
- Actual behavior: The reloaded offline application sometimes keeps expansion
  active but renders Process 4 as `Empty / bypassed`. The final full root suite
  reproduced it once; an exact ten-repeat run reproduced it twice. Other runs
  pass, so the restore is timing-dependent rather than deterministically safe.
- Exact reproduction procedure: Run
  `npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep "buys expansion exactly once" --repeat-each=10`
  in an environment permitting repository-local Chromium. The path buys and
  activates expansion, moves Basic Cleaner to Process 4, saves/reloads the
  preset, waits for offline readiness, enables offline mode, and reloads.
- Concrete evidence: The stress result was 8 passes and 2 failures. Both
  failures received `Process 4 Empty / bypassed No memory, latency, cost, or
processing effect.` instead of `Basic Cleaner`. The final 52-case suite
  independently failed at the same assertion; no other case failed. Round 020
  had previously recorded the same symptom once as a residual timing risk.
- Blocks PASS: Yes. A required persisted player-authored topology is not
  reliably retained across the explicitly required offline reload path, and the
  canonical browser gate is not stable.

## Unverified areas

- Exact-candidate Pages-subpath service-worker registration, scoped cache
  isolation, and offline reload in Chromium due the external-capacity rejection.
- Exact-candidate GitHub Pages publication and direct-live package equality.
- Original Milestone 0 economy-interest and Milestone 1 uninterrupted voluntary
  30-minute reconfiguration/tradeoff-explanation gates; D-007 permits this slice
  without claiming those gates passed.
- Physical-device battery, CPU, thermal, platform touch, actual screen-reader
  output, non-Chromium browsers, and deferred later-milestone systems.

## Residual risks

- V-027 may involve the acknowledgement boundary among Worker state, React
  rendering, localStorage persistence, and offline readiness. The exact root
  cause was not established; repeated user-visible reproduction is sufficient
  to reject deterministic persistence.
- The 41-seed progression model verifies one encoded competent strategy, not an
  exhaustive proof of human strategy non-dominance.
- Reliability-weighted offers are expectations; individual settlements remain
  discrete. Paid cost remains derived rather than stored separately, although
  retained exact regressions reconcile it across restore.
- Short automated sessions and screenshots cannot establish sustained fun,
  physical-device performance, or assistive-technology quality.
