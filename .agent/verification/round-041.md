# Verification round 041 — first-session stale recovery and raw portrait geometry

Candidate SHA: `c4d487bd97cfe9dfa714974cbb561d82ff7d2b92`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier artifact: `git rev-parse HEAD` returned exactly
  `c4d487bd97cfe9dfa714974cbb561d82ff7d2b92`; `git status --short` was empty.
- Independently read `plan.md`, `.agent/DECISIONS.md`, role instructions, and
  prior findings V-001 through V-048. Current authorized scope: retained
  Pipeline Toy, Workstation, Career/Evaluation/Replay, command-deck, and
  first-session refinement requirements through §20.6 / D-016.
- Candidate diff inspected: `src/simulation/engine.ts` stale-guide recovery,
  candidate tests, decision, and handoff. No production repair by verifier.
- Verifier artifacts: `src/simulation/verifierRound041.test.ts` and
  `tests/e2e/verifier-round-041.spec.ts` only.

## Environment and setup

- macOS arm64; Node `v26.5.0`; npm `11.17.0`.
- Repository-pinned Playwright `1.61.1`; Chromium from
  `.cache/ms-playwright`; npm cache `.cache/npm`.
- `./scripts/setup` used its repository-local caches and completed.
- Sandbox Chromium launch failed before a test body with macOS
  `MachPortRendezvous` permission denial. The exact canonical command rerun
  with scoped host-browser permission completed normally. This is environment
  infrastructure, not a product finding.
- Playwright started deterministic loopback port `4174`; post-run
  `lsof -nP -iTCP:4174 -sTCP:LISTEN` returned no listener.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier edits | Exact candidate; clean. |
