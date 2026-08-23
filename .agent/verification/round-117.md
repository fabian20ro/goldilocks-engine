# Verification Round 117 — M7D receipt reconciliation / M7B preflight

Candidate SHA: `d69cbead46adad106dcd462bc2c5ef6c363f50bc`

VERDICT: PASS

## Scope and authority

- Evaluated exactly the supplied candidate. `git rev-parse HEAD` matched the
  candidate before any verifier edit; the initial worktree was clean.
- Read `AGENTS.md`, `.codex/agents/verifier.toml`, live `./scripts/agent-status`,
  `.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`,
  `.agent/verification/catalog.json`, D-046 through D-048, `plan.md` §24.6,
  the M7D section of `.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`, and
  immutable rounds 115 and 116.
- Independent checklist: exact M7D save-support and sealed-recovery contract;
  deterministic fixture generation; retained M7A/M7C/Worker/economy/PWA
  boundaries; exact deployment-receipt/status reconciliation; and honest
  separation of the parked M7B native/commercial gate.
- Candidate diff audit versus the accepted Round-116 verifier commit contains
  only `.agent/HANDOFF.md`. No production, test, fixture, package, build,
  workflow, or runtime implementation path changed in this candidate.

## Environment and setup

- macOS Darwin 25.6.0 arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-local npm and Playwright caches were used. The first unprivileged
  browser launch was blocked by macOS MachPort sandbox permissions before any
  test executed. The same canonical command was then rerun with the narrowly
  scoped host permission required by the pinned Chromium binary; all browser
  lanes completed and managed processes were cleaned up by the harness.
- The development profile intentionally reports the M7B commercial gate as
  parked/blocked under D-044. It does not substitute Chromium evidence for the
  unavailable native/WebKit/physical evidence.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | Exact candidate SHA matched; initial tree clean. |
| `./scripts/agent-status` | Parsed cleanly; latest accepted immutable report remained Round 116 and the current descendant was correctly identified as the next fresh-verifier gate. |
| `./scripts/agent-status --json` | PASS; reported `head=d69cbead...`, `deployment_state=recorded`, deployed candidate `caa334945...`, `verification_state=unverified-later-changes`, and `next_gate_target_sha=d69cbead...`. |
| `git diff --check caa334945f5b0a89bc1452609e9b118ba042df01..d69cbead46adad106dcd462bc2c5ef6c363f50bc` | PASS; candidate diff is documentation-only and whitespace-clean. |
| `sh -n scripts/agent-status`; `npm run validate:verification-catalog` | PASS; catalog validated 116 immutable reports, 128 findings, and 13 active requirements. |
| `npx vitest run --coverage=false src/test/agentStatus.test.ts --reporter=dot` | PASS: 1 file, 9 tests. |
| `npm run generate:save-fixtures` (twice) | PASS both runs; committed fixture corpus remained byte-identical and the worktree stayed clean. |
| `npm run test:save-stability` | PASS: 2 files, 37 tests. |
| Unprivileged `./scripts/verify --profile=development` | Browser launch failed before test execution with macOS `MachPortRendezvousServer ... Permission denied`; treated as infrastructure, not candidate behavior. |
| Elevated canonical `VERIFY_EVIDENCE_DIR=.cache/verification/round-117-verifier-development-final-elevated npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify --profile=development` | PASS: catalog/setup/format/lint/typecheck; 77 files/401 unit tests; all balance lanes; build; production audit 0 vulnerabilities; root browser/PWA 244/244; Pages/offline 2/2. The summary explicitly recorded `m7b-commercial-gate=blocked (parked under D-044)` and `verification=development-candidate`. This was the one final canonical gate. |
| `M7B_NATIVE_ALLOW_BLOCKED=1 M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-117-verifier-preflight M7B_NATIVE_PORT=43121 npm run test:native-a11y` | Exit 0 with truthful `BLOCKED`: CoreSimulatorService unavailable and `adb devices -l` contained no authorized device. Candidate SHA in the emitted evidence matched `d69cbead...`. |
| `curl -fsSL https://fabian20ro.github.io/goldilocks-engine/build-info.json` | PASS; live HTTP identity remained version `45330c2e3a0014a55b93`, scope `/goldilocks-engine/`, and matching shell cache name. |
| `git ls-remote origin refs/heads/main` | PASS; remote `main` remained exactly `caa334945f5b0a89bc1452609e9b118ba042df01`, the accepted/deployed Round-116 candidate. |
| `gh run view 32582068882 ...` and `gh run view 32582472823 ...` | PASS; hosted Verify and Pages runs both completed successfully with the exact accepted candidate SHA. |
| Final `git status --short --branch`; `git diff --check`; `git rev-parse HEAD` | Before report creation: clean candidate tree and exact candidate SHA. |

