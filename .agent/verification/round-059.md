# Verification round 059 — request-keyed Career feedback lifecycle

Candidate SHA: `888e14d1ab34d2dc3c0b84cc7f3c3bd3d714d6b3`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `888e14d1ab34d2dc3c0b84cc7f3c3bd3d714d6b3`. It exactly matched the
  Orchestrator-supplied candidate; initial `git status --short` was empty.
- Independently read all of `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, and every immutable
  report through round 058. Built the checklist from §20.7 Phase 2,
  D-019–D-025, retained V-061–V-064, all applicable browser/PWA/accessibility
  regression requirements, and the canonical installation/verification
  contract. `.agent/HANDOFF.md`, candidate tests, comments, and claims were
  treated only as probe hints.
- Candidate production delta inspected: request-ID-keyed, in-session Career
  feedback transaction registry; App response-boundary consumption; candidate
  unit/hook/E2E coverage; D-025 decision record. No simulation command,
  persistence schema/key, ledger, route availability, balance, pipeline, page,
  framework, asset, or deferred-system change found.
- Verifier-authored artifacts: `src/ui/verifierRound059.test.ts` and
  `tests/e2e/verifier-round-059.spec.ts`. They add no production behavior.

## Environment and setup

- macOS Darwin 25.5.0 arm64; Node v26.5.0; npm 11.19.0; Git 2.50.1.
- Repository-pinned `@playwright/test` 1.61.1; Chromium in ignored
  `.cache/ms-playwright`; npm cache in ignored `.cache/npm`.
- `./scripts/setup` completed a clean locked install and repository-local
  browser setup. Its broad audit reported 13 high development-chain findings;
  production audit is separately evaluated in V-065.
- Workspace-sandbox Chromium exits before test bodies because macOS denies
  `MachPortRendezvousServer` registration. The exact pinned browser, loopback
  servers, and repository commands were rerun in scoped host context; no global
  browser/profile or in-app browser was used.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` | Exact candidate SHA and clean tree before verifier writes. |
| `./scripts/setup` | Pass; locked dependencies and pinned Chromium in ignored repository-local caches. |
| `E2E_PORT=4401 ./scripts/verify` in workspace sandbox | Format/lint/typecheck; 182/182 unit/property; all balances; build; production-audit stage completed. Every Playwright launch then failed before a body at the documented macOS Mach-port boundary. |
| `E2E_PORT=4402 ./scripts/verify` scoped host | Format/lint/typecheck; 182/182 unit/property; numeric, first-session (41), upgrade (20,001), progression (41), Career (101), evaluation (121) balance sweeps; production build; 186/186 root E2E; 2/2 Pages/offline E2E all passed. Command exit `1` solely because production audit found high dependencies: V-065. |
| `npm audit --omit=dev --audit-level=high --json`; `npm ls --omit=dev vite @vitejs/plugin-react postcss nanoid` | Fail: direct production `vite@8.1.4` / `@vitejs/plugin-react@6.0.3` resolves `postcss@8.5.19` and `nanoid@3.3.16`; audit identifies high `GHSA-2v37-7h3g-55p8` and the PostCSS chain. |
| `E2E_PORT=4403 npm run test:e2e -- tests/e2e/verifier-round-059.spec.ts --repeat-each=10 --reporter=dot` | Pass 20/20. Independent four-reply real-Worker Run/apply/save/zero-apply batch and failed-storage direct-offline recovery; no page/console errors. |
| `E2E_PORT=4404 npm run test:e2e -- tests/e2e/verifier-round-055.spec.ts tests/e2e/verifier-round-056.spec.ts tests/e2e/verifier-round-057.spec.ts tests/e2e/verifier-round-058.spec.ts --repeat-each=10 --reporter=dot` | Pass 60/60. Retained V-061, V-062, V-063, V-064 adversarial response-order/recovery regressions. |
| `E2E_PORT=4407 npm run test:e2e -- tests/e2e/career.spec.ts --grep 'human-paced App-session draft through Worker ticks, speed, pause, and tabs' --repeat-each=25 --reporter=dot` | Pass 50/50: both 320×693 and 393×742, numeric/keyboard, CDP touch token, real ticks, 1×/64×, paused Jobs, tab return, and no errors. |
| `E2E_PORT=4405 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --reporter=dot` | Pass 2/2; regenerated 20 original-resolution starter/expanded screenshots across Build, Jobs, Career, Upgrades, Inspect at 320×693 and 393×742. |
| `E2E_PORT=4406 npm run test:e2e -- tests/e2e/career-hierarchy.spec.ts --grep 'Career hierarchy records' --reporter=dot` | Pass. Regenerated/inspected 14 original-resolution Career empty, partial, full, rejected, completed, locked, exit-ready screenshots at both widths. |
| Visual inspection | All 34 images inspected. Coherent initial-color glyph/card grammar; primary controls visible/reachable; no observed horizontal clipping, nested composer/pipeline trap, fixed-nav occlusion, or color-only status reliance. Completed/rejected/locked/exit states readable. |
| `npm run typecheck`; `npx vitest run src/ui/verifierRound059.test.ts --coverage.enabled=false --reporter=dot` | Pass; verifier registry bounds/cleanup/malformed-key probes 2/2. |
| `npm run format:check`; `npm run lint`; `npm run typecheck`; `git diff --check` after verifier artifacts | Pass. |
| `./scripts/run`; `curl` root and `/sw.js`; Ctrl-C; post-stop curl | Ready at `127.0.0.1:4173` in 152 ms; root and service worker HTTP 200; post-stop root HTTP 000. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §20.7 foundation: preserve deterministic Worker, one pipeline, persistence/PWA, command-deck grammar; no new simulation system | Candidate diff/source audit; canonical unit/balance/build/E2E; retained PWA/Pages E2E. | Satisfied locally. |
| Phase 0/1; D-019/D-020: App-session four-route draft, atomic batch, exact-once durable Run acknowledgement, tick/speed/pause/tab/reload/malformed recovery | Canonical Career suites; 50/50 fresh human-paced run; V-051–V-054 retained browser checks. | Satisfied locally. |
| Phase 2 hierarchy: compact objective/resources then composer; stable route benefit/opportunity cost; estimates from authoritative accounting; one singular Run with total/unallocated/block reason | Canonical Career hierarchy/geometry E2E and fresh 320/393 lifecycle deck; source audit. | Satisfied locally. |
| Phase 2 localized completion: accurate hours, money/progress, electricity/operating, constraint, next decision | Canonical completed/rejected deck; independent direct offline durability recovery; retained V-061. | Satisfied locally. |
| D-022/D-023/D-024: exact response boundaries, batched ordered delivery, a non-completion invalidates only itself | Retained V-061/V-062/V-063 stress 60/60; fresh four-real-response probe. | Satisfied locally. |
| D-025: independent request-keyed transactions; exact-once claim, durable drain, non-completion isolation, bounded/orphan cleanup | Fresh pure 128-entry cleanup/malformed-key test; fresh 20/20 E2E; candidate source audit. | Satisfied locally. |
| Retained V-064: apply → policy-save → zero-hour apply in one React batch preserves earlier valid completion | Immutable round-058 stress passes 10/10; independent stronger four-response sequence passes 10/10. | Resolved. |
| Portrait/accessibility: 320/393, 100%/200% text, 44px targets, keyboard, touch, reduced motion, no horizontal/nested scroll trap, no errors | Canonical root E2E; fresh 50 human-paced runs; 34 inspected original-resolution screenshots. | Satisfied locally. |
| Reload/resume/offline/PWA/root/Pages, malformed state/failure/recovery, startup/process cleanup | Canonical 186 root + 2 Pages/offline E2E; direct storage-failure recovery; startup/curl/shutdown. | Satisfied locally. |
| Reproducible installation, canonical verification, production dependency-security boundary | Clean setup succeeds, but `./scripts/verify` necessarily fails the required production audit due high severity runtime dependency findings. | **Not satisfied — V-065.** |
| Phase 3/4 hosted exact-SHA aggregate/deploy/live playthrough | Not attempted: local canonical security gate fails. | Not accepted. |

