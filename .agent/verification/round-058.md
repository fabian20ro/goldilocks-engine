# Verification round 058 — Career ordered response-boundary delivery

Candidate SHA: `21d023b0922cea818267ee5663f26d9699f1301f`

VERDICT: FAIL

## Candidate freeze and scope

- Captured `git rev-parse HEAD` before any verifier write: `21d023b0922cea818267ee5663f26d9699f1301f`.
- Exact match with supplied candidate SHA; initial worktree clean.
- Independent scope: `plan.md` §20.7 Phase 2; decisions D-021 through D-024; retained V-061, V-062, and V-063.
- Read plan, decisions, production code, handoff, and immutable verification reports independently. Handoff and implementation-authored tests treated as hints only.
- Verifier-owned artifact: `tests/e2e/verifier-round-058.spec.ts`. No production code changed.

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`; Playwright `1.61.1`.
- Repository-pinned browser command uses `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright`; application starts on deterministic `127.0.0.1` ports.
- `npm ci` completed inside the canonical verifier command. Production-dependency audit reported zero high/critical findings. The npm development dependency audit still reports five high findings in the established eslint transitive chain; not a candidate regression and production audit is clean.
- Sandbox browser launch was blocked by macOS Mach-port permission denial. Re-ran the exact repository-pinned browser checks in approved host context; no global browser, profile, or in-app Browser used.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Candidate SHA matched exactly before verifier writes. |
| `git diff --check 21d023b^ 21d023b` | Pass. |
| `E2E_PORT=4358 ./scripts/verify` | Static/unit/build/audit stages passed; browser could not launch in filesystem sandbox: Chromium Mach-port `Permission denied (1100)`. Infrastructure limitation, not used as candidate evidence. |
| `E2E_PORT=4359 ./scripts/verify` (host context) | Pass: `npm ci`; format, lint, typecheck; 179 unit/property tests; numeric/progression/career/eval balance sweeps; production audit; build; 184/184 root E2E; 2/2 Pages/offline E2E. |
| `E2E_PORT=4362 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts tests/e2e/verifier-round-057.spec.ts --repeat-each=10 --reporter=dot` | Pass: 50/50. Retained V-061/V-062/V-063 regression and adversarial probes. |
| `E2E_PORT=4363 npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced App-session draft through Worker ticks, speed, pause, and tabs at 393px" --repeat-each=25 --reporter=dot` | Pass: 25/25. Human-paced Worker/tick/speed/pause/tab persistence path. |
| `E2E_PORT=4364 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "command deck geometry and visual evidence" --reporter=dot` | Pass: 2/2; produced and independently inspected 20 starter/expanded portrait screenshots across all five tabs at 320 and 393 CSS px. |
| `E2E_PORT=4365 npm run test:e2e -- tests/e2e/career-hierarchy.spec.ts --grep "Career hierarchy records" --reporter=dot` | Pass: 1/1; independently inspected 14 Career portrait screenshots: empty, partial, full, rejection, completed, exit-ready, and lifecycle states at 320/393 CSS px. |
| `./scripts/run`; loopback `curl` readiness probe on `http://127.0.0.1:4173/` | Pass: Vite ready in 74 ms; HTTP `200 909`. Sent interrupt; follow-up curl returned connection refused, confirming cleanup. |
| `npm run format:check`; `npm run lint`; `npm run typecheck` | Pass after adding verifier test. |
| `E2E_PORT=4360 npm run test:e2e -- tests/e2e/verifier-round-058.spec.ts --reporter=dot` | Fail: expected completed result absent. |
| `E2E_PORT=4361 npm run test:e2e -- tests/e2e/verifier-round-058.spec.ts --repeat-each=10 --reporter=dot` | Fail: 10/10, same missing result. |

## Requirement matrix

