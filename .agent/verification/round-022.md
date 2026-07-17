# Verification round 022

Candidate SHA: `d69e415d66999cf545b2980a7b009750787d63a5`

VERDICT: BLOCKED

## Scope and verdict basis

Applicable scope: the owner-authorized **Workstation Expansion I** slice in
`plan.md` and D-007, plus inherited Milestone 0–1 and D-004 through D-006
behavior. D-007 permits automated verification without treating the original
unmeasured human gates as passed.

No correctable candidate defect was confirmed. V-027 is resolved: preset
restoration is one Worker request, React publication follows localStorage
persistence, offline readiness waits for every outstanding command response,
the retained full root suite passes, and the exact expanded-preset offline path
passes 100 consecutive repetitions.

Acceptance nevertheless cannot finish. The exact Pages-subpath Chromium suite
is required by the repository browser protocol and the plan's PWA/offline
acceptance. Sandboxed Chromium was denied before page creation. The required
scoped rerun outside that sandbox was then rejected by the execution
environment's usage-capacity gate with an explicit instruction not to attempt a
workaround. Static Pages packaging passes, but it cannot establish service
worker scope, cache isolation, and offline reload behavior in a real browser.
This external condition is B-008 and requires BLOCKED rather than PASS.

## Environment and setup

- Host: macOS / Darwin 25.5.0, arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any Verifier change, `git rev-parse HEAD` exactly
  matched the supplied candidate and `git status --short` was empty.
- `./scripts/setup`, through the canonical command, recreated locked
  dependencies in repository-local caches; npm reported zero vulnerabilities.
- Verifier-owned additions: this immutable report and
  `src/ui/verifierRound022.test.ts`. No production code, decision, handoff,
  playtest, prior report, or `plan.md` content was changed.

## Commands executed and results

| Command or probe                                                                                                                                               | Result                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact Git identity/status; complete reads of `AGENTS.md`, all 1,879 plan lines, verifier role, decisions, latest handoff, prior finding history, and round 021 | Exact clean candidate confirmed; independent scope/checklist and blocker history constructed.                                                                                                                                                                                                     |
| Candidate/parent diff and production source inspection                                                                                                         | Preset load is one bounded `COMMAND_BATCH`; Worker responses preserve request identity; state persistence precedes React publication; offline readiness requires shell readiness, durable latest state, and an empty pending-command set. No deferred system was added.                           |
| `./scripts/verify`                                                                                                                                             | Setup, format, lint, typecheck, 76/76 candidate tests with coverage, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and root build passed. Root Chromium then failed 52/52 at 0 ms because the macOS sandbox denied Mach registration; the wrapper stopped before Pages. |
| Exact `npm run test:e2e` with scoped browser permission                                                                                                        | PASS: 52/52 root packaged-PWA cases. Coverage includes 320/393 CSS pixels, real touch/pointer/keyboard/tap flows, 200% text, 44 px controls, reduced motion, persistence, migration, malformed-state recovery, offline reload, accessibility, and all retained V-001–V-027 paths.                 |
| Exact V-027 case with `--repeat-each=100`                                                                                                                      | PASS: 100/100 consecutive expansion, Process-4 placement, preset load, offline readiness, and offline reload repetitions. No page or console errors.                                                                                                                                              |
| New focused verifier durability tests plus candidate Worker/UI tests                                                                                           | PASS: 8/8. Multiple pending command acknowledgements keep readiness false until all settle; persistence failure remains unready until a later state is durable; atomic batch and Worker-to-storage ordering checks pass.                                                                          |
| Full `npm test` after the verifier test                                                                                                                        | PASS: 78/78 across 15 files; 87.59% statements, 85.91% branches, 94.90% functions, and 90.75% lines.                                                                                                                                                                                              |
| `npm run build:pages` and artifact path inspection                                                                                                             | PASS: `/goldlocks-engine/` HTML, manifest/icon links, main JS, CSS, Worker, service worker, and asset manifest emitted with repository-scoped paths.                                                                                                                                              |
| Exact sandboxed `npm run test:e2e:pages`                                                                                                                       | 0/2 before page creation. Both repository-local Chromium launches hit the macOS Mach-port permission denial.                                                                                                                                                                                      |
| Exact scoped outside-sandbox `npm run test:e2e:pages` request                                                                                                  | Not executed: the managed execution service rejected the request because external usage capacity was exhausted and explicitly prohibited workaround or indirect execution.                                                                                                                        |
| Fresh visual inspection of root screenshots at 320 and 393 CSS pixels, normal and 200% text                                                                    | Expanded and starter pipeline stages, output information, module state, controls, and fixed navigation remain readable without clipped decision fields or horizontal document overflow.                                                                                                           |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C; listener audit                                                                                      | PASS: deterministic `127.0.0.1:4173` readiness, both resources HTTP 200, bounded shutdown, and no remaining listener.                                                                                                                                                                             |
| Final focused format/lint/typecheck/diff checks                                                                                                                | PASS before report creation; repeated after report formatting below.                                                                                                                                                                                                                              |

