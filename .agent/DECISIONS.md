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
