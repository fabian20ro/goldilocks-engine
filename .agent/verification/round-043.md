# Verification round 043 — exact-SHA Linux portrait and queue-clear audit

Candidate SHA: `eb69aad519ea26abb809f5e312e6eac9d39ce5a6`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier edit, `git rev-parse HEAD` returned exactly
  `eb69aad519ea26abb809f5e312e6eac9d39ce5a6`; `git status --short` was empty.
- Independently read `plan.md`, `.agent/DECISIONS.md`, the Verifier role,
  `.agent/HANDOFF.md`, and immutable reports `round-001.md` through
  `round-042.md`. Handoff claims and candidate-authored tests were treated as
  hints, not proof.
- Inspected `scripts/setup`, `scripts/run`, `scripts/run-e2e`, Playwright
  configuration, the affected Jobs UI, styles, Worker time loop, engine clear
  command, and acceptance tests. No production source was changed.
- Candidate delta from the preceding production commit `22700e9` contains only
  round-042 verification artifacts. The exact candidate nonetheless has a
  completed hosted canonical failure; the frozen production behavior is what
  this report evaluates.
- Verifier artifacts committed with this report: a stable clear-waiting E2E
  assertion in `tests/e2e/round-015-expansion.spec.ts` and independent
  persistence regression `tests/e2e/verifier-round-043.spec.ts`.

## Environment and setup

- Local: macOS 26.5.2 (25F84), arm64; Node `v26.5.0`; npm `11.17.0`;
  repository-pinned Playwright `1.61.1`.
