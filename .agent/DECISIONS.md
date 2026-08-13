# Product decisions

## D-001 — Gate-limited first candidate

- **Decision:** Round 001 implements Milestone 0 and Milestone 1 only.
- **Reason:** `plan.md` forbids Bedroom Vertical Slice and later systems until the Pipeline Toy exit gate has evidence. No 30-minute voluntary human playtest evidence exists in the repository.
- **Interpretation:** The creator event and research project in the Milestone 0 numeric prototype are aggregate balance-model inputs only. They are not player-facing creator or research systems and do not bypass the Milestone 1 gate.
- **Reversal condition:** Proceed to Milestone 2 only after human playtest evidence shows players voluntarily reconfigure the constrained pipeline for at least 30 minutes and can explain its tradeoffs.

## D-002 — Minimal browser stack

- **Decision:** Use React, TypeScript, Vite, a dedicated Web Worker, and browser APIs; do not add Zustand, XState, PixiJS, or a persistence database yet.
- **Reason:** Milestone 1 has one UI state owner and a lightweight CSS flow renderer. Additional libraries do not yet solve a demonstrated pipeline-toy need.
- **Reversal condition:** Add a state/workflow/rendering library only when a later gate-approved milestone demonstrates the need.

## D-003 — Constrained compatible process slots

- **Decision:** The pipeline has fixed source, three compatible process positions, and sink slots, plus one defined shadow-evaluation junction.
- **Reason:** This supports touch drag/snap, replacement, compatible reordering, limited split/merge, and observable ordering failures without introducing the explicitly deferred unrestricted factory map.

## D-004 — Transactional numeric command boundaries

- **Decision:** Runtime numeric controls accept only finite JavaScript numbers. Malformed/non-finite tick, allocation, reserve, queue, reset-seed, and worker-init values are exact no-ops: no tick, RNG, resource, queue, metric, event-sequence, or ledger change. Finite values retain the existing bounded clamp/truncate semantics. Standalone seed creation canonicalizes malformed seeds to the deterministic non-zero fallback.
- **Reason:** TypeScript types do not validate Worker messages or other runtime callers. Rejecting ambiguous operation values before calculation and validating every resulting versioned numeric category before commit prevents `NaN`, infinities, unsafe integers, and JSON `null` substitutions from corrupting deterministic state.
- **Reversal condition:** Introduce a versioned command-error response only when player-facing diagnostics require one; keep rejection transactional across the schema migration.

## D-005 — Playtest-derived first-session comprehension contract

- **Decision:** The 2026-07-16 informal usability feedback is accepted as authoritative round-009 redesign scope within Milestones 0–1. Acceptance requires all of the following to be independently executable and measurable:
  1. A first-run tutorial that precisely answers the observed questions, can be dismissed, persists dismissal across reload, and always reopens from a large labeled Help control.
  2. A legible choose → queue → run → complete → payout loop, workload-specific gross rewards, operating costs, failed-job payout behavior, and visible earned-money settlement feedback.
  3. Runtime-validated local presets with labeled deletion, explicit confirmation, persistent removal, and one-step undo that also persists when used.
  4. Visible definition of CU as normalized Compute Units, current memory use versus full rig capacity, and an explicit distinction between held-back reserve and pipeline-usable memory.
  5. Current-pressure guidance that names mechanically valid actions involving compute budget, reserve, compatible modules, or workload while avoiding unsupported single-cause or guaranteed-outcome claims.
  6. Honest progression copy: hardware purchasing belongs to Milestone 2 and is unavailable before the Pipeline Toy gate; the current toy improves through module choice/order, workload, compute/memory policies, and Shadow evaluation. No pre-gate upgrade shop.
  7. Animation framed and tested as visual-only, with all reduced-motion guarantees retained and no effect on simulation time.
  8. A one-handed, bounded 1×/4×/16× simulation-time control, visibly separate from animation and pause, whose fixed tick quanta preserve deterministic valid resources, settlements, and ledger identities.
  9. Existing 320/393 portrait, 200% text, 44 CSS-pixel controls, no-horizontal-overflow, touch drag/pan, screen-reader labeling, root/Pages subpath, installable PWA, service-worker cache isolation, and offline reload requirements remain regression gates.
- **Evidence:** `.agent/playtests/2026-07-16-informal.md` records the feedback without upgrading it into Milestone 0 or Milestone 1 gate evidence. Unit/property and pinned Playwright checks map directly to each criterion in `.agent/HANDOFF.md`.
- **Experiment-record policy:** Every future playtest or experimental observation gets a new immutable `.agent/playtests/YYYY-MM-DD-*.md` record. Accepted implementation changes are promoted into this decision log. `plan.md` changes still require explicit user authorization.
- **Reason:** The feedback showed a comprehension failure despite positive visual reception. Durable, testable mechanics communication is required before another sustained playtest can meaningfully evaluate the pipeline toy.
- **Reversal condition:** Supersede only through a later explicit product decision grounded in a new immutable playtest record; do not erase the original observation.

## D-006 — Bounded purchasing redesign before repeating the kill gate

- **Decision:** The 2026-07-16 purchase-loop feedback is an explicit user-directed Pipeline Toy redesign. It supersedes only D-005 criterion 6: implement a bounded purchase, ownership, inventory, and equip/add economy for hardware rigs and pipeline modules now, even though `plan.md` otherwise places hardware purchasing in Milestone 2. `plan.md` remains unchanged.
- **Reason:** The user played the deployed toy for less than thirty minutes and liked the available interactions, but could not meaningfully evaluate playability because earned money could not buy more capable items. Purchasing is therefore a prerequisite for another honest thirty-minute kill-gate attempt, not evidence that the gate passed.
- **Required behavior:** Starter rig/modules are owned. Existing three data-driven rigs and additional module tradeoffs have visible prices and consequences. Successful settlements fund purchases. A purchase deducts exactly once and creates durable ownership; only owned compatible items can be equipped or added. Already-owned, insufficient-funds, invalid/malformed, incompatible, exact-funds, and repeated-activation paths remain safe, explicit, deterministic, and nonnegative.
- **Decision information:** Compare price and applicable compute/CU, memory, thermal/power, reliability, throughput/latency, quality, operating/maintenance cost, observability, and compatibility before buying. Every upgrade creates a constraint; no universally dominant item. Equip/add produces visible observed-delta feedback.
- **Pacing gate:** Across the deterministic seed sweep, a competent default path can fund a meaningful module no later than five successful starter jobs and the first alternate rig no later than fifteen successful jobs, including the first module purchase.
- **Interaction gate:** At 320 and 393 CSS pixels, including 200% text, the visible journey is money → compare → cost → buy → owned → equip/add → observed delta. Locked/purchasable, owned, compatible, equipped, replace, and reorder states are discoverable by text, tap, keyboard/screen-reader names/states, and applicable touch-drag without color-only meaning or horizontal document overflow.
- **Persistence gate:** Schema-v4 state migrates safe schema-v3 input. Ownership, money, equipped rig, active modules, and run state survive reload/resume and offline PWA use. Malformed or stale data recovers without corruption or duplicate deduction.
- **Scope boundary:** This does not authorize the rest of Milestone 2 or later content: no personal schedule, expanded savings/electricity system, research characters or researcher unlock, longer/multiple pipelines, newer-model content, creator/hype/fear/reputation systems, labor, narrative expansion, or laboratory progression.
- **Evidence:** `.agent/playtests/2026-07-16-purchase-loop.md` records the observation without upgrading it into either human milestone gate. Deterministic and pinned-browser acceptance is mapped in `.agent/HANDOFF.md`.
- **Reversal condition:** Reassess after the user's promised uninterrupted thirty-minute session on the deployed purchasing candidate; promote later expansion only through new evidence and an explicit decision.

## D-007 — Owner-authorized Workstation Expansion I

