# Verification round 026

Candidate SHA: `ecf88b0a603df130c32c90cff4f68137c4ce060d`

VERDICT: FAIL

## Scope and verdict basis

Applicable scope: the owner-authorized **Workstation Expansion I** slice in
`plan.md`, D-004 through D-007, inherited Milestone 0–1 behavior, and all
retained verifier regressions. D-007 permits automated acceptance for this
bounded slice without claiming that the historical subjective human gates were
measured or passed.

The candidate fixes the previous 320/393px, 200%-text header action layout at
an 850px portrait height. It does not satisfy the same portrait/accessibility
contract at a representative shorter 393×667 viewport: the fixed bottom
navigation physically covers the entire simulation-speed row. The `1×` button
cannot receive its own center touch/click; the `Build` nav button receives it
instead. This is a correctable candidate defect, so acceptance cannot pass.

## Environment and setup

- Verifier host: macOS / Darwin 25.5.0, arm64; Node v26.5.0; npm 11.17.0.
- Browser: repository-pinned `@playwright/test` 1.61.1 and ignored
  `.cache/ms-playwright` Chromium.
- Before any Verifier write: `git rev-parse HEAD` returned
  `ecf88b0a603df130c32c90cff4f68137c4ce060d`, exactly matching the supplied
  candidate, and `git status --short` was empty.
- Complete independent reads: `plan.md` (all 1,879 lines), `AGENTS.md`, the
  Verifier role, D-001 through D-007, current handoff as untrusted guidance,
  and retained finding history.
- `./scripts/setup` recreated locked dependencies and the repository-local
  browser cache. No credential, installation, or application-startup blocker
  occurred.
- A sandboxed Chromium launch fails before page creation with the documented
  macOS Mach-port permission denial. The same repository-pinned commands were
  rerun outside that filesystem sandbox; this is recorded rather than silently
  skipping browser coverage.
- Verifier-owned artifacts: this immutable report and
  `tests/e2e/verifier-round-026.spec.ts`. No production implementation,
  plan, decision record, handoff, or prior report changed.

## Commands executed and results

| Command or probe                                                           | Result                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate SHA and clean-start status                                       | PASS. Exact supplied SHA before Verifier writes.                                                                                                                                                                                       |
| `./scripts/setup`                                                          | PASS. Locked npm install and repository-local Chromium setup completed.                                                                                                                                                                |
| `npm run format:check`; `npm run lint`; `npm run typecheck`                | PASS. Repeated after adding the verifier regression.                                                                                                                                                                                   |
| `npm test`                                                                 | PASS. 18 files / 87 unit, property, migration, numeric-boundary, and workflow tests.                                                                                                                                                   |
| `npm run balance`                                                          | PASS. Numeric prototype, 20,001-seed upgrade sweep, and 41-seed progression sweep completed with the required predicates.                                                                                                              |
| `npm run build && npm run build:pages`                                     | PASS. Root and `/goldlocks-engine/` production packages built.                                                                                                                                                                         |
| `npm run test:e2e -- --grep-invert 'verifier round 026' --reporter=dot`    | PASS. 60/60 pre-existing root browser tests in 38.3s outside the managed sandbox. Includes 320/393, touch drag, keyboard/tap, queue/quote/clear, persistence, offline, migration, reduced motion, 200%-text, and retained regressions. |
| `npm run test:e2e:pages -- --reporter=dot`                                 | PASS. 2/2 scoped Pages/offline cases outside the managed sandbox.                                                                                                                                                                      |
| Candidate V-029/V-030 header suite at 320/393×850, normal and 200% text    | PASS. Retained tests confirm the candidate's target cases and no horizontal document overflow.                                                                                                                                         |
| `npm run test:e2e -- tests/e2e/verifier-round-026.spec.ts --reporter=line` | FAIL as expected for V-031. 320×568 passes; 393×667 at 200% text fails before the first speed control can be physically reached.                                                                                                       |
| Fresh screenshot inspection of the failed 393×667 state                    | FAIL evidence. The bottom navigation visibly covers the Simulation time controls; no visual ambiguity or console/application error is involved.                                                                                        |

## Requirement evidence matrix

