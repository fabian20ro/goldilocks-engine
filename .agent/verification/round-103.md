# Verification round 103 — M7B authenticity and fail-closed verification

Candidate SHA: `ad7df16580f6200a6bdcafcce51175576bb1b630`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before verifier-authored writes,
`git rev-parse HEAD` matched the supplied SHA and the worktree was clean. No
production implementation file was changed.

This was the full M7B/release/archive route because D-043 is a broad
cross-milestone release-evidence decision. Read in order: `AGENTS.md`,
`.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, catalog, immutable reports and retained probes, followed
by the exact candidate scripts/configuration/tests. Routing maps, handoff,
implementation tests, comments, and claimed results were treated as untrusted
navigation.

Independent checklist: exact-SHA and clean setup; pinned WebKit at 320x693 and
393x742 with reduced motion, 200% text, interaction, geometry,
reload/offline/error handling; native VoiceOver/TalkBack evidence, device
identity, settings, speech, checklist and CSS viewport; five-run performance
cells, absolute budgets, Worker 1x/64x, memory, offline, physical
battery/thermal and authenticated frozen same-device baseline; canonical
PASS/BLOCKED honesty; retained eight-tab, persistence, security and cleanup
regressions; proportional evidence architecture; and normal/boundary/lifecycle
Rule-of-Three coverage.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; repository-local ignored
  `.cache/ms-playwright` and `.cache/npm` used where applicable.
- Scoped host authority was required for pinned browser launches because the
  sandboxed Chromium/WebKit processes hit the managed macOS Mach-port boundary.
- Connected Android identity was Pixel 6a serial `25121JEGR11385`; it was
  locked/non-interactive (`showing=true`, `inputRestricted=true`, screen off).
  CoreSimulatorService was unavailable, so native speech and actual-device
  evidence remained infrastructure-blocked.
- The verifier authored only `.agent/verification/round-103-adversarial.mjs`,
  this report, and catalog routing metadata. Temporary fixtures and evidence
  remained under ignored `.cache` or `/private/tmp` paths.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short --branch` | Exact supplied SHA matched; initial worktree clean. |
| Required full authority, routing, decision, release-matrix, handoff, archive, source and test reads | Completed independently. |
| `./scripts/agent-status` | Parsed cleanly; identified round 102 FAIL and the supplied candidate as the fresh gate. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck` | Passed after verifier probe formatting. |
| Focused Vitest: `npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts --pool=forks --maxWorkers=1` | Passed: 3 files / 12 tests. |
| `npm run validate:verification-catalog` | Passed: 102 immutable reports, 103 routed findings, 8 active requirements. |
| `node --check .agent/verification/round-103-adversarial.mjs`; `git diff --check` | Passed. |
| `node .agent/verification/round-102-adversarial.mjs` | Passed with `findings: []`; V-102-001 through V-102-006 source regressions no longer reproduced. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 ... npm run test:native-a11y` (sandbox and scoped host reruns) | Honest `BLOCKED`: no usable iOS simulator/CoreSimulatorService; Pixel 6a locked; speech/manual viewport unavailable. Android artifact entries now carry `{path,sha256}`. |
| `M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=chromium,webkit M7B_PERFORMANCE_RUNS=5 ... npm run collect:mobile-performance` (sandbox) | `BLOCKED` before browser cells because managed Chromium launch, locked device and baseline were unavailable. |
| Same collector with scoped host authority | `BLOCKED`, with five samples in each Chromium/WebKit 320/393 cell. Absolute observed p95s stayed within LCP 2500ms, INP 200ms and CLS .10; Worker request/response evidence was present; WebKit offline navigation errors, locked physical device and missing frozen baseline remained explicit blockers. |
| Self-baseline adversarial run using the current candidate summary | `BLOCKED` with explicit self/current SHA, non-frozen SHA/build, device, browser-matrix and settings-fingerprint findings; V-102-005 is not reproduced. |
| `E2E_WEBKIT_PORT=43311 ... npm run test:e2e:webkit` under scoped host authority | Wrapper returned `BLOCKED` (exit 2) with 2/2 internal test bodies at 393x742 and 320x693; both retained the WebKit offline reload internal error annotation and cached-shell proof. |
| Root pinned browser `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- --workers=1 --reporter=line` under scoped host authority | 237/238 passed; one intermittent Hype/Fear lifecycle timeout. Isolated rerun passed 3/3 and `--repeat-each=5` passed 15/15. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages -- --workers=1 --reporter=line` | Passed 2/2. |
| Retained `round-079-adversarial.mjs`, `round-081-adversarial.mjs`, `round-082-adversarial.mjs`, `round-097-adversarial.mjs` under scoped host authority | Passed with `findings: []`; settlement/provenance, malformed recovery, touch/keyboard, 320/393, 200%, reduced motion, reload/offline and eight-tab behavior retained. |
| Retained `node .agent/verification/round-093-adversarial.mjs` | Passed: 24 normal laboratory runs and malformed/capacity recovery checks. |
| Retained round-090 Hype/Fear probe | Could not establish current evidence: its direct unsealed localStorage mutation now conflicts with the later D-039 integrity-gated restore contract; current focused/canonical Hype/Fear tests otherwise passed on rerun. Classified as stale historical fixture, not a new product finding. |
| `node .agent/verification/round-103-adversarial.mjs` | Independent probe exited 1 with exactly V-103-001, V-103-002 and V-103-003. It also produced the valid native fixture result `PASS` and malformed-height result `PASS`, demonstrating the fail-open boundary. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-103-final ./scripts/verify` (one final canonical gate after verifier artifacts were ready) | Returned exit 2: root 238/238 and Pages 2/2 passed; WebKit, native and mobile-performance summaries were explicit `BLOCKED`; the script propagated the aggregate blocked state. |

