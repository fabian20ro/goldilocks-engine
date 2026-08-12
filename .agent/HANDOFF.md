# Candidate handoff — round 069 Phase 4 currency disclosure repair

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

## Plan requirements covered

| §20.7 Phase 4 requirement                                        | Candidate evidence                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared compact money policy; exact Details/Inspect/ledger values | `currency.ts` helpers and unit coverage; HUD/card/target/quote/settlement/Career consumers; Details continue through `formatExactCurrency`                                                                                                                           |
| Five-tab glyph/status/heading/warning/Details/focus/motion audit | retained command-deck component tests plus all-root browser suite; no new design system or disclosure surface                                                                                                                                                        |
| Inspect first-view bottleneck, baseline delta, causal evidence   | `InspectPriority` reuses `ComparisonDelta`; pinned command-deck assertions verify order and captured baseline output                                                                                                                                                 |
| Bottom-tab scroll consistency                                    | command-deck browser regression saves Build scroll, enters Jobs at its own origin, then restores Build's position                                                                                                                                                    |
| Portrait/reflow release evidence                                 | command-deck captures Build/Jobs/Career/Upgrades/Inspect for starter and expanded states at 320×693 and 393×742; asserts no document overflow, no nested rail scroll, and no visible button below 44px; 320×693 200%-text reduced-motion Inspect capture is reviewed |
| Preserve Phase 2/3/PWA/persistence/gameplay                      | canonical suite retains first-session, queue, quote, expansion, malformed-state, offline/PWA, Career, balance, static, production build, and Pages checks                                                                                                            |

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
- V-066 and V-067 remain preserved: selected Build ordering still favors a
  compatible actionable owned choice, and the narrow sticky placement tray
  keeps a visible, cancellable 44px action at enlarged text.
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
npx vitest run --coverage=false src/simulation/currency.test.ts src/simulation/engine.test.ts src/simulation/verifierRound017.test.ts src/simulation/verifierRound018.test.ts src/ui/careerView.test.tsx src/ui/commandDeck.test.tsx src/ui/moduleInventory.test.ts
E2E_PORT=4256 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot
E2E_PORT=4272 ./scripts/run-e2e
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4272 OUTPUT_DIR=/tmp/goldlocks-r069-round-068-adversarial node .agent/verification/round-068-adversarial.mjs
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
- Inspect adds one local priority strip and reuses the existing comparison
  component. No new page, drawer, state schema, Worker command, asset, or
  research/design-system abstraction was added.
- Header short labels retain the prior accessible names (`Help / Quick start`,
  `Animations on/off`); bottom tab buttons retain their full aria labels while
  visually truncating only under constrained enlarged text.
- D-027/D-028 selected-stage inventory and cancellation boundaries remain
  unchanged. D-008 Pages scope remains `/goldilocks-engine/`.

## Known limitations and risks

- No physical mobile-device, non-Chromium browser, or external screen-reader
  pass was available. Pinned Chromium covers the required portrait, text-scale,
  keyboard/touch, persistence, reload/resume, offline, and recovery suites.
- Remote push, hosted workflow aggregation, exact-SHA Pages deployment, and
  live smoke are external release steps and were not performed by this
  Implementer.

## Checks executed before handoff

- `npm run format:check`; `npm run lint`; `npm run typecheck` — pass.
- `npx vitest run --coverage=false src/simulation/currency.test.ts src/simulation/engine.test.ts src/simulation/verifierRound017.test.ts src/simulation/verifierRound018.test.ts src/ui/careerView.test.tsx src/ui/commandDeck.test.tsx src/ui/moduleInventory.test.ts`
  — 7 files / 81 tests pass.
- `E2E_PORT=4271 npm run test:e2e -- tests/e2e/phase-4-currency.spec.ts --reporter=dot`
  — 2/2 candidate currency regressions pass.
- `E2E_PORT=4256 npm run test:e2e -- tests/e2e/phase-4-currency.spec.ts tests/e2e/command-deck.spec.ts --reporter=dot`
  — 10/10 retained Phase 4 browser checks pass.
- `E2E_PORT=4261 npm run test:e2e -- tests/e2e/verifier-round-016.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot`
  — 3/3 pass after the retained guaranteed-failure assertion adopted the same
  compact formatter contract; its no-positive-net behavior is unchanged.
- Logged `E2E_PORT=4260 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/phase-3-density.spec.ts tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts tests/e2e/phase-4-currency.spec.ts --reporter=dot`
  — 36/36 pass. It includes starter/expanded 320×693 and 393×742, 200%-text
  reduced-motion, Build placement, Career, and all three V-071 boundaries.
- Fresh loopback preview at `127.0.0.1:4272`; unchanged immutable probe:
  `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:4272 OUTPUT_DIR=/tmp/goldlocks-r069-round-068-adversarial node .agent/verification/round-068-adversarial.mjs`
  — `findings: []`. The probe was neither edited nor bypassed.
- Final logged `E2E_PORT=4257 ./scripts/verify` — exit `0` at
  `2026-08-12T21:28:32Z`: format, lint, typecheck; 42 unit files / 201 tests;
  coverage statements/branches/functions/lines
  `88.92% / 85.88% / 96.10% / 92.33%`; numeric, first-session (41), upgrades
  (20,001), progression (41), Career (101), and evaluation (121) balances;
  production build/audit (`0 vulnerabilities`); root Playwright 202/202;
  Pages Playwright 2/2.
- `./scripts/run` loopback startup/readiness/cleanup — `127.0.0.1:4173`
  returned `200` with the `The Goldilocks Engine` shell; the temporary
  `goldlocks-r069-startup-final` session was stopped and a subsequent fetch
  failed as expected.

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; outside local Implementer authority.
- No local required check is skipped. No verifier report or adversarial probe
  was edited.
