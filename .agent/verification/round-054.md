# Verification round 054 — Career persistence availability boundary

Candidate SHA: `a4d79e3fc276d3b0ef2931ed061c77b023d2405e`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write; exact supplied SHA:
  `a4d79e3fc276d3b0ef2931ed061c77b023d2405e`.
- Initial `git status --short`: empty.
- Independently read `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, immutable rounds
  001–053, candidate diff, production source, and canonical scripts. Handoff,
  comments, and candidate tests: leads only.
- Applicable candidate scope: §20.7 Phase 0/1 Career correctness, D-019, and
  D-020; retained pipeline, integrity/onboarding, command-deck, Career,
  Evaluation/Replay, PWA/Pages, and reproducible-verification contracts remain
  regression gates. Phase 2–4 visual refinement was not introduced by this
  narrow V-060 repair.
- Candidate delta inspected: the Career controller now receives durable-save
  availability, blocks both the visible Run control and its submission boundary
  during an outage, and retains the prior durable-acknowledgement semantics.
  No Worker command, schema, storage key, state framework, simulation rule, or
  deferred content changed.
- Verifier-owned artifact added:
  `tests/e2e/verifier-round-054.spec.ts`. It uses actual app/Worker/localStorage
  behavior and only a scoped `Storage.setItem` quota-failure fixture.

## Environment and setup

- Darwin 25.5.0 arm64; Node v26.5.0; npm 11.17.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1; repository-local Chromium at
  `.cache/ms-playwright`; npm cache at `.cache/npm`.
- `./scripts/setup` executed by each canonical run: locked `npm ci` plus pinned
  Chromium install using ignored repository-local caches.
- Sandboxed Chromium cannot launch on this host: macOS rejects Chromium's
  `MachPortRendezvousServer`. The same pinned Chromium, loopback server, and no
  global profile completed required browser checks under scoped host launch.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact candidate; clean start. |
| `E2E_PORT=4224 ./scripts/verify` in sandbox | Static/unit/balance/build/audit stages passed; all browser bodies were unavailable only because Chromium failed before launch at the documented Mach-port boundary. |
| `E2E_PORT=4224 ./scripts/verify` with scoped host Chromium, before verifier artifact | Pass: format, lint, typecheck, 172 unit/property tests, all five deterministic balance groups, production build/audit, 173/173 root E2E, 2/2 Pages/offline E2E. |
| `E2E_PORT=4231 npm run test:e2e -- tests/e2e/verifier-round-054.spec.ts --repeat-each=10 --reporter=dot` | Pass: 10/10 independent two-outage recovery sequences. |
| `E2E_PORT=4232 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep "command deck geometry and visual evidence" --reporter=dot` | Pass: 2/2; regenerated starter/expanded screenshots at 320×693 and 393×742. |
| Original-resolution visual inspection | Inspected all 20 images: five tabs × starter/expanded × 320/393. Coherent command-deck grammar; visible primary actions/navigation; no observed horizontal clipping, pipe/map regression, or nested rail trap. |
| `./scripts/run`; HTTP probes; controlled stop | Ready at `127.0.0.1:4173` in 120ms; `/` and `/sw.js` each returned 200; after Ctrl-C, `/` returned 000/connection refused. |
| `E2E_PORT=4233 ./scripts/verify` with scoped host Chromium, final | Pass: format, lint, typecheck, 172 unit/property tests, all numeric/first-session/20,001-seed upgrade/progression/Career/Evaluation balances, build, production audit (0 vulnerabilities), **174/174** root E2E, **2/2** Pages/offline E2E. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 observed defect; Phase 0 human-paced input/token regression | Final root browser suite passes both 320/393 human-paced tick, speed, pause, tab, keyboard, and touch paths; retained Worker/unit corpus passes. | Pass |
| §20.7 Phase 1 / D-019: App-session draft ownership, bounded quarter-hour routes, one atomic four-route batch, restored revision, rejection retention, reload/malformed recovery | Final 172-test unit/property corpus, Career browser suite, retained V-051/V-052 regressions, and 101-seed Career sweep pass. | Pass |
| D-019 exact-once Run | Retained rapid double-activation browser regression passes; final suite completes exactly one durable evening per Run. | Pass |
| D-020 / V-059: failed submitted result remains in-flight until a later persisted ordered publication | Retained V-052 passes in final suite. Independent probe additionally fails result writes, confirms durable count remains 0 and Run/status stay locked, then confirms one automatic durable recovery without reposting. | Pass |
| D-020 / V-060: pre-existing unrelated persistence outage visibly blocks Run and safely recovers | Retained V-053 plus new 10-repeat verifier probe: after an ordinary failed save, visible retry status appears, 4h draft survives, Run is disabled, recovery re-enables it, and one keyboard-activated evening persists. Controller/source inspection confirms the same guard rejects submission, not button-only gating. | Pass |
| §20.4–20.7 accessibility and user-visible Career behavior | Final root suite covers raw 320×693/393×742, 200% text, 44px controls, reduced motion, keyboard, CDP touch, focus, no overflow, and page/console-error paths. Screenshot inspection covers every tab/state. | Pass |
| §§8–10; Milestones 1–2; D-004/D-006/D-007: deterministic pipeline/economy, numeric safety, workload/quote/demand, capacity, offline/recovery | Final unit/property/balance/browser suite, including 20,001 upgrade seeds and retained queue/market/touch/drag/malformed-save tests. | Pass |
| §20.6; D-013–D-017: finite first-session rail, intentional placement, integrity-corruption recovery and focus | Final retained first-session, malformed-state, stale-save, cancellation, reload/offline, and portrait browser regressions pass. | Pass |
| Milestone 3 / D-011: public/private evaluation, causal ending/replay/meta persistence | Final 121-seed Evaluation balance, unit/property, postmortem/replay, malformed-state, and portrait browser paths pass. | Pass |
| §20.5; D-012/D-018: command deck, five tabs, 8px Jobs reserve, starter/expanded rail, details, portrait geometry | 174-root E2E final pass; focused screenshots 2/2 and all 20 originals inspected. | Pass |
| D-008 PWA: root/Pages scope isolation, atomic update/recovery, offline persistence | Final root PWA suite and 2/2 Pages/offline suite pass, including update, malformed/partial manifest, stale-worker, nested-scope, and offline cases. | Pass |
| §§23–27 / repository testability: deterministic Worker, installation, canonical checks, startup/cleanup, production dependency audit | Clean canonical setup, final static/unit/balance/build/audit suite, deterministic loopback startup/readiness, and controlled cleanup pass. | Pass |
| Security boundary / scope | Malformed command/save and hostile-text browser tests pass; source/diff inspection finds no new unsafe command path, persistence field, external asset, deferred Research/creator/fear/workforce/startup/laboratory/parallel-pipeline system, or production dependency. | Pass |

## Findings

None. V-060 does not reproduce. The candidate's adjustment to the retained
round-052 fixture establishes a persisted baseline before inducing a submitted
result failure; it adds durable-count assertions and does not weaken the
pre-existing-outage boundary, which the independent round-054 probe covers in
the same sequence.

## Unverified areas

- No push, GitHub-hosted aggregate, exact-SHA Pages deployment, or live-owner
  smoke was initiated; external publication is outside this verifier turn.
- Physical iOS/Android devices, non-Chromium engines, native screen-reader
  speech, battery/thermal behavior, and real quota exhaustion remain
  unavailable. Pinned Chromium exercised required portrait, touch/keyboard,
  text-scale, reduced-motion, persistence, reload/resume, malformed-state,
  offline, PWA, and console-error behavior.

## Residual risks

- Full `npm audit` still reports five high development-only ESLint-chain
  advisories. Required production audit (`--omit=dev --audit-level=high`) is
  clean.
- macOS sandbox Chromium needs the documented scoped host launch because of its
  Mach-port policy. Browser evidence used only repository-pinned Chromium and
  local caches.
- Local integrity checks are offline corruption detection, not a
  server-authenticated anti-cheat boundary.
