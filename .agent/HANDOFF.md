# Candidate handoff — round 072 hosted CI Phase 3 seed synchronization repair

## Implemented behavior summary

- All non-accounting money summaries use the shared `formatCompactCurrency`
  policy: cents by default, or mills where an individual summary needs it.
  Career Cash, Savings, and lifetime totals are independent values; individual
  Career route/completed-evening accounting equations retain one local
  precision. Explicitly additive Jobs settlement rows remain one equation.
  This covers the HUD, Build and Upgrades cards, requirements, targets, Jobs
  quotes, queue summaries, Career summaries, and settlement/recovery text.
  Queue 10 is a non-additive quote range: its displayed first and last quotes
  format independently, so undisplayed middle reservations cannot promote
  either endpoint to mills.
- The selected Jobs dispatch card now formats its failed payout through that
  shared policy (`$0.00`), rather than a raw `$0` literal. Exact Career route
  Details remain three-decimal accounting disclosures.
- The standalone Career private-evaluation action and Build no-model warning
  now call that same compact policy (`$0.75` and `$0.00`). Settlement-event
  ledger sentences call `formatExactCurrency` for every accounting term:
  gross, configured cost, signed net, paid/unpaid portions, and cash floor.
  This is presentation-only; all settlement arithmetic and state are retained.
- Exact three-decimal values remain explicit in Details, Inspect-adjacent
  accounting, and ledger-style disclosures through `formatExactCurrency`.
  Money arithmetic, purchases, quotes, Worker authority, persistence, and
  simulation state are unchanged.
- A Jobs settlement cash-floor term now uses the same related-equation
  precision as the visible gross, configured, paid, unpaid, and net terms.
  Mill rows therefore render the floor as `$0.000`; ordinary rows stay compact.
- Durable module, hardware, and Workstation Expansion purchase/rejection
  records, plus the Bedroom exit-savings milestone, use fixed-three currency.
  Purchase controls stay compact. Cents-era purchase records remain accepted
  solely as historical provenance during safe stale-save recovery.
- Career model-tier requirement cards format their visible $8/$18 thresholds
  with `formatCompactCurrency` (`$8.00` / `$18.00`) without changing catalog
  eligibility mechanics or Details accounting.
- The Career Bedroom Developer exit target now reads the engine-owned
  `BEDROOM_EXIT_SAVINGS_REQUIRED` threshold through `formatCompactCurrency`
  (`$24.00`). Its adjacent live Current value remains explicitly exact
  (`$3.000` in the starter state), and the durable exit ledger remains
  fixed-three (`$24.000`).
- Inspect's configuration panel now begins with one compact diagnostic strip:
  dominant bottleneck, existing `ComparisonDelta` baseline throughput, and the
  latest retained causal evidence. Existing guidance, upgrade feedback, and
  time controls follow that decision content; no second Inspect surface exists.
- Header and bottom-tab presentation reflows intrinsically at enlarged text:
  compact visible labels preserve established accessible names, resource HUD
  columns reduce only when needed, header controls retain 44px minima, and tab
  labels truncate instead of fragmenting words. Per-tab scroll restoration,
  Details focus return, warning/glyph/status semantics, and reduced motion are
  preserved.
- Phase 3 remains intact: one ordered pipeline, live module inventory,
  explicit placement tray/cancel/focus/drag, 3→6 empty/bypassed expansion, PWA
  scopes, persistence, queueing, and Career behavior have no new mechanics or
  pages.
- The Phase 3 browser fixture now closes its old dedicated-Worker page before
  seeding money for a replacement app boot. A marker-gated one-shot init script
  applies the test fixture once, then the helper waits for the replacement app
  to durably publish the exact seeded money. This is test synchronization only:
  no product persistence, Worker protocol, affordability rule, Phase 3 live
  affordability assertion, or timeout changed.
- The retained Queue 10 browser regression continues to compare its visible
  range label against the current persisted quote snapshot through
  `getWorkloadQuote` and `formatCompactCurrency`. It no longer assumes a
  dynamically locked endpoint is itself cent-exact after a later Worker
  boundary; component coverage still proves undisplayed middle mills cannot
  promote either visible endpoint. No product currency policy changed.

## Plan requirements covered

