# Candidate handoff — Milestone 7B OIV-first evidence tooling

Candidate SHA: see the exact commit returned by the Implementer; the metadata
was finalized after the initial semantic commit. The implementation started
from accepted verifier HEAD
`756bf2631cdec61ac9aaac02d9915cd1de61e148`.

## Implemented behavior summary

- Added repository-pinned Playwright WebKit lane
  (`playwright.webkit.config.ts`, `tests/e2e/m7b-webkit.spec.ts`) with managed
  loopback startup, 393×742 and 320×693 portrait contexts, reduced motion,
  200% text, zero document overflow, 44px targets, stable eight-destination
  order, keyboard Enter, touch activation, persistence/reload, malformed-save
  recovery, offline cache proof, and explicit WebKit offline-error annotation.
- Added `scripts/native-accessibility.mjs`: xcrun simctl and adb/adb reverse
  setup, device identity, accessibility settings capture/optional enable and
  restore, screenshots/logs/UI hierarchy, speech placeholders, checklist rows,
  actual-viewport/manual evidence fields, artifact SHA-256 records, cleanup,
  and honest BLOCKED exit behavior.
- Added `scripts/collect-mobile-performance.mjs`: five cold runs per pinned
  browser/portrait cell, PerformanceObserver LCP/INP/CLS, startup/transfer/
  memory/offline samples, 1×/64× Worker-cost proxy plus memory, p95/median,
  frozen-build baseline ratio checks, physical adb battery/thermal/memory,
  and optional five-run Android Chrome CDP lane using adb reverse/forward.
- Integrated setup, package-manager commands, and all three M7B lanes into
  `./scripts/verify`; bulky evidence remains ignored under `.cache/`.
- Added focused contract tests and M7B setup/evidence documentation. No
  product behavior, telemetry, native wrapper, dependency, plan, decision,
  scope, catalog, or immutable report was changed.

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
  same-device baseline ratio ≤1.20, and physical battery/thermal gate.

## Verifier findings resolved

- Prior routing findings V-100-001 and V-098-001 remain resolved by the
  immutable accepted history; no immutable report was edited.
- This candidate resolves the previously open M7B implementation/tooling
  scope by adding executable WebKit/native/performance lanes. Native speech,
  actual CSS viewport, frozen baseline, and unlocked physical Android are
  evidence gates, not claims made by this handoff.
- No new stable verifier finding was created by focused checks. Independent
  verification remains required and this handoff issues no verdict.

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
npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts
node --check scripts/native-accessibility.mjs
node --check scripts/collect-mobile-performance.mjs
git diff --check
E2E_WEBKIT_PORT=43133 npm run test:e2e:webkit
M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_PORT=43132 npm run test:native-a11y
M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_RUNS=5 \
  M7B_PERFORMANCE_PORT=43134 npm run collect:mobile-performance
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

Use `.cache/m7b/native/summary.json` and
`.cache/m7b/performance/summary.json` plus their listed ignored artifacts.

## Important architectural decisions

- Evidence-only implementation: existing application seams are exercised;
  no product redesign or speculative abstraction was introduced.
- WebKit's known offline top-level navigation error is preserved as a
  concrete `BLOCKED` finding while service-worker/controller/cache proof is
  retained. Other page/console errors fail the lane.
- Dedicated Worker CPU attribution is not exposed by browser CDP, so the
  collector labels `Performance.TaskDuration` as a Worker-cost proxy and
  records the limitation; the shipped 1×/64× controls are exercised.
- Android Chrome uses `adb reverse` for deterministic loopback and
  `adb forward ... localabstract:chrome_devtools_remote` for Playwright CDP;
  force-stop/reopen separates cold runs and teardown removes both tunnels.
- Missing native infrastructure, manual speech/viewport evidence, frozen
  baseline, or physical device never becomes a silent substitute/pass.

## Known limitations and risks

- Focused environment evidence is infrastructure-blocked: CoreSimulatorService
  is unavailable; the attached Pixel 6a is locked. The collector also has no
  frozen accepted-build baseline artifact. These are retained in summaries and
  are not claimed as closed gates.
- The current WebKit build reports `WebKit encountered an internal error` on
  offline top-level reload; cached-shell/controller proof succeeds and the
  exact error is retained as a BLOCKED infrastructure finding.
- Native VoiceOver/TalkBack speech and actual CSS viewport require an operator
  session; AX/UIAutomator artifacts are supporting evidence only.
- The managed macOS browser sandbox may require scoped host authority for
  pinned browser launch. No chrome-devtools MCP or global cache is used.
- Deferred M7 work remains out of scope: writing/density, save fixtures and
  support policy, localization, audio, packaging/distribution, telemetry,
  startup/workforce/government/remote content, native wrappers, and new game
  systems.

## Checks not run / final evidence

- Focused format, lint, typecheck, M7B contract tests, syntax, and diff checks
  passed.
- WebKit host-authority lane passed 2/2 (393×742 and 320×693). Its normal,
  boundary, reduced-motion, 200%-text, keyboard/touch, reload/offline/cache,
  persistence, and recovery assertions executed.
- Native harness returned BLOCKED with exact xcrun CoreSimulatorService error,
  locked Android policy evidence, and missing manual speech/viewport evidence;
  settings/reverse cleanup completed.
- Performance collector completed Chromium 320/393 five-run cells and
  Chromium+WebKit 320/393 five-run cells. Chromium p95s observed: LCP 176ms
  (320) / 88ms (393), INP 56ms / 56ms, CLS 0; Worker TaskDuration proxy p95
  10.37ms/9.744ms at 1× and 10.061ms/10.467ms at 64×. WebKit offline
  navigation errors are retained as BLOCKED with cache proof. Android
  five-run lane and physical battery/thermal closure are BLOCKED by the
  locked device; frozen-baseline comparison is BLOCKED by missing input.
- Fresh independent verification must inspect this exact committed SHA and
  independently rerun applicable canonical and native/operator evidence.
