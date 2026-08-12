# Verification round 060 — production dependency boundary and Phase 2 regression

Candidate SHA: `074dd0ffc0fe7889680a3d6d94d059a7eb7fb7d1`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `074dd0ffc0fe7889680a3d6d94d059a7eb7fb7d1`. It exactly matched the
  Orchestrator-supplied candidate; initial `git status --short` was empty.
- Independently read all of `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, and immutable
  reports through round 059. Checklist: §20.7 foundation and Phase 2;
  D-019–D-026; retained V-061–V-065; applicable browser/PWA/accessibility,
  installation, startup, persistence, recovery, and production security
  boundaries. Handoff, implementation tests, comments, and claimed results
  were hints only.
- Candidate production delta independently inspected: only package manifest and
  lockfile classification changes plus decision/handoff text and an
  implementation-owned dependency test. Vite and its React plugin moved from
  runtime to development dependencies; lock entries and their tooling
  transitive closure received `dev: true`. No runtime source import, build
  version/integrity change, simulation, persistence, route, asset, page, or
  mechanical change found.
- Verifier authored no test/tool artifact this round. Existing immutable
  verifier probes were rerun; this report is the sole verifier-authored file.

## Environment and setup

- macOS Darwin 25.6.0 arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1; Chromium in ignored
  `.cache/ms-playwright`; npm cache in ignored `.cache/npm`.
- `./scripts/setup` completed the locked full development install and local
  browser setup. Scoped host execution was necessary for Chromium because the
  workspace sandbox denies macOS `MachPortRendezvousServer`; the same
  repository-pinned browser, loopback-only servers, and project commands were
  used. No global browser profile or in-app Browser supplied acceptance
  evidence.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact candidate and clean initial tree. |
| `npm_config_cache=.cache/npm npm ci --omit=dev --prefer-offline`; `npm ls --omit=dev --depth=0` | Clean production-only install passed: 3 packages, React 19.0.0 and React DOM 19.0.0 only; 0 vulnerabilities. |
| Lock/package/source audit: `node` inspection; `rg -n 'vite\|@vitejs/plugin-react' src --glob '!**/*.test.*'`; inspect `vite.config.ts`, workflow and scripts | Runtime lock set is exactly React, React DOM, Scheduler. Vite 8.1.4, plugin-react 6.0.3, PostCSS 8.5.19, Nanoid 3.3.16 each have `dev: true`; source has no runtime Vite/plugin import; config use is build-only. Pages/deploy workflows perform ordinary full `npm ci` before build. |
| `npm_config_cache=.cache/npm npm audit --omit=dev --audit-level=high --json`; `npm ls --omit=dev vite @vitejs/plugin-react postcss nanoid` | Pass: audit metadata high 0 / critical 0; negative tree query found none (nonzero query exit expected). Retained V-065 does not reproduce. |
| `npm_config_cache=.cache/npm npm audit --json` | Full development tree reports 1 moderate and 3 high (brace-expansion, js-yaml, nanoid), all development-only by lock audit; recorded residual risk, not production dependencies. |
| `E2E_PORT=4616 ./scripts/verify` | Exit 0: clean setup; format, lint, typecheck; 186/186 unit/property; numeric plus 41 first-session, 20,001 upgrade, 41 progression, 101 Career, 121 evaluation balance sweeps; production build; production audit 0 vulnerabilities; root Playwright 188/188; Pages/offline Playwright 2/2. |
| `E2E_PORT=4612 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts tests/e2e/verifier-round-057.spec.ts tests/e2e/verifier-round-058.spec.ts tests/e2e/verifier-round-059.spec.ts --repeat-each=10 --reporter=dot` | Pass 80/80. Independent retained V-061–V-064 response-order/recovery probes plus V-065-era direct offline durable recovery; no page or console error observed. |
| `E2E_PORT=4613 npm run test:e2e -- tests/e2e/career.spec.ts --grep 'human-paced App-session draft through Worker ticks, speed, pause, and tabs' --repeat-each=25 --reporter=dot` | Pass 50/50 at 320×693 and 393×742: numeric/keyboard editing, touch token, real Worker ticks, 1×/64×, pause, tab return, and draft continuity. |
| `E2E_PORT=4614 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --output=/private/tmp/goldlocks-round060-command-deck --reporter=dot` | Pass 2/2. Regenerated 20 original-resolution starter/expanded command-deck screenshots across Build, Jobs, Career, Upgrades, Inspect at both portrait widths. |
| `E2E_PORT=4615 npm run test:e2e -- tests/e2e/career-hierarchy.spec.ts --grep 'Career hierarchy records' --output=/private/tmp/goldlocks-round060-career --reporter=dot` | Pass. Regenerated and inspected 14 original-resolution Career screenshots: empty, partial, full, rejected, completed, locked, exit-ready at both 320 and 393 CSS pixels. |
| Visual inspection of the 34 regenerated images | Coherent palette/glyph/card grammar; visible primary action and resource summary; no observed horizontal clipping, composer/pipeline scroll trap, fixed-navigation occlusion, or color-only state indication. Full/rejected/completed/locked/exit states stay readable. |
| `npx vitest run src/simulation/verifierRound055.test.ts src/simulation/careerProjection.test.ts src/ui/careerFeedbackTransactions.test.ts src/ui/useSimulation.test.tsx src/ui/careerScheduleDraft.test.tsx src/test/dependencyBoundary.test.ts --coverage.enabled=false --reporter=dot` | Pass 26/26: projection/accounting, request-keyed transactions, draft boundary, persistence/recovery, and dependency-boundary probes. |
| `./scripts/run`; loopback root curl; Ctrl-C; post-stop curl | Ready on `127.0.0.1:4173` in 79 ms; root HTTP 200; listener gone after Ctrl-C. |
| `npm run preview -- --host 127.0.0.1 --port 4174 --strictPort`; root, `sw.js`, manifest curl; Ctrl-C | Built production preview ready; root HTTP 200, worker begins with a build ID, manifest served; listener gone after shutdown. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 foundation: deterministic Worker simulation, one pipeline, PWA/persistence, command-deck grammar; no accidental system or asset replacement | Candidate diff/source audit; canonical 186 unit/property, balance, build, 188 root and 2 Pages E2E. | Satisfied locally. |
| Phase 0/1; D-019/D-020: transient App-session four-route draft, atomic batch, exact-once durable Run, save/reload/tick/speed/pause/failure recovery | Canonical Career suite, 50/50 human-paced run, V-051–V-054 regression cases. | Satisfied locally. |
| Phase 2 hierarchy: objective/resources first; stable route benefit/opportunity cost; authoritative estimates; one emphasized Run plus total/unallocated/block reason | Canonical Career hierarchy/geometry cases; fresh visual deck and source audit. | Satisfied locally. |
| Phase 2 localized outcome: accurate hours, money/progress, electricity/operating, constraint, and next decision | Canonical completed/rejected cases; fresh completed/rejected screens; durable direct-offline recovery probe. | Satisfied locally. |
| Phase 2 retained summaries: collapsed lifetime, evaluation, reserves, local-model and offline configuration sections; details focus restoration | Canonical hierarchy/disclosure/command-deck E2E; fresh locked and expanded visual states. | Satisfied locally. |
| D-022/D-023/D-024: only matching response boundary may produce feedback; ordered batch delivery; non-completion only invalidates itself | V-061–V-063 stress repeated 10 times each; canonical Career concurrency/recovery cases. | Satisfied locally. |
| D-025 and retained V-064: request-keyed exact-once transaction registry, bounded cleanup, durable drain, later zero-response isolation | Focused 26-unit run; V-064/V-065-style four-boundary and direct-offline cases in 80/80 stress; canonical cases 183–188. | Satisfied locally. |
| Retained V-061: rejection never labels an unrelated safe offline completion | V-055 stress and canonical Career cases. | Resolved; does not reproduce. |
| Retained V-062: concurrent Run/offline Night 2 owns its own response identity | V-056 stress and canonical concurrent Career case. | Resolved; does not reproduce. |
| Retained V-063: later non-completion cannot erase a prior Run recap | V-057 stress and canonical zero-hour/recovery cases. | Resolved; does not reproduce. |
| Portrait, accessible interaction: 320/393, 100%/200% text, 44px targets, keyboard, touch/drag, reduced motion, focus, no errors | Canonical 188 root E2E; fresh 50 human-paced runs; command/deck and hierarchy visual inspection. | Satisfied locally. |
| Malformed state, reload/resume, offline, PWA update/recovery, root and Pages scope | Canonical root/Pages suites including malformed-save, offline reload, PWA atomic-update and foreign-cache cases. | Satisfied locally. |
| D-026 production dependency boundary: runtime-only dependencies, truthful lock classification, production security audit | Production-only clean install/tree/audit; source/config/deploy workflow audit; regular full install/build/preview/canonical verification. | Satisfied locally. |
| D-026 build/deployment completeness | Ordinary full `npm ci` path used by setup and Pages/deploy workflows supplies Vite/plugin; `npm run build`, root PWA preview, and `build:pages` E2E pass. Production-only install intentionally omits build tooling and is not the deployment build command. | Satisfied locally. |

## Findings

None. No correctable candidate defect found. Retained V-061 through V-065 were specifically exercised; V-065 is resolved by the tested development-only reclassification while ordinary full development/build deployment remains complete.

## Unverified areas

- No remote five-lane aggregate, push, exact-SHA Pages deployment, hosted
  `build-info.json`, or live expert playthrough: external deployment was not
  authorized for this local candidate verification.
- No physical mobile device, non-Chromium browser, native screen-reader speech,
  battery/thermal telemetry, or actual storage-quota exhaustion. These do not
  replace required repository-pinned Chromium evidence, which passed.

## Residual risks

- Full development dependency audit still reports 1 moderate and 3 high
  development-only advisories. The production-only tree and audit are clean;
  future tooling upgrades should revisit the development findings without
  reintroducing Vite into runtime dependencies.
- macOS workspace-sandbox Chromium cannot register its Mach port; scoped-host
  runs used the pinned project browser and loopback commands and all passed.
- Future dependency or UI work must preserve the immutable Career
  response-boundary, durable-acknowledgement, accessibility, and portrait
  regressions exercised here.
