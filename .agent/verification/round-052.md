# Verification round 052 — Career durable Run acknowledgement

Candidate SHA: `e024ecec7bb27f5c13a7422a86f14ce865269a86`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `e024ecec7bb27f5c13a7422a86f14ce865269a86`; `git status --short` was
  empty.
- Independently read `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, immutable verifier
  history through round 051, the candidate diff, and production source.
  Handoff, comments, and implementation-authored tests were treated as hints.
- Applicable scope: §20.7 Phase 0 + Phase 1 Career scheduling correctness and
  D-019. Retained deterministic engine, first-session, command-deck,
  persistence/PWA, Evaluation/Replay, Pages, and verification contracts remain
  regression gates. Phase 2–4 presentation work is not part of this candidate.
- Production delta inspected: Worker recognition of a complete four-route
  replacement batch; App-lifetime Run request lock; request-ID plumbing; Career
  UI feedback and regression coverage. No new state framework, Worker command,
  schema, persistence key, pipeline, content system, or deferred feature was
  added.
- Verifier-owned regressions:
  `src/ui/verifierRound052.test.tsx` and
  `tests/e2e/verifier-round-052.spec.ts`. They exercise production behavior;
  no production code was changed.

## Environment and setup

- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1 and Chromium from ignored
  `.cache/ms-playwright`; npm cache from ignored `.cache/npm`.
- `./scripts/setup` completed a locked install. Its broad development audit
  reports five high development-only advisories; the canonical production audit
  (`npm audit --omit=dev --audit-level=high`) found zero vulnerabilities.
- Sandboxed Chromium cannot launch on this host because macOS denies its
  `MachPortRendezvousServer`. Scoped host launch used the same
  repository-pinned Chromium, loopback server, and no global browser profile.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact supplied candidate; clean start. |
| `./scripts/setup` | Pass; repository-local dependency and browser setup. |
| `E2E_PORT=4192 ./scripts/verify` in sandbox | Browser launch unavailable at the documented macOS Mach-port boundary; not treated as browser evidence. |
| `E2E_PORT=4203 ./scripts/verify` with scoped host Chromium | **Fail only at V-059:** format, lint, typecheck, build, production audit, all five balance groups, 169/170 unit tests, 169/170 root E2E, and 2/2 Pages/offline E2E completed. The one unit and one E2E failure are the verifier persistence regressions below. |
| `npx vitest run src/simulation/workerProtocol.test.ts src/ui/careerScheduleDraft.test.tsx src/ui/useSimulation.test.tsx src/ui/verifierRound051.test.ts --coverage.enabled=false --reporter=dot` | Pass: 4 files, 22 tests. Confirms the candidate resolves V-057 rapid submission and V-058 restored-schedule revision. |
| `npx vitest run src/ui/verifierRound052.test.tsx --coverage.enabled=false --reporter=dot` | **Fail:** persistence-failure lock test fails; later durable-ack recovery test passes. |
| `E2E_PORT=4194 npm run test:e2e -- tests/e2e/verifier-round-052.spec.ts --reporter=dot` | **Fail:** real 393×742 app reaches Night 2 after a forced `localStorage` quota failure, then exposes an enabled Run button. |
| `E2E_PORT=4193 npm run test:e2e -- tests/e2e/career.spec.ts tests/e2e/verifier-round-051.spec.ts --reporter=dot` | Pass: 12/12 normal Career, reload, malformed-state, tick, tab, keyboard, touch, speed, pause, and prior rapid-Run tests. |
| `E2E_PORT=4201 npm run test:e2e -- tests/e2e/career.spec.ts --grep 'human-paced.*393px' --repeat-each=25 --reporter=dot` | Pass: 25/25 human-paced real-Worker repetitions. |
| `E2E_PORT=4195 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --reporter=dot` | Pass: 2/2; original-resolution inspection of all five tabs × starter/expanded × 320×693/393×742 found coherent shared grammar, visible primary controls/nav, no observed horizontal clipping, pipe regression, or nested rail scroll trap. |
| `E2E_PORT=4200 npm run test:e2e -- tests/e2e/pwa-update.spec.ts --reporter=dot`; `E2E_PORT=4199 npm run test:e2e:pages -- --reporter=dot` | Pass: 16/16 PWA update/recovery and 2/2 Pages/offline checks. |
| Direct malformed-protocol probe with `npx tsx -e ...` | Non-finite complete Career batch was an exact no-op and state-valid; duplicate-route batch retained established sequential semantics and state validity. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` after verifier artifacts | All pass. |
| `./scripts/run` | `--strictPort` correctly declined port 4173 because an unrelated pre-existing loopback listener occupied it. Project startup/readiness was otherwise repeatedly proven by Playwright-managed `scripts/run-e2e` preview servers on deterministic loopback ports, which cleaned up. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 ownership contract; D-019 App-session draft ignores ordinary Worker publications | Fresh 25-repeat human-paced 393px flow plus 12-test Career suite preserve numeric/token draft edits through Worker ticks, 1×/64×, Jobs pause, rerenders, and tab visits. | Pass evidence |
| Phase 0 regression: human-paced numeric/token path; deterministic Worker batch | Candidate suite and fresh browser runs use both input and token paths across deliberate tick intervals; focused Worker tests pass. | Pass evidence |
| Phase 1 finite, quarter-hour, nonnegative, capped route editing and deterministic four-route construction | Candidate helper/Worker tests, normal browser suite, and full canonical unit/property corpus pass. | Pass evidence |
| D-019 atomic revision of a valid restored schedule; no partial durable schedule | Focused Worker/revision regression passes: restored 4h competition is revised to 4h freelance and closes exactly one evening. V-058 no longer reproduces. | Pass evidence |
| Phase 1 singular Run under normal durable operation | Candidate browser regression and fresh retained V-051 probe pass: two immediate visible activations commit one evening only. | Pass evidence |
| Phase 1/D-019 durable-before-publication and exact-once acknowledgement on persistence failure | A failed storage write advances `lastDurableRequestId` anyway and clears the Run lock before a durable acknowledgement. | **Fail — V-059** |
| Rejection retention, success reset, session-only pre-Run reload, post-Run reload, and malformed schedule recovery | Fresh Career suite passes normal rejection/retry, empty next evening, durable reload, migration, and malformed restore paths. | Pass evidence, excluding V-059 storage failure |
| 320×693/393×742 portrait, touch/keyboard, 200% text, reduced motion, focus/44px controls, no overflow, reachable action | Career and command-deck browser coverage plus original screenshot inspection pass at both required portrait widths. No page/console errors in the relevant human-paced/malformed checks. | Pass evidence |
| Retained §§2.4, 8–10, 20.2–20.6, 23–27; D-004, D-006–D-018: engine, integrity, first-session, command deck, PWA, offline, Pages, and replay | Canonical host run passes balance sweeps (including 20,001 upgrade seeds), 169 retained unit tests, 169 retained root browser tests, and Pages/offline tests; direct malformed Career protocol probe is safe. | Pass evidence |
| Clean setup, deterministic loopback startup, pinned browser, cleanup | Locked setup, production build, host-pinned Playwright preview readiness, and session cleanup pass. Manual 4173 startup remains unavailable only because of unrelated pre-existing occupancy. | Pass evidence with noted port caveat |
| Deferred Research, creators, fear/hype, workforce, startup, laboratory, parallel pipeline, or new persistence architecture | Candidate diff/source inspection finds no prohibited additions. | Scope preserved |
| §20.7 Phase 2–4 visual hierarchy/density work | Not claimed or changed in this Phase 0/1 candidate. | N/A |

