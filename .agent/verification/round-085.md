# Verification round 085 — Milestone 4 Research

Candidate SHA: `457e28f6891e97910550c7097e8cbf542a88afea`

VERDICT: FAIL

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`
- Host: macOS arm64; Node `v26.7.0`; npm `11.19.0`
- Candidate was frozen before verifier writes; `git rev-parse HEAD` matched the supplied SHA exactly.
- `./scripts/agent-status` succeeded at freeze; the worktree was clean before verifier artifacts.
- Pinned Playwright browser: repository `.cache/ms-playwright`.
- Preview readiness was confirmed on loopback before probes. The verifier preview was stopped afterward; ports 42186, 42187, and 42188 had no listeners and the verifier tmux session was closed.

## Commands executed and results

- `./scripts/agent-status` — passed; identified round 085 as the next gate.
- `npx prettier --check .` — passed after formatting verifier-only artifacts.
- `npm run typecheck` and `npm run lint` — passed.
- `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound085.test.ts` — 56 files, 266 tests passed.
- `npm run balance` — passed: all deterministic balance lanes reported zero failures; Research reported 121 seeds, four outcome kinds, valid catalog.
- `npm audit --omit=dev --audit-level=high` — passed with zero production vulnerabilities.
- `npm run test:e2e -- tests/e2e/research.spec.ts` — 2 Research tests passed.
- `E2E_PORT=42187 npm run test:e2e` — 231/231 root Playwright tests passed.
- `E2E_PORT=42188 npm run test:e2e:pages` — 2/2 Pages/offline tests passed.
- `node_modules/.bin/tsx .agent/verification/round-085-engine-probe.ts` — passed. It independently exercised hidden gating, migration, all first-project and Evidence Weave outcome kinds, Orin’s action, team departure, and offline non-execution.
- `BASE_URL=http://127.0.0.1:42186 OUTPUT_DIR=/private/tmp/goldlocks-r085-final PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-085-adversarial.mjs` — all normal checks passed at 320 and 393 CSS px, including six-tab navigation, hidden frontier, goal/inspection/staffing/start, outcome retention, reload/offline, touch, 200% text, reduced motion, control sizing, and page/console errors. One malformed-state check failed; see V-083.
- Retained `.agent/verification/round-078-adversarial.mjs`, round 079, round 081, and round 082 probes — passed. Round 080 retains the superseded pre-round-081 expectation and reported the expected historical mismatch; it is not a new finding.
- `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound085.test.ts` — failed with the same V-083 reproduction below.
- `E2E_PORT=42186 VERIFY_EVIDENCE_DIR="$PWD/.cache/verification/round-085-final" PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache=.cache/npm ./scripts/verify` — attempted once; stopped at `format` because the newly authored verifier probe needed formatting. The probe was formatted afterward and `npm run format:check` passed. Per protocol, this gate is reported stale and was not rerun.

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `plan.md` §12.1–§12.3; Milestone 4: partially hidden frontier, bounded hypotheses, evidence, ranges, uncertainty, fit, reuse, useful failures, strategic options | Independent Research Playwright at 320/393; engine probe; 121-seed balance; visible Context Reconstruction and gated Evidence Weave | Pass, except malformed restore finding below |
| Question-dependent prerequisites rather than undifferentiated points | Hidden Evidence Weave remains absent before inspection; inspection requires Context evidence and 20% private coverage; insufficient cash leaves active project null and cash unchanged | Pass |
| Player-authored goal and pending decision | Browser fills and saves a goal, starts a staffed project, and observes `Outcome:` pending decision through reload/offline | Pass for valid state |
| Deterministic measurement and outcomes | Engine probe covers first-project `breakthrough`, `partial`, `failure`, `useful-failure`; Evidence Weave `breakthrough`, `subset`, `useful-failure`, `replication-failure`; full balance passes | Pass |
| Original researchers, collaboration, chemistry, legendary educator-engineer, retention | Engine probe recruits complementary researchers, releases one member during a two-person active project, rejects clearing the last active member, and executes Orin’s First-Principles action; browser exposes researcher controls | Pass for valid state |
| Schema-7/content migration and durable Research state | Engine probe restores a sealed `evaluation-replay-1` save without Research and receives the safe default/migration step; browser reload and offline reload retain completed output | Pass for covered migration/lifecycle cases |
| D-037 high-risk offline boundary | Engine probe applies the safe offline policy while Research is active and verifies unchanged active Research/last outcome; browser offline reload retains completed result | Pass |
| D-037 UX/accessibility | Root and Research Playwright coverage includes 320/393, keyboard, touch, 200% text, reduced motion, six primary destinations, 44px controls, persistence, offline, and no page/console errors | Pass for valid state |
| Existing Bedroom/PWA/Pages contracts | 231 root tests, 2 Pages tests, retained rounds 078/079/081/082, production audit | Pass |

## Findings

### V-083 — High — malformed active Research without a required goal is preserved

Related requirements: D-037 malformed Research recovery; `plan.md` Milestone 4 completion and §12; D-037’s requirement that malformed Research fall back to the safe Research default while retaining only structurally recoverable gameplay.

Expected behavior: `START_RESEARCH` requires a non-null goal (`src/simulation/engine.ts:3594-3597`). A persisted state containing a valid-looking active project but no goal is therefore semantically malformed. Restore must reject or safely clear the active project/team rather than presenting an experiment as running with no player-authored decision.

Actual behavior: `isResearchStateShapeValid` accepts `goal: null` (`src/simulation/research.ts:377-388`) and the active-project branch validates project/team fields without requiring a goal (`src/simulation/research.ts:428-445`). `restoreSimulationState` consequently adopts the malformed Research object (`src/simulation/engine.ts:4965-4968`). The restored state remains structurally valid while retaining the active project and team.

Exact reproduction:

1. Run `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound085.test.ts`.
2. The test creates a valid active Context Reconstruction, sets `research.goal = null`, restores it, and expects the active project to be cleared.
3. Actual failure: expected `null`, received `{ projectId: "context-reconstruction", startedAtTick: 0, elapsedHours: 0, expectedDurationHours: 0.669, committedCost: 0.492 }`.
4. The pinned browser probe reproduces the same state through localStorage and reload. Its only finding is `active: 1`; the UI simultaneously shows `MEASUREMENT IN PROGRESS` and `Short research goal REQUIRED`.

This is a correctable implementation defect and blocks acceptance. No production code was modified by the verifier.

## Unverified areas

No required product behavior was intentionally skipped. The canonical script’s result is stale only because it stopped on verifier-authored formatting before reaching later lanes; the individual typecheck, lint, unit suite excluding the deliberately failing regression, balance, audit, root browser, Pages browser, Research browser, and independent engine lanes were run separately.

## Residual risks

- Until V-083 is corrected, a tampered or stale save can display a running Research measurement without the required player goal and can retain its team across restore.
- The next verification round must start from the verifier commit containing this report and regression test, then rerun the canonical gate after the production recovery fix.
