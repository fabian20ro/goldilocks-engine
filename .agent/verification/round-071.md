# Verification round 071 — Phase 4 Career exit-target currency repair

Candidate SHA: `e6456f1bd09df546de9cfc69f5929a79cbea4945`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned
  `e6456f1bd09df546de9cfc69f5929a79cbea4945`, exactly the
  Orchestrator-supplied candidate. Initial `git status --short` was empty.
- Independently read `AGENTS.md`, all of `plan.md`,
  `.codex/agents/verifier.toml`, all of `.agent/DECISIONS.md`, handoff,
  candidate diff, and immutable verification evidence through round 070.
  Handoff, implementation tests, comments, and prior claims: navigation
  hints only.
- Frozen scope: plan §20.7 Phase 4 / D-030 compact-currency completion plus
  retained V-068–V-074 regressions. No new product-policy audit or deferred
  system expansion. Applicable retained contract: released Bedroom slice,
  one ordered pipeline, Career draft/Worker boundary, first-session integrity,
  Build placement, portrait command deck, persistence, root/Pages PWA, and
  production dependency boundary.
- Candidate delta versus `1f756eae15eae3767d9803c2aac0a23e8a008e14` is narrow:
  export the existing engine-owned exit threshold; import it in Career; route
  visible `save $24.00` through the shared compact formatter; candidate
  unit/E2E coverage and handoff/decision documentation. No simulation rule,
  money arithmetic, Worker command, save schema, catalog eligibility, PWA,
  dependency, or layout mechanism changed.
