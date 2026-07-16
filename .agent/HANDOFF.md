# Round 012 implementation handoff

## Implemented behavior summary

The Milestone 0/1 Pipeline Toy now includes D-006's bounded purchasing redesign, motivated by the immutable feedback in `.agent/playtests/2026-07-16-purchase-loop.md`:

- Successful job settlements start from $0 and fund a persistent equipment economy. The deterministic default path can afford Precision Cleaner after at most four successful jobs and Used 12 GB GPU after at most fourteen, including that module purchase.
- Schema-v4 simulation state owns the Bedroom CPU and all former starter-catalog modules. Six new paid module choices cover preparation, model, evaluation, and delivery roles. The existing three hardware profiles are visible priced choices.
- `BUY_MODULE`, `BUY_HARDWARE`, and `EQUIP_HARDWARE` are deterministic worker commands. A successful purchase deducts exactly once and adds durable ownership. Repeated, already-owned, insufficient-funds, exact-funds, unknown/malformed, unowned-equip, and incompatible-place paths preserve nonnegative valid state and produce explicit feedback where applicable.
- Only owned modules can be placed. Only owned rigs can be equipped. Purchases do not silently equip. Hardware and module changes capture the prior metrics and announce observed throughput, latency, memory, quality, thermal, CU, capacity, or operating-cost deltas.
- Upgrades is a fourth portrait navigation view. Its labeled route is money → compare → cost → buy → owned → equip/add → observed delta. Rig cards expose price, CU, memory, watts/thermal limit, reliability, maintenance, and comparison with the equipped rig. Module cards expose compatibility/role, throughput, latency, memory, quality, reliability, observability, per-job cost, and comparison with the active same-role module.
- The Build drawer now labels every card as locked, owned, or equipped. Locked cards open Upgrades. Owned cards support the retained tap/snap and real touch-drag paths. Selecting an owned module names replacement/reorder behavior and highlights only compatible slots; fixed source + three process positions + sink and the Shadow junction remain unchanged.
- Quick Start explains the complete purchase journey and pacing while keeping later expansion content explicitly deferred. Upgrades opens directly to the store rather than remaining below the long tutorial; Help returns to Build and always reopens the tutorial.
- Full run state persists through the Worker to local storage: money, ownership, equipped rig, active modules, workload, policies, queue/results, ledger, and metrics survive reload/resume and offline use. Safe schema-v3 states migrate; corrupt/stale/duplicate ownership falls back safely. Legacy preset-v1 records gain the Bedroom CPU while current presets include their rig.
- Content version is `pipeline-toy-3`; schema version is 4; scope-isolated service-worker cache is v5.
- Researchers, longer/multiple pipelines, newer-model content, creator/hype/fear systems, personal schedule, and all other Milestone 2+ systems remain absent.

## Plan requirements and D-006 coverage

| Requirement                             | Implementation                                                                                                             | Committed evidence                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Earned money and settlement loop        | Existing distinct workload payout/cost mechanics now begin at $0 and fund purchases                                        | Engine settlement tests; round-009 money case; round-012 first-purchase browser journey       |
| Three hardware choices with constraints | Bedroom, used GPU, workstation; price/CU/memory/power/heat/reliability/maintenance tradeoffs                               | Catalog/unit tests; Upgrades rig cards; retained M0 balance; round-012 exact-funds/equip case |
| Meaningful paid modules                 | Six paid choices with a measured benefit and a throughput/latency/memory/quality/reliability/observability/cost constraint | `upgradeBalance.test.ts`; Store comparisons; first-purchase/add browser case                  |
| Exact-once transactional ownership      | Worker commands check catalog, ownership, funds, and compatibility before commit; double activation cannot deduct twice    | Engine/worker malformed and purchase tests; round-012 double-click exact-funds case           |
| ≤5 / ≤15 pacing                         | Default path buys Precision Cleaner, then reaches Used GPU                                                                 | `npm run balance:upgrades`: 20,001 seeds, worst 4 and 14 successful jobs, 0 failures          |
| Discoverable module addition            | Locked/owned/equipped labels; locked-card Store route; selected compatible highlights; tap/snap and touch-drag             | Round-012 drawer-to-store/paid tap path; retained pointer/touch drag and drawer-pan cases     |
| Portrait/accessibility UX               | 320/393, 200% text, 44px targets, no horizontal document overflow, text states, accessible names                           | Round-012 two-width Store stress cases plus retained verifier accessibility suites            |
| Visible observed consequences           | Equip/place captures baseline and reports concrete deltas; Inspector remains available                                     | Engine equip/place tests; round-012 observed-delta assertions                                 |
| Persistence and migration               | Schema-v4 local run save, schema-v3 migration, preset-v1 rig default, malformed fallback                                   | Engine/worker restore tests; round-012 reload/offline/migration/corruption cases              |
| Root/Pages PWA and cache isolation      | Root and `/goldlocks-engine/` packages; cache v5 deletes stale same-scope caches only                                      | Root offline cases; Pages 2/2 online/cache/offline/Worker cases                               |
| Scope boundary                          | D-006 supersedes only D-005 criterion 6; plan unchanged; expansion systems absent                                          | `.agent/DECISIONS.md`, immutable playtest record, source/tree inspection                      |

## Prior verifier findings resolved or preserved

- V-001 through V-015 remain covered. No immutable report was changed.
- The verifier-owned round-010 pressure regression retains all original assertions. Its setup now explicitly restores Quantized Model + Interactive Chat and waits for schema-v4 persistence before reload, because reload intentionally preserves the preceding Full Precision/Batch configuration instead of resetting it.
- The Pages cache expectations advance from v4 to v5; stale-scope deletion and foreign-cache preservation assertions are unchanged.
- The prior human blocker B-005 remains honest. The new feedback authorizes redesign and promises a later test; it does not satisfy either human gate.

