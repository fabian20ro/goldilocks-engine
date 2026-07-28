# Verification round 051 — Career schedule draft correctness

Candidate SHA: `9639be98766669e96f848a4a8733dc8a4a1a43ca`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `9639be98766669e96f848a4a8733dc8a4a1a43ca`; `git status --short` was
  empty.
- Independently read `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, the immutable report
  index/history through round 050, candidate diff, and implementation source.
  Handoff and candidate-authored tests were treated as hints, not proof.
- Applicable candidate scope: §20.7 Phase 0 + Phase 1 Career scheduling
  correctness and D-019, while retaining prior pipeline, first-session,
  command-deck, persistence/PWA, Evaluation/Replay, and verification
  contracts. Phase 2–4 presentation work is not part of this frozen candidate.
- Candidate production delta inspected: `src/ui/App.tsx`, new
  `src/ui/careerScheduleDraft.ts`, and small Career feedback styling. No new
  framework, Worker command, schema/storage field, extra persistence key,
  pipeline, content system, or deferred milestone feature was introduced.
- Verifier-owned regressions:
  `src/ui/verifierRound051.test.ts` and
  `tests/e2e/verifier-round-051.spec.ts`. They expose defects; they do not
  alter production behavior.

## Environment and setup

- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1; Chromium from ignored
  `.cache/ms-playwright`; npm cache from ignored `.cache/npm`.
- `./scripts/setup` completed from a locked install. Invalid
  `INSTALL_PLAYWRIGHT=invalid ./scripts/setup` correctly exited 64 with the
  documented validation message.
- Sandboxed Chromium failed before test bodies at macOS
  `MachPortRendezvousServer` permission denial. The same repository-pinned
  browser completed all browser work with scoped host launch; no global
  browser/profile was used.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact supplied candidate; clean start. |
| `./scripts/setup` | Pass; repository-local dependency/browser caches populated. |
| `E2E_PORT=4174 ./scripts/verify` in sandbox | Format, lint, typecheck, 163 unit/property tests, all balance sweeps, build, and production audit passed. Root/Pages browser launches alone failed at the documented macOS sandbox boundary. |
| `E2E_PORT=4174 ./scripts/verify` with scoped repository-pinned host Chromium, before verifier artifacts | **Pass:** 163 unit/property tests; numeric, first-session, 20,001-seed upgrade, progression, Career, and Evaluation balances; build; production audit; 167/167 root E2E; 2/2 Pages/offline E2E. |
| `E2E_PORT=4183 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --reporter=dot` | Pass 2/2; regenerated raw 320×693 and 393×742 starter/expanded screenshot matrix. |
| Original-resolution visual inspection: five tabs × starter/expanded × 320/393 | Shared command-deck grammar coherent; primary controls/nav visible; no observed horizontal clipping, pipe/map regression, or expanded-rail nested scroll trap. |
| `E2E_PORT=4184 npm run test:e2e -- tests/e2e/career.spec.ts --grep 'human-paced.*393px' --repeat-each=25 --reporter=dot` | Pass 25/25; real tick, 64×/1×, paused Jobs, tab-return, keyboard numeric entry, and CDP touch-token draft path stayed stable. |
| `E2E_PORT=4182 npm run test:e2e -- tests/e2e/verifier-round-051.spec.ts --repeat-each=10 --reporter=dot` | **Fail 10/10:** two rapid Run activations produced two completed evenings. |
| `npx vitest run src/ui/verifierRound051.test.ts --coverage.enabled=false --reporter=dot` | **Fail:** a valid restored 4h schedule cannot be replaced/rerun in the prescribed batch; expected one completion, received zero. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` after verifier artifacts | All pass. |
| `./scripts/run`; loopback `curl`; Ctrl-C; post-stop `curl` | Ready in 213ms; HTTP 200; post-stop connection refused (`000`). Scoped process audit found no project Vite/Chromium process remaining. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 observed defect; D-019 App-session draft ignores ordinary cloned Worker publications | Canonical candidate Career tests at 320/393 and fresh 25-repeat 393px human-paced flow preserve numeric/token edits through normal ticks, speed, pause, and tab visits. | Pass evidence |
| §20.7 Phase 0: human-paced tick regression, token/input paths, Worker batch baseline | Candidate and canonical Worker/browser paths execute normal input and one allocation-plus-Run batch; fresh 25-repeat 393px run passes. | Pass evidence |
| §20.7 Phase 1: Run action singular; one four-route commit produces exactly one completed evening/durable outcome | Fresh browser double-activation regression fails 10/10: two click events enqueue two batches and complete two evenings. | **Fail — V-057** |
| §20.7/D-019: restored Worker schedule initializes draft and can be revised/run without a partial or rejected final transaction | Fresh unit/Worker integration regression restores a valid 4h competition schedule, changes it to 4h freelance, then fails to complete an evening because command ordering first overbooks the old schedule. | **Fail — V-058** |
| §20.7: quarter-hour/cap/full/zero input constraints and deterministic command construction | Canonical 163-test corpus, candidate helper/Worker coverage, and source review pass the normal finite/capped paths. | Pass evidence |
| §20.7: rejection remains visible and local valid draft persists; success resets after confirmed completion | Canonical Career browser/component paths pass simple rejection, completion reset, reload, and malformed recovery. V-058 shows a different valid-restored rejection path that blocks successful execution. | Partial — V-058 |
| §20.7: 320×693/393×742, keyboard/touch, 1×/64×, paused/running, tab return, 200% text, reduced motion, no overflow, reachable controls | Canonical root E2E plus fresh screenshot matrix and 25-repeat flow pass. | Pass evidence |
| Retained §§2.4, 8–10, 20.2–20.6, 23–27; D-004, D-006–D-018: pipeline, first-session integrity, command deck, deterministic balances, PWA/Pages/offline | Exact-candidate canonical host run passes static checks, 163 unit/property tests, five balance groups, 167 root E2E, and 2 Pages/offline E2E. | Pass evidence |
| Setup, deterministic loopback startup/readiness, repository-pinned browser, process cleanup | Fresh setup validation, canonical host browser run, loopback 200/readiness, stopped-server refusal, and process audit. | Pass evidence |
| Deferred Research, creators, fear/hype, workforce, startup, laboratory, parallel pipeline, new simulation/persistence architecture | Candidate diff/source inspection: no prohibited feature or asset mechanism introduced. | Scope preserved |
| §20.7 Phase 2–4 Career/Build density and cross-screen release hardening | Not claimed or changed by this Phase 0/1 candidate; evaluated as out of candidate scope. | N/A |

