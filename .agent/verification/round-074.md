# Verification round 074 — first-session explanatory rail repair

Candidate SHA: `e2a5f135d3654f760fdce9df3717e6fa64dc5de0`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier write, captured `git rev-parse HEAD` as
  `e2a5f135d3654f760fdce9df3717e6fa64dc5de0`; exact match with the
  Orchestrator-supplied candidate. Initial `git status --short`: empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, and immutable verification evidence through round 073.
  Handoff, candidate-authored tests, comments, and earlier claims were used only
  as navigation hints.
- Candidate delta is narrowly scoped to the unresolved V-076 presentation
  boundary: `FirstSessionGuide` now renders the selector-owned explanatory body;
  accompanying CSS protects narrow wrapping; candidate test coverage adds the
  first-session flow. No engine, Worker protocol, persistence schema, balance,
  PWA, dependency, or deployment configuration changed.
- Verifier-authored artifact:
  `.agent/verification/round-074-adversarial.mjs`. It is an independent,
  repository-pinned Playwright probe only; no production source was changed.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`; repository-pinned Playwright
  `1.61.1`; ignored local Chromium cache `.cache/ms-playwright`.
- `./scripts/setup` completed with lockfile-pinned dependencies and local
  browser installation. Development installation reported four toolchain
  advisories; the canonical production audit passed.
- The direct workspace-sandbox browser launch failed only with macOS
  Mach-port rendezvous permission denial. Scoped host execution used the same
  project-pinned Chromium and completed every required browser lane; no browser
  verification was skipped.
- `./scripts/run` reached `http://127.0.0.1:4173/` with title
  `The Goldilocks Engine`; it was interrupted and the port then refused
  connections. The production preview on `5746` was likewise stopped and
  verified closed after probes.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate parent/diff; `git diff --check` | Pass: exact frozen SHA, initially clean tree, no whitespace error. |