- **Decision:** The owner accepts the deployed purchasing Pipeline Toy as good enough to continue and explicitly directs one bounded progression slice without structured telemetry. B-005 no longer automatically blocks this owner-authorized implementation or its independent automated verification. This is a process waiver, not a claim that the original Milestone 0 economy-interest or Milestone 1 uninterrupted thirty-minute human gates were measured or passed.
- **Evidence policy:** `.agent/playtests/2026-07-16-progression-expansion.md` is the immutable qualitative source. Exact device, duration, timestamps, and structured interaction counts are unknown. Casual feedback remains valid iteration input. Never rewrite prior reports or represent this waiver as empirical gate evidence.
- **Required slice:** A data-driven, durable, exact-once Workstation Expansion purchase expands the one active starter pipeline from three to at least six usable process slots. New slots start empty/bypassed; owned compatible modules may be tapped, keyboard-selected, replaced, reordered, or touch-dragged across every unlocked position. At least eight distinct workloads exist, four initially available and at least four unlocked through explicit deterministic progress/capability requirements.
- **Task/economy contract:** Every waiting or active task retains workload identity, queue-time locked gross quote, and accepted payout basis. Actual operating cost is configuration dependent. Visible workload cards show current deterministic demand/quote, trend/reason, estimated cost/net or honest uncertainty, and a warning when cost approaches or exceeds quote. Successful completion saturates that workload and lowers later quotes; demand recovers with simulated time so no market is permanently dead. Clearing removes waiting tasks only, never the partially processed active task, and never pays, refunds, changes demand, or corrupts other state.
- **Pacing/time contract:** Fixed bounded 1×/4×/16×/64× quanta are schedule-equivalent and remain separate from animation and pause. Preserve the first-module-by-five-successes and alternate-rig-by-fifteen-successes bounds. A competent default strategy reaches expansion in roughly 8–16 simulated hours; the fastest valid strategy cannot own the entire rig/module/expansion catalogue before 24 hours; representative competent play can complete it by 72 hours. Repeated single-workload farming eventually becomes nonpositive expected margin, while rotation and time recovery retain at least one profitable early/midgame path.
- **Portrait contract:** Bottom tabs are the sole global page navigation. Remove duplicate in-page page-opening controls; keep contextual actions. Use compact summaries and progressive disclosure rather than smaller text or targets. The expanded pipeline must remain usable at 320/393 CSS pixels and 200% text with 44 CSS-pixel controls, keyboard/tap/touch-drag alternatives, reduced motion, no horizontal document overflow, and no required pinch zoom.
- **Persistence/test contract:** Version and migrate current schema-v4/content-v3 saves plus existing presets. Persist purchase, active capacity/topology, per-task identity and quote, unlock progress, demand, equipment, money, RNG, and integrity across reload/resume/offline. Reject or safely recover malformed current/legacy values transactionally. Unit/property/balance and repository-pinned Playwright cover both portrait widths, accessibility, migration, failure/recovery, duplicate activation, demand saturation/recovery, queue clearing, 64× equivalence, and real visual inspection.
- **Scope boundary:** No researchers/characters, hype/fear/attention/reputation economy expansion, transient model brands, multiple or parallel pipelines, narrative, startup, labor, or later systems. A longer single pipeline is the only topology expansion in this slice.
- **Reversal condition:** Reassess pacing, density, market legibility, and playability from later casual or structured owner feedback. Promote deferred systems only through a new explicit decision.

## D-008 — Redeploy-safe installable PWA contract

- **Decision:** The owner requires the production game to remain installable at both the root and GitHub Pages scopes, and an installed player who refreshes while online after a redeploy must receive the newest complete deployed build. This is a production reliability requirement within the existing PWA scope; it does not authorize new game systems or alter `plan.md`.
- **Deployment identity:** Every production build derives a deterministic deployment ID from the shipped source inputs, selected base path, and an explicit build marker when a deployment system supplies one. The ID is injected into the app, generated worker, and inspectable `build-info.json`; its cache name is scope-isolated as `goldilocks-shell:<scope>:<build-id>`. A changed deployment input or marker therefore cannot reuse the old app/worker/cache identity.
- **Integrity/update contract:** Root and `/goldilocks-engine/` builds retain install manifests with relative start URL/scope, standalone display, and icon metadata. Registration uses the versioned worker URL plus `updateViaCache: "none"`; that registration starts one browser update check, rather than racing it with a duplicate explicit update. The generated worker embeds this build's exact sorted JavaScript/CSS asset paths; the fetched manifest is an assertion, not authority. It rejects malformed/non-array, non-string, duplicate, cross-origin, out-of-scope, reordered, omitted, or unexpected entries; it also verifies build metadata identity and successful response bodies for every core/expected asset before opening the candidate cache. Only that complete candidate cache may call worker-owned `skipWaiting`; activation deletes only obsolete Goldilocks caches for its own scope, never game localStorage or other applications' caches. It claims clients except when a live client belongs to a more-specific Goldilocks scope represented by its own scoped cache, so root activation cannot take over a live Pages shell; an orphaned nested cache alone does not suppress a root claim. The root page observes its registration activation and converges by one verified reload when that live-scope exception applies. A controller URL query is not trusted by itself: static hosts can serve B worker bytes for a retained `sw.js?build=A` request. A controlled page therefore verifies the worker's embedded build/cache response against its scope; on a query/body mismatch it event-driven re-registers that verified build under its matching versioned URL, then reloads at most once only after controller URL, worker response, and cache identity agree. No polling or sleeps are permitted, avoiding an indefinitely mixed app/worker state.
- **Failure and offline contract:** A partial, malformed, or unavailable candidate deployment never activates: its incomplete cache is removed and the previous complete worker/cache remains usable. Offline clients necessarily continue on their last fully installed version; they update only after connectivity returns and the normal online refresh/update path can complete. Save schema and localStorage data survive activation, reload, and cache cleanup without duplicate simulation effects.
- **Acceptance evidence:** Repository-pinned Playwright builds A and B fixtures for both scopes, proves browser installability through CDP, starts A, creates a non-default durable save, redeploys B on the same origin, and proves two controlled clients converge through a single event-driven reload to app/controller/worker-message/cache identity B with A removed. It proves save preservation and B offline reload; rejects unavailable, omitted/null, duplicate, and cross-origin/out-of-scope manifests plus a required shell-response failure while preserving/offline-recovering A; proves static-host A-query/B-body repair without a page-initiated reload; proves root activation cannot evict a live independently installed Pages shell; and proves a stale Pages cache without a live Pages client does not block root control. The full canonical browser gate includes this suite.
- **Reversal condition:** Replace this contract only with an explicit platform migration that supplies an equivalent atomic update, rollback, offline, and persistence guarantee.

## D-009 — Automated quality and release evidence replaces mandatory manual gates

- **Decision:** The owner explicitly supersedes D-001, D-006, and D-007 only where they make a human play-duration, tester-understanding, recording, or structured manual-validation session a progression or release blocker. Their prior observations, bounded scopes, and historical evidence remain intact; this is not a claim that any former human gate was measured or passed.
- **Advancement/release evidence:** Complete every applicable `plan.md` requirement; run deterministic unit, property, scenario, and balance checks; run repository-pinned browser, UX, and accessibility acceptance; obtain a fresh independent Verifier `PASS`; then successfully deploy the exact accepted SHA/version. The deployed latest version must expose the accepted build identity before it is treated as released.
- **Feedback policy:** Casual owner play and opt-in player research are useful, optional feedback. Record any new experiment as a dated immutable `.agent/playtests/YYYY-MM-DD-*.md` observation and promote accepted product changes to this decision log or an explicitly authorized plan update. Missing feedback, duration, recording, or telemetry never blocks an otherwise evidenced candidate.
- **Quality interpretation:** The former desired outcomes—meaningful pipeline tradeoffs, understandable failures, viable strategies, replay variation, and coherent progression—remain product requirements. They are now demonstrated through explicit testable acceptance criteria and may be refined from optional feedback rather than inferred from an unstructured session.
- **Scope boundary:** This changes no game-content authorization, no immutable playtest/verification record, and no requirement for independent verification or exact-SHA deployment.
- **Reversal condition:** Restore or replace this evidence policy only through a later explicit owner decision with equally reproducible acceptance and release criteria.

