# Verification Round 111 — M7D save stability

Candidate SHA: `23e7a440340f8ba319cff2f3a2d28bd80af66f09`

VERDICT: FAIL

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`.
- Platform: Darwin 25.6.0, arm64.
- Runtime: Node `v26.7.0`, npm `11.19.0`.
- The verifier captured `git rev-parse HEAD` before writing and obtained the
  supplied candidate SHA exactly. The starting worktree had no file changes.
- Required full-read route completed: `AGENTS.md`, verifier role, live status,
  `CURRENT_SCOPE.md`, `INDEX.md`, complete `plan.md`, complete decisions log,
  release acceptance matrix, catalog, handoff, round-110 PASS, and the cited
  migration/recovery/PWA archive route.
- Browser checks used the repository-pinned Playwright cache. The first
  sandboxed Chromium launch was rejected by the host MachPort policy; the same
  command was rerun with the scoped host launch and completed successfully.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Candidate SHA matched exactly. |
| `./scripts/agent-status` | Parsed cleanly; HEAD is the supplied descendant and needs fresh independent verification. |
| `npm run test:save-stability` | PASS: 2 files, 27 tests. |
| `npm run typecheck` | PASS after the verifier test was type-corrected. |
| `npm run lint` | PASS. |
| `npm run format:check` | PASS. |
| `npm run validate:verification-catalog` | PASS before this report: 110 reports, 114 findings, 13 active requirements. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts --reporter=dot` | FAIL as expected: 12 adversarial cases fail; the storage-failure case passes. |
| `E2E_PORT=44112 npm run test:e2e -- --workers=1 --reporter=line` | PASS: 242 tests after the scoped host launch; the sandboxed retry was infrastructure-rejected before browser startup. |
| `E2E_PORT=44113 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS: 2 tests. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-111-final ./scripts/verify --profile=development` | Fails at the unit step on the 12 verifier-owned regressions below; the gate therefore stops before later canonical steps. |

The candidate-authored save fixture/recovery lane and the independent root and
Pages browser lanes cover normal supported migration, malformed/tampered
recovery, reload/offline resume, portrait widths 320/393, and page lifecycle.
The independent engine probes below exercise the unsupported-content,
malformed-legacy, and unsealed-progression boundaries that those lanes do not
close.

## Requirement matrix

| Requirement | Evidence | Assessment |
| --- | --- | --- |
| M7D-SAVE-001 — audited exact supported schema/content/build generations and explicit unsupported/future boundaries | `saveSupport.ts`, all eight golden fixtures, `npm run test:save-stability` passed; independent unknown-content probes and `verifierRound111.test.ts` failed | FAIL: schema 3–6 accept arbitrary content versions through a separate permissive restore predicate. |
| M7D-SAVE-001 — provenance, checksums, semantic fixture invariants | `npm run test:save-stability` (27/27) | PASS for the exercised fixture metadata, but insufficient to offset the restore-boundary defect. |
| M7D-SAVE-002 — deterministic single restore boundary and safe malformed/stale/unsealed recovery | `engine.ts` restore/report path; independent malformed and unsealed probes; 12 failing verifier cases | FAIL: malformed legacy payloads are fallback state with a migration status, and unsealed progression is retained. |
| M7D-SAVE-002 — bounded raw backup and preserved/reset/next-action status | `npm run test:save-stability`; `saveRecovery.test.ts`; independent storage-failure verifier case; root browser recovery | PASS for bounded best-effort backup mechanics in exercised cases; status semantics remain implicated by V-111-002. |
| M7D-SAVE-002 — browser normal/adversarial/lifecycle behavior at 320/393, including reload/offline | Root pinned Chromium: 242 passed; Pages: 2 passed; candidate save-stability browser cases passed | PASS for exercised browser flows; engine-level adversarial gaps remain material. |
| Retained M7A navigation and M7C presentation boundaries | Full root browser lane, Pages lane, lint, typecheck, format | No new defect observed in these lanes. |
| Parked M7B commercial boundary | D-044, release matrix, round-109 history | Remains an explicit parked/infrastructure-gated release boundary; this round does not relabel it as candidate acceptance. |

## Findings

### V-111-001 — schema 3–6 restore accepts unknown content generations

- Severity: High.
- Related requirements: M7D-SAVE-001 and M7D-SAVE-002; D-046 exact
  schema/content support policy and no partial interpretation of unsupported
  input.
- Expected behavior: only the eight exact schema/content pairs recorded by
  D-046 are supported. An otherwise valid legacy payload paired with unknown
  content must fail closed, produce a reset status, and not be migrated as a
  supported generation.