## Findings

### V-057 — Rapid Run activation executes two evenings

- **Severity:** High — player action correctness / durable double execution.
- **Related plan requirement:** §20.7 Phase 1, especially singular Run action,
  exactly one completed evening and durable outcome; D-019 atomic command
  boundary.
- **Expected behavior:** Two rapid activations of the single Run control must
  result in at most one queued `COMMAND_BATCH`, one completed evening, and one
  durable route outcome.
- **Actual behavior:** The Run button stays actionable while the first batch is
  in flight. Two synchronous click events post two full four-allocation + Run
  batches. The Worker processes both sequentially, advancing from evening 0 to
  evening 2.
- **Exact reproduction:**

  ```sh
  E2E_PORT=4182 npm run test:e2e -- tests/e2e/verifier-round-051.spec.ts \
    --repeat-each=10 --reporter=dot
  ```

- **Concrete evidence:** All 10 runs fail at
  `tests/e2e/verifier-round-051.spec.ts:50`: expected persisted
  `completedEvenings` 1, received 2 after 1.15 seconds. The probe uses a real
  393×742 app, numeric 4h allocation, two bubbling click events on the visible
  Run control, the actual Worker, and durable localStorage state.
- **Blocks PASS:** Yes.

### V-058 — Revised valid restored schedule cannot run in the prescribed batch

- **Severity:** High — restore/recovery and atomic Career execution.
- **Related plan requirement:** §20.7 state-ownership contract and Phase 1
  Worker integration; D-019 restored Worker schedule and ordered one-batch
  command boundary.
- **Expected behavior:** A valid restored Worker schedule may initialize the
  draft; after the player revises it, the four allocation commands followed by
  Run must complete that revised evening atomically.
- **Actual behavior:** With restored `competition: 4`, a revised draft of
  `freelance: 4, competition: 0` serializes in fixed route order. The first
  `SET_EVENING_ALLOCATION(freelance, 4)` is rejected because the old 4h
  competition allocation remains; the later zero clears competition and
  `RUN_EVENING` rejects the now-empty Worker schedule. The draft is valid, but
  no evening completes.
- **Exact reproduction:**

  ```sh
  npx vitest run src/ui/verifierRound051.test.ts \
    --coverage.enabled=false --reporter=dot
  ```

- **Concrete evidence:** The committed verifier test restores a sealed valid
  4h competition state, revises it through the candidate helper, and calls the
  real Worker reducer. It receives `completedEvenings: 0` instead of 1; direct
  reducer evidence records `Evening allocation rejected: the four-hour
  after-work window cannot be overbooked.` followed by `No evening was run`.
- **Blocks PASS:** Yes.

## Unverified areas

- No GitHub-hosted aggregate, push, exact-SHA Pages deployment, or live-owner
  smoke was launched by this verifier. Candidate acceptance is already blocked
  locally by V-057/V-058.
- Physical iOS/Android hardware, non-Chromium engines, native screen-reader
  speech, battery/thermal behavior, and storage-quota interruption remain
  unavailable. Required pinned Chromium portrait, text-scale, keyboard/touch,
  reduced-motion, reload/resume, malformed-state, offline, PWA, and
  page/console-error suites ran in the canonical gate.

## Residual risks

- Both findings are deterministic, not timing flakes: V-057 reproduces 10/10;
  V-058 is pure Worker/reducer reproduction.
- Full `npm audit` reports five high development-only ESLint-chain advisories;
  the canonical production audit (`--omit=dev --audit-level=high`) is clean.
- macOS sandbox Chromium remains unavailable because of the Mach-port policy;
  all browser evidence above used the same repository-pinned Chromium with
  scoped host launch.
