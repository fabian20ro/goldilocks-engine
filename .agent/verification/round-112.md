# Verification Round 112 — M7D save stability

Candidate SHA: `235e1ebe820df750e0217c4d236713d59318a828`

VERDICT: FAIL

## Scope and authority

- Independent evaluation of exactly the candidate SHA above. `git rev-parse
  HEAD` matched before any verifier-owned file was changed; the starting
  worktree was clean.
- Full route read: `AGENTS.md`, `.codex/agents/verifier.toml`, live
  `./scripts/agent-status`, `.agent/CURRENT_SCOPE.md`,
  `.agent/verification/INDEX.md`, complete `plan.md`, complete
  `.agent/DECISIONS.md`, `.agent/verification/catalog.json`,
  `.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`, the prior immutable
  verification archive, and the exact M7D sources named by the routing maps.
- Product requirements derived independently from D-046 and the M7D Rule of
  Three: exact audited schema/content support and fail-closed unsupported or
  malformed input; deterministic migration and idempotent resealing; bounded
  raw backup; truthful preserved/reset/next-action status; corroborated-only
  stale/unsealed recovery; and normal, adversarial, and reload/offline browser
  behavior at 320 and 393 CSS pixels. D-017, D-035, and D-036 were read for
  exact retained-ledger and causal-boundary expectations.
