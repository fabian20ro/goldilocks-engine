# Verification round 004

Candidate SHA: `654fbc8db134ef1e8575d36b68747b65d723db0c`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` is gate-ordered. Decision D-001 therefore makes Milestones 0 and 1,
their applicable deterministic simulation, portrait PWA, interaction, and
accessibility requirements, and the exclusion of later milestones the current
scope.

The candidate resolves round-003 findings V-008 and V-009. Independent real
touch verification found one new correctable target-platform defect: a normal
horizontal touch swipe beginning on a module card cannot scroll the overflowing
module drawer. The first card consumes most of the drawer width, every card has
`touch-action: none`, and the remaining exposed gaps are narrow; modules beyond
the first screen therefore cannot be reached through the normal one-handed
drawer gesture. This blocks acceptance. Missing human Milestone 0 and Pipeline
Toy exit-gate evidence would independently prevent acceptance after the defect
is fixed.

## Environment and setup

- Host: Darwin 25.5.0 arm64.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under `.cache/ms-playwright`.
- Clean-start check: `git rev-parse HEAD` returned the exact candidate SHA and
  `git status --short` was empty before verifier changes.
- `./scripts/verify` completed locked setup, formatting, lint, typecheck, 21
  unit/property tests, balance validation, and production build. Its browser
  stage alone hit the managed macOS Mach-port denial.
- Re-running the exact pinned browser command with scoped launch permission
  passed all 18 pre-existing cases. The final 20-case suite had 19 passes and
  the independent V-010 regression failure.
- `./scripts/run` became ready at `http://127.0.0.1:4173`; an independent HTTP
  request returned `200 OK`; Ctrl-C stopped it.
- The final bounded process audit found no candidate Vite, Playwright test, or
  repository Chromium process.

## Commands executed and results

| Command                                                                                                                  | Result                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short && git rev-parse HEAD`                                                                               | PASS at clean start; exact candidate matched.                                                                                                                                                                                                                                      |
| `./scripts/verify`                                                                                                       | Setup, format, lint, typecheck, 21 unit/property tests, balance, and build passed. Browser launches alone failed inside the managed sandbox with `MachPortRendezvousServer ... Permission denied`.                                                                                 |
| `npm run test:e2e` with scoped browser-launch permission before verifier probes                                          | PASS: 18/18 pre-existing cases.                                                                                                                                                                                                                                                    |
| `./scripts/run`; `curl -sS -D - http://127.0.0.1:4173/ -o /dev/null`; Ctrl-C                                             | PASS: deterministic loopback readiness, HTTP 200, bounded stop.                                                                                                                                                                                                                    |
| Independent `validatePrototype(seed)` sweep for seeds -10,000 through 10,000                                             | PASS: 20,001/20,001 reported all three paths viable, non-dominance, and upgrade tradeoffs.                                                                                                                                                                                         |
| Independent exhaustive catalog/state/metric probe                                                                        | PASS: 16,464/16,464 hardware, workload, and slot-compatible module configurations produced valid finite state and valid bottleneck slot IDs.                                                                                                                                       |
| Independent 111 one-second tick and 10,000-command ledger probe                                                          | PASS: exactly 12 jobs resolved at 7/minute with 0.95 fractional carry; retained ledger had 80/80 unique IDs at event sequence 10,014.                                                                                                                                              |
| Local package compatibility probe                                                                                        | PASS: application and pinned Vite both declare `^20.19.0 \|\| >=22.12.0`; pinned Playwright is 1.61.1.                                                                                                                                                                             |
| Production asset-manifest integrity probe                                                                                | PASS: all three emitted JS/CSS assets exist; the worker is included; HTML names both direct shell assets.                                                                                                                                                                          |
| Initial round-004 probe development runs                                                                                 | Verifier-only harness issues corrected before evidence use: unsupported TypeScript options on `Document.getAnimations`, an over-specific initial `scrollLeft === 0` assumption, and counting 0.01 ms reduced-motion transitions as material animation. No production file changed. |
| `npm run test:e2e -- --grep "verifier round 004" --timeout=15000` with scoped launch permission                          | FAIL: drawer touch-pan regression V-010; PASS: document-wide reduced-motion probe.                                                                                                                                                                                                 |
| Final full `npm run test:e2e` with scoped launch permission                                                              | FAIL: 19 passed, 1 failed (V-010). Every candidate and prior-verifier case passed.                                                                                                                                                                                                 |
| `npx prettier --write tests/e2e/verifier-round-004.spec.ts`; `npm run format:check`; `npm run lint`; `npm run typecheck` | PASS.                                                                                                                                                                                                                                                                              |
| `ps -ax -o pid=,etime=,command=` filtered to candidate processes                                                         | Initial sandboxed enumeration was denied; scoped read-only retry PASS: no matching candidate process remained.                                                                                                                                                                     |

