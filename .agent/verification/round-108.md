# Verification round 108 — M7B OIV-first release evidence

Candidate SHA: `fc44ff125100fc1adf8a31b8cf3766996abcf3b7`

Captured `git rev-parse HEAD` before this report write: the exact candidate
SHA above. Initial worktree was clean. No production implementation file was
changed by this verifier.

VERDICT: BLOCKED

## Scope and authority

Full release/M7B/archive route used. Read `AGENTS.md`, the verifier role,
live `./scripts/agent-status`, routing records, the complete `plan.md`,
`.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`,
catalog, accepted historical reports, and active round-102 through round-107
reports/probes. Routing records, handoff, implementation tests, comments, and
claims were treated as untrusted navigation.

Independent checklist:

- exact SHA, clean setup/startup/cleanup, local pinned dependencies;
- retained eight-tab navigation/PWA, deterministic, persistence, malformed,
  offline, security, and user-visible regressions;
- real-host WebKit at 393x742 and 320x693, reduced motion, 200% text,
  keyboard/touch, reload/offline, raw page/console errors and exact
  operation-scoped correlation;
- fail-closed structured WebKit classifier and canonical PASS/BLOCKED/FAILED
  propagation;
- native VoiceOver/TalkBack identity, names, active state, reveal, first
  action, settings, actual CSS viewport, speech artifacts and checksums;
- five-run performance cells, Web Vitals budgets, Worker 1x/64x, memory,
  offline startup, physical battery/thermal, authenticated frozen baseline;
- Rule of Three, retained regressions, artifact manifests, proportionality,
  and process cleanup.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm/browser caches remained in
  ignored repository-local `.cache/` paths.
- Sandboxed WebKit launch aborted before test bodies. The identical pinned
  lane was rerun with scoped host authority; both test bodies executed at both
  required portraits.
- Native harness, performance collector, Playwright contexts, preview
  servers, and final canonical lanes performed teardown. Final summary:
  `.cache/verification/round-108-final-independent/summary.txt`.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | Exact supplied SHA matched before writes; initial tree clean. |
| `./scripts/agent-status` | Parsed cleanly; live state was unresolved round-107 FAIL at the supplied candidate. |
| Required full authority/archive reads | Completed; D-043/M7B route used. |
| `npm run validate:verification-catalog` | Passed: 107 immutable reports, 114 findings, 8 active requirements. |
| `node .agent/verification/round-102-adversarial.mjs` through `round-107-adversarial.mjs` | All passed with `findings: []`; V-106-001 and V-107-001 seams did not recur. |
| Independent inline classifier matrix | Passed: valid result `PASS`; empty/skipped/unknown/failed results `FAILED`; structured infrastructure annotation `BLOCKED`. |
| Sandboxed `E2E_WEBKIT_PORT=43820 ... npm run test:e2e:webkit` | Infrastructure launch abort before bodies; structured report was correctly `FAILED`, not silently accepted. |
| Host-authorized `E2E_WEBKIT_PORT=43821 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-108-host npm run test:e2e:webkit` | Both portraits executed; `BLOCKED` with zero structured failures and exactly one correlated offline navigation/console pair per test. Cached shell, save, geometry, reduced-motion, text-scale, keyboard/touch checks completed. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 ... npm run test:native-a11y` and `... npm run test:native-a11y:validate` | Honest `BLOCKED`: no operator VoiceOver/TalkBack speech/actual CSS viewport submission; Pixel 6a locked; validation consumed `operator-submission.json` and did not fabricate evidence. |
| Five-run host performance collector (`M7B_PERFORMANCE_BROWSERS=chromium,webkit`, `M7B_PERFORMANCE_RUNS=5`) | Four cells (`chromium`/`webkit` × 320/393), five samples each; absolute browser metrics and Worker fields recorded; correlated WebKit offline events, physical device, and authenticated baseline were `BLOCKED`; no uncorrelated page/console error finding. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-108-final-independent ... ./scripts/verify` | Exit `2`, expected canonical BLOCKED. Catalog/setup/format/lint/typecheck/unit/balance/build/production audit/root Chromium/Pages passed; WebKit/native/performance were blocked and propagated as blocked. |
| Independent final summary audit | Passed: all expected lane states, exact candidate SHA, 2 WebKit tests, 4×5 performance cells. |

