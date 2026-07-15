# Verification round 003

Candidate SHA: `7a0d92c306b2097d3005ad78927a787cc51af398`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` is gate-ordered. Decision D-001 therefore makes Milestones 0 and 1,
their applicable simulation/PWA/accessibility requirements, and the exclusion of
later milestones the current scope.

The candidate resolves round-002 findings V-006 and V-007. Independent browser
verification found two new correctable accessibility defects: the two primary
resource-allocation sliders have 32 px touch targets, and the visible in-app
`Motion off` mode leaves two active animations running. Both violate applicable
plan requirements and block acceptance. The missing human Milestone 0 and
Pipeline Toy exit-gate evidence would independently prevent acceptance after
implementation defects are fixed. Because correctable candidate defects already
determine this round, the outcome is FAIL rather than BLOCKED.

## Environment and setup

- Host: Darwin 25.5.0 arm64.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under `.cache/ms-playwright`.
- Clean-start check: `git rev-parse HEAD` returned the exact candidate SHA and
  `git status --short` was empty before verifier changes.
- `./scripts/verify` completed locked setup, format, lint, typecheck, 21
  unit/property tests, balance validation, and production build. Its browser
  stage alone failed because the managed macOS sandbox denied Chromium Mach-port
  registration.
- Re-running the exact pinned browser command with scoped browser-launch
  permission passed all 15 pre-existing E2E cases. This is environment behavior,
  not a candidate defect.
- `./scripts/run` became ready at `http://127.0.0.1:4173`; an independent HTTP
  probe returned `200 OK`; Ctrl-C stopped the server.
- Candidate lineage was reconfirmed before reporting. The only verifier-authored
  pre-report change was `tests/e2e/verifier-round-003.spec.ts`; no production file
  changed.
- A bounded final process audit found no project Vite, candidate Playwright test,
  or repository Chromium process. Long-lived unrelated `playwright-mcp`
  processes were left untouched.

## Commands executed and results

| Command                                                                                                 | Result                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD && git status --short`                                                              | PASS at clean start; exact candidate matched.                                                                                                        |
| `command -v npx`                                                                                        | PASS; `/opt/homebrew/bin/npx`.                                                                                                                       |
| `./scripts/verify`                                                                                      | Static/unit/balance/build stages PASS; browser stage alone exited 1 because all 15 Chromium launches hit the managed macOS Mach-port denial.         |
| `npm run test:e2e` with scoped browser-launch permission, before verifier probes                        | PASS: 15/15 pre-existing browser cases.                                                                                                              |
| `./scripts/run`; independent `curl -sS -D - http://127.0.0.1:4173/ -o /dev/null`; Ctrl-C                | PASS: deterministic loopback startup, HTTP 200, bounded stop.                                                                                        |
| Independent `validatePrototype(seed)` sweep for seeds -10,000 through 10,000                            | PASS: 20,001/20,001 reported path viability, non-dominance, and upgrade tradeoffs.                                                                   |
| Independent exhaustive catalog/metric/state probe                                                       | PASS: 16,464/16,464 hardware, workload, and slot-compatible module combinations produced finite metrics, valid state, and valid bottleneck slot IDs. |
| Local package compatibility probe                                                                       | PASS: application and pinned Vite both declare `^20.19.0 \|\| >=22.12.0`.                                                                            |
| `npm run test:e2e -- --grep "verifier round 003" --timeout=15000` with scoped browser-launch permission | FAIL: 1 passed, 2 failed. Stressed 320 px/200% layout passed; slider target size failed V-008; manual reduced-motion mode failed V-009.              |
| `npm run format:check`; `npm run lint`; `npm run typecheck` after verifier test addition                | PASS.                                                                                                                                                |
| Bounded `ps -ax -o pid=,etime=,command=` audit                                                          | PASS for candidate cleanup: no project Vite, candidate Playwright test, or repository Chromium process remained.                                     |

## Requirement evidence matrix

