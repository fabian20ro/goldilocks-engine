# Candidate handoff — Milestone 7B simulator evidence/tooling

Implementation base: `1096cfd608fb4f0357c2e0b1d8553326de76a79f`.
Candidate commit: recorded by the Orchestrator from the final clean Git SHA.
No immutable report, `plan.md`, decision, scope map, or verification catalog
was edited.

## Implemented behavior summary

- Native harness waits a bounded, recorded four seconds after iOS Simulator
  Safari or unlocked Android Chrome launch before capture. Override with
  `M7B_NATIVE_BROWSER_SETTLE_MS` (0–30,000 ms).
- Native capture inventories the installed Android SDK emulator with
  `emulator -list-avds`; an empty inventory is retained as informational and
  never substitutes the required unlocked USB Android.
- Locked Android is now read-only: the harness records policy/settings and an
  explicit skipped-interaction command, then does not launch Chrome, mutate
  accessibility settings, create `adb reverse`, or capture misleading browser
  artifacts.
- iOS simulators booted by the harness are shut down during cleanup; already
  booted simulators remain running. Existing settings restoration remains
  checksummed and recorded.
- Added focused contract assertions and native-evidence documentation for the
  readiness, emulator inventory, locked-device, and cleanup seams.
- No product/game behavior, simulation, persistence, navigation, telemetry,
  schema, audio, localization, packaging, or threat-model boundary changed.

## Plan requirements covered

- D-043 / M7B-NATIVE-001: available iOS Simulator Safari capture, settings
  preservation, readiness wait, artifact checksums, honest VoiceOver/manual
  speech and CSS-viewport blockers.
- D-043 / M7B-EVIDENCE-001: explicit simulator/device matrix, artifact and
  cleanup records, no physical or speech substitution.
- M7B Rule of Three: normal iOS Safari shell capture at the representative
  portrait simulator, 320/393 operator checklist boundary retained, and
  lifecycle cleanup/recovery behavior recorded. The physical lifecycle gate
  remains open.
- Retained M7A navigation/PWA and deterministic/accounting/persistence scope
  remains regression-only and unchanged.

## Verifier findings resolved / rechecked

- `node .agent/verification/round-102-adversarial.mjs` through
  `round-107-adversarial.mjs`: all `findings: []`; active trust-boundary seams
  did not recur.
- This candidate does not claim to resolve the infrastructure blockers in
  immutable round 108. Native speech, actual CSS viewport, unlocked Android,
  physical performance/battery/thermal, authenticated frozen baseline, and
  pinned WebKit offline top-level reload remain explicit blockers.

## Setup, startup, and verification commands

All npm and browser caches are repository-local and ignored:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

Focused implementation checks:

```sh
node --check scripts/native-accessibility.mjs
npx vitest run --coverage=false src/test/m7bEvidenceTooling.test.ts --pool=forks --maxWorkers=1
npm run format:check
npm run lint -- --quiet
npm run typecheck
git diff --check
node .agent/verification/round-102-adversarial.mjs
node .agent/verification/round-103-adversarial.mjs
node .agent/verification/round-104-adversarial.mjs
node .agent/verification/round-105-adversarial.mjs
node .agent/verification/round-106-adversarial.mjs
node .agent/verification/round-107-adversarial.mjs
```

Host-authorized simulator capture used for this candidate:

```sh
M7B_NATIVE_ALLOW_BLOCKED=1 \
M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-109-native-harness-repair-2 \
npm run test:native-a11y
```

Observed summary: `BLOCKED`; iOS 26.5 iPhone 17 Pro booted by harness, Safari
page-ready screenshot after `sleep 4`, settings restored, simulator shutdown
status 0; Android SDK emulator binary present with zero configured AVDs;
attached Pixel 6a keyguard-locked, browser interaction skipped, no reverse
tunnel left. Summary/artifacts are ignored under the evidence directory.

