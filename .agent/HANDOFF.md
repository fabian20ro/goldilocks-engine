# Candidate handoff — Milestone 7B verifier repair

Candidate SHA: see the exact full SHA returned with this handoff. Implementation
started from verifier commit
`6253de2f0a8e7e0aabd2a6a879eb27f7fc49bf8c`.

## Implemented behavior summary

- Added repository-pinned Playwright WebKit lane
  (`playwright.webkit.config.ts`, `tests/e2e/m7b-webkit.spec.ts`) with managed
  loopback startup, 393×742 and 320×693 portrait contexts, reduced motion,
  200% text, zero document overflow, 44px targets, stable eight-destination
  order, keyboard Enter, touch activation, persistence/reload, malformed-save
  recovery, offline cache proof, and explicit WebKit offline-error annotation.
- Added `scripts/native-accessibility.mjs`: xcrun simctl and adb/adb reverse
  setup, device identity, accessibility settings capture/optional enable and
  restore, screenshots/logs/UI hierarchy, retained operator submission and
  validation, complete checklist rows, actual-viewport/manual evidence fields,
  `{path,sha256}` artifact records, cleanup, and honest BLOCKED exit behavior.
- Added `scripts/collect-mobile-performance.mjs`: five cold runs per pinned
  browser/portrait cell, PerformanceObserver LCP/INP/CLS, startup/transfer/
  memory/offline samples, test-only shipped Dedicated Worker 1×/64×
  request/response attribution plus memory, p95/median, authenticated frozen
  baseline ratios, physical adb battery/thermal/memory, and optional Android
  Chrome CDP lane using adb reverse/forward.
- Added `scripts/capture-frozen-baseline.mjs` to recreate the accepted SHA in a
  temporary detached worktree with repository-local npm/browser caches.
- Integrated summary parsing into `./scripts/verify`; PASS, BLOCKED, and
  FAILED remain distinct, and any blocked M7B lane makes canonical verification
  return nonzero. Bulky evidence remains ignored under `.cache/`.
- Added focused contract tests and M7B setup/evidence documentation. No
  product behavior, telemetry, native wrapper, broad dependency, plan,
  decision, scope, catalog, or immutable report was changed.

## Plan requirements covered

- D-043 and `.agent/RELEASE_ACCEPTANCE.md` M7B WebKit, native accessibility,
  measured performance, Rule-of-Three, local-cache, deterministic loopback,
  and BLOCKED-infrastructure requirements.
- WebKit and performance commands are package-manager scripts and are invoked
  by the canonical verifier after the existing static/build lanes.
- Native artifacts record build SHA, device/OS/browser identity, settings,
  expected and manually recorded CSS viewport, text scale, reduced motion,
  every eight-tab checklist row, screenshots/logs/speech evidence fields, and
  SHA-256 paths; absent speech/viewport/device access remains BLOCKED.
- Performance summary records absolute LCP ≤2500ms, INP ≤200ms, CLS ≤0.10,
  five-run count, startup/offline/Worker/memory/transfer values, p95/median,
  same-device baseline ratio ≤1.20, authenticated baseline metadata/artifact
  checksums, and physical battery/thermal gate.

## Verifier findings resolved

- Prior routing findings V-100-001 and V-098-001 remain resolved by the
  immutable accepted history; no immutable report was edited.
- Round-102 findings V-102-001 through V-102-006 are addressed in executable
  tooling and retained evidence contracts. Native speech, actual CSS viewport,
  frozen baseline, and unlocked physical Android remain evidence gates, not
  claims made by this handoff.
- The exact round-102 adversarial probe returned no findings. Independent
  verification remains required; this handoff issues no verdict.

## Setup, startup, and verification commands

All browser/npm caches are repository-local and ignored:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

Focused checks run during implementation:

```sh
./scripts/agent-status
npm run format:check
npm run lint -- --quiet
npm run typecheck
npx vitest run src/test/m7bEvidenceTooling.test.ts \
  src/test/verifierRound083Workflow.test.ts --pool=forks --maxWorkers=1
node .agent/verification/round-102-adversarial.mjs
node --check scripts/native-accessibility.mjs
node --check scripts/collect-mobile-performance.mjs
node --check scripts/capture-frozen-baseline.mjs
git diff --check
M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/focused \
  npm run test:native-a11y
M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium \
  M7B_PERFORMANCE_RUNS=5 M7B_PERFORMANCE_DEVICE_ID=focused-local \
  M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/performance/focused-worker \
  npm run collect:mobile-performance
```

The final canonical command is run once after the final candidate commit:

```sh
./scripts/verify
```

Native operator session, with before snapshots retained and restored:

```sh
M7B_NATIVE_ENABLE_SETTINGS=1 M7B_NATIVE_ALLOW_BLOCKED=1 \
  npm run test:native-a11y
```

