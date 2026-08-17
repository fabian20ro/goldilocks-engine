# Candidate handoff — Round 096 hosted browser repair

## Implemented behavior summary

- Updated `tests/e2e/navigation-affordance.spec.ts` to assert the actual
  navigation contract at 393px/320px and injected 200% text: stable eight-tab
  order, active destination fully inside the strip, >=44px targets, accurate
  left/right overflow cues, the swipe instruction when the strip overflows, and
  no document-level horizontal overflow. The test no longer assumes that
  Linux font metrics make the strip itself fit at 393px/200%.
- Added a root A-registration lifecycle barrier to
  `tests/e2e/verifier-round-029.spec.ts` before opening the live Pages A client
  and requesting the stale-URL A-query/B-body update. The fixture now waits for
  the initial root worker to be fully activated, controlled, and responsive;
  it still requires exact root B convergence, Pages A isolation, persistence,
  and offline reload. No production PWA code or plan/report was changed.
- The machine-validated verification catalog and routing maps remain valid and
  unchanged; these hosted failures introduced no new immutable finding ID.

## Plan requirements covered

- M7A-NAV-001/002: stable bottom-tab routing, narrow disclosure, active reveal,
  normal/boundary/lifecycle behavior, keyboard/touch operation, 200% text,
  resize, and reload.
- D-008: static-host stale-worker URL repair, atomic root update, live nested
  Pages-shell isolation, persistence, and offline recovery remain asserted by
  the historical Round-029 probe.
- Rule of Three: direct normal navigation; 320px/200% boundary cues and
  keyboard/touch reveal; 393-to-320 resize/reload lifecycle.

## Verifier findings resolved

- Hosted run `32013485278` reported two root-browser failures on accepted
  candidate `bf8bdd7ff669ddfe32eacef118bb8e989c9ec6ef`:
  - navigation line 169 assumed no strip overflow at Linux 393px/200% text;
    the product contract is now tested without that invalid premise;
  - Round-029 remained on root A in one slow initial-install/update ordering;
    the verifier fixture now settles root A before exercising the mixed-scope
    transition.
- No production defect was established in either seam; the accepted PWA
  implementation and navigation behavior remain under independent verification.

## Setup, startup, and verification commands

Dependencies and browser use ignored repository-local caches:

```sh
./scripts/setup
./scripts/run
# deterministic loopback: http://127.0.0.1:4173/
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
```

Focused evidence for this candidate:

```sh
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test \
  tests/e2e/navigation-affordance.spec.ts \
  tests/e2e/verifier-round-029.spec.ts --workers=1
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test \
  tests/e2e/navigation-affordance.spec.ts --repeat-each=3 --workers=1
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test \
  tests/e2e/verifier-round-029.spec.ts --repeat-each=5 --workers=1
npm run validate:verification-catalog
npm run typecheck
npm run lint
npx prettier --check tests/e2e/navigation-affordance.spec.ts \
  tests/e2e/verifier-round-029.spec.ts
git diff --check
```

Canonical final gate:

```sh
INSTALL_PLAYWRIGHT=0 E2E_PORT=42497 \
  VERIFY_EVIDENCE_DIR=.cache/verification/round-096-final \
  npm_config_cache="$PWD/.cache/npm" \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
  ./scripts/verify
```

## Important architectural decisions

- The navigation assertion is intentionally test-only: platform font metrics
  may make the scroll strip overflow at 393px/200%, while the user-visible
  contract remains active-target visibility, explicit instruction/cues, target
  size, and document fit. No tab order, auto-navigation, or production CSS was
  broadened.
- The Round-029 barrier is test-fixture synchronization, not a sleep, retry
  loophole, or production delay. It verifies the initial root worker identity
  before the concurrent Pages scope is introduced and retains exact B identity
  assertions after the update.

## Known limitations and risks

- Hosted Linux browser evidence was available only through the failed run log;
  local pinned Chromium on macOS passes the revised cross-metric contract.
- Native VoiceOver/TalkBack, WebKit, physical-device timing, low-end mobile
  performance, audio/localization, packaging, and exact-SHA deployment remain
  outside this Implementer handoff and require independent release evidence.
- The current candidate has no fresh independent Verifier verdict yet.

## Checks not run / final evidence

- Focused final checks passed: combined navigation/PWA lane 4/4; navigation
  repeat 3 runs (9/9); Round-029 repeat 5 runs (5/5); typecheck; lint;
  Prettier; diff check. Browser commands used the pinned repository-local
  Chromium outside the managed sandbox because Chromium cannot create its macOS
  Mach port inside that sandbox.
- `npm run validate:verification-catalog` passed: 95 immutable reports, 95
  findings, and 4 active requirements.
- Final canonical evidence is `.cache/verification/round-096-final`:
  catalog, setup, format, lint, typecheck, unit (66 files/305 tests), balance,
  build, production audit (0 vulnerabilities), root-browser-pwa (238 tests),
  and Pages/offline (2 tests) all passed. `./scripts/verify` exited 0.
- Canonical setup reported four development-dependency advisories; these are
  retained in evidence and are not introduced by this candidate.