| `./scripts/setup` | Pass: reproducible locked dependency and local pinned-browser setup. |
| Sandboxed `E2E_PORT=5744 ./scripts/verify` | Static, unit, balance, build, and audit stages passed; browser launch then hit the documented macOS sandbox Mach-port restriction. Infrastructure limitation, not candidate behavior. |
| Scoped-host `E2E_PORT=5745 ./scripts/verify` | Pass, exit 0: Prettier, ESLint, TypeScript; 45 unit/property files / 223 tests; numeric prototype; first-session 41/0; upgrades 20,001/0; progression 41/0; Career 101/0; evaluation 121/0; production build/audit; root Playwright 212/212; Pages Playwright 2/2. |
| `E2E_PORT=5746 ./scripts/run-e2e`; readiness curl | Pass: fresh production build/preview ready before independent browser work. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5746 OUTPUT_DIR=/tmp/goldlocks-r074-retained-r073 node .agent/verification/round-073-adversarial.mjs` | Pass: `{ "findings": [] }`; retained direct handoff, cancellation, touch, 320/393, 200%, expanded-deck, failure/recovery, PWA offline, console/page-error checks. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5746 OUTPUT_DIR=/tmp/goldlocks-r074-adversarial node .agent/verification/round-074-adversarial.mjs` | Pass: `{ "findings": [] }`; independent state-by-state explanation, reload, keyboard, alternative purchase, malformed/failure, and controlled-offline recovery checks. |
| `node --check`; Prettier write/check; ESLint for `round-074-adversarial.mjs` | Pass. |
| `./scripts/run`; root readiness curl; post-stop curl | Pass: deterministic dev startup and confirmed process cleanup. |
| Original-resolution screenshot inspection | Pass: fresh 320x693 and 393x742 starter/expanded five-tab decks, raw/scaled first-session states, explicit pending handoff, and failed recovery showed coherent rail/card layout with no visible clip, overlap, or horizontal spill. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Current authorized Bedroom scope; no deferred Research, creator, fear, workforce, startup, laboratory, second-pipeline, or narrative system (§§2.4, 20.6–20.7, 29; D-013/D-031) | Candidate diff/source inspection and complete compile, simulation, balance, and browser aggregate. | Pass. |
| Reproducible setup, canonical static/unit/balance/build/browser gate, pinned browser, startup readiness, and cleanup (§§23, 27; `AGENTS.md`) | Setup, scoped-host canonical gate, fresh preview, direct `scripts/run` readiness and closed-port checks. | Pass. |
| Deterministic one-pipeline simulation: queue-time quotes, configured cost/exact settlement, bounded demand/recovery, fixed speeds, migration, save/restart/offline and failure behavior (§§4–10, 19, 24; Milestones 2–3.5) | Canonical property/scenario/balance suites plus fresh production queue → settlement → reload and failed-settlement/offline probes. Candidate has no engine/protocol/schema delta. | Pass. |
| Workstation Expansion I: one ordered 3-to-6 rail, three empty/bypassed positions, no implied rig gain or second pipeline, usable portrait placement (§8, §20.5; D-007/D-012/D-027/D-028) | Canonical expansion/Phase-3 lanes; retained independent 320/393 starter and expanded visual deck and rail geometry checks. | Pass. |
| Shared command deck: exactly five bottom global tabs; starter/expanded Build, Jobs, Career, Upgrades, Inspect remain coherent (§20.5) | Canonical root browser suite; retained independent five-tab × starter/expanded screenshots at 320 and 393; tab-count assertion. | Pass. |
| First-session rail: three finite sequential objectives, current action and reason, concise transition rationale, no duplicate navigation CTA, and transparent failed-work recovery (§20.6) | New independent probe verifies queue-starter, observe-settlement, earn-remainder, and failed-starter bodies in the rendered live region at 320x693, 375x667, and 393x742; it asserts body containment, visibility, state/tab/title correspondence, zero guide navigation buttons, and no overflow. | Pass. |
| V-076 resolution: selector-owned explanatory copy must be user-visible, including locked quote/configured-cost/outcome and recovery context | Fresh screenshots and DOM checks find `data-testid=onboarding-explanation` inside the guide for starter (`Interactive Chat is the reliable first route`), observe (`locked quote, configured cost, and outcome`), earn (`Precision Cleaner costs $4.00`), and failure (`latest starter delivery failed`) states. The prior omission did not reproduce. | Pass. |
| D-031 state-derived manual handoff: no automatic navigation, economy, install, or persistence mutation; state survives reload; recommended priority and named viable alternative | Independent real-UI Precision Cleaner and Resilient Delivery purchases: keyboard `Place` stays on Upgrades with no tray/slot mutation; reload clears only transient selection; manual Build + compatible Snap completes each durable rail. Recommended card remains first; alternate purchase remains available and named. | Pass. |
| Details-versus-placement boundary, explicit Build tray, cancel/focus/tab clearing, keyboard/touch equivalence, and no pipeline mutation (§20.5–20.6; D-013–D-018/D-031) | Canonical and retained independent production flows cover Details, explicit Upgrades-to-Build handoff, cancellation, tab behavior, keyboard, and touch. New probe independently rechecks the purchase/handoff/reload boundary. | Pass. |
| Two forecastable viable pre-purchase routes; honest quote/cost/accounting; safe batching not universally dominant (§20.6; D-013/D-030) | Canonical first-session/progression/balance/currency lanes; fresh reliable starter and real paid alternative routes with exact $4.00 purchase disclosure. | Pass. |
| Portrait/accessibility: required 320x693 and 393x742, 200% text, 44px controls, keyboard/touch, reduced motion, no color-only state, no horizontal overflow or nested rail trap (§20.4–20.6) | Canonical 212 root cases; retained browser probe; new raw/scaled state probe verifies guide/card geometry, 44px visible buttons, body/document overflow, queue reachability, and no page/console errors. Extra 375x667 body/overflow exploration also passed. | Pass. |
| Career phase 1–2 human-paced draft, atomic Worker command batch, persistence/recovery and responsive accessibility (§20.7; D-019–D-025) | Canonical Career 101-scenario/browser lane covers ticks, tabs, 64x, save failure, ordering, malformed restore, touch, keyboard, and scale. Candidate does not touch these owners. | Pass. |
| Build/Upgrades density and Phase-4 cross-screen currency/detail behavior (§20.7; D-026–D-030) | Canonical Phase-3/4, currency, audit, and browser suites; retained fresh expanded visual deck. | Pass. |
| Root/Pages PWA, service-worker offline reload, update/cache isolation, and process cleanup (§19, §§23–24; D-008) | Canonical root and Pages PWA lanes passed; retained and new service-worker-controlled root offline reloads preserve state/recovery with no error; direct launch cleanup confirmed. | Pass. |
| Production dependency security boundary (D-026; §20.7 Phase 4) | Canonical production build/audit passed; candidate makes no dependency delta. | Pass. |

## Findings

No unresolved findings. Prior finding V-076 is resolved by actual rendered,
state-specific explanatory text; all independent probes completed without a
candidate defect.

## Unverified areas

- No remote push, hosted deployment, exact verifier-SHA Pages publish,
  cross-browser physical-device run, native screen-reader speech test, or
  optional expert playthrough. These are release-handoff/external-environment
  activities, not missing local candidate behavior.
- Required local coverage did include repository-pinned Chromium at the required
  portrait sizes, scale, keyboard/touch/reduced-motion behavior, persistence,
  malformed-state recovery, root/Pages PWA lanes, controlled offline reload,
  startup, and cleanup.

## Residual risks

- This macOS workspace sandbox cannot register Chromium's Mach port. Scoped host
  execution used the same pinned local browser and produced reproducible passing
  evidence; CI must retain a usable browser-launch environment.
- Development dependency installation still reports four advisories. The
  candidate's production audit is clean, and no runtime dependency changed.
