# Candidate handoff — Round 097 navigation lifecycle repair

## Implemented behavior summary

- Re-reveals the active bottom-navigation destination synchronously on every
  viewport resize, before the existing bounded animation-frame stabilization.
  This closes the 393-to-320 gap where Linux font metrics could clip the active
  World tab for the first frame after a resize; ResizeObserver/font reflow and
  scroll-snap settling remain covered by the retry pass.
- Extended the focused 200% text scenario to reduced motion and a small label
  metric expansion. It retains direct activation, the first 320px boundary,
  keyboard activation, repeated 393-to-320 resize, and reload checks.
- Stable eight-tab order, 44px targets, touch/keyboard behavior, overflow
  instruction/cues, and the Round-029 PWA repair remain unchanged.

## Plan requirements covered

- M7A-NAV-001/002: active reveal at normal and narrow widths, 200% text,
  reduced motion, keyboard/touch input, resize lifecycle, reload, stable order,
  explicit overflow disclosure, and no document-level overflow.
- Rule of Three: direct activation; first narrow boundary; repeated wide-to-
  narrow text-scale resize with reduced motion and reload recovery.

## Verifier findings resolved

- Hosted run `32017369881` exposed the remaining navigation defect: after
  200% text and 393-to-320 resize, active World could remain at `right=348`
  against a `320px` navigation box. Resize handling now performs the reveal
  synchronously and keeps the post-layout stabilization for metric churn.
- No PWA production or fixture code changed. No new immutable finding ID or
  catalog/routing entry is required; the prior `V-094-001` resolution remains
  retained.

## Setup, startup, and verification commands

Dependencies and browsers use ignored repository-local caches:

```sh
./scripts/setup
./scripts/run
# deterministic loopback: http://127.0.0.1:4173/
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
```

Focused evidence:

```sh
npm run typecheck
npm run lint -- --quiet
npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts
npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts -g '200%'
npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts -g '200%' --repeat-each=3
git diff --check
```

Canonical gate attempted once after executable edits:

```sh
INSTALL_PLAYWRIGHT=0 E2E_PORT=42497 \
  VERIFY_EVIDENCE_DIR=.cache/verification/round-097-final \
  npm_config_cache="$PWD/.cache/npm" \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
  ./scripts/verify
```

## Important architectural decisions

- Resize handling now does one immediate geometry-based reveal, then retains
  the existing 250ms animation-frame pass. This is the smallest lifecycle
  repair: no tab reorder, auto-navigation, hidden overflow, speculative state,
  or scroll behavior change.
- The acceptance test deliberately keeps the active-target visibility
  assertion. Its injected 200% root size plus slight label-spacing expansion
  provides a deterministic stress case for platform-sensitive font metrics;
  the product contract remains target visibility, cues/instruction, target
  size, and document fit.

## Known limitations and risks

- The hosted Linux failure was reproduced from run `32017369881`; this
  candidate still needs a fresh independent hosted Verifier run at its exact
  commit SHA.
- Native VoiceOver/TalkBack, WebKit, physical-device timing, low-end mobile
  performance, audio/localization, packaging, and exact-SHA deployment remain
  release-matrix work.
- No plan or immutable verification report was edited.

## Checks not run / final evidence

- Focused navigation acceptance passed locally; the 200% reduced-motion case
  passed three consecutive repetitions. Typecheck, lint, and diff checks passed.
- Canonical pre-browser stages passed: verification catalog, setup, format,
  lint, typecheck, 66-file/305-test unit suite, balance, build, and production
  audit. Evidence: `.cache/verification/round-097-final/`.
- Canonical `root-browser-pwa` did not verify product behavior: all 238 cases
  failed at browser launch because macOS Chromium could not register its Mach
  port inside the managed sandbox (`MachPortRendezvousServer ... Permission
denied`). The gate stopped before Pages/offline. This is an infrastructure
  limitation, not a product result; do not treat the canonical gate as PASS.
