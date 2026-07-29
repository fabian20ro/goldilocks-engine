# Candidate handoff — round 055 Career action hierarchy (Phase 2)

## Implemented behavior summary

- Career now begins with a compact objective and current cash, savings,
  four-hour, and constraint resources. The player-authored four-route composer
  follows immediately in the DOM and has one high-emphasis Run action.
- Each stable emoji route shows its allocation, primary benefit, opportunity
  cost, current catalog/state-derived estimate, configured-cost cue, and
  current constraint. Its full description, availability/unlock condition,
  exact three-decimal accounting, rig/model/quantization effect, and evidence
  qualifier open in the established one-at-a-time Details surface.
- Pure `projectCareerRoute` and `projectCareerEvening` calculations reuse the
  authoritative career route/accounting code without changing Worker state.
  They share the same quarter-hour/four-hour boundaries as the schedule
  composer.
- Run status always names scheduled total, unallocated hours, and current
  ready/blocking/recovery reason. A completed evening adds a compact result:
  hours, money/progress, electricity/operating cost, relevant constraint, and
  next decision.
- Lifetime route actions, evaluation, savings, model/quantization, offline
  policy, independent exit, and diagnostics are native progressively disclosed
  sections in usefulness order. Existing Career mechanics and Phase 0/1
  persistence boundaries remain unchanged.
- Compact money values use one shared cents-or-mills precision for the visible
  Career equation; Details retain exact thousandths. Existing Inspect and
  ledger exact accounting remain retained.

## Plan requirements covered

| Requirement                                                   | Evidence                                                                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| §20.7 Phase 2 compact hierarchy/composer                      | `CareerView`, `career-hierarchy.spec.ts`; 320/393 objective, resources, route controls, single Run, geometry evidence           |
| Four stable routes; benefits, opportunity cost, exact Details | catalog `primaryBenefit`; component Details replacement/focus test; live catalog/state projections                              |
| Projections and shared currency precision                     | pure engine projections; projection/currency unit tests; Details exact 3-decimal values                                         |
| Completion summary and next decision                          | real Worker completion in portrait E2E deck                                                                                     |
| Progressive disclosure                                        | ordered native disclosure E2E coverage; retained actions open only through their appropriate detail section                     |
| Empty/partial/full/rejected/completed/locked/exit-ready deck  | committed Playwright deck emits all seven named screenshots at 320 and 393 CSS pixels                                           |
| Accessibility/responsiveness                                  | 320/393, keyboard, CDP touch, labels, focus restoration, 100/200% text, reduced-motion, no horizontal/nested composer scrolling |
| Retained Phase 0/1 persistence/offline/recovery               | canonical root E2E includes V-051–V-060 and offline/PWA/reload coverage                                                         |

## Verifier findings resolved

- No unresolved verifier finding exists at handoff. Retained V-057, V-058,
  V-059, and V-060 behavior and tests remain passing.
- Phase 2 required all retained Career controls to be explicitly opened through
  their new native disclosures; the preserved browser checks now model that
  user-visible interaction rather than querying hidden controls.

## Setup, startup, and verification commands

Prerequisite: Node matching `package.json` (`^20.19.0 || >=22.12.0`). First
setup needs network access for the lockfile and the repository-pinned browser.

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173
```

`./scripts/setup` runs `npm ci` and `npx playwright install chromium` with only
ignored repository-local caches:

```text
npm:       .cache/npm
Chromium:  .cache/ms-playwright
artifacts: coverage/, playwright-report/, playwright-pages-report/, test-results/
```

For Linux browser packages when necessary:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical verification starts deterministic loopback servers, waits for
readiness, and lets Playwright clean them up:

```sh
E2E_PORT=4255 ./scripts/verify
```

Focused Phase 2 checks:

```sh
npx vitest run src/simulation/careerProjection.test.ts src/ui/careerView.test.tsx --coverage.enabled=false --reporter=dot
E2E_PORT=4245 npm run test:e2e -- tests/e2e/career-hierarchy.spec.ts tests/e2e/career.spec.ts --reporter=dot
```

`@playwright/test` is pinned in `package.json`; `npm run test:e2e` uses only
`.cache/ms-playwright`, not a global CLI, profile, or browser. On this macOS
host Chromium needs a scoped host launch because the workspace sandbox cannot
create its Mach-port rendezvous server; no browser test was skipped.

## Important architectural decisions

- D-019 remains: React owns only the unsubmitted App-session Career draft;
  the Worker owns committed/durable schedule state.
- D-020 remains: successful storage, not merely a Worker response,
  acknowledges a submitted Career request. The existing lock/recovery boundary
  is unchanged.
- Phase 2 estimates are presentation-only pure calculations over existing
  route/accounting logic. They do not issue commands, create ledger events,
  advance time, or add a parallel simulation model.
- Existing route availability is not redefined. All four evening routes remain
  selectable from the first evening; the locked visual state in the screenshot
  deck is the established locked local-model Career capability.
- Native `<details>` provides keyboard-operable progressive disclosure without
  a new page, modal library, framework, asset set, theme, or mechanic.

## Known limitations and risks

- No physical mobile device, non-Chromium engine, native screen-reader speech,
  battery/thermal telemetry, or real quota exhaustion was available. Pinned
  Chromium covers portrait, touch, keyboard, text scale, reduced motion,
  persistence, reload, offline, and injected `QuotaExceededError` recovery.
- Full `npm audit` reports five high development-only ESLint-chain findings.
  Canonical production audit (`npm audit --omit=dev --audit-level=high`) is
  clean; no forced major audit upgrade was applied.
- Completion feedback is an in-tab compact recap. Reload retains the durable
  evening outcome in the existing state/ledger but intentionally does not
  preserve that transient recap panel.

## Checks executed before handoff

- `npm run format:check` — pass.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- Focused projections/Details check — 2 files, 5 tests pass.
- Focused Phase 2 portrait deck — 2/2 pass; screenshots generated for seven
  states at both 320 and 393 CSS pixels.
- Retained Career acceptance — 13/13 pass.
- Canonical clean-state check, `E2E_PORT=4255 ./scripts/verify` — pass:
  fresh `npm ci`; format; lint; typecheck; 36 unit/property files / 177 tests;
  numeric, first-session, 20,001-seed upgrade, progression, Career, and
  evaluation balances; production build; production audit (0 vulnerabilities);
  176/176 root E2E; 2/2 Pages/offline E2E.
- `./scripts/run` — ready at `127.0.0.1:4173` in 133ms; `/` and `/sw.js`
  each returned HTTP 200; controlled shutdown left loopback unreachable (HTTP
  000).

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; external publication/device access is outside
  this Implementer handoff.
