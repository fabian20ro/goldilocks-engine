# Verification round 106 — M7B release-evidence verification

Candidate SHA: `5ae3c740c9d4852ba9e3ea8f003d81aed5a4b1de`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate. Before any verifier-authored write,
`git rev-parse HEAD` returned the supplied SHA and the worktree was clean.
The candidate changes evidence tooling, tests, configuration, and documentation
only; no product implementation source was changed.

This was the required full M7B/release/archive route. Read in order:
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, catalog, immutable archive, retained probes, and every
source named by those records. Routing maps, handoff text, implementation tests,
comments, and claimed results were treated as untrusted navigation.

Independent checklist:

- exact candidate identity, clean setup/startup, pinned local dependencies,
  process cleanup, canonical aggregate behavior, and release-matrix honesty;
- retained eight-destination navigation, persistence, malformed recovery,
  accounting, PWA, offline, security, startup/install, and user-visible
  regressions;
- pinned WebKit at 393x742 and 320x693 with reduced motion, 200% text,
  geometry, touch/keyboard, reload/offline, malformed state, and unfiltered
  page/console error handling;
- native VoiceOver/TalkBack identity, settings, exact viewports, speech,
  operator submission, checksums, and cleanup;
- five-run Chromium/WebKit performance cells, LCP/INP/CLS, startup, memory,
  Worker 1x/64x evidence, offline startup, physical battery/thermal, and
  authenticated frozen same-device provenance;
- target/build/nonce/recursion boundaries; current collector against frozen
  accepted bytes; retained V-102 through V-105 probes; proportionality; and
  the normal/boundary/lifecycle Rule of Three.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browsers used ignored
  repository-local `.cache/npm` and `.cache/ms-playwright`.
- Pinned WebKit launched with scoped host authority. The managed sandbox also
  attempted the lane and aborted WebKit before test execution (`Abort trap: 6`);
  this was recorded as infrastructure evidence, not substituted with another
  browser.
- CoreSimulatorService was unavailable for operator speech/viewport evidence.
  Pixel 6a serial `25121JEGR11385` was attached but locked/non-interactive
  (`showing=true`, `inputRestricted=true`, screen off).
