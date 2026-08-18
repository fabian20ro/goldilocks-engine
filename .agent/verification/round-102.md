# Verification round 102 — M7B release-evidence verification

Candidate SHA: `ce04ef9935987683b22659c9434434a23e242d2e`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier-authored
write, `git rev-parse HEAD` returned
`ce04ef9935987683b22659c9434434a23e242d2e`; the worktree was clean. No
production implementation file was changed by this verifier.

This was the full release-read route because the candidate implements the
broad, cross-milestone M7B release-evidence scope. Read in order:
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, catalog, immutable archive, retained probes, and the
exact candidate scripts, configs, tests, and source seams named by those
records. Routing records, handoff text, implementation-authored tests,
comments, and claimed results were treated as untrusted navigation.

Independent checklist:

- Exact candidate identity, clean setup/startup, process cleanup, and
  repository-local npm/Playwright installation.
- D-043/M7B pinned WebKit at 393x742 and 320x693 with reduced motion, 200%
  text, geometry, keyboard/touch, reload/offline recovery, error handling,
  and the normal/boundary/lifecycle Rule of Three.
- Native iOS VoiceOver and unlocked USB Android TalkBack evidence, including
  names, active state, narrow reveal, first action, actual CSS viewport,
  speech artifacts, artifact checksums, and honest infrastructure BLOCKED
  behavior.
- Five-run clean-install performance cells, absolute LCP/INP/CLS budgets,
  startup/offline/Worker 1x/64x/memory measurements, physical battery/thermal
  evidence, authenticated frozen same-device baselines, artifact manifests,
  and cleanup.
- Canonical fail-fast/BLOCKED honesty, architecture proportionality, setup and
  startup, retained M7A eight-tab navigation/PWA regressions, security and
  cleanup, and Rule-of-Three coverage.

## Environment and setup

- Darwin arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browser assets used ignored
  repository-local `.cache/npm` and `.cache/ms-playwright` paths.
- The sandboxed WebKit launch failed before test bodies with the managed
  macOS browser process error; the identical pinned lane was rerun with
  scoped host authority and completed 2/2. No required browser evidence was
  silently skipped.
- `./scripts/run` served the app on loopback and was terminated cleanly. The
  final canonical lane left no listener on ports 43223–43226.
- The verifier changed only `.agent/verification/round-102-adversarial.mjs`,
  this report, and catalog routing metadata.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` before verifier writes | Exact supplied SHA matched; initial tree clean. |
| Required authority, routing, decision, release-matrix, handoff, catalog, archive, source, test, and script reads | Completed independently via the full route. |
| `./scripts/agent-status` | Parsed cleanly; identified the supplied candidate as the next M7B verification gate. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck`; `node --check scripts/native-accessibility.mjs`; `node --check scripts/collect-mobile-performance.mjs` | Passed. |
| Focused Vitest: `npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts` | Passed: 3 files / 11 tests. |
| `npm run validate:verification-catalog` before verifier artifacts | Passed: 101 immutable reports, 97 findings, 8 active requirements. |
| `E2E_WEBKIT_PORT=43210 ... npm run test:e2e:webkit` in the sandbox | Infrastructure failure before test bodies: WebKit abort/Mach-port launch failure. |
| Host-authorized `E2E_WEBKIT_PORT=43211 ... npm run test:e2e:webkit` | Passed 2/2 at 393x742 and 320x693. Both tests annotated the known WebKit offline top-level reload error and accepted cached-shell proof; this is finding V-102-006. |
| `M7B_NATIVE_PORT=43212 ... npm run test:native-a11y` and allow-blocked rerun | Returned `BLOCKED`. iOS `xcrun`/CoreSimulatorService was unavailable; the connected Pixel 6a was locked (`showing=true`, `inputRestricted=true`, screen off); native speech and actual CSS viewport were unavailable. Final summary retained device artifacts and exact blockers. |
| `M7B_PERFORMANCE_BROWSERS=chromium,webkit ... npm run collect:mobile-performance` with host authority | Completed five samples for Chromium/WebKit at both widths. Summary was `BLOCKED` for locked physical Android/Chrome, missing frozen baseline, and five WebKit offline-navigation errors per width. Chromium absolute p95s were within LCP/INP/CLS budgets; WebKit Worker values were null because no CDP Worker counter was available. |
| Self-baseline adversarial run with `M7B_PERFORMANCE_BASELINE=.cache/m7b/performance/round-102-host/summary.json` | Accepted a current-candidate summary as the baseline and produced no same-device-baseline identity finding, proving the comparator does not authenticate the frozen accepted build. |
| Retained `navigation-affordance` E2E, round-093 engine/UI probes, and round-097 navigation probe | Passed under scoped host authority: retained eight-tab normal/boundary/lifecycle behavior, Lab, reload/offline, text scaling, reduced motion, keyboard/touch, and error checks. |
| Root pinned Chromium `E2E_PORT=43220 ... npm run test:e2e -- --workers=1 --reporter=line` | Passed 238/238. Pages/offline canonical lane later passed 2/2. |
| `./scripts/run` readiness curl and teardown | Passed; loopback startup reachable and no process remained. |
| `node .agent/verification/round-102-adversarial.mjs` | Exit 1 with six independent findings: V-102-001 through V-102-006. |
| Final canonical `./scripts/verify` with repository-local caches and evidence directory `.cache/verification/round-102-final` | Exit 0 after all executable candidate checks. It printed `Verification passed`, but its summary incorrectly labeled native/performance as passed while `.cache/m7b/native/round-102-final/summary.json` and `.cache/m7b/performance/round-102-final/summary.json` both had `result: BLOCKED`; see V-102-001. |
| Post-gate listener/tree audit | No listener remained; only verifier-owned untracked artifacts were present before commit. |

