# Round 010 implementation handoff

## Implemented behavior summary

Gate-limited Milestone 0 numeric prototype and Milestone 1 portrait Pipeline Toy, with round-009 first-session comprehension findings repaired after the dated informal feedback in `.agent/playtests/2026-07-16-informal.md`:

- First-run Quick Start is visible without blocking the pipeline, answers every reported mechanics question with exact current rules, persists dismissal in local storage, and always reopens from the large **Help / Quick start** control. Its resource explanation now explicitly maps thermal pressure to lower compute budget or lower-CU-demand workload and states that Animations affects neither heat nor simulation time.
- Money is now an explicit choose → queue → run → complete → payout flow. Each workload shows gross cash and reputation rewards; the UI explains per-attempt operating cost and zero gross payout on failure. Deterministic schema-v3 settlement state records latest paid/failed counts, gross payout, costs, net money change, cumulative gross earned, and cumulative costs. The event ledger records gross payout on clean completion batches.
- Presets retain runtime validation and malformed/hostile-input safety. Each saved preset has separate labeled Load and Delete controls. Delete requires inline confirmation, persists removal, and offers one-step Undo whose restoration also persists.
- CU is visibly defined as normalized Compute Units, not physical FLOPS. The resource strip shows allocated CU/current rig CU and memory use/full rig capacity. Jobs shows held-back reserve in GB and the smaller pipeline-usable capacity.
- The single warning surface now combines current measured pressure with only currently reachable actions. Memory guidance states required, usable, total-capacity, and reserved GB, then conditionally offers lower reserve, a lighter compatible module, and/or a lower-memory workload. An already-zero reserve is never presented as reducible. Thermal guidance likewise checks compute-budget and workload-CU minima before recommending either action, and explicitly states that module swaps and Animations do not directly reduce heat in this toy. Reliability/evidence/order guidance avoids guaranteed or single-cause claims.
- Player-facing hardware purchasing is removed at both UI and simulation-command boundaries. The three hardware alternatives remain Milestone 0 headless balance inputs. The active Pipeline Toy explains that the shop belongs to Milestone 2 and stays locked until the human gate; current improvement comes from compatible module choice/order, workload, compute budget, memory reserve, and Shadow evaluation.
- The former Motion control is now **Animations on/off**, visibly labeled “Visual only.” It retains OS and in-app reduced-motion guarantees and does not alter simulation time.
- Simulation time has separate one-handed 1×, 4×, and 16× controls. The worker receives fixed 0.5-second × selected-speed quanta; only those three speeds are reachable. Pause remains a separate Jobs control. Repeated identical speed/tick schedules produce identical valid resources, settlements, RNG state, and unique ledger identities.
- Schema/content versions advance to 3 / `pipeline-toy-2`. Service-worker cache advances to scope-local v4 so this UI/schema release installs its new hashed assets and removes only stale caches in the same Goldilocks scope.
- All prior deterministic numeric, throughput, queue, causal-ledger, touch drag/pan, portrait/text-scale, reduced-motion, persistence, root/Pages PWA, cache-isolation, and offline protections are retained.

## Plan requirements covered

### Milestone 0 — Numeric prototype

- Time and money; three headless hardware choices; four workloads; one competition, one product, one aggregate creator event, one aggregate research project, and three prototype outcomes.
- Automated competition-, product-, and creator-first viability/non-dominance checks; higher hardware capacity retains capital, energy, heat, reliability, and maintenance tradeoffs.
- Human economy-interest gate remains unproven.

### Milestone 1 — Pipeline Toy

- Constrained portrait pipeline; compatible mouse/touch drag, tap/snap, replacement/reordering, defined Shadow evaluation split/merge, queues, memory, thermal throttling, latency, throughput, reliability, failure propagation, configuration comparison, pause, and bounded resource policies.
- First-session mechanics communication and feedback repair per D-005, without adding narrative, research characters, investors, labor, creator/hype/fear, hardware purchasing, or other Milestone 2+ content.
- Accessibility and PWA requirements remain: 320/393 portrait, 200% text, minimum 44 CSS-pixel controls, no horizontal document overflow, screen-reader labels, reduced motion, touch drawer pan/active-slot drag, installable root/Pages packages, scoped caching, worker-backed offline reload, and failure/recovery.

