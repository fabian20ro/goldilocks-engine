# Verification round 046

Candidate SHA: `a72821a6088d417d27c00deecc85867ec70e3073`

VERDICT: FAIL

## Candidate freeze and scope

- Before verifier writes: `git rev-parse HEAD` returned exactly
  `a72821a6088d417d27c00deecc85867ec70e3073`; `git status --short` was empty.
- Independently read `AGENTS.md`, `.codex/agents/verifier.toml`, all of
  `plan.md`, `.agent/DECISIONS.md`, `.agent/HANDOFF.md`, and prior verification
  findings. Handoff and candidate-authored tests used only as pointers.
- Relative to round-045 candidate `f53c07a`, this candidate ancestry changes
  only verification artifacts (`src/simulation/verifierRound031.test.ts`,
  `tests/e2e/verifier-round-003.spec.ts`, round-045 evidence) and handoff
  documentation; production implementation is unchanged. The failing change is
  the new dynamic-queue browser assertion.
- This verifier adds `tests/e2e/verifier-round-046.spec.ts`, an independent
  project-pinned browser probe. It preserves the 320px/200%-text stress path,
  waits for Worker acknowledgement, verifies the actual 99 waiting-task cap,
  checks Build/Jobs/Inspect overflow, and captures page/console errors.

## Environment and setup

- macOS Darwin `25.5.0` arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Project-pinned Playwright `1.61.1`; repository-local npm and browser caches
  from `./scripts/setup`.
- Clean setup succeeded as the first stage of `./scripts/verify`: `npm ci` and
  `npx playwright install chromium` completed using `.cache/npm` and
  `.cache/ms-playwright`.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | PASS: exact supplied SHA; clean start. |
| `./scripts/verify` | **FAIL, exit 1**: setup, format, lint, typecheck, 153/153 unit/property tests, all five balance sweeps, production build, 152/153 root Playwright tests, and 2/2 Pages tests passed. One root assertion failed: V-055. |
| `npx vitest run --coverage.enabled=false src/simulation/verifierRound031.test.ts --reporter=verbose --testTimeout=5000` | PASS: 5/5; retained 17-seed × 120-step deterministic corpus completed in 593ms. V-054 stabilization is effective. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-003.spec.ts --grep 'stressed dynamic content' --reporter=line` | **FAIL, exit 1**: exact V-055 reproduction. Error context reports a paused pipeline with `99 queued`; test demands inaccessible `100 jobs queued at bottleneck`. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-046.spec.ts --repeat-each=5 --reporter=line` | PASS: 5/5. Paused 320px/200%-text path reaches exactly 99 durable waiting tasks when each Worker update is acknowledged; no overflow, page error, or console error. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-042.spec.ts --grep 'visual deck inspection' --reporter=line` | PASS: 2/2. Fresh screenshots generated for Build, Jobs, Career, Upgrades, and Inspect at 320×693 and 393×742, starter and expanded. All 20 inspected at original resolution. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-039.spec.ts tests/e2e/verifier-round-040.spec.ts tests/e2e/verifier-round-041.spec.ts --reporter=line` | PASS: 15/15. Malformed/stale save recovery, forged completion rejection, clear/reload, Escape/Cancel focus, no page/console errors, and raw 320/393 initial geometry. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` | PASS after verifier test addition. |
| `./scripts/run`; `curl -sS -D - -o /dev/null http://127.0.0.1:4173/`; Ctrl-C; listener checks on 4173/4174 | PASS: Vite ready in 140ms; HTTP 200; no listener remained. |
| Production-asset scan for remote URLs, Webdings, `<img>`, and `@font-face` | PASS: no production result (apart from the XML namespace in local `public/icon.svg`). |

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| Deterministic headless simulation, numeric validity, Worker authority, migration, malformed-state recovery (§§23–27; D-004; D-014–D-017) | Canonical 153/153 unit/property tests; focused deterministic evaluation corpus 5/5; focused stale/forged-save recovery suite 15/15. | Pass observed |
| Pipeline toy: constrained compatible topology, module handling, failures, presets, touch/keyboard paths, persistence/offline (§§8, 20.4; Milestone 1) | Canonical root browser suite passed all relevant cases; fresh 320/393 visual inspection; no console/page errors in independent and recovery probes. | Pass observed |
| Workstation Expansion I: exact-once 3→6 capacity, empty/bypassed slots, eight staged workloads, locked quotes/demand, clear-waiting, speed equivalence (§§8.1, 9; Milestone 2; D-006/D-007) | Canonical zero-failure first-session 41-seed, upgrade 20,001-seed, and progression 41-seed sweeps; passing expanded topology/workload browser cases; fresh expanded screenshots. | Pass observed |
| Bounded Career loop and evaluation/failure/replay (§§11, 16–18; Milestone 3; D-010/D-011) | Canonical Career 101-seed and evaluation 121-seed sweeps, unit suite, and browser acceptance passed. | Pass observed |
| First-session queue → settlement → paid explicit installation, Build-only placement, cancellation, reload/offline/malformed recovery (§20.6; D-013–D-017) | Focused 15/15 adversarial browser suite plus canonical first-session coverage. | Pass observed |
| Portrait command deck, all five tabs, starter/expanded rail, 320/393 geometry, 200% text, target size, reduced motion, no color-only meaning (§§20.4–20.5; D-012/D-018) | Canonical 152 passing root cases; fresh original-resolution inspection of 20 screenshots found coherent palette/glyphs, readable primary actions, visible fixed navigation, no clipped expansion rail, and no visual pipe/map regression. | Product behavior pass observed; canonical gate still fails V-055 |
| Dynamic-content mobile stress / browser reproducibility (§20.4; §27) | Independent 5-repeat probe passes with exact cap and error/overflow checks. Candidate's own canonical stress assertion instead requires 100 when the engine caps waiting tasks at 99. | **FAIL — V-055** |
| Root and GitHub Pages PWA scope, update/recovery, offline reload, startup/cleanup (D-008; AGENTS.md browser testability) | Canonical root PWA/update cases passed; Pages/offline suite 2/2; explicit `scripts/run` HTTP 200 and cleanup verified. | Pass observed |
| Command-deck scope/deferred-content boundary and no remote/raster/icon-font dependency (§20.5; D-012) | Candidate ancestry contains no production change; production static scan found no remote image/font/Webdings use. | Pass observed |
| Exact accepted-SHA deployment (§2.4; D-009) | Not evaluated: candidate is not acceptable while the required canonical gate is red. | Unverified; cannot support PASS |

