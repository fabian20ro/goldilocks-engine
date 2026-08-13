# Verification round 083 — release workflow and settlement provenance

Candidate SHA: `1e1ff316ab771a60ff06d61032fadd992f43e916`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `1e1ff316ab771a60ff06d61032fadd992f43e916`. It exactly matched the supplied
  candidate SHA. The initial worktree was clean.
- This is release verification, so I read the complete `plan.md`, complete
  `.agent/DECISIONS.md` through D-036, the full immutable report archive, and
  the cited regression tests and probes. `CURRENT_SCOPE.md` and `INDEX.md`
  were used as routing hints only. The product ancestor under evaluation is
  the unverified `0bdff6ea88f7496bfb8348c7551652bf53a676ca`.
- Candidate production behavior was inspected independently. The workflow
  delta is limited to protocol/routing/configuration, `scripts/verify`, and
  tests/documentation; no production implementation was changed by this
  verifier. The only verifier-authored executable artifact is
  `src/test/verifierRound083Workflow.test.ts`.

## Independent requirement checklist

1. Release verification must use the full authority route, retain verifier
   independence, parse the local Luna/max role profiles, and require an exact
   candidate SHA before any write.
2. `CURRENT_SCOPE.md` and `INDEX.md` must truthfully route the active product
   boundary: last PASS 078, unverified product candidate `0bdff6e`, open FAIL
   reports 079–082, no prior round-083 PASS, and the Research/deployment gate.
3. Lean/release boundaries, Rule-of-Three coverage, threat-model boundaries,
   max canonical/checkpoint policy, and archived/superseded probe handling must
   preserve independent acceptance rather than making routing documents proof.
4. `scripts/verify` must fail fast before expensive lanes, retain every
   canonical lane, and write compact accurate evidence for both failure and
   success. Routing tests must not pass when protocol and script behavior
   disagree.
5. Under plan §17 and D-034/D-036, valid original integrity preserves the
   failed Job's own typed cause after later Career activity; stale, invalid, or
   absent integrity retains operable state but clears optional precise
   provenance and displays `Cause unknown`. IDs, ordering, task fields,
   markers, `directCause`, and prose are not authentication.
6. Under D-035/D-036, future or colliding retained IDs cannot freeze Worker
   progress; repair remains deterministic and unique. D-030/D-033 accounting,
   D-018 portrait reserve, persistence, offline/reload, accessibility, and PWA
   behavior remain regression boundaries.

## Environment and setup

- macOS/Darwin arm64; Node `v22.23.2` supplied by
  `npm exec --yes --package=node@22`; repository-pinned Playwright Chromium and
  ignored repository-local `.cache/npm` and `.cache/ms-playwright` caches.
- TOML parsing used Python `tomllib`; implementer and verifier profiles parse
  with `gpt-5.6-luna`, `model_reasoning_effort = "max"`, and
  `workspace-write`. The root-only orchestrator profile follows the local
  convention and does not claim a child-agent model.
