# Verification round 087 — Milestone 4 Research

Candidate SHA: `b20abcad7ad864894e6871304a0d2c5675160349`

VERDICT: FAIL

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`
- Host: macOS arm64; Node `v26.7.0`; npm `11.19.0`
- Candidate was frozen before verifier writes; `git rev-parse HEAD` matched the supplied SHA exactly.
- `./scripts/agent-status` parsed cleanly at freeze; the latest immutable report was round 086 FAIL and the worktree was clean before verifier artifacts.
- Pinned Playwright browser: repository `.cache/ms-playwright`; loopback previews were started and stopped for every independent browser probe.
- Verifier-owned artifacts are limited to `src/simulation/verifierRound087.test.ts`, `.agent/verification/round-087-adversarial.mjs`, and this report.

## Commands executed and results

- `git rev-parse HEAD` — `b20abcad7ad864894e6871304a0d2c5675160349`, exact candidate match before writes.
- `./scripts/agent-status` — parsed successfully; round 086 was the latest immutable FAIL and this candidate was the next gate.
- `node_modules/.bin/prettier --write src/simulation/verifierRound087.test.ts .agent/verification/round-087-adversarial.mjs`, `npm run format:check`, `npm run lint`, and `npm run typecheck` — passed.
- `node_modules/.bin/vitest run --coverage=false src/simulation/research.test.ts src/simulation/verifierRound085.test.ts src/simulation/verifierRound086.test.ts src/ui/researchView.test.tsx` — 4 files, 10 tests passed; retained V-083 and V-084 regressions pass.
- `node_modules/.bin/vitest run --coverage=false --exclude src/simulation/verifierRound087.test.ts` — 58 files, 269 tests passed.
- `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound087.test.ts` — 2 tests failed, reproducing V-085 and V-086 below.
- `node_modules/.bin/tsx .agent/verification/round-085-engine-probe.ts` — passed: hidden-project count 4; breakthrough, failure, partial, useful-failure and replication-failure, subset, useful-failure weave outcomes; one First-Principles use; active Research preserved under offline policy.
- `BASE_URL=http://127.0.0.1:42195 OUTPUT_DIR=/private/tmp/goldlocks-r087-research PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-085-adversarial.mjs` — passed with no findings for the retained valid Research flow at the required portrait/accessibility paths.
- `BASE_URL=http://127.0.0.1:42196 OUTPUT_DIR=/private/tmp/goldlocks-r087-future PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-086-adversarial.mjs` — passed with no findings at 320 and 393 CSS pixels; future goal/project timestamps are cleared on restore and no page/console errors occurred. This resolves V-084.
- `BASE_URL=http://127.0.0.1:42193 OUTPUT_DIR=/private/tmp/goldlocks-r087 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-087-adversarial.mjs` — failed only V-085 and V-086; no page or console errors were observed.
- `npm run test:e2e -- tests/e2e/research.spec.ts` — 2 Research tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e` — 231/231 root tests passed, including retained Jobs provenance, Research, portrait, touch, keyboard, reduced-motion, reload, offline, PWA, and error checks.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages` — 2/2 Pages/offline tests passed after the documented macOS browser-permission escalation.
- Retained provenance probes: round 079 passed; rounds 081 and 082 passed; round 080 reported its two documented stale-precision mismatches (unknown-cause fallback), a historical expectation superseded by D-036 and not a new finding.
- `npm run balance` — passed; numeric prototype viable/no dominant strategy/tradeoffs true; all deterministic lanes zero failures; upgrade lane 20,001 seeds zero failures; Research 121 seeds, catalog valid, partial/breakthrough/failure/useful-failure outcomes.
- `npm run build` and `npm run build:pages` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; zero production vulnerabilities.
- `git diff --check` — passed before report creation.
- `VERIFY_EVIDENCE_DIR=/private/tmp/goldlocks-r087-canonical ./scripts/verify` — final gate is run once after this report and verifier artifacts are ready. The intentional verifier regressions are expected to stop the canonical script in its unit lane; independent downstream lanes above passed on the frozen candidate.