## D-010 — Bounded Bedroom Career Loop

- **Decision:** Implement the authorized Bedroom Career Loop as one durable, deterministic extension of the existing workstation. The player receives one four-hour evening window, allocates it among freelance delivery, one competition, one local product, and product maintenance, then explicitly runs the scheduled evening. Unused time is never an income or progress source.
- **Economic contract:** Every career route records configured operating cost, electricity cost, paid cost, and unpaid cost in the existing money model. Savings are a distinct, explicit reserve. Competition and product routes deliberately defer or risk income; freelance is immediately useful but does not advance their milestones; maintenance protects released-product revenue rather than making money. The resulting exit requires durable savings, a submitted competition entry, a released product, and an unlocked durable local-model tier.
- **Model contract:** Lantern 3B, Harbor 7B, and Kiln 13B are fictional durable technical tiers rather than transient brands. Q4/Q8 alter the installed model-stage tradeoff in the one existing pipeline; they do not create another pipeline, queue, or automatic upgrade path.
- **Offline-policy contract:** Background recovery is opt-in and is limited to finite freelance hours within player-configured operating-cost, electricity-cost, and reliability limits. It defers to a pending player schedule, cannot create unpaid cost, and can never buy, submit, release, or modify competition/product progress. Its bounded decision and reason are persisted visibly.
- **Persistence and safety:** Schema-5 saves migrate in place to schema 6 with initialized career data; malformed career values safely recover through the normal state validator. Schedule edits are sent as one Worker batch with the run command so a React/Worker race cannot run a stale partial allocation.
- **Scope boundary:** This authorizes personal schedule, savings/electricity, local-model workloads, quantization, freelance work, one competition, one product, and bounded offline policy only. It does not authorize additional pipelines, transient model catalogues, characters, attention systems, narrative, labor, startup, or laboratory systems.
- **Evidence policy:** Engine invariants/property scenarios, the deterministic career balance sweep, and pinned portrait browser cases cover route viability, opportunity cost, no-wait exploit, migration, persistence, offline failure/recovery, 320/393 controls, keyboard operation, 200% text, and reduced motion. Fresh independent verification remains required.
- **Reversal condition:** Rebalance routes, tier criteria, offline caps, or the exit condition only with a later explicit decision backed by deterministic and browser evidence.

## D-011 — Evaluation, Failure, and Replay

- **Decision:** The owner authorizes a bounded deterministic extension of the existing single-pipeline Bedroom Career loop: public versus private evaluation, causal failure/reliability consequences, five replayable endings, and information-only diagnostic memory. It is a complete in-scope product slice, not a prototype.
- **Evaluation contract:** Public previews expose a visible benchmark proxy. Paid private evaluation records coverage, cost, and a categorical evidence assessment only (`not-run`, `inconclusive`, `credible`, `at-risk`, or `failed`); no latent exact capability or hidden private numeric score is persisted or shown. Repeated public previews can raise durable leakage risk. Private coverage can lower leakage and shifted-input uncertainty but never guarantees success.
- **Failure contract:** Product service work can accumulate distribution-shift risk and recorded reliability incidents. Capital commitments against unresolved constraints can accumulate hardware debt and unpaid-cost pressure. Repeated model/quantization changes can create tutorial-loop warnings. A bounded append-only ledger records warnings, ignored warnings, incidents, and each ending's direct causes, contributing factors, correlations, player-visible hypotheses, and unknowns.
- **Ending contract:** The deterministic, command-reachable endings are Public Leaderboard Hero, Product Reliability Collapse, Hardware Debt Spiral, Tutorial Loop, and Honest Independent Builder. Every automatic ending requires its specific accumulated causal pattern, irreversible choice or history, and escalating/ignored warning evidence; Honest Independent Builder is an explicit player conclusion gated by visible sufficient evidence. A closed run is frozen except for deterministic same-seed restart or next-seed replay.
- **Meta-progression contract:** Completing an ending records one diagnostic unlock and completed-ending history across resets. Unlocks expose explanation only—no production, money, quality, reliability, coverage, or other flat gameplay bonus. Each replay begins with a fresh pipeline/economy state.
- **Persistence and compatibility:** Schema 6 / content `bedroom-career-1` migrates in place to schema 7 / content `evaluation-replay-1`, preserving prior career data and initializing evaluation, ending, and meta state. Current malformed or dangling evaluation/postmortem data safely falls back through the existing integrity validator. The bounded ledger retains referenced postmortem evidence for a frozen ending.
- **Evidence policy:** Fixed ending scenarios, arbitrary command/persisted-state properties, 121-seed deterministic balance sweep, schema migration/restore coverage, and repository-pinned Playwright cover public/private distinction, payment failure/recovery, 320/393 portrait constraints, keyboard/touch controls, reduced motion, text scaling, causal postmortem accessibility, reload/restart/meta persistence, offline reload, and retained PWA/update recovery suites.
- **Scope boundary:** This authorizes no researchers/characters, creator/hype/fear/attention systems, audience economy, extra or parallel pipelines, startup/labor/laboratory progression, narrative expansion, or transient model catalogue. Existing deterministic local tiers and the one Bedroom Career loop remain the sole technical/economic context.
- **Reversal condition:** Change causal thresholds, evidence bands, ending criteria, or diagnostic language only through a later explicit decision with deterministic and browser evidence; never replace accumulated-cause endings with opaque random rolls.

## D-012 — Initial-color emoji command deck

- **Decision:** Rehaul the complete current Bedroom UI using the initial forest/acid/amber/cyan terminal palette and one reusable code-native emoji/Unicode visual language. Use the approved synthesis: compact rail for Build/live observation, warm cards for Jobs/Career, dispatch progression for active jobs, comparison deltas for Upgrades, and gauges/causal line grammar for Inspect. Do not use generated raster art, decorative pipes, a Webdings dependency, or page-specific themes. Reuse the same emoji for semantically interchangeable components.
- **Workstation contract:** Workstation Expansion I remains one ordered pipeline. Starter renders source + three process positions + sink; expansion renders source + six process positions + sink. New positions begin empty/bypassed, and expansion adds no compute, memory, hardware, queue, second pipeline, or manual stage-stepping mechanic.
- **Information contract:** Compact summaries may replace always-visible prose only when every current description, live stat, consequence, requirement, accounting/evidence qualification, uncertainty label, and contextual action remains available from a labeled item-level details disclosure using current catalog/simulation data. Touch, pointer, keyboard, screen-reader, 200% text, focus-return, and reduced-motion paths expose equivalent information.
- **Interaction contract:** The first actionable pipeline control and the Jobs selected workload plus Queue 1 action appear above bottom navigation at required short portrait sizes. The expanded rail has no nested vertical scroll trap. Bottom tabs remain the only global routing; Build/Run is presentation only, and the Worker/tick engine remains authoritative.
- **Scope boundary:** This is a UI architecture, styling, and interaction-hierarchy change only. It adds no simulation command, content, balance, schema, progression, character, narrative, audio, haptic, remote asset, raster-asset pipeline, or new navigation destination. Existing deterministic, persistence, offline, root/Pages, PWA update, failure/replay, and verification contracts remain mandatory.
- **Evidence policy:** `plan.md` §20.5 is the detailed source of truth. Component tests, pinned Playwright at 320/393 widths including 320×693, 200% text/reduced motion/touch/keyboard/offline paths, above-fold geometry, real screenshot inspection of all five tabs in starter/expanded states, canonical `./scripts/verify`, and a fresh independent Verifier PASS are required.
- **Reversal condition:** Change the palette, shared glyph grammar, pipe-free ordered rail, or item-details contract only through a later explicit owner decision with updated browser and accessibility evidence.

