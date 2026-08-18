# Verification round 104 — M7B release-evidence verification

Candidate SHA: `f093b883a5defbb27b869f6dc8b8e49ace87a42b`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate. Before any verifier-authored write,
`git rev-parse HEAD` returned the supplied SHA and the worktree was clean. The
candidate changes evidence tooling, tests, and documentation only; no
production implementation file was changed.

This was the required full M7B/release/archive route. Read in order:
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, catalog, immutable archive, retained probes, and every
source named by those records. Routing maps, handoff text,
implementation-authored tests, comments, and claimed results were treated as
untrusted navigation.

Independent checklist:

- exact candidate identity, clean setup/startup, pinned local dependencies,
  process cleanup, and canonical aggregate behavior;
- retained eight-destination navigation, persistence, malformed recovery,
  accounting, PWA, offline, security, and error-boundary regressions;
- pinned WebKit at 393x742 and 320x693 with reduced motion, 200% text,
  geometry, touch/keyboard, reload/offline, persistence, and page/console
  error handling;
- native VoiceOver/TalkBack device identity, settings, exact viewports,
  screen-reader evidence, artifact checksums, and honest infrastructure
  blocking;
- five-run Chromium/WebKit performance cells, LCP/INP/CLS, startup, memory,
  Worker 1x/64x evidence, offline startup, physical battery/thermal evidence,
  and frozen same-device provenance;
- canonical PASS/BLOCKED/FAILED separation, trust boundaries, architecture
  proportionality, release-matrix honesty, and the normal/boundary/lifecycle
  Rule of Three.

## Environment and setup

- Darwin arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browser assets remained in
  ignored repository-local `.cache/npm` and `.cache/ms-playwright`.
- Scoped host authority was required for pinned browser/device launches after
  the managed macOS Mach-port boundary rejected sandboxed browser processes.
- The connected Pixel 6a was serial `25121JEGR11385`; window policy showed
  `showing=true`, `inputRestricted=true`, and screen off. CoreSimulatorService
  was unavailable. Native speech, actual-device CSS viewport, physical Chrome
  performance, and physical resource-gate evidence were therefore
  infrastructure-blocked.
