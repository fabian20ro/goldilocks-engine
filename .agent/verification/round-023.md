# Verification round 023

Candidate SHA: `c0d0745d71dc78c6f7c2769550ea062bceb46014`

VERDICT: FAIL

## Scope and verdict basis

Applicable scope: owner-authorized **Workstation Expansion I** in `plan.md`,
D-007, inherited Milestone 0–1 behavior, and D-004 through D-006. D-007
permits automated acceptance work without treating the historical subjective
human gates as measured or passed.

The candidate adds a pinned Linux GitHub Actions execution path for the full
canonical root and Pages browser gate. Exact candidate CI, the repository root
and Pages suites, public Pages probes, packaging, startup, and retained balance
checks all provide concrete passing evidence. B-008 is therefore resolved.

Acceptance still fails. V-028 is a correctable malformed-runtime-command
defect: an unknown nested `COMMAND` discriminant reaches `applyValidCommand`,
whose exhaustive TypeScript switch has no runtime fallback. It returns
`undefined`; `applyCommand` then dereferences it. The Worker message handler
does not recover, publish a state response, or preserve command-stream
availability. This violates the required malformed-input/failure-recovery
boundary; a PASS is not defensible.

## Environment and setup

- Verifier host: macOS / Darwin 25.5.0, arm64; Node v26.5.0; npm 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1, Chromium in ignored
  `.cache/ms-playwright`.
- Exact external canonical run: Ubuntu 24.04, Node v22.23.1, npm 10.9.8;
  GitHub Actions run `29557021829`, job `87811226021`, completed successfully
  against the exact candidate SHA. Its retained artifact is
  `verification-evidence-c0d0745d71dc78c6f7c2769550ea062bceb46014`
  (artifact ID `8397931382`, digest
  `sha256:2bd5894d76d7de99b742eeee75d2faa8fc0883c61fc94f0a8e5ee9f5fe284432`).
- Before any Verifier write, `git rev-parse HEAD` was
  `c0d0745d71dc78c6f7c2769550ea062bceb46014`, exactly matching the supplied
  candidate; `git status --short` was empty. `origin/agent/implementation`
  also resolved to that SHA.
- Complete reads: `AGENTS.md`, all 1,879 `plan.md` lines, Verifier role,
  decisions, handoff, and immutable prior report/finding history. Candidate
  production and workflow changes inspected independently.
- Verifier-owned artifacts: this report,
  `.agent/verification/round-023-live.config.ts`,
  `.agent/verification/round-023-live.spec.ts`, and
  `src/simulation/verifierRound023.test.ts`. No production code, plan,
  decisions, handoff, or prior report was changed.

## Commands executed and results

| Command or probe                                                                   | Result                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate identity, clean-start status, exact remote ref                           | PASS. Local HEAD and `origin/agent/implementation` exactly matched the supplied SHA before Verifier changes.                                                                                                                                                                                                                                                                                              |
| Exact GitHub workflow and retained artifact inspection                             | PASS. Run `29557021829` is `success`; the frozen checkout recorded the exact SHA. Artifact metadata records Linux, Node 22.23.1, npm 10.9.8; logs show 16 test files / 81 tests, root E2E 52, and Pages E2E 2 all passing.                                                                                                                                                                                |
| `./scripts/verify` at the frozen candidate before Verifier tests                   | Static formatting, lint, typecheck, 81 candidate unit/property tests, base balance, 20,001-seed upgrade balance, 41-seed progression balance, root build, and Pages build passed. Sandboxed local Chromium was denied macOS Mach-port registration before page creation; the aggregate wrapper correctly continued from all 52 root launch failures into both Pages launch failures and returned nonzero. |
| `npm run test:e2e -- --reporter=dot` with scoped browser launch                    | PASS: 52/52 root packaged-PWA cases in 37.1 s. No page or console errors.                                                                                                                                                                                                                                                                                                                                 |
| `npm run test:e2e:pages -- --reporter=dot` with scoped browser launch              | PASS: 2/2 Pages-subpath cases in 3.2 s.                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run test:e2e -- --config=.agent/verification/round-023-live.config.ts`        | PASS: 3/3 independent public Pages probes: exact candidate shell/cache/scope/offline resume; queue identity, locked quote and exact clear; 320 and 393 CSS pixels at 200% text; actual CDP touch moves across Process 4, 5, and 6. No page, console, request, or HTTP errors.                                                                                                                             |
| Live deployment/asset comparison                                                   | PASS. `https://fabian20ro.github.io/goldlocks-engine/` returned HTTP 200. Its manifest exactly matched locally built candidate assets `index-C5mGLMDv.js`, `index-KpaAuKDr.css`, and `worker-CkOWgOPt.js` under `/goldlocks-engine/`.                                                                                                                                                                     |
| Screenshot inspection                                                              | PASS. Fresh 320 and 393 CSS-pixel 200%-text screenshots show readable expanded pipeline controls and no horizontal document overflow.                                                                                                                                                                                                                                                                     |
| `./scripts/run`; HTTP probes for `/` and `/sw.js`; Ctrl-C; post-stop probe         | PASS. Vite reached deterministic `127.0.0.1:4173`; both resources returned HTTP 200; Ctrl-C stopped it and the port no longer accepted connections.                                                                                                                                                                                                                                                       |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `npm run build:pages` | PASS after Verifier additions. Pages build emitted the exact expected scoped main JS, CSS, Worker, service worker, and asset manifest.                                                                                                                                                                                                                                                                    |
| `npx tsx -e "… UNKNOWN_COMMAND …"`                                                 | FAIL as expected for V-028. Direct runtime request throws `TypeError: Cannot read properties of undefined (reading 'unlockedWorkloadIds')`, stack `refreshWorkloadUnlocks` → `applyCommand` → `reduceWorkerRequest`.                                                                                                                                                                                      |
| `npm test` after adding `verifierRound023.test.ts`                                 | FAIL: 81 retained candidate tests pass; the two new independent malformed-command regressions both fail with the same TypeError.                                                                                                                                                                                                                                                                          |