- Host browser servers, WebKit, native harness, performance collector, child
  capture, and focused probe processes were cleaned up. Bulky evidence remains
  under ignored `.cache/` paths.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short --branch` | PASS. Exact supplied SHA matched; initial worktree was clean. |
| `./scripts/agent-status` | PASS. Live metadata parsed cleanly; round 105 was the latest immutable FAIL before this report. |
| Complete plan, decisions, release matrix, handoff, catalog, archive, retained-probe, source, and test read route | PASS. Full route completed for explicit broad M7B/release verification. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `npm run validate:verification-catalog` | PASS. Catalog before this report: 105 reports, 111 findings, 8 active requirements. |
| `npx vitest run src/test/m7bEvidenceTooling.test.ts src/test/verifierRound083Workflow.test.ts src/test/agentWorkflowRouting.test.ts`; `npm test` | PASS. Focused: 3 files/13 tests. Full: 67 files/312 tests. |
| `npm run build:pages`; `git diff --check` | PASS. Pages production build completed; no whitespace errors. |
| `node .agent/verification/round-102-adversarial.mjs`; round-103; round-104; round-105 | PASS with `findings: []` on this candidate. V-102-001..006, V-103-001..003, V-104-001..003, and V-105-001..002 did not reproduce in their retained probes. |
| `node .agent/verification/round-106-adversarial.mjs` | PASS with `findings: []`. Invalid nonce/device/port/out-of-root inputs reject with status 64; valid child emits nonce-bound accepted SHA/tree/build; accepted tree lacks the collector but absolute current-tool routing works; wrong target build is BLOCKED with zero cells; capture-only emits no recursive envelope; marker collision remains FAILED and raw page/console lists are unfiltered. |
| Host `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=43690 npm run test:e2e -- --workers=1 --reporter=line` | PASS: 238/238 in 3.8 minutes. |
| Host `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=43691 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS: 2/2 in 5.7 seconds. |
| Host `E2E_WEBKIT_PORT=43692 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-106-host npm run test:e2e:webkit` | FAIL. Both 393x742 and 320x693 bodies executed, but each emitted `console: Failed to load resource: WebKit encountered an internal error` during the structured offline `page.reload` blocker; the zero-error assertion failed before the classifier could return BLOCKED. |
| Host `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-106-host npm run test:native-a11y` and `npm run test:native-a11y:validate` | BLOCKED honestly. iOS speech/actual CSS viewport require an operator; Android is locked; validation remains blocked with exact missing evidence/checksum requirements. |
| Host five-run `M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium,webkit M7B_PERFORMANCE_RUNS=5 M7B_PERFORMANCE_DEVICE_ID=25121JEGR11385 M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/performance/round-106-host M7B_PERFORMANCE_PORT=43694 M7B_PERFORMANCE_ANDROID_CDP_PORT=9240 npm run collect:mobile-performance` | Process exit 0 under allow-blocked; summary result FAILED. Chromium 320/393 and WebKit 320/393 each produced five samples; Chromium errors were empty and budgets passed. WebKit recorded the same console errors plus structured offline blockers. Android/physical gates and authenticated baseline were blocked. |
| First `./scripts/verify` attempt before formatting the new verifier probe | Stopped at `format` because the verifier-owned probe needed Prettier; no candidate lane was reached. The probe was formatted and rechecked before the final gate. |
| Final `VERIFY_EVIDENCE_DIR=.cache/verification/round-106-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | Exit 1. Catalog/setup/format/lint/typecheck, 67-file/312-test unit suite, all balance lanes, build, audit, and root browser 238/238 passed. WebKit executed both bodies but returned FAILED on the correlated offline console error, so the aggregate stopped before native/performance; those lanes were independently run above. |

Performance evidence from `.cache/m7b/performance/round-106-host/summary.json`:

| Cell | Runs | LCP p95 | INP p95 | CLS p95 | Worker 1x p95 | Worker 64x p95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Chromium 320x693 | 5 | 144 ms | 56 ms | 0 | 3.0 ms | 4.1 ms | none |
| Chromium 393x742 | 5 | 88 ms | 80 ms | 0 | 0.7 ms | 3.9 ms | none |
| WebKit 320x693 | 5 | 249 ms | 24 ms | 0 | 2.0 ms | 6.0 ms | five correlated offline console errors |
| WebKit 393x742 | 5 | 96 ms | 32 ms | 0 | 4.0 ms | 5.0 ms | five correlated offline console errors |

Worker fields are test-only `postMessage`/`message` round-trip attribution,
not renderer-wide timing. Physical Worker CPU, memory, battery/thermal, and
same-device frozen-baseline deltas remain unverified because the device and
accepted-build baseline gates are unavailable.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: explicit, immutable, contradiction-checked routing | Full archive/catalog route; catalog validator; live status; round-106 boundary probe | Satisfied for routing mechanics. |
| `M7A-NAV-001`: eight stable destinations, bottom-nav-only routing, 44px targets, narrow reveal, active state, no duplicate global routing | Root 238/238, Pages 2/2, retained navigation probes, WebKit bodies at both widths | Satisfied for retained product behavior; cross-engine gate remains open. |
| `M7A-NAV-002`: normal, 320px boundary, text scaling, reduced motion, keyboard/touch, reload/offline | Root/Pages and retained M7A probes; WebKit body executed normal/boundary paths and cache proof | Retained behavior passes; WebKit error gate fails on the blocker seam. |
| `M7A-RELEASE-001` / D-041 release-matrix honesty | Native/performance summaries preserve explicit BLOCKED results; no native or physical substitution | Not releasable through M7B. |
| `M7B-WEBKIT-001`: pinned 393x742/320x693 OIV, zero page/console errors, reload/offline recovery, strict classification | Host 2/2 bodies, traces/report, classifier marker-collision probe, and live console-error evidence | FAIL: V-106-001. Structured offline blocker is not separated from its correlated console event before zero-error classification. |
| `M7B-NATIVE-001`: VoiceOver/TalkBack names, active state, reveal, first action, exact CSS viewport, speech, lifecycle, manifest | Native capture/validator records device identity, settings, exact required rows, checksums, and honest blockers | BLOCKED by unavailable operator/device infrastructure; V-106-002 is a correctable recovery-instruction defect. |
| `M7B-PERF-001`: five cold runs, absolute LCP/INP/CLS, startup, Worker 1x/64x, memory, offline, physical battery/thermal, authenticated frozen baseline | Four five-run browser cells and absolute budgets; Event Timing-only INP; child identity/nonce probe; physical and baseline gates blocked; WebKit page-errors makes collector summary FAILED | FAIL: V-106-001 prevents the known WebKit infrastructure case from becoming a structured BLOCKED baseline result; required physical/baseline evidence is unavailable. |
| `M7B-EVIDENCE-001`: device/browser matrix, Rule of Three, artifact manifest, cleanup, and honest blocker behavior | Candidate/target/build/nonce/recursion probe, retained artifact paths, host cleanup, explicit native/Android blockers, canonical parser source | FAIL: V-106-001; native infrastructure remains an external blocker. |
| Retained deterministic, accounting, balance, persistence, malformed-save, causal, PWA, offline, security, startup/install, and user-visible behavior | Full unit suite 312/312, root 238/238, Pages 2/2, retained independent probes | Satisfied for unchanged retained product scope. |
| Architecture proportionality and implementation boundary | Candidate diff is evidence tooling/tests/docs/config only; local caches and deterministic loopback remain scoped to M7B | Proportional; evidence defects prevent acceptance. |
| D-043 Rule of Three | Normal 393; boundary 320/200%/reduced motion/touch/keyboard; lifecycle reload/offline, repeated Worker runs, malformed recovery, process cleanup, device lock | Exercised where infrastructure allowed; native speech, physical device, and authenticated baseline remain unavailable. |

## Findings

### V-106-001 — Structured WebKit offline blocker is converted into a page-error failure

- Severity: High; blocks acceptance.
- Related requirements: `M7B-WEBKIT-001`, `M7B-PERF-001`, and
  `M7B-EVIDENCE-001`.
- Expected: the known WebKit top-level offline reload limitation may be
  classified as infrastructure only through the captured structured
  `{source:"page.reload", operation:"offline-reload", message}` evidence.
  Its correlated browser console event must retain provenance with that
  operation so the lane returns BLOCKED. A pageerror or console error from
  any other operation, including one containing the same marker text, must
  remain a real zero-error failure.
- Actual: `tests/e2e/m7b-webkit.spec.ts` captures the offline reload exception
  into `offlineNavigationError`, but `captureErrors` retains the console event
  without operation provenance and line 218 asserts `errors` is empty. The
  host run therefore fails both matrix tests with
  `console: Failed to load resource: WebKit encountered an internal error`.
  `scripts/collect-mobile-performance.mjs` likewise retains that event in
  `sample.errors`, adds `page-errors: FAILED`, and separately adds
  `offline-navigation: BLOCKED`. `scripts/webkit-result-classifier.mjs`
  correctly gives the structured test failure precedence, so the wrapper
  returns FAILED rather than the documented infrastructure BLOCKED result.
- Reproduction: with the repository-local browser cache and host authority,
  run `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_WEBKIT_PORT=43692
  M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-106-host
  npm run test:e2e:webkit`; inspect the saved `summary.json` and
  `playwright-report.json`. The performance form is
  `M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium,webkit
  M7B_PERFORMANCE_RUNS=5 ... npm run collect:mobile-performance`.
- Concrete evidence: both WebKit tests executed at 393x742 and 320x693;
  each had the structured offline annotation and the same console error. The
  performance summary contains five errors per WebKit cell and both
  `page-errors` FAILED and `offline-navigation` BLOCKED findings. The
  round-106 boundary probe proves marker-containing assertion reports remain
  FAILED and no broad marker filter remains, so this is a distinct operation-
  provenance/classification gap rather than a regression to V-105-002.
- Blocks PASS: yes.

### V-106-002 — Native blocker instructions name the wrong operator input file

- Severity: Medium; blocks acceptance of a future native evidence submission.
- Related requirement: `M7B-NATIVE-001` and `M7B-EVIDENCE-001`.
- Expected: a native capture blocker must identify the exact artifact consumed
  by the validator, `operator-submission.json`, so an operator can complete
  speech, viewport, settings, checklist, and checksum fields and rerun the
  documented validation command.
- Actual: `scripts/native-accessibility.mjs` emits instructions at lines 951
  and 1194 to edit `checklist.json` after Safari/Chrome sessions. The harness
  actually writes `checklist.json` as generated rows and writes/validates
  `operator-submission.json`; `docs/m7b-native-accessibility.md` correctly
  describes the latter. Following the emitted blocker instruction does not
  provide the validator's submission input and leaves the gate blocked.
- Reproduction: run
  `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-106-host
  npm run test:native-a11y`; inspect the `voiceover-speech` and
  `talkback-speech` blocker `command` strings, then run
  `M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-106-host
  npm run test:native-a11y:validate` and observe that it reads
  `operator-submission.json` and remains BLOCKED.
- Concrete evidence: host capture output named `checklist.json` in both
  recovery instructions; source lines 1374–1389 create both files, while
  validator paths at lines 305 and 720 read `operator-submission.json`.
- Blocks PASS: yes.

## Prior findings and adversarial seam evaluation

- V-105-001 is addressed: `git ls-tree` confirms the frozen accepted tree does
  not contain `scripts/collect-mobile-performance.mjs`; the fresh valid child
  invocation runs the current root collector, emits a nonce-matching envelope,
  and retains accepted candidate/tree/build identity. Its result is BLOCKED
  only for unavailable measurement gates.
- V-105-002 is addressed: neither the WebKit spec nor collector contains the
  old broad marker filter; marker-containing structured assertions remain
  FAILED. V-106-001 is the narrower correlated console-event seam exposed by
  real host execution.
- Target/build/nonce/recursion boundaries are fail-closed in the independent
  probe: malformed nonce/device/ports/evidence root reject before capture;
  wrong capture-only build yields `frozen-target-build` BLOCKED and zero cells;
  capture-only emits no baseline envelope; the valid child uses accepted
  SHA/tree/build and nonce binding.
- V-102-001..006, V-103-001..003, and V-104-001..003 retained probes returned
  no findings on this candidate. Canonical root/Pages regressions and the full
  unit suite remain green.

## Rule-of-Three evidence

- Normal valid state: root/Pages eight-tab behavior; WebKit 393 body; four
  five-run browser cells; valid child identity/nonce; classifier collision;
  and retained product lifecycle probes.
- Closest malformed/adversarial boundary: malformed nonce/device/ports/outside
  evidence, wrong target build, capture-only recursion, accepted-tree missing
  collector, marker-containing assertion, malformed save, and native exact
  viewport/checksum validation.
- Lifecycle/cross-feature neighbor: 320px reveal at 200% text with reduced
  motion and touch/keyboard activation; reload/offline cache and save recovery;
  repeated Worker 1x/64x runs; WebKit console/error interaction; device lock;
  and process cleanup.

## Unverified areas

- Native VoiceOver speech, actual iOS CSS viewport, TalkBack speech, and actual
  Android CSS viewport: operator/device interaction unavailable.
- Physical Android Chrome five-run performance, Worker CPU, memory,
  battery/thermal observation, and an authenticated same-device frozen accepted
  baseline: Pixel remains locked and the WebKit-correlated baseline capture is
  not PASS-eligible.
- WebKit offline top-level reload without the host WebKit internal error; the
  cached shell/controller proof executed, but error classification is defective.
- Hosted exact-SHA aggregation, deployment, live build identity, and post-
  deployment smoke remain release-owner gates.

## Residual risks

Do not release this candidate as M7B-complete. The implementation must add
operation-scoped provenance for the known WebKit offline console event so only
that captured navigation limitation becomes BLOCKED while unrelated errors
remain FAILED. It must correct the native blocker command to name
`operator-submission.json`. Native operator/device evidence, physical resource
evidence, and a genuine same-device frozen baseline must then be rerun.
Retained product behavior is green; the two correctable evidence-tooling
defects and the unavailable required infrastructure prevent acceptance.
