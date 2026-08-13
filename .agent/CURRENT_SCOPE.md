# Current scope — provenance repair awaiting independent verification

Status date: 2026-08-14. Navigation only; sources below remain authoritative.

## Read route

1. `AGENTS.md`, then the active role at `.codex/agents/`.
2. This file.
3. `.agent/verification/INDEX.md`.
4. Every cited plan section, decision, report, test, and probe.

Use the full plan, decisions, and report archive for release verification,
broad architecture/cross-milestone work, missing/conflicting index coverage, or
an explicit request. Never infer authority absent from a cited source.

## Active product boundary

The only unresolved product seam is truthful Jobs latest-settlement failure
provenance after restore. Current candidate
`0bdff6ea88f7496bfb8348c7551652bf53a676ca` clears every optional precise
`lastSettlement.ledgerEventId` link whenever a current-schema save's original
integrity is stale, invalid, or absent, while preserving valid-integrity exact
provenance and collision-safe ledger progress.

Required behavior:

- A valid original integrity seal retains a failed Job settlement's own typed
  cause after later unrelated Career activity.
- A stale/invalid restored save retains recoverable gameplay/accounting but
  reports `Cause unknown`; it never rebuilds a precise cause from mutable IDs,
  order, task fields, markers, `directCause`, or prose.
- Future/colliding retained IDs cannot freeze later Worker ticks; post-restore
  allocation remains deterministic and unique.

## Frozen threat model and out-of-scope boundary

Persisted state with stale, invalid, or absent integrity is untrusted for
optional causal provenance. It may be structurally repaired only for
operability. No new signing/authentication scheme, free-text parser, schema
redesign, event-history reconstruction, simulation/economy/content change,
navigation redesign, PWA rewrite, new dependency, or Research work is in scope.
Existing D-033 settlement hierarchy, D-018 Jobs reserve, pointer/touch drag,
Career draft, Worker semantics, persistence, root/Pages PWA, offline recovery,
and accessibility remain regression boundaries.

## Authority map

| Need                                | Exact authority                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Product gate / Research block       | `plan.md` §§2.4, 17, 19, 20.7, 24.1, 24.5–24.6; Milestones 3.6–4                               |
| Settlement/accounting UI            | D-030, D-033 in `.agent/DECISIONS.md`                                                          |
| Provenance/recovery/identity        | D-034, D-035, D-036 in `.agent/DECISIONS.md`                                                   |
| Last accepted presentation baseline | `.agent/verification/round-078.md`, verifier commit `437b56245b8488cce0ea1193be4200985cace2c7` |
| Unresolved history                  | `.agent/verification/round-079.md` through `round-082.md`; index mappings below                |
| Candidate handoff/evidence          | `.agent/HANDOFF.md` (untrusted guide only)                                                     |

## Verification state — do not reinterpret

- Last accepted independent PASS: round 078, verifier commit
  `437b56245b8488cce0ea1193be4200985cace2c7` for candidate
  `88fdc4df1ef86fe7b5c1e584c08df868e580b767`.
- Current product candidate: `0bdff6ea88f7496bfb8348c7551652bf53a676ca`.
  It is unverified. No `round-083.md` exists and no round-083 PASS exists.
- Reports 079, 080, 081, and 082 are immutable FAIL records. Their stable
  findings V-078 through V-082 remain open until a fresh independent verifier
  evaluates this candidate.
- Next plan gate: fresh independent PASS for the exact candidate, then
  exact-SHA hosted verification/deployment. Milestone 4 Research must not
  begin before those gates and explicit owner authorization.

## Lean repair rule

Before a repair handoff, map and test these three same-seam cases:

1. Valid-integrity Job failure + later unrelated Career failure: original cause
   persists (V-078).
2. Stale integrity with relink/marker/decoy mutation: provenance is cleared and
   UI is unknown (V-079, V-080, V-082).
3. Restored future/colliding ID + repeated Worker tick/reload/offline: progress
   continues with unique IDs (V-081).

Run only the focused map while editing; one final `./scripts/verify` at most per
role after all intended executable changes. Release verification always expands
to the full authority/archive route and all listed retained probes.
