# Verification round 069 — Phase 4 complete money-surface audit

Candidate SHA: `d76fea05461aecd643f99d35392214ecf3e8b1e1`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write: exactly
  `d76fea05461aecd643f99d35392214ecf3e8b1e1`; matched the supplied candidate.
  Initial `git status --short` was empty.
- Independently read `AGENTS.md`, complete `plan.md`, complete
  `.agent/DECISIONS.md`, `.codex/agents/verifier.toml`, candidate source/diff,
  handoff, and retained immutable reports. Handoff, production comments, and
  candidate tests used only as navigation hints. No production file changed.
- Checklist: applicable released Bedroom scope and deferred systems; plan
  §§2.4, 19–20.7, 23–27, 29, 34–35; Phase 4; D-004 and D-006–D-030. Core
  current focus: compact cents-default/self-promotion, equation-local mills,
  fixed-three Details/Inspect/ledger accounting, five-tab portrait UX,
  persistence/offline/PWA, and production dependency audit.
- `round-069.md` through `round-071.md` did not exist when this verifier
  started. Replayed immutable R064, R067, and R068 probes; adjudicated retained
  V-068–V-071 independently.

## Environment and setup

- macOS arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1; repository-pinned
  Playwright 1.61.1.
- `./scripts/setup` completed with ignored repository-local npm and Chromium
  caches. Workspace-sandbox Chromium has the documented macOS Mach-port launch
  restriction; all browser evidence below used scoped host runs with the pinned
  repository browser, never a global profile.
- Temporary preview used loopback `127.0.0.1:5180`; readiness confirmed before
  probes. It was stopped after the run; subsequent connection attempt was
  refused.

