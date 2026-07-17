# Verification round 020

Candidate SHA: `b3960bf5cf9f478d71d321f405892d61dd007831`

VERDICT: FAIL

## Scope and verdict basis

The applicable scope is the owner-authorized **Workstation Expansion I** slice
in `plan.md` and D-007, together with inherited Milestone 0–1 and D-004 through
D-006 behavior. D-007 permits independent automated verification without
turning the original unmeasured human gates into acceptance evidence.

The candidate changes only the narrow module-card presentation, exact ESLint
generated-output ignores, and the handoff. V-024 is resolved: canonical lint is
rerunnable with populated Playwright report, result, trace, and visual-output
trees. The exact round-019 320 CSS-pixel regression also passes, so V-025's
reported 320-pixel failure is resolved.

One independently reproduced accessibility defect still prevents acceptance.
At 393 CSS pixels and 200% text, the new reflow does not activate because its
breakpoint ends at 350 pixels. The Output card retains its horizontal layout and
ellipsizes its name, complete stats, and equipped state. This violates the
explicit two-width scalable-text and real-visual-inspection contract.

The exact Pages-subpath browser suite could not execute fresh in this session.
Chromium is denied Mach-port registration inside the managed sandbox, while the
scoped outside-sandbox request was rejected by the execution environment's
external usage limit. That missing evidence is recorded below; the correctable
V-026 defect independently establishes this round's result.

## Environment and setup

