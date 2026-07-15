# Verification round 002

Candidate SHA: `d1f7813e151beee6cf19c4b0f6acc8b4ab930f37`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` is gate-ordered. Decision D-001 therefore makes Milestones 0 and 1,
their applicable simulation/PWA/accessibility requirements, and the gate
exclusions the current scope. Milestones 2–7 and expansions remain deferred.

The candidate resolves all five implementation defects reported in round 001.
Independent browser verification found a new correctable accessibility defect:
every primary view overflows horizontally at the required 320 px portrait width
when text is scaled to 200%. The package's declared Node compatibility is also
broader than its pinned build tool supports. These defects determine the round
outcome. The missing human Milestone 0 and Pipeline Toy exit-gate evidence would
independently prevent acceptance after the implementation defects are fixed.

## Environment and setup

- Host: Darwin 25.5.0 arm64.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under `.cache/ms-playwright`.
- Clean-start check: `git rev-parse HEAD` returned the exact candidate SHA and
  `git status --short` was empty before verifier changes.
- `./scripts/setup` completed through the canonical verification wrapper:
  locked install, zero reported vulnerabilities, and repository-local browser
  installation.
- The managed macOS sandbox denied Chromium Mach-port registration. The exact
  repository-pinned browser command passed with scoped launch permission. This
  is environment behavior, not a candidate defect.
- `./scripts/run` became ready on `http://127.0.0.1:4173`; an independent HTTP
  probe returned `200 OK`; Ctrl-C stopped the development server.
- A final read-only `ps` audit hung in the execution environment and was
  aborted. All Playwright commands themselves exited and their managed web
  servers stopped; direct post-run process enumeration remains unverified.

## Commands executed and results

| Command                                                                                                | Result                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git rev-parse HEAD && git status --short`                                                             | PASS at clean start; exact candidate matched.                                                                                                                                                                |
| `command -v npx`                                                                                       | PASS; prerequisite available.                                                                                                                                                                                |
| `./scripts/verify`                                                                                     | Setup, format, lint, typecheck, 21 unit/property tests, balance, and build passed. The browser stage alone exited 1 because all 11 launches hit the managed macOS Mach-port denial.                          |
| `npm run test:e2e` with scoped browser-launch permission, before verifier probes                       | PASS: 11/11 candidate-authored cases.                                                                                                                                                                        |
| Seed sweep calling `validatePrototype(seed)` for -10,000 through 10,000                                | PASS: 20,001/20,001 reported viable paths, non-dominance, and upgrade tradeoffs.                                                                                                                             |
| Exhaustive valid catalog probe across all hardware, workloads, and slot-compatible module combinations | PASS: 16,464/16,464 produced finite metrics, valid states, and valid bottleneck slot IDs.                                                                                                                    |
| Direct split-tick throughput and 10,000-command ledger probes                                          | PASS: 111 seconds at 7 jobs/minute resolved exactly 12 jobs with 0.95 fractional carry; retained ledger had 80/80 unique IDs at event sequence 10,001.                                                       |
| `./scripts/run`; `curl -sS -D - http://127.0.0.1:4173/ -o /dev/null`; Ctrl-C                           | PASS: deterministic loopback readiness, HTTP 200, clean interactive stop.                                                                                                                                    |
| `npm run format:check`; `npm run lint`; `npm run typecheck` after verifier test addition               | PASS.                                                                                                                                                                                                        |
| Full `npm run test:e2e` with verifier probes and scoped launch permission                              | FAIL: 14 passed, 1 failed. Preset full restore, functional offline reload, hostile-name inert rendering, all original tests, and prior-finding regressions passed. The 200%-text portrait test failed V-006. |
| Local package compatibility probe (`package.json` and `node_modules/vite/package.json`)                | FAIL evidence for V-007: application declares `>=20`; pinned Vite declares `^20.19.0 \|\| >=22.12.0`.                                                                                                        |
| Final `ps` process audit                                                                               | UNVERIFIED: command hung and was aborted; no test or server command remained attached to an active tool session.                                                                                             |

