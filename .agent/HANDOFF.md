# Candidate handoff — round 052 Career scheduling repair

## Implemented behavior summary

- Career's unfinished four-route evening is now an explicit App-session draft,
  owned above conditional tab rendering in `App`.
- Draft initialization uses the restored Worker schedule. It survives ordinary
  structured-cloned Worker publications, 1×/64× speed changes, Jobs pause,
  ordinary rerenders, and Career → Inspect/Upgrades → Career visits.
- It resets from the Worker only after a completed evening, reset/replay, or
  run ending. Reload and malformed recovery start from durable Worker state;
  no unrun draft is persisted.
- Draft values are finite, quarter-hour-rounded, nonnegative, and capped at
  the four-hour evening. Running retains the ordered existing batch: four
  `SET_EVENING_ALLOCATION` commands followed by one `RUN_EVENING`.
- A complete valid Career batch now atomically replaces the committed schedule
  inside the Worker before applying its four allocations and Run. A restored
  valid schedule can therefore be revised without an intermediate overbook
  rejection or partial persisted schedule.
- The singular Run control takes a synchronous App-session lock before posting
  its batch and stays disabled until its own durable Worker request ID is
  acknowledged. Rapid pointer/click activation cannot enqueue a second evening;
  an acknowledged Worker rejection releases the control and retains the draft.
- Worker schedule rejection is visible in Career and leaves the valid local
  draft intact. A later completed evening clears that rejection.
- No state library, schema/storage key, Worker command, simulation rule, or
  deferred Phase 2–4 visual/density/polish work was introduced.

## Plan requirements covered

| §20.7 Phase 0/1 requirement                              | Candidate evidence                                                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| App-session draft ownership; no referential Worker reset | `src/ui/careerScheduleDraft.ts`; App-scope owner comment; cloned-publication hook test                                                            |
| Worker/reset/replay/ending/recovery boundaries           | hook tests; candidate malformed-save browser test; existing migration/offline tests retained                                                      |
| Four allocations plus one atomic evening command         | pure batch test; restored-schedule Worker replacement regression; durable request-ID acknowledgement test                                         |
| Quarter-hour/cap/full/zero replacement behavior          | `careerScheduleDraft.test.tsx` pure-helper coverage                                                                                               |
| Rejection remains visible without draft loss             | hook/browser failure-recovery test; acknowledgment releases Run without clearing the draft                                                        |
| Singular exact-once Run activation                       | request-ID hook regression; candidate browser assertion and retained verifier double-activation repeats                                           |
| Portrait/input/accessibility/session behavior            | 320×693 and 393×742 keyboard/touch/tick/speed/pause/tab tests; retained 200%-text/reduced-motion/control geometry checks                          |
| Reload/outcome/persistence/malformed recovery            | candidate browser test proves pre-run draft discard, exactly one durable completed evening, post-run reload; malformed test proves blank recovery |
| Human-paced regression evidence                          | 393px Worker-tick flow repeated 25/25 without retries or weakened assertions                                                                      |

## Verifier findings resolved

- V-057 — rapid Run activation: the UI now acquires a synchronous request-ID
  lock before posting. The retained verifier browser reproduction completed
  10/10 without a second evening; candidate browser coverage uses the same two
  bubbling activation events.
- V-058 — revised restored schedule: the Worker recognizes the complete valid
  four-route-plus-Run batch as one schedule replacement. Candidate and retained
  verifier unit/protocol coverage restore 4h competition, revise to 4h
  freelance, and complete exactly one freelance evening.
- Immutable rounds 001–051 and verifier-owned regressions remain unchanged.

## Setup, startup, browser, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First
setup needs network access for the lockfile and repository-pinned Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

`./scripts/setup` sets ignored repository-local caches:

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

Canonical full verification; deterministic loopback previews, ready wait, and
process cleanup are Playwright-managed:

```sh
E2E_PORT=4174 ./scripts/verify
```

Focused Career commands:

