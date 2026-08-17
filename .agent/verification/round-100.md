# Verification round 100 — M7B OIV routing candidate

Candidate SHA: `7e29e1073b266e1c27383ac1db74575d88a6b21c`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate. Before any verifier artifact was
written, `git rev-parse HEAD` returned the supplied SHA and the worktree was
clean. The candidate changes routing/acceptance documentation and catalog
metadata; no production implementation was changed by this verifier.

Used the required full release route: `AGENTS.md`, the verifier role,
`./scripts/agent-status`, `CURRENT_SCOPE.md`, `verification/INDEX.md`, the
complete `plan.md`, complete `.agent/DECISIONS.md`, `.agent/verification/catalog.json`,
`.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`, immutable round 093 and
its probes, round 078's native-device precedent, round 099, the navigation
implementation/tests, the catalog validator, and `scripts/verify`.
Routing records, handoff text, implementation tests, comments, and claimed
results were treated as navigation rather than proof.

Independent checklist:

- M7A routing remains machine-valid, contradiction-checked, and explicit about
  historical versus active scope.
- Eight destinations retain stable bottom-tab order, 44px targets, narrow
  disclosure/reveal, and no duplicate global routing.
- Normal, 320px boundary, text-scale, keyboard/touch, resize, reload, and
  reduced-motion navigation behavior remain evidenced.
- The frozen M7A receipt is exact, historical, externally corroborated, and
  not presented as current-head acceptance.
- M7B WebKit/native/performance requirements remain explicit open gates and are
  not silently represented as complete by this documentation-only candidate.
- The canonical release gate remains green, including all routing regression
  tests.

## Environment and setup

- Darwin 25.6.0 arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; browser and npm assets used ignored
  repository-local `.cache` paths.
- The final canonical run used scoped host authority for the pinned browser
  and loopback server. Browser contexts and servers from focused runs cleaned
  up; no listener remained on ports 43000–43004.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch`; `./scripts/agent-status` | Supplied SHA matched before writes; initial tree clean; status parsed cleanly and reported unverified later changes after accepted round 099. |
| Required authority/routing/decision/archive/source reads | Completed; full plan and decisions route used. |
| `npm run validate:verification-catalog` | Passed before verifier artifacts: 99 immutable reports, 96 findings, 8 active requirements. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck`; `git diff --check` | Passed. |
| Independent receipt/catalog consistency probe | Passed after correcting a verifier-side shell regex/newline escaping mistake; all receipt SHAs, M7B scope, cited paths, and candidate file boundary matched. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=43000 VERIFY_EVIDENCE_DIR=.cache/verification/round-100-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | **Failed at `unit`**, fail-fast. Catalog/setup/format/lint/typecheck passed; 64 test files passed and 306/308 tests passed. Two routing tests failed on stale M7A heading expectations; later lanes were not reached by this command. |
| `npx vitest run --coverage=false src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts` | Reproduced 2/9 failures: old `accepted Milestone 6 history and active Milestone 7A` and `Historical accepted boundary` assertions conflict with the candidate's M7B headings. |
| `E2E_PORT=43001 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts --workers=1 --reporter=line` | Passed 3/3. |
| `PORT=43002 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-097-adversarial.mjs` | Passed with `findings: []`. |
| `npm run build`; `npm audit --omit=dev --audit-level=high`; `npm run balance` | Passed: production build; 0 production vulnerabilities; all balance lanes passed, including 20,001-seed upgrade and 24/24 Laboratory. |
| `E2E_PORT=43003 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e -- --workers=1 --reporter=line` | Passed 238/238 root browser/PWA tests. |
| `E2E_PORT=43004 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm run test:e2e:pages -- --workers=1 --reporter=line` | Passed 2/2 Pages/offline tests. |
| GitHub Actions API, `git ls-remote`, live `build-info.json`, and live HTTP probe | Hosted Verify run 32071396270 attempt 2: success, exact d25e80e… SHA, all six jobs successful. Tag deploy 32072911527: build succeeded, deploy rejected by environment policy. Main deploy 32073014870: success, exact d25e80e… SHA. `main` points to d25e80e…; live build reports version `dc97ee41f6dbbc0e29d2`, Pages scope, and matching cache identity; live site HTTP 200. |
| Post-run `./scripts/agent-status`, `git status`, listener checks | No listener remained; no non-ignored candidate changes appeared before report creation. |