| Applicable plan requirement                                                                                                                                 | Status                             | Independent evidence                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering; only Milestones 0–1 before the Pipeline Toy kill gate                                                                                        | PASS                               | Repository tree/source inspection found only the numeric prototype and Pipeline Toy. No later research-character, creator/fear, workforce, startup, or laboratory-endgame production systems exist.           |
| M0: time and money; three hardware choices; four workloads; one competition, product, aggregate creator event, aggregate research project; three outcomes   | PASS                               | Source inspection, 21 canonical unit/property tests, canonical balance output, and the 20,001-seed sweep.                                                                                                     |
| M0: competition-, product-, and creator-first viability; no universal winner; every compute upgrade introduces another constraint                           | PASS for the automated model       | Every swept seed passed declared viability/non-dominance; catalog and tests pair higher compute with greater purchase cost, watts, heat, and maintenance exposure. Human enjoyment remains unverified.        |
| M1: constrained portrait vertical pipeline; compatible replace/reorder; defined split/merge; bounded allocation; inspect, pause, queue, and preset controls | PASS except touch-target defect    | Mouse drag, real-touch drag, tap/snap, branch, queue, pause, allocation, and preset flows passed. V-008 makes the two allocation controls undersized on the target viewport.                                  |
| M1: animated flows; queues at the actual bottleneck; memory/thermal limits; latency/throughput; failure propagation; configuration comparison               | PASS                               | Canonical unit/browser evidence, exhaustive 16,464-configuration probe, queue-location regression, fault/recovery flow, inspector, and baseline flows.                                                        |
| Four workloads create distinct latency, throughput, memory, reliability, and quality pressures                                                              | PASS                               | Catalog/metric inspection and exhaustive valid-configuration probe.                                                                                                                                           |
| Predicted and observed values differ; uncertainty/observability and decision-relevant properties are legible                                                | PASS                               | Deterministic unit evidence and live inspector/comparison browser flows.                                                                                                                                      |
| Main screen shows one objective, one dominant bottleneck, five primary resources, one warning, and one pipeline                                             | PASS                               | DOM/source inspection and browser checks at 320/393 px, including stressed 320 px at 200% text.                                                                                                               |
| Portrait-first, one-handed operation, large touch targets, no required rotation/pinch zoom                                                                  | FAIL                               | Portrait layouts, mouse/touch drag, and tap alternatives pass. V-008 measures both resource-allocation range inputs at 32 px high, below the 44 px control target used by the candidate and acceptance suite. |
| Color-independent status, screen-reader labels, scalable text, and reduced-motion mode                                                                      | FAIL                               | Labels, text/status cues, OS-level reduced-motion preference, 150% text, and stressed 200% text pass. V-009 proves the app's own `Motion off` mode leaves status and queue animations active.                 |
| TypeScript PWA; typed UI commands; deterministic headless simulation separated from React and run in a Web Worker                                           | PASS                               | Typecheck/build, source inspection, deterministic tests, worker boundary, and functional offline-worker browser flow.                                                                                         |
| Determinism from seed and ordered commands; explicit update order; resource/capacity invariants                                                             | PASS                               | Unit/property tests, 20,001-seed sweep, exhaustive configuration probe, and prior throughput regression retained in the canonical suite.                                                                      |
| Versioned state and bounded append-only causal ledger with unique retained identities                                                                       | PASS                               | Schema/content versions, invariant tests, and retained V-002 regression.                                                                                                                                      |
| Persisted presets reject malformed data, render stored text inertly, and restore authored configuration                                                     | PASS                               | Malformed, hostile-name, reload, and complete-restore browser cases all passed without page/console errors.                                                                                                   |
| Reproducible setup/startup/full checking; pinned local browser/cache; deterministic loopback; process cleanup                                               | PASS with documented sandbox retry | Locked install, aligned Node metadata, static/build checks, approved exact pinned-browser rerun, startup HTTP probe, and bounded cleanup audit.                                                               |
| Installable portrait/offline PWA reload, including worker-backed operation                                                                                  | PASS                               | Manifest/service-worker/asset-manifest inspection and two offline browser flows.                                                                                                                              |
| M0 economy exit gate and M1 30-minute voluntary reconfiguration/tradeoff-explanation gate                                                                   | UNVERIFIED; blocks acceptance      | No dated participant record tied to the candidate SHA exists. Automated viability and short scripted sessions cannot prove enjoyment or voluntary 30-minute reconfiguration.                                  |

