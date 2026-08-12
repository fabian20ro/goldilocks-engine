# Verification round 070 — Phase 4 complete compact-currency audit

Candidate SHA: `63ee9c8136f1524c40fef0fa1baf7decb23198b1`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before creating any verifier artifact:
  `63ee9c8136f1524c40fef0fa1baf7decb23198b1`. It exactly matched the
  Orchestrator-supplied candidate. Initial `git status --short` was empty.
- Independently read `AGENTS.md`, complete `plan.md`, complete
  `.agent/DECISIONS.md`, `.codex/agents/verifier.toml`, the candidate diff,
  `.agent/HANDOFF.md`, immutable round-064/066/067/068 probes, and retained
  round-066–069 reports. Handoff, implementation comments, and
  implementation-authored tests were navigation hints only.
- Checklist: applicable Bedroom scope and exclusions; plan §§2.4, 8–10,
  19–20.7, 23–27, 29, and 34–35; D-004, D-006–D-030; all retained
  V-068–V-074 currency boundaries. In particular D-030 requires compact HUD,
  card, target, requirement, quote, and settlement-summary values to use the
  cents-default policy; only related additive equations may share mills;
  Details/Inspect/ledger accounting stays exact at three decimals.
- Candidate changes accounting presentation plus candidate tests. This verifier
  added only the independent `round-070-adversarial.mjs` and this report. No
  production code, production test, or earlier immutable evidence changed.

## Environment and setup

- macOS arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1; repository-pinned
  Playwright 1.61.1.
- `./scripts/setup` ran through the canonical command using ignored
  repository-local npm and Chromium caches. `npm audit --omit=dev
  --audit-level=high` reports zero production vulnerabilities.
- Sandbox Chromium launch cannot register its macOS Mach rendezvous port. The
  static/unit plus numeric and first-session-balance phases of
  `E2E_PORT=5300 ./scripts/verify` passed before the known candidate defect
  made further redundant full-gate time nonproductive; repository-pinned
  browser checks below ran on an isolated host-loopback production preview at
  `127.0.0.1:5310`. The preview was stopped and the port then refused
  connections. Browser verification was not skipped.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; `git show --stat`; candidate diff/source audit | Pass: frozen SHA exact; initial worktree clean; expected Phase 4 accounting surface. |
| `E2E_PORT=5300 ./scripts/verify` | Canonical setup, Prettier, ESLint, TypeScript, 44 unit/property files / 217 tests, numeric and first-session balance phases passed. Workspace sandbox blocks Chromium. A redundant host full run was deliberately stopped during its existing 20,001-seed upgrade sweep after the known candidate defect; its broader candidate-authored claimed results are not relied upon here. |
| `E2E_PORT=5303 npm run test:e2e -- tests/e2e/phase-4-currency.spec.ts --reporter=list` | Pass: 4/4 pinned browser checks. Queue endpoint boundary, V-071 compact/exact disclosures, V-072 settlement cash floor, V-074 tier cards, and V-073 persisted purchase accounting passed. |
| Direct TypeScript engine probe: module/hardware/expansion success and shortfall; exit; cents-era save recovery | Pass: each capital success/shortfall record and exit record renders fixed three decimals; legacy `$4.00` first-session purchase provenance restores validly to `buy-and-install`. Expansion success is present before its later hardware warning in the ledger. |
| Fresh production preview; retained `round-068-adversarial.mjs` | Pass: no findings. V-071 standalone Career action, Build warning, failed settlement exact ledger/reload, and browser-error checks remain clean. |
| Fresh production preview; retained `round-064-adversarial.mjs` | Pass: 24 screenshots across five tabs × starter/expanded × 320/393; 44px/overflow/nested-rail checks; keyboard/focus, CDP touch drag, placement/cancel, 200% tray, root PWA controller and offline reload; no findings. Original-resolution deck inspected. |
| Fresh production preview; retained `round-067-adversarial.mjs` | One stale-probe timing mismatch only: it reads Queue 10's pre-render quote, then compares it after a Worker tick changes current demand. Its own saved accepted range was `$1.38 → $0.02`; the candidate's authoritative poll-based 4/4 check computes the same current state and passes. Not a candidate defect or a regression of V-070. All other retained r067 checks passed. |
| Fresh production preview; `round-070-adversarial.mjs` | Fail: direct 393×742 Career threshold reproduction exposes V-075; model tier thresholds pass and there are no page/console errors. Original-resolution screenshot inspected. |
| `node --check`, `npx prettier --check`, and `npx eslint --no-ignore` for `round-070-adversarial.mjs`; `git diff --check`; production audit | Pass. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom scope; one deterministic pipeline; no Research/deferred system | Candidate diff/source audit; retained canonical and browser evidence. | Pass. |
| Reproducible setup, static checks, unit/property, deterministic balance, build, audit, and pinned browser tooling | Canonical static/unit plus numeric/first-session balance segment; focused pinned 4/4 and independent browser probes; production audit zero. Full redundant host gate stopped after known FAIL. | Pass for current changed-surface regression. |
| Retained numeric safety, queue-time locking, demand, migration/persistence, failure/recovery, Worker boundary, PWA/root/Pages | Canonical unit/property plus observed numeric/first-session balance segment; R064 persistent placement/root PWA/offline; candidate has no change to those layers. | Pass for changed-surface regression. |
| Career draft ownership, atomic evening, 1×/64×, rejection/recovery, reload/offline, keyboard/touch | Canonical retained suites; R064 interaction/focus/touch/reload evidence; focused Phase 4 browser flow. | Pass for changed-surface regression. |
| Phase 3 selected-stage inventory, explicit placement, cancel/focus, expansion, 320/393 and 200% geometry | R064 full ownership/starter-expanded deck, replace/move/bypass/cancel/CDP touch and tray geometry; original images inspected. | Pass. |
| V-068: independent Career Cash/Savings remain compact while route/evening equations are local | Retained R067 probe's Career paths pass except its unrelated Queue 10 timing assertion; candidate focused suite preserves separate Career values/equations. | Pass. |
| V-069/V-071: compact Jobs failed-card, standalone private-evaluation action, Build warning; exact failed-settlement ledger/reload | Candidate 4/4 and retained R068 both pass. | Pass. |
| V-070: Queue 10 is a non-additive range and endpoint precision is independent | Candidate authoritative current-state poll-based browser test passes. Retained R067 mismatch is a stale read across a Worker tick, not displayed intermediate-quote precision and not used as acceptance evidence. | Pass. |
| V-072: one additive settlement row promotes every visible term, including cash floor | Candidate 4/4 browser test and source audit: `settlementMoney(0)` receives the same related equation. | Pass. |
| V-073: capital purchase/shortfall and Bedroom exit ledger accounting is fixed three decimals; cents-era provenance recovers safely | Direct exhaustive engine branch probe plus candidate test pass: module, hardware, expansion success/shortfall and exit all exact; legacy cents first-session record safely restores. | Pass. |
| V-074: Career tier-card thresholds are compact cents-default values | Candidate 4/4 and fresh R070 probe: `$8.00`, `$18.00`, `$8.00`. | Pass. |
| Every compact money summary, card, progress target, and requirement uses shared cents-default policy | Fresh R070 probe: ordinary visible Career exit prerequisite says `save $24`, bypassing cents-default. | Fail: V-075. |
| Details/Inspect/ledger exact accounting, shared glyph/status/details/focus/scroll/reduced motion; Inspect priority | Candidate/retained probes and original five-tab deck inspection. Currency exception V-075 remains. | Fail only for V-075. |
| Portrait 320/393, 44px controls, touch/keyboard, 200% text, reduced motion, no document overflow/nested rail trap | R064 24-image assertions, tray images, CDP touch and original-resolution inspection. | Pass. |
| Startup readiness and process cleanup | `127.0.0.1:5310` production preview reached readiness; after explicit cleanup it returned connection refused. | Pass. |

