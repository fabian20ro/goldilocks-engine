# Candidate handoff — Round 114 M7D closed-world recovery repair

Implementation base: `69ccc3359109f0d7071e84edc9bbc1c927a853c6` (immutable
Round-113 Verifier commit). Candidate SHA is recorded after the final commit;
this handoff makes no independent-verifier verdict or commercial-release
acceptance claim.

## Implemented behavior summary

- Replaced unsealed progression copying with a closed-world reconstruction from
  the seed-specific baseline. Ownership survives only exact audited purchase
  evidence; expansion capacity requires both purchase and exact activation
  evidence; slots, workload selection/demand, branch controls, and mutable
  metrics rebuild canonically.
- Ending identity and meta unlocks survive stale recovery only when the exact
  engine ending message, event kind/tick, and recomputed causal payload match
  the recorded ending. Mismatches reset both ending and meta additions.
- Research, Hype/Fear, Laboratory, Career route progression, and evaluation
  projections reset to safe defaults unless their bounded engine evidence is
  retained. Exact settlement counters, task identity, and accounting retain
  only structurally corroborated records; stale settlement links lose optional
  ledger provenance.
- Queue transactions now carry optional engine-authored task ID, workload ID,
  and locked-quote payloads. Unsealed task/quote projections survive only when
  every task matches that typed queue record; shape-valid quote/workload edits
  recover to the empty safe queue without inventing payout or task effects.
- Module placement/removal transitions now carry typed engine provenance. Stale
  recovery replays only valid placement records over the canonical starter or
  corroborated expanded topology, preserving a legitimate paid install while
  rejecting untrusted slot-array substitutions. Bounded core runtime controls
  and the paused lifecycle flag remain structurally validated so a PWA reload
  does not lose a legitimate paused configuration.
- Schema-3/4 migration validates the complete required source shape and all
  numeric/type fields before any `finiteOr` coercion. Malformed legacy records
  fail closed and receive truthful reset handling.
- Added table/property candidate coverage for valid sealed migration,
  malformed/unsealed group substitutions, forged ending/topology/task edges,
  canonical reconstruction, and restore idempotence.

## Plan requirements covered

- D-046 / `plan.md` §§9, 16, 17, 24.6: audited supported generations,
  transactional single-boundary migration, closed-world stale/unsealed
  recovery, truthful malformed handling, deterministic restore, and no partial
  future/unsupported interpretation.
- Fixture/recovery contract: existing provenance/checksum fixture corpus,
  bounded raw recovery backup/status path, unique ledger IDs, and no duplicate
  task, money, command, deduction, reward, or event effects remain covered.
- Rule of Three: exact sealed/current behavior, malformed or forged
  stale/unsealed boundaries, and existing reload/offline/PWA lifecycle lanes at
  320/393 remain regression boundaries.
- Worker simulation, economy/accounting, navigation, M7C copy, and parked M7B
  contracts unchanged. No cloud sync, accounts, multiple slots, editor/import,
  encryption, new content, or schema bump added.

## Verifier findings addressed

- `V-113-001`: ending/meta identity now binds to exact event semantics and
  recomputed causal evidence; forged identity falls back to null/initial meta.
- `V-113-002`: expansion recovery retains corroborated core state and money,
  rebuilds starter or expanded canonical topology from purchase/activation
  evidence, and never maps an untrusted slot array into the topology.
- `V-113-003`: exact schema-3/4 required-field validation precedes coercion;
  malformed numeric/type records return seed-specific reset state.
- Prior `V-111-*` and `V-112-*` findings remain covered by preserved immutable
  reports/tests; no verifier report or verifier-owned test was edited.

Independent verification remains required; this handoff does not issue PASS.

## Setup, startup, and verification commands

Repository-local caches:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

`./scripts/run` serves Vite on `127.0.0.1:4173`. Playwright-managed e2e uses
`./scripts/run-e2e`, waits for loopback readiness, and cleans up its process.
`@playwright/test` is pinned in `package.json`; browser binaries stay in the
ignored repository cache.

Focused commands run this turn:

```sh
npm run typecheck -- --pretty false
npm run lint -- --no-warn-ignored
npx prettier --check src/simulation/engine.ts src/simulation/types.ts src/simulation/closedWorldRecovery.test.ts
npm run test:save-stability
node_modules/.bin/vitest run --coverage=false src/simulation/closedWorldRecovery.test.ts src/simulation/verifierRound111.test.ts src/simulation/verifierRound112.test.ts src/simulation/verifierRound113.test.ts src/simulation/saveFixtures.test.ts src/simulation/engine.test.ts src/simulation/verifierRound034.test.ts src/simulation/verifierRound035.test.ts --reporter=dot
```

Focused results: typecheck, lint, save-stability `29/29`, and the mapped
Round-034/035, Round-111/112/113, fixture, engine, and candidate lanes `120/120`
passed. The focused stale-save browser regressions passed: jobs provenance and
paid completion `2/2`; atomic root PWA refresh `1/1`. The final canonical
development verification ran after all executable changes:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-114-development-final2 \
  ./scripts/verify --profile=development
```

Final canonical evidence: verification catalog `113` reports / `123` findings,
setup, format, lint, typecheck, unit `381/381`, all balance lanes, build,
production audit, root browser/PWA `242/242`, and Pages offline `2/2` completed;
M7B commercial gate remained parked under D-044.

## Important architectural decisions

- `saveSupport.ts` remains the sole audited policy/provenance table; the engine
  consumes its exact lookup rather than maintaining a second permissive list.
- Unsealed normalization occurs only after structural validation. It starts
  from `createInitialState(seed)` and retains narrowly corroborated transitions:
  exact capital records, purchase+activation, typed queue records, typed
  settlement records, and recomputed ending semantics.
- Queue provenance is optional for compatibility with older sealed records;
  absent provenance cannot authorize stale task/quote retention. This adds no
  schema bump and preserves intact historical seals unchanged.
- Canonical starter/expanded topology is selected from corroborated expansion
  state, never by copying stale slot arrays. The pre-restore D-016 installed
  check can authorize guide completion, while the recovered slot projection is
  still canonical.
- Placement/removal provenance is optional for older history; only current
  engine-authored typed records can alter the canonical recovered slot map.

## Known limitations and risks

- Parked M7B commercial/native/WebKit/device-performance, hosted exact-SHA,
  deployment, and release-owner checks remain outside this repair; no
  full-release physical gate is run.
- Schema 3–6 and intermediate schema-7 fixtures are audited reconstructions,
  not surviving byte captures; existing provenance/derivation metadata remains
  explicit.
- Raw recovery backup remains best-effort under storage quota/unavailability;
  UI status reports whether one bounded backup was preserved.

## Checks not run

- Full-release / M7B physical, native, WebKit, device-performance, hosted,
  deployment, and release-owner checks: explicitly parked/out of scope under
  D-044. Independent verifier evaluation and any release-owner gate remain
  required; the completed development gate is not a substitute for either.