Milestones 2–6 remain intentionally unimplemented. The 2026-07-16 informal feedback is not the required Milestone 0 or uninterrupted 30-minute Milestone 1 gate record.

## D-005 acceptance map

| Accepted criterion                              | Implementation                                                           | Independent committed evidence                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-run, persisted, reopenable exact tutorial | `QuickStart`, `TUTORIAL_KEY`, Help control in `src/ui/App.tsx`           | `round-009-usability.spec.ts`: exact thermal/control/animation content, dismissal, reload persistence, Help target/reopen; frozen V-014 regression |
| Legible earnings and payout differences         | schema-v3 `JobSettlement`/engine settlement; `MoneyLoop`; workload cards | engine settlement test; round-009 money-loop/earned-settlement browser case                                                                        |
| Persistent preset delete + confirmation + undo  | validated preset store and delete/undo callbacks in `App.tsx`            | round-009 delete/cancel/confirm/undo/two reload outcomes; retained malformed/hostile/complete-restore cases                                        |
| Visible CU/memory/reserve                       | resource strip, concept note, memory accounting in Jobs                  | round-009 CU/accounting case; tutorial exact-content case                                                                                          |
| Actionable, qualified pressure guidance         | `WarningBanner` derives reachable interventions from current state       | round-009 positive/zero-reserve memory and forced thermal paths; frozen V-015 regression                                                           |
| Honest pre-gate rig progression/no shop         | locked Rig progression panel; purchase/select worker commands removed    | round-009 locked-copy/no-purchase-control case; unit headless-hardware-alternative coverage                                                        |
| Animation/time separation                       | header Animations visual-only control; independent time control          | round-009 animation/speed case; retained document-wide reduced-motion cases                                                                        |
| Bounded deterministic fast-forward              | `TIME_SPEEDS = [1,4,16]`, guarded setter, fixed worker quanta            | engine identical-speed-schedule test; round-009 exact three-button/progress case                                                                   |
| Existing mobile/accessibility/PWA constraints   | responsive CSS, pinned Playwright, scope-derived SW/cache v4             | retained 320/393, 200%, 44px, touch, root offline; Pages online/cache/offline/worker/cache-isolation suites                                        |

## Verifier findings resolved/preserved

- V-001 through V-013 remain resolved. Their committed regressions remain present and were adapted only where the accepted UI terminology/first-run layout changed: tests now scroll the first-run pipeline into view for pointer/touch drag, target the separate Load preset control, and use Animations on/off labels.
- V-014 resolved: Quick Start explicitly names thermal pressure, lower compute budget, lower-CU-demand workload, and the non-effect of Animations on heat/simulation time. The verifier-authored `verifier-round-009.spec.ts` regression passes unchanged.
- V-015 resolved: memory remediation is assembled from reachable state deltas. With reserve at 0%, the warning reports 16.7 GB required, 8 GB usable of 8 GB total, 0 GB reserved, offers lighter compatible modules/lower-memory workload, and omits reserve reduction. Positive nonzero-reserve coverage confirms the action still appears when valid. Thermal remediation received the analogous minimum/reachability audit.
- No prior immutable verification report was edited.
- Round-010 work repairs the round-009 D-005 findings without claiming a human-gate verdict.

## Reproducible setup, startup, and verification

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
# Locked dependencies + ignored repository-local Chromium
./scripts/setup

# Deterministic loopback development server
./scripts/run
# http://127.0.0.1:4173

# Canonical clean check: setup, format, lint, typecheck, unit/property,
# balance, root/Pages builds, and both packaged browser suites
./scripts/verify

# Root packaged PWA browser acceptance
npm run test:e2e

