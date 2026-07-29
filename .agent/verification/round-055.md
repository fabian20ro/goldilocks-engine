# Verification round 055 — Career action hierarchy, Phase 2

Candidate SHA: `aab7aa0882b263232d3caa9ec787ed13c365f6d8`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before creating any verifier artifact: `aab7aa0882b263232d3caa9ec787ed13c365f6d8`.
- Confirmed it exactly matched the supplied candidate SHA and the worktree was clean at capture.
- Read `plan.md`, `.agent/DECISIONS.md`, the active verifier role, retained reports through round 054, and the candidate handoff independently. Handoff claims informed probes only; they were not accepted as evidence.
- Verifier-authored scope: `src/simulation/verifierRound055.test.ts`, `tests/e2e/verifier-round-055.spec.ts`, and this immutable report. No production file was changed.

## Environment and setup

- macOS host; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned `@playwright/test` and Chromium from ignored `.cache/ms-playwright`; deterministic loopback ports only.
- `./scripts/verify` runs clean `npm ci`, checks, balances, production build/audit, root Playwright, and Pages/offline Playwright.
- The workspace sandbox cannot launch macOS Chromium because its Mach-port rendezvous is denied. The same pinned browser and repository setup ran successfully in a scoped host launch; no browser check was skipped.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Candidate SHA matched exactly before verifier writes. |
| `E2E_PORT=4255 ./scripts/verify` | Static, unit/property, balances, build, and production audit passed. Browser launch was blocked solely by sandbox Mach-port denial before any test body ran. |
| `E2E_PORT=4256 ./scripts/verify` | Passed: format, lint, typecheck; 177 unit/property tests; numeric, first-session (41 seeds), 20,001-seed upgrade, progression (41 seeds), Career (101 seeds), and evaluation (121 seeds) balances; production build; production audit (0 vulnerabilities); 176 root Playwright tests; 2 Pages/offline tests. |
| `npx vitest run src/simulation/verifierRound055.test.ts --coverage.enabled=false --reporter=dot` | Passed. Independent pure-projection/non-mutation check and actual atomic Worker completion comparison across income, progress, electricity, operating-cost, unpaid-cost, released-product revenue, and maintenance-debt paths. |
| `E2E_PORT=4262 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts --grep "Phase 2 Career controls" --reporter=dot` | Passed. Independent 320×693 at 200% text and 393×742 checks: reduced motion, CDP touch, 44px controls, tab draft retention, single Details surface/focus restoration, native disclosures, no horizontal or nested composer scroll, no page/console errors. |
| `E2E_PORT=4258 npm run test:e2e -- tests/e2e/command-deck.spec.ts tests/e2e/career-hierarchy.spec.ts --grep "command deck geometry and visual evidence\|Career hierarchy records" --output=/private/tmp/goldlocks-round055-visual.e6WWbd --reporter=dot` | Passed 3 tests. Inspected all generated 320/393 portrait screenshots for starter/expanded navigation and Career empty, partial, full, rejected, completed, locked-route, and exit-ready states; no clipping, horizontal overflow, or trapped primary action observed. |
| `E2E_PORT=4263 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts --grep "rejected evening" --repeat-each=5 --reporter=dot` | Failed deterministically 5/5; finding V-061 below. |
| `./scripts/run` | Ready at `http://127.0.0.1:4173/` in 165ms. `curl` returned HTTP 200 for `/` and `/sw.js`. Sent Ctrl-C; subsequent curl returned HTTP 000 and host process inspection found no retained Vite/run process. |
| `npm run typecheck && npm run lint -- --max-warnings 0` | Passed after adding verifier artifacts. |
| `git diff --check` | Passed before report commit. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Phase 2 Career begins with compact objective/resources followed immediately by a player-authored composer; no lifetime stats before the action | Source inspection, 320/393 visual deck, and focused portrait probe | Satisfied |
| Four stable route identities expose allocation, primary benefit, opportunity cost, current constraint, and live current-state information | Career hierarchy deck and focused controls probe exercised all route controls and visible labels | Satisfied |
| Full route accounting/availability/evidence is available in one Details surface; replacement and focus restoration work | Verifier keyboard probe opened one route, replaced it with another, then used Escape to restore focus to its trigger | Satisfied |
| Estimates reuse authoritative state/accounting, are pure views, and track actual committed outcomes | Verifier Vitest test serialized pre-state, asserted non-mutation, and compared two atomic Worker completions with estimates across all material economic/progress deltas | Satisfied |
| Run control reports scheduled time, unallocated time, and current ready/blocking/recovery reason; quarter-hour/four-hour boundaries retain existing authority | Canonical Career suite/balance pass, deck empty/partial/full/rejected states, and verifier zero-allocation rejection probe | Satisfied for normal/rejected schedule state; recovery-result attribution fails in V-061 |
| A completed evening gives localized, accurate hours, money/progress, electricity/operating costs, constraint, and next decision | Completed normal-state deck showed the recap; adversarial rejection then offline-recovery flow renders a false 0-hour/$0 recap for a real 4-hour completion | **Not satisfied — V-061** |
| Preserve Phase 2's presentation-only boundary: no new route availability, progression, commands, state ownership, balance, or game mechanics (D-021; retained D-019/D-020) | Candidate diff/source audit plus canonical 177 unit/property tests, 101-seed Career balance, retained persistence/rejection/replay root E2E | Satisfied except the UI's transient stale result attribution in V-061 |
| Retain compact shared currency precision and precise accounting in Details/Inspect/ledger | Candidate precision tests in canonical suite; source audit; completed deck visual; independent projection deltas rounded/compared at thousandths | Satisfied |
| Collapse retained progress, evaluation, savings/costs, model/quantization, offline policy, independent exit, and diagnostics into usable progressive disclosures | Verifier keyboard probe opened all seven named native disclosures at both portrait widths | Satisfied |
| Retain visual language, glyph identity, no new mechanics/assets, and readable portrait geometry at 320 and 393 CSS pixels | Source/diff audit plus manual inspection of 34 generated original-resolution screenshots | Satisfied |
| Accessibility and interaction: labels, keyboard, touch, 100/200% text, reduced motion, no overflow/scroll trap, errors clean | Independent Playwright probe passed for 320/393, 200% text, CDP touch, tab navigation, Details focus, reduced motion, and page/console errors | Satisfied |
| Retained save/load/reload/offline/failure/recovery/PWA behavior and deterministic first-session/economy regression | Canonical 176 root E2E, 2 Pages/offline E2E, all deterministic balance suites, and manual startup/readiness/cleanup | Satisfied at durable-state level; the user-visible recovery recap fails in V-061 |
| Reproducible installation, startup, process cleanup, production build and dependency boundary | Fresh canonical `npm ci`, production build, production `npm audit --omit=dev --audit-level=high` (0), explicit startup/curl/shutdown check | Satisfied |

