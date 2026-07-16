# Round 015 implementation handoff

## Implemented behavior summary

The bounded Workstation Expansion I / per-task demand slice authorized in D-007 and the targeted `plan.md` Milestone 2 update is implemented:

- Workstation Expansion I costs $45, is purchased exactly once, and is activated separately. It expands the single ordered pipeline from three to six process positions. Process 4–6 start empty/bypassed; purchase never buys, clones, equips, or auto-fills modules.
- Every process position can be emptied or filled with one owned compatible module. Empty positions have no memory, latency, cost, or processing effect. An expanded-stage cue names the internal pipeline scroll and the initially below-fold Process 4–6/Output stages.
- Pipeline topology, empty positions, active expansion, module placement, hardware, policies, and workload persist through schema-5 saves, offline reload, and presets. Presets retain honest starter/expanded topology.
- Eight workload cards are visible from the start. Four are initially unlocked; four show exact job/reputation/equipment requirements and unlock in order without a second currency.
- Accepted work is a per-task FIFO queue. Each task receives an immutable ID, workload, queue-time gross quote, and progress. Changing the selected workload affects new tasks only. Completion shows locked gross, actual configuration cost, and net; failed work receives no gross payout.
- Each workload has deterministic demand saturation, minimum quote, and simulated-time recovery. Pending reservations reduce later quotes. Repeated single-workload farming eventually has nonpositive expected margin, while rotation retains a profitable path. Idle time never creates money.
- Waiting tasks can be cleared only after confirmation. The active task, its progress/identity/quote, money, demand, reputation, RNG, and settled history remain unchanged.
- Fixed 1×/4×/16×/64× controls advance the same 0.5-second simulation quanta. Animation and pause remain separate.
- Global page changes use only the four bottom tabs. Warning and module copy point to those tabs rather than duplicating page-opening actions. Rig/module detail is progressively disclosed.
- The tutorial explains earning, CU/memory/thermal pressure, task quotes/costs, demand, expansion purchase/activation/empty slots, 64× time, waiting-task clearing, and honest presets.
- Schema version is 5; content version is `pipeline-toy-4`; scope-isolated service-worker cache is v7. Schema-3 and schema-4 saves migrate safely. Aggregate legacy queues become deterministic task records without losing the queue count or current workload identity.

The source feedback is preserved in `.agent/playtests/2026-07-16-progression-expansion.md`. D-007 records the owner's process waiver and the bounded scope. The original human-study gates remain visible in `plan.md`; this implementation does not claim they passed.

## Plan requirements covered

| Requirement                         | Implementation                                                                                                    | Evidence                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Expansion purchase and topology     | Exact-once $45 purchase; explicit activation; 3→6 process positions; new slots empty; no module duplication       | Engine command tests; round-015 browser purchase/topology case                 |
| Honest pipeline composition         | Nullable process modules; empty/bypass behavior; owned compatible movement; added-stage scroll cue                | Engine invariants/property tests; round-015 placement and 320/393 visual cases |
| Per-task FIFO identity              | Immutable task ID/workload/locked quote/progress; active + waiting UI; selected workload applies only to new work | Engine queue/settlement tests; round-015 task-market case                      |
| Clear waiting only                  | Confirmation; active task preserved; no payout/refund/demand/RNG mutation                                         | Engine exact-state assertions; round-015 browser case                          |
| Demand economy                      | Saturation, pending reservation pressure, quote floor, simulated-time recovery, trend/reason copy                 | Engine demand tests; progression balance gate; Jobs UI                         |
| Eight staged workloads              | Four initial plus four requirement-locked cards; deterministic ordered unlocks                                    | Catalog/engine unlock tests; eight-card browser assertion                      |
| Progression bounds                  | First module ≤5 successes; alternate rig ≤15; expansion 8–16h; full catalogue 24–72h                              | Upgrade balance and 41-seed progression balance                                |
| No dominant farming / no idle money | Single-workload expected margin eventually ≤0; rotation profitable; idle ticks do not pay                         | Progression unit and deterministic sweep                                       |
| Fixed fast-forward                  | 1×/4×/16×/64× use identical fixed quanta and preserve settlements/resources/ledger identities                     | Schedule-equivalence engine test; browser controls                             |
| Portrait/accessibility              | 320/393 CSS px, 200% text, ≥44px visible buttons, no document overflow, reduced motion, touch/pointer placement   | Root browser suite, retained verifier cases, headed visual inspection          |
| Bottom-tab routing / disclosure     | No duplicate global page-opening CTAs; upgrade details use native disclosure                                      | Browser assertions and source inspection                                       |
| Persistence/migration/offline       | Schema-5 integrity; schema-3/4 migration; expanded preset/save/offline resume; cache v7                           | Unit migration tests; root and Pages browser suites                            |

## Prior verifier findings