The final canonical command ran once after this report, probe, and catalog were
ready. This wording update records its observed result after the process
completed; no executable candidate or verifier artifact changed after the
gate, and the gate was not rerun.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: machine-valid routing, immutable archive and exact candidate handoff | Full route read; `agent-status`; catalog validation; exact candidate SHA | Satisfied for the verification archive. |
| `M7A-NAV-001`: eight stable destinations, 44px targets, narrow reveal, active state and no duplicate routing | Root suite (237/238 with one intermittent unrelated timeout); retained rounds 079/081/082/097; pinned M7B boundary body at both widths | Product behavior observed; final canonical lane remains subject to its one intermittent rerun. |
| `M7A-NAV-002`: normal, 320px boundary, text-scale, reduced-motion, keyboard/touch, resize, reload/offline behavior | Retained browser probes pass; WebKit body executes both widths and preserves cache proof, but its offline top-level error is correctly retained as a lane blocker | Not releasable through M7B WebKit gate; V-103-003 remains. |
| `M7A-RELEASE-001`: exact release matrix and remaining acceptance gates | Full release matrix read; canonical lane, native device and frozen baseline are not closed | Not satisfied. |
| `M7B-WEBKIT-001`: pinned WebKit 393x742/320x693 OIV matrix and zero page/console errors | Host 2/2 body execution; 200%/reduced-motion, touch/keyboard, geometry, persistence and cache proof; offline internal errors retained in report | FAIL: wrapper can misclassify a test failure containing the same annotation as infrastructure BLOCKED (V-103-003); current actual run is also infrastructure-blocked. |
| `M7B-NATIVE-001`: VoiceOver/TalkBack names, active state, reveal, first action, speech, CSS viewport and manifest | Native capture retained checksums and explicit device blockers; synthetic valid operator submission validates; malformed finite height is accepted | FAIL: wrong finite 320 height passes validation (V-103-002); real device/speech infrastructure remains BLOCKED. |
| `M7B-PERF-001`: five runs, budgets, Worker 1x/64x, memory, offline, battery/thermal and frozen same-device baseline | Four host browser/width cells have five samples, absolute budgets observed, Worker round-trip evidence and artifact digests; physical Pixel and frozen baseline unavailable; self-baseline rejected | FAIL: untrusted caller-supplied baseline with forged frozen metadata is accepted by identity comparator (V-103-001); physical/baseline gates also remain blocked. |
| `M7B-EVIDENCE-001`: independent matrix, artifacts, cleanup and honest BLOCKED behavior | Round-102 probe passes; canonical summary parser propagates BLOCKED; native/perf/WebKit summaries retain exact SHA and artifacts; independent round-103 probe finds three fail-open seams | FAIL: V-103-001 through V-103-003. |
| Setup/startup/installation/security/cleanup | `npm`/type/lint/format/catalog/focused unit pass; root and Pages browser pass on reruns; native/perf/WebKit launch attempts retain blockers and terminate their local processes | Local setup is reproducible; physical/browser infrastructure is not fully available. |
| Architecture proportionality and retained product behavior | Candidate changes are evidence scripts/config/tests/docs only; no production implementation diff; retained M7A/M7A-neighbor probes pass | Proportional structure, but evidence trust boundaries are not acceptance-safe. |
| D-043 Rule of Three | Normal WebKit/native matrix, 320x693 + 200%/reduced-motion/reveal, and lifecycle reload/offline/repeated Worker/device observations exercised where infrastructure allowed | Incomplete because native device and frozen same-device observations are unavailable, and three fail-closed defects remain. |

## Findings

### V-103-001 — Frozen baseline provenance is forgeable

- Severity: High; blocks acceptance.
- Related requirement: `M7B-PERF-001`, D-043 authenticated frozen same-device
  baseline.
- Expected: the comparator must establish that the retained baseline was
  produced by the frozen accepted build on the named device, rather than trust
  a caller-supplied JSON summary that merely repeats those metadata values.
- Actual: `baselineFindings` validates listed file digests and equality of
  candidate SHA, build ID, device ID, browser set and settings fingerprint,
  but has no provenance/signature or trusted capture relationship. The
  independent probe created a minimal retained artifact and a summary claiming
  the frozen SHA `d25e80e...`, build `dc97ee...`, matching device/settings and
  no cells. The collector emitted no `same-device-baseline*` finding; its
  overall `BLOCKED` result came only from deliberately empty browser/physical
  lanes.