## Findings

### V-061 — Rejected Career submission falsely labels a later offline completion

- Severity: High.
- Related plan requirement: §20.7 Phase 2 localized completion result and applicable failure/recovery behavior; D-021 presentation-only preservation of existing offline authority.
- Expected behavior: A rejected zero-allocation Career run must not create a pending successful-result projection. A later safe-offline completion must either show its own accurate 4-hour outcome or leave the transient scheduled-run recap absent; it must never display the rejected schedule as the later completion.
- Actual behavior: The UI saves and completes a safe offline 4-hour evening, then displays `Night 1 result` with `0.00h used`, `+$0.000`, `$0.000 electricity`, `$0.000 operating`, and the rejected zero-allocation constraint. Source inspection identifies a stale `submittedCareerProjectionRef`: it is set when the zero-allocation batch is submitted and survives Worker rejection; the next unrelated increase to `completedEvenings` consumes that stale projection.
- Exact reproduction procedure:

  ```sh
  E2E_PORT=4263 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts --grep "rejected evening" --repeat-each=5 --reporter=dot
  ```

  The committed verifier test seeds a valid 4-hour safe-offline policy, submits an empty scheduled evening, verifies the Worker rejection, applies the policy, then verifies durable saved state equals `completedEvenings: 1` and `lastReport.appliedHours: 4` before asserting the rendered recap.
- Concrete evidence: All five runs failed at the same assertion. The Playwright receiver was `Completed locally … Hours 0.00h used … Money / progress +$0.000 … Constraint Allocate at least one quarter hour …`, while local storage independently proved the offline worker had completed 1 evening and applied 4 hours.
- Blocks PASS: Yes. This core completion/recovery path presents a materially false player outcome after a real state transition.

## Unverified areas

- No physical mobile-device, non-Chromium engine, native screen-reader speech, real browser-storage quota exhaustion, or hosted deployment was available. These do not replace required repository-pinned Chromium evidence, which was run successfully.
- Full developer-dependency audit still reports five pre-existing high ESLint-chain advisories. Production-only audit is clean; remediation is not needed to identify V-061.

## Residual risks

- V-061 remains unresolved and prevents acceptance.
- macOS workspace sandbox Chromium launch remains unavailable because of a host OS Mach-port restriction; scoped-host runs of the identical pinned browser supplied reproducible acceptance evidence.
- The in-tab completion recap is intentionally transient across reload according to the candidate handoff; durable outcome remains in state/ledger and retained reload/offline tests passed.