| §20.7 Phase 4 requirement                                        | Candidate evidence                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared compact money policy; exact Details/Inspect/ledger values | `currency.ts` helpers and unit coverage; HUD/card/target/quote/settlement/Career consumers; Details continue through `formatExactCurrency`                                                                                                                           |
| Five-tab glyph/status/heading/warning/Details/focus/motion audit | retained command-deck component tests plus all-root browser suite; no new design system or disclosure surface                                                                                                                                                        |
| Inspect first-view bottleneck, baseline delta, causal evidence   | `InspectPriority` reuses `ComparisonDelta`; pinned command-deck assertions verify order and captured baseline output                                                                                                                                                 |
| Bottom-tab scroll consistency                                    | command-deck browser regression saves Build scroll, enters Jobs at its own origin, then restores Build's position                                                                                                                                                    |
| Portrait/reflow release evidence                                 | command-deck captures Build/Jobs/Career/Upgrades/Inspect for starter and expanded states at 320×693 and 393×742; asserts no document overflow, no nested rail scroll, and no visible button below 44px; 320×693 200%-text reduced-motion Inspect capture is reviewed |
| Preserve Phase 2/3/PWA/persistence/gameplay                      | canonical suite retains first-session, queue, quote, expansion, malformed-state, offline/PWA, Career, balance, static, production build, and Pages checks                                                                                                            |
| CI-stable Phase 3 saved-state fixture                            | Worker-safe replacement-page bootstrap and durable-state poll retain the live `Precision Cleaner` affordability assertion at 320/393 without arbitrary delay                                                                                                         |

## Verifier findings addressed

- V-068: clean Career quick resources remain Cash `$0.00` and Savings `$3.00`
  while a one-hour Freelance preview retains its own mill equation
  (`$2.166` expected net, `$0.110` configured cost). Exact Details retains
  `$2.276` gross, `$0.098` operating, `$0.012` electricity, and `$2.166`
  economic net. Candidate component coverage locks all three boundaries.
- V-069: the selected Jobs failed-payout card uses
  `formatCompactCurrency(0)` and renders `$0.00 gross`; component coverage
  locks the card text.
- V-070: Queue 10 no longer builds one precision context from all ten future
  quotes. It reads and compact-formats only its visible first and last values,
  yielding `$1.38 → $0.02` after the starter run even though middle locked
  quotes include mills. The existing additive settlement equation retains its
  related-term precision unchanged. Unit, component, and browser regressions
  persist the full quote sequence and lock this boundary.
- V-071: the Career private-evaluation action now independently renders
  `$0.75`, and the Build no-model warning renders `$0.00 gross`, through the
  shared compact formatter. Failed-settlement ledger accounting instead always
  renders fixed-three-decimal terms—for example `$0.000` gross, `$0.010`
  configured cost, `$0.000` paid, `$0.010` unpaid, and `$0.000` cash floor.
  Candidate engine, Career component, and reload-safe browser coverage lock
  the three boundaries; the unchanged round-068 adversarial probe returns no
  findings.
- V-072: the Jobs settlement cash floor now uses the same displayed equation
  precision as gross, configured, paid, unpaid, and net terms. Candidate unit
  and browser coverage lock the `$0.000` floor on a partial mill settlement.
- V-073: module, hardware, and expansion success/insufficient-funds records,
  and the Bedroom exit record, use fixed-three accounting currency. Candidate
  engine and reload-safe browser coverage cover all branches; retained
  first-session provenance tests keep cents-era persisted records recoverable.
- V-074: model-tier requirement cards call the compact formatter for each
  independent threshold. Candidate component and browser coverage lock Harbor
  `$8.00` and Kiln `$18.00`/`$8.00` copy.
- V-075: the Career exit progress target no longer carries a raw `$24` literal.
  It imports the engine-owned threshold and renders `save $24.00` with the
  shared compact formatter; component and browser coverage retain the adjacent
  exact Current `$3.000` boundary.
- V-066 and V-067 remain preserved: selected Build ordering still favors a
  compatible actionable owned choice, and the narrow sticky placement tray
  keeps a visible, cancellable 44px action at enlarged text.
- Hosted Verify run `31650754334`: root browser test #50 exposed a test-only
  seed/reload race at Phase 3 320px. The helper previously wrote localStorage
  then reloaded while the old page's periodic Worker could still persist its
  stale snapshot. It now terminates that page before a marker-gated fresh boot
  and proves the seeded money was durably republished before retaining the
  original live affordability assertions. No verifier probe, product code,
  Phase 3 affordability assertion, or timeout was weakened.
- This candidate adds durable Phase 4 regressions for compact/exact currency,
  Inspect priority/baseline, per-tab scroll restoration, five-tab portrait
  matrix, and reduced-motion 200% text geometry.

## Setup, startup, and verification commands

