# Candidate handoff — Milestone 7A release foundation and navigation

## Implemented behavior summary

- Added a machine-validated `.agent/verification/catalog.json` covering active
  M7A requirements, every immutable finding ID, superseded probes, and the
  historical accepted Milestone 6 snapshot.
- Added `scripts/validate-verification-catalog.mjs` and the
  `validate:verification-catalog` package command. `./scripts/verify` runs it
  before setup and the expensive lanes; contradictory or unclassified report
  findings fail closed.
- Refreshed `.agent/CURRENT_SCOPE.md` and `.agent/verification/INDEX.md` as
  compact M6/M7A routing maps without volatile HEAD/verdict/next-gate claims.
- Replaced the append-only handoff with this current-candidate-only record;
  prior handoffs remain recoverable through Git history and immutable reports.
- Added `.agent/RELEASE_ACCEPTANCE.md` with the concrete Milestone 7 matrix
  and exact gate order.
- Kept all eight primary destinations in their existing stable order and
  minimum 44px target contract. At narrow widths the bottom navigation now
  announces horizontal disclosure, shows a visible direction cue, and reveals
  the active destination after keyboard/touch/state changes.

## Plan requirements covered

- `plan.md` §§2.4, 20, 24, 27, 29, 34 and D-040–D-041 routing and release
  evidence boundaries.
- Bottom-tab-only global routing; no new destination or simulation command.
- Rule of Three navigation evidence: normal 393px fit; 320px overflow,
  keyboard/touch reveal; 200% text, resize and reload lifecycle.
- Reproducible pinned Playwright/browser cache and canonical verification
  commands remain the repository contract.

## Verifier findings resolved

- No prior unresolved product finding was in scope. The candidate carries the
  accepted Milestone 6 verifier baseline and routes all historical findings by
  stable ID. M7A adds active navigation/release requirements for independent
  verification.

## Setup, startup, and verification commands

Dependencies and browser use ignored repository-local caches:

```sh
./scripts/setup
./scripts/run
# deterministic loopback: http://127.0.0.1:4173/
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
```

Focused catalog and browser checks:

```sh
npm run validate:verification-catalog
E2E_PORT=42496 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts
```

Canonical gate (one final run after all executable edits):

```sh
INSTALL_PLAYWRIGHT=0 E2E_PORT=42497 \
  VERIFY_EVIDENCE_DIR=.cache/verification/round-094-final \
  npm_config_cache="$PWD/.cache/npm" \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
  ./scripts/verify
```

## Important architectural decisions

- `scripts/validate-verification-catalog.mjs` validates immutable report
  identity/verdicts, unique finding coverage, resolution evidence, decision
  references, active requirement paths, and superseded-probe replacements.
  Live Git/report state remains owned by `./scripts/agent-status`.
- Navigation uses a small App-local controller: one ref for the strip, one
  button-ref map, one overflow state, and active-tab reveal. It does not add a
  router, state library, reordered tabs, or automatic navigation.
- CSS scroll snap, `touch-action: pan-x`, edge indicators and an accessible
  instruction make existing overflow explicit while preserving target size.

## Known limitations and risks

- The Milestone 7 matrix remains open for native VoiceOver/TalkBack, WebKit,
  low-end mobile performance, audio, localization readiness, packaging scope,
  and release receipts; M7A does not implement those features.
- Historical probes listed as superseded remain immutable and may intentionally
  report obsolete expectations. Use catalog replacement evidence.
- Hosted independent verification and exact-SHA deployment are not performed
  by the Implementer and must assess this exact candidate.

## Checks not run / final evidence

- Focused evidence after the executable edits:
  `npm run validate:verification-catalog` passed (93 immutable reports, 94
  findings, 4 active requirements); `npm run format:check`, `npm run lint`,
  and `npm run typecheck` passed; the focused UI unit lane passed 2 files / 11
  tests; the routing/catalog lane passed 2 files / 9 tests; and the pinned
  navigation browser lane passed 3 tests at 320px, 393px, and 200% text.
- Final canonical evidence is `.cache/verification/round-094-final`:
  `verification-catalog=passed`, `setup=passed`, `format=passed`,
  `lint=passed`, `typecheck=passed`, `unit=passed` (66 files / 305 tests),
  `balance=passed`, `build=passed`, `production-audit=passed`,
  `root-browser-pwa=passed` (238 tests), and `pages-offline=passed` (2
  tests). The gate exited 0.
- Native-device, WebKit, and external hosted release checks are not run in this
  role; the reason is scope/independent-verifier ownership, not a silent skip.