The canonical gate was run once after executable verification work. The
immutable report and catalog finding route are verifier metadata created after
that gate; the failed gate is therefore not concealed or rerun in a loop.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: current routing/catalog is explicit and contradiction-checked | Catalog validator passed; independent SHA/path/scope probe passed; candidate consistently distinguishes frozen M7A receipt from active M7B scope. | Routing docs satisfy the scoped requirement, but canonical release gate is blocked by V-100-001. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, narrow reveal | `src/ui/App.tsx`, `styles.css`, `glyphs.tsx`, focused navigation 3/3, round-097 probe, root 238/238. | Pass. |
| `M7A-NAV-002`: normal/boundary/lifecycle navigation | Focused pinned navigation suite and round-097 independent probe cover 393px, 320px, touch/keyboard, reduced motion, 200% text, resize, reload, fit, cues, and errors. | Pass. |
| `M7A-RELEASE-001` / D-043 frozen M7A receipt | Local decision/release/handoff references agree; GitHub Actions API, remote main, live build-info, and HTTP probe corroborate the historical d25e80e… receipt. | Pass as historical routing evidence; not a current candidate deployment claim. |
| M7B WebKit/native/performance gates | Candidate explicitly says these are next-candidate work; no WebKit lane, native speech artifact, or measured-device performance collector is present. | Open by design; not silently passed. |
| M7B evidence/blocker honesty | Release matrix, handoff, index, and scope name device/browser matrix, budgets, artifacts, cleanup, and BLOCKED policy; cited paths exist. | Pass at documentation-routing level. |
| Retained deterministic, persistence, PWA, offline, accessibility, and Lab behavior | Independent build, audit, all balances, root 238/238, Pages 2/2, navigation probe, and immutable round-093/099 evidence. | Pass for exercised retained behavior. |
| Canonical `./scripts/verify` release gate | The gate fails in unit before later lanes because two implementation-authored routing tests still assert replaced headings. | Fail; blocks acceptance. |

## Findings

### V-100-001 — stale routing assertions block the canonical gate

- **Severity:** High; release-blocking repository verification defect.
- **Related requirement:** `plan.md` §2.4; D-041 release evidence; active
  `M7A-ROUTING-001` and the canonical `./scripts/verify` contract.
- **Expected behavior:** A routing candidate that moves the active scope from
  M7A to M7B keeps its regression tests synchronized with the authoritative
  current headings, while preserving assertions for historical provenance,
  catalog validation, and non-volatile routing. The canonical gate must pass.
- **Actual behavior:** `.agent/CURRENT_SCOPE.md` now correctly says
  `accepted Milestone 7A release and active Milestone 7B` and
  `Historical accepted boundaries`; `src/test/agentWorkflowRouting.test.ts`
  still requires the old M7A title and singular heading. The same stale M7A
  title/heading assertions remain in
  `src/test/verifierRound083Workflow.test.ts`.
- **Exact reproduction:** From candidate SHA `7e29e1073b266e1c27383ac1db74575d88a6b21c`, run:

  ```sh
  npx vitest run --coverage=false src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts
  ```

  It exits nonzero with 2 failed tests and 7 passed. The canonical command
  above stops at the same unit failures before balance/build/audit/browser
  steps.
- **Concrete evidence:** The Vitest output names both assertions and shows
  the candidate's current M7B text; the full canonical run reports 64 files,
  306 passed tests, and 2 failed tests. Updating these expected routing
  literals to the current authoritative wording while retaining the semantic
  historical-boundary checks is the concrete repair.
- **Blocks PASS:** Yes.

## Unverified areas

- No WebKit, native VoiceOver/TalkBack speech session, low-end-device
  performance, physical battery/thermal measurement, or M7B artifact set was
  claimed or run; the candidate correctly leaves these as active next-slice
  gates.
- No hosted verification/deployment was run for the current docs candidate
  `7e29e107…`; the external receipt verified above is for frozen historical
  candidate `d25e80e…` only.

## Residual risks

- The active branch remains unaccepted until V-100-001 is repaired and a fresh
  exact-candidate Verifier run obtains a passing canonical gate.
- `OIV` is used consistently as the M7B routing label after the candidate's
  terminology change; no product behavior depends on acronym expansion, and
  the authoritative M7B requirements remain explicit in full elsewhere.
