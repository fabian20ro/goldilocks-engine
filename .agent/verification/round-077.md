# Verification round 077 — raw/scaled selected-workload container query

Candidate SHA: `459e96830f0fe2810294cb994a06ec0a63ecc8fc`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before verifier edits, `git rev-parse HEAD` returned
  `459e96830f0fe2810294cb994a06ec0a63ecc8fc`, exactly the
  Orchestrator-supplied SHA. Initial worktree: clean.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, all existing report verdicts, and especially round 075
  / V-077, round 076, and the hosted Verify artifact
  `/tmp/goldlocks-ci2.ne1bJ9`.
- Candidate delta reviewed: CSS-only selected-workload container query,
  expanded Jobs portrait acceptance test, and handoff. No simulation, Worker,
  schema, persistence, PWA, economics, dependency, or content-source change.
- Verifier-owned artifact: `round-077-adversarial.mjs`. It adds no production
  behavior; it independently measures post-settlement geometry and rationale,
  real input, reload, controlled offline reload, and malformed-save recovery.

## Environment and setup

- macOS arm64; canonical runtime `node@22` via locked local npm cache;
  project-pinned `@playwright/test@1.61.1`; ignored browser cache
  `.cache/ms-playwright`.
- Canonical setup recreated lockfile dependencies and pinned Chromium locally.
  Full dependency install reported four existing development advisories;
  production-only audit reported zero vulnerabilities.
- The scoped preview reached `http://127.0.0.1:42077/`; after testing its named
  `verifier077` tmux session was stopped. The interrupted temporary Linux
  container was confirmed absent with `docker ps`.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; initial `git status --short`; candidate diff; `git diff --check` | Exact frozen SHA; clean initial tree; no whitespace error. |
