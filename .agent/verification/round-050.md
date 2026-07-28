# Verification round 050 — preboot stale-save fixture stabilization

Candidate SHA: `2f4dbac80f0468920ab53fe56d212bd4262a3cb1`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before verifier writes, `git rev-parse HEAD` returned exactly
  `2f4dbac80f0468920ab53fe56d212bd4262a3cb1`; `git status --short` was empty.
- Independently read `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, `.agent/DECISIONS.md`, the immutable report
  history through round 049, candidate diff, and handoff. Handoff and
  implementation-authored tests were treated as hints, not proof.
- Candidate delta: `.agent/HANDOFF.md`,
  `tests/e2e/verifier-round-041.spec.ts`, and
  `tests/e2e/command-deck.spec.ts`; no production, simulation, persistence,
  UI, CSS, PWA, catalog, workflow, or build implementation changed.
- Verifier-owned artifact: `tests/e2e/verifier-round-050.spec.ts`. It does not
  repair production behavior. It records the exact serialized state placed by
  the init script in `sessionStorage`, then proves real app boot/recovery and a
  subsequent reload. This prevents an untouched fresh context from falsely
  passing the forged-save assertion.
- Applicable scope: retained Pipeline Toy, Workstation Expansion I, Bedroom
  Career, Evaluation/Replay, PWA/Pages, command deck, first-session integrity
  recovery, and reproducible verification. Research, creators, hype/fear,
  workforce, startup, laboratory, extra/parallel pipeline, and later systems
  remain deferred and were not introduced.

## Environment and setup

- Darwin `25.5.0` arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned Playwright `1.61.1`; Chromium under ignored
  `.cache/ms-playwright`; npm cache under ignored `.cache/npm`.
- Default clean setup ran as part of each canonical command. Invalid
  `INSTALL_PLAYWRIGHT=invalid ./scripts/setup` exited `64` with
  `INSTALL_PLAYWRIGHT must be 0 or 1`.
- Sandboxed Chromium cannot create the macOS Mach-port rendezvous server before
  test bodies. The same repository-pinned browser completed under scoped host
  browser access; no global browser/profile was used.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before writes | Exact supplied candidate; clean start. |
| `E2E_PORT=4174 ./scripts/verify` in sandbox | Setup, format, lint, typecheck, 154 unit/property tests, all balances, build, and production audit passed; browser launch alone hit the documented macOS sandbox Mach-port restriction. |
| `E2E_PORT=4174 ./scripts/verify` with repository-pinned host Chromium, before verifier test | Exit `0`: 154 unit/property tests; numeric, first-session, 20,001-seed upgrade, progression, Career, and evaluation balances; build/audit; 158/158 root E2E; 2/2 Pages/offline. |
| `E2E_PORT=4175 npm run test:e2e -- tests/e2e/verifier-round-050.spec.ts --reporter=dot` | Pass 4/4. Independent one-shot expansion at 320/393; audited forged fail-closed reload; audited paid stale recovery/no duplicate deduction. |
| Candidate forged-save case, `--repeat-each=30` on port 4176 | Pass 30/30. Resolves V-056's historical unload/reload race. |
| Candidate legitimate stale-save case, `--repeat-each=20` on port 4177 | Pass 20/20. |
| Candidate command-deck geometry/expansion case, `--repeat-each=10` on port 4178 | Pass 20/20 across 320×693 and 393×742. |
| `npx vitest run --coverage.enabled=false src/test/verifyWorkflow.test.ts --reporter=verbose` | Pass 4/4. |
| Exact aggregate guard with all-success inputs | Exit `0`. |
| Same guard with `PAGES_OFFLINE=failure`; with forged `GITHUB_SHA` | Both exit `1`; lane failure and SHA mismatch cannot aggregate green. |
| `./scripts/run`; loopback HTTP request; Ctrl-C; post-stop request/process audit | Ready in 686 ms; `HTTP 200`; post-stop connection refused; no project Vite/Playwright/Chromium process remained. |
| Final `E2E_PORT=4174 ./scripts/verify` with verifier artifact | Exit `0`: format, lint, typecheck, 154 unit/property tests, all five balances, production build/audit, **162/162** root E2E, **2/2** Pages/offline E2E. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §§2.4, 23–27; reproducible setup, canonical verification, deterministic headless Worker boundary, numeric safety, state validity/migration | Final canonical static/unit/property/build/audit gate; malformed setup rejection; retained malformed command/save regressions; deterministic balance sweeps. | Pass |
| §§8–10; Milestones 1–2; D-006/D-007: one ordered compatible pipeline, exact-once 3→6 expansion, eight workloads, locked quote/identity, demand/recovery, clear-waiting, fixed time | Canonical pipeline, expansion, quote, demand, clear, touch/drag, offline, and 20,001-seed balance cases pass. New one-shot expansion probe performs real buy/activate/reload at 320 and 393 and retains eight stages. | Pass |
| D-010; Career schedule, finite hours, offline policy, persistence/failure recovery | Canonical 101-seed Career balance and retained portrait/keyboard/offline/malformed-state E2E pass. | Pass |
| Milestone 3; D-011: public/private evaluation, causal failures/postmortems, five endings, frozen/replay/meta migration | Canonical 121-seed evaluation balance plus retained unit/browser/replay/migration cases pass. | Pass |
| §20.6; D-013/D-014: finite queue → settlement → meaningful buy/install rail, explicit Build-only placement, viable routes, focus/cancellation | Canonical first-session/balance/browser coverage passes; retained touch/keyboard/reduced-motion routes pass at required portraits. | Pass |
| D-015–D-017: corruption-safe first-session repair, forged-state rejection, original-integrity authority, retained-ledger correlation, later-work recovery | Candidate forged case passes 30/30; legitimate paid case passes 20/20. New audited fresh-context probe proves the forged raw record actually reached app boot, resets to step 1/no Queue 10, stays fail-closed after reload; authentic paid/install state keeps money, ownership, slot, and exactly one purchase ledger event after stale repair and reload. | Pass |
| §20.5; D-012/D-018: compact command deck, all five tabs, starter/expanded rail, raw portrait actions, 44px/overflow/text/motion/touch/keyboard accessibility | Final root E2E includes raw 320×693/393×742 geometry, 200% text, touch, keyboard, reduced motion, error checks. Generated original-resolution screenshots were inspected for Build, Jobs, Career, Upgrades, Inspect × starter/expanded × 320/393: coherent shared terminal palette/glyph grammar, visible primary actions/nav, no observed clipping, decorative pipes, or nested-rail trap. | Pass |
| D-008: root/Pages install/update identity, atomic candidate failure recovery, scoped caches, save preservation, offline reload | Final root PWA suite plus Pages/offline 2/2 pass, including A→B update, malformed/partial manifest rejection, stale worker repair, nested Pages isolation, and offline persistence. | Pass |
| Candidate V-056 repair: deterministic test fixture, no sleep/retry/assertion weakening, one-shot restore semantics | Diff inspection: fresh isolated preboot context for stale saves; source Worker cannot access it; same-context expansion closes source page first. No production code changed. Repeated candidate and independent probes above pass. New expansion test proves a real purchase changes state before reload, so an accidental second fixture application would fail. | Pass |
| Workflow delivery integrity: frozen SHA, five required lanes, evidence/cache policy, aggregate failure behavior | Workflow contract test 4/4; direct aggregate success/failure/SHA probes; source inspection confirms lane-local metadata, repo-local npm/Chromium/XDG caches, official action generations, and aggregate checks every lane. | Pass |
| Deferred scope / prohibited additions | Candidate diff is test/handoff only; no deferred system or production asset mechanism added. | N/A — scope preserved |

## Findings

None. V-056 is resolved. No correctable implementation or verification defect
remains for this candidate.

## Unverified areas

- No newly pushed GitHub-hosted workflow or exact-SHA deployment was launched
  by this verifier; external publication is outside this role. Local workflow
  contract and failure-aggregation behavior were independently exercised.
- Physical iOS/Android behavior, native screen-reader speech, non-Chromium
  engines, battery/thermal budgets, and a storage-quota interruption at the
  exact persistence write remain unavailable. Pinned Chromium covered required
  portrait, text-scale, touch/keyboard, reduced-motion, reload/resume,
  malformed-state, PWA, Pages, offline, and page/console-error paths.

## Residual risks

- The local integrity seal is deliberate offline corruption detection, not
  server-authenticated anti-cheat protection. D-017 defines retained ledger
  evidence as the stale-repair boundary.
- Full npm audit still reports five high development-only findings behind
  ESLint 9; the canonical production audit is clean.
- macOS sandbox Chromium needs scoped host launch because of the Mach-port
  limitation; repository-local pinned setup and host-mode browser commands are
  reproducible.
