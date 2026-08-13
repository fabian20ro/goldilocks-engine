# Verification round 075 — hosted portrait drag / Jobs reserve repair

Candidate SHA: `752c6d89eb4a78086a88b2df244f908ceeb45b2f`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier write: `git rev-parse HEAD` returned
  `752c6d89eb4a78086a88b2df244f908ceeb45b2f`, exactly the
  Orchestrator-supplied candidate. Initial `git status --short`: empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, and immutable reports through round 074. Handoff,
  candidate tests, comments, and claims were navigation hints only.
- Candidate delta: two test-fixture destination scrolls; a Jobs-only
  `workload-panel` hook and short/narrow spacing rule. No engine, Worker,
  schema, persistence, PWA, dependency, or balance change.
- Verifier artifact: `round-075-adversarial.mjs`. It is a project-pinned
  Playwright probe only; no production source changed.

## Environment and setup

- macOS arm64; Node `v22.23.2` through `npm exec --package=node@22`; npm
  `11.19.0`; project-pinned Playwright `1.61.1`; ignored Chromium cache
  `.cache/ms-playwright`.
- `./scripts/setup` in the canonical gate recreated lockfile-pinned local
  dependencies/browser. Development install reports four existing advisories;
  canonical `npm audit --omit=dev --audit-level=high` passed.
- Workspace-sandbox Chromium cannot create its macOS Mach-port rendezvous.
  Scoped host runs used the same repository-pinned Chromium; browser work was
  not skipped.
- `./scripts/run` served `The Goldilocks Engine` on `127.0.0.1:4173`; then
  stopped, with port refusal confirmed. Isolated production previews on 42076
  also stopped; only unrelated pre-existing Vite preview `:5304` remained.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate diff; `git diff --check` | Pass: frozen exact SHA, clean initial tree, no whitespace error. |
| `npm exec --package=node@22 -- sh ./scripts/verify` with `E2E_PORT=42075`, local npm/Playwright caches | Pass: format, lint, typecheck; 45 unit/property files / 223 tests; numeric and all first-session/upgrades/progression/Career/evaluation balance lanes; build; production audit; root and Pages Playwright reports passed. Managed server port closed afterward. |
| Exact changed browser cases: `game.spec.ts --grep 'supports pointer drag ...|supports touch drag ...' --repeat-each=10` | Pass: 20/20. Both real coordinate paths still require Runtime=`Basic Cleaner`, Prepare=`Quantized Model`, and anomaly feedback. |
| Fresh Node-22 `scripts/run-e2e` preview; `round-075-adversarial.mjs` | Initial broad probe passed: raw 320/393 Jobs reserve/targets/overflow; 10 pointer + 10 CDP-touch drags; Career draft tick/tab/reload boundary; malformed save; controlled offline PWA reload; no page/console error. |
| Fresh preview; retained `round-074-adversarial.mjs` | Pass: `{ "findings": [] }`; queue/observe/earn/failure reasons, manual purchase/placement, alternate route, transient reload, 320/375/393, 200%-overflow, recovery, offline PWA. |
| Fresh preview; retained `round-073-adversarial.mjs` | Pass: `{ "findings": [] }`; starter and expanded Build/Jobs/Career/Upgrades/Inspect capture/geometry matrix at 320x693 and 393x742, three empty expansion positions, handoff/failure/offline flows. |
| Original-resolution screenshot inspection | Starter/expanded five-tab × 320/393 deck visually coherent; raw Jobs 320/393 has full Queue 1 clearance. **Fail:** scaled Jobs workload title and price overlap; independently measured below. |
| Targeted `R075_MODE=jobs ... node round-075-adversarial.mjs` after settled 200% reflow | Fail as expected: both required viewports report title/price intersections while no horizontal overflow. This reproduces V-077. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `node --check`; Prettier and ESLint for verifier tool | Pass before final targeted verifier-tool extension; final `node --check`, Prettier, ESLint, and `git diff --check` pass before commit. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom-only scope; no deferred Research/creator/fear/workforce/startup/laboratory/second pipeline (§§2.4, 20.6–20.7, 29) | Candidate source/diff review; complete static, simulation, and browser aggregate. | Pass |
| Reproducible setup, canonical gate, pinned browser, startup/readiness/cleanup (§§23, 27; `AGENTS.md`) | Node-22 canonical gate, fresh previews, `/scripts/run` title/closed-port evidence. | Pass |
| One deterministic pipeline; quote locking, exact settlement, demand/recovery, fixed speed, migration/save/offline/failure (§§4–10, 19, 24; M2–M3.5) | Canonical unit/property/balance lanes; independent queue/settlement/failure/reload/offline flows. No candidate engine delta. | Pass |
| Workstation Expansion I: one ordered 3-to-6 rail and three empty/bypassed positions; usable portrait placement (§8, §20.5; D-007/D-027/D-028) | Canonical lanes plus retained expanded 320/393 deck and empty-slot captures. | Pass |
| Shared five-tab command deck, coherent starter and expanded views (§20.5) | Retained five-tab × starter/expanded × 320/393 visual capture and tab-count/geometry assertions. | Pass |
| Three-step first-session rail, state-specific visible rationale, bottom-nav-only routing, transparent recovery (§20.6; D-031) | Fresh queue/observe/earn/failure/reload/recovery probes; complete explanatory body and no duplicate guide navigation button. | Pass |
| Explicit Upgrades-to-Build placement, Details separation, cancel/tab/reload behavior, keyboard/touch equivalence (§20.5–20.6; D-013–D-018/D-031) | Canonical and retained fresh recommended/alternate purchase, keyboard handoff, manual Build Snap, cancellation, reload, pointer, and CDP-touch evidence. | Pass |
| Two viable forecastable pre-purchase choices; transparent accounting and non-dominant safe batching (§20.6; D-013/D-030) | Canonical balance/first-session lanes plus fresh reliable starter and valid paid-alternative flow. | Pass |
| D-018 raw Jobs reserve: initial app scroll=0; selected workload and Queue 1 at least 8px above fixed navigation at 320x693 and 393x742 | Fresh measurement: 320 selected=`156.8125px`, Queue=`56.734375px`; 393 selected=`181.515625px`, Queue=`75.0625px`; no horizontal overflow; visible buttons all >=44px. | Pass |
| Candidate test change preserves behavioral assertion rather than weakening it | Diff review: only `destination.scrollIntoViewIfNeeded()` added before bounding boxes. Original coordinate drag, both post-move module assertions, and anomaly assertion retained. Fresh 10x pointer + 10x touch independent real-input repetitions pass. | Pass |
| Portrait/accessibility: 320x693 + 393x742, 200% text, 44px controls, keyboard/touch, reduced motion, no horizontal overflow/rail trap (§§20.4–20.6) | All raw geometry/target/overflow/reduced-motion checks pass, but fresh visual inspection and range-rectangle checks prove a scaled selected-workload title/price collision at both required widths. | **Fail — V-077** |
| Career human-paced draft, atomic Worker command boundary, persistence/recovery (§20.7; D-019–D-025) | Canonical Career lane and independent 1.2s tick/tab/reload/offline probe. | Pass |
| Build/Upgrades density, compact currency/Inspect order, dependency security (§20.7; D-026–D-030) | Canonical phase/static/audit lanes and fresh expanded visual deck; no candidate delta. | Pass |
| Root/Pages PWA, service-worker offline/reload/update contract (§19, §§23–24; D-008) | Canonical root/Pages reports passed; independent controlled root offline reload and durable-state recovery passed. | Pass |