Canonical balance evidence:

- Upgrade sweep: 20,001 seeds, zero failures, first module by 4 successful
  jobs, alternate rig by 14, maximum 23 attempts to 15 successes.
- Progression sweep: 41 seeds, zero failures, expansion 13.1444–15.5944
  simulated hours, full catalogue 40.6292–44.4014 hours.

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                            | Status                            | Independent evidence                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007 authorization, bounded scope, and preservation of original human-gate history                                                                           | PASS                              | Plan, decision log, playtest history, tree, and candidate diff agree. No researcher, hype/fear, parallel-pipeline, startup, labor, or later system was introduced. |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                | PASS for automated predicates     | Covered tests, base model, and upgrade/progression sweeps pass. The subjective economy-interest gate remains unmeasured and is not inferred.                       |
| Milestone 1 constrained portrait pipeline, compatible manipulation, shadow branch, queue, comparison, flows, constraints, failure, and recovery               | PASS at root                      | Exact Chromium and engine evidence pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, pressure, and recovery behavior.          |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                    | PASS; V-012 remains resolved      | Retained engine, Worker-boundary, migration, and property regressions pass. Malformed-input evidence is recorded at a high level.                                  |
| D-005 tutorial, money loop, preset delete/undo, definitions, reachable guidance, animation/time separation, and PWA behavior                                  | PASS at root; Pages BLOCKED       | Fresh root comprehension, persistence, offline, animation, settlement, and recovery cases pass. Exact Pages browser behavior is unavailable under B-008.           |
| D-006 exact-once ownership, owned-only equip/add, decision information, deltas, pacing, and schema-v4 inheritance                                             | PASS                              | Unit/Worker/root-browser regressions and the 20,001-seed sweep pass.                                                                                               |
| Exact-once expansion purchase; one pipeline expands from three to six positions; new positions begin empty                                                    | PASS                              | Engine and root browser purchase, duplicate activation, topology, and reload cases pass.                                                                           |
| Empty positions valid; all six accept compatible tap, keyboard, replacement/reorder, and touch drag                                                           | PASS                              | Retained expansion/accessibility cases pass every interaction alternative.                                                                                         |
| Complete ordered-graph metrics and active-task feedback                                                                                                       | PASS; V-020 remains resolved      | Engine/root regressions keep bottleneck, warning, pressure, and queue feedback tied to in-flight work.                                                             |
| Eight workloads; four initial and four deterministic visible unlocks; persistence/migration                                                                   | PASS                              | Catalog inspection, unlock tests, eight-card assertions, and migration regressions pass.                                                                           |
| Per-task FIFO identity, locked quote, configuration-dependent cost, zero failed gross, and additive settlement                                                | PASS; V-022/V-023 remain resolved | Unit and browser regressions preserve configured, paid, unpaid, gross, and net equations across restore.                                                           |
| Pre-acceptance quote/demand, reservations, cost/net or uncertainty, and loss warning                                                                          | PASS; V-018/V-021 remain resolved | Retained engine/browser cases align displayed and locked quotes and honestly report deterministic failure.                                                         |
| Completion saturation, simulated-time recovery, immutable quotes, no idle money, nonpositive repeated farming, profitable rotation                            | PASS for automated model          | Unit/property, structural-floor, and progression checks pass; no-model graphs cannot deliver.                                                                      |
| Confirmed clear-waiting is exact, transactional, and active-task preserving                                                                                   | PASS                              | Exact-state and browser cases preserve active and unrelated deterministic/economic state.                                                                          |
| Exact 1×/4×/16×/64× schedule equivalence, separate animation, and pause                                                                                       | PASS                              | Unit schedule-equivalence and browser controls/reduced-motion cases pass.                                                                                          |
| Pacing: module by 5 successes, alternate rig by 15, expansion about 8–16 h, catalogue after 24 h and by 72 h                                                  | PASS for tested strategies        | Fresh deterministic sweeps meet every numeric bound.                                                                                                               |
| Bottom tabs are sole global navigation; progressive disclosure                                                                                                | PASS                              | Source inspection and browser assertions find no duplicate page-opening CTA.                                                                                       |
| 320/393 px, 200% readable text, 44 px controls, bounded overflow, and one-handed alternatives                                                                 | PASS; V-025/V-026 remain resolved | Exact root cases and fresh visual inspection pass at both widths.                                                                                                  |
| Reduced motion, color-independent meaning, screen-reader labels, failure/recovery                                                                             | PASS at root                      | Retained accessibility and recovery cases pass.                                                                                                                    |
| Schema-5/content-v4 state and presets preserve topology, tasks/quotes, unlocks, demand, equipment, money, RNG, timestamp, integrity, and schema-3/4 migration | PASS at root; V-027 resolved      | Unit/current/legacy migrations pass; exact root offline path passes in the full suite and 100/100 repetitions.                                                     |
| Root and Pages install/start/package paths, repository-local caches, deterministic loopback, and cleanup                                                      | PARTIAL / B-008                   | Root suite, static Pages build, startup, local cache path, lint rerun, and cleanup pass. Exact Pages Chromium is infrastructure-blocked.                           |
| PWA works at `/goldlocks-engine/` with correct service-worker scope, cache isolation, and offline Worker resume                                               | BLOCKED                           | Static paths and test definition are correct; required real Pages-browser execution could not pass the environment boundary.                                       |

