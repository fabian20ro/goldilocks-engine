# Verification round 076 — selected-workload reflow repair

Candidate SHA: `5ca8009f30db732316375bac3468d423cf6a0d4a`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned
  `5ca8009f30db732316375bac3468d423cf6a0d4a`, exactly the
  Orchestrator-supplied candidate. Initial `git status --short`: empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, all prior verifier history, and especially round 075
  / V-077. Handoff, comments, and candidate tests treated as hints only.
- Candidate production delta: CSS-only portrait reflow for the selected Jobs
  dispatch header. No engine, Worker, schema, persistence, PWA, economy,
  command, or dependency modification. `git diff --check` passed.
- Verifier artifact: `round-076-adversarial.mjs`; project-pinned Playwright
  probe only. No production repair made.

## Environment and setup

- macOS arm64; Node `v22.23.2` through `npm exec --package=node@22`; npm
  `11.19.0`; repository-pinned `@playwright/test@1.61.1`; ignored local
  browser/cache paths `.cache/ms-playwright` and `.cache/npm`.
- `./scripts/setup` within canonical verification recreated lockfile-pinned
  dependencies and Chromium. Full install reports four existing development
  advisories; production audit passed with zero vulnerabilities.
- Workspace-sandbox Chromium hit the documented macOS Mach-port rendezvous
  denial. Identical repository command rerun in scoped host context used the
  same pinned browser/cache and passed; browser verification was not skipped.
- `./scripts/run` readiness: Vite ready on `127.0.0.1:4173` in 171ms;
  `curl` found `<title>The Goldilocks Engine</title>`. SIGINT stopped it; later
  loopback request refused. Independent preview `:42076` also refused after
  explicit cleanup.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate diff; `git diff --check` | Pass: frozen exact SHA; clean initial tree; CSS-only product delta; no whitespace error. |