## Requirement evidence matrix

| Applicable plan requirement                                                                                                                                 | Status                             | Independent evidence                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering; only Milestones 0–1 before the Pipeline Toy kill gate                                                                                        | PASS                               | Repository tree/source inspection found only the numeric prototype and Pipeline Toy; later research-character, creator/fear, workforce, startup, and laboratory-endgame production systems remain absent. |
| M0: time and money; three hardware choices; four workloads; one competition, product, aggregate creator event, aggregate research project; three outcomes   | PASS                               | Source inspection, 21 unit/property tests, canonical balance output, and the 20,001-seed sweep.                                                                                                           |
| M0: competition-, product-, and creator-first viability; no universal winner; every compute upgrade adds constraints                                        | PASS for the automated model       | Every swept seed passed declared viability/non-dominance; catalog and tests pair higher compute with greater purchase cost, watts, heat, and maintenance exposure. Human enjoyment remains unverified.    |
| M1: constrained portrait vertical pipeline; compatible replace/reorder; defined split/merge; bounded allocation; inspect, pause, queue, and preset controls | PARTIAL / FAIL                     | Mouse drag, real-touch active-slot drag, tap/snap, branch, queue, allocation, pause, and presets pass. V-010 prevents normal touch access to modules beyond the first drawer screen.                      |
| M1: animated flows; queues at the actual bottleneck; memory/thermal limits; latency/throughput; failure propagation; configuration comparison               | PASS                               | Canonical unit/browser evidence, exhaustive 16,464-configuration probe, queue-location regression, fault/recovery flow, inspector, and baseline flows.                                                    |
| Four workloads create distinct latency, throughput, memory, reliability, and quality pressures                                                              | PASS                               | Catalog/metric inspection and exhaustive valid-configuration probe.                                                                                                                                       |
| Predicted and observed values differ; uncertainty, observability, and decision-relevant properties are legible                                              | PASS                               | Deterministic unit evidence and live inspector/comparison browser flows.                                                                                                                                  |
| Main screen shows one objective, one dominant bottleneck, five primary resources, one warning, and one pipeline                                             | PASS                               | DOM/source inspection and browser checks at 320/393 px, including stressed 320 px at 200% text.                                                                                                           |
| Portrait-first, one-handed operation, large touch targets, no required rotation/pinch zoom, and touch/drag precision                                        | FAIL                               | Portrait layouts, all visible 44 px targets, tap alternatives, and active-slot touch drag pass. V-010 makes the overflowing module catalog unscrollable when a normal touch pan begins on a card.         |
| Color-independent status, screen-reader labels, scalable text, and reduced-motion mode                                                                      | PASS                               | Labels/text cues, 150% and 200% text, OS reduced motion, prior V-009 regression, and a broader `Document.getAnimations()` probe pass.                                                                     |
| TypeScript PWA; typed UI commands; deterministic headless simulation separated from React and run in a Web Worker                                           | PASS                               | Typecheck/build, source inspection, deterministic tests, worker boundary, and offline worker flows.                                                                                                       |
| Determinism from seed and ordered commands; explicit update order; resource/capacity invariants                                                             | PASS                               | Unit/property tests, 20,001-seed sweep, exhaustive configuration probe, and split-tick throughput accounting.                                                                                             |
| Versioned state and bounded append-only causal ledger with unique retained identities                                                                       | PASS                               | Schema/content versions, invariant tests, and independent 10,000-command retained-ledger probe.                                                                                                           |
| Persisted presets reject malformed data, render stored text inertly, and restore authored configuration                                                     | PASS                               | Malformed, hostile-name, reload, and complete-restore browser cases all passed without page/console errors.                                                                                               |
| Reproducible setup/startup/full checking; pinned local browser/cache; deterministic loopback; process cleanup                                               | PASS with documented sandbox retry | Locked install, aligned Node metadata, static/build checks, exact pinned-browser rerun, startup HTTP probe, and bounded cleanup audit.                                                                    |
| Installable portrait/offline PWA reload, including worker-backed operation                                                                                  | PASS                               | Manifest/service-worker inspection, asset-manifest integrity, and both offline browser flows.                                                                                                             |
| M0 economy exit gate and M1 30-minute voluntary reconfiguration/tradeoff-explanation gate                                                                   | UNVERIFIED; blocks acceptance      | Repository search found no dated participant record tied to this candidate. Automated viability and short scripted sessions cannot establish enjoyment or voluntary 30-minute engagement.                 |