## Findings

### V-055 — Dynamic 320px queue regression asserts an impossible backlog

- Severity: Medium.
- Related plan requirement: §20.4 mobile/accessibility acceptance; §27
  reproducible browser verification; D-012 command-deck evidence.
- Expected behavior: The paused 320px/200%-text stress test must create a
  deterministic maximum waiting backlog, respect the engine's queue limit, then
  retain the Build/Jobs/Inspect overflow and error checks.
- Actual behavior: `tests/e2e/verifier-round-003.spec.ts:103` requires
  `100 jobs queued at bottleneck`. `src/simulation/engine.ts:56` defines
  `MAX_QUEUED_TASKS = 99`; line 2398 clamps every enqueue to the remaining
  space. The focused failure's Playwright error context records `0% 99 queued`
  and `Runtime Q 99`, so the requested 100-label can never exist.
- Exact reproduction: `E2E_PORT=4174 npm run test:e2e --
  tests/e2e/verifier-round-003.spec.ts --grep 'stressed dynamic content'
  --reporter=line`.
- Concrete evidence: reproduction exits 1 after the 5s locator wait; the full
  canonical command likewise exits 1 with exactly this one root failure while
  its other 152 root and 2 Pages tests pass. New verifier probe
  `tests/e2e/verifier-round-046.spec.ts` passes five repeats by awaiting each
  Worker state acknowledgement and observing exactly 99 persisted waiting
  tasks, the 99 bottleneck label, no 100 label, no overflow, and no page/console
  errors.
- Required correction: retain the paused stress and all visual/error assertions;
  synchronize queue requests with Worker acknowledgement and assert the real
  99-task cap. Do not change production queue semantics merely to satisfy this
  incorrect test expectation.
- Blocks PASS: Yes. The mandatory canonical command is red for this frozen
  candidate.

## Unverified areas

- Exact-SHA deployment was not attempted after the canonical failure. It remains
  required for a future PASS under §2.4/D-009.
- Physical iOS/Android interaction, native screen-reader speech, battery/thermal
  budget, and non-Chromium engines remain outside this local environment. These
  are residual platform checks, not a substitute for the completed pinned
  Chromium evidence.

## Residual risks

- V-055 must be repaired and the complete canonical gate rerun from a new frozen
  candidate. The independent 99-cap probe is evidence of current product
  behavior, not retroactive acceptance of this red canonical candidate.
- Storage-denial mode remains an in-memory playable session and cannot promise
  reload persistence; normal persisted/offline recovery paths passed.
