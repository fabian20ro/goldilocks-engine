# Candidate handoff — Milestone 7C Writing & Density Closure

Implementation base: `34c76e1a450075d3534efb5fe0dd48f8bd326054`.
Implementation candidate: `3076be34c2bae5ee2e56a761e81b5b7a9497a8ce` before
the final handoff-bookkeeping amend; the final candidate SHA is reported after
that amend.
Role: Implementer. This handoff makes no independent-verifier verdict or
commercial-release acceptance claim.

## Implemented behavior summary

- Added a pure `src/ui/editorial.ts` presenter seam for Build, Jobs, Career,
  Upgrades, Inspect, Research, Lab, and World. Each live summary states current
  state, consequence, cost/risk, one next action, and the existing Details /
  evidence boundary.
- Added compact `DecisionSummary` and `LockedState` presentation primitives.
  Research, Lab, and World locked surfaces now state requirement, progress, and
  unlock action. Existing failure copy remains player-directed and preserves
  work/recovery context.
- Removed the duplicate Jobs first-session guide mount. Global and onboarding
  chrome now carries editorial data attributes without adding a second action
  source or changing navigation, Worker commands, persistence, or input.
- Kept the expanded pipeline in normal document flow so the app scroll region
  remains the only vertical owner; retained the 44px and horizontal-overflow
  contracts.
- Extended the data-driven command-deck screenshot atlas and browser contract
  across all eight destinations, starter/expanded states, both portrait
  widths, and the existing scale/reduced-motion/touch/reload/offline neighbors.
- Formalized D-044 profiles in `scripts/verify`: development runs the local
  candidate lanes and records the parked M7B commercial gate explicitly;
  default/full-release retains WebKit/native/performance invocation and strict
  BLOCKED propagation.
- Routed D-044/D-045 through CURRENT_SCOPE, RELEASE_ACCEPTANCE, the
  verification index/catalog, and this handoff. Immutable reports and
  `plan.md` were not edited.

## Plan requirements covered

- D-044: unavailable physical/native/WebKit M7B evidence remains a named
  commercial-release gate; no tooling or BLOCKED evidence is relabeled or
  omitted. Development-candidate evidence is explicitly not release evidence.
- D-045: presentation-only editorial contract for all eight destinations and
  global/onboarding chrome; exact accounting/evidence stays in existing
  Details, Inspect, accounting, and ledger surfaces; no speculative controls,
  duplicate onboarding, engine/Worker/schema/economy/balance/navigation/PWA
  changes.
- M7C Rule of Three: normal presenter output; locked/malformed/failure/recovery
  boundaries; starter/expanded/reload/offline/reduced-motion/onboarding
  lifecycle neighbors.
- Portrait contract: 320×693 and 393×742, raw and scaled browser coverage,
  44 CSS-pixel controls, no document horizontal overflow, no nested expanded
  pipeline scroll trap, and reachable primary actions.

## Verifier findings resolved / retained

- No immutable verifier report was edited and no M7B finding is claimed closed.
  Round 109 remains the honest BLOCKED infrastructure report; active M7B
  catalog groups and tooling remain parked under D-044.
- New candidate-owned regression coverage covers M7C profile parsing and the
  editorial Rule of Three. Existing verifier suites remain in the canonical
  lane; the eight strict-locator collisions found during independent full
  browser rerun were repaired by avoiding duplicate exact copy in summaries.

## Setup, startup, and verification commands

All dependency and browser caches are ignored and repository-local:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
./scripts/setup
./scripts/run
```

`./scripts/run` starts Vite at `http://127.0.0.1:4173` with strict port
ownership; Playwright-managed servers clean up after each run. The pinned
browser package is a project dependency. Use the package-manager commands:

```sh
npm run test:e2e
npm run test:e2e:pages
npm run test:e2e:webkit
npm run test:native-a11y
npm run collect:mobile-performance
```

Candidate profile and evidence directory used for this handoff:

```sh
VERIFY_EVIDENCE_DIR=.cache/verification/round-110-development-final2 \
  ./scripts/verify --profile=development
```

## Focused evidence executed

```sh
npm run format:check
npm run lint
npm run typecheck
npm run validate:verification-catalog
npx vitest run src/ui/editorial.test.ts src/test/verificationProfiles.test.ts --coverage=false
npx vitest run src/test/agentWorkflowRouting.test.ts src/test/verifierRound083Workflow.test.ts src/ui/researchView.test.tsx --coverage=false
npm run test:e2e -- tests/e2e/command-deck.spec.ts
npm run test:e2e -- tests/e2e/first-session.spec.ts
npm run test:e2e -- tests/e2e/game.spec.ts tests/e2e/research.spec.ts \
  tests/e2e/round-009-usability.spec.ts tests/e2e/round-012-upgrades.spec.ts \
  tests/e2e/round-015-expansion.spec.ts
```

The final development profile completed catalog, setup, format, lint,
typecheck, 319 unit tests, all balance lanes, build, production audit, root
Chromium/PWA `238 passed`, explicit `m7b-commercial-gate=blocked`, and Pages
`2 passed`; exit `0`. The full browser run needed host-authorized Chromium
launch because the managed sandbox otherwise returned macOS MachPort launch
permission errors. The atlas images inspected from the final run included:

```text
test-results/command-deck/320-starter-build.png
test-results/command-deck/393-starter-research.png
test-results/command-deck/320-expanded-world.png
test-results/command-deck/393-expanded-jobs.png
```

## Important architectural decisions

- Presenters are pure reads of existing engine/catalog/formatting helpers;
  they cannot dispatch, persist, navigate, alter balance, or manufacture a
  control. Summary text avoids duplicating exact source-of-truth values that
  existing tests and Details surfaces already expose.
- `LockedState` centralizes requirement/progress/action wording while allowing
  the existing Research lock sentence to remain stable for screen-reader and
  regression consumers.
- The finite first-session guide remains the only onboarding action owner;
  destination summaries point at it rather than repeating the action.
- CSS changes remove only the nested vertical pipeline owner. No simulation,
  Worker, schema, economy, PWA, persistence, navigation, threat-model, or
  out-of-scope feature boundary changed.

## Known limitations and risks

- Commercial release remains BLOCKED until the physical/native/WebKit M7B
  evidence is available: VoiceOver/TalkBack speech, unlocked physical Android,
  physical battery/thermal, authenticated frozen baseline, and the known
  WebKit offline top-level reload evidence. Round 109 and all M7B tooling are
  retained as the source of that gate.
- `./scripts/verify --profile=full-release` (also the no-argument default) was
  not rerun in this candidate because immutable round-109 full-gate evidence
  already records the same unavailable infrastructure; the script still
  invokes every M7B lane and strictly propagates BLOCKED/FAILED outcomes.
- The development profile is candidate evidence only. A fresh independent
  Verifier must assess this exact committed SHA; no PASS or release claim is
  issued here.

## Checks not run / final evidence

- Full-release/default profile: intentionally not run; reason above. Run it
  only when the required M7B infrastructure is available.
- WebKit, native accessibility, and measured-device lanes: not run in the
  development profile because D-044 parks them as the explicit commercial
  gate; their commands remain wired in full-release.
- Native device speech, physical performance/battery/thermal, and hosted
  exact-SHA deployment: unavailable/out of Implementer scope.
- Final canonical development evidence:
  `.cache/verification/round-110-development-final2/summary.txt`.
