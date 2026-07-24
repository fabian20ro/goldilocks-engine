# Verification round 042 — ledger-correlated recovery and portrait command deck

Candidate SHA: `22700e966dd8af447c69ab1a647b0abbb43cb7b9`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier artifact, `git rev-parse HEAD` returned exactly
  `22700e966dd8af447c69ab1a647b0abbb43cb7b9`; `git status --short` was empty.
- Independently read `plan.md`, `.agent/DECISIONS.md`, role instructions, and
  prior immutable reports. Applicable scope: the retained Pipeline Toy and
  Workstation, Career/Evaluation/Replay, PWA, command-deck, and §20.6
  first-session refinement through D-017. Research and later deferred systems
  remain out of scope.
- Inspected candidate production changes in `src/simulation/engine.ts`,
  `src/ui/App.tsx`, and `src/ui/styles.css` independently. Verifier changed no
  production file.
- Verifier-authored artifacts: `src/simulation/verifierRound042.test.ts` and
  `tests/e2e/verifier-round-042.spec.ts`.

## Environment and setup

- macOS 26.5.2 (25F84), arm64; Node `v26.5.0`; npm `11.17.0`.
- Repository-pinned Playwright `1.61.1`; Chromium and npm caches remained
  repository-local at `.cache/ms-playwright` and `.cache/npm`.
- `./scripts/setup` completed with the pinned browser. `./scripts/run` starts
  Vite only on deterministic loopback `127.0.0.1:4173`; Playwright uses the
  checked-in `scripts/run-e2e` loopback launcher.
- Sandboxed Chromium cannot create macOS's Mach-port rendezvous server
  (`Permission denied (1100)`) before any test body. The same frozen candidate
  was rerun with scoped host-browser permission; this is test infrastructure,
  not a product defect.
- After manual and Playwright launch cleanup,
  `lsof -nP -iTCP:4173 -sTCP:LISTEN` returned no listener.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier edits | Exact candidate SHA; clean worktree. |
