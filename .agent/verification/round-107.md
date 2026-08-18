# Verification round 107 — M7B independent release-evidence verification

Candidate SHA: `3fa6c222972ee68bc140fdcef246c8c8e1f45d3e`

VERDICT: FAIL

## Scope and authority

Evaluated exactly candidate `3fa6c222972ee68bc140fdcef246c8c8e1f45d3e`.
Before any verifier-authored write, `git rev-parse HEAD` returned that exact
SHA and `git status --short --branch` showed a clean worktree. No production
implementation file was changed.

This was the explicit full M7B/release/archive route. Read in order:
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, and
`.agent/verification/catalog.json`; then the complete applicable `plan.md`,
`.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`,
rounds 078, 093, 099, 104, 105, and 106, their cited probes, and every exact
source cited by the active catalog requirements. Routing maps, handoff text,
implementation-authored tests, comments, and claimed results were treated as
untrusted navigation.

Independent checklist:

- exact SHA identity, clean setup/startup/cleanup, pinned local dependencies,
  canonical aggregate behavior, release-matrix honesty, and architecture
  proportionality;
- retained eight-destination navigation, persistence, malformed recovery,
  accounting, Worker, PWA, offline, security, startup/install, and user-visible
  regressions;
- real-host pinned WebKit at 393x742 and 320x693, reduced motion, 200% text,
  geometry, touch/keyboard, reload/offline, unfiltered page/console errors,
  raw events, operation windows, outside-window events, additional errors,
  pageerrors, marker/assertion collisions, and structured report trust;
- native VoiceOver/TalkBack identity, settings, operator submission, exact
  viewport/checksum requirements, and honest blocker recovery;
- five-run browser performance cells, absolute LCP/INP/CLS, startup, Worker
  1x/64x, memory, offline startup, physical battery/thermal, and authenticated
  frozen same-device baseline provenance; and
