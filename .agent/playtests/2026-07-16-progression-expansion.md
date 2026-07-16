# Progression and expansion feedback — 2026-07-16

## Build context

- Feedback date: 2026-07-16.
- Deployed candidate available during the reported play: `a3c1c32ef2fbfc5932f773ebf249d6cae9bf8cc3`.
- URL: <https://fabian20ro.github.io/goldlocks-engine/>.
- Device, exact duration, timestamps, and uninterrupted-session status: not supplied.
- The user explicitly declined structured telemetry and prefers casual issue reports.

## Reported observation

- The purchasing build is enjoyable enough to continue.
- The interface feels cramped, especially when several systems compete for the portrait screen.
- Duplicate in-page navigation and bottom tabs make the route model harder to understand.
- Four available jobs constrain experimentation; the expected next step is a staged catalogue of at least eight workloads.
- The player expects a purchasable workstation expansion that turns the starter three-process-stage pipeline into one pipeline with at least six usable process positions.
- Queued work cannot currently be cleared, and aggregate queue semantics do not preserve which workload and quote were accepted.
- Simulated time feels slow; fixed 64× fast-forward is requested both for play and reproducible verification.
- The user reports owning all displayed upgrades before four displayed/in-game hours, so present progression exhausts too quickly.
- Strongest future interests: longer pipeline, researcher unlocks, newer models, and a hype economy. Only the bounded workstation/workload/economy slice below is authorized now.

## Accepted implementation response

- Add a durable, exact-once Workstation Expansion purchase that expands the single active pipeline from three to at least six process positions without auto-filling them.
- Stage at least eight mechanically distinct workloads, with four initially available and explicit deterministic requirements/progress for later unlocks.
- Replace the aggregate queue with per-task workload identity, a locked queue-time gross quote, actual configuration-dependent cost, settlement net, and a clear-waiting-only action.
- Add deterministic bounded demand: successful completions saturate that workload, future quotes decline, other workloads become relatively attractive, and demand recovers with simulated time.
- Add fixed 1×/4×/16×/64× time, bottom-navigation-only global routing, and progressive disclosure that preserves touch target and text-size requirements.
- Measure deterministic pacing and catalogue exhaustion in automated balance gates. Do not claim that this substitutes for human play.

## Explicitly deferred

- Researchers or other characters.
- Hype, fear, attention, or reputation-economy expansion.
- Transient model/vendor brands.
- Multiple or parallel independent pipelines.
- Narrative, startup, labor, or later-milestone systems.

## Human gate status

The user accepts the existing Pipeline Toy as good enough to direct this bounded progression experiment without structured telemetry. This owner direction waives B-005 as an automatic blocker for the authorized slice; it does not claim that either original Milestone 0 or Milestone 1 human exit gate was measured or passed. The original thirty-minute gate text and evidence history remain intact. Casual feedback remains valid input for later iteration.
