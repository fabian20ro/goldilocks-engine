# Verification round 019

Candidate SHA: `6ce80aa87055c121469984cb8dd4acf84bcf73d9`

VERDICT: FAIL

## Scope and verdict basis

The applicable product scope is the owner-authorized **Workstation Expansion I**
slice in `plan.md` and D-007, together with the inherited Milestone 0–1 and
D-004 through D-006 behavior on which it depends. D-007 permits automated
verification without converting the original unmeasured human gates into PASS
claims.

The candidate adds only the immutable round-018 report and its verifier-owned
settlement regression to the previously evaluated production commit. Fresh
static, unit/property, deterministic balance, build, root packaged-PWA,
persistence, interaction, and normal-scale portrait checks otherwise pass.
V-001 through V-023 remain resolved in retained regressions.

Two independently reproducible defects prevent acceptance:

- the canonical verification command is not rerunnable after its required
  Pages browser stage creates the ignored `playwright-pages-report` directory,
  because ESLint does not ignore that directory;
- at 320 CSS pixels and 200% text, the expanded pipeline's Output module copy
  collapses into one- and two-character vertical fragments, making its name and
  decision information illegible.

The Pages-subpath browser suite also could not execute fresh in this session:
the managed sandbox denied Chromium's Mach-port registration, and the exact
outside-sandbox rerun was rejected by the execution environment's usage limit.
That is an unverified infrastructure area, not the basis for the FAIL verdict.

## Environment and setup

