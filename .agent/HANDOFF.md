# Candidate handoff — Round 116 M7D fixture reproducibility repair

Implementation base: `0e40d109b1d834ccaf8513ea418a5b4f937b499e` (immutable
Round-115 Verifier commit). Candidate SHA is recorded after the final commit;
this handoff makes no independent-verifier verdict or release-acceptance
claim.

## Implemented behavior summary

- `restoreSimulationState` now gates every supported schema/content record on
  its original deterministic integrity seal before reading migration fields.
  Exact audited schema 3–7 generations migrate through the existing single
  boundary; current/content upgrades reseal deterministically.
- Removed the closed-world unsealed progression reconstruction and mutable
  ledger-corroboration paths. No ownership, topology, ending/meta state,
  evaluation/causal counters, Research/Hype/Lab state, task/quote/accounting
  state, Career progress, RNG, or history is salvaged from absent, stale,
  malformed, tampered, or otherwise invalid integrity.
- Invalid or missing integrity first follows the existing bounded raw recovery
  backup transaction, then resets to a fresh safe run. Recovery status names
  the invalid-integrity reason, what was reset, backup availability, and the
  next action. Unsupported/future/malformed records remain fail-closed and are
  never partially interpreted. Independent UI preferences remain outside this
  simulation reset boundary.
- Raw recovery remains one versioned, bounded, checksummed record. The Worker,
  economy/accounting, navigation, PWA/offline lifecycle, M7C editorial copy,
  and parked M7B contract remain unchanged.
- Regenerated the provenance-bearing golden corpus for every supported public
  generation and malformed/stale/unsealed/tampered/unsupported/future
  boundary. Schema 3–6 fixtures carry documented deterministic seals over
  audited reconstructed historical payloads; the repository does not claim
  unavailable old deployment artifacts contained those seals.
- Made `scripts/generate-save-fixtures.ts` authoritative for fixture payload,
  provenance strings, and JSON formatting by using the pinned Prettier
  dependency during generation. The committed corpus now reproduces
  byte-for-byte on clean and repeated runs; generated JSON is not hand-edited.

## Plan requirements covered

- D-046 audited support catalogue and D-047 sealed-only trust/recovery policy;
  `plan.md` remains unchanged.
- Single-boundary deterministic migration, serialize/restore idempotence,
  legitimate progress/seed/RNG/task/quote/topology/accounting/Career/
  Research/Hype/Lab/history retention for valid sealed fixtures, unique event
  IDs, and no duplicate commands/tasks/deductions/rewards/money/events.
- Transactional invalid-integrity backup-before-reset and concise truthful
  user-visible recovery status.
- Rule of Three: valid sealed migration; malformed/stale/unsealed/tampered
  reset with no progression salvage; reload/offline/PWA A/B lifecycle at 320
  and 393 while retaining the existing engine and presentation contracts.

## Verifier findings resolved by this candidate

- D-047 supersedes the stale/unsealed salvage assumptions in `V-111-*`,
  `V-112-*`, and `V-113-*`; the implementation removes those trust paths.
- `V-114-001` through `V-114-004` are addressed by the pre-migration seal
  gate, no-salvage reset transaction, bounded recovery status/backup, and
  sealed schema 3–7 fixture coverage.
- `V-115-001` is addressed: the generator's two D-047 provenance strings and
  formatter output now match the committed corpus, and repeated generation is
  idempotent.
- Immutable reports `.agent/verification/round-111.md` through
  `.agent/verification/round-115.md`, their regression tests, and the catalog
  remain untouched. Their regression cases remain present and are aligned to
  the explicitly authorized D-047 semantics; an independent Verifier must
  issue the next report.

## Setup, startup, and verification commands

Use repository-local ignored caches:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

`./scripts/run` serves Vite on `127.0.0.1:4173`. The pinned Playwright
dependency is in `package.json`; `npm run test:e2e` invokes the managed server,
waits for loopback readiness, and cleans up. Browser binaries and npm data stay
in ignored repository-local caches.

Focused checks completed:

```sh
npm run typecheck -- --pretty false
npm run lint -- --no-warn-ignored
npm run format:check
npm run validate:verification-catalog
npm run generate:save-fixtures
npm run test:save-stability
npx vitest run --coverage=false src/simulation/saveFixtures.test.ts src/simulation/saveRecovery.test.ts --reporter=dot
E2E_PORT=4174 npm run test:e2e -- tests/e2e/save-stability.spec.ts --reporter=line
E2E_PORT=4174 npm run test:e2e -- \
  tests/e2e/jobs-settlement-provenance.spec.ts \
  tests/e2e/round-012-upgrades.spec.ts \
  tests/e2e/verifier-round-034.spec.ts \
  tests/e2e/verifier-round-035.spec.ts \
  tests/e2e/verifier-round-042.spec.ts \
  tests/e2e/verifier-round-050.spec.ts --reporter=line
E2E_PORT=4174 npm run test:e2e -- \
  tests/e2e/jobs-settlement-provenance.spec.ts \
  --grep "stale future ledger" --reporter=line
E2E_PORT=4174 npm run test:e2e -- \
  tests/e2e/verifier-round-050.spec.ts \
  --grep "one-shot preboot expansion" --reporter=line
```

Results: typecheck, lint, format, catalog, generator execution, save-stability
(`37` tests), and the focused Round-115 fixture/recovery unit lane (`6` tests)
passed. After the generator formatter was made authoritative, its clean output
changed only the two stale provenance strings named by `V-115-001`; a second
run produced the identical working-tree diff. After commit, two clean
`npm run generate:save-fixtures` runs both left the worktree clean.

The retained Round-115 canonical development evidence covered production
behavior and the root/Pages browser lanes (`244/244` root tests, `2/2` Pages
tests). This repair changes only the fixture generator, generated JSON, and
documentation, so the broad canonical gate was not rerun.

One attempted `npm run test:save-stability -- --runInBand` probe was rejected
by Vitest's CLI; the corrected command above was used. Chromium required the
approved host-elevated launch because the default sandbox denied MachPort
bootstrap; the repository-local browser/cache contract was retained.

The prior Round-115 canonical command was:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-115-development-final \
npm_config_cache="$PWD/.cache/npm" \
PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
./scripts/verify --profile=development
```

completed setup, format, lint, typecheck, unit (`77` files / `400` tests),
balance, build, production audit, root browser/PWA, and Pages/offline lanes;
the immutable Round-115 report records that evidence. No executable
production save semantics changed in Round 116, so the canonical gate is
intentionally skipped here.

## Important architectural decisions

- `saveSupport.ts` remains the sole D-046 audited policy/provenance table;
  there is no guessed generation list in the engine.
- `hasValidSaveRecordIntegrity` validates the source record's digest over its
  exact pre-migration JSON shape. `sealSimulationState`/migration reseal only
  after structural validation and never repairs an untrusted source.
- Schema 3–6 fixture seals are reproducible derivations from audited source
  and migration history, explicitly labeled as such; no schema bump or
  alternate import path was added.
- The generator serializes with indented JSON then applies the repository's
  pinned Prettier formatter. Generator source, not an independently edited
  fixture, owns provenance and checksum inputs.
- Recovery preserves at most one bounded raw payload with source metadata and
  checksum before replacing the simulation with `createInitialState`.

## Known limitations and risks

- Independent Verifier review remains required; this handoff does not issue
  PASS or release acceptance.
- Parked M7B commercial/native/WebKit/device-performance, hosted exact-SHA,
  deployment, and release-owner checks were not run. Full-release physical
  M7B was intentionally not rerun.
- Schema 3–6 fixtures are audited reconstructions rather than surviving byte
  captures; provenance and derivation metadata are committed.
- Recovery backup is best-effort under storage quota/unavailability; status
  truthfully reports when no backup could be preserved.

## Checks not run

- `./scripts/verify --profile=full-release`: not run; M7B is parked under
  D-044 and the user explicitly prohibited rerunning the full-release M7B
  physical gate.
- `./scripts/verify --profile=development`: not rerun because Round 116
  changes no production save semantics and the immutable Round-115 canonical
  development evidence already covers the affected product lanes.
- Native device, WebKit, physical performance, hosted deployment, and release
  owner checks remain outside this repair and require their documented
  infrastructure.
