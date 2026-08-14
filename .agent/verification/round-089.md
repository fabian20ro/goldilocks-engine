# Verification round 089 — Milestone 5 Hype/Fear

Candidate SHA: `0324bebe476675f7fdf9120786d0ecac8b22875e`

VERDICT: FAIL

## Scope and authority

Release-grade Milestone 5 verification. Requirements independently derived
from `plan.md` §§1–6, 7.3, 11, 13–19, 20, 23–29, 33–34; `.agent/DECISIONS.md`
D-039; and the complete retained verification route through round 088.
The candidate was evaluated as frozen at the SHA above. Routing documents and
the implementation handoff were used only to locate evidence.

Applicable scope: four original creator archetypes; audience reputation;
expectation debt and stakeholder selection; finite hype/fear narratives,
predictions, deadlines and supported resolutions; separate hype/fear response
paths; doom feed; tool-switching panic; bounded attention and response gating;
causal/evidence truth; Research/Career neighbors; persistence, malformed and
stale-save recovery; reload/offline/PWA startup; and portrait/accessibility
behavior.

## Environment and setup

- macOS arm64, Node `v26.7.0`, npm `11.19.0`.
- Repository-pinned Playwright Chromium, local cache
  `.cache/ms-playwright`, loopback preview servers on ports 42390–42395.
- Initial sandbox Chromium launch was blocked by the host Mach bootstrap
  permission (`bootstrap_check_in ... Permission denied`). The same focused
  command and the full root/Pages suites were rerun with scoped host authority;
  they launched successfully. This is infrastructure evidence, not a verdict
  blocker.
- Preview ports were checked after browser runs; no listeners remained.
- Initial candidate SHA capture, before any verifier write:
  `git rev-parse HEAD` →
  `0324bebe476675f7fdf9120786d0ecac8b22875e`, exactly matching the assigned
  candidate.

## Commands executed and results

Passing checks:

- `./scripts/agent-status` — parsed cleanly; HEAD was the assigned next gate.
- `npm run format:check`, `npm run lint`, `npm run typecheck` — pass.
- `node --check .agent/verification/round-089-adversarial.mjs` — pass.
- Full unit suite excluding only the two verifier regression files:
  `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound089.test.ts --exclude src/ui/verifierRound089.test.tsx` — 62 files, 284 tests passed.
- `npm run balance` — all lanes pass; Hype/Fear 121 seeds, zero failures,
  `valid: true`; numeric prototype also reports `noDominantStrategy: true`.
- `npm run build` — pass.
- `npm audit --omit=dev --audit-level=high` — zero production vulnerabilities.
- Focused candidate lane:
  `node_modules/.bin/vitest run --coverage=false src/simulation/hypeFear.test.ts src/ui/worldView.test.tsx src/ui/commandDeck.test.tsx src/simulation/verifierRound088.test.ts` — 4 files, 13 tests passed.
- Focused pinned browser lane, rerun with host authority:
  `E2E_PORT=42390 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- tests/e2e/hype-fear.spec.ts` — 2/2 passed.
- Full pinned root browser lane, host authority:
  `E2E_PORT=42393 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e` — 233/233 passed.
- Full pinned Pages/offline lane, host authority:
  `E2E_PORT=42394 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages` — 2/2 passed.
- Independent adversarial probe, run against a preview at 42392:
  `BASE_URL=http://127.0.0.1:42392 OUTPUT_DIR=/private/tmp/goldlocks-r089-shots2 node .agent/verification/round-089-adversarial.mjs` — exercised locked and recognized World, touch, 320/393 portrait, 200% text, control geometry, reload, countdown, 64× resolution, separate fear response/doom feed, and page/console errors; it reported the three findings below and no other findings. Screenshots were saved under `/private/tmp/goldlocks-r089-shots2` and visually inspected.
- Direct recognized tool-switch probe — normal recognized switch records
  `fast-new-runtime`, `toolSwitches: 1`, `toolSwitchingPanic: 0.18`, and
  `expectationDebt: 0.08`; this confirms the intended normal path exists while
  the pre-recognition boundary remains broken.

The single final canonical gate was run after verifier artifacts were ready:

`INSTALL_PLAYWRIGHT=0 E2E_PORT=42395 VERIFY_EVIDENCE_DIR=.cache/verification/round-089-final ./scripts/verify`