| Applicable requirement                                                                                                                                   | Status                                       | Evidence                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-007 bounded Workstation Expansion I scope; historical human-gate status preserved                                                                      | PASS                                         | Candidate diff is stylesheet/test-only; no deferred researcher, hype/fear, multi-pipeline, startup, labor, or later system entered scope. D-007 remains a process waiver, not a human-gate PASS claim. |
| Deterministic headless simulation, valid resources, command recovery, state/version migration                                                            | PASS                                         | 87/87 unit/property/migration tests; retained malformed-command, atomic batch, integrity, and schema-v3/v4 regression coverage.                                                                        |
| Data-driven hardware/modules, purchases, ownership, equip/add, constraints, and progression bounds                                                       | PASS for automated predicates                | Numeric prototype and 20,001-seed upgrade sweep pass; root browser suite covers exact funds, duplicate activation, ownership, and offline persistence.                                                 |
| One ordered 3→6 process pipeline; empty/bypassed new slots; compatible keyboard/tap/touch movement; honest presets                                       | PASS                                         | Retained root browser tests cover expansion purchase/activation, placement, actual pointer/touch drag, preset reload, and offline resume.                                                              |
| Eight staged workloads, deterministic visible unlocks, FIFO task identity, quote locking, saturation/recovery, clear-waiting semantics                   | PASS for automated predicates                | 60/60 root suite, engine/property tests, and balance gates cover cards/locks, task identity, locked quotes, demand, no idle money, and active-task-preserving clear.                                   |
| Fixed 1×/4×/16×/64× schedule equivalence and separation from animation/pause                                                                             | FAIL — V-031 for user-visible control access | Engine/time-equivalence behavior remains covered, but at a required 393px portrait width with 200% text the player cannot tap the visible speed control through the fixed nav.                         |
| Portrait-first UI: 320/393 widths, 200% text, 44px controls, touch reachability, no horizontal overflow, reduced motion, labels, bottom-nav-only routing | FAIL — V-031                                 | Existing normal/850px cases pass. Independent 393×667/200% test proves the speed target is physically covered; the 44px target is therefore not touch reachable in this representative portrait state. |
| Pages subpath/PWA startup, cache isolation, offline reload/resume, cleanup                                                                               | PASS locally                                 | Pages build and 2/2 `/goldlocks-engine/` offline browser cases pass; root suite also covers worker-backed persistence and restart paths.                                                               |
| Reproducible repository-pinned browser verification                                                                                                      | PASS as testability infrastructure           | Setup uses local ignored caches; deterministic loopback server and root/Pages commands ran. Sandbox Mach failure is documented and scoped fallback succeeded.                                          |

## Findings

### V-031 — Scaled time controls remain behind fixed navigation on a shorter required portrait viewport

- Severity: High.
- Related plan requirement: `plan.md` Sections 20.2 and 20.4, Section 24.2,
  Milestone 2 executable acceptance (320/393 CSS pixels, 200% text, 44 CSS
  pixel controls, and bottom-nav-only routing), and D-007's portrait contract.
- Expected behavior: At 393 CSS pixels with 200% text, each 1×/4×/16×/64×
  control must have an unobscured 44px physical target whose center resolves
  to that control, not the fixed global navigation.
- Actual behavior: At 393×667 with `documentElement.style.fontSize = '32px'`,
  the first `1×` button occupies a rectangle ending at y=652.265625 while the
  fixed `Primary` navigation begins at y=520.40625. Its physical center
  resolves to `⌁Build`, not `1×`; the screenshot shows the whole speed row
  behind the nav. The candidate's 850px tests do not cover this threshold.
- Exact reproduction procedure:

  ```sh
  ./scripts/setup
  npm run test:e2e -- tests/e2e/verifier-round-026.spec.ts --reporter=line
  ```

  On this host, run the pinned browser command outside the managed filesystem
  sandbox after its documented pre-page Mach-port denial.

- Concrete evidence: new independent verifier test result: 1/2 passed,
  393×667 failed. It reports both `652.265625 > 520.40625` and
  `Expected: "1×"; Received: "⌁Build"` for the speed-control center hit
  test. `test-results/.../test-failed-1.png` visually confirms the overlap.
- Blocks PASS: yes.

## Unverified areas

- The exact candidate has not yet been pushed, run by its exact-SHA Linux
  workflow, or deployed to Pages. Under the sequential protocol that occurs
  after this verifier handoff; it is not needed to establish the local
  correctable defect.
- Physical device behavior, non-Chromium engines, actual platform
  screen-reader output, battery/thermal behavior, haptics, and audio are not
  available here.
- D-007's historical human playtest gates remain unmeasured and owner-waived
  only for this bounded automated implementation slice.

## Residual risks

- The candidate's intrinsic header layout fixes the tall 850px test cases but
  does not reserve enough vertical interaction space against a fixed nav at
  shorter portrait heights. A repair must prove all four controls remain
  physically tappable across the required widths/text scale without depending
  on an unprompted scroll.
- The deterministic economy evidence proves model bounds, not long-term human
  enjoyment or real-market calibration.
