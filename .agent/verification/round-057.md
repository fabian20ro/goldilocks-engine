# Verification round 057 — Career response-bound recap composition

Candidate SHA: `6e94f73e9a39f453140e7ab9489fb140a6566286`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write: `6e94f73e9a39f453140e7ab9489fb140a6566286`.
- Exact match with supplied candidate SHA; initial worktree clean.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, immutable reports through round 056, candidate source, and candidate diff. Handoff, implementation tests, and claims used only as probe hints.
- Verifier-authored artifact: `tests/e2e/verifier-round-057.spec.ts`. No production implementation file changed.

## Environment and setup

- macOS host; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned `@playwright/test` `1.61.1`; Chromium from ignored `.cache/ms-playwright`; deterministic loopback ports.
- Workspace-sandbox Chromium cannot create its macOS Mach-port rendezvous server. Scoped-host commands used the same repository-pinned browser and commands; no browser verification was skipped.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Exact candidate match before verifier writes. |
| `command -v npx` | Present: `/opt/homebrew/bin/npx`. |
| `E2E_PORT=4310 ./scripts/verify` | Fresh setup, format, lint, typecheck, unit/property tests, balances, build, and production audit passed. Browser launch failed before test bodies only because sandboxed macOS Chromium was denied Mach-port registration. |
| `E2E_PORT=4311 ./scripts/verify` (scoped host) | Passed: fresh `npm ci`; format/lint/typecheck; 179 unit/property tests; numeric, first-session (41 seeds), 20,001-seed upgrade, progression (41), Career (101), and evaluation (121) balances; build; production `npm audit --omit=dev --audit-level=high` with 0 vulnerabilities; 181 root Playwright tests; 2 Pages/offline tests. |
| `npx vitest run src/ui/useSimulation.test.tsx --coverage.enabled=false --reporter=dot` | Passed 6/6. Candidate hook boundary coverage exercised. |
| `E2E_PORT=4313 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts --repeat-each=10 --reporter=dot` | Passed 30/30. Retained V-061 rejected-run and V-062 two-completion attribution regressions remain repaired. |
| `E2E_PORT=4314 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "command deck geometry and visual evidence" --reporter=dot` | Passed 2/2. Recreated and inspected 20 original-resolution Build, Jobs, Career, Upgrades, and Inspect screenshots: starter/expanded, 320×693 and 393×742. |
| `./scripts/run`; HTTP probes; controlled stop | Ready at `127.0.0.1:4173` in 71ms; `/` and `/sw.js` returned HTTP 200. After Ctrl-C, root probe returned `000`; process inspection found no retained server. |
| `E2E_PORT=4315 npm run test:e2e -- tests/e2e/verifier-round-057.spec.ts --grep 'later non-completing' --repeat-each=10 --reporter=dot` | Natural real-Worker double-action probe failed 9/10, showing timing-dependent loss of the recap. |
| `npm run typecheck` | Passed after verifier probe creation. |
| `E2E_PORT=4316 npm run test:e2e -- tests/e2e/verifier-round-057.spec.ts --grep 'later non-completing' --repeat-each=10 --reporter=dot` | Failed 10/10. The verifier buffers and releases the two real Worker response callbacks in one browser task, the ordering explicitly required by D-023. Durable state reaches one completed evening with a zero-hour offline report; `Latest evening result` is absent. |
| `E2E_PORT=4317 npm run test:e2e -- tests/e2e/verifier-round-057.spec.ts --grep 'later durable' --repeat-each=10 --reporter=dot` | Passed 10/10. A later successful offline completion still recovers a failed preceding Run save and shows Night 2. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` | Passed after verifier artifacts. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 foundation: preserve deterministic Worker, one-pipeline topology, persistence, PWA, and command-deck grammar; no new simulation system | Candidate diff audit; clean scoped-host canonical unit/balance/build/PWA suites | Satisfied locally |
| Phase 0/1 and D-019: App-session four-route draft, atomic batch, human-paced edits, tick/speed/pause/tab/reload/malformed recovery, durable exact-once execution | Scoped-host canonical suite; 25-repeat retained human-paced Career probe in the candidate suite; V-061/V-062 regressions 30/30 | Satisfied locally |
| Phase 2: compact Career objective/resources before composer, four stable routes, benefit/opportunity cost, Details/focus surface, estimates from authoritative catalog/accounting, one singular Run with total/unallocated/block status | Scoped-host canonical Career suites; fresh 320/393 screenshot deck; source/diff audit | Satisfied locally |
| Phase 2 localized completion result: hours, money/progress, electricity/operating cost, constraint, and next decision must be correctly tied to a completed evening | Normal, rejected, and two-completion paths pass, but a completed Run result can disappear under an ordered non-completing follow-up | **Not satisfied — V-063** |
| D-022: a non-completing response invalidates only its own recap; direct offline response uses its own boundary | Immutable V-061 passed; new Run-complete then safe-offline-zero probe proves the later non-completing response also invalidates the earlier completed Run recap | **Not satisfied — V-063** |
| D-023: every recap uses its exact ordered Worker before/after boundary when several valid commands arrive before React renders | New verifier real-Worker browser probe releases response IDs 1 then 2 in one task, as D-023 explicitly requires. Candidate retains only response 2 and drops response 1. | **Not satisfied — V-063** |
| Progressive disclosure, shared currency precision, palette/glyph reuse, no added page/mechanic/raster asset | Candidate diff audit; scoped-host canonical suite; fresh visual inspection | Satisfied locally |
| Portrait/accessibility: 320 and 393 widths, 100%/200% text, touch, keyboard, names/focus, reduced motion, 44px targets, no horizontal/nested-scroll trap, no page errors | Scoped-host canonical root suite; fresh 20-image original-resolution deck; focused human-paced Career and no-page-error probes | Satisfied locally |
| Phase 3/4 retained cross-screen presentation, shared details/currency/glyph behavior, startup/install, offline/PWA/reload, production audit | Scoped-host canonical: build, audit, 181 root E2E, 2 Pages/offline; startup/readiness/cleanup probes; visual deck | Satisfied locally, pending release gate |
| Phase 4 exact-SHA hosted aggregate/deploy/live expert playthrough | Not attempted after a local P0-equivalent Career feedback defect prevented a defensible acceptance candidate. | Not accepted |

## Findings

### V-063 — A later non-completing Career response erases the preceding completed Run recap

- Severity: High.
- Related plan requirement: §20.7 Phase 2 localized completion result and command-ordering coverage; D-022 response-bound completion feedback; D-023 Worker-bound recap snapshots and concurrency boundary.
- Expected behavior: A valid `Run scheduled evening` that completes one 4-hour freelance evening must render its localized Night 1 result. If a valid immediately queued `Apply safe offline policy now` response applies zero hours, that non-completing response invalidates only its own potential recap; it must not erase the already completed Run result.
- Actual behavior: Durable state is correct (`completedEvenings: 1`, `offlineHours: 0`), but no `Latest evening result` status exists. The Run recap is lost when React receives the two ordered Worker responses before it renders either one.
- Exact reproduction procedure:

  ```sh
  E2E_PORT=4316 npm run test:e2e -- tests/e2e/verifier-round-057.spec.ts --grep 'later non-completing' --repeat-each=10 --reporter=dot
  ```

  The committed browser test seeds an enabled safe policy with a zero-hour cap, enters `4.00h` freelance, opens the existing policy disclosure, synchronously activates both visible Career buttons, and releases the two real Worker response callbacks together in one browser task. It does not fabricate Worker state or a simulation response.
- Concrete evidence: 10/10 failures at `getByRole('status', { name: 'Latest evening result' })`; each run first proves saved `{ completedEvenings: 1, offlineHours: 0 }`. The unbuffered real-Worker action sequence also failed 9/10. Candidate source corroborates the cause: `useSimulation` publishes only one `lastWorkerResponse`; in `App`, the submitted Run sees response ID 2 greater than its ID 1 and is cleared before its ID 1 boundary is processed. The pending offline result then correctly clears as non-completing, leaving no recap.
- Blocks PASS: Yes. D-023 explicitly requires composition when multiple valid Career commands are posted before React renders any response, and this sequence causes a completed player action to have no visible outcome feedback.

## Unverified areas

- Hosted exact-SHA aggregation/deployment and live smoke test not run; local V-063 fails first.
- No physical mobile device, non-Chromium engine, native screen-reader speech, real storage-quota exhaustion, or external deployment access. These do not replace the successful repository-pinned Chromium coverage.
- Full development-dependency audit retains five high ESLint-chain advisories. Canonical production-only audit reports zero vulnerabilities.

## Residual risks

- V-063 is unresolved. The committed verifier regression should remain red until response-bound recaps are retained or queued per request, rather than overwritten by a single last response.
- V-061 and V-062 remain repaired in their tested sequences, but V-063 proves the response-bound design does not compose with a later valid non-completion.
- Scoped-host browser launch remains necessary on this macOS host because of sandbox Mach-port policy; the repository-pinned browser and commands remain reproducible.
