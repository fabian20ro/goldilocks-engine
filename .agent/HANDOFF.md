# Candidate handoff — round 059 V-064 request-keyed Career feedback repair

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
- Career feedback now uses a small, request-ID-keyed, App-session registry.
  Every submitted Run and direct safe-offline apply owns one independent entry;
  unrelated policy-save responses own none and cannot replace an earlier entry.
- Career processes the existing Worker boundary queue in order and claims each
  entry only from its exact request ID, immediate before-state, and returned
  state. React batching of apply → policy save → zero-hour apply therefore
  preserves the first completed offline recap.
- D-020 remains the display/removal boundary: a completed entry waits for the
  existing durable watermark, then is drained exactly once. A non-completing
  response invalidates only its own entry; durable/orphaned entries and a
  run-ending session are cleaned up without persistence or simulation changes.
- Lifetime route actions, evaluation, savings, model/quantization, offline
  policy, independent exit, and diagnostics are native progressively disclosed
  sections in usefulness order. Existing Career mechanics and Phase 0/1
  persistence boundaries remain unchanged.
- Compact money values use one shared cents-or-mills precision for the visible
  Career equation; Details retain exact thousandths. Existing Inspect and
  ledger exact accounting remain retained.

## Plan requirements covered

| Requirement                                                                    | Evidence                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §20.7 Phase 2 compact hierarchy/composer                                       | `CareerView`, `career-hierarchy.spec.ts`; 320/393 objective, resources, route controls, single Run, geometry evidence                                                     |
| Four stable routes; benefits, opportunity cost, exact Details                  | catalog `primaryBenefit`; component Details replacement/focus test; live catalog/state projections                                                                        |
| Projections and shared currency precision                                      | pure engine projections; projection/currency unit tests; Details exact 3-decimal values                                                                                   |
| Completion summary, response ordering, recovery attribution, and next decision | request-keyed pure registry + three-boundary hook coverage; buffered real-Worker apply → policy save → zero-hour apply; immutable V-064/V-063/V-062/V-061 E2E regressions |
| Progressive disclosure                                                         | ordered native disclosure E2E coverage; retained actions open only through their appropriate detail section                                                               |
| Empty/partial/full/rejected/completed/locked/exit-ready deck                   | committed Playwright deck emits all seven named screenshots at 320 and 393 CSS pixels                                                                                     |
| Accessibility/responsiveness                                                   | 320/393, keyboard, CDP touch, labels, focus restoration, 100/200% text, reduced-motion, no horizontal/nested composer scrolling                                           |
| Retained Phase 0/1 persistence/offline/recovery                                | canonical root E2E includes V-051–V-060 and offline/PWA/reload coverage                                                                                                   |

## Verifier findings addressed

- V-064: independent request-ID entries retain the first completed safe-offline
  result across a later policy save and zero-hour apply released in the same
  React batch. The candidate-owned and immutable three-command browser probes
  show `Night 1 result` / `4.00h used` after the durable state reaches
  `{ completedEvenings: 1, maxHours: 0, offlineHours: 0 }`.
- V-063: functional ordered boundary delivery retains both real Worker
  responses until Career processes them. A later valid zero-hour offline
  response invalidates only its own absent recap, leaving the preceding
  completed Run as Night 1.
- V-062: concurrent valid Run then safe-offline commands use their respective
  ordered Worker response boundaries. The later offline recap is Night 2 and
  uses the Worker state after the queued Run, not the stale click-time state.
- V-061 retained: a rejected Career batch invalidates its response-scoped
  projection. A later direct safe-offline completion cannot render the
  rejected 0h/$0 recap.