The canonical gate ran once after executable verification work was complete.
This report, catalog routing, and the verifier probe are metadata/evidence
artifacts added after that gate; no executable candidate change followed it,
and the canonical command was not looped.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: machine-valid routing and immutable archive | Pre-gate catalog validation; post-report catalog validation; exact report/catalog routing. | Satisfied for the verifier archive. |
| `M7A-NAV-001`: eight stable destinations, 44px targets, narrow overflow/reveal, no duplicate routing | Candidate source inspection; root Chromium 238/238; retained round-097 and navigation probes; WebKit 2/2 geometry checks. | Satisfied for exercised retained/browser behavior. |
| `M7A-NAV-002`: normal, 320px boundary, 200% text, reduced motion, keyboard/touch, resize/reload/offline lifecycle | Root suite and retained probes cover the Rule of Three and cleanup; WebKit lifecycle exposes the accepted internal-error path. | Retained M7A slice satisfied; cross-engine M7B lifecycle is not closed (V-102-006). |
| `M7A-RELEASE-001`: release matrix and exact-candidate evidence | Canonical retained lanes, production audit, build, setup, and exact SHA summaries passed; active M7B gates remain open and are not substituted by Chromium. | Not releasable: active M7B findings prevent closure. |
| `M7B-WEBKIT-001`: pinned WebKit 393x742/320x693 OIV matrix | Pinned 2/2 test body execution, target geometry, reduced motion, 200% text, keyboard/touch, persistence, malformed-save recovery, and cache proof. | FAIL: known offline top-level reload error is annotated and then accepted (V-102-006). |
| `M7B-NATIVE-001`: native VoiceOver/TalkBack names, active state, reveal, first action, speech, CSS viewport, lifecycle, and manifest | Harness produced device/settings/AX artifacts and honest infrastructure blockers; iOS simulator unavailable and Pixel locked. | FAIL: manual evidence cannot be ingested/closed on rerun, and Android screenshot lacks a digest (V-102-002, V-102-003); infrastructure also leaves the gate BLOCKED. |
| `M7B-PERF-001`: five clean-install runs, budgets, Worker cost, memory, offline, battery/thermal, and same-device baseline | Five samples exist for four browser/width cells; absolute desktop metrics were observed; physical Android, baseline, and WebKit offline evidence are blocked. | FAIL: Worker values are main-thread proxies, baseline identity is unauthenticated, and required physical/device evidence is unavailable (V-102-004, V-102-005). |
| `M7B-EVIDENCE-001`: independent matrix, Rule of Three, artifacts, cleanup, and honest BLOCKED behavior | Independent adversarial probe, final summaries, cleanup audit, and retained probes. | FAIL: canonical gate masks BLOCKED summaries and native manifest/workflow defects remain (V-102-001 through V-102-003, V-102-006). |
| Setup/install/startup/security/cleanup | `./scripts/setup`, `npm ci`, production audit with zero production vulnerabilities, `./scripts/run`, deterministic loopback, and listener audit. | Satisfied for local infrastructure. |
| Architecture proportionality and retained production behavior | Candidate adds evidence-only scripts/config/tests; no production implementation diff; root/Pages and retained adversarial lanes pass. | Retained product behavior satisfied; evidence architecture is not acceptance-safe because of the findings above. |
| Rule of Three | Normal and 320px boundary browser states were exercised; lifecycle includes reload/offline and cleanups. Native/device lifecycle and Worker/resource observation cannot close. | Incomplete; no release PASS. |

