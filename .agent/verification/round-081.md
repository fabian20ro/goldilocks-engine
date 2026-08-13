# Verification round 081 — settlement-event provenance

Candidate SHA: `d2a54982f55d248c2cd96f9da994f60934bab8e1`

VERDICT: FAIL

## Candidate freeze and independent basis

Before any verifier write, `git rev-parse HEAD` returned
`d2a54982f55d248c2cd96f9da994f60934bab8e1`, exactly matching the assigned
candidate; `git status --short` was empty.  This report, the adversarial
browser probe, and the focused regression test are the only verifier-authored
changes.

Independently reviewed all of `plan.md`, `.agent/DECISIONS.md` through D-034,
and immutable verification reports `round-001.md` through `round-080.md`.
Implementation handoff, candidate-authored tests, and comments were used only
as navigation hints.  Candidate production inspection covered the v7 optional
settlement/event fields, `restoreSimulationState`, structural validation,
ledger bounding, event-ID allocation, `advanceTickQuantum`, and the Jobs
presentation selector.

Candidate delta is headed by `d2a5498 fix(jobs): bind settlement cause to
ledger event`.  It adds `lastSettlement.ledgerEventId`,
`LedgerEvent.settlementTaskId`, and `LedgerEvent.settlementFailureCause` and
renders a mapped enum only when the linked event has the same task ID.  Those
fields are shape-validated only: they are not causally authenticated, tied to
the original event allocation, or checked against event-ID sequence/order.

## Environment and setup

- macOS/Darwin arm64 workspace; repository-local npm and Playwright caches.
- Clean Node 22 used for canonical and probe commands through
  `npm exec --yes --package=node@22`; project-pinned Playwright `1.61.1`.
- Browser: repository-downloaded Chromium, loopback production preview started
  by `./scripts/run-e2e` at `http://127.0.0.1:43182` and readiness-confirmed.
- Browser output directories: `/private/tmp/goldlocks-r081*` (outside Git).

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier writes | Exact candidate SHA; clean. |
| `E2E_PORT=43181 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- sh ./scripts/verify` | Exit 0. Fresh `npm ci`, format, lint, typecheck, unit/integration, balance, build, production dependency audit, root E2E, and Pages E2E lanes passed. Playwright last-run status `passed`. |
| `tmux new-session -d -s verifier081 "cd /Users/fabian/git/goldlocks-engine && E2E_PORT=43182 npm_config_cache=/Users/fabian/git/goldlocks-engine/.cache/npm npm exec --yes --package=node@22 -- sh ./scripts/run-e2e"` | Production build/preview served at loopback and used for independent probes. |
| `tmux kill-session -t verifier081` | Pass; verifier preview stopped before commit. |
| `BASE_URL=http://127.0.0.1:43182 OUTPUT_DIR=/private/tmp/goldlocks-r081-retained PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-080-adversarial.mjs` | Pass; V-079 free-text decoy does not alter the rendered cause. Raw 320 keyboard and raw 393 touch, native Details, 200% text/reduced motion, reload, and offline root reload all passed. |
| `BASE_URL=http://127.0.0.1:43182 OUTPUT_DIR=/private/tmp/goldlocks-r081-round079 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-079-adversarial.mjs` | Pass; Jobs accounting/queue clearance, success/zero/partial settlement amounts, reload, native disclosure, 44px targets, 320/393 single-column geometry, 200% text/reduced motion. |
| `BASE_URL=http://127.0.0.1:43182 OUTPUT_DIR=/private/tmp/goldlocks-r081-deck PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-078-adversarial.mjs` | Pass; 40 screenshots (five tabs × starter/expanded × 320/393 × raw/200%), pointer and CDP-touch drag/reload, keyboard/touch disclosure, Career draft reset, malformed-save recovery, PWA offline root reload, no console/page errors, overflow, nested scroll, or undersized controls. Five raw-320 images visually inspected. |
| `BASE_URL=http://127.0.0.1:43182 OUTPUT_DIR=/private/tmp/goldlocks-r081 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-081-adversarial.mjs` | Expected adversarial failure: two false causal explanations (320 and 393) and one post-reload event-ID collision freeze; exact evidence below. |
| `npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- npx vitest run --coverage=false src/ui/verifierRound079.test.tsx src/ui/verifierRound080.test.tsx src/ui/verifierRound081.test.tsx src/ui/settlementProvenance.test.tsx src/simulation/engine.test.ts` | 59 passed, 2 failed, both intentionally failing new `verifierRound081` assertions exposing V-080/V-081. Existing V-078/V-079 regression coverage passed. |
| `npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- npx prettier --check src/ui/verifierRound081.test.tsx .agent/verification/round-081-adversarial.mjs`; `npx eslint ... --max-warnings 0`; `node --check .agent/verification/round-081-adversarial.mjs`; `npx tsc -b --pretty false` | All pass after formatting the verifier artifacts. |

