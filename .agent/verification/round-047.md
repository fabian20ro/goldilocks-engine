# Verification round 047 — capped queue stress synchronization

Candidate SHA: `d8eb68e660b4ff25ec341b36b4fcf8721ac6f909`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `d8eb68e660b4ff25ec341b36b4fcf8721ac6f909`; `git status --short` was empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, the candidate diff, the current handoff as an
  untrusted hint, and verification-history finding index. Applicable scope:
  retained Pipeline Toy/Workstation, Career, Evaluation/Replay, PWA,
  command deck, and first-session refinement through D-018. Research,
  creators, hype/fear, workforce, startup, laboratory, and later expansions
  remain deferred.
- Candidate delta: `.agent/HANDOFF.md` plus
  `tests/e2e/verifier-round-003.spec.ts`; no production, simulation, style,
  persistence, or queue-semantics source changed. The altered regression now
  pauses after starter settlement, waits for persisted Worker acknowledgement
  after each Queue 10 request, and checks the actual engine cap of 99 rather
  than an impossible 100-task label.
- Verifier-authored artifact:
  `tests/e2e/verifier-round-047.spec.ts`. It rapidly dispatches ten DOM click
  events without per-click acknowledgement, proves the 99-task cap, unique
  long-document tasks, paused reload persistence, absence of a phantom 100
  label, no horizontal overflow across Build/Jobs/Inspect, Resume availability,
  and no page/console error.

## Environment and setup

- Darwin `25.5.0` arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned Playwright `1.61.1`; setup uses ignored
  `.cache/npm` and `.cache/ms-playwright` caches.
- Sandboxed Chromium cannot create its macOS Mach-port rendezvous server before
  a page exists (`bootstrap_check_in ... Permission denied (1100)`). The same
  exact candidate passed through the repository-pinned browser with scoped host
  launch; this is infrastructure-specific, not a product assertion failure.
- Documented `./scripts/run` became ready on `127.0.0.1:4173` in 141 ms;
  loopback `curl` returned HTTP 200. After Ctrl-C, curl returned connection
  refused and host process inspection found no matching Vite process.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier writes | Exact supplied candidate; clean start. |