## D-013 — First-session management refinement

- **Decision:** The owner accepts the deployed command deck as the visual and interaction foundation and authorizes the bounded `plan.md` section 20.6 refinement before Research. The dated expert session is useful optional evidence under D-009: it found no P0 defect, rated consistency strongly, and identified early safe batching, cross-tab placement leakage, and explanation-heavy onboarding as P1 issues. Its numeric fun/return ratings are diagnostic, not release thresholds or representative retention data.
- **Preserve:** Queue-time locked quotes, transparent gross/cost/net settlement, advance risk warnings, configured equipment deltas, causal evidence, fixed deterministic speed semantics, bottom-tab navigation, one-pipeline topology, the forest/acid/amber/cyan command deck, and every persistence/PWA guarantee remain mandatory.
- **First-session contract:** Guide queue, settlement, then first buy/install as three finite sequential objectives. Keep complete explanation in Help and Details. The prompt may highlight the sole bottom navigation and contextual action but cannot introduce duplicate page-routing controls.
- **Placement contract:** Details inspection never creates a placement transaction. Placement starts only from an explicit action, may survive the direct Upgrades-to-Build handoff, and is otherwise owned by Build. Jobs, Career, Inspect, Cancel, completion, and incompatible restoration clear it without pipeline mutation. The Build badge and Snap targets represent only a real pending placement.
- **Decision-cadence contract:** Before the first meaningful module purchase, provide at least two forecastable, materially viable routes. Queue 10/64x remains convenient but cannot be the universally dominant zero-intervention starter policy. At least one non-safe alternative has a distinct positive expected payoff and recoverable visible constraint; not every alternative may be framed as guaranteed loss.
- **Presentation contract:** Primary cards lead with one rounded decision metric and outcome language while exact live accounting, warnings, evidence, and uncertainty remain in Details, Inspect, and settlement. Add restrained reduced-motion-safe settlement, milestone, recovery, and next-affordable feedback without hidden rewards or casino pressure.
- **Scope boundary:** No Research, character, creator, fear, audience, workforce, startup, laboratory, extra-pipeline, or narrative system is authorized by this refinement. Bounded current-workload or contract variation may be used only when it preserves workload identity, locked quotes, configured cost, deterministic demand, Worker authority, and ledger semantics.
- **Evidence policy:** Preserve the immutable observation at `.agent/playtests/2026-07-23-command-deck-ux-expert.md`. Deterministic/balance scenarios, component tests, pinned 320/393 portrait browser coverage, 200% text, touch/keyboard/reduced motion, reload/offline/malformed recovery, all retained canonical checks, fresh independent Verifier PASS, and exact-SHA deployment are required. A repeated diagnostic expert playthrough may supplement and refine this evidence but, under D-009, is not an advancement or release requirement.
- **Reversal condition:** Change the accepted command-deck foundation, transparent accounting/causal contracts, or advance from this refinement to Research only through later owner direction backed by the applicable reproducible evidence.

## D-014 — Durable first-session command boundary and explicit scenario fixtures

- **Decision:** The three-step first-session rail is enforced by the deterministic simulation command boundary, not only hidden or disabled React controls. A genuinely new run accepts exactly one Interactive Chat job before its first settlement; queued alternatives and batches are rejected until that settlement is recorded. Existing saves remain established sessions through a safe, resealed migration path.
- **Scenario boundary:** `createEstablishedScenarioState()` is an explicitly documented deterministic fixture for long-run balance and regression scenarios. It is never a production startup path or player command, so tests can model an established workstation without creating a bypass around onboarding.
- **Gesture boundary:** A touch beginning on a module-library card keeps native horizontal drawer panning when movement is horizontal; an unambiguously non-horizontal drag begins the same explicit placement transaction used by pointer/tap paths. Manual reduced-motion cancels running transitions immediately.
- **Reason:** D-013 requires onboarding to survive reload/offline recovery and placement to be intentional, while retained balance and browser regressions need a named way to test established-state behavior without silently evading the new first-session contract.
- **Evidence policy:** Engine migration/command tests, first-session route balance scenarios, pinned 320/393 Playwright coverage, drawer touch-pan/drag cancellation coverage, and the canonical verification command remain required.
- **Reversal condition:** Relax or replace the command guard, scenario fixture, or gesture distinction only through an explicit product decision with updated deterministic and browser evidence.

## D-015 — Corruption-safe first-session recovery and cancellation focus

- **Decision:** A current schema-7 save may be resealed after benign persistence damage only when its first-session progress is coherent with the persisted pipeline. Queue-start state has no queued task; observe state names the sole queued or active Interactive Chat starter; advanced unsealed state must also corroborate that starter with the recorded Interactive Chat settlement. A malformed, dangling, fabricated, or uncorroborated current guide falls back to a fresh guided run rather than unlocking queue batches. Validly sealed established saves and schema-7 saves that predate the guide retain the D-014 compatibility migration.
- **Recovery boundary:** Clearing the waiting accepted starter atomically resets the guide to its initial Queue 1 state. It never leaves a persisted observe-settlement rail that has no remaining starter task.
- **Focus boundary:** Beginning placement from Build Details retains the invoking module control as the cancellation origin. Escape and the explicit Cancel action clear the pending transaction and return focus to that still-connected origin; completion, incompatible recovery, touch cancellation, and ordinary tab changes clear state without fabricating a focus target.
- **Reason:** The rail is a durable command authorization boundary, so field-shaped state must not convert save repair into a Queue 10 bypass or a restart-persistent deadlock. Cancellation must preserve keyboard continuation after an explicit placement action.
- **Evidence policy:** Candidate-owned engine tests plus immutable round-039 verifier unit/browser regressions cover fabricated current guide data, clear/reload/retry recovery, Escape, and explicit Cancel at 393px. The canonical verification command remains required.
- **Reversal condition:** Relax this fail-closed recovery or focus-return rule only through explicit product direction with updated deterministic, persistence, and browser evidence.

## D-016 — Integrity-authoritative completed-guide recovery

- **Decision:** A schema-7 record missing `firstSession` is eligible for the documented pre-guide migration only when its original integrity seal validates before migration supplies the legacy-complete sentinel. An integrity-stale record missing that field falls back to a fresh guided run.
- **Recovery boundary:** An integrity-stale current record claiming `complete` must corroborate the recorded meaningful paid module through both owned inventory and a compatible currently installed pipeline slot, in addition to D-015's starter settlement evidence. Mere ownership cannot recover the Queue 10 relaxation. A valid original integrity seal remains authoritative historical evidence of the completed buy/install objective, so legitimate later removal or replacement of that module remains valid and reloadable.
- **Reason:** This separates authentic pre-guide saves and legitimate post-onboarding reconfiguration from field-deletion or ownership-only recovery bypasses, without turning the finite onboarding objective into a permanently pinned pipeline topology.
- **Evidence policy:** Candidate-owned engine tests and immutable round-040 verifier unit/browser regressions cover stale missing-guide fallback, sealed legacy migration, uninstalled ownership forgery, topology-backed stale recovery, and sealed later reconfiguration. Canonical verification remains required.
- **Reversal condition:** Change the seal authority, legacy migration, or recovery corroboration rule only through explicit product direction with updated persistence and browser evidence.

## D-017 — Ledger-correlated stale first-session repair