## Requirement evidence matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001` | Catalog validator; full routing/archive read; exact report paths. | Satisfied. |
| `M7A-NAV-001` / `M7A-NAV-002` | Canonical root `238/238`, Pages `2/2`, retained navigation probes, and host WebKit normal/boundary execution. | Retained Chromium/PWA behavior satisfied; WebKit lifecycle remains infrastructure-blocked. |
| `M7A-RELEASE-001` | Release matrix and exact SHA are preserved; canonical gate truthfully propagates M7B blockers. | Not closable until active M7B evidence exists. |
| `M7B-WEBKIT-001` | Host WebKit 393x742 and 320x693; reduced motion, 200% text, touch/keyboard, geometry, reload/save/cache recovery; raw events show exact navigation message `WebKit encountered an internal error` paired with exact console message `Failed to load resource: WebKit encountered an internal error`, one event in-window and no extras. | Correct correlation/classifier behavior; known WebKit offline top-level navigation limitation is an external `BLOCKED` gate. |
| `M7B-NATIVE-001` | Native capture/validator records device/build/settings/checksum schema and exact blocker recovery command. | `BLOCKED`: operator speech and actual CSS viewport absent; Android is locked. |
| `M7B-PERF-001` | Four browser/portrait cells × five samples; LCP/INP/CLS, startup/offline, Worker 1x/64x, memory/transfer, raw events, artifact digests retained. | `BLOCKED`: physical battery/thermal and authenticated same-device frozen baseline unavailable; WebKit known offline limitation retained as blocked. |
| `M7B-EVIDENCE-001` | Classifier matrix fails closed; V-102..V-107 probes pass; canonical summary distinguishes PASS/BLOCKED/FAILED; artifacts have checksums and cleanup was observed. | Evidence tooling passes; required external native/device/baseline evidence is unavailable. |
| D-043 Rule of Three | Normal 393px first-action/navigation, 320px 200%-text/reduced-motion reveal boundary, reload/offline and repeated five-run lifecycle exercised where available. | Normal/boundary browser evidence present; native/physical lifecycle blocked by infrastructure. |
| Retained deterministic/accounting/persistence/malformed/PWA/security behavior | 314 unit tests, all balance lanes, production audit (0 vulnerabilities), root 238, Pages 2, retained adversarial probes. | Satisfied for exercised retained scope. |
| Architecture proportionality and M7B boundary | Candidate delta is evidence tooling, tests, docs, config, handoff/catalog metadata; no production game behavior, new system, navigation, schema, telemetry, audio, localization, or packaging change. | Satisfied. |

## Findings

No correctable candidate defect was found. Prior active findings V-106-001
(real-host WebKit correlation) and V-107-001 (incomplete structured-result
classifier) were independently rechecked and did not reproduce on this
candidate. This BLOCKED report is not a PASS resolution report, so catalog
active status for those historical findings remains unchanged.

## Blocking infrastructure and unverified areas

- Native VoiceOver/TalkBack speech transcripts and actual CSS viewport
  observations require an operator session. The validator correctly names and
  consumes the retained `operator-submission.json` input; AX/UIAutomator
  output is supporting evidence only.
- The attached Pixel 6a is locked/non-interactive, preventing native TalkBack
  and physical Chrome performance/battery/thermal evidence.
- No authenticated same-device frozen baseline was captured against the D-043
  accepted SHA/build. Caller-supplied or persisted baseline receipts were
  rejected; the same-invocation capture path remains blocked.
- WebKit's real offline top-level reload emits the known internal error even
  while cached-shell/controller/save proof succeeds. The exact pair is
  operation-scoped and classified as `BLOCKED`; unrelated/additional,
  pageerror, outside-window, and marker-collision events remain failures.
- Hosted exact-SHA aggregation, deployment, live build identity, and
  post-deploy smoke were not run; they remain release-owner gates.

## Residual risks and required unblock action

Do not release this candidate as M7B-complete. To continue, provide an
interactive iOS Safari/VoiceOver session with exact 320x693 and 393x742 CSS
viewport records, unlock/authorize the USB Android and run Chrome/TalkBack at
both portraits, and record the required checksummed speech/screenshot
submission. Then rerun the performance lane on that physical device with
`M7B_PERFORMANCE_DEVICE_ID=<serial>` and no caller baseline file so the
nonce-authenticated frozen D-043 baseline capture and battery/thermal gates
can complete. Re-run the canonical gate and obtain a fresh independent PASS
report before hosted exact-SHA verification/deployment.

