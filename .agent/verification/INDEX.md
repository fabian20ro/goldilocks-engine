# Verification index — accepted Milestone 7A release and active Milestone 7D

M7B is parked as a commercial gate; M7C is retained as a presentation
regression boundary; active Milestone 7D follows below.

The historical route label “accepted Milestone 7A release and active Milestone 7B”
remains retained in the navigation contract; D-044 parks that commercial gate
while M7D is implemented.

Navigation only. Immutable reports, `plan.md`, and `.agent/DECISIONS.md`
remain authoritative. This index never claims live HEAD, latest verdict,
acceptance, unresolved state, or next gate. Run `./scripts/agent-status` first.

## Canonical read route

1. `AGENTS.md` and the active role profile.
2. `./scripts/agent-status`.
3. `.agent/CURRENT_SCOPE.md`, this index, and
   `.agent/verification/catalog.json`.
4. Exact authorities named by the active requirement.

Use the complete plan, decisions, and archive for release verification,
broad/cross-milestone work, missing or contradictory catalog coverage, or an
explicit request. Never use this index or the handoff as proof.

## Canonical verification lane

`./scripts/verify --profile=full-release` runs the catalog validator, locked
setup, format, lint, typecheck, unit/property tests, deterministic balances,
build, production audit, root browser/PWA, WebKit, native, performance, and
Pages/offline checks. It remains strict: unavailable M7B evidence exits
BLOCKED. `./scripts/verify --profile=development` runs every locally testable
candidate lane and records `m7b-commercial-gate=blocked (parked under D-044)`;
it never calls that parked gate PASS. `npm run test:e2e` is the
repository-pinned root browser lane. Browser dependencies and browsers use
ignored repository-local caches documented in `.agent/HANDOFF.md`.

## Retained Milestone 7A route

| Requirement | Source | Candidate evidence | Canonical lane |
| --- | --- | --- | --- |
| Routing is compact, current-scope aware, and contradiction-checked | D-041; `.agent/RELEASE_ACCEPTANCE.md` | `catalog.json`; `scripts/validate-verification-catalog.mjs` | `verification-catalog` then `./scripts/verify` |
| Eight tabs retain stable order and bottom-tab-only routing | `plan.md` §20; D-040–D-041 | `src/ui/App.tsx`; `src/ui/glyphs.tsx` | root browser |
| Narrow overflow is discoverable without shrinking targets | D-041; `.agent/RELEASE_ACCEPTANCE.md` | `src/ui/styles.css`; `tests/e2e/navigation-affordance.spec.ts` | root browser |
| Normal/boundary/lifecycle nav behavior | D-041 Rule of Three | 393px fit; 320px cue/reveal; 200% resize/reload/focus/touch | root browser |
| Commercial-release matrix is explicit | `plan.md` §29; `.agent/RELEASE_ACCEPTANCE.md` | matrix and gate-order documentation | independent Verifier |

M7A's exact accepted release receipt is frozen in D-043 and
`.agent/RELEASE_ACCEPTANCE.md`; it is historical routing, not a live status
claim. These navigation/PWA checks remain regression requirements for M7B.

## Parked Milestone 7B OIV route

| Requirement | Source | Candidate evidence | Canonical lane |
| --- | --- | --- | --- |
| WebKit browser parity at both representative portraits | D-043; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7B | Next candidate's pinned WebKit E2E matrix, traces/screenshots, and exact handoff commands | `npm run test:e2e:webkit` from `./scripts/verify` |
| VoiceOver/TalkBack names, active state, reveal, and first action | D-043; `plan.md` §§20.4, 27; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7B | iOS Simulator + Safari and unlocked USB Android + Chrome/TalkBack artifact with device/browser/build identity | Native device lane; independent Verifier |
| Measured mobile startup, Web Vitals, Worker, memory, offline, battery/thermal | D-043; `plan.md` §§23, 27; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7B | Five cold runs/device, raw traces plus median/p95, absolute budgets and frozen-build baseline deltas | Next candidate performance command from `./scripts/verify` |
| Rule of Three, artifact manifest, and infrastructure/blocker honesty | D-043; `.agent/CURRENT_SCOPE.md`; `.agent/HANDOFF.md` | Candidate SHA, matrix, settings, thresholds, checksums/paths, cleanup, and explicit BLOCKED evidence | Independent Verifier report |

M7B does not pull forward writing/density, supported-save fixtures/version
policy, localization, audio, or packaging/distribution decisions. Those remain
prioritized later M7 requirements in `.agent/RELEASE_ACCEPTANCE.md`.

## Active Milestone 7C writing/density route