- **Decision:** A current schema-7 save whose integrity seal is stale may retain advanced first-session progress only when the retained ledger contains both the exact Interactive Chat settlement record for the recorded starter task and, once a module is named, the exact paid `BUY_MODULE` accounting record for that module. A stale `complete` guide also retains D-016's owned-and-installed topology corroboration. Current money, inventory, installed topology, and `lastSettlement` are insufficient by themselves because they can describe later work or fabricated state rather than the required commands.
- **Seal and history boundary:** A valid original seal remains authoritative for sealed legacy migration and legitimate post-completion reconfiguration, including later removal or replacement. The ledger is intentionally bounded; if its required onboarding evidence has rolled out, an integrity-stale save falls back to the fresh guided run rather than treating mutable fields as proof.
- **Reason:** This distinguishes a fabricated owned/installed module from a real paid module command while preserving benign stale-save recovery after later settlements overwrite `lastSettlement`.
- **Evidence policy:** Candidate-owned engine tests plus immutable round-041 verifier unit/browser regressions cover forged ownership, forged installed completion, pending paid purchase, later-work recovery, raw 320×693 and 393×742 geometry, and existing first-session/migration paths. Canonical verification remains required.
- **Reversal condition:** Change the required retained records, bounded-history fallback, or integrity authority only through explicit product direction with updated deterministic and browser recovery evidence.

## D-018 — Short-portrait Jobs navigation safety reserve

- **Decision:** At the raw 320×693 Jobs entry state, the selected playable
  workload label and Queue 1 action must retain at least 8 CSS pixels of
  measured clearance above fixed Primary navigation. The same measurement is
  retained at 393×742. Equality at the navigation boundary is not sufficient.
- **Layout boundary:** Only narrow, short Jobs content contracts its inherited
  main-flow spacing. Build ordering, normal 393×742 rhythm, time-speed
  semantics, Worker authority, and bottom-tab routing remain unchanged.
- **Reason:** Exact Ubuntu evidence for V-052 showed a 1.078125px Queue 1
  overlap despite a macOS boundary pass. A quantitative reserve makes the
  required raw portrait affordance robust to platform font metrics rather than
  relying on subpixel coincidence.
- **Evidence policy:** Candidate-owned pinned Playwright measures raw
  `.app-scroll-region` position and both selected-workload and Queue-action
  clearance at 320×693 and 393×742. Retained 200%-text, short-portrait,
  command-deck, clear-waiting, reload, offline, and canonical checks remain
  mandatory.
- **Reversal condition:** Change the 8px floor or short-portrait spacing only
  through explicit product direction backed by cross-platform portrait and
  accessibility evidence.

## D-019 — App-session Career schedule draft

- **Decision:** The four-route Career composer is an App-session-only draft.
  The Worker remains authoritative for committed schedule, outcomes,
  persistence, restore, reset, replay, and rejection messages. An unfinished
  draft is never written to storage and is not a Worker command on its own.
- **Synchronization boundary:** Initialize from the restored Worker schedule at
  app-session start. Ignore ordinary Worker publication identity, ticks,
  speed/pause changes, and tab remounts. Replace the draft only after a Worker
  confirms a completed evening, a reset/replay, or a run ending. A reload may
  discard an unrun draft and restore only the durable Worker schedule.
- **Command boundary:** Running an evening sends the existing ordered batch of
  all four `SET_EVENING_ALLOCATION` commands followed by one `RUN_EVENING`.
  Local quarter-hour/cap validation makes that batch finite and bounded; no
  Redux/Zustand/XState, schema change, extra persistence key, or new Worker
  command is introduced.
- **Atomic revision boundary:** A runtime-valid complete Career batch contains
  each route exactly once followed by `RUN_EVENING`. The Worker applies that
  known batch against an empty unpublished allocation schedule, then publishes
  only its final outcome. This lets a valid restored schedule be revised
  without an intermediate overbook rejection or partial durable schedule;
  unrelated command batches retain their established ordering semantics.
- **Exact-once UI boundary:** The existing durable Worker request ID is returned
  to the Career controller. It synchronously locks the singular Run control
  before posting and unlocks only after that request or a later monotonic
  acknowledgement is persisted and published. The lock is App-session UI state,
  not a simulation command or persistence field; a Worker rejection releases it
  while retaining the draft.
- **Failure boundary:** A Worker rejection leaves the valid local draft intact
  and remains visible in the Career composer until a later successful evening
  closes it.
- **Reason:** Worker ticks structured-clone nested allocation objects. Syncing
  a view-local draft from that object identity erased player work roughly every
  500ms, including between ordinary human-paced edits.
- **Evidence policy:** Candidate unit, Worker/protocol, durable-publication,
  and pinned Playwright coverage exercise cloned tick publications, 1×/64×,
  paused Jobs, tab visits, keyboard/touch entry, reload, malformed restore,
  rejection, one atomic durable evening, 320/393 portraits, and repeated
  human-paced interaction.
- **Reversal condition:** Change this ownership or persistence boundary only
  through explicit product direction with equivalent Worker, persistence, and
  browser evidence.

## D-020 — Storage-confirmed Career Run acknowledgement

- **Decision:** A Worker `STATE` response and a durable acknowledgement are
  distinct. A Career Run remains in flight after an in-memory response whose
  save fails; its request ID advances the App-session exact-once lock only
  after a successful persistence write has published a state that includes the
  request.
- **Recovery boundary:** Worker responses are ordered. Therefore a later
  successfully persisted Worker response, including a normal tick publication,
  safely acknowledges every previously observed request ID represented by that
  snapshot. This clears the Run lock without reposting the evening. While a
  save is failing, Career visibly explains that it is retrying, keeps Run
  disabled, and preserves the in-memory result so freeing storage can recover
  automatically.
- **Reason:** Treating every Worker response as durable allowed a failed
  localStorage write to unlock Run and invite a duplicate evening even though
  the first result would disappear on reload.
- **Evidence policy:** Candidate hook coverage and pinned 393px Playwright
  force `QuotaExceededError`, prove Run remains locked until a later persisted
  Worker state, check the visible recovery message, and retain
  the immutable round-052 verifier unit/browser regression. Canonical
  verification remains required.
- **Reversal condition:** Change the response/persistence distinction or the
  retry acknowledgement watermark only through explicit product direction with
  equivalent deterministic, storage-failure, and browser recovery evidence.

## D-021 — Career hierarchy remains presentation-only

- **Decision:** Phase 2 reorganizes the existing one-evening Career loop but
  does not alter route availability, progression, command semantics, state,
  or balance. All four existing evening routes remain available from the first
  evening. Product income and maintenance benefit communicate their existing
  lifecycle conditions; they are not new route locks.
- **Locked-state interpretation:** The required locked Career screenshot uses
  the existing locked local-model tier in the Model tiers and quantization
  disclosure. It demonstrates the applicable established Career capability
  lock without inventing a new route gate or mechanic.
- **Information boundary:** Current projections are pure views over the
  existing authoritative route/accounting functions. Compact money uses shared
  cents-or-mills precision while Details retains three-decimal accounting; the
  Worker, ledger, and Inspect remain authoritative.
- **Reason:** `plan.md` authorizes a Career action hierarchy and explicitly
  forbids new mechanics, pages, assets, framework, or theme work. A visual
  route lock would misrepresent the existing playable first-evening choice.
- **Evidence policy:** Catalog/projection/component tests plus pinned 320/393
  browser deck cover empty, partial, full, rejected, completed, locked,
  exit-ready, keyboard, touch, focus, text-scale, reduced-motion, disclosure,
  persistence, offline, and recovery behavior. Canonical verification remains
  required.
- **Reversal condition:** Change route availability, projection authority, or
  locked-state interpretation only through explicit product direction with
  corresponding deterministic and browser evidence.

## D-022 — Response-bound Career completion feedback

- **Decision:** A submitted Career projection belongs only to its exact Worker
  response ID. A response that does not complete an evening invalidates that
  projection immediately; it can never be consumed by a later command. A
  direct safe-offline action captures its own pre-command snapshot and renders
  a compact result only from its own completed Worker response and durable
  acknowledgement.
- **Durability boundary:** This response identity is presentation lifecycle
  state only. D-020's persisted acknowledgement remains the authority for
  unlocking the singular Career Run action; no Worker command, durable state,
  schema, ledger behavior, route availability, or balance changes.
- **Reason:** A rejected zero-hour batch previously remained pending and
  mislabeled a later safe-offline four-hour completion as zero hours and zero
  money.