| `./scripts/setup` | Pass; repository-local npm/Chromium setup. |
| `E2E_PORT=4174 ./scripts/verify` in sandbox | Setup, format, lint, typecheck, unit/property, balance, and build stages passed; Chromium launch alone blocked by the macOS sandbox Mach-port restriction. |
| `E2E_PORT=4174 ./scripts/verify` with scoped host browser access | Exit 0 before verifier artifacts: format, lint, typecheck; 30 unit/property files / 150 tests; numeric prototype; first-session 41-seed, upgrades 20,001-seed, progression 41-seed, Career 101-seed, and evaluation 121-seed sweeps; production build; root Playwright 143/143; Pages/offline 2/2. |
| Direct deterministic engine probes for stale forged inventory/topology, authentic paid purchase after later settlement, sealed legacy migration, sealed removal, and 80-event ledger rollover | Candidate rejects forged owned/installed state without retained paid record; preserves the authentic pending purchase; preserves original-seal migration/reconfiguration; and resets an integrity-stale state only after its necessary retained evidence rolls out. |
| `npm test -- src/simulation/verifierRound042.test.ts` | Test bodies passed 3/3, but the deliberately scoped command exits nonzero because repository-wide coverage thresholds apply to a one-file run. Rechecked without coverage below; full canonical coverage gate already passed. |
| `./node_modules/.bin/vitest run --coverage.enabled=false src/simulation/verifierRound042.test.ts` | Pass, 3/3. Covers later-settlement paid-before-install recovery/no second deduction, bounded-ledger fail-closed recovery, sealed pre-guide migration, and sealed reconfiguration. |
| `npm run test:e2e -- tests/e2e/verifier-round-042.spec.ts --reporter=line` with scoped host browser access | Pass, 3/3. Pinned Chromium captured all starter/expanded five-tab views at raw 320×693 and 393×742; asserted no horizontal overflow, no nested pipeline scroll, 44px visible buttons, raw first Build control above nav, expansion topology, no page/console errors, and 320px/200% queue/detail/Escape focus behavior. |
| Original-resolution visual inspection of `test-results/verifier-round-042/*.png` | Pass. Inspected all 20 raw five-tab starter/expanded screenshots plus 320px/200% Jobs and Build screenshots. Shared command-deck palette/labels are coherent; raw key actions are visible; scaled routes remain readable/reachable without horizontal overflow. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` | All pass after verifier artifacts. |
| `sw_vers`; `uname -m`; `node --version`; `npm --version`; `./node_modules/.bin/playwright --version`; post-run `lsof` | Environment confirmed; no lingering loopback server. |

## Requirement matrix

| Applicable plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| Deterministic engine, Worker protocol, numeric safety, migration/state validity, and static/build checks (§§23–27; retained Milestones 0–3.5) | Frozen-candidate canonical static gates, 150 unit/property tests, five deterministic sweeps, and production build all pass. | Pass |
| One ordered Workstation pipeline, expansion, locked task identity/quotes, demand/recovery, clear-waiting, fixed 1×/4×/16×/64× time (§§8–10; D-007) | Canonical engine/balance/browser suites pass; fresh raw expanded Build screenshots show one eight-slot ordered rail with three empty/bypassed positions. | Pass |
| Career loop, evaluation/failure/replay, causal ledger/postmortem, and schema migration (Milestone 3; D-010/D-011) | Canonical 101-seed Career and 121-seed evaluation sweeps plus retained unit/browser/replay/PWA cases pass. | Pass |
| Root and Pages PWA install/update, atomic cache failure/recovery, offline reload, durable save, deterministic startup/cleanup (D-008) | Canonical root Playwright 143/143 and Pages/offline 2/2 pass; pinned local cache/setup and listener cleanup independently confirmed. | Pass |
| Shared command-deck grammar, details/placement separation, five coherent tabs, starter and expanded visual states (§20.5; D-012) | Candidate canonical command-deck coverage plus fresh verifier Playwright screenshots: five tabs × starter/expanded × 320×693/393×742, all inspected at original resolution. | Pass |
| Raw initial portrait geometry: first Build pipeline control and Jobs Queue 1 above fixed navigation, no pre-scroll (§20.5; D-012/D-017) | Fresh test begins with `.app-scroll-region.scrollTop === 0`, measures the first Build action against `Primary` nav at 320×693 and 393×742, and passes. Jobs initial Queue action remains covered by canonical raw-geometry cases and visual inspection. Resolves V-051. | Pass |
| 44 CSS-pixel controls, no horizontal overflow or nested rail trap, text scaling, keyboard/focus, touch/drag, reduced motion, semantic labels (§20.4–20.6; D-005/D-012) | Canonical pinned browser coverage passes. Fresh 320px/200% test queues via reachable action, opens/cancels Build Details with Escape and origin focus restoration, and sees no horizontal overflow; screenshots inspected. | Pass |
| Finite first-session queue → settlement → buy/install rail and durable command boundary (§20.6; D-013/D-014) | Canonical normal rail, placement, touch, reload/offline, and 41-seed first-session scenarios pass. Fresh engine regression uses actual `BUY_MODULE` and installation commands. | Pass |
| Corruption-safe recovery, cleared-starter retry, malformed/current-save fail-closed behavior, explicit cancellation focus (§20.6; D-015) | Retained canonical/verifier regressions pass; fresh direct corrupted-state probes reject field-only advanced guide/inventory/topology. | Pass |
| Original integrity authority for pre-guide migration and legitimate later reconfiguration (§20.6; D-016) | Fresh unit test seals a missing-guide legacy record and confirms `legacy-session`; it also seals a completed purchase then removes the installed module and reloads as `complete`. | Pass |
| Ledger-correlated stale recovery: exact starter settlement + paid purchase record, later-work recovery, no duplicate deduction, bounded-history fallback (D-017) | Fresh tests prove an authentic pending paid purchase survives a later settlement and stale-field repair without repurchase; 50 subsequent queue/settle cycles evict retained evidence and correctly return to `queue-starter`. Candidate and direct probes reject forged inventory/install without the paid record. Resolves V-049 and V-050. | Pass |
| Pre-purchase viable routes, transparent accounting/evidence, meaningful feedback, no passive-batching dominance (§20.6; D-013) | Canonical first-session 41-seed and upgrade 20,001-seed balance gates plus settlement/accounting/forecast browser coverage pass. | Pass |
| Earlier verifier findings V-001 through V-051 | Retained regression suites are included in the 150 unit/property and 143 root browser cases. Fresh regressions specifically re-evaluate V-049, V-050, and V-051. | Pass |
| Research, creator/hype/fear, workforce/startup/laboratory and other later systems | Explicitly deferred by plan/decisions; candidate adds none. | N/A — scope preserved |

## Findings

None. All applicable requirements have concrete passing evidence.

## Unverified areas

- Physical iOS/Android device behavior, native assistive-technology speech, and
  non-Chromium engines were not available. Pinned Chromium covered the required
  portrait, touch/keyboard, text-scale, reduced-motion, persistence, offline,
  and page/console-error paths.
- Storage-quota interruption at the exact local persistence write was not
  fault-injected. Canonical malformed-state, reload/resume, service-worker
  update/failure, and offline recovery suites passed.
- Exact-SHA deployment was not performed by this verifier role.

## Residual risks

- The local FNV integrity seal is a corruption detector, not a
  server-authenticated anti-cheat mechanism. An actor with arbitrary
  local-storage write access can fabricate a matching retained ledger event
  alongside other mutable state. D-017 deliberately treats a retained exact
  ledger record as sufficient stale-repair evidence; no server authority,
  secret, or account-security requirement exists in the authorized offline
  scope. This was tested and recorded as a product-boundary residual, not a
  violation of the stated recovery contract.
- At 320px/200% text, compact bottom-tab labels wrap tightly. Inspected output
  shows visible labels, target-sized controls, no overlap or horizontal
  overflow, and successful keyboard operation.
- macOS sandbox Chromium needs scoped host-browser launch permission because of
  the Mach-port restriction. The checked-in pinned command and local cache are
  otherwise reproducible.
