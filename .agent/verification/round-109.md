# Verification round 109 — M7B OIV-first release verification

Candidate SHA: `b6fbe0e22041ae3130abab8842b543e643a67cab`

Captured `git rev-parse HEAD` before any verifier file change: the exact
candidate SHA above. The candidate worktree was clean at capture. No
production implementation file was changed by this verifier.

VERDICT: BLOCKED

## Scope and authority

The full release route was required for this broad M7B verification. I read
`AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, the complete
`plan.md`, `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`,
`.agent/HANDOFF.md`, the verification catalog, and the complete relevant
verification archive. Routing records, handoff, implementation-authored tests,
comments, and claims were treated as untrusted navigation.

Independent checklist:

- exact candidate identity, clean setup/startup/cleanup, pinned dependencies;
- retained eight-tab navigation/PWA, persistence, malformed state, offline,
  security, and user-visible regressions;
- real-host pinned WebKit at 393x742 and 320x693, reduced motion, 200% text,
  keyboard/touch, reload/offline, raw page/console errors, and exact
  operation-scoped correlation;
- fail-closed structured WebKit classification and canonical result
  propagation;
- native VoiceOver/TalkBack identity, labels, active state, reveal, first
  action, settings, actual CSS viewport, speech artifacts, and checksums;
- five-run performance cells, LCP/INP/CLS budgets, Worker 1x/64x, memory,
  offline startup, physical battery/thermal, and authenticated frozen
  same-device baseline;
- Rule of Three, retained regressions, artifact manifests, proportionality,
  and process cleanup.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; browser and npm caches were kept in
  ignored repository-local `.cache/` paths.
- Sandboxed WebKit launch aborted before test bodies. The same pinned lane was
  rerun with scoped host authority; both WebKit tests executed at both required
  portrait widths.
- The iOS simulator was harness-booted and shut down. The attached Pixel 6a
  was detected but remained locked/non-interactive; no Android browser or
  native speech claim was fabricated.
- The final canonical gate ran after executable verifier artifacts were ready.
  This report was the only post-gate write; no executable artifact changed, so
  the gate was not rerun in a loop.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | Supplied candidate SHA matched before writes; initial worktree clean. |
| `./scripts/agent-status` | Parsed cleanly; live state identified the prior blocked round and required a fresh independent verifier. |
| Required full authority and archive reads | Completed; D-043/M7B route used. |
| `npm run validate:verification-catalog` | Passed: 108 immutable reports, 114 findings, 8 active requirements. |
| `node .agent/verification/round-102-adversarial.mjs` through `round-107-adversarial.mjs` | All passed with `findings: []`; prior trust-boundary seams did not recur. |
| `node .agent/verification/round-109-adversarial.mjs` | Passed independently: Chromium and WebKit at 320x693 and 393x742; navigation, target geometry, 200% text, keyboard/touch, malformed-save recovery, offline shell/controller, and raw-error checks. WebKit emitted only the known exact offline internal-error pair. |
| `npx prettier --write .agent/verification/round-109-adversarial.mjs`; `node --check ...`; `npx eslint ...` | Passed; fresh verifier probe is formatted, syntactically valid, and lint-clean. |
| `npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts --pool=forks --maxWorkers=1` | Passed: 5/5. |
| `npm run test:e2e` | Passed: pinned Chromium root suite 238/238. |
| Sandboxed `E2E_WEBKIT_PORT=43901 ... npm run test:e2e:webkit` | WebKit process aborted before test bodies; structured lane failed closed rather than being accepted. |
| Host `E2E_WEBKIT_PORT=43901 M7B_WEBKIT_EVIDENCE_DIR=.cache/m7b/webkit/round-109-host npm run test:e2e:webkit` | Result `BLOCKED`; 2/2 tests executed across 320x693 and 393x742, with zero assertion failures and one exact operation-scoped `page.reload`/console WebKit internal-error pair per offline test. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 ... npm run test:native-a11y` | Honest `BLOCKED`; iOS simulator setup/restore/cleanup evidence present, Android Pixel 6a lock policy recorded, and no operator speech or actual CSS viewport submission supplied. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 ... npm run test:native-a11y:validate` | Honest `BLOCKED`; validator consumed `operator-submission.json`, reported missing identity/settings/viewport/rows/speech fields, and did not fabricate them. |
| Five-run host collector: `M7B_PERFORMANCE_BROWSERS=chromium,webkit M7B_PERFORMANCE_RUNS=5 ... npm run collect:mobile-performance` | Four cells (`chromium`/`webkit` × 320/393), five samples each, exact viewport samples, LCP/INP/CLS, startup/offline, Worker 1x/64x, memory/transfer, raw events, and artifact digests recorded. Chromium metrics had no errors; WebKit had only the correlated offline blocker. Physical Android battery/thermal and authenticated same-device baseline were blocked. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-109-final-independent ... ./scripts/verify` | Exit `2`, expected canonical `BLOCKED`. Catalog/setup/format/lint/typecheck/unit/balance/build/production audit/root Chromium/Pages passed; WebKit/native/performance blocked and propagated as blocked. |
| Focused process cleanup query after browser/native/performance lanes | No matching verifier-launched `run-e2e`, preview, native, or performance process remained. |