- **Evidence policy:** Candidate-owned repeated Playwright and immutable
  round-055 V-061 regression exercise rejected submission followed by safe
  offline completion; retained persistence, recovery, and canonical checks
  remain required.
- **Reversal condition:** Change completion-feedback attribution only through
  explicit product direction with equivalent response-ordering, durable-save,
  rejection, and offline-recovery evidence.

## D-023 — Worker-bound Career recap snapshots

- **Decision:** A transient Career recap uses one exact ordered Worker response
  boundary: durable request ID, state immediately before that command, and
  state returned by that command. Its night identity, projection baseline, and
  next-decision copy are derived only when that matching response arrives. A
  React state snapshot taken when the player clicks is never a recap boundary.
- **Concurrency boundary:** Multiple valid Career commands may be posted before
  React renders any response. The later command therefore uses the Worker
  state immediately after earlier ordered commands, even when the browser UI
  observed neither intermediate publication. A non-completing response still
  invalidates its own recap under D-022.
- **Durability boundary:** The boundary is App-session presentation data only.
  D-020 still controls exact-once Run acknowledgement: no recap is displayed
  until the matching request or a later ordered response is durably persisted.
  No Worker command, state, schema, ledger, route, or balance rule changes.
- **Reason:** A Run followed synchronously by safe offline work queued two
  valid commands before either response rendered. The offline action captured
  the stale pre-Run React count and incorrectly labeled its durable second
  completion as Night 1.
- **Evidence policy:** Candidate hook coverage batches the two Worker responses
  and proves the later response retains its immediate pre-command state.
  Candidate-owned and immutable round-056 V-062 Playwright probes repeatedly
  prove the visible Night 2 recap; immutable V-061, human-paced draft, durable
  save/recovery, and canonical checks remain required.
- **Reversal condition:** Replace this response-bound presentation lifecycle
  only through explicit product direction with equivalent concurrent-command,
  durable-save, rejection, reload, and recovery evidence.

## D-024 — Ordered Career response-boundary delivery

- **Decision:** `useSimulation` retains ordered durable Worker response
  boundaries in a small pending queue until the App processes them through the
  last delivered request ID. Functional React state updates append each
  boundary, so callbacks released in one browser task cannot overwrite an
  earlier response before render.
- **Consumption boundary:** Career processes the queue in Worker order and
  derives each recap only from its matching request boundary. A non-completing
  response clears only a recap carrying that same request ID; it cannot erase a
  prior completed recap. The App drains processed boundaries immediately, so
  the queue contains only unprocessed callbacks rather than a second durable
  event system.
- **Durability boundary:** This remains transient presentation lifecycle data.
  D-020's persisted acknowledgement watermark still controls when a stored
  recap is displayed; no Worker command, simulation state, schema, ledger,
  route, or balance behavior changes.
- **Reason:** V-063 showed that one `lastWorkerResponse` snapshot loses an
  ordered completed Run response when React batches it with a later valid
  zero-hour safe-offline response.
- **Evidence policy:** Candidate hook coverage emits two real ordered Worker
  responses before a render and verifies both are retained then consumed.
  Candidate and immutable V-063 browser probes buffer/release the two real
  callbacks together; immutable V-061/V-062, human-paced, persistence, and
  canonical checks remain required.
- **Reversal condition:** Replace this bounded presentation queue only through
  explicit product direction with equivalent batched-response, durability,
  rejection, and recovery evidence.

## D-025 — Per-request Career feedback transaction registry

- **Decision:** The App keeps a small, Career-only, in-session registry keyed
  by the existing Worker request ID. Every player-submitted scheduled evening
  and direct safe-offline apply receives its own entry; policy saves and other
  commands receive none. An entry holds only the local schedule draft where a
  Run needs it, whether its exact response was claimed, and a transient recap
  awaiting durable acknowledgement.
- **Ordering boundary:** Career processes the existing D-024 Worker boundary
  queue in Worker order. It claims an entry only for the matching response ID
  and derives the recap from that response's immediate before/after snapshots.
  Claiming, completion, invalidation, and durable draining are exactly-once;
  duplicate or unrelated responses are inert.
- **Durability and cleanup boundary:** D-020 remains authoritative. A completed
  entry is displayed only after its request ID is at or below the durable
  watermark, including a later persisted response/tick. A non-completion
  removes only its own entry; it cannot replace or erase an earlier completed
  entry. Every acknowledged or orphaned entry is removed, and the registry is
  cleared when the run ends; it is not persisted and naturally ends with the
  App session.
- **Reason:** V-064 showed that one mutable safe-offline reference was
  overwritten by a later apply while a policy save and zero-hour apply were
  queued before React rendered. The first durable four-hour completion then
  had no retained local recap.
- **Evidence policy:** Pure transaction tests cover independent entries,
  duplicate-claim prevention, non-completion, D-020 draining, and a
  three-response apply/save/apply batch. Hook coverage retains all three exact
  before/after boundaries. Candidate and immutable round-058 Playwright tests
  buffer and release the three real Worker responses together; retained
  V-061/V-062/V-063, human-paced, persistence/recovery, and canonical checks
  remain required.
- **Reversal condition:** Replace this request-keyed presentation lifecycle
  only through explicit product direction with equivalent ordered-boundary,
  durable-acknowledgement, multi-request, rejection, and recovery evidence.

## D-026 — Production dependency boundary excludes Vite build tooling

- **Decision:** `react` and `react-dom` remain production dependencies because
  they are imported by the browser entrypoint. `vite` and
  `@vitejs/plugin-react` are development dependencies: they are imported only
  by Vite configuration or invoked by repository build, preview, fixture, and
  Playwright workflows; they are never shipped as a browser runtime import.
- **Lock boundary:** Keep their existing pinned versions and classify the
  complete Vite/PostCSS transitive chain as development-only in
  `package-lock.json`. Do not suppress, filter, or weaken the production audit:
  `npm audit --omit=dev --audit-level=high` remains the release check and must
  report zero high/critical production findings.
- **Reproducibility boundary:** `./scripts/setup`, local build/preview, pinned
  Playwright, verification lanes, and Pages deployment use ordinary locked
  `npm ci`, which includes dev tooling. A production-only install contains the
  two browser runtime packages and can audit independently without the build
  chain.
- **Reason:** V-065 correctly identified high advisories in Vite's build-time
  PostCSS/nanoid chain while those packages were misclassified as production
  dependencies. Reclassifying the boundary fixes the real production audit
  model without hiding an advisory or changing application behavior.
- **Evidence policy:** Candidate test reads manifest/lock boundaries and the
  browser versus build imports. Clean `npm ci --omit=dev`, production audit
  JSON/tree, clean full setup, build, pinned browser suites, and canonical
  verification must all pass. Broad development-chain advisories remain
  documented rather than being relabeled as production-safe.
- **Reversal condition:** Move a tool back to `dependencies` only when a
  shipped runtime process imports it; accompany that change with a fresh
  production dependency audit and release-security evidence.

## D-027 — Selected-stage module inventory stays a narrow shared selector

- **Decision:** Build and Upgrades share only `selectModuleInventory`: a pure
  view of the existing module catalog against current Worker state. It exposes
  `Owned`, `Affordable / available`, and `Locked` entries with live ownership,
  cash requirement, installed state, and selected-stage compatibility.
- **Presentation boundary:** Each section defaults to three relevant cards;
  `Show every module (17)` is the explicit route to the complete catalog. In
  Build, the selected rail stage's installed item ranks first, then compatible
  placement choices. In Upgrades, a paid owned module ranks first so a recent
  purchase retains its named `Place in Build` handoff without reopening the
  catalog. No ranking writes state or changes affordability, ownership,
  placement, capacity, or simulation rules.
