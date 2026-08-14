# Verification round 086 — Milestone 4 Research

Candidate SHA: `59df06961024f89ee4c64f87964ba283d7f604b3`

VERDICT: FAIL

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`
- Host: macOS arm64; Node `v26.7.0`; npm `11.19.0`
- Candidate was frozen before verifier writes; `git rev-parse HEAD` matched the supplied SHA exactly.
- `./scripts/agent-status` succeeded at freeze; the worktree was clean before verifier artifacts.
- Pinned Playwright browser: repository `.cache/ms-playwright`; previews were started on loopback and stopped after each probe.
- The verifier added only `src/simulation/verifierRound086.test.ts`, `.agent/verification/round-086-adversarial.mjs`, and this report.

## Commands executed and results

- `git rev-parse HEAD` — `59df06961024f89ee4c64f87964ba283d7f604b3`, exact candidate match.
- `./scripts/agent-status` — parsed successfully; round 085 remained the latest immutable report and the supplied candidate was the next verification target.
- `node_modules/.bin/prettier --check src/simulation/verifierRound086.test.ts .agent/verification/round-086-adversarial.mjs`, `npm run format:check`, `npm run lint`, and `npm run typecheck` — passed.
- `node_modules/.bin/vitest run --coverage=false src/simulation/research.test.ts src/simulation/verifierRound085.test.ts src/ui/researchView.test.tsx` — 3 files, 8 tests passed; the previous V-083 recovery boundary is covered by the candidate.
- `node_modules/.bin/tsx .agent/verification/round-085-engine-probe.ts` — passed; hidden frontier gating, migration, first-project and Evidence Weave outcome kinds, Orin’s action, researcher departure, and active-Research offline non-execution all held.
- `BASE_URL=http://127.0.0.1:42189 OUTPUT_DIR=/private/tmp/goldlocks-r086-adversarial PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-085-adversarial.mjs` — passed with no findings at 320 and 393 CSS px for the valid Research flow and prior malformed-goal boundary.
- Retained adversarial probes round 078, 079, 081, and 082 — passed. Round 080 reported only its superseded pre-round-081 stale-cause expectation; it is historical and not a candidate finding.
- `BASE_URL=http://127.0.0.1:42191 OUTPUT_DIR=/private/tmp/goldlocks-r086-future PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-086-adversarial.mjs` — reproduced V-084 at both 393×742 and 320×693 after localStorage mutation, reload, and Research navigation; no page or console errors occurred.
- `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound086.test.ts` — failed with the same V-084 reproduction. The full suite excluding this verifier regression passed: 57 files, 267 tests.
- `node_modules/.bin/tsx src/simulation/runNumericPrototype.ts` — passed (`viable`, `noDominantStrategy`, and `upgradeTradeoffs` all true).
- `npm run balance:upgrades` — passed; 20,001 seeds, zero failures, worst module affordability 4 successful jobs, worst rig affordability 15, maximum 23 attempts to 15 successes.
- `npm run balance:first-session && npm run balance:progression && npm run balance:career && npm run balance:evaluation && npm run balance:research` — passed; all reported zero failures, including Research 121 seeds with partial, breakthrough, failure, and useful-failure outcomes.
- `npm run build` — passed.
- `npm audit --omit=dev --audit-level=high` — passed with zero production vulnerabilities.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e` — 231/231 root tests passed, including Research, portrait, touch, keyboard, reduced-motion, reload, offline, PWA, and error checks.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages` — 2/2 Pages/offline tests passed.
- `INSTALL_PLAYWRIGHT=0 VERIFY_EVIDENCE_DIR=/private/tmp/goldlocks-r086-canonical ./scripts/verify` — attempted once after verifier artifacts were ready; setup, format, lint, and typecheck passed, then the unit lane stopped on the intentionally failing V-084 regression (`57 passed`, `1 failed`; `267 passed`, `1 failed`). Downstream canonical lanes were not reached; their independent commands above passed.

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `plan.md` §§3–4 and §12: uncertain, evidence-driven Research with bounded experiment pipeline | Engine probe, Research UI acceptance, and balance scenarios exercise goal → inspection → team → measurement and deterministic outcomes | Pass for valid state |
| `plan.md` §12 and §29: partly hidden frontier, question-dependent prerequisites, visible ranges/uncertainty/fit/reuse | Research browser flow keeps Evidence Weave hidden until inspection and shows bounded duration/cost/usefulness, uncertainty, strategic fit, and failed-work reuse | Pass |
| `plan.md` §29 completion: player-authored goal and pending research decision | Valid browser flow saves a goal, starts one staffed project, shows the pending decision, and retains it through reload; candidate’s V-083 fix rejects an active project without a goal | Pass for valid and V-083 states |
| `plan.md` §12 and §33: deterministic breakthrough/partial/failure/useful-failure/subset/replication-failure possibilities and retained knowledge/strategic options | Independent engine probe and 121-seed Research balance; valid browser outcome and retained-knowledge paths | Pass |
| `plan.md` §12 and D-037: original researcher roster, collaboration, chemistry, Orin archetype/action, departure and retention | Engine probe exercises complementary researchers, Orin’s First-Principles action, team departure, and retained active Research boundaries; browser exposes the roster/team controls | Pass |
| `plan.md` §§23–27, §24.6: schema/content versioning, simulation timestamp, integrity, migration, and malformed Research safe recovery | Build, full non-regression unit suite, migration probe, root/Pages suites, and V-083 test pass. V-084 below shows timestamp consistency is incomplete | **Fail — V-084** |
| D-037 high-risk offline boundary: Research never auto-runs under freelance offline policy | Independent engine probe confirms active Research and last outcome remain unchanged under offline policy; browser offline/reload coverage passes | Pass |
| `plan.md` §§19, 20, 20.4 and D-037: bounded offline behavior, sixth destination, portrait/accessibility behavior | 231 root tests, 2 Pages tests, retained probes, and independent 320/393 browser probes cover touch, keyboard, reduced motion, 200% text, control sizing, reload/offline, and page/console errors | Pass for exercised valid state |
| `plan.md` §17 and retained product contracts: causal/error explanations and recovery remain coherent | Root suite and retained verifier probes cover postmortem, failure recovery, persistence, and PWA contracts | Pass |
| `plan.md` §33–34: evidence/fit/opportunity-cost UX and no undifferentiated point accumulation | Research UI and deterministic balance/engine probes show evidence-gated options, bounded cost/time, team competence, and varied outcomes | Pass for valid state; release blocked by malformed restore |