## Requirement evidence matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001` | Clean status capture, live status parser, full authority/archive route, catalog validation, and immutable report path. | Satisfied. |
| `M7A-NAV-001` / `M7A-NAV-002` | Root Chromium 238/238, Pages 2/2, retained balance/persistence/malformed/offline probes, and fresh independent navigation/touch/keyboard probe at both portraits. | Retained behavior satisfied in exercised local lanes; release remains gated by active M7B evidence. |
| `M7A-RELEASE-001` | Exact candidate identity and canonical gate result preserved. | Not closable until active M7B evidence and hosted exact-SHA gates exist. |
| `M7B-WEBKIT-001` | Host WebKit at 320x693 and 393x742 exercised normal, malformed, reduced-motion, 200%-text, touch/keyboard, save/cache, and offline paths. Exact reload message `WebKit encountered an internal error` paired with exact console message `Failed to load resource: WebKit encountered an internal error`; no uncorrelated errors or correlation failures. | Correct correlation/classifier behavior; known WebKit offline top-level reload limitation is an external `BLOCKED` gate. |
| `M7B-NATIVE-001` | Native harness records candidate/build, simulator lifecycle, settings checksums, device lock policy, artifact schema, and validator recovery path. | `BLOCKED`: operator VoiceOver/TalkBack speech and actual CSS viewport artifacts are absent; physical Android is locked. |
| `M7B-PERF-001` | Four browser/portrait cells × five cold samples with Web Vitals, startup/offline, Worker 1x/64x, memory where supported, transfer, raw events, exact viewports, and digests. | `BLOCKED`: physical battery/thermal, Android Chrome, and authenticated same-device frozen baseline are unavailable; WebKit offline limitation remains correlated and blocked. |
| `M7B-EVIDENCE-001` | Classifier matrix and adversarial probes pass; canonical summary distinguishes PASS/BLOCKED/FAILED; artifact manifests include checksums and cleanup evidence. | Evidence tooling is sound; required external native/device/baseline evidence is unavailable. |
| D-043 Rule of Three | Normal navigation/first action at 393px, closest 320px 200%-text/reduced-motion and malformed-save boundary, and reload/offline/repeated five-run lifecycle were exercised where available. | Browser normal/boundary/lifecycle evidence present; native/physical lifecycle is infrastructure-blocked. |
| Retained deterministic/accounting/persistence/malformed/PWA/security behavior | 314 unit tests, all balance lanes, production audit with zero vulnerabilities, root 238, Pages 2, and retained independent probes. | Satisfied for exercised retained scope. |
| Architecture proportionality and M7B boundary | Candidate change is verifier/evidence tooling, tests, docs, config, and handoff bookkeeping; no production game behavior, new system, navigation, schema, telemetry, audio, localization, or packaging change. | Satisfied. |

## Findings

No correctable candidate defect was found. Prior active findings V-102-001
through V-107-001 were independently rechecked; the fresh adversarial probe and
canonical lanes found no recurrence. The unavailable evidence below is an
infrastructure/operator condition, not a candidate implementation failure.

## Blocking infrastructure and unverified areas

- Native VoiceOver/TalkBack speech transcripts and actual CSS viewport
  observations require an operator session. The validator correctly consumes
  `operator-submission.json`; AX/UIAutomator output is supporting evidence only.
- The attached Pixel 6a is locked/non-interactive, preventing native TalkBack,
  physical Chrome, and physical battery/thermal evidence. The available
  Android emulator inventory has no configured AVD.
- No authenticated same-device frozen baseline was captured against the D-043
  accepted SHA/build. Caller-supplied or persisted baseline receipts were
  rejected; the same-invocation capture path remains blocked.
- WebKit real offline top-level reload emits the known internal error while
  cached-shell/controller/save proof succeeds. The exact pair is
  operation-scoped and classified `BLOCKED`; unrelated, pageerror,
  outside-window, and marker-collision events remain failures under the
  independent classifier probes.
- Hosted exact-SHA aggregation, deployment, live build identity, and
  post-deploy smoke were not run; they remain release-owner gates.

## Residual risks and required unblock action

Do not release this candidate as M7B-complete. Provide an interactive iOS
Safari/VoiceOver session with exact 320x693 and 393x742 CSS viewport records,
unlock/authorize the USB Android and run Chrome/TalkBack at both portraits, and
record the required checksummed speech/screenshot submission. Then rerun the
performance lane on that physical device with
`M7B_PERFORMANCE_DEVICE_ID=<serial>` and no caller baseline file so the
nonce-authenticated frozen D-043 baseline capture and battery/thermal gates can
complete. Re-run the canonical gate and obtain a fresh independent PASS report
before hosted exact-SHA verification/deployment.
