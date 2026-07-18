# Candidate handoff — Bedroom Career Loop

## Implemented behavior summary

- Existing deterministic workstation, purchase, expansion, queue, demand, settlement, persistence, root/Pages PWA, and service-worker recovery behavior remains intact.
- Schema 6 / content `bedroom-career-1` adds a bounded Bedroom Developer loop to the same workstation. A player has one explicit four-hour evening, allocates quarter-hour blocks across freelance delivery, one competition, one local product, and product maintenance, then runs the evening. Empty time produces neither money nor progress.
- Route tradeoffs are concrete: freelance provides immediate configuration-sensitive income; competition builds a verified score and may earn one prize; product hours build then service one durable utility; maintenance reduces service debt. All routes use the current single pipeline and consume finite evening time.
- Career accounting exposes savings, electricity, operating costs, paid costs, and unpaid costs. Cash remains nonnegative; income pays prior career cost debt first.
- Three fictional durable local-model tiers (Lantern 3B, Harbor 7B, Kiln 13B) and Q4/Q8 selections alter the installed model stage’s quality, memory, throughput, reliability, and operating-cost tradeoffs. Tier criteria and the Bedroom Developer exit are explicit and durable.
- Safe offline automation is opt-in, freelance-only, quarter-hour bounded, and limited by player-selected electricity, operating-cost, and reliability caps. It defers to a pending player schedule, cannot create unpaid costs, and cannot buy, submit, release, or advance product/competition state. A persisted report names its applied work or safe stop reason.
- Current schema-5 saves migrate in place with initialized career state. Existing schema-3/4 migrations continue through schema 6. Malformed current career payloads restart safely under the existing integrity validator.
- Career schedule edits are one atomic Worker command batch followed by `RUN_EVENING`; React cannot run a stale partial schedule. State still persists before UI publication.

## Plan requirements covered

| Requirement                                                    | Candidate evidence                                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Personal schedule; finite evenings; no idle-only reward        | Engine command/invariant tests; `careerBalance` no-wait scenarios; 320/393 Playwright keyboard flow      |
| Savings and electricity with honest costs                      | Career route accounting tests and deterministic balance sweep                                            |
| Existing hardware/pipeline plus local-model workloads          | Existing purchase/expansion tests retained; tier/Q4/Q8 metric tests                                      |
| Freelance work, quantization, first competition, first product | Route, submission, release, prize, service-debt, and maintenance engine tests                            |
| Save/load and safe schema migration                            | Schema-5 migration unit test and browser reload/persistence test                                         |
| Basic offline policy and recovery                              | Engine cap/safety tests; browser failure/recovery and offline reload case                                |
| Portrait/accessibility constraints                             | Pinned Playwright at 320/393, keyboard, 200% text, reduced motion, 44px controls, no horizontal overflow |
| Determinism and viable non-dominant paths                      | 101-seed `careerBalance` sweep; route strategies exit without wait-money exploit                         |
| Existing PWA/root/Pages safety                                 | Existing pinned root and Pages suites remain part of canonical verification                              |

## Verifier findings resolved

- No unresolved verifier finding is intentionally carried forward. Immutable reports through round 029 remain untouched; their regression coverage stays in the repository.
- This candidate additionally prevents the career-schedule Worker race by batching all four allocations with the evening run, and prevents React synthetic-event clearing from losing an offline-policy checkbox update.

## Setup, startup, and verification commands

Prerequisites: Node matching `package.json` (`^20.19.0 || >=22.12.0`) and a network connection for the first locked dependency/browser install.

```sh
./scripts/setup
./scripts/run
# browse http://127.0.0.1:4173
```

`./scripts/setup` uses ignored repository-local caches only:

```text
npm cache:       .cache/npm
Chromium cache:  .cache/ms-playwright
Playwright data: playwright-report/, playwright-pages-report/, test-results/
```

On a Linux host needing browser libraries, run `PLAYWRIGHT_INSTALL_DEPS=1 ./scripts/setup`; this installs Chromium dependencies before the same repository-local browser install. The root and Pages Playwright configurations start deterministic loopback servers, wait for readiness, and clean them up.

Focused commands:

