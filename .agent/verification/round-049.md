# Verification round 049 — first-session reload fixture

Candidate SHA: `6a9e70ba5a69f64578232eae13b17a77a3889860`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Before any verifier write, `git rev-parse HEAD` returned exactly
  `6a9e70ba5a69f64578232eae13b17a77a3889860`; `git status --short` was empty.
- Independently read `plan.md`, `AGENTS.md`, `.codex/agents/verifier.toml`,
  `.agent/DECISIONS.md`, all recent immutable verification reports, candidate
  diff, and the handoff (only as an untrusted hint). Applicable scope: retained
  single-pipeline simulation, first-session rail/integrity recovery, command
  deck, PWA/Pages, deterministic persistence/Worker boundary, reproducible
  setup/canonical verification, and the candidate test-fixture change.
- Candidate delta contains only `.agent/HANDOFF.md` and
  `tests/e2e/first-session.spec.ts` (73 insertions, 37 deletions). No product,
  worker, simulation, persistence, CSS, PWA, workflow, catalog, or build source
  changed. `git diff --check` passed.
- Deferred Research, hype/fear, creator, workforce, startup, laboratory,
  extra/parallel-pipeline, and later-expansion systems remain outside plan scope.

## Environment and setup

- Darwin `25.5.0` arm64; Node `v26.5.0`; npm `11.17.0`; Git `2.50.1`.
- Repository-pinned Playwright `1.61.1`; Chromium present below ignored
  `.cache/ms-playwright`.
- `./scripts/setup` passed. Sequential `INSTALL_PLAYWRIGHT=0 ./scripts/setup`
  passed; `INSTALL_PLAYWRIGHT=invalid ./scripts/setup` rejected the malformed
  value with exit `64` and `INSTALL_PLAYWRIGHT must be 0 or 1`.
- Sandboxed Chromium launch fails before test bodies on this macOS host with
  `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied
  (1100)`. The same pinned repository browser ran successfully with scoped host
  access; no global browser/profile was used.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before verifier writes | Exact supplied candidate; clean start. |
| `./scripts/setup`; `INSTALL_PLAYWRIGHT=0 ./scripts/setup`; invalid-value setup probe | Default and no-browser setup pass; malformed configuration rejects deterministically. |
| `E2E_PORT=4180 ./scripts/verify` (scoped host browser) | **Exit 1.** Format, lint, typecheck, **31 files / 154 unit-property tests**, all balance/progression sweeps, build, and production audit passed. Root Playwright: 156 passed, 1 failed (`verifier-round-041` forged-save case). Pages/offline then passed 2/2. |
| `E2E_PORT=4179 npm run test:e2e -- tests/e2e/first-session.spec.ts --grep 'first-session rail survives reload and placement requires an explicit handoff' --repeat-each=60 --reporter=dot` | Candidate’s changed test passed **60/60**. Its pre-reload money seed no longer showed the reported target flake. |
| `E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --grep 'damaged save cannot use a forged installed module to skip the first purchase' --repeat-each=20 --reporter=dot` | **3 failed, 17 passed**. Each failure expected first-session step 1 after recovery but rendered stale step 3. Reproduces V-056. |
| `E2E_PORT=4181 npm run test:e2e -- tests/e2e/verifier-round-049.spec.ts --reporter=dot` | Pass 3/3: one-shot pre-boot $4 seed at 320×693 and 393×742 survives a real reload, permits explicit purchase/placement, preserves an 8px Jobs-nav reserve, and records no page/console errors; a one-shot forged completion fail-closes to step 1 across reload. |
| `E2E_PORT=4178 npm run test:e2e -- tests/e2e/command-deck.spec.ts --grep 'command deck geometry and visual evidence' --reporter=dot` | Pass 2/2. Inspected 20 generated original-resolution Build/Jobs/Career/Upgrades/Inspect screenshots across starter/expanded and 320×693/393×742: visible controls, coherent deck, no observed clipping/overflow. |
| `npx vitest run --coverage.enabled=false src/test/verifyWorkflow.test.ts --reporter=verbose` | Pass 4/4. |
| Actual workflow shell guards parsed from `.github/workflows/verify.yml` | Exact candidate SHA/metadata probe passed; forged SHA and a forged Pages lane failure each exited nonzero (`identity_bad=1`, `aggregate_bad=1`). |
| `npm audit --omit=dev --audit-level=high`; `sh -n scripts/setup scripts/verify scripts/run scripts/run-e2e scripts/run-pages-e2e` | Production audit found 0 vulnerabilities; shell syntax checks passed. |
| `./scripts/run`; loopback HTTP readiness request; stop; post-stop request/process check | Ready on `127.0.0.1:4173` on attempt 2; after cleanup the loopback request failed and the tmux startup session was absent. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| §§2.4, 23–27; AGENTS repository testability: complete deterministic canonical gate | The full host canonical command reaches every stage but exits 1 at the retained browser integrity test. Focused 20-repeat run confirms nondeterministic failure. | **Fail — V-056** |
| §20.6; D-013–D-017: first-session rail, explicit paid purchase/placement, authoritative integrity recovery | Candidate target passes 60/60. Independent one-shot pre-boot test proves the real application carries a $4 state through reload at both required portraits, enables the paid purchase, opens placement, and rejects a forged complete state durably. The retained legacy fixture remains unreliable, so its required regression gate cannot be accepted. | **Fail — V-056** |
| §§4–10, 23–27; D-004/D-006/D-007: deterministic engine, Worker boundary, fixed-time queue/payout/demand/clear semantics and persistence | Canonical typecheck, 154 unit/property tests, numeric/first-session/20,001-seed upgrade/progression/Career/Evaluation balance sweeps, and all unrelated root browser cases completed before the single fixture failure. Candidate changes no runtime source. | Pass evidence |
| Milestones 2–3; D-010/D-011: Career, Evaluation/Replay, causal/postmortem, malformed-state and restart recovery | Canonical related unit, balance, and root-browser cases completed successfully; candidate contains no related source change. | Pass evidence |
| §§20.2–20.5; D-012/D-018: portrait command deck, accessible controls, 44px/reachability, text/reduced-motion and overflow behavior | Independent 320×693/393×742 screenshot/geometry probes pass; fresh screenshot inspection and canonical retained portrait/keyboard/touch/reduced-motion cases complete with no page/console errors. | Pass evidence |
| D-008: root/Pages PWA, update/scope isolation, install/offline/reload/save preservation | Canonical root PWA cases except V-056 complete; Pages/offline suite passes 2/2 after the root failure. | Pass evidence |
| Candidate/workflow delivery integrity: local install, exact-SHA lane checks, mandatory aggregate, production audit | Fresh setup paths, workflow contract tests, extracted success/failure/SHA probes, syntax checks, and zero-vulnerability production audit pass. | Pass evidence |
| Scope preservation and deferred systems | Candidate diff is test/handoff only; no product or deferred-system source changed. | Pass evidence |

