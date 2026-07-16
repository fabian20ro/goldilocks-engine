# Verification round 009

Candidate SHA: `65ee04f5b8815a5d60d70f354d8057aab49713d9`

VERDICT: FAIL

## Scope and outcome basis

`plan.md` remains gate-ordered. Decisions D-001 and D-005 make Milestones 0–1,
the playtest-derived first-session comprehension contract, applicable
simulation/PWA/accessibility/testability requirements, and exclusion of later
milestones the current scope. The retained GitHub Pages path also makes local
Pages packaging and exact-candidate publication readiness applicable.

The candidate preserves all prior automated regressions and adds working money
settlement, preset deletion/undo, CU and memory accounting, honest pre-gate rig
copy, animation/time separation, and bounded deterministic fast-forward.
Repository-pinned root browser acceptance passed 26/26 before independent
probes; Pages acceptance passed 2/2.

Two correctable D-005 comprehension defects prevent acceptance:

- V-014: Quick Start never names thermal pressure or maps it to compute budget
  or workload demand, so it does not precisely answer one of the recorded
  first-session questions.
- V-015: at 0% memory reserve, current guidance still instructs the player to
  lower the reserve, an unavailable action.

Required human milestone-gate evidence also remains absent. GitHub Pages is
enabled and live for predecessor `b3b960d3d20b6210e3f3b23f9839d1f599e41261`,
but the exact candidate is absent remotely. Correctable candidate defects
determine this round's result.

## Environment and setup

- Host: Darwin 25.5.0 arm64.
- Verification time: 2026-07-16 10:12 EEST.
- Node.js: v26.5.0; npm: 11.17.0; `npx`: `/opt/homebrew/bin/npx`.
- Browser: repository-pinned `@playwright/test` 1.61.1 and repository-local
  Chromium under ignored `.cache/ms-playwright`.
- Clean-start gate: captured `HEAD` exactly matched the supplied candidate and
  `git status --short` was empty before any verifier change.
- Canonical setup recreated locked dependencies in `.cache/npm`, reported zero
  vulnerabilities, and installed the repository-local browser.
- The managed macOS sandbox denied Chromium Mach-port registration. Exact
  package-manager browser reruns with scoped launch permission worked; this is
  environment behavior, not a candidate defect.
- Verifier changes are limited to `tests/e2e/verifier-round-009.spec.ts` and
  this immutable report.

## Commands executed and results