## Findings

### V-102-001 — Canonical verification masks explicit M7B BLOCKED results

- Severity: High; blocks acceptance.
- Related requirement: `M7B-EVIDENCE-001`, fail-fast/BLOCKED honesty.
- Expected: `./scripts/verify` must inspect native/performance summaries and
  preserve a `BLOCKED` result rather than labeling the lane passed or printing
  a successful release result.
- Actual: `scripts/verify:49-50` invokes both lanes with
  `M7B_*_ALLOW_BLOCKED=1`; `run_step` records only child exit status. The
  final native and performance summaries both say `result: BLOCKED`, while
  `.cache/verification/round-102-final/summary.txt` says
  `native-accessibility=passed`, `mobile-performance=passed`, and the command
  exits 0 with `Verification passed`.
- Reproduction: run the final canonical command recorded above, then compare
  its summary with the two `.cache/m7b/*/round-102-final/summary.json` files;
  or run `node .agent/verification/round-102-adversarial.mjs`.
- Concrete evidence: `.cache/verification/round-102-final/summary.txt`,
  `.cache/m7b/native/round-102-final/summary.json`,
  `.cache/m7b/performance/round-102-final/summary.json`, and the probe's
  V-102-001 output.

### V-102-002 — Android native screenshot is not checksum-addressed

- Severity: Medium; blocks acceptance of the native artifact manifest.
- Related requirement: `M7B-EVIDENCE-001` / D-043 artifact checksums.
- Expected: every native artifact entry is a `{ path, sha256 }` record.
- Actual: `scripts/native-accessibility.mjs:534` appends
  `path.relative(root, screenshotPath)` as a bare string. The final native
  summary contains `.cache/m7b/native/round-102-final/android-chrome.png`
  without a digest, while the adjacent artifacts have SHA-256 records.
- Reproduction: run `npm run test:native-a11y` with a connected Android device,
  or inspect the final summary and run the independent probe.
- Concrete evidence: final `summary.json` Android `artifacts` array and
  `scripts/native-accessibility.mjs:531-535`.

### V-102-003 — Native operator evidence has no ingestion/validation path

- Severity: High; blocks native acceptance.
- Related requirement: `M7B-NATIVE-001`.
- Expected: an operator can record speech, actual CSS viewport, and checklist
  outcomes in the documented artifacts, and a rerun validates those retained
  records before closing the gate.
- Actual: `nativeChecklist` creates every row with `status: "UNVERIFIED"`;
  each invocation writes placeholder speech files, writes a new checklist,
  and unconditionally adds `voiceover-speech` and `talkback-speech` blockers.
  The script never reads the operator-edited speech or checklist artifacts.
- Reproduction: edit the documented speech/checklist files after a blocked run,
  rerun `npm run test:native-a11y`, and inspect the newly written summary; the
  rows remain UNVERIFIED and the blockers remain. Static independent probe
  V-102-003 also detects the missing read path.
- Concrete evidence: `scripts/native-accessibility.mjs:151-174`,
  `:339-360`, `:553-570`, `:701-707`, and final native `summary.json`.

### V-102-004 — Worker 1x/64x fields measure renderer TaskDuration

- Severity: High; blocks the measured performance requirement.
- Related requirement: `M7B-PERF-001` / D-043 Worker cost.
- Expected: 1x and 64x cost is measured/attributed to the simulation
  Dedicated Worker used by the product, with raw evidence and summary values.