- Reproduction: `node .agent/verification/round-103-adversarial.mjs`; inspect
  its `forgedBaseline.identityFindings: []` output. The relevant comparator is
  `scripts/collect-mobile-performance.mjs:1030-1095`.
- Concrete evidence: independent probe output records the forged frozen
  metadata, zero identity findings and collector exit 0; the current-candidate
  self-baseline probe separately proves the narrower V-102-005 identity checks
  now reject self/mismatched metadata.
- Blocks PASS: yes.

### V-103-002 — Native viewport validator accepts a wrong finite height

- Severity: High; blocks acceptance.
- Related requirement: `M7B-NATIVE-001`, D-043 320x693/393x742 actual CSS
  viewport matrix.
- Expected: device and every checklist row must report the exact requested
  portrait dimensions; a finite but wrong height is malformed evidence and must
  be BLOCKED.
- Actual: `scripts/native-accessibility.mjs:489-501` and `:557-565` check the
  expected width and only `Number.isFinite(height)`. A synthetic complete
  64-row operator submission with 320x693 and 393x742 first validates `PASS`;
  mutating both device and 320-row heights to `1` validates `PASS` again with
  zero blockers.
- Reproduction: `node .agent/verification/round-103-adversarial.mjs`; inspect
  `nativeViewport.validResult: "PASS"`,
  `nativeViewport.malformedResult: "PASS"`, and
  `malformedBlockers: 0`.
- Concrete evidence: the probe runs the real candidate validator in
  `--mode=validate` against retained SHA-256 fixture artifacts and the full
  normal/boundary native checklist before and after the malformed mutation.
- Blocks PASS: yes.

### V-103-003 — WebKit wrapper masks assertion failures as infrastructure

- Severity: High; blocks acceptance.
- Related requirement: `M7B-WEBKIT-001` and M7B fail-closed/BLOCKED honesty.
- Expected: a known browser/navigation infrastructure error may make a lane
  BLOCKED, but a Playwright assertion failure in the same run must remain
  FAILED so a correctable candidate defect cannot be reported as unavailable
  infrastructure.
- Actual: `scripts/run-webkit-e2e.mjs:55-60` sets `infrastructureFailure` from
  a broad output regex that includes `WebKit offline reload reported:` and then
  unconditionally sets `blocked = infrastructureFailure`, before considering
  `run.status`. A run with status 1 and that annotation is therefore reported
  `BLOCKED` with process status 2.
- Reproduction: `node .agent/verification/round-103-adversarial.mjs`; inspect
  `webkitFailureClassification.masksTestFailure: true` and the matched source
  expression. The live host WebKit report at
  `.cache/m7b/webkit/round-103-final-host/` demonstrates the annotation is
  emitted by the current tests.
- Concrete evidence: the independent source-boundary probe models the mixed
  annotation/assertion output and finds no exit-status guard; the actual lane
  reports 2/2 tests as internally passed but BLOCKED for the known offline
  error.
- Blocks PASS: yes.

## Rule-of-Three evidence

- Normal valid state: retained M7A eight-tab navigation and settlement/lab
  probes pass; WebKit 393/320 normal matrix bodies execute; host performance
  collects five-run Chromium/WebKit cells and non-null 1x/64x Dedicated Worker
  request/response records.
- Closest malformed/adversarial boundary: forged baseline metadata, complete
  native operator evidence with finite height `1`, self-baseline metadata,
  stale/unsealed historical Hype/Fear fixture, and WebKit mixed annotation plus
  assertion source boundary were exercised.
- Lifecycle/cross-feature neighbor: 320x693/200%/reduced-motion reveal,
  keyboard/touch, reload/offline cache proof, repeated 1x/64x runs, native
  settings/lock observation and process cleanup were exercised where the
  available infrastructure permitted.

## Unverified areas

- Native VoiceOver on iOS Simulator: CoreSimulatorService unavailable.
- Native TalkBack and Android Chrome: connected Pixel 6a remained locked and
  non-interactive; no speech transcript, actual-device CSS viewport, or
  physical Chrome five-run data was obtained.
- A genuine frozen accepted-build same-device baseline was not available.
- Hosted exact-SHA verification/deployment and post-deploy smoke were not run;
  they remain release-owner gates.
- WebKit offline top-level reload remains an infrastructure error on this
  managed host; cached-shell proof succeeded but cannot close the zero-error
  lifecycle requirement.

## Residual risks

Do not release this candidate as M7B-complete. The next implementation round
must bind baseline summaries to a trusted frozen capture/provenance artifact,
require exact native viewport heights, and classify WebKit runner failures
without allowing annotations to mask assertion failures. Native-device and
physical-baseline blockers must be rerun when an iOS Simulator and unlocked
authorized Android are available. The one root-suite Hype/Fear timeout did not
reproduce in 3/3 and 15/15 isolated reruns, but should remain monitored rather
than silently ignored.
