# Verification round 029

Candidate SHA: `cf8d7304402eaa5a7631ff5255b8392d0c56b040`

VERDICT: PASS

## Scope and verdict basis

Applicable scope: the existing Milestone 0–1 pipeline toy, the
owner-authorized Workstation Expansion I slice in D-007 / plan Milestone 2,
D-008 redeploy-safe root and `/goldlocks-engine/` PWAs, and D-009's
automated-evidence policy. Research, hype/fear, parallel pipelines, startup,
labor, and later milestones remain deferred and were not treated as current
requirements.

Before any verifier write, `git rev-parse HEAD` returned the supplied candidate
SHA and `git status --short` was empty. Candidate inspection covered the
changed PWA client registration/reconciliation path, generated service worker,
and deployment-artifact build plugin independently of the handoff claims.

The candidate fixes the prior static-host identity failure: controller URL
query identity is checked against the worker's embedded message/cache identity;
a mismatch re-registers the verified build URL and reloads only after matching
identity is available. Root activation preserves a live, complete nested Pages
shell while still allowing root control when only a stale nested cache remains.

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Repository-pinned `@playwright/test` 1.61.1; Chromium installed under the
  ignored repository-local `.cache/ms-playwright` path.
- `./scripts/verify` performed locked `npm ci` and local Chromium setup, then
  formatting, lint, typecheck, unit/property, balance, build, root browser,
  and Pages browser gates.
- Chromium cannot create its macOS Mach port inside the managed filesystem
  sandbox before page creation. The exact pinned browser commands were rerun
  outside that sandbox; no required browser check was skipped.
- Verifier-authored artifacts: this immutable report and
  `tests/e2e/verifier-round-029.spec.ts`. No production implementation,
  `plan.md`, decision record, handoff, or prior verifier report was changed.

## Commands executed and results