- Exact hosted evidence: GitHub Actions run
  [`30059079196`](https://github.com/fabian20ro/goldlocks-engine/actions/runs/30059079196),
  job `89376819702`, checked out candidate SHA exactly and failed on 2026-07-24.
  Its uploaded evidence artifact was inspected locally.
- `./scripts/setup` uses repository-local `.cache/npm` and
  `.cache/ms-playwright`. `scripts/run-e2e` builds and starts loopback preview;
  Playwright waits for readiness and cleans it up.
- Sandboxed macOS Chromium cannot register its Mach-port rendezvous server
  (`Permission denied (1100)`) before test bodies. Scoped host-browser runs use
  the same pinned local Chromium; this is environment-only, not a candidate
  defect. Final `lsof` checks found no listener on ports 4173 or 4174.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before edits | Exact candidate SHA; clean. |
| `./scripts/verify` in sandbox | Format, lint, typecheck, 153 unit/property tests, balances, and build passed; both browser suites failed before test bodies solely at the documented macOS Mach-port sandbox restriction. |
| `E2E_PORT=4174 ./scripts/verify` with scoped host browser, before verifier artifacts | Exit 0. Format/lint/typecheck; 153 unit/property tests; numeric prototype; 41-seed first-session, 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps; build; root Playwright 146/146; Pages 2/2. |
| Hosted exact-SHA `Verify` run `30059079196` | Exit failure. Root Playwright: 3 failed, 143 passed; Pages: 2/2 passed. The job metadata names this candidate SHA exactly. |
| `gh run view ... --log-failed` plus downloaded `verification-evidence-eb69...` artifact | Two independent 320×693 Jobs geometry assertions report Queue bottom `620.296875` versus nav top `619.21875`; original-resolution screenshot inspected. The clear test timed out after normal fast-forward settlement. |
| Exact original `round-015-expansion` clear test, `--repeat-each=20` | 1 failed, 19 passed. The failure was the same line-190 active-task predicate; no product exception. |
| Verifier-stabilized same test, `--repeat-each=20` | 20/20 passed. It retains the clear semantics assertion after setting 1× and pausing an already-active task. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-043.spec.ts` | Pass 1/1. Verifies active ID and locked quote survive clear-waiting and reload, with no page/console errors. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` | Pass after verifier artifacts. |
| Final `E2E_PORT=4174 ./scripts/verify` with verifier artifacts | Exit 0 locally: 153 unit/property tests; all five balance sweeps; root Playwright 147/147; Pages/offline 2/2. This proves the verifier test repair is stable locally; it does not erase the exact candidate's hosted failure. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-042.spec.ts` and original-resolution inspection | Pass 3/3. Inspected all five tabs in starter and Workstation states at 320×693 and 393×742, plus 320px/200% Jobs and Build screenshots. Local deck is coherent; the exact Linux 320 Jobs screenshot separately shows the Queue action under the nav edge. |

## Requirement matrix

| Applicable plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| Deterministic engine, valid/malformed state recovery, Worker authority, migrations, fixed 1×/4×/16×/64× behavior (§§23–27; D-004, D-007, D-014–D-017) | Local canonical unit/property suite (153), static checks, all deterministic sweeps, and retained malformed/migration/recovery browser cases passed. | Pass locally |
| One ordered starter/Workstation pipeline; exact-once expansion; eight workloads; locked task identity/quote; demand; clear-waiting-only semantics (§§8–10; Milestone 2; D-007) | Local canonical passed expansion, queue, saturation/recovery, clear, offline, duplicate activation, and 200% cases. New verifier E2E proves an existing active task's exact ID/quote remains through clear and reload. | Product behavior passes local probe; see V-053 for original test instability |
| Finite first-session rail, explicit Build placement, focus/cancellation, corruption-safe recovery (§20.6; D-013–D-017) | Local canonical passes first-session, placement, touch/keyboard, malformed-save, forged-state, reload, offline, and focus cases. | Pass locally |
| Career, evaluation/failure/replay, causal ledger, postmortem, and replay persistence (Milestone 3; D-010/D-011) | Local canonical Career/evaluation sweeps and root browser cases passed. | Pass locally |
| Root and Pages PWA install/update, malformed deployment rejection, offline/save/reload recovery, scoped cache isolation (D-008) | Local canonical root PWA/update cases and Pages 2/2 passed. Exact hosted Pages suite also passed 2/2. | Pass locally and hosted |
| Shared command-deck grammar, five tabs, starter/expanded screenshot coherence, no remote/raster additions (§20.5; D-012) | Fresh pinned-browser screenshots of all five views × starter/expanded × 320/393 were inspected; source uses code-native visual tokens/glyphs. | Pass locally |
| Initial raw portrait geometry: HUD/objective/first Build control; Jobs selected workload and Queue 1 fully above nav at 320×693 and 393×742, no initial scroll (§20.5; D-012 interaction contract) | Local macOS geometry cases passed. Exact Ubuntu candidate run independently failed both Jobs assertions at 320×693 with an observed 1.078125px overlap and visible nav occlusion. | **Fail — V-052** |
| Portrait accessibility: 44px controls, no horizontal overflow/nested rail trap, text scale, touch/drag, keyboard/focus, reduced motion, labels (§§20.4–20.6) | Local canonical and fresh screenshot suite cover 320/393, short portrait, 200% text, touch, keyboard, Escape focus, reduced motion, and page/console errors. | Pass locally |
| Reproducible complete canonical gate / installation / startup / cleanup (§27; AGENTS repository testability) | Setup/startup are reproducible with local caches and local host suite passes. Exact candidate's required hosted canonical run fails; original clear test is timing-racy. | **Fail — V-053** |
| Deferred Research/creator/hype/fear/workforce/startup/laboratory systems remain out of scope (plan scope/D-007/D-012/D-013) | Candidate delta adds verification only; canonical scope regressions pass. | Pass |
| Exact accepted SHA deployment (D-009; §20.6 completion) | Cannot be accepted while exact candidate Verify fails. No deployment verdict attempted by Verifier. | Not reached because of FAIL |

## Findings

### V-052 — High — Linux 320×693 Jobs Queue action overlaps fixed navigation

- **Related requirement:** plan §20.5 shared portrait shell and Jobs dispatch
  cards; D-012 interaction contract; §27 mobile/portrait verification.
- **Expected behavior:** At raw 320×693 on initial Jobs, the selected playable
  workload and the entire Queue 1 action are visible above Primary navigation
  without scrolling.
- **Actual behavior:** The exact hosted Linux candidate measured Queue action
  bottom at `620.296875` CSS px and nav top at `619.21875` CSS px: `1.078125`
  CSS px of the action enters the fixed nav region. The artifact screenshot
  visibly shows the action's bottom edge behind the navigation bar.
- **Exact reproduction:** Check out `eb69aad519ea26abb809f5e312e6eac9d39ce5a6`
  on an Ubuntu Playwright runner, run `./scripts/verify`, then execute
  `tests/e2e/command-deck.spec.ts` and
  `tests/e2e/verifier-round-041.spec.ts` at 320×693.
- **Concrete evidence:** Hosted run `30059079196`, root test 6 and test 139,
  both fail the same strict rectangle assertion with the same values. The
  downloaded artifact's `db8cb8b74eb2bf3937f3a5389503dd12f1703da3.png` was
  inspected at original resolution. The 393×742 counterparts passed.
- **Blocks PASS:** Yes. This is a user-visible required geometry violation,
  demonstrated twice by independent tests on the exact frozen SHA; local macOS
  success does not satisfy the cross-platform required portrait behavior.

### V-053 — Medium — exact candidate canonical clear-waiting assertion is nondeterministic

- **Related requirement:** plan §27 canonical verification; Milestone 2
  clear-waiting active-task preservation; D-007 task/economy contract.
- **Expected behavior:** The canonical E2E gate is reproducible and asserts
  active-task preservation without allowing an unpaused 64× simulation clock
  to settle that task during UI confirmation/polling.
- **Actual behavior:** `round-015-expansion.spec.ts` queued ten tasks at 64×,
  captured an active task, cleared waiting tasks, then polled for that same task
  to remain active. A normal fast-forward tick can settle it before the poll.
  The exact hosted failure snapshot had five successful deliveries, zero
  waiting, and `None processing`; no evidence shows that clear removed active
  work. Local repetition of the unchanged candidate test failed 1/20 at the
  same post-clear predicate.
- **Exact reproduction:** On the candidate, run
  `E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep 'shows eight workloads and preserves accepted task identity while clearing only waiting work' --repeat-each=20`.
  This verification run produced 1 failure and 19 passes.
- **Concrete evidence:** Hosted job failure at line 190 after a five-second
  poll timeout; downloaded screenshot and snapshot show normal completed work.
  The verifier's 1× + pause version preserves the original identity/quote and
  clear assertions and passed 20/20; independent `verifier-round-043` also
  proves reload persistence.
- **Blocks PASS:** Yes for this exact candidate: its required canonical gate
  is not reliably green. The test-only stabilization in the verifier commit
  is not a retroactive candidate fix and does not weaken the active-task
  preservation assertion.

## Unverified areas

- No exact-Linux rerun exists after verifier-owned test artifacts; no remote CI
  run was created or altered by this Verifier. The frozen exact-SHA run is
  sufficient for V-052/V-053, but a future candidate needs a fresh successful
  exact-SHA hosted verification.
- Physical iOS/Android behavior, native screen-reader speech, battery/thermal
  budget, and non-Chromium engines were unavailable. Required pinned Chromium
  portrait, touch, keyboard, text-scale, reduced-motion, persistence, PWA,
  offline, and page/console-error paths were exercised.
- Storage-quota interruption at the exact persistence write was not
  fault-injected; malformed-state/reload/offline/PWA recovery coverage passed.

## Residual risks

- The Linux-only geometry failure demonstrates the layout has no cross-platform
  vertical safety margin. A future implementation should leave measurable
  clearance rather than merely matching local font metrics at the nav boundary.
- Local macOS sandbox Chromium requires scoped host launch permission due to
  Mach-port registration. Project-pinned browser setup and loopback startup are
  otherwise reproducible.
- The existing local integrity seal remains a corruption detector rather than a
  server-authenticated anti-cheat boundary, as recorded in round 042; that is
  outside the authorized offline scope and not a new finding.