- Actual behavior: `isSupportedRestoreRecord` in `src/simulation/engine.ts`
  returns true for every schema 3, 4, 5, or 6 record without checking its
  content version. The migration then converts unknown content to schema 7
  `local-lab-1` and reports `migrated`.
- Reproduction:

  ```text
  node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts --reporter=dot
  ```

  The four cases named `fails closed for unknown content paired with schema 3`
  through schema 6 fail with expected `reset`, received `migrated`. A direct
  probe using each golden payload with `contentVersion = unknown-N` reports
  `disposition=migrated`, `fallback=false`, `resultSchema=7`,
  `resultContent=local-lab-1`, and retains `queued=2` and `money=4.113` for
  every schema.
- Concrete source evidence: `src/simulation/engine.ts:6895-6907` defines the
  permissive predicate; `src/simulation/saveSupport.ts:139-147` contains an
  exact pair lookup but is not used by the restore boundary.
- Blocks PASS: yes.

### V-111-002 — malformed supported legacy payload is reported as migrated

- Severity: Medium.
- Related requirements: M7D-SAVE-002; D-046 malformed-input recovery and
  concise truthful preserved/reset/next-action status.
- Expected behavior: a malformed payload, including a record that names a
  supported generation but lacks required state, must recover to a fresh valid
  state and report `reset` with reset/next-action copy. It must not claim that
  source fields were preserved through migration.
- Actual behavior: `restoreSimulationState` returns the fresh fallback for
  minimal schema 3, 4, 5, and 6 records, but `recoveryStatusFor` checks only
  that the schema is below 7 and returns `disposition=migrated` with a list of
  preserved fields. The UI therefore presents migration copy for a reset run.
- Reproduction:

  ```text
  node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts --reporter=dot
  ```

  The four cases named `reports reset, rather than migration, when schema 3 is
  malformed` through schema 6 fail with expected `reset`, received `migrated`.
  A direct probe of `{schemaVersion: N, contentVersion: exactGeneration}` for
  N=3..6 reports `fallback=true` alongside `disposition=migrated` and reason
  `schema-N-migration`.
- Concrete source evidence: `src/simulation/engine.ts:6981-6994` emits the
  migration report before validating the migrated state; the fallback result
  is not reflected in the status.
- Blocks PASS: yes.

### V-111-003 — unsealed progression fields survive stale recovery without corroboration

- Severity: High.
- Related requirements: M7D-SAVE-002; D-046 stale/unsealed recovery boundary
  requiring only corroborated core/task/accounting/seed/RNG/history and safe
  defaults for untrusted progression or causal additions.
- Expected behavior: removing or invalidating the integrity seal must not make
  fabricated hardware ownership, module ownership, completed endings, or
  Career progression authoritative. Those fields must reset unless the
  required historical corroboration exists.
- Actual behavior: an unsealed current state is classified as
  `stale-or-unsealed-save`/`recovered`, while individually altered
  `hardwareId`/`ownedHardwareIds`, `ownedModuleIds`,
  `meta.completedEndingIds`, and `career.savings` survive unchanged.
- Reproduction:

  ```text
  node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts --reporter=dot
  ```

  The four cases named `does not retain unsealed hardware ownership`,
  `module ownership`, `meta progression`, and `Career progression` fail. A
  direct probe reports respectively `hardwareId=used-gpu`,
  `hasPrecisionCleaner=true`, `completedEndingIds=["honest-foundation"]`, and
  `savings=99`, all with `recovery=recovered`.
- Concrete source evidence: the stale/unsealed result path at
  `src/simulation/engine.ts:7017-7042` describes untrusted progression as
  reset but returns the structurally normalized candidate without clearing
  those progression fields.
- Blocks PASS: yes.

## Unverified areas and residual risks

- The full-release profile was not useful for additional evidence after the
  development profile stopped at the unit regressions; WebKit, native
  VoiceOver/TalkBack, physical-device performance, hosted exact-SHA checks,
  and deployment remain the explicitly parked/unavailable M7B and release
  gates documented by D-044 and the release matrix.
- The browser lane passed its normal, malformed/tampered, reload/offline, and
  320/393 checks, but does not independently exercise an unknown content pair
  or forged unsealed progression. The committed verifier engine tests provide
  reproducible coverage for those lower-level restore boundaries.
- No production file was modified by the verifier. The verifier-owned test and
  this report are the only new evidence artifacts; the catalog routes the three
  findings as active M7D findings.