## Requirement evidence matrix

| Applicable plan requirement                                                                                                                                          | Status                        | Independent evidence                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering; implement only Milestones 0–1 before the Pipeline Toy kill gate                                                                                       | PASS                          | Source/tree inspection found only the numeric prototype and Pipeline Toy. No later research-character, creator/fear, workforce, startup, or endgame production systems exist.                           |
| M0: time and money; three hardware choices; four workloads; one competition, product, aggregate creator event, aggregate research project; three outcomes            | PASS                          | Source inspection, unit tests, canonical balance output, and the 20,001-seed sweep.                                                                                                                     |
| M0: competition-, product-, and creator-first viability; no universal winner; every compute upgrade introduces constraints                                           | PASS (automated model only)   | Every swept seed passed declared viability/non-dominance; catalog and tests show higher compute paired with higher purchase, watts, heat, and maintenance exposure. Human enjoyment remains unverified. |
| M1: constrained portrait vertical pipeline; compatible replace/reorder; defined split/merge; bounded allocation; inspect, pause, and preset controls                 | PASS                          | Authored mouse, real-touch, tap/snap, branch, allocation, pause, and preset browser flows; independent complete preset restore probe.                                                                   |
| M1: animated flow, queues at the limiting stage, memory and thermal limits, latency/throughput, failure propagation, configuration comparison                        | PASS                          | Canonical unit/browser cases, exhaustive metric probe, direct throughput probe, queue-location regression, and failure/recovery browser evidence.                                                       |
| Four representative workloads create different latency, throughput, memory, reliability/quality pressures                                                            | PASS                          | Catalog/metric inspection and all 16,464 valid configuration combinations.                                                                                                                              |
| Predicted and observed signals differ; uncertainty/observability and decision-relevant properties are legible                                                        | PASS                          | Deterministic unit probe plus live inspector and comparison browser flows.                                                                                                                              |
| Main screen shows one objective, one dominant bottleneck, five resources, one warning, and one pipeline                                                              | PASS at normal/150% scale     | DOM and 320/393 px authored portrait checks. V-006 breaks the wider scalable-text requirement.                                                                                                          |
| Portrait-first, no rotation/zoom requirement, one-handed controls, large targets, color-independent text/status, screen-reader labels, reduced motion, scalable text | FAIL                          | Normal and 150% cases, touch controls, reduced motion, labels, and target sizes pass. V-006: all views overflow at 320 px with 200% text.                                                               |
| TypeScript PWA; typed UI commands; headless deterministic simulation separated from React and run in a worker                                                        | PASS                          | Typecheck/build, source inspection, deterministic tests, and functional offline worker probe.                                                                                                           |
| Determinism from seed and ordered commands; explicit update order; resource/capacity invariants                                                                      | PASS                          | Unit/property tests, 20,001-seed sweep, exhaustive configuration probe, and split-tick throughput accounting.                                                                                           |
| Versioned state and bounded append-only causal ledger with stable unique retained identities                                                                         | PASS                          | Schema/content versions, invariant tests, and independent 10,000-command ledger probe.                                                                                                                  |
| Persisted presets reject malformed data and treat stored text safely                                                                                                 | PASS                          | Original malformed-preset regression plus verifier hostile-name and complete-restore browser probes; no page/console errors or script execution.                                                        |
| Reproducible setup/startup/full checks, pinned local browser/cache, deterministic loopback, process cleanup                                                          | PARTIAL / FAIL                | Setup/static/build/startup and approved browser execution pass. V-007 is a machine-readable Node compatibility mismatch; final process enumeration was unavailable after the command hung.              |
| Installable portrait/offline PWA reload remains functional, including worker execution                                                                               | PASS                          | Manifest/service-worker/asset-manifest inspection; original offline shell case; verifier offline queue/build interaction.                                                                               |
| M0 economy exit gate and M1 30-minute voluntary reconfiguration/tradeoff-explanation gate                                                                            | UNVERIFIED; blocks acceptance | No dated participant record tied to the candidate SHA exists. Automated viability is not evidence of enjoyment or voluntary 30-minute engagement.                                                       |