The unprivileged browser failure is fully explained by host launch policy and
was resolved by the approved scoped retry; it is not hidden or counted as a
candidate defect. No executable verifier artifact changed after the elevated
canonical gate; this report is metadata written afterward.

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| M7D-SAVE-001 — only the eight audited schema/content pairs are supported; malformed, schema 1/2, unknown, and future input fail closed | Accepted Round-116 report for the unchanged product candidate; current 401-test unit lane; `npm run test:save-stability`; catalog and source audit | Pass |
| M7D-SAVE-001 — supported and boundary fixtures carry provenance, checksums, and invariants; generator is reproducible | Two current generator runs with no tracked diff; current fixture corpus; Round-116 independent fixture audit | Pass |
| M7D-SAVE-002 — one sealed restore boundary, deterministic migration, idempotent serialize/restore, retention, unique IDs, and no duplicate effects | Current 37-test save-stability lane; canonical 401-test suite; immutable Round-116 regression evidence; no changed production path | Pass |
| M7D-SAVE-002 — invalid integrity is checked before migration; bounded backup, truthful reset status, no salvage, and no partial future interpretation | Current save tests; canonical 244/244 root browser/PWA lane including save recovery and reload/offline cases; immutable Round-116 evidence; no changed product path | Pass |
| M7D Rule of Three — normal sealed migration, malformed/adversarial recovery boundary, and Worker/reload/offline/PWA lifecycle at 320/393 | Save-stability tests, retained adversarial browser tests at 320/393, canonical root/Pages lanes, and current generator check | Pass |
| Retained M7A navigation, M7C presentation/density, Worker, economy, accessibility, and PWA/update boundaries | Canonical development gate: all 401 unit tests, all balance lanes, 244/244 root browser tests, and 2/2 Pages/offline tests | Pass; no new defect observed |
| M7A exact deployment/release record and status-routing integrity | Receipt parser/status tests 9/9; current JSON status; remote main, live build-info, and both hosted run identities independently reconfirmed | Pass |
| M7B native/commercial evidence honesty | Native preflight emitted `BLOCKED` for unavailable CoreSimulatorService and absent authorized Android; development profile retained the parked gate and made no substitute claim | Pass for the documentation/tooling boundary; commercial gate remains open |
| Candidate semantic boundary — Round-117 changes do not alter product behavior or silently claim acceptance/deployment | Exact diff audit; handoff explicitly says no product verifier finding is resolved and that Round 117 is not deployed; canonical product lanes remain green | Pass |

## Findings

None. The candidate is documentation-only, its receipt/status claims reconcile
with the repository and external identities, the canonical development gate is
green, and no unresolved finding violates the active M7D requirements.

## Unverified areas and residual risks

- Full-release M7B WebKit, native VoiceOver/TalkBack, physical-device
  performance, battery/thermal, and commercial release-owner evidence remain
  explicitly parked/blocked under D-043/D-044. This PASS does not close that
  gate or authorize deployment of the Round-117 documentation candidate.
- The native preflight could not obtain an iOS Simulator or authorized USB
  Android device in this environment; speech-level VoiceOver/TalkBack evidence
  therefore remains unavailable and must be collected interactively later.
- The accepted live Pages deployment remains Round-116 candidate
  `caa334945...`; Round 117 itself is not deployed by this verification.
- The development setup reports dev-dependency audit warnings, while the
  canonical production audit passed with zero vulnerabilities. This is a
  retained dependency-maintenance risk, not a candidate defect.
- Schema 3–6 fixture seals remain audited deterministic reconstructions rather
  than surviving historical byte captures, as recorded by D-046/D-047.
- Recovery backup remains best-effort under storage quota/unavailability, as
  authorized by D-047 and covered by the retained tests.
