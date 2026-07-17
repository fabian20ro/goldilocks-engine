# Verification round 025

Candidate SHA: `a3c0ba39607e05d2c944081501a3729a3f307e31`

VERDICT: FAIL

## Scope and verdict basis

Authority read independently: all of `plan.md`; `AGENTS.md`; the active
Verifier role; D-004 through D-007; immutable verification history. Applicable
scope is the owner-authorized Workstation Expansion I slice, not deferred
research, hype/fear, multiple-pipeline, startup, labor, or later systems.
D-007 waives the historical unmeasured human gate only for this bounded
automated verification; it does not waive portrait, text-scale, touch, or
accessibility requirements.

Candidate identity was captured before any verifier write:

```text
git rev-parse HEAD = a3c0ba39607e05d2c944081501a3729a3f307e31
git status --short = empty
```

V-029 is resolved: the resource labels, values, time description, document
width, and nominal button sizes are readable at 320/393 CSS pixels and 200%
text. However, the new header reflow vertically places the actual time-speed
buttons directly under the fixed bottom navigation. At both required widths the
nav wins real hit testing; a tap intended for `64×` opens `Inspect`. This
violates the one-handed, 44px, tap-accessible time-control part of the
portrait/accessibility acceptance contract. One normal scroll can reveal the
controls, but their initial rendered control region is still covered by a
separate global navigation action; that is not a tap-reachable control at the
location presented to the player.

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0.
- Repository-pinned `@playwright/test` 1.61.1; repository-local browser cache
  `.cache/ms-playwright`; locked install through `./scripts/setup`.
- Managed sandbox Chromium launch: unavailable before page creation due macOS
  Mach-port registration denial. This is host isolation, not a candidate
  assertion. The same pinned commands were then run outside that managed
  boundary and launched normally.
- Fresh local visual inspection used repository-pinned Chromium against the
  candidate via a temporary `./scripts/run`-equivalent Vite server. No page or
  console errors observed. Temporary server was stopped; post-stop HTTP probe
  returned connection refused.

## Commands executed and results

| Command or probe                                                                                | Result                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Candidate SHA / clean-start checks                                                              | PASS. Exact supplied SHA, clean before verifier writes.                                                                                                                                                                                          |
| `./scripts/verify` in managed sandbox                                                           | Static, unit/property, balance, build phases passed. Chromium failed before page creation only with `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`; root and Pages phases were not silently skipped.             |
| `./scripts/verify` outside managed sandbox                                                      | PASS. Setup, format, lint, typecheck, 18 files / 87 unit-property tests, numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, root build, root Playwright, and scoped Pages/offline Playwright completed.                    |
| `npm run test:e2e -- tests/e2e/round-025-header-scale.spec.ts --reporter=line`                  | PASS, 4/4. Candidate header regression: 320/393 normal and 200% text have unclipped primary resources, time description, ≥44px speed controls, and no horizontal overflow.                                                                       |
| `npm run test:e2e -- tests/e2e/verifier-round-024.spec.ts --reporter=line`                      | PASS, 2/2. Exact V-029 text-clipping regression remains repaired.                                                                                                                                                                                |
| `npm run test:e2e:pages -- --reporter=line`                                                     | PASS, 2/2. Scoped Pages base, Worker, service-worker/offline resume, and foreign-cache isolation.                                                                                                                                                |
| `npm run test:e2e -- --grep-invert "physically tap-reachable" --reporter=line`                  | PASS, 58/58. Existing root suite: 320/393 portrait, keyboard/tap/pointer/touch module movement, queues, market, purchases, expansion, presets, migration, reload/resume, offline, reduced motion, labels, no overflow, and retained regressions. |
| `npm run test:e2e -- tests/e2e/verifier-round-025.spec.ts --reporter=line`                      | FAIL, expected reproduction, 2/2. Both required widths target the `Inspect` bottom-tab button instead of `64×`.                                                                                                                                  |
| Full root `npm run test:e2e -- --reporter=dot`                                                  | Only the two committed verifier regressions failed; no unrelated root case failed.                                                                                                                                                               |
| `npx tsx -e "…"` independent engine/Worker probe                                                | PASS. Unknown direct/batch requests exact no-ops; queue-time quote locks; clear preserves active task/resources/demand/RNG; fixed 0.5s quanta are schedule-equivalent through 64×; resulting states valid.                                       |
| `npm run format:check && npm run lint && npm run typecheck && npm test` after verifier artifact | PASS. Format, lint, typecheck, 18 files / 87 tests, coverage run.                                                                                                                                                                                |
| `./scripts/run`; HTTP `/`, Worker source, and `/sw.js`; interrupt; post-stop probe              | PASS. All returned HTTP 200 while running; process cleaned up and port stopped accepting connections.                                                                                                                                            |
| Fresh visual/pointer inspection at 320/393 × 850 with root font `32px`                          | FAIL for V-030. Screenshots and DOM geometry show readable header copy but the fixed nav covers the speed-option centers. No page/console errors.                                                                                                |

## Requirement matrix

