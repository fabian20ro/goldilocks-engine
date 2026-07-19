# Verification round 033

Candidate SHA: `197f718533aff9809d1a0b96fa001aee1364c7b9`

VERDICT: FAIL

## Environment and setup

- Clean start confirmed before verifier writes: `HEAD` was exactly the supplied
  candidate SHA and `git status --short` was empty.
- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Repository-pinned `@playwright/test` 1.61.1 with Chromium in ignored
  `.cache/ms-playwright`.
- `./scripts/setup` was exercised by canonical verification with repository-local
  npm and browser caches.
- Sandboxed Chromium cannot register its macOS Mach port before page creation.
  The same repository-pinned Playwright commands were rerun with approved host
  launch; browser acceptance was not skipped.
- Verifier-authored regression artifacts:
  `src/simulation/verifierRound033.test.ts` and
  `tests/e2e/verifier-round-033.spec.ts`.

## Commands executed and results

| Command or probe                                                                                                                                                                                                                          | Result                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short` before writes                                                                                                                                                                                  | PASS. Candidate SHA matched exactly; clean worktree.                                                                                                                                                                                                                                                                                                        |
| `./scripts/verify` in the managed sandbox                                                                                                                                                                                                 | Static, unit, balance, and build phases passed. Chromium failed before page creation only because the sandbox denies its Mach-port registration.                                                                                                                                                                                                            |
| `./scripts/verify` with approved host browser launch                                                                                                                                                                                      | PASS on the frozen candidate before verifier artifacts: setup, format, lint, typecheck, 115 unit/property tests, numeric/balance sweeps, production build, 103 root Playwright tests, and 2 Pages Playwright tests.                                                                                                                                         |
| `gh run view 29669799943 --repo fabian20ro/goldlocks-engine --json headSha,status,conclusion,jobs,url`; `gh run view ... --log`                                                                                                           | PASS. Exact candidate Verify workflow `29669799943`, job `88146631586`, succeeded. Its log records the root 103/103 and Pages 2/2 browser gates.                                                                                                                                                                                                            |
| `gh run view 29669799932 --repo fabian20ro/goldlocks-engine --json headSha,status,conclusion,jobs,url`; `gh api repos/fabian20ro/goldlocks-engine/pages`; `curl -sS --fail https://fabian20ro.github.io/goldlocks-engine/build-info.json` | PASS. Exact candidate Pages deploy `29669799932` built and deployed successfully. The public Pages endpoint is HTTPS and reports scope `/goldlocks-engine/` with its deployed build/cache identity.                                                                                                                                                         |
| `npm run format:check && npm run lint && npm run typecheck` after verifier artifacts                                                                                                                                                      | PASS.                                                                                                                                                                                                                                                                                                                                                       |
| `npm test` after verifier artifacts                                                                                                                                                                                                       | FAIL only at new V-041 regression: 115 retained candidate tests pass; 1 verifier test fails.                                                                                                                                                                                                                                                                |
| `npx vitest run --coverage.enabled=false src/simulation/verifierRound033.test.ts`                                                                                                                                                         | FAIL as expected. A real 82-event history with its retained 80-event ledger is tampered only in causal counters; restore preserves the counters instead of safely recovering them.                                                                                                                                                                          |
| Independent engine matrix via `node_modules/.bin/tsx -e ...`                                                                                                                                                                              | Normal ignored-warning recording, impossible private-evidence recovery, fresh forged-counter recovery, and all five normal ending scenarios pass. The full-history variant restores `modelSwitches: 8` and `ignoredWarnings: 2`, marks `integrity-resealed`, then produces a valid `tutorial-loop` postmortem despite zero retained ignored-warning events. |
| `npm run test:e2e -- tests/e2e/verifier-round-033.spec.ts --reporter=line` with host browser launch                                                                                                                                       | FAIL as expected. At 320px, the app restores forged long-history counters, then a public preview visibly creates `Tutorial Loop`, postmortem event `evt-0-84`. No page or console error occurred.                                                                                                                                                           |
| `npm run test:e2e -- --reporter=line` with host browser launch                                                                                                                                                                            | 103 retained root tests pass; only the new V-041 browser regression fails. This includes the existing 320/393px, 200% text, touch, keyboard, offline, PWA update, reload/replay, and reduced-motion coverage.                                                                                                                                               |
| `npm run test:e2e:pages -- --reporter=line` with host browser launch                                                                                                                                                                      | PASS. 2/2 Pages scoped-worker/offline tests pass.                                                                                                                                                                                                                                                                                                           |
| `./scripts/run`; HTTP probes for `/` and `/src/main.tsx`; Ctrl-C; `lsof -nP -iTCP:4173 -sTCP:LISTEN`                                                                                                                                      | PASS. Vite became ready at `127.0.0.1:4173` in 79ms; both endpoints returned 200; no listener remained after shutdown.                                                                                                                                                                                                                                      |
| `git diff --check`                                                                                                                                                                                                                        | PASS.                                                                                                                                                                                                                                                                                                                                                       |