| Applicable requirement | Evidence | Status |
| --- | --- | --- |
| Phase 2 remains presentation-only; four Career routes available on first evening (D-021) | Host canonical E2E; Career portrait deck; source/state inspection. | Pass |
| Stable route benefit, tradeoff, allocation controls, estimate, cost, and detail hierarchy | Host canonical E2E; Career empty/partial/full portrait deck at 320/393. No horizontal clipping or broken primary action observed. | Pass |
| Compact objective/resources followed by player-authored schedule composer; singular Run and scheduled/total/unallocated/blocking explanation | Host canonical E2E; 25 repeated human-paced sessions; Career deck including zero-hour rejection. | Pass |
| Details/disclosures, explicit reserves, local-model scope, and no fabricated concurrent mechanics | Career deck and host canonical E2E. | Pass |
| Completed/rejected/exit-ready user-visible Career result states | Career deck contains completed, rejected, exit-ready states; standard single-command flow passes. | Pass for ordinary flow |
| Exact Worker response boundary; ordered multi-command response handling (D-022/D-023/D-024) | Candidate queue implementation preserves boundaries, and retained double-command probes pass; new three-command adversarial probe loses a valid earlier completion recap. | **Fail — V-064** |
| Persisted completion result survives later non-completing reply (D-024) | `verifier-round-058.spec.ts` 10/10 failure while local persisted state proves completion occurred. | **Fail — V-064** |
| Retained V-061 draft/Worker-tick race, V-062 projection attribution, V-063 post-reload feedback | Repeated retained verifier suites, 50/50 pass. | Pass |
| Portrait geometry and visual quality at 320 and 393 | Fresh command-deck screenshots: all tabs, starter/expanded; fresh Career lifecycle screenshots; direct image inspection. | Pass |
| 100%/200% text, keyboard/touch, reduced motion, console/page errors, persistence/reload/offline paths | Canonical root and Pages/offline E2E; retained round-055 accessibility/reduced-motion test repeated ten times; 25 repeated human-paced flow. | Pass |
| Install, production build, deterministic startup/readiness, cleanup | Host canonical `npm ci`/build/audit; manual `./scripts/run`, 200 response, stopped process verified. | Pass |

## Findings

### V-064 — Later zero-hour offline reply drops an earlier completed offline recap

- Severity: High.
- Related requirement: `plan.md` §20.7 Phase 2 localized Career result; D-022 exact Worker response attribution; D-023/D-024 ordered durable boundaries and the rule that a non-completing reply clears only its own feedback and cannot erase an earlier completed recap.
- Expected behavior: When a valid four-hour safe-offline action completes, its `Night 1 result` / `4.00h used` recap remains available even if a later policy-save and zero-hour safe-offline action respond in the same React batch. The later non-completing response may invalidate only its own projection.
- Actual behavior: The durable save becomes `{ completedEvenings: 1, maxHours: 0, offlineHours: 0 }`, proving the first four-hour action completed, but no accessible `Latest evening result` exists. The first completed response is never attributed to a pending offline result because `pendingOfflineCareerCompletionRef` has been overwritten by the later request; the final zero-hour response then clears that sole pending reference.
- Exact reproduction:

  1. Run `E2E_PORT=4361 npm run test:e2e -- tests/e2e/verifier-round-058.spec.ts --repeat-each=10 --reporter=dot`.
  2. The test seeds an enabled four-hour safe-offline policy, intercepts only real Worker command response delivery, then queues: apply four-hour safe-offline policy; save policy with maximum hours `0`; apply safe-offline policy again.
  3. It releases the three real Worker replies together, the explicit D-023/D-024 boundary condition in which React has not rendered between commands.
  4. Observe persisted state reaching Night 1 but the `role=status` named `Latest evening result` never appears; each repeat fails at `toContainText("Night 1 result")`.

- Concrete evidence: focused run failed; stress run failed 10/10. Source inspection shows one mutable `pendingOfflineCareerCompletionRef` at `src/ui/App.tsx:3861`; each apply overwrites it at `src/ui/App.tsx:3904`, and only a boundary matching the final reference is processed at `src/ui/App.tsx:3940`. The underlying hook correctly queues all response boundaries, so the loss is in Career presentation attribution rather than state persistence.
- Blocks PASS: Yes.

## Unverified areas

- No hosted deployment, physical mobile device, non-Chromium browser, or native screen-reader speech output tested; no plan requirement made these prerequisite acceptance evidence.
- Canonical verification was not rerun after adding the failing verifier regression test. The frozen candidate canonical run passed before verifier artifacts; the focused regression is intentionally failing and is sufficient to demonstrate the defect.

## Residual risks

- V-064 makes valid Career completion feedback dependent on response batching and subsequent commands. A player can complete an evening durably yet lose the localized recap required to understand it.
- Existing retained two-command probes do not cover a completed offline response followed by both a policy update and a non-completing offline response in one boundary batch. The committed regression closes that coverage gap.
