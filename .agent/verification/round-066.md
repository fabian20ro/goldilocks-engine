# Verification round 066 — Phase 4 cross-screen consistency

Candidate SHA: 63a31e194c45603f08f1a9b96b4c158f738f8c57

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured git rev-parse HEAD before writing a verifier artifact:
  63a31e194c45603f08f1a9b96b4c158f738f8c57. It exactly matched the
  Orchestrator-supplied candidate. Initial git status --short was empty.
- Independently read plan.md, AGENTS.md, .codex/agents/verifier.toml,
  .agent/DECISIONS.md, all prior verification-report indexes, full retained
  rounds 063–065, and the candidate source. Checklist: applicable Milestones
  0–3.6; plan §§2.4, 8–10, 19–20.7, 23–27, and 29; D-004, D-006–D-030; and
  retained V-001–V-067. Deferred Research, creators, fear, workforce,
  startup, laboratory, multiple-pipeline, and narrative systems remain out of
  scope.
- Candidate commit is feat: harden phase four command deck consistency. It
  changes shared currency helpers/tests, App, module inventory, CSS,
  command-deck browser coverage, decisions, and handoff. No Worker, schema,
  persistence/PWA implementation, dependency, or lockfile change. git diff
  --check passed.
- Handoff claims and candidate-authored checks were navigation hints only.
  This verifier ran canonical gates, source-audited the formatter consumers,
  used a separate repository-pinned Playwright probe, and inspected rendered
  images at original resolution. No production code was modified.

## Environment and setup

- macOS 26.6.1 arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1;
  repository-pinned Playwright 1.61.1.
- Canonical setup used ignored repository-local npm and Chromium caches:
  .cache/npm and .cache/ms-playwright.
- Chromium cannot start in the workspace sandbox because macOS denies its
  Mach-port rendezvous registration before test bodies run. The exact canonical
  command was rerun with scoped host browser-launch permission; browser
  verification was not skipped.
- Local temporary servers used only 127.0.0.1:4966–4968 and 4173. Verifier
  sessions were stopped; final checks for 4173 and 4968 returned connection
  refused.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| git rev-parse HEAD; git status --short; git show --stat; git diff --check | Pass: exact frozen candidate, clean initial worktree, expected Phase 4 surface, no whitespace error. |