Setup, format, lint, and typecheck passed. The gate stopped at unit because the
two verifier regression assertions fail: 62 files / 286 passed tests, 2 failed
tests in 64 files / 288 total. The gate evidence is retained in
`.cache/verification/round-089-final`.

## Requirement matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| Four original creator archetypes and narrative catalog | `src/simulation/hypeFearCatalog.ts`; focused unit and balance lanes | Four finite original creators/templates present. Preference/access behavior is finding V-089-003. |
| Audience-specific reputation and durable stakeholder selection | `hypeFear.test.ts`, `verifierRound089.test.ts`, Hype/Fear balance, reload probe | Reputation, stakeholder changes, expectation debt, and valid resealed reload persist. PASS. |
| Expectation debt consequences and no indefinite attention farming | Hype/Fear balance (121 seeds), response-gate unit test, numeric balance | Attention is capped; attention-only actions are bounded by the finite catalog; pending response blocks further coverage. PASS for the tested contract. |
| Hype and fear are separate signals and responses | Candidate focused unit; adversarial probe covers hype response then fear response | Separate response controls, fear resolution, confidence range, and doom-feed response requirement pass. PASS. |
| Narrative claim/source/audiences/deadline/evidence/counterevidence/effects/rules | Catalog, focused unit, World UI probe at 320/393 | All fields exist and most are rendered, but the available card omits its deadline before coverage. V-089-002. |
| Countdown, prediction, deadline resolution, causal truth | Candidate unit, 64× browser flow, resolution confidence range | Covered/countdown/resolution and supported ranges work after coverage; initial deadline disclosure defect blocks complete acceptance. |
| Tool-switching panic and recognition boundary | Direct engine probe and locked World probe | Recognized switch works; locked switch is enabled and mutates durable Hype/Fear state. V-089-001. |
| Bounded attention / no dominant attention-only strategy | `npm run balance`, Hype/Fear balance output, response gate | Scenario/bound checks pass; no unresolved balance failure. PASS for supplied acceptance evidence. |
| Research/Career neighbor and offline boundaries | `hypeFear.test.ts`, `verifierRound089.test.ts`, retained Research/Career suites, root e2e | Career allocation, Research goal, offline policy, reload preserve countdown; offline does not resolve/switch/publish. PASS. |
| Persistence, schema/content migration, malformed/stale additions | Hype/Fear unit suite, restore/seal path, full unit and PWA lanes | Valid sealed state persists; malformed/stale Hype/Fear addition falls back safely; prior content remains operable. PASS. |
| PWA/startup/install and process cleanup | Full root 233/233, Pages 2/2, setup/build, port audit | Pass under host-authorized pinned Chromium; no verification preview listeners remained. PASS. |
| Portrait/accessibility/user-visible behavior | Independent Playwright probe at 320/393, 200% text, touch, keyboard-focused candidate lane, screenshots | No overflow, all observed actionable controls ≥44 CSS px, touch and error checks pass. PASS aside from findings above. |

## Findings

### V-089-001 — High — pre-recognition tool switching mutates locked state

Related requirement: D-039 recognition-gated Hype/Fear World behavior,
tool-switching panic, and the malformed/rejection boundary; plan §§13–14 and
19.

Expected: before `hypeFear.unlocked` is true, the locked World must disable or
reject tool switches and leave Hype/Fear state unchanged.

Actual: `applyToolSwitch` in `src/simulation/engine.ts:3103–3145` has no
recognition guard. `WorldView.tsx:440–450` disables only the current tool or a
pending-response state. From `createInitialState(89002)`, applying
`{ type: "SWITCH_TOOL", toolId: "fast-new-runtime" }` changes the state from
the stable initial Hype/Fear values to `currentToolId: "fast-new-runtime"`,
`fear: 0.05`, `expectationDebt: 0.08`, `toolSwitchingPanic: 0.18`, and
`toolSwitches: 1` while `unlocked` remains false. The World probe also found
the Fast new runtime button enabled and observed the same persisted mutation.

Exact reproductions:

1. `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound089.test.ts -t "does not allow tool-switching panic"`
2. Start `E2E_PORT=42392 ./scripts/run-e2e`, then run the independent probe
   command listed above; findings are `unrecognized tool switch is disabled`
   and `unrecognized tool switch leaves Hype/Fear unchanged`.

