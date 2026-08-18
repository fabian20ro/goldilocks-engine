# Scope routing map — accepted Milestone 7A release and active Milestone 7B

Parked commercial gate; active Milestone 7C follows below.

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

## Historical accepted boundaries

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

The exact accepted M7A release receipt is recorded in D-043 and
`.agent/RELEASE_ACCEPTANCE.md`: candidate
`d25e80e6781de89e80fc3b3c240a922ada53d978`, independent verifier round 099,
and the hosted/deployment evidence. This is frozen historical routing, not a
claim about the live HEAD or a future gate.

## Parked commercial-release gate: Milestone 7B OIV evidence

D-043 and `.agent/RELEASE_ACCEPTANCE.md` route this bounded next slice:

- close the WebKit browser gap at 320×693 and 393×742 with the existing pinned
  Playwright/cache/startup contract;
- close native VoiceOver coverage on the available iOS Simulator and native
  TalkBack coverage on an available unlocked USB Android;
- collect measured mobile-performance evidence for clean install/startup,
  LCP/INP/CLS, Worker 1×/64× cost, memory, offline startup, and physical
  battery/thermal behavior;
- retain the accepted eight-tab M7A navigation/PWA checks as regression
  boundaries;
- keep the device/browser matrix, measurable budgets, Rule of Three, artifact
  manifest, and infrastructure/blocker policy explicit in the handoff and
  release matrix.

Round 109 records honest BLOCKED infrastructure evidence for the unavailable
physical/native/browser gates. D-044 parks that evidence as a commercial
release gate: retained tooling and reports remain required and cannot be
silently relabeled or skipped. `./scripts/verify --profile=full-release`
continues to invoke the complete M7B lanes and remains strict. The named
development profile records the parked gate explicitly while exercising all
locally testable candidate lanes.

## Active authorized scope: Milestone 7C Writing & Density Closure

D-044 and D-045 authorize the smallest presentation-only closure across all
eight existing destinations and global/onboarding chrome:

- define the development-candidate and full-release verification profiles;
- add one live editorial decision summary per destination with current state,
  consequence, cost/risk, and one next action;
- retain exact accounting, requirements, causal truth, and evidence in the
  existing Details, Inspect, accounting, and ledger surfaces;
- make locked states name requirement, current progress, and unlock action;
- make errors/blocked states name preserved work and player-directed recovery;
- remove duplicate onboarding prompts without changing the finite first-session
  command boundary or bottom-tab-only navigation;
- prove the contract at starter/expanded, normal/locked/failure/recovery,
  reload/offline, 100%/200% text, reduced motion, keyboard/touch, 320×693, and
  393×742 through a data-driven screenshot atlas.

This is presentation and verification tooling only. Engine/Worker/schema,
economy/balance, navigation destinations, PWA, threat model, and out-of-scope
startup/workforce/government/telemetry/audio/localization/packaging boundaries
remain frozen.

## Frozen boundaries

No `plan.md` edit, startup/workforce/government expansion, new navigation
destination, simulation command, persistence schema, speculative telemetry,
audio/localization implementation, store packaging, or broad architecture
rewrite is authorized by M7C. Supported-save fixtures/version policy,
localization readiness, audio, and the PWA-only versus store-packaging/
distribution decision remain later commercial-release work. The unavailable
M7B physical/native/browser evidence remains a release gate under D-044.
Existing deterministic simulation, accounting, causal truth, persistence,
PWA/update, offline, reduced-motion, accessibility, and Lab lifecycle
contracts remain regression boundaries.

## Exact authority map

| Need                                     | Source                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Product and release boundary             | `plan.md` §§2.4, 20, 24, 27, 29, 34; D-040–D-045                                                                                        |
| Historical accepted Milestone 6 behavior | `.agent/verification/round-093.md`; `.agent/verification/round-093-adversarial.mjs`; `.agent/verification/round-093-ui-adversarial.mjs` |
| Frozen M7A receipt and active M7 matrix  | `.agent/RELEASE_ACCEPTANCE.md`; D-043                                                                                                   |
| Active finding/probe status              | `.agent/verification/catalog.json`; `scripts/validate-verification-catalog.mjs`                                                         |
| Navigation implementation                | `src/ui/App.tsx`; `src/ui/styles.css`; `src/ui/glyphs.tsx`                                                                              |
| Navigation acceptance                    | `tests/e2e/navigation-affordance.spec.ts`; `scripts/verify`                                                                             |
| M7B OIV evidence contract                | `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7B; `.agent/HANDOFF.md`                                                                       |
| M7C profile and editorial contract       | D-044–D-045; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7C; `scripts/verify`; `src/ui/editorial.ts`; `src/ui/commandDeck.tsx`            |
| M7C destination implementation           | `src/ui/App.tsx`; `src/ui/ResearchView.tsx`; `src/ui/LaboratoryView.tsx`; `src/ui/WorldView.tsx`; `src/ui/styles.css`                   |
| M7C executable evidence                  | `src/ui/editorial.test.ts`; `src/test/verificationProfiles.test.ts`; `tests/e2e/command-deck.spec.ts`                                   |
| Live Git/report facts                    | `./scripts/agent-status` only                                                                                                           |

## Rule-of-Three retained M7A navigation map

1. Normal: 393px shows all eight stable destinations, each at least 44px, with
   no overflow cue or document-level horizontal overflow.
2. Boundary: 320px keeps all targets at least 44px, announces the horizontal
   strip, shows a direction cue, and reveals World after keyboard or touch.
3. Lifecycle: 200% text, resize to 393px, return to 320px, and reload retain
   stable order, active-tab semantics, focus behavior, and safe overflow state.

## Rule-of-Three M7B OIV map

1. Normal: WebKit/native portrait navigation and first-action reachability at
   393px, with the same-device performance baseline recorded.
2. Boundary: 320×693 with 200% text, reduced motion, horizontal reveal,
   VoiceOver/TalkBack names and active state, touch/keyboard activation, and no
   document overflow or clipped target.
3. Lifecycle: clean install, reload/offline resume, repeated 1×/64× Worker
   runs, and device CPU/memory/battery/thermal observation with explicit
   recovery or BLOCKED evidence.

## Rule-of-Three M7C editorial map

1. Normal: each destination's live summary names current state, consequence,
   cost/risk, and one next action while the existing primary action remains
   reachable at 393×742.
2. Boundary: locked, malformed/failure, and recovery states name the
   requirement or preserved work, current progress, and a player-directed
   unlock/recovery action at 320×693 and 200% text with no overflow or target
   below 44 CSS pixels.
3. Lifecycle: starter/expanded atlas captures, reload/offline resume,
   reduced-motion, keyboard/touch, and onboarding transitions retain the same
   single summary contract without simulation or input mutation.

The catalog's active requirements and historical finding groups are the
machine-checked routing contract. If a report introduces a finding ID absent
from the catalog, validation fails and the full-read route is required.
