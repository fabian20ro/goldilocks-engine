# Verification round 024

Candidate SHA: `0ebb6d42dbb2c744ec7b5dec250353f64a7b2457`

VERDICT: FAIL

## Scope and verdict basis

Applicable authority: `plan.md`, D-004 through D-007, retained unresolved
findings, and `AGENTS.md`. The owner-authorized Workstation Expansion I slice
remains the scope; D-007 waives the historical unmeasured human playtest gate
for this bounded implementation, but does not waive executable portrait,
accessibility, persistence, economics, or malformed-input requirements.

V-028 is resolved: the candidate rejects unknown runtime command discriminants
and preflights malformed nested command batches before reduction. Direct,
batched, and 1,000-arbitrary-JSON Worker-envelope probes completed without a
throw or invalid state.

Acceptance nevertheless fails on V-029. At both required portrait widths with
200% text, the five-column primary-resource strip clips decision-critical labels
and values. For example, at 320 CSS pixels `Money` has `clientWidth: 44` and
`scrollWidth: 53`; `Compute CU` is `44/74`; `5.6/7` is `44/65`; `Memory use`
is `44/63`; and `6.7/8GB` is `44/91`. At 393 CSS pixels the corresponding
Compute and Memory data are still clipped (`52/84`, `52/65`, `52/72`, and
`52/91`). The visible result is `MON…`, `COM…`, `MEM…`, `5…`, and `6…` rather
than the required primary resource information. This violates `plan.md`
sections 20.2 and 20.4 and the Milestone 2 / D-007 320/393 + 200%-text
acceptance contract.

## Environment and setup

- Candidate identity captured before any Verifier write:
  `git rev-parse HEAD` = supplied candidate SHA; `git status --short` was
  empty.
- Verifier host: macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1; Chromium installed in
  ignored `.cache/ms-playwright` by `./scripts/setup`.
