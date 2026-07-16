# Verification round 015

Candidate SHA: `cd1f1b00b969df097d05c7eb21a5199b12f20aac`

VERDICT: FAIL

## Scope and verdict basis

The applicable candidate is the owner-authorized **Workstation Expansion I**
slice in `plan.md` and D-007, together with the inherited Milestone 0–1 and
D-004 through D-006 behavior on which that slice depends. D-007 permits
independent automated verification without treating the still-unmeasured human
exit gates as an automatic blocker. It does not claim those human gates passed.

Canonical static, unit/property, deterministic balance, build, root PWA,
Pages-subpath PWA, persistence, offline, portrait, accessibility, and inherited
regression checks pass. Independent headed inspection at 320 and 393 CSS
pixels also found the starter and expanded pipeline legible and reachable.

Three correctable defects prevent acceptance:

- the quote shown immediately before acceptance can differ materially from the
  quote actually locked on the new task;
- a valid all-bypassed process graph retains positive expected margin at the
  saturated demand floor, so repeated single-workload farming need not become
  nonpositive;
- after selecting future work while another task is active, visible pipeline
  pressure and warning feedback describe the selection rather than the task
  actually being processed.

## Environment and setup

- Host: macOS 26.5.2 (25F84), arm64.
- Verification date: 2026-07-17 EEST.
- Node.js: v26.5.0; npm: 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`; Playwright CLI 0.1.17 used
  only for supplemental headed visual inspection.
- Clean-start gate: before any verifier change, `git rev-parse HEAD` returned
  the supplied candidate SHA and `git status --short` was empty.
- `./scripts/setup` recreated the lockfile-defined dependency tree with
  repository-local npm and browser caches; audit reported zero vulnerabilities.
- The managed macOS sandbox denied Chromium Mach-port registration before page
  creation. The exact repository-pinned browser commands were rerun outside
  that restriction and executed normally.
- Verifier-owned additions are this immutable report and two focused regression
  test files. No production code, prior report, decision, handoff, playtest
  record, or `plan.md` content was changed by the Verifier.

## Commands executed and results

| Command or probe                                                                                                                                              | Result                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git status --short`; `git rev-parse HEAD`                                                                                                                    | Clean start; exact supplied candidate matched.                                                                                                                                                                                                                                                                           |
| Complete reads of `AGENTS.md`, all 1,879 lines of `plan.md`, verifier role, decisions, current handoff, current playtest record, and prior unresolved history | Independent applicable checklist and finding sequence constructed.                                                                                                                                                                                                                                                       |
| Candidate `git show`, diff/stat, package scripts, production engine/catalog/UI/Worker inspection                                                              | Confirmed the bounded slice and identified the reservation-display and active-task projection boundaries independently of implementation claims.                                                                                                                                                                         |
| `./scripts/verify`                                                                                                                                            | Setup, format, lint, typecheck, 56/56 implementation unit/property tests, coverage thresholds, base balance, 20,001-seed upgrade balance, 41-seed progression balance, and production build passed. The sandbox then denied all Chromium launches before page creation, so the command exited at the root browser stage. |
| Exact scoped `npm run test:e2e` outside the browser sandbox                                                                                                   | 42/42 root packaged-PWA cases passed.                                                                                                                                                                                                                                                                                    |
| Exact scoped `npm run test:e2e:pages` outside the browser sandbox                                                                                             | 2/2 Pages-subpath, Worker, cache-isolation, and offline cases passed.                                                                                                                                                                                                                                                    |
| Canonical balance outputs                                                                                                                                     | Upgrade sweep: 20,001 seeds, zero failures, worst first module at 4 successes and first alternate rig at 14. Progression sweep: 41 seeds, zero failures, expansion at 13.03–15.63 simulated hours and full catalogue at 40.61–43.98 hours.                                                                               |
| Focused headless active-task projection probe                                                                                                                 | With Long Document active and Interactive Chat selected for future work, visible state reported memory pressure `0.931` and an evaluation warning while actual active-task metrics reported `1.556` memory pressure and deterministic memory failure.                                                                    |
| Focused headless bypassed-market probe                                                                                                                        | At demand floor, Interactive Chat expected margin was `+0.020576` per attempt on the valid source → bypassed process positions → sink graph. A deterministic 300-attempt observation continued gaining money after demand reached its floor.                                                                             |
| `npx vitest run src/simulation/verifierRound015.test.ts`                                                                                                      | Expected regression failure: floor expected margin `0.020576`, required `<= 0`.                                                                                                                                                                                                                                          |
| Repository-pinned Playwright on `tests/e2e/verifier-round-015.spec.ts` outside the browser sandbox                                                            | 0/2 passed after race-proofing. The UI displayed `$1.40` immediately before acceptance while the new task locked `$1.327`; the active Long Document remained named in the queue while the warning switched to Interactive Chat's lower-pressure projection.                                                              |
| Headed Playwright CLI against `./scripts/run` at 320 and 393 CSS pixels                                                                                       | Starter and expanded Build states inspected; Process 4–6 and Output reached through the named internal scroll; hierarchy, text, controls, fixed bottom navigation, and empty-slot meanings remained legible; zero console errors.                                                                                        |
| Focused Prettier, ESLint, TypeScript, and `git diff --check` over verifier artifacts                                                                          | Passed.                                                                                                                                                                                                                                                                                                                  |
| Port/process audit after bounded shutdown                                                                                                                     | No listener remained on `127.0.0.1:4173`. The one early verifier-started CLI daemon found by the audit was terminated by exact PID with all of its Chromium children; unrelated application MCP processes were left untouched.                                                                                           |