- Verifier added this immutable report only. No production implementation,
  existing test, fixture, or prior report changed.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`; Git `2.50.1`;
  repository-pinned Playwright `1.61.1`.
- `./scripts/setup` completed using ignored repository-local npm and Chromium
  caches: `.cache/npm` and `.cache/ms-playwright`. No global browser profile
  used.
- Direct workspace-sandbox Chromium launch consistently fails before test
  bodies because macOS denies `MachPortRendezvousServer` registration. The
  same repository-pinned Chromium suites were rerun with scoped host launch
  permission and passed; browser verification was not skipped.
- `./scripts/run` became ready on `127.0.0.1:4173` in 140 ms; `curl` read
  `<title>The Goldilocks Engine`. Ctrl-C stopped it; a subsequent connection
  check was refused. Canonical managed port `5415` was also refused after
  completion.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate diff/name/stat; `git diff --check` | Pass: supplied candidate frozen, clean initial tree, narrow expected diff, no whitespace error. |
| `./scripts/setup` | Pass: lockfile-pinned dependencies and repository-local Chromium setup completed. Ordinary full dependency install reports four development-chain advisories; see production audit below. |
| `npx vitest run --coverage=false src/simulation/currency.test.ts src/simulation/capitalLedgerCurrency.test.ts src/simulation/verifierRound069.test.ts src/ui/careerView.test.tsx` | Pass: 4 files / 29 tests. Includes V-072/V-073 and exact Career exit target/current boundary. |
| `E2E_PORT=5411 npm run test:e2e -- tests/e2e/verifier-round-069.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=list` with scoped pinned Chromium | Pass: 8/8. Replays V-070–V-075 browser regressions, including `save $24.00` and `Current: $3.000`. Sandboxed first attempt failed only at Chromium bootstrap with documented macOS Mach-port denial. |
| Fresh production preview `:5412`; immutable `round-067-adversarial.mjs`, `round-068-adversarial.mjs`, `round-070-adversarial.mjs` | Pass: each emitted `findings: []`. Replays V-068–V-071 and V-075 independently, including Career route/equation precision, Jobs failure card, Queue 10 endpoints, private-evaluation/Build warning/Inspect ledger, and exact threshold/current disclosure. |
| Fresh production preview `:5413`; immutable `round-064-adversarial.mjs` | Pass: `findings: []`; 24 original-resolution captures: starter/expanded × Build/Jobs/Career/Upgrades/Inspect × 320×693/393×742. Also exercised selected-stage ordering, purchase/place/reload, Escape/focus, touch move, remove/bypass, 200% placement trays, root PWA controller, and offline reload. |
| Local original-resolution inspection: expanded 393px five-tab deck and 320/393 200%-text tray captures | Pass: coherent terminal/card/glyph grammar; ordered rail and 3→6 empty markers legible; Jobs action, Career composer, Inspect diagnostic strip, and placement Cancel visible; no observed clipping, overlap, or fixed-nav obstruction. |
| `E2E_PORT=5415 ./scripts/verify` with scoped pinned Chromium | Pass, exit 0: Prettier, ESLint, TypeScript, 44 unit/property files / 218 tests, numeric prototype, first-session 41/0, upgrades 20,001/0, progression 41/0, Career 101/0, evaluation 121/0, production build, production audit, root Playwright 208/208, Pages Playwright 2/2. |
| `npm audit --omit=dev --audit-level=high`; `npm ls --omit=dev --all` | Pass: `found 0 vulnerabilities`; shipped tree is React, ReactDOM, and scheduler only. D-026 development-only advisory boundary retained. |
| Source binding audit: `rg` over `BEDROOM_EXIT_SAVINGS_REQUIRED`, `careerExitSatisfied`, `formatExactCurrency`, Career output, and residual money literals | Pass: one engine threshold (`24`) controls eligibility and exact durable ledger (`$24.000`); Career reads that same constant through `compactMoney` (`$24.00`); adjacent Current uses `exactMoney` (`$3.000`). No raw active `save $24` remains. |
| `./scripts/run`; loopback readiness request; Ctrl-C; post-stop `curl` | Pass: startup readiness then clean listener teardown. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom scope; no Research, creator, fear, workforce, startup, laboratory, extra-pipeline, or new framework/mechanic | Candidate diff and source audit; canonical deterministic/browser suites. | Pass. |
| Deterministic engine, numeric/integrity boundaries, Worker, migration, queue locking, economy/balance, failure/recovery (Milestones 0–3; D-004, D-006–D-011) | Candidate does not alter these layers; canonical 218 unit/property tests and all balance lanes pass; retained malformed/recovery browser cases pass. | Pass for changed-surface regression. |
| One constrained ordered pipeline; Expansion I remains one 3→6 rail with empty/bypassed added positions and no compute/memory implication (§8; D-007; D-012) | Canonical expansion/Phase 3/browser cases; independent starter/expanded 320/393 screenshot deck and visual inspection. | Pass. |
| First-session rail, explicit Build placement, integrity-safe reload/recovery, focus/cancellation, viable paths (§20.6; D-013–D-018) | Canonical first-session, round-039–050 retained browser cases; independent R064 purchase/place/tab-cancel/reload/focus paths. | Pass. |
| Career App-session draft, finite four-route atomic evening, response ordering, durable acknowledgement/retry/rejection/reload, 1×/64×, keyboard/touch (§20.7 Phases 0–2; D-019–D-025) | Canonical Career, hierarchy, and rounds 051–059: human-paced tick/tab retention, exact-once Run, malformed recovery, storage failure/retry, batched response and safe-offline paths all passed. | Pass. |
| Phase 3 selected-stage inventory, explicit placement, compatibility ordering, 200%-text tray, cancellation/focus/touch, no topology mutation (D-027–D-029) | Canonical Phase 3 + round-063 cases; independent R064 all-owned selected-stage, pointer/touch, Escape/Cancel, 320/393 tray geometry captures. | Pass. |
| V-068: independent Career Cash/Savings compact; only each displayed route/evening equation promotes to mills; Details exact | Immutable R067 finding-free probe plus current 29-unit and canonical Career suite. Initial state renders Cash `$0.00`, Savings `$3.00`; Freelance equation/Details retain mill terms. | Pass — resolved. |
| V-069: Jobs failed-payout card is compact cents | Immutable R067/R068 finding-free probes; current Phase 4 E2E. Selected card renders `$0.00 gross`; Details remains exact. | Pass — resolved. |
| V-070: Queue 10 is non-additive; visible endpoints format independently | Immutable R067 finding-free probe and current Phase 4 E2E. Middle reserved mill quotes do not promote endpoint labels. | Pass — resolved. |
| V-071: standalone Career/Build summaries compact; failed settlement ledger exact across reload | Immutable R068 finding-free probe and current Phase 4 E2E. Private evaluation `$0.75`; no-model warning `$0.00`; failed Inspect ledger fixed-three after reload. | Pass — resolved. |
| V-072: every shown member of a mill settlement equation, including cash floor, shares promoted precision | Immutable `verifier-round-069.spec.ts`, current Phase 4 E2E, and 29-unit run. Partial-cash settlement includes `$0.000` floor with other mill terms. | Pass — resolved. |
| V-073: durable module/hardware/expansion success and shortfall records plus Bedroom exit ledger remain fixed-three; legacy cents provenance recovers safely | `capitalLedgerCurrency.test.ts`, immutable `verifierRound069.test.ts`, current browser purchase/reload, canonical persistence suites. Purchase/shortfall and exit messages retain `$4.000`, `$14.000`, `$45.000`, `$24.000` boundaries. | Pass — resolved. |
| V-074: Career model-tier requirements are independent compact cents-default card values | Immutable `verifier-round-069.spec.ts`, R070 probe, current Phase 4 E2E. Harbor/Kiln labels read `$8.00`, `$18.00`, `$8.00`. | Pass — resolved. |
| V-075 / D-030 exit target: one engine-owned threshold; compact progress target; adjacent current remains fixed-three; durable ledger stays exact | Candidate source binding audit; current unit/E2E; immutable R070 probe. At 393×742: `Bedroom Developer exit: save $24.00 ... Current: $3.000`; engine eligibility and ledger use the same constant and `$24.000`. | Pass — resolved. |
| Phase 4 shared currency policy: HUD/cards/targets/requirements/quotes/settlement summaries compact; related equations local; Details/Inspect/ledger exact | Currency units, V-068–V-075 retained probes, Phase 4 E2E, source binding audit. No policy exception in scoped current surface. | Pass. |
| Cross-screen glyph/status/card/warning language, Details semantics/focus return, per-tab scroll, reduced-motion equivalence; Inspect first view prioritizes bottleneck/baseline/evidence (§20.7 Phase 4) | Canonical command-deck/Details/scroll/reduced-motion tests; independent R064 deck and inspected expanded Inspect capture. | Pass. |
| Portrait-first accessibility: 320 and 393 widths, 320×693 / 393×742, 200% text, 44px controls, no horizontal overflow/nested rail trap, touch/keyboard, color-independent labels (§20.4–20.5) | Canonical 208 root suite; R064 geometry assertions and 24 captures; inspected scaled trays. | Pass. |
| Required real screenshot matrix: five tabs × starter/expanded × 320/393; inspect originals, not only DOM (§20.5 / Phase 4) | R064 emitted 20 required original-resolution deck images plus four interaction/tray images. Expanded 393px Build, Jobs, Career, Upgrades, Inspect and both scaled trays inspected this round; probe assertions cover all 24. | Pass. |
| Persistence, restart/resume, malformed state, root/Pages PWA update/cache isolation, offline reload (D-008; §§19, 23–24) | Canonical root PWA/update 16 paths within 208/208; Pages 2/2; R064 root controller, durable placement, and offline reload. | Pass. |
| Reproducible setup, production security boundary, startup/readiness, repository-pinned browser and cleanup (AGENTS.md; D-026) | Setup, canonical build/audit, `npm ls --omit=dev`, direct `./scripts/run` readiness/teardown, canonical server port close. | Pass. |

## Findings

No unresolved findings.

V-068 through V-075 reproduce as resolved under fresh pinned-browser,
unit/property, source-binding, persistence, and canonical evidence. No
correctable candidate defect was found within the frozen acceptance scope.

## Unverified areas

- No remote push, hosted five-lane aggregate, exact verifier-SHA Pages
  deployment, live `build-info.json` check, clean local/remote branch match,
  or optional live expert playthrough was performed. Those are external
  release handoff actions after this local frozen verifier commit; they cannot
  be fabricated as local candidate evidence.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or actual device-storage exhaustion pass. Pinned Chromium covered required
  portrait, text-scale, keyboard/touch, reduced-motion, persistence/reload,
  malformed recovery, Pages, offline, and page/console-error paths.

## Residual risks

- macOS workspace sandboxing blocks Chromium Mach-port registration; scoped
  host runs used the identical repository-pinned Chromium and passed. CI/host
  browser corroboration remains appropriate for deployment.
- Ordinary full dependency installation reports four development-toolchain
  advisories. D-026 classifies that chain as development-only; the required
  production-only audit is clean. A safe toolchain upgrade remains separate
  maintenance, not a candidate defect.
- Exact-SHA hosted aggregate/deployment and physical-device smoke remain
  release follow-up work, not unresolved local implementation findings.
