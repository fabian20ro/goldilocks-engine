# Candidate handoff — round 050 retained stale-save fixture stabilization

## Implemented behavior summary

- Product, game, Career scheduling, PWA behavior, UI, styles, simulation,
  Worker, persistence, and build tooling are unchanged; only the retained
  Playwright fixtures `tests/e2e/verifier-round-041.spec.ts` and
  `tests/e2e/command-deck.spec.ts`, plus this handoff, changed.
- V-056 found that its forged-save test wrote a synthetic record into a live
  page and immediately reloaded. The old page's dedicated Worker sometimes
  persisted its valid step-3 snapshot during unload, so the new page saw stale
  state instead of the forged record. The test now serializes the intended
  forged record without writing it live, opens an isolated browser context,
  seeds it through a one-shot preboot init script, and asserts fail-closed step
  1 / no Queue 10 from the actual booted forged state. It continues to collect
  page and console errors from both source and restored pages.
- The nearby legitimate paid-purchase stale-save test used the same live-write
  plus reload boundary. Its end assertion could pass if the intended stale
  mutation lost the race, so it now reuses the same local preboot fixture.
- The canonical run also exposed the same race in command-deck expansion
  setup: its synthetic `$45` write could be overwritten during reload, leaving
  the expansion purchase disabled. Its existing `activateExpansion` helper now
  closes the source page, uses a one-shot preboot seed for the next page, keeps
  the portrait viewport, and returns that real restored page for the unchanged
  buy/activate/expanded-rail assertions. No unrelated storage/reload fixture
  was refactored.
- The preboot script is deliberately one-shot per fresh context. A later reload
  uses app-owned persistence, not test reseeding. No sleep, retry policy,
  timeout increase, weakened assertion, or production behavior change was
  introduced.
- The first-session Playwright fixture no longer writes synthetic money into a
  live page immediately before reload. It captures the durable step-3 save,
  closes the page to terminate its dedicated Worker, then seeds that exact
  fixture before the next page boot while preserving the portrait viewport.
  The test explicitly re-proves the restored step-3 rail and that the real
  Precision Cleaner purchase action is enabled before retaining every existing
  Buy → Place → Build handoff assertion.
- Hosted exact-SHA Verify run `30309731209` exposed the old fixture race:
  root browser/PWA had one failure, while 154/155 root cases and all other
  hosted lanes passed. Its artifact showed the old Worker overwrote the
  synthetic `$4.00` with the real `$1.33` settlement during reload. No product
  or simulation behavior changed to address this test/tooling defect.
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

| Requirement                                                                                           | Evidence                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §27 reproducible complete verification                                                                | `./scripts/verify`; lane contract unit tests; exact frozen-SHA metadata and aggregate gate                                                              |
| Browser/PWA deterministic checking                                                                    | Pinned `@playwright/test`; loopback servers; repository-local Chromium cache; root and Pages suites remain canonical                                    |
| Portrait, touch, text scale, reduced motion, persistence, reload, and offline coverage                | Early 320px smoke plus retained complete root (158 cases) and Pages/offline (2 cases) Playwright lanes                                                  |
| §20.6 / D-017 durable first-session resume, integrity recovery, and explicit purchase/install handoff | Fresh-context preboot forged-save fail-closed assertion, adjacent legitimate stale-save recovery, and retained explicit placement/cancellation coverage |
| Reproducible hosted delivery                                                                          | Node 22 with `checkout/setup-node@v6`; official Node-24-generation artifact and Pages actions; per-lane evidence                                        |
| Production dependency security gate                                                                   | `npm audit --omit=dev --audit-level=high` in local canonical and hosted static/unit/build lane                                                          |

## Verifier findings resolved

- V-056 — resolved: the retained forged-save browser regression no longer lets
  an old page's Worker overwrite its test fixture during reload. The exact
  fail-closed assertions remain unchanged and now exercise the intended forged
  snapshot before application boot.
- The adjacent retained legitimate stale-save regression now has the same
  deterministic preboot boundary, preventing an unobserved valid-state
  overwrite from masking that test's recovery path.
- The command-deck expansion fixture had the same test-only live-write/reload
  defect. It now seeds its exact `$45` state before the next page boots while
  retaining the original real purchase and six-position pipeline assertions.
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
E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --grep 'damaged save cannot use a forged installed module to skip the first purchase' --repeat-each=20 --reporter=dot
E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --grep 'a real first purchase survives benign stale-save recovery after later work' --repeat-each=10 --reporter=dot
E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --reporter=dot
E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --repeat-each=10 --reporter=dot
E2E_PORT=4174 ./scripts/verify
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
- The retained verifier-round-041 fixture opens a fresh isolated context for
  its two intentionally stale records. Its one-shot init script installs the
  target record before application code starts, so the source page's Worker has
  no access to the restored context's localStorage. This keeps real restoration
  and command-boundary behavior under test without a reload race.
- The command-deck expansion helper uses the narrower same-context variant:
  closing its one source page terminates the Worker, then a one-shot preboot
  script seeds the already-captured fixture before the restored page starts.
  The helper returns that restored page, so all subsequent expansion assertions
  remain real application commands rather than storage inspection.

## Known limitations and risks

- `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. Full
  audit still reports five high dev-only findings in ESLint 9’s `minimatch` /
  `brace-expansion` chain; npm proposes ESLint 10, a major update. No
  `npm audit fix --force` was used.
- The historical Pages A-to-B miss did not reproduce: hosted attempt 2 and
  40/40 local transitions passed. It remains a monitored residual rather than
  a reason to weaken strict PWA convergence evidence.
- A fresh hosted run for this candidate SHA has not been launched. Local focused
  and clean canonical checks cover the repaired fixtures.
- `tests/e2e/verifier-round-028.spec.ts` intentionally owns fixed loopback port
  `4183` for its PWA fixture server. Canonical verification must use another
  free override such as `E2E_PORT=4174`; using `4183` creates a test-server
  collision, not a product failure.
- The separate observed Career scheduling behavior is outside this delivery
  hardening scope and was not changed.
- Physical-device, non-Chromium, battery/thermal, and platform screen-reader
  sessions remain environmental residuals.

## Checks executed before candidate handoff

- `npx prettier --check tests/e2e/verifier-round-041.spec.ts` — passed.
- `npm run typecheck` — passed.
- Forged-save focused command above — 20/20 passed after the preboot fixture
  change; the prior live-write/reload version recorded 6 failures in the local
  scoped run and V-056 recorded 3/20 in verification.
- Adjacent legitimate stale-save focused command above — 10/10 passed.
- Complete retained verifier-round-041 browser file — 6/6 passed.
- Command-deck geometry focused command above — 20/20 passed (both required
  portrait sizes across ten repetitions).
- `E2E_PORT=4183 ./scripts/verify` — invalid canonical invocation: static,
  unit/property, all balance sweeps, build, and production audit passed, but
  verifier-round-028's own fixed fixture server collided with that same port.
  The run also exposed the command-deck fixture race above; it was corrected
  before the final canonical run.
- `E2E_PORT=4174 ./scripts/verify` — passed: format; lint; typecheck; 31
  unit/property files / 154 tests; numeric plus first-session, 20,001-seed
  upgrade, progression, Career, and evaluation balance sweeps with zero
  failures; build; production audit (0 vulnerabilities); 158/158 root
  Playwright; 2/2 Pages/offline.

## Checks not run

- No push, deployment, or fresh candidate GitHub Actions run; those require
  external branch/repository state beyond this Implementer turn.
- No physical-device or non-Chromium session; required hardware/services are
  unavailable.