- Temporary browser servers and the focused E2E session were stopped. The
  verification session's loopback port was closed; evidence remained under
  ignored `.cache` paths.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short --branch` | PASS. Exact supplied SHA matched; initial worktree was clean. |
| `./scripts/agent-status` | PASS. Live metadata parsed cleanly; round 103 was the latest immutable FAIL before this report. |
| Complete plan, decisions, release matrix, handoff, catalog, archive, retained-probe, source, test, and script read route | PASS. Full route completed because this is broad M7B/release verification and the catalog contains historical/current contradictions. |
| Candidate diff/source inspection | PASS for scope. Changes are evidence scripts/configuration/tests/docs only; no production implementation diff. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck` | PASS. |
| `npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts --pool=forks --maxWorkers=1` | PASS: 3 files, 13 tests. |
| `node --check .agent/verification/round-104-adversarial.mjs`; `git diff --check` | PASS. |
| `npm run validate:verification-catalog` before the new report | PASS: 103 immutable reports, 106 findings, 8 active requirements. |
| `node .agent/verification/round-102-adversarial.mjs` | PASS with `findings: []`; the six round-102 regressions did not reproduce on this candidate. |
| `node .agent/verification/round-103-adversarial.mjs` | PASS with `findings: []`; exact native-height validation and the narrower baseline/caller-path and structured-wrapper checks did not reproduce. |
| Retained round-093 engine/UI, round-097 navigation, and round-079/081/082 browser probes under scoped host authority | PASS. Normal, 320px boundary, 200% text, reduced motion, touch/keyboard, persistence, malformed recovery, reload/offline, accounting, Lab, and cleanup regressions produced no findings. |
| Pinned WebKit `npm run test:e2e:webkit` with repository cache and loopback host | BLOCKED honestly: both 393x742 and 320x693 bodies executed (2/2, no Playwright assertion failures), but offline top-level reload emitted the structured WebKit internal-error infrastructure annotation; cached-shell/controller proof remained valid. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 npm run test:native-a11y` in the canonical lane | BLOCKED honestly: CoreSimulatorService unavailable; Pixel 6a locked/non-interactive; speech and actual CSS viewport unavailable. Retained artifact records included SHA-256 digests. |
| `M7B_PERFORMANCE_ALLOW_BLOCKED=1 npm run collect:mobile-performance` in the canonical lane | BLOCKED honestly: Chromium/WebKit 320/393 each had five samples and absolute browser metrics stayed within configured budgets, but physical Android/Chrome, battery/thermal, WebKit offline reload, and canonical frozen baseline were unavailable. |
| `node .agent/verification/round-104-adversarial.mjs` | FAIL with exactly V-104-001, V-104-002, and V-104-003. The probe restored every canonical baseline file and left no fixture changes. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-104-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | Exit 2. Catalog/setup/format/lint/typecheck, 67 unit files/312 tests, all balance lanes, build, production audit (0 vulnerabilities), root browser 238/238, and Pages/offline 2/2 passed. WebKit, native, and mobile-performance summaries were parsed as blocked; aggregate verification stayed nonzero. This was the one final canonical gate and was not rerun. |
| Post-gate status and process/port audit | No candidate-owned server remained; only the verifier probe was untracked before report/catalog artifacts were added. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: explicit, immutable, contradiction-checked routing | Full archive/catalog read; routing tests 13/13; catalog validator; mutable routing metadata normalized for the already-PASS round-101 resolution of V-100-001 | Routing mechanics pass. Historical active M7B findings remain routed; no acceptance claim. |
| `M7A-NAV-001`: eight stable destinations, bottom-nav-only routing, 44px targets, narrow reveal, active state, no duplicate global routing | Candidate source inspection; root 238/238; retained round-097 and WebKit matrix body at both widths | Satisfied for exercised browser/product behavior. |
| `M7A-NAV-002`: normal, 320px boundary, text scaling, reduced motion, keyboard/touch, resize, reload/offline | Round-079/081/082/097 plus root and Pages lanes cover normal/boundary/lifecycle behavior and malformed recovery | Retained M7A behavior passes; WebKit offline infrastructure remains an open cross-engine gate. |
| `M7A-RELEASE-001` / D-041 release matrix honesty | Complete release matrix and decisions read; canonical aggregate preserves blocked M7B lanes and does not substitute Chromium for native or baseline evidence | Not releasable; active M7B requirements and V-104 findings remain. |
| `M7B-WEBKIT-001`: pinned WebKit 393x742/320x693 OIV matrix, zero page/console errors, reload/offline recovery | Actual pinned 2/2 body execution with reduced motion, 200% text, geometry, interaction, persistence, malformed-save and cache proof; structured offline blocker retained | FAIL. V-104-002 leaves a marker-collision path that can mask a real assertion failure; actual host lane is also infrastructure-blocked. |
| `M7B-NATIVE-001`: VoiceOver/TalkBack names, active state, reveal, first action, exact CSS viewport, speech, lifecycle, manifest | Native harness and validator inspect exact 320x693/393x742 values and checksum-addressed records; live iOS/Android speech/device access unavailable; round-103 malformed-height boundary no longer reproduces | BLOCKED by unavailable native infrastructure; no native PASS evidence. |
| `M7B-PERF-001`: five cold runs, absolute LCP/INP/CLS, startup, Worker 1x/64x, memory, offline, physical battery/thermal, authenticated frozen baseline | Four browser/width cells contain five samples and absolute browser budgets pass; Worker request/response records and memory are retained; physical device and baseline are blocked; Event Timing fallback and mutable canonical receipt are independently exposed | FAIL. V-104-001 and V-104-003 violate evidence trust/metric validity; external device/baseline blockers remain. |
| `M7B-EVIDENCE-001`: device/browser matrix, Rule of Three, artifact manifest, cleanup, and honest blocker behavior | Canonical parser propagates blocked summaries and exits 2; retained artifacts include checksums; independent adversarial probe finds three correctable seams; retained regressions and process cleanup pass | FAIL. Evidence is not acceptance-safe until the three seams are corrected. |
| Retained deterministic, accounting, balance, persistence, malformed-save, causal, PWA, offline, security, startup/install, and user-visible behavior | Canonical 67-file/312-test unit run, all numeric/first-session/upgrade/progression/Career/evaluation/Research/Hype-Fear/Lab balances, root 238/238, Pages 2/2, retained adversarial probes | Satisfied for the unchanged retained product scope. |
| Architecture proportionality and implementation boundary | Candidate modifies only M7B evidence tooling/docs/tests; no production source changed; evidence uses repository-local caches and deterministic loopback | Proportional structure; trust-boundary defects prevent acceptance. |
| D-043 Rule of Three | Normal 393px state; 320px/200%/reduced-motion/touch/keyboard malformed boundary; reload/offline, repeated Worker runs, persistence, device-lock and cleanup lifecycle exercised where infrastructure allowed | Exercised but incomplete for native speech, physical device, and authentic baseline gates. |

## Findings

### V-104-001 — Canonical frozen baseline receipt can be forged

- Severity: High; blocks acceptance.
- Related requirement: `M7B-PERF-001` and D-043 authenticated frozen
  same-device baseline.
- Expected: candidate measurements must consume a trusted frozen capture whose
  accepted-build identity and artifact provenance cannot be fabricated by
  rewriting the canonical JSON summary and receipt.
- Actual: the candidate rejects arbitrary baseline paths and checks canonical
  paths, accepted SHA/tree/build, capture ID, path, digest, and artifact-map
  equality, but every checked value remains self-declared mutable JSON. The
  independent probe wrote a forged canonical pair claiming accepted SHA
  `d25e80e6781de89e80fc3b3c240a922ada53d978`, its matching Git tree, build
  `dc97ee41f6dbbc0e29d2`, canonical paths, a matching capture ID, and a
  self-digested artifact. The collector accepted the pair with
  `provenanceFindings: []`; its overall blocked result came only from the
  deliberately empty browser/physical lanes.
- Reproduction: `node .agent/verification/round-104-adversarial.mjs`; inspect
  the `receipt` object and the `same-device-baseline-provenance` filtering in
  `scripts/collect-mobile-performance.mjs`.
- Concrete evidence: the probe exited 1 with V-104-001 while reporting
  `collectorExit: 0`, `result: "BLOCKED"`, and no provenance findings. The
  probe restores the canonical files in `finally`, so the test is repeatable
  without changing the worktree.
- Blocks PASS: yes.

### V-104-002 — WebKit classifier lets a marker-containing assertion become infrastructure

- Severity: High; blocks acceptance.
- Related requirement: `M7B-WEBKIT-001` and fail-closed WebKit result
  classification.
- Expected: a real Playwright assertion/test failure remains `FAILED`, even
  when its error text contains a phrase recognized as a browser-launch or
  navigation infrastructure marker.
- Actual: `isRecognizedInfrastructureError` searches error-message substrings
  without first distinguishing the error's source/status. A synthetic JSON
  report with one failed test and assertion text containing the literal
  `WebKit encountered an internal error` is classified `BLOCKED`, with no
  failure entry.
- Reproduction: `node .agent/verification/round-104-adversarial.mjs`; inspect
  `webkitMarkerCollision` and `scripts/webkit-result-classifier.mjs`.
- Concrete evidence: the probe output has `testsSeen: 1`, `failures: []`, one
  infrastructure classification, and `result: "BLOCKED"` despite
  `stats.unexpected: 1` and failed Playwright result status.
- Blocks PASS: yes.

### V-104-003 — Missing Event Timing is reported as INP from wall-clock interaction time

- Severity: High; blocks acceptance.
- Related requirement: `M7B-PERF-001` absolute INP and same-device performance
  evidence.
- Expected: when Event Timing is unsupported or has no INP entry, the metric
  must remain null and the lane must report unsupported/blocked evidence; a
  click-duration timer is not INP.
- Actual: both browser sample paths assign
  `interactionMetrics.inpMs ?? metrics.inpMs ?? interactionMs`. The collector
  therefore emits a wall-clock button-click duration as `inpMs` when the
  browser provides no Event Timing INP entry, allowing an unsupported metric
  to pass the numerical gate.
- Reproduction: `node .agent/verification/round-104-adversarial.mjs`; inspect
  `inpFallback: { fallback: true }` and the `runBrowserSample` assignments in
  `scripts/collect-mobile-performance.mjs`.
- Concrete evidence: independent source probe found the exact fallback in
  both Chromium and Android/physical sample paths; `interactionMs` is measured
  with `Date.now()` around the Jobs click, not from a PerformanceEventTiming
  entry.
- Blocks PASS: yes.

## Rule-of-Three evidence

- Normal valid state: root eight-tab navigation, retained settlement/Lab/PWA
  probes, WebKit 393/320 test bodies, and four five-run browser performance
  cells exercised successfully where available. A valid native fixture and
  valid baseline identity checks also passed the retained round-103 probe.
- Closest malformed/adversarial boundary: forged canonical baseline and
  receipt, assertion text colliding with a WebKit marker, absent Event Timing
  fallback, round-103 malformed native height, malformed saves, and stale or
  colliding ledger inputs were exercised.
- Lifecycle/cross-feature neighbor: 320px reveal at 200% text and reduced
  motion, keyboard/touch activation, reload/offline cache and save recovery,
  repeated 1x/64x Worker observations, device lock/settings capture, clean
  loopback startup, and process cleanup were exercised. Native speech and
  physical baseline lifecycle remained blocked by the documented devices.

## Unverified areas

- Native VoiceOver speech and actual CSS viewport: CoreSimulatorService was
  unavailable; the available iOS identity/AX artifacts are not speech proof.
- Native TalkBack, Android Chrome, physical battery/thermal, and physical
  five-run performance: the connected Pixel 6a remained locked and
  non-interactive.
- A genuine frozen accepted-build same-device baseline: no trusted retained
  capture was available; the canonical receipt was adversarially shown to be
  forgeable.
- WebKit offline top-level reload remains a host browser infrastructure error;
  cached shell/controller proof succeeded but zero-error lifecycle evidence
  is not closed.
- Hosted exact-SHA verification/deployment, live `build-info.json`, and
  post-deployment smoke were not run; they remain release-owner gates.

## Residual risks

Do not release this candidate as M7B-complete. The next implementation round
must establish an authenticity boundary for the frozen receipt, classify
structured WebKit failures without marker collisions, and keep unsupported INP
null/blocked. Native operator/device evidence and a same-device physical
baseline must be rerun when the documented infrastructure is available. The
retained product behavior is green, but the three evidence-tooling defects
are correctable blockers to acceptance.