Canonical balance evidence retained and independently checked from the exact
Linux artifact: upgrade sweep 20,001 seeds / zero failures / first module by
four successes / alternate rig by 14; progression sweep 41 seeds / zero
failures / expansion 13.1444–15.5944 simulated hours / full catalogue
40.6292–44.4014 hours.

## Requirement evidence matrix

| Applicable requirement                                                                                             | Status                                       | Evidence                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-007 authorization, bounded scope, preservation of historical human-gate status                                   | PASS                                         | Plan, decisions, candidate diff, and retained reports agree; no deferred researcher, hype/fear, multiple-pipeline, startup, labor, or later system entered scope.                                  |
| Milestone 0 numeric prototype and automated pacing/economy predicates                                              | PASS for automated predicates                | Exact Linux canonical result, retained unit/property suite, 20,001-seed upgrade sweep, and 41-seed progression sweep pass. Subjective economy-interest gate remains unmeasured.                    |
| Milestone 1 constrained portrait pipeline, branch, queue, feedback, failure and recovery                           | PASS except V-028 malformed command recovery | Root 52/52, Pages 2/2, and public touch/portrait probes cover normal player flows; malformed nested Worker command recovery fails.                                                                 |
| D-004 runtime command boundary, finite values, transactional malformed handling                                    | FAIL — V-028                                 | Existing numeric cases pass, but a runtime `SimulationCommand` with an unknown discriminant crashes instead of exact safe rejection.                                                               |
| D-005 tutorial, money loop, help, presets, definitions, animation/time separation, PWA                             | PASS                                         | Root, Pages, retained accessibility/persistence checks, and live offline reload pass.                                                                                                              |
| D-006 purchase/ownership/equip rules, decision information, bounded economy, schema-v4 inheritance                 | PASS                                         | Retained unit/browser regressions plus balance sweeps pass.                                                                                                                                        |
| Exact-once 3→6 expansion; empty/bypassed new positions; full ordered topology                                      | PASS                                         | Retained engine/root assertions, live buy/activate probe, and 320/393 expanded-pipeline checks pass.                                                                                               |
| Eight staged workloads; visible deterministic unlocks; persisted queue identity/locked quotes/demand               | PASS                                         | Catalog/root coverage and independent live probe show eight cards, queue-time active quote, demand preservation, and reload/offline resume.                                                        |
| Bounded saturation/recovery, locked quote settlement, warning, no idle-money exploit, viable rotation              | PASS for automated model                     | Retained engine/property and progression/balance evidence pass.                                                                                                                                    |
| Clear waiting tasks is exact, active-task preserving, and transactional                                            | PASS for valid and persisted states          | Root/Pages retained cases and independent public probe preserve active task, locked quote, and demand while removing only waiting work. V-028 separately prevents a global malformed-command PASS. |
| Exact 1×/4×/16×/64× schedules; separate animation/pause                                                            | PASS                                         | Retained deterministic and browser/reduced-motion checks pass.                                                                                                                                     |
| Bottom-nav-only routing; compact progressive disclosure                                                            | PASS                                         | Source inspection and browser assertions find no duplicate global page-routing CTA.                                                                                                                |
| 320/393 CSS pixels, 200% text, 44 px controls, keyboard/tap/touch drag, labels, reduced motion, no overflow        | PASS                                         | Root 52/52 and independent live 3/3 include the required dimensions, actual touch drag, 200% text, screenshots, and console-error capture.                                                         |
| Schema migration/current-save recovery, persistence, reload/resume, offline                                        | PASS for supported saved states              | Retained migration/recovery tests and exact public offline reload pass.                                                                                                                            |
| Repository-pinned Playwright; local cache; deterministic startup/cleanup; exact Pages subpath browser verification | PASS                                         | Candidate workflow, exact Linux success/artifact, local scoped root/Pages command results, live deployment probes, and cleanup test resolve B-008.                                                 |