```sh
npx vitest run src/ui/careerScheduleDraft.test.tsx src/ui/useSimulation.test.tsx src/ui/verifierRound051.test.ts src/simulation/workerProtocol.test.ts --coverage.enabled=false --reporter=dot
E2E_PORT=4181 npm run test:e2e -- tests/e2e/career.spec.ts --reporter=dot
E2E_PORT=4182 npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced.*393px" --repeat-each=25 --reporter=dot
E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-051.spec.ts --repeat-each=10 --reporter=dot
E2E_PORT=4184 npm run test:e2e -- tests/e2e/career.spec.ts --grep "serializes rapid Run activation" --repeat-each=25 --reporter=dot
```

`@playwright/test` is pinned in `package.json`; `npm run test:e2e` uses only
`.cache/ms-playwright`, not a global CLI/browser/profile. This macOS sandbox
cannot create Chromium's Mach-port rendezvous server; scoped host browser
launch was required. The same pinned browser and repository-local cache passed
every browser command above.

## Important architectural decisions

- D-019 records the ownership boundary: Worker owns committed/durable state;
  React owns only one unsubmitted App-session schedule draft.
- A semantic boundary key (`seed`, replay count, completed evenings, ending)
  controls resets. Nested allocation object identity is intentionally excluded
  because Worker structured cloning changes it on every publication.
- The draft is a projection/input layer, not a second simulation. It never
  writes durable state until the existing single command batch is sent.
- Full Career batches are Worker-owned transactions: the Worker clears the
  prior committed allocation only inside its unpublished reduction, applies all
  four replacement values, then runs once. It does not add a command, schema,
  or storage field.
- `useSimulation` exposes only a monotonic acknowledgement of already-persisted
  durable Worker request IDs. Career uses that existing protocol response to
  release its UI-only exact-once lock after success or rejection.

## Known limitations and risks

- No physical mobile device, non-Chromium engine, native screen-reader speech,
  battery/thermal, or storage-quota interruption run was available. Pinned
  Chromium covers required portrait, touch, keyboard, scaling, motion,
  persistence, reload, offline, and failure/recovery paths.
- Full `npm audit` still reports five high development-only ESLint-chain
  findings. Canonical production audit (`--omit=dev --audit-level=high`) is
  clean; no forced major audit fix was applied.
- The unrun draft intentionally disappears on reload. This is the explicit
  session-only boundary, not accidental data loss.

## Checks executed before handoff

- Red baseline Chromium probe at 393×742 — confirmed `3.00h → 0.00h` after
  1.15 seconds/two Worker ticks.
- Focused hook/Worker/durable-publication plus retained verifier unit tests —
  22/22 passed.
- Candidate Career browser suite — 11/11 passed.
- Retained verifier V-057 browser regression — 10/10 passed.
- Human-paced 393px candidate flow — 25/25 passed in 2.9 minutes after the
  repaired exact-once and restored-schedule paths.
- `./scripts/run` — Vite ready at `127.0.0.1:4173` in 161ms; loopback GET
  returned HTTP 200; Ctrl-C stopped it and the next GET returned connection
  refused (`000`).
- `E2E_PORT=4174 ./scripts/verify` — completed successfully from fresh `npm ci`:
  format; lint; typecheck; 33 unit/property files / 168 tests; numeric,
  first-session, 20,001-seed upgrade, progression, Career, and evaluation
  balances; build; production audit (0 vulnerabilities); 169/169 root E2E;
  2/2 Pages/offline E2E.

## Checks not run

- No deployment, push, or new hosted GitHub Actions run; external publication
  is outside this Implementer handoff.
- Sandboxed Chromium launch was attempted and failed solely on the documented
  macOS Mach-port permission restriction. No browser check was skipped: all
  focused and canonical browser checks passed with scoped host launch.
- An initial 25-repeat human-paced run was invalidated after 20 repetitions
  because Homebrew externally replaced the running Node `26.5.0` executable
  with `26.5.0_1`; Playwright workers inherited the deleted binary and aborted.
  The same unmodified candidate was restarted under the healthy replacement
  runtime and completed all 25 repetitions. This was host infrastructure churn,
  not an application assertion failure.
