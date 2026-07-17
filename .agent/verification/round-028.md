# Verification round 028

Candidate SHA: b5db2f2278faabe3d76ff57066fee39bf88fd508

VERDICT: FAIL

## Scope and verdict basis

Applicable scope: D-001 through D-009, inherited Milestone 0–1 behavior,
owner-authorized Workstation Expansion I, the authorized D-009 governance
revision, and D-008 redeploy-safe PWA behavior at root and
\`/goldlocks-engine/\`.

Before any verifier write, \`git rev-parse HEAD\` returned the supplied
candidate SHA and \`git status --short\` was empty. This report and the
independent regression are the only verifier-authored changes.

The candidate's PWA update design uses the registration script URL's
\`build\` query as the controller identity. On a normal static host, a
registration created as \`sw.js?build=A\` can later fetch B bytes at that same
URL after deployment. The active worker's embedded identity/cache is B, but
the browser continues to expose controller \`scriptURL\` query A. The client
therefore sees no controller-ID change, does not execute its single recovery
reload, and remains mixed: app/controller A, worker message/cache B.

This is a correctable production defect. D-008 requires online controlled
clients to converge through an event-driven reload and prohibits indefinitely
mixed app/worker state. D-009 still requires a fresh independent PASS and
exact-SHA deployment before release; it does not waive the PWA contract.

## Environment and setup

- Host: macOS Darwin 25.5.0, arm64; Node v26.5.0; npm 11.17.0.
- Browser: repository-pinned \`@playwright/test\` 1.61.1 and ignored
  \`.cache/ms-playwright\` Chromium.
- Canonical setup is invoked by \`./scripts/verify\`: locked \`npm ci\` and
  repository-local browser install completed.
- Sandboxed Chromium could not create its macOS Mach port before page creation.
  The same pinned commands were then run outside that filesystem sandbox.
  Browser verification was not skipped.
- Exact candidate CI: [Verify run 29590752641](https://github.com/fabian20ro/goldlocks-engine/actions/runs/29590752641)
  failed; [Deploy GitHub Pages run 29590752889](https://github.com/fabian20ro/goldlocks-engine/actions/runs/29590752889)
  succeeded. Successful deployment does not overcome failed exact-SHA
  verification.
- Verifier artifacts: this immutable report and
  \`tests/e2e/verifier-round-028.spec.ts\`. No production code, plan,
  decision record, handoff, prior report, or implementation-authored test was
  changed by the verifier.

## Commands executed and results

| Command or probe                                                                                                                                           | Result                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \`git rev-parse HEAD\`; \`git status --short\` before verifier writes                                                                                      | PASS. Candidate exactly matched supplied SHA; clean start.                                                                                                                                                                     |
| Sandboxed \`./scripts/verify\`                                                                                                                             | Static/unit/balance/build stages completed; Chromium failed before page creation with managed macOS Mach-port denial. The aggregate script still ran both root and Pages browser phases.                                       |
| Host \`./scripts/verify\`                                                                                                                                  | FAIL. Format, lint, typecheck, 18 files / 87 unit-property tests, numeric prototype, 20,001-seed upgrade sweep, 41-seed progression sweep, and root build passed. Root browser: 82 passed / 1 failed. Pages browser: 2 passed. |
| \`npm run test:e2e -- tests/e2e/pwa-update.spec.ts --grep "root B activation never evicts" --repeat-each=10 --reporter=line\`                              | FAIL, 6/10. Each failure leaves Pages app/controller URL identity A while worker message/cache are B after root B activation.                                                                                                  |
| \`npm run test:e2e -- tests/e2e/verifier-round-028.spec.ts --reporter=line\`                                                                               | FAIL, 2/2: independent root and Pages stale-registration probes both produce A app/controller plus B worker/cache.                                                                                                             |
| \`npm run test:e2e -- tests/e2e/verifier-round-028.spec.ts --grep "pages client" --reporter=line\`                                                         | FAIL, 1/1. Confirms the Pages case independently.                                                                                                                                                                              |
| \`npm run build:pages\`                                                                                                                                    | PASS. Produced a Pages-scoped manifest, assets, cache identity, and worker. Root production build passed in canonical verification.                                                                                            |
| \`npx prettier --check tests/e2e/verifier-round-028.spec.ts\`; \`npx eslint tests/e2e/verifier-round-028.spec.ts --max-warnings 0\`; \`npm run typecheck\` | PASS. Verifier regression is format/lint/type clean.                                                                                                                                                                           |
| Exact CI log inspection: \`gh run view 29590752641 --repo fabian20ro/goldlocks-engine --log-failed\`                                                       | FAIL evidence. Ubuntu canonical verification records the same root/Pages A-controller/B-cache split.                                                                                                                           |
| \`./scripts/run-e2e\` plus repository-pinned Playwright inspection at 320x568 and 393x667                                                                  | PASS visual smoke check: Jobs, bottom navigation, Help/Animations, resources, and time controls visible without observed overlap; console/page errors zero. Server and browser were stopped cleanly.                           |

## Requirement evidence matrix

| Applicable requirement                                                                                                            | Status                                      | Evidence                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorized D-009 governance revision; no new content authorization                                                                | PASS                                        | Candidate changes plan/decision wording to automated evidence while preserving scope boundaries and exact-SHA independent verification. User authorization supplied for this revision.                           |
| Plan 2.3/2.4 quality and release evidence; no claim that historical manual gates passed                                           | PASS for governance wording                 | D-009 and plan text retain historical note, optional-feedback policy, automated acceptance, fresh verifier, and exact deployment condition. Current candidate cannot satisfy release condition because of V-034. |
| D-001/D-006/D-007 bounded current product scope; deferred future content remains excluded                                         | PASS                                        | Candidate diff is governance/PWA/update tooling only; no research, labor, hype/fear, creator, or later-release systems added.                                                                                    |
| Determinism, numeric integrity, transactions, migration, recovery, and save preservation predicates                               | PASS for exercised current scope            | Canonical 87 unit-property tests, numeric prototype, 20,001-seed upgrade sweep, and 41-seed progression sweep passed. Retained browser recovery/persistence tests ran.                                           |
| First-session/tutor, purchase, ownership, workstation capacity, workloads, demand, quote/queue, clear, time-equivalence behavior  | PASS for automated current-scope predicates | Canonical root browser suite passed all retained non-PWA cases; deterministic sweeps passed.                                                                                                                     |
| Portrait, 320/393 layouts, 200% text, 44px controls, touch/drag, keyboard, reduced motion, accessibility, reload/offline behavior | PASS for exercised current-scope predicates | Repository-pinned root/pages browser suites plus independent 320x568 and 393x667 visual inspection; no browser console/page error observed.                                                                      |
| Root and Pages PWA manifests, relative scope/start URLs, installability, deterministic build/cache IDs                            | PASS locally                                | Root build and \`npm run build:pages\` passed; canonical PWA cases exercised root/Pages installability and scope-specific cache names.                                                                           |
| D-008 strict manifest validation, candidate-cache transaction, failed deployment rollback, old-cache scope isolation              | PASS in tested fault paths                  | Canonical PWA cases covering unavailable, omitted/null, duplicate, cross-origin/out-of-scope manifests and required-response failure passed. Existing root/Pages cache namespace separation remains present.     |
| D-008 online A-to-B update convergence, controller/app/worker/cache identity agreement, reload-once, B offline reload             | FAIL — V-034                                | Canonical suite, exact CI, repeated isolation probe, and verifier's independent static-host regression expose the same mixed identity. Offline B recovery cannot be accepted from a state that never converged.  |
| D-008 sibling root/Pages isolation and persistence across activation/restart                                                      | FAIL overall — V-034                        | Cache namespace itself is scope-specific, but root activation's stale identity path leaves the independently installed Pages client in a mixed A/B state.                                                        |
| Reproducible setup, startup, pinned browser, server readiness/cleanup, canonical complete check                                   | FAIL overall — V-034                        | Setup/start/cleanup work; canonical check is reproducible and correctly fails the candidate's material PWA behavior. Exact CI also fails.                                                                        |
| D-009 release/deployment condition                                                                                                | FAIL dependent on V-034                     | Deploy run succeeded, but a fresh independent PASS and passing exact-SHA Verify run are both required before release. Neither is available.                                                                      |

## Findings

### V-034 — Static-host redeploy accepts B worker bytes under stale A controller identity

- Severity: High.
- Related plan requirement: D-008 integrity/update and failure/offline
  contracts; plan Sections 2.4, 23.1, 27, and Milestone browser acceptance;
  D-009 exact-SHA release evidence.
- Expected behavior: An online controlled root or Pages client updated from A
  to B must make one event-driven reload and converge app version, controller
  identity, worker-message identity, scoped cache, and reload marker to B.
  The complete B shell must then reload offline.
- Actual behavior: With an already-open A registration, a static server serves
  B \`sw.js\` bytes for the retained request URL \`sw.js?build=A\`. B's worker
  activates, claims the client, reports B, and deletes A's scoped cache. The
  browser still reports controller URL query A. \`src/main.tsx\` treats that
  query as the controller build (lines 10-18, 105-131), observes no change,
  and does not reload. The page stays app/controller A while its worker
  message/cache are B.
- Exact reproduction procedure:

      ./scripts/setup
      npm run test:e2e -- tests/e2e/verifier-round-028.spec.ts --reporter=line

  Run the pinned command outside the managed macOS filesystem sandbox after
  its documented pre-page Mach-port denial. The verifier fixture uses
  \`127.0.0.1:4183\`, serves real root/Pages A/B production builds, switches
  deployment by pathname while intentionally retaining worker query URLs, and
  invokes the ordinary \`registration.update()\` path used by the application.

- Concrete evidence:
  - Root: expected B \`3c30f684347fe2dba27f\`; actual app/controller
    \`33f879ce96255ce19bf5\`, worker message/cache
    \`3c30f684347fe2dba27f\`, reload marker absent.
  - Pages: expected B \`09c6f3e498db76c49d55\`; actual app/controller
    \`229e26f309d5b4226c64\`, worker message/cache
    \`09c6f3e498db76c49d55\`, reload marker absent.
  - Candidate canonical failure at
    \`tests/e2e/pwa-update.spec.ts:642\` shows the same Pages A
    app/controller with Pages B cache after root B activation. It reproduced
    6 of 10 consecutive runs.
  - Exact Ubuntu CI [run 29590752641](https://github.com/fabian20ro/goldlocks-engine/actions/runs/29590752641)
    has the same failed canonical test; it is not a local-only assertion.
- Blocks PASS: yes.

## Unverified areas

- Physical-device battery/thermal behavior, non-Chromium engines, platform
  screen-reader output, haptics, and audio were unavailable.
- No user-duration, recording, telemetry, or structured manual session was
  performed; D-009 makes these optional feedback rather than a release gate.
- Live deployed GitHub Pages interaction was not manually exercised. Exact-SHA
  CI and static-host browser fixtures are stronger reproducible evidence for
  this defect; deploy success alone does not test update convergence.
- B offline reload after a successful identity-converged B update is not
  independently accepted because V-034 prevents that precondition in both
  verifier scope probes.

## Residual risks

- A normal static deployment can strand an installed player with a stale A
  page/controller URL identity while B cache/worker code owns requests. That
  can cause inconsistent UI, missed reload, and unsafe offline/resume
  expectations.
- Repair must use a controller identity that cannot be forged by stale request
  URL query alone, then pass root and Pages static-host A-to-B tests, repeated
  stale-registration updates, save preservation, offline B reload, malformed
  B rollback, and exact-SHA CI.
- Do not release or describe candidate b5db2f2 as accepted until a fresh
  verifier evaluates a repaired immutable candidate and returns a passing
  result.
