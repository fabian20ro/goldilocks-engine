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
  temporary detached worktree with repository-local npm/browser caches. The
  collector consumes only its canonical summary plus provenance receipt,
  re-derives the accepted Git tree, and rejects arbitrary baseline paths or
  caller identity overrides.
- Added `scripts/webkit-result-classifier.mjs`: Playwright JSON report status,
  test results, structured annotations, and recognized launch errors determine
  PASS/BLOCKED/FAILED. Human-readable stdout/stderr never classifies a lane;
  assertion failures remain FAILED even beside infrastructure annotations.
- Native validation now requires exact 320×693 and 393×742 dimensions on each
  device record, each declared checklist row, and each actual CSS viewport.
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
- Round-103 findings V-103-001 through V-103-003 are addressed: baseline
  provenance is bound to the repository-owned capture receipt and accepted Git
  tree, native dimensions are exact, and WebKit classification is structured
  and fail-closed.
- The exact round-102 and round-103 adversarial probes returned no findings.
  Independent verification remains required; this handoff issues no verdict.

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
node --check scripts/webkit-result-classifier.mjs
node --check scripts/run-webkit-e2e.mjs
node --input-type=module -e 'import { classifyWebKitReport } from "./scripts/webkit-result-classifier.mjs"; const valid={stats:{unexpected:0,flaky:0},suites:[{specs:[{tests:[{status:"expected",results:[{status:"passed"}]}]}]}]}; const mixed={stats:{unexpected:1,flaky:0},suites:[{specs:[{tests:[{status:"unexpected",annotations:[{type:"infrastructure",description:"offline"}],results:[{status:"failed",error:{message:"assertion"}}]}]}]}]}; if (classifyWebKitReport(valid,0).result!=="PASS" || classifyWebKitReport(mixed,1).result!=="FAILED") process.exit(1)'
node .agent/verification/round-103-adversarial.mjs
git diff --check
M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/focused \
  npm run test:native-a11y
M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium \
  M7B_PERFORMANCE_RUNS=5 M7B_PERFORMANCE_DEVICE_ID=focused-local \
  M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/performance/focused-worker \
  npm run collect:mobile-performance
```

The final canonical command is run once after all executable edits; only
documentation-only handoff bookkeeping follows:

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
  re-derived Git tree, capture receipt/digest, explicit same-device identity,
  matching browser matrix, matching settings fingerprint, and matching
  per-cell identity. Self/current/unrelated/caller-supplied input is BLOCKED.
- Native operator evidence is retained in an isolated capture directory and
  validates only exact dimensions and checksummed paths; reruns refuse to
  overwrite submitted evidence.
- Android Chrome uses `adb reverse` for deterministic loopback and
  `adb forward ... localabstract:chrome_devtools_remote` for Playwright CDP;
  force-stop/reopen separates cold runs and teardown removes both tunnels.
- Missing native infrastructure, manual speech/viewport evidence, frozen
  baseline, or physical device never becomes a silent substitute/pass.

## Known limitations and risks

- Focused environment evidence is infrastructure-blocked: an iOS simulator is
  available but still needs an operator VoiceOver speech/actual-viewport
  session; the attached Pixel 6a is locked; and no frozen accepted-build
  baseline artifact is retained. These remain explicit blockers, not claims of
  closure.
- The current WebKit build reports `WebKit encountered an internal error` on
  offline top-level reload; cached-shell/controller proof succeeds and the
  exact error is retained as a BLOCKED infrastructure finding.
- Native VoiceOver/TalkBack speech and actual CSS viewport require an operator
  session; AX/UIAutomator artifacts are supporting evidence only.
- The managed macOS browser sandbox may require scoped host authority for
  pinned browser launch. No chrome-devtools MCP or global cache is used.
- The canonical run reached every lane: root browser 238/238 passed, Pages
  2/2 passed, WebKit 2/2 passed with structured offline `BLOCKED` annotations,
  native capture was `BLOCKED`, and mobile performance collected five runs for
  every Chromium/WebKit 320/393 cell but remained `BLOCKED` for physical
  Android and the frozen baseline. Canonical exit was 2 with
  `verification=blocked`.
- Deferred M7 work remains out of scope: writing/density, save fixtures and
  support policy, localization, audio, packaging/distribution, telemetry,
  startup/workforce/government/remote content, native wrappers, and new game
  systems.

## Checks / final evidence

- Passed: full `npm run test` (67 files/312 tests), focused evidence tests,
  format, lint, typecheck, build, catalog, both round-102/103 adversarial
  probes, classifier valid/mixed/lifecycle checks, syntax checks, and
  `git diff --check`.
- Fresh WebKit evidence is retained at
  `.cache/m7b/webkit/round-104-focused/`: both widths executed and the
  structured report classified the known offline reload as `BLOCKED`.
- Fresh native evidence is retained at `.cache/m7b/native/round-104-focused/`:
  iOS identity was captured, but VoiceOver speech/actual viewport require the
  operator; Pixel 6a policy proves locked/non-interactive and TalkBack remains
  `BLOCKED`. All retained entries are `{path,sha256}`.
- Fresh performance evidence is retained at
  `.cache/m7b/performance/round-104-focused/` and the canonical evidence
  directory: Chromium/WebKit 320/393 cells each contain five samples. Physical
  battery/thermal/Android Chrome and same-device frozen baseline are explicit
  `BLOCKED` gates; no baseline comparison is claimed.
- The one final canonical command was
  `VERIFY_EVIDENCE_DIR=.cache/verification/round-104-final ./scripts/verify`
  under scoped host authority. Catalog, setup, format, lint, typecheck, 312
  unit tests, all balance lanes, build, production audit, root browser 238/238,
  and Pages 2/2 passed. WebKit, native, and mobile-performance summaries were
  parsed as `BLOCKED`; the command exited 2 and never printed a false
  `Verification passed`.
- To close remaining infrastructure gates, run a manual Safari/VoiceOver
  session on the captured iOS simulator, unlock and authorize Pixel 6a then
  record TalkBack/actual CSS viewports, and capture the accepted build on that
  same physical device with
  `M7B_PERFORMANCE_DEVICE_ID=<device> npm run capture:frozen-baseline`.
- Fresh independent verification must inspect this exact committed SHA and
  independently rerun applicable canonical and native/operator evidence.
