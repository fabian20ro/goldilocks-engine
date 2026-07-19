# Verification round 034

Candidate SHA: `5f79b6b396ae1eb4eed5c0ad459061ff5b31aabf`

VERDICT: PASS

## Environment and setup

- Repository: `/Users/fabian/git/goldlocks-engine`; candidate `HEAD` captured
  before verifier edits and matched the supplied SHA exactly.
- macOS 26.5.2, arm64; Node v26.5.0; npm 11.17.0; repository-pinned
  Playwright 1.61.1; Git 2.50.1.
- Clean setup exercised by `./scripts/verify`: repository-local npm and
  Playwright caches; `npm ci --prefer-offline`; pinned Chromium install.
- Browser servers: deterministic loopback `127.0.0.1:4173`; root and Pages
  suites both started their configured build/preview servers. No listener
  remained after the final suite.

## Commands executed and results

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` before edits | `5f79b6b396ae1eb4eed5c0ad459061ff5b31aabf`; exact supplied candidate. |
| `npx vitest run --coverage.enabled=false src/simulation/verifierRound034.test.ts` | 1 file, 5 independent adversarial tests passed. |
| `npm run typecheck` | Passed. |
| `npm run test:e2e -- tests/e2e/verifier-round-034.spec.ts --reporter=line` | 2/2 passed; 320px and 393px causal-save probes. |
| `npm run test:e2e -- --reporter=line` | 106/106 root acceptance tests passed. |
| `npm run test:e2e:pages -- --reporter=line` | 2/2 Pages-scope/offline/cache-isolation tests passed. |
| `./scripts/verify` | Exit 0: setup, format, lint, typecheck, 24 unit/property files / 122 tests, all balance sweeps, root E2E 106/106, Pages E2E 2/2. |
| `gh run view 29671059467 --repo fabian20ro/goldlocks-engine ...` | Exact candidate Verify workflow successful; canonical job `88149972139`, 2026-07-19 03:00:17–03:09:51Z. |
| `gh run view 29671059450 --repo fabian20ro/goldlocks-engine ...` | Exact candidate Pages build and deploy successful; jobs `88149972293` and `88150007189`. |
| Candidate-only `git archive` + `npm run build:pages`; SHA-256 comparison against public Pages files | Exact public artifact parity: build identity `3d8a54c2628e55e0a1f9`; `build-info.json`, manifest, worker, JS, CSS, and worker bundle all byte-identical. |
| `lsof -nP -iTCP:4173 -sTCP:LISTEN` after suites | No listener; test processes cleaned up. |

An initial local canonical attempt was intentionally excluded: while it was in
the root browser phase, this verifier independently ran a Pages build and
overwrote shared ignored `dist`, making root `/` serve Pages-base assets. The
resulting failures were verifier-induced infrastructure contamination, not
candidate evidence. I confirmed the owned process groups, terminated only
those groups, confirmed port release, then completed the clean runs above.

## Requirement matrix

| Applicable requirement | Evidence |
| --- | --- |
| D-011 public versus private evaluation; visible public proxy; private evidence paid, categorical only, retryable; no persisted latent score | Independent unit probe verifies unfunded `$0.750` request leaves money/evaluation unchanged with warning; funded retries charge exactly `$0.750`, advance bounded coverage, and persist only the categorical assessment. Source/state inspection plus probe asserts no `actualCapability` or `privateScore`. Canonical E2E `evaluation-replay.spec.ts` proves user-visible public/private distinction, payment failure/recovery, and reload. |
| D-011 leakage, shift/reliability, hardware-debt/unpaid-cost, and tutorial-loop causal consequences | Engine inspection traced warning, ignored-warning, incident, commitment, model-switch, ending, and append-only-ledger paths. Canonical deterministic tests, balance sweep, and root E2E cover the causal paths. Independent forged-state probes confirmed unsupported causal counters cannot manufacture a run ending. |
| D-011 five deterministic command-reachable endings; accumulated pattern + irreversible history + ignored/escalating warning evidence; no opaque random ending | Independent test runs Public Leaderboard Hero, Product Reliability Collapse, Hardware Debt Spiral, Tutorial Loop, and Honest Independent Builder; each has a retained causal postmortem after five restores. Canonical evaluation balance: 121 seeds, zero failures; root tests cover the keyboard/touch-visible Tutorial path and accessible postmortem. |
| D-011 endings frozen; same-seed/next-seed replay; meta history/unlock information-only; fresh economy/pipeline | Independent test verifies a closed ending rejects a subsequent public evaluation, both reset modes clear run evaluation/ending, retain completed-ending/diagnostic history, and add no evaluation advantage. Canonical `evaluation-replay.spec.ts` verifies worker-batch freeze, restart, reload, and information-only meta behavior. |
| D-011 schema-6 / `bedroom-career-1` to schema-7 / `evaluation-replay-1` migration; malformed/dangling current state safe | Independent test migrates a schema-6 career save and checks preserved career schedule plus initialized evaluation/meta. It injects malformed current snapshot data and verifies safe fallback. Canonical unit/browser migration and malformed-state cases pass. |
| D-011 bounded ledger retains frozen-ending postmortem evidence; current save causal integrity across retention | Independent tests create histories at event sequence 79, 80, 81, and 82; valid restores remain valid, while a stale forged evaluation plus internally coherent checkpoint but original stale seal resets causal evaluation and cannot create a postmortem. Saturated original-seal history preserves evidence; valid pre-checkpoint schema-7 history migrates with `schema-v7-causal-snapshot-added`. This directly covers candidate change and V-041 regression class. |
| Plan §16/§17 causal postmortem categories and uncertainty | All five independent ending restores retain an event with causal evidence. Candidate inspection confirms direct causes, contributing factors, correlations, hypotheses, and unknowns; canonical UI test exposes the postmortem and verifies accessible reload/replay behavior. |
| Plan §18 / D-011 replay variation and no flat meta bonus | Independent same-/next-seed reset checks plus canonical 121-seed balance/property checks; meta records only named diagnostic/completed-ending IDs and replay count. |
| Plan §24 determinism, bounded append-only ledger, versioned integrity/migration | Canonical deterministic/property tests and 121-seed sweep pass. Independent boundary probe covers precise rollover, snapshot coherency, original seal, legacy migration, malformed state, and repeated restore/restart behavior. |
| D-011 browser UX: 320/393 portrait, keyboard/touch, 200% text, reduced motion, no overflow, errors | Root canonical suite 106/106 includes portrait, touch drag, keyboard, control-size, reduced-motion, text-scale, screen-reader/accessibility, postmortem and replay cases. Independent 320px/393px probes emulate reduced motion and 200% root font, assert no page/console errors and no horizontal overflow. Captured renders were visually inspected. |
| D-011 persistence, reload/resume, offline, failure/recovery | Canonical root and Pages suites cover save reload, offline reload, malformed save recovery, versioned worker update failure/recovery, and cache isolation. Independent browser probes inject localStorage save data before app startup and inspect persisted recovery/migration result. |
| D-008 retained PWA/update safety applicable to D-011 | Canonical root suite proves root/Pages A→B atomic updates, stale worker URL repair, malformed/omitted/duplicate/out-of-scope metadata rejection, partial shell rollback, and root/Pages scope isolation. Pages suite proves worker-backed offline operation and foreign-cache preservation. |
| D-009 exact-SHA automated release evidence and deployed identity | Exact GitHub Verify and Pages workflows succeeded for this SHA. A clean candidate-only Pages build produced public version `3d8a54c2628e55e0a1f9`; SHA-256 matched every fetched public shell artifact at `https://fabian20ro.github.io/goldlocks-engine/`. |
| D-011 scope boundary | Production diff limited to causal snapshot/integrity/restore behavior and tests/types; inspection found no new pipelines, transient model catalog, researchers, characters, attention/hype/fear, startup/labor/laboratory, or narrative system. |