- Host: macOS 26.5.2 (Darwin 25.5.0), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup`, invoked by the canonical command, recreated the
  lockfile-defined dependency tree and reported zero vulnerabilities.
- Verifier-owned additions are this immutable report, one workflow regression,
  and one portrait visual regression. No production code, prior report,
  decision, handoff, playtest record, or `plan.md` content was changed.

## Commands executed and results

| Command or probe                                                                                                                           | Result                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`; `git rev-parse HEAD`                                                                                                 | Clean tracked start; exact supplied candidate matched.                                                                                                                                                                                                                              |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, current handoff, prior finding index, and round-018 | Independent applicable checklist and finding sequence constructed.                                                                                                                                                                                                                  |
| Candidate/parent diff and source/config inspection                                                                                         | Candidate contains only round-018 verifier artifacts over production commit `a37337b`; no product scope expansion.                                                                                                                                                                  |
| `./scripts/verify` before verifier additions                                                                                               | Clean dependency recreation passed. Formatting passed. Canonical lint then failed with 1,101 errors from generated files under `playwright-pages-report`; V-024. The wrapper stopped before later phases.                                                                           |
| `npm run lint -- --ignore-pattern playwright-pages-report`; `npm run typecheck`                                                            | Passed, isolating lint failure to the omitted generated-output ignore.                                                                                                                                                                                                              |
| `npm test` before verifier additions                                                                                                       | 72/72 unit/property/migration/economy/currency/verifier tests passed; coverage thresholds passed.                                                                                                                                                                                   |
| `npm run balance`                                                                                                                          | Base model viable with no encoded dominant strategy; 20,001-seed upgrade sweep had zero failures, first module by 4 successes and alternate rig by 14; 41-seed progression sweep had zero failures, expansion at 13.1444–15.5944 hours and full catalogue at 40.6292–44.4014 hours. |
| `npm run build`; `npm run build:pages`                                                                                                     | Root and `/goldlocks-engine/` production builds passed with Worker assets.                                                                                                                                                                                                          |
| Exact `npm run test:e2e`                                                                                                                   | 47/47 root packaged-PWA cases passed, including retained 320/393, 200% text, interaction, persistence, offline, quote, active-task, and settlement regressions.                                                                                                                     |
| Exact `npm run test:e2e:pages` in the managed sandbox                                                                                      | 0/2 before page creation; Chromium failed at sandbox-denied Mach-port registration.                                                                                                                                                                                                 |
| Exact outside-sandbox `npm run test:e2e:pages` request                                                                                     | Not executed; the environment rejected the scoped request because its usage limit was reached. No alternate execution workaround was attempted.                                                                                                                                     |
| Verifier visual probe before adding its readability assertion                                                                              | 2/2; generated fresh starter, expanded-topology, lower-topology, and 200%-text screenshots at 320 and 393 CSS pixels with no page/console errors. Visual inspection found V-025 at 320.                                                                                             |
| `npm run test:e2e -- tests/e2e/verifier-round-019.spec.ts` after assertion                                                                 | 1/2 passed. At 320/200%, the first word of `Delivery Gate` occupied five rendered line fragments instead of one; the 393 capture completed.                                                                                                                                         |
| `npx vitest run src/test/verifierRound019Workflow.test.ts --coverage.enabled=false`                                                        | Expected regression failure: ESLint reported the Pages generated-report path is not ignored.                                                                                                                                                                                        |
| `npm test` after verifier additions                                                                                                        | 72 retained tests passed; the one new V-024 regression failed as expected.                                                                                                                                                                                                          |
| Focused Prettier, ESLint, TypeScript, and `git diff --check` for verifier artifacts                                                        | Passed.                                                                                                                                                                                                                                                                             |
| `lsof -nP -iTCP:4173 -sTCP:LISTEN` after tests                                                                                             | No listener remained.                                                                                                                                                                                                                                                               |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                    | Status                                       | Independent evidence                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007 authorization, bounded scope, and preservation of original human-gate history                                                                                   | PASS                                         | Plan, decision, playtest history, tree, and candidate diff agree. No deferred researcher, hype/fear, parallel-pipeline, startup, labor, or later system was introduced.  |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                        | PASS for automated predicates                | Fresh unit/property and base balance outputs pass. The subjective economy-interest gate remains unmeasured and is not inferred.                                          |
| Milestone 1 constrained portrait pipeline, compatible manipulation, branch, queue, comparison, flows, constraints, and failure/recovery                               | PASS except V-025 accessibility presentation | Fresh root Chromium and retained engine cases pass tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, pressure, and recovery behavior.     |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                            | PASS; V-012 remains resolved                 | Retained engine, Worker-boundary, migration, and property regressions pass. Malformed-state evidence remained high-level.                                                |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, animation/time separation, and PWA behavior                                        | PASS at root; Pages browser unverified       | Fresh root comprehension, persistence, offline, animation, and settlement cases pass. Exact Pages browser execution was infrastructure-limited.                          |
| D-006 exact-once ownership, owned-only equip/add, decision information, deltas, pacing, and schema-v4 inheritance                                                     | PASS                                         | Unit/Worker/root browser regressions and 20,001-seed sweep pass.                                                                                                         |
| Exact-once Workstation Expansion purchase; single pipeline grows from three to six positions; new positions begin empty                                               | PASS                                         | Root browser purchase/double-activation/reload cases and visual probe confirm the behavior.                                                                              |
| Empty positions valid; all six positions support compatible tap, keyboard, replacement/reorder, and touch drag                                                        | PASS functionally                            | Retained root expansion and accessibility cases pass all alternatives. Fresh lower-topology screenshots show Process 4–6 and Output.                                     |
| Complete ordered-graph metrics and active-task feedback                                                                                                               | PASS; V-020 remains resolved                 | Retained independent/unit/browser regressions keep metrics, warnings, and queue feedback bound to actual in-flight work.                                                 |
| Eight durable workloads; four initial and four deterministic visible unlocks; persistence/migration                                                                   | PASS                                         | Catalog/engine inspection, unlock tests, eight-card browser assertions, and migration regressions pass.                                                                  |
| Per-task FIFO identity, immutable queue-time quote, configuration-dependent cost, zero failed gross, and visible additive settlement                                  | PASS; V-022/V-023 remain resolved            | Fresh root browser and retained independent mill-boundary tests preserve configured, paid, unpaid, gross, and net equations across restore.                              |
| Current quote/demand visible before acceptance; reservations included; cost/net or uncertainty and loss warning shown                                                 | PASS; V-018/V-021 remain resolved            | Retained engine/browser cases align the shown and locked quote and report guaranteed-failure expected net honestly.                                                      |
| Completion saturation, simulated-time recovery, immutable accepted quotes, no idle money, nonpositive repeated farming, profitable rotation                           | PASS for automated model                     | Unit/property, structural-floor, and progression checks pass; no-model graphs cannot deliver.                                                                            |
| Clear waiting is confirmed, exact, transactional, and active-task preserving                                                                                          | PASS                                         | Engine exact-state and root browser cases preserve active identity/progress/quote and unrelated deterministic/economic state.                                            |
| Fixed 1×/4×/16×/64× schedule equivalence, separate animation, and pause                                                                                               | PASS                                         | Unit schedule-equivalence and root browser controls/reduced-motion cases pass.                                                                                           |
| Pacing: first module by 5 successes, alternate rig by 15, expansion about 8–16 hours, full catalogue after 24 and by 72 hours                                         | PASS for tested strategies                   | Fresh 20,001- and 41-seed outputs meet every numeric bound.                                                                                                              |
| Bottom tabs sole global routing and progressive disclosure                                                                                                            | PASS at normal scale                         | Source inspection and retained browser assertions pass; no duplicate page-opening CTAs found.                                                                            |
| 320/393 CSS pixels, 200% text, readable/scalable content, 44-pixel controls, no horizontal overflow, one-handed alternatives                                          | **FAIL — V-025**                             | Existing geometry checks pass targets/overflow, but fresh real rendering at 320/200% makes `Delivery` span five line fragments and compresses adjacent stats vertically. |
| Reduced motion, color-independent meaning, screen-reader labels, reload/resume, and failure/recovery                                                                  | PASS at root                                 | Fresh/retained root Chromium cases pass. Physical assistive-technology output remains outside supplied infrastructure.                                                   |
| Schema-5/content-v4 state and presets preserve topology, tasks/quotes, unlocks, demand, equipment, money, RNG, metadata, timestamp, and integrity; schema-3/4 recover | PASS for tested paths                        | Unit/Worker migration, current/legacy root recovery, expanded preset reload, and settlement restore tests pass.                                                          |
| Reproducible setup and canonical full verification including lint and both browser packages                                                                           | **FAIL — V-024**                             | A required Pages report makes the next canonical lint scan generated Playwright UI JavaScript. Exact Pages browser behavior was additionally infrastructure-unverified.  |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions.
- V-018 through V-023 remain resolved in retained engine and root browser
  regressions, including reservation quotes, floor farming, active-task
  feedback, guaranteed-failure offers, incurred costs, and additive settlement.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice; it is not a PASS claim.
