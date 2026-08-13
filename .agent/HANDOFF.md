# Candidate handoff — round 073 first-session primary-action presentation

## Implemented behavior summary

- Added `selectFirstSessionPresentation`, a pure UI selector over the durable
  first-session state and transient explicit-placement selection. It derives
  the finite next action without dispatching commands, navigation, persistence,
  or economy changes:
  1. Queue the safe Interactive Chat starter in Jobs.
  2. Observe that starter's locked settlement in Jobs.
  3. Earn the exact remaining amount for Precision Cleaner in Jobs when its
     $4.00 purchase is not yet affordable.
  4. Buy that recommended module in Upgrades once affordable.
  5. Start placement there, then manually select Build and choose a compatible
     position.
- The contextual guide exposes the required tab and one state-specific
  handoff. It never changes tabs. Starting the recommended placement retains
  Upgrades and its scroll position; the bottom Build tab carries the real
  pending placement to the existing tray.
- Build replaces the premature $45 Workstation Expansion objective with the
  current first-session action until the guide completes. Jobs demotes Queue
  10, hides the optional target picker, and demotes Queue 1 whenever the
  required handoff has moved to Upgrades or Build. Upgrades presents the
  recommended module ahead of Workstation Expansion, rigs, and the remaining
  catalogue, then preserves the existing comparison and purchase mechanics.
- A failed starter now names the failed settlement in the guide while the Jobs
  recovery record remains the visible source for its precise reason and viable
  recovery. No failed work, slot, quote, or settlement data is discarded.
- Existing valid alternative first-session purchases remain valid: after an
  intentional paid alternative, the handoff names that purchased module rather
  than changing Worker-owned progress.

## Plan requirements covered

| Requirement                                             | Evidence                                                                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State-derived first-session sequence                    | Pure selector tests cover queue, observe, shortfall, affordable buy, owned handoff, pending placement, completion, failed settlement, and valid alternative purchase.                                          |
| One visible handoff / required tab / no auto-navigation | First-session Playwright flow asserts action attributes, required tab, intact Upgrades tab after placement start, no tray until manual Build, and pending tray after the manual switch.                        |
| No premature expansion priority                         | Build mission test excludes Workstation Expansion during onboarding; Upgrades test proves Precision Cleaner precedes its expansion section and the expansion action is not the primary onboarding action.      |
| Cross-tab, scroll, and input preservation               | Browser checks retain Upgrades scroll across the placement handoff and a Career draft plus per-tab scroll across manual navigation.                                                                            |
| Errors without work loss                                | Browser failure/recovery test removes the model, retains the failed settlement reason and all other slots, restores the model explicitly, and queues recovery.                                                 |
| Mobile/accessibility behavior                           | Pinned browser checks cover 320×693, iPhone-SE-like 375×667, and 393×742; 200% text, reduced motion, touch drag, keyboard cancellation, reload/resume, offline/PWA, and retained Phase 3 geometry regressions. |
| Preserve mechanics/persistence/PWA                      | No simulation command, schema, economy, Worker, PWA, or persistence path changed; canonical retained suites cover them.                                                                                        |

## Verifier findings addressed

- The round-072 baseline had no unresolved verifier finding IDs. This bounded
  Phase 1 work changes only first-session presentation and associated
  regression expectations for the explicitly required manual Build handoff.
- Retained placement regressions now explicitly use the Build tab after the
  first-session handoff. They still verify the same placement tray, Snap,
  persistence, and completion behavior without asserting the now-prohibited
  surprise auto-navigation.

## Setup, startup, and verification commands

