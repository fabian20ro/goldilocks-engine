# Candidate handoff — first-session management refinement

## Implemented behavior summary

- Adds a finite durable rail for a genuinely new run: queue exactly one safe Interactive Chat task, observe its settlement, then buy and explicitly install a meaningful module. The current step survives reload and offline recovery; the completed rail disappears.
- Enforces the first queue/settlement ordering in `applyCommand`, so direct Worker/runtime callers cannot bypass it with another workload, Queue 10, or a second queue before the starter settles. Current guide state must match reachable task, settlement, and paid-module facts before recovery can reseal it; fabricated or uncorroborated progress falls back safely. Clearing the only waiting starter atomically resets the rail to Queue 1, including after reload.
- Separates Details from placement. Details only inspects; placement starts only from a named `Place … in Build` action. Build owns the pending tray and Snap targets; Jobs, Career, Inspect, Cancel/Escape, incompatible recovery, and completion clear it without mutating the pipeline. Escape and explicit Cancel return focus to the Build module control that opened Details.
- Rebalances the early work market: Interactive Chat is reliable immediate income but demand falls quickly under reservations; Batch Classification offers a distinct positive expected route with lower delivery reliability and recoverable demand. Queue 10 and 64× remain available after the initial settlement but are not the dominant pre-purchase policy.
- Adds restrained settlement/first-fifth-twelfth recognition, exact success/failure accounting, recovery language, and a persisted, dismissible next-affordable target. Reduced-motion mode labels the state immediately and cancels active transitions.
- Makes module-library horizontal touch panning coexist with explicit vertical/non-horizontal placement drags. A short tap still opens Details; canceled touch drag makes no pipeline change.
- Adds `createEstablishedScenarioState()` only for deterministic balance/regression scenarios; production startup always uses the guarded `createInitialState()` path.

## Plan requirements covered

| Requirement                                                         | Evidence                                                                                                              |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| §20.6/D-013 three-step queue → settlement → buy/install rail        | Durable `firstSession` state, semantic recovery tests, clear/reload/retry tests, and `first-session.spec.ts` coverage |
| Explicit Build-scoped placement; Details does not place             | `App.tsx` transaction ownership and browser Details/Upgrades/Build/Cancel/Escape/touch/focus tests                    |
| Two viable forecastable pre-purchase routes; no dominant safe batch | `firstSessionBalance.ts`, 41-seed route sweep, quote/demand UI, 20,001-seed purchase pacing sweep                     |
| Compact card hierarchy with exact accounting retained               | Workload accessible labels/Details, settlement ledger, money-loop and verifier-round-016 regression                   |
| Restrained accessible progress/failure/recovery feedback            | `MoneyLoop`, reduced-motion assertions, settlement/failure browser coverage                                           |
| Portrait/touch/text/reload/offline/PWA regression protection        | Pinned 320/393 and 200%-text Playwright suites; root and Pages offline checks                                         |
| Independent reproducible verification                               | `scripts/setup`, `scripts/run`, `scripts/verify`, project-pinned Playwright and ignored local caches                  |

## Verifier findings resolved

- **V-045:** State validation now checks first-session IDs against reachable queue/task, settlement, and paid-module facts. An unsealed advanced current guide also needs a matching recorded Interactive Chat settlement; otherwise restore falls back to the safe Queue 1 rail instead of resealing a Queue 10 bypass.
- **V-046:** `CLEAR_WAITING_TASKS` detects removal of the accepted waiting starter and atomically returns the guide to `queue-starter`, so serialized/reloaded state accepts a fresh Queue 1 retry.
- **V-047:** Build placement records its Details-origin control. Escape and explicit Cancel clear the tray/Snap targets and return keyboard focus to that control.
- Immutable round-039 verifier regressions remain unchanged. Candidate-owned engine and browser cases add coverage rather than weakening regression intent; retained V-009/V-010/V-042/V-043/V-044 and persistence/PWA tests remain in the canonical suite.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First setup needs network access for the lockfile dependencies and pinned Chromium.

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

Focused commands:

```sh
npx vitest run src/simulation/engine.test.ts src/simulation/firstSessionBalance.test.ts --coverage.enabled=false
npm run balance:first-session
E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-039.spec.ts tests/e2e/first-session.spec.ts --reporter=line
```

Canonical full check:

```sh
./scripts/verify
```

`./scripts/verify` runs setup, format, lint, typecheck, unit/property coverage, all balance sweeps, production build, root Playwright, and Pages/offline Playwright. Playwright uses project-pinned Chromium from `.cache/ms-playwright`, starts deterministic `127.0.0.1:4173` loopback preview servers, waits for readiness, and cleans them up. No home cache, global package, existing browser profile, or in-app Browser is required.

If port 4173 is occupied, use the behaviorally identical explicit override:

```sh
E2E_PORT=4174 ./scripts/verify
```

## Important architectural decisions

- `SimulationState.firstSession` records only completed player actions; it grants no money, changes no quote, and queues no work automatically.
- Old schema-7 saves without a guide remain usable as completed legacy sessions. Field-shaped current guide data must corroborate live pipeline facts; unsealed advanced progress without a matching starter settlement falls back safely rather than manufacturing a partially completed guide.
- `createEstablishedScenarioState()` is a test/balance fixture, not a UI route or simulation command. It keeps non-onboarding scenarios explicit and reproducible.
- Pending placement is React view state, never a simulation command. The engine receives only the explicit final `PLACE_MODULE` command.
- Library touch gestures preserve native horizontal pan until drag direction is unambiguous; placement begins only after the normal movement threshold.
- Workload quotes remain locked per accepted task. Reservation pressure is deterministic and visible before acceptance; delivery reliability can vary by workload without changing pipeline topology or settlement semantics.

## Known limitations and risks

- The guide cannot guarantee a first task succeeds; a failed starter still records the observed settlement and the player can choose subsequent work before affording a module.
- Existing established saves intentionally do not replay the new onboarding rail.
- A current save whose integrity is damaged after later guided activity but cannot corroborate its original starter settlement recovers to a fresh guided run rather than risking a bypass; validly sealed long-running saves are unaffected.
- Native emoji rendering, physical touch feel, battery/thermal behavior, non-Chromium engines, and actual screen-reader speech remain environmental residual risks.
- Local storage denial leaves an in-memory session playable but cannot persist reload state.
- No Research, characters, creator/fear/audience systems, workforce/startup/laboratory content, extra pipelines, narrative expansion, remote assets, audio, or haptics were added.

## Checks executed before candidate handoff

- `npx vitest run src/simulation/engine.test.ts src/simulation/verifierRound039.test.ts --coverage.enabled=false` — passed: 2 files / 48 tests.
- `npm run typecheck`, `npm run lint`, and `npm run format:check` — passed.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-039.spec.ts tests/e2e/first-session.spec.ts --reporter=line` — passed: 12/12 browser cases, including V-045 through V-047 regressions and candidate-owned focus tests.
- Final `E2E_PORT=4174 ./scripts/verify` — passed, exit 0 (captured in an operating-system temporary log after the first tool stream detached): fresh local setup; format, lint, typecheck; 28 unit/property files / 139 tests; numeric prototype; first-session 41/0, upgrades 20,001/0 (worst module at 4 successful jobs, rig at 15), progression 41/0, Career 101/0, and evaluation 121/0; production build; 133/133 root Playwright cases; 2/2 Pages/offline cases.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader session; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes it optional feedback rather than a release blocker.
- Sandboxed Chromium launch is unavailable on this macOS environment because of Mach-port registration; the required repository-pinned Chromium checks above run with project-local caches outside that sandbox.
