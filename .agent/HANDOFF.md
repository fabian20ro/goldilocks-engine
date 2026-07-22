# Candidate handoff — Initial-color emoji command deck

## Implemented behavior summary

- Rehauls the complete current Bedroom UI into one forest/acid/amber/cyan terminal command deck without changing simulation commands, engine behavior, balances, persistence schemas, content, progression, endings, or PWA behavior.
- Adds a central reusable semantic glyph registry for resources, pipeline roles, states, navigation, career routes, workloads, and equipment. Glyphs are decorative; visible text and programmatic names retain meaning.
- Replaces the tall report header with a compact icon-led five-resource HUD. Simulation speed sits with live context; Help, animation state, warning guidance, and exact information remain labeled.
- Build uses one numbered, pipe-free ordered rail: five starter stages or eight expanded stages. Expansion still adds only three empty/bypassed positions. Build/Edit and Run are presentation-only views over the unchanged Worker authority.
- Stage selection opens one live in-flow details surface with catalogue description, metrics, compatibility guidance, and contextual remove/bypass. Another selection replaces it; Close/Escape restores focus. Tap, keyboard, pointer drag, and CDP touch remain supported.
- Jobs leads with one warm selected-work dispatch card and above-fold Queue 1 action; exact quotes, cost, uncertainty, queue identity, and the full playable/locked catalogue remain accessible.
- Career leads with warm semantic route cards and four large finite-hour tokens while retaining fractional numeric allocation, exact outcomes, costs, policies, and progression.
- Upgrades sorts owned/affordable/locked choices, adds reusable family glyphs and signed comparison chips, and renders Workstation Expansion I as `3 → 6` plus three empty symbols.
- Inspect leads with CSS gauges for memory, thermal pressure, evidence, and predicted/observed divergence; the full exact comparison table, presets, event evidence, and postmortems remain available.
- Bottom navigation remains the only global routing. Each tab deliberately restores its own scroll position. Pending Build selection has a visible tab indication.
- Default deterministic test/start port remains `4173`; `E2E_PORT` provides a reproducible alternate loopback port when another local project owns the default.

## Plan requirements covered

| Requirement                                                          | Evidence                                                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| §20.5 / D-012 shared palette and reusable semantic glyph grammar     | `src/ui/glyphs.tsx`, CSS tokens, component registry test, five-tab starter/expanded screenshots                       |
| Compact portrait shell and first actions above navigation            | `command-deck.spec.ts` geometry assertions at 320×693 and 393×742; existing 320/393/200%-text suites                  |
| Pipe-free five/eight-stage topology, three empty expansion positions | Ordered `<ol>` rail; no flow connector; no nested rail scroll; expansion and offline regressions                      |
| Accessible live item details                                         | `DetailsSurface`; component and browser replacement, Escape, focus-return, and live-value checks                      |
| Build/live observation and unchanged Worker authority                | Presentation-only toggle snapshot equality; unchanged simulation/worker code; full property/balance suites            |
| Jobs dispatch hierarchy                                              | Selected live card and Queue 1 geometry; workload/quote/queue/settlement regressions                                  |
| Career warm cards and tangible four-hour allocation                  | Route glyphs, 44px tokens, exact fractional input; Career keyboard/touch/offline/200%-text regressions                |
| Upgrade comparison bench                                             | Signed summary deltas, complete native details, affordable ordering, `3 → 6` empty-symbol contract                    |
| Inspect instrument console and retained exact evidence               | Four labeled CSS meters plus default-open exact comparison disclosure; baseline/preset/postmortem tests               |
| Accessibility and portrait resilience                                | 44px controls, text/status labels independent of color, keyboard focus, reduced motion, touch, no horizontal overflow |
| Persistence/PWA/root/Pages behavior unchanged                        | 111 root Playwright cases, 2 Pages/offline cases, migration/recovery/update suites                                    |

## Verifier findings resolved