## Commands and evidence

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; `git diff --check b278c10..d76fea0` | Pass: frozen SHA exact, clean initial worktree, no whitespace error. |
| `./scripts/setup` | Pass: reproducible local dependency/browser setup. |
| Scoped host `E2E_PORT=5170 ./scripts/verify` | Pass: canonical static, unit/property, balance, build/audit and pinned root/Pages browser lanes completed. Root Playwright final `test-results/.last-run.json` status `passed`; managed process no longer running. |
| `npm audit --omit=dev --audit-level=high`; `npm ls --omit=dev --all` | Pass: `found 0 vulnerabilities`; production dependency tree React/ReactDOM only. |
| Fresh preview; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5180 OUTPUT_DIR=/tmp/goldlocks-r069-retained-r064 node .agent/verification/round-064-adversarial.mjs` | Pass: 24 starter/expanded five-tab 320/393 captures, original-resolution inspection, geometry/44px checks, keyboard/focus, CDP touch drag, scroll, 200% tray, persistence, root PWA and offline reload. Findings `[]`. |
| Fresh preview; retained R067 and R068 adversarial probes against `:5180` | Pass: both report findings `[]`; current candidate retains V-068 Career equation boundary, V-069 compact failed card, V-070 Queue 10 endpoints, and V-071 compact action/warning plus failed-settlement exact ledger repair. |
| `npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=list` | Pass: 8/8; 320/393 starter/expanded matrix, per-tab scroll, Details focus return, 200% reduced motion, and controls. |
| `npm run test:e2e -- tests/e2e/pwa-update.spec.ts --reporter=list` | Pass: 16/16 root/Pages atomic update, malformed-manifest/partial-shell recovery, offline/cache isolation. |
| `npm run test:e2e -- tests/e2e/verifier-round-069.spec.ts --reporter=list` | Fail: 3/3 independent pinned-browser assertions expose V-072, V-073, V-074. Browser traces/screenshots retained under ignored `test-results/`. |
| `npm test -- --run src/simulation/verifierRound069.test.ts` | Fail: 7/7 verifier assertions expose exact-ledger V-073 across module/hardware/expansion success and insufficient-funds branches plus Bedroom-exit record. |
| `npx prettier --check src/simulation/verifierRound069.test.ts tests/e2e/verifier-round-069.spec.ts`; `npx eslint --no-ignore ... --max-warnings 0` | Pass: verifier-authored regressions format/lint cleanly. |
| Raw-currency source audit: `rg --pcre2 '\\$[0-9]+(?:\\.\\d+)?' src --glob '*.{ts,tsx}' --glob '!*.test.*'` plus dynamic `toFixed` audit | Finds the live violations recorded below; verified settlement success/no-model/memory/reliability source branches call `formatExactCurrency`. Static tutorial/rate copy already displays cents but remains a maintenance risk, not an independently reproducible wrong current value. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Released Bedroom scope; no Research/deferred-system change | Candidate diff/source audit; canonical checks. | Pass. |
| Setup/startup; format/lint/types/unit/property/balance/build/browser tooling | Setup and scoped canonical run. | Pass. |
| Numeric safety, queue quote locking, deterministic ticks, persistence/migration, Worker boundary, failure/recovery | Canonical suite; retained R067/R068 and current browser settlement/reload routes. | Pass for changed-surface regression. |
| Career own-equation precision; independent Cash/Savings/lifetime compactness; Details exact accounting | R067 immutable probe clean: Cash `$0.00`, Savings `$3.00`; one-hour Freelance equation and Details retain route-local mills. | Pass; V-068 remains resolved. |
| Queue 10 is a non-additive range; endpoints compact independently | R067 clean against current candidate; persisted middle mills do not promote first/last. | Pass; V-070 resolved. |
| Standalone Career action and Build warning compact; Jobs card compact; supported settlement success/failure ledger exact | R068 clean: `$0.75`, `$0.00`, Details `$0.000`, no-model Inspect reload exact. Source confirms `formatExactCurrency` in success/no-model/memory/reliability settlement branches. | Pass for retained V-069/V-071 paths. |
| One related additive settlement equation shares precision through every shown term | Current partial-cash pinned browser proof: cost/paid/unpaid are 3dp but cash floor remains `$0.00`. | Fail: V-072. |
| Details, Inspect comparison/accounting, ledger-adjacent disclosures fixed three decimals | Current pinned browser purchase/reload proof and seven branch engine probe show capital ledger values `$4.00`, `$14.00`, `$45.00`, and exit `$24`, not 3dp. | Fail: V-073. |
| Compact HUD/cards/progress targets/requirements through shared cents-default policy | Current Career tier requirement cards display `$8`, `$18`, `$8`, rather than `$8.00`, `$18.00`, `$8.00`. | Fail: V-074. |
| Shared Build/Jobs/Career/Upgrades/Inspect grammar; Details/focus/scroll/reduced motion; Inspect priority | R064 original screenshot matrix; command-deck 8/8. | Pass except money-policy findings. |
| Portrait matrix, 44px targets, touch drag, no overflow | R064 all 24 captures plus original-resolution inspection and CDP touch path; command-deck 320/393. | Pass. |
| Restart/resume, malformed/failure recovery, offline/root+Pages PWA | R064 root offline reload; PWA-update 16/16; canonical Pages lane. | Pass. |
| Production security boundary | `npm audit --omit=dev --audit-level=high`: zero vulnerabilities. | Pass. |
| Process cleanup | Canonical managed servers ended; manual `:5180` preview terminated and port closed. | Pass. |

## Findings

### V-072 — Mill settlement row leaves its cash-floor term at cents

- Severity: Medium.
- Related requirement: plan §20.7 Phase 4; D-030 explicitly additive settlement
  row / related accounting equation policy.
- Expected: once any displayed settlement term needs mills, every visible member
  of that equation, including the cash floor, uses `$0.000` precision.
- Actual: a no-model settlement from `$0.005` cash renders `$0.010` configured,
  `$0.005` paid, `$0.005` unpaid, but `cash cannot go below $0.00`, while also
  saying three decimals are shown.
- Reproduction: clear storage; set saved cash to `0.005`; remove Basic Cleaner,
  Quantized Model, and Smoke Check via supported Build actions; Jobs → 64× →
  queue the starter; inspect Latest settlement. Reproducible in
  `tests/e2e/verifier-round-069.spec.ts`.
- Concrete evidence: Playwright received the complete string above; source
  `MoneyLoop` calls `settlementMoney` for every other term but directly calls
  `formatCompactCurrency(0)` for the floor.
- Blocks PASS: Yes.

### V-073 — Capital and exit Inspect ledger records bypass fixed-three accounting

- Severity: Medium.
- Related requirement: plan §20.7 Phase 4; D-030 exact
  Details/Inspect/ledger-adjacent accounting.
- Expected: durable ledger purchase, insufficient-funds, and exit accounting
  records display fixed three decimals, e.g. `$4.000`, `$1.000`, `$24.000`.
- Actual: persisted Inspect shows `Precision Cleaner purchased for $4.00` after
  successful UI purchase and reload. Engine branches likewise write `$14.00`,
  `$45.00`, and shortfalls `$1.00`; the exit record says `$24 durable savings`.
- Reproduction: browser: seed `$4`, settle starter, Upgrades → Buy Precision
  Cleaner → Inspect → reload → Inspect. Engine: run
  `npm test -- --run src/simulation/verifierRound069.test.ts`; its three
  successful, three insufficient-funds, and exit assertions all fail.
- Concrete evidence: browser assertion receives the `$4.00` event; engine
  output receives exact raw messages for all seven paths. Source audit locates
  `toFixed(2)` purchase/shortfall strings and raw exit literal in
  `src/simulation/engine.ts`.
- Blocks PASS: Yes.

### V-074 — Visible Career requirement cards bypass compact cents-default formatting

- Severity: Low.
- Related requirement: plan §20.7 Phase 4; D-030 compact cards/requirements
  through the shared formatter.
- Expected: Harbor and Kiln requirement copies show `$8.00`, `$18.00`, and
  `$8.00`, consistent with compact card values.
- Actual: Career displays `Unlock with $8 saved ...` and `Unlock with $18 saved
  ... $8 product revenue.`
- Reproduction: fresh save → Career → Durable local models; run the first
  verifier Playwright test in `tests/e2e/verifier-round-069.spec.ts`.
- Concrete evidence: pinned-browser received the raw strings; source audit
  traces them from `src/simulation/catalog.ts` `unlockDescription` into the
  Career choice-card requirement.
- Blocks PASS: Yes; an ordinary visible card/requirement remains outside the
  required cents-default policy.

## Prior-finding adjudication

- V-068: resolved; independent Career resources no longer inherit route mills.
- V-069: resolved; selected failed-job card uses `$0.00` compact presentation.
- V-070: resolved; Queue 10 endpoints remain independent compact values.
- V-071: resolved for its named compact private-evaluation action, Build warning,
  and settlement success/failure ledger branches; this round found distinct
  remaining settlement-summary, capital-ledger, and tier-requirement paths.

## Unverified areas

- No hosted five-lane aggregate, exact verifier-SHA push/deployment,
  `build-info.json` smoke, or optional expert playthrough. Mandatory local
  defects already preclude acceptance.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or storage-exhaustion pass.

## Residual risks

- V-072/V-073/V-074 are visible and correctable. Repair must preserve the
  resolved independent-versus-additive boundary, exact settlement arithmetic,
  retained onboarding integrity matching, persistence, and R064–R068 probes.
- Raw static tutorial/rate copy is visually cents-correct today but should be
  considered during formatter cleanup to avoid future currency drift.
- macOS workspace-sandbox Chromium limitation remains; scoped pinned-host runs
  completed. Retain CI/host corroboration after repair.
