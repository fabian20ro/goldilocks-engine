# Verification round 053 — Career persistence availability boundary

Candidate SHA: `ab09019f39c84b6c2612b34cbb15f5d3acc06824`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `ab09019f39c84b6c2612b34cbb15f5d3acc06824`; `git status --short` was
  empty.
- Independently read `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, immutable verifier
  history through round 052, the candidate diff, and production source.
  Handoff, comments, and implementation-owned tests were treated only as
  leads.
- Applicable scope: §20.7 Phase 0 + Phase 1 Career scheduling correctness,
  D-019, and D-020. Retained deterministic engine, first-session, command
  deck, persistence/PWA, Evaluation/Replay, Pages, and verification contracts
  remain regression gates. Phase 2–4 presentation work is not this candidate's
  scope.
- Production delta inspected: the candidate gates the durable request
  acknowledgement on a successful save and exposes an in-progress persistence
  status. It introduces no new state framework, Worker command, schema,
  persistence key, pipeline, content system, or deferred feature.
- Verifier-owned artifact:
  `tests/e2e/verifier-round-053.spec.ts`. It uses only the actual app and a
  narrowly scoped `Storage.setItem` quota-failure fixture; no production code
  changed.

## Environment and setup

- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1 and Chromium from ignored
  `.cache/ms-playwright`; npm cache from ignored `.cache/npm`.
- The canonical setup completed its locked install. The production audit
  (`npm audit --omit=dev --audit-level=high`) found zero vulnerabilities.
- Sandboxed Chromium cannot launch on this host because macOS denies its
  `MachPortRendezvousServer`. Scoped host launch used the same repository-pinned
  Chromium, loopback server, and no global browser profile.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact supplied candidate; clean start. |
| `E2E_PORT=4177 ./scripts/verify` with scoped host Chromium | **Fail only at V-060:** format, lint, typecheck, unit/property, deterministic balance, production build, and production audit passed; 171/172 root E2E passed, the new verifier regression failed, and 2/2 Pages/offline tests passed. |
| `npm run test:e2e -- --grep-invert "verifier round 053" --reporter=dot` | Pass: 171/171 retained root browser/PWA tests. |
| `npm run test:e2e:pages -- --reporter=dot` | Pass: 2/2 Pages/offline tests. |
| `npm run test:e2e -- tests/e2e/verifier-round-053.spec.ts --reporter=dot` | **Fail:** the 393×742 app displays the persistence-retry status while `Run scheduled evening` remains enabled. |
| `npm run test:e2e -- tests/e2e/verifier-round-053.spec.ts --repeat-each=10 --reporter=dot` | **Fail: 10/10** identical assertions; deterministic reproduction of V-060. |
| `npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced App-session draft.*393px" --repeat-each=25 --reporter=dot` | Pass: 25/25 human-paced Worker tick, speed, pause, tab-return, keyboard, and touch-token flows. |
| `npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced App-session draft.*320px" --repeat-each=5 --reporter=dot` | Pass: 5/5 equivalent 320px portrait flows. |
| `npm run test:e2e -- tests/e2e/verifier-round-051.spec.ts tests/e2e/verifier-round-052.spec.ts --reporter=dot` | Pass: 2/2 retained rapid-Run and submitted-save-failure regressions. |
| `npm run test:e2e -- tests/e2e/career.spec.ts --grep "failed Career save" --reporter=dot` | Pass: the candidate keeps a submitted Career result locked until a later durable Worker persistence retry succeeds. |
| `npx vitest run src/ui/verifierRound051.test.ts src/ui/verifierRound052.test.tsx src/ui/useSimulation.test.tsx src/ui/careerScheduleDraft.test.tsx src/simulation/workerProtocol.test.ts --coverage.enabled=false --reporter=dot` | Pass: 5 files, 25 tests. |
| `npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "command deck geometry and visual evidence" --reporter=dot` | Pass: 2/2. Inspected all 20 original-resolution screenshots (five tabs × starter/expanded × 320×693/393×742): visible navigation/actions, no observed horizontal clipping, pipe regression, or nested-rail trap. |
| `npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "Career tokens stay visible at 200% text" --reporter=dot`; `npm run test:e2e -- tests/e2e/career.spec.ts --grep "readable at 200 percent text with reduced motion" --reporter=dot` | Pass: 2/2 scaled-token and 1/1 reduced-motion Career checks. |
| `npm audit --omit=dev --audit-level=high`; `npm run build`; `npm run format:check`; `npm run lint`; `npm run typecheck` | All pass after verifier test formatting. |
| `./scripts/run`, loopback `curl` of `/` and `/sw.js`, then stop and reconnect check | Ready at `127.0.0.1:4173`; both endpoints returned 200; after controlled shutdown, connection was refused. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 ownership contract: App-session draft survives ordinary Worker publications, tabs, speed, and pause | Fresh 25-repeat 393px and 5-repeat 320px human-paced browser flows preserve numeric/token edits through ticks, 1×/64×, Jobs pause, and tab returns. | Pass evidence |
| Phase 0 human-paced numeric/token regression and deterministic four-route batch | Focused browser flows deliberately cross tick intervals; Worker/protocol and draft tests pass. | Pass evidence |
| Phase 1 finite, quarter-hour, nonnegative, capped route editing and deterministic construction | Focused 25-test unit/protocol run and retained root Career suite pass. | Pass evidence |
| Phase 1 atomic Run, successful result/reset, normal durable outcome, and no duplicate rapid activation | Fresh retained V-051 regression, normal Career suite, and full retained root suite pass. | Pass evidence |
| D-019/D-020 submitted-Career save failure: durable acknowledgement only after a persisted snapshot, then automatic later recovery | Retained V-052 and candidate-focused `failed Career save` browser flow pass. The prior submitted-run storage-failure defect does not reproduce. | Pass evidence |
| D-020 recovery boundary: while any save is failing, Career explains retrying **and keeps Run disabled** | A normal Worker publication is forced to fail before any Career submission. Status is visible, but the control remains enabled. | **Fail — V-060** |
| Rejection retention; session-only pre-Run reload; post-Run durable reload; malformed schedule recovery | Retained root Career/malformed/migration/offline browser coverage passes. | Pass evidence, apart from V-060's save-failure availability boundary |
| 320×693 / 393×742 portrait, keyboard, touch, 200% text, reduced motion, focus, no overflow, reachable Career action | Human-paced tests, scaled-token/reduced-motion checks, retained geometry suites, and original-resolution inspection pass. | Pass evidence |
| Retained §§2.4, 8–10, 20.2–20.6, 23–27; D-004 and D-006–D-018: engine, integrity, first-session, command deck, PWA, offline, Pages, and replay | 171 retained root browser/PWA tests, 2 Pages tests, canonical unit/property/balance groups, build, and audit pass. | Pass evidence |
| Clean setup, deterministic loopback startup, pinned browser, and cleanup | Locked setup, canonical/isolated loopback Playwright readiness, direct `scripts/run` readiness, and controlled process shutdown pass. | Pass evidence |
| Deferred Research, creators, fear/hype, workforce, startup, laboratory, parallel pipeline, or new persistence architecture | Candidate diff/source inspection finds no prohibited addition. | Scope preserved |
| §20.7 Phase 2–4 visual hierarchy/density work | Not claimed or changed in this Phase 0/1 candidate. | N/A |

