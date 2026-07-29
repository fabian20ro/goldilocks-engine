# Verification round 056 — Career Phase 2 response ordering

Candidate SHA: `da656b5ebe875e7a26a0ae33617dccd0d7def4ff`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write: `da656b5ebe875e7a26a0ae33617dccd0d7def4ff`.
- Exact match with supplied candidate SHA; initial worktree clean.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`, all `.agent/DECISIONS.md`, immutable round 055, and candidate source/diff. Handoff and candidate tests treated only as probe hints.
- Verifier-authored artifact: `tests/e2e/verifier-round-056.spec.ts`. No production file changed.

## Environment and setup

- macOS host; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned `@playwright/test` `1.61.1`; Chromium from ignored `.cache/ms-playwright`; deterministic loopback ports.
- `./scripts/verify` cleanly ran `npm ci`, static checks, deterministic balances, production build/audit, root Playwright, and Pages/offline Playwright.
- Workspace-sandbox Chromium cannot create its macOS Mach-port rendezvous server. Scoped-host runs used the same pinned browser and repository commands; no required browser check was skipped.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Exact candidate match before verifier writes. |
| `command -v npx` | Present: `/opt/homebrew/bin/npx`; repository-pinned browser path usable. |
| `E2E_PORT=4280 ./scripts/verify` | Setup, format, lint, typecheck, 178 unit/property tests, every balance sweep, build, and production audit passed. All browser launches then failed before test bodies only because sandboxed macOS Chromium was denied Mach-port registration. |
| `E2E_PORT=4281 ./scripts/verify` (scoped host) | Passed: fresh `npm ci`; format/lint/typecheck; 178 unit/property tests; numeric, first-session (41 seeds), 20,001-seed upgrade, progression (41), Career (101), and evaluation (121) balances; production build; production `npm audit --omit=dev --audit-level=high` with 0 vulnerabilities; 179 root Playwright tests; 2 Pages/offline tests. |
| `npx vitest run src/simulation/verifierRound055.test.ts --coverage.enabled=false --reporter=dot` | Passed. Pure projection/non-mutation and atomic Worker accounting comparison. |
| `E2E_PORT=4285 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts --grep "rejected evening" --repeat-each=5 --reporter=dot` | Passed 5/5. V-061 regression repaired: rejected zero-hour run cannot relabel a later offline completion. |
| `E2E_PORT=4286 npm run test:e2e -- tests/e2e/career.spec.ts --grep "human-paced App-session draft through Worker ticks, speed, pause, and tabs at 393px" --repeat-each=25 --reporter=dot` | Passed 25/25: human-paced numeric/touch edits, ticks, 1×/64×, Jobs pause, and tab return. |
| `E2E_PORT=4284 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "command deck geometry and visual evidence" --reporter=dot` | Passed 2/2. Fresh starter/expanded screenshot deck at 320×693 and 393×742; inspected all 20 original-resolution images. |
| `E2E_PORT=4283 npm run test:e2e -- tests/e2e/verifier-round-056.spec.ts --repeat-each=5 --reporter=dot` | Failed deterministically 5/5: V-062. Durable save had `completedEvenings: 2`, while visible result said `Night 1 result`. |
| `./scripts/run`; `curl` root and worker path; Ctrl-C; repeat curl and process inspection | Ready on `127.0.0.1:4173` in 152ms; root HTTP 200. Dev mode intentionally does not register PWA worker. Ctrl-C left root unreachable (`000`) and no retained Vite/run process. |
| `npm run typecheck`; `git diff --check` | Passed after verifier test creation. Initial verifier-test typecheck caught a local `SVGElement` narrowing mistake; corrected before browser execution. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 Phase 2 compact Career objective/resources then evening composer; no lifetime-report wall before action | Fresh 320/393 Career screenshots; canonical Career hierarchy/geometry suites | Satisfied |
| Four stable route cards show allocation, benefit, opportunity cost, current state; exact economics/evidence stay in Details | Canonical 179-browser suite; focused Career screenshots; retained Details/focus tests | Satisfied |
| Projections use existing catalog/accounting and remain presentation-only | `verifierRound055.test.ts` pure/non-mutation and atomic accounting pass; candidate diff audit | Satisfied |
| Singular Run, four-hour total, unallocated amount, quarter-hour/cap/rejection authority | Canonical Career/unit/balance suites; 25-repeat human-paced test; rejected V-061 flow | Satisfied |
| Draft survives normal Worker publications, speed, pause, tabs, touch/keyboard, reload boundary, malformed recovery, and exactly-once durable execution (retained Phase 1 / D-019 / D-020) | Canonical Career and retained verifier suites; 25/25 human-paced 393px probe; 320 coverage in canonical suite | Satisfied |
| Rejected run retains valid draft; V-061 rejected-run → safe-offline recovery reports the actual later completion | Immutable round-055 browser regression passed 5/5; canonical suite passed | Satisfied |
| Completion recap is accurately attributed to its own completed Worker response, including command ordering / direct safe-offline action (Phase 2, D-022) | New verifier Playwright probe submits valid Run then valid safe-offline action before either response renders; two durable evenings complete but UI labels second result as Night 1, 5/5 | **Not satisfied — V-062** |
| Localized recap retains hours, money/progress, electricity/operating cost, constraint, next decision | Normal and V-061 recovery paths pass. Concurrent second completion has false night identity, so complete result attribution is not reliable | **Not satisfied — V-062** |
| Retained progressive disclosures, compact currency precision, palette/glyph grammar, no new mechanic/page/asset | Candidate diff audit; canonical Career hierarchy; 20 fresh visual screenshots | Satisfied |
| Browser accessibility / portrait contract: 320 and 393, 100/200% text, keyboard, touch, reduced motion, 44px targets, no horizontal overflow/nested composer trap/page errors | Canonical root suite; prior verifier focused suite in canonical; fresh visual deck; 25-repeat Career flow | Satisfied |
| Retained startup, clean installation, PWA root/Pages, offline/reload, migration, failure/recovery, security and production build | Scoped-host canonical gate: 179 root + 2 Pages/offline browser tests; clean setup/build; production audit 0; explicit startup/cleanup | Satisfied |
| Required fresh visual inspection of all five tabs, starter/expanded, at 320 and 393 | Inspected Build, Jobs, Career, Upgrades, Inspect screenshots: 20 original-resolution images from fresh candidate run | Satisfied |

## Findings

### V-062 — Concurrent Career completions mislabel the later result as Night 1

- Severity: High.
- Related plan requirement: §20.7 Phase 2 localized completion result; required command-ordering/concurrency and recovery coverage; D-022 response-bound Career completion feedback.
- Expected behavior: If the player validly activates `Run scheduled evening` and `Apply safe offline policy now` before either Worker response renders, the later offline completion must use its own post-first-command Worker boundary and render as Night 2. The compact result must never attribute that durable second completion to the stale initial schedule state.
- Actual behavior: Both actions complete durably: saved state is `{ completedEvenings: 2, offlineHours: 4 }`. The rendered `Latest evening result` instead says `Night 1 result` with a four-hour freelance recap. This is deterministic across five fresh browser contexts.
- Exact reproduction procedure:

  ```sh
  E2E_PORT=4283 npm run test:e2e -- tests/e2e/verifier-round-056.spec.ts --repeat-each=5 --reporter=dot
  ```

  The committed verifier test seeds an enabled bounded offline policy, fills four freelance hours, opens the existing Safe freelance-only automation disclosure, then synchronously invokes both visible buttons before either Worker response is published.
- Concrete evidence: 5/5 failures at `Night 2 result`; each receiver displayed `Completed locally Night 1 result ... Hours 4.00h used`, after localStorage independently established two completed evenings and a 4-hour offline report. Candidate source corroborates the cause: `applySafeOfflinePolicyNow` records the pre-first-response `state` and `completedEvenings`; the later effect renders `pending.completedEvenings + 1` even though Worker request ordering made that offline response the second completion.
- Blocks PASS: Yes. A normal accessible interaction sequence produces a player-visible, false completion identity in the Career action loop.

## Unverified areas

- Hosted exact-SHA aggregation/deployment and live smoke test not run; candidate fails locally before release evidence could matter.
- No physical mobile device, non-Chromium engine, native screen-reader speech, real storage-quota exhaustion, or external production deployment access. These do not replace the successful pinned Chromium evidence.
- Full development-dependency audit retains five high ESLint-chain advisories; canonical production-only audit is clean. No production vulnerability was reported.

## Residual risks

- V-062 remains unresolved; new regression test is committed with this report for the next narrow repair candidate.
- V-061 is resolved for the rejected-to-offline sequence, but its repair does not safely compose with a still-pending valid Career completion.
- Sandboxed macOS Chromium remains unavailable due host Mach-port policy; scoped-host canonical and adversarial runs are reproducible with the repository-pinned browser.
