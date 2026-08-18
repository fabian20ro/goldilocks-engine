# Verification Round 116 — M7D fixture reproducibility

Candidate SHA: `caa334945f5b0a89bc1452609e9b118ba042df01`

VERDICT: PASS

## Scope and authority

- Evaluated exactly the supplied candidate SHA. `git rev-parse HEAD` matched
  before any verifier edit; the initial worktree was clean.
- Read the full requested route: `AGENTS.md`, verifier role, live status,
  `CURRENT_SCOPE.md`, `INDEX.md`, catalog, complete `plan.md`, complete
  decisions, release acceptance, handoff, immutable rounds 110–115, their
  retained regression tests, D-046/D-047, and the cited save/PWA authorities.
- Independent checklist: D-046's eight exact audited generations; D-047's
  sealed-only migration and fail-closed malformed/stale/unsealed/tampered/
  unsupported/future recovery; provenance/checksums/invariants; deterministic
  generation and repeated byte identity; deterministic migration and
  serialize/restore idempotence; bounded recovery backup/status; normal,
  adversarial, and reload/offline lifecycle behavior at 320/393; and retained
  M7A/M7C/PWA boundaries.
- Handoff, implementation tests, comments, routing maps, and claimed results
  were treated as untrusted navigation. No production implementation path was
  modified.

## Environment and setup

- macOS Darwin 25.6.0 arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-local npm and Playwright caches were used. The final canonical
  browser gate used the repository-pinned Playwright setup with scoped host
  launch; root/Pages servers and browser processes cleaned up.
- Candidate diff audit versus the round-115 verifier commit contains only the
  fixture generator, generated fixture provenance, fixture README, and handoff.
  No `src/`, app, Worker, package, build, or runtime implementation path was
  changed. The generator executable change only delegates JSON serialization to
  the pinned Prettier dependency.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | Exact candidate SHA matched; initial tree clean. |
| `./scripts/agent-status` | Parsed cleanly; latest immutable report was round 115 FAIL and the supplied candidate was the next gate. |
| `npm run generate:save-fixtures` (twice, with before/after directory SHA-256 snapshots) | Both runs exited 0; first and second fixture trees were byte-identical to the candidate and the fixture worktree stayed clean. |
| Independent Node fixture audit | 8 supported + 6 boundary records passed audited provenance, exact source metadata, payload SHA-256, independent FNV seals, semantic anchors, and expected recovery metadata. |
| `npm run test:save-stability` | PASS: 2 files, 37 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/closedWorldRecovery.test.ts src/simulation/verifierRound111.test.ts src/simulation/verifierRound112.test.ts src/simulation/verifierRound113.test.ts src/simulation/verifierRound114.test.ts src/simulation/verifierRound115.test.ts --reporter=dot` | PASS: 6 files, 44 retained save-trust regression tests. |
| `npm run typecheck -- --pretty false`; `npm run lint -- --no-warn-ignored`; `npm run format:check`; `git diff --check`; `npm run validate:verification-catalog` | All PASS; catalog validated 115 reports, 128 findings, and 13 active requirements before this report. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-116-development-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify --profile=development` | PASS: catalog, setup, format, lint, typecheck, 77 files/400 unit tests, balance, build, production audit (0 production vulnerabilities), 244/244 root browser/PWA tests, and 2/2 Pages/offline tests. Explicitly recorded `m7b-commercial-gate=blocked (parked under D-044)`. |
| `node --version`; `npm --version`; `uname -a`; final `git status --short --branch` | Environment recorded; verifier tree remained clean before report creation. |

The final canonical gate ran once after all executable candidate checks were
ready. This report is metadata written after that gate; no executable verifier
artifact changed afterward, so the gate is stale only with respect to report
metadata and was not rerun.

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| M7D-SAVE-001 — only the eight D-046 schema/content pairs are supported; schema 1/2, unknown, future, and malformed inputs fail closed | `src/simulation/saveSupport.ts`; independent exact-pair metadata audit; `npm run test:save-stability`; rounds 111–115 regressions; canonical 400-test unit lane | Pass |
| M7D-SAVE-001 — every supported and adversarial fixture has provenance, source tier, checksum, and semantic invariants | 8 supported + 6 boundary independent audit; `saveFixtures.test.ts`; fixture corpus | Pass |
| M7D-SAVE-001 — documented generator reproduces committed provenance and payload bytes | Two clean `npm run generate:save-fixtures` runs; byte snapshots identical to candidate and to each other; no fixture diff | Pass |
| M7D-SAVE-002 — one sealed restore boundary, deterministic migration, idempotent serialize/restore, legitimate retention, unique IDs, and no duplicate effects | `npm run test:save-stability` 37/37; retained rounds 111–115 and closed-world regressions 44/44; canonical unit suite 400/400 | Pass |
| M7D-SAVE-002 — invalid integrity is checked before migration; malformed/stale/unsealed/tampered/future/unsupported data resets with bounded backup and truthful status | Save recovery tests; independent retained trust-boundary regressions; round-115 browser recovery tests included in 244/244 root lane; Pages 2/2 | Pass |
| M7D Rule of Three — normal sealed migration, closest malformed/adversarial boundary, lifecycle Worker/reload/offline/PWA recovery at 320/393 | All supported fixtures; six boundary fixtures; root pinned browser lane including 320/393 save lifecycle; Pages/offline lane; canonical gate | Pass |
| Retained M7A navigation, M7C presentation/density, Worker, economy, and PWA/update boundaries | Canonical 244/244 root tests, 2/2 Pages tests, balance, build, static checks | Pass; no new defect observed |
| M7B native/WebKit/device-performance commercial gate | D-044 and release matrix | Explicitly parked/unverified; not part of the development-candidate verdict |
| Candidate semantic boundary — fixture tooling repair does not alter product executable semantics | Exact candidate path audit; no `src/`, app, Worker, package, build, or runtime path in candidate diff; canonical product suite unchanged and green | Pass |

## Findings

None. The sole prior finding, `V-115-001`, is closed: generator output and
committed fixture provenance are now byte-for-byte reproducible. No unresolved
defect violates D-046, D-047, or the applicable plan requirements.

## Unverified areas and residual risks

- Full-release M7B WebKit, native VoiceOver/TalkBack, physical-device
  performance, battery/thermal, hosted exact-SHA aggregation, deployment, and
  release-owner checks remain explicitly parked or external under D-044. They
  were not silently relabeled by this candidate-quality PASS.
- Schema 3–6 fixtures are audited deterministic reconstructions, not surviving
  historical byte captures; their derivation is explicitly recorded.
- The D-047 deterministic FNV seal is an integrity mechanism, not cryptographic
  authentication. Recovery backup remains best-effort under storage failure as
  authorized by D-047; retained storage-failure regression coverage passed.
