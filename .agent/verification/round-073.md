# Verification round 073 — first-session primary-action presentation

Candidate SHA: `db5a7b8b9219d5ac9b7469a23cde3fe7f3247f2b`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier-authored write:
  `db5a7b8b9219d5ac9b7469a23cde3fe7f3247f2b`; exact match with the
  Orchestrator-supplied candidate. Initial `git status --short`: empty.
- Independently read all of `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, and immutable reports
  through round 072. Handoff, candidate tests, comments, and prior PASS claims:
  navigation hints only.
- Candidate delta from `53edf39`: D-031, first-session presentation selector,
  App/CSS integration, and related tests. No Worker protocol, simulation
  command, schema, balance, persistence, PWA, or dependency change.
- Verifier-authored artifact: `round-073-adversarial.mjs`. It only drives the
  repository-pinned browser against a local production build; no production
  source changed.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`; repository-pinned Playwright
  `1.61.1`; Chromium from ignored `.cache/ms-playwright`.
- `./scripts/setup` passed with lockfile-pinned dependencies and local npm/
  browser caches. Full development installation reports four toolchain
  advisories; the separately required production audit is clean below.
- `./scripts/run` served root readiness at `http://127.0.0.1:4173/`.
  Local production preview at port 5731 also reached readiness. All manually
  launched preview/dev servers were stopped; ports 4173, 5731, and 5732 then
  returned connection-refused.
- Direct sandbox Chromium launch is unavailable on this host because macOS
  denies Mach-port rendezvous registration. Required browser checks ran with
  scoped host execution, using the same repository-pinned Chromium; none were
  skipped.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate parent/diff; `git diff --check` | Pass: frozen exact SHA, clean initial tree, no whitespace error. |