| `E2E_PORT=42077 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- sh ./scripts/verify` | Pass, exit 0: format, lint, typecheck; 45 unit/property files / 223 tests; numeric + first-session 41 + upgrade 20,001 + progression 41 + Career 101 + evaluation 121 balance seeds; build; production audit; root Playwright 214/214; Pages 2/2. |
| `... node node_modules/@playwright/test/cli.js test tests/e2e/jobs-portrait-margin.spec.ts --repeat-each=5 --reporter=line` | Pass: 20/20 focused Node-22 / pinned-Chromium repeats. Both raw reserve cases and both raw-compact/scaled-reflow cases ran five times. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:42077 OUTPUT_DIR=/tmp/goldlocks-r077-host npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- node .agent/verification/round-077-adversarial.mjs` | Pass, `findings: []`. Fresh post-settlement 320/393 raw/scaled geometry, default and Arial fallback metrics, first-session rationale, real pointer/CDP touch reorder plus reload, controlled offline PWA reload, and malformed-save recovery. |
| `node --check`; `prettier --check`; `eslint ... --max-warnings 0` for `round-077-adversarial.mjs` | Pass. |
| Original-resolution screenshots in `/tmp/goldlocks-r077-host` | Inspected 320/393 raw + 200%-reduced Jobs cards. Raw layout is compact; scaled card has visibly separate title/price rows, readable Queue 1, and no visual collision. |
| `rg` / report inspection of `/tmp/goldlocks-ci2.ne1bJ9/playwright-report/data/91ce...md` | Confirmed the historical Linux failure: Queue 1 bottom `622.015625` exceeded reserve threshold `611.21875`. This was caused by the prior raw-320 viewport query's two-row reflow, not by a hidden baseline pass. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Reproducible setup, canonical checks, pinned browser, deterministic startup/cleanup (`AGENTS.md`; §§23, 27) | Clean Node-22 canonical aggregate; temporary loopback readiness and explicit preview cleanup. | Pass |
| Deterministic single-pipeline game: locked quotes, settlement, demand/recovery, fixed speed, migration, failure/replay (§§4–10, 19, 24; M2–M3.5) | Canonical 223 unit/property cases and all deterministic balance lanes. Candidate has no relevant production delta. | Pass |
| One ordered 3→6 Workstation with empty expansion slots and portrait placement (§8, §20.5; D-007/D-027/D-028) | Canonical root browser suite includes expansion, placement, compact inventory, 320/393 and 200% states. | Pass |
| Five-tab command deck, bottom-navigation-only routing, item details, visual grammar (§20.4–20.5; D-012) | Canonical command-deck, focus, geometry and screenshot checks; fresh screenshots of changed Jobs surface. | Pass |
| D-018 raw Jobs safety reserve: selected workload and Queue 1 remain at least 8px above Primary navigation at 320×693 and 393×742 | Fresh post-settlement raw measurements: Queue 1 reserve `41.953125px` at 320 and `75.0625px` at 393; scroll top `0`; canonical raw initial/resume checks also pass. | Pass |
| V-077 repair: raw selected card remains compact three-track, while 200%-text reduced-motion reflows title/price without collision (§20.5–20.6) | Fresh default and Arial-fallback probe: raw cards `284.40625px` / `357.40625px` exceed 12em `192px`, grid has 3 tracks; 200% cards `250.8125px` / `323.8125px` are below 12em `384px`, grid has 2 tracks and areas `"glyph summary" ". price"`. All text ranges are complete, in viewport, and have zero intersections. Candidate suite repeated 20/20. | Pass |
| 44px controls, no horizontal overflow, scalable text, reduced-motion equivalence (§20.4–20.6) | Fresh raw/scaled probe reports no visible control below 44px and no document overflow at both sizes; reduced-motion media query true. Visual inspection corroborates readable scale state. | Pass |
| State-derived three-step onboarding; visible current rationale; explicit manual handoff, no automatic navigation (§20.6; D-013/D-031) | Fresh probe asserts queue reason (`Interactive Chat is the reliable first route`), observation reason (`locked quote, configured cost, and outcome`), and live purchase reason (`Precision Cleaner costs $4.00`). Canonical first-session/reload/hand-off cases pass. | Pass |
| Actual pointer and representative CDP touch drag with visible endpoints; durable reorder/reload (§8, §20.5–20.7) | Fresh pointer and CDP-touch coordinates both began/end above navigation, swapped Prepare=`Quantized Model` and Runtime=`Basic Cleaner` in DOM and local durable slots, then survived reload. Canonical direct-drag cases pass. | Pass |
| Human-paced Career ownership, exact-once outcome, persistence/concurrency/recovery (§20.7; D-019–D-025) | Canonical Career and retained verifier suites pass, including tick/tab, save failure, rejection, atomic batch, and response-order paths. No candidate delta. | Pass |
| Controlled offline/PWA/root-and-Pages behavior and malformed-state recovery (§19; §§23–24; D-008) | Fresh controlled offline reload retained service-worker control, save, and `observe-settlement`; fresh malformed save failed closed to queue-starter with actionable Queue 1 and no errors. Canonical root 214/214 includes PWA update/recovery; Pages 2/2 pass. | Pass |
| Security / production dependency boundary (D-026; §20.7 Phase 4) | Canonical `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. | Pass |
| Candidate tests are strengthened, not weakened | Diff retains both original initial-reserve assertions and adds post-settlement raw grid/clearance plus 200% grid/overlap/overflow assertions. No assertion/control was removed; fresh five-repeat focused suite passes. | Pass |
| Scope: no unapproved Research/creator/fear/workforce/startup/laboratory/second-pipeline work (§§2.4, 20.6–20.7, 29) | Exact diff inspection; CSS/test/handoff-only candidate delta. | Pass |

## Findings

None. V-077 does not reproduce. The previous Linux artifact records the real
raw-320 failure and the candidate's container condition now separates its raw
and scaled states by card inline size / root text scale rather than a viewport
match.

## Unverified areas

- No new hosted exact-candidate CI/deployment run, physical device,
  non-Chromium browser, or native screen-reader speech session.
- A temporary Playwright 1.61.1 Linux container was started for a focused
  follow-up but deliberately stopped before results when the Orchestrator
  directed no further tests. The concrete prior hosted Linux artifact was
  independently inspected; fresh candidate evidence is pinned-Chromium host
  evidence plus generic-sans fallback stress, not a completed new Linux run.

## Residual risks

- Platform font metrics always warrant hosted follow-up. The raw conditional
  rule is now based on intrinsic card width versus an em threshold, removing
  the prior raw-320 viewport-query trigger; raw fallback-font stress retained
  three tracks, no overlap, and ample 8px reserve.
- Four existing development dependency advisories remain. Production audit is
  clean; candidate has no dependency change.