## Findings

### V-060 — Pre-existing persistence failure leaves Career Run enabled

- **Severity:** High — durable command authorization and exact-once outcome
  safety.
- **Related plan requirement:** D-020 recovery boundary; §20.7 Phase 1
  durable-before-publication and singular Run action.
- **Expected behavior:** While a save is failing, Career must show its retry
  state and disable Run. A player must not begin a Career batch until a later
  Worker state persists successfully.
- **Actual behavior:** Force `QuotaExceededError` only for the durable save key
  during an ordinary Worker state publication, then return to Career. The
  visible `Saving is temporarily unavailable` status appears, but the action
  is enabled. `src/ui/App.tsx:2673` disables it only for `isRunPending`, while
  the active failure is exposed separately at lines 2675–2679 and 2689–2698.
- **Exact reproduction:**

  ```sh
  npm run test:e2e -- tests/e2e/verifier-round-053.spec.ts \
    --repeat-each=10 --reporter=dot
  ```

- **Concrete evidence:** All 10 runs fail at
  `tests/e2e/verifier-round-053.spec.ts:57`. Playwright repeatedly resolves
  `<button ... aria-describedby="career-persistence-recovery">` and reports
  `Expected: disabled; Received: enabled`. The canonical host run reproduces
  the same failure as its only root-E2E failure, with the other 171 root tests
  and both Pages tests passing.
- **Blocks PASS:** Yes.

## Unverified areas

- No GitHub-hosted aggregate, push, exact-SHA Pages deployment, or live-owner
  smoke was launched: the local deterministic V-060 failure already blocks
  acceptance.
- Physical iOS/Android hardware, non-Chromium engines, native screen-reader
  speech, battery/thermal behavior, and genuine browser storage-quota recovery
  UX remain unavailable. Pinned Chromium did exercise the required portrait,
  keyboard/touch, text-scale, reduced-motion, reload/resume, malformed-state,
  offline, PWA, and console-error coverage.
- A mixed retained V-051/V-052 `--repeat-each=10` stress attempt produced 9
  passes followed by 11 browser-startup timeouts after repeated browser
  contexts; the clean isolated 2/2 rerun and full retained root suite passed.
  It is not used as reliability evidence or classified as a candidate defect.

## Residual risks

- V-060 is deterministic in a real pinned-browser scenario, not a timing
  flake. A storage interruption unrelated to Career can leave the app offering
  another Career Run despite D-020's explicit disabled boundary.
- macOS sandbox Chromium remains unavailable because of the Mach-port policy;
  all browser evidence used repository-pinned Chromium under scoped host
  launch.
- Full `npm audit` retains development-only advisories; the required production
  dependency audit is clean.