## Prior finding regression results

- V-001: resolved. Drained queues discard unused capacity; split-tick probe
  preserves only fractional carry while work remains.
- V-002: resolved. Monotonic event sequence kept all 80 retained identities
  unique after 10,000 appended commands.
- V-003: resolved. With Robust Evaluation limiting throughput, the queue badge
  appears in the Verify slot.
- V-004: resolved. Malformed persisted presets are rejected without page or
  worker errors; valid presets restore every saved field.
- V-005: resolved. A real Chromium touch sequence swaps compatible active
  modules and produces the expected ordering warning.

## Findings

### V-006 — 200% text scaling breaks every 320 px primary view

- Severity: High.
- Related plan requirement: §20.4 scalable text; §27 mobile text-scaling tests;
  portrait-first and no-required-zoom constraints.
- Expected behavior: At 320 CSS pixels and 200% text size, Build, Jobs, and
  Inspect remain usable without horizontal scrolling; controls remain at least
  44 by 44 CSS pixels.
- Actual behavior: The document expands beyond the 320 px viewport in every
  view: Build to 395 px, Jobs to 356 px, and Inspect to 356 px. Target sizes
  remain sufficient, but content is clipped/off-screen unless horizontally
  scrolled.
- Exact reproduction: Run
  `npm run test:e2e -- --grep "200 percent"` with the repository-local browser
  in an environment that permits Chromium launch.
- Concrete evidence: `tests/e2e/verifier-round-002.spec.ts` reports the three
  client/scroll-width pairs and offending elements. Build includes the motion
  toggle, warning, mission card, and pipeline; Jobs includes the counter and
  pause action; Inspect includes the action and metrics table. The Playwright
  screenshot visibly clips the right side of the 320 px interface.
- Blocks PASS: Yes. Scalable text fails on the minimum supported portrait
  width.

### V-007 — Declared Node range includes versions rejected by pinned Vite

- Severity: Low.
- Related plan requirement: repository testability and reproducible setup;
  §23.1 pinned TypeScript PWA stack.
- Expected behavior: Machine-readable runtime compatibility matches the pinned
  toolchain, or setup rejects unsupported versions before installation/build.
- Actual behavior: application `package.json` declares Node `>=20`, while pinned
  Vite 8.1.4 declares `^20.19.0 || >=22.12.0`. Node 20.0–20.18 therefore satisfy
  the application declaration but not its build dependency.
- Exact reproduction: Run
  `node -e 'const a=require("./package.json"),v=require("./node_modules/vite/package.json"); console.log(a.engines.node, v.engines.node)'`
  after `./scripts/setup`.
- Concrete evidence: The inspected values are `>=20` and
  `^20.19.0 || >=22.12.0`; the handoff's prose requirement is narrower and
  correct, confirming the metadata inconsistency.
- Blocks PASS: Yes. A standard compatibility signal advertises an unsupported
  clean-setup environment.

## Unverified areas

- No dated human evidence tied to this candidate demonstrates that the M0
  resource economy is interesting without narrative spectacle.
- No uninterrupted 30-minute participant session demonstrates voluntary
  reconfiguration and explanation of at least two tradeoffs. This explicit M1
  gate independently prevents acceptance.
- No physical-device battery/CPU/thermal profile; functional portrait behavior
  was tested in Chromium only.
- The final process-table audit was unavailable because the command hung and
  was aborted. Test runners and their managed servers exited normally.
- Milestones 2–7 and expansions were not evaluated as implemented behavior
  because the plan prohibits them before the Pipeline Toy gate passes.

## Residual risks

- Automated path viability cannot establish enjoyment or rule out a
  human-discovered dominant strategy.
- Short deterministic sessions and catalog exhaustion do not replace a
  sustained human playtest or physical-device performance assessment.
- Only Chromium was exercised. Cross-browser behavior was not required by the
  current handoff and remains unknown.
- Service-worker update/migration behavior across future schema/content
  versions is outside the current preset-only scope.