- Host: macOS 26.5.2 (Darwin 25.5.0), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: before any verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup`, reached through the canonical command, recreated the
  lockfile-defined dependency tree and reported zero vulnerabilities.
- Verifier-owned addition: one focused Playwright regression and this immutable
  report. No production code, prior report, decision, handoff, playtest record,
  or `plan.md` content was changed.

## Commands executed and results

| Command or probe                                                                                                                           | Result                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`; `git rev-parse HEAD`                                                                                                 | Clean tracked start; exact supplied candidate matched.                                                                                                                                                                                                                                                                |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, current handoff, prior finding index, and round-019 | Independent applicable checklist and next stable finding ID constructed.                                                                                                                                                                                                                                              |
| Candidate/parent diff and source/config inspection                                                                                         | Candidate changes `.agent/HANDOFF.md`, `eslint.config.js`, and `src/ui/styles.css`; no simulation or deferred-scope behavior changed.                                                                                                                                                                                 |
| `./scripts/verify` with existing generated browser artifacts present                                                                       | Setup, format, lint, typecheck, 73/73 covered unit/property/migration/economy/workflow tests, base balance, 20,001-seed upgrade sweep, 41-seed progression sweep, and root build passed. Root Chromium then failed before page creation at sandbox-denied Mach-port registration, so the wrapper did not reach Pages. |
| Canonical balance outputs                                                                                                                  | Upgrade sweep: 20,001 seeds, zero failures, first module by 4 successes and alternate rig by 14. Progression sweep: 41 seeds, zero failures, expansion at 13.1444–15.5944 hours and full catalogue at 40.6292–44.4014 hours.                                                                                          |
| First exact outside-sandbox `npm run test:e2e`                                                                                             | 48/49 retained cases passed. One offline expanded-preset case transiently observed an empty Process 4 after reload.                                                                                                                                                                                                   |
| Focused offline-preset case with `--repeat-each=5`                                                                                         | 5/5 passed.                                                                                                                                                                                                                                                                                                           |
| Complete retained root suite with only the newly expected-failing round-020 title excluded                                                 | 49/49 passed. The offline-preset failure did not recur.                                                                                                                                                                                                                                                               |
| Retained `tests/e2e/verifier-round-019.spec.ts` within both complete runs                                                                  | 2/2 passed. At 320/200%, `Delivery` occupies one rendered line; 320 and 393 screenshots were produced without page/console errors.                                                                                                                                                                                    |
| Independent visual inspection of `output/playwright/round-019-output-200pct-320.png` and `...393.png`                                      | 320 shows complete Output name/stats/state. At 393, the render visibly shows ellipsized name, stats, and state; V-026.                                                                                                                                                                                                |
| `npm run test:e2e -- tests/e2e/verifier-round-020.spec.ts`                                                                                 | Expected regression failure. The 393/200% Output fields have client widths of 64 px versus scroll widths of 152 px, 234 px, and 85 px.                                                                                                                                                                                |
| `npm run lint` after root/Pages/result/visual artifacts existed; focused round-019 workflow test                                           | Passed; V-024 resolved.                                                                                                                                                                                                                                                                                               |
| `npm run build:pages`                                                                                                                      | Passed for `/goldlocks-engine/`; emitted main, Worker, manifest, and service-worker assets.                                                                                                                                                                                                                           |
| Exact outside-sandbox `npm run test:e2e:pages` request                                                                                     | Not executed. The environment rejected the scoped request because its external usage limit was reached. No workaround or indirect browser execution was attempted.                                                                                                                                                    |
| Focused Prettier, ESLint, TypeScript, and `git diff --check` for verifier artifacts                                                        | Passed before report creation; final checks repeated before commit.                                                                                                                                                                                                                                                   |
| `lsof -nP -iTCP:4173 -sTCP:LISTEN` after tests                                                                                             | No listener remained.                                                                                                                                                                                                                                                                                                 |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                    | Status                                                | Independent evidence                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-007 authorization, bounded scope, and preservation of original human-gate history                                                                                   | PASS                                                  | Plan, decision log, playtest history, tree, and candidate diff agree. No researcher, hype/fear, parallel-pipeline, startup, labor, or later system was introduced.  |
| Milestone 0 numeric prototype and automated balance predicates                                                                                                        | PASS for automated predicates                         | Fresh covered tests and base balance pass. The subjective economy-interest gate remains unmeasured and is not inferred.                                             |
| Milestone 1 constrained portrait pipeline, compatible manipulation, branch, queue, comparison, flows, constraints, and failure/recovery                               | PASS except V-026 presentation                        | Fresh retained Chromium and engine evidence cover tap, keyboard, pointer/touch drag, reorder, branch, queue, policy, preset, flow, pressure, and recovery behavior. |
| D-004 transactional malformed/non-finite handling and bounded finite state                                                                                            | PASS; V-012 remains resolved                          | Retained engine, Worker-boundary, migration, and property regressions pass. Ordinary malformed-input evidence remained high-level.                                  |
| D-005 tutorial, money loop, preset deletion/undo, definitions, reachable guidance, animation/time separation, and PWA behavior                                        | PASS at root; Pages browser unverified                | Fresh retained root comprehension, persistence, offline, animation, and settlement cases pass. Exact Pages browser execution was infrastructure-limited.            |
| D-006 exact-once ownership, owned-only equip/add, decision information, deltas, pacing, and schema-v4 inheritance                                                     | PASS                                                  | Unit/Worker/root browser regressions and 20,001-seed sweep pass.                                                                                                    |
| Exact-once expansion purchase; one active pipeline grows from three to six positions; new positions begin empty                                                       | PASS                                                  | Engine and root-browser purchase, double-activation, topology, and reload cases pass.                                                                               |
| Empty positions valid; all six positions support owned compatible tap, keyboard, replacement/reorder, and touch drag                                                  | PASS functionally                                     | Retained expansion and accessibility cases pass all interaction alternatives.                                                                                       |
| Complete ordered-graph metrics and active-task feedback                                                                                                               | PASS; V-020 remains resolved                          | Retained engine/browser regressions keep bottleneck, warning, pressure, and queue feedback tied to in-flight work.                                                  |
| Eight durable workloads; four initial and four deterministic visible unlocks; persistence/migration                                                                   | PASS                                                  | Catalog/engine inspection, unlock tests, eight-card assertions, and migration regressions pass.                                                                     |
| Per-task FIFO identity, immutable queue-time quote, configuration-dependent cost, zero failed gross, and visible additive settlement                                  | PASS; V-022/V-023 remain resolved                     | Unit and root-browser regressions preserve configured, paid, unpaid, gross, and net equations across restore.                                                       |
| Current quote/demand visible before acceptance; reservations included; cost/net or uncertainty and loss warning shown                                                 | PASS; V-018/V-021 remain resolved                     | Retained engine/browser cases align shown and locked quotes and honestly report deterministic failure.                                                              |
| Completion saturation, simulated-time recovery, immutable accepted quotes, no idle money, nonpositive repeated farming, profitable rotation                           | PASS for automated model                              | Unit/property, structural-floor, and progression checks pass; no-model graphs cannot deliver.                                                                       |
| Clear waiting is confirmed, exact, transactional, and active-task preserving                                                                                          | PASS                                                  | Engine exact-state and retained browser cases preserve active identity/progress/quote and unrelated deterministic/economic state.                                   |
| Fixed 1×/4×/16×/64× schedule equivalence, separate animation, and pause                                                                                               | PASS                                                  | Unit schedule-equivalence and root browser controls/reduced-motion cases pass.                                                                                      |
| Pacing: first module by 5 successes, alternate rig by 15, expansion about 8–16 hours, full catalogue after 24 and by 72 hours                                         | PASS for tested strategies                            | Fresh 20,001- and 41-seed outputs meet each numeric bound.                                                                                                          |
| Bottom tabs sole global routing and progressive disclosure                                                                                                            | PASS at normal scale                                  | Source inspection and retained browser assertions pass; no duplicate page-opening CTA was found.                                                                    |
| 320/393 CSS pixels, 200% text, readable/scalable content, 44-pixel controls, no horizontal overflow, one-handed alternatives                                          | **FAIL — V-026**                                      | 320 reflow passes, but fresh 393/200% measurement and visual inspection show all Output decision-copy fields clipped and ellipsized.                                |
| Reduced motion, color-independent meaning, screen-reader labels, reload/resume, and failure/recovery                                                                  | PASS at root                                          | Retained root Chromium cases pass. Physical assistive-technology output remains outside supplied infrastructure.                                                    |
| Schema-5/content-v4 state and presets preserve topology, tasks/quotes, unlocks, demand, equipment, money, RNG, metadata, timestamp, and integrity; schema-3/4 recover | PASS for tested paths                                 | Unit/Worker migration, current/legacy root recovery, expanded preset reload, and settlement restore tests pass.                                                     |
| Reproducible setup and canonical full verification including lint and both browser packages                                                                           | PASS for V-024 rerun safety; Pages browser unverified | Populated generated trees no longer poison lint. Root browser suite passes outside the sandbox; exact Pages Chromium was unavailable after a usage-limit rejection. |

