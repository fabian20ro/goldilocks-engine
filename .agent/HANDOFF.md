# Candidate handoff — round 042 first-session recovery and portrait repair

## Implemented behavior summary

- Keeps the durable three-step first-session rail: one safe Interactive Chat
  job, its observed settlement, then a meaningful paid module purchase and
  explicit compatible Build installation. The command boundary remains the
  authority; guide progress survives reload/offline recovery and disappears
  after completion.
- Makes integrity-stale recovery ledger-correlated. Advanced guide progress now
  requires the retained exact starter-settlement record; a named first module
  additionally requires the exact `BUY_MODULE` accounting record. A stale
  completed guide still requires that module to be both owned and installed.
  Mutable cash, inventory, pipeline topology, and later `lastSettlement` are
  not treated as proof of the required commands.
- Keeps valid integrity seals authoritative for legacy migration and legitimate
  later reconfiguration. A stale save whose bounded ledger no longer retains
  the required onboarding records safely falls back to Queue 1 rather than
  granting progress.
- Keeps the normal Build portrait order primary-first: objective and pipeline
  controls precede time/warning controls. At enlarged text, a container query
  moves the secondary controls near the header and uses a compact two-column
  speed grid, keeping every speed button tappable above fixed navigation.
  Non-Build tabs retain their established top-of-content secondary controls.
- Preserves Build-scoped explicit placement, Details inspection boundaries,
  Cancel/Escape focus return, Worker authority, touch/drag behavior, exact
  accounting, persistence, PWA/update, Career, evaluation, and replay behavior.

## Plan requirements covered

| Requirement                                                     | Evidence                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| §20.6 / D-013 three-step queue → settlement → buy/install rail  | Durable `firstSession` state; command guards; ledger-correlated recovery; engine, balance, and browser coverage |
| §20.6 malformed/reload/offline recovery and exact-once purchase | Stale forgery, real purchase, later-work, restore, and browser regressions                                      |
| §20.5 compact portrait command deck                             | Raw 320×693 and 393×742 geometry; 320/393 touch, text scaling, keyboard, and reduced-motion suites              |
| Explicit Build-only placement and Details boundary              | Build transaction ownership plus Details/Cancel/Escape/touch/focus browser coverage                             |
| PWA/root/Pages offline and deterministic browser verification   | Pinned Playwright, local ignored caches, root update suite, Pages/offline suite, `scripts/verify`               |

## Verifier findings resolved

- **V-049:** A fabricated owned/installed module no longer validates stale
  `buy-and-install` or `complete` progress. Recovery requires the exact durable
  paid-purchase ledger event written by `BUY_MODULE`.
- **V-050:** Legitimate paid progress no longer depends on mutable
  `lastSettlement`. Recovery finds the original starter settlement in the
  ledger, so later jobs do not erase a valid completed rail.
- **V-051:** The raw initial 320×693 Build view now keeps resource HUD,
  objective, and first pipeline control above fixed Primary navigation without
  programmatic scrolling. Jobs retains its initial dispatch/Queue 1 geometry.
- Retained V-039, V-040, and V-041 verifier tests/reports remain unchanged.
  Candidate-owned engine and command-deck tests add regression coverage without
  weakening existing checks.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First
setup needs network access for lockfile dependencies and pinned Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

Repository-local ignored caches/artifacts:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
artifacts: playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser libraries when required:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Focused recovery and portrait regression check:

```sh
npx vitest run src/simulation/engine.test.ts src/simulation/verifierRound039.test.ts src/simulation/verifierRound040.test.ts src/simulation/verifierRound041.test.ts --coverage.enabled=false
E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts tests/e2e/verifier-round-025.spec.ts tests/e2e/verifier-round-026.spec.ts tests/e2e/command-deck.spec.ts tests/e2e/verifier-round-041.spec.ts
```

Canonical full check:

```sh
./scripts/verify
```

`./scripts/verify` runs setup, format, lint, typecheck, unit/property coverage,
all balance sweeps, production build, root Playwright, and Pages/offline
Playwright. Playwright uses project-pinned Chromium from
`.cache/ms-playwright`, starts deterministic `127.0.0.1:4173` loopback preview
servers, waits for readiness, and cleans them up. No home cache, global package,
existing browser profile, or in-app Browser is required.

If port 4173 is occupied, use the behaviorally identical explicit override:

```sh
E2E_PORT=4174 ./scripts/verify
```

## Important architectural decisions

- `modulePurchaseLedgerMessage()` is the single source for the durable paid
  purchase event and recovery matcher; command recording and repair cannot drift
  apart through duplicate formatting.
- D-017 intentionally trusts a valid integrity seal for historical completed
  progress, but treats an invalid seal as a bounded-evidence repair problem.
  If retained proof has rolled out, fail closed to a fresh rail.
- Time/warning controls form one `SecondaryControls` component. Build renders it
  after the initial pipeline in normal text; container-query ordering makes its
  controls reachable at 200% text without changing simulation state or routing.
- `createEstablishedScenarioState()` remains a deterministic test/balance
  fixture only; production startup always uses `createInitialState()`.
- Pending placement remains React view state. The engine receives only the final
  explicit `PLACE_MODULE` command.

## Known limitations and risks

- A stale damaged save whose required bounded ledger records have rolled out
  resets to a fresh guided run; validly sealed long-running saves remain valid.
- The guide cannot guarantee a starter success. Failed starter settlement still
  records the observed outcome and permits later work before a module is
  affordable.
- Native emoji rendering, physical touch feel, battery/thermal behavior,
  non-Chromium engines, actual screen-reader speech, and local-storage denial
  remain environmental residual risks. Storage denial leaves an in-memory
  session playable but cannot persist reload state.
- No Research, characters, creator/fear/audience systems, workforce/startup/
  laboratory content, extra pipelines, narrative expansion, remote assets,
  audio, or haptics were added.

## Checks executed before candidate handoff

- `npx vitest run src/simulation/engine.test.ts src/simulation/verifierRound039.test.ts src/simulation/verifierRound040.test.ts src/simulation/verifierRound041.test.ts --coverage.enabled=false` — passed: 4 files / 59 tests.
- `npm run typecheck` — passed.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts tests/e2e/verifier-round-025.spec.ts tests/e2e/verifier-round-026.spec.ts tests/e2e/command-deck.spec.ts tests/e2e/verifier-round-041.spec.ts` — passed: 20/20 browser cases.
- Final isolated `E2E_PORT=4174 ./scripts/verify` — passed, exit 0: fresh local setup; format, lint, typecheck; 30 unit/property files / 150 tests; first-session 41/0, upgrades 20,001/0, progression 41/0, Career 101/0, evaluation 121/0; production build; 143/143 root Playwright cases; 2/2 Pages/offline cases.
- An earlier pre-fix canonical run exited 1 for V-026 geometry and the affected
  round-015 clear-queue flow. It is not evidence for this candidate; the final
  isolated run above was completed after correction.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run;
  outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader
  session; required hardware/services unavailable.
- Sandboxed Chromium launch is unavailable on this macOS environment because of
  Mach-port registration. Required repository-pinned Chromium checks above ran
  with project-local caches through scoped host access.
