# Candidate handoff — Milestone 7D Save Stability

Implementation base: `321f8e2d33cb4b06efe0e14b3e4970aa70e0f6f1`.
Implementation candidate before this handoff-only amend:
`922912a3e49b347bb87f715c9060d86f851fa63f`; the final amended candidate SHA
is reported after the amend. Role: Implementer. This handoff makes no
independent-verifier verdict or commercial-release acceptance claim.

## Implemented behavior summary

- Added D-046's audited support policy in `src/simulation/saveSupport.ts`.
  Exact source commits are recorded for schema 3 `pipeline-toy-2`, schema 4
  `pipeline-toy-3`, schema 5 `pipeline-toy-4`, schema 6
  `bedroom-career-1`, and schema 7 `evaluation-replay-1`, `research-1`,
  `hype-fear-1`, and `local-lab-1`. Public-deployment tier is limited to the
  independently evidenced schema-7 evaluation publication and the exact
  schema-7 Local Laboratory receipt/build `dc97ee41f6dbbc0e29d2`; older
  generations are explicitly legacy compatibility.
- Added deterministic, committed golden save fixtures for every supported
  generation and explicit malformed, stale, unsealed, tampered, future, and
  unsupported boundaries. Each carries policy/source or boundary derivation,
  checksum, and semantic expected invariants. Regeneration is
  `npm run generate:save-fixtures`.
- Added `restoreSimulationStateWithReport` and deterministic serialization at
  the existing restore boundary. Valid sealed saves migrate and reseal;
  supported old content upgrades; stale/unsealed state retains corroborated
  core/task/accounting/seed/RNG/history only; future/unsupported input is not
  partially interpreted; malformed input falls back to a valid fresh state.
- Added one bounded, versioned raw recovery backup with source key, timestamp,
  parseable schema/content metadata, truncation marker, and checksum. Added
  concise user-visible recovery status naming preserved fields, reset fields,
  next action, and backup availability, with dismiss/reload persistence.
- Added the data-driven fixture/recovery unit harness and committed Playwright
  coverage for normal migration, malformed/tampered recovery, stale/unsealed
  recovery, reload/offline PWA resume, and 320/393 portrait operation.
- Preserved schema 7, Worker-only simulation, economy/accounting, navigation,
  M7C editorial copy, PWA/update behavior, and parked M7B release boundaries.

## Plan requirements covered

- `plan.md` §24.6: save schema/content/migration/integrity metadata remains
  explicit; supported historical restore paths are fixture-backed and
  deterministic. `plan.md` was not edited.
- `plan.md` §§9, 16, 17: malformed/stale recovery preserves only corroborated
  work and keeps accounting/history identity safe; unsupported/future records
  fail closed; no duplicate commands, tasks, deductions, rewards, money, or
  events are introduced.
- `plan.md` §§20, 23, 27: browser Rule of Three covers normal, adversarial,
  and lifecycle behavior with representative portrait widths, persistence,
  offline operation, and PWA update regression.
- D-046 routing is recorded in `.agent/DECISIONS.md`, `.agent/CURRENT_SCOPE.md`,
  `.agent/verification/INDEX.md`, `.agent/verification/catalog.json`, and
  `.agent/RELEASE_ACCEPTANCE.md`.

## Verifier findings resolved / retained

- No immutable verifier report was edited. No new verifier finding exists for
  this Implementer turn; the D-046 candidate-owned fixture and recovery seams
  are mapped in the routing catalog for independent assessment.
- Active M7B OIV findings and round-109 infrastructure blockers remain
  retained and parked under D-044. This candidate does not relabel, weaken, or
  close those findings.

## Setup, startup, and verification commands

Dependency and browser caches are ignored and repository-local:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

`./scripts/run` starts Vite on deterministic loopback `127.0.0.1:4173`.
Playwright's managed server uses `./scripts/run-e2e`, builds first, waits for
the same loopback URL, and cleans up after each run. `@playwright/test` is
pinned in `package.json` and the browser installation is project-cache based.

Focused commands:

```sh
npm run generate:save-fixtures
npm run test:save-stability
npm test
npm run build
npm run validate:verification-catalog
npm run test:e2e -- tests/e2e/save-stability.spec.ts
```

Canonical candidate command:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-111-development \
  ./scripts/verify --profile=development
```

Final canonical result: exit `0`; catalog, setup, format, lint, typecheck,
unit (`71 files`, `346 tests`), balance, build, production audit (`0
vulnerabilities`), root Chromium/PWA (`242 passed`), and Pages/offline (`2
passed`) passed. The summary records
`m7b-commercial-gate=blocked (parked under D-044; run --profile full-release)`
and `verification=development-candidate` at
`.cache/verification/round-111-development/summary.txt`.

Full release remains the separate strict command:
`./scripts/verify --profile=full-release`.

## Important architectural decisions

- `saveSupport.ts` is policy/provenance data only; it does not guess public
  deployment history or create a second restore path.
- `restoreSimulationStateWithReport` wraps the established engine restore
  function rather than duplicating migration logic. Recovery classification is
  derived from the source record, restored state, schema/content support, and
  integrity result at that single boundary.
- Backup persistence uses two fixed localStorage keys and a hard raw-length
  bound. Backup/status failure cannot prevent the in-memory simulation from
  starting. No cloud, account, slot, editor/import, encryption, or schema bump
  was added.
- React recovery status is presentation-only and does not dispatch simulation
  commands. Worker publication still owns durable state; recovery storage is a
  bounded diagnostic handoff for the next user action.

## Known limitations and risks

- Commercial release remains blocked by the parked M7B physical/native/WebKit
  evidence under D-044: VoiceOver/TalkBack speech, unlocked physical Android,
  battery/thermal measurement, authenticated frozen baseline, and known WebKit
  offline top-level reload evidence. The full-release script remains strict.
- Historical schema 3–6 and intermediate schema-7 fixtures are deterministic
  reconstructions from audited source/migration history, not byte captures of
  surviving deployed storage. Their metadata explicitly records that
  derivation and compatibility tier.
- Raw recovery backup is best-effort if browser storage itself is unavailable;
  the UI reports when no backup could be preserved and keeps the run operable.
- Independent Verifier must assess the exact committed candidate SHA. This
  handoff does not issue PASS or release acceptance.

## Checks not run / final evidence

- The canonical development profile completed successfully; exact summary and
  lane results are recorded above.
- Full-release/default profile, WebKit/native/device-performance lanes, hosted
  exact-SHA verification, and deployment were not run: required M7B
  infrastructure and release-owner authority remain out of scope/parked under
  D-044.
- A first sandboxed focused browser attempt failed before test execution with
  macOS Chromium MachPort permission denial; the same pinned test was rerun
  with scoped host browser permission and passed. This is retained as
  infrastructure evidence, not hidden.
