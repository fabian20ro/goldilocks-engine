# Round 115 verification — D-047 sealed-save recovery

Candidate SHA: `7bc2e69cc0d5ca5b144828d841a97d9acaa0edfc`

VERDICT: FAIL

## Environment and setup

- Darwin 25.6.0 arm64; Node `v26.7.0`; npm `11.19.0`.
- Candidate `HEAD` was captured before verifier edits and matched the supplied
  SHA. No production implementation files were changed.
- Read the full authority route: `AGENTS.md`, verifier role, live status,
  current scope, index, complete `plan.md`, complete decisions, release
  acceptance, catalog, handoff, immutable rounds 110–114, regression/archive
  sources, and the D-047 decision.
- Audited all 73 candidate-changed paths. Removed stale/unsealed salvage
  assertions were replaced with reset assertions; adversarial fixtures retain
  invalid seals. Candidate browser reseal helpers are used for deliberately
  valid edited setup records and historical migration setup, not adversarial
  tamper cases.
- Repository-local pinned Playwright Chromium was used. The first unprivileged
  launch was blocked by macOS Mach-port sandboxing; the scoped elevated retry
  launched successfully. Playwright-managed servers and browser processes
  cleaned up after each lane.

## Commands executed and results

| Command | Result |
| --- | --- |
| `./scripts/agent-status` | Passed; exact candidate HEAD, latest round 114 failure, next fresh verifier. |
| `git diff --check` | Passed. |
| `npm run validate:verification-catalog` | Passed; 114 immutable reports, 127 findings, 13 active requirements. |
| `npm run generate:save-fixtures` | Exited 0, but rewrote two committed provenance strings; see V-115-001. Candidate fixture bytes were restored before the final gate. |
| `npm run test:save-stability` | Passed; 2 files, 37 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts src/simulation/verifierRound112.test.ts src/simulation/verifierRound113.test.ts src/simulation/verifierRound114.test.ts src/simulation/verifierRound115.test.ts --reporter=dot` | Passed; 5 files, 33 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound115.test.ts --reporter=dot` | Passed; 6 independent trust-boundary tests. |
| `E2E_PORT=44316 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- tests/e2e/verifier-round-115.spec.ts --workers=1 --reporter=line` | Passed; 2/2 at 320 and 393 CSS pixels, stale seal reset, bounded backup, reload, offline reload, no page/console errors. |
| `E2E_PORT=44315 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- --workers=1 --reporter=line` | Passed; 242/242 retained root tests on the exact candidate before verifier browser additions. |
| `E2E_PORT=44317 VERIFY_EVIDENCE_DIR=.cache/verification/round-115-development-final npm_config_cache=$PWD/.cache/npm PLAYWRIGHT_BROWSERS_PATH=$PWD/.cache/ms-playwright ./scripts/verify --profile=development` | Passed; catalog, setup, format, lint, typecheck, 77 files/400 unit tests, balance, build, production audit (0 production vulnerabilities), 244/244 root browser tests, and 2/2 Pages offline tests. M7B commercial gate explicitly parked by development profile. |

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| M7D-SAVE-001 — exact audited schema/content support map, provenance, checksums, invariants, and malformed/unsupported/future boundaries | `src/simulation/saveSupport.ts`; eight supported fixtures; boundary fixtures; `src/simulation/saveFixtures.test.ts`; independent round-115 FNV sealing and exact-pair tests; catalog gate | Behavioral boundary coverage passes. Generator/committed-fixture reproducibility remains unresolved under V-115-001. |
| M7D-SAVE-002 — original seal required before migration; valid sealed schema 3–7 migration, deterministic reseal, idempotence, retention, and no duplicate effects | `src/simulation/engine.ts`; `npm run test:save-stability`; 33 retained/independent tests; full unit suite | Pass for exercised candidate behavior. All eight supported generations migrate and reload idempotently; absent, stale, and invalid seals reset before progression reads. |
| M7D-SAVE-002 — malformed, tampered, unsupported, and future recovery with one bounded raw backup and truthful status | boundary harness; independent round-115 unit tests; 244 root browser tests; verifier-owned stale-seal browser probe | Pass for exercised candidate behavior. Status names invalid integrity/reset/next action and the raw backup remains bounded and stable across offline reload. |
| M7D Rule of Three — normal, closest malformed/adversarial boundary, lifecycle neighbor | valid sealed migration; independently resealed-but-malformed and invalid-seal records; Worker/reload/offline/PWA browser lanes at 320/393 | Pass for exercised candidate behavior. |
| Existing M7A/M7C navigation, density, accessibility, Worker, economy, and PWA regression boundary | final canonical 244/244 root tests and 2/2 Pages tests | No new behavioral defect observed. |
| Parked M7B commercial/native/WebKit/device-performance/release-owner gate | D-044 development profile; final canonical explicitly reports parked gate | Not applicable to this development-candidate verdict; remains unverified/parked. |

## Findings

### V-115-001 — save-fixture generator is not reproducible against the committed corpus

- Severity: Medium.
- Related plan requirement: M7D-SAVE-001; D-047 fixture derivation and
  reproducible `npm run generate:save-fixtures` workflow.
- Expected behavior: running the documented generator on the candidate must
  reproduce the committed `fixtures/save-fixtures/*.json` bytes, including
  provenance/derivation metadata.
- Actual behavior: the generator exits successfully but changes two tracked
  fixture files. `scripts/generate-save-fixtures.ts:236-241` emits
  `"no simulation field is trusted at the reset boundary."`, while
  `fixtures/save-fixtures/boundary-unsealed-current.json:8` retains
  `"safe core fields remain structurally corroborated."`. The generator also
  emits D-047 wording at `scripts/generate-save-fixtures.ts:263-268`, while
  `fixtures/save-fixtures/boundary-unsupported-schema.json:8` retains the
  D-046 wording. Payloads and checksums are unchanged; provenance bytes are
  nevertheless non-idempotent.
- Exact reproduction: from the candidate SHA, run
  `npm run generate:save-fixtures`; observe `git diff -- fixtures/save-fixtures/boundary-unsealed-current.json fixtures/save-fixtures/boundary-unsupported-schema.json`.
  The command was run during this verification, and the two files were
  restored to the exact candidate bytes before the final canonical gate.
- Concrete evidence: the generator source and the two committed fixture lines
  named above; the generator command exited 0 while producing the diff.
- Blocks PASS: yes. This is a correctable verification-tooling/fixture defect,
  not an infrastructure limitation.

No additional correctable product or verification defects were observed.

## Unverified areas

- Full-release M7B WebKit, native VoiceOver/TalkBack, physical-device
  performance, battery/thermal, hosted exact-SHA deployment, and release-owner
  checks remain explicitly parked under D-044 and were not invoked by the
  development profile.
- The candidate’s deterministic FNV seal is the D-047-authorized integrity
  mechanism; this verification does not treat it as cryptographic
  authentication.

## Residual risks

- Recovery backup persistence remains best-effort under storage quota or
  storage unavailability, as authorized by D-047; the candidate reports that
  condition without blocking startup and the focused storage-failure tests
  passed.
- The final canonical gate is valid for candidate production behavior plus the
  committed verifier tests, but the generator/fixture mismatch must be
  corrected and reverified before release acceptance.
