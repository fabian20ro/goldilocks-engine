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
