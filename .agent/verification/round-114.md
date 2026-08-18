# Verification Round 114 — M7D closed-world save recovery

Candidate SHA: `446bccad9e94a005175e9f1c09ec992d6ac6efab`

VERDICT: FAIL

## Scope and authority

- Evaluated exactly the supplied candidate SHA. `git rev-parse HEAD` matched
  before any verifier artifact was written; the initial worktree was clean.
- Completed the required full route: `AGENTS.md`, verifier role, live status,
  `CURRENT_SCOPE.md`, `INDEX.md`, catalog, complete relevant plan/decisions,
  release acceptance matrix, handoff, round-110 PASS, rounds 111–113 and their
  regression tests, and the retained save/PWA/archive authorities.
- Independent checklist: exact audited schema/content support; malformed,
  stale, unsealed, tampered, unsupported, and future fail-closed behavior;
  deterministic migration and idempotent resealing; corroborated progression,
  task, quote, topology, accounting, causal, and ending retention; bounded
  recovery status/backup; Worker/reload/offline/PWA lifecycle; and retained
  M7A/M7C browser boundaries.
- Handoff text, implementation-authored tests, comments, routing summaries,
  and claimed results were treated as untrusted navigation. No production
  implementation file was modified.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browser assets remained in
  ignored repository-local `.cache/` paths.
- Sandboxed Chromium launches failed before test bodies with the documented
  macOS MachPort permission error. The identical pinned commands were rerun
  with scoped host authority and completed. Browser/server processes cleaned
  up after the passing lanes.