## Prior finding regression results

- V-001: resolved. Canonical throughput regression passes; drained queues discard
  unused whole capacity.
- V-002: resolved. Canonical retained-ledger regression preserves unique IDs.
- V-003: resolved. Browser regression places a queue at the actual limiting
  module slot.
- V-004: resolved. Malformed persisted presets are rejected without page/worker
  errors.
- V-005: resolved. Real Chromium touch input swaps compatible active modules.
- V-006: resolved. Build, Jobs, and Inspect remain horizontally reachable at
  320 px/200% text, including the round-003 stressed 99-job/paused state.
- V-007: resolved. Application and pinned Vite Node ranges match exactly.

## Findings

### V-008 — Resource policy sliders have undersized touch targets

- Severity: High.
- Related plan requirement: §3 one-handed play and large touch targets; §8.1
  allocate compute/memory; §20.4 large touch targets; §27 touch reachability.
- Expected behavior: Every visible actionable control on the minimum 320 CSS px
  portrait viewport provides at least a 44 by 44 CSS px touch target, including
  the two primary allocation sliders.
- Actual behavior: `Compute budget percentage` and `Memory reserve percentage`
  each render 276.40625 px wide but only 32 px high.
- Exact reproduction: Run
  `npm run test:e2e -- --grep "every visible interactive control"` in an
  environment that permits the repository-local Chromium launch.
- Concrete evidence: `tests/e2e/verifier-round-003.spec.ts` enumerates visible
  buttons, inputs, and role-buttons in every primary view at 320 px. Only the two
  range inputs fail, both with measured height 32.
- Blocks PASS: Yes. The target platform's primary policy controls do not satisfy
  the applicable large-touch-target requirement.

### V-009 — In-app Motion off mode leaves prominent animations active

- Severity: Medium.
- Related plan requirement: §20.4 reduced-motion mode; §27 reduced-motion mobile
  testing.
- Expected behavior: With OS motion preference set to no preference, activating
  the app's visible `Motion off` control disables active flow, live-status, and
  queue animations.
- Actual behavior: Flow dots stop, but the live status continues
  `pulse-status` and the queued-job badge continues `queue-shift` while the
  control reads `Motion off`.
- Exact reproduction: Run
  `npm run test:e2e -- --grep "in-app Motion off"` in an environment that
  permits the repository-local Chromium launch.
- Concrete evidence: The round-003 probe queues ten jobs, activates the control,
  and reads computed styles. `.status-chip.live` reports animation name
  `pulse-status`; `.queue-badge` reports `queue-shift`.
- Blocks PASS: Yes. The user-facing reduced-motion mode does not match its stated
  behavior.

## Unverified areas

- No dated human evidence tied to this candidate demonstrates that the M0
  resource economy is interesting without narrative spectacle.
- No uninterrupted 30-minute participant session demonstrates voluntary
  pipeline reconfiguration and explanation of at least two tradeoffs. This is
  the explicit M1 exit gate and independently blocks acceptance.
- No physical-device battery/CPU/thermal profile; functional mobile behavior was
  tested in Chromium only.
- Only Chromium was exercised. Cross-browser behavior remains unknown.
- Milestones 2–7 and expansions were not evaluated as implemented behavior
  because plan ordering prohibits them before the Pipeline Toy gate.

## Residual risks

- Automated path viability cannot establish enjoyment or exclude a
  human-discovered dominant strategy.
- Short deterministic and browser sessions do not replace the sustained human
  kill-gate playtest or physical-device performance assessment.
- Service-worker update/migration behavior across future schema/content versions
  remains outside the current preset-only scope.
