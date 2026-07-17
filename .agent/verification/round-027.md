# Verification round 027

Candidate SHA: `8364e0ddd30f9382c780925796dab094196bd5dd`

VERDICT: FAIL

## Scope and verdict basis

Applicable scope: owner-authorized Workstation Expansion I in `plan.md`,
D-001 through D-008, inherited Milestone 0–1 behavior, and retained verifier
regressions. D-007 waives the historical subjective human-gate measurement for
this bounded automated verification; it does not waive D-008's production PWA
update contract.

The candidate passes the local happy-path A→B PWA suite and retained game
coverage. It fails two material D-008 requirements:

1. A syntactically malformed and incomplete B asset manifest activates at both
   root and `/goldlocks-engine/`, replaces the last complete A cache, and can
   leave B unable to reload offline.
2. The exact pushed candidate's Ubuntu canonical run failed the normal root
   A→B update contract: B was waiting while A remained the controller and both
   caches remained present after 20 seconds.

Both defects are correctable production/update behavior defects. PASS is not
permitted.

## Environment and setup

- Verifier host: macOS Darwin 25.5.0, arm64; Node v26.5.0; npm 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1; ignored
  `.cache/ms-playwright` Chromium.
- Before verifier writes: `git rev-parse HEAD` returned
  `8364e0ddd30f9382c780925796dab094196bd5dd`, exactly the supplied candidate;
  `git status --short` was empty.
- Complete independent reads: `plan.md` (all 1,879 lines), `AGENTS.md`,
  `.codex/agents/verifier.toml`, D-001 through D-008, current handoff as
  untrusted guidance, and retained finding history.
- `./scripts/setup` completed with locked dependencies and repository-local
  browser cache. No credentials required.
- Sandboxed Chromium launch failed before page creation with macOS Mach-port
  denial. Per protocol, the same repository-pinned commands were rerun outside
  that filesystem sandbox. Browser coverage was not skipped.
- Exact candidate is pushed at `origin/agent/implementation`. GitHub Actions
  `Verify` run `29572632327` is completed/failure for this exact SHA.
- Verifier-authored artifacts: this immutable report and
  `tests/e2e/verifier-round-027.spec.ts`. No production code, plan, decision
  record, handoff, prior report, or implementation-authored test changed.

## Commands executed and results

| Command or probe                                                                                                                                | Result                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git rev-parse HEAD`; `git status --short`                                                                                                      | PASS. Exact frozen candidate; clean start.                                                                                                                                                                                                                         |
| `./scripts/setup`                                                                                                                               | PASS. Locked dependency and repository-local browser setup.                                                                                                                                                                                                        |
| Sandboxed `./scripts/verify`                                                                                                                    | Expected infrastructure failure only: Chromium Mach-port registration denied before page creation; static/unit/balance/build phases completed.                                                                                                                     |
| Unsandboxed `./scripts/verify`                                                                                                                  | PASS locally. Format, lint, typecheck, 87 unit/property tests, numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, production build, 71 root browser tests, and 2 Pages browser tests.                                                        |
| `npm run test:e2e -- tests/e2e/pwa-update.spec.ts --grep "installs and atomically refreshes root from A to B" --repeat-each=10 --reporter=line` | PASS locally, 10/10 root A→B runs. Useful non-reproduction; does not override the exact-SHA Linux failure.                                                                                                                                                         |
| `npm run test:e2e -- tests/e2e/verifier-round-027.spec.ts --reporter=line`                                                                      | FAIL as expected: root and Pages malformed/incomplete B deployments activate B; independent root-redeploy/Pages-shell isolation probe passes.                                                                                                                      |
| `npx prettier --write tests/e2e/verifier-round-027.spec.ts`; `npx eslint tests/e2e/verifier-round-027.spec.ts --max-warnings 0`                 | PASS. Verifier regression is formatted and lint-clean.                                                                                                                                                                                                             |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check`                                                                 | PASS after verifier artifacts.                                                                                                                                                                                                                                     |
| Pinned Playwright CLI screenshots, 320×568 and 393×667                                                                                          | PASS visual inspection. Portrait shell, bottom nav, Help/Animations, primary resources, 44px time controls, and content scroll visually coherent; no console/page errors observed. Retained browser suite separately passes 200%-text and short-portrait controls. |
| `gh run list ... --commit 8364…`; `gh run view 29572632327 --log-failed`                                                                        | FAIL evidence. Exact Ubuntu canonical run failed root A→B update; 67 root browser cases passed, one PWA update case failed, three sibling PWA cases did not run; Pages suite still passed 2/2.                                                                     |

## Requirement evidence matrix

