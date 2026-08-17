# Verification round 101 — M7B OIV routing assertion repair

Candidate SHA: `eaf6853390a9022a6e4e8b68c9669b823c350fa1`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier-authored
write, `git rev-parse HEAD` matched the supplied SHA and the worktree was
clean. The candidate changes only verification routing tests and handoff
documentation; no production implementation, plan, immutable report, or
active M7B product requirement was changed.

This was a full release-read verification because the candidate sits at the
M7A-to-M7B cross-milestone boundary. Read in order: `AGENTS.md`,
`.codex/agents/verifier.toml`, `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, then the complete
`plan.md`, `.agent/DECISIONS.md`, catalog, release matrix, handoff, immutable
archive, retained round-093 probes, round-097 navigation probe, and the exact
implementation/tests/scripts named by the routing documents. The routing
documents, handoff, implementation tests, comments, and claimed results were
treated as navigation rather than proof.

Independent checklist:

- V-100-001's stale M7A heading assertions are repaired without removing the
  historical-boundary, catalog, non-volatile, or fail-fast assertions.
- Catalog/report routing remains machine-valid and immutable.
- M7A eight-destination navigation remains a stable bottom-tab regression at
  393px, 320px, 200% text, reduced motion, keyboard, touch, resize, reload,
  offline, and error boundaries.
- Retained deterministic, accounting, persistence, malformed-save, PWA,
  offline, Career, Research, Hype/Fear, and Local Laboratory behavior remains
  green.
- M7B WebKit/native/performance gates remain explicit follow-on work and are
  not represented as complete by this routing-test repair.

## Environment and setup

- Darwin arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; npm and browser assets stayed in
  ignored repository-local `.cache/npm` and `.cache/ms-playwright` paths.
- The first sandboxed Chromium launch failed before test bodies with
  `bootstrap_check_in ... Permission denied (1100)` from the managed macOS
  Mach-port policy. The same pinned browser, loopback server, and repository
  cache were rerun with scoped host authority. No required browser evidence
  was silently skipped.
- Focused and canonical preview processes were terminated after their checks;
  the verification ports were closed and no candidate-owned server remained.

## Commands executed and results

| Command / probe | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch` before verifier writes | PASS. Exact candidate SHA matched; initial worktree clean. |
| `./scripts/agent-status` | PASS. Live metadata parsed cleanly; round 100 was the latest immutable FAIL before this report. |
| Full authority/archive/source read route | PASS. Complete plan, decisions, immutable report archive, catalog, release matrix, handoff, retained probes, implementation/tests, and canonical scripts inspected. |
| `npx vitest run --coverage=false src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts` | PASS: 2 files, 9/9 tests. The two exact V-100-001 reproductions no longer fail. |
| `npm run validate:verification-catalog` | PASS: 100 immutable reports, 97 findings, 8 active requirements. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck`; `git diff --check` | PASS. |
| `node .agent/verification/round-093-adversarial.mjs` | PASS: 24/24 Local Laboratory runs valid and closed; waiting/active/founding rejection, safe offline behavior, capacity, parallelism, malformed restore, and non-finite queue boundary produced no findings. |
| `PORT=43104 ... node .agent/verification/round-093-ui-adversarial.mjs` with scoped host access | PASS: Lab normal/boundary/lifecycle at 320/393, 200% text, reduced motion, reload/offline, founding rejection/success, persistence identity, and no page/console errors. |
| `PORT=43105 ... node .agent/verification/round-097-adversarial.mjs` with scoped host access | PASS: retained eight-tab navigation Rule of Three at 320x693 and 393x742, 200% text, reduced motion, keyboard/touch activation, repeated resize/reveal, reload, offline, target geometry, and no page/console errors. |
| `BASE_URL=http://127.0.0.1:43106 ... round-079-adversarial.mjs` | PASS: settlement accounting/provenance, 320/393 geometry, 200% text, reduced motion, touch/keyboard Details, reload/offline, and error boundaries. |
| `BASE_URL=http://127.0.0.1:43106 ... round-080-adversarial.mjs` | Expected superseded assertion only: it reports the old exact-cause expectation when current D-036 behavior correctly returns `Cause unknown` after stale recovery. Catalog `R080-stale-precision-expectation` classifies this immutable assertion as superseded; it is not a candidate defect. |
| `BASE_URL=http://127.0.0.1:43106 ... round-081-adversarial.mjs` and `round-082-adversarial.mjs` | PASS: stale structural relink remains unknown; future/colliding ledger IDs recover, remain unique, and continue progress across reload/offline. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=43107 VERIFY_EVIDENCE_DIR=.cache/verification/round-101-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | PASS, one final canonical gate: catalog/setup/format/lint/typecheck; 66 unit files, 308 tests; all numeric, first-session, upgrade, progression, Career, evaluation, Research, Hype/Fear, and Laboratory balance lanes; build; production audit with 0 vulnerabilities; root pinned browser/PWA 238/238; Pages/offline 2/2. |
| Post-gate process/listener audit | PASS. Temporary previews stopped; no listener remained on verification ports. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: current routing/catalog is explicit, contradiction-checked, and independent | Focused 9/9 routing tests; catalog validator; immutable archive/catalog inspection; canonical catalog lane. | Satisfied. V-100-001 does not reproduce. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, narrow disclosure/reveal, no duplicate global routing | Candidate source unchanged; canonical root 238/238; focused navigation suite and independent round-097 probe at 320/393. | Satisfied. |
| `M7A-NAV-002`: normal/boundary/lifecycle navigation | Round-097 covers normal 393px fit, 320px cue/reveal, keyboard/touch, 200% text, reduced-motion, repeated resize, reload/offline, target geometry, and errors; canonical navigation tests pass. | Satisfied. |
| `M7A-RELEASE-001` / D-041 release matrix honesty | Candidate preserves the historical M7A receipt as historical, keeps the M7B matrix and deferred work explicit, and makes no live/current acceptance claim. Catalog and canonical gate pass. | Satisfied for this routing/documentation slice; remaining release gates stay open. |
| D-043 M7B WebKit gate | Handoff, index, release matrix, and catalog explicitly identify the pinned WebKit lane as next-candidate work; no Chromium result is substituted. | Open follow-on requirement, correctly not claimed complete by this candidate. |
| D-043 M7B native VoiceOver/TalkBack gate | Handoff and release matrix explicitly require available iOS Simulator and unlocked USB Android evidence and preserve BLOCKED policy. | Open follow-on requirement, correctly not claimed complete by this candidate. |
| D-043 M7B measured mobile-performance gate | Handoff and release matrix preserve five-run, LCP/INP/CLS, Worker, memory, offline, battery/thermal, and same-device-baseline requirements. | Open follow-on requirement, correctly not claimed complete by this candidate. |
| M7B evidence/blocker honesty | Candidate diff preserves device/browser matrix, Rule of Three, artifact manifest, cleanup, and infrastructure policy; no unsupported M7B completion claim appears. | Satisfied for routing/evidence honesty. |
| Retained deterministic and balance requirements from `plan.md` §§2.4, 20, 24, 27, 29, 34 | Canonical 66-file/308-test suite, all balance lanes, production build/audit, and retained round-093 engine/UI probes. | Satisfied for the unchanged retained product scope. |
| Persistence, malformed recovery, causal/accounting, reload/offline, PWA root/Pages, startup/install, and cleanup boundaries | Canonical root 238/238 and Pages 2/2; round-079/081/082 replacement probes; round-093 lifecycle probes; clean setup and port/process audits. | Satisfied. |
| Plan §2.4 fresh independent Verifier prerequisite | This immutable exact-SHA report supplies fresh independent evidence. No deployment or live-release claim is made for this candidate. | Satisfied as verification evidence; external release gates remain separate. |

## Findings

None. V-100-001 is resolved by the candidate's synchronized heading
assertions; the repaired tests retain the historical provenance and routing
invariants and the complete canonical gate passes. No other correctable
implementation, verification, or routing defect was found.

## Unverified areas

- WebKit, native VoiceOver/TalkBack speech, low-end-device performance,
  physical battery/thermal measurement, and their artifact set remain the
  explicitly open M7B follow-on gates.
- Hosted exact-SHA verification/deployment, live `build-info.json`, and
  post-deploy smoke for this candidate were not run. The historical M7A receipt
  remains tied to its own accepted SHA and is not reused as current deployment
  evidence.
- Optional owner/player studies, haptics, audio, localization, writing,
  save-support policy, and packaging/distribution decisions remain open as
  documented later M7 work.

## Residual risks

- The next M7B implementation candidate must add and independently verify the
  WebKit, native accessibility, and measured mobile-performance lanes before
  those active requirements can be accepted.
- Managed macOS sandbox Chromium launch requires scoped host authority; future
  verification must retain the repository-pinned browser/cache contract rather
  than silently omit browser evidence.
- This PASS is for the exact routing assertion repair candidate, not a claim
  that the complete commercial-release matrix or hosted deployment is closed.
