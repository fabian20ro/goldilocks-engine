# Candidate handoff — round 078 contextual mobile global chrome

## Implemented behavior summary

- Portrait global chrome now keeps only brand, live resources, and the one
  existing bottom navigation grammar permanent. Simulation time and the active
  warning compact into a native `Simulation` disclosure that visibly names
  the exact active `1×`/`4×`/`16×`/`64×` speed and current warning. Opening it
  exposes the unchanged time controls plus the complete existing warning
  evidence and Details control. Selecting a speed closes the disclosure so the
  active tab regains first-viewport priority.
- Help and motion now share a native `Help & motion` header disclosure.
  Quick Start and the existing visual-only motion switch retain their
  accessible names, semantics, 44px targets, and full visual-only explanation.
  Dismissing Quick Start restores focus to the visible disclosure summary.
- Build's existing presentation-only controls now use Configure/Observe
  language. They retain the same state and do not alter simulation, routing,
  or persistence.
- No Jobs settlement/recovery, Career composer/draft, Worker protocol,
  simulation input, tab state, safe-area behavior, PWA, drag behavior, or
  onboarding rationale changed. The raw-320 Jobs compact quote/reflow repair
  and its navigation reserve remain intact.
- Browser helpers now explicitly open the progressive disclosures before
  inspecting their existing controls. This preserves prior tests' behavior
  assertions rather than changing their assertions or timeouts.

## Plan requirements covered

| Requirement                                    | Evidence                                                                                                                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-viewport hierarchy                       | `command-deck.spec.ts` captures starter and expanded Build, Jobs, Career, Upgrades, and Inspect at raw 320×693 and 393×742; compact context is closed initially and current tab content remains clear of fixed navigation. |
| Progressive disclosure / complete consequences | Candidate test opens Simulation, verifies unchanged speed group and warning Details/evidence; Help/motion opens its existing Help and motion controls.                                                                     |
| Input, focus, and 44px targets                 | Candidate test uses keyboard Space and a genuine Playwright touch-context `locator.tap()`; 200%-text test verifies Help dismissal focus return and every visible button/summary target at least 44px.                      |
| Responsive/reduced motion/no overflow          | Candidate test covers 320×693 and 393×742 at 200% root text plus reduced motion; command-deck geometry checks raw 320/393 no horizontal or nested pipeline scroll.                                                         |
| Preserve mechanics/state                       | Retained first-session, Jobs reserve, game pointer/touch drag, Career draft, placement cancellation, malformed-save/reload, PWA/offline, and Pages suites remain in the canonical command.                                 |
| One bottom navigation grammar / manual handoff | No tab/navigation production logic changed. Retained browser checks verify per-tab scroll restoration, Career draft preservation, and explicit placement cancellation.                                                     |

## Verifier findings addressed

- No unresolved stable verifier finding existed at round-078 start.
- Previous V-077 raw/scaled Jobs responsive repair remains covered: raw
  320×693 retains its Queue/navigation reserve, while 200%-text Jobs reflows
  complete quote content without title/price collision.
- Previous hosted pointer/touch drag fixture repair remains covered by retained
  direct-coordinate `game.spec.ts` tests; production drag behavior was not
  touched.

## Setup, startup, and verification commands

Prerequisite: Node accepted by `package.json` (`^20.19.0 || >=22.12.0`).
Setup downloads lockfile-pinned dependencies and pinned Chromium only into
ignored repository-local caches:

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173/
```

```text
npm cache:          .cache/npm
Playwright browser: .cache/ms-playwright
browser artifacts:  test-results/, playwright-report/, playwright-pages-report/
coverage:           coverage/
```

For Linux browser packages only:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical Node 22 verification, deterministic loopback, setup, and process
cleanup:

```sh
E2E_PORT=42086 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
  npm_config_cache="$PWD/.cache/npm" \
  npm exec --yes --package=node@22 -- sh ./scripts/verify
```

`@playwright/test` is pinned in `package.json`; `test:e2e` and
`test:e2e:pages` use `.cache/ms-playwright`, never a user-home cache, global
browser, or existing profile.

## Important architectural decisions

- D-032 records this owner-authorized post-§20.7 presentation boundary. Native
  `details` are the only new presentation primitive: no app-wide design system,
  component framework, schema, tab, or automatic navigation.
- The global summary is regular document flow, not an overlay. The header panel
  is an anchored, focusable overlay only while intentionally opened; it does
  not change scrolling or cover the current tab by default.
- Speed selection intentionally closes its secondary disclosure; it does not
  change the exact speed command or Worker ownership. Help dismissal targets
  the outer summary because the original inner Help control is intentionally
  hidden when its disclosure closes.
- Existing test helpers own the repeated open-before-inspect contract, avoiding
  scattered selectors while retaining all prior semantic assertions.

## Device smoke availability

- **iOS simulator:** `xcrun --find simctl` located Xcode's `simctl`; `xcrun
simctl list devices available` reported booted `Emot-ID iPhone SE`
  (`759590EF-1B88-4B2E-AD40-73D8FC972419`). `xcrun simctl openurl booted