- **Interaction boundary:** The selected stage is transient App presentation
  state. Existing Details, explicit placement, pending tray, compatible snap,
  drag, cancellation, focus restoration, and single ordered pipeline remain
  the only mutation paths. Workstation Expansion I still adds only three empty
  process positions (3 → 6); it does not claim compute or memory gain.
- **Reason:** Build and Upgrades previously duplicated ownership and
  affordability ordering while the full catalog repeated decisions. The one
  selector removes that proven duplication without creating a generic
  inventory framework, new page, mechanic, state schema, or Research-facing
  abstraction.
- **Evidence policy:** Selector/component coverage verifies grouping, live
  funds, ownership, compatibility, requirements, and shared comparison delta.
  Pinned browser coverage verifies 320/393 portrait states at 100%/200%, every
  item route, empty expansion positions, explicit placement, cancellation,
  keyboard, touch drag, sticky tray clearance, and retained first-session,
  upgrade, expansion, persistence, PWA, and Career suites.
- **Reversal condition:** Add a broader catalog abstraction only after a
  second independently implemented consumer demonstrates the same domain
  lifecycle; otherwise keep this selector module-specific.

## D-028 — Selected Build context favours compatible placement at scaled portrait widths

- **Decision:** In a selected Build stage, the installed module remains first;
  compatible owned alternatives then precede incompatible owned modules. The
  existing paid-owned priority remains for Upgrades, where no pipeline stage is
  selected. At portrait widths through 31rem, the active placement tray stacks
  its explanatory copy and Cancel target rather than compressing them into a
  single row.
- **Boundary:** This is presentation-only ordering and responsive layout. It
  does not alter catalog membership, ownership, affordability, compatibility,
  capacity, placement commands, sticky-tray semantics, or simulation state.
  The tray retains the existing no-scroll page model and cancellation/focus
  route.
- **Reason:** V-066 found paid incompatible modules taking a default compact
  Build position before compatible placement choices. V-067 found a 200%-text
  tray's copy and cancellation action overlapping or leaving the viewport at
  320×693 and 393×742.
- **Evidence policy:** Keep the pure selected-stage ordering regression and
  the immutable V-063 probe. Candidate portrait coverage must inspect the
  320×693 and 393×742 200%-text tray, assert its geometry and cancellation,
  and retain 100%/200% Phase 3, first-session, expansion, and selected-stage
  browser coverage.
- **Reversal condition:** Change the narrow ordering or portrait stack only
  with a replacement that preserves explicit placement, visible cancellation,
  and the same compatibility-before-incompatibility evidence.

## D-029 — Dual-runtime adversarial probes remain in the static gate

- **Decision:** Playwright adversarial probes under
  `.agent/verification/**/*-adversarial.mjs` remain ordinary ESLint inputs.
  Their Node orchestration and browser `page.evaluate` callbacks receive only
  the corresponding Node and browser globals through a narrow flat-config
  override. The verification directory is not ignored, and older probes that
  intentionally declare their own narrower globals retain that lint path.
- **Boundary:** This is static-tooling configuration only. It changes no
  production code, browser behavior, simulation, Worker, persistence, PWA,
  verifier report, test assertion, or lint rule severity.
- **Reason:** CI Verify run `31622985993` linted the round-064 adversarial
  probe after that verifier artifact was committed, while the candidate's
  earlier canonical lint had run before the artifact existed. Default
  JavaScript globals then rejected its legitimate `process` and browser-callback
  references as undefined.
- **Evidence policy:** The exact CI lint command, direct adversarial-file lint,
  syntax check, immutable round-064 browser probe, full canonical gate, and
  startup cleanup must pass. Do not replace this with an ignore, a blanket
  no-undef suppression, or edits to immutable verifier evidence.
- **Reversal condition:** Expand or replace the file pattern only when a new
  committed verifier probe has a documented execution model and equivalent
  static/browser evidence.

## D-030 — Compact money summaries and Inspect decision order

- **Decision:** One small currency presentation policy serves non-accounting
  HUD, card, target, quote, and settlement summaries. A compact value shows
  cents by default and promotes itself to mills when it needs that precision;
  an explicitly additive settlement row promotes its related accounting
  equation together. Details, Inspect comparison/accounting, and
  ledger-adjacent disclosures explicitly remain mill-precise.
- **Career precision boundary:** Cash, Savings, and lifetime totals are
  independent compact values. Each Career route or completed-evening equation
  may promote only its own displayed accounting terms together; a mill-bearing
  route preview never promotes an unrelated quick resource.
- **Independent disclosure boundary:** A standalone Career action cost and a
  Build warning payout are compact summaries, so both call the shared compact
  formatter rather than carrying raw money literals. The private-evaluation
  action's `$0.75` price therefore remains independent of exact evaluation
  evidence and any route equation.
- **Settlement ledger boundary:** Settlement event sentences are accounting
  disclosures. Gross payout, configured cost, signed net, paid and unpaid
  portions, and the cash floor all call the fixed-three-decimal formatter in
  every success and failure branch. This changes presentation only; the
  settlement equation and money arithmetic remain unchanged.
- **Capital and exit ledger boundary:** Module, hardware, and expansion
  purchase or insufficient-funds events, plus the Bedroom exit savings
  milestone, are durable accounting records and use fixed-three currency.
  Purchase controls remain compact. Existing cents-era purchase records remain
  accepted only as historical provenance during safe stale-save recovery; new
  records are never written at cents precision.
- **Tier requirement boundary:** Career model-tier requirements are compact
  choice-card copy. Their visible monetary thresholds use the shared
  cents-default formatter while their catalog eligibility criteria remain
  unchanged.
- **Exit target boundary:** The Bedroom Developer exit savings requirement is
  one engine-owned threshold. Its visible Career progress target reads that
  threshold through the shared compact formatter, while the adjacent current
  savings remains an explicit fixed-three accounting disclosure and the durable
  exit ledger stays fixed-three.
- **Quote-range precision boundary:** Queue 10 is a non-additive preview, not
  a settlement equation. Its first and last labels format each displayed
  endpoint independently; undisplayed reserved quotes never promote either
  endpoint to mills. Queue-time quote locking and the separate settlement
  equation remain unchanged.
- **Screen-order boundary:** Inspect keeps the existing configuration panel
  and comparison component, but its first diagnostic content is a compact
  dominant-bottleneck, baseline-delta, and latest-causal-evidence strip.
  First-session guidance, upgrade feedback, and time controls follow it rather
  than displacing the current decision. No command, Worker state, persistence,
  simulation calculation, topology, or money arithmetic changes.
- **Responsive boundary:** Header controls retain their established accessible
  names while their short visible labels, intrinsic resource columns, 44px
  minima, and bottom-tab truncation prevent enlarged text from fragmenting
  words or creating horizontal overflow. Bottom-tab scroll positions remain
  per-tab presentation state.
- **Reason:** The same live money appeared with local formatting rules across
  cards, HUD, targets, and settlement text, while Inspect's first viewport
  buried the current bottleneck/baseline/evidence under general guidance.
  A shared formatter and one existing comparison surface remove only that
  demonstrated drift. V-070 additionally showed that a Queue 10 label was
  borrowing mills from undisplayed intermediate quotes despite not being an
  additive accounting row. V-071 found the inverse boundary drift: independent
  Career/Build summaries retained raw mill/zero literals while an Inspect
  failed-settlement sentence mixed compact zeros with accounting values.
- **Evidence policy:** Currency unit coverage locks cent/mill and signed
  equation behavior and the independent Queue 10 endpoint boundary. Pinned
  command-deck browser coverage captures every tab for starter and expansion at
  320×693 and 393×742, checks target/overflow and per-tab scroll geometry, and
  captures the Inspect strip at 200% text with reduced motion. The Queue 10
  browser regression persists all ten locked quotes after the preview and
  verifies the cent-exact range labels despite mill-bearing middle quotes.
  Candidate engine/component/browser coverage additionally locks the compact
  private-evaluation action, compact no-model warning, and exact failed ledger
  sentence through reload. The unchanged round-068 adversarial probe remains
  required.
  Retained Details focus, glyph/status, warnings, first-session, persistence,
  PWA, Career, and canonical suites remain required.