## Requirement evidence matrix

| Applicable plan, decision, or protocol requirement                                                                                                                                                                                                          | Status                                   | Independent evidence                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007 owner authorization, bounded scope, and preservation of the original human-gate history                                                                                                                                                               | PASS                                     | `plan.md`, D-007, and the immutable progression-expansion record agree. Tree inspection found no researchers, characters, hype/fear economy, transient model brands, parallel pipelines, startup, labor, or later systems.                       |
| M0 numeric prototype: time/money, three hardware choices, four base workloads, aggregate competition/product/creator/research inputs, and three outcomes                                                                                                    | PASS for automated predicates            | Canonical unit/property and numeric balance checks pass. The subjective economy-interest gate remains unmeasured and is not inferred.                                                                                                            |
| M1 constrained portrait pipeline, compatible replacement/reordering, defined branch, bounded allocation, pause, queue, configuration comparison, animated flow, constraints, and failure propagation                                                        | PASS except active-task feedback below   | Retained engine/browser regressions pass tap, keyboard, pointer/real-touch drag, reorder, branch, queue, policy, preset, flow, recovery, and comparison behavior. V-020 qualifies the feedback result.                                           |
| D-004 malformed/non-finite operation values are transactional no-ops and finite values remain bounded                                                                                                                                                       | PASS; V-012 remains resolved             | Retained engine, Worker-boundary, and property regressions pass. Ordinary malformed-state review was kept high-level.                                                                                                                            |
| D-005 tutorial, money loop, preset deletion/undo, CU/memory definitions, reachable guidance, and animation/time separation                                                                                                                                  | PASS                                     | Retained first-session and pressure-boundary browser cases pass.                                                                                                                                                                                 |
| D-006 exact-once durable ownership, owned-only equip/add, decision information, observed deltas, pacing, and schema-v4 inheritance                                                                                                                          | PASS                                     | Unit/Worker/browser regressions and the 20,001-seed sweep pass; first module and alternate-rig bounds are met.                                                                                                                                   |
| Exact-once data-driven Workstation Expansion purchase; one active pipeline expands from three to six process positions; new positions start empty without module purchase, clone, or autofill                                                               | PASS                                     | Command tests, browser purchase flow, source inspection, save/offline flow, and headed inspection confirm the behavior.                                                                                                                          |
| Empty/bypassed positions remain valid and all six unlocked process positions support owned compatible tap, keyboard, replacement/reorder, and touch drag                                                                                                    | PASS for interaction/topology            | Root expansion cases, accessibility snapshot, and headed inspection cover all six positions and the internal scroll. V-019 concerns the payout/economy consequence of a fully bypassed graph, not reachability.                                  |
| Pipeline metrics and bottleneck feedback use the complete ordered active graph and honestly describe current processing                                                                                                                                     | FAIL — V-020                             | The graph itself is complete, but after workload selection diverges from the active task, `state.metrics`, the warning, and queue-bottleneck projection switch to future work while settlement/failure continues using the active task workload. |
| At least eight durable data-driven workloads; four initial and four deterministic later unlocks with exact visible requirements/progress; persistence/migration without loss                                                                                | PASS                                     | Catalog/engine inspection, unit unlock checks, eight-card Chromium assertion, and schema migration checks pass.                                                                                                                                  |
| Per-task FIFO identity, workload, immutable queue-time gross quote, progress, configuration-dependent actual cost, failed-job zero payout, and visible settlement net                                                                                       | PASS except pre-acceptance display       | Engine settlement/queue tests and browser queue detail pass identity and settlement behavior. V-018 shows the quote offered immediately before acceptance is not the quote locked.                                                               |
| Before acceptance, workload cards expose current gross quote, demand/trend, estimated cost/net, saturation/recovery explanation, and near/nonpositive-margin warning                                                                                        | FAIL — V-018                             | Cost/net and explanatory copy exist, but displayed quote/demand omit accepted same-workload reservation pressure used by `QUEUE_JOBS`; the next accepted quote is therefore not visible beforehand.                                              |
| Successful completion saturates only its workload; simulated time recovers neglected demand; accepted quotes do not reprice; no idle-only money                                                                                                             | PASS for these mechanics                 | Unit tests, source inspection, and focused probes confirm isolated saturation, deterministic recovery, locked quotes, and unchanged idle money.                                                                                                  |
| Repeated single-workload farming eventually becomes nonpositive; rotation/recovery restores a profitable alternative; no universally dominant workload                                                                                                      | FAIL — V-019                             | The implementation balance predicate checks only the starter configuration. A valid all-bypassed process graph has positive expected margin even at the Interactive Chat demand floor and continues earning after saturation.                    |
| Clear waiting is confirmed, exact, transactional, and active-task preserving across empty, reload, malformed, and offline cases                                                                                                                             | PASS                                     | Engine exact-state assertions and root Chromium flow preserve active identity/progress/quote, money, demand state, reputation, RNG, and settlement while removing only waiting tasks.                                                            |
| Exact fixed 1×/4×/16×/64× controls are schedule-equivalent and separate from animation and processing pause                                                                                                                                                 | PASS                                     | Unit schedule-equivalence test compares one 32-second call with 64 fixed quanta; browser controls, pause, and reduced-motion cases pass.                                                                                                         |
| Progression pacing: first module by 5 successes, alternate rig by 15 including module purchase, expansion around 8–16 hours, full catalogue not before 24 and attainable by 72                                                                              | PASS for tested deterministic strategies | Canonical 20,001-seed and 41-seed outputs meet all numeric bounds.                                                                                                                                                                               |
| Bottom tabs are the sole global navigation; compact summaries/progressive disclosure preserve portrait density                                                                                                                                              | PASS                                     | Source inspection found only bottom-tab `setTab` routing. Browser checks find no duplicate page CTAs; native details and the pipeline scroll cue provide disclosure.                                                                             |
| Portrait 320/393, 200% text, 44 CSS-pixel controls, no horizontal document overflow, one-handed alternatives, no pinch/rotation requirement                                                                                                                 | PASS in Chromium                         | Root cases cover both widths, text scale, targets, overflow, tap/keyboard/pointer/touch. Supplemental headed inspection found no visual cutoff or overlap in starter/expanded states.                                                            |
| Reduced motion, color-independent meanings, actionable screen-reader labels, offline reload/resume, and failure/recovery                                                                                                                                    | PASS in Chromium                         | Retained accessibility/offline/recovery cases and fresh accessibility snapshots pass; visible text carries state independent of color.                                                                                                           |
| Schema-5/content-v4 state and presets preserve purchase, capacity/topology, task identity/quote, unlocks, demand, equipment, money, RNG, migration metadata, timestamp, and integrity across reload/offline; schema-3/4 and malformed values recover safely | PASS for tested paths                    | Unit/Worker migrations, root current/legacy recovery, stale-integrity recovery, expanded preset reload, and offline Worker flows pass.                                                                                                           |
| Deterministic headless TypeScript engine, typed Worker boundary, explicit fixed update order, bounded unique ledger, reproducible setup/startup/checking, repository-local caches, deterministic loopback, and cleanup                                      | PASS with documented host-browser retry  | Static/unit/property checks, setup/build, Worker tests, ledger regressions, `./scripts/run`, both host browser suites, and bounded server/browser teardown provide evidence.                                                                     |