## Reproducible setup, startup, and verification

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
# Locked dependencies and ignored repository-local Chromium
./scripts/setup

# Deterministic loopback development server
./scripts/run
# http://127.0.0.1:4173

# Canonical clean check: setup, format, lint, typecheck, unit/property,
# both balance models, root/Pages builds, and both packaged browser suites
./scripts/verify

# Focused deterministic purchase pacing
npm run balance:upgrades

# Root packaged PWA browser acceptance
npm run test:e2e

# GitHub Pages package and scoped browser acceptance
npm run build:pages
npm run test:e2e:pages
```

Dependency cache: ignored `.cache/npm`. Browser cache: ignored `.cache/ms-playwright`. `npm run test:e2e` uses `./scripts/run-e2e`; Pages uses `./scripts/run-pages-e2e`. Both bind deterministic `127.0.0.1:4173`, wait for readiness, and let Playwright clean up the managed server.

The optional Playwright CLI wrapper was not used as evidence: its daemon attempted a user-home cache. All acceptance uses pinned project `@playwright/test` 1.61.1 and the repository-local browser. On this managed macOS host, direct Chromium launches can hit the known Mach-port denial; exact scoped reruns outside that sandbox boundary are the reproducible evidence path.

## Important architectural decisions

- Purchasing belongs inside the deterministic simulation/Worker boundary, not React/local UI state. Money, ownership, equip, baseline capture, feedback, event IDs, and save state therefore share one ordered command stream.
- Catalog price 0 defines starter-owned modules. Paid modules are data-driven rather than hard-coded UI products.
- Buying and equipping are separate commands. This prevents an accidental purchase from silently changing a running pipeline and makes exact-once behavior easy to inspect.
- Run persistence stores schema-versioned simulation state. Runtime restore validates current state before recalculation; schema-v3 migration accepts only known compatible catalog/slot data and safe numeric values. Unknown/current corrupt states restart safely.
- The authorized redesign does not alter `plan.md`; D-006 is the scoped exception and explicitly defers the requested longer pipeline, researchers, newer-model content, and hype economy until later evidence.
- Store UX uses textual state and explanations rather than color or screenshots as the source of truth. Browser assertions check the full journey; visual inspection supplements them.

## Known limitations and risks

- The new human session is not yet supplied. Device, exact uninterrupted duration, reconfiguration timestamps/count, prompting, two complete explained tradeoffs, and proceed/redesign conclusions remain unknown.
- Starter catalog alternatives remain owned to preserve the existing Pipeline Toy repertoire and every retained regression. The six new variants and two alternate rigs form the paid progression layer.
- No selling/refunds. This is deliberate D-006 scope, not a missing transaction path.
- The queue remains aggregate rather than workload-tagged; changing workload before resolution changes queued processing/payout basis.
- Browser acceptance uses pinned Chromium. Physical-device battery/thermal behavior, platform-specific screen-reader output, optional haptics/audio, and non-Chromium browsers remain unverified.
- localStorage is the bounded persistence mechanism. Storage denial leaves the current session playable but cannot provide cross-reload durability.
- Wall-clock callback cadence can vary under browser throttling; ordered fixed tick quanta remain deterministic.
- Implementer does not push or deploy. Exact-SHA remote publication remains Orchestrator work after fresh verification.

## Checks executed before final candidate

- `./scripts/verify`: final PASS from locked dependency installation through packaged browser acceptance. It includes formatting, lint, typecheck, 42/42 unit/property/configuration/migration/purchase tests with coverage thresholds, both balance models, the root and Pages builds, 34/34 root browser cases, and 2/2 Pages browser cases.
- `npm run balance:upgrades`: included final PASS, 20,001/20,001 seeds; zero failures; module affordable by successful job 4 worst case; alternate rig by job 14 worst case; maximum 23 attempts to 15 successes.
- The first canonical attempt exposed formatting in the handoff and an engine test; formatting was corrected. The next full attempt passed every non-browser check and 33/34 root browser cases, exposing a real semantic defect: a locked module was marked disabled even though its action was to navigate to Upgrades. The card is now an enabled navigation control with explicit locked/buy labeling. Focused round-012 rerun passed 5/5 before the final canonical 34/34 result.
- Focused offline and pressure rerun after cache/persistence setup repair: PASS 3/3.
- `npm run test:e2e:pages`: initial sandboxed Chromium launch denied at zero runtime by the known macOS Mach-port boundary; exact scoped rerun and final canonical run PASS 2/2.
- Visual capture at 393 and 320/200% found the tutorial/store hierarchy defect; fixed by showing Quick Start only in Build and making Help reopen it there.

## Checks not run

- GitHub Actions push/deployment/live exact-SHA validation: intentionally not run by the Implementer.
- Required post-purchase 30-minute human playtest: user promised it after deployment; no result exists yet.
- Physical mobile device, non-Chromium browser, battery/CPU/thermal profile, and actual assistive-technology output: infrastructure not supplied.
- Milestones 2–6 and expansion acceptance: explicitly outside D-006.

## Exact remaining human gate input

After the candidate is committed, pushed, and deployed, record the tested candidate SHA, device, date, and an uninterrupted thirty-minute session. Include voluntary reconfiguration timestamps/count, prompting status, at least two participant-explained tradeoffs involving purchases/pipeline constraints, an explicit assessment of whether the economy is interesting without narrative spectacle, and a proceed/redesign conclusion.