- the D-043 normal/boundary/lifecycle Rule of Three and retained V-102 through
  V-106 regression boundaries.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`; repository-pinned Playwright
  `1.61.1` and ignored repository-local `.cache/ms-playwright`/`.cache/npm`.
- The sandboxed canonical browser launch stopped at Chromium's macOS
  `MachPortRendezvousServer ... Permission denied` before browser test bodies.
  The same pinned root and Pages commands were rerun with scoped host authority;
  both passed. WebKit was also run with scoped host authority, so browser
  verification was not silently substituted or skipped.
- CoreSimulatorService was unavailable. Pixel 6a serial `25121JEGR11385`
  was attached but locked/non-interactive (`showing=true`,
  `inputRestricted=true`, screen off). Native and physical-device gates were
  preserved as BLOCKED, not converted to PASS.
- Preview servers, browser contexts, native harnesses, performance collectors,
  child capture processes, and focused probes were cleaned up. Bulky evidence
  remains under ignored `.cache/` paths.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | PASS: exact supplied SHA matched before writes; initial worktree clean. |
| `./scripts/agent-status` | PASS: live metadata parsed cleanly; round 106 was the latest immutable FAIL before this report. |
| Full plan/decision/release/archive/source read route | PASS: complete M7B/release route and exact active-source reads completed. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-107-independent ./scripts/verify` | Exit 1 in the managed sandbox: catalog/setup/format/lint/typecheck, 67-file/312-test unit suite, balance, build, production audit, and setup passed; root browser stopped before test bodies at the documented Mach-port launch denial. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=43710 npm run test:e2e -- --workers=1 --reporter=line` | PASS: root Chromium 238/238. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=43711 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS: Pages/offline 2/2. |
| `E2E_WEBKIT_PORT=43712 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-107-independent npm run test:e2e:webkit` | FAIL: both 393x742 and 320x693 bodies executed; each observed the real WebKit offline reload error but failed the correlation assertion. See V-106-001. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-107-independent npm run test:native-a11y` | BLOCKED honestly: CoreSimulator unavailable and Android locked; emitted recovery command names `operator-submission.json`. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-107-independent npm run test:native-a11y:validate` | BLOCKED honestly on missing iOS/device/operator speech, viewport, settings, and checksum evidence; no evidence was fabricated. |
| `M7B_PERFORMANCE_ALLOW_BLOCKED=1 M7B_PERFORMANCE_BROWSERS=webkit M7B_PERFORMANCE_RUNS=5 M7B_PERFORMANCE_DEVICE_ID=25121JEGR11385 M7B_PERFORMANCE_EVIDENCE_DIR=.cache/m7b/performance/round-107-independent M7B_PERFORMANCE_PORT=43716 M7B_PERFORMANCE_ANDROID_CDP_PORT=9250 npm run collect:mobile-performance` | Exit 0 only because allow-blocked was explicit; structured summary result `FAILED`. WebKit 320/393 each has five samples, `page-errors` and `offline-navigation-correlation` failures; physical battery/thermal, Android, and authenticated baseline gates remain BLOCKED. |
| `node .agent/verification/round-102-adversarial.mjs` through `round-106-adversarial.mjs` | PASS with `findings: []`; retained boundaries and V-106 target/nonce/recursion/marker/raw-error checks did not regress. |
| `node --check .agent/verification/round-107-adversarial.mjs`; `node .agent/verification/round-107-adversarial.mjs` | Syntax PASS. Independent probe records normal/outside-window/additional/pageerror/assertion operation boundaries, host summaries, native command, and V-107-001. Exit is nonzero for the expected discovered V-107-001 defect. |
| `npx prettier --check` / `--write` for the verifier probe; `git diff --check` | PASS after formatting. |

The one canonical `./scripts/verify` gate ran before this report and verifier
catalog metadata were written. No executable candidate change followed that
gate; the focused probe and post-report catalog validation are the final
verifier checks. The canonical gate was not looped.

## Requirement evidence matrix

| Requirement | Independent evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: explicit immutable routing and contradiction checks | Live status; full route; catalog source inspection; retained catalog validator path; verifier catalog updated only with round-107 evidence. | Routing mechanics pass; release remains blocked by active evidence findings. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, active state, narrow reveal | Canonical root 238/238 and Pages 2/2; retained round-102–106 probes; candidate has no broad product architecture rewrite. | Pass for retained Chromium/PWA behavior. |
| `M7A-NAV-002`: 393px normal, 320px boundary, 200% text, reduced motion, keyboard/touch, reload/offline lifecycle | Canonical root/Pages and retained adversarial probes; real WebKit bodies reached both portrait paths but the offline error gate failed. | Retained behavior passes; cross-engine acceptance remains failed. |
| `M7A-RELEASE-001` / D-043 release honesty and exact-SHA evidence | Canonical identity; explicit native/performance BLOCKED outputs; no Chromium/native/physical substitution; exact candidate SHA named here. | Not releasable: correctable WebKit/classifier defects plus required unavailable gates. |
| `M7B-WEBKIT-001`: pinned 393x742/320x693 parity, zero page/console errors, reload/offline recovery, strict classification | Host 2/2 bodies; `.cache/m7b/webkit/round-107-independent/summary.json`; independent operation-boundary probe; raw event retention. | FAIL: V-106-001. Real host navigation message shape is not matched by the candidate correlation predicate. |
| `M7B-NATIVE-001`: VoiceOver/TalkBack names, active state, reveal, first action, settings, viewport, speech, lifecycle, manifest | Native capture and validator preserve device identity and explicit missing evidence; emitted command points to validator-consumed `operator-submission.json`; actual speech/device evidence unavailable. | BLOCKED infrastructure gate; V-106-002’s candidate repair rechecks successfully, but its catalog closure must await a PASS report. |
| `M7B-PERF-001`: five cold runs, absolute budgets, Worker, memory, offline, physical battery/thermal, authenticated frozen baseline | `.cache/m7b/performance/round-107-independent/summary.json`; two WebKit cells have five samples; raw errors and failed gates retained; Android, physical resource, and baseline trust gates remain explicit. | FAIL for the WebKit correlation defect; required physical/baseline evidence is also unverified. |
| `M7B-EVIDENCE-001`: Rule of Three, artifact manifest, cleanup, and infrastructure/blocker honesty | Independent probe; native/performance summaries; raw WebKit reports; candidate/target/build/nonce/recursion probes; retained V-102–106 probes; clean process teardown. | FAIL: V-107-001 permits malformed structured reports to PASS; V-106-001 also blocks evidence trust. |
| Retained deterministic, accounting, persistence, malformed-save, causal, Worker, PWA, offline, security, startup/install, and user-visible behavior | Canonical 312 tests, balance/build/audit lanes, root 238/238, Pages 2/2, and retained adversarial probes. | Pass for exercised retained product scope. |
| Architecture proportionality / M7B boundary | Candidate delta is M7B evidence tooling, tests, docs, config, and handoff/catalog work; no new simulation/content/navigation/schema/persistence/audio/localization/packaging feature or broad architecture rewrite. | Proportional; evidence defects remain. |
| D-043 Rule of Three | Normal: 393 WebKit/root/PWA and five-run cells. Boundary: 320, 200%/reduced-motion/touch/keyboard and operation adversaries. Lifecycle: reload/offline, malformed recovery, repeated Worker 1x/64x, native lock and process cleanup. | Exercised where available; native speech, physical resources, and authenticated frozen baseline remain unavailable. |

## Findings

### V-106-001 — Real WebKit offline navigation does not correlate with its console event

- Severity: High; blocks acceptance.
- Related requirements: `M7B-WEBKIT-001`, `M7B-PERF-001`, and
  `M7B-EVIDENCE-001`.
- Expected: the known WebKit top-level offline reload limitation may be
  classified as infrastructure only when the structured navigation failure is
  paired with exactly one matching in-window console event. Outside-window,
  additional, pageerror, location-mismatched, and marker-containing assertion
  events must remain uncorrelated and fail the gate.
- Actual: on the real host WebKit, the console event is exactly
  `Failed to load resource: WebKit encountered an internal error`, while the
  structured navigation message is `Error: page.reload: WebKit encountered an
  internal error ...`. `tests/e2e/m7b-webkit.spec.ts:153-159` requires the
  navigation message to include the full console prefix, so the exact pair is
  rejected. Both portrait tests fail `expect(evidence.correlationFailure).toBeNull()`.
  The performance collector retains the raw event but records both
  `page-errors: FAILED` and `offline-navigation-correlation: FAILED` in each
  five-run WebKit cell instead of a documented correlated infrastructure
  result.
- Reproduction:
  `E2E_WEBKIT_PORT=43712 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-107-independent npm run test:e2e:webkit`.
  Performance reproduction is the `collect:mobile-performance` command above.
- Concrete evidence: `summary.json` reports result `FAILED`, `testsSeen: 2`,
  and the two failed assertion records; the independent round-107 probe reports
  normal exact correlation works, while outside-window/additional/pageerror/
  assertion boundaries remain uncorrelated. This is a real-host mismatch, not
  a sandbox launch blocker.
- Blocks PASS: yes.

### V-107-001 — Structured WebKit classifier accepts incomplete results as PASS

- Severity: High; blocks acceptance.
- Related requirement: `M7B-EVIDENCE-001` (also gates trust in
  `M7B-WEBKIT-001`).
- Expected: a structured report is PASS only when every observed test has a
  recognized successful result; missing results, empty result arrays, skipped
  results, and unknown result statuses must fail closed. Structured
  infrastructure annotations may produce BLOCKED only alongside a recognized
  successful result.
- Actual: `scripts/webkit-result-classifier.mjs:66-102` counts an expected test
  but only checks known failure statuses. It returns `PASS` for an expected test
  with no results, an empty results array, a skipped result, or an unknown result
  when exit code is zero. The independent probe records exactly
  `{noResults: PASS, emptyResults: PASS, skippedResult: PASS, unknownResult: PASS}`.
  Valid passed evidence remains PASS, assertion-marker evidence remains FAILED,
  and a passed result with an infrastructure annotation remains BLOCKED; the
  defect is the incomplete-result fail-open boundary.
- Reproduction: `node .agent/verification/round-107-adversarial.mjs`, or call
  `classifyWebKitReport` with the four malformed structured reports constructed
  by `probeClassifier` in that probe.
- Concrete evidence: the probe exits nonzero solely for `V-107-001`, with the
  expected/actual map above; no production implementation was changed by the
  verifier.
- Blocks PASS: yes.

## Prior findings and adversarial seam evaluation

- V-106-002 was independently rechecked. Native capture blockers now name the
  validator-consumed `operator-submission.json`; generated `checklist.json` is
  identified as supporting output. Because this round is FAIL, catalog status
  remains active until a future PASS report can be the required resolution
  report; the candidate behavior itself no longer reproduces that defect.
- V-105-001 and V-105-002 remain non-reproducing in retained round-105/106
  probes: accepted-tree/child identity, nonce, target/build, recursion, marker
  collision, and raw error retention boundaries hold. V-102-001..006 and
  V-103-001..003, V-104-001..003 retained probes returned no findings.
- Normal operation correlation succeeds with one exact in-window event.
  Outside-window errors, additional in-window errors, pageerrors, and
  assertion/marker text remain retained and uncorrelated. The candidate’s real
  host navigation-message predicate is the narrower failing seam.

## Unverified areas

- Native VoiceOver speech, iOS actual CSS viewport, TalkBack speech, Android
  actual CSS viewport, physical Android Chrome cold-run performance, memory/CPU,
  battery/thermal observation, and authenticated same-device frozen baseline.
- WebKit offline top-level reload without the host internal error; cache/controller
  recovery executed, but the candidate’s correlation handling fails before a
  documented BLOCKED outcome.
- Hosted exact-SHA aggregation, deployment, live build identity, and post-deploy
  smoke remain release-owner gates.

## Residual risks

Do not release this candidate as M7B-complete. The implementation must accept
the actual structured WebKit navigation error shape only within the exact
operation/cardinality/location boundary, while preserving the independent
outside/additional/pageerror/marker failures. The classifier must require a
recognized successful result for every structured test and fail closed on
missing, skipped, or unknown results. Then rerun the WebKit, performance,
native, physical-device, and authenticated-baseline gates and obtain a fresh
PASS verifier report.