Supplemental Safari simulator cache/open-url exploration (not acceptance
evidence): start `E2E_PORT=4175 ./scripts/run-e2e`, open the URL with
`xcrun simctl openurl <booted-udid> http://127.0.0.1:4175/`, wait four seconds
and capture `xcrun simctl io <booted-udid> screenshot <path>`, stop the preview,
then repeat `simctl openurl` and capture. The stopped-server screenshot retained
the cached shell visually. It is not a proof of reload, speech, actual CSS
viewport, physical performance, or pinned Playwright WebKit parity.

Canonical full gate, once after all executable edits:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-109-final ./scripts/verify
```

## Important architectural decisions

- Evidence-only repair. Native speech remains operator-submitted; simulator
  screenshots, logs, UI trees, and Safari visual checks never become speech or
  physical-device claims.
- Readiness is a bounded explicit wait, recorded in the machine artifact, not
  an unbounded sleep or a guessed PASS. Locked-device short-circuit prevents
  false browser evidence and avoids unnecessary device mutation.
- Only a simulator booted by this harness is shut down; pre-existing operator
  simulator state is preserved. Reverse-tunnel cleanup runs only when this
  harness created the tunnel.
- Android emulator inventory is diagnostic only. Simulator CPU/memory/thermal
  observations cannot close the physical battery/thermal requirement.

## Known limitations and risks

- CoreSimulator requires host authority in the managed sandbox. Without it,
  `xcrun simctl list devices available --json` fails with CoreSimulatorService
  connection errors and the lane remains `BLOCKED`.
- The available iOS simulator Safari screenshot is supporting visual evidence;
  VoiceOver speech and actual CSS viewport still require the operator submission
  and validation command in `docs/m7b-native-accessibility.md`.
- No Android AVD is installed. The attached Pixel 6a is locked and the user is
  not near it; no unlock, TalkBack, physical Chrome, battery, or thermal claim
  is made.
- Pinned Playwright WebKit still reports the known correlated offline
  top-level navigation error while cached-shell/controller proof succeeds. The
  classifier retains it as `BLOCKED`; Safari simulator visual cache evidence
  does not replace that pinned lane.
- Same-device authenticated frozen baseline and physical performance evidence
  remain unavailable. No caller-supplied or persisted baseline is accepted.
- Deferred M7 work remains out of scope: writing/density, supported-save
  fixtures/version policy, localization, audio, packaging/distribution,
  startup/workforce/government/remote content, wrappers, and telemetry.

## Checks not run / final evidence

- Host-authorized iOS Simulator native capture: run; `BLOCKED` for manual
  VoiceOver speech and actual CSS viewport, with clean settings/simulator
  cleanup. Final artifact summary:
  `.cache/m7b/native/round-109-native-harness-repair-2/summary.json`.
- Android native capture: physical interaction intentionally not run because
  the device is locked; the harness records the exact policy output and skip.
- Safari WebDriver enablement was not performed; persistent system automation
  enablement was rejected by host policy. No claim depends on it.
- Physical Android TalkBack, battery/thermal, and authenticated same-device
  baseline: unavailable infrastructure; remain `BLOCKED`.
- Final canonical command ran once after executable edits; it exited `2` because
  M7B evidence lanes are blocked. This handoff issues no verdict or acceptance
  claim.

Final canonical result:

`VERIFY_EVIDENCE_DIR=.cache/verification/round-109-final ./scripts/verify`
→ exit `2`, blocked. Catalog/setup/format/lint/typecheck, 314 unit tests,
balance, build, production audit, root Chromium/PWA `238 passed`, and Pages
`2 passed`. WebKit ran both portraits with `BLOCKED` only for the exact
correlated offline top-level navigation pair. Native iOS Safari capture ran
with page-ready wait and simulator shutdown; VoiceOver speech/CSS viewport and
locked Android/TalkBack remain blocked. Performance recorded Chromium/WebKit ×
320/393, five runs per cell; physical battery/thermal and authenticated
same-device baseline remain blocked. Evidence:
`.cache/verification/round-109-final`.