## Prior finding and blocker regression results

- V-001 through V-023 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions.
- V-024 is resolved: canonical lint and its exact verifier regression pass with
  generated Pages/root/result/visual artifact trees present.
- V-025 is resolved for its exact 320-pixel reproduction: the first word of
  `Delivery Gate` occupies one line and all Output fields are visible.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice. The waiver is not a PASS claim.
- B-008 recurred for exact Pages Chromium availability. It leaves a required
  area unverified, but V-026 already supplies a correctable candidate defect.

## Findings

### V-026 — 393 px / 200% text ellipsizes every Output decision field

- Severity: High accessibility and usability defect.
- Related requirement: `plan.md` Sections 8.2, 20.2, 20.4, and 27;
  Milestone 2 executable acceptance for both 320 and 393 CSS pixels at 200%
  text, progressive disclosure, and real visual inspection.
- Expected behavior: At 393 CSS pixels and 200% text, the expanded pipeline's
  module names and decision-relevant throughput, memory, reliability, and state
  remain readable without rotation or pinch zoom.
- Actual behavior: The candidate reflows module cards only under
  `@media (max-width: 350px)`. At 393 pixels, the Output card retains the
  horizontal icon/copy/grip layout while rem-based content doubles. CSS hides
  overflow and renders ellipses for the name, stats, and state.
- Exact reproduction procedure: Run
  `npm run test:e2e -- tests/e2e/verifier-round-020.spec.ts`. The test buys and
  activates expansion, sets a 393×850 viewport and 32 px root font, scrolls the
  Output card into view, and compares each decision field's client and scroll
  widths.
- Concrete evidence: `Delivery Gate`, `20/m · 0.2 GB · 99.7%`, and `EQUIPPED`
  each receive only 64 CSS pixels of client width while requiring 152, 234, and
  85 pixels respectively. The fresh 393 screenshot visibly renders all three
  with ellipses; the same screenshot flow shows complete content at 320.
- Blocks PASS: Yes. One of the two explicitly required scaled-text portrait
  widths loses decision-relevant player-facing information.

## Unverified areas

- Exact-candidate Pages-subpath service-worker registration, cache isolation,
  and offline reload in Chromium because sandbox launch is denied and the exact
  external request was rejected by the environment usage limit.
- The original Milestone 0 economy-interest and Milestone 1 uninterrupted
  voluntary 30-minute reconfiguration/tradeoff-explanation gates. D-007 permits
  this bounded slice without claiming those gates passed.
- Exact-candidate GitHub Pages publication and direct-live package equality.
- Physical-device battery, CPU, thermal, platform touch, actual screen-reader
  output, and browsers other than Chromium.
- Deferred Milestone 2 systems and Milestones 3–7/expansions excluded by D-007.

## Residual risks

- One retained offline expanded-preset case failed once in the first complete
  browser run, then passed five focused repetitions and the complete 49-case
  rerun. No stable reproduction or candidate-delta cause was established; this
  remains a browser-timing risk rather than a separate finding.
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