http://127.0.0.1:42078/` then `xcrun simctl io booted screenshot
/tmp/goldlocks-r078-ios-smoke.png` rendered the local app in Mobile Safari,
  including the compact Help/motion control, resources, current first-session
  context, and bottom navigation.
- **Android USB:** `adb devices -l` reported connected Pixel 6a
  `25121JEGR11385`; `adb -s 25121JEGR11385 reverse tcp:42078 tcp:42078` and
  `adb -s 25121JEGR11385 shell am start -W -a android.intent.action.VIEW -d
http://127.0.0.1:42078/` opened the local app in Chrome. Screenshot
  `/tmp/goldlocks-r078-android-build-current.png` showed rendered app and
  Chrome's installable-PWA prompt. The device's active TalkBack interception
  sent a subsequent shell-back interaction to TalkBack Settings, so no Android
  in-app touch activation is claimed. The committed hasTouch Playwright test
  remains acceptance evidence for touch behavior.

## Known limitations and risks

- Real-device smoke is exploratory only; pinned Playwright remains the
  reproducible acceptance authority. Android screen-reader state prevented a
  safe direct in-app activation repeat; no app state was intentionally changed
  after the rendered Chrome smoke.
- iOS screenshot confirms Safari rendering, not an installed standalone PWA;
  committed root/Pages Playwright checks cover PWA/offline behavior.
- Hosted CI, deployment, and push were not performed by this candidate.
- Lockfile installation may report existing development-dependency advisories;
  canonical production-only audit is the release gate.

## Checks executed before handoff

- Node 22 focused browser lane:

  ```sh
  E2E_PORT=42083 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/command-deck.spec.ts tests/e2e/first-session.spec.ts \
    tests/e2e/game.spec.ts tests/e2e/jobs-portrait-margin.spec.ts --reporter=line
  ```

  passed 36/36 (`test-results/.last-run.json`: `status: passed`). This covers
  starter/expanded screenshots, raw Jobs reserve, 200% text/reduced motion,
  focus, Career draft, placement cancellation, and pointer/touch drag.

- Candidate-owned Node 22 keyboard/touch disclosure regression:

  ```sh
  E2E_PORT=42085 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/command-deck.spec.ts \
    -g 'compact global disclosures accept keyboard and touch' --reporter=line
  ```

  passed 1/1. It creates a separate `hasTouch: true` context; keyboard Space
  toggles Help/motion and `locator.tap()` opens Simulation without hiding its
  full controls.

- First full canonical attempt exposed only progressive-disclosure test
  sequencing: Help/motion intentionally overlays Simulation while open, and a
  retained speed assertion held a locator after deliberate speed-selection
  collapse. The shared helper now closes Help/motion through its own summary
  before Simulation, the animation test explicitly reopens Help/motion before
  its visible Motion action, and the retained speed assertion reopens
  Simulation. No production behavior or assertion was weakened. Focused reruns
  passed: root `round-009-usability.spec.ts` plus
  `verifier-round-043.spec.ts` 7/7; Pages `pages.spec.ts` 2/2.
- Final canonical Node 22 command completed with exit 0:

  ```sh
  E2E_PORT=42092 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- sh ./scripts/verify
  ```

  Format, lint, TypeScript, 45 unit/property files / 223 tests, numeric and
  seeded balance lanes (first-session 41, upgrades 20,001, progression 41,
  Career 101, evaluation 121), production build, production audit (0
  vulnerabilities), root Playwright 217/217, and Pages Playwright 2/2 passed.
  Web-server processes were Playwright-managed and exited with the command.

- Unchanged `round-075-adversarial.mjs` passed against a fresh Node 22 preview:
  `findings: []`, raw Jobs Queue/action clearances 136.453125px at 320×693 and
  157.3125px at 393×742, zero horizontal overflow, and no visible control
  below 44px. The older immutable `round-076-adversarial.mjs` starts its raw
  100%/200% Jobs evidence then reaches a hard-coded direct `64×` click in its
  manual-handoff setup; this intentionally hidden secondary control now needs
  that verifier-owned probe to open Simulation first. It was not edited or
  treated as a product failure; fresh verification owns any probe adaptation.
- Node 22 drag repeat after the final canonical run:

  ```sh
  E2E_PORT=42093 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/game.spec.ts \
    --grep 'supports pointer drag and compatible active-module reordering|supports touch drag between compatible active slots' \
    --repeat-each=10 --reporter=line
  ```

  passed 20/20 direct pointer/CDP-touch reordering runs.

## Checks not run

- No unsupported global browser or user-home cache installation; repository
  local caches are required by the project protocol.
- No hosted CI/deployment/push. These require external release authority and
  are outside this candidate handoff.