| E2E_PORT=4966 ./scripts/verify in workspace sandbox | Static/setup/unit/balance/build/audit lanes passed; Chromium launch alone failed before test bodies with MachPortRendezvous permission denial. Infrastructure limitation only. |
| E2E_PORT=4967 ./scripts/verify with scoped pinned Chromium launch | Pass: clean setup; format, lint, typecheck; 42 unit/property files and 195 tests; numeric, first-session, 20,001-seed upgrade, progression, Career, and evaluation balance gates; production build; production audit 0 vulnerabilities; root Playwright 200/200; Pages/offline Playwright 2/2. |
| npx prettier --check .agent/verification/round-066-adversarial.mjs; node --check probe; npm run lint | Pass after verifier-tool additions. |
| Fresh preview on 4968; repository-pinned round-064 adversarial probe | Pass: 24 captures, no findings, no page/console errors. It covered 5-tab starter/expanded decks at 320/393, full-ownership selected-stage ordering, purchase/place/reload, keyboard/Escape focus, tab cancellation, CDP touch move, remove/bypass, 200% tray geometry, root PWA controller/scope, and offline reload. |
| Fresh preview on 4968; round-066-adversarial.mjs | Completed all checks. Two candidate defects only: unrelated Career projection mills promote independent Cash/Savings; Jobs card emits raw $0. Exact Career Details equation, Build↔Jobs scroll, preset load, Build/Career Details focus, no Details-created placement, reduced motion, malformed-save reset, and no browser errors passed. |
| Original-resolution visual inspection | Inspected all 20 starter/expanded 320/393 screenshots, two 200% text tray screenshots, Inspect first-viewport screenshots, and focused precision/recovery screenshots. Layout, first-viewport priority, target geometry, focus, and motion presentation were coherent apart from V-068/V-069 text precision. |
| ./scripts/run in isolated tmux; curl root; stop; connection check | Pass: root responded HTTP 200; 4173 returned connection refused after cleanup. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom scope; retain the one deterministic pipeline and exclude deferred systems | Candidate source/diff audit; full canonical deterministic and browser gates. | Pass. |
| Reproducible setup, formatting, lint, types, unit/property, deterministic balance, production build, and zero production dependency vulnerabilities | Scoped-host canonical gate: 42 files/195 tests, all balance groups, build, and audit 0 production vulnerabilities. | Pass. |
| Retained engine/Worker numeric safety, exact money arithmetic, queue-time quotes, demand, failure/recovery, migration, and ledger contracts (Milestones 0–3; D-004, D-006–D-018) | Candidate does not change engine/Worker/schema; canonical unit/property/balance, root, and Pages suites. | Pass. |
| Phase 2 Career draft ownership, atomic evening execution, persistence/retry, keyboard/touch, offline/reload, and malformed recovery (20.7 Phases 0–2; D-019–D-025) | Canonical Career suites; retained probe’s durable placement/offline path; fresh malformed-JSON reset rendered a safe first-session shell with no page/console error. | Pass. |
| Phase 3 selected-stage ordering, compact catalogue, every-item route, Details/replacement, 320/393 and 200% tray behavior (20.7 Phase 3; D-027–D-028) | Canonical Phase 3 coverage; retained probe tested every selected stage under full ownership, keyboard actions, CDP touch move, reload, replacement, bypass, cancel, and tray geometry. | Pass. |
| Compact money policy: HUD, cards, targets, quote, and settlement summaries use the shared cents-default formatter; only a related additive equation promotes together (20.7 Phase 4; D-030) | Source audit plus fresh Career/Jobs browser reproduction. Independent compact values are contaminated by unrelated projection precision and a selected card bypasses formatting. | Fail: V-068, V-069. |
| Details, Inspect comparison/accounting, and ledger-adjacent disclosure retain mill precision (20.7 Phase 4; D-030) | Fresh Career Details after 1.00h Freelance showed $2.276 gross, $0.098 operating, $0.012 electricity, and $2.166 economic net; canonical accounting/ledger suites passed. | Pass. |
| Shared glyph/status/card/warning language and Details behavior/focus across Build, Jobs, Career, Upgrades, Inspect | Original-resolution 5-tab deck inspected in starter and expanded states. Fresh Build Details stayed inspect-only and restored origin focus; Career Details restored its button focus. Warning/card hierarchy remains coherent except raw Jobs $0 precision in V-069. | Fail only for V-069; other audited behavior passes. |
| Bottom-tab scroll behavior and preset destination ownership (20.7 Phase 4; D-030) | Fresh Build source scroll 180 restored after Jobs→Build. Direct preset probe: Build 180, Inspect 743, Load Preset entered Build at 0 meaningful top rather than inheriting Inspect. | Pass. |
| Reduced-motion equivalence | Fresh browser emulateMedia(reduce): app motion-reduced class present; a pipeline slot had 0s transition, live status had animation none, and scroll behavior was auto. | Pass. |
| Inspect first viewport prioritizes bottleneck, baseline delta, latest causal evidence before tutorial/time/feedback | Original 320/393 starter and expanded Inspect images inspected; all three diagnostic priorities preceded first-session guidance, time controls, warning, and feedback. | Pass. |
| Full visual matrix: five tabs × starter/expanded × 320/393 plus representative 200% text, inspected at original resolution | Retained probe generated and verifier inspected 20 matrix images plus original 200% 320/393 tray images; no horizontal overflow, nested rail trap, tray/nav overlap, or undersized controls. | Pass. |
| Portrait, 44px targets, keyboard, touch drag, no overflow, no color-only control, and responsive labels | Canonical 200 root Playwright cases; retained geometry assertions at both widths; keyboard/Escape, CDP touch, and 200% probes. | Pass. |
| Persistence, offline, root/Pages PWA scope, atomic update/recovery, and restart | Canonical root 200/200 plus Pages/offline 2/2; retained probe verified controller/scope and durable placed module after offline reload. | Pass. |
| Startup readiness and process cleanup | Independent ./scripts/run root response and post-stop connection refusal; canonical managed server lifecycle also passed. | Pass. |

