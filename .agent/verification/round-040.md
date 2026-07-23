# Verification round 040 — first-session recovery authority

Candidate SHA: `8ef1d73af2874a195208b56ee2c23bbda60d968a`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier edit, `git rev-parse HEAD` returned the candidate SHA and
  `git status --short` was empty.
- Independently read `plan.md`, `.agent/DECISIONS.md`, all earlier verification
  reports, and the candidate production diff. Current scope: retained
  milestones through first-session refinement, especially §20.5, §20.6 and
  D-013 through D-015. Research, export, and other deferred plan work remains
  out of scope under recorded decisions.
- Verifier-owned regressions: `src/simulation/verifierRound040.test.ts` and
  `tests/e2e/verifier-round-040.spec.ts`. No production code changed.

## Environment and setup

- macOS 26.5.2 (25F84), arm64; Node `v26.5.0`; npm `11.17.0`.
- Repository-pinned Playwright `1.61.1`; browser cache `.cache/ms-playwright`;
  Playwright starts the app on loopback port 4174 and cleans it up.
- Initial sandboxed `./scripts/verify` could not launch Chromium: macOS
  `bootstrap_check_in ... Permission denied (1100)` from Mach-port setup.
  A scoped host-browser rerun completed. This is sandbox infrastructure, not a
  candidate defect.
- After every browser run, `lsof -nP -iTCP:4174 -sTCP:LISTEN` found no listener.

