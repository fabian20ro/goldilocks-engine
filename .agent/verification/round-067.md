# Verification round 067 — Phase 4 compact quote-range boundary

Candidate SHA: ddf7246d748425e42a292d4427fe5798343cee46

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before creating verifier evidence:
  `ddf7246d748425e42a292d4427fe5798343cee46`. It exactly matched the
  Orchestrator-supplied candidate. Initial `git status --short` was empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, and retained verifier reports, including the complete
  round-066 report and its immutable `round-066-adversarial.mjs` probe.
  Applicable checklist: Milestones 0–3.6; plan §§2.4, 8–10, 19–20.7, 23–27,
  29; D-004, D-006–D-030; and retained findings. Deferred Research, creators,
  fear, workforce, startup, laboratory, multiple-pipeline, and narrative work
  remain outside scope.
- Candidate changes only Phase 4 compact-currency UI/test/CSS evidence. No
  Worker, simulation arithmetic, persistence schema, service worker, package,
  or browser configuration changed. Handoff and candidate-authored tests were
  navigation hints only. This verifier added a separate pinned-Playwright probe
  and did not modify production code or prior immutable evidence.

## Environment and setup

- macOS 26.6.1 arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1; repository-pinned
  Playwright 1.61.1.
- Ignored local caches: `.cache/npm` and `.cache/ms-playwright`. Temporary
  loopback previews used `127.0.0.1:4981`, `4983`, and `4984` only.
- Chromium cannot launch from the workspace sandbox because macOS blocks its
  Mach-port rendezvous registration. Scoped host browser runs used the pinned
  repository browser; browser verification was not silently skipped.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; source/diff audit; `git diff --check` | Pass: exact candidate frozen, initial worktree clean, expected narrow UI surface, no whitespace error. |