- Exact external canonical evidence: GitHub Actions Linux run
  [29559153848](https://github.com/fabian20ro/goldlocks-engine/actions/runs/29559153848),
  candidate SHA exact, Ubuntu runner, Node v22.23.1, npm 10.9.8, conclusion
  `success`. Downloaded retained artifact
  `verification-evidence-0ebb6d42dbb2c744ec7b5dec250353f64a7b2457`, ID
  `8398703624`, digest
  `sha256:14e6d0a6b429322b2d4b0d318d2944c99caea3ad00175cf95bf2e795b44bd9e2`.
  Its `metadata.txt` names the candidate SHA; its root `test-results/.last-run.json`
  is `passed` with no failed tests.
- Exact Pages deployment run
  [29559153849](https://github.com/fabian20ro/goldlocks-engine/actions/runs/29559153849)
  succeeded. The public root and manifest returned HTTP 200; public
  `asset-manifest.json` exactly matched a fresh local scoped Pages build.
- Read independently before testing: all 1,879 `plan.md` lines, `AGENTS.md`,
  `.codex/agents/verifier.toml`, decisions, handoff, and immutable verification
  history.

## Commands executed and results

| Command or probe                                                                             | Result                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate identity / clean start / exact remote ref                                          | PASS. Local and remote `agent/implementation` resolved to the supplied SHA before Verifier writes.                                                                                                                                                                                            |
| `./scripts/setup`                                                                            | PASS. Locked dependencies and repository-local Chromium installed.                                                                                                                                                                                                                            |
| Candidate `./scripts/verify`                                                                 | Static checks, 85 candidate unit/property tests, numeric/upgrade/progression balance sweeps, and root build passed. Sandboxed Chromium was denied macOS Mach-port registration before page creation; aggregate root and Pages browser phases both ran and failed only for that host boundary. |
| Exact candidate Linux workflow + artifact inspection                                         | PASS. Workflow and its frozen-identity artifact prove the canonical full root and Pages gate on Linux.                                                                                                                                                                                        |
| `npm run test:e2e -- --reporter=dot` outside the managed sandbox                             | PASS, 52/52 root PWA tests in 36.2 s: 320/393 portrait, tap/keyboard/touch drag, queue/market, expansion, migration, persistence, offline, reduced motion, accessibility, and retained regressions.                                                                                           |
| `npm run test:e2e:pages -- --reporter=dot` outside the managed sandbox                       | PASS, 2/2 scoped Pages/offline/service-worker/cache-isolation cases in 3.1 s.                                                                                                                                                                                                                 |
| `./scripts/run`, HTTP probes, interrupt, post-stop probe                                     | PASS. Root and Pages-path HTTP endpoints returned 200 while running; the server stopped after interrupt.                                                                                                                                                                                      |
| Fresh Playwright CLI visual inspection                                                       | PASS for browser launch and semantic snapshot; FAIL for visible 200%-text primary-resource clipping at 320 and 393. Visual inspection used the pinned local application, `resize 320 850` / `resize 393 850`, then `document.documentElement.style.fontSize = '32px'`.                        |
| `npx vitest run src/simulation/verifierRound024.test.ts --coverage.enabled=false`            | PASS, 2/2: 1,000 arbitrary JSON Worker envelopes stay non-throwing/state-valid; malformed nested commands preflight atomically.                                                                                                                                                               |
| `npm run format:check && npm run lint && npm run typecheck && npm test` after Verifier tests | PASS: format, lint, typecheck, 18 files / 87 tests.                                                                                                                                                                                                                                           |
| `npm run test:e2e -- tests/e2e/verifier-round-024.spec.ts --reporter=dot`                    | FAIL, expected verifier finding reproduction: both 320 and 393 cases identify clipped resource labels/values, with exact dimensions above.                                                                                                                                                    |

## Requirement matrix

| Applicable requirement                                                                                                                    | Evidence                                                                                                                                                                                | Result                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Deterministic, versioned, recoverable simulation; valid numeric boundaries                                                                | Exact Linux canonical run; 87 local unit/property tests; direct verifier JSON/envelope fuzz                                                                                             | PASS                                              |
| V-028 unknown direct/batch Worker command recovery                                                                                        | Candidate source inspection; existing V-028 regressions; `verifierRound024.test.ts` direct and 1,000-envelope probe                                                                     | PASS                                              |
| Pipeline build/replace/reorder/branch, constraints, queues, failures, metrics                                                             | 52/52 exact-candidate root Playwright; Linux canonical artifact; build/type tests                                                                                                       | PASS                                              |
| Tutorial, CU/memory/thermal explanation, visual-only animation, time controls, presets                                                    | Retained root browser acceptance and exact Linux canonical evidence                                                                                                                     | PASS                                              |
| Purchase/ownership/equip/add economy and safe duplicate/exact-funds paths                                                                 | Root browser upgrade flows; deterministic 20,001-seed upgrade sweep: no failures; first module by 4 successful jobs and alternate rig by 14                                             | PASS                                              |
| One active 3→6 process-position expansion; empty/bypass positions; touch/tap/keyboard placement and honest presets                        | Root expansion/PWA offline tests; exact Linux canonical evidence                                                                                                                        | PASS                                              |
| Eight staged workloads, visible locks, task identity/locked quotes, demand saturation/recovery, cost/net warning, clear-waiting semantics | Root market/queue browser coverage; unit/property/balance tests; 41-seed progression sweep                                                                                              | PASS                                              |
| Pacing and fixed 1×/4×/16×/64× quanta                                                                                                     | Progression sweep: expansion 13.14–15.59 simulated hours; full catalogue 40.63–44.40 hours; deterministic speed tests                                                                   | PASS                                              |
| Portrait main-screen rule, bottom-nav-only global routing, compact progressive disclosure                                                 | Source/UI inspection; root browser navigation tests                                                                                                                                     | PASS except V-029 scaled-text resource visibility |
| 320/393 portrait, 200% text, 44px controls, no horizontal overflow, readable decision information                                         | Existing browser suite passes target widths/targets/overflow. New dedicated scaled-text resource test fails at both widths; fresh visual screenshot confirms clipped labels and values. | FAIL (V-029)                                      |
| Reduced motion, screen-reader labels, color-independent controls                                                                          | Root browser acceptance and source inspection                                                                                                                                           | PASS                                              |
| Save migration, reload/resume, offline PWA, scoped Pages cache behavior                                                                   | Root and Pages browser suites; exact Linux artifact; public Pages HTTP/asset audit                                                                                                      | PASS                                              |
| Setup, canonical verification, deterministic startup and cleanup                                                                          | `./scripts/setup`, `./scripts/verify`, GitHub Linux workflow, `./scripts/run` HTTP/cleanup probe                                                                                        | PASS                                              |
| Deferred research/hype/parallel-pipeline/later systems absent                                                                             | Source/catalog/scope inspection; no finding                                                                                                                                             | PASS (out of scope, not required)                 |

## Findings

### V-029 — Scaled primary-resource information is clipped at both required portrait widths

- **Severity:** High
- **Related plan requirement:** `plan.md` §20.2 main-screen rule (show three to five primary resources), §20.4 scalable text, and Milestone 2 / D-007 executable 320/393 CSS-pixel + 200%-text acceptance.
- **Expected behavior:** At 320 and 393 CSS pixels with 200% text, resource names and current values remain visibly readable without horizontal document overflow, via reflow/progressive disclosure rather than truncation.
- **Actual behavior:** The five equal columns retain only 44px at 320 and 52px at 393. CSS overflow/ellipsis hides the information: `Money`, `Compute CU`, `Memory use`, `5.6/7`, and `6.7/8GB` are clipped. The 393px layout also leaves the speed description in a needlessly narrow column beside the four fixed-width speed controls.
- **Exact reproduction procedure:**
  1. Run `./scripts/setup`.
  2. Run `npm run test:e2e -- tests/e2e/verifier-round-024.spec.ts --reporter=dot` with the repository-pinned Chromium.
  3. The test opens `/` at 320×850 and 393×850, sets root font size to 32px (200%), and asserts every `.resource-strip dt`/`dd` has `scrollWidth <= clientWidth + 1`.
- **Concrete evidence:** Both cases fail. At 320: Money `44/53`, Compute CU `44/74`, value `5.6/7` `44/65`, Memory use `44/63`, value `6.7/8GB` `44/91`. At 393: `52/60`, `52/84`, `52/65`, `52/72`, and `52/91`, respectively. Fresh visual inspection shows `MON…`, `COM…`, `MEM…`, `5…`, and `6…`.
- **Blocks PASS:** Yes.

## Unverified areas

- Physical mobile-device thermal/battery behavior, non-Chromium engines, haptics/audio, and actual assistive-technology output remain unverified.
- D-007 does not turn the historical subjective thirty-minute human playtest gates into measured evidence. That is documented process risk, not an executable slice blocker.

## Residual risks

- After V-029 repair, retest both portrait widths at 200% through the new dedicated regression plus the complete root and Pages suites. The fix must preserve 44px targets, no horizontal overflow, bottom navigation, and current accessible names.
- Exact externally published candidate CI is clean, but it predates this verifier-only regression test. A repaired implementation candidate needs a fresh exact-SHA Linux canonical run and a fresh verifier round.
