# Verification round 099 — exact-candidate workflow injection repair

Candidate SHA: `d25e80e6781de89e80fc3b3c240a922ada53d978`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier artifact was
written, `git rev-parse HEAD` returned
`d25e80e6781de89e80fc3b3c240a922ada53d978`; the initial worktree was clean.
No production implementation file was changed by this verifier.

This was the fresh independent release-workflow verification of V-098-001. The
full release-read route was used: `AGENTS.md`, `.codex/agents/verifier.toml`,
live `./scripts/agent-status`, routing records, catalog, complete `plan.md`,
complete `.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`, the immutable
verification archive, round-098's finding, retained round-093 through
round-097 evidence/probes, both release workflows, the composite verification
action, workflow tests, and the navigation sources/tests.

Routing records, handoff text, implementation-authored tests, comments, and
claimed results were treated as untrusted navigation. Independent checklist:

- V-098-001 candidate input remains data-only in every Verify and Pages shell
  `run:` block, including adversarial quote, separator, substitution, backtick,
  newline, and option-like values;
- Verify and Pages remain explicit `workflow_dispatch` workflows with a
  required candidate ref and no push/scheduled trigger;
- every Verify lane checks out the supplied ref and retains the
  `HEAD == GITHUB_SHA` identity gate, while the aggregate gates every lane;
- Pages resolves the exact ref and gates both `HEAD == expected` and
  `HEAD == GITHUB_SHA` before setup, install, build, or deploy;
- active M7A navigation and retained PWA/offline behavior remain green; and
- the complete canonical local release lane passes with reproducible setup and
  cleanup.

## Environment and setup

- macOS arm64 (`Darwin 25.6.0`), Node `v26.7.0`, npm `11.19.0`.
- Repository-pinned `@playwright/test` `1.61.1`; npm and browser assets stayed
  in ignored repository-local `.cache/` paths.
- The first focused and retained Playwright launches failed before browser test
  bodies with the managed macOS `MachPortRendezvousServer ... Permission
  denied` error. The identical pinned commands were rerun with scoped host
  authority and passed; no required browser check was silently skipped.
- Canonical and focused loopback servers, browser contexts, and fixture builds
  completed cleanup. No listener remained on the round ports after verification.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch`; `./scripts/agent-status` | Supplied SHA matched before writes; initial tree was clean; live status parsed cleanly and identified round 099 as the fresh gate after round 098 FAIL. |
| Required authority, routing, decision, release-matrix, archive, handoff, workflow, test, navigation, and retained-probe reads | Completed independently; full release route used. |
| `npm run validate:verification-catalog` before verifier artifacts | Passed: 98 immutable reports, 96 findings, 4 active requirements. |
| `npx vitest run --coverage=false src/test/verifyWorkflow.test.ts src/test/pagesWorkflow.test.ts` | Passed: 2 files / 8 tests. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck`; `git diff --check` | Passed. |
| Independent inline Node/YAML and shell probe over `.github/workflows/verify.yml`, `.github/workflows/deploy-pages.yml`, and `prepare-verification-lane/action.yml` | Both workflow YAML files parsed as dispatch-only with required string `candidate_ref`. Every extracted shell `run:` block contained no `${{ inputs.* }}` interpolation. Five payloads per workflow were preserved byte-for-byte as one summary field with no command or filesystem side effect: quote/separator, `$()` substitution, backticks, newline/tab, and option-like input. |
| Independent Pages gate emulation with `CANDIDATE_REF`/`GITHUB_SHA` set to the candidate; then mismatched ref and mismatched SHA | Valid exact ref passed; `HEAD^` and an all-zero `GITHUB_SHA` each failed before build-equivalent work. The workflow contains and orders `expected`, `HEAD == expected`, and `HEAD == GITHUB_SHA` checks before setup/build. |
| Independent Verify workflow inspection | All five checkout lanes use `ref: ${{ inputs.candidate_ref }}`; the composite preparation action checks `HEAD == GITHUB_SHA`; the aggregate checks `HEAD == GITHUB_SHA` and all five lane results equal `success`. |
| Sandboxed `E2E_PORT=42990 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts --workers=1 --reporter=line` | Infrastructure-only failure before test bodies: Chromium Mach-port permission. |
| Host-authorized identical pinned navigation command | Passed 3/3: 393px normal order/fit, 320px cue plus keyboard/touch reveal, and 200% reduced-motion resize/reload. |
| Sandboxed `PORT=42991 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-097-adversarial.mjs` | Infrastructure-only browser-launch failure; probe emitted no product assertion. |
| Host-authorized retained round-097 probe | Passed with `findings: []`: all eight tabs, repeated 200% 320→393→320 lifecycle, reduced motion, keyboard/focus, touch, reload, offline, target geometry, document fit, cues, and page/console errors. |
| Final `INSTALL_PLAYWRIGHT=0 E2E_PORT=42992 VERIFY_EVIDENCE_DIR=.cache/verification/round-099-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` with scoped host authority | Passed once: catalog/setup, format/lint/typecheck, 66 unit files / 308 tests, all balance lanes, build, production audit with 0 vulnerabilities, root browser/PWA 238/238, and Pages/offline 2/2. |
| Post-run listener and tree checks | No listener remained on ports 42990–42992; no non-ignored build/cache changes were present before verifier artifacts. |