## Findings

### V-084 — High — future-dated Research timestamps are accepted during restore

Related requirements: `plan.md` §24.6 simulation timestamp compatibility; `plan.md` §§12 and 29 Milestone 4 Research lifecycle; D-037’s requirement that malformed Research use a safe default while retaining only structurally recoverable gameplay.

Expected behavior: a persisted Research goal or active project whose `createdAtTick`/`startedAtTick` is later than the enclosing simulation state’s `tick` is temporally malformed. Restore must reject it or safely clear the Research goal/project/team. Commands create both timestamps from the current `state.tick` (`src/simulation/engine.ts:3331` and `src/simulation/engine.ts:3636`), so a future timestamp cannot be produced by a valid command sequence.

Actual behavior: `isResearchStateShapeValid` checks only that the timestamps are non-negative safe integers (`src/simulation/research.ts:378-386` and `src/simulation/research.ts:428-445`); it never compares them with `SimulationState.tick`. `restoreSimulationState` adopts any shape-valid Research object (`src/simulation/engine.ts:4965-4968`).

Exact reproduction:

1. Run `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound086.test.ts`.
2. The verifier test creates a valid recognized, inspected, staffed Context Reconstruction at simulation tick `0`, then mutates only `research.goal.createdAtTick` and `research.activeProject.startedAtTick` to `1` before `restoreSimulationState`.
3. Actual failure: expected `restored.research.activeProject` to be `null`; received `{ projectId: "context-reconstruction", startedAtTick: 1, elapsedHours: 0, expectedDurationHours: 0.669, committedCost: 0.492 }`. The malformed goal and team also remain.
4. The independent pinned Playwright probe performs the same mutation in a real persisted save, reloads at both 393×742 and 320×693, and observes `activeCount: 1` with `MEASUREMENT IN PROGRESS` and `Experiment running: Context Reconstruction` while the saved simulation tick is `0`; both runs report no page or console errors.

This is a correctable implementation defect and blocks acceptance. No production code was modified by the verifier.

## Unverified areas

No required product area was intentionally skipped. The canonical script stopped at its unit lane after V-084, so canonical balance/build/audit/browser lanes were not reached in that invocation; each was run independently on the frozen candidate and passed. The final canonical gate was not rerun after the report was written.

## Residual risks

- Until V-084 is corrected, a stale or tampered save can present a Research measurement as running in the future, with its goal/team and committed project state retained across reload.
- The next verification round must start from the verifier commit containing this report and regression artifacts, then rerun the canonical gate after the timestamp-consistency recovery fix.
