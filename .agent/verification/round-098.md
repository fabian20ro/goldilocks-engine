# Verification round 098 — manual exact-candidate release workflows

Candidate SHA: `8d7d422e469041f26423fba84037d4059de58d29`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier artifact was
written, `git rev-parse HEAD` matched
`8d7d422e469041f26423fba84037d4059de58d29`. No production implementation was
changed by this verifier.

This was release verification, so the full-read route was used. The required
sources were read in order: `AGENTS.md`, `.codex/agents/verifier.toml`, live
`./scripts/agent-status`, `.agent/CURRENT_SCOPE.md`,
`.agent/verification/INDEX.md`, and `.agent/verification/catalog.json`. The
complete `plan.md`, complete `.agent/DECISIONS.md`,
`.agent/RELEASE_ACCEPTANCE.md`, `.agent/HANDOFF.md`, and the immutable
verification archive were then read or routed as applicable. Direct candidate
sources included both GitHub workflows, their workflow tests, the composite
verification action, the navigation implementation/tests, and retained
round-093 through round-097 probes.

Routing records, handoff claims, implementation-authored tests, comments, and
claimed results were treated as untrusted guidance. Independent checklist:

- machine-valid verification routing and immutable-report consistency;
- manual Verify and Pages dispatch-only exact-candidate contracts;
- checkout/ref identity and `HEAD == GITHUB_SHA` gates;
- Verify aggregate and Pages handling of an adversarial candidate input;
- eight-tab navigation, normal 393px fit, 320px disclosure/reveal, and the
  200% text lifecycle Rule of Three;
- retained Lab, PWA, provenance, accounting, malformed-state, offline,
  reload, focus, touch, and error/recovery probes;
- canonical deterministic, browser, Pages/offline, build, and audit lanes;
- startup readiness and process cleanup.

## Environment and setup

- macOS arm64 (`Darwin 25.6.0`), Node `v26.7.0`, npm `11.19.0`.
- Repository-pinned `@playwright/test` `1.61.1`; Chromium and npm caches were
  kept in ignored repository-local `.cache/` paths.
- The first sandboxed Chromium launch failed before page creation with the
  managed macOS `MachPortRendezvousServer ... Permission denied` error. The
  same pinned commands were rerun with scoped host authority; browser lanes
  then completed.
- Deterministic loopback servers were started only for the scoped probes and
  stopped afterward. No listener remained on the round ports.

## Commands executed and results

| Command or evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch`; `./scripts/agent-status` | Supplied SHA matched before writes; initial candidate tree was clean; live status parsed cleanly and identified round 098 as the next gate. |
| Required full-read authority, routing, decision, release-matrix, handoff, candidate-source, and archive reads | Completed independently. |
| `npm run validate:verification-catalog`; format, lint, typecheck, and `git diff --check` | Passed on the candidate before the round-098 report existed: 97 immutable reports, 95 findings, 4 active requirements; static checks clean. |
| Sandboxed `INSTALL_PLAYWRIGHT=0 E2E_PORT=42498 ... ./scripts/verify` | Blocked before browser test bodies by the managed macOS Chromium Mach-port permission. |
| Host-authorized `INSTALL_PLAYWRIGHT=0 E2E_PORT=42498 VERIFY_EVIDENCE_DIR=.cache/verification/round-098-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | Passed the complete canonical suite: setup, format, lint, typecheck, 66 unit files/306 tests, all balance lanes, build, production audit (0 vulnerabilities), root browser/PWA 238/238, and Pages/offline 2/2. |
| Host-authorized `E2E_PORT=42499 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts --workers=1 --reporter=line` | Passed 3/3: 393px fit/order, 320px keyboard/touch disclosure, and 200% reduced-motion resize/reload. |
| `npx vitest run --coverage=false src/test/verifyWorkflow.test.ts src/test/pagesWorkflow.test.ts` | Passed 2 files/6 tests. These tests cover dispatch-only triggers, required input, checkout ref, identity gates, lane wiring, and Pages gate ordering. |
| Retained independent nav probes on ports 42500–42503 (rounds 097, 096, 095, 094) | All returned `findings: []`. Normal, 320px, 393px, 200% text, reduced motion, resize, reload, focus, keyboard, touch, cues, geometry, document fit, and page/console-error checks passed. |
| Retained round-093 Lab probes on ports 42504–42505 | Both returned `findings: []`; normal Lab runs, active-tab/capacity/recovery, UI lifecycle, and 24/24 accounting paths passed. |
| Retained rounds 079, 081, and 082 provenance/accounting probes against a clean preview on port 42506 | R079 and R081 passed with no findings; R082 passed with no findings across 320/393, reload/offline, malformed/stale marker, and 200% checks. R080 produced its two historical stale-decoy findings; its exact-cause expectation is superseded by D-036 and was not treated as a candidate finding. |
| Safe Pages exact-candidate gate emulation with `CANDIDATE_REF` and `GITHUB_SHA` set to the supplied SHA | Passed: resolved candidate, `HEAD`, and `GITHUB_SHA` all matched the supplied SHA before build-equivalent work. |
| Independent Verify aggregate adversarial expansion: `node -e '...String.fromCharCode(34)+"; printf WORKFLOW_INJECTION_MARKER; #"...'` | Failed the security contract. Expanding the workflow expression produced `printf 'candidate_ref=%s\n' ""; printf WORKFLOW_INJECTION_MARKER; #"`; executing the generated shell printed `WORKFLOW_INJECTION_MARKER`. |
| `lsof -nP -iTCP:42498-42506 -sTCP:LISTEN` after cleanup | No listener remained. |