## Findings

### V-065 — Canonical production dependency audit reports high-severity runtime dependencies

- Severity: High — release/security gate.
- Related plan requirement: §20.7 Phase 4 verification requires zero production dependency vulnerabilities; §20.7 sequencing requires the complete canonical gate to pass.
- Expected behavior: `npm audit --omit=dev --audit-level=high` exits zero with no high or critical production dependency vulnerability.
- Actual behavior: The command exits one and reports two high production-chain vulnerabilities. Direct runtime `vite@8.1.4` / `@vitejs/plugin-react@6.0.3` resolves `postcss@8.5.19`, which resolves vulnerable `nanoid@3.3.16`; audit reports `GHSA-2v37-7h3g-55p8` plus the PostCSS chain. This makes canonical `./scripts/verify` exit one after otherwise passing all tests.
- Exact reproduction procedure:

  ```sh
  npm ci --prefer-offline
  npm audit --omit=dev --audit-level=high --json
  npm ls --omit=dev vite @vitejs/plugin-react postcss nanoid
  ```

- Concrete evidence: audit metadata reports `{ high: 2, critical: 0 }`; resolved tree is `vite@8.1.4 -> postcss@8.5.19 -> nanoid@3.3.16`. Scoped-host `E2E_PORT=4402 ./scripts/verify` passes 182 unit/property, all balance/build, 186 root E2E, and 2 Pages E2E, but exits one only from this audit step.
- Blocks PASS: Yes. The plan explicitly makes zero production dependency vulnerabilities a Phase 4 requirement and the canonical command is required to pass.

## Unverified areas

- Hosted five-lane aggregate, push, exact-SHA Pages deployment, live `build-info.json`, remote branch convergence, and focused deployed expert playthrough not attempted after V-065 prevented a defensible local acceptance candidate.
- No physical mobile device, non-Chromium browser, native screen-reader speech, battery/thermal telemetry, or real storage quota exhaustion. These do not replace the required repository-pinned Chromium evidence, which ran successfully.

## Residual risks

- V-065 remains unresolved. Production `vite` is a normal build/tooling dependency but is declared under `dependencies`; either the dependency boundary or vulnerable transitive chain needs a deliberate, verified correction before acceptance.
- Functional Career request lifecycle is strong in this candidate: retained V-061–V-064 and independent four-boundary/durability/bounds probes passed. Future repair must preserve these immutable regressions.
- Workspace-sandbox Chromium still cannot launch due macOS Mach-port policy; scoped host pinned-browser commands remain reproducible acceptance evidence.