# GitHub Pages /goldlocks-engine/ package and browser acceptance
npm run build:pages
npm run test:e2e:pages
```

Dependency cache: ignored `.cache/npm`. Browser cache: ignored `.cache/ms-playwright`. `npm run test:e2e` uses `./scripts/run-e2e`; Pages uses `./scripts/run-pages-e2e`. Both bind deterministic `127.0.0.1:4173`, wait for readiness, and let Playwright clean up the managed server. The Pages workflow defines both cache paths before `actions/setup-node` and `npm ci`.

## Important architectural decisions

- Typed UI commands enter a deterministic headless simulation in a dedicated Web Worker. Runtime numeric operations remain transactional exact no-ops when malformed/non-finite.
- Time speed is a presentation scheduler choice over explicit fixed tick requests, not hidden multiplier state inside the engine. Determinism remains defined by seed plus ordered commands/ticks; the accepted speed set is closed and guarded.
- Settlement facts live in versioned simulation state rather than inferred DOM deltas. This keeps money feedback deterministic, worker-backed, and independently testable.
- Hardware profiles remain catalog/balance/metric inputs, but no purchase/select player command or shop exists before Milestone 2.
- React/browser state remains sufficient for tutorial dismissal, presets, animation preference, and scheduler speed. No new state library or persistence database was justified.
- Pressure guidance describes current modelled conditions and derives interventions only when the relevant state can actually decrease, preserving the plan's causal-uncertainty rule and avoiding impossible actions at reserve/compute/workload/module minima.
- Service-worker v4 uses generated exact assets and scope-derived namespaces; activation deletes stale caches only for the same app scope.
- Informal observations are immutable dated `.agent/playtests/` records; accepted product obligations are promoted into `.agent/DECISIONS.md`; `plan.md` remains unchanged without explicit authorization.

## Known limitations and risks

- Human gates remain open. The informal report lacks device, exact duration, uninterrupted 30-minute evidence, reconfiguration timestamps/count, prompting record, two complete tradeoff explanations, and a gate conclusion.
- Browser acceptance uses pinned Chromium. Physical-device battery/thermal behavior, platform-specific screen-reader output, browsers other than Chromium, optional haptics, and audio remain unverified.
- Presets and tutorial dismissal persist locally. Full run save/load and offline policy progression belong to Milestone 2.
- 16× accelerates deterministic simulated time; wall-clock callback frequency can vary under browser throttling. Ordered tick results remain deterministic, but real elapsed time is not a replay input.
- This Implementer was instructed not to push. Remote workflow/live exact-SHA deployment remains Orchestrator work after fresh verification.

## Checks executed

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run format:check`: initial production-file formatting warning; Prettier applied, and canonical rerun PASS.
- `npm test -- --run`: PASS, 30/30 unit/property/configuration tests with coverage thresholds.
- `npm run test:e2e -- --grep "verifier round 009|round 009 first-session comprehension"`: initial 7/8 because a new implementer assertion expected the wrong action verb; assertion corrected to the rendered, accurate copy. Final PASS 8/8, including both unchanged verifier regressions and expanded D-005 coverage.
- `npm run test:e2e`: PASS 28/28, root packaged PWA acceptance.
- `npm run test:e2e:pages`: first sandboxed attempt could not launch Chromium at the known macOS Mach-port boundary; exact outside-sandbox rerun PASS 2/2, including root-scoped asset/cache/worker offline behavior and foreign-cache preservation.
- `./scripts/verify`: sandboxed fresh run passed locked install, format, lint, typecheck, 30 unit/property/configuration tests, balance validation, and root build, then Chromium launches were denied at zero runtime by the managed macOS Mach-port sandbox. Exact full outside-sandbox rerun PASS end-to-end: fresh locked install, format, lint, typecheck, 30/30 tests with coverage thresholds, balance, build, root Playwright 28/28, and Pages Playwright 2/2.

## Checks not run

- Remote GitHub Actions deployment/live exact-SHA validation: intentionally not run; no push authorized for this role.
- Required Milestone 0 and Milestone 1 human gate sessions: not supplied; the informal report explicitly does not qualify.
- Physical mobile device and non-Chromium browser profiling: infrastructure not supplied.
- Milestones 2–6 acceptance: prohibited until the Pipeline Toy gate passes.

## Exact input required to clear the human gates

Provide a dated record tied to the tested candidate SHA and device(s). It must assess whether the Milestone 0 economy creates interesting decisions without narrative spectacle and include at least one uninterrupted 30-minute Milestone 1 session with voluntary pipeline reconfiguration, timestamps/count, prompting status, at least two participant-explained tradeoffs, and an explicit proceed/redesign conclusion.