## Findings

### V-056 — retained forged-save browser regression is nondeterministic and breaks the canonical gate

- **Severity:** High (verification integrity / release gate).
- **Related requirement:** plan §§2.4, 20.6, and 27; D-017; AGENTS repository
  testability and Browser/JavaScript testability requirements.
- **Expected behavior:** `./scripts/verify` must pass reproducibly, and the
  damaged-save regression must install its forged state before a live Worker can
  overwrite it, then verify that integrity recovery displays first-session step
  1 and withholds `Queue 10`.
- **Actual behavior:** `tests/e2e/verifier-round-041.spec.ts` mutates
  `localStorage` in a live page and immediately reloads. The old page's Worker
  sometimes persists the valid pre-forgery step-3 state after that mutation.
  The next page therefore boots the stale state rather than the intended forged
  state; the test receives step 3 and fails. The candidate fixes this race only
  in `first-session.spec.ts`, leaving the retained canonical case unchanged.
- **Exact reproduction:**

  ```sh
  E2E_PORT=4183 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts \
    --grep 'damaged save cannot use a forged installed module to skip the first purchase' \
    --repeat-each=20 --reporter=dot
  ```

- **Concrete evidence:** 3 of 20 focused repetitions failed at line 138 with
  expected `step 1 of 3` and rendered `step 3 of 3`; the full canonical run
  failed the same assertion once (156 root tests passed). Conversely, the
  verifier-owned one-shot pre-boot fixture passed 3/3 and demonstrates the
  actual fail-closed product recovery when the forged save is truly booted.
  This is not evidence that forged data is accepted by the product; it is a
  correctable false-red race in required acceptance evidence.
- **Blocks PASS:** Yes. A deterministic canonical verification command is an
  explicit plan/protocol requirement; a candidate with a reproducibly flaky
  canonical browser gate cannot be accepted.

## Unverified areas

- A live GitHub-hosted workflow run for this exact SHA was not launched or
  pushed. Local workflow parsing, contract tests, artifact/aggregate guard
  probes, and pinned-browser execution provide reproducible pre-host evidence.
- Physical iOS/Android devices, non-Chromium engines, native screen-reader
  speech, storage-quota interruption, and battery/thermal behavior remain
  unavailable. Required Chromium portrait, touch/keyboard, text-scale,
  reduced-motion, reload/resume, malformed-state, PWA, offline, and error paths
  were exercised where applicable.

## Residual risks

- V-056 is timing-sensitive but not hypothetical: 3/20 focused failures and
  the full canonical failure show the release gate is currently unreliable.
- Full `npm audit` continues to report five high development-only findings
  behind ESLint 9; the production audit used by the canonical gate is clean.
- Sandboxed macOS Chromium requires scoped host launch because of the
  documented Mach-port restriction. All browser evidence above used the
  repository-local pinned browser under that scoped launch.
