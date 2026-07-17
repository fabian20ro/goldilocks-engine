# Round 025 implementation handoff

## Implemented behavior summary

The bounded Workstation Expansion I / per-task demand slice authorized in D-007 and the targeted `plan.md` Milestone 2 update is implemented:

- Workstation Expansion I costs $45, is purchased exactly once, and is activated separately. It expands the single ordered pipeline from three to six process positions. Process 4–6 start empty/bypassed; purchase never buys, clones, equips, or auto-fills modules.
- Every process position can be emptied or filled with one owned compatible module. Empty positions have no memory, latency, cost, or processing effect. An expanded-stage cue names the internal pipeline scroll and the initially below-fold Process 4–6/Output stages.
- Pipeline topology, empty positions, active expansion, module placement, hardware, policies, and workload persist through schema-5 saves, offline reload, and presets. Presets retain honest starter/expanded topology.
- Preset restoration is one atomic Worker request instead of a stream of externally visible remove/place states. Each player command has a request acknowledgement: its state is written to localStorage before React may publish it, and offline readiness remains false until every pending command has a durable matching response. Reload can no longer capture an intermediate preset topology.
- Eight workload cards are visible from the start. Four are initially unlocked; four show exact job/reputation/equipment requirements and unlock in order without a second currency.
- Accepted work is a per-task FIFO queue. Each task receives an immutable ID, workload, queue-time gross quote, and progress. Changing the selected workload affects new tasks only. Completion shows locked gross, actual configuration cost, and net; failed work receives no gross payout.
- Each workload has deterministic demand saturation, minimum quote, and simulated-time recovery. The live quote always includes all active/waiting same-workload reservations and is the exact quote the next accepted task locks; batch items add their own sequential reservation pressure.
- Repeated single-workload farming eventually has nonpositive expected margin for every valid graph: a pipeline without a model has zero delivery reliability and always fails for $0 gross, while every productive graph's quote floor is below its unavoidable model/maintenance cost. Offer cards and the money loop use reliability-weighted expected gross/net, so a guaranteed failure never advertises positive profit. Rotation retains a profitable path. Idle time never creates money.
- A task always incurs its full completion-time configured operating cost, even when current cash cannot cover it. Money remains nonnegative; the aggregate tracks cash actually paid, while the settlement and ledger preserve the configured cost and explicitly identify its paid and unpaid portions.
- Settlement equations use one shared display precision. Ordinary cent-exact values remain concise at two decimals; if gross, configured cost, paid cost, unpaid cost, or net includes a fraction of a cent, the complete equation uses three decimals and explains the precision. Visible parts therefore remain additive-consistent in both Latest settlement and the ledger.
- Current warning, pressure, bottleneck, and queue-stage feedback follow the active task's workload. Selecting a future workload changes only its quote and estimated offer information until it becomes active.
- Waiting tasks can be cleared only after confirmation. The active task, its progress/identity/quote, money, demand, reputation, RNG, and settled history remain unchanged.
- Fixed 1×/4×/16×/64× controls advance the same 0.5-second simulation quanta. Animation and pause remain separate.
- Global page changes use only the four bottom tabs. Warning and module copy point to those tabs rather than duplicating page-opening actions. Rig/module detail is progressively disclosed.
- The header's primary resources use their own available inline size, not only viewport width. At enlarged text scale they reflow into two readable columns without ellipsis, and the simulation-time explanation stacks above the unchanged 44px speed controls. Normal 320/393px layout remains the compact five-resource row.
- Pipeline and module-drawer cards reflow from their available inline size measured against inherited text scale, not from viewport width alone. At both 320 and 393 CSS pixels with 200% text, code/grip occupy a compact header and the full name, throughput, memory, reliability, and state receive a full-width row. Normal 320 remains cleanly stacked; normal 393 retains its horizontal composition and controls.
- Every repository-local Playwright output directory used by setup, root/Pages checks, retained traces, or visual inspection is excluded from canonical ESLint by an exact generated-path ignore. Generated reports remain Git-ignored and cannot poison the next lint/full-verification run.
- GitHub Actions now has a Linux verification lane for `agent/implementation` pushes and manual dispatch. It asserts the checked-out commit equals `GITHUB_SHA`, runs the canonical `./scripts/verify` command on Ubuntu 24.04, installs pinned Chromium and Linux dependencies through repository-local caches, and uploads identity metadata plus root/Pages reports and results on both success and failure. The canonical script now continues through both browser packages after an earlier check failure, then returns nonzero if any phase failed.
- Runtime commands now cross an explicit discriminator/input boundary before the engine switch. Unknown discriminants and malformed numeric, baseline-label, or expansion-active inputs are exact no-ops; a command batch preflights every nested command before applying any command, preserving atomicity. The Worker also safely omits an invalid request ID while returning its normal state response.
- The tutorial explains earning, CU/memory/thermal pressure, task quotes/costs, demand, expansion purchase/activation/empty slots, 64× time, waiting-task clearing, and honest presets.
- Schema version is 5; content version is `pipeline-toy-4`; scope-isolated service-worker cache is v7. Schema-3 and schema-4 saves migrate safely. Aggregate legacy queues become deterministic task records without losing the queue count or current workload identity.