| Requirement | Source | Candidate evidence | Canonical lane |
| --- | --- | --- | --- |
| D-044 development/full-release profiles keep parked M7B evidence explicit | D-044; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7C | `scripts/verify`; `src/test/verificationProfiles.test.ts`; round-109 BLOCKED report | development profile then full-release profile |
| D-045 one live editorial summary per destination | D-045; `plan.md` §§20.2–20.7; `.agent/RELEASE_ACCEPTANCE.md` §Milestone 7C | `src/ui/editorial.ts`; `src/ui/commandDeck.tsx`; `src/ui/App.tsx`; Research/Lab/World views | focused unit + pinned browser |
| Locked/failure/recovery copy preserves requirements, progress, work, and action | D-045; `plan.md` §§9, 16, 17, 20.5 | `LockedState`; editorial presenter Rule-of-Three tests; existing Details/ledger suites | focused unit + root browser |
| Portrait density and lifecycle contract across all eight destinations | D-045; D-041; `.agent/CURRENT_SCOPE.md` | data-driven `tests/e2e/command-deck.spec.ts` screenshot atlas, 320/393/200%/reduced-motion/keyboard/touch/reload/offline | `npm run test:e2e` |

M7C remains presentation-only. It does not close the parked M7B commercial
release gate or imply hosted exact-SHA deployment.

## Active Milestone 7D save-stability route

| Requirement | Source | Candidate evidence | Canonical lane |
| --- | --- | --- | --- |
| Audited support policy names only actually evidenced schema/content/build generations and explicit unsupported/future boundaries | D-046; `plan.md` §24.6; `.agent/RELEASE_ACCEPTANCE.md` | `src/simulation/saveSupport.ts`; `fixtures/save-fixtures/README.md`; `.agent/DECISIONS.md` | `verification-catalog` then `./scripts/verify` |
| Every supported generation has provenance/checksum/invariants plus malformed/stale/unsealed/tampered/future fixtures | D-046; `plan.md` §§17, 24.6 | `fixtures/save-fixtures/*.json`; `src/simulation/saveFixtures.test.ts` | `npm run generate:save-fixtures`; focused fixture lane |
| Single restore boundary migrates deterministically, preserves legitimate state, idempotently reseals, and prevents duplicate effects/IDs | D-046; `plan.md` §§9, 16, 17, 24.6 | `src/simulation/engine.ts`; `src/simulation/saveFixtures.test.ts`; `src/simulation/saveRecovery.test.ts` | `npm run test:save-stability`; unit/property suite |
| Transactional recovery creates one bounded raw backup and user-visible preserved/reset/next-action status; future/unsupported input is not partially interpreted | D-046; `plan.md` §§17, 24.6 | `src/simulation/saveRecovery.ts`; `src/ui/useSimulation.ts`; `src/ui/App.tsx`; `tests/e2e/save-stability.spec.ts` | pinned root browser |
| Browser Rule of Three covers normal migration, malformed/stale/tampered recovery, and reload/offline PWA lifecycle at 320/393 while retaining M7C/M7B boundaries | D-046; D-044–D-045; `plan.md` §§20, 23, 27 | `tests/e2e/save-stability.spec.ts`; `tests/e2e/pwa-update.spec.ts`; `.agent/HANDOFF.md` | `npm run test:e2e` from `./scripts/verify` |

M7D is persistence/recovery closure only. It does not close the parked M7B
commercial gate, imply hosted exact-SHA deployment, or authorize cloud sync,
accounts, multiple slots, save editing/import, encryption, or a schema bump.

## Historical accepted Milestone 6 route

Round 093 is immutable historical evidence for D-040's Lab lifecycle and
capacity repair. Its normal, malformed/recovery, and reload/offline probes are:

- `.agent/verification/round-093-adversarial.mjs`;
- `.agent/verification/round-093-ui-adversarial.mjs`;
- `src/simulation/laboratory.test.ts` and the Lab E2E suite.

The round-092 FAIL findings V-092-001 and V-092-002 are mapped as resolved by
round 093 in the machine catalog. Do not rewrite either report.

## Finding and probe catalog

`catalog.json` is the checked routing index for every immutable finding ID and
the active M7D save requirements.
It distinguishes resolved findings, superseded process blockers, archival
blockers, retained M7A requirements, active M7B requirements, and superseded
probes. The validator checks
that every finding in every report has exactly one status, every resolution
report is PASS, every cited decision and evidence path exists, and no active
finding is hidden in a summary.

Current superseded-history examples are explicitly retained:

- round-080 stale-cause precision expectation superseded by D-036;
- round-085 six-destination expectation superseded by D-040;
- round-087 unsealed Research fixture superseded by D-038;
- round-092 malformed duplicate-machine fixture superseded by D-040;
- pre-D-032 global-disclosure selectors retained as archival probes.

Do not delete or rewrite these probes. Do not run a superseded assertion as a
current acceptance requirement; use the catalog replacement evidence.

## Full-read triggers

Take the full plan/decisions/archive route if status fails, any source or
catalog mapping is missing or contradictory, the change crosses a product
milestone, the role is release verification, or the user explicitly requests
it. A stale routing map is not authority and must not be patched by inference.
