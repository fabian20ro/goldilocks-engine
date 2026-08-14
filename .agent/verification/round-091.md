# Verification round 091 — hosted mixed-scope PWA fixture lifecycle repair

Candidate SHA: `ecf79ff124e194343233032fdca88724492cb872`

VERDICT: PASS

## Scope and authority

Evaluated exactly candidate `ecf79ff124e194343233032fdca88724492cb872`.
Scope is the test-only lifecycle repair in
`tests/e2e/verifier-round-029.spec.ts`: settle the live Pages-A controlled
worker before starting the root A-query/B-body update, while retaining exact
root-B convergence, Pages-A isolation, save preservation, offline reload, and
error assertions. No production implementation was changed.

Authority review covered `plan.md`, complete `.agent/DECISIONS.md` (D-001–D-039),
the routing index, the retained PWA/provenance/current milestone reports, and
the candidate diff. D-008 is the direct product contract: installable,
scope-isolated root and Pages shells; atomic complete-cache updates; static-host
stale-URL repair; live nested-shell isolation; persistence and offline recovery.
Routing and handoff claims were treated as navigation, not proof.

Before any verifier write, `git rev-parse HEAD` returned the supplied candidate
SHA exactly and the worktree had no tracked or staged changes.

## Environment and setup

- macOS arm64; Node 22 for focused pinned Playwright commands and Node 26 for
  the standalone probe; npm local cache `.cache/npm`.
- Repository-pinned Playwright/Chromium 1.61.1 from ignored
  `.cache/ms-playwright`.
- Sandboxed Chromium launch hit the documented macOS Mach-port permission
  boundary before test bodies. The same commands were rerun with scoped host
  authority, using the same pinned browser and repository-local caches; no
  browser check was silently skipped.
- Independent fixture servers used loopback ports 42406 and 42407 and were
  closed by `finally` cleanup. The canonical Playwright-managed servers also
  exited after their lanes.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Pass. Exact candidate `ecf79ff124e194343233032fdca88724492cb872`; only the new verifier probe was then untracked. |
| `./scripts/agent-status` | Pass. Parsed cleanly; live next gate was candidate `ecf79ff...`. |
| `node --check .agent/verification/round-091-adversarial.mjs`; targeted Prettier and ESLint | Pass after formatting the verifier probe. |
| `E2E_PORT=42403 ... npm exec --yes --package=node@22 -- npx playwright test tests/e2e/verifier-round-029.spec.ts --repeat-each=20 --reporter=line` | Pass, 20/20 host-authorized repetitions. The initial sandbox attempt failed only at Chromium launch with Mach-port permission. |
| `E2E_PORT=42405 ... npm exec --yes --package=node@22 -- npx playwright test tests/e2e/verifier-round-028.spec.ts --repeat-each=5 --reporter=dot` | Pass, 10/10. Independent retained root/Pages stale worker URL convergence. |
| `PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" PORT=42407 node .agent/verification/round-091-adversarial.mjs` | Pass, 4/4: two repetitions at 320×693 and two at 393×742. Independent fixture server and lifecycle logic. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=42408 VERIFY_EVIDENCE_DIR=.cache/verification/round-091-final ... ./scripts/verify` | Pass, one final gate after executable verifier artifacts were ready. Setup, format, lint, typecheck, 65 unit files/295 tests, all balance lanes, build, production audit (0 production vulnerabilities), root browser 234/234, and Pages/offline 2/2 passed. Evidence retained at `.cache/verification/round-091-final`. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| Test-only scope; no production repair or weakened assertion | Candidate diff contains only `.agent/HANDOFF.md` and the lifecycle test addition; production source, plan, decisions, and prior immutable reports unchanged. Existing exact root-B, Pages-A, reload-marker, save, offline, and error assertions remain. | Pass |
| D-008 root/Pages installability, scoped identity, complete-cache update and static-host A-query/B-body repair | Final canonical root/Pages PWA lanes; retained round-028 10/10; candidate round-029 20/20. All require app version, controller URL build, worker message build, scoped cache, and reload marker to agree. | Pass |
| Rule of Three — normal mixed-version state | Candidate stress and independent probe start root A plus live Pages A, switch only root to B while the server serves B bytes for the retained A worker URL, then require root B and Pages A exact identities. | Pass |
| Rule of Three — closest malformed/adversarial boundary | Static-host stale URL/query identity is exercised without a page-initiated reload; independent probe checks worker-message identity rather than trusting URL query. Canonical PWA cases additionally reject omitted/null, duplicate, out-of-scope, and partial shell metadata while retaining A. | Pass |
| Rule of Three — lifecycle/cross-feature neighbor | Independent probe closes the live Pages client, enables offline mode, opens a new Pages client, and proves the complete Pages-A cache/controller remains usable at both required widths. Root localStorage survives the root B transition. Canonical PWA coverage includes orphaned nested-cache control and offline reload. | Pass |
| Persistence, reload/resume, cache and scope isolation | Candidate and independent probes preserve localStorage and exact cache names; Pages A reloads offline after root B; canonical root/Pages update and cache-isolation suites pass. | Pass |
| Portrait browser/accessibility boundary applicable to this browser fixture | Independent probe uses touch-enabled 320×693 and 393×742 contexts, checks no document horizontal overflow, collects page/console errors, and exercises offline navigation. Full root suite retains the broader keyboard/touch/reduced-motion/text-scale/PWA matrix. | Pass |
| Installation/startup/reproducibility/process cleanup | `./scripts/setup` in final gate; pinned browser/local caches; deterministic loopback servers; independent and Playwright-managed server cleanup completed. | Pass |
| Broader inherited simulation, persistence, accounting, Research, Hype/Fear, and PWA regressions | Final canonical gate: all 65/295 unit tests, balance lanes, root 234/234, and Pages/offline 2/2. Candidate does not touch those production seams. | Pass |
| D-009 hosted exact-SHA aggregation and deployment | This narrow local verifier round does not perform external CI or deployment. The exact candidate SHA and local evidence are recorded for the Orchestrator's hosted rerun/release step. | Follow-up, not a local verification defect |

## Findings

None. No unresolved correctable candidate defect was found.

## Unverified areas

- Hosted Verify/deployment for this new candidate SHA was not run by this
  verifier; exact-SHA hosted aggregation and deployment remain the
  Orchestrator/release-owner follow-up.
- Native-device battery/thermal behavior, non-Chromium engines, and platform
  screen-reader speech output were not available. Pinned Chromium supplied the
  reproducible acceptance surface.

## Residual risks

- Hosted runner scheduling is the reason for this fixture barrier; the
  host-authorized local 20-repeat and independent 4-case runs pass, but the
  supplied hosted Verify run must be rerun on this exact SHA before release.
- Locked setup reports development-package advisories; the required production
  audit reports zero vulnerabilities. No dependency change is part of this
  candidate.
- The macOS sandbox cannot launch Chromium without host authority; future
  verification in the same environment must retain the documented scoped-host
  procedure rather than silently omitting browser evidence.