## Prior finding and blocker regression results

- V-001 through V-017 remain resolved in retained static, unit/property,
  browser, workflow, persistence, or publication regressions as applicable.
- B-007 was resolved for predecessor publication in round 014. Exact live
  publication of this production-changing candidate was not attempted by the
  Implementer or Verifier and is not used as evidence here.
- B-005 remains historically unmeasured, but D-007 expressly waives it as an
  automatic blocker for this bounded slice's implementation and independent
  automated verification. It does not become a PASS claim.

## Findings

### V-018 — Displayed pre-acceptance quote ignores accepted-task reservations

- Severity: High.
- Related requirement: `plan.md` Sections 6 and 9; Milestone 2 Workstation
  Expansion I task/economy contract; D-007 task/economy contract.
- Expected behavior: The current gross quote and demand shown immediately
  before queueing equal the quote the newly accepted task locks, subject only
  to the displayed rounding precision.
- Actual behavior: Jobs UI calls `getWorkloadQuote` without the count of active
  and waiting same-workload reservations. `QUEUE_JOBS` supplies that count and
  locks a lower quote. In the independent paused-queue boundary, the UI showed
  `$1.40` immediately before acceptance and the new task locked `$1.327`.
- Exact reproduction procedure: Open Jobs, pause processing, accept a batch of
  one workload, note its still-visible live quote, then accept one additional
  task and inspect that task's locked quote in the accepted queue.