- The handoff, implementation-authored tests, comments, and previous claimed
  results were treated as navigation only. No production implementation file
  was modified by this verifier.

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`.
- Platform: Darwin arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright with the ignored local browser cache was used.
  The first sandboxed Chromium launch was rejected by the host MachPort policy;
  the same scoped commands were rerun with host launch and completed. Root and
  Pages server processes exited cleanly after their lanes.
- Production dependency audit was clean. Setup reported four development
  dependency advisories (one moderate, three high); these did not affect the
  production audit result.

## Independent requirement checklist

| Requirement | Evidence target | Result |
| --- | --- | --- |
| M7D-SAVE-001 exact supported schema/content generations and explicit unsupported/future boundaries | `saveSupport.ts`, fixture metadata, legacy adversarial lane | Supported-pair and unsupported/future checks pass in the focused lanes. |
| M7D-SAVE-001 fixture provenance, checksums, and semantic invariants | All save fixtures and save stability tests | Pass: 29 focused tests. |
| M7D-SAVE-002 single restore boundary, deterministic migration, idempotence, and duplicate-effect/ID safety | Engine, save fixture/recovery suites, full unit lane | Existing lanes pass; malformed status and unsealed corroboration defects below remain. |
| M7D-SAVE-002 bounded backup and truthful recovery status | Save recovery tests, browser recovery, direct malformed probes | Backup mechanics pass; truthful status fails for malformed schema-7 legacy-content records. |
| M7D-SAVE-002 stale/unsealed corroboration and safe defaults | Independent malformed ledger/progression probes | Fails: malformed free-text purchase evidence retains forged progression and causal counters. |
| M7D-SAVE-002 browser Rule of Three and PWA lifecycle at 320/393 | Root and Pages pinned Playwright lanes | Exercised browser lanes pass; the engine-level recovery defects prevent overall acceptance. |
| Retained M7A navigation and M7C editorial/density boundaries | Full root browser lane, Pages lane, static checks | No new defect observed. |
| Parked M7B commercial boundary | D-044, release matrix, round-109 infrastructure record | Remains explicitly parked; not relabeled by this candidate. |

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Exact match: `235e1ebe820df750e0217c4d236713d59318a828`. |
| `./scripts/agent-status` | Parsed cleanly; live status identified the supplied candidate and the prior failed round. |
| `npm run test:save-stability` | PASS: 2 files, 29 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts --reporter=dot` | PASS: 1 file, 13 tests; prior schema 3–6 boundary regressions now close. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound112.test.ts --reporter=dot` | FAIL as intended: 5 independent adversarial assertions fail, covering the three findings below. |
| `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound112.test.ts --reporter=dot` | PASS: 72 files, 361 tests. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS. |
| `npm run format:check` | PASS. |
| `npm run validate:verification-catalog` before this report | PASS: 111 immutable reports, 117 findings, 13 active requirements. |
| `npm audit --omit=dev --audit-level=high --json` | PASS: no production vulnerabilities reported. |
| `E2E_PORT=44120 npm run test:e2e -- tests/e2e/save-stability.spec.ts --workers=1 --reporter=line` | Sandbox launch rejected by host MachPort policy before browser startup; scoped host retry passed 4/4. |
| `E2E_PORT=44121 npm run test:e2e -- --workers=1 --reporter=line` | PASS: root pinned Chromium lane, 242/242. |
| `E2E_PORT=44122 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS: Pages/offline lane, 2/2. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-112-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify --profile=development` | Canonical final gate reached setup, format, lint, and typecheck, then stopped at unit tests: 361 passed and the 5 verifier-owned adversarial assertions failed. No later gate was run. |
| `npx prettier --check .agent/verification/catalog.json src/simulation/verifierRound112.test.ts` and `git diff --check` | PASS after verifier test/catalog edits. |

The canonical gate was run once after all executable verifier checks were ready.
The report and catalog are verifier metadata written after that gate; no
executable verifier artifact changed after it. The gate is therefore stale only
with respect to those metadata files and was not rerun in a loop.

## Requirement matrix

| Requirement | Concrete evidence | Assessment |
| --- | --- | --- |
| M7D-SAVE-001 — audited exact generations and fail-closed unsupported/future boundaries | `src/simulation/saveSupport.ts`; fixture README and all golden fixtures; focused save lane; prior-round independent boundary lane now 13/13 | Pass for the audited support map and schema 1/2, unknown-content, future, and supported-pair checks exercised. |
| M7D-SAVE-001 — provenance/checksum/invariant fixture harness | `npm run test:save-stability` 29/29 | Pass. |
| M7D-SAVE-002 — deterministic migration, idempotent restore, legitimate retention, unique IDs, no duplicate effects | Save fixture/recovery suites plus 72-file/361-test unit lane | Existing exercised paths pass; malformed status and unsealed trust-boundary findings below block the full requirement. |
| M7D-SAVE-002 — bounded backup and recovery status | Save recovery tests, `save-stability.spec.ts`, malformed browser flows | Bounded backup mechanics pass; status is incorrect for the malformed schema-7 cases in V-112-001. |
| M7D-SAVE-002 — stale/unsealed safe defaults and corroboration | `verifierRound112.test.ts` five failures; `engine.ts` source inspection | Fail: V-112-002 and V-112-003 retain data inferred from a malformed event. |
| M7D-SAVE-002 — normal/adversarial/lifecycle browser behavior at 320/393 | Root 242/242, save-stability 4/4, Pages 2/2; independent engine adversaries | Browser lanes pass their exercised scenarios, but the required recovery boundary is not closed. |
| Retained M7A/M7C presentation and navigation regression | Root browser, Pages, format, lint, typecheck | No new defect observed. |
| M7B commercial OIV gate | D-044 and release matrix | Parked/infrastructure-gated; not part of this development-candidate acceptance. |

## Findings

### V-112-001 — malformed schema-7 legacy-content records are reported as migrated

- Severity: Medium.
- Related plan requirement: M7D-SAVE-002; D-046 malformed-input recovery and
  truthful preserved/reset/next-action status.
- Expected behavior: a record that names a supported schema-7 generation but is
  missing the required state must recover to a fresh valid state and report a
  reset with reset/next-action copy. It must not claim that source fields were
  preserved by migration.
- Actual behavior: for `evaluation-replay-1`, `research-1`, and `hype-fear-1`,
  `restoreSimulationStateWithReport({schemaVersion: 7, contentVersion: ...})`
  returns a state byte-for-byte equal to `createInitialState(seed)`, but reports
  `disposition: "migrated"`, `reason: "content-generation-migration"`, and
  preserved-field copy.
- Exact reproduction:

  ```text
  node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound112.test.ts --reporter=dot
  ```

  The parameterized three-case test fails with expected `reset`, received
  `migrated`. A direct probe confirmed `JSON.stringify(result.state) ===
  JSON.stringify(createInitialState(seed))` for all three records.
- Concrete source evidence: `src/simulation/engine.ts:7117-7129` returns the
  content-generation migration status before the later fallback check at
  `7139-7147`.
- Blocks acceptance: yes.

### V-112-002 — malformed capital-purchase text corroborates forged ownership

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 stale/unsealed recovery and
  D-017 exact retained-ledger corroboration.
- Expected behavior: unsealed ownership may survive only when backed by an exact
  retained paid-purchase record. A success event with an altered suffix is not
  corroboration; forged hardware/module/expansion ownership must reset to the
  safe baseline.
- Actual behavior: an unsealed initial state with `hardwareId` and ownership
  forged to `used-gpu`, plus the retained event message
  `Used 12 GB GPU purchased for $14.000 but this suffix is tampered`, is reported
  as recovered and retains `hardwareId: "used-gpu"` and both ownership IDs.
- Exact reproduction: the test named
  `does not treat a malformed capital ledger suffix as purchase corroboration`
  in `src/simulation/verifierRound112.test.ts`, run by the focused Vitest
  command above. It fails with expected `bedroom-cpu`, received `used-gpu`.
- Concrete source evidence: `hasRecordedCapitalPurchase` at
  `src/simulation/engine.ts:389-404` uses `startsWith` against the purported
  purchase text; `normalizeUnsealedProgressionState` at `6466-6495` then keeps
  any owned item accepted by that predicate.
- Blocks acceptance: yes.

### V-112-003 — malformed capital text reconstructs causal/evaluation counters

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 safe defaults for
  uncorroborated causal additions and D-035/D-036 causal-boundary precision.
- Expected behavior: an unsealed save must not reconstruct evaluation or causal
  counters from malformed/free-text evidence. The forged counter must reset to
  the seed-specific safe evaluation state unless an exact retained causal record
  corroborates it.
- Actual behavior: with `career.evaluation.capitalCommitments = 1` and the same
  malformed purchase event, recovery remains `recovered` and the evaluation
  object retains the forged counter.
- Exact reproduction: the test named
  `does not retain a forged causal counter from a malformed capital event` in
  `src/simulation/verifierRound112.test.ts`, run by the focused Vitest command.
  It fails because the returned evaluation is not equal to the initial
  evaluation.
- Concrete source evidence: `hasRetainedCausalLedgerEvidence` at
  `src/simulation/engine.ts:5902-5906` counts every success message containing
  `" purchased for $"`; `normalizeUnsealedProgressionState` carries the source
  evaluation at `6512-6527`, allowing that malformed event to clear the causal
  repair boundary.
- Blocks acceptance: yes.

## Unverified areas and residual risks

- The full-release profile was not a substitute for the development gate after
  the unit failures. WebKit, native VoiceOver/TalkBack, physical-device
  performance, and battery/thermal evidence remain the explicitly parked D-044
  commercial gate. Hosted exact-SHA aggregation/deployment was not run.
- Browser startup, normal migration, malformed/tampered UI recovery,
  reload/offline resume, PWA update, and representative 320/393 portrait paths
  passed in the reproducible pinned lanes. Those browser paths do not directly
  expose the malformed schema-7 legacy status or malformed retained-ledger
  cases; the committed independent engine test does.
- The development canonical gate did not reach balance, build, production
  audit, or later browser stages because the verifier-owned adversarial unit
  failures correctly stopped it. Individual root/Pages browser and production
  audit commands were nevertheless run independently and recorded above.
- No production implementation file was modified. The verifier-owned test,
  catalog entries, and this immutable report are the only verifier changes.