Prerequisite: Node version accepted by `package.json` (`^20.19.0 || >=22.12.0`).
First setup needs network access only for lockfile-pinned dependencies and the
repository-pinned Chromium.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173/
```

Repository-local ignored caches/artifacts:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
artifacts: coverage/, playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser packages when necessary:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical full verification starts deterministic loopback servers, waits for
readiness, and lets Playwright clean them up:

```sh
E2E_PORT=4257 ./scripts/verify
```

Focused Phase 4 checks:

```sh
npx vitest run --coverage=false src/simulation/currency.test.ts src/simulation/capitalLedgerCurrency.test.ts src/simulation/verifierRound041.test.ts src/simulation/verifierRound042.test.ts src/simulation/verifierRound069.test.ts src/ui/careerView.test.tsx
E2E_PORT=4283 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot
E2E_PORT=4282 ./scripts/run-e2e
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4282 OUTPUT_DIR=/tmp/goldlocks-r070-round-067-adversarial node .agent/verification/round-067-adversarial.mjs
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4282 OUTPUT_DIR=/tmp/goldlocks-r070-round-068-adversarial node .agent/verification/round-068-adversarial.mjs
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4282 OUTPUT_DIR=/tmp/goldlocks-r071-round-070-adversarial node .agent/verification/round-070-adversarial.mjs
CI=1 E2E_PORT=4313 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache=.cache/npm npx --yes --package=node@22 node ./node_modules/playwright/cli.js test tests/e2e/phase-3-density.spec.ts --grep 'Phase 3 groups, details, and every-item route at 320px' --repeat-each=50 --reporter=line
```

The active Pages package remains
`https://fabian20ro.github.io/goldlocks-engine/`. Its local scope/PWA check is:

```sh
npm run build:pages
E2E_PORT=4258 npm run test:e2e:pages
```

`@playwright/test` is pinned in `package.json`; `npm run test:e2e` uses only
`.cache/ms-playwright`, never a global browser/profile. On this macOS host,
Chromium requires a scoped host launch because the workspace sandbox cannot
create its Mach-port rendezvous server; browser checks are never silently
skipped.

## Important architectural decisions

- D-030: compact presentation is a formatter policy, not a money-model
  change. Independent values never inherit a different equation's precision;
  related route/evening/settlement terms are formatted together; exact
  accounting surfaces opt in explicitly. Queue 10's first/last quote range is
  independent rather than an equation, so it never shares precision with its
  undisplayed reservations. The private-evaluation action and Build warning
  are independent compact disclosures; settlement ledger equations opt into
  exact fixed-three currency for each visible accounting term.
- D-030 additionally distinguishes compact settlement summary precision from
  fixed-three durable capital/exit ledger records. A cash floor is a visible
  member of a related settlement equation; model-tier card thresholds remain
  independent compact values. The Career exit target reads its engine-owned
  savings threshold through compact currency while its Current disclosure and
  durable ledger remain exact. Recovery recognizes the prior cents purchase
  wording only as historical provenance.
- Inspect adds one local priority strip and reuses the existing comparison
  component. No new page, drawer, state schema, Worker command, asset, or
  research/design-system abstraction was added.
- Header short labels retain the prior accessible names (`Help / Quick start`,
  `Animations on/off`); bottom tab buttons retain their full aria labels while
  visually truncating only under constrained enlarged text.
- D-027/D-028 selected-stage inventory and cancellation boundaries remain
  unchanged. D-008 Pages scope remains `/goldilocks-engine/`.
- Phase 3 fixture synchronization is deliberately test-local. Direct save
  mutation cannot safely rely on reload because the outgoing app's periodic
  Worker may persist after the mutation. The fixture closes that Worker-owning
  page, applies one marker-gated saved snapshot before the replacement app
  reads storage, and polls its durable observable state. This preserves the
  same live affordability assertion without a timing sleep or application
  change.

## Known limitations and risks

- No physical mobile-device, non-Chromium browser, or external screen-reader
  pass was available. Pinned Chromium covers the required portrait, text-scale,
  keyboard/touch, persistence, reload/resume, offline, and recovery suites.
- Remote push, hosted workflow aggregation, exact-SHA Pages deployment, and
  live smoke are external release steps and were not performed by this
  Implementer.

## Checks executed before handoff

- Hosted failure evidence: `gh run view 31650754334 --log-failed` — only root
  test #50 failed; after `setSavedMoney(page, 10)`, the original live
  affordability assertion saw `0` available modules for its full 5s timeout.
  The same 393 case and 207 remaining root tests passed. This confirms a stale
  save boot rather than an affordability/product failure.
