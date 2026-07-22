# Verification round 037

Candidate SHA: `2fc5fc1529d7eb999a54b07b153eaee17cb29fb2`

VERDICT: FAIL

## Candidate freeze and verdict basis

- Before any verifier write, `git rev-parse HEAD` returned the supplied exact
  candidate SHA and `git status --short` was empty.
- `plan.md`, `.agent/DECISIONS.md`, all immutable prior reports, candidate
  production code, and `.agent/HANDOFF.md` as untrusted guidance were read
  independently.
- The exact candidate passes format, lint, typecheck, 126 unit/property tests,
  all four deterministic balance sweeps, production build, 116 retained root
  Chromium tests, and both Pages tests on the usable host-browser path.
- V-042 and V-043 are resolved. Acceptance still fails because the exact
  fractional Career hour inputs collapse below the required 44 CSS-pixel target
  at 320px with 200% text (V-044).

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`.
- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; repository-pinned
  Playwright 1.61.1 and repository-local Chromium cache.
- `./scripts/setup`, invoked by `./scripts/verify`, recreated dependencies from
  the lockfile and used ignored repository-local npm/browser caches.
- Port 4173 remained occupied by a pre-existing unrelated Node listener. All
  browser verification used documented `E2E_PORT=4174`; no listener remained
  on 4174 afterward.
- Managed-sandbox Chromium failed before page creation at macOS Mach-port
  registration. Exact pinned browser commands were rerun with scoped host
  permission; browser verification was not skipped.
- Verifier-authored artifact:
  `tests/e2e/verifier-round-037.spec.ts`.

## Commands executed and results

| Command or check | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | PASS. Exact supplied SHA; clean start. |
| `E2E_PORT=4174 ./scripts/verify` in managed sandbox | Static/unit/balance/build PASS; Chromium denied Mach-port registration before test runtime. Environment-only failure. |
| `E2E_PORT=4174 ./scripts/verify` with permitted host Chromium | PASS for candidate suite: format, lint, typecheck, 26 files / 126 unit-property tests, numeric prototype, 20,001-seed upgrade, 41-seed progression, 101-seed Career, 121-seed evaluation sweeps, build, 116/116 root browser tests, 2/2 Pages tests. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | PASS, 6/6. Regenerated 22 required visual renders and passed retained cross-item details, focus, topology, and Career token geometry cases. |
| Real inspection of all 22 `test-results/command-deck/*.png` renders | Starter and expanded Build, Jobs, Career, Upgrades, and Inspect inspected at 320x693 and 393x742, plus both 200%-text Career renders. Shared grammar is coherent; 320/200% visibly exposes the crushed numeric input underlying V-044. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-037.spec.ts --reporter=line` with permitted host Chromium | FAIL as expected, 0/1. Every exact Career numeric input measured only 28.875px wide at 320px/200% text. |
| `npx prettier --write tests/e2e/verifier-round-037.spec.ts`; `npm run lint`; `npm run typecheck`; `git diff --check` | PASS after verifier artifact. |
| `lsof -nP -iTCP:4174 -sTCP:LISTEN` after browser runs | No listener; Playwright server cleanup PASS. |

## Requirement evidence matrix

| Applicable plan / decision requirement | Evidence and result |
| --- | --- |
| Plan section 20.5 / D-012 shared initial palette, semantic glyph registry, code-native art, and five-tab command-deck grammar | Source inspection, component tests, retained browser suite, and all 22 inspected renders. PASS. |
| Compact portrait shell; HUD, objective/bottleneck, first Build control and Jobs selection/Queue 1 above navigation at 320x693 and 393x742 | Retained geometry assertions and screenshots. PASS. |
| Pipe-free five/eight-stage ordered rail; expansion adds only three empty/bypassed positions; no nested rail scroll trap | Candidate source, expansion acceptance, and starter/expanded renders. PASS. |
| Build tap, keyboard, pointer/real-touch drag; compatible replacement/reorder/bypass; Build/Run presentation does not mutate simulation | Retained interaction, CDP touch, expansion, and command-deck cases. PASS. |
| Live dispatch/progression, queue/payout/failure feedback, fixed speeds, preserved deterministic Worker authority | Root browser suite, unit/property checks, and balance sweeps. PASS. |
| Jobs selected workload/Queue 1 hierarchy; locked quotes, demand, costs, clearing, and settlements | Retained market/browser and deterministic checks. PASS. |
| Career four-hour schedule, exact fractional allocation, projected consequences, and large accessible controls | Schedule/accounting behavior passes and all four visual tokens now fit. Exact numeric inputs are only 28.875px wide at 320px/200%, failing equivalent access and the 44px target contract. FAIL — V-044. |
| Upgrades live comparison, ownership/equip, symbolic `3 -> 6`, and exactly one primary item-details surface with replacement/close/focus restoration | Retained round-036 test plus new cross-item/Close/Escape test pass. V-042 resolved. PASS. |
| Career tokens contained by the 393px portrait viewport | Retained round-036 regression and new all-token checks pass. V-043 resolved. PASS. |
| Inspect gauges, exact tables, causal labels, presets, baseline, event/postmortem disclosure | Source, renders, and retained persistence/evaluation/replay checks. PASS. |
| 320/393 portrait, 200% text, 44px actionable controls, no horizontal overflow, reduced motion, color-independent labels, keyboard and screen-reader names | Broad retained assertions pass, but the 320/200% exact Career inputs are visibly and geometrically below 44px. FAIL — V-044. |
| Tab-specific scroll handling, reload/resume, offline reload, root/Pages PWA install/update/recovery, failure/recovery, and cleanup | 116 root and 2 Pages cases pass; no 4174 listener remains. PASS. |
| Plan sections 4-19 and 23-27 / D-004 through D-011: deterministic single-pipeline economy, progression, persistence/migration, causal endings/replay, malformed-state recovery | 126 unit/property tests, all balance sweeps, and retained browser coverage pass. Candidate production diff is UI-only. PASS. |
| D-012 scope boundary: no production raster/remote art, new command/content/navigation, characters, hype/fear, extra pipelines, startup/labor/laboratory systems | Candidate diff/source inspection found none. PASS. |
| Canonical complete verification gate | Candidate suite passed before verifier additions; with the required V-044 regression, browser verification exits 1. FAIL. |

## Prior finding regression results

- V-001 through V-041 remain resolved in retained static, unit/property,
  deterministic, persistence, root browser, Pages, and recovery evidence.
- V-042 is resolved: Upgrades owns one controlled detail selection across
  expansion, rigs, and modules; cross-item replacement, labeled Close, Escape,
  and origin-focus restoration pass.
- V-043 is resolved: all four Career tokens remain inside 393px and are at least
  44px, including at 200% text.

## Findings

### V-044 — Exact Career hour inputs collapse below the required touch target

- Severity: High.
- Related requirement: `plan.md` sections 20.4 and 20.5, Career finite-time
  tokens, exact fractional-hour behavior, equivalent pointer/touch/keyboard
  access, required 320 CSS-pixel portrait support, and 44 CSS-pixel actionable
  controls; D-012 Interaction and Evidence contracts.
- Expected behavior: At 320px and 200% text, each route's exact numeric
  fractional-hour input remains a usable control at least 44 CSS pixels wide
  and high, contained by its route card, alongside the four hour tokens.
- Actual behavior: The four tokens fit, but each numeric input is compressed to
  28.875 CSS pixels wide and appears as a narrow vertical sliver. The
  `@media (max-width: 350px)` rule overrides the repaired one-column
  `.career-hours-control` with `auto minmax(0, 1fr)`, forcing the token grid and
  numeric input back onto one row.
- Exact reproduction:
  1. Run `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-037.spec.ts --reporter=line` with repository-pinned Chromium.
  2. Open Career at 320x693 and apply 200% root text.
  3. Measure the four `.career-route input[type="number"]` controls.
- Concrete evidence: The verifier regression expects a minimum 44px width and
  receives 28.875px. The inspected
  `test-results/command-deck/320-career-200-percent.png` independently shows the
  crushed control; the 393px render shows the intended full-width input.
- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal behavior, platform screen-reader speech, and
  engines outside repository-pinned Chromium.
- Exact-candidate public deployment was not evaluated because the candidate
  fails pre-deployment acceptance. Root/Pages packaging and update/recovery were
  exercised locally.

## Residual risks

- Native emoji rendering varies by platform; visible labels preserve meaning.
- Other narrow-width media overrides may conflict with base D-012 reflow rules;
  V-044 is the concrete independently reproduced instance.
- Automated scenario and balance evidence establishes declared mechanics and
  bounds, not subjective long-session enjoyment; D-009 makes optional feedback
  non-blocking.