## Requirement matrix

| Applicable requirement | Evidence and result |
| --- | --- |
| Plan §§1–16, 18–23 core idle-game simulation/UI; §25 scope/performance | Canonical clean Node-22 gate passed; retained complete five-tab browser deck passed. Candidate did not regress normal startup, navigation, accessibility, responsive layout, core task/upgrade/inspect flows, or bounded-ledger behavior exercised by those checks. |
| Plan §17 truthful Jobs failure explanation; D-034: engine-owned cause only for the settlement's exact failure event/task and otherwise honest unknown | **FAIL — V-080.** A stale integrity save can change all optional structural links to a later event and a matching enum. Restore accepts and reseals it, and Jobs visibly reports the forged engine cause rather than unknown. |
| Plan §19 deterministic event ledger; §§24.1/24.5 deterministic state and save compatibility; §24.6 no corruption of restored simulation; §20.7 malformed-state recovery | **FAIL — V-081.** A stale ledger ID can be changed to the predictable next generated ID. Restore accepts/reseals it; the next tick duplicates that ID, structural validation rejects the result, and the simulation remains frozen. |
| D-034 normal real failure, later unrelated Career failure, same-task free-text decoy | Pass for the narrower repaired cases: candidate/retained provenance tests select the original failure after later Career failure; `round-080-adversarial.mjs` found no free-text-decoy finding at both viewports and modes. This does not establish the malformed structural relation rejected by V-080. |
| D-034 legacy/missing/bounded/stale/malformed fallback | Missing/evicted link returns no selected event and the UI's existing fallback is honest unknown in direct engine inspection. Legacy optional-field absence remains structurally valid. **Malformed/relinked** data fails this requirement under V-080 and V-081. |
| Browser requirements: 320/393 portrait, raw/200% text, keyboard/touch, reduced motion, reload/resume, offline/PWA, errors/layout | Pass for the retained full adversarial decks and targeted normal/provenance paths. V-080 is additionally user-visible in raw 320 keyboard and raw 393 touch, with 200% reduced-motion screenshots; layout and controls remain usable but the content is false. |
| Installation, startup, clean canonical verification, process behavior | Pass before verifier regressions were added: clean local dependency/browser setup, production preview readiness, canonical gate exit 0. Preview cleanup recorded below. |

## Findings

### V-080 — stale structural settlement provenance can forge a precise failure cause

- **Severity:** High
- **Related requirement:** Plan §17; §20.7; §24.6; D-034 causal-provenance and honest-unknown rules.
- **Expected behavior:** A stale, legacy, or malformed save must show an
  engine-owned Job failure cause only if durable causal provenance proves that
  the failed settlement is tied to its own failure event. A later event,
  matching task ID, enum, or altered prose must not manufacture that proof;
  fallback must be `Cause unknown`.
- **Actual behavior:** `isStateStructurallyValid` accepts arbitrary optional
  nonempty `ledgerEventId`, `settlementTaskId`, and legal failure enum. A stale
  record can relink a failed settlement to a later event, set the same task ID
  and `memory-capacity-exceeded`, then pass restore and be integrity-resealed.
  `findSettlementFailureEvent` selects it and Jobs renders `Required memory
  exceeded available memory.`
