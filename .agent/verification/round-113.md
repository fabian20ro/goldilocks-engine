# Verification Round 113 — M7D save stability

Candidate SHA: `6cbd648aca475a68c90cfb9ed27e2fa8614cf639`

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
- Requirements derived independently from D-046 and the M7D Rule of Three:
  exact audited schema/content support; fail-closed unsupported and malformed
  input; deterministic migration and idempotent resealing; bounded raw backup;
  truthful preserved/reset/next-action status; corroborated-only stale/unsealed
  recovery; and normal, adversarial, and reload/offline browser behavior at 320
  and 393 CSS pixels. D-017, D-035, and D-036 were read for exact retained-ledger
  and causal-boundary expectations.
- The handoff, implementation-authored tests, comments, and previous claimed
  results were treated as navigation only. No production implementation file
  was modified by this verifier.

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`.
- Platform: Darwin arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright with the ignored local browser cache was used.
  The first sandboxed Chromium launches were rejected by the host MachPort
  policy before browser startup; the same scoped commands were rerun with host
  launch and completed. Root and Pages server processes exited cleanly after
  their completed lanes.
- The first parallel root/Pages attempt exposed a shared ignored `dist/`
  build-base race and was stopped after blank-page failures. A clean root
  `npm run build` was run, then the complete root lane was rerun serially and
  passed. That contaminated attempt is not acceptance evidence.
- Dependency setup reported four development advisories (one moderate, three
  high). `npm audit --omit=dev --audit-level=high --json` reported no production
  vulnerabilities.

## Independent requirement checklist

| Requirement | Evidence target | Result |
| --- | --- | --- |
| M7D-SAVE-001 exact supported schema/content generations and explicit unsupported/future boundaries | `saveSupport.ts`, fixture metadata, prior adversarial lanes | Exact audited support map and unsupported/future boundaries pass; malformed legacy numeric boundary fails below. |
| M7D-SAVE-001 fixture provenance, checksums, and semantic invariants | All save fixtures and save-stability tests | Pass: 29 focused tests. |
| M7D-SAVE-002 single restore boundary, deterministic migration, idempotence, and duplicate-effect/ID safety | Engine, save fixture/recovery suites, full unit lane | Existing lanes pass; three independent stale/malformed trust-boundary defects remain. |
| M7D-SAVE-002 bounded backup and truthful recovery status | Save recovery tests, browser recovery, direct malformed probes | Backup mechanics pass; malformed schema-3/4 records are incorrectly reported as migrated. |
| M7D-SAVE-002 stale/unsealed corroboration and safe defaults | Independent ending and topology probes | Fails: uncorroborated ending/meta and expanded topology are retained or discarded at the wrong boundary. |
| M7D-SAVE-002 browser Rule of Three and PWA lifecycle at 320/393 | Root and Pages pinned Playwright lanes | Root 242/242, focused save 4/4, and Pages 2/2 pass; engine recovery defects still block acceptance. |
| Retained M7A navigation and M7C editorial/density boundaries | Full root browser lane, Pages lane, static checks | No new defect observed. |
| Parked M7B commercial boundary | D-044, release matrix, round-109 infrastructure record | Remains explicitly parked; not relabeled by this candidate. |

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Exact match: `6cbd648aca475a68c90cfb9ed27e2fa8614cf639`. |
| `./scripts/agent-status` | Parsed cleanly; live status identified the supplied candidate and the prior failed round. |
| `npm run test:save-stability` | PASS: 2 files, 29 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound111.test.ts src/simulation/verifierRound112.test.ts --reporter=dot` | PASS: 2 files, 18 tests; prior round regressions close on this candidate. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound113.test.ts --reporter=dot` | FAIL as intended: 4 independent adversarial assertions fail, covering V-113-001 through V-113-003. |
| `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound113.test.ts --reporter=dot` | PASS: 73 files, 366 tests. |
| `npm run typecheck -- --pretty false` | PASS. |
| `npm run lint` | PASS. |
| `npm run format:check` | PASS. |
| `npm run validate:verification-catalog` before this report | PASS: 112 immutable reports, 120 findings, 13 active requirements. |
| `npm audit --omit=dev --audit-level=high --json` | PASS: no production vulnerabilities reported. |
| `E2E_PORT=44113 npm run test:e2e -- tests/e2e/save-stability.spec.ts --workers=1 --reporter=line` | Sandbox launch rejected by host MachPort policy before browser startup. |
| `E2E_PORT=44114 npm run test:e2e -- tests/e2e/save-stability.spec.ts --workers=1 --reporter=line` | PASS after scoped host retry: 4/4. |
| `E2E_PORT=44115 npm run test:e2e -- --workers=1 --reporter=line` | Sandbox launch rejected by host MachPort policy before browser startup. |
| `E2E_PORT=44116 npm run test:e2e:pages -- --workers=1 --reporter=line` | Sandbox launch rejected by host MachPort policy before browser startup. |
| `E2E_PORT=44118 npm run test:e2e:pages -- --workers=1 --reporter=line` | PASS after scoped host retry: 2/2. |
| `E2E_PORT=44117 npm run test:e2e -- --workers=1 --reporter=line` | Stopped after the shared Pages-base `dist/` race produced blank root pages: 16 failures, 1 interrupted, 225 not run. Not used as acceptance evidence. |
| `npm run build` | PASS: rebuilt the root bundle with `/` asset base before the serial root rerun. |
| `E2E_PORT=44119 npm run test:e2e -- --workers=1 --reporter=line` | PASS: complete pinned Chromium root lane, 242/242 in 3.7 minutes. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-113-development npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify --profile=development` | Canonical final gate reached setup, format, lint, typecheck, then stopped at unit tests: 366 passed and 4 verifier-owned adversarial assertions failed. No later canonical stage was run. |
| `npx prettier --check .agent/verification/catalog.json src/simulation/verifierRound113.test.ts` and `git diff --check` | PASS after verifier test/catalog edits. |
| `npm run validate:verification-catalog` after adding this report | PASS: 113 immutable reports, 123 findings, 13 active requirements. |

