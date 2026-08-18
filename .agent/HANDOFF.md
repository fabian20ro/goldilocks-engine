# Candidate handoff — Milestone 7B verifier repair

Implementation commit: pending Round 108 commit. Implementation started from
verifier commit `55bc0d9833db7a8105cc0315b6c5645f8d115258`.

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
  The canonical marker `WebKit encountered an internal error` is shared by
  the structured navigation error and exact console shape `Failed to load
resource: <marker>`. Only one exact in-window event may correlate, with
  exact URL/location/type/message and cardinality checks; all uncorrelated or
  additional events fail the zero-error gate.
- Reworked `scripts/webkit-result-classifier.mjs` and its runner contract:
  schema-invalid, missing/empty, skipped, unknown, inconsistent, unexpected,
  failed, timed-out, interrupted, or flaky structured results are FAILED;
  every configured portrait matrix test must have a final `passed` result.
  Structured infrastructure BLOCKED is possible only after fully passed
  structured tests; narrowly recognized pre-report process errors may BLOCK.
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
- The exact round-102 through round-107 adversarial probes returned no
  findings after the repair. Focused unit cases cover malformed reports and
  the two-test portrait matrix contract.
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
node .agent/verification/round-107-adversarial.mjs
E2E_WEBKIT_PORT=43812 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/<run-id> \
  npm run test:e2e:webkit
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
  contains an infrastructure marker or occurs outside that window. The real
  host run now records both portraits as fully passed structured tests with
  this exact pair and a BLOCKED lane result.
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
  is unavailable in this session, the attached Pixel 6a is locked, and no
  frozen accepted-build baseline artifact is retained. Scoped host authority
  was required for the pinned WebKit run; its real pair correlation is now
  recorded as structured BLOCKED evidence. These remain explicit blockers, not
  claims of closure.
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

- Passed: focused malformed-report/matrix tests, format, lint, typecheck,
  syntax checks, `git diff --check`, classifier valid/infra/no-test/launch
  checks, and the exact round-102 through round-107 adversarial probes. Native
  capture/validation proved the exact operator-submission command and refused
  a validation overwrite on rerun. Host WebKit executed both portraits and
  returned structured BLOCKED with exact one-event correlation. Physical
  Android, native operator, and authenticated baseline evidence remain
  explicit blockers.
- Focused evidence remains available in ignored `.cache/m7b/` directories.
  The final canonical retained evidence will be recorded below; no M7B gate is
  silently treated as passed.
- Final canonical command:
  `VERIFY_EVIDENCE_DIR=.cache/verification/round-108-final ./scripts/verify`.
  Result and exact blocked/failed gates are recorded after the one final run;
  this handoff issues no verdict.
- To close remaining infrastructure gates, run the canonical lane with an
  available pinned browser, iOS VoiceOver operator session, unlocked/authorized
  Pixel TalkBack session, and the accepted build containing its collector on
  the same physical device. Do not provide a baseline JSON file; the collector
  must capture it through its nonce-bound child channel.
- Fresh independent verification must inspect this exact committed SHA and
  independently rerun applicable canonical and native/operator evidence.
