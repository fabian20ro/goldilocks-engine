# Verification round 105 — M7B release-evidence verification

Candidate SHA: `8f03f1a928e9c1cc097b5aeb5f1f29222d651b1f`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate. Before any verifier-authored write,
`git rev-parse HEAD` returned the supplied SHA and the worktree was clean. The
candidate changes evidence tooling, tests, and documentation only; no product
implementation source was changed.

This was the required full M7B/release/archive route. Read in order:
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, catalog, immutable archive, retained probes, and every
source named by those records. Routing maps, handoff text, implementation
tests, comments, and claimed results were treated as untrusted navigation.

Independent checklist:

- exact candidate identity, clean setup/startup, pinned local dependencies,
  process cleanup, canonical aggregate behavior, and exact release-matrix
  honesty;
- retained eight-destination navigation, persistence, malformed recovery,
  accounting, PWA, offline, security, and error-boundary regressions;
- pinned WebKit at 393x742 and 320x693 with reduced motion, 200% text,
  geometry, touch/keyboard, reload/offline, persistence, malformed state,
  page/console error handling, and strict structured classification;
- native VoiceOver/TalkBack device identity, settings, exact viewports,
  screen-reader evidence, artifact checksums, cleanup, and honest blocking;
- five-run Chromium/WebKit performance cells, LCP/INP/CLS, startup, memory,
  Dedicated Worker 1x/64x evidence, offline startup, physical battery/thermal,
  nonce/IPC trust, and frozen same-device provenance;
- normal valid state, closest malformed/adversarial boundary, and
  lifecycle/cross-feature neighbor for each repeated seam.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browser assets used ignored
  repository-local `.cache/npm` and `.cache/ms-playwright`.
- Scoped host authority was required for pinned browser/device launches after
  the managed macOS Mach-port boundary rejected sandboxed browser processes.
- Available native identities included iOS Simulator
  `Emot-ID iPhone 17 Pro (FE9DEDCB-B1AF-4084-BD56-D267BF75E1A4)` and Pixel 6a
  serial `25121JEGR11385`. The Pixel was locked/non-interactive
  (`showing=true`, `inputRestricted=true`, screen off); native speech and
  actual-device CSS viewport evidence therefore remained unavailable.