The canonical gate was run once after all executable verifier checks were ready.
The report and catalog are verifier metadata written after that gate; no
executable verifier artifact changed after it. The gate is therefore stale only
with respect to those metadata files and was not rerun in a loop.

## Requirement matrix

| Requirement | Concrete evidence | Assessment |
| --- | --- | --- |
| M7D-SAVE-001 — audited exact generations and fail-closed unsupported/future boundaries | `src/simulation/saveSupport.ts`; fixture corpus; prior schema 3–7 boundary lanes; current exact schema-3/4 malformed probes | Exact supported pairs and unsupported/future records pass. Malformed exact legacy records are accepted as migrations, so the malformed-input portion fails under V-113-003. |
| M7D-SAVE-001 — provenance/checksum/invariant fixture harness | `npm run test:save-stability` 29/29 | Pass. |
| M7D-SAVE-002 — deterministic migration, idempotent restore, legitimate retention, unique IDs, no duplicate effects | Save fixture/recovery suites, prior round regressions, and 73-file/366-test unit lane | Existing exercised paths pass; the three trust-boundary findings below block the complete requirement. |
| M7D-SAVE-002 — bounded backup and recovery status | Save recovery tests, focused `save-stability.spec.ts`, malformed browser flow | Bounded backup mechanics and browser status flows pass; legacy malformed status is incorrect in V-113-003. |
| M7D-SAVE-002 — stale/unsealed safe defaults and corroboration | `src/simulation/verifierRound113.test.ts` four failures; `engine.ts` source inspection | Fail: V-113-001 retains forged ending/meta identity; V-113-002 falls back to a fresh run instead of preserving corroborated core/accounting while resetting untrusted topology. |
| M7D-SAVE-002 — normal/adversarial/lifecycle browser behavior at 320/393 | Root 242/242, focused save 4/4, Pages 2/2; independent engine adversaries | Normal migration, malformed/tampered UI recovery, reload/offline, PWA update, and portrait lanes pass. The engine-level recovery boundaries are not closed. |
| Retained M7A/M7C presentation and navigation regression | Root browser, Pages, format, lint, typecheck | No new defect observed. |
| M7B commercial OIV gate | D-044 and release matrix | Parked/infrastructure-gated; not part of this development-candidate acceptance. |

## Findings

### V-113-001 — unsealed ending identity can forge a valid ending and meta unlock

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 stale/unsealed recovery and
  safe defaults for uncorroborated progression and causal additions.
- Expected behavior: an unsealed ending is retained only when its identity is
  corroborated by the engine-owned causal record and matching meta evidence.
  Changing the ending ID while retaining an event ID must reset the ending and
  its diagnostic/meta additions, while retaining only safe corroborated core
  state.
- Actual behavior: the test forges a valid `public-leaderboard-hero` ending in
  a valid unsealed `tutorial-loop` scenario, retains the original causal event,
  and adds the forged diagnostic/meta IDs. Restore reports `recovered` and
  returns the forged ending and meta instead of `runEnding: null` and initial
  meta. The returned state remains structurally valid, so shape checks do not
  catch this identity substitution.
