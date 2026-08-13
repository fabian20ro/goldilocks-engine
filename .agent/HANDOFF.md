# Candidate handoff — round 082 stale ledger recovery repair

## Implemented behavior summary

- Portrait Jobs now presents `Latest settlement` as a one-scan decision record:
  delivery outcome, the durable actual cash change, workload identity,
  recognition when earned, or the direct failure cause and unchanged recovery
  forecast. Outside finite onboarding it names the next valid decision; during
  onboarding, the existing guide remains the sole current-action owner.
- New failed settlements retain the exact event identity plus engine-owned
  task/cause markers. Jobs requires the settlement link to resolve to the
  first deterministic ledger event at that settlement tick, then maps the
  closed marker rather than reading free-form event prose. A stale relink,
  later Career failure, decoy task-shaped message, bounded-out record, or
  unavailable legacy provenance visibly reports unknown.
- A stale or integrity-invalid current save reconstructs retained ledger IDs
  from its ordered event tail and `eventSequence`, then removes a settlement
  link that no longer names its engine-order record. The shared allocator
  scans retained IDs before every append, preventing a predicted future ID
  from colliding and freezing Worker progress after restore.
- One native `Settlement accounting and provenance` disclosure contains the
  exact task ID, locked gross quote, completed/failed result, gross-minus-cost
  economic-net equation, paid/unpaid/cash-floor equation, actual cash change,
  and the existing three-decimal rationale. It is not a modal or drawer.
- The settled quote and result stack into one readable column through 393px.
  Queue remains above the later settlement record, retaining raw 320×693
  bottom-navigation reserve. The settlement and selected-quote disclosure
  summaries have at least 44px height.
- A local pure `settlementPresentation` selector separates this presentation
  from the engine-owned settlement data. Its only display arithmetic is mill
  rounding of derived paid/unpaid amounts, avoiding binary residue that could
  render a fully paid cost as `$0.000 unpaid`; Worker state, economy, and
  accounting remain unchanged. The existing schema-7 payload accepts the new
  optional provenance fields without migration; new settlement events persist
  the structural link while legacy records safely retain unknown cause.
- No global chrome, Career composer/draft, selected workload/catalogue,
  routing, PWA, offline, placement, or drag behavior changed.

## Plan requirements covered

| Requirement                                      | Evidence                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-scan success/failure identity and net change | `settlementPresentation.test.ts` plus `jobs-settlement-density.spec.ts` cover success, zero-payout/full-payment failure, and partial-cash failure at 320×693 and 393×742.                                                                                                                                                                                           |
| Exact accounting on demand                       | One native Details per settlement holds task, quote, counts, full equation, payment/floor, cash change, and fixed-three rationale. Unit and keyboard/touch browser checks assert it.                                                                                                                                                                                |
| Recovery/recognition/action ownership            | The selector preserves direct failure/recovery and success recognition. Browser coverage asserts the finite guide owns its action and settlement does not duplicate it.                                                                                                                                                                                             |
| Portrait/accessible layout                       | Raw 320/393 and 200%-text/reduced-motion checks assert 44px visible controls, no horizontal/nested scroll, and raw D-018 Jobs reserve.                                                                                                                                                                                                                              |
| Preserved system behavior                        | Retained focused/browser lanes cover first session, existing Jobs reflow/reserve, currency, pointer/touch drag, Career draft, placement cancellation, tab restoration, malformed save/reload, PWA/offline, and Pages behavior.                                                                                                                                      |
| Cross-feature failure provenance                 | `settlementProvenance.test.tsx` creates a failed Jobs task, later produces a Career distribution-shift failure through the Worker boundary, serializes/restores state, and asserts that `JobsView` retains the task's own direct cause.                                                                                                                             |
| Structural stale-save provenance                 | `settlementProvenance.test.tsx` covers same-task decoy text, mutable prose, malformed structural relink, legacy absence, restore/reseal, and Jobs rendering. `engine.test.ts` and `jobs-settlement-provenance.spec.ts` cover future-ID repair, collision-aware allocation, repeated ticks, reload, and offline. Immutable V-079–V-081 regressions remain unchanged. |

## Verifier findings addressed

- **V-078 preserved:** `JobsView` uses the settlement's exact event ID, so a
  later Career failure cannot displace the job cause after reload.
- **V-079 resolved:** Jobs never uses a task-ID substring or mutable prose as
  provenance. It requires event identity, engine-written task identity, and a
  closed engine failure marker; absent, stale, malformed, or bounded-out
  provenance renders `Cause unknown` rather than borrowing an event.
- **V-080 resolved:** stale integrity restore canonicalizes the bounded
  deterministic ledger tail and drops a relink that points to a later
  same-tick event, so the compact card cannot promote it into a direct cause.