## Findings

### V-077 — 200% text overlaps the selected Jobs workload name and price

- Severity: P1.
- Related requirement: §20.5 required browser evidence and §20.6 acceptance
  require 200% text to keep the selected Queue 1 action readable/reachable at
  320x693 and 393x742; D-018 retains 200%-text evidence.
- Expected behavior: with root text scale at 200% and reduced motion, the
  selected workload name and its dollar amount remain distinct readable text;
  no visual collision, while retaining the existing no-overflow behavior.
- Actual behavior: the inline card layout leaves both text fragments in the
  same grid row. At 320, `Interactive Chat` range `x=137.984375..297.640625`,
  `y=1488.953125..1526.953125` intersects `$1.40` range
  `x=163.28125..270.015625`, `y=1494.984375..1532.984375` (and the wrapped
  second title fragment). At 393, title `x=142.78125..302.4375`,
  `y=1916.0625..1954.0625` intersects price `x=231.484375..338.21875`,
  `y=1922.09375..1960.09375`. Horizontal document overflow remains false;
  that weaker condition does not make overlapping copy readable.
- Reproduction:
  1. Start fresh production preview: `E2E_PORT=42076 ... sh ./scripts/run-e2e`.
  2. Run `R075_MODE=jobs PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:42076 npm exec --yes --package=node@22 -- node .agent/verification/round-075-adversarial.mjs`.
  3. The probe opens Jobs at each required viewport, queues the safe starter,
     waits for observe-settlement, enables reduced motion, applies 200% root
     text, waits for reflow, and detects text-range intersections.
- Concrete evidence: command exits 1 with
  `jobs-320x693-scaled-motion` and `jobs-393x742-scaled-motion`; full measured
  rectangles are emitted by the committed verifier script. Fresh original-size
  `earn-remainder-320-200.png` / `earn-remainder-393-200.png` inspection also
  visibly shows `Interactive Chat` over its price.
- Blocks acceptance: yes. Correctable presentation/accessibility defect; no
  production repair made by the Verifier.

## Unverified areas

- No remote push, hosted exact-verifier-SHA deploy, physical device,
  non-Chromium browser, or native screen-reader speech session. These external
  release activities do not obscure the local reproducible V-077 defect.
- Required local browser coverage was otherwise completed with project-pinned
  Chromium, required portrait widths, actual pointer/touch, persistence,
  malformed state, reduced motion, PWA/offline, startup, cleanup, and visual
  deck inspection.

## Residual risks

- The macOS workspace sandbox requires scoped host Chromium launch because of
  Mach-port rendezvous. Every browser verdict command used the same pinned
  browser/cache and is reproducible on a host browser-launch environment.
- Four development dependency advisories remain; production audit is clean and
  candidate has no dependency change.
