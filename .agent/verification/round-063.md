# Verification round 063 — Phase 3 Build/Upgrades density

Candidate SHA: `b3e4f2fa47e39eda755fe253f0e0ee4f50ca772a`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `b3e4f2fa47e39eda755fe253f0e0ee4f50ca772a`. It exactly matched the
  Orchestrator-supplied candidate. Initial `git status --short` was empty.
- Independently reviewed `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, and immutable reports
  through round 062. Checklist: current Milestones 0–3.6; §20.5, §20.6, and
  §20.7 Phases 0–3; D-004, D-006–D-027; retained V-001–V-065; deterministic
  Worker/persistence/PWA/security, command-deck accessibility, first-session,
  Career, and Phase 3 density requirements. Deferred Research and later
  systems remain inapplicable.
- Candidate diff against parent `23cebccf5909ad8ff9d7b6d938e6fa493e031217`:
  narrow shared module selector, Build/Upgrades composition, Phase 3 styles,
  component/E2E coverage, D-027, and handoff. No simulation, schema, Worker,
  PWA, or dependency-manifest production change.
- Handoff, candidate tests, comments, and prior claims were treated as hints.
  Verifier added only the two regression tests below; no production code was
  changed.

## Environment and setup

- Darwin 25.6.0 arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1.
- Repository-pinned Playwright 1.61.1; local cache/browser at
  `.cache/ms-playwright`; loopback-only managed Playwright servers. No global
  browser profile or in-app browser evidence used.
- `./scripts/run` started successfully on `127.0.0.1:4173`; root and worker
  readiness requests returned HTTP 200. The verifier-owned process was then
  stopped; focused Playwright server/process audits were clean afterward.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| Candidate SHA/status; parent diff/name/status; `git diff --check` | Pass: exact frozen candidate; clean initial tree; no whitespace error. |
| `npm run build` | Pass. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` | Pass after verifier-test formatting. |
| `npm test -- --exclude src/ui/verifierRound063.test.ts` | Pass: existing corpus 41 files / 191 tests. The exclusion is only to distinguish retained corpus behavior from the intentionally failing verifier regression; no test was weakened or removed. |
| `npm audit --omit=dev --audit-level=high` | Pass: `found 0 vulnerabilities`. |
| `E2E_PORT=4867 npm run test:e2e -- tests/e2e/phase-3-density.spec.ts tests/e2e/first-session.spec.ts tests/e2e/round-015-expansion.spec.ts` | Pass: 16/16. Phase 3 groups/details/every-item route; 320/393; 100%/200%; placement/tab cancellation/Escape/focus/touch; first-session; expansion/preset/offline resume. |
| `E2E_PORT=4870 npm run test:e2e -- tests/e2e/game.spec.ts tests/e2e/verifier-round-040.spec.ts tests/e2e/evaluation-replay.spec.ts` | Pass: 17/17. One-pipeline, pointer/touch drag, failure/recovery, presets, malformed-state recovery, offline reload, 200% focus, evaluation/replay. |
| `E2E_PORT=4871 npm run test:e2e -- tests/e2e/career-hierarchy.spec.ts tests/e2e/verifier-round-057.spec.ts tests/e2e/verifier-round-058.spec.ts tests/e2e/verifier-round-059.spec.ts` | Pass: 7/7. Career hierarchy/keyboard, response ordering, concurrency, failed-save durable recovery. |
| `E2E_PORT=4868 npm run test:e2e -- tests/e2e/pwa-update.spec.ts`; `E2E_PORT=4869 npm run test:e2e:pages` | Pass: PWA update/failure/recovery/cache isolation 16/16; Pages worker-backed offline 2/2. |
| Independent pinned-Playwright geometry probe at 320×693/393×742, 100%/200%, reduced motion, placement, Escape | Pass for document width, 44px visible controls, no nested pipeline scroll, tray/nav boundary, no page/console errors, and async focus return. It exposed the separate internal tray-content failure below. |
| Direct pure selector probe: established state, $30, then real `BUY_MODULE` commands for Precision Cleaner, Adaptive Context, Efficient Runtime | Fail: selected Input compact Owned cards were `request-buffer` (compatible), `efficient-runtime` (incompatible), `adaptive-context` (incompatible); compatible owned `stream-intake` was fifth. |
| Direct pinned-Playwright 393×742 UI route: set test funds; buy the same three modules through Upgrades; Build → Input; then toggle Show every | Fail: exact same three default DOM cards; Stream Intake appeared only after `Show every module (17)`. No page/console errors. |
| `npm test -- src/ui/verifierRound063.test.ts` | Expected verifier regression failure: default compact Input cards do not contain `stream-intake`. |
| `E2E_PORT=4873 npm run test:e2e -- tests/e2e/verifier-round-063.spec.ts` | Expected verifier regression failure: 2/2 required 200% placement-tray cases fail. At 320px tray top was `-1112.765625`; at 393px copy/cancel overlap count was `7`. |