The source feedback is preserved in `.agent/playtests/2026-07-16-progression-expansion.md`. D-007 records the owner's process waiver and the bounded scope. The original human-study gates remain visible in `plan.md`; this implementation does not claim they passed.

## Plan requirements covered

| Requirement                         | Implementation                                                                                                                                                                                                   | Evidence                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Expansion purchase and topology     | Exact-once $45 purchase; explicit activation; 3→6 process positions; new slots empty; no module duplication                                                                                                      | Engine command tests; round-015 browser purchase/topology case                                                                |
| Honest pipeline composition         | Nullable process modules; empty/bypass behavior; owned compatible movement; added-stage scroll cue                                                                                                               | Engine invariants/property tests; round-015 placement and 320/393 visual cases                                                |
| Per-task FIFO identity              | Immutable task ID/workload/locked quote/progress; active + waiting UI; selected workload applies only to new work                                                                                                | Engine queue/settlement tests; round-015 task-market case                                                                     |
| Clear waiting only                  | Confirmation; active task preserved; no payout/refund/demand/RNG mutation                                                                                                                                        | Engine exact-state assertions; round-015 browser case                                                                         |
| Demand economy                      | Saturation, accepted-reservation pressure, exact next-acceptance quote, safe floor, simulated-time recovery                                                                                                      | Engine/round-015 verifier tests; progression balance gate; Jobs UI                                                            |
| Eight staged workloads              | Four initial plus four requirement-locked cards; deterministic ordered unlocks                                                                                                                                   | Catalog/engine unlock tests; eight-card browser assertion                                                                     |
| Progression bounds                  | First module ≤5 successes; alternate rig ≤15; expansion 8–16h; full catalogue 24–72h                                                                                                                             | Upgrade balance and 41-seed progression balance                                                                               |
| No dominant farming / no idle money | Every valid graph has nonpositive floor margin; no-model work always fails; expected-value offers stay honest; rotation profitable; idle does not pay                                                            | Engine/round-016 verifier tests and deterministic progression sweep                                                           |
| Incurred-cost accounting            | Full configured cost is settled and reported; collectible cash is paid; unpaid cost is explicit; money remains nonnegative                                                                                       | Engine and round-016 verifier settlement regressions; latest-settlement UI                                                    |
| Additive currency presentation      | One equation-wide 2/3-decimal precision keeps gross − configured = net and paid + unpaid = configured at sub-cent boundaries                                                                                     | Exhaustive formatter test; round-017 unit/browser regressions                                                                 |
| Active-task feedback                | Active work owns pressure, warning, bottleneck, and queue-stage diagnostics; future selection owns offer details                                                                                                 | Engine regression and round-015 verifier browser case                                                                         |
| Fixed fast-forward                  | 1×/4×/16×/64× use identical fixed quanta and preserve settlements/resources/ledger identities                                                                                                                    | Schedule-equivalence engine test; browser controls                                                                            |
| Portrait/accessibility              | 320/393 CSS px, normal and 200% text, ≥44px visible buttons, no document overflow, reduced motion, touch/pointer placement; primary resources and simulation-time guidance reflow intrinsically at enlarged text | Root browser suite, round-025 header regression, retained verifier cases, headed visual inspection                            |
| Stressed module readability         | Inline-size/text-scale-aware cards give all decision copy a full-width row at 320/393 and 200% while preserving normal-scale composition                                                                         | Round-019/020 browser regressions and fresh normal/scaled screenshots                                                         |
| Bottom-tab routing / disclosure     | No duplicate global page-opening CTAs; upgrade details use native disclosure                                                                                                                                     | Browser assertions and source inspection                                                                                      |
| Persistence/migration/offline       | Schema-5 integrity; schema-3/4 migration; atomic preset restore; persist-before-publish command acknowledgements; expanded preset/save/offline resume; cache v7                                                  | Worker/hook/localStorage integration tests; 50-repeat exact offline path; retained root browser suite; Pages production build |
| Rerunnable browser verification     | Exact lint ignores cover only generated root/Pages reports, results, visual output, CLI state, and caches                                                                                                        | Round-019 workflow regression; lint with populated report trees                                                               |
| Linux Pages browser evidence        | Exact-SHA GitHub Actions job runs the canonical root + Pages/offline gate with pinned Chromium, workspace-local caches, and retained failure artifacts; both browser suites run before aggregate failure         | `src/test/verifyWorkflow.test.ts`; pending independently queryable workflow run after candidate publication                   |
| Runtime command recovery            | Direct and Worker command paths reject unsupported discriminants safely; Worker batches validate fully before any nested valid command can mutate state                                                          | V-028 regression; engine and Worker-protocol command-boundary tests                                                           |

