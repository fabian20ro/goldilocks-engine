# Candidate handoff — Milestone 7B OIV-first routing

## Implemented behavior summary

- Updated mutable routing and acceptance docs from the completed M7A
  navigation/workflow slice to the bounded M7B OIV-first slice.
- Recorded the supplied exact-SHA hosted/deployment receipt without changing
  product code, `plan.md`, or an immutable verifier report.
- Added machine-checked catalog routes for pinned WebKit, native
  VoiceOver/TalkBack, measured mobile performance, and artifact/blocker
  honesty while retaining M7A navigation/PWA requirements.
- Defined the device/browser matrix, measurable budgets, Rule of Three,
  repository-local cache/startup contract, artifact manifest, cleanup, and
  explicit deferred M7 work in `.agent/RELEASE_ACCEPTANCE.md`.

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

- No new finding was introduced by this documentation-only candidate.
- V-098-001 remains resolved by immutable round 099 at accepted candidate
  `d25e80e6781de89e80fc3b3c240a922ada53d978`; the round-099 verifier commit is
  `efaa1890751588abfc6728fab779a44e2650a2db`.
- Independent verification of this candidate's routing/docs delta remains
  required; this handoff does not issue a verdict.

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

Focused docs/catalog checks for this candidate:

```sh
./scripts/agent-status
npm run validate:verification-catalog
npm run format:check
npm run lint -- --quiet
npm run typecheck
git diff --check
```

Canonical full gate for the next executable M7B candidate:

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

- This candidate is routing/docs-only; no WebKit lane, native screen-reader
  session, or mobile-performance collector exists yet. The next Implementer
  must create those executable artifacts before claiming evidence.
- Managed macOS browser sandbox policy may require scoped host authority,
  as recorded by prior verifier rounds.
- Writing/density, save fixture/support policy, localization readiness, audio,
  and packaging/distribution remain later M7 work. Startup/workforce/
  government/remote content, new destinations, telemetry, native wrappers,
  and broad architecture rewrites remain out of scope.

## Checks not run / final evidence

- `./scripts/verify` was not run: this candidate changes only mutable Markdown
  routing/docs and JSON catalog metadata; no executable product or verification
  tooling changed, so a canonical product gate would add no scoped evidence.
- `./scripts/run`, WebKit installation, native-device checks, and performance
  collection were not run for the same reason and remain explicit M7B work.
- Run and record the focused catalog/static checks above after all edits; a
  fresh independent Verifier must inspect this exact candidate SHA.