- V-001 through V-017 remain resolved and their retained regression tests pass. No immutable verifier report was changed.
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
npm run test:e2e
npm run test:e2e:pages
```

Dependency cache: ignored `.cache/npm`. Browser cache: ignored `.cache/ms-playwright`. Playwright CLI daemon cache: ignored `.cache/pwcli-daemon`; optional visual artifacts: ignored `output/playwright/`. Root and Pages servers bind `127.0.0.1:4173`, wait for readiness, and are cleaned up by Playwright.

On this managed macOS host, a direct browser launch can fail with a Mach-port permission denial inside the filesystem sandbox. The exact same repository-local command succeeds outside that boundary; this is an environment constraint, not a skipped test or product workaround.

## Important architectural decisions

- Expansion, task acceptance, quotes, demand, purchases, unlocks, and clearing live inside the deterministic simulation/Worker command stream. React only renders state and submits commands.
- A task locks gross quote and workload at acceptance. Operating cost remains the actual completion-time configuration cost, making reconfiguration an explicit economic choice rather than silently rewriting accepted demand.
- Demand recovery uses simulated time, including paused/idle time; it never pays money. Fixed 0.5-second quanta make speed schedules equivalent.
- Workstation Expansion I is topology, not inventory. Activation only adds nullable positions; module ownership remains independent.
- The 24 GB Workstation has a data-driven hour-24 catalogue gate. This proves money alone cannot complete the entire catalogue before 24 simulated hours while leaving representative completion below 72 hours.
- The established `goldilocks-simulation-save-v4` localStorage address is intentionally retained while the payload advances to schema 5. Existing runs and verifier-owned browser probes therefore exercise migration in place; `schemaVersion` is the save-format contract.
- Harmless storage integrity mismatches are resealed only after full structural validation. Malformed render-bound values still restart safely.

## Known limitations and risks

- D-007's owner feedback did not provide device, exact duration, reconfiguration timestamps/count, or structured telemetry. The source record states those fields are unknown rather than inferring them.
- Researcher teams, hype/creator/fear economy, parallel pipelines, automation, newer-model content, deeper maintenance, and social systems remain deferred Milestone 2+ work. This slice keeps one workstation and one ordered pipeline.
- Demand and progression values are deterministic toy-economy tuning, not a calibrated real marketplace. The 41-seed gate establishes stated bounds, not long-term human fun.
- No selling, refunds, queue repricing, cancellation payout, or module auto-purchase. Clear waiting is intentionally lossless only in state mutation, not a refund mechanism, because acceptance spends no money.
- Browser acceptance uses pinned Chromium. Physical-device thermal/battery behavior, non-Chromium engines, platform screen readers, haptics, and audio remain unverified.
- localStorage denial leaves the in-memory session playable but cannot provide cross-reload durability.
- Implementer does not push, deploy, or issue acceptance. Exact-SHA publication and fresh independent PASS remain Orchestrator/Verifier work.

## Checks executed before final candidate

- `npm test`: PASS, 56/56 unit/property/migration/economy tests with coverage thresholds.
- `npm run balance:progression`: PASS, 41/41 deterministic seeds; expansion 13.03–15.63 simulated hours; full catalogue 40.61–43.98 hours; zero failures.
- `npm run test:e2e`: PASS, 42/42 root browser cases after repair.
- `npm run test:e2e:pages`: PASS, 2/2 GitHub Pages/offline/cache-isolation cases. The first sandboxed launch failed at macOS Mach registration; the exact escalated rerun passed.
- `npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts`: PASS, 4/4 after the final added-stage discoverability cue.
- `npm run format:check`, `npm run lint`, and `npm run typecheck`: PASS before final cue; rerun by the final canonical gate.
- Headed Playwright CLI at 393 px inspected starter Build and the exact purchase → owned → activate → expanded Build journey. Hierarchy, text states, fixed navigation, drawer affordance, controls, and spacing were legible. It found the initially below-fold expanded stages; the added scroll cue is the resulting UX repair. No unresolved visual overlap/cutoff remained.
- `./scripts/verify`: PASS as one uninterrupted elevated run: clean dependency recreation, format, lint, typecheck, 56/56 covered tests, base model, 20,001-seed upgrade balance, 41-seed progression balance, production build, 42/42 root browser cases, and 2/2 Pages/offline/cache-isolation cases. The preceding sandboxed attempt passed every non-browser stage, then all Chromium launches were denied at macOS Mach registration before page creation; no product assertion failed.

## Checks not run

- Git push, GitHub Actions, deployment, and live exact-candidate-SHA URL validation: intentionally left to the Orchestrator after fresh verification.
- The owner's promised post-step-two 30-minute play session: not yet performed; this candidate exists to make that session meaningful.
- Physical mobile device, non-Chromium browser, battery/CPU/thermal profile, and actual assistive-technology output: infrastructure not supplied.
- Deferred researcher/hype/parallel-pipeline/new-model systems: outside this authorized bounded slice.
