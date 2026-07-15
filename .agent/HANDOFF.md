# Round 001 implementation handoff

## Implemented behavior summary

Gate-ready Milestone 0 numeric prototype and Milestone 1 portrait Pipeline Toy:

- Deterministic, headless TypeScript simulation with seeded RNG, explicit command ordering, versioned state, bounded causal ledger, resource invariants, queues, job completion/failure, memory pressure, thermal throttling, latency, throughput, quality uncertainty, reliability, observability, and failure propagation.
- Three hardware configurations and four representative workloads with real tradeoffs. Upgrades add capital, energy, heat, reliability, and maintenance constraints.
- Headless balance runner covering time, money, the three early funding paths, one competition, one product, one aggregate creator event, one aggregate research project, three prototype outcomes, path viability, non-dominance, and upgrade constraints.
- Portrait React PWA with one objective, one dominant bottleneck, five primary resources, one warning, and one constrained active pipeline.
- Mouse/touch pointer drag and accessible tap-then-snap placement; compatible process-module swapping/reordering; source/sink replacement; defined shadow-evaluation split/merge; pause; job queueing; compute/memory policies; hardware purchase/selection.
- Animated flows, bottleneck queue badge, memory/thermal warnings, malformed-output propagation, fault origin/downstream rejection, predicted-versus-observed inspector, baseline deltas, causal event log, and local player-authored configuration presets.
- Installable portrait manifest and generated production asset manifest. The service worker precaches the exact packaged JS/CSS/worker assets and supports offline reload.

## Plan requirements covered

### Milestone 0 — Numeric prototype

- Time and money: `numericPrototype.ts`.
- Three hardware choices: bedroom CPU, used 12 GB GPU, 24 GB workstation.
- Four workloads: interactive chat, batch classification, long document, competition training.
- One competition, one product, one aggregate creator event, one aggregate research project, three prototype outcomes.
- Automated validation for competition-first, product-first, and creator-first viability; distinct strategy strengths; and a new cost/energy constraint for every compute upgrade.

### Milestone 1 — Pipeline Toy

- Portrait constrained vertical pipeline; compatible drag/snap, tap/snap, replacement, reordering, and one defined branch.
- Animated flow, queue visibility, memory and thermal limits, latency, throughput, reliability, malformed-output failure propagation, and configuration comparison.
- Four workload stress profiles, three hardware profiles, bounded compute/memory allocation, pause, queueing, and live deterministic simulation in a Web Worker.
- Accessibility: portrait-only operation, no required zoom/rotation, minimum 44 px visible buttons at 320/393 px, screen-reader labels, keyboard/tap alternatives, color-independent text/status markers, scalable text, reduced-motion control/media preference, and no time-critical tapping.
- Hermetic browser verification covers 320/393 px layouts, pointer drag/reorder, touch-friendly tap placement, branching, queueing, failure/recovery, preset persistence/reload, 150% text scaling, reduced motion, and packaged offline reload.

Milestones 2–6 are intentionally not implemented. The Pipeline Toy human exit gate has not been demonstrated; later Bedroom, evaluation/replay, research, creator/hype/fear, and local-laboratory systems remain out of scope until it is.

## Verifier findings resolved

None. This is round 001 and `.agent/verification/` contained no prior reports.

## Reproducible setup, startup, and verification

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
# Locked dependencies + repository-local Chromium
./scripts/setup

# Deterministic loopback development server: http://127.0.0.1:4173
./scripts/run

# Full clean check: npm ci, browser install, format, lint, typecheck,
# unit/property tests, balance run, package build, packaged-PWA E2E
./scripts/verify

# Packaged-PWA end-to-end check alone
npm run test:e2e
```

Dependency downloads use `.cache/npm`; browser downloads use `.cache/ms-playwright`. Both are repository-local and ignored. `npm run test:e2e` uses `./scripts/run-e2e`, which builds and serves the production PWA on `127.0.0.1:4173`, waits for readiness, and is cleaned up by Playwright.

## Important architectural decisions

- UI sends typed commands to a deterministic simulation isolated from React in a dedicated Web Worker.
- The update order is command application, metric/resource resolution, job progress, deterministic outcome resolution, then bounded causal-event append/recalculation.
- React local state is sufficient for the one-screen toy; Zustand/XState/PixiJS/Dexie are deferred until a gate-approved need exists.
- Three compatible process positions make ordering a decision: out-of-order roles produce explicit quality/reliability/throughput penalties and warnings.
- Exact production asset filenames are emitted at build time and precached at service-worker install, avoiding dev-cache and conditional-request races.

## Known limitations and risks

- **Gate blocker:** no human evidence yet shows voluntary pipeline reconfiguration for at least 30 minutes or that players can explain the tradeoffs. The candidate is ready for that playtest, but cannot authorize Milestone 2.
- The balance prototype is an automated viability screen, not evidence that the economy is enjoyable. Human judgment remains required by Milestone 0 and Milestone 1 exit gates.
- Browser checks use Chromium. Physical-device battery/thermal behavior and optional haptics/audio are not evaluated in this gated candidate.
- Presets persist locally; complete run save/load and offline policy progression belong to Milestone 2 and are intentionally absent.
- This environment required the repository-local Chromium launch outside its restrictive macOS agent sandbox. Ordinary local/CI shells run the documented command directly.

## Checks not run

- `./scripts/verify` did not complete as one wrapper invocation because its required out-of-sandbox approval was interrupted before the command started. Its constituent commands were exercised separately: setup succeeded; formatting, lint, typecheck, 18 unit/property tests with coverage, balance validation, audit (0 vulnerabilities), and production build succeeded; the complete 8-test Playwright suite passed; after the final asset-manifest cache correction, production build/typecheck and the focused offline Playwright regression passed.
- 30-minute voluntary human Pipeline Toy playtest: no participant/evidence supplied.
- Physical mobile-device battery and thermal profiling: no device infrastructure supplied; browser CPU behavior is covered only indirectly by deterministic single-worker tests and short E2E sessions.
- Milestone 2–6 acceptance checks: prohibited until the Pipeline Toy gate passes.

## Exact input required to clear the gate

Provide a dated playtest record naming the tested candidate SHA and device(s), with at least one uninterrupted 30-minute session where participants voluntarily reconfigured the pipeline. Record reconfiguration count/timestamps, whether prompting was required, and each participant's explanation of at least two observed tradeoffs (for example quality versus throughput, memory versus capability, evidence versus speed, or compute versus heat). A defensible gate decision must conclude whether the Pipeline Toy should proceed or be redesigned.