## Prior finding regression results

- V-001: resolved. Drained queues discard unused capacity; the split-tick probe
  retains only fractional work while queued work remains.
- V-002: resolved. Monotonic event sequencing kept all 80 retained identities
  unique after 10,000 commands.
- V-003: resolved. A queue appears at the actual limiting module slot.
- V-004: resolved. Malformed persisted presets are rejected without page or
  worker errors.
- V-005: resolved. Real Chromium touch input swaps compatible active modules.
- V-006: resolved. Build, Jobs, and Inspect remain horizontally reachable at
  320 px and 200% text, including stressed dynamic content.
- V-007: resolved. Application and pinned Vite Node ranges match exactly.
- V-008: resolved. Every visible button, input, and role-button, including the
  two allocation ranges, measures at least 44 by 44 CSS pixels at 320 px.
- V-009: resolved. App-level Motion off removes material CSS animation across
  the document even with OS motion preference set to no preference.

## Findings

### V-010 — Touch gestures cannot scroll the overflowing module drawer

- Severity: High.
- Related plan requirement: §3 portrait-first one-handed play; §8.1 drag a
  module into a compatible slot; §20.4 large touch targets and no required
  pinch zoom; §27 touch reachability and drag precision; Milestone 1 drag/snap
  module replacement.
- Expected behavior: At 393 CSS px, a normal horizontal one-finger swipe on a
  visible module card pans the overflowing drawer, or another at-least-44 px
  touch control exposes every off-screen module.
- Actual behavior: Each `.module-card` declares `touch-action: none`. Ten real
  Chromium touch moves covering roughly 195 CSS px left the drawer at
  `scrollLeft = 13`; the expected accessible pan threshold was greater than 53.
  The screenshot shows only Request Buffer and part of Stream Intake while the
  remaining catalog is off-screen. The only exposed drawer background is narrow
  padding/gaps, not a large target or a normal card-origin swipe surface.
- Exact reproduction: Run
  `npm run test:e2e -- --grep "touch module drawer" --timeout=15000` in an
  environment permitting the repository-local Chromium launch.
- Concrete evidence: `tests/e2e/verifier-round-004.spec.ts` dispatches a real
  CDP touch start on the first module card, ten horizontal moves, and touch end;
  its polling assertion times out with received scroll position 13. The full
  suite reports 19 passes and this one failure.
- Blocks PASS: Yes. Most replacement modules are unreachable through the normal
  one-handed touch drawer gesture on the target platform.

## Unverified areas

- No dated human evidence tied to the candidate demonstrates that the M0
  resource economy is interesting without narrative spectacle.
- No uninterrupted 30-minute participant session demonstrates voluntary
  pipeline reconfiguration and explanation of at least two tradeoffs. This
  explicit M1 exit gate independently prevents acceptance.
- No physical-device battery, CPU, or thermal profile; functional mobile
  behavior was tested in Chromium only.
- Only Chromium was exercised. Cross-browser behavior remains unknown.
- Milestones 2–7 and expansions were not evaluated as implemented behavior
  because plan ordering prohibits them before the Pipeline Toy gate.

## Residual risks

- Automated path viability cannot establish enjoyment or exclude a
  human-discovered dominant strategy.
- Short deterministic/browser sessions do not replace the sustained human
  kill-gate playtest or physical-device performance assessment.
- A physical browser may expose platform-specific overflow gestures, but the
  standards-defined `touch-action: none` on every large swipe surface and the
  reproducible Chromium touch result make V-010 a candidate defect rather than
  unavailable infrastructure.
- Service-worker update/migration behavior across future schema/content
  versions remains outside the current preset-only scope.
