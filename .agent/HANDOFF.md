# Candidate handoff — first-session management refinement

## Implemented behavior summary

- Adds a finite durable rail for a genuinely new run: queue exactly one safe Interactive Chat task, observe its settlement, then buy and explicitly install a meaningful module. The current step survives reload and offline recovery; the completed rail disappears.
- Enforces the first queue/settlement ordering in `applyCommand`, so direct Worker/runtime callers cannot bypass it with another workload, Queue 10, or a second queue before the starter settles. Invalid guide state safely recovers; existing schema-7 saves migrate as established sessions and reseal.
- Separates Details from placement. Details only inspects; placement starts only from a named `Place … in Build` action. Build owns the pending tray and Snap targets; Jobs, Career, Inspect, Cancel/Escape, incompatible recovery, and completion clear it without mutating the pipeline.
- Rebalances the early work market: Interactive Chat is reliable immediate income but demand falls quickly under reservations; Batch Classification offers a distinct positive expected route with lower delivery reliability and recoverable demand. Queue 10 and 64× remain available after the initial settlement but are not the dominant pre-purchase policy.
- Adds restrained settlement/first-fifth-twelfth recognition, exact success/failure accounting, recovery language, and a persisted, dismissible next-affordable target. Reduced-motion mode labels the state immediately and cancels active transitions.
- Makes module-library horizontal touch panning coexist with explicit vertical/non-horizontal placement drags. A short tap still opens Details; canceled touch drag makes no pipeline change.
- Adds `createEstablishedScenarioState()` only for deterministic balance/regression scenarios; production startup always uses the guarded `createInitialState()` path.

## Plan requirements covered

| Requirement                                                         | Evidence                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| §20.6/D-013 three-step queue → settlement → buy/install rail        | Durable `firstSession` state, engine guard/migration tests, `first-session.spec.ts` reload/offline coverage |
| Explicit Build-scoped placement; Details does not place             | `App.tsx` transaction ownership and browser Details/Upgrades/Build/Cancel/Escape/touch tests                |
| Two viable forecastable pre-purchase routes; no dominant safe batch | `firstSessionBalance.ts`, 41-seed route sweep, quote/demand UI, 20,001-seed purchase pacing sweep           |
| Compact card hierarchy with exact accounting retained               | Workload accessible labels/Details, settlement ledger, money-loop and verifier-round-016 regression         |
| Restrained accessible progress/failure/recovery feedback            | `MoneyLoop`, reduced-motion assertions, settlement/failure browser coverage                                 |
| Portrait/touch/text/reload/offline/PWA regression protection        | Pinned 320/393 and 200%-text Playwright suites; root and Pages offline checks                               |
| Independent reproducible verification                               | `scripts/setup`, `scripts/run`, `scripts/verify`, project-pinned Playwright and ignored local caches        |

## Verifier findings resolved

- No verifier finding was unresolved at this implementer handoff. Immutable round-038 reports V-001 through V-044 resolved; retained regressions stay in the canonical suite.
- This change specifically preserves formerly fragile boundaries covered by retained tests: V-009 manual reduced motion, V-010 module-drawer touch pan, V-042 single item-details surface, V-043/V-044 portrait Career controls, plus all persistence/PWA findings.
- Added first-session engine and Playwright coverage rather than weakening existing regression intent. Established long-run balance scenarios now opt in through the documented fixture instead of silently bypassing the guide.

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
npm run test:e2e -- tests/e2e/first-session.spec.ts --reporter=line
npm run test:e2e -- tests/e2e/verifier-round-004.spec.ts --reporter=line
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
- Old saves remain usable as completed, legacy first sessions. Malformed current guide data falls back safely rather than manufacturing a partially completed guide.
- `createEstablishedScenarioState()` is a test/balance fixture, not a UI route or simulation command. It keeps non-onboarding scenarios explicit and reproducible.
- Pending placement is React view state, never a simulation command. The engine receives only the explicit final `PLACE_MODULE` command.
- Library touch gestures preserve native horizontal pan until drag direction is unambiguous; placement begins only after the normal movement threshold.
- Workload quotes remain locked per accepted task. Reservation pressure is deterministic and visible before acceptance; delivery reliability can vary by workload without changing pipeline topology or settlement semantics.

## Known limitations and risks

- The guide cannot guarantee a first task succeeds; a failed starter still records the observed settlement and the player can choose subsequent work before affording a module.
- Existing established saves intentionally do not replay the new onboarding rail.
- Native emoji rendering, physical touch feel, battery/thermal behavior, non-Chromium engines, and actual screen-reader speech remain environmental residual risks.
- Local storage denial leaves an in-memory session playable but cannot persist reload state.
- No Research, characters, creator/fear/audience systems, workforce/startup/laboratory content, extra pipelines, narrative expansion, remote assets, audio, or haptics were added.

## Checks executed before candidate handoff

- `npm run typecheck` — passed.
- `npm test` — passed: 27 files, 135 tests; V8 coverage statements 88.2%, branches 85.07%, functions 94.62%, lines 91.58%.
- `npm run balance` — passed: numeric prototype viable/non-dominant/tradeoffs; first-session 41 seeds/0 failures; upgrades 20,001/0 (worst module 4 successful jobs, rig 15); progression 41/0; Career 101/0; evaluation 121/0.
- `npm run format:check`, `npm run lint`, `npm run build` — passed.
- `npm run test:e2e -- --reporter=line` — passed: 126 root cases.
- `npm run test:e2e:pages -- --reporter=line` — passed: 2 Pages/offline cases.
- Final `./scripts/verify` — passed, exit 0: fresh local setup; format, lint, typecheck; 27 unit/property files / 135 tests; numeric prototype; 41-seed first-session, 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps with zero failures; production build; 126 root Playwright cases; 2 Pages/offline cases.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader session; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes it optional feedback rather than a release blocker.
- Sandboxed Chromium launch is unavailable on this macOS environment because of Mach-port registration; the required repository-pinned Chromium checks above run with project-local caches outside that sandbox.