- `./scripts/setup` in the final gate completed. npm reported four development
  advisories; the production-only audit reported no vulnerabilities.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` | Exact candidate SHA matched; initial tree clean. |
| `./scripts/agent-status` and `./scripts/agent-status --json` | Parsed cleanly; live state identified round 113 as the unresolved FAIL and this candidate as the next gate. |
| `npm run validate:verification-catalog` | Pass before verifier additions: 113 reports, 123 findings, 13 active requirements. |
| `npm run test:save-stability` | Pass: 2 files, 29 tests. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/closedWorldRecovery.test.ts src/simulation/verifierRound111.test.ts src/simulation/verifierRound112.test.ts src/simulation/verifierRound113.test.ts --reporter=dot` | Pass: 4 files, 33 tests. Existing candidate and prior-round regression lanes do not expose the four new defects below. |
| `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound114.test.ts --reporter=dot` | Pass: 75 files, 381 tests. |
| `npm run typecheck -- --pretty false`; `npm run lint -- --no-warn-ignored`; `npm run format:check`; `git diff --check` | All pass. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound114.test.ts --reporter=dot` | Fail as intended: 4 adversarial tests fail; 1 legitimate settlement/reseal control passes. |
| `E2E_PORT=44214 npm run test:e2e -- tests/e2e/save-stability.spec.ts --workers=1 --reporter=line` | Infrastructure-only MachPort failure before browser bodies. |
| `E2E_PORT=44215 npm run test:e2e -- tests/e2e/save-stability.spec.ts --workers=1 --reporter=line` with scoped host authority | Pass: 4/4, including supported migration, malformed/tampered recovery, reload, offline, and 320/393 portraits. |
| `E2E_PORT=44216 npm run test:e2e -- --workers=1 --reporter=line` | Infrastructure-only MachPort failure before browser bodies; stopped without using the cascade as product evidence. |
| `E2E_PORT=44217 npm run test:e2e -- --workers=1 --reporter=line` with scoped host authority | Pass: 242/242 pinned Chromium tests, including navigation, M7C density/accessibility, persistence, recovery, PWA, and page/console-error assertions. |
| `E2E_PORT=44218 npm run test:e2e:pages -- --workers=1 --reporter=line` | Infrastructure-only MachPort failure before browser bodies. |
| `E2E_PORT=44219 npm run test:e2e:pages -- --workers=1 --reporter=line` with scoped host authority | Pass: 2/2 Pages/offline tests. |
| `npm run balance` | Pass: all numeric, first-session, upgrade, progression, Career, evaluation, Research, Hype/Fear, and Laboratory balance lanes. |
| `npm run build` | Pass: production bundle built. |
| `npm audit --omit=dev --audit-level=high --json` | Pass: zero production vulnerabilities. |
| `VERIFY_EVIDENCE_DIR=.cache/verification/round-114-development-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify --profile=development` | Ran once after executable verifier work was ready; catalog/setup/format/lint/typecheck passed, then unit stopped at 382/386 because the four independent adversarial assertions failed. Later balance/build/audit/browser evidence was run separately above. |

The final canonical gate was not rerun after the report/catalog metadata was
added; no executable verifier artifact changed after that gate.

## Requirement matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| M7D-SAVE-001 — audited exact supported schema/content generations, provenance, checksums, invariants, and malformed/unsupported/future boundaries | `saveSupport.ts`, all eight fixtures, `npm run test:save-stability`, prior-round exact-pair regressions, catalog validation | The audited map and fixture corpus pass. The active candidate still fails the malformed trust-boundary portion through V-114-001’s unsealed causal addition. |
| M7D-SAVE-002 — one deterministic restore boundary, legitimate retention, safe stale/unsealed recovery, no duplicate effects, and truthful status | 33 mapped candidate/prior tests pass; independent `src/simulation/verifierRound114.test.ts` finds four correctable recovery defects below | FAIL: shape-valid causal fields, malformed placement, forged queue quote, and altered settlement accounting survive recovery. |
| M7D-SAVE-002 — bounded raw backup and user-visible preserved/reset/next action | `saveRecovery.test.ts`; focused save E2E 4/4 at 320/393; malformed/tampered browser flow | Pass for exercised backup/status mechanics; overall save requirement remains blocked by engine trust-boundary defects. |
| M7D-SAVE-002 — browser normal/adversarial/lifecycle and PWA update behavior | Full pinned Chromium 242/242, save stability 4/4, Pages 2/2, production build | Pass for exercised browser paths; browser lanes do not independently expose the four engine-level forged-record cases. |
| Retained M7A navigation and M7C presentation/density contract | Full root browser lane, Pages lane, static checks | No new defect observed. |
| Parked M7B commercial/native/WebKit/device-performance boundary | D-044, release matrix, retained round-109 blocker | Explicitly parked and not relabeled by this development-candidate report. |

## Findings

### V-114-001 — shape-valid unsealed evaluation additions are retained

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 unsealed recovery must reset
  uncorroborated causal additions to safe defaults.
- Expected behavior: removing the seal from a structurally valid initial save
  and changing `publicScore`, `leakageRisk`, or `distributionShiftRisk` without
  any engine event proving those values resets the evaluation state to the
  seed-specific baseline.
- Actual behavior: restore reports `recovered` and reseals the forged values
  (`publicScore: 99`, `leakageRisk: 1`, `distributionShiftRisk: 8`) even though
  the retained ledger is empty.
- Exact reproduction: `node_modules/.bin/vitest run --coverage=false
  src/simulation/verifierRound114.test.ts --reporter=dot`; test
  `resets shape-valid forged evaluation additions when no ledger event proves
  them`.
- Concrete source evidence: `hasRetainedCausalLedgerEvidence` only bounds
  counters against event counts at `src/simulation/engine.ts:6065-6124`;
  `normalizeUnsealedProgressionState` then treats that predicate as sufficient
  corroboration and copies the source evaluation at `src/simulation/engine.ts:7271-7289`.
- Blocks PASS: yes.

### V-114-002 — altered module-placement prose authorizes stale topology

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 typed topology corroboration
  and safe reset of malformed/unsealed progression.
- Expected behavior: a placement record whose engine-authored message has been
  altered is not corroboration; stale recovery retains the paid module but
  resets the unproven placement to canonical starter topology.
- Actual behavior: changing the placement event suffix to `forged suffix`
  still reports `recovered` and retains `precision-cleaner` in the Verify slot.
- Exact reproduction: the same focused command; test `rejects a shape-valid
  placement record whose engine message was altered`.
- Concrete source evidence: `isModuleTopologyLedgerPayloadValid` accepts
  placement and removal messages with `startsWith` at
  `src/simulation/engine.ts:6424-6482`; `canonicalRecoverySlots` applies that
  event at `src/simulation/engine.ts:7179-7207`.
- Blocks PASS: yes.

### V-114-003 — forged queue quote survives when projection and ledger agree

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 locked-quote/task
  corroboration and no fabricated task effects.
- Expected behavior: changing an unsealed task’s locked quote and its retained
  queue payload is malformed input, not independent proof; recovery drops the
  queue/task projection and returns to the safe first-session rail.
- Actual behavior: changing both values to `0.5` preserves one queued task with
  the forged quote and reports `recovered`.
- Exact reproduction: the same focused command; test `does not preserve a
  queue quote when the unsealed projection and ledger quote are both forged`.
- Concrete source evidence: `hasCorroboratedQueuedTasks` accepts equality
  between the two mutable values plus the generic queue message at
  `src/simulation/engine.ts:6958-6980`; `reconstructUnsealedJobs` copies them
  when that predicate passes at `src/simulation/engine.ts:7064-7100`.
- Blocks PASS: yes.

### V-114-004 — altered settlement accounting payload is counted as valid

- Severity: High.
- Related plan requirement: M7D-SAVE-002; D-046 legitimate accounting
  retention and no fabricated deductions/rewards.
- Expected behavior: an altered typed settlement payload is malformed and is
  excluded from recovered totals/status; it must not create a new payout or
  cost record.
- Actual behavior: changing a successful settlement’s payout, operating cost,
  paid cost, net change, and matching `lastSettlement` to forged values causes
  recovery to report `recovered` and set `jobs.grossEarned` to `1` and
  `operatingCostsPaid` to `0`.
- Exact reproduction: the same focused command; test `does not count a
  settlement whose typed accounting payload was altered`.
- Concrete source evidence: `isSettlementLedgerPayloadValid` checks only broad
  numeric ranges and never verifies the accounting equation or exact engine
  message at `src/simulation/engine.ts:6353-6398`; `reconstructUnsealedJobs`
  sums the mutable payload at `src/simulation/engine.ts:7040-7091`.
- Blocks PASS: yes.

## Unverified areas and residual risks

- Full-release M7B WebKit, native VoiceOver/TalkBack, physical-device
  performance, battery/thermal, hosted exact-SHA aggregation, and deployment
  remain the explicitly parked or external gates under D-044.
- Browser startup, cleanup, normal supported migration, malformed/tampered UI
  recovery, reload/offline resume, PWA update regression, and 320/393 portrait
  paths passed in reproducible pinned lanes. The four findings are engine-level
  malformed/unsealed records not represented by current browser fixtures.
- The canonical development gate is stale only with respect to this report’s
  verifier metadata; its executable result remains the 382/386 unit stop above.