- Retained V-057, V-058, V-059, and V-060 behavior and tests remain covered.
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
npm test -- src/ui/careerFeedbackTransactions.test.ts src/ui/useSimulation.test.tsx --coverage.enabled=false --reporter=dot
E2E_PORT=4392 npm run test:e2e -- tests/e2e/career.spec.ts --grep "earlier completed offline recap" --repeat-each=5 --reporter=dot
E2E_PORT=4394 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts tests/e2e/verifier-round-057.spec.ts tests/e2e/verifier-round-058.spec.ts --repeat-each=10 --reporter=dot
E2E_PORT=4395 npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced App-session draft" --repeat-each=25 --reporter=dot
E2E_PORT=4396 npm run test:e2e -- tests/e2e/career.spec.ts --grep "(visibly holds a failed Career save until a later Worker persistence retry succeeds|keeps an unsubmitted Career evening blocked through an unrelated save failure)" --repeat-each=5 --reporter=dot
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
- D-022/D-023/D-024 remain: every recap uses its exact ordered Worker boundary;
  the App drains processed boundaries rather than creating a durable event
  system.
- D-025: a Career-only `Map<requestId, transaction>` retains one independent
  UI-session entry per relevant submitted action. Exact-once claim/completion,
  per-ID invalidation, D-020 durable draining, and run-ending cleanup prevent
  a later request from overwriting or erasing a prior completed feedback item.
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

- `npm test -- --runInBand src/ui/careerFeedbackTransactions.test.ts
src/ui/useSimulation.test.tsx --coverage.enabled=false --reporter=dot` —
  Vitest rejected the unsupported `--runInBand` option before test execution;
  corrected immediately below.
- `npm test -- src/ui/careerFeedbackTransactions.test.ts
src/ui/useSimulation.test.tsx --coverage.enabled=false --reporter=dot` —
  2 files / 9 tests pass: multiple independent entries, duplicate claim,
  non-completion, exact-once durable drain, and three real ordered boundaries.
- `npm run format:check && npm run lint && npm run typecheck` — pass after
  production and candidate test edits.
- Candidate V-064 E2E, `E2E_PORT=4392 npm run test:e2e --
tests/e2e/career.spec.ts --grep "earlier completed offline recap"
--repeat-each=5 --reporter=dot` — 5/5 pass.
- Immutable V-064 E2E, `E2E_PORT=4393 npm run test:e2e --
tests/e2e/verifier-round-058.spec.ts --repeat-each=10 --reporter=dot` —
  10/10 pass.
- Immutable V-061/V-062/V-063/V-064 E2E, `E2E_PORT=4394 npm run test:e2e --
tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts
tests/e2e/verifier-round-057.spec.ts tests/e2e/verifier-round-058.spec.ts
--repeat-each=10 --reporter=dot` — 60/60 pass.
- Human-paced App-session draft, `E2E_PORT=4395 npm run test:e2e --
tests/e2e/career.spec.ts --grep "human-paced App-session draft"
--repeat-each=25 --reporter=dot` — 50/50 pass (25 repeats at each required
  320px and 393px width).
- Persistence/recovery E2E, `E2E_PORT=4396 npm run test:e2e --
tests/e2e/career.spec.ts --grep
"(visibly holds a failed Career save until a later Worker persistence retry succeeds|keeps an unsubmitted Career evening blocked through an unrelated save failure)"
--repeat-each=5 --reporter=dot` — 10/10 pass.
- Canonical clean-state check, `E2E_PORT=4397 ./scripts/verify` — completed
  passing after fresh `npm ci`: format, lint, typecheck, full unit/property
  suite, numeric and all five deterministic balance runs, production build,
  production audit, root pinned-Chromium E2E, and Pages/offline E2E. Both final
  Playwright report markers record `status: passed`.
- `./scripts/run` — ready at `127.0.0.1:4173` in 167 ms; `/` and `/sw.js`
  each returned HTTP 200; controlled shutdown left loopback unreachable (HTTP
  000).
- `git diff --check` — pass before documentation finalization.

## Checks not run

- No deployment, push, hosted GitHub Actions run, physical-device pass, or
  external screen-reader pass; external publication/device access is outside
  this Implementer handoff.
