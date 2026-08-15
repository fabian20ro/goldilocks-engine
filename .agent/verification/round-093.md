# Verification round 093 — Milestone 6 Local Laboratory endgame

Candidate SHA: `db43d20b0334f3daba5f2e4f03414fb7da10ded7`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. This is broad Milestone 6 and
retained-contract verification. I read `AGENTS.md`, the verifier role,
`plan.md`, `.agent/DECISIONS.md`, routing records, and the relevant immutable
verification archive. Direct authorities were `plan.md` §29 and D-040,
including the four-machine/three-pipeline Lab, collaborators, reproducibility
switches, cultures, deterministic unlocks, founding choices, bounded endings,
schema-7 restore boundary, Worker-only lifecycle, safe offline behavior,
exact-once economy, and 320/393/200% accessibility evidence. Existing Career,
Research, Hype/Fear, accounting, Worker, PWA, and offline contracts remained in
scope. `CURRENT_SCOPE.md`, `INDEX.md`, handoff text, implementation tests, and
comments were treated as untrusted guidance.

Before any verifier artifact was written, `git rev-parse HEAD` matched the
supplied candidate exactly. No production implementation file was changed.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1` and Chromium in ignored
  `.cache/ms-playwright`.
- The initial sandboxed Chromium launch failed before test bodies with
  `MachPortRendezvousServer ... Permission denied`. The same scoped,
  repository-pinned browser commands were rerun with host authority; no
  required browser lane was skipped.
- Preview servers, Playwright contexts, and independent probe process groups
  were cleaned up. A post-run `curl` confirmed the loopback preview was closed.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `./scripts/agent-status`; routing/authority reads | Candidate SHA matched; live status parsed cleanly; full-read route completed. |
| `npm run format:check && npm run lint && npm run typecheck` | Passed. |
| `node_modules/.bin/vitest run --coverage=false src/simulation/laboratory.test.ts src/simulation/engine.test.ts` | Passed, 2 files / 64 tests. |
| `node .agent/verification/round-092-adversarial.mjs` | Passed with no findings; former V-092-001/V-092-002 seams no longer reproduce. |
| `node .agent/verification/round-093-adversarial.mjs` | Passed with `findings: []`; 24 normal runs, active/waiting founding rejection, offline/reload/resume, 2- and 3-machine parallel capacity, non-finite queue no-op, and malformed restore checks. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright E2E_PORT=42495 npm run test:e2e -- tests/e2e/laboratory.spec.ts` | Passed, 1/1. |
| `node .agent/verification/round-093-ui-adversarial.mjs` | Passed with `findings: []` at 320px and 393px; touch, reduced motion, 200% text, reload/offline persistence, lifecycle messaging, founding, and page/console error checks. |
| Retained probes from rounds 079–090 | 079, 081, 082, 086, 089, and 090 passed. Round 080's two findings assert a pre-D-036 exact-cause string; current authoritative behavior is `Cause unknown`. Round 085's two findings assert a pre-Lab six-destination count; D-040 requires eight. Round 087 times out on a stale unsealed Research fixture that current restore correctly fail-closes. Round 092's UI probe times out on malformed duplicate-machine state that current restore correctly falls back from. These historical expectations/fixtures are superseded, not candidate defects; the independent round-093 probes and canonical suite cover the current contracts. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=42500 VERIFY_EVIDENCE_DIR=.cache/verification/round-093-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | Passed once after executable verifier artifacts were ready: format/lint/typecheck; 66 files / 305 tests; all balance lanes; 17 experiments; build; production audit with 0 vulnerabilities; root PWA 235/235; Pages/offline 2/2. |

The final canonical gate preceded creation of this immutable Markdown report;
the report is non-executable evidence and the gate was not looped afterward.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| Milestone 6 coherent Bedroom Developer-to-Local-Laboratory route, multiple viable routes, understandable failures, replay variation (`plan.md` §29) | Canonical Lab balance lane (24/24 valid, completed, and ended; 17 experiments), focused Lab tests, independent engine/UI probes, and root browser/PWA suite. | Satisfied. |
| Four machines, three bounded parallel pipelines, collaborators, reproducibility systems, retained documentation, three cultures, scenario unlocks, three founding choices (D-040) | Candidate source inspection; focused Lab tests; independent probe buys/assigns distinct machines, runs two and three pipelines, rejects conflicts, and preserves exact-once purchases; canonical balance/evaluation lanes cover route data. | Satisfied. |
| Founding must not close with waiting/active work; completed founding keeps an honest trace | Independent engine probe rejects both waiting and active `FOUND_LAB` with semantic state/economy preservation, restores active work, confirms safe offline no-op, and settles only by Worker tick. UI probe confirms disabled founding and lifecycle explanation at both widths, then confirms settled founding. | Satisfied; V-092-001 resolved. |
| Machine/pipeline capacity and transactional economy | Independent probe confirms unassigned queue no-op, conflicting assignment no-op, purchase once, two distinct machines for two active runs, three distinct machines for three active runs, and non-finite queue count exact no-op. | Satisfied; V-092-002 resolved. |
| Worker-only deterministic progress, bounded failure traces, persistence/reload/resume, safe offline no queue/complete/found (D-040; §§19, 24, 27) | Focused tests, round-093 engine probe, UI reload/offline probe, Lab balance lanes, and canonical Worker/PWA/offline checks. | Satisfied. |
| Schema 7 / `local-lab-1`; malformed, stale, duplicate, unsealed, or active-without-capacity restore fallback | Independent malformed duplicate allocation plus active-without-machine fixture restores to valid safe Lab state; canonical migration and malformed-save lanes pass. | Satisfied. |
| Eighth Lab destination, explicit gate, progressive details, 44px controls, portrait/text/reduced-motion safety and visible consequences | Focused Lab E2E; independent Playwright at 320/393 with touch, reduced motion, 200% text, no overflow, reload/offline, lifecycle copy, and no page/console errors; root 235/235 and Pages 2/2. | Satisfied. |
| Retained Career, Research, Hype/Fear, accounting, provenance, Worker, PWA, offline, security, and prior endings contracts | Canonical 66-file/305-test suite, all balance lanes, build/audit, root 235/235, Pages/offline 2/2, and retained independent probes. | Satisfied. |
| Reproducible setup/startup/cleanup and exact-SHA evidence | `./scripts/verify` setup and pinned local browser cache passed; loopback servers became ready and were terminated; candidate SHA was captured before writes and remains named above. | Satisfied. |

## Findings

None. The two unresolved findings from round 092 were independently reproduced
as resolved on this exact candidate. No material applicable requirement remains
without evidence.

## Unverified areas

- Native iOS/Android devices, battery/thermal behavior, non-Chromium engines,
  and platform screen-reader speech output were unavailable. Pinned Chromium
  supplies reproducible browser evidence for the repository's acceptance lane.
- Hosted CI/deployment of this exact accepted SHA remains the Orchestrator's
  release handoff; local setup, startup, cleanup, and canonical checks passed.

## Residual risks

- The sandbox Mach-port restriction may affect an equivalent local environment;
  scoped host reruns passed all required browser checks.
- Finite Lab scenarios and later expansion systems remain outside Milestone 6's
  declared boundary; this verification does not imply those deferred systems.

