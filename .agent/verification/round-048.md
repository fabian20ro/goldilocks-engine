# Verification round 048 — parallel verification delivery lanes

Candidate SHA: `4785ad5e9883d38682d985b21c85bbe3a4c72e3d`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `4785ad5e9883d38682d985b21c85bbe3a4c72e3d`; `git status --short` was empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, candidate diff, handoff as untrusted hint, and prior
  verification index. Applicable scope: retained Pipeline Toy, Workstation,
  Career, Evaluation/Replay, PWA, command deck, first-session refinement,
  reproducible setup/canonical verification, and this delivery-pipeline change.
  Research, creators, hype/fear, workforce, startup, laboratory, extra/parallel
  pipelines, and other later-expansion systems remain deferred.
- Candidate delta: workflow/composite-action delivery tooling, setup/verify
  scripts, dev-only `typescript-eslint` lockfile graph, handoff, and a workflow
  contract unit test. `git diff --name-only <candidate>^ <candidate> -- src`
  returned only `src/test/verifyWorkflow.test.ts`; no application, simulation,
  browser test, CSS, PWA, persistence, catalog, or content file changed.
- Lockfile comparison found 37 changed package entries and zero non-dev entries.
  No production dependency or product-runtime behavior changed.

## Environment and setup

- Darwin `25.5.0` arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned Playwright `1.61.1`; Chromium installed below ignored
  `.cache/ms-playwright`.
- `npm_config_cache="$PWD/.cache/npm" npm config get cache` returned the
  repository-local cache. `find .cache/ms-playwright` found Chromium,
  headless-shell, ffmpeg, and link directories only under the repository.
- `INSTALL_PLAYWRIGHT=0 ./scripts/setup` passed from a locked fresh install.
  `INSTALL_PLAYWRIGHT=invalid ./scripts/setup` rejected the malformed value with
  exit `64` and `INSTALL_PLAYWRIGHT must be 0 or 1`. Default setup and pinned
  browser installation ran successfully through both canonical executions.
- Sandboxed Chromium launch fails before test bodies on this macOS environment:
  `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`.
  Scoped host execution of the same repository-pinned browser, not a global
  browser/profile, completed all required browser evidence.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier writes | Exact supplied candidate; clean start. |