- Exact reproduction:

  ```text
  node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound113.test.ts --reporter=dot
  ```

  The test `resets an unsealed ending whose identity does not match its causal
  event` fails at `src/simulation/verifierRound113.test.ts:59` with expected
  `null` and received the forged ending object.
- Concrete source evidence: unsealed normalization copies
  `sourceCareer.runEnding` and, when non-null, the source `meta` at
  `src/simulation/engine.ts:6558-6590`. `isRunEndingValid` checks the ending's
  own allowed ID, detail, and event shape at `5975-6002`, but does not bind the
  ending identity to the retained causal event's semantics; the later repair at
  `6766-6786` therefore does not clear this shape-valid substitution.
- Blocks acceptance: yes.

### V-113-002 — uncorroborated expanded topology discards corroborated core state

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 stale/unsealed recovery,
  corroborated core/accounting retention, and safe reset of uncorroborated
  progression.
- Expected behavior: when an unsealed expansion purchase is not backed by its
  exact retained purchase event, preserve corroborated core/accounting such as
  money, reset ownership and active expansion, restore starter capacity, and
  return a valid recovered state. Do not discard the whole run merely because
  the untrusted expanded topology no longer matches the safe baseline.
- Actual behavior: after a valid expansion purchase and activation, deleting
  that exact purchase event and the integrity seal yields `disposition: "reset"`
  and a fresh state with money `0`, rather than a recovered starter-capacity
  state retaining the purchased run's money and resetting only expansion
  ownership/topology.
- Exact reproduction: the test `recovers an uncorroborated expanded topology to
  starter capacity without discarding core state` in
  `src/simulation/verifierRound113.test.ts` fails at line 92 with expected
  `recovered` and received `reset`; the same run also returns fresh money and
  starter slots instead of retaining accounting.
- Concrete source evidence: `normalizeUnsealedProgressionState` clears the
  uncorroborated active expansion at `src/simulation/engine.ts:6545-6549` but
  maps only module IDs in the existing `state.slots` array at `6550-6557`.
  The resulting eight-slot topology is not the five-slot fallback topology, so
  the structural-validity check at `6726-6729` fails and the restore falls back
  instead of applying the documented selective recovery boundary.
- Blocks acceptance: yes.

### V-113-003 — malformed schema-3/4 numeric fields are defaulted and reported as migrated

- Severity: Medium.
- Related plan requirement: M7D-SAVE-001 and M7D-SAVE-002; D-046 malformed
  input must fail closed and recovery status must be truthful.
- Expected behavior: an exact supported legacy generation with a type-invalid
  numeric field is malformed input. Restore must recover to a fresh valid state,
  preserve one bounded raw backup through the UI boundary, and report reset/
  malformed status. It must not silently coerce the field and claim a completed
  schema migration.
- Actual behavior: changing `jobs.queued` to the string `"not-a-number"` in
  each exact schema-3 and schema-4 fixture returns a valid state with
  `disposition: "migrated"`, reason `schema-3-migration` or
  `schema-4-migration`, and defaulted queue data. The malformed record is not
  rejected or reported as reset.
- Exact reproduction: the parameterized test `fails closed for malformed
  numeric fields in exact schema-%s legacy saves` in
  `src/simulation/verifierRound113.test.ts` fails at line 33 for both schema
  versions with expected `reset` and received `migrated`.
- Concrete source evidence: the legacy path uses `finiteOr` for `jobs.queued`,
  resources, tick, and RNG at `src/simulation/engine.ts:6926-6948` and
  `6977-6981`, then returns a sealed migration at `7054-7055`. Recovery status
  returns `migrated` for every non-fallback supported legacy result at
  `7149-7161`, so the malformed field is both accepted and misreported.
- Blocks acceptance: yes.

## Unverified areas and residual risks

- The full-release profile was not run after the development unit gate failed.
  WebKit, native VoiceOver/TalkBack, physical-device performance, and
  battery/thermal evidence remain the explicitly parked D-044 commercial gate.
  Hosted exact-SHA aggregation/deployment was not run.
- Normal migration, malformed/tampered UI recovery, reload/offline resume, PWA
  update, root/Pages startup, and representative 320/393 portrait paths passed
  in reproducible pinned lanes. Those browser paths do not directly expose the
  forged ending identity, expanded-topology selective-recovery, or malformed
  schema-3/4 numeric cases; the committed independent engine test does.
- The development canonical gate did not reach balance, packaging/build,
  production-audit, or later browser stages because the verifier-owned
  adversarial unit failures correctly stopped it. The individual build,
  production audit, root browser, Pages browser, and focused save commands were
  run independently and are recorded above.
- No production implementation file was modified. The verifier-owned test,
  catalog entries, and this immutable report are the only verifier changes.