Concrete evidence: the final canonical unit gate shows the expected/received
Hype/Fear diff; the probe captured before/after localStorage values. This is a
correctable implementation defect and blocks acceptance.

### V-089-002 — Medium — available narrative card hides its deadline

Related requirement: plan §13.3 narrative deadline; D-039 UX requirement to
expose claim/source/audiences/deadline/evidence/counterevidence/effects/rules.

Expected: the first available narrative must disclose its finite deadline
before the player chooses creator coverage.

Actual: the catalog sets `local-builder-wave.deadlineHours` to `2.5`, but
`WorldView.tsx:93–133` renders no deadline field and
`WorldView.tsx:234–242` renders `COVER NEXT` for an available narrative. The
deadline appears only after coverage as `H TO PREDICT` / `H LEFT`. At both 320
and 393 CSS px, the card text omitted `2.5H`.

Exact reproductions:

1. `node_modules/.bin/vitest run --coverage=false src/ui/verifierRound089.test.tsx -t "exposes the first narrative deadline"`
2. Run the independent probe command above; it reports
   `initial narrative exposes its deadline at 320px` and at `393px`.

Concrete evidence: the final canonical unit gate prints the complete received
card text (`Hype signal … COVER NEXT … resolution rules …`) with no deadline;
the two portrait probe checks independently reproduce the omission. This is a
correctable user-visible defect and blocks informed prediction decisions.

### V-089-003 — Medium — creator preferences and access are inert content

Related requirement: plan §13.4 and D-039 creator behavior. Creators must
choose coverage based on audience incentives, preferences, access, usefulness,
trust, and current narratives; they are not merely ad-slot labels.

Expected: changing a creator’s stated preferences or access should alter
coverage eligibility, effect, or outcome when the narrative context changes.

Actual: `applyCoverNarrative` in `src/simulation/engine.ts:2752–2782` checks only
audience-incentive overlap and then uses reach/trust/usefulness (trust is used
for reputation below this range); `preferences` and `access` are never read.
`WorldView.tsx:246–247` likewise explains only a matching audience incentive.
An independent in-memory behavior probe covered the first recognized narrative
with Builder-opportunity creator Rhea Sol, then cleared her preferences and set
access to `"no access"`; both runs produced byte-identical Hype/Fear state
(`attention: 12.038`, `expectationDebt: 0.107`, same covered creator and
status). This makes two required creator fields descriptive rather than causal.

Exact reproduction: from the repository root, run a `tsx` probe that creates a
sealed recognized state, applies `COVER_NARRATIVE` with
`creatorId: "builder-opportunity"`, mutates only that creator’s in-memory
`preferences` and `access`, applies the same command again, and compares the
two `hypeFear` JSON values; output was `same: true` with the values above.

Concrete evidence: source inspection plus the independent before/after runtime
probe. This is a correctable implementation defect and blocks complete creator
archetype acceptance.

## Rule-of-Three evidence

- Normal valid state: recognized Hype coverage, bounded prediction, deterministic
  deadline resolution, hype response, separate fear response, and doom-feed
  recovery pass in focused unit/balance/browser lanes.
- Closest malformed/adversarial boundary: malformed prediction/unknown
  narrative and stale Hype/Fear restore pass; the locked tool boundary and
  missing initial deadline fail as V-089-001/V-089-002; inert creator
  preferences/access fail as V-089-003.
- Lifecycle/cross-feature neighbor: valid countdown survives Career and
  Research commands, JSON reload, safe offline policy, 64× progression, and
  PWA/offline startup. No process or page/console error remained in the
  independent probe.

## Unverified areas

No infrastructure blocker prevented verification. The detailed mechanical
effects of every later narrative template were not separately replayed after
the first two paths; deterministic balance and catalog/state validation covered
the finite set. No external production deployment was evaluated; local root
and Pages PWA contracts were exercised.

## Residual risks

- Candidate-authored e2e coverage passes but does not assert initial deadline
  disclosure or the locked tool no-op; the committed verifier tests/probe now
  preserve both regressions.
- Hype/Fear balance reports bounded attention and finite response gating, but
  player-facing economic dominance remains a model-level risk beyond the
  supplied deterministic scenario output.
- The three findings are implementation defects, not unavailable
  infrastructure; a fresh verifier round is required after repair.