## Commands executed

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before edits | Exact candidate SHA; clean worktree. |
| `E2E_PORT=4174 ./scripts/verify` | Sandboxed run passed setup, format, lint, typecheck, unit/property stages, and balance gates, then Chromium launch failed solely on sandbox Mach-port permission. |
| `E2E_PORT=4174 ./scripts/verify` (host-browser rerun) | Exit 0 before verifier artifacts: format, lint, typecheck; 28 test files / 139 unit-property tests; numeric prototype; 41-seed first-session; 20,001-seed upgrades; 41-seed progression; 101-seed career; 121-seed evaluation; production build; root Playwright 133/133; Pages/offline 2/2. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | 6/6 pass. Inspected all 22 original-resolution generated screenshots: starter/expanded five-tab views at 320×693 and 393×742, plus 200%-text Career views. |
| `npx tsx -e '…create/restore/mutate/apply command probes…'` | A fresh current save with deleted guide restored as legacy `complete` and accepted Queue 10. A settled save forged with owned-but-uninstalled `precision-cleaner` also restored `complete` and accepted Queue 10. Benign unsealed and malformed pending/settled variants otherwise failed safe. |
| `npx vitest run src/simulation/verifierRound040.test.ts --coverage.enabled=false` | 1/3 pass: integrity-valid pre-guide migration works. 2/3 fail: deleted current guide and forged uninstalled purchase both restore as `complete`. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-040.spec.ts --reporter=line` | 2/4 pass: clear → persisted reset → reload at 320px, and 320px/200% Escape focus restoration/no overflow. 2/4 fail: both corrupted-save bypasses at 393px. |
| `npx prettier --write src/simulation/verifierRound040.test.ts tests/e2e/verifier-round-040.spec.ts .agent/verification/round-040.md`; `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` | All pass. |

## Requirement matrix

| Plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| Retained milestones 0–3.5: deterministic simulation, economy, migration, persistence, worker serialization, career and evaluation | Canonical static checks, 139 unit/property tests, five deterministic balance/evaluation gates, and production build all pass. | PASS |
| §20.5 / D-005 portrait command deck: 320×693, 393×742, 200% text, touch/keyboard, no horizontal overflow, five-tab coherence | Command-deck 6/6 and original-resolution visual inspection pass. New 320px/200% keyboard probe finds no horizontal overflow or page/console error. | PASS |
| §20.6 / D-013 and D-014 normal first-session rail, explicit placement, route/accounting, reload/offline and recovery | Canonical first-session, balance, root PWA and Pages/offline suites pass. Candidate clears an accepted waiting starter to a persistent step-one retry state. | PASS for normal and cleared-starter paths |
| §20.6 placement cancellation: Escape/Cancel restores originating control | New 320px/200% Playwright probe passes: Escape removes the tray and focuses Basic Cleaner. Retained 393px canonical coverage passes. | PASS — V-047 resolved |
| §20.6 malformed-state/reload boundary; D-013 finite objectives; D-014 durable command authorization; D-015 corruption-safe first-session recovery | Two independently mutated stale/current saves unlock established state and Queue 10 without a real completed buy-and-install route. | FAIL — V-048 |
| D-015 legitimate integrity-valid pre-guide migration | New unit regression seals a no-guide legacy fixture and confirms `schema-v7-first-session-guide-added`, complete guide, and Queue 10 remain available. | PASS |
| Root/Pages PWA installation, startup, offline/recovery and cleanup | Canonical root 133/133 and Pages/offline 2/2 pass; deterministic loopback startup and cleanup observed. | PASS |
| Scope guard: first-session refinement only; no unsupported product system introduced | Candidate diff inspection shows engine/UI first-session recovery, focused tests, decision, and handoff changes only. | PASS |
| Deferred plan sections: research, exports, packaging/release after acceptance | Deferred by recorded decisions or gated on acceptance; no candidate obligation established for this round. | N/A |

## Findings

### V-048 — stale first-session state can skip the mandatory purchase-and-install objective

- Severity: High.
- Related requirement: §20.6 sequential three-objective rail, malformed/reload
  recovery and no bypass; D-013; D-014 durable command boundary; D-015
  corruption-safe first-session recovery.
- Expected behavior: An integrity-stale current-schema save that deletes or
  fabricates its rail must recover to a safe fresh guided state. Queue 10 must
  remain unavailable until a real starter settles and a meaningful module is
  both bought and installed. An integrity-valid pre-guide legacy save may still
  migrate as D-015 permits.
- Actual behavior: `restoreSimulationState` treats an absent `firstSession` as
  legacy before checking that the original current save failed integrity, then
  writes a complete guide and reseals it. For an unsealed fabricated `complete`
  guide, its safety check accepts matching settled task IDs plus module ownership
  but does not require the purported module to be installed. Both paths skip
  the mandatory purchase-and-install objective and enable batching.
- Exact reproduction:
  1. Run `npx vitest run src/simulation/verifierRound040.test.ts --coverage.enabled=false`.
     The first test deletes `firstSession` from `createInitialState(40001)`;
     restore returns `complete`, and `QUEUE_JOBS` count 10 queues work. The
     third test queues and settles one real starter, adds owned
     `precision-cleaner` without installing it, forges `complete`, restores,
     and again queues 10.
  2. Run `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-040.spec.ts --reporter=line`.
     At 393×742, delete `firstSession` from
     `goldilocks-simulation-save-v4` then reload; separately settle the
     starter, forge an owned-but-uninstalled `precision-cleaner` complete
     rail, then reload. Both reloads omit the required step-one guide.
- Concrete evidence: the direct mutation probe returned respectively
  `restoredGuide complete`, `migration ["schema-v7-first-session-guide-added",
  "integrity-resealed"]`, `queued 10`; and `guide complete`,
  `precisionOwned true`, `precisionInstalled false`, `queued 10`.
  The verifier unit run reports 2 failures/1 pass; the pinned browser run
  reports 2 failures/2 passes. Its valid sealed legacy control passes, proving
  safe current-save rejection need not remove the documented migration path.
- Blocks PASS: yes.

## Unverified areas

- Real iOS/Android hardware, screen-reader speech output, and non-Chromium
  engines. Pinned Playwright exercised semantic controls, keyboard, touch-like
  interaction, portrait sizes, 200% text, reload, offline suite, and errors.
- Exact-SHA deployment/release was not attempted because acceptance fails.
- Storage-quota failure during guide persistence was not independently injected;
  canonical persistence/PWA coverage passed.

## Residual risks

- A reload issued before the worker acknowledges a clear command can retain the
  pre-command waiting-task save; after acknowledgement the required clear/reset
  state persists and passes the new reload probe. Reassess this timing boundary
  with the V-048 repair.
- At 200% text, compact bottom-tab labels wrap tightly at 320px, but inspected
  screenshots show no clipping/overflow and controls remain reachable.
- Repair V-048 without weakening the intact sealed-legacy migration regression,
  then request a fresh verification round.