The aggregate `./scripts/verify` run was not recorded as a completed result:
its replacement invocation was stopped during the CPU-heavy upgrade sweep after
the first correctable Phase 3 defect was confirmed. No aggregate PASS is
claimed. Focused current-candidate commands above cover the changed behavior
and material retained browser/PWA paths; the unrun balance aggregate is listed
below rather than silently inferred.

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Phase 3 rail and selected-stage context before compact inventory | 16/16 Phase 3/first-session/expansion browser suite; direct 320/393 probe. | Satisfied. |
| §20.7 default next actionable subset; D-027 selected installed item, then compatible placement choices | Pure selector and actual 393px UI adversarial state; verifier unit regression. | **Failed — V-066.** |
| Owned/Affordable/Locked live grouping; price/ownership/compatibility/requirements; every-item route | Candidate behavior exercised at starter/funded/expanded states; 16/16 Phase 3 suite; direct Show-every recovery route. | Satisfied except default ranking in V-066. |
| Existing Details surface/comparison delta; no second drawer; selected-only replace/remove/bypass | Phase 3 details route; game/first-session/round-040 browser coverage; source audit. | Satisfied. |
| Explicit Place in Build, pending tray, compatible snap, tab/Escape/Cancel clearing, keyboard/focus and touch drag | 16/16 Phase 3/first-session/expansion; 17/17 game/round-040/evaluation; direct async focus probe. | Satisfied at ordinary scale; 200% tray usability fails in V-067. |
| Workstation Expansion I remains one ordered 3→6 pipeline, empty/bypassed, no capacity-stat claim | 16/16 suite including expansion buy/activation, empty positions, placement, preset reload/offline resume; candidate diff/source audit. | Satisfied. |
| Phase 3 portrait geometry: 320×693 and 393×742, 100%/200%, no horizontal overflow/nested vertical trap/undersized target/obscured tray | Independent four-state probe: width/no nested scroll/44px/tray-nav boundary pass; screenshots and verifier E2E show internal tray cancellation/content failure at 200%. | **Failed — V-067.** |
| D-012/D-013–D-018 retained command deck, first-session authorization, queue/quote, malformed recovery, persistence, offline, keyboard/touch/reduced motion | Existing 191-unit corpus; focused 16/16 and 17/17 browser suites. | Satisfied on exercised paths. |
| Deterministic Worker, numeric/integrity boundaries, one pipeline, balance/progression boundaries | Candidate diff excludes simulation/Worker/schema; 191 current unit/property tests and focused one-pipeline browser evidence pass. | Preserved for changed scope; aggregate balance sweep not re-run (unverified item below). |
| D-019–D-025 Career session draft, response ordering, concurrency, durable persistence/recovery | Focused 7/7 Career/recent verifier browser tests plus current unit corpus. | Satisfied. |
| D-008 root and Pages PWA install/update/rollback/malformed-deployment/cache-isolation/offline | Current PWA update 16/16 and Pages 2/2. | Satisfied. |
| D-026 production dependency security and reproducible build/startup | Build, documented startup/readiness/cleanup, production audit high/critical 0. | Satisfied. |
| Scope: no Research/creator/fear/workforce/startup/laboratory/parallel-pipeline additions | Candidate diff/source audit. | Satisfied. |

