# Candidate handoff — round 048 delivery-pipeline hardening

## Implemented behavior summary

- Product, game, Career scheduling, PWA behavior, UI, styles, fixtures, and
  immutable verifier tests are unchanged.
- Hosted Verify is split into five explicit parallel lanes: static/unit/build
  plus production audit; deterministic balances; early 320px portrait and
  reduced-motion smoke; complete root browser/PWA; and Pages/offline. A small
  aggregate job fails unless every lane succeeds.
- Every verification lane checks out the event SHA, records and asserts its
  exact `GITHUB_SHA`, uses ignored repository-local npm/Chromium/XDG caches,
  and uploads lane-specific evidence. The shared composite action eliminates
  repeated Node setup, frozen-SHA metadata, and locked dependency installation
  across all five lanes.
- `./scripts/verify` remains the complete local canonical command and now also
  gates `npm audit --omit=dev --audit-level=high` before browser checks.
- Pages uses `actions/configure-pages@v6`,
  `actions/upload-pages-artifact@v5`, and `actions/deploy-pages@v5`.
  Verification artifacts use `actions/upload-artifact@v7`; checkout and Node
  setup remain `@v6`.
- `typescript-eslint` is updated from 8.19.1 to compatible 8.65.0. Full npm
  audit findings fall from 11 high dev-only findings to 5; production audit is
  clean.
- Hosted run `30305202912` attempt 1 missed strict Pages A-to-B convergence
  once. Its exact-SHA attempt 2 succeeded; a local 20-repeat root/Pages probe
  passed 40/40. The strict test remains unchanged; no timeout or assertion was
  weakened.

## Plan requirements covered

| Requirement                                                                            | Evidence                                                                                                             |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| §27 reproducible complete verification                                                 | `./scripts/verify`; lane contract unit tests; exact frozen-SHA metadata and aggregate gate                           |
| Browser/PWA deterministic checking                                                     | Pinned `@playwright/test`; loopback servers; repository-local Chromium cache; root and Pages suites remain canonical |
| Portrait, touch, text scale, reduced motion, persistence, reload, and offline coverage | Early 320px smoke plus retained complete root (155 cases) and Pages/offline (2 cases) Playwright lanes               |
| Reproducible hosted delivery                                                           | Node 22 with `checkout/setup-node@v6`; official Node-24-generation artifact and Pages actions; per-lane evidence     |
| Production dependency security gate                                                    | `npm audit --omit=dev --audit-level=high` in local canonical and hosted static/unit/build lane                       |

## Verifier findings resolved

- No unresolved verifier finding IDs existed at this candidate’s starting SHA.
- The old workflow-contract unit test expected one `canonical` job and
  `upload-artifact@v4`; it now asserts the complete five-lane contract,
  aggregate results, local cache policy, canonical audit, and Pages/action
  versions.
- Hosted exact-SHA run `30305202912` attempt 1 was diagnosed rather than
  papered over. Attempt 2 was successful for
  `d4c408cb63fc42c7b7f962c63aeab7175f1dd0c6`, so no product or test semantic
  change was invented.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json`
(`^20.19.0 || >=22.12.0`). First setup needs network access for lockfile
dependencies and pinned Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

Repository-local ignored caches and artifacts:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
XDG cache: .cache/xdg
evidence:  .cache/verification/
artifacts: coverage/, playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser libraries when needed:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

The hosted static/balance lanes reuse setup without downloading Chromium:

```sh
INSTALL_PLAYWRIGHT=0 ./scripts/setup
```

Canonical full verification:

```sh
./scripts/verify
```

`./scripts/verify` runs fresh locked setup; format; lint; typecheck;
unit/property coverage; deterministic balances; production build; production
dependency audit; root Playwright; and Pages/offline Playwright. It starts
deterministic `127.0.0.1:4173` loopback previews and cleans them up. It needs no
home cache, global package, existing browser, or browser profile.

If port 4173 is occupied:

```sh
E2E_PORT=4174 ./scripts/verify
```

Focused commands used for this delivery change:

```sh
E2E_PORT=4174 npm run test:e2e -- tests/e2e/game.spec.ts --grep 'renders and remains reachable at 320px|honors reduced motion and remains usable at 150% text scale' --reporter=line
E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-028.spec.ts --repeat-each=20 --reporter=line
npx vitest run --coverage.enabled=false src/test/verifyWorkflow.test.ts --reporter=verbose
```

## Important architectural decisions

- The repository-local composite action is intentionally narrow: it removes
  repeated Node setup, SHA evidence, and setup invocation across five lanes.
  Each job still performs its own visible `checkout@v6`, because a local action
  cannot be loaded before checkout.
- The workflow reuses existing package scripts and `scripts/setup`; it does not
  create a second verification framework. `INSTALL_PLAYWRIGHT=0` only avoids a
  browser download for lanes that do not launch a browser; local setup defaults
  to installing pinned Chromium.
- The static lane runs all static/unit/build checks from the canonical command;
  balances, portrait smoke, full root browser/PWA, and Pages/offline each have
  an independently useful log/report artifact. The aggregate gate is the
  required-status surface.
- `typescript-eslint` 8.65.0 supports the declared Node/ESLint/TypeScript
  ranges and upgrades its nested `minimatch`/`brace-expansion` path. ESLint 10
  is the only audit-proposed remaining fix and is deliberately not taken as a
  major/forced dependency change.

## Known limitations and risks

- `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. Full
  audit still reports five high dev-only findings in ESLint 9’s `minimatch` /
  `brace-expansion` chain; npm proposes ESLint 10, a major update. No
  `npm audit fix --force` was used.
- The historical Pages A-to-B miss did not reproduce: hosted attempt 2 and
  40/40 local transitions passed. It remains a monitored residual rather than
  a reason to weaken strict PWA convergence evidence.
- The separate observed Career scheduling behavior is outside this delivery
  hardening scope and was not changed.
- Physical-device, non-Chromium, battery/thermal, and platform screen-reader
  sessions remain environmental residuals.

## Checks executed before candidate handoff

- `npm audit --omit=dev --audit-level=high` — passed: 0 vulnerabilities.
- Full `npm audit --json` before and after the dev-tool update — 11 high to 5
  high, all development dependency findings; command exits nonzero by npm
  design when findings exist.
- `INSTALL_PLAYWRIGHT=0 ./scripts/setup` — passed; fresh locked install without
  browser download.
- `npm run lint && npm run typecheck && npm run build && npm audit --omit=dev --audit-level=high` — passed.
- `ruby -e 'require "yaml"; ...'` for both workflows and the composite action — parsed successfully.
- Focused 320px/reduced-motion command above — passed: 2/2.
- Exact stale-worker probe above — passed: 40/40 in 1.4 minutes.
- `XDG_CACHE_HOME=/private/tmp/goldlocks-gh-cache gh run view 30305202912 --attempt 2 ...` — successful exact-SHA hosted rerun; canonical job started 2026-07-27 21:12:26 UTC and completed 21:23:47 UTC.
- `E2E_PORT=4174 ./scripts/verify` — passed, exit 0: format; lint; typecheck;
  31 unit/property files / 154 tests; all deterministic sweeps; build;
  production audit; 155/155 root Playwright; 2/2 Pages/offline.

## Checks not run

- No push, deployment, or candidate GitHub Actions run; those require external
  branch/repository state beyond this Implementer turn.
- No physical-device or non-Chromium session; required hardware/services are
  unavailable.
