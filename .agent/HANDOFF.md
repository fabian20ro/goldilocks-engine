# Round 005 implementation handoff

## Implemented behavior summary

Gate-ready Milestone 0 numeric prototype and Milestone 1 portrait Pipeline Toy:

- Deterministic, headless TypeScript simulation with seeded RNG, explicit command ordering, versioned state, bounded causal ledger, resource invariants, queues, job completion/failure, memory pressure, thermal throttling, latency, throughput, quality uncertainty, reliability, observability, and failure propagation.
- Drained queues discard unused processing capacity; retained carry is limited to fractional work on a non-empty queue. Bounded event history uses a monotonic sequence, so every retained causal event has a stable unique identifier.
- Three hardware configurations and four representative workloads with real tradeoffs. Upgrades add capital, energy, heat, reliability, and maintenance constraints.
- Headless balance runner covering time, money, the three early funding paths, one competition, one product, one aggregate creator event, one aggregate research project, three prototype outcomes, path viability, non-dominance, and upgrade constraints.
- Portrait React PWA with one objective, one dominant bottleneck, five primary resources, one warning, and one constrained active pipeline.
- Mouse and real touch pointer drag plus accessible tap-then-snap placement; native horizontal touch panning through the overflowing module drawer; compatible process-module swapping/reordering; source/sink replacement; defined shadow-evaluation split/merge; pause; job queueing; compute/memory policies; hardware purchase/selection.
- Animated flows, exact-stage bottleneck queue badge, memory/thermal warnings, malformed-output propagation, fault origin/downstream rejection, predicted-versus-observed inspector, baseline deltas, causal event log, and runtime-validated local player-authored configuration presets.
- Narrow portrait layouts reflow multi-column cards, actions, module libraries, and comparison metrics instead of shrinking text; Build, Jobs, and Inspect remain within 320 CSS px at 200% text size with 44 px minimum visible controls.
- Compute and memory allocation sliders expose 44 px minimum touch targets. The in-app motion control disables all descendant CSS animations independently of the operating-system preference while retaining static state cues.
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
- Hermetic browser verification covers 320/393 px layouts, every visible interactive target, native drawer panning from a module card, mouse and real touch drag/reorder, touch-friendly tap placement, exact bottleneck queue placement, branching, failure/recovery, valid and malformed preset persistence, 150% and 200% text scaling, OS and in-app reduced motion, and packaged offline reload.

Milestones 2–6 are intentionally not implemented. The Pipeline Toy human exit gate has not been demonstrated; later Bedroom, evaluation/replay, research, creator/hype/fear, and local-laboratory systems remain out of scope until it is.

## Verifier findings resolved

- **V-001:** queue processing now clears carry when no job remains, preventing later jobs from consuming idle capacity accumulated after a drained queue.
- **V-002:** schema version 2 adds a monotonic event sequence independent of bounded retained-ledger length; state validity also checks the ledger bound and unique identifiers.
- **V-003:** simulation metrics now identify the slot containing the actual limiting module, and the queue badge consumes that exact slot projection.
- **V-004:** persisted presets are accepted only when identifiers, ranges, slot order, catalog membership, and slot/module compatibility pass runtime validation; corrupt entries never cross the worker boundary.
- **V-005:** draggable module cards reserve touch gestures from browser panning, preserving pointer capture through a real touch drag and compatible-slot swap.
- **V-006:** the ≤350 px layout wraps headings/actions, stacks decision groups, bounds pipeline/library content, and reflows comparison rows; verifier coverage confirms every primary view has no horizontal document overflow and no visible control below 44 px at 320 px/200% text.
- **V-007:** `package.json` and the lockfile now declare `^20.19.0 || >=22.12.0`, exactly matching pinned Vite 8.1.4 instead of advertising unsupported Node 20.0–20.18.
- **V-008:** both resource-allocation range inputs now render at least 44 CSS px high, so the minimum 320 px viewport has no undersized visible interactive control.
- **V-009:** app-level reduced-motion state is projected on the root shell; its descendants and pseudo-elements receive no CSS animation and near-zero transition duration even when the OS preference is `no-preference`.
- **V-010:** drawer module cards now allow native horizontal panning while active-pipeline cards continue reserving touch gestures for custom drag/reorder; a real CDP touch swipe moves the 393 px drawer beyond its first screen, and active touch drag plus tap/snap remain covered.

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
- Simulation schema version 2 carries a monotonic causal-event sequence; the retained ledger remains capped at 80 events without identity reuse.
- Bottleneck diagnosis and the affected pipeline slot are calculated together in the deterministic simulation, keeping UI feedback aligned with active configuration constraints.
- React local state is sufficient for the one-screen toy; Zustand/XState/PixiJS/Dexie are deferred until a gate-approved need exists.
- Three compatible process positions make ordering a decision: out-of-order roles produce explicit quality/reliability/throughput penalties and warnings.
- Exact production asset filenames are emitted at build time and precached at service-worker install, avoiding dev-cache and conditional-request races.
- Responsive rules preserve scaled typography and touch-target size while progressively reflowing multi-column content at the minimum portrait width.
- One root motion-state projection governs flow, queue, status, and future descendant CSS motion, avoiding component-specific gaps in the visible control's promise.
- Touch-action is contextual: library cards expose native `pan-x` for drawer discovery, while active-pipeline cards retain `none` for deterministic two-axis pointer drag and capture.

## Known limitations and risks

- **Gate blocker:** no human evidence yet shows voluntary pipeline reconfiguration for at least 30 minutes or that players can explain the tradeoffs. The candidate is ready for that playtest, but cannot authorize Milestone 2.
- The balance prototype is an automated viability screen, not evidence that the economy is enjoyable. Human judgment remains required by Milestone 0 and Milestone 1 exit gates.
- Browser checks use Chromium. Physical-device battery/thermal behavior and optional haptics/audio are not evaluated in this gated candidate.
- Presets persist locally; complete run save/load and offline policy progression belong to Milestone 2 and are intentionally absent.
- This environment required the repository-local Chromium launch outside its restrictive macOS agent sandbox. Ordinary local/CI shells run the documented command directly.

## Checks not run

- `./scripts/verify` was not invoked as one long-running wrapper in this bounded role turn. Every exact constituent stage ran after a fresh successful `./scripts/setup`: format, lint, typecheck, 21 unit/property tests with coverage thresholds, balance validation, production build, and all 20 packaged-PWA Playwright cases passed. `./scripts/run` also reached ready state, returned HTTP 200 on loopback, and stopped on Ctrl-C. The approved Playwright command used the repository-local Chromium path required by the wrapper.
- 30-minute voluntary human Pipeline Toy playtest: no participant/evidence supplied.
- Physical mobile-device battery and thermal profiling: no device infrastructure supplied; browser CPU behavior is covered only indirectly by deterministic single-worker tests and short E2E sessions.
- Milestone 2–6 acceptance checks: prohibited until the Pipeline Toy gate passes.

## Exact input required to clear the gate

Provide a dated playtest record naming the tested candidate SHA and device(s), with at least one uninterrupted 30-minute session where participants voluntarily reconfigured the pipeline. Record reconfiguration count/timestamps, whether prompting was required, and each participant's explanation of at least two observed tradeoffs (for example quality versus throughput, memory versus capability, evidence versus speed, or compute versus heat). A defensible gate decision must conclude whether the Pipeline Toy should proceed or be redesigned.
