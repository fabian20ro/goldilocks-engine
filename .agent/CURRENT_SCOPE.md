# Scope routing map — frozen provenance-repair history

Navigation only. This map is intentionally stable across new commits and
verification rounds; authority remains with `plan.md`, decisions, and immutable
reports. It never states live HEAD, latest verdict, acceptance, or next gate.

## Read route

1. `AGENTS.md`, then the active role at `.codex/agents/`.
2. Run `./scripts/agent-status` (`--json` for tooling).
3. This map, then `.agent/verification/INDEX.md`.
4. Every cited plan section, decision, report, test, and probe.

Use the full plan, decisions, and report archive for release verification,
broad architecture/cross-milestone work, missing/conflicting index coverage, or
an explicit request. If `agent-status` fails, do not reconstruct live state from
this map: repair the status input or take the full route.

## Freeze label

This records the Jobs settlement-provenance repair seam introduced before the
round-083 release-verification record. `0bdff6ea88f7496bfb8348c7551652bf53a676ca`
is the historical repair candidate; round 078 is the pre-repair presentation
baseline; rounds 079–082 record the adversarial findings; round 083 records the
release verification of the workflow/provenance chain. These labels are history,
not a statement about the repository checked out today.

## Frozen repair boundary

The repair seam is truthful Jobs latest-settlement failure provenance after
restore:

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

| Need                               | Exact authority                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Product gate / Research block      | `plan.md` §§2.4, 17, 19, 20.7, 24.1, 24.5–24.6; Milestones 3.6–4                               |
| Settlement/accounting UI           | D-030, D-033 in `.agent/DECISIONS.md`                                                          |
| Provenance/recovery/identity       | D-034, D-035, D-036 in `.agent/DECISIONS.md`                                                   |
| Pre-repair presentation baseline   | `.agent/verification/round-078.md`, verifier commit `437b56245b8488cce0ea1193be4200985cace2c7` |
| Adversarial finding history        | `.agent/verification/round-079.md` through `round-082.md`; index mappings                      |
| Workflow/provenance release record | `.agent/verification/round-083.md`                                                             |
| Live Git/report status             | `./scripts/agent-status` only                                                                  |
| Candidate handoff/evidence         | `.agent/HANDOFF.md` (untrusted guide only)                                                     |

## Rule-of-Three repair map

Before a repair handoff, map and test these three same-seam cases:

1. Valid-integrity Job failure + later unrelated Career failure: original cause
   persists (V-078).
2. Stale integrity with relink/marker/decoy mutation: provenance is cleared and
   UI is unknown (V-079, V-080, V-082).
3. Restored future/colliding ID + repeated Worker tick/reload/offline: progress
   continues with unique IDs (V-081).

Run only the focused map while editing; one final `./scripts/verify` at most per
role after all intended executable changes. Release verification expands to the
full authority/archive route and all listed retained probes.