## Prior finding and blocker regression results

- V-001 through V-027 remain resolved in retained unit, property, browser,
  persistence, workflow, and balance evidence.
- B-005 remains historically unmeasured. D-007 waives it as an automatic
  blocker for this bounded slice; this report does not represent it as passed.
- B-008 is resolved: the exact candidate's Ubuntu run executed the full
  canonical root and Pages browser gate successfully, and scoped local plus
  independent public Pages runs reproduce that result.

## Findings

### V-028 — Unknown nested Worker command crashes the simulation reducer

- Severity: High.
- Related requirement: `plan.md` Sections 23.2 (typed player commands through
  the simulation engine), 24.3 (queued-command update order), 27 (failure and
  recovery testing); D-004 runtime command-boundary rationale; D-007
  persistence/test contract; Verifier malformed-input and recovery mandate.
- Expected behavior: Because structured-cloned Worker messages bypass
  TypeScript, an unrecognized or malformed nested command must be rejected
  transactionally: no exception, no state mutation, no partial batch effect,
  and a responsive Worker state stream.
- Actual behavior: `reduceWorkerRequest` only verifies that `command` is a
  non-null object. An unknown `command.type` falls through the no-default
  `applyValidCommand` switch, returns `undefined`, then crashes in
  `refreshWorkloadUnlocks`. The Worker listener has no recovery around that
  call, so it cannot post its normal state response.
- Exact reproduction procedure:

  ```sh
  npx tsx -e "import { createInitialState } from './src/simulation/engine.ts'; import { reduceWorkerRequest } from './src/simulation/workerProtocol.ts'; const before = createInitialState(17); reduceWorkerRequest(before, { type: 'COMMAND', command: { type: 'UNKNOWN_COMMAND' } } as never);"
  npx vitest run src/simulation/verifierRound023.test.ts --coverage.enabled=false
  ```

- Concrete evidence: the first command exits 1 with `TypeError: Cannot read
properties of undefined (reading 'unlockedWorkloadIds')` at
  `engine.ts:478`, called from `applyCommand` at `engine.ts:1033` and
  `workerProtocol.ts:27`. The committed verifier regression has two failures:
  direct unknown command and an unknown command after a valid command in one
  `COMMAND_BATCH`.
- Blocks PASS: yes.

## Unverified areas

- The owner has not supplied measured 30-minute playtest evidence, device
  details, or structured telemetry for the original Milestone 0–1 human exit
  gates. D-007 permits this automated bounded-slice verification without
  converting that absence to a PASS claim.
- Physical mobile device behavior, non-Chromium engines, actual platform
  screen-reader output, battery/thermal performance, haptics, and audio are
  not available in this environment.
- No full malformed-command discriminator fuzzer was added; V-028 is a
  concrete representative crash that prevents acceptance already.

## Residual risks

- At 200% text, bottom-nav labels wrap more tightly than normal but remain
  named, visible, and usable; no clipping, overflow, or unmet target-size
  requirement was observed.
- The deterministic toy-economy sweeps establish the stated model bounds, not
  long-term player enjoyment or real-market calibration.
- The Worker-command boundary must be repaired and this exact verifier test
  rerun before a fresh candidate can receive PASS.
