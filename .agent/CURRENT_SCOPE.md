# Scope routing map — accepted Milestone 6 history and active Milestone 7A

Navigation only. This map is stable routing metadata, not authority. It never
states live HEAD, latest verdict, current acceptance, or next gate. Run
`./scripts/agent-status` before using it for live Git/report facts.

## Read route

1. Read `AGENTS.md`, then `.codex/agents/implementer.toml` or
   `.codex/agents/verifier.toml` for the active role.
2. Run `./scripts/agent-status` (`--json` for tooling); fail closed if it
   cannot parse the immutable reports.
3. Read this map, `.agent/verification/INDEX.md`, and
   `.agent/verification/catalog.json`.
4. Read the exact sources named by the active requirement. Use the full
   `plan.md`, complete decisions, and archive route for release verification,
   broad/cross-milestone changes, missing or contradictory catalog coverage,
   or an explicit request.

## Historical accepted boundary

The immutable round-093 report records the accepted Milestone 6 Local
Laboratory repair at candidate
`db43d20b0334f3daba5f2e4f03414fb7da10ded7`, with verifier commit
`0b83e7ee047d7ddcdd54f5b2a57b7974c86433e9`. Read
`.agent/verification/round-093.md` and D-040 for the historical product
boundary: four machines, three bounded pipelines, collaborators,
reproducibility switches, cultures, founding choices, schema-7 recovery,
Worker-only lifecycle, offline safety, and eight destinations.

This is historical provenance. Live status comes only from
`./scripts/agent-status`.

## Active authorized scope: Milestone 7A

D-041 and `.agent/RELEASE_ACCEPTANCE.md` route this bounded slice:

- refresh this map and `verification/INDEX.md` without volatile claims;
- validate the machine-readable active catalog before expensive verification;
- keep `.agent/HANDOFF.md` current-only and compact;
- define the remaining commercial-release acceptance matrix;
- make the eight-tab strip discoverable at 320px while preserving stable
  order, bottom-tab-only routing, 44px targets, keyboard/touch semantics and
  393px fit;
- prove the navigation seam at 320/393, 200% text, keyboard, touch, resize,
  focus and reload boundaries.

## Frozen boundaries

No `plan.md` edit, startup/workforce/government expansion, new navigation
destination, simulation command, persistence schema, speculative telemetry,
audio/localization implementation, store packaging, or broad architecture
rewrite is authorized by M7A. Existing deterministic simulation, accounting,
causal truth, persistence, PWA/update, offline, reduced-motion, accessibility,
and Lab lifecycle contracts remain regression boundaries.

## Exact authority map

| Need                                     | Source                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Product and release boundary             | `plan.md` §§2.4, 20, 24, 27, 29, 34; D-040–D-041                                                                                        |
| Historical accepted Milestone 6 behavior | `.agent/verification/round-093.md`; `.agent/verification/round-093-adversarial.mjs`; `.agent/verification/round-093-ui-adversarial.mjs` |
| Active M7 release matrix                 | `.agent/RELEASE_ACCEPTANCE.md`                                                                                                          |
| Active finding/probe status              | `.agent/verification/catalog.json`; `scripts/validate-verification-catalog.mjs`                                                         |
| Navigation implementation                | `src/ui/App.tsx`; `src/ui/styles.css`; `src/ui/glyphs.tsx`                                                                              |
| Navigation acceptance                    | `tests/e2e/navigation-affordance.spec.ts`; `scripts/verify`                                                                             |
| Live Git/report facts                    | `./scripts/agent-status` only                                                                                                           |

## Rule-of-Three navigation map

1. Normal: 393px shows all eight stable destinations, each at least 44px, with
   no overflow cue or document-level horizontal overflow.
2. Boundary: 320px keeps all targets at least 44px, announces the horizontal
   strip, shows a direction cue, and reveals World after keyboard or touch.
3. Lifecycle: 200% text, resize to 393px, return to 320px, and reload retain
   stable order, active-tab semantics, focus behavior, and safe overflow state.

The catalog's active requirements and historical finding groups are the
machine-checked routing contract. If a report introduces a finding ID absent
from the catalog, validation fails and the full-read route is required.