| Command or probe                                                                          | Result                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short` before verifier writes                         | PASS. Exact supplied candidate; clean start.                                                                                                                                                                                                                                                                                                          |
| `./scripts/verify` with fresh setup and repository-local browser cache                    | PASS. Prettier, ESLint, TypeScript, 18 unit/property files / 87 tests, numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, production build, 89 root Playwright tests, and 2 Pages/offline tests all passed.                                                                                                                     |
| `npm run test:e2e -- tests/e2e/pwa-update.spec.ts --reporter=dot`                         | PASS, 16/16. Root and Pages installability, A→B update, stale URL repair, malformed/partial rollback, offline recovery, and sibling-scope cases.                                                                                                                                                                                                      |
| `npm run test:e2e:pages -- --reporter=dot`                                                | PASS, 2/2. Pages-scoped production PWA and foreign-cache isolation.                                                                                                                                                                                                                                                                                   |
| `npm run test:e2e -- tests/e2e/verifier-round-029.spec.ts --reporter=line`                | PASS, 1/1 independent live-nested-shell/static-host recovery probe.                                                                                                                                                                                                                                                                                   |
| `npm run test:e2e -- tests/e2e/verifier-round-029.spec.ts --repeat-each=5 --reporter=dot` | PASS, 5/5 consecutive independent recovery executions.                                                                                                                                                                                                                                                                                                |
| Direct production inspection through repository-pinned Playwright CLI                     | PASS. At 320×568 and 393×667, normal and 200% text layouts had no horizontal overflow; 50.375px time controls were center-hit-testable above persistent navigation. Jobs exposed workload locks, exact queued quote, settlement, and expected-cost warning. Root service-worker identity and offline reload succeeded; console/page errors were zero. |
| Process cleanup checks: `lsof -nP -iTCP:4173 -sTCP:LISTEN` after each suite               | PASS. No listener remained after the final suite.                                                                                                                                                                                                                                                                                                     |

Deterministic balance evidence: all 20,001 upgrade seeds passed; first module
was affordable by successful job 4 worst-case and alternate rig by job 14
worst-case. All 41 progression seeds passed; expansion was reached in
13.14–15.59 simulated hours and full catalogue in 40.63–44.40 hours.

## Requirement evidence matrix

| Applicable requirement                                                                                                                                           | Status | Evidence                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007/D-009 bounded scope; no deferred systems added                                                                                                             | PASS   | Candidate diff is PWA/update reliability only. Source inspection and full suite retain the single-pipeline, no-research/no-hype/no-labor scope.                                                                                                                                                              |
| Plan 2.3 primary pipeline quality gate: legible throughput, memory, cost, and failure tradeoffs under repeatable simulation/browser evidence                     | PASS   | Canonical deterministic scenarios, 20,001/41-seed balance sweeps, and root acceptance passed. Independent Jobs/Build inspection exposed incompatible/locked choices, guaranteed-failure cost warning, queue-time quote, actual cost, and visible settlement rather than a single dominant output meter.      |
| Plan 6 durable accepted-work, demand/recovery, and five-minute observe/modify/run/interpret loop                                                                 | PASS   | Direct UI queue accepted Interactive Chat at `$1.400`, then showed its settled configured cost/net while the later workload selection changed only future offer information. Canonical demand, clear-waiting, time, and persistence cases passed.                                                            |
| Deterministic simulation, numeric validation, atomic commands, state migration, integrity, and save recovery                                                     | PASS   | Canonical 87 unit/property tests, numeric prototype, upgrade/progression sweeps, and retained migration/recovery browser cases passed.                                                                                                                                                                       |
| Constrained starter/expanded pipeline, exact-once capacity purchase, honest empty slots, compatible placement, presets                                           | PASS   | Canonical expansion, drag/tap, preset, migration, and offline cases passed; current Build view inspection exposed the constrained ordered pipeline and accessible controls.                                                                                                                                  |
| Eight staged workloads, visible deterministic locks, per-task identity/quote, configuration cost, demand saturation/recovery                                     | PASS   | Canonical market/queue/balance cases passed. Independent Jobs inspection showed four initial cards, four explicit locks/progress, accepted Interactive Chat locked at `$1.400`, later Batch selection, and additive settlement.                                                                              |
| Clear waiting-only semantics, malformed/reload/offline recovery, no duplicate activation                                                                         | PASS   | Retained unit/property and root browser regression cases passed within canonical verification.                                                                                                                                                                                                               |
| Fixed 1×/4×/16×/64× schedule equivalence; bounded economy and no idle-only exploit                                                                               | PASS   | Canonical deterministic and balance suites passed, including 20,001/41-seed evidence. Direct UI exposed all four separate, 50.375px time controls.                                                                                                                                                           |
| Portrait-first UI: 320/393, 200% text, 44px targets, keyboard/tap/touch alternatives, reduced motion, labels, no color-only state, bottom-only global navigation | PASS   | 89 pinned root browser cases passed. Independent real-browser inspection at both sizes/scales found `scrollWidth === clientWidth`, readable resource/time control flow, bottom navigation, accessible names, and physical center hits. Motion toggle changed to `Animations off` with visual-only semantics. |
| Reload/resume/offline persistence, root and Pages PWA installability                                                                                             | PASS   | Canonical root/Pages cases and direct root offline reload verified service-worker controller, build identity, cache, and preserved local state.                                                                                                                                                              |
| D-008 deterministic build identity, exact asset manifest, complete-cache transaction, malformed/unavailable rollback, scope-isolated cache cleanup               | PASS   | Source inspection of `vite.config.ts` and service worker; canonical 16 PWA tests reject unavailable, omitted/null, duplicate, cross-origin/out-of-scope, and partial candidates while retaining offline A.                                                                                                   |
| D-008 online A→B convergence, reload-once, static-host stale query repair, B offline reload                                                                      | PASS   | Canonical PWA cases pass for root and Pages. Candidate app checks worker message/cache identity rather than trusting query URL. The independent 5× probe converged A-query/B-body root to matching B app/controller/worker/cache/reload marker.                                                              |
| D-008 live root/Pages sibling isolation and stale nested-cache recovery                                                                                          | PASS   | Canonical live-Pages and orphaned-Pages-cache cases passed. Verifier probe held Pages A live while root underwent static-host repair; root converged B, durable localStorage survived, Pages stayed A and reloaded offline.                                                                                  |
| Reproducible installation/startup/cleanup and pinned browser acceptance                                                                                          | PASS   | Fresh setup inside canonical verification, deterministic loopback Playwright servers, successful root/Pages suites, and final port-cleanup checks.                                                                                                                                                           |
| Plan 2.4 / D-009 independent-verifier prerequisite to release                                                                                                    | PASS   | This report supplies the required fresh independent candidate evaluation with reproducible automated evidence. Exact-SHA deployment and deployed build-identity confirmation remain the subsequent Orchestrator/release action, not a claim made by this verifier.                                           |

## Findings

None. No unresolved correctable candidate defect found.

## Unverified areas

- Physical-device battery/thermal behavior, non-Chromium engines, platform
  screen-reader output, haptics, and audio were not available.
- No optional owner/player study, recording, or telemetry collection occurred;
  D-009 makes those feedback sources non-blocking.
- Deployment of this newly accepted SHA is an Orchestrator/release step and
  was not performed by the Verifier. This report makes no production-release
  claim; deployment must expose this accepted build identity before release.

## Residual risks

- Live CDN/proxy cache policy and real installed-device update timing can vary
  from the deterministic static-host fixtures; the exact deployment must retain
  the tested headers and artifact semantics.
- The managed macOS sandbox prevents Chromium startup. Host execution of the
  same pinned repository-local browser passed; future verification in a
  similarly restricted environment must use an approved host browser launch,
  not silently omit browser evidence.
- Deferred later-game systems remain intentionally outside the tested current
  slice and require their own plan-authorized verification before release.