| Command / probe                                                                                              | Result                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git rev-parse HEAD`; `git status --short`                                                                   | PASS at clean start; exact candidate matched.                                                                                                                                                                  |
| Complete reads of `AGENTS.md`, all of `plan.md`, decisions, role file, playtest, handoff, and rounds 001–008 | PASS; independent scope/checklist constructed.                                                                                                                                                                 |
| `./scripts/verify`                                                                                           | Locked setup, format, lint, typecheck, 30 tests with coverage thresholds, balance, and root build PASS. Root Chromium phase alone hit the known sandbox Mach-port denial, so the wrapper stopped before Pages. |
| Exact scoped `npm run test:e2e` before verifier probes                                                       | PASS: 26/26 current-candidate root PWA cases.                                                                                                                                                                  |
| Exact scoped `npm run test:e2e:pages`                                                                        | PASS: 2/2 scoped Pages online/cache/offline/worker cases.                                                                                                                                                      |
| Focused scoped verifier round-009 browser probes                                                             | FAIL as evidence: 0/2; V-014 and V-015 reproduced.                                                                                                                                                             |
| Final full scoped `npm run test:e2e` with verifier probes                                                    | 26 PASS, 2 FAIL; every candidate and retained prior-verifier case passed, only V-014/V-015 failed.                                                                                                             |
| `npx prettier --write tests/e2e/verifier-round-009.spec.ts`; format/lint/typecheck                           | PASS.                                                                                                                                                                                                          |
| Independent `validatePrototype(seed)` sweep from -10,000 through 10,000                                      | PASS: 20,001/20,001 report all paths viable, declared non-dominance, and upgrade tradeoffs.                                                                                                                    |
| Independent mixed 1×/4×/16×-quantum 500-step replay/accounting probe                                         | PASS: repeated runs identical and valid; 47 completed, 3 failed, queue drained; ledger 52/52 unique; gross minus paid costs equaled money delta.                                                               |
| `./scripts/run`; independent HTTP probes for `/` and `/sw.js`; Ctrl-C                                        | PASS: deterministic `127.0.0.1:4173` readiness, two HTTP 200 responses, bounded stop.                                                                                                                          |
| `lsof`/scoped read-only process audit                                                                        | PASS: no listener on 4173 and no repository Vite, Playwright, or local Chromium process remained.                                                                                                              |
| Read-only origin, Pages, Actions, environment-policy, and live-URL probes                                    | Pages enabled; branch policy permits `agent/implementation` and `main`; one successful predecessor run at `b3b960d`; live URL HTTP 200. Exact candidate absent remotely. No remote mutation.                   |
| Human-evidence filename/content inspection                                                                   | BLOCKER evidence: informal record explicitly lacks the M0/M1 gate facts; no qualifying dated record exists.                                                                                                    |
| `git diff --check`                                                                                           | PASS.                                                                                                                                                                                                          |

## Requirement evidence matrix

| Applicable plan/decision/protocol requirement                                                                                               | Status                                      | Independent evidence                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate ordering; only Milestones 0–1 before Pipeline Toy exit gate                                                                            | PASS                                        | Source/tree inspection found numeric prototype and Pipeline Toy only; later character, research, investor, workforce, startup, and laboratory systems remain absent.       |
| M0 contents: time/money, three hardware alternatives, four workloads, competition/product/aggregate creator/research inputs, three outcomes | PASS                                        | Source inspection, canonical unit suite, balance output, and 20,001-seed sweep.                                                                                            |
| M0 competition/product/creator viability; no universal winner; upgrades add constraints                                                     | PASS for automated model; human gate absent | Every swept seed passed implemented predicates; hardware adds capital, watts, heat, reliability, and maintenance tradeoffs. Automation cannot prove interesting decisions. |
| M1 constrained portrait pipeline; compatible replace/reorder; defined branch; allocation, pause, queue, presets                             | PASS for automated behavior                 | Current root suite covers mouse and real-touch drag, tap/snap, drawer pan, branch, allocation, pause, queue, persistence, and malformed recovery.                          |
| M1 animation, queue location, memory/thermal constraints, throughput/latency, failure propagation, comparison                               | PASS                                        | Root browser cases, unit/property tests, failure/recovery, inspector, and replay/accounting probe.                                                                         |
| Four workloads create distinct compute, memory, latency, throughput, reliability/quality and payout pressures                               | PASS                                        | Catalog/source inspection, headless tests, and live workload cards/settlement cases.                                                                                       |
| D-005 first-run tutorial precisely answers every recorded question, persists dismissal, and reopens from large Help control                 | FAIL                                        | Persistence, reopening, target size, money, CU, memory, preset, progression, and animation explanations pass. V-014: tutorial omits thermal remediation entirely.          |
| D-005 choose → queue → run → complete → payout; workload rewards, costs, failed payout, settlement feedback                                 | PASS                                        | Engine settlement tests, deterministic accounting probe, and current browser money-loop case.                                                                              |
| D-005 runtime-validated presets with labeled delete, confirmation, persistent removal, and persistent one-step undo                         | PASS                                        | Current delete/cancel/confirm/undo/reload case plus retained malformed/hostile/complete-restore cases.                                                                     |
| D-005 visible CU definition, memory use/rig capacity, held-back reserve vs pipeline-usable memory                                           | PASS                                        | Root resource strip, Jobs accounting copy, tutorial, and browser checks.                                                                                                   |
| D-005 current-pressure guidance names mechanically valid, qualified actions                                                                 | FAIL                                        | Thermal and normal memory paths avoid false certainty. V-015 gives an impossible reserve action at the 0% lower boundary.                                                  |
| D-005 honest progression; no pre-gate purchase/shop; current improvement paths named                                                        | PASS                                        | UI/source inspection, no purchase/select command, and browser locked-rig case. Three M0 hardware profiles remain headless inputs only.                                     |
| D-005 animation visual-only; reduced motion retained; separate bounded 1×/4×/16× time and pause                                             | PASS                                        | Current and retained browser animation tests; exact three speed controls; deterministic mixed-quantum probe; separate Jobs pause.                                          |
| Main screen: one objective, one bottleneck, five resources, one warning, one pipeline                                                       | PASS                                        | Source/DOM inspection and 320/393 browser cases.                                                                                                                           |
| Portrait one-handed access, 44 CSS-pixel controls, no horizontal overflow, touch precision, 200% text, labels, color-independent cues       | PASS                                        | Fresh current-candidate 320/393, target-size, touch drag/pan, 150/200% text, and accessibility cases.                                                                      |
| TypeScript PWA; typed command boundary; deterministic headless engine separated from React and run in Worker                                | PASS                                        | Typecheck/build, source inspection, engine/worker tests, replay, root/Pages live and offline worker cases.                                                                 |
| Malformed/non-finite numeric operations are exact no-ops; finite values bounded                                                             | PASS; V-012 remains resolved                | Canonical engine/worker/verifier tests pass.                                                                                                                               |
| Explicit deterministic update behavior; resources/settlements valid; bounded unique ledger                                                  | PASS                                        | Unit/property suite and independent 500-step replay/accounting/identity probe.                                                                                             |
| Versioned schema/content and scope-isolated installable offline PWA at root and Pages subpath                                               | PASS locally                                | Schema 3/content `pipeline-toy-2`; root and Pages builds; root offline and Pages cache/offline/worker cases; v4 cache preserves foreign scopes.                            |
| Reproducible setup/startup/full checking; repository-local caches; cleanup                                                                  | PASS with documented host retry             | Locked setup, static/unit/build checks, exact scoped browser reruns, direct startup probes, and cleanup audit.                                                             |
| GitHub Pages publication workflow and exact-candidate live readiness                                                                        | BLOCKED for exact candidate                 | Workflow/policy/local Pages package pass. Remote run/live site use predecessor `b3b960d`; candidate `65ee04f` is not on origin and has no exact-SHA run/deployment.        |
| M0 economy-interest gate and M1 voluntary uninterrupted 30-minute reconfiguration/explanation gate                                          | BLOCKED                                     | Informal feedback explicitly lacks duration, device, timestamps/count, prompting, two tradeoff explanations, and proceed/redesign conclusion.                              |

## Prior finding regression results

- V-001 through V-013 remain resolved in current static, headless, browser, or
  current read-only repository-policy evidence as applicable.
- All retained root browser regressions V-003 through V-010 pass on this exact
  candidate.
- V-011 local/workflow cache test passes; V-012 numeric tests pass; V-013
  trigger branch remains allowed by the current Pages environment policy.

## Findings

### V-014 — Quick Start omits thermal-pressure remediation

- Severity: Medium.
- Related requirement: D-005 criterion 1, requiring the first-run tutorial to
  precisely answer the observed thermal-problem question; criterion 5's valid
  compute/workload guidance.
- Expected behavior: Quick Start explicitly identifies thermal pressure and
  maps it to a supported response: lower compute budget or select a lower-CU
  workload, while avoiding claims that module swaps directly change heat.
- Actual behavior: The tutorial never contains the word `thermal`. It mentions
  compute budget and generic pressure separately, without explaining their
  relationship. A first-run player inside the default envelope therefore gets
  no precise answer until independently creating a thermal warning.
- Exact reproduction procedure: Run
  `npm run test:e2e -- --grep "Quick Start explicitly maps thermal"` in an
  environment permitting repository-local Chromium.
- Concrete evidence: `tests/e2e/verifier-round-009.spec.ts` receives the full
  tutorial text without any match for thermal pressure and compute budget. The
  screenshot/DOM output captures all four tutorial steps.
- Blocks PASS: Yes. One accepted first-session comprehension obligation remains
  unanswered by the always-reopenable tutorial.

### V-015 — Zero-reserve memory warning recommends an impossible action

- Severity: Medium.
- Related requirement: D-005 criterion 5, requiring current-pressure guidance
  to name mechanically valid actions; plan's legible-failure and bounded-policy
  rules.
- Expected behavior: When memory reserve is already 0%, guidance omits “Lower
  the reserve” and recommends currently available actions such as lighter
  compatible modules or a lower-memory workload.
- Actual behavior: With Full Precision Model, Long Document, and reserve 0%, the
  UI accurately reports 16.7 GB needed, 8 GB usable, and 0 GB reserved, then
  immediately instructs “Lower the reserve.” The slider cannot go below 0%.
- Exact reproduction procedure: Run
  `npm run test:e2e -- --grep "already-zero reserve"` in an environment
  permitting repository-local Chromium.
- Concrete evidence: The verifier regression confirms the range value is `0`,
  the warning is a memory-limit warning, and its rendered text contains the
  unavailable instruction. The final suite result is 26 passes and these two
  verifier failures.
- Blocks PASS: Yes. Boundary guidance contradicts the visible current state and
  fails the mechanically-valid-action contract.

## Blocking condition B-005 — Required human milestone-gate evidence absent

- Severity: Acceptance blocker.
- Related requirement: Milestone 0 economy-interest exit gate and Milestone 1
  voluntary uninterrupted 30-minute reconfiguration/tradeoff-explanation gate.
- Expected evidence: A dated exact-candidate/device record assessing M0 economy
  interest and documenting an uninterrupted voluntary 30-minute Pipeline Toy
  session, reconfiguration timestamps/count, prompting, at least two explained
  tradeoffs, and a proceed/redesign conclusion.
- Actual evidence: `.agent/playtests/2026-07-16-informal.md` explicitly lists
  every one of those facts as absent. No later qualifying record exists.
- Exact reproduction procedure: Inspect `.agent/playtests/`, decisions,
  handoff, and verification evidence.
- Concrete evidence: The sole informal record names predecessor candidate
  `e1006c1` and says it is not M0 or M1 gate evidence.
- Blocks PASS: Yes. Automated checks cannot establish subjective sustained
  engagement.

## Blocking condition B-007 — Exact candidate is not remotely deployed

- Severity: Publication evidence blocker.
- Related requirement: retained GitHub Pages publication path and exact-SHA
  readiness requested for this round.
- Expected evidence: Exact candidate on an allowed deployment branch, a
  successful exact-SHA workflow run, and live validation.
- Actual evidence: Origin `agent/implementation` and the successful Pages run
  are at `b3b960d3d20b6210e3f3b23f9839d1f599e41261`; candidate `65ee04f` is local
  only. The live URL returns HTTP 200 for that predecessor deployment.
- Exact reproduction procedure: Read-only `git ls-remote --heads origin`,
  Actions/Pages/environment API queries, and live URL request.
- Concrete evidence: Actions reports one successful run whose `head_sha` is
  `b3b960d`; no exact-candidate run exists.
- Blocks PASS: Yes for end-to-end publication proof. No remote mutation was
  authorized or performed by the Verifier.

## Exact input required for a future acceptance round

1. Correct V-014 and V-015, preserve the verifier regressions, and provide a
   new exact candidate SHA.
2. After implementation acceptance, place the intended exact candidate on an
   allowed deployment branch and provide its successful Pages run/live package
   for read-only verification.
3. Provide the dated human gate record described in B-005, tied to the tested
   candidate and devices.

## Unverified areas

- The two required human milestone exit gates.
- GitHub-hosted build/CDN/offline behavior for this exact candidate SHA.
- Physical-device battery, CPU, thermal, platform-specific touch, and actual
  screen-reader output; mobile functional checking used Chromium emulation.
- Browsers other than Chromium.
- Service-worker migration across additional future hashed-asset/cache
  versions.
- Milestones 2–7 and expansions, excluded by gate ordering.

## Residual risks

- Automated viability cannot establish enjoyment or exclude a
  human-discovered dominant strategy.
- Queued work is aggregate rather than workload-tagged; changing the selected
  workload before resolution changes the queue's processing and payout basis.
  Current copy does not state retention semantics, so this was not classified
  as a defect, but future multi-workload queues need an explicit product rule.
- Short browser/headless sessions do not replace physical-device profiling or
  the sustained human gate.
- Local Vite Pages checking does not reproduce every GitHub Pages CDN/header
  behavior.
