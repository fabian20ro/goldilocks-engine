# Verification round 001

Candidate SHA: `5d1f9c69e5f34df66b2b2b9bb0dcf900a4758928`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` is gate-ordered. Decision D-001 therefore makes Milestones 0 and 1,
the applicable cross-cutting architecture/accessibility requirements, and the
gate exclusions the candidate scope. Milestones 2–7 and expansions remain
deferred until the Pipeline Toy gate passes.

The candidate has five correctable defects in core throughput accounting,
ledger identity, bottleneck feedback, touch drag, and malformed persisted-state
handling. Each independently violates an applicable requirement and blocks
acceptance. Human exit-gate evidence is also absent; that would independently
prevent PASS after the implementation defects are fixed. Because correctable
candidate defects already determine this round, the outcome is FAIL rather than
BLOCKED.

## Environment and setup

- Host: Darwin 25.5.0 arm64.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under `.cache/ms-playwright`.
- Clean-start check: `git rev-parse HEAD` returned the candidate SHA and
  `git status --short` was empty before any verifier change.
- `./scripts/setup` completed through the canonical wrapper (`npm ci`, 0
  vulnerabilities, repository-local browser install).
- The managed macOS sandbox denied Chromium Mach-port registration. Re-running
  the exact pinned browser command with scoped out-of-sandbox approval worked;
  this is environment behavior, not a candidate defect.
- `./scripts/run` reported ready on `http://127.0.0.1:4173`; an independent HTTP
  probe returned `200 OK`; Ctrl-C stopped the server.
- Final process audit found no project Vite, Playwright, or Chromium process.

## Commands executed and results

| Command                                                                                 | Result                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD && git status --short`                                              | PASS at clean start; exact candidate matched.                                                                                                                                                                       |
| `./scripts/verify`                                                                      | Static/unit/balance/build stages passed; wrapper exited 1 only because all 8 original E2E cases were unable to launch Chromium inside the managed macOS sandbox (`MachPortRendezvousServer ... Permission denied`). |
| `npm run test:e2e` (scoped outside sandbox, before verifier probes)                     | PASS: 8/8 original browser tests.                                                                                                                                                                                   |
| `./scripts/run`; `curl -sS -D - http://127.0.0.1:4173/ -o /dev/null`; Ctrl-C            | PASS: deterministic loopback startup, HTTP 200, clean stop.                                                                                                                                                         |
| `node_modules/.bin/tsx -e ...` throughput probe                                         | FAIL evidence: one queued job plus a 60-second tick left `processingCarry: 6`; a new job plus a 0.001-second tick resolved immediately.                                                                             |
| `node_modules/.bin/tsx -e ...` bounded-ledger probe                                     | FAIL evidence: 80 retained events but only 60 unique IDs after 100 same-tick queue commands; repeated tail ID `evt-0-81`.                                                                                           |
| Seed sweep calling `validatePrototype(seed)` for seeds -1000 through 1000               | PASS: 2,001/2,001 reported viable paths, non-dominance checks, and upgrade tradeoffs.                                                                                                                               |
| `npm test` after verifier regressions                                                   | FAIL: 18 passed, 2 failed (`processingCarry`, unique ledger IDs).                                                                                                                                                   |
| `npm run balance`                                                                       | PASS: three paths viable, declared non-dominance true, upgrade tradeoffs true.                                                                                                                                      |
| `npm run test:e2e -- --grep "actually limits throughput"`                               | FAIL: queue absent from Verify slot; captured DOM placed `Q 10` over Runtime.                                                                                                                                       |
| `npm run test:e2e -- --grep "touch drag"`                                               | FAIL: real Chromium touch sequence left Quantized Model in Runtime instead of swapping Basic Cleaner into it.                                                                                                       |
| `npm run test:e2e -- --grep "malformed persisted presets"`                              | FAIL: uncaught page errors `Unknown module: unknown-runtime-module` and `Unknown workload: unknown-workload`.                                                                                                       |
| Final `npm run test:e2e` (scoped outside sandbox)                                       | FAIL: 8 passed, 3 failed; original portrait, tap, mouse drag, failure/recovery, persistence, text scaling/reduced-motion, and offline cases still passed.                                                           |
| `npx prettier --write ...`; `npm run format:check`; `npm run lint`; `npm run typecheck` | PASS.                                                                                                                                                                                                               |
| `ps -ax -o pid=,etime=,command=` filtered to project browser/server processes           | PASS: none remained.                                                                                                                                                                                                |

## Requirement evidence matrix