Prerequisite: a Node version accepted by `package.json` (Node 20.19.0+ or Node
22.12.0+). First setup requires network access for lockfile-pinned packages and
the pinned Chromium revision.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173/
```

Repository-local ignored artifacts:

```text
npm cache:          .cache/npm
Playwright browser: .cache/ms-playwright
test artifacts:     coverage/, playwright-report/, playwright-pages-report/, test-results/
```

Linux hosts that need browser system packages may use:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical verification recreates dependencies from the lockfile, starts
deterministic loopback servers, waits for readiness, and lets Playwright clean
up every web-server process:

```sh
E2E_PORT=4193 ./scripts/verify
```

Focused first-session evidence:

```sh
npm run typecheck
npx vitest run src/ui/firstSessionPresentation.test.ts src/ui/careerView.test.tsx --coverage.enabled=false
E2E_PORT=4178 npm run test:e2e -- tests/e2e/first-session.spec.ts tests/e2e/command-deck.spec.ts tests/e2e/jobs-portrait-margin.spec.ts tests/e2e/round-012-upgrades.spec.ts tests/e2e/round-015-expansion.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/verifier-round-036.spec.ts tests/e2e/verifier-round-041.spec.ts tests/e2e/verifier-round-049.spec.ts tests/e2e/verifier-round-050.spec.ts
```

`@playwright/test` is pinned in `package.json`; both `test:e2e` commands set
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright`, never a global browser or
user-home cache. On this macOS host Chromium must run outside the workspace
sandbox because its local Mach-port rendezvous cannot be created inside it.

## Important architectural decisions

- D-031 records the product boundary: a thin pure presenter derives only the
  finite onboarding handoff. Existing engine progress remains authoritative;
  tab navigation, placement transaction state, and all Worker commands stay in
  their established owners.
- The recommendation is presentation priority, not a new purchase rule.
  Precision Cleaner is the default live next paid module, while an existing
  valid alternate purchase is respected for the final explicit placement.
- The manual Upgrades-to-Build handoff is intentionally reversible and
  unsurprising: it preserves the current tab and scroll, exposes the pending
  state, and lets an ordinary Build-tab selection reveal the existing tray.
- No state framework, page, design system, asset, simulation schema, or
  speculative control was added. Emoji/color grammar, 44px targets, existing
  disclosures, touch/keyboard placement, PWA scope, and persistence survive.

## Known limitations and risks

- No physical mobile-device, non-Chromium browser, or external screen-reader
  session was available. Pinned Chromium covers required portrait, text-scale,
  touch, keyboard, reduced-motion, persistence/reload, offline, recovery, and
  PWA paths.
- Remote push, deployment, GitHub-hosted verification, and Pages smoke remain
  external release steps and were not performed.

## Checks executed before handoff

- `npm run typecheck` — passed.
- `npx vitest run src/ui/firstSessionPresentation.test.ts src/ui/careerView.test.tsx --coverage.enabled=false` — 2 files / 13 tests passed.
- Initial canonical `E2E_PORT=4190 ./scripts/verify` exposed one retained
  browser regression: `verifier-round-036` found two open Upgrades Details
  surfaces (the new recommended module plus the normal rig default). Static,
  unit/property, balance, 210/211 root browser, and 2/2 Pages lanes otherwise
  passed. The repair gives onboarding its one recommended Details surface while
  retaining the normal rig default after completion.
- Exact repair evidence:
  `E2E_PORT=4178 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts tests/e2e/first-session.spec.ts` — 12/12 passed.
- Expanded focused browser matrix shown above — 51/51 passed; its local
  `test-results/.last-run.json` recorded `status: passed`.
- Final isolated canonical command:
  `E2E_PORT=4193 ./scripts/verify`, captured at
  `/tmp/goldlocks-r073-commit-canonical.log` — terminal marker
  `R073_COMMIT_CANONICAL_EXIT=0`; format, lint, and TypeScript passed; 45
  unit/property files / 223 tests passed; first-session 41, upgrades 20,001,
  progression 41, Career 101, and evaluation 121 balance seeds had zero
  failures; production audit found `0` vulnerabilities; root Playwright
  211/211; Pages 2/2.

## Checks not run

- No required local check is intentionally skipped. No verifier report or
  immutable verification artifact was changed.
- Deployment, push, hosted CI, physical-device, non-Chromium, and external
  screen-reader checks were not run because they are outside this Implementer
  handoff.
