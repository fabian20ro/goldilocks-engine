# Candidate handoff — round 066 Phase 4 cross-screen consistency

## Implemented behavior summary

- All non-accounting money summaries now use the shared
  `formatCompactCurrency` policy: cents by default, or mills where an
  individual summary needs it; explicitly additive settlement rows keep their
  related terms at one precision. This covers the HUD, Build and
  Upgrades cards, requirements, targets, Jobs quotes, queue summaries, Career
  summaries, and settlement/recovery text.
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

- No unresolved verifier finding existed at accepted base
  `12eacb17d250a840c6debf69940ebd8a9728c724`.
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
E2E_PORT=4255 ./scripts/verify
```

Focused Phase 4 checks:

```sh
npx vitest run --coverage=false src/simulation/currency.test.ts src/ui/commandDeck.test.tsx src/ui/moduleInventory.test.ts
E2E_PORT=4256 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=dot
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
  change. Related equation terms are formatted together; exact accounting
  surfaces opt in explicitly.
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

- `npm run format:check` — pass.
- `npm run lint` — pass.
- `npm run typecheck` and `npm run build` — pass.
- `npm test` — 42 files / 195 tests pass; global coverage
  statements/branches/functions/lines: 88.92% / 85.96% / 96.09% / 92.33%.
- `npx vitest run --coverage=false src/simulation/currency.test.ts src/ui/commandDeck.test.tsx src/ui/moduleInventory.test.ts` — 3 files / 14 tests pass.
- `npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=dot` — 8
  tests pass under scoped pinned Chromium; screenshots reviewed at starter and
  expanded 320×693/393×742 plus Inspect 320×693 at 200% reduced motion.
- `E2E_PORT=4255 ./scripts/verify` — pass: formatting, lint, typecheck, 42
  unit files / 195 tests, all numeric/first-session/20,001-upgrade/progression/
  Career/evaluation balances, production build, high/critical production audit,
  200/200 root Playwright tests, and 2/2 Pages Playwright tests.
- `./scripts/run` loopback startup/readiness/cleanup — Vite ready at
  `http://127.0.0.1:4173/`; fetched the `The Goldilocks Engine` shell, stopped
  the temporary `goldlocks-r066` session, and confirmed port 4173 no longer
  accepted a connection.

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; outside local Implementer authority.