## Prior finding and blocker regression results

- V-001 through V-026 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions.
- V-027 is resolved. The exact previously intermittent scenario passes once in
  the full suite and 100/100 focused repetitions; independent acknowledgement
  tests cover multiple pending commands and persistence failure/recovery.
- B-005 remains historically unmeasured; D-007 waives it as an automatic
  blocker for this bounded slice without turning it into a PASS claim.
- B-008 recurred only for exact Pages Chromium. Root Chromium ran with the
  approved scoped permission and passed completely.

## Findings

No confirmed correctable candidate finding.

## External blocking condition

### B-008 — Required Pages-subpath browser evidence unavailable

- Severity: Acceptance blocker.
- Related requirement: `AGENTS.md` Browser and JavaScript testability; verifier
  role browser instructions; `plan.md` Sections 20, 23, 27, and Milestone 2
  executable acceptance for offline browser coverage and repository-pinned
  Playwright.
- Expected behavior/evidence: The Verifier can execute the exact repository
  command `npm run test:e2e:pages` in pinned Chromium against the current
  candidate. Both Pages tests must reach the application and establish correct
  subpath assets, Worker operation, service-worker scope, complete shell cache,
  foreign-cache preservation, and offline reload.
- Actual behavior/evidence: In the managed sandbox, both tests fail at browser
  launch before page creation because macOS denies Mach-port registration. The
  narrowly scoped outside-sandbox request is rejected before execution because
  the environment's external usage capacity is exhausted. The rejection
  explicitly prohibits attempts to obtain the same outcome by workaround.
- Exact reproduction procedure: From candidate
  `d69e415d66999cf545b2980a7b009750787d63a5` after `./scripts/setup`, run
  `npm run test:e2e:pages` in the managed sandbox; observe 0/2 at 0 ms and the
  launch-only Mach denial. Request permission for that exact command outside
  the sandbox; this round's execution service rejects it before execution due
  its usage-capacity gate.
- Concrete evidence: The Pages server built and reached readiness, then both
  Chromium processes terminated at Mach registration before any page existed.
  The escalation returned the capacity rejection. `npm run build:pages` and
  artifact inspection pass, isolating the missing evidence to browser
  execution rather than a demonstrated package defect.
- Blocks PASS: Yes. The protocol forbids silently skipping required Pages,
  service-worker, cache-isolation, and offline browser acceptance.

## Exact input or infrastructure required to unblock

Restore managed external execution capacity, or explicitly authorize the exact
`npm run test:e2e:pages` command after reviewing the sandbox-launch restriction,
then start a fresh Verifier round on this exact production candidate. No product
change is requested by this report.

## Unverified areas

- Exact-candidate Pages-subpath service-worker registration/scope, complete
  shell caching, sibling/foreign-cache isolation, Worker operation, and offline
  reload in Chromium because of B-008.
- Exact-candidate GitHub Pages publication and direct-live package equality;
  the candidate was not pushed or deployed by the Verifier.
- Original Milestone 0 economy-interest and Milestone 1 uninterrupted voluntary
  30-minute reconfiguration/tradeoff-explanation gates; D-007 permits this
  bounded slice without claiming those gates passed.
- Physical-device battery, CPU, thermal, platform touch, actual screen-reader
  output, non-Chromium engines, and deferred later-milestone systems.

## Residual risks

- One hundred consecutive V-027 passes plus the ordering tests provide strong
  regression evidence but are not a mathematical proof against every browser
  scheduling interleaving.
- The 41-seed progression model verifies one encoded competent strategy rather
  than exhaustively proving human strategy non-dominance.
- Reliability-weighted offers are expectations; individual settlements remain
  discrete. Paid cost remains derived rather than stored separately, although
  exact retained regressions reconcile it across restore.
- Short automated sessions and screenshots cannot establish sustained fun,
  physical-device performance, or assistive-technology quality.
- Storage denial leaves the in-memory session playable but cannot provide
  cross-reload durability; the UI correctly withholds offline readiness while
  the latest state is not durable.
