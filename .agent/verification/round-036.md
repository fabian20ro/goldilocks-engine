# Verification round 036

Candidate SHA: `4a6d3b9d351721a322c7c3bc61da513ddcab5d65`

VERDICT: FAIL

## Candidate freeze and verdict basis

- Before any verifier write, `git rev-parse HEAD` returned the supplied exact
  candidate SHA and `git status --short` was empty.
- `plan.md`, `.agent/DECISIONS.md`, the immutable finding history, candidate
  production code, and `.agent/HANDOFF.md` as untrusted guidance were read
  independently.
- Static checks, 126 candidate unit/property tests, all deterministic balance
  sweeps, production build, 111 retained root browser tests, and both Pages
  browser tests pass on the usable host-browser path.
- Acceptance fails because Upgrades permits multiple primary item-detail
  disclosures concurrently (V-042), and two of the four required Career hour
  tokens extend outside the required 393 CSS-pixel portrait viewport (V-043).

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`.
- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; repository-pinned
  Playwright 1.61.1 and repository-local Chromium cache.
- `./scripts/setup`, invoked by `./scripts/verify`, recreated dependencies from
  the lockfile and used ignored repository-local npm/browser caches.
- Port 4173 was already occupied by a pre-existing Node listener. The documented
  `E2E_PORT=4174` test-server override isolated verification without touching
  that unrelated process. Port 4174 had no listener after each browser run.
- Managed-sandbox Chromium consistently failed before page creation at macOS
  Mach-port registration (`bootstrap_check_in ... Permission denied (1100)`).
  The exact pinned commands were rerun with host browser launch permission;
  browser verification was not skipped.
- Verifier-authored artifact:
  `tests/e2e/verifier-round-036.spec.ts`.

## Commands executed and results

| Command or check | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | PASS. Exact supplied SHA; clean start. |
| `./scripts/verify` | Static/unit/balance/build pass; browser startup cannot use occupied port 4173. Environmental contention, not candidate behavior. |
| `E2E_PORT=4174 ./scripts/verify` in managed sandbox | Static/unit/balance/build pass; Chromium cannot register its Mach rendezvous port. |
| `E2E_PORT=4174 ./scripts/verify` with permitted host Chromium | Candidate checks pass: format, lint, typecheck, 26 files / 126 unit-property tests, numeric prototype, 20,001-seed upgrade, 41-seed progression, 101-seed Career, 121-seed evaluation sweeps, build, 111 retained root browser tests, and 2 Pages tests. Overall exit 1 solely because verifier V-042 regression fails, producing 111/112 root results. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts --reporter=line` with permitted host Chromium | FAIL as expected, 0/2. Opening a second Upgrades comparison leaves two `article.upgrade-card details[open]`; the third 393px Career token ends at x=416.109375, outside x=393. |
| Real inspection of all 20 `test-results/command-deck/*.png` renders | Starter and expanded Build, Jobs, Career, Upgrades, and Inspect inspected at 320x693 and 393x742. Shared palette, ordered rail, primary-action geometry, and tab grammar are coherent. Career screenshots independently show the 393px clipped tokens underlying V-043. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` after verifier test | PASS. |
| `lsof -nP -iTCP:4174 -sTCP:LISTEN` after browser runs | No listener; Playwright servers cleaned up. |

## Requirement evidence matrix

| Applicable plan / decision requirement | Evidence and result |
| --- | --- |
| Plan section 20.5 / D-012 shared initial palette, semantic glyph registry, code-native art, and five-tab command-deck grammar | Source inspection, component tests, retained browser suite, and 20 screenshots show the shared forest/acid/amber/cyan system and centralized decorative glyph helpers. PASS. |
| Compact portrait shell; HUD, objective/bottleneck, first Build control and Jobs selection/Queue 1 above navigation at 320x693 and 393x742 | `command-deck.spec.ts` geometry passes at both sizes; screenshots inspected. PASS. |
| Pipe-free five/eight-stage ordered rail; expansion adds only three empty/bypassed positions; no nested rail scroll trap | Candidate source, command-deck/expansion acceptance, and starter/expanded screenshots pass. Simulation/content diffs introduce no second pipeline or capacity side effect. PASS. |
| Build tap, keyboard, pointer/real-touch drag; compatible replacement/reorder/bypass; Build/Run presentation does not mutate simulation | Retained root interaction, CDP touch, expansion, and command-deck tests pass. PASS. |
| Live dispatch/progression, queue/payout/failure feedback, fixed simulation speeds, preserved deterministic Worker authority | Retained game, usability, market, failure/replay, time-equivalence, and balance checks pass. PASS. |
| Jobs selected workload and Queue 1 in thumb zone; quote locking, demand, risk/cost, clearing, locks, and settlement detail | Geometry plus retained Workstation market/browser and deterministic checks pass. PASS. |
| Career four-hour schedule, warm route cards, exact fractional input, projected consequences, and large accessible time tokens | Engine/accounting and prior Career browser paths pass, but at 393px the token row remains 176px wide inside an approximately 82px column; tokens 3 and 4 are visibly clipped/off-viewport. FAIL — V-043. |
| Upgrades comparison bench; live catalogue deltas; ownership/equip; symbolic `3 -> 6`; one item-level details surface per view with replacement/close/focus behavior | Prices, deltas, expansion/equip flows pass. Stage `DetailsSurface` replacement/focus passes, but Upgrades uses independent native disclosures and leaves two open after the player opens another item. FAIL — V-042. |
| Inspect gauges plus exact tables, causal labels, presets, baseline, event/postmortem disclosure | Source inspection, screenshots, retained preset/evaluation/replay tests pass. PASS. |
| Exactly one primary item-details surface per view; item activation replacement; complete live detail and contextual action | Pipeline stages satisfy the behavior. Upgrades violates the view-wide exclusivity contract. Candidate also relies on multiple independent native disclosures rather than the single replacement surface there. FAIL — V-042. |
| 320/393 portrait, 44px controls, no document horizontal overflow, 200% text, reduced motion, color-independent labels, keyboard, screen-reader names | Retained accessibility/portrait suite passes its assertions, but its document-overflow check misses controls clipped by the scroll-region boundary. Independent token geometry fails at 393px. FAIL — V-043. |
| Tab-specific scroll handling, reload/resume, offline reload, root/Pages PWA install/update/recovery and process cleanup | Retained root tests, both Pages tests, offline/redeploy cases, and listener cleanup pass. PASS. |
| Plan sections 4-19 and 23-27 / D-004 through D-011: deterministic single-pipeline economy, progression, persistence/migration, causal endings/replay, balance, malformed-state recovery | 126 unit/property tests, all four deterministic sweeps, and 111 retained root browser cases pass. Candidate production diff is UI-focused and no simulation/schema/content mutation was found. PASS. |
| Plan/D-012 scope boundary: no raster production art, remote assets, new commands/content/navigation, characters, hype/fear, extra pipelines, startup/labor/laboratory systems | Source/diff inspection finds concept PNGs only under non-authoritative docs and no prohibited production system. PASS. |
| Canonical complete verification gate | All inherited candidate gates pass, but canonical includes the verifier-owned V-042 regression and exits 1. V-043 independently fails focused browser verification. FAIL. |

## Findings

### V-042 — Upgrades leaves multiple primary item-detail surfaces open

- Severity: High.
- Related requirement: `plan.md` section 20.5, Item-level details and
  progressive disclosure; D-012 Information contract and Evidence policy.
- Expected behavior: Exactly one primary item-details surface is open per view.
  Opening another item replaces the prior details surface; close/Escape restores
  focus to the origin.
- Actual behavior: Upgrades renders a separate uncontrolled native `<details>`
  element in every rig and module card. The equipped rig starts open. Opening a
  second item's comparison leaves both disclosures open. There is no view-level
  selected-item owner, replacement, labeled Close action, Escape handling, or
  origin-focus restoration for these item details.
- Exact reproduction:
  1. Run `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-036.spec.ts --reporter=line` with repository-pinned Chromium.
  2. Open Upgrades at 320x693.
  3. Activate the second `Compare module details and tradeoffs` summary.
  4. Count `article.upgrade-card details[open]`.
- Concrete evidence: the focused Playwright run receives 2 where the exclusive
  contract requires 1. `src/ui/App.tsx` implements independent disclosures in
  `RigUpgradeCard` and `ModuleUpgradeCard`, with equipped cards default-open.
- Blocks PASS: yes.

### V-043 — Career hour tokens are clipped outside the required 393px viewport

- Severity: High.
- Related requirement: `plan.md` sections 20.4 and 20.5, Career finite-time
  tokens and required 393 CSS-pixel portrait accessibility; D-012 Interaction
  and Evidence contracts.
- Expected behavior: Each Career route exposes all four large accessible hour
  allocation tokens inside the 393px portrait viewport, reachable without
  horizontal overflow, clipping, or pinch zoom.
- Actual behavior: At 393px, `.career-route` retains a two-column layout whose
  control column is about 82px, while `.hour-tokens` requires four 44px columns
  plus gaps. The app scroll region clips the excess instead of reporting
  document overflow. Tokens 3 and 4 extend off the right edge and are visibly
  cut off in starter and expanded Career screenshots.
- Exact reproduction:
  1. Run the focused round-036 command above.
  2. Open Career at 393x742.
  3. Measure the four buttons named `Allocate N hours to Freelance delivery`.
  4. Compare each right edge with viewport x=393.
- Concrete evidence: the third token's right edge is x=416.109375 (>393); the
  focused assertion fails. The 393 starter/expanded Career renders show the
  clipped row. CSS changes the Career card to one column only below 350px, so
  393px remains in the invalid narrow-control layout.
- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal characteristics, platform screen-reader
  speech output, and engines outside repository-pinned Chromium.
- Exact-candidate public deployment was not evaluated because this candidate
  already fails pre-deployment acceptance. Root/Pages build and update behavior
  was nevertheless exercised locally by the complete pinned suite.

## Residual risks

- Visual inspection and geometry cover the two required portrait sizes, but
  native emoji appearance varies by operating system; labels retain semantics.
- Other views still contain independent native disclosures. V-042 records the
  directly reproduced Upgrades violation; a repair should enforce the stated
  one-primary-surface rule consistently across every item type rather than only
  reducing the initial open count.
