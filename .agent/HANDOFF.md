# Candidate handoff — Milestone 7B OIV-first routing assertion repair

## Implemented behavior summary

- Synchronized the two routing regression suites with the authoritative active
  M7B heading and plural historical-provenance heading.
- Retained the catalog, historical IDs, and no-live-claim assertions; no
  product code, `plan.md`, M7B scope, release receipt, or immutable report was
  changed.
- Rule-of-Three seam review covers normal active-M7B headings, historical
  provenance headings/IDs, and the boundary invariant excluding live/current
  candidate claims.
- Preserved the existing M7B OIV-first matrix, budgets, Rule of Three,
  repository-local cache/startup contract, artifact manifest, cleanup, and
  explicitly deferred later M7 work.

## Plan requirements covered

- `plan.md` §§2.4, 20.4, 23, 27, 29, and 34 remain the product/release
  boundaries; no plan section was edited.
- D-040 and D-041 remain frozen M6/M7A regression boundaries.
- D-043 records the frozen M7A receipt and bounds M7B to WebKit/native
  accessibility plus measured mobile performance first.
- Remaining later M7 work is explicitly prioritized, not pulled into M7B:
  writing/density, supported-save fixtures/version policy, localization,
  audio, and packaging/distribution decision.

## Verifier findings resolved

- V-100-001 is addressed in `src/test/agentWorkflowRouting.test.ts` and
  `src/test/verifierRound083Workflow.test.ts`; the exact reproduction now
  passes while historical provenance and non-volatile routing checks remain.
- V-098-001 remains resolved by immutable round 099 at accepted candidate
  `d25e80e6781de89e80fc3b3c240a922ada53d978`; the round-099 verifier commit is
  `efaa1890751588abfc6728fab779a44e2650a2db`.
- `.agent/verification/round-100.md` and the catalog remain immutable; fresh
  independent verification of this candidate remains required. This handoff
  does not issue a verdict.

## Frozen M7A external release receipt

- Accepted candidate: `d25e80e6781de89e80fc3b3c240a922ada53d978`.
- Verifier: round 099 report `.agent/verification/round-099.md`, commit
  `efaa1890751588abfc6728fab779a44e2650a2db`.
- Hosted Verify:
  <https://github.com/fabian20ro/goldilocks-engine/actions/runs/32071396270>
  attempt 2 succeeded with all five lanes and aggregate. First attempt
  portrait setup was cancelled after a runner infrastructure stall; only
  cancelled/dependent jobs were rerun.
- `main` was fast-forwarded to the exact candidate. Tag deploy
  <https://github.com/fabian20ro/goldilocks-engine/actions/runs/32072911527>
  built successfully but environment policy disallowed the tag. Successful
  exact-SHA main deploy:
  <https://github.com/fabian20ro/goldilocks-engine/actions/runs/32073014870>.
- Live: <https://fabian20ro.github.io/goldilocks-engine/>.
- Live/local `build-info.json`: version `dc97ee41f6dbbc0e29d2`, scope
  `/goldilocks-engine/`, matching service-worker ID. Live 320×693 smoke clean;
  zero console errors.

## Setup, startup, and verification commands

Use ignored repository-local caches; no user-home/global cache or browser is
required:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

Focused routing/catalog/static checks for this candidate:

```sh
./scripts/agent-status
npx vitest run --coverage=false src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts
npm run validate:verification-catalog
npm run format:check
npm run lint -- --quiet
npm run typecheck
git diff --check
```

Canonical full gate (run once after the executable routing-test repair):

```sh
INSTALL_PLAYWRIGHT=0 \
  npm_config_cache="$PWD/.cache/npm" \
  PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
  ./scripts/verify
```

The next candidate must add and document these WebKit commands, then invoke
the lane from `./scripts/verify`:

```sh
npx playwright install webkit
npm run test:e2e:webkit
```

Native evidence uses deterministic loopback plus explicit teardown, following
the existing patterns: `xcrun simctl` for iOS Simulator and `adb`/`adb reverse`
for an unlocked USB Android. Bulky traces/screenshots/device logs stay in
ignored `.cache/` or CI artifacts; commit a compact summary with candidate
SHA, device/browser identity, settings, viewport, samples, thresholds,
result, and raw-artifact paths/checksums.

## Important architectural decisions

- M7B is evidence-first: normal WebKit/native portrait behavior, 320×693
  200%-text/reduced-motion boundary behavior, and clean-install/reload/offline
  plus repeated 1×/64× Worker lifecycle behavior are the Rule of Three.
- Performance gates are LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.10, five cold runs
  per device/browser, and ≤120% of the frozen-build same-device baseline for
  startup, Worker CPU, memory, and offline startup; physical battery/thermal
  evidence is required for that sub-gate.
- Missing iOS Simulator, unlocked USB Android, physical thermal measurement,
  or browser launch/install is BLOCKED for its affected gate. Chromium, an
  in-app browser, an AX tree, or simulator-only thermal data cannot silently
  substitute for native/device evidence.

## Known limitations and risks

- This candidate only repairs routing-test expectations; no WebKit lane, native
  screen-reader session, or mobile-performance collector exists yet. The next
  Implementer must create those executable artifacts before claiming evidence.
- Managed macOS browser sandbox policy may require scoped host authority,
  as recorded by prior verifier rounds.
- The canonical run reached root-browser-pwa but stopped when Chromium failed
  to launch under the managed macOS policy. The evidence log records
  `bootstrap_check_in ... Permission denied (1100)`; pages-offline was not
  reached. This is an infrastructure limitation to preserve for independent
  verification, not a source-test result.
- Writing/density, save fixture/support policy, localization readiness, audio,
  and packaging/distribution remain later M7 work. Startup/workforce/
  government/remote content, new destinations, telemetry, native wrappers,
  and broad architecture rewrites remain out of scope.

## Checks not run / final evidence

- `npx vitest run --coverage=false src/test/agentWorkflowRouting.test.ts
src/test/verifierRound083Workflow.test.ts` passed: 2 files, 9 tests.
- `npm run validate:verification-catalog`, `npm run format:check`,
  `npm run lint -- --quiet`, `npm run typecheck`, and `git diff --check` passed.
- The single `./scripts/verify` run passed catalog/setup/format/lint/typecheck,
  unit (66 files, 308 tests), balance, build, and production audit; it stopped
  at root-browser-pwa on the Chromium launch policy error above. It was not
  rerun; pages-offline, WebKit, native-device, and performance lanes therefore
  remain unverified.
- `./scripts/run`, WebKit installation, native-device checks, and performance
  collection were not run for the same reason and remain explicit M7B work.
- A fresh independent Verifier must inspect this exact candidate SHA.