## Requirement matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `plan.md` §§3–4 and §12: uncertain, evidence-driven Research with bounded experiment pipeline | Research unit tests, retained engine probe, Research UI E2E, 121-seed Research balance, and valid-flow browser probe exercise goal → inspection → staffing → measurement and deterministic outcomes | Pass for valid state |
| `plan.md` §12 and §29: partly hidden frontier, question-dependent prerequisites, visible ranges/uncertainty/fit/reuse | Valid Research probe keeps later questions hidden until evidence; UI exposes duration/cost/usefulness ranges, uncertainty, strategic fit, and failed-work reuse | Pass for valid state; malformed restore fails V-085 |
| `plan.md` §29 completion: player-authored goal and clear pending research decision | Research E2E saves a goal, shows the pending decision, staffs and starts one bounded project, and retains it through reload; V-083 and V-084 focused regressions pass | Pass for valid and previously reported malformed states |
| `plan.md` §12 and §33: breakthrough/partial/failure/useful-failure/subset/replication-failure possibilities and retained knowledge/strategic options | Retained engine probe and deterministic Research balance show varied outcomes and retained options/knowledge | Pass for valid command sequences |
| `plan.md` §12.4–§12.5 and D-037: original researchers, complementary collaboration, chemistry, Orin archetype/action, departure and retention | Engine probe and UI exercise roster, staffing, chemistry, departure retention, and Orin; repeated Orin action exposes the V-086 free-accumulation defect | **Fail — V-086** |
| `plan.md` §§23–27 and §24.6: schema/content versioning, timestamp/integrity, migration, malformed Research safe recovery | Build, full non-verifier unit suite, migration/Research probes, Pages/root suites, and V-084 timestamp probe pass; forged semantic Research state remains accepted as V-085 | **Fail — V-085** |
| D-037 high-risk offline boundary: Research never auto-runs under freelance offline policy | Retained engine probe and Research/browser offline coverage show active Research does not advance under the safe offline policy | Pass |
| D-037 UX/accessibility: sixth destination, one goal/next action, disabled prerequisites, 44px controls, keyboard/screen reader, reduced motion, 320/393/200% | Root and Research Playwright suites plus retained probes cover portrait widths, touch, keyboard, 200% text, reduced motion, persistence, offline, and page/console errors | Pass for exercised valid state |
| `plan.md` §§17, 19, 20, 20.4 and retained product contracts: causal explanations, navigation, persistence, PWA and provenance | 231 root tests, 2 Pages tests, and retained rounds 079/081/082 passed; round 080 historical mismatch is explicitly superseded | Pass |
| Milestone 4 completion: outcomes not reproducible by undifferentiated point accumulation | Bounded valid scenarios and varied balance outcomes pass, but repeated First-Principles commands add free institutional/tacit knowledge with no time/cost/project boundary | **Fail — V-086** |

## Findings

### V-085 — High — malformed Research restore trusts forged frontier and progression

Related requirements: D-037 malformed Research recovery; `plan.md` §§12, 24.6 and 29; Milestone 4’s evidence-gated hidden frontier; persistence/integrity safety boundary.

Expected behavior: a stale or tampered Research object that claims unearned frontier discovery/inspection/completion, recruited researchers, a team, a goal, or institutional knowledge must be rejected or reduced to the safe Research default while retaining only structurally recoverable gameplay. Hidden projects must not become visible or startable merely because their catalog IDs are present in persisted state.

Actual behavior: `isResearchStateShapeValid` checks known IDs, uniqueness, and simple containment (`src/simulation/research.ts:366-384`), but does not validate discovery order, inspection/completion prerequisites, outcome linkage, researcher recruitment/payment, or knowledge provenance. `restoreSimulationState` adopts any object passing those shape checks (`src/simulation/engine.ts:4965-4974`). `isStateValid` remains true after the forged restore.

Exact reproduction:

