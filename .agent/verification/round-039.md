# Verification round 039 — durable first-session management

Candidate SHA: `1514a44c03c7c9afbc0a8595c35233ce5855316d`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier edit: `git rev-parse HEAD` returned the candidate SHA;
  `git status --short` was empty.
- Candidate scope inspected: first-session engine/state validation, command-deck
  UI, portrait CSS, balance scenario, and retained browser tests. No unrelated
  production repair made by verifier.
- Verifier artifacts: `src/simulation/verifierRound039.test.ts` and
  `tests/e2e/verifier-round-039.spec.ts`; both encode observed regressions.

## Environment and setup

- macOS 26.5.2 (25F84), arm64; Node `v26.5.0`; npm `11.17.0`.
- Repository-pinned Playwright `1.61.1`, browser path
  `.cache/ms-playwright`; app started by Playwright on loopback port 4174.
- Initial sandboxed browser launch was blocked before a page opened by macOS
  Mach-port permission (`bootstrap_check_in ... Permission denied (1100)`).
  Same canonical command rerun with host-browser permission completed. This
  was infrastructure-only, not a candidate finding.
- Post-run `lsof -nP -iTCP:4174 -sTCP:LISTEN`: no listener.

## Commands executed

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before edits | Exact candidate; clean worktree. |
| `E2E_PORT=4174 ./scripts/verify` | Host-browser rerun exit 0 before verifier artifacts: format, lint, typecheck, 27 files / 135 unit-property tests, numeric prototype, 41-seed first-session, 20,001-seed upgrades, 41-seed progression, 101-seed career, 121-seed evaluation, production build, root Playwright 126/126, Pages/offline 2/2. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | 6/6 pass. Generated 20 starter/expanded five-tab portrait screenshots plus two 200%-text Career screenshots; all inspected at original resolution. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/first-session.spec.ts --reporter=line` | 5/5 pass: normal rail, reload, intended handoff, 320/393 + 200% text, touch cancellation, reduced motion. |
| `npx vitest run src/simulation/verifierRound039.test.ts --coverage.enabled=false` | 2/2 fail: malformed completed guide remains `complete`; cleared starter remains non-recoverable after serialize/restore. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-039.spec.ts --reporter=line` | 1/5 pass (normal navigation, no page/console errors); 4/5 fail: starter clear recovery, malformed reload, Escape cancellation, Cancel focus return. |
| `npx tsx -e '…restore/apply command probe…'` | Malformed guide resealed as complete and accepted Queue 10; cleared guide persisted as `observe-settlement` with zero waiting/active work and rejected retry. |
| `npx prettier --write …`; `git diff --check`; `npm run format:check`; `npm run lint`; `npm run typecheck` | All pass after verifier-test formatting. |

## Requirement matrix

| Plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| §20.6 / D-013 three finite objectives; D-014 deterministic command boundary | Normal queue → settle → buy/install route and normal queue lock exercised by focused browser 5/5 and canonical checks. Invalid completed state bypasses the same engine boundary; cleared accepted starter deadlocks it. | FAIL — V-045, V-046 |
| §20.6 reload/offline/malformed recovery; no duplicated or bypassed first action | Normal reload and retained offline/PWA suites pass. Browser-mutated current save reloads as established; direct serialize/restore retains cleared deadlock. | FAIL — V-045, V-046 |
| §20.6 placement begins only explicitly; intended Upgrades→Build handoff; unrelated navigation clears without mutation | Focused happy-path browser route passed, including Details-versus-placement, intended handoff, Jobs switch, and touch cancellation. Keyboard Escape and explicit Cancel fail their required cancellation/focus behavior. | FAIL — V-047 |
| §20.6 two viable forecastable routes; non-dominant unattended safe batching; honest accounting/recovery | Candidate deterministic first-session balance sweep passed all 41 seeds; canonical accounting, demand, progression, and evaluation gates passed. No additional defect found. | PASS |
| §20.6 summaries, feedback, exact-details preservation, reduced-motion equivalence | Focused reduced-motion rail test passed; 20 starter/expanded tab screenshots show coherent visible metrics, labels, and settlement/objective grammar. | PASS |
| §20.5 / D-005 portrait UI: 320×693, 393×742, 200% text, keyboard/touch, no horizontal overflow, five-tab coherence | First-session 320/393 200%-text cases 2/2 pass; command-deck 6/6 pass; original-resolution screenshot inspection completed. Placement keyboard cancellation/focus contract remains broken. | FAIL — V-047 |
| Retained simulation, migration, persistence, worker serialisation, balance, career, evaluation | Candidate canonical unit/property and five deterministic balance gates pass. Current-state malformed first-session validation is insufficient. | FAIL — V-045, V-046 |
| Root/Pages PWA installation, update, offline/recovery, startup and cleanup | Canonical root 126/126 plus Pages/offline 2/2 passed; loopback server was ready and cleaned up. | PASS |
| Scope guard: no new pipelines/routes/narrative/media/navigation; retained command-deck grammar | Candidate diff/source inspection found first-session/UI integration only; no prohibited product system observed. | PASS |