- The canonical browser command required a scoped host invocation for the
  macOS Chromium Mach-port rendezvous. It used the same loopback server,
  repository-local browser cache, and pinned Node22 environment; browser work
  was not skipped. The final preview on port 43483 was no longer reachable
  after the gate, confirming process cleanup.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short`; full source/authority audit | Exact frozen candidate SHA; clean before verifier writes. Full plan, decisions, archive, role, scope, index, and candidate diff reviewed. |
| Node22 focused Vitest for `verifierRound083Workflow`, routing/verify workflow tests, archived V-078–V-082 UI tests, settlement provenance, and engine tests | 10 files, 79/79 tests passed. |
| `git diff --check` and Prettier on the new verifier test | Passed. |
| `round-079-adversarial.mjs` on pinned loopback preview | Passed: valid-integrity later Career cause, success/zero/partial accounting, 320/393 portrait, keyboard/touch, 200% text, reduced motion, offline/reload, and no page/console/overflow findings. |
| `round-080-adversarial.mjs` on pinned loopback preview | Exited nonzero only on its retained historical exact-cause assertion. Actual current behavior is `Cause unknown`; this is the D-036-superseded expectation, not a candidate defect. Its layout, touch/keyboard, offline, and error checks passed. |
| `round-081-adversarial.mjs` on pinned loopback preview | Passed with no findings: structural relink remains unknown and future-ID restore continues uniquely across reload/ticks. |
| `round-082-adversarial.mjs` on pinned loopback preview | Passed with no findings: canonical-looking marker mutation remains unknown at 320/393, touch/keyboard, 200% text, reduced motion, and offline reload. |
| Earlier archived probes inspected/run where relevant | R064/R066 emitted their expected screenshot decks without an assertion finding; R070, R075, and R078 completed with no findings. R067/R068/R073/R074/R076/R077 retain obsolete pre-D-032 global speed/warning selectors; R072 retains a pre-D-032 affordability fixture. These are accurately classified as superseded archival probes, not silently treated as current acceptance. |
| Independent workflow adversarial test with fake npm lanes | Failure injection stopped at `build` after setup/format/lint/typecheck/unit/balance and wrote exact compact summary/logs; success injection retained all ten lane logs and summary entries. The test also cross-checks scope/index/report/probe/D-036 claims and role independence. |
| `E2E_PORT=43483 VERIFY_EVIDENCE_DIR=.cache/verification/round-083-final PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache=.cache/npm npm exec --yes --package=node@22 -- sh ./scripts/verify` | Exactly one final clean canonical run, exit 0. Setup, format, lint, typecheck, 53 test files/251 unit tests, balance, build, production audit, root PWA 229/229, and Pages/offline 2/2 all passed. Summary and per-lane logs are retained under `.cache/verification/round-083-final`. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| Release/full-read route and verifier independence | Full plan/decision/archive read; role profiles parse; routing docs treated as untrusted; no production edits; one final canonical gate only. | Pass |
| Scope/index truth and exact gate ordering | Scope names product candidate `0bdff6e`, last PASS 078, FAIL 079–082, no prior 083 PASS, exact source map, and Research block. Index maps every V-078–V-082 to report, regression, canonical lane, and retained probe. | Pass |
| Lean/release boundary, Rule-of-Three, threat model, checkpoint/max policy | Role/protocol assertions plus independent fake-lane adversarial tests cover valid state, malformed/adversarial recovery, lifecycle neighbor, fail-fast, all-lane retention, and no routing-only shortcut. | Pass |
| Plan §17; D-034/D-036 valid integrity and V-078 | Valid sealed Job failure remains its own typed cause after later Career failure in focused tests, root E2E, and R079 probe. | Pass |
| D-036 stale/free-text decoy (V-079) | R080 current behavior and focused regression show stale provenance is cleared and UI reports `Cause unknown`. The old R080 exact-cause assertion is retained and explicitly superseded only by D-036. | Pass |
| D-034/D-035 structural relink/reorder (V-080) | Focused regression, R081 probe, root `jobs-settlement-provenance` E2E, reload/offline checks show no precise cause is rebuilt. | Pass |
| D-035 future/colliding IDs and deterministic progress (V-081) | Engine regression, R081 probe, and canonical root E2E show unique allocation, repeated-tick progress, and reload/resume continuity. | Pass |
| D-036 canonical-looking marker forgery (V-082) | Focused regression, R082 probe, and canonical root E2E show changed stale markers cannot become a precise cause; fallback remains unknown through offline reload. | Pass |
| D-030/D-033 settlement accounting and D-018 reserve | R079 plus canonical root tests cover success, zero and partial payout, actual cash delta, fixed precision, native keyboard/touch details, and 320/393 raw reserve. | Pass |
| Plan §§8–10, 19–20, 24.1/24.5/24.6 and prior regressions | Final canonical balance/build/unit/root/Pages lanes pass; persistence, malformed-state recovery, Worker concurrency, reload/offline, reduced motion, text scaling, drag/touch, PWA, and failure/recovery cases are exercised. | Pass |
| Browser installation/startup/process cleanup/security | Locked setup and repository-local cache, deterministic loopback preview, pinned Chromium, 229 root + 2 Pages tests, production audit with zero findings, and closed final port. | Pass |

## Findings

None. R080's nonzero historical assertion is not an unresolved finding: D-036
explicitly supersedes only that stale-precision expectation, while the current
candidate's `Cause unknown` behavior is the required result. No V-078–V-082
defect remains reproduced under the current authority.

## Unverified areas

- Exact-SHA hosted verification/deployment was not performed. That is the
  explicitly ordered post-PASS owner/deployment gate, and this verifier was
  instructed not to push. Research remains blocked until that exact accepted
  SHA is hosted, verified, deployed, and authorized.
- No non-Chromium browser or native screen-reader speech session was run.
  Pinned Chromium covered programmatic semantics, keyboard/touch, focus,
  portrait widths, text scaling, reduced motion, persistence, offline/reload,
  malformed state, failure/recovery, and page/console errors.

## Residual risks

- The retained R080 probe intentionally contains its historical stale-precision
  assertion. Its unchanged source and INDEX label must remain together so a
  future verifier does not mistake that expected nonzero result for a current
  product failure or silently delete the probe.
- `npm ci` reports development-package advisories during setup; the required
  production audit lane reports zero vulnerabilities. No dependency or
  production implementation change was made in this round.
- Hosted exact-SHA deployment and owner authorization remain required before
  Milestone 4 Research; this local PASS does not waive those gates.
