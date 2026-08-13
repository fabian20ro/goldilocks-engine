# Verification round 080 — settlement provenance recovery

Candidate SHA: `4bccd96ef985c8ae1d4440ed9e3b7967cad8070c`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `4bccd96ef985c8ae1d4440ed9e3b7967cad8070c`. It exactly matches the supplied
  candidate SHA. Initial `git status --short` was empty.
- Independently read `AGENTS.md`, `.codex/agents/verifier.toml`, full
  `plan.md`, `.agent/DECISIONS.md` through D-033, and immutable verification
  reports through round 079. `.agent/HANDOFF.md` and candidate-authored tests
  were used only as leads.
- Candidate production diff is narrow: `JobsView` delegates failed-settlement
  lookup to `findSettlementFailureRecord`; the helper reverse-searches failures
  for a task-ID substring. No candidate Worker, engine, schema, persistence,
  PWA, accounting, or Career production behavior changed.
- V-078's ordinary later-Career-failure path is repaired: the unchanged
  round-079 regression and the candidate's normal Career/restore test pass.
  No historic verifier assertion was deleted or weakened.
- Verifier added only `src/ui/verifierRound080.test.tsx`,
  `.agent/verification/round-080-adversarial.mjs`, and this immutable report.
  No production repair was made.

## Environment and setup

- Darwin 25.6.0 arm64; Node `v22.23.2` via
  `npm exec --yes --package=node@22`; repository-pinned Playwright `1.61.1`.
- Ignored repository-local npm and Playwright caches were used. Clean canonical
  setup invoked the repository `npm ci` path.
- Browser evidence used a temporary Node-22 `./scripts/run-e2e` loopback
  preview at `127.0.0.1:42881`, pinned browser/cache, fresh browser contexts,
  and no existing profile. The tmux preview was stopped and its port confirmed
  closed after testing.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| Candidate SHA/status freeze; source/diff audit; `git diff --check` | Pass: exact frozen candidate, clean initial worktree, no whitespace defect. |
| `E2E_PORT=42880 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- sh ./scripts/verify` | Pass: clean setup, format, lint, TypeScript, 48 unit/property files / 230 tests, numeric plus first-session/upgrades/progression/Career/evaluation balance lanes, production build/audit, root browser and Pages browser lanes completed. Fresh root/Pages report artifacts record passed status. |
| `npm exec --yes --package=node@22 -- npx vitest run --coverage=false src/ui/verifierRound079.test.tsx src/ui/settlementProvenance.test.tsx src/ui/verifierRound080.test.tsx` | Two pass (retained V-078 regression and candidate normal Career/restore regression); verifier round-080 test fails exactly as V-079 documents. |
| `BASE_URL=http://127.0.0.1:42881 OUTPUT_DIR=/private/tmp/goldlocks-r080-retained PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-079-adversarial.mjs` | Pass: raw 320×693 and 393×742 success/zero-payout/partial/no-settlement flows, selected Queue reserve (136.453125px / 157.3125px), native Details keyboard/touch, reload, 200% text, reduced motion, 44px targets, no horizontal/nested overflow, and no page/console errors. |
| `BASE_URL=http://127.0.0.1:42881 OUTPUT_DIR=/private/tmp/goldlocks-r080 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-080-adversarial.mjs` | Expected failure: stale provenance decoy displayed at both 320px keyboard and 393px touch contexts. The same probe passes independent 393px offline reload/worker-backed Jobs operation, one native Details control, touch/keyboard operation, 200%-text reduced-motion geometry, and error checks. |
| `prettier --check`, `eslint --max-warnings 0`, `node --check` for verifier artifacts; `npm run typecheck` | Pass. |
| `npm audit --omit=dev --audit-level=high` under Node 22 | Pass: `found 0 vulnerabilities`. |
| Original-resolution PNG inspection | Normal retained 320px success and 393px partial-failure captures are readable, one-column, and correctly show genuine provenance. Fresh stale-state captures at `/private/tmp/goldlocks-r080/stale-provenance-{320,393}-200-reduced.png` visibly show the forged direct cause. |
| `tmux kill-session -t verifier080`; loopback curl | Pass: verifier preview stopped; `127.0.0.1:42881` closed. |

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| Plan §17: causal records distinguish supported direct causes from correlations/unknowns | A later unrelated, malformed ledger record is displayed as this settlement's direct cause after permitted stale-save recovery. V-079. | Fail |
| D-033 first-level latest-settlement decision record and direct cause/recovery | Normal success/failure and the ordinary later-Career-event flow show the correct settlement data. The stale recovery path asserts false causal certainty, so the complete requirement fails. | Fail |
| D-033 actual `netChange`, exact economic equation, payment/floor, mill precision | Retained probe covers success, zero-payout/full payment, and partial payment; Details remains separate from actual cash. Canonical currency/Jobs regressions pass. | Pass |
| D-033 exactly one native `Settlement accounting and provenance` disclosure | Both independent probes assert one `DETAILS`, exact native summary, keyboard/touch activation, and 44px scaled target. | Pass |
| D-033 / D-018 portrait layout and accessible interaction | Retained raw 320/393 reserve, 200% reduced-motion visual/geometry, no overflow/nested scroll, focus, keyboard, and touch checks pass. | Pass |
| D-014–D-017 durable first-session and malformed-save recovery preservation | Canonical retained migration/reload suite passes; no candidate production change crosses the command, guide, or topology boundary. The narrower causal-provenance claim under stale recovery fails separately as V-079. | Pass with V-079 limitation |
| Plan §§19, 23–24 and D-008 persistence, restart, offline/PWA safety | Canonical root/Pages PWA lanes pass. Independent 393px offline reload retains the worker-backed Jobs flow. Stale reload is itself reproducibly safe structurally but has incorrect causal presentation (V-079). | Fail |
| Plan §20.7 Phase 4 retained cross-screen, accounting, deterministic and regression behavior | Full canonical static/unit/balance/build/browser/PWA gate passes; source audit confirms narrow presentation-only candidate scope. | Pass |
| Plan §20.4 accessibility and §27 mobile/resume/testing evidence | Repository-pinned browser exercises representative 320/393, raw/200%, reduced motion, keyboard, touch, reload, offline, errors, and screenshots. | Pass |
| Security/install/startup/process cleanup | Fresh package setup, production audit, deterministic loopback readiness, and verifier-process cleanup pass. | Pass |
| V-078 regression preservation under ordinary later unrelated Career activity | Immutable round-079 regression and candidate `settlementProvenance.test.tsx` pass; source audit confirms its test remains intact. | Pass |