- B-008 recurred only for the exact Pages browser command: sandbox launch was
  denied and external capacity was unavailable. Root Chromium and fresh visual
  evidence did execute. Because correctable defects independently require FAIL,
  this infrastructure gap does not change the verdict to BLOCKED.

## Findings

### V-024 — Required Pages reports poison the next canonical lint run

- Severity: High.
- Related requirement: AGENTS.md repository testability and reproducible
  canonical full verification; `plan.md` Section 27 and Milestone 2 executable
  acceptance.
- Expected behavior: `./scripts/verify` remains reproducible and rerunnable
  while using its required ignored repository-local browser reports/caches.
- Actual behavior: the Pages Playwright config writes an HTML report to
  `playwright-pages-report`, but ESLint's flat-config ignores omit that
  directory. A later canonical `eslint .` scans bundled Playwright report code
  and fails before project lint, tests, balance, builds, or browsers can run.
- Exact reproduction procedure: execute the documented Pages browser command
  once so its configured report directory exists, then execute `npm run lint`
  or rerun `./scripts/verify` without manually deleting ignored output.
- Concrete evidence: the exact canonical run failed with 1,101 generated-report
  lint errors. `ESLint.isPathIgnored` returns `false` for a file under that
  report tree; the committed focused regression reproduces the boundary.
- Blocks PASS: Yes. The canonical full verification workflow is not
  independently rerunnable in its own documented local-output state.

### V-025 — 320 px / 200% text makes Output module information illegible

- Severity: High.
- Related requirement: `plan.md` Sections 20.2, 20.4, and 27; Milestone 2
  executable acceptance for 320 CSS pixels, 200% text, progressive disclosure,
  and real visual inspection.
- Expected behavior: at 320 CSS pixels and 200% text, the expanded pipeline's
  module names and decision-relevant properties remain readable without
  rotation or pinch zoom.
- Actual behavior: the Output card retains a horizontal icon/copy/grip layout
  after the root font doubles. Its remaining copy column becomes only a few
  characters wide: `Delivery Gate`, throughput/memory/reliability, and status
  render as vertical fragments. Existing overflow and touch-size assertions do
  not detect the loss of legibility.
- Exact reproduction procedure: run
  `npm run test:e2e -- tests/e2e/verifier-round-019.spec.ts`; the test buys and
  activates expansion, sets a 320×850 viewport and 32 px root font, scrolls the
  Output stage into view, captures it, and measures the first word's rendered
  fragments.
- Concrete evidence: the focused browser test measures five rendered line
  fragments for the single word `Delivery`, where one is required. The
  reproducible screenshot is written to
  `output/playwright/round-019-output-200pct-320.png`; source inspection shows
  the fixed horizontal module layout and narrow-width `overflow-wrap: anywhere`.
- Blocks PASS: Yes. A specifically required accessibility viewport loses
  readable player-facing information.

## Unverified areas

- Exact-candidate Pages-subpath service-worker registration, cache isolation,
  and offline reload in Chromium because sandbox launch failed and the exact
  external rerun was rejected by the environment usage limit.
- The original Milestone 0 economy-interest and Milestone 1 uninterrupted
  voluntary 30-minute reconfiguration/tradeoff-explanation gates. D-007 permits
  this bounded slice without claiming those gates passed.
- Exact-candidate GitHub Pages publication and direct-live package equality.
- Physical-device battery, CPU, thermal, platform touch, actual screen-reader
  output, and browsers other than Chromium.
- Deferred Milestone 2 systems and Milestones 3–7/expansions excluded by D-007.

## Residual risks

- The 41-seed progression model verifies one encoded competent strategy; it is
  not an exhaustive proof of human strategy non-dominance.
- Reliability-weighted offers are expectations, not individual-task promises;
  settlements remain discrete.
- Paid cost remains derived rather than stored as a dedicated settlement field.
  Retained exact regressions currently reconcile it across restore.
- Short automated sessions and screenshots cannot establish sustained fun,
  physical-device performance, or assistive-technology quality.
- localStorage denial leaves the in-memory session operable but cannot provide
  cross-reload durability.