The canonical gate ran once after all executable candidate verification work was
complete. This report and its catalog resolution are verifier metadata added
after that gate; no executable candidate change followed it, and the gate was
not looped.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: machine-valid routing and contradiction checks | Pre-gate catalog validation; post-report catalog validation; immutable reports remained untouched. | Satisfied. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, narrow cue/reveal | Candidate source inspection; focused pinned 3/3; retained independent round-097 probe; canonical root browser 238/238. | Satisfied for the scoped Chromium contract. |
| `M7A-NAV-002`: 393px normal, 320px boundary, 200% text, keyboard/touch, resize/reload lifecycle | Focused navigation suite, retained adversarial probe, canonical root browser/PWA lane, and Pages/offline lane. | Satisfied for exercised repository-pinned browser behavior. |
| D-042 / `M7A-RELEASE-001`: Verify manual exact-candidate workflow and aggregate integrity | YAML trigger/input checks; all five checkout refs; composite and aggregate `HEAD == GITHUB_SHA`; all-lane success gates; five adversarial payload classes across all shell blocks; canonical workflow tests and final gate. | Satisfied; V-098-001 resolved. |
| D-042 Pages exact-candidate boundary | Safe env binding; valid and mismatched exact-ref/HEAD/GITHUB_SHA emulations; gate precedes setup, install, build, and deploy; Pages/offline canonical lane passed. | Satisfied locally; hosted deployment receipt remains external. |
| Retained deterministic, accounting, persistence, malformed-state, offline, PWA, accessibility, and Lab contracts | 66-file/308-test unit suite, all balance lanes, root 238/238, Pages/offline 2/2, and retained round-097 probe. | Satisfied for exercised retained scope. |
| Reproducible setup/startup/cleanup and exact candidate evidence | Locked repository-local setup/cache paths, deterministic loopback ports, host-authorized pinned browser reruns, exact SHA capture, and no post-run listeners. | Satisfied. |
| Remaining Milestone 7 commercial matrix | `.agent/RELEASE_ACCEPTANCE.md` continues to identify WebKit/native speech, device performance, writing, audio, localization, packaging, hosted aggregate, deployment receipt, and related external evidence as open. | Documented open gates; not falsely claimed complete by this local scoped PASS. |

## Findings

None. V-098-001 is not reproducible on the exact candidate: Verify and Pages
keep dispatch input out of shell text, preserve the malicious payload as data,
and retain the required identity gates. No other correctable candidate defect or
unresolved applicable M7A requirement was found.

## Unverified areas

- Hosted Verify dispatch/aggregate, hosted Pages deployment, live
  `build-info.json`, post-deploy smoke, and exact-SHA release receipt were not
  run; these remain external release-owner gates.
- Native iOS/Android, WebKit, VoiceOver/TalkBack speech output, low-end device
  performance, audio, localization, packaging decisions, and remaining
  editorial/release-matrix work remain open as documented.

These are explicit external or out-of-scope matrix items, not infrastructure
blockers for this candidate's bounded workflow/navigation verification and do
not create an unresolved implementation finding.

## Residual risks

- Hosted GitHub Actions expression evaluation and deployment receipts still
  require release-owner execution on this exact accepted SHA.
- The managed macOS sandbox cannot launch Chromium without host authority; the
  same pinned commands passed with scoped host access.
- Candidate refs remain subject to GitHub's checkout behavior; local evidence
  proves the repository's explicit ref and identity gates, not hosted runner
  policy changes.