Use the unique `.cache/m7b/native/<capture-id>/summary.json` and
`.cache/m7b/performance/<run-id>/summary.json` plus their listed ignored
artifacts. The native validator writes only
`<capture-id>/validation-summary.json` and refuses to overwrite it.

## Important architectural decisions

- Evidence-only implementation: existing application seams are exercised;
  no product redesign or speculative abstraction was introduced.
- WebKit's known offline top-level navigation error is preserved as a
  concrete `BLOCKED` finding while service-worker/controller/cache proof is
  retained. Other page/console errors fail the lane.
- Renderer-wide timing is not treated as Worker attribution. The collector
  instruments the shipped Dedicated Worker only in the test page, records
  request/response evidence at 1×/64×, and returns BLOCKED if that attribution
  is absent.
- Baseline comparison accepts only the frozen D-043 candidate/build identity,
  explicit same-device identity, matching browser matrix, matching settings
  fingerprint, and matching per-cell identity. Self/current/unrelated input
  is BLOCKED.
- Android Chrome uses `adb reverse` for deterministic loopback and
  `adb forward ... localabstract:chrome_devtools_remote` for Playwright CDP;
  force-stop/reopen separates cold runs and teardown removes both tunnels.
- Missing native infrastructure, manual speech/viewport evidence, frozen
  baseline, or physical device never becomes a silent substitute/pass.

## Known limitations and risks

- Focused environment evidence is infrastructure-blocked: CoreSimulatorService
  is unavailable; the attached Pixel 6a is locked; pinned Chromium launch is
  blocked by the managed host's Mach-port permission. The collector also has no
  frozen accepted-build baseline artifact. These are retained in summaries and
  are not claimed as closed gates.
- The current WebKit build reports `WebKit encountered an internal error` on
  offline top-level reload; cached-shell/controller proof succeeds and the
  exact error is retained as a BLOCKED infrastructure finding.
- Native VoiceOver/TalkBack speech and actual CSS viewport require an operator
  session; AX/UIAutomator artifacts are supporting evidence only.
- The managed macOS browser sandbox may require scoped host authority for
  pinned browser launch. No chrome-devtools MCP or global cache is used.
- The single final canonical run stopped at the existing root-browser PWA lane
  after one `tests/e2e/verifier-round-042.spec.ts` 393px test timed out waiting
  for a disabled expansion purchase. The exact test passed when rerun alone;
  this is recorded as a suite-order/flaky regression, not silently converted
  to PASS.
- Deferred M7 work remains out of scope: writing/density, save fixtures and
  support policy, localization, audio, packaging/distribution, telemetry,
  startup/workforce/government/remote content, native wrappers, and new game
  systems.

## Checks / final evidence

- Passed: `npx vitest run src/test/m7bEvidenceTooling.test.ts
src/test/verifierRound083Workflow.test.ts --pool=forks --maxWorkers=1`,
  `node .agent/verification/round-102-adversarial.mjs`, syntax checks for all
  changed JavaScript, and `git diff --check`.
- Native focused capture returned BLOCKED with the exact xcrun
  CoreSimulatorService error, locked Android policy evidence, and missing
  manual speech/viewport evidence. Settings/reverse cleanup ran; capture and
  submission artifact manifests contained only `{path,sha256}` entries. The
  retained validator refuses a second validation write.
- Chromium-only five-run performance focus returned BLOCKED before cells due
  the managed host's Chromium Mach-port permission; adb battery/thermal also
  remained BLOCKED because the attached Pixel 6a is locked; baseline input was
  unavailable. No browser performance values are claimed.
- The focused pinned WebKit wrapper returned `BLOCKED` with retained report and
  stderr artifacts; no WebKit pass is claimed.
- Full `npm run test`, format check, lint, typecheck, and build passed. The
  single final canonical command was
  `VERIFY_EVIDENCE_DIR=.cache/verification/round-103-final ./scripts/verify`
  under scoped host authority. Catalog, setup, format, lint, typecheck, 311
  unit tests, all balance lanes, build, and production audit passed. It
  stopped at `root-browser-pwa` with exit 1 after 237/238 browser tests
  passed; the focused rerun of the timed-out 393px test passed. Because
  canonical stopped before M7B, the focused WebKit/native/performance results
  above are the retained M7B evidence for this candidate; no M7B PASS is
  claimed. If infrastructure remains unavailable, the next canonical run must
  return nonzero/BLOCKED and the operator must provide an available
  CoreSimulator, unlocked authorized Android, and an explicit same-device
  frozen baseline capture.
- Fresh independent verification must inspect this exact committed SHA and
  independently rerun applicable canonical and native/operator evidence.