## Findings

### V-079 — Stale ledger decoy can impersonate failed-settlement provenance

- Severity: High / P1.
- Related requirement: plan §17 causal-postmortem truthfulness; plan §20.7
  persistence/causal-evidence foundation; D-033's requirement that the compact
  record use the existing ledger cause for *that* engine-owned settlement.
- Expected behavior: When current-schema state is restored after benign stale
  integrity damage, a later unrelated ledger event must not become the failed
  `lastSettlement`'s direct cause merely by mentioning its task ID. The UI must
  locate the genuine accepted-task record or retain the honest unknown fallback.
- Actual behavior: `findSettlementFailureRecord` reverse-searches any
  `kind === "failure"` whose free-form message includes
  ` task ${taskId} `. A structurally valid current save with stale integrity is
  allowed to recover and reseal; a later changed Capture record then satisfies
  that loose predicate. Jobs reports `Forged unrelated cause.` as a direct
  `Failure record` for the earlier failed Interactive Chat settlement.
- Exact reproduction:

  1. Run the focused Node-22 command above containing
     `src/ui/verifierRound080.test.tsx`.
  2. It creates a real `task-0-1` failure by removing Runtime, queueing one
     Interactive Chat job, and ticking 60 seconds. Its genuine engine record
     says `The active pipeline had no model stage.`
  3. It creates a later real Capture record, changes only that persisted ledger
     event to `kind: "failure"`, message
     `Unrelated later failure mentioned task task-0-1 but did not settle it.`,
     and direct cause `Forged unrelated cause.`, leaving the integrity stale.
  4. `restoreSimulationState` accepts, reseals, and returns a valid state; the
     actual `JobsView` renders `Failure record: Forged unrelated cause.`
  5. Run the focused Playwright command above for the same persisted mutation
     through the UI. It reproduces after reload at raw 320px and touch 393px,
     including 200%-text/reduced-motion captures.
- Concrete evidence: focused Vitest receives expected
  `The active pipeline had no model stage.` but actual
  `Failure record: Forged unrelated cause. Recovery forecast: steady quote $1.40 after time recovery. No recovery action was applied.` The browser probe emits the identical failure at both widths and its inspected PNGs show it.
- Blocks PASS: Yes. The candidate converts an unrelated, untrusted later event
  into a player-visible mechanically certain cause, violating causal provenance
  and the required malformed/recovery behavior.

## Unverified areas

- No native non-Chromium screen-reader speech session. Native Details semantics,
  programmatic labels, focus, keyboard, touch, and visual geometry have direct
  pinned-browser evidence.
- Hosted exact-SHA deployment/live smoke is a post-PASS release action and was
  not attempted for this failing candidate.

## Residual risks

- A repair must preserve the demonstrated V-078 normal Career-event behavior
  while making settlement provenance robust to malformed/stale free-form ledger
  records. A structured association or equivalently strict engine-origin proof
  is required; a looser latest-event or substring heuristic is insufficient.
- The verifier regression intentionally remains failing until a later candidate
  resolves V-079 without weakening it.
- The bounded ledger can legitimately lose old provenance; that case must stay
  an explicit unknown rather than be replaced by a nearby event.