## Findings

### V-068 — Career quick resources inherit unrelated projection mills

- Severity: Medium.
- Related requirement: plan 20.7 Phase 4; D-030 compact-money policy.
- Expected: Cash and Savings are independent compact resources and display
  cents unless their own value requires mills. A related additive projection or
  settlement equation may promote its own terms together.
- Actual: On a clean save, allocating 1.00h to Freelance delivery renders
  Cash as $0.000 and Savings as $3.000. Its unrelated route equation contains
  mill values, but neither quick-resource figure is part of that equation.
- Reproduction:
  1. Start the frozen candidate at 127.0.0.1:4968 from cleared localStorage.
  2. Open Career.
  3. Activate Allocate 1 hours to Freelance delivery.
  4. Read Tonight's Career resources.
- Concrete evidence: round-066-adversarial.mjs reported
  CASH / $0.000 and SAVINGS / $3.000. App source lines 2847–2861 passes every
  route projection and unrelated lifetime cost into one compactCurrencyAmounts
  array, then gives that global array to each compactMoney call. The exact
  Details equation remained correct, proving this is display-policy leakage,
  not arithmetic.
- Blocks acceptance: Yes. It directly violates the Phase 4 policy that a
  compact value promotes itself, with promotion of other values reserved for
  an explicitly related additive equation.

### V-069 — Jobs failed-payout card bypasses cents-default formatting

- Severity: Low.
- Related requirement: plan 20.7 Phase 4; D-030 compact card summaries.
- Expected: The selected dispatch card’s compact failed-payout amount follows
  the shared cents-default policy: $0.00 gross.
- Actual: The fresh selected Interactive Chat card says A failed delivery pays
  $0 gross, while its other displayed money uses the compact formatter.
- Reproduction:
  1. Start the frozen candidate at 127.0.0.1:4968 from cleared localStorage.
  2. Open Jobs.
  3. Read the selected Interactive Chat card’s delivery/cost sentence.
- Concrete evidence: round-066-adversarial.mjs captured the full rendered card
  text, including A failed delivery pays $0 gross. Source line 2279 contains
  the raw literal; nearby quote and expected-net values call
  formatCompactCurrency.
- Blocks acceptance: Yes. Although low visual severity, it is an unambiguous
  remaining compact-card exception to the mandatory shared formatting policy.

## Unverified areas

- No hosted five-lane aggregate, exact verifier-SHA push, exact-SHA Pages
  deployment, live build-info smoke, or focused live expert playthrough was
  performed. The frozen local candidate already has correctable failures, so
  those release activities cannot establish acceptance.
- No physical mobile hardware, non-Chromium engine, native screen-reader
  speech, or device storage-exhaustion test was run.

## Residual risks

- Browser launch needs scoped host permission on this macOS environment because
  the workspace sandbox blocks Mach-port registration. The repository-pinned
  host run completed fully; retain hosted/CI browser corroboration.
- npm reports development-chain advisories, while the required
  npm audit --omit=dev --audit-level=high reports zero production
  vulnerabilities. The candidate handoff documents the development-only
  constraint.
- V-068 and V-069 are unresolved candidate defects. A follow-up candidate
  must fix them without reducing exact Details/Inspect/ledger precision or
  weakening retained Phase 2/3, persistence, offline, PWA, keyboard, touch,
  and reduced-motion coverage.