| Applicable requirement                                                                                                                 | Status                        | Evidence                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 scope gates; D-007 owner-authorized bounded slice only                                                                           | PASS for automated scope      | Candidate diff adds PWA/update tooling only; no researchers, hype/fear, narrative, startup, labor, or multiple pipelines. Historical human gates remain waived/unmeasured, not claimed passed.                                                 |
| D-004 transactional numeric commands, deterministic valid state, recovery/migration                                                    | PASS                          | Local canonical 87 unit/property tests; retained malformed-command, worker-protocol, atomicity, integrity, and schema migration browser/unit coverage.                                                                                         |
| D-005 tutorial, loop legibility, presets, CU/memory/reserve, pressure guidance, time/animation separation, accessibility regressions   | PASS for automated predicates | Canonical root suite includes retained rounds 009–010, 012, 015–017, and 024–026; normal portrait screenshots independently inspected.                                                                                                         |
| D-006 purchase ownership/equip/add, exact-once deductions, pacing and persistence                                                      | PASS for automated predicates | 20,001-seed upgrade sweep: zero failures; root browser retained exact-funds, duplicate activation, accessibility, reload/offline, and migration cases pass.                                                                                    |
| D-007 six-slot expansion, workloads/unlocks, quote locks/demand/clear, 64× equivalence, portrait/touch/keyboard/reduced-motion/offline | PASS for automated predicates | 41-seed progression sweep: zero failures; canonical 71 root browser tests include real touch drag, 320/393, 200% text, short viewport, persistence, offline, queue clearing, and expanded topology.                                            |
| Root and Pages installability, relative manifest/scope, version identity, scoped cache names                                           | PASS locally                  | Candidate builds root/Pages; local canonical PWA tests pass CDP installability and inspect build IDs/cache names.                                                                                                                              |
| D-008 online A→B convergence, complete cache activation, reload-once, save preservation, B offline reload                              | FAIL — V-033                  | Exact candidate Linux canonical run `29572632327` times out in root A→B: B app/cache exists, A remains controller, B waits, and both scoped caches remain. This violates deterministic update convergence and reproducible canonical evidence. |
| D-008 malformed/partial/unavailable candidate rollback and preservation of last complete shell                                         | FAIL — V-032                  | Fresh verifier probe serves B manifest with missing required app entry script plus non-string metadata. Both scopes activate B and remove A cache. Candidate's 503-manifest test covers only one failure form.                                 |
| D-008 cache isolation / no sibling-cache deletion                                                                                      | PASS                          | Fresh independent test installs Pages A, redeploys root B on same origin, then confirms Pages A controller/cache remains. Existing foreign-cache test also passes.                                                                             |
| Reproducible setup/startup/process cleanup                                                                                             | FAIL overall due V-033        | Setup, `./scripts/run`, canonical commands, and cleanup work locally. Exact frozen Linux canonical evidence is failing, so the full reproducibility gate is not satisfied.                                                                     |

## Findings

### V-032 — Malformed or incomplete deployment metadata activates and destroys the last complete shell

- Severity: High.
- Related plan requirement: D-008 failure/offline contract; `plan.md` Sections 23.1 and 27; PWA acceptance evidence requirement.
- Expected behavior: A partial, malformed, or unavailable B deployment must never activate. Its incomplete cache must be deleted; A worker/cache must remain usable at root and `/goldlocks-engine/`.
- Actual behavior: The generated worker accepts an array manifest after silently filtering invalid entries. A B manifest with the required `assets/index-*.js` omitted and an added `null` entry precaches only the remaining files, calls `skipWaiting`, activates B, and deletes A. It happens in both scopes.
- Exact reproduction procedure:

  ```sh
  ./scripts/setup
  npm run test:e2e -- tests/e2e/verifier-round-027.spec.ts --reporter=line
  ```

  Run the pinned browser command outside the managed macOS filesystem sandbox
  after its documented pre-page Mach-port denial.

- Concrete evidence: Verifier test creates A/B fixtures, starts A, then serves B
  `asset-manifest.json` with the `index.html` application script removed and a
  non-string entry appended. Root expected controller/cache
  `72f5c8ea3622c3835cec` instead becomes
  `121d175bafdcb331d3b3`; Pages expected `f0bdd7952dda96d6d765` instead becomes
  `9c6ca12a436bb647092d`. Each failure shows only B's scoped cache. The third
  independent same-origin root-B/Pages-A isolation probe passes.
- Blocks PASS: yes.

### V-033 — Exact candidate fails the normal root redeploy convergence gate on Linux

- Severity: High.
- Related plan requirement: D-008 update contract and acceptance evidence; repository browser-testability contract.
- Expected behavior: Online A→B refresh must fetch/activate B, remove obsolete A cache for its scope, and converge controlled clients to B without an indefinite mixed app/worker state.
- Actual behavior: GitHub Actions `Verify` run `29572632327`, pinned to this exact candidate SHA, times out in `tests/e2e/pwa-update.spec.ts` root A→B acceptance. B app/version/cache exists, but A remains controller and B remains waiting after 20 seconds; both A and B scoped caches remain.
- Exact reproduction procedure:

  ```sh
  gh run view 29572632327 --repo fabian20ro/goldlocks-engine --log-failed
  ```

  The candidate's normal canonical command is `./scripts/verify`; the exact
  Linux workflow invokes it after checking `HEAD == GITHUB_SHA`.

- Concrete evidence: CI diagnostic records app version/cache B
  `121d175bafdcb331d3b3`, controller/worker message A
  `72f5c8ea3622c3835cec`, both cache names, and registration
  `waiting: ...sw.js?build=121d175bafdcb331d3b3`. Local macOS rerun passes
  10/10 repetitions, so this is cross-environment/update-race evidence rather
  than an untested claim; the exact published Linux gate still fails.
- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal behavior, non-Chromium engines, platform
  screen-reader output, haptics, and audio unavailable here.
- Human thirty-minute pipeline/playability gates remain unmeasured; D-007
  authorizes automated verification only.
- No live GitHub Pages production URL behavior was exercised. Exact-SHA CI and
  local deterministic fixtures are available; production deployment is outside
  verifier write authority.

## Residual risks

- V-032 means a real malformed/partial upload can discard the last usable
  offline shell. Repair must strictly validate every manifest entry and prove
  that a missing referenced application asset leaves A active/cacheable.
- V-033 means happy-path update activation has an unresolved cross-environment
  race. Repair must pass the exact Linux canonical workflow and repeated
  root/Pages, single/multi-client A→B update tests before acceptance.
- Local 10/10 root rerun reduces but does not remove the exact-CI failure risk;
  do not treat it as a replacement for the failed immutable run.