## Prior verifier findings

- V-001 through V-017 remain resolved and their retained regression tests pass. No immutable verifier report was changed.
- V-018 resolved: `getWorkloadQuote` now derives accepted same-workload reservations from state, and `QUEUE_JOBS` uses the same function with only each new batch offset. The displayed next quote and newly locked task quote are identical.
- V-019 resolved: no-model graphs have zero modeled reliability, deterministically fail before delivery, and pay $0 gross. All workload floors are $0.02, below the current cheapest productive model-plus-maintenance cost; the progression gate checks this all-configuration lower-bound proof instead of only the starter graph.
- V-020 resolved: persistent pipeline diagnostics recalculate against the active task's workload. Selected future-work cards and the money-loop offer calculate their own explicit projections, and warning guidance uses the active workload.
- V-021 resolved: one shared offer estimator applies modeled delivery reliability to gross payout and subtracts configured cost. No-model and memory-overload guarantees produce expected gross $0 and negative expected net in both workload cards and the money loop.
- V-022 resolved: settlement records the full configured operating cost even when money is $0. Cash collection is separately capped to available money, aggregate operating costs count only what was paid, and the persisted ledger plus latest-settlement UI explicitly distinguish paid and unpaid cost without allowing negative money.
- V-023 resolved: ledger and Latest settlement select one precision for the complete currency equation. Cent-exact equations use two decimals; any reachable sub-cent member promotes every displayed member to three decimals, preserving both configured = paid + unpaid and net = gross − configured. The UI explicitly explains the extra precision.
- V-024 resolved: ESLint's flat-config ignore list now names `playwright-pages-report`, `output/playwright`, and `.playwright-cli` alongside the existing root report, result, and cache paths. Source-bearing parent directories remain in lint scope; populated generated trees no longer affect canonical lint.
- V-025 resolved: narrow module cards use a two-row grid so the icon and grip remain compact while all decision-relevant copy receives the full card width. The exact 320/200% regression reports one rendered line for `Delivery`; fresh screenshots show the complete name, throughput, memory, reliability, and equipped state.
- V-026 resolved: pipeline slots and the module drawer are named inline-size containers, and their two-row module layout activates through an `em`-based container condition. Because that condition follows inherited text scale, 393/200% no longer keeps the clipped horizontal composition; the unchanged exact regression reports no clipped decision field.
- V-027 resolved: the preset loader previously submitted each remove, expansion, placement, and policy mutation as a separate Worker request. When the pre-load DOM already matched the preset, the visibility assertion could complete immediately while an intermediate `REMOVE_MODULE` response was persisted; service-worker readiness did not represent that in-flight state mutation. Preset loading is now one atomic `COMMAND_BATCH`. Request IDs keep offline readiness false until the matching state is persisted, and the message handler persists before publishing to React. Deterministic Worker→React→localStorage coverage and 50 consecutive exact offline reloads verify the boundary without sleeps or timing delays.
- V-028 resolved: `applyCommand` now rejects an unrecognized runtime command discriminant before the command switch. `COMMAND_BATCH` validates every nested command before reduction, so an unsupported or malformed nested command cannot crash the Worker or leave earlier batch commands partially applied. The Worker response path also reads malformed request IDs defensively; the preserved verifier direct and batch regressions pass.
- V-029 resolved: the header previously fixed primary resources into five equal columns and ellipsized text; its only time-control reflow breakpoint was viewport-based, so 320/393px at 200% text clipped labels and values. The header is now an inline-size container. When enlarged text leaves insufficient intrinsic width, resources become two wrap-safe columns and time controls stack without reducing the four 44px targets. The immutable verifier regression and new normal/scaled 320/393 no-clipping regression pass.
- The previously recorded B-005 human-study blocker is owner-waived for this bounded implementation slice under D-007. That waiver permits implementation; it is not empirical evidence that either original human gate passed.
- All reports under `.agent/verification/` were read before implementation. Their evidence remains immutable.

