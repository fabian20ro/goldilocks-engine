# Candidate handoff — round 054 Career persistence availability boundary

## Implemented behavior summary

- Career's unfinished four-route evening remains an App-session draft, owned
  above conditional tab rendering in `App`. It survives ordinary cloned Worker
  publications, speed changes, Jobs pause, rerenders, and tab visits; it resets
  only after a completed evening, reset/replay, or ending.
- Numeric schedule edits remain finite, quarter-hour-rounded, nonnegative, and
  capped at four total hours. A Run sends the established atomic Worker batch:
  four `SET_EVENING_ALLOCATION` commands followed by one `RUN_EVENING`.
- The Career controller synchronously prevents duplicate submissions before a
  Worker post. Its pending lock remains until a Worker state that includes the
  request has persisted successfully; a Worker rejection releases that lock
  without losing the App-session draft.
- While any durable persistence failure is active, both the visible Run control
  and the controller-level submission boundary are disabled. The player keeps
  the draft and receives retry status; only a later successful persisted Worker
  publication re-enables a non-pending Run.
- The V-052 browser fixture now establishes a real persisted baseline before it
  induces the submitted-evening quota failure. The former boot-wide failure
  fixture could never submit under D-020's broad availability boundary. The
  corrected test still proves no durable result before recovery, one durable
  result after recovery, and no later duplicate.
- No schema, storage key, Worker command, simulation rule, state library, or
  deferred Phase 2–4 presentation work was introduced.

## Plan requirements covered

| Requirement                                             | Evidence                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §20.7 Phase 0/1 App-session draft ownership             | `careerScheduleDraft.ts`; cloned-publication, tab, speed, pause, keyboard, touch, and reload coverage                                                          |
| Atomic four-route Career batch and bounded inputs       | helper/protocol unit coverage; existing 320/393px browser coverage                                                                                             |
| Singular, durable exact-once Run                        | controller unit test; V-051; candidate and V-052/V-059 browser persistence coverage                                                                            |
| D-019 rejection/draft retention                         | retained hook/browser rejection checks; session-only reload behavior                                                                                           |
| D-020 failed submitted-save lock and automatic recovery | candidate hook/browser and corrected V-052 fixture prove locked, no durable loss, later success, and exactly one outcome                                       |
| V-060/D-020 pre-existing storage outage                 | frozen `verifier-round-053` plus candidate browser test force an unrelated failed save, retain the draft, disable Run, recover, then allow exactly one evening |
| Portrait/accessibility/PWA regressions                  | canonical 320/393, text-scale, reduced-motion, touch/drag, offline, reload, PWA, and Pages suites                                                              |

## Verifier findings resolved

- V-057 — synchronous controller lock prevents two rapid Run activations from
  posting two evenings.
- V-058 — a complete Career batch atomically replaces a restored schedule
  before its one Run, avoiding intermediate overbook rejection.
- V-059 — failed persistence does not acknowledge or unlock a submitted
  evening; a later persisted ordered Worker state recovers it without reposting
  or duplicating the result.
- V-060 — a persistence failure caused by any durable Worker publication now
  disables Career Run at both UI and controller boundaries. Recovery requires a
  successful durable Worker state before a new evening may start.

Immutable verification reports remain unchanged. The V-052 Playwright fixture
was corrected, not weakened: it now models the submitted-save failure that its
lock/recovery assertion is intended to exercise under D-020.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First
setup needs network access for the lockfile and repository-pinned Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

`./scripts/setup` uses ignored repository-local caches:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
XDG:       .cache/xdg
evidence:  .cache/verification/
artifacts: coverage/, playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser packages when required:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical verification starts deterministic loopback previews, waits for
readiness, and cleans them up through Playwright:

```sh
E2E_PORT=4219 ./scripts/verify
```

Focused persistence regressions:

```sh
E2E_PORT=4218 npm run test:e2e -- tests/e2e/verifier-round-052.spec.ts tests/e2e/verifier-round-053.spec.ts tests/e2e/career.spec.ts --grep "verifier round 052|verifier round 053|visibly holds a failed Career save" --reporter=dot
E2E_PORT=4217 npm run test:e2e -- tests/e2e/verifier-round-052.spec.ts tests/e2e/verifier-round-053.spec.ts tests/e2e/career.spec.ts --grep "verifier round 052|verifier round 053|visibly holds a failed Career save" --repeat-each=10 --reporter=dot
```

`@playwright/test` is pinned in `package.json`; `npm run test:e2e` uses only
`.cache/ms-playwright`, not a global CLI, profile, or browser. This macOS
sandbox cannot create Chromium's Mach-port rendezvous server; scoped host
launch used the same repository-pinned browser and local cache.

## Important architectural decisions

- D-019: Worker owns committed/durable simulation state; React owns only the
  unsubmitted App-session Career draft.
- A semantic draft boundary (`seed`, replay count, completed evenings, ending)
  intentionally excludes cloned allocation object identity.
- D-020: successful storage, not a Worker response, acknowledges a Career
  request. A later successfully persisted ordered response covers a failed
  request without another command.
- The V-060 gate is in `useCareerScheduleDraft`, not only in button markup, so
  programmatic/synchronous activation cannot bypass the availability boundary.

## Known limitations and risks

- No physical mobile device, non-Chromium engine, native screen-reader speech,
  battery/thermal, or actual device quota exhaustion was available. Pinned
  Chromium covers portrait, touch, keyboard, text scale, reduced motion,
  persistence, reload, offline, and injected `QuotaExceededError` recovery.
- Full `npm audit` reports five high development-only ESLint-chain findings.
  Canonical production audit (`npm audit --omit=dev --audit-level=high`) is
  clean; no forced major audit fix was applied.
- An unsubmitted draft intentionally disappears on reload; this is the D-019
  session-only ownership boundary.

## Checks executed before handoff

- `npm run format:check` — pass.
- `npm run typecheck` — pass.
- Focused hook/unit check:
  `npx vitest run src/ui/careerScheduleDraft.test.tsx src/ui/useSimulation.test.tsx --coverage.enabled=false --reporter=dot` — 2 files, 16 tests pass.
- Corrected V-052, frozen V-060, and retained V-059 browser regressions —
  3/3 pass once; 30/30 pass with `--repeat-each=10`.
- First canonical attempt, `E2E_PORT=4216 ./scripts/verify`, exposed the old
  V-052 boot-wide storage fixture conflicting with the now-required broad
  D-020 gate (172/173 root E2E; all other checks and 2/2 Pages passed). The
  fixture was then corrected as described above; no production boundary was
  relaxed.
- Final clean canonical run, `E2E_PORT=4219 ./scripts/verify` — pass: fresh
  `npm ci`; format; lint; typecheck; 34 unit/property files / 172 tests; all
  numeric, first-session, 20,001-seed upgrade, progression, Career, and
  evaluation balances; build; production audit (0 vulnerabilities); 173/173
  root E2E; 2/2 Pages/offline E2E.
- `./scripts/run` — ready at `127.0.0.1:4173` in 94ms; `/` and `/sw.js` each
  returned HTTP 200; controlled shutdown left loopback unreachable (HTTP 000).

## Checks not run

- No deployment, push, or hosted GitHub Actions run; external publication is
  outside this Implementer handoff.
- Sandboxed Chromium launch was unavailable because of the documented macOS
  Mach-port restriction. No browser check was skipped: focused and canonical
  commands passed with scoped host launch.