## Requirement evidence matrix

| Applicable requirement                                                                                                                      | Evidence                                                                                                                                                                                                                                                                       | Result       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Plan Sections 2–10: deterministic one-pipeline workstation, constraints, queue identity, demand/recovery, and recovery behavior             | Frozen-candidate canonical verification and retained root browser suite pass; candidate diff is confined to D-011 recovery behavior.                                                                                                                                           | PASS         |
| D-007: durable Workstation Expansion I, fixed time, migration, portrait interaction                                                         | Canonical deterministic pacing/progression checks and root/Pages browser suite pass, including 320/393, touch drag, 200% text, and reload/offline paths.                                                                                                                       | PASS         |
| D-008: root and Pages PWA identity, atomic update/rollback, scoped caches, save survival, offline recovery                                  | Local pinned root/Pages suites pass; exact candidate Verify and Pages deployment runs succeeded; public Pages `build-info.json` is available at the expected scope.                                                                                                            | PASS         |
| D-010: bounded Career schedule, accounting, fictional model tiers, offline policy, schema-6 migration                                       | Candidate canonical Career balance and browser cases pass; retained browser suite covers schedule batch handling, persistence, malformed state, and bounded offline recovery.                                                                                                  | PASS         |
| D-011 evaluation: public proxy distinct from paid categorical private evidence; payment failure/retry; no latent private number             | Independent matrix: unfunded private evaluation remains a no-op; normal funded evaluation records $0.750, coverage, and a category. Impossible one-sample/90% and zero-sample private evidence recover. Candidate tests and browser acceptance pass.                           | PASS         |
| D-011 failure contract: warnings, ignored warnings, incidents, bounded append-only causal ledger                                            | Normal ignored-warning event is appended and fresh forged counters recover. Once retained history is full, mutable causal counters are accepted without evidence and can invent a causal ending.                                                                               | FAIL — V-041 |
| D-011 ending contract: five command-reachable endings, accumulated causal pattern, frozen run, explicit honest conclusion                   | Independent five-ending matrix returns the intended ending, valid state, and causal postmortem for every named ending; canonical 121-seed sweep and browser freeze/replay paths pass. V-041 makes the accumulated-pattern guarantee false for malformed long-history recovery. | FAIL — V-041 |
| D-011 information-only diagnostic meta-progression                                                                                          | Candidate canonical engine/browser replay cases confirm reset preserves diagnostic/history metadata while fresh economy and metrics begin without a flat bonus.                                                                                                                | PASS         |
| D-011 persistence/compatibility: schema-6 migration, malformed/dangling evaluation/postmortem recovery, retained frozen postmortem evidence | Schema migration, malformed private evidence, dangling postmortem, reload, and frozen postmortem paths pass. A semantically forged current causal record after ledger eviction is re-sealed instead of safely recovered.                                                       | FAIL — V-041 |
| D-011 UX/accessibility: 320/393 portrait, 200% text, keyboard/touch, reduced motion, reload/restart/meta, offline                           | Full pinned root suite passes retained 320/393 and access paths; verifier adversarial case runs at 320px with reduced motion and confirms a user-visible false postmortem.                                                                                                     | FAIL — V-041 |
| D-011 scope boundary                                                                                                                        | Candidate production diff and source inspection add validation/recovery only; no prohibited pipelines, characters, creators, attention systems, startup/labor/laboratory, or transient catalogue were introduced.                                                              | PASS         |
| Repository testability, setup, startup/readiness/cleanup, exact-SHA CI and deployment                                                       | Local setup/start/cleanup passed; exact candidate Verify and Pages runs both succeeded. The verifier regressions expose a correctable product defect, not missing infrastructure.                                                                                              | FAIL — V-041 |