## Findings

### V-075 — Career exit progress target bypasses compact cents-default currency

- Severity: Low.
- Related requirement: plan §20.7 Phase 4; D-030 compact HUD/cards/progress
  targets/requirements policy.
- Expected behavior: The visible Career exit prerequisite is a compact progress
  target and must use the shared cents-default formatter: `save $24.00`.
- Actual behavior: Career renders `Bedroom Developer exit: save $24, submit one
  Cup entry, release Deskflow Local, and unlock Kiln 13B.` The adjacent live
  current savings uses compact formatting (`$3.000` in this state), making the
  raw threshold visibly inconsistent with the required shared policy.
- Exact reproduction procedure:
  1. Build the frozen candidate and start a local preview.
  2. Clear local storage and open Career at 393×742.
  3. Open the `Independent conclusion` disclosure.
  4. Read the `Bedroom Developer exit` status line.
- Concrete evidence: committed `round-070-adversarial.mjs` records the full
  rendered line and expects `save $24.00`; it exits nonzero only for that
  violation. Original screenshot
  `/tmp/goldlocks-verifier070-adversarial/career-exit-threshold.png` was
  inspected. Source independently confirms the raw `save $24` literal in
  `src/ui/App.tsx` while V-074's sibling tier requirements use the formatter.
- Blocks PASS: Yes. The specified policy is mandatory across compact progress
  targets and requirements; this is a correctable user-visible omission.

## Prior-finding adjudication

- V-068: resolved. Independent quick Career resources remain separate from
  related route/evening equations.
- V-069: resolved. Selected Jobs failure payout remains `$0.00` compact.
- V-070: resolved. Candidate's current-state test correctly checks Queue 10
  endpoints independently; the older R067 probe has a tick-race read and is
  not evidence of an implementation regression.
- V-071: resolved. Independent Career/Build compact values and failed
  settlement exact ledger/reload remain clean in R068.
- V-072: resolved. Mill settlement cash floor participates in the visible
  equation and renders `$0.000` when promoted.
- V-073: resolved. All capital and exit durable ledger branches use exact
  three-decimal money; legacy cents provenance remains recovery-only.
- V-074: resolved. Career model-tier requirement cards use cents-default
  `$8.00`, `$18.00`, and `$8.00`.

## Unverified areas

- No hosted five-lane aggregate, verifier-SHA push, exact-SHA Pages deployment,
  `build-info.json` smoke, or optional live expert playthrough. V-075 is a
  correctable local mandatory defect, so release acceptance cannot proceed.
- The full root/Pages canonical browser aggregate was not rerun after V-075;
  focused current-candidate browser and retained root offline/PWA coverage ran,
  but a repaired candidate needs the full aggregate afresh.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or storage-exhaustion pass.

## Residual risks

- V-075 requires a narrow presentation repair. It must preserve the compact
  versus exact boundary: exit-card threshold compact cents, live current
  summaries self-promoting only when needed, and exit ledger fixed-three.
- The R067 immutable quote probe demonstrates a Worker-timing fixture hazard;
  future verifier probes should snapshot the same Worker state as their
  displayed preview before comparing a live quote.
- Local macOS sandbox blocks Chromium Mach-port launch; scoped host runs used
  the repository-pinned browser and completed the required independent probes.