| `./scripts/verify` in sandbox | Static/setup/unit/balance/build stages passed; Chromium launch failed before browser test bodies because of the documented macOS Mach-port sandbox restriction. |
| `./scripts/verify` with scoped host browser access, before verifier test | Exit 0: setup, format, lint, typecheck, 31 Vitest files / 153 tests, all five deterministic balance sweeps, production build, root Playwright 154/154, Pages/offline 2/2. |
| `E2E_PORT=4175 npm run test:e2e -- tests/e2e/verifier-round-047.spec.ts --repeat-each=5 --reporter=line` | Pass 5/5: new rapid-dispatch/reload/resume adversarial probe. |
| `E2E_PORT=4175 npm run test:e2e -- tests/e2e/verifier-round-003.spec.ts tests/e2e/verifier-round-046.spec.ts tests/e2e/verifier-round-047.spec.ts --repeat-each=5 --reporter=line` | Pass 25/25: repaired canonical dynamic stress, retained independent cap probe, and new rapid-dispatch probe; target-size and reduced-motion assertions retained. |
| `E2E_PORT=4175 npm run test:e2e -- tests/e2e/verifier-round-042.spec.ts --reporter=line` | Pass 3/3; regenerated raw portrait screenshots and scaled Build/Jobs evidence. |
| Original-resolution screenshot inspection | Inspected all 20 screenshots: Build, Jobs, Career, Upgrades, Inspect × starter/expanded × 320×693/393×742; also inspected 320px/200%-text Build and Jobs. Coherent command-deck grammar; visible primary actions and navigation; no visual clipping, pipe/map regression, or nested rail trap. |
| `./scripts/run`; `curl -sS -D - -o /dev/null http://127.0.0.1:4173/`; Ctrl-C; post-stop curl/process check | Ready HTTP 200; process cleanup confirmed. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` after verifier test | All passed. |
| Final `./scripts/verify` with scoped host browser access | Exit 0 with verifier artifact included: format, lint, typecheck, 153 unit/property tests, numeric/first-session 41-seed, upgrade 20,001-seed, progression 41-seed, Career 101-seed, evaluation 121-seed sweeps, build, root Playwright **155/155**, Pages/offline **2/2**. |
| Static production-asset boundary scan for remote URL, image tag, font face, and Webdings use | No production remote/raster/icon-font dependency found; only the local SVG XML namespace matched. |

## Requirement matrix

| Applicable plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| Constrained pipeline tradeoffs; deterministic headless engine, Worker authority, numeric safety, versioned state/migration, fixed speed semantics (§§2–6, 23–27; D-004) | Final canonical static/unit/property suite and all deterministic balance sweeps pass; retained Worker/browser paths pass. | Pass |
| One ordered starter/Workstation pipeline; exact-once 3→6 expansion; empty positions; compatible touch/tap/keyboard placement; locked quotes, demand recovery, active-preserving clear (§§8–10; Milestones 1–2; D-006/D-007) | Canonical expansion, demand, locked-identity, clear, touch-drag, offline, and 320/393 browser cases pass; fresh starter/expanded screenshot inspection confirms single ordered rail. | Pass |
| Career routes, finite scheduling, bounded offline policy, model tier/quantization tradeoffs (Milestone 2; D-010) | Canonical Career 101-seed sweep and portrait/reload/offline/malformed browser cases pass. | Pass |
| Public/private evaluation distinction, causal failures, five reachable endings, postmortem, frozen/replay/meta behavior (Milestone 3; §§16–18; D-011) | Canonical 121-seed evaluation sweep, engine/migration properties, and replay/postmortem browser cases pass. | Pass |
| Three-step queue → settlement → meaningful buy/install rail; explicit Build-only placement; Details isolation; Cancel/Escape focus; viable early forks (§20.6; D-013/D-014) | Canonical first-session, placement, touch, keyboard, balance, settlement, and reduced-motion cases pass at required portraits. | Pass |
| Malformed/stale save recovery; clear-starter retry; integrity-authoritative and ledger-correlated recovery; reject forged guide/purchase/topology (D-015–D-017) | Final root browser suite passes retained V-039–V-041 recovery regressions including forged state, reload, focus, original seal, later work, and bounded ledger behavior. | Pass |
| Portrait-first shell: bottom-tab-only routing, raw 320×693/393×742 first actions above navigation, Jobs reserve, 44px targets, no color-only status, touch/keyboard, 200% text, reduced motion, no horizontal overflow/nested rail trap (§§20.2–20.6; D-012/D-018) | Canonical 155 root cases; fresh raw and scaled screenshot inspection; retained geometry, target-size, touch, keyboard, reduced-motion, and accessibility probes pass. | Pass |
| Shared initial-color emoji/Unicode command deck, live details, Build/Run presentation-only boundary, all five tabs and starter/expanded coherence (§20.5; D-012) | Fresh original-resolution 20-image inspection plus canonical command-deck/details tests pass. | Pass |
| Root and Pages PWA install/update identity, atomic failure recovery, scope/cache isolation, offline reload, durable saves (D-008) | Final canonical root PWA/update cases and Pages/offline 2/2 pass. | Pass |
| Queue-cap regression and reproducible browser acceptance (§20.4; §27; V-055) | Candidate regression passes in final canonical. Independent retained cap probe and new rapid no-ack dispatch/reload/resume probe pass; focused repeat suite 25/25. Actual cap matches `MAX_QUEUED_TASKS = 99`; no 100 label can appear. | Pass |
| Setup, startup, cleanup, hostile persisted content/security boundary (§§23–27; AGENTS browser testability) | Fresh setup/canonical pass, HTTP readiness and cleanup confirmed; canonical hostile-save/malformed-state and page/console-error coverage passes. | Pass |
| Deferred research, creators, hype/fear, workforce, startup, laboratory, extra pipelines, narrative, and remote/raster/icon-font additions | Candidate production delta is empty; static scan finds no prohibited asset mechanism. | N/A — scope preserved |

## Findings

None. V-055 is resolved: the canonical stress now tests the real 99-task
engine boundary without dropping its pause, persisted-state, overflow, and
error assertions. No correctable candidate defect remains.

## Unverified areas

- Exact-SHA deployment/public-host verification is outside this verifier role
  and occurs after acceptance; it remains a release workflow requirement under
  §2.4/D-009.
- Physical iOS/Android input, native screen-reader speech, battery/thermal
  budget, storage-quota interruption at one exact write, and non-Chromium
  engines were unavailable. Required pinned Chromium 320/393, touch/keyboard,
  text-scale, reduced-motion, reload/resume, malformed-state, offline, PWA,
  and page/console-error paths were exercised.

## Residual risks

- Offline local integrity is a corruption/tamper detector, not a
  server-authenticated anti-cheat boundary. This matches the authorized
  single-player scope and D-017 recovery model.
- At 320px/200% text, compact bottom-tab labels wrap tightly; inspected output
  retains complete visible labels, target-sized controls, no overlap, and no
  horizontal overflow.
- Sandboxed macOS Chromium needs scoped host launch permission due to the
  Mach-port restriction; repository-local pinned setup and host-mode browser
  commands remain reproducible.