## Findings

### V-041 — Full bounded ledger permits forged causal counters to manufacture a run ending

- Severity: High.
- Related plan requirement: D-011 Failure, Ending, and Persistence contracts;
  plan.md Sections 16, 17, 24.4, 24.5, and 24.6.
- Expected behavior: A malformed current save must not be re-sealed as a causal
  history when its retained evidence does not support its mutable causal
  counters. In particular, a save whose real history is 81 baseline captures
  and whose retained 80 events contain no ignored-warning event must safely
  recover or otherwise retain verifiable causal history; a later public preview
  must not fabricate a Tutorial Loop ending/postmortem.
- Actual behavior: `hasRetainedCausalLedgerEvidence` verifies counters only
  while `eventSequence <= 80`. At `eventSequence > 80`, it returns true solely
  when `ledger.length === 80`. A stale-integrity save can therefore change
  `modelSwitches` to 8, `warnings.tutorial` to 2, and `ignoredWarnings` to 2;
  restore preserves the forged fields, adds `integrity-resealed`, and the next
  public evaluation resolves a `tutorial-loop` ending.
- Exact reproduction procedure:

  1. Run
     `npx vitest run --coverage.enabled=false src/simulation/verifierRound033.test.ts`.
  2. The probe creates `createInitialState(33001)`, appends 81
     `CAPTURE_BASELINE` events, then serializes it. The valid source state has
     `eventSequence: 82`, a 80-event retained ledger, and no ignored-warning
     ledger event.
  3. Modify only the serialized evaluation counters to `modelSwitches: 8`,
     `warnings.tutorial: 2`, and `ignoredWarnings: 2`; restore it; then run
     `RUN_PUBLIC_EVALUATION`.
  4. For the user-visible path, run
     `npm run test:e2e -- tests/e2e/verifier-round-033.spec.ts --reporter=line`
     using the repository-pinned host browser launch.

- Concrete evidence: The unit assertion receives 8 model switches, 2 ignored
  warnings, and tutorial warning level 2 where a recovered blank evaluation is
  expected. The independent matrix reports:

  ```text
  eventSequence=82; ledgerLength=80; retainedIgnoredEvents=0
  restoredSwitches=8; restoredIgnored=2
  migration=[integrity-resealed]; ending=tutorial-loop; valid=true
  ```

  The 320px browser probe reports a visible `Run postmortem` heading and
  `Tutorial Loop` event `evt-0-84`. Visual inspection of its screenshot shows
  the postmortem claiming “8 model or quantization changes” and “2
  ignored-warning decisions were recorded,” although those decisions were not
  present in the retained source history.

- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal behavior, native installed-PWA behavior,
  non-Chromium engines, and actual screen-reader output.
- A repair has not been supplied, so no successor exact-SHA CI/deployment run
  exists for V-041.

## Residual risks

- The local FNV save digest is an accidental-corruption check rather than a
  server-side anti-cheat boundary. D-011 still requires safe malformed-state
  recovery and truthfully supported causal postmortems; V-041 violates that
  product boundary after ledger eviction.
- Correct recovery must preserve legitimate old causal history without allowing
  a mutable post-eviction counter to invent it. A bounded causal snapshot or
  equivalent verifiable retained summary is likely needed; dropping all old
  counter history would risk violating save/load preservation.
- Browser launch needs approved host execution on this macOS environment; all
  required browser checks were completed with the repository-pinned browser and
  no browser infrastructure blocker remains.