| Applicable plan requirement                                                                                                | Status                      | Independent evidence                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering; implement only Milestones 0–1 before the kill gate                                                          | PASS                        | Repository inspection found only the numeric prototype and Pipeline Toy; no research-character, investor, workforce, fear, or endgame production systems.                                               |
| M0: time and money; 3 hardware choices; 4 workloads; 1 competition, product, creator event, research project; 3 endings    | PASS                        | `numericPrototype.ts`, `catalog.ts`, focused unit tests, and `npm run balance`.                                                                                                                         |
| M0: competition-, product-, and creator-first viability; no universal winner; every upgrade adds a constraint              | PASS (automated model only) | Canonical balance output and independent 2,001-seed sweep; hardware inspection confirms increasing compute, capital cost, watts, maintenance/thermal exposure. Human enjoyment gate remains unverified. |
| M1: constrained portrait vertical pipeline with compatible replace/reorder and defined split/merge                         | PARTIAL / FAIL              | Tap placement, mouse drag/reorder, and shadow branch pass; actual touch drag fails V-005.                                                                                                               |
| M1: animated flows and reduced-motion alternative                                                                          | PASS                        | Flow CSS/code inspection; packaged browser reduced-motion case passes.                                                                                                                                  |
| M1: queues above bottlenecks                                                                                               | FAIL                        | V-003: Robust Evaluation is the limiting module in Verify, but the queue is rendered over Runtime.                                                                                                      |
| M1: memory limits, latency, throughput, thermal throttling, allocation constraints                                         | FAIL                        | Metrics and memory/thermal checks exist, but V-001 allows later jobs to consume banked idle capacity and exceed elapsed throughput.                                                                     |
| M1: failure propagation, rejected downstream output, and recovery                                                          | PASS                        | Unit capacity-failure scenario and packaged browser failure/recovery case pass.                                                                                                                         |
| M1: configuration comparison and player-authored presets                                                                   | PARTIAL / FAIL              | Comparison and valid preset reload pass; malformed persisted preset recovery fails V-004.                                                                                                               |
| Workloads stress latency, throughput, memory, reliability/quality differently                                              | PASS                        | Catalog inspection and deterministic metric/unit scenarios cover chat, batch classification, long document, and competition training.                                                                   |
| Predicted and observed signals differ; only decision-relevant properties shown                                             | PASS                        | Inspector exposes predicted/observed quality, deltas, evaluation coverage, pressure, throughput, latency, and reliability; unit probe confirms deterministic uncertainty.                               |
| Visual feedback: memory/thermal warnings, malformed/rejected data, error propagation, branch traffic, configuration deltas | PARTIAL / FAIL              | Most signals pass original E2E; queue placement is misleading (V-003), and malformed stored input generates uncaught errors (V-004).                                                                    |
| Portrait-first main screen: one objective, one bottleneck, 3–5 resources, one warning, one pipeline                        | PASS                        | Browser checks at 320 and 393 CSS px; DOM inspection; no horizontal viewport overflow.                                                                                                                  |
| One-handed access, large labeled controls, tap alternative, scalable text, reduced motion, no time-critical tapping        | PARTIAL / FAIL              | Original target-size/tap/150%-text/reduced-motion tests pass; required touch drag does not (V-005).                                                                                                     |
| TypeScript PWA; typed UI commands; headless deterministic simulation separated from React/rendering and run in a worker    | PASS                        | Build/typecheck, source inspection, replay/property tests, and worker boundary inspection.                                                                                                              |
| Determinism from seed and ordered commands; explicit update behavior                                                       | PASS                        | Replay/property tests and repeated direct runs are identical. V-001 is a capacity-correctness defect, not nondeterminism.                                                                               |
| Versioned state and bounded append-only causal/event ledger                                                                | FAIL                        | Schema/content versions and an 80-event bound exist, but retained IDs collide after the bound is reached (V-002).                                                                                       |
| Reproducible setup, startup, full checks, local browser cache, deterministic loopback, cleanup                             | PASS                        | Canonical wrapper through build, approved exact browser rerun, independent startup HTTP probe, ignored local caches, and final process audit.                                                           |
| Installable/offline PWA reload                                                                                             | PASS                        | Manifest/service-worker inspection and packaged offline reload browser case.                                                                                                                            |
| M0 economy exit gate and M1 30-minute voluntary reconfiguration/tradeoff-explanation gate                                  | UNVERIFIED; blocks PASS     | No participant record tied to the candidate SHA exists. `.agent/HANDOFF.md` explicitly identifies the missing evidence.                                                                                 |

## Findings

### V-001 — Drained queues bank whole units of unused throughput

- Severity: High.
- Related plan requirement: Milestone 1 latency/throughput and queues; §27
  property that jobs cannot exceed allocated capacity without a recorded
  failure.
- Expected behavior: `processingCarry` represents at most fractional in-progress
  work. Capacity not used because the queue drained is discarded; a later job
  requires newly elapsed processing time.
- Actual behavior: At the default measured 7 jobs/minute, processing one queued
  job for 60 seconds leaves carry 6. A newly queued job then resolves after a
  0.001-second tick.
- Exact reproduction: `npm test -- src/simulation/engine.test.ts -t "does not bank unused throughput"`.
- Concrete evidence: The verifier regression fails at
  `expect(state.jobs.processingCarry).toBeLessThan(1)` with received value `6`;
  the direct probe then changed total resolved jobs from 1 to 2 after only
  0.001 seconds.