```sh
npm run typecheck
npm run lint
npm test
npm run balance
npm run build
npm run build:pages
npm run test:e2e -- tests/e2e/career.spec.ts
npm run test:e2e
npm run test:e2e:pages
```

Canonical full check:

```sh
./scripts/verify
```

`./scripts/verify` runs setup, formatting, lint, typecheck, unit/property tests with coverage, all balance sweeps, root build, root Playwright, and Pages Playwright. It returns nonzero if any phase fails while continuing to collect both browser-suite results.

## Important architectural decisions

- Simulation owns every career mutation; React only renders snapshots and submits typed commands through the Worker.
- `CareerState` is versioned state, validated before restore, sealed with the existing integrity digest, and migrated from schema 5 without changing the established localStorage address.
- The schedule has a deliberate 0.25-hour grid and a four-hour maximum. The UI holds a local draft so multiple input edits yield one atomic batch instead of four asynchronous Worker requests.
- Local tiers are data in `catalog.ts`, modify the existing model-stage metric calculation, and are intentionally fictional/durable. They introduce no second pipeline or automatic purchase.
- Career costs use configured operating cost plus physical hardware electricity at $0.24/kWh. Cost debt is explicit, settles before new cash, and does not permit negative money.
- Offline policy evaluates current freelance metrics and all player caps before route execution. A report records either completed bounded work or the precise safety reason; it cannot call economic or milestone commands.
- Auto-resume is one bounded `APPLY_OFFLINE_POLICY` command after a restored, durable, policy-enabled session receives Worker state. The elapsed wall clock is capped and all actual work remains engine-validated.
- Browser automation is pinned through `@playwright/test` and uses `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright`; no user-home cache, global package, pre-existing profile, or in-app Browser is required.

## Known limitations and risks

- Career values are deterministic gameplay tuning, not real salary, electricity, or marketplace forecasting.
- Offline execution is deliberately at most four hours and only processes freelance work; it is safety automation, not unattended progression.
- Physical mobile-device thermal/battery behavior, non-Chromium engines, audio/haptics, and actual assistive-technology output remain unverified infrastructure areas.
- localStorage denial leaves an in-memory session playable but cannot preserve reload state.
- The candidate does not add characters, attention systems, extra pipelines, transient model catalogues, narrative, labor, startup, or laboratory systems.
- Implementer does not push, deploy, or accept the candidate. Fresh exact-SHA independent verification and deployment remain Orchestrator/Verifier responsibilities.

## Checks executed before final candidate

- `npm run format:check && npm run lint && npm run typecheck` — PASS.
- `npm test` — PASS, 19 files / 94 tests; coverage: 86.70% statements, 83.68% branches, 94.08% functions, 89.86% lines.
- `npm run balance:career` — PASS, 101 seeds / zero failures. The canonical `npm run balance` also ran the retained numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, and this career sweep without a reported failure.
- `npm run build && npm run build:pages` — PASS.
- `npm run test:e2e -- tests/e2e/career.spec.ts` — PASS, 5/5: 320/393 keyboard schedule, schema-5 migration/reload, offline stop/recovery/offline reload, 200% text/reduced motion.
- `npm run test:e2e` — PASS, 94 root cases, including retained PWA/update coverage and the five Career cases.
- `npm run test:e2e:pages` — PASS, 2/2 Pages/offline cases. A first immediate attempt found only a stale root test-server port conflict before page creation; stopping that exact owned Vite PID and rerunning produced 2/2. Canonical verification subsequently left no Vite server and a final Playwright result of `{"status":"passed","failedTests":[]}`.
- `./scripts/verify` — PASS, exit 0. Fresh repository-local setup; format, lint, typecheck, 19 files / 94 unit/property tests, retained numeric prototype, 20,001-seed upgrade balance, 41-seed progression balance, 101-seed career balance, root build, 94 root Playwright cases, and 2 Pages/offline cases all completed.

## Checks not run

- No Git push, deployment, GitHub Actions execution, or live exact-candidate URL validation; intentionally Orchestrator-owned after candidate publication.
- No physical device, non-Chromium, battery/thermal, or platform screen-reader testing; required hardware/services unavailable.
- No manual play-duration or telemetry session; D-009 makes that optional feedback, not a release blocker.
