# Candidate handoff — round 044 Jobs portrait safety reserve

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
- Gives raw short/narrow Jobs content a measured navigation reserve. At
  320×693 the selected workload label and Queue 1 now sit at least 8 CSS pixels
  above fixed Primary navigation; the 393×742 route retains the same measured
  floor without changing its normal command-deck spacing.
- Retains the verifier's deterministic 1× + paused active-task clear assertion
  and its independent reload proof for task ID and locked quote. The product
  clear path, time model, and persisted Worker state are unchanged.
- Preserves Build-scoped explicit placement, Details inspection boundaries,
  Cancel/Escape focus return, Worker authority, touch/drag behavior, exact
  accounting, persistence, PWA/update, Career, evaluation, and replay behavior.

## Plan requirements covered

| Requirement                                                     | Evidence                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| §20.6 / D-013 three-step queue → settlement → buy/install rail  | Durable `firstSession` state; command guards; ledger-correlated recovery; engine, balance, and browser coverage |
| §20.6 malformed/reload/offline recovery and exact-once purchase | Stale forgery, real purchase, later-work, restore, and browser regressions                                      |
| §20.5 compact portrait command deck                             | Raw 320×693 and 393×742 geometry; 320/393 touch, text scaling, keyboard, and reduced-motion suites              |
| §20.5 Jobs dispatch safety reserve                              | Candidate-owned raw Queue 1/selected-label clearance check at 320×693 and 393×742                               |
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
- **V-052:** Jobs now uses a short-portrait reserve instead of boundary
  equality. A candidate-owned raw geometry regression requires 8px clearance
  for both the selected workload label and Queue 1; the 320×693 layout gains at
  least 12px before the dispatch section while 393×742 is unchanged.
- **V-053:** Retained verifier-owned tests stabilize the active-task assertion
  at 1× with the task paused, then independently prove its ID and locked quote
  survive clear-waiting and reload. Repeated focused coverage remains green.
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

Focused recovery, clearance, and portrait regression checks:

```sh
E2E_PORT=4174 npm run test:e2e -- tests/e2e/jobs-portrait-margin.spec.ts tests/e2e/command-deck.spec.ts tests/e2e/verifier-round-041.spec.ts tests/e2e/verifier-round-043.spec.ts
E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep 'shows eight workloads and preserves accepted task identity while clearing only waiting work' --repeat-each=20
E2E_PORT=4174 npm run test:e2e -- tests/e2e/jobs-portrait-margin.spec.ts tests/e2e/verifier-round-042.spec.ts tests/e2e/verifier-round-025.spec.ts tests/e2e/verifier-round-026.spec.ts
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
- D-018 scopes a short-portrait spacing reserve to Jobs only. The tab-specific
  main-content class avoids changing Build's raw-primary ordering or the normal
  393×742 rhythm; the 8px floor is geometry-tested rather than inferred.
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

- `npm run format:check`; `npm run lint`; `npm run typecheck` — passed.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/jobs-portrait-margin.spec.ts tests/e2e/command-deck.spec.ts tests/e2e/verifier-round-041.spec.ts tests/e2e/verifier-round-043.spec.ts --reporter=line` — passed: 15/15.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep 'shows eight workloads and preserves accepted task identity while clearing only waiting work' --repeat-each=20 --reporter=dot` — passed: 20 repeated cases, no failed tests.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/jobs-portrait-margin.spec.ts tests/e2e/verifier-round-042.spec.ts tests/e2e/verifier-round-025.spec.ts tests/e2e/verifier-round-026.spec.ts --reporter=line` — passed: 9/9.
- Final isolated `E2E_PORT=4174 ./scripts/verify` — passed, exit 0: fresh
  setup; format, lint, typecheck; 31 unit/property files / 153 tests;
  first-session 41/0, upgrades 20,001/0, progression 41/0, Career 101/0, and
  evaluation 121/0; production build; 149/149 root Playwright cases; 2/2
  Pages/offline cases.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run;
  outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader
  session; required hardware/services unavailable.
- Sandboxed Chromium launch is unavailable on this macOS environment because of
  Mach-port registration. Required repository-pinned Chromium checks above ran
  with project-local caches through scoped host access.