- Blocks PASS: Yes. This breaks the core constrained-throughput simulation.

### V-002 — Bounded ledger reuses event identifiers

- Severity: High.
- Related plan requirement: §24.5 append-only event ledger with bounded retained
  history; §27 valid event references.
- Expected behavior: Every retained event has a stable, unique identity so
  rendering and causal references cannot alias different events.
- Actual behavior: `appendEvent` derives the ID from bounded `ledger.length`.
  Once length reaches 80, subsequent same-tick events repeatedly receive
  `evt-0-81`.
- Exact reproduction: `npm test -- src/simulation/engine.test.ts -t "keeps bounded ledger event identifiers unique"`.
- Concrete evidence: After 120 same-tick queue commands the regression retained
  80 events but `new Set(ids).size` was 40. A direct 100-command probe showed 80
  retained, 60 unique, and repeated `evt-0-81` tail entries.
- Blocks PASS: Yes. Distinct causal events become indistinguishable.

### V-003 — Queue feedback is rendered over the wrong stage

- Severity: Medium.
- Related plan requirement: §8.3 “Queues above bottlenecks”; Milestone 1 queues
  and bottleneck legibility.
- Expected behavior: When Robust Evaluation is the lowest-throughput module and
  the UI reports `module throughput` as dominant, queued work appears above the
  Verify/Robust Evaluation stage.
- Actual behavior: The queue slot is hard-coded to Runtime except for order
  warnings. The captured DOM showed `Runtime Q 10`; Verify contained Robust
  Evaluation with no queue badge.
- Exact reproduction: `npm run test:e2e -- --grep "actually limits throughput"`
  using the repository-local browser outside the managed macOS sandbox.
- Concrete evidence: The assertion for a bottleneck queue inside
  `slot-verify` timed out; the Playwright error context records `module
throughput`, `Runtime Q 10`, and `Robust Evaluation` in Verify.
- Blocks PASS: Yes. The central observe/diagnose loop gives misleading feedback.

### V-004 — Structurally malformed presets emit uncaught worker errors

- Severity: Medium.
- Related plan requirement: §8.1 saved configurations/presets; §20 legible
  failure/recovery; §24.6 persisted-state integrity intent.
- Expected behavior: Persisted preset data is runtime-validated. Unknown module
  or workload IDs are rejected or ignored without uncaught page/worker errors,
  and the application remains operable.
- Actual behavior: `loadPresets` casts any parsed array to `SavedPreset[]`.
  Loading an object with unknown IDs posts invalid commands to the worker and
  emits uncaught errors.
- Exact reproduction: `npm run test:e2e -- --grep "malformed persisted presets"`
  using the repository-local browser outside the managed macOS sandbox.
- Concrete evidence: Playwright captured page errors `Unknown module:
unknown-runtime-module` and `Unknown workload: unknown-workload`.
- Blocks PASS: Yes. A corrupt local configuration crosses the typed boundary
  without validation or clean recovery.

### V-005 — Touch drag does not reorder compatible active modules

- Severity: High.
- Related plan requirement: portrait-first one-handed play; §8.1 drag a module
  into a compatible slot and reorder compatible modules; Milestone 1 drag/snap;
  §27 mobile drag precision.
- Expected behavior: A real Chromium touch sequence from Basic Cleaner in
  Prepare to Runtime swaps it with Quantized Model, matching the supported mouse
  drag behavior.
- Actual behavior: The touch sequence completes without a swap; Runtime still
  contains Quantized Model.
- Exact reproduction: `npm run test:e2e -- --grep "touch drag"` using the
  repository-local browser outside the managed macOS sandbox.
- Concrete evidence: Playwright expected `Basic Cleaner` in `slot-runtime` but
  repeatedly received `Runtime Q4 Quantized Model ...` until timeout.
- Blocks PASS: Yes. The primary interaction fails on the target input modality;
  tap-then-snap remains available but does not satisfy drag/snap acceptance.

## Unverified areas

- No dated human playtest tied to the candidate SHA demonstrates that the M0
  economy is interesting without narrative spectacle.
- No uninterrupted 30-minute human session demonstrates voluntary pipeline
  reconfiguration and player explanation of tradeoffs. This is the explicit M1
  exit gate and independently blocks PASS.
- No physical-device battery/CPU/thermal profile. Chromium covers functional
  portrait behavior only.
- Only Chromium was exercised. Cross-browser behavior was not required by the
  candidate handoff and was not verified.
- Milestones 2–7 and expansions were not evaluated as implemented behavior
  because plan ordering prohibits them before the Pipeline Toy gate.

## Residual risks

- Automated path viability is not evidence that the economy is enjoyable or
  lacks a human-discovered dominant strategy.
- The test suite uses short deterministic sessions; long-session resource drift,
  performance, and event-log behavior require renewed verification after the
  findings are repaired.
- Service-worker offline reload passes for the built candidate, but update/migration
  behavior across future content/schema versions is not yet in current scope.
