# Candidate handoff — Round 112 M7D save-stability repair

Implementation base: `c7d103624c46c44f15e1673467d4560b7ae353d2` (immutable
round-111 Verifier commit). Candidate SHA is recorded after the final commit;
this handoff makes no independent-verifier verdict or commercial-release
acceptance claim.

## Implemented behavior summary

- The existing restore boundary now admits only the exact D-046
  schema/content pairs through `findSupportedSaveGeneration`. Schema 3–6 no
  longer accept arbitrary content labels; unknown content, future schema,
  schema 1/2, and malformed records fail closed.
- A fallback result is classified as `reset` before any legacy migration status
  is reported. Minimal records naming a supported legacy generation cannot be
  described as migrated or as preserving source fields.
- Structurally valid unsealed current saves retain task/accounting/seed/RNG and
  bounded ledger history. Ownership is retained only when its purchase record
  is corroborated (including the audited legacy two-decimal first-session
  wording); uncorroborated hardware/module/expansion ownership, workload
  unlocks, Career route/savings, and meta progression return to safe defaults.
  Existing causal/evaluation repair remains authoritative for retained ending
  evidence. Structurally malformed records still fall back rather than being
  normalized into a recovery.
- Added candidate-owned fixture regressions for exact legacy admission,
  malformed legacy reset classification, and forged unsealed progression.
- Preserved immutable `.agent/verification/round-111.md`,
  `src/simulation/verifierRound111.test.ts`, and verifier catalog changes.

## Plan requirements covered

- D-046 / `plan.md` §§9, 16, 17, 24.6: exact audited support policy, bounded
  deterministic migration boundary, truthful malformed/stale/unsealed
  recovery, no partial future/unsupported interpretation, and no duplicate
  task/effect/event behavior.
- Fixture and recovery contract: committed provenance/checksum/invariant
  corpus remains covered by `npm run test:save-stability`; the new tests close
  the schema/content and unsealed progression gaps found by round 111.
- Browser Rule of Three / `plan.md` §§20, 23, 27: the existing pinned lane
  still covers supported migration, malformed/tampered recovery, reload,
  offline PWA resume, and 320/393 portraits.
- Schema 7, Worker simulation, economy/accounting, navigation, M7C copy, and
  parked M7B boundaries remain unchanged. No cloud sync, accounts, slots,
  editor/import, encryption, content, or schema bump added.

## Verifier findings addressed

- `V-111-001`: production restore and recovery status use the audited exact
  schema/content lookup; unknown legacy content returns the fallback and
  `reset` status.
- `V-111-002`: fallback detection precedes legacy migration classification;
  malformed supported legacy records report reset copy naming the reset and
  next action.
- `V-111-003`: the unsealed normalizer clears uncorroborated ownership and
  progression while retaining only bounded corroborated purchase/history and
  core task/accounting state; the causal repair path remains compatible with
  prior saturated-ending protections.

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

Focused commands:

```sh
npm run test:save-stability
npm test
npm run typecheck -- --pretty false
npm run lint
npm run format:check
npm run validate:verification-catalog
npm run test:e2e -- tests/e2e/save-stability.spec.ts
```

Canonical command attempted once after the initial executable edits:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-112-development \
  ./scripts/verify --profile=development
```

That invocation stopped in the unit lane on two compatibility regressions
(`capitalLedgerCurrency.test.ts` legacy purchase wording and
`verifierRound035.test.ts` saturated causal-repair metadata). Both were fixed.
The complete post-fix unit lane is `72 files / 360 tests`; focused fixture and
adversarial lanes are `53/53`; the focused browser lane is `4/4`; typecheck,
lint, format, and catalog validation are clean. The canonical command was not
looped after those fixes to respect the one-final-gate rule; an independent
Verifier must rerun it for the committed candidate.

The first sandboxed browser attempt failed before execution on macOS Chromium
MachPort permission; the same pinned command with scoped host permission passed
all four tests. This is recorded infrastructure evidence, not a test waiver.

## Important architectural decisions

- `saveSupport.ts` remains the sole audited policy/provenance table; the engine
  consumes its exact lookup rather than maintaining a second permissive list.
- Unsealed normalization runs only after structural validation and before
  causal checks. Purchase messages are bounded ledger corroboration, not
  arbitrary import authority. Invalid structural records still return the
  seed-specific fresh state.
- Recovery backup/status behavior, Worker publication, and all M7C/M7B
  contracts remain unchanged.

## Known limitations and risks

- The parked M7B commercial/native/WebKit/device evidence and deployment gates
  remain outside this repair; no full-release profile was run.
- Schema 3–6 and intermediate schema-7 fixtures are audited reconstructions,
  not surviving byte captures; provenance and derivation remain explicit.
- Raw recovery backup remains best-effort under storage quota/unavailability;
  the UI reports when no backup was preserved and keeps the run operable.

## Checks not run

- Full-release / M7B physical, native, WebKit, device-performance, hosted
  exact-SHA, deployment, and release-owner checks: explicitly parked/out of
  scope under D-044.
- A second canonical development invocation after the repaired executable
  delta: intentionally not run under the protocol's one-final-gate rule; the
  post-fix complete unit and focused browser evidence above is available for
  the fresh independent Verifier.
