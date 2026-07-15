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