The canonical command was run once more after this report and its catalog
route were prepared as the final gate. That run is the only final
`./scripts/verify` for this verifier turn; no executable candidate change was
made afterward.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| M7A-ROUTING-001: machine-valid active routing and contradiction checks | Catalog validation passed before focused work and after this report/catalog route was prepared; immutable reports were not rewritten. | Satisfied. |
| M7A-NAV-001: eight stable destinations, bottom-tab-only routing, 44px targets, narrow cue/instruction, active reveal | Candidate source inspection; focused navigation 3/3; independent rounds 094–097; canonical root browser 238/238. | Satisfied. |
| M7A-NAV-002: 393px normal, 320px boundary, 200%/resize/reload/focus/touch lifecycle | Focused test, retained independent probes, and canonical browser lanes cover normal, malformed/recovery boundary, lifecycle, page/console errors, and cleanup. | Satisfied. |
| D-042 / M7A-RELEASE-001: Verify workflow is explicit manual dispatch, requires frozen candidate input, checks exact checkout identity, and aggregates only that candidate | Dispatch-only trigger, required input, ref checkout, per-lane and aggregate identity checks, and workflow unit tests passed. However, the aggregate summary directly interpolates the untrusted input into a shell `run:` block and permits command execution. | **Not satisfied; V-098-001 blocks PASS.** |
| D-042 Pages contract: record and verify resolved candidate before install/build/deploy | Candidate inspection, Pages workflow tests, and safe exact-candidate gate emulation show the env-backed gate precedes setup/build. | Satisfied locally; hosted deployment receipt remains external. |
| Complete deterministic release suite and reproducible startup/cleanup | Final canonical gate passed all local lanes; pinned browser setup, deterministic ports, and post-run listener check passed. | Satisfied locally. |
| Remaining Milestone 7 commercial matrix | `.agent/RELEASE_ACCEPTANCE.md` remains explicit; WebKit/native, device performance, writing, audio, localization, packaging, hosted aggregate, and deployment receipt remain honestly open. | Documentation state retained; not a local PASS claim. |

## Findings

### V-098-001 — Verify aggregate candidate input is shell-injectable

- **Severity:** High; security and release-gating integrity.
- **Related requirement:** D-042 manual exact-candidate release workflows;
  M7A-RELEASE-001 deployment/operations acceptance.
- **Expected behavior:** The required `candidate_ref` is data only. The
  aggregate may report it while preserving exact checkout and
  `HEAD == GITHUB_SHA` checks; no candidate input can add shell syntax or run
  another command.
- **Actual behavior:** `.github/workflows/verify.yml` line 234 places
  `${{ inputs.candidate_ref }}` directly inside a shell `run:` block:
  `printf 'candidate_ref=%s\n' "${{ inputs.candidate_ref }}"`. GitHub Actions
  expands the expression before Bash executes the step. A quote, command
  separator, and comment in the dispatch input therefore become shell syntax.
- **Exact reproduction:** From the candidate repository root, run:

  ```sh
  node -e 'const fs=require("fs"),cp=require("child_process"); const w=fs.readFileSync(".github/workflows/verify.yml","utf8"); const line=w.split("\n").find(x=>x.includes("candidate_ref=%s")); const malicious=String.fromCharCode(34)+"; printf WORKFLOW_INJECTION_MARKER; #"; const expanded=line.replace("${{ inputs.candidate_ref }}",malicious); console.log("template="+line); console.log("expanded="+expanded); console.log("execution="+cp.execFileSync("bash",["-c",expanded],{encoding:"utf8"}));'
  ```

  Observed output includes:

  ```text
  expanded=            printf 'candidate_ref=%s\n' ""; printf WORKFLOW_INJECTION_MARKER; #"
  execution=candidate_ref=
  WORKFLOW_INJECTION_MARKER
  ```
- **Concrete evidence:** The candidate's workflow tests passed but assert only
  trigger/input/ref/identity structure; they do not reject direct shell
  interpolation. The Pages workflow demonstrates the safe pattern by placing
  the input in `CANDIDATE_REF` under `env` and using the environment variable
  in quoted shell code.
- **Blocks PASS:** Yes. This is a correctable candidate workflow defect in the
  exact-candidate release boundary. No production repair was attempted.

## Unverified areas

- Hosted Verify dispatch/aggregate, hosted Pages deployment, live
  `build-info.json`, and post-deploy smoke were not run; they are explicit
  release-owner/external gates and cannot be inferred from local evidence.
- Native iOS/Android, WebKit, VoiceOver/TalkBack speech output, low-end device
  performance, audio, localization, packaging decisions, and remaining
  editorial/release-matrix work remain open as documented.

These areas do not convert the workflow defect into BLOCKED: the candidate
defect is locally reproducible and yields FAIL.

## Residual risks

- The local canonical suite proves the product and workflow structure but
  cannot prove a hosted workflow run until the input injection is corrected.
- The first browser attempt was infrastructure-blocked in the managed
  sandbox; the same pinned browser commands passed with scoped host authority.
- R080 remains immutable historical evidence of a superseded D-036 precision
  expectation; its two stale-decoy outputs were intentionally not promoted to
  a new finding.