- Baseline CI-like current-code stress before repair:
  `CI=1 E2E_PORT=4310 npm run test:e2e -- tests/e2e/phase-3-density.spec.ts --grep 'Phase 3 groups, details, and every-item route at 320px' --repeat-each=25 --reporter=line`
  — 25/25 pass locally under Node 26; hosted evidence establishes the
  timing-sensitive reproduction.
- Repaired CI-major stress:
  `CI=1 E2E_PORT=4313 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache=.cache/npm npx --yes --package=node@22 node ./node_modules/playwright/cli.js test tests/e2e/phase-3-density.spec.ts --grep 'Phase 3 groups, details, and every-item route at 320px' --repeat-each=50 --reporter=line`
  — Node 22.23.2, 50/50 pass. Representative 393px Node 22 command with the
  same harness — 1/1 pass.
- `E2E_PORT=4311 CI=1 npm run test:e2e -- tests/e2e/phase-3-density.spec.ts --reporter=line`
  — 7/7 Phase 3 density/placement/touch/geometry cases pass.
- Retained focused Phase 3/4 portrait and Career matrix:
  `E2E_PORT=4315 CI=1 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot`
  — 39/39 pass; starter/expanded 320×693 and 393×742, 200%-text,
  placement, Career, and currency boundaries.
- Initial R072 canonical root-browser evidence found one retained Queue 10
  test expectation that rounded a persisted dynamic endpoint to cents
  (`1.336` observed). This was a test assumption rather than a policy/product
  failure: a later Worker boundary may legitimately lock a mill quote. The
  repaired regression retains the data-derived persisted-current-state label
  assertion through `formatCompactCurrency`, does not hardcode a transient
  quote, and still verifies middle mill reservations. Node 22 repeat command
  above — 25/25 after repair; `E2E_PORT=4318 CI=1 npm run test:e2e --
tests/e2e/phase-4-currency.spec.ts --reporter=list` — 5/5.
- `npm run format:check`; `npm run lint`; `npm run typecheck` — pass.
- `npx vitest run --coverage=false src/simulation/currency.test.ts src/simulation/capitalLedgerCurrency.test.ts src/simulation/verifierRound041.test.ts src/simulation/verifierRound042.test.ts src/simulation/verifierRound069.test.ts src/ui/careerView.test.tsx`
  — 6 files / 35 tests pass, including the compact `$24.00` exit target and
  exact `$3.000` Current boundary.
- Exact verifier browser regression:
  `E2E_PORT=4280 npm run test:e2e -- tests/e2e/verifier-round-069.spec.ts --reporter=list`
  — 3/3 pass.
- Candidate currency browser regression:
  `E2E_PORT=4281 npm run test:e2e -- tests/e2e/phase-4-currency.spec.ts --reporter=list`
  — 5/5 pass, including Career exit target/current precision.
- Focused Phase 3/4 portrait and Career matrix:
  `E2E_PORT=4283 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot`
  — 39/39 pass; starter/expanded 320×693 and 393×742, 200%-text,
  placement, Career, and currency boundaries.
- Retained purchase/recovery and verifier browser tests:
  `E2E_PORT=4284 npm run test:e2e -- tests/e2e/round-012-upgrades.spec.ts tests/e2e/verifier-round-050.spec.ts tests/e2e/verifier-round-069.spec.ts --reporter=list`
  — 12/12 pass.
- Fresh production preview at `127.0.0.1:4282`; unchanged immutable probes:
  round-067 and round-068 commands above — each returned `findings: []`.
  Neither probe was edited or bypassed.
- Fresh production preview at `127.0.0.1:4301`; unchanged immutable
  `round-070-adversarial.mjs` — `findings: []`. The preview was stopped and
  the port then refused connections.
- Final isolated canonical command:
  `E2E_PORT=4320 ./scripts/verify`, captured at
  `/tmp/goldlocks-r072-final-canonical.log` — terminal marker
  `R072_FINAL_CANONICAL_EXIT=0`; format, lint, and TypeScript passed; 44
  unit/property files / 218 tests passed; first-session 41, upgrades 20,001,
  progression 41, Career 101, and evaluation 121 balance seeds had zero
  failures; production audit found `0` vulnerabilities; root Playwright
  208/208; Pages 2/2.
- `./scripts/run` — `127.0.0.1:4173` returned the `The Goldilocks Engine`
  shell; temporary `goldlocks-r072-startup` was stopped and the port then
  returned connection refused.

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; outside local Implementer authority.
- No local required check is skipped. No verifier report or adversarial probe
  was edited.