- **V-081 resolved:** restored future/colliding IDs are repaired before
  reseal; the shared collision-aware allocator preserves unique subsequent
  audit IDs and Worker tick progress.
- Existing V-049/V-077 raw/scaled Jobs reserve/reflow coverage remains retained;
  the settlement stacks only as a later card at portrait <=393px.
- Existing hosted pointer/touch drag regression coverage remains retained; this
  slice does not alter drag code or fixtures.

## Setup, startup, and verification commands

Prerequisite: Node accepted by `package.json` (`^20.19.0 || >=22.12.0`).
Install dependencies and pinned Chromium only into ignored repository-local
caches:

```sh
./scripts/setup
./scripts/run
# http://127.0.0.1:4173/
```

```text
npm cache:          .cache/npm
Playwright browser: .cache/ms-playwright
browser artifacts:  test-results/, playwright-report/, playwright-pages-report/
coverage:           coverage/
```

For Linux browser packages only:

```sh
PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup
```

Canonical Node 22 verification (setup, deterministic loopback browser
servers, and cleanup are managed by `./scripts/verify`/Playwright):

```sh
E2E_PORT=42094 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
  npm_config_cache="$PWD/.cache/npm" \
  npm exec --yes --package=node@22 -- sh ./scripts/verify
```

`@playwright/test` is pinned in `package.json`; `test:e2e` and
`test:e2e:pages` use `.cache/ms-playwright`, never a user-home cache, global
browser, or existing profile.

## Important architectural decisions

- D-033 records the owner-authorized post-§20.7 settlement presentation
  boundary. D-034 records the narrower durable causal-provenance association.
  The new selector is local, pure, and directly unit-tested; no generic
  accounting or component framework was added.
- Settlement provenance is explicit durable event semantics: a new settlement
  points to the event ID it writes, while that event stores the exact accepted
  task ID and a closed failure-cause marker. The UI maps that marker to the
  engine-owned cause text and never reads mutable free-form prose. All fields
  are optional for schema-7 compatibility, so legacy/malformed/bounded data
  has an honest unknown fallback instead of a speculative migration.
- D-035 applies the existing safe stale-save recovery boundary to ledger
  identity. A damaged seal is not proof of optional provenance: restoration
  rebuilds only deterministic retained IDs and retains only an engine-order
  settlement link. Allocation is centralized so the engine never emits a
  duplicate ID from a restored collision.
- The first-level cash change deliberately uses durable `netChange`; Details
  separately names economic gross minus configured cost. This prevents the
  partial-cash state from falsely leading with `−$0.010` when cash changed by
  `−$0.005`.
- There is exactly one settlement/accounting disclosure. Existing selected
  quote Details stays associated with configuration, not settlement
  provenance. Run totals remain distinct lifetime context.
- Existing verifier-authored regression tests were migrated to open the native
  disclosure and assert stronger fixed-three provenance. No immutable report
  under `.agent/verification/` was edited.

## Device smoke availability

- **iOS simulator:** `xcrun simctl list devices available` could not connect
  to `com.apple.CoreSimulator.CoreSimulatorService`; it reported no usable
  device set. No iOS rendering or app interaction is claimed.
- **Android USB:** `adb devices -l` reported Pixel 6a `25121JEGR11385`
  connected. `adb -s 25121JEGR11385 reverse tcp:42081 tcp:42081` and
  `adb -s 25121JEGR11385 shell am start -W -a android.intent.action.VIEW -d
http://127.0.0.1:42081/` launched Chrome's intent successfully. The device
  immediately locked and Notification Shade owned focus (`mCurrentFocus
NotificationShade`); attempted screenshots were lock-screen/black, so no
  in-app Jobs touch result is claimed. Committed hasTouch Playwright remains
  the acceptance authority.

## Known limitations and risks

- Real-device smoke is exploratory only. Pinned Playwright is the reproducible
  browser acceptance evidence.
- Hosted CI, deployment, and push were not performed by this candidate.
- Lockfile installation may report development-dependency advisories; the
  canonical production-only audit is the release gate.

## Checks executed before handoff

- Node 22 focused provenance/unit lane:

  ```sh
  E2E_PORT=42110 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx vitest run --coverage=false \
    src/simulation/engine.test.ts \
    src/ui/settlementPresentation.test.ts \
    src/ui/settlementProvenance.test.tsx \
    src/ui/verifierRound079.test.tsx \
    src/ui/verifierRound080.test.tsx
  ```

  passed 5 files / 65 tests. This includes both immutable verifier regressions
  unchanged. Node 22 `npm run lint` and `npm run typecheck` also passed.