| `E2E_PORT=4174 ./scripts/verify` in sandbox | Static/unit/balance stages passed; Chromium launch blocked solely by macOS sandbox Mach-port restriction. |
| `E2E_PORT=4174 ./scripts/verify` with host browser | Exit 0 before verifier artifacts: format, lint, typecheck, 29 unit/property files / 146 tests; numeric prototype; first-session 41-seed, upgrades 20,001-seed, progression 41-seed, Career 101-seed, evaluation 121-seed sweeps; production build; root Playwright 137/137; Pages/offline 2/2. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | 6/6 pass. Generated and independently inspected all 20 original-resolution starter/expanded screenshots: five tabs × 320×693/393×742. |
| `npx vitest run src/simulation/verifierRound041.test.ts --coverage.enabled=false` | 3/3 fail: stale forged complete ownership/install; stale forged pending ownership; legitimate later-work recovery. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --reporter=line` | 3/6 fail: raw 320×693 Build geometry, forged persisted purchase reload, legitimate paid purchase reload. 320/393 Jobs and 393 Build geometry passed. |
| `npx prettier --check src/simulation/verifierRound041.test.ts tests/e2e/verifier-round-041.spec.ts`; `npx eslint ... --max-warnings 0`; `npm run typecheck` | All pass. |
| `git diff --check c625184..c4d487b`; post-run `lsof` | No diff whitespace error; no loopback listener. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| Deterministic engine; worker boundary; numeric/property/balance gates (§§23–27, Milestones 0–3.5) | Canonical 146 tests, five declared balance sweeps, production build. | Pass |
| Workstation one-pipeline topology, workload market, expansion, quote/demand, clear-waiting, 1×/4×/16×/64× (§§8–10, Milestone 2, D-007) | Canonical engine/browser suites, including retained V-015/V-016 regressions and expansion screenshots. | Pass |
| Career, evaluation, causal postmortem, replay/migration (§§11, 16–18, Milestone 3, D-010/D-011) | Canonical Career/evaluation/replay/migration and retained V-031–V-035 checks. | Pass |
| Root and Pages PWA installation, atomic update, offline/recovery, deterministic startup/cleanup (D-008) | Canonical root 137/137 includes update/rollback/scope cases; Pages/offline 2/2; listener cleanup confirmed. | Pass |
| Command-deck glyph/detail/placement grammar, five tabs, visual coherence (§20.5, D-012) | Canonical component/browser checks; focused 6/6 command-deck run; visual inspection of all 20 required portrait screenshots. | Pass except V-051 initial 320 geometry |
| 320×693 and 393×742 initial above-fold Build and Jobs affordances (§20.5 required verification evidence) | Fresh raw-geometry probe without `scrollIntoViewIfNeeded`: 393 Build/Jobs and 320 Jobs pass; 320 Build stage control is below fixed nav. | Fail — V-051 |
| First-session finite queue → settlement → buy/install rail; durable command authorization (§20.6, D-013/D-014) | Normal rail, explicit placement, Escape/Cancel, touch, reduced motion, and route balance passed canonical. Integrity-stale saves can still fabricate ownership/purchase. | Fail — V-049 |
| Malformed/reload/offline recovery without duplicate or skipped purchase (§20.6, D-015/D-016) | Retained V-039/V-040 tests pass. New engine and 393 browser probes expose forged ownership acceptance and loss of legitimate paid progression after later work. | Fail — V-049, V-050 |
| Two viable pre-purchase routes; non-dominant safe batching; exact accounting/reward feedback (§20.6) | Canonical first-session 41-seed and upgrades 20,001-seed sweeps plus browser rail/settlement tests. | Pass |
| Portrait accessibility: keyboard, touch/drag, 200% text, reduced motion, 44px controls, no horizontal overflow (§20.4–20.6) | Canonical retained browser suite and command-deck visual inspection pass. Required initial actionable Build control remains hidden at 320×693. | Fail — V-051 |
| Earlier verifier findings V-001–V-048 | Canonical suites include retained regression files; V-039/V-040 browser cases pass 9/9 within the 137 root cases. | Pass for prior findings |
| Research, creators, hype/fear, workforce, startup/laboratory/endgame | Explicitly deferred by current milestone/decisions; candidate introduces none. | N/A / scope preserved |

## Findings

### V-049 — integrity-stale save can fabricate the mandatory first purchase

- Severity: High.
- Related requirement: §20.6 three sequential objectives, inspection versus
  placement, malformed-state recovery; D-013 through D-016; D-006 exact-once
  purchase/ownership boundary.
- Expected behavior: A save with invalid integrity must not convert a manually
  inserted paid module into valid first-session progress. Ownership and a slot
  assignment alone are not proof of the required paid purchase. Recovery must
  fall back safely rather than enable placement or Queue 10.
- Actual behavior: `hasSafeUnsealedFirstSessionProgress` accepts a nonstarter
  module solely because it is in `ownedModuleIds` and, for `complete`, present
  in a compatible slot. It does not verify any paid-purchase evidence. A
  `precision-cleaner` can be inserted with money unchanged, then a corrupted
  record is resealed as `buy-and-install` or `complete`.
- Exact reproduction:
  1. Start `createInitialState(41001)`, queue one Interactive Chat job, and
     `tick(..., 60)` to record the genuine starter settlement.
  2. Add `precision-cleaner` to `ownedModuleIds` without `BUY_MODULE`; place it
     in `prepare`; replace `firstSession` with matching `complete` IDs. Leave
     the old integrity digest untouched.
  3. `restoreSimulationState` returns `complete`; `QUEUE_JOBS` count 10 queues
     10 jobs. The shorter forged `buy-and-install` variant likewise survives,
     then an ordinary `PLACE_MODULE` completes the rail without a purchase.
  4. Browser equivalent at 393×742 is in
     `tests/e2e/verifier-round-041.spec.ts`: mutate persisted inventory/slot/
     guide, reload, and observe no first-session guide.
- Concrete evidence: direct probe recorded money `1.335` before and after the
  forged installation, restored `complete`, and `queued:10`; no ledger purchase
  exists. The new unit probe fails `complete` vs expected `queue-starter`; the
  pinned browser probe times out waiting for required `step 1 of 3` after
  reload.
- Blocks PASS: yes.

### V-050 — legitimate paid first purchase is discarded after later jobs

- Severity: High.
- Related requirement: §20.6 reload/offline recovery and no duplicate/lost
  purchase; D-013 first-session resumption; D-015 corruption-safe recovery;
  D-016 completed-guide recovery.
- Expected behavior: A player who legitimately earns money through later jobs,
  buys and installs the first module, then experiences benign stale persistence
  damage retains that completed first-session progress and durable purchase.
- Actual behavior: Recovery requires `lastSettlement.taskId` to equal the first
  starter task. `lastSettlement` necessarily becomes the most recent later job
  while earning the $4 needed for Precision Cleaner. A harmless stale field
  (`lastUpgradeNotice: null`) then sends the entire save to `createInitialState`.
- Exact reproduction:
  1. Queue and settle the required starter, then queue/settle later Interactive
     Chat jobs until money reaches `$5.226` (four successful jobs).
  2. Buy Precision Cleaner for `$4.00` and install it in Prepare through normal
     commands/UI; resulting money `$1.226`, guide `complete`.
  3. Change only `lastUpgradeNotice` to `null` without recomputing integrity,
     serialize, and restore/reload.
  4. Observe `queue-starter`, money `$0`, starter topology, and a visible new
     step-1 guide instead of the completed player state.
- Concrete evidence: the new engine control fails `queue-starter` vs expected
  `complete`. The real 393×742 Playwright flow buys/installs through the UI,
  damages only that unrelated field, reloads, and receives one guide where it
  expects none; captured screenshot shows the reset `$0` run.
- Blocks PASS: yes.

### V-051 — first actionable Build control is hidden by bottom navigation at 320×693

- Severity: High.
- Related requirement: §20.5 shared portrait shell and required geometry
  evidence; portrait-first/one-handed non-negotiable constraints.
- Expected behavior: At initial 320×693 load, without prior vertical scroll,
  the resource HUD, objective/bottleneck, and first actionable pipeline control
  must all be visible above bottom navigation.
- Actual behavior: At raw scroll position zero, the first pipeline control ends
  at y=`734.875`; fixed bottom navigation starts at y=`619.21875`. The stage
  controls are entirely beneath it. The existing command-deck test calls
  `scrollIntoViewIfNeeded()` before measuring, masking the required initial
  state.
- Exact reproduction:
  1. Use repository-pinned Playwright with viewport `320×693` and `page.goto("/")`.
  2. Assert `.app-scroll-region.scrollTop === 0`.
  3. Measure first `data-testid=pipeline` button and `Primary` navigation;
     compare control bottom to nav top.
- Concrete evidence: new raw-geometry browser test fails `734.875 <= 619.21875`.
  Its captured original-resolution screenshot shows only the pipeline heading
  above navigation. Same probe passes at 393×742; selected workload/Queue 1
  geometry passes at both widths.
- Blocks PASS: yes.

## Unverified areas

- Physical iOS/Android device behavior, battery/thermal budget, native
  screen-reader speech, and non-Chromium engines.
- Exact-SHA deployment/build identity was not attempted: acceptance defects
  prohibit release validation.
- Storage-quota interruption timing during persistence writes was not injected;
  canonical persistence/PWA suites passed, but V-049/V-050 establish distinct
  stale-state defects.

## Residual risks

- Browser acceptance required host permission because macOS sandbox Chromium
  cannot create its Mach-port rendezvous server. The scoped host rerun is
  reproducible with the repository-pinned browser/cache and passed all
  candidate-owned canonical cases.
- Native emoji appearance varies by platform; the inspected screenshots retain
  text labels and visible status wording.
- Repair must retain verifier regressions, restore raw 320×693 above-fold
  behavior without programmatic scrolling, and preserve valid pre-guide
  migration plus legitimately resealed completed runs.
