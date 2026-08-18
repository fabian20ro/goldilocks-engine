# Candidate handoff — Milestone 7B verifier repair

Implementation commit: `70d2315e674bf27eda646a755ef394faab192de6`. The final
candidate also includes this handoff-only follow-up commit. Implementation
started from verifier commit
`ea80ade71a0fc45088218aae31b79a560e5d0fd7`.

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
- Updated `scripts/collect-mobile-performance.mjs`: five cold runs per pinned
  browser/portrait cell, PerformanceObserver LCP/INP/CLS, startup/transfer/
  memory/offline samples, test-only shipped Dedicated Worker 1×/64×
  request/response attribution plus memory, p95/median, same-invocation
  authenticated frozen-baseline ratios, physical adb battery/thermal/memory,
  and optional Android Chrome CDP lane using adb reverse/forward. INP is
  populated only from Event Timing evidence; missing evidence is BLOCKED.
- Reworked `scripts/capture-frozen-baseline.mjs` into an internal accepted-Git
  capture child. It archives/builds/serves the accepted app bytes, verifies the
  live build-info object/tree/build identity, then invokes the current
  collector through an absolute path in capture-only target-URL mode. A
  parent-generated nonce authenticates its direct stdout envelope; accepted
  object/tree/build/device/browser/settings and all artifact digests are
  revalidated before a digest-addressed output copy is retained. Persisted or
  caller-supplied receipts have no comparison path, and capture-only mode
  cannot recurse into baseline capture.
- WebKit and performance retain every raw pageerror and console event with
  operation-window, URL, location, type, message, and timestamp provenance.
  Only one exact known WebKit console event inside the explicit offline reload
  window may correlate with the separately caught structured
  `{source, operation, targetUrl, pageUrl, errorType, message}` navigation
  error, and only with exact URL/location/type/message and cardinality checks.
  The raw events and correlated pair are both retained; all uncorrelated or
  additional events fail the zero-error gate.
- Reworked `scripts/webkit-result-classifier.mjs`: any structured unexpected,
  failed, timed-out, interrupted, or flaky test is FAILED regardless of marker;
  structured infrastructure BLOCKED is possible only after successful tests;
  only narrowly recognized pre-report process launch errors may BLOCK.
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
- Round-103 findings V-103-001 through V-103-003 are addressed by the stricter
  same-invocation channel, exact native dimensions, and structured WebKit
  classification.
- Round-104 findings V-104-001 through V-104-003 are addressed: persisted
  baseline receipts are disabled as trust roots, marker collisions cannot mask
  structured failures, and wall-clock interaction duration cannot become INP.
- Round-105 findings V-105-001 and V-105-002 are addressed: accepted app bytes
  are served while the current collector measures through a nonce-bound
  capture-only channel, and marker-containing page/console errors are never
  filtered or relabeled as infrastructure.
- Native capture blocker output now names the consumed absolute
  `operator-submission.json` and exact
  `M7B_NATIVE_EVIDENCE_DIR=... npm run test:native-a11y:validate` command;
  generated `checklist.json` is explicitly supporting output. Validation
  reruns refuse to overwrite retained output.
- The exact round-102, round-103, round-104, round-105, and round-106
  adversarial probes returned no findings.
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
node .agent/verification/round-104-adversarial.mjs
node .agent/verification/round-105-adversarial.mjs
node .agent/verification/round-106-adversarial.mjs
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
  concrete `BLOCKED` finding only when its exact console/navigation pair is
  authenticated inside the offline operation window. Every other page/console
  error remains uncorrelated and fails the lane, including errors whose text
  contains an infrastructure marker or occurs outside that window.
- Renderer-wide timing is not treated as Worker attribution. The collector
  instruments the shipped Dedicated Worker only in the test page, records
  request/response evidence at 1×/64×, and returns BLOCKED if that attribution
  is absent.