- No unresolved finding existed at the accepted round-035 baseline.
- Prior immutable reports remain untouched. Existing verifier-owned tests were retained; three interaction helpers now select a stage before invoking the intentionally contextual Remove/Bypass action.
- No new verifier finding applies to this unverified candidate.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First setup needs network access for lockfile dependencies and Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

Repository-local ignored caches:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
artifacts: playwright-report/, playwright-pages-report/, test-results/
```

Linux browser libraries when needed:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Focused command-deck verification and screenshot generation:

```sh
npm exec vitest -- run --no-coverage src/ui/commandDeck.test.tsx
npm run test:e2e -- tests/e2e/command-deck.spec.ts
```

The browser suite writes 20 inspection PNGs under `test-results/command-deck/`: all five tabs, starter and expanded state, at 320×693 and 393×742.

Canonical full check:

```sh
./scripts/verify
```

If port 4173 is occupied, the behaviorally identical explicit override is:

```sh
E2E_PORT=4174 ./scripts/verify
```

`./scripts/verify` runs fresh local setup, formatting, lint, typecheck, unit/property coverage, every deterministic balance sweep, production build, all root Playwright cases, and Pages/offline Playwright cases. Playwright starts loopback preview servers, waits for readiness, and tears them down. No global package, home-directory browser cache, existing profile, or in-app Browser is required.

## Important architectural decisions

- `src/ui/glyphs.tsx` is the sole code-native semantic glyph registry; view code obtains repeated stage/navigation/workload glyphs from registry helpers.
- `DetailsSurface` and `StatusGauge` are reusable accessible primitives. Details are in normal flow, Escape-aware, non-modal, and return focus without trapping it.
- Compact UI derives all prices, requirements, descriptions, metrics, quotes, accounting, evidence, and status from live catalogue/simulation state. No duplicate economy or causal model was introduced.
- Build/Edit versus Run is local React presentation state only. It sends no simulation command and changes no persisted pipeline, workload, or hardware value.
- Tab scroll restoration is explicit per destination rather than inheriting another view's arbitrary offset.
- `E2E_PORT` changes test-server addressing only. The default remains deterministic `127.0.0.1:4173`, including Pages scope.

## Known limitations and risks

- Native emoji rendering varies by platform; labels and interaction structure preserve semantics.
- Physical mobile thermal/battery behavior, non-Chromium engines, and actual assistive-technology speech output remain environmental residuals.
- The Help and animation controls stay compactly visible to preserve existing first-session discoverability and 44px access; detailed tutorial content is progressive and placed after the current command view.
- Exact comparison disclosure starts open to preserve existing direct table accessibility while gauges remain the initial Inspect hero.
- Local storage denial leaves an in-memory session playable but cannot preserve state across reload.
- No researchers/characters, creator/hype/fear systems, extra pipelines, startup/labor/laboratory content, narrative expansion, remote assets, generated raster art, audio, or haptics were added.
- Implementer does not push, deploy, merge, or accept the candidate. Exact-SHA independent verification remains required.

## Checks executed before candidate handoff

- `npm exec vitest -- run --no-coverage src/ui/commandDeck.test.tsx` — succeeded, 3 tests.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts` — succeeded, 3 tests and 20 screenshots; visual inspection covered all five tabs in starter/expanded states at both widths.
- Focused legacy game/expansion run — succeeded, 15 tests.
- Focused repaired regression run — succeeded, 17 tests.
- Focused short-portrait run — succeeded, 11 tests.
- Final `E2E_PORT=4174 ./scripts/verify` — succeeded, exit 0: format, lint, typecheck; 26 unit/property files / 126 tests with coverage; numeric prototype; 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps with zero failures; production build; 111 root Playwright cases; 2 Pages/offline cases.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader session; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes that optional feedback, not a release blocker.
- Sandboxed Chromium launch fails on macOS Mach-port registration; repository-pinned Chromium checks above ran outside that sandbox with the same project-local browser/cache.