- Concrete evidence: `tests/e2e/verifier-round-015.spec.ts`, first case; focused
  repository-pinned Chromium run fails at the quote equality assertion.
- Blocks PASS: Yes. The durable queue-time choice is made using a quote the
  product does not actually honor.

### V-019 — Valid bypassed graph defeats the nonpositive farming bound

- Severity: High.
- Related requirement: `plan.md` Sections 8–10 and Milestone 2 executable
  acceptance; D-007 pacing/time contract.
- Expected behavior: Repeated farming of one workload eventually has
  nonpositive expected margin for every valid player configuration, while
  rotating or waiting restores alternatives.
- Actual behavior: Removing all three starter process modules is explicitly
  valid, leaves source and sink cost at `$0.010`, and still allows normally paid
  completions despite the `no model stage` warning. At the Interactive Chat
  quote floor, expected margin remains `+0.020576` per attempt.
- Exact reproduction procedure: Use the supported remove/bypass action on the
  starter process positions, repeatedly run Interactive Chat until its quote
  reaches the floor, and compare floor quote × modeled reliability with the
  displayed/modelled operating cost.
- Concrete evidence: `src/simulation/verifierRound015.test.ts` fails because
  expected floor margin is positive; a deterministic 300-attempt observation
  continued increasing money after the quote reached its floor.
- Blocks PASS: Yes. The market constraint can be bypassed through an ordinary
  valid pipeline configuration, creating a dominant indefinite income path.

### V-020 — Pipeline feedback switches away from the active task

- Severity: High.
- Related requirement: `plan.md` Sections 6, 8.3, 9, and 20; Milestone 2
  per-task identity and pipeline-feedback acceptance.
- Expected behavior: While a task is active, dominant bottleneck, memory/thermal
  pressure, warning, and queue-stage feedback describe the workload actually
  being processed. Selecting future work may update offer information but must
  not misdescribe current processing.
- Actual behavior: The active task correctly retains its workload and uses that
  workload for progress/failure, but `SET_WORKLOAD` recalculates persistent UI
  metrics from the future selection. In the independent boundary, Long Document
  remained active with actual memory pressure `1.556`, while the screen changed
  to Interactive Chat's `0.931` pressure and evaluation-blind-spot warning.
- Exact reproduction procedure: Start a memory-heavy task, pause it after it
  becomes active, select a lighter workload for future acceptance, then compare
  the named active task with the warning and pipeline pressure feedback.
- Concrete evidence: `tests/e2e/verifier-round-015.spec.ts`, second case, fails
  after waiting for the new selection to become active in the UI; the focused
  headless calculation confirms the two pressure values and the active task's
  memory-failure outcome.
- Blocks PASS: Yes. The central observe/diagnose loop gives advice about a
  different workload from the one currently flowing through the pipeline.

## Unverified areas

- The original Milestone 0 economy-interest and Milestone 1 uninterrupted
  voluntary 30-minute reconfiguration/tradeoff-explanation gates. D-007 allows
  this bounded slice to be verified without claiming them.
- Exact-candidate GitHub Pages publication and direct-live package equality;
  the candidate was not pushed or deployed for this round.
- Physical-device battery, CPU, thermal, platform touch, and actual
  screen-reader output; browser checking used Chromium desktop emulation.
- Browsers other than Chromium.
- Deferred Milestone 2 systems and Milestones 3–7/expansions excluded by D-007.

## Residual risks

- The 41-seed progression model verifies one encoded competent strategy and
  uses the hour-24 workstation availability gate; it does not exhaustively prove
  strategy non-dominance. V-019 demonstrates one missed configuration class.
- Current quote and active-processing projections share UI state despite now
  representing different temporal decisions; fixing V-018 or V-020 in
  isolation could leave other cards, warnings, or bottleneck badges inconsistent.
- Short automated and headed sessions cannot establish sustained enjoyment,
  physical-device performance, or assistive-technology quality.
- localStorage denial leaves the in-memory session operable but cannot provide
  cross-reload durability, as the handoff already discloses.