## Independent adversarial artifacts

- `src/simulation/verifierRound034.test.ts`
  - 79/80/81/82 retention boundaries; stale coherent checkpoint forgery;
    valid saturated original-seal history; legacy snapshot upgrade.
  - All five endings under repeated restore, frozen-run behavior, same- and
    next-seed resets, retained postmortems, and information-only meta.
  - Schema-6 migration; malformed current checkpoint fallback; private-payment
    failure/recovery and categorical-only evidence.
- `tests/e2e/verifier-round-034.spec.ts`
  - 320px, reduced motion, 200% text: forged event-81 local save recovers
    causally, remains operable, shows no postmortem, no page/console errors,
    and no horizontal overflow.
  - 393px, reduced motion, 200% text: valid saturated original-seal legacy
    save migrates its checkpoint without discarding supported evidence;
    no errors/overflow.

## Findings

None. No correctable candidate defect found.

## Unverified areas

No material in-scope behavior remains unverified. Physical-device battery/CPU
characteristics and future out-of-scope expansion systems are not assertions
of this candidate or D-011 acceptance.

## Residual risks

- Save integrity is a deterministic local corruption check, not an
  authenticated server-side anti-tamper boundary; that is consistent with this
  offline single-player architecture. Causal state now requires a coherent,
  integrity-sealed checkpoint once ledger retention saturates.
- Real-world browser/network/cache implementations outside pinned Chromium and
  the deployed Pages host can differ; root/Pages offline and update failure
  paths have reproducible pinned-browser coverage.
