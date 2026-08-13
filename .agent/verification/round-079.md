# Verification round 079 — Jobs latest-settlement hierarchy

Candidate SHA: `0dd9a775b4b50100c7ab5eb7923529255884f52c`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `0dd9a775b4b50100c7ab5eb7923529255884f52c`. Exact supplied SHA. Initial
  `git status --short` empty.
- Independently read `AGENTS.md`, `.codex/agents/verifier.toml`, full
  `plan.md`, all decisions through D-033, and immutable verifier records
  through round 078. Built the D-033 checklist independently; `.agent/HANDOFF.md`
  and candidate tests treated only as leads.
- Candidate diff: Jobs presentation selector/CSS/UI and settlement-focused
  tests. No Worker, engine, schema, persistence, PWA, routing, or Career
  production change. `git diff --check` passes.
- Audited changed historic assertions in `round-009-usability.spec.ts` and
  `verifier-round-017.spec.ts`: they migrate old first-layer paid/net strings
  into the new Details boundary while retaining outcome, run-total, exact
  payment, cash-floor, and economic-net assertions. No valid assertion was
  deleted or weakened.
- Verifier added only the focused regression
  `src/ui/verifierRound079.test.tsx`, independent browser probe
  `.agent/verification/round-079-adversarial.mjs`, and this report. No
  production repair.

## Environment and setup

- Darwin 25.6.0 arm64; Node `v22.23.2` obtained with
  `npm exec --package=node@22`; repository-pinned Playwright 1.61.1; ignored
  repository-local npm/browser caches.
- The workspace sandbox denies Chromium macOS Mach-port rendezvous before test
  bodies. Scoped host runs used the same pinned browser/cache; browser
  acceptance was not skipped.
- Verifier preview: Node-22 `./scripts/run-e2e`, loopback
  `127.0.0.1:42781`, title/save readiness confirmed. Temporary tmux server,
  simulator, and Android reverse tunnel were all stopped/removed after checks.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| Candidate freeze/status; source/diff audit; `git diff --check` | Pass: exact frozen SHA, clean initial tree, no whitespace defect. |
| Clean Node-22 `sh ./scripts/verify` candidate pass before verifier regression existed | Static lanes, candidate unit suite (46 files / 228 tests), balance lanes, build, production audit, and root E2E lane passed. Sandboxed Pages Chromium launch alone hit the documented Mach-port policy before test bodies; host browser runs below supply authority. |
| `E2E_PORT=42779 ... npm run test:e2e` | Pass: project-pinned Node-22 browser, 226/226 in 3.4m. Includes Jobs density success/zero-payout/partial/no-settlement, retained V-068–V-075, ledger/Inspect, first-session, malformed/reload, PWA/offline, Career-draft, tab-scroll, pointer/touch, and placement lanes. |
| `E2E_PORT=42780 ... npm run test:e2e:pages` | Pass: 2/2 Pages/offline/cache-isolation cases. |
| `BASE_URL=http://127.0.0.1:42781 ... node .agent/verification/round-079-adversarial.mjs` | Pass: fresh-state independent 320×693 and 393×742 raw/200%-reduced-motion probes; six inspected PNG captures at `/private/tmp/goldlocks-r079/`. |
| `prettier --check`, `eslint --max-warnings 0`, `tsc -b --pretty false` for verifier artifacts | Pass. |
| `vitest run --coverage=false src/ui/verifierRound079.test.tsx` | Fails exactly as V-078 documents; reproducible implementation defect, not an infrastructure error. |
| iOS smoke: booted Emot-ID iPhone SE; `simctl openurl ...:42781`; inspected screenshot | App shell loaded in mobile Safari. `simctl ui` exposes appearance/content-size only, no supported tap injection, so Jobs navigation could not be automated there. Simulator shut down. Exploratory only. |
| Pixel 6a smoke: `adb -s 25121JEGR11385 reverse`, Chrome intent, screenshot/UI dump | Chrome intent launched, but device keyguard required the owner PIN. I did not bypass it; Jobs action was unavailable. Reverse removed. Exploratory limitation, not Playwright authority. |

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| D-033 actual first-level cash change, not economic gross-cost net | Independent success (`+$1.335`), zero-payout full-cost (`−$0.01`), and partial-cash (`−$0.005`) flows compare saved `lastSettlement.netChange` to visible first-layer text. First layer excludes `economic net`; Details separately names it. | Pass |
| D-033 workload, outcome, concise recognition/direct cause/recovery/next cue; finite guide ownership | Fresh success shows Interactive Chat, Successful delivery, first-success recognition; baseline failure shows exact direct pipeline cause/recovery; onboarding hides duplicate next cue and keeps guide action. **Later-event causal ownership fails: V-078.** | Fail |
| Exactly one native `Settlement accounting and provenance` Details, all required provenance/equation fields | Independent keyboard test identifies one `DETAILS`, exact Summary name, focus retention, task ID, locked quote, completed/failed, gross-cost-economic net, paid/unpaid/cash floor, actual cash change, and 3dp rationale. Touch `.tap()` closes/reopens; reload preserves exact record. | Pass |
| D-030 3dp promotion; no full-payment `$0.000 unpaid`; V-068–V-075 / ledger / Inspect retained | Independent success and zero-payout-full-cost Details omit unpaid; partial uses `0.005 paid / 0.005 unpaid`; canonical 226 includes exact related-equation, ledger, and Inspect regressions. | Pass |
| Success/full payment, zero payout/full cost, partial cash payment, no settlement, milestone recognition | Fresh separate state runs cover all four accounting states plus first-success recognition; candidate root suite carries both portrait variants. | Pass |
| One readable column through 393px; selected Queue precedes settlement; D-018 reserve | Independent raw geometry: 320 clearance `136.45px`, 393 clearance `157.31px`, one column, unscrolled start, Queue precedes settlement, no document overflow. | Pass |
| 320×693 / 393×742 raw and 200% reduced-motion; 44px; no overflow/nested scroll; visual inspection | Verifier screenshots inspected: raw initial/success/zero-payout plus 320 success and 393 partial 200%-reduced. Probe finds no horizontal overflow, no nested MoneyLoop scroll, no visible button/summary below 44px. | Pass |
| Native Details keyboard, touch, focus, accessible naming; Simulation coexistence | Independent Space/focus and mobile touch checks pass; candidate canonical Jobs tests retain Simulation Details coexistence. Native semantic tag/name inspected. | Pass |
| Durable latest settlement/reload; malformed/offline/PWA; Career draft; tab-scroll; placement pointer/CDP touch | Root canonical 226/226 and Pages 2/2 supply retained regression evidence. Candidate diff has no changes in those production boundaries. | Pass |
| Selector purity and state boundary | Source audit: `selectSettlementPresentation` only derives presentation from settlement and supplied inputs; no dispatch/persist/engine mutation. Browser saved-state observations confirm displayed actual cash matches durable field. | Pass |
| Installation/startup/process cleanup/security | Locked Node-22 setup/preview ready; canonical production audit lane passed; verifier preview, simulator, and device tunnel cleaned up. | Pass |