## Findings

### V-045 — malformed current save bypasses the first-session command gate

- Severity: High.
- Related requirement: §20.6 first-session rail and malformed recovery; D-013;
  D-014 durable command boundary.
- Expected: A current save whose completed guide refers to nonexistent task and
  module IDs safely recovers to a guided new session (or equally safe state);
  it must not unlock batch queueing without the required settlement/purchase.
- Actual: `isFirstSessionProgressValid` accepts arbitrary nonempty strings.
  `restoreSimulationState` reseals the malformed completed state; Queue 10 is
  accepted immediately.
- Reproduction:
  1. Clone `createInitialState(39001)`.
  2. Replace `firstSession` with `complete`, task IDs `not-a-task`, and module
     ID `not-a-module`.
  3. Restore, then apply `QUEUE_JOBS` count 10; or mutate that field in
     `goldilocks-simulation-save-v4` and reload at 393×742.
- Concrete evidence: direct probe returned
  `{"guide":{"step":"complete",…},"migration":["integrity-resealed"],"queuedAfterQueue10":10}`.
  Browser probe found no `first-session-guide` after reload. Verifier unit and
  browser tests fail reproducibly.
- Blocks PASS: yes.

### V-046 — clearing the only accepted starter task permanently soft-locks a new run

- Severity: High.
- Related requirement: §20.6 finite sequential rail, player-directed failure
  recovery, reload/offline recovery; D-014 durable command boundary.
- Expected: Clearing must either preserve/protect the accepted starter task or
  safely reset the guide so a player can queue one new starter. This must hold
  after restart; the verifier test intentionally permits either repair.
- Actual: `CLEAR_WAITING_TASKS` removes the task while guide state remains
  `observe-settlement`. Queue commands then reject every retry, waiting/active
  counts are zero, and serialize/restore preserves the deadlock.
- Reproduction:
  1. At 320×693, open Jobs, Pause, and activate `Queue one safe Interactive
     Chat job`.
  2. Activate `Clear waiting tasks (1)` then `Confirm clear waiting`.
  3. Observe step 2 still locks batch/Queue 1 while the UI shows `None
     processing` and `0 waiting`; reload or retry Queue 1.
- Concrete evidence: direct restore probe returned
  `guideAfterRestart.observe-settlement`, `waitingAfterRestart:0`,
  `retryQueued:0`; retry ledger says to let the accepted job settle. Browser
  verifier test fails and captured the same empty queue screen.
- Blocks PASS: yes.

### V-047 — pending placement ignores Escape and Cancel loses focus origin

- Severity: Medium.
- Related requirement: §20.5 item-details focus rule; §20.6 inspection versus
  placement acceptance: `Cancel/Escape restore focus`.
- Expected: From Basic Cleaner details at 393×742, `Place Basic Cleaner in
  Build`, then Escape must clear the pending tray and restore focus to the
  originating Basic Cleaner control. Clicking `Cancel placement` must do the
  same.
- Actual: Escape leaves `Cancel placement` visible. Click Cancel removes the
  tray but leaves the origin inactive, breaking keyboard continuation.
- Reproduction: the two final browser verifier tests perform those exact
  keyboard and button paths.
- Concrete evidence: final pinned Playwright run reports tray count 1 after
  Escape and `Expected: focused; Received: inactive` after Cancel. Screenshot
  shows the pending-placement tray remains after Escape.
- Blocks PASS: yes.

## Unverified areas

- Real iOS/Android hardware, screen-reader speech output, and non-Chromium
  engines; Playwright covers keyboard/programmatic names and touch simulation.
- Exact-SHA deployment was not attempted after acceptance defects were found.
- Storage-quota failure during the new guide transitions was not independently
  injected; existing canonical persistence/PWA coverage passed.

## Residual risks

- At 200% text the compact bottom-tab labels wrap tightly at 320px, though
  screenshots show no clipping/overflow and semantic names/actions remained
  reachable. Revisit during repair with the required visual gate.
- Candidate must repair V-045 through V-047, retain the verifier regressions,
  and receive a fresh round before acceptance.