| `./scripts/setup` | Pass. Locked dependencies and pinned Chromium installed in ignored repository-local caches. |
| Scoped host `E2E_PORT=5730 ./scripts/verify` | Pass, exit 0: Prettier, ESLint, TypeScript; 45 unit/property files / 223 tests; numeric prototype; first-session 41/0; upgrades 20,001/0; progression 41/0; Career 101/0; evaluation 121/0; production build/audit; root Playwright 211/211; Pages Playwright 2/2. |
| Scoped host `E2E_PORT=5732 CI=1 npm run test:e2e -- tests/e2e/first-session.spec.ts --repeat-each=25 --reporter=line` | Pass: 250/250. Candidate handoff, cancellation/focus, reload, 320/375/393, scaled text, failure/recovery, touch, reduced-motion paths stable under repetition. |
| Fresh root production build/preview; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5731 OUTPUT_DIR=/tmp/goldlocks-r073-adversarial node .agent/verification/round-073-adversarial.mjs` | Expected FAIL: all independent state flows completed; V-076 reproduced at 320 and 393. Handoff, cancellation/no mutation, 44px controls, no horizontal overflow, no nested rail trap, PWA offline reload, expansion empty positions, and page/console error checks passed. |
| `node --check`; Prettier check/write; ESLint for `round-073-adversarial.mjs` | Pass. |
| `npm audit --omit=dev --audit-level=high`; `npm ls --omit=dev --all` | Pass: `found 0 vulnerabilities`; runtime tree is React, ReactDOM, Scheduler. |
| Original-resolution screenshot inspection | Inspected fresh five-tab starter and expanded decks at 320x693 and 393x742, expanded empty-slot close-ups, 200% Jobs, explicit Upgrades-to-Build handoff, Build tray, and failed-recovery views. Shared command-deck visuals, ordered 3-to-6 topology, bottom navigation, and no visible clipping/overlap passed. Missing explanatory rail copy is visible in the same images. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Current authorized Bedroom scope; no Research, creator, fear, workforce, startup, laboratory, second pipeline, or new simulation framework (§§2.4, 20.6–20.7, 29; D-013/D-031) | Candidate diff/source audit; complete canonical compilation, simulation, balance, and browser aggregate. | Pass. |
| Reproducible setup, canonical static/unit/balance/build/browser gate, pinned browser, startup readiness, cleanup (§§23, 27; AGENTS.md) | Setup; canonical 223-unit, all balance, 211-root/2-Pages result; direct root/production-preview readiness and closed-port checks. | Pass. |
| Deterministic constrained pipeline, locked quotes, demand/recovery, exact fixed speeds, balances, failure/recovery, migration, persistence (§§4–10, 19, 24; Milestones 2–3.5) | Canonical property/scenario/balance suites and retained root/Pages browser lanes. Candidate has no engine/protocol/schema delta. | Pass. |
| Workstation Expansion I: one ordered 3-to-6 rail, three empty/bypassed positions, no extra rig/queue/pipeline, usable portrait placement (§8, §20.5, D-007/D-012/D-027/D-028) | Canonical expansion/Phase-3 suites; fresh expanded 320/393 deck, DOM assertion for process 4–6 empty/bypassed, rail close-up inspection, no nested-scroll / horizontal-overflow / undersized control probe. | Pass. |
| Explicit Build-only placement, Details non-mutation, manual Upgrades-to-Build handoff, cancel/focus/tab cancellation without pipeline mutation (§20.5–20.6; D-013–D-018/D-031) | Canonical first-session and retained verifier lanes; fresh production probe buys Precision Cleaner, retains Upgrades/no tray, manually selects Build, checks tray, cancels, and compares persisted slots. | Pass. |
| First-session rail: three visible sequential objectives; before settlement emphasize only current step **and its reason**; replace each with concise explanation; failed work retains visible recovery information (§20.6) | Fresh 320/393 production DOM and screenshots prove action/tab/title only. State-specific rationale/recovery explanation constructed by selector is absent from rendered guide. | **Fail — V-076.** |
| State-derived D-031 handoff: durable guide state, no automatic navigation/persistence/economy change, recommended module priority, failed-settlement recovery remains transparent | Candidate source audit; fresh explicit handoff, persistence, failed-starter flows; selector returns correct durable state action but view drops its explanation. | **Fail — V-076** for the transparent contextual explanation portion; other boundaries pass. |
| Pre-purchase viable routes, honest quotes/costs/accounting, no universally dominant safe batching (§20.6; D-013/D-030) | Canonical first-session/progression/balance/currency suites pass; fresh starter quote and Queue 1 evidence. Candidate has no economy change. | Pass. |
| Career human-paced app-session draft, atomic batch, persistence/recovery, hierarchy, 320/393/touch/keyboard/reduced-motion (§20.7 Phases 1–2; D-019–D-025) | Canonical Career 101-seed/browsers passed, including ticks/tabs/64x, save failure, response ordering, malformed restore, touch, keyboard, scaling. Candidate does not alter Career owner/Worker paths. | Pass. |
| Build/Upgrades density, selected-stage inventory ordering, Details semantics, live comparison/currency precision (§20.7 Phases 3–4; D-026–D-030) | Canonical Phase-3/4, currency, audit, and browser suites pass; fresh expanded visual deck. | Pass. |
| Portrait/accessibility/user-visible behavior: 320x693 and 393x742, 200% text, 44px targets, no horizontal overflow, reduced motion, touch/keyboard, no color-only status (§20.4–20.5) | Canonical 211 root cases; 250 repeated changed suite; fresh production geometry/touch/cancellation/visual deck. | Pass, except V-076's missing textual explanation is a user-visible first-session information defect. |
| Root/Pages PWA, offline reload, atomic update/cache isolation, startup/process cleanup (§19, §23–24; D-008) | Canonical root PWA suite and Pages 2/2; fresh root service-worker-controlled offline reload; post-probe port checks. | Pass. |
| Production dependency security boundary (D-026; §20.7 Phase 4) | Independent production audit and tree. | Pass. |

## Findings

### V-076 — First-session rail discards the required current-step explanation

- **Severity:** Medium.
- **Related plan requirement:** §20.6 First-session action rail: three visible
  sequential objectives; before first settlement emphasize the current step
  **and its reason**; after each step present the next objective with a concise
  explanation of what changed. D-013 and D-031 preserve transparent
  settlement/failure/recovery guidance and require a state-derived contextual
  handoff.
- **Expected behavior:** The active rail visibly exposes its concise live
  explanation. At minimum: starter reliability/reason; where locked quote,
  configured cost, and outcome remain available while observing; why/how much
  to earn before purchase; and failed-settlement/recovery guidance.
- **Actual behavior:** `selectFirstSessionPresentation` creates exactly these
  action-specific `body` strings in `src/ui/firstSessionPresentation.ts`, but
  `FirstSessionGuide` in `src/ui/App.tsx` renders only step, required tab,
  title, and the generic off-tab sentence. It never renders
  `presentation.body` or equivalent content. In the required Jobs tab the
  guide has no explanatory paragraph at all.
- **Exact reproduction:**

  1. Run `./scripts/setup`.
  2. Start a production preview with `E2E_PORT=5731 ./scripts/run-e2e`.
  3. Run `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5731 OUTPUT_DIR=/tmp/goldlocks-r073-adversarial node .agent/verification/round-073-adversarial.mjs`.
  4. At 320x693 and 393x742, inspect the rail in queue-starter,
     observe-settlement, earn-remainder, and failed-starter states.

- **Concrete evidence:** Probe result at both widths:

  ```text
  FIRST SESSION · STEP 2 OF 3
  REQUIRED TAB · JOBS
  Observe the starter settlement
  ```

  The expected text (for example, “Its locked quote, configured cost, and
  outcome appear in the Jobs settlement record”) is absent. The independent
  probe reported `initial-rationale-320/393`, `observe-rationale-320/393`,
  `earn-rationale-320/393`, and `failed-starter-rationale`; screenshots
  `initial-build-*`, `observe-starter-*`, `earn-remainder-*`, and
  `failed-starter-recovery-393.png` corroborate. Source inspection establishes
  the direct presentation boundary: selector supplies `body`; renderer omits
  it.
- **Blocks PASS:** Yes. This is a correctable implementation defect in the
  newly authorized first-session management behavior, not unavailable
  infrastructure or ambiguous requirement.

## Unverified areas

- No remote push, hosted five-lane aggregate, exact verifier-SHA Pages
  deployment, live `build-info.json` smoke, or optional expert playthrough.
  These are release-handoff actions outside local candidate verification.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or real hardware storage exhaustion. Required pinned Chromium coverage did
  include portrait widths, text scale, keyboard/touch, reduced motion,
  persistence/reload, malformed recovery, root/Pages PWA, offline, and
  page/console error paths.

## Residual risks

- macOS workspace sandboxing blocks Chromium Mach-port setup; scoped host
  execution used the identical pinned browser and completed all browser work.
- Full dependency installation retains development-only advisories. D-026's
  required production audit remains clean.
- V-076 leaves first-session reasoning incomplete despite otherwise stable
  command execution, screenshot geometry, persistence, recovery, and PWA
  behavior. A focused implementation repair should render the selector's live
  explanatory content (or an equivalent single source of truth), then rerun
  the first-session and full canonical gates.