## Findings

### V-059 — Failed durable save falsely acknowledges the Career Run

- **Severity:** High — exact-once player action and durable-outcome correctness.
- **Related plan requirement:** §20.7 Phase 1 Worker integration (durable before
  publication; exactly one durable outcome); D-019 exact-once UI boundary and
  failure boundary.
- **Expected behavior:** If persistence returns false for a submitted evening,
  the singular Run control remains locked. It may unlock only when that request
  or a later monotonic acknowledgement has both persisted and been published.
  A later successful durable acknowledgement must still allow recovery.
- **Actual behavior:** `src/ui/useSimulation.ts:113-125` receives
  `durable === false` from `persistBeforePublish`, but advances
  `lastDurableRequestId` without checking it. The effect at
  `src/ui/careerScheduleDraft.ts:146-152` treats that value as durable and
  clears the pending lock. The Worker result is visible in memory but has not
  been durably saved.
- **Exact reproduction:**

  ```sh
  npx vitest run src/ui/verifierRound052.test.tsx \
    --coverage.enabled=false --reporter=dot
  E2E_PORT=4194 npm run test:e2e -- tests/e2e/verifier-round-052.spec.ts \
    --reporter=dot
  ```

- **Concrete evidence:** The unit probe combines the actual `useSimulation`,
  `useCareerScheduleDraft`, Worker reducer, and a `Storage` implementation
  that throws `QuotaExceededError`. It expects `isRunPending` true after the
  Worker response but receives false; its paired test proves a later persisted
  request can release the lock. The real pinned-browser probe overrides only
  the durable save key, allocates 4h Freelance at 393×742, reaches `Night 2`,
  waits 100ms, and receives `enabled` where the visible Run button must be
  disabled. Canonical reproduction: 1/170 root E2E fails at
  `tests/e2e/verifier-round-052.spec.ts:35`, while the other 169 pass.
- **Blocks PASS:** Yes.

## Unverified areas

- No GitHub-hosted aggregate, push, exact-SHA Pages deployment, or live-owner
  smoke was launched. Local V-059 already blocks acceptance.
- Physical iOS/Android hardware, non-Chromium engines, native screen-reader
  speech, battery/thermal behavior, and genuine browser storage-quota recovery
  UI remain unavailable. Required pinned Chromium portrait, keyboard/touch,
  text-scale, reduced-motion, reload/resume, malformed-state, offline, PWA,
  and console-error coverage ran.
- The manual `./scripts/run` 4173 path could not claim readiness because an
  unrelated process already occupied that fixed port; scoped app previews were
  successful on unique loopback ports.

## Residual risks

- V-059 is deterministic in both hook-level and real-browser reproduction; it
  is not a timing flake. A persistence interruption can expose another Run
  action before the first evening is durable.
- macOS sandbox Chromium remains unavailable because of the Mach-port policy;
  all browser evidence used the repository-pinned browser under scoped host
  launch.
- Full `npm audit` reports five high development-only ESLint-chain advisories;
  the production dependency audit is clean.