## Findings

### V-066 — Compact Build ranking hides the next compatible placement choice

- **Severity:** High.
- **Related requirement:** §20.7 Phase 3 default next actionable subset and
  exit gate; D-027 presentation boundary.
- **Expected behavior:** For a selected Build stage, its installed module is
  first, followed by compatible owned placement choices within the default
  three-card subset.
- **Actual behavior:** `selectModuleInventory` ranks paid owned modules before
  selected-stage compatibility. For selected Input, paid process modules fill
  positions 2–4 while owned compatible Stream Intake is fifth; it is reachable
  only through the distant full-catalogue route.
- **Exact reproduction:** Use `createEstablishedScenarioState(63063)`, set
  money to $30, buy Precision Cleaner, Adaptive Context, and Efficient Runtime,
  then select `source` with `prioritizeUnplacedOwned: true`. Or, at 393×742,
  set the test save to $30, buy the same three through Upgrades, open Build,
  select Input, and inspect the compact Owned drawer.
- **Concrete evidence:** selector output and live DOM both return
  `request-buffer`, `efficient-runtime`, `adaptive-context`; Stream Intake is
  compatible but only appears after `Show every module (17)`. Source ordering
  is visible at `src/ui/moduleInventory.ts:154-165`. The committed verifier
  unit regression `src/ui/verifierRound063.test.ts` fails on the candidate.
- **Blocks PASS:** Yes.

### V-067 — 200% text makes the sticky placement tray unusable

- **Severity:** High.
- **Related requirement:** §20.7 Phase 3 320/393 200%-text geometry and “no
  obscured sticky tray” verification; D-027 evidence policy; retained D-012
  accessibility equivalence.
- **Expected behavior:** At both required portrait widths and 200% text, the
  full placement tray, its explanatory state, and Cancel action remain visible,
  non-overlapping, and usable.
- **Actual behavior:** At 320×693 the tray becomes 1613px high; after its own
  `scrollIntoViewIfNeeded`, its top is `-1112.765625`px and its Cancel action
  is offscreen. At 393×742, the copy collapses to 10px width and overlaps the
  285px Cancel action in seven text-client rectangles.
- **Exact reproduction:** Start the normal app, choose Build → Input → Stream
  Intake → `Place Stream Intake in Build`, inject `:root { font-size: 200% }`,
  and scroll the tray into view at 320×693 and 393×742. Run
  `E2E_PORT=4873 npm run test:e2e -- tests/e2e/verifier-round-063.spec.ts`.
- **Concrete evidence:** committed pinned-Playwright regression fails both
  widths with the exact measurements above and stores failure screenshots and
  trace artifacts locally. The 320px original-resolution screenshot shows the
  tray copy one-character-wrapped while Cancel is absent; the 393px screenshot
  shows the Cancel target covering the copy.
- **Blocks PASS:** Yes.

## Unverified areas

- The full aggregate `./scripts/verify` did not complete to a retained final
  transcript in this round. Its fresh 20,001-seed upgrade sweep and remaining
  aggregate balance groups were not rerun after V-066 made acceptance
  impossible. Focused current-candidate unit, browser, PWA, build, startup,
  and security evidence is recorded above; no balance result is inferred.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  actual storage quota exhaustion, external deployment, push, or exact-SHA
  hosted Pages publication was performed.

## Residual risks

- Repair must preserve the current pure-selector boundary, the one-pipeline
  simulation/Worker authority, purchase economics, Details semantics, and
  explicit placement/focus behavior while moving compatibility ahead of the
  paid-owned preference only for selected Build context.
- Repair of the 200% tray must be visually rechecked at both required portrait
  widths, including a fully visible Cancel action, non-overlapping copy,
  tray/nav clearance, keyboard Escape/Cancel focus restoration, and touch drag.
