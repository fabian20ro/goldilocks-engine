# Candidate handoff — Round 117 M7D receipt reconciliation / M7B preflight

Implementation base: `2012dcddf6a25fc781fbd7efe0b6b133f148ad2b` (immutable
Round-116 Verifier commit). Candidate SHA is recorded after the final commit;
this handoff makes no independent-verifier verdict or commercial-release
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
- Recorded the completed exact-SHA M7D release-owner receipt in
  `.agent/release-receipts/round-116.md`: hosted Verify `32582068882`, Pages
  deploy `32582472823`, remote `main` at
  `caa334945f5b0a89bc1452609e9b118ba042df01`, live build
  `45330c2e3a0014a55b93`, and the 320×693 smoke result. The receipt does not
  claim M7B/commercial completion.
- Extended `scripts/agent-status` to validate committed exact deployment
  receipts and expose their candidate/build identity separately from live
  verification state. A later receipt/documentation commit remains
  unverified until a fresh Verifier assesses its exact SHA; the status script
  does not silently advance the next gate.
- Added D-048 plus stable routing/acceptance references for the receipt and
  recorded the current M7B infrastructure preflight. No production behavior,
  save semantics, schema, or commercial gate was changed.

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
- M7A release/deployment record: the exact accepted M7D candidate receipt is
  durable, machine-validated, and explicitly separated from M7B commercial
  evidence.
- M7B evidence honesty: native/performance infrastructure remains explicitly
  `BLOCKED`; no Chromium, AX-tree, simulator-only, or locked-device substitute
  is promoted to `PASS`.

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
- No product verifier finding is claimed resolved in Round 117. The receipt,
  status, and routing changes are documentation/verification tooling only and
  require independent review at the exact candidate SHA.

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
npx vitest run --coverage=false src/test/agentStatus.test.ts --reporter=dot
sh -n scripts/agent-status
./scripts/agent-status --json
curl -fsSL https://fabian20ro.github.io/goldilocks-engine/build-info.json
git ls-remote origin refs/heads/main
gh run view 32582068882 --repo fabian20ro/goldilocks-engine --json status,conclusion,headSha,headBranch,url,jobs
gh run view 32582472823 --repo fabian20ro/goldilocks-engine --json status,conclusion,headSha,headBranch,url,jobs
M7B_NATIVE_ALLOW_BLOCKED=1 \
M7B_NATIVE_EVIDENCE_DIR=.cache/m7b/native/round-117-preflight \
M7B_NATIVE_PORT=43120 npm run test:native-a11y
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
- The receipt records deployment of the exact Round-116 candidate. This
  Round-117 documentation/tooling candidate is not itself deployed until its
  own independent verification and exact-SHA release action complete.
- Parked M7B commercial/native/WebKit/device-performance gates remain open;
  the receipt does not relabel them or substitute Chromium/AX-tree evidence.
- Schema 3–6 fixtures are audited reconstructions rather than surviving byte
  captures; provenance and derivation metadata are committed.
- Recovery backup is best-effort under storage quota/unavailability; status
  truthfully reports when no backup could be preserved.

## Checks not run

- `./scripts/verify --profile=full-release`: not run; M7B remains parked under
  D-044 and this candidate does not close the required native/physical gates.
- `./scripts/verify --profile=development`: final run pending after the
  receipt/status documentation and tests are complete; prior Round-116
  development PASS remains the product baseline and this candidate changes no
  production behavior.
- Native preflight ran with a new ignored evidence directory and returned
  `BLOCKED`: CoreSimulatorService was unavailable to `xcrun simctl`, and
  `adb devices -l` returned no authorized device. No Pixel unlock is assumed.
- Native VoiceOver/TalkBack speech, physical Android Chrome, battery/thermal,
  authenticated same-device baseline, and WebKit host launch remain
  unavailable gates. The next operator action is to run the documented native
  capture when physically present with an interactive iOS Simulator and
  unlocked USB Android, then complete `operator-submission.json` and validate
  it before the performance collector.