## Reproducible setup, startup, and verification

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
# Locked dependencies plus ignored repository-local Chromium
./scripts/setup

# Deterministic loopback development server
./scripts/run
# http://127.0.0.1:4173

# Canonical full gate: setup, formatting, lint, typecheck, coverage,
# all balance models, root/Pages builds, root E2E, and Pages/offline E2E
./scripts/verify

# Focused gates
npm run balance:progression
npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts
npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep "buys expansion exactly once" --repeat-each=50
npm run test:e2e -- tests/e2e/verifier-round-024.spec.ts tests/e2e/round-025-header-scale.spec.ts
npm run test:e2e
npm run test:e2e:pages

# Exact-SHA Linux evidence after candidate publication
gh run list --workflow verify.yml --commit <candidate-sha>
gh run view <run-id> --log-failed
```

Dependency cache: ignored `.cache/npm`. Browser cache: ignored `.cache/ms-playwright`. Playwright CLI daemon cache: ignored `.cache/pwcli-daemon`; reports/results are ignored under `playwright-report/`, `playwright-pages-report/`, and `test-results/`; visual artifacts are ignored under `output/playwright/`. These exact generated paths are also outside ESLint scope. Root and Pages servers bind `127.0.0.1:4173`, wait for readiness, and are cleaned up by Playwright. Set `PLAYWRIGHT_INSTALL_DEPS=1` only on a Linux runner with privilege to install Playwright's required system libraries; the verification workflow does this before calling the same canonical command.

On this managed macOS host, a direct browser launch can fail with a Mach-port permission denial inside the filesystem sandbox. The exact same repository-local command succeeds outside that boundary; this is an environment constraint, not a skipped test or product workaround.

## Important architectural decisions

- Expansion, task acceptance, quotes, demand, purchases, unlocks, and clearing live inside the deterministic simulation/Worker command stream. React only renders state and submits commands.
- Preset application uses a bounded atomic Worker batch, so no intermediate cleared topology crosses the Worker boundary. Every player command receives a request ID; the matching response is persisted synchronously before React publication. Offline readiness is the conjunction of service-worker shell readiness, successful state durability, and zero pending player commands.
- A task locks gross quote and workload at acceptance. Operating cost remains the actual completion-time configuration cost, making reconfiguration an explicit economic choice rather than silently rewriting accepted demand.
- Offer comparisons are expected-value projections, not guaranteed gross claims: modeled reliability weights the gross quote before configured cost is subtracted, and deterministic failure overrides expected gross to zero.
- `lastSettlement.operatingCost` is the full incurred configured cost. `lastSettlement.netChange` remains the actual cash delta, so existing cash accounting stays exact; paid cost is derivable as gross minus cash delta and any remainder is explicitly unpaid. `jobs.operatingCostsPaid` intentionally remains a cash-paid aggregate.
- Currency precision is selected per settlement equation rather than per amount. This prevents independent half-cent rounding from inflating a visible partition while keeping ordinary values at familiar cent precision.
- Module reflow is intrinsic to its pipeline-slot or drawer container: an `em` threshold evaluates available width relative to inherited text size. When space is insufficient, code/grip occupy the first row and existing name/stats/status copy spans the second. The card remains the same accessible 44px-plus control; the horizontally scrollable module drawer keeps its separate touch behavior.
- Header reflow uses the same intrinsic principle: `.app-header` is a named inline-size container, so its `16em` condition follows inherited text scale. The compact five-column resource row is retained at normal portrait scale; the scaled fallback protects labels, values, time guidance, and speed controls without a second viewport-only breakpoint.
- Generated browser output is ignored by exact leaf paths in both Git and ESLint. The broader `output/` tree and project source remain visible to tooling.
- The quote function owns reservation counting. Callers cannot accidentally display an unreserved quote while acceptance uses a reserved one; batch acceptance passes only the zero-based count of additional tasks in that batch.
- Persistent `state.metrics` describes work physically in flight when an active task exists; selected-work projections are computed ephemerally for offer comparison and are not allowed to overwrite active diagnostics.
- Market-floor safety is structural: no-model graphs cannot deliver, every delivering graph contains at least one model, all other costs are nonnegative, and modeled reliability is capped below one.
- Demand recovery uses simulated time, including paused/idle time; it never pays money. Fixed 0.5-second quanta make speed schedules equivalent.
- Workstation Expansion I is topology, not inventory. Activation only adds nullable positions; module ownership remains independent.
- The 24 GB Workstation has a data-driven hour-24 catalogue gate. This proves money alone cannot complete the entire catalogue before 24 simulated hours while leaving representative completion below 72 hours.
- The established `goldilocks-simulation-save-v4` localStorage address is intentionally retained while the payload advances to schema 5. Existing runs and verifier-owned browser probes therefore exercise migration in place; `schemaVersion` is the save-format contract.
- Harmless storage integrity mismatches are resealed only after full structural validation. Malformed render-bound values still restart safely.
- The canonical browser gate has an independent Linux execution path: `verify.yml` validates the frozen checkout against `GITHUB_SHA`, keeps npm/browser/XDG caches inside ignored `.cache/`, and records a run-scoped artifact even when `./scripts/verify` fails. A Verifier must still inspect that exact run's SHA and conclusion; an absent or failed run is not acceptance evidence.
- Runtime command validation is intentionally shared by the direct engine entry point and Worker protocol. The batch preflight is pure and occurs before reduction, so a malformed second command cannot make a valid first command visible.

## Known limitations and risks

- D-007's owner feedback did not provide device, exact duration, reconfiguration timestamps/count, or structured telemetry. The source record states those fields are unknown rather than inferring them.
- Researcher teams, hype/creator/fear economy, parallel pipelines, automation, newer-model content, deeper maintenance, and social systems remain deferred Milestone 2+ work. This slice keeps one workstation and one ordered pipeline.
- Demand and progression values are deterministic toy-economy tuning, not a calibrated real marketplace. The $0.02 floors guarantee eventual exhaustion but are not calibrated real prices. The 41-seed gate establishes stated bounds, not long-term human fun.
- Reliability-weighted offer net is an expectation over the deterministic model, not a promise for an individual task; successful and failed settlement outcomes remain discrete.
- No selling, refunds, queue repricing, cancellation payout, or module auto-purchase. Clear waiting is intentionally lossless only in state mutation, not a refund mechanism, because acceptance spends no money.
- Browser acceptance uses pinned Chromium. Physical-device thermal/battery behavior, non-Chromium engines, platform screen readers, haptics, and audio remain unverified.
- This managed macOS host can deny Chromium at Mach-port registration. Round 023's committed Linux workflow proved the prior frozen candidate; each new candidate still needs its own exact-SHA Linux run and fresh Verifier inspection before it becomes acceptance evidence.
- localStorage denial leaves the in-memory session playable but cannot provide cross-reload durability.
- Implementer does not push, deploy, or issue acceptance. Exact-SHA publication and fresh independent PASS remain Orchestrator/Verifier work.

## Checks executed before final candidate

- `npx vitest run src/simulation/workerProtocol.test.ts src/ui/useSimulation.test.tsx --coverage.enabled=false`: PASS, 6/6 focused protocol and Worker→React→localStorage ordering/integration checks.
- `npm test`: PASS, 81/81 unit/property/migration/economy/currency/workflow tests; coverage 87.59% statements, 86.04% branches, 94.90% functions, and 90.75% lines.
- `npm run balance:progression`: PASS, 41/41 deterministic seeds; expansion 13.14–15.59 simulated hours; full catalogue 40.63–44.40 hours; zero failures.
- `npx vitest run src/simulation/engine.test.ts src/simulation/verifierRound015.test.ts src/simulation/verifierRound016.test.ts src/simulation/progressionBalance.test.ts --coverage.enabled=false`: PASS, 43/43 focused economy, active-task, and round-016 regressions.
- `npm run test:e2e -- tests/e2e/verifier-round-016.spec.ts`: PASS, 1/1 exact guaranteed-failure offer regression.
- `npx vitest run src/simulation/currency.test.ts src/simulation/verifierRound017.test.ts --coverage.enabled=false`: PASS, 9/9 focused additive-currency and exact verifier regressions.
- `npm run test:e2e -- tests/e2e/verifier-round-017.spec.ts`: PASS, 2/2 exact settlement-feedback regressions.
- `npx vitest run src/test/verifierRound019Workflow.test.ts --coverage.enabled=false`: PASS, 1/1 exact Pages-report lint-isolation regression.
- `npm run test:e2e -- tests/e2e/verifier-round-020.spec.ts tests/e2e/verifier-round-019.spec.ts`: PASS, 3/3 exact 320/393 scaled-text and screenshot regressions. Fresh normal and 200% screenshots were inspected at both widths: scaled 320 and 393 show complete `Delivery Gate`, `20/m · 0.2 GB · 99.7%`, and `EQUIPPED`; normal 320 remains cleanly stacked and normal 393 remains horizontal without clipping or overlap.
- `npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep "buys expansion exactly once"`: PASS, 1/1 exact V-027 offline path.
- The same exact V-027 path with `--repeat-each=50`: PASS, 50/50 consecutive expanded-preset offline reloads, substantially exceeding the verifier's 8/10 reproduction run.
- `npm run test:e2e`: PASS, 52/52 root browser cases, including 44px controls, no horizontal document overflow, interaction, persistence, offline, and every retained verifier regression through round 021.
- `npm run lint` with populated `playwright-pages-report/`, `playwright-report/`, `test-results/`, and `output/playwright/`: PASS both before and after fresh browser output, proving required artifacts do not poison reruns.
- `npm run build:pages`: PASS for the `/goldlocks-engine/` base with main, Worker, manifest, and service-worker assets emitted.
- `npm run test:e2e:pages`: infrastructure-limited for this exact candidate. The normal sandboxed run was 0/2 before page creation due macOS Mach registration denial. No external workaround was attempted.
- `npx vitest run src/test/verifyWorkflow.test.ts --coverage.enabled=false`: PASS, 3/3 workflow/setup/aggregate-gate contract checks.
- `sh -n scripts/setup && sh -n scripts/verify && ./scripts/setup`: PASS; locked dependencies and repository-local Chromium install complete in default local mode.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run balance`, and `npm run build`: PASS after the round-023 changes.
- `npm run test:e2e -- --reporter=dot`: PASS, 52/52 root browser cases in the available local launch window.
- Round-023 `./scripts/verify`: expected nonzero only from the managed macOS Chromium boundary after all static/unit/balance/build stages passed. Crucially, its aggregate runner continued from the 52 root launch-only failures into both Pages browser cases; both Pages cases reached the same pre-page Mach-port denial. No test was skipped or reported as passing.
- `npx vitest run src/simulation/verifierRound023.test.ts src/simulation/workerProtocol.test.ts src/simulation/engine.test.ts --coverage.enabled=false`: PASS, 43/43 preserved V-028 direct/batch plus direct-engine and numeric-batch atomicity checks.
- `npm run format:check`, `npm run lint`, and `npm run typecheck`: PASS after the round-024 changes.
- `npm test`: PASS, 17 files / 85 tests; coverage 87.64% statements, 86.18% branches, 94.87% functions, and 90.63% lines.
- `npm run balance`: PASS, including the 20,001-seed upgrade sweep and 41-seed progression sweep; zero failures.
- `npm run build` and `npm run build:pages`: PASS, including the scoped `/goldlocks-engine/` package.
- `npm run test:e2e -- --reporter=dot`: PASS, 52/52 root browser cases in an available local launch window.
- `npm run test:e2e:pages -- --reporter=dot`: infrastructure-limited. Both cases reached only the managed macOS Chromium Mach-port registration denial before page creation; no app assertion failed.
- Round-024 `./scripts/verify`: all setup/static/unit/balance/build phases passed. Its aggregate browser phases both ran and recorded only the same pre-page macOS Mach-port denial (52 root launches, then 2 Pages launches); it correctly returned nonzero rather than skipping required browser checks.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test tests/e2e/verifier-round-024.spec.ts tests/e2e/round-025-header-scale.spec.ts --reporter=line`: PASS, 6/6. Covers immutable V-029 at 320/393px with 200% text plus normal/200% resource, time-description, target-size, document-width, and accessible-region checks.
- Visual local-Chromium inspection: PASS. Normal 320px retains the compact header. At 200% text, 320px and 393px show every resource label/value and the complete simulation-time explanation without clipping; speed controls remain visible. Browser and local server were closed after inspection.
- Round-025 `./scripts/verify`: PASS. Formatting, lint, typecheck, 18 files / 87 unit tests, numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, root build, 58 root browser tests, and 2 scoped Pages/offline browser tests all passed. The full command used the pinned repository-local Chromium cache outside the managed macOS filesystem sandbox because Chromium requires Mach-port registration.

## Checks not run

- Git push, GitHub Actions execution, deployment, and live exact-candidate-SHA URL validation: intentionally left to the Orchestrator after fresh verification. The Linux workflow must complete successfully at this frozen candidate SHA before it is acceptance evidence.
- The owner's promised post-step-two 30-minute play session: not yet performed; this candidate exists to make that session meaningful.
- Physical mobile device, non-Chromium browser, battery/CPU/thermal profile, and actual assistive-technology output: infrastructure not supplied.
- Deferred researcher/hype/parallel-pipeline/new-model systems: outside this authorized bounded slice.