| `E2E_PORT=4977 ./scripts/verify` | Canonical setup/static lanes passed through format, lint, typecheck, unit/property (42 files / 197 tests), and the deterministic balance lane output. Its browser subprocess is blocked in the workspace sandbox before test bodies by the documented Mach-port limitation. |
| `E2E_PORT=4983 npm run test:e2e -- tests/e2e/command-deck.spec.ts` with scoped host launch | Pass: 8/8. Fresh five-tab starter/expanded screenshot matrix at 320×693 and 393×742; no overflow/undersized controls; per-tab scroll; Details/focus; Inspect priority; reduced motion; 200% text. Original-resolution screenshots inspected. |
| `E2E_PORT=4984 npm run test:e2e:pages` with scoped host launch | Pass: 2/2. GitHub Pages scope, Worker-backed offline reload, and foreign-cache preservation. |
| Fresh root build/preview at `127.0.0.1:4981`; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4981 node .agent/verification/round-067-adversarial.mjs` | One reproducible finding, V-070. Career route/Details/completion/Inspect, Jobs failed payout, and Jobs settlement-equation checks passed with no page/console errors. |
| `npx prettier --check .agent/verification/round-067-adversarial.mjs`; `node --check .agent/verification/round-067-adversarial.mjs`; `npx eslint --no-ignore .agent/verification/round-067-adversarial.mjs --max-warnings 0` | Pass. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom scope; retain one deterministic pipeline; exclude deferred systems | Candidate diff/source audit; no engine, Worker, schema, PWA, or dependency change; canonical static/balance evidence. | Pass. |
| Reproducible setup, formatting, lint, types, unit/property, deterministic balance, build/audit, and pinned browser tooling | Canonical command static lanes passed; pinned host Playwright command-deck and Pages lanes passed. Full hosted aggregate remains release evidence, not available from this local verifier. | Pass for locally testable candidate surface. |
| Retained engine/Worker numeric safety, queue-time quote, demand, failure/recovery, migration, ledger, and first-session contracts (Milestones 0–3; D-004, D-006–D-018) | Candidate does not modify those paths; canonical 197 unit/property tests and deterministic balance lane; fresh Jobs settlement, persisted queue, and Inspect-ledger probe. | Pass. |
| Career draft ownership, atomic evening, persistence/retry, route bounds, offline/reload, malformed recovery (20.7 Phases 0–2; D-019–D-025) | Candidate has no Career state/Worker change. Fresh Career probe starts clean, persists state, allocates Freelance, completes an evening, and reads Inspect ledger; retained canonical Career coverage remains green. | Pass. |
| Selected-stage ordering, compact catalogue, Details/replacement, portrait/200% touch/keyboard geometry (20.7 Phase 3; D-027–D-028) | Fresh current-candidate command-deck 8/8 at 320/393, expanded/starter states, 200% text, focus restoration, and per-tab scroll. | Pass. |
| Compact money: cents by default; a compact value promotes itself; only an explicitly additive settlement equation may share precision (20.7 Phase 4; D-030) | Source audit plus fresh persisted-quote browser probe. Queue 10 wrongly shares precision with eight undisplayed intermediate quotes. | Fail: V-070. |
| Career compact boundary: Cash/Savings/lifetime independent; each route/completed evening promotes only its own equation (D-030) | Clean initial state has `Cash $0.00`, `Savings $3.00`; one-hour Freelance shows `$2.166` net and `$0.110` configured cost; Details and completion/Inspect retain exact mills. | Pass; V-068 resolved. |
| Jobs selected-card compact payout | Fresh Jobs card says `A failed delivery pays $0.00 gross.` | Pass; V-069 resolved. |
| Settlement own-equation mills; exact Details/Inspect/ledger disclosure (D-030) | Fresh verifier probe creates a failure settlement after process-module removal; related settlement terms agree at shared precision. Career Details: `$2.276` gross, `$0.098` operating, `$0.012` electricity, `$2.166` economic net; Inspect ledger retains exact values. | Pass. |
| Shared glyph/status/card/warning language; Details/focus; bottom-tab scroll; reduced-motion; Inspect first-viewport diagnostic order | Fresh command-deck test and original-resolution 320/393 images: stable five-tab command deck, target geometry, focus/scroll, reduced motion, and bottleneck/baseline/latest-cause priority. | Pass. |
| Portrait visual matrix: five tabs × starter/expanded × 320/393 plus 200% text | Fresh 8/8 command-deck run generated 20 matrix images and four 200% captures; original resolution inspected. | Pass. |
| Persistence, restart, offline, root/Pages PWA scope and recovery | Fresh persisted Queue 10 probe plus Pages 2/2 Worker-backed offline reload/cache-scope tests. Candidate does not change these layers. | Pass. |
| Startup readiness/process cleanup | Fresh root preview reached application heading before every verifier action; Playwright-managed servers exited after tests. | Pass. |

## Findings

### V-070 — Queue 10 endpoint range borrows mills from undisplayed quotes

- Severity: Medium.
- Related requirement: plan §20.7 Phase 4; D-030 compact-money policy.
- Expected: A Queue 10 range displays its two endpoint quotes as independent
  compact values: cents by default, with mills only if that endpoint needs
  mills. The range is not an explicitly additive settlement/accounting
  equation. For the reproduced quotes, the label is `Queue 10 · locks $1.38 →
  $0.02`.
- Actual: The label is `Queue 10 · locks $1.380 → $0.020`. Its first and last
  values are both cent-exact; the precision comes from intermediate locked
  quotes which are neither endpoint nor displayed accounting terms.
- Reproduction:
  1. Build the frozen candidate and preview it at `127.0.0.1:4981`.
  2. Clear local storage, open Jobs, queue/settle the required starter at 64×,
     then pause when Queue 10 unlocks.
  3. Read Queue 10 before activating it, activate it once, then read the ten
     persisted `lockedGrossQuote` values from
     `goldilocks-simulation-save-v4`.
  4. Compare the rendered endpoints with isolated cents-default formatting.
- Concrete evidence: the committed verifier probe reports rendered
  `Queue 10 · locks $1.380 → $0.020`; saved values
  `[1.38, 1.284, 0.994, 0.511, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02]`; isolated
  endpoints `$1.38 → $0.02`; and the candidate's grouped formatting
  `$1.380 → $0.020`. `JobsView` builds `queueTenQuotes` for all ten values and
  passes the full array as `relatedAmounts` to both endpoint formatter calls.
- Blocks acceptance: Yes. D-030 permits shared mills only for an explicitly
  additive settlement equation; a min-to-max quote range is non-additive and
  fails the required compact value default.

## Adjudication of round-066 V-068 fixture mismatch

The immutable round-066 adversarial probe hard-coded initial Savings as
`$0.00`. Independent engine state establishes `createInitialCareerState()`
initializes `savings: 3` while cash is `0`; the candidate correctly renders
`Cash $0.00` and `Savings $3.00`. That retained fixture expectation is stale,
not a candidate defect. V-068's actual cross-equation precision leak is fixed;
V-069 is also fixed. This verifier did not edit immutable round-066 evidence.

## Unverified areas

- No hosted five-lane aggregate, exact verifier-SHA push, exact-SHA Pages
  deployment, live `build-info.json`, or focused live expert playthrough was
  performed. The frozen local candidate already has a correctable defect, so
  these cannot establish acceptance.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or storage-exhaustion run was performed.

## Residual risks

- macOS workspace sandbox blocks Chromium Mach-port registration. Scoped host
  runs used the pinned local browser and passed; retain CI/hosted corroboration.
- V-070 remains a visible mandatory D-030 policy violation. Repair must scope
  Queue 10 formatting to each endpoint, while preserving mill precision in
  actual additive settlement equations and exact Details/Inspect/ledger
  disclosures.