- **Exact reproduction:**
  1. Execute the focused Vitest command in the command table. Its first new
     assertion constructs a real failed starter task, captures it as a stale
     record, converts a later ledger event to `kind: 'failure'`, gives it the
     captured settlement task ID and `settlementFailureCause:
     'memory-capacity-exceeded'`, relinks `lastSettlement.ledgerEventId`, then
     calls `restoreSimulationState` and renders Jobs.
  2. Candidate result: expected `undefined`/unknown, received `Required memory
     exceeded available memory.`
  3. Execute `round-081-adversarial.mjs` command above. It performs the same
     localStorage restore/reload as a user would. At both 320 and 393 it reports
     `Failure record: Required memory exceeded available memory. Recovery
     forecast: steady quote $1.40 after time recovery. No recovery action was
     applied.` rather than an unknown fallback. Screenshots:
     `/private/tmp/goldlocks-r081/forged-provenance-320-200-reduced.png` and
     `/private/tmp/goldlocks-r081/forged-provenance-393-200-reduced.png`.
- **Concrete cause:** A checksum/reseal establishes only internal consistency
  of the attacker/stale record. The newly optional fields provide no immutable
  relation to the original event allocation, and validation does not reject or
  neutralize fabricated links.
- **Blocks PASS:** Yes.

### V-081 — predictable future ledger ID freezes restored simulation

- **Severity:** High
- **Related requirement:** Plan §19; §§20.7, 24.1, 24.5, 24.6; D-034 event-ID
  ordering, persistence, and safe malformed fallback.
- **Expected behavior:** A malformed or stale event ID must be rejected,
  repaired, neutralized, or allocated around. After restore, progression must
  continue and newly emitted ledger IDs must remain unique.
- **Actual behavior:** Event IDs are allocated predictably as
  `evt-${tick}-${eventSequence + 1}`, but restoration validates only that IDs
  are unique at the instant of restore. Changing an existing later ID to the
  next expected ID therefore passes restore/reseal. On the next quantum, the
  engine creates the same ID; structural validation fails and `tick` returns
  the old state forever.
- **Exact reproduction:**
  1. Execute the focused Vitest command above. Its second new assertion starts
     with a real failed settlement, captures a stale snapshot, queues another
     task, changes the later event's ID to
     `evt-${snapshot.tick + 10000}-${snapshot.eventSequence + 1}`, restores,
     and calls `tick(restored, 10)`.
  2. Candidate result: expected a greater tick, received the unchanged tick
     `60000`; duplicate ledger ID causes the complete update to be discarded.
  3. Execute the browser probe command above. It applies the equivalent
     localStorage mutation and reload. At 393px, saved state stays
     `{"before":{"tick":32000,"eventSequence":7},"after":{"tick":32000,"eventSequence":7,"queued":1}}`
     after 64× speed / wait; Worker progress has frozen.
- **Concrete cause:** The optional v7 fields and ledger schema allow any
  bounded string for `id`; neither migration nor structural validation relates
  existing IDs to tick/sequence allocation, while the generator can collide
  with user-supplied historical IDs.
- **Blocks PASS:** Yes.

## Unverified areas

- No hosted deployment/browser device lab was used; reproducible local
  repository-pinned Chromium is the applicable acceptance environment.
- Native screen-reader speech output was not available. Semantic controls,
  keyboard operation, focus, touch, sizing, text scaling, and reduced motion
  were tested through Playwright.
- No repair was attempted, as required for the Verifier role. A repaired
  candidate needs a fresh clean canonical run and fresh verification round.

## Residual risks and handoff

- V-080 is a user-visible causal-truth failure: a stale saved game can present
  a specific, false engine explanation even though ordinary free-text decoys
  are now ignored.
- V-081 is a persistence/restart availability failure: a syntactically accepted
  saved state can permanently stop future worker progression.
- `src/ui/verifierRound081.test.tsx` and
  `.agent/verification/round-081-adversarial.mjs` are intentionally retained
  verifier regressions. They must remain failing until production behavior is
  fixed; do not weaken or delete them to obtain a green result.
- Stop the verifier preview before commit; no browser/application process is
  intentionally left running.