- **Reversal condition:** Replace this policy only with a demonstrated
  accounting-display requirement that preserves an equally explicit exact-value
  route and the same portrait/reduced-motion evidence.

## D-031 — State-derived first-session primary-action handoff

- **Decision:** The finite first-session rail presents one contextual next
  action from durable simulation state: queue the safe Interactive Chat
  starter, observe its settlement, earn the exact remaining amount for the
  recommended Precision Cleaner in Jobs, buy it once affordable, then begin
  placement in Upgrades and manually select Build to place it. A valid
  already-purchased alternative remains named by the existing engine-owned
  first-session progress rather than being replaced or invalidated.
- **Presentation boundary:** A narrow pure UI selector may observe the durable
  guide, resources, job state, owned/installed modules, and the transient
  pending placement. It never dispatches, navigates, persists, changes
  economy, or changes guide validation. The bottom tab remains the only route
  between areas; starting the recommended placement leaves the player in
  Upgrades with their scroll/input intact, and selecting Build is explicit.
  Jobs keeps its settlement and recovery record visible when the starter
  fails; the guide names that recovery instead of replacing its reason.
- **Priority boundary:** Until the guide completes, Build's current objective
  no longer promotes the $45 Workstation Expansion, Jobs demotes Queue 10 and
  hides the optional target picker; when the required tab has moved to
  Upgrades or Build, Jobs also demotes Queue 1. Upgrades puts the named
  recommended module before the expansion, rigs, and remaining catalogue.
  Existing lower choices remain available and no second onboarding routing
  control is added.
- **Details boundary:** Upgrades retains exactly one primary item Details
  disclosure. During onboarding the recommended module owns that initial
  disclosure; after completion the established equipped-rig default remains.
- **Reason:** The live first session previously described a generic buy/install
  goal while a premature expansion objective and several equally styled actions
  competed with it. A single state-derived handoff makes the required
  cross-tab sequence legible without inventing a state framework, new
  navigation, or a tutorial rewrite.
- **Evidence policy:** Pure selector coverage enumerates queue, observe,
  shortfall, affordable purchase, owned handoff, pending placement, completion,
  failed-settlement recovery, and valid alternate purchase states. Pinned
  Playwright coverage verifies manual cross-tab routing, scroll/input
  preservation, failure without pipeline loss, persistence/reload, touch,
  keyboard, reduced motion, and 320×693, 375×667, and 393×742 portrait
  layouts, alongside retained PWA/offline/Phase 3 regressions and canonical
  verification.
- **Reversal condition:** Replace the recommended-module order or manual tab
  handoff only with an explicit product decision that preserves transparent
  settlement/failure disclosure, explicit placement, no surprise navigation,
  and equivalent mobile browser evidence.

## D-032 — Contextual global chrome after plan §20.7

- **Decision:** Owner-authorized post-§20.7 presentation work keeps identity,
  live resources, and the one bottom navigation grammar permanent. Simulation
  time plus the current warning compress into a native `details` summary that
  names the exact active speed and warning. Its unchanged speed buttons and
  full warning evidence remain available on demand; selecting a speed closes
  the disclosure and returns visual priority to the current tab. Help and
  motion likewise share a native header disclosure. Dismissing Quick Start
  returns focus to that visible disclosure summary. Build's existing
  presentation toggle now says Configure/Observe only; it dispatches no new
  command.
- **Boundary:** No Worker message, simulation calculation, schema, persistent
  state, tab routing, tab-scroll restoration, onboarding state, Career draft,
  Jobs settlement, placement transaction, resource semantics, PWA, or bottom
  navigation behavior changes. Full warning copy and the existing Details
  control remain in the simulation disclosure. The speed labels remain exactly
  1×/4×/16×/64× and motion remains visual-only. No automatic navigation,
  hidden required consequence, new framework, design system, or speculative
  control is introduced.
- **Reason:** Raw 320×693/393×742 first viewports spent roughly 106–109px on
  the header and another 133–139px on permanent global time/warning controls
  before the active tab's guide, action, or diagnostic. The presentational
  disclosures retain all evidence and 44px reachability while giving the
  active tab earlier first-viewport priority.
- **Evidence policy:** Candidate browser coverage captures starter and
  expansion states of every tab at 320×693 and 393×742, raw and 200%-text
  reduced-motion geometry, no horizontal/nested scroll, 44px controls,
  keyboard and touch opening, Help focus return, warning Details, tab-scroll
  restoration, Career-draft handoff, pointer/touch drag, persistence/reload,
  malformed-save recovery, PWA/offline, and the raw Jobs navigation reserve.
  Retain immutable prior probes and canonical Node 22 verification.
- **Reversal condition:** Replace either disclosure only with an equally
  accessible progressive disclosure that preserves exact simulation controls,
  full warning consequences, visible focus return, raw Jobs reserve, and the
  same portrait/text-scale evidence.

## D-033 — Portrait latest-settlement one-scan accounting boundary

- **Decision:** Owner-authorized post-§20.7 Jobs presentation work makes the
  latest settlement's first level a decision record: delivery outcome, actual
  cash change, workload identity, concise recognition or direct
  cause/recovery, and one next valid cue outside finite onboarding. The finite
  first-session guide continues to own its current action, so that cue is not
  duplicated in the settlement card.
- **Disclosure boundary:** Exactly one native `details` control, labeled
  `Settlement accounting and provenance`, contains the durable task ID,
  locked quote, completed/failed result, full gross-cost-economic-net
  equation, paid/unpaid/cash-floor outcome, actual cash change, and the
  three-decimal rationale. It is regular document flow with native keyboard,
  touch, focus, and screen-reader semantics; no modal, drawer, accounting
  framework, truncation, or hidden required accounting record is introduced.
- **Calculation boundary:** A small pure UI selector assembles the compact
  presentation from the engine-owned `JobSettlement` and existing ledger
  cause/quote. It does not dispatch, mutate, persist, round engine state, or
  change Worker/simulation/economy/schema/ledger behavior. Its displayed cash
  change is `settlement.netChange`; the disclosure separately names the
  economic gross-minus-cost equation, which intentionally differs under the
  cash floor. Its mill rounding is presentation-only and prevents a binary
  residue from incorrectly describing a fully paid cost as `$0.000 unpaid`.
- **Responsive boundary:** At portrait widths through 393px the quote and
  latest-settlement card use one readable column. The later settlement record
  remains below the selected Queue action, preserving raw 320×693 D-018
  Queue/navigation reserve. The summary and existing selected-quote Details
  have 44px minimum targets; no horizontal or nested scroll is introduced.
- **Reason:** Baseline 393px settlement cards had only 143.4px of inline
  width and grew to 254.6px for success, 269.4px for zero-payout failure, and
  343.6px for partial-cash failure while exposing provenance before the
  recovery decision. One full-width outcome record plus on-demand exact
  accounting gives each state a usable first scan without losing its evidence.
- **Evidence policy:** Unit coverage locks success, zero-payout/full-payment,
  partial-cash/payment-floor, no-settlement, and onboarding-cue states.
  Candidate Playwright coverage locks successful, zero-payout, and partial
  failure records at raw 320×693/393×742; native keyboard/touch disclosure,
  reload persistence, 100%/200%-text reduced motion, 44px targets, no
  overflow/nested scroll, global Simulation disclosure coexistence, and raw
  Jobs reserve. Retained drag, Career draft, malformed/reload, PWA/offline,
  and tab restoration lanes remain canonical requirements.
- **Reversal condition:** Replace this progressive disclosure only with a
  similarly native, one-control accessible treatment that retains every exact
  accounting field, actual-versus-economic-net distinction, first-session
  ownership, raw Jobs reserve, and equivalent portrait/text-scale evidence.
