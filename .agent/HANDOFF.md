# Candidate handoff — Initial-color emoji command deck

## Implemented behavior summary

- Rehauls the complete current Bedroom UI into one forest/acid/amber/cyan terminal command deck without changing simulation commands, engine behavior, balances, persistence schemas, content, progression, endings, or PWA behavior.
- Adds a central reusable semantic glyph registry for resources, pipeline roles, states, navigation, career routes, workloads, and equipment. Glyphs are decorative; visible text and programmatic names retain meaning.
- Replaces the tall report header with a compact icon-led five-resource HUD. Simulation speed sits with live context; Help, animation state, warning guidance, and exact information remain labeled.
- Build uses one numbered, pipe-free ordered rail: five starter stages or eight expanded stages. Expansion still adds only three empty/bypassed positions. Build/Edit and Run are presentation-only views over the unchanged Worker authority.
- Stage selection opens one live in-flow details surface with catalogue description, metrics, compatibility guidance, and contextual remove/bypass. Another selection replaces it; Close/Escape restores focus. Tap, keyboard, pointer drag, and CDP touch remain supported.
- Jobs leads with one warm selected-work dispatch card and above-fold Queue 1 action; exact quotes, cost, uncertainty, queue identity, and the full playable/locked catalogue remain accessible.
- Career leads with warm semantic route cards and four large finite-hour tokens while retaining fractional numeric allocation, exact outcomes, costs, policies, and progression. Every route uses a single-column control stack, so all tokens and the exact numeric input stay reachable at 320/393px and 200% text.
- Upgrades sorts owned/affordable/locked choices, adds reusable family glyphs and signed comparison chips, and renders Workstation Expansion I as `3 → 6` plus three empty symbols. Expansion, rigs, and modules share exactly one view-owned live details surface; activating another replaces it, while labeled Close and Escape restore focus.
- Inspect leads with CSS gauges for memory, thermal pressure, evidence, and predicted/observed divergence; the full exact comparison table, presets, event evidence, and postmortems remain available.
- Bottom navigation remains the only global routing. Each tab deliberately restores its own scroll position. Pending Build selection has a visible tab indication.
- Default deterministic test/start port remains `4173`; `E2E_PORT` provides a reproducible alternate loopback port when another local project owns the default.

## Plan requirements covered

| Requirement                                                          | Evidence                                                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| §20.5 / D-012 shared palette and reusable semantic glyph grammar     | `src/ui/glyphs.tsx`, CSS tokens, component registry test, five-tab starter/expanded screenshots                       |
| Compact portrait shell and first actions above navigation            | `command-deck.spec.ts` geometry assertions at 320×693 and 393×742; existing 320/393/200%-text suites                  |
| Pipe-free five/eight-stage topology, three empty expansion positions | Ordered `<ol>` rail; no flow connector; no nested rail scroll; expansion and offline regressions                      |
| Accessible live item details                                         | `DetailsSurface` and `ItemDetailsDisclosure`; view-wide replacement, Close/Escape focus-return, and live-value checks |
| Build/live observation and unchanged Worker authority                | Presentation-only toggle snapshot equality; unchanged simulation/worker code; full property/balance suites            |
| Jobs dispatch hierarchy                                              | Selected live card and Queue 1 geometry; workload/quote/queue/settlement regressions                                  |
| Career warm cards and tangible four-hour allocation                  | All 16 tokens and four exact inputs measured ≥44px and within route bounds at 320/393, normal and 200% text           |
| Upgrade comparison bench                                             | One controlled live disclosure across every item type, signed deltas, ordering, and `3 → 6` empty-symbol contract     |
| Inspect instrument console and retained exact evidence               | Four labeled CSS meters plus default-open exact comparison disclosure; baseline/preset/postmortem tests               |
| Accessibility and portrait resilience                                | 44px controls, text/status labels independent of color, keyboard focus, reduced motion, touch, no horizontal overflow |
| Persistence/PWA/root/Pages behavior unchanged                        | 117 root Playwright cases, 2 Pages/offline cases, migration/recovery/update suites                                    |

## Verifier findings resolved

- **V-042:** Replaced independent rig/module native disclosures with one `UpgradesView`-owned selection across expansion, rigs, and modules. `ItemDetailsDisclosure` synchronizes summary activation, renders at most one open primary surface, preserves every live catalogue stat/text and contextual action, and supplies labeled Close plus Escape focus restoration. The committed verifier test and implementation-owned cross-item/Close/Escape regression succeed.
- **V-043:** Reflowed every Career route and hour controller into explicit single-column grids. Four full-width `minmax(44px, 1fr)` tokens plus the exact numeric input remain inside 320/393px portraits and at 200% text without horizontal document overflow. Geometry checks cover all 16 route tokens.
- **V-044:** Removed the contradictory `@media (max-width: 350px)` two-column hour-controller override. The narrow-width cascade now preserves the base single-column stack, keeping every exact fractional numeric input full-width, at least 44px high/wide, and within its route at 320px/200% text. Implementation-owned geometry also covers every token and input at 320/393 in normal and scaled states.
- Round-036/037 immutable reports and verifier-authored regressions remain untouched.

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
E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts tests/e2e/verifier-round-037.spec.ts tests/e2e/command-deck.spec.ts
```

The browser suite writes 22 inspection PNGs under `test-results/command-deck/`: all five tabs in starter and expanded state at 320×693 and 393×742, plus scrolled Career renders at 200% text for both widths.

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
- `DetailsSurface`, `ItemDetailsDisclosure`, and `StatusGauge` are reusable accessible primitives. Upgrades owns one selected detail ID across every item type; synchronous controlled summary activation prevents native-toggle races, and labeled Close/Escape return focus without trapping it.
- Remaining native disclosures describe one selected dispatch's qualification, one queue collection, global warning guidance, or the single exact Inspect table; they are supplemental view evidence, not competing item-level primary surfaces.
- Career route and hour controls explicitly declare one-column grids in both base and `max-width: 350px` rules. Token tracks use four flexible tracks with a 44px floor; exact numeric inputs use a separate full-width row with intrinsic width constrained to the card.
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
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts --reporter=line` — succeeded, 2 tests.
- `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts tests/e2e/verifier-round-037.spec.ts tests/e2e/command-deck.spec.ts --reporter=line` — succeeded, 9 tests: disclosure replacement/Close/Escape, required 393px tokens, exact 320px/200%-text inputs, 320/393 full renders, and all Career controls at both widths in normal/scaled states.
- Visual inspection covered updated Career renders at 320/393 in normal and 200%-text states. All four tokens remain whole; each exact input is a full-width second row inside its route.
- Final `E2E_PORT=4174 ./scripts/verify` — succeeded, exit 0: fresh local setup; format, lint, typecheck; 26 unit/property files / 126 tests with coverage; numeric prototype; 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps with zero failures; production build; 117 root Playwright cases; 2 Pages/offline cases.

## Checks not run

- No push, deployment, live public URL validation, or GitHub Actions run; outside Implementer authority.
- No physical-device, non-Chromium, battery/thermal, or platform screen-reader session; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes that optional feedback, not a release blocker.
- Sandboxed Chromium launch fails on macOS Mach-port registration; repository-pinned Chromium checks above ran outside that sandbox with the same project-local browser/cache.