- Baseline comparison accepts only a fresh nonce-authenticated capture from the
  exact frozen D-043 Git object/build, with re-derived tree, explicit
  same-device identity, matching browser matrix/settings, valid per-cell
  identity, and retained `{path,sha256}` artifacts. Self/current/unrelated,
  caller-supplied, and persisted input is BLOCKED or ignored as output-only.
- Native operator evidence is retained in an isolated capture directory and
  validates only exact dimensions and checksummed paths; reruns refuse to
  overwrite submitted evidence.
- Android Chrome uses `adb reverse` for deterministic loopback and
  `adb forward ... localabstract:chrome_devtools_remote` for Playwright CDP;
  force-stop/reopen separates cold runs and teardown removes both tunnels.
- Missing native infrastructure, manual speech/viewport evidence, frozen
  baseline, or physical device never becomes a silent substitute/pass.

## Known limitations and risks

- Focused environment evidence is infrastructure-blocked: CoreSimulatorService
  is unavailable in this session, the attached Pixel 6a is locked, pinned
  Chromium/WebKit launches are blocked by the macOS Mach-port sandbox, and no
  frozen accepted-build baseline artifact is retained. These remain explicit
  blockers, not claims of closure.
- The current WebKit build reports `WebKit encountered an internal error` on
  offline top-level reload; cached-shell/controller proof succeeds and the
  exact error is retained as a BLOCKED infrastructure finding.
- Native VoiceOver/TalkBack speech and actual CSS viewport require an operator
  session; AX/UIAutomator artifacts are supporting evidence only.
- The managed macOS browser sandbox may require scoped host authority for
  pinned browser launch. No chrome-devtools MCP or global cache is used.
- The pinned accepted object lacks the M7B collector source; the fresh baseline
  child serves that object and runs the current collector, but remains
  explicitly `BLOCKED` when physical/browser evidence is unavailable.
  Canonical output must not claim PASS.
- Deferred M7 work remains out of scope: writing/density, save fixtures and
  support policy, localization, audio, packaging/distribution, telemetry,
  startup/workforce/government/remote content, native wrappers, and new game
  systems.

## Checks / final evidence

- Passed: focused evidence test without coverage, format, lint, typecheck,
  syntax checks, `git diff --check`, classifier valid/infra/no-test/launch
  checks, the exact round-102/103/104/105/106 adversarial probes, and a wrong
  capture-only target probe that returned `BLOCKED` before collecting cells.
  Native capture/validation proved the exact operator-submission command and
  refused a validation overwrite on rerun. Focused performance returned
  `BLOCKED` with Chromium Mach-port, locked-device, and baseline-capture
  findings; focused WebKit returned `FAILED` from structured browser-launch
  test failures (not masked as infrastructure).
- Focused evidence remains available in ignored `.cache/m7b/` directories.
  The final canonical retained evidence is
  `.cache/verification/round-107-final/`; its root-browser log records the
  managed Chromium Mach-port launch blocker above, and later M7B lanes were
  not silently treated as passed.
- Final canonical command:
  `VERIFY_EVIDENCE_DIR=.cache/verification/round-107-final ./scripts/verify`.
  Catalog, setup, format, lint, typecheck, 67-file/312-test unit suite, all
  balance lanes, build, and production audit passed. Root-browser Playwright
  stopped at 0/238 because the managed browser sandbox denied Chromium's
  `bootstrap_check_in` Mach-port rendezvous (`Permission denied (1100)`), so
  Pages/WebKit/native/performance gates did not run. Exit was 1 with
  `root-browser-pwa=failed`; this is an infrastructure blocker, not a product
  PASS claim.
- To close remaining infrastructure gates, run the canonical lane with an
  available pinned browser, iOS VoiceOver operator session, unlocked/authorized
  Pixel TalkBack session, and the accepted build containing its collector on
  the same physical device. Do not provide a baseline JSON file; the collector
  must capture it through its nonce-bound child channel.
- Fresh independent verification must inspect this exact committed SHA and
  independently rerun applicable canonical and native/operator evidence.