- Round-082 focused provenance lane after ledger canonicalization:

  ```sh
  E2E_PORT=43225 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx vitest run --coverage=false \
    src/ui/verifierRound079.test.tsx \
    src/ui/verifierRound080.test.tsx \
    src/ui/verifierRound081.test.tsx \
    src/ui/settlementProvenance.test.tsx \
    src/simulation/engine.test.ts
  ```

  passed 5 files / 64 tests, including every immutable V-079–V-081 regression
  unchanged.

- Round-082 candidate browser provenance lane:

  ```sh
  E2E_PORT=43226 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/jobs-settlement-provenance.spec.ts --reporter=line
  ```

  passed 2/2: raw-320 stale structural relink stays unknown through reload and
  service-worker offline reload; raw-393 future-ID restore has unique ledger
  IDs and progresses across a second reload/resume.

- Immutable round-081 adversarial probe, against a temporary Node-22 loopback
  production preview, then explicitly stopped with its port closed:

  ```sh
  BASE_URL=http://127.0.0.1:43227 \
    OUTPUT_DIR=/private/tmp/goldlocks-r082-last-v081 \
    PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- node \
    .agent/verification/round-081-adversarial.mjs
  ```

  passed `findings: []` for the exact V-080 relink and V-081 future-ID attack.

- Node 22 focused browser lane:

  ```sh
  E2E_PORT=42111 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/jobs-settlement-density.spec.ts \
    tests/e2e/first-session.spec.ts --reporter=line
  ```

  passed 20/20.

- Immutable round-080 adversarial provenance probe, against a temporary Node
  22 loopback preview, then explicitly cleaned up:

  ```sh
  BASE_URL=http://127.0.0.1:42112 \
    OUTPUT_DIR=/private/tmp/goldlocks-r081-r080-probe \
    PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- node \
    .agent/verification/round-080-adversarial.mjs
  ```

  passed `findings: []`: stale same-task decoy no longer displaces the direct
  cause at raw 320px keyboard and 393px touch, with 200%-text/reduced-motion
  geometry, native Details, and offline reload also passing.

- Immutable round-079 adversarial visual probe, run against a temporary
  Node 22 loopback preview and then cleaned up:

  ```sh
  BASE_URL=http://127.0.0.1:42102 \
    OUTPUT_DIR=/private/tmp/goldlocks-r080-probe \
    PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- node \
    .agent/verification/round-079-adversarial.mjs
  ```

  passed all checks, including raw 320/393 reserve (136.453125px and
  157.3125px), 200% text, native Details, exact accounting, target size, and
  no overflow/nested scroll.

- Node 22 candidate settlement browser lane:

  ```sh
  E2E_PORT=42084 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/jobs-settlement-density.spec.ts --reporter=line
  ```

  passed 9/9 after adding zero-payout/full-payment browser coverage. It covers
  success, zero, partial, no-settlement, raw reserve, global disclosure,
  keyboard/touch Details, reload, 200% text, reduced motion, screenshots, and
  no-overflow/44px checks.

- Node 22 retained focused browser lane:

  ```sh
  E2E_PORT=42080 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/round-009-usability.spec.ts \
    tests/e2e/verifier-round-017.spec.ts \
    tests/e2e/phase-4-currency.spec.ts \
    tests/e2e/verifier-round-069.spec.ts \
    tests/e2e/first-session.spec.ts \
    tests/e2e/jobs-portrait-margin.spec.ts --reporter=line
  ```

  passed 31/31 after adapting the intentionally moved exact accounting to the
  native disclosure while preserving/strengthening its assertions.

- Node 22 broader retained lane:

  ```sh
  E2E_PORT=42082 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- npx playwright test \
    tests/e2e/command-deck.spec.ts tests/e2e/game.spec.ts \
    tests/e2e/career.spec.ts tests/e2e/phase-3-density.spec.ts \
    tests/e2e/pwa-update.spec.ts --reporter=line
  ```

  passed 62/62 (`test-results/.last-run.json`: `status: passed`).

- Final clean canonical Node 22 command completed with all downstream checks
  passing:

  ```sh
  E2E_PORT=43228 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright \
    npm_config_cache="$PWD/.cache/npm" \
    npm exec --yes --package=node@22 -- sh ./scripts/verify
  ```

  Fresh setup, format, lint, typecheck, 50 unit/property files / 241 tests,
  deterministic/balance lanes, production build, production audit, root
  Playwright 228/228, and Pages Playwright 2/2 passed (zero unexpected or
  flaky tests). Both HTML report payloads were decoded afterwards to confirm
  the exact browser totals and zero report errors.

## Checks not run

- No unsupported global browser or user-home cache installation; the project
  requires repository-local caches.
- No hosted CI/deployment/push. Those require external release authority and
  are outside this candidate handoff.