## Findings

### V-078 — Latest settlement displays an unrelated later failure cause

- Severity: High / P1.
- Related requirement: D-033 first-level direct cause/recovery must describe
  the latest durable settlement; calculation boundary says presentation uses
  the existing ledger cause for that settlement.
- Expected: A failed `lastSettlement` continues to show its own causal record
  after unrelated later ledger activity. For `task-0-1` after removing Runtime,
  this is `The active pipeline had no model stage.`
- Actual: `MoneyLoop` takes the last ledger event whose `kind === "failure"`,
  not the event belonging to `lastSettlement.taskId`. A later Career
  distribution-shift incident has no `directCause`, so the UI falls back to
  `Delivery did not clear the modeled reliability check.` while the card still
  identifies the earlier failed Interactive Chat settlement.
- Reproduction:

  1. Start `createInitialState(79001)`; remove the Runtime module; queue one
     job and `tick(state, 60)`. The durable settlement is failed `task-0-1`;
     the associated ledger event says `The active pipeline had no model stage.`
  2. Seal a released Product Career state with
     `distributionShiftRisk: 1.09`; submit all four real allocation commands
     plus `RUN_EVENING` through `reduceWorkerRequest`. This commits the later
     Career `Distribution-shift reliability incident` but does not replace
     `lastSettlement`.
  3. Render `JobsView` and inspect `Failure record`.
- Concrete evidence: verifier-only
  `src/ui/verifierRound079.test.tsx` fails on candidate in 50ms:
  expected `The active pipeline had no model stage.`; received
  `Failure record: Delivery did not clear the modeled reliability check.` The
  selector source uses `[...state.ledger].reverse().find(event => event.kind ===
  "failure")`, establishing the causal mismatch.
- Blocks PASS: Yes. The first scan asserts a false/generic cause for a durable
  settlement after ordinary later Career activity, violating D-033’s direct
  cause and provenance boundary.

## Unverified areas

- iOS native touch automation unavailable from this host’s `simctl`; its loaded
  shell screenshot is useful smoke evidence only. Pixel 6a was PIN-locked;
  no attempt was made to bypass owner authentication. Repository-pinned
  Playwright, which did execute touch/keyboard behavior, remains acceptance
  authority.
- No non-Chromium engine or human screen-reader speech session. Native Details
  semantics, focus, and names are concrete browser evidence but not a full
  assistive-technology field study.

## Residual risks

- Correcting V-078 must bind a settlement to its own causal ledger record (or
  durable causal provenance) without changing Worker accounting, persistence,
  or unrelated Career failure presentation.
- The workspace sandbox’s Mac browser policy requires scoped host execution;
  all authoritative browser runs used the repository-pinned browser/cache.
- This report intentionally retains a failing verifier regression test until a
  later implementation candidate fixes V-078. The next implementer must keep
  it green rather than weakening it.
