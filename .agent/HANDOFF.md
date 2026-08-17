# Candidate handoff — Round 098 convergence and release-gate repair

## Implemented behavior summary

- Removed the ineffective same-task navigation reveal added in Round 097.
  The production ResizeObserver plus bounded animation-frame controller remains
  the lifecycle convergence mechanism.
- Changed navigation visibility evidence to a bounded Playwright web-first poll
  followed by the unchanged strict geometry assertions. The test now waits for
  actual post-layout convergence without a fixed sleep or weakened boundary.
- Changed Verify and GitHub Pages workflows from push-triggered execution to
  explicit manual dispatch with a required frozen candidate tag/commit-SHA
  input. Every Verify lane checks out that ref; Pages verifies resolved ref,
  `HEAD == GITHUB_SHA`, and writes the candidate identity before build/deploy.
- Added workflow regression tests and decision D-042. Stable navigation order,
  44px targets, PWA behavior, and existing release scope remain unchanged.

## Plan requirements covered

- M7A-NAV-001/002: normal 393px, 320px boundary, 200% text, reduced motion,
  keyboard/touch, resize/reload, focus, active reveal, cue/instruction, and
  strict final target geometry.
- M7A-RELEASE-001: release workflow candidate identity, manual exact-SHA gate,
  no duplicate push-triggered verification, and no automatic Pages deployment.
- Rule of Three: direct activation; 320px keyboard/touch boundary; repeated
  200% reduced-motion 393-to-320 lifecycle with reload.

## Verifier findings resolved

- Hosted run `32020908888` showed the assertion reading stale geometry ~9ms
  after resize, before the first animation frame; the trace also showed local
  convergence. The assertion now polls for visible geometry and rechecks it
  strictly after convergence. No arbitrary delay or platform-specific branch
  was added.
- Push-trigger duplication and automatic deployment risk are closed by D-042:
  both release workflows require manual `candidate_ref` dispatch and preserve
  exact SHA checks. No immutable verifier report was edited.

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
npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts -g '200%' --repeat-each=3
npx vitest run --coverage=false src/test/verifyWorkflow.test.ts src/test/pagesWorkflow.test.ts
npm run validate:verification-catalog
git diff --check
```

Canonical gate, once after executable edits:

```sh
INSTALL_PLAYWRIGHT=0 E2E_PORT=42498 \
  VERIFY_EVIDENCE_DIR=.cache/verification/round-098-final \
  npm_config_cache="$PWD/.cache/npm" \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
  ./scripts/verify
```

Hosted release usage is now explicit:

```text
workflow_dispatch(candidate_ref=<frozen tag or commit SHA>)
```

The dispatch ref and input must resolve to the same `GITHUB_SHA`; a mismatched
or mutable candidate fails before expensive work/build/deploy.

## Important architectural decisions

- Navigation evidence uses Playwright polling because ResizeObserver/rAF
  convergence is asynchronous. The final geometry assertion remains exact;
  this distinguishes stale first-frame observation from settled behavior.
- D-042 is the material release-safety decision: manual exact-candidate gates
  reduce quota use and prevent verifier-head push events from deploying. The
  existing checkout/action `HEAD == GITHUB_SHA` invariant remains authoritative.

## Known limitations and risks

- This candidate needs a fresh independent hosted Verifier run at its exact
  commit SHA; local browser launch may require scoped host authority on macOS.
- Native VoiceOver/TalkBack, WebKit, low-end performance/thermal evidence,
  audio, localization, packaging, hosted aggregation, and deployment receipts
  remain open release-matrix work.
- No plan or immutable verification report was edited.

## Checks not run / final evidence

- Focused navigation passed 3/3; the 200% reduced-motion lifecycle passed 3/3
  repetitions. Workflow regression tests passed 6/6. Typecheck, lint,
  Prettier, catalog validation, YAML parsing, and diff checks passed.
- An initial `npm test -- --run ...` focused invocation failed only because the
  repository-wide coverage thresholds cannot be met by two isolated files;
  the corrected `npx vitest run --coverage=false ...` invocation passed 6/6.
- Canonical evidence is `.cache/verification/round-098-final/`: catalog,
  locked setup, format, lint, typecheck, 66-file/306-test unit suite, all
  balance lanes, build, production audit (0 vulnerabilities), root browser/PWA
  238/238, and Pages/offline 2/2. `./scripts/verify` exited 0 once with
  scoped host authority so pinned Chromium could launch.
- Manual hosted workflow dispatch, deployment, and exact-SHA receipt were not
  run; no push or deployment was performed. Four development-dependency audit
  advisories from setup remain recorded in canonical evidence.