1. Run `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound087.test.ts`.
2. The verifier test starts from a valid recognized save, mutates only persisted Research to add `negative-space` to discovered/inspected frontier, marks `context-reconstruction` complete without an outcome, forges a goal, recruits/teams Mira without recruitment, and sets institutional knowledge to `1`.
3. Actual failure: the restored discovered IDs are `[`context-reconstruction`, `negative-space`]`, while the safe state should retain only the initial Context project; forged inspection, goal, team, and knowledge are also retained. The test reports the first mismatch and the restored state is still structurally valid.
4. Run the independent browser probe with `BASE_URL=http://127.0.0.1:42193 OUTPUT_DIR=/private/tmp/goldlocks-r087 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-087-adversarial.mjs` against a running `E2E_PORT=42193 ./scripts/run-e2e` preview.
5. After localStorage mutation, reload, and Research navigation at 393×742, actual UI evidence is `projectVisible:true`, `startDisabled:false`, and `2 VISIBLE`; `Negative-Space Audit` is shown with an enabled `Start Negative-Space Audit` button. No page or console error masks the defect.

This is a correctable implementation defect and blocks PASS. The verifier did not modify production code.

### V-086 — High — First-Principles Reconstruction is an unbounded free knowledge faucet

Related requirements: `plan.md` §12.4–§12.5; Milestone 4 completion evidence; D-037’s bounded Research pipeline and Orin signature action that exposes assumptions and increases institutional/tacit retention.

Expected behavior: the signature action must be a bounded strategic Research contribution. Repeating the identical action without an active project, elapsed simulation time, cost/compute commitment, or other limiting state must not mint institutional/tacit knowledge through undifferentiated point accumulation or bypass the pending research decision.

Actual behavior: `START_RESEARCH` has bounded goal/evidence/team/cash checks, but `FIRST_PRINCIPLES_RECONSTRUCTION` checks only Research recognition and Orin’s recruited/on-team status (`src/simulation/engine.ts:3650-3689`). Each invocation increments institutional knowledge by `0.3`, increases team tacit knowledge, appends the strategic option, and increments `firstPrinciplesUses`; it does not consume money, advance `tick`, require an active project, or impose a cooldown. The state remains valid while uses are below the validator’s 1000-use cap.

Exact reproduction:

1. Run `node_modules/.bin/vitest run --coverage=false src/simulation/verifierRound087.test.ts`.
2. The verifier test recognizes Research, recruits and teams Orin, then applies `FIRST_PRINCIPLES_RECONSTRUCTION` twice with no active project.
3. Actual failure: `firstPrinciplesUses` is `1` after one command and `2` after two; institutional knowledge is `0.3` then `0.6`; tacit knowledge increases; money remains `10`, `tick` does not advance, and `activeProject` remains `null`.
4. The independent pinned browser probe repeats the action through the visible UI. Evidence is `once:{firstPrinciplesUses:1,institutionalKnowledge:0.3,money:10}` and `twice:{firstPrinciplesUses:2,institutionalKnowledge:0.6,money:10,activeProject:null}`. No page or console errors occur.

This is a correctable implementation defect in the Milestone 4 progression loop and blocks PASS. The verifier did not modify production code.

## Unverified areas

No required product area was intentionally skipped. The final canonical script is expected to stop at the unit lane on the two verifier-authored failing regressions; balance, build, audit, root browser, Pages browser, Research browser, retained provenance probes, and independent engine checks were run separately. The historical round-080 mismatch is documented and is not treated as a candidate defect.

## Residual risks

- Until V-085 is corrected, a tampered or stale save can mint hidden Research progression, researchers, knowledge, and a startable project across reload.
- Until V-086 is corrected, a player can repeat Orin’s visible action to accumulate institutional/tacit knowledge and its strategic option without the bounded experiment loop.
- V-083 (active Research requires a goal) and V-084 (future Research timestamps) are resolved on this candidate; the next verifier should retain both regressions while checking the two new findings.