- Actual: `scripts/collect-mobile-performance.mjs:238-276` samples CDP
  `Performance.getMetrics` `TaskDuration`, labels it
  `mainThreadTaskDurationMs`, and later maps it into `worker1xMs` and
  `worker64xMs`. It contains no Worker instrumentation or Worker CPU sample;
  WebKit values are null. The handoff explicitly calls this a proxy, which is
  not the D-043 Worker-cost gate.
- Reproduction: inspect the cited source, compare it with the product's
  Dedicated Worker seam, then run the collector and inspect the four final
  cell summaries.
- Concrete evidence: final performance summary's null WebKit Worker values,
  source lines above, and probe V-102-004.

### V-102-005 — Frozen baseline identity is not authenticated

- Severity: High; blocks the same-device baseline requirement.
- Related requirement: `M7B-PERF-001` / D-043 accepted-build baseline.
- Expected: a baseline must identify the frozen accepted candidate/build and
  be rejected when it is the current candidate or an unrelated build.
- Actual: `baselineFindings` matches only browser and width and compares metric
  values; it never validates a baseline candidate SHA/build identity. An
  adversarial run supplied the current candidate's own summary as the
  baseline and produced no `same-device-baseline` finding.
- Reproduction: run the self-baseline command recorded above with
  `M7B_PERFORMANCE_BASELINE` pointing at a current-candidate summary; inspect
  the resulting summary and `scripts/collect-mobile-performance.mjs:864-938`.
- Concrete evidence: self-baseline summary, source comparator, and probe
  V-102-005.

### V-102-006 — WebKit offline navigation error is converted to a passing test

- Severity: High; blocks the WebKit lifecycle gate.
- Related requirement: `M7B-WEBKIT-001` / D-043 offline recovery and zero-error
  evidence.
- Expected: a top-level offline navigation error must fail the lane or produce
  an explicit lane `BLOCKED` result; cached-shell assertions may supplement,
  not erase, the failed navigation attempt.
- Actual: `tests/e2e/m7b-webkit.spec.ts:124-166` catches
  `page.reload()`'s `WebKit encountered an internal error`, appends an
  annotation, proves the cache, and exits successfully. The host WebKit lane
  reports 2/2 passed. The performance collector independently recorded five
  such errors at each WebKit width as `BLOCKED`.
- Reproduction: run the host-authorized pinned WebKit command and inspect its
  annotations, or run the final performance collector and compare the WebKit
  `offline-navigation` findings.
- Concrete evidence: `tests/e2e/m7b-webkit.spec.ts:124-166`, final WebKit
  2/2 output, final performance summary's ten offline-navigation errors, and
  probe V-102-006.

Every listed finding is correctable candidate verification/tooling behavior;
the native-device and frozen-baseline unavailability is additionally recorded
as infrastructure-blocked evidence below. The correctable defects make this a
FAIL rather than a BLOCKED-only report.

## Unverified areas

- Native VoiceOver could not run because `xcrun` reported an unavailable
  CoreSimulatorService. Native TalkBack and Android Chrome could not run on
  the connected Pixel 6a while it was locked and non-interactive.
- Native speech transcripts, actual CSS viewport observations, physical
  battery/thermal behavior, and clean-install Android Chrome measurements were
  therefore not obtained. The candidate correctly retained these raw blockers,
  but its canonical lane incorrectly masks them (V-102-001).
- No frozen accepted-build same-device baseline was available. The comparator
  was adversarially shown to accept a self/current baseline (V-102-005).
- Hosted exact-SHA verification/deployment, live `build-info.json`, and
  post-deploy smoke were not run; they remain separate release-owner gates.
- WebKit's post-reload 200% text reapplication was not independently proven
  after the accepted internal-error path; the lifecycle lane already fails the
  stricter zero-error interpretation (V-102-006).

## Residual risks

- Do not release this candidate as M7B-complete. The next implementer must
  repair canonical result propagation, native artifact/checklist ingestion,
  true Worker attribution, baseline identity validation, and WebKit offline
  error handling before a fresh verifier round.
- Retained M7A product behavior is green, but that does not substitute for the
  active native/performance evidence gates.
- The managed browser sandbox needs scoped host authority for pinned WebKit;
  future verification must preserve that reproducible setup and record any
  infrastructure failure rather than silently skipping the lane.