- Temporary browser servers, native/performance processes, and focused E2E
  sessions were cleaned up. Evidence remained under ignored `.cache` paths.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short --branch` | PASS. Exact supplied SHA matched; initial worktree was clean. |
| `./scripts/agent-status` | PASS. Live metadata parsed cleanly; round 104 was the latest immutable FAIL before this report. |
| Complete plan, decisions, release matrix, handoff, catalog, archive, retained-probe, source, and test read route | PASS. Full route completed because this is broad M7B/release verification with current and historical evidence-tooling findings. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck` | PASS. |
| `npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts --pool=forks --maxWorkers=1` | PASS: 3 files, 13 tests. |
| `node --check .agent/verification/round-102-adversarial.mjs`; `node --check .agent/verification/round-103-adversarial.mjs`; `node --check .agent/verification/round-104-adversarial.mjs`; `node --check .agent/verification/round-105-adversarial.mjs` | PASS. |
| `node .agent/verification/round-102-adversarial.mjs`; `node .agent/verification/round-103-adversarial.mjs`; `node .agent/verification/round-104-adversarial.mjs` | PASS with `findings: []` for each. Prior V-102/V-103/V-104 probes did not reproduce on this candidate; the new round-105 probes found two separate seams below. |
| Retained round-079/081/082/093/097 engine, browser, navigation, persistence, malformed-recovery, touch/keyboard, 320/393, 200% text, reduced-motion, reload/offline, accounting, and cleanup probes under scoped host authority | PASS where executable; no new findings. |
| `node .agent/verification/round-105-adversarial.mjs` | FAIL with exactly V-105-001 and V-105-002. The probe uses a fresh nonce and temporary evidence directory, proves the accepted tree lacks `scripts/collect-mobile-performance.mjs`, observes child exit 1 with `Cannot find module`, and detects both broad marker filters. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PAGES_PORT=43595 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS: 2/2. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=43590 npm run test:e2e -- --workers=1 --reporter=line` | PASS: 238/238. A prior isolated run had one transient round-042 timeout; the final canonical run passed all 238. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_WEBKIT_PORT=43592 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-105-host npm run test:e2e:webkit` | BLOCKED honestly: 2/2 structured WebKit tests executed at 393x742 and 320x693 with no assertion failures, but offline reload emitted the structured WebKit internal-error blocker. Cached-shell/controller checks still executed. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-105-host M7B_NATIVE_PORT=43593 npm run test:native-a11y` | BLOCKED honestly: iOS speech/actual CSS viewport require an operator session; the Pixel was locked/non-interactive; TalkBack, speech, and physical viewport evidence were unavailable. |
| `M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium,webkit M7B_PERFORMANCE_RUNS=5 M7B_PERFORMANCE_DEVICE_ID=25121JEGR11385 M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/performance/round-105-host M7B_PERFORMANCE_PORT=43594 M7B_PERFORMANCE_ANDROID_CDP_PORT=9239 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run collect:mobile-performance` | BLOCKED honestly: Chromium/WebKit 320/393 each produced five samples and browser budgets stayed within limits; Android Chrome, battery/thermal, WebKit offline navigation, and the authenticated same-device baseline were blocked. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-105-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | Exit 2 after the one final canonical gate. Catalog/setup/format/lint/typecheck, 67 unit files/312 tests, all balance lanes, build, audit, root browser 238/238, and Pages 2/2 passed. WebKit, native, and mobile-performance summaries were parsed as BLOCKED and aggregate verification remained nonzero. No executable artifact changed after this gate. |

The browser/performance evidence included these observed five-run p95 values:

| Cell | LCP | INP | CLS | Worker 1x | Worker 64x |
| --- | ---: | ---: | ---: | ---: | ---: |
| Chromium 320 | 232 ms | 56 ms | 0 | 3.7 ms | 5.2 ms |
| Chromium 393 | 84 ms | 48 ms | 0 | 1.6 ms | 3.6 ms |
| WebKit 320 | 263 ms | 32 ms | 0 | 2 ms | 8 ms |
| WebKit 393 | 103 ms | 24 ms | 0 | 2 ms | 4 ms |

The current Event Timing path records only `PerformanceEventTiming` entries
with a positive `interactionId`; absent Event Timing remains null and becomes a
blocked gate. The Worker evidence is a test-only
`postMessage`/`message` round-trip attribution with request/response records,
not a claim of unobservable per-worker CPU counters.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: explicit, immutable, contradiction-checked routing | Full archive/catalog read; routing tests 13/13; catalog validator; final canonical catalog lane | Satisfied for routing mechanics. |
| `M7A-NAV-001`: eight stable destinations, bottom-nav-only routing, 44px targets, narrow reveal, active state, no duplicate global routing | Final root 238/238; retained navigation and UI probes; both portrait widths | Satisfied for exercised retained product behavior. |
| `M7A-NAV-002`: normal, 320px boundary, text scaling, reduced motion, keyboard/touch, resize, reload/offline | Root, Pages, retained probes, and WebKit bodies cover normal/boundary/lifecycle behavior; WebKit offline is an infrastructure blocker | Retained M7A behavior passes; cross-engine release evidence remains open. |
| `M7A-RELEASE-001` / D-041 release-matrix honesty | Final canonical parser preserves explicit WebKit/native/performance BLOCKED results and exits 2; no Chromium substitution | Not releasable through M7B. |
| `M7B-WEBKIT-001`: pinned WebKit 393x742/320x693 OIV matrix, zero page/console errors, reload/offline recovery, strict structured classification | Actual 2/2 body execution and structured classifier probe; marker-collision classifier now remains FAILED, but pre-classifier marker filters can discard matching page/console errors; actual offline reload is infrastructure-blocked | FAIL: V-105-002 blocks the zero-error boundary. |
| `M7B-NATIVE-001`: VoiceOver/TalkBack names, active state, reveal, first action, exact CSS viewport, speech, lifecycle, manifest | Native harness validates exact matrix, identities, settings, checksums, submission schema, and cleanup; live iOS operator speech/viewport and unlocked Android/TalkBack unavailable | BLOCKED by unavailable native infrastructure; no native PASS evidence. |
| `M7B-PERF-001`: five cold runs, absolute LCP/INP/CLS, startup, Worker 1x/64x, memory, offline, physical battery/thermal, authenticated frozen baseline | Four five-run cells and absolute browser metrics pass; Event Timing-only INP and nonce/channel validation pass source/probe review; physical device and accepted-build baseline are blocked; accepted-tree child capture cannot run current collector | FAIL: V-105-001 blocks authenticated baseline evidence. |
| `M7B-EVIDENCE-001`: device/browser matrix, Rule of Three, artifact manifest, cleanup, and honest blocker behavior | Canonical summaries carry candidate identity, matrix, artifacts, and explicit blockers; process cleanup and retained regressions pass; independent probe finds two correctable evidence seams | FAIL: V-105-001 and V-105-002 block acceptance. |
| Retained deterministic, accounting, balance, persistence, malformed-save, causal, PWA, offline, security, startup/install, and user-visible behavior | Final 67-file/312-test unit run, all balance lanes, root 238/238, Pages 2/2, retained independent probes | Satisfied for unchanged retained product scope. |
| Architecture proportionality and implementation boundary | Candidate diff is evidence tooling/tests/docs only; local caches, deterministic loopback, structured summaries, and nonce-authenticated child channel are scoped to M7B | Proportional structure; baseline packaging and error-boundary defects prevent acceptance. |
| D-043 Rule of Three | Normal 393 state; 320/200%/reduced-motion/touch/keyboard and malformed boundary; reload/offline, repeated Worker runs, persistence, device-lock and cleanup lifecycle exercised where infrastructure allowed | Exercised but incomplete for native speech, physical device, and authentic baseline lifecycle. |

## Findings

### V-105-001 — Frozen baseline capture cannot run the trusted current collector

- Severity: High; blocks acceptance.
- Related requirement: `M7B-PERF-001` and D-043 authenticated frozen
  same-device baseline.
- Expected: the same-invocation baseline capture must execute trusted current
  measurement tooling against the app bytes from the frozen accepted Git
  object, then return a nonce-bound envelope containing that measurement. The
  collector must not be required to exist in the old accepted application
  commit.
- Actual: `scripts/capture-frozen-baseline.mjs` archives accepted SHA
  `d25e80e6781de89e80fc3b3c240a922ada53d978` into an isolated worktree, then
  invokes `scripts/collect-mobile-performance.mjs` from that worktree. The
  accepted tree contains no such file (`git ls-tree -r --name-only
  d25e80e...` confirms this), so the child exits 1 before measuring or
  emitting `M7B_FROZEN_CAPTURE_RESULT`. The current performance lane therefore
  cannot produce an accepted-build baseline envelope; its persisted receipts
  are correctly rejected and cannot substitute for the missing capture.
- Reproduction: `node .agent/verification/round-105-adversarial.mjs`, or run
  `M7B_FROZEN_CAPTURE_NONCE=<64-hex> M7B_PERFORMANCE_DEVICE_ID=round-105-device
  M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/r105-capture-test node
  scripts/capture-frozen-baseline.mjs --child-capture`.
- Concrete evidence: the independent probe reports
  `acceptedTreeHasCollector: false`, `captureExit: 1`,
  `moduleMissing: true`, and the exact `Cannot find module ...
  .cache/m7b-frozen-baseline-worktree-.../scripts/collect-mobile-performance.mjs`
  error. The final canonical performance summary separately records
  `same-device-baseline-capture` as BLOCKED; no accepted-build samples were
  produced.
- Blocks PASS: yes.

### V-105-002 — Broad WebKit-marker filters hide page and console errors

- Severity: High; blocks acceptance.
- Related requirement: `M7B-WEBKIT-001` zero page/console-error gate and
  `M7B-EVIDENCE-001` fail-closed classification.
- Expected: only the specifically captured structured offline navigation
  blocker may be classified as infrastructure. A real pageerror or console
  error remains visible to the zero-error assertion and performance
  `page-errors` gate, even when its text happens to contain an infrastructure
  marker.
- Actual: `tests/e2e/m7b-webkit.spec.ts` filters every captured error with
  `! /WebKit encountered an internal error/` before asserting the error list is
  empty. `scripts/collect-mobile-performance.mjs` applies the same broad
  filter to `sample.errors`; matching strings are copied to
  `infrastructureErrors`, but `budgetFindings` checks only the filtered
  `cell.summary.errors`. A page/console error containing that phrase can thus
  disappear from both acceptance gates without structured provenance showing
  it was the navigation error.
- Reproduction: `node .agent/verification/round-105-adversarial.mjs`; inspect
  the `broadSpecFilter` and `broadCollectorFilter` values and the source lines
  in the two files above.
- Concrete evidence: the probe reports
  `broadSpecFilter: true`, `broadCollectorFilter: true`,
  `cleanStructuredResult: "PASS"`, and `markerStructuredResult: "FAILED"`.
  The structured classifier itself now handles a marker-containing failed
  Playwright result correctly, but the earlier broad filters bypass that
  protection for actual page/console errors.
- Blocks PASS: yes.

## Rule-of-Three evidence

- Normal valid state: final root navigation/PWA and retained lifecycle probes;
  WebKit 393/320 bodies; four five-run performance cells; valid nonce/channel,
  Event Timing, Worker request/response, artifact, and identity checks.
- Closest malformed/adversarial boundary: accepted-tree baseline missing its
  current collector; fresh nonce child invocation; forged persisted receipt
  rejection; marker-containing failed structured result; marker-containing
  page/console prefilter; malformed saves and native matrix boundary checks.
- Lifecycle/cross-feature neighbor: 320px reveal at 200% text with reduced
  motion, touch/keyboard activation, reload/offline cache and save recovery,
  repeated Worker 1x/64x observations, Pages scope isolation, device lock and
  process cleanup. Native speech and physical baseline lifecycle remain
  blocked by documented infrastructure.

## Unverified areas

- Native VoiceOver speech, actual iOS CSS viewport, TalkBack speech, actual
  Android CSS viewport, and live operator checklist: required simulator/phone
  interaction was unavailable.
- Physical Android Chrome performance, battery/thermal observation, and an
  authentic five-run same-device frozen accepted-build baseline: the Pixel was
  locked and the accepted-tree collector seam failed before capture.
- WebKit top-level offline reload without the host WebKit internal error; the
  cached shell/controller proof ran, but the zero-error lifecycle gate remains
  blocked.
- Hosted exact-SHA verification/deployment and post-deployment smoke remain
  release-owner gates.

## Residual risks

Do not release this candidate as M7B-complete. The next implementation round
must inject or otherwise invoke the trusted current collector against the
frozen accepted app without depending on files absent from that old commit,
and must preserve all page/console errors while classifying only the captured
structured navigation blocker as infrastructure. Native operator evidence,
physical resource evidence, and a genuine same-device baseline must then be
rerun when the documented infrastructure is available. Retained product
behavior is green, but the two correctable evidence-tooling defects prevent
acceptance.