| `E2E_PORT=42076 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- sh ./scripts/verify` | Pass host-side: format, lint, typecheck; 45 unit/property files / 223 tests; numeric, first-session 41, upgrades 20,001, progression 41, Career 101, evaluation 121 balance seeds; build; production audit; root Playwright 212/212; Pages Playwright 2/2. |
| Same canonical command first in workspace sandbox | Static/unit/balance/build/audit lanes passed; pinned Chromium launch blocked only by macOS Mach-port sandbox denial. Superseded by successful identical host run above. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:42076 ... node .agent/verification/round-075-adversarial.mjs` | Pass: no findings; raw 320/393 Jobs reserve and target geometry, 200% title/price regression, ten real pointer plus ten CDP-touch drags, Career draft/reload, malformed save, controlled offline PWA reload, no page/console errors. |
| `... node .agent/verification/round-076-adversarial.mjs` | Pass: fresh independent layout-range, 44px, real-input/durable-state, onboarding/manual-handoff, draft/reload, offline, malformed recovery, expanded topology, and screenshot-deck checks; `findings: []`. |
| `node --check`, Prettier, ESLint on `round-076-adversarial.mjs` | Pass. |
| `./scripts/run`; loopback title probe; SIGINT; post-stop refusal probe | Pass: documented startup ready and process cleanup confirmed. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom-only scope; no Research/creator/fear/workforce/startup/laboratory/extra pipeline (§§2.4, 20.6–20.7, 29) | Candidate diff inspection; full canonical aggregate. | Pass |
| Reproducible setup, pinned browser, canonical check, documented startup/readiness/cleanup (`AGENTS.md`; §§23, 27) | Node-22 canonical host run; local-cache setup; `scripts/run` title and closed-port evidence. | Pass |
| Deterministic one-pipeline simulation: quote locking, accounting, demand/recovery, speed equivalence, persistence, migration, failure/replay (§§4–10, 19, 24; M2–M3.5) | Canonical unit/property, numeric, first-session, upgrade, progression, Career, evaluation, root/Pages PWA lanes; no candidate simulation delta. | Pass |
| Workstation Expansion I: single ordered 3→6 process topology; three empty/bypassed positions; no rail scroll trap (§8, §20.5; D-007/D-027/D-028) | Fresh 320/393 expansion state: eight slots; process 4–6 each `Empty / bypassed`; no overflow/trap; screenshot deck. | Pass |
| Shared five-tab command deck; visual coherence at starter/expanded 320×693 and 393×742 (§20.5) | Fresh original-resolution screenshots: `320x693` and `393x742` × starter/expanded × Build/Jobs/Career/Upgrades/Inspect, visually inspected. | Pass |
| V-077 repair: selected workload CSS reflow at raw and scaled portrait (§20.5–20.6) | Fresh range rectangles: raw/100%/200% + reduced-motion. At 320 200%, title ranges end at `1548.953125px`, price starts `1593.421875px`; at 393, title ends `1992.0625px`, price starts `2036.53125px`; zero intersections. Both title and price contain live full text, remain horizontally in viewport, and document overflow is false. Direct scaled screenshots inspected. | Pass |
| D-018 raw Jobs safety reserve | Initial Jobs app-scroll `0`; Queue 1 clearance `30.734375px` at 320×693 and `49.0625px` at 393×742; title clearance `156.8125px` / `181.515625px`. Both exceed 8px. | Pass |
| Portrait accessibility: 320/393, 100%/200% text, reduced motion, visible ≥44px controls, no horizontal overflow (§§20.4–20.6) | Fresh verifier probe checks all visible buttons at raw and scaled Jobs states; no undersized target, no overflow, reduced-media match true. Canonical suites retain five-tab 200%-text, focus, keyboard, and motion coverage. | Pass |
| Pointer and representative actual touch drag, visible endpoints, real state mutation (§§8, 20.5–20.7) | Fresh mouse and CDP `Input.dispatchTouchEvent`: source/destination centers confirmed above fixed nav; both swap Prepare=`Quantized Model` and Runtime=`Basic Cleaner` in DOM and durable save. Retained probe repeats each ten times. | Pass |
| Finite onboarding: queue/observe/earn rationale, bottom-nav-only routing, explicit manual Upgrades→Build handoff (§20.6; D-013/D-031) | Fresh guide assertion after Queue 1 names locked quote/configured cost/outcome. Buy rationale names current `$4.00`; explicit Place remains on Upgrades with no tray/slot mutation until manual Build navigation and compatible Snap. | Pass |
| Placement/pending cancellation semantics, item details, inventory grouping, comparison, expanded catalog density (§20.5–20.7; D-027/D-028) | Canonical phase-3 and retained first-session/command-deck suites; fresh manual placement shows only compatible Snap commits durable install; no candidate behavioral delta. | Pass |
| Career human-paced App-session input, tabs/ticks, reload boundary, rejection/durability/concurrency (§20.7; D-019–D-025) | Fresh 320/393 input `3.00`: persists as `3` across 1.2s tick, Pause, Jobs/Inspect/Career visits; reload restores `0`. Canonical Career and verifier regression suites cover atomic completed/rejected/save-failure/concurrent runs. | Pass |
| Malformed-state and recovery behavior (§§19, 20.6–20.7) | Fresh invalid JSON save recovers to usable Queue-one guide without page/console error; canonical migration/recovery suites pass. | Pass |
| Root/Pages PWA, offline/reload/update and scoped cache contract (§19; §§23–24; D-008) | Fresh controlled root offline reload retains save and service-worker controller; canonical root PWA update 16 cases and Pages 2/2 passed. | Pass |
| Security boundary / production dependency audit (D-026; §20.7 Phase 4) | Canonical `npm audit --omit=dev --audit-level=high`: zero vulnerabilities. | Pass |

## Findings

None. V-077 is resolved: the selected workload's live title and price now
occupy distinct rows under scaled portrait text, with independently measured
non-overlap at both required viewports.

## Unverified areas

- No remote push, hosted exact-verifier-SHA deployment, physical device,
  non-Chromium browser, or native screen-reader speech session. These are
  external release follow-up; required local reproducible browser/PWA coverage
  completed.

## Residual risks

- macOS workspace sandbox cannot launch Chromium due Mach-port policy; scoped
  host execution used the same repository-pinned Chromium and passed every
  required browser lane.
- Four full dependency-tree development advisories remain. Candidate made no
  dependency change; production-only audit remains clean.
