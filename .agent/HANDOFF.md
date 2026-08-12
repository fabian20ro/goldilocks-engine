# Candidate handoff — round 064 Phase 3 selected-stage and tray repairs

## Implemented behavior summary

- Build keeps the single ordered pipeline rail first. Each rail position is a
  44 CSS-pixel selected-stage control; its current `Input`/process/`Output`
  context appears before the compact inventory.
- Build and Upgrades consume the same pure module selector. It renders live
  `Owned`, `Affordable / available`, and `Locked` sections using durable
  ownership, current money, installed state, exact remaining money, and Build
  compatibility.
- Each section defaults to three cards. `Show every module (17)` exposes every
  exact catalog item; selected Build ranks the installed module first and
  compatible owned choices before incompatible modules. Upgrades retains its
  paid-owned `Place in Build` handoff priority.
- Locked and affordable cards expose one existing Build Details surface. Owned
  cards retain explicit Details/drag and named `Place in Build`; they do not
  begin placement on selection. Repeated remove/bypass actions remain only in
  the selected stage Details surface.
- Existing `ComparisonDelta` is now the shared command-deck component used by
  module upgrades and Inspect metric comparisons. No second drawer or
  inventory framework was added.
- Pending-placement tray, compatible snap, Cancel/Escape, origin focus,
  tab-cancellation, keyboard selection, touch drag, persistence, Worker
  commands, PWA scope, and one-pipeline topology remain unchanged. On portrait
  widths through 31rem, the existing sticky tray stacks copy above its full
  width Cancel target so 200%-text placement remains visible and cancellable.
- Workstation Expansion I remains `3 → 6` process capacity. Its Process 4–6
  slots remain explicitly empty/bypassed and carry no compute or memory claim.

## Plan requirements covered

| §20.7 Phase 3 requirement                                                    | Candidate evidence                                                                                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail + selected-stage context before inventory                               | `Pipeline`, `ModuleLibrary`, `phase-3-density.spec.ts` DOM order/portrait checks                                                                  |
| Owned/available/locked live grouping; next subset; every-item route          | `moduleInventory.ts` selector + unit tests; 3-card default and `Show every module (17)` browser assertions                                        |
| Details, comparison delta, selected-only actions                             | existing `DetailsSurface`; shared `ComparisonDelta`; component replacement/focus test; selected stage Details actions                             |
| Placement/tray/cancel/focus/compatibility/keyboard/touch                     | retained `first-session.spec.ts`, `game.spec.ts`, and Phase 3 explicit-placement browser flow                                                     |
| Expansion remains 3→6 empty/bypassed capacity                                | retained `round-015-expansion.spec.ts`; Phase 3 expanded screenshots/geometry                                                                     |
| Portrait geometry/screenshots, 100%/200%                                     | `phase-3-density.spec.ts`: owned-small, catalogue-rich, expanded at 320×693 and 393×742, no overflow/nested rail scroll/obscured tray/<44 targets |
| Retained first-session, queue, quote, preset, malformed, offline/PWA, Career | canonical `./scripts/verify` remains the full gate; focused retained suites listed below                                                          |

## Verifier findings addressed

- V-066: `selectModuleInventory` now ranks a selected stage's compatible owned
  placement choices before incompatible owned modules; paid-owned preference
  is retained only for the no-stage Upgrades route.
- V-067: the existing placement tray uses a narrow-portrait stack so its copy
  and Cancel action have separate full-width rows at 200% text, with no tray
  scroll or changed cancellation semantics.
- Immutable round-063 unit and browser probes remain unchanged. Candidate
  selector and 320/393 200%-text cancellation coverage exercise the repairs.

## Setup, startup, and verification commands

Prerequisite: Node version accepted by `package.json` (`^20.19.0 || >=22.12.0`).
First setup needs network access for the lockfile and repository-pinned
Chromium only.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

Repository-local ignored caches/artifacts:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
artifacts: coverage/, playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser packages when necessary:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical verification starts deterministic loopback servers, waits for
readiness, and lets Playwright clean them up:

```sh
E2E_PORT=4255 ./scripts/verify
```

Focused Phase 3 checks:

```sh
npm test -- src/ui/moduleInventory.test.ts src/ui/verifierRound063.test.ts --coverage.enabled=false --reporter=dot
E2E_PORT=4256 npm run test:e2e -- tests/e2e/verifier-round-063.spec.ts tests/e2e/phase-3-density.spec.ts --reporter=dot
E2E_PORT=4257 npm run test:e2e -- tests/e2e/first-session.spec.ts tests/e2e/game.spec.ts tests/e2e/round-015-expansion.spec.ts tests/e2e/verifier-round-040.spec.ts tests/e2e/verifier-round-061.spec.ts --reporter=dot
```

The active Pages package is `https://fabian20ro.github.io/goldlocks-engine/`.
Its local scope/PWA verification is:

```sh
npm run build:pages
E2E_PORT=4258 npm run test:e2e:pages
```

`@playwright/test` is pinned in `package.json`; `npm run test:e2e` uses only
`.cache/ms-playwright`, not a global browser/profile. On this macOS host,
Chromium needs a scoped host launch because the workspace sandbox cannot create
its Mach-port rendezvous server; no browser check is silently skipped.

## Important architectural decisions

- D-027: one module-specific pure selector, not a general inventory framework.
- D-028: selected Build compatibility ranks before incompatible paid ownership;
  the narrow-portrait sticky placement tray stacks copy and cancellation.
- The selected Build stage is App-session presentation state only. Worker state
  remains authority for ownership, money, topology, metrics, commands, and
  persistence.
- Existing Details surface and comparison semantics are reused. No new drawer,
  page, state schema, asset, or simulation mechanic exists in this candidate.
- D-008 Pages scope remains `/goldilocks-engine/`; existing durable storage
  keys and PWA migration behavior remain compatible.

## Known limitations and risks

- No physical mobile-device or non-Chromium/browser-screen-reader pass was
  available. Pinned Chromium covers required portrait, text scale, keyboard,
  touch, persistence, reload, offline, and recovery suites.
- Remote push, hosted workflow aggregation, exact-SHA Pages deployment, and
  live smoke are external release steps; not performed by this Implementer.

## Checks executed before handoff

- `npm test -- src/ui/moduleInventory.test.ts src/ui/verifierRound063.test.ts --coverage.enabled=false --reporter=dot` — 2 files, 6/6 pass.
- `E2E_PORT=4873 npm run test:e2e -- tests/e2e/verifier-round-063.spec.ts --reporter=dot` — 2/2 pass: exact V-067 200%-text tray geometry at 320×693 and 393×742.
- `E2E_PORT=4874 npm run test:e2e -- tests/e2e/phase-3-density.spec.ts --reporter=dot` — 7/7 pass; visually inspected generated 320×693 and 393×742 200%-text placement-tray captures, plus retained 100%/200% Phase 3 portraits.
- `E2E_PORT=4875 npm run test:e2e -- tests/e2e/first-session.spec.ts tests/e2e/game.spec.ts tests/e2e/round-015-expansion.spec.ts tests/e2e/verifier-round-040.spec.ts tests/e2e/verifier-round-061.spec.ts --reporter=dot` — 27/27 pass.
- `E2E_PORT=4876 ./scripts/verify` — completed successfully from fresh setup:
  format, lint, typecheck, 42 files/193 unit tests, numeric/first-session/
  20,001-upgrade/progression/Career/evaluation balances, production build,
  high/critical production audit, 198/198 root Playwright tests, and 2/2 Pages
  Playwright tests.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test --list` — 198 root tests discovered; Pages config list — 2 tests discovered.
- `./scripts/run` — Vite loopback readiness verified at
  `http://127.0.0.1:4173/` (`The Goldilocks Engine` title); temporary
  `goldlocks-r064` tmux session stopped afterwards.

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; outside local Implementer authority.