| Applicable requirement                                                                                                                  | Evidence                                                                                        | Result                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Deterministic, versioned headless simulation; valid numeric/resource/ledger boundaries                                                  | Canonical unit/property suite; direct Worker/engine probe; numeric/balance sweeps               | PASS                                                                                                      |
| D-004 malformed direct and batched runtime command recovery                                                                             | Retained V-028 regressions; direct unknown/malformed Worker-envelope no-op probe                | PASS                                                                                                      |
| Milestone 0 economy tradeoffs and automated pacing predicates                                                                           | Numeric prototype; 20,001-seed upgrade and 41-seed progression sweeps in canonical check        | PASS for executable predicates; historical subjective gate remains unmeasured as documented by D-007      |
| Constrained vertical pipeline; compatible tap/keyboard/pointer/touch reorder; branch; queues; failure/recovery                          | 58/58 root browser suite; build/type checks; no page/console errors in fresh inspection         | PASS                                                                                                      |
| D-005 tutorial/help, money loop, CU/memory/thermal explanation, visual-only animation, presets, deletion/undo                           | Root usability/persistence browser cases in 58/58 suite                                         | PASS                                                                                                      |
| D-006 ownership/purchase/equip/add economy, exact-once deductions, visible tradeoffs and pacing                                         | Upgrade browser cases; 20,001-seed sweep; canonical check                                       | PASS                                                                                                      |
| One active exact-once 3→6 process-capacity expansion; empty slots; honest preset topology                                               | Expansion browser/offline cases; engine invariants; 320/393 expanded-pipeline cases             | PASS                                                                                                      |
| Eight staged workloads, durable unlocks, queue identity/quotes, saturation/recovery, cost/net warning                                   | Engine/property, market browser cases, direct quote-lock probe, progression sweep               | PASS                                                                                                      |
| Clear waiting only: active task, accepted quote, money, demand, RNG preserved                                                           | Expansion browser case plus direct exact-state probe                                            | PASS                                                                                                      |
| Fixed deterministic 1×/4×/16×/64× schedule; separate animation/pause                                                                    | Engine schedule-equivalence tests; direct quantum probe; retained browser time tests            | PASS for simulation semantics; see V-030 for physical access to control                                   |
| 320/393 portrait; 200% text; no horizontal overflow; 44px targets; screen-reader labels; reduced motion; bottom-tab-only global routing | Root/browser/PAGES suites, V-029 repair cases, fresh visual inspection                          | FAIL — V-030 makes all speed buttons covered by the bottom nav at both required 200%-text portrait widths |
| Schema-v3/v4 migration; schema-v5 integrity/recovery; persistence/reload/resume/offline/service-worker scope                            | Unit, root migration/preset/offline cases; Pages 2/2                                            | PASS                                                                                                      |
| Pinned Playwright, local cache, deterministic startup/cleanup, Pages subpath verification                                               | Package/scripts source inspection; canonical setup; root/Pages execution; startup/cleanup probe | PASS                                                                                                      |
| D-007 scope boundary; no later/deferred system expansion                                                                                | Plan/decision/source inspection                                                                 | PASS                                                                                                      |

## Findings

### V-030 — Fixed bottom navigation covers every time-speed button at required 200% text scale

- Severity: High.
- Related plan requirement: `plan.md` Sections 20.2 and 20.4; Section 24.2;
  Milestone 2 executable acceptance; D-005 criterion 8; D-007 portrait and
  time-contract requirements.
- Expected behavior: At 320 and 393 CSS pixels with 200% text, each 1×/4×/16×/64×
  control remains a physically tap-reachable ≥44 CSS-pixel control, visibly
  distinct from animation/pause and not intercepted by a global navigation
  action.
- Actual behavior: At a representative 850px portrait height, 64× is rendered
  underneath the fixed bottom navigation. Its center is covered by the
  `Inspect` tab. The same geometry covers each of the four horizontal speed
  controls with a bottom-tab action. The component's nominal rectangle remains
  ≥44px and DOM-visible, so existing size/visibility assertions miss the
  interaction failure.
- Exact reproduction procedure:

  ```sh
  npm run test:e2e -- tests/e2e/verifier-round-025.spec.ts --reporter=line
  ```

  The verifier test sets a 320px or 393px by 850px viewport, changes root text
  size to `32px`, obtains the actual `64×` bounding box, asks
  `document.elementFromPoint` for its center, and emits a physical mouse click.

- Concrete evidence:
  - 320px: `64×` box `x=234.70, y=704.75, w=61.30, h=50.38`; fixed nav begins
    `y=703.41`. Center hit-test resolves to `⌕Inspect`. Physical click leaves
    `64× aria-pressed="false"` and gives `Inspect aria-current="page"`.
  - 393px: same 2-column header reflow and the same `Inspect` interception;
    committed regression fails with `Received string: "⌕Inspect"`.
  - Fresh 320/393 screenshots show the text repair, followed directly by the
    fixed navigation; the speed controls are absent from the initial visible
    region because they sit beneath it.
  - A normal scroll can bring them above the nav. That recovery does not change
    the fact that the location rendered as the time-control region is covered
    and taps activate unrelated global navigation.
- Blocks PASS: yes.

## Unverified areas

- Historical uninterrupted 30-minute human playtest/economy-interest evidence
  remains absent. D-007 permits this bounded automated verification without
  representing it as passed.
- Physical mobile devices, non-Chromium engines, actual platform screen-reader
  output, battery/thermal profile, haptics, and audio are unavailable here.
- Candidate is local only; push/deployment/live exact-SHA validation belongs to
  the Orchestrator after a fresh PASS candidate.

## Residual risks

- Deterministic sweeps establish the configured toy-economy bounds, not
  long-term player enjoyment or real-market calibration.
- After V-030 repair, rerun the complete root and Pages browser gates at both
  portrait widths and 200% text. A regression must use real hit testing or
  pointer/touch input, not only `toBeVisible`, dimensions, or DOM clipping.
