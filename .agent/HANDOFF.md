# Candidate handoff — Round 115 M7D D-047 sealed-save recovery boundary

Implementation base: `7e65e909baf9f44fe536ec02d62f6a78b1c64eb4` (immutable
Round-114 Verifier commit). Candidate SHA is recorded after the final commit;
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
- Immutable reports `.agent/verification/round-111.md` through
  `.agent/verification/round-114.md` remain untouched. Their regression
  cases remain present and are aligned to the explicitly authorized D-047
  semantics; an independent Verifier must issue the next report.

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
npm run test:save-stability
npx vitest run --coverage=false --reporter=dot
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

Results: typecheck, lint, format, catalog, full Vitest (`76` files / `394`
tests), save-stability (`37` tests), and the save-stability browser lane
(`4/4`) passed. The affected browser matrix passed `16/19` on its first
focused run; after deterministic fixture repairs, the remaining stale-ledger
case passed `1/1` and the two sealed-expansion portrait cases passed `2/2`.

One attempted `npm run test:save-stability -- --runInBand` probe was rejected
by Vitest's CLI; the corrected command above was used. Chromium required the
approved host-elevated launch because the default sandbox denied MachPort
bootstrap; the repository-local browser/cache contract was retained.

The one permitted final canonical attempt was:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-115-development-final \
npm_config_cache="$PWD/.cache/npm" \
PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" \
./scripts/verify --profile=development
```

It completed setup, format, lint, typecheck, unit (`76` files / `394` tests),
balance, build, and production-audit lanes, then stopped in root browser/PWA
with `49` failed, `178` passed, `15` not run (`242` total). Those failures
were stale E2E fixtures/expectations that injected deliberate state without a
D-047 seal; the focused repairs above were made afterward. The canonical gate
was not rerun because this role permits one final canonical invocation per
turn. A fresh independent verification must run the canonical command against
the committed candidate.

## Important architectural decisions

- `saveSupport.ts` remains the sole D-046 audited policy/provenance table;
  there is no guessed generation list in the engine.
- `hasValidSaveRecordIntegrity` validates the source record's digest over its
  exact pre-migration JSON shape. `sealSimulationState`/migration reseal only
  after structural validation and never repairs an untrusted source.
- Schema 3–6 fixture seals are reproducible derivations from audited source
  and migration history, explicitly labeled as such; no schema bump or
  alternate import path was added.
- Recovery preserves at most one bounded raw payload with source metadata and
  checksum before replacing the simulation with `createInitialState`.

## Known limitations and risks

- Independent Verifier review and a fresh canonical run remain required; this
  handoff does not issue PASS or release acceptance.
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
- Canonical development verification after the final fixture-only repairs:
  intentionally not rerun because the one final canonical invocation above
  was already consumed in this role turn. Independent verification must
  rerun it on the committed SHA.
- Native device, WebKit, physical performance, hosted deployment, and release
  owner checks remain outside this repair and require their documented
  infrastructure.