| `./scripts/verify` in sandbox | Setup, format, lint, typecheck, 154 unit/property tests, all balance sweeps, build, and production audit passed. Root/Pages browser launch then failed only at the documented macOS Mach-port sandbox boundary. |
| `./scripts/verify` with scoped host browser access | Exit 0: format; lint; typecheck; **31 files / 154 tests**; numeric, first-session, 20,001-seed upgrade, progression, Career, and evaluation sweeps; build; production audit; **155/155 root Playwright**; **2/2 Pages/offline**. |
| `npx vitest run --coverage.enabled=false src/test/verifyWorkflow.test.ts --reporter=verbose` | Pass 4/4. |
| `E2E_PORT=4175 npm run test:e2e -- tests/e2e/verifier-round-047.spec.ts --repeat-each=5 --reporter=line` | Pass 5/5: independent rapid-dispatch, cap, reload/resume, overflow, and page/console-error probe. |
| `E2E_PORT=4176 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | Pass 6/6; regenerated 20 starter/expanded portrait screenshots plus 320/393 200%-text Career screenshots. |
| Original-resolution screenshot inspection | Inspected Build, Jobs, Career, Upgrades, Inspect × starter/expanded × 320×693/393×742, plus both 200%-text Career shots. Coherent command-deck grammar; visible selected Queue action; no observed clipping, horizontal overflow, decorative-pipe regression, or nested rail trap. |
| `./scripts/run`; loopback HTTP request; Ctrl-C; post-stop request/process check | Vite ready in 106 ms; `127.0.0.1:4173` returned HTTP 200; post-stop curl was connection-refused; no Vite process remained. |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.10 .github/workflows/verify.yml .github/workflows/deploy-pages.yml` | Pass. Ruby YAML parse also accepted both workflows and the local composite action. `actionlint` is workflow-only, so its expected workflow-schema rejection of the composite action was not treated as a product/workflow failure. |
| Aggregate shell guard with all-success inputs | Exit 0. |
| Aggregate shell guard with `PAGES_OFFLINE=failure` | Exit 1 as required. |
| Aggregate shell guard with a forged `GITHUB_SHA` | Exit 1 before lane-result acceptance. |
| `git ls-remote` official action refs; raw official action manifests | Verified official tags: checkout v6 `d23441a`, setup-node v6 `2499707`, upload-artifact v7 `043fb46`, configure-pages v6 `45bfe01`, upload-pages-artifact v5 `fc324d3`, deploy-pages v5 `cd2ce8f`. Checkout v6 documents event SHA/ref default; upload-artifact v7 declares `include-hidden-files`. |
| `sh -n scripts/setup`; `sh -n scripts/verify`; `git diff --check`; final `git status --short` | All passed; clean worktree before report creation. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §§2.4, 23–27; AGENTS repository testability: reproducible complete canonical gate | Host canonical exit 0 covers setup, static checks, unit/property, deterministic scenarios/balances, production build/audit, root E2E, and Pages/offline E2E. Current script command list maps exactly to the five hosted lanes. | Pass |
| Candidate: five parallel lanes retain canonical coverage | Static/unit/build/audit; balances; 320px/reduced-motion smoke; complete root/PWA; Pages/offline commands each present and independently prepared. Aggregate requires every exact named result to equal `success`; success and two failure probes exercised. | Pass |
| Candidate: frozen exact-SHA behavior | Every lane checks out event repository state then the composite records `git rev-parse HEAD`, requires equality to `GITHUB_SHA`, and writes lane metadata. Aggregate repeats exact-SHA guard. Official checkout v6 manifest confirms default event SHA/ref behavior; forged-SHA probe failed. | Pass |
| Candidate: lane evidence and aggregation artifacts | Every lane creates `metadata.txt` before work, sends logs/reports to a lane-specific `VERIFICATION_EVIDENCE_DIR`, uploads with `if: always()`, `if-no-files-found: error`, hidden-file inclusion, SHA-named artifact, and 14-day retention. Official upload-artifact v7 input schema validated. | Pass |
| Candidate: repository-local cache/install policy | Workflow declares workspace-local npm, Chromium, and XDG caches. Composite setup forwards `INSTALL_PLAYWRIGHT`; static/balance skip browser download, browser lanes request it. Local default, skip, invalid-value, and actual pinned Chromium behavior passed without a home cache. | Pass |
| Candidate: official Pages/action generations | Official upstream refs exist for checkout/setup-node v6, upload-artifact v7, configure-pages v6, upload-pages-artifact v5, and deploy-pages v5. Workflows parse under actionlint. | Pass |
| Candidate: production dependency security gate | `npm audit --omit=dev --audit-level=high` passed with zero vulnerabilities in canonical local verification and static lane contract. Lock delta is dev-only. | Pass |
| No behavior regression: deterministic engine, Worker command boundary, state migration, fixed time, queue/payout/demand/clear semantics (§§4–10, 23–27; D-004/D-006/D-007) | Canonical unit/property, numeric/upgrade/progression sweeps, 155 root browser cases, and independent 5-repeat rapid queue/reload probe pass. Candidate contains no production source change. | Pass |
| Career, Evaluation/Replay, causal/postmortem, frozen/replay/meta and malformed-state recovery (Milestones 2–3; D-010/D-011) | Canonical Career/Evaluation sweeps and retained browser cases pass, including offline, persistence, failure/recovery, ending/replay, and hostile-state paths. | Pass |
| First-session rail, explicit placement, viable early forks, integrity-authoritative recovery (§20.6; D-013–D-017) | Canonical first-session/placement/migration/integrity browser and unit cases pass. Candidate does not alter these sources. | Pass |
| Portrait command deck and accessibility (§§20.2–20.5; D-012/D-018) | 155 root browser cases plus fresh screenshot inspection at required 320×693/393×742 starter/expanded states; 200%-text, touch/keyboard, reduced-motion, 44px, navigation-reserve, overflow, and console-error cases pass. | Pass |
| Root/Pages PWA atomic update, scope isolation, install/offline/reload/save preservation (D-008) | Canonical root PWA/update cases and Pages/offline 2/2 pass, including malformed deployment data, stale worker identity, nested scope isolation, and offline recovery. | Pass |
| Scope preservation: no deferred systems or prohibited visual/asset mechanism | Candidate diff has no product/UI/runtime source changes; only workflow test under `src`. Retained source/browser checks pass. Deferred scope remains N/A. | Pass |

## Findings

None. No correctable candidate defect or unresolved verifier finding violates
the applicable plan or decision contracts.

## Unverified areas

- A live GitHub-hosted execution of this exact SHA was not launched: remote
  `agent/implementation` still points to `d4c408c`, and this Verifier did not
  push or otherwise mutate external repository state. YAML/actionlint, official
  upstream manifests/refs, exact-SHA/failure-path shell probes, and local
  canonical behavior provide reproducible pre-host evidence.
- Physical iOS/Android sessions, non-Chromium engines, native screen-reader
  speech, battery/thermal budgets, and storage-quota interruption remain
  unavailable. Required pinned Chromium portrait, keyboard/touch, text-scale,
  reduced-motion, reload/resume, malformed-state, offline, PWA, and error paths
  were exercised.

## Residual risks

- Full `npm audit` still reports five high development-only findings behind
  ESLint 9; the candidate's production audit is clean and deliberately avoids a
  forced major ESLint upgrade.
- GitHub-hosted runners may expose timing or action-platform differences not
  reproducible locally. The workflow's independent lane logs/artifacts and
  aggregate failure gate make such a failure visible; exact-SHA hosted/deploy
  validation remains the later release workflow responsibility.
- Sandboxed macOS Chromium requires scoped host launch because of the
  documented Mach-port restriction. The repository-local pinned browser and
  host-mode checks remain reproducible.
