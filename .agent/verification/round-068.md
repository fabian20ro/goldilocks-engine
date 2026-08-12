# Verification round 068 — Phase 4 cross-surface currency disclosure

Candidate SHA: `8f76bd91b7e5d37c109c16dcde903a56b4d39cff`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before creating any verifier artifact:
  `8f76bd91b7e5d37c109c16dcde903a56b4d39cff`. It exactly matched the
  Orchestrator-supplied candidate. Initial `git status --short` was empty.
- Independently read `AGENTS.md`, the complete `plan.md`,
  `.codex/agents/verifier.toml`, the complete `.agent/DECISIONS.md`, handoff,
  candidate diff/source, and immutable verification history. Handoff and
  candidate-authored tests were navigation hints, not proof.
- Applicable checklist: released Bedroom scope and exclusions; §§2.4, 3–11,
  19–20.7, 23–27, 29, 34–35; D-004 and D-006–D-030. In particular, D-030
  requires independent compact values to default to cents, non-additive quote
  range endpoints to format independently, explicitly additive equations to
  share their own precision only, and Details/Inspect/ledger disclosures to
  remain mill-exact. Research and later expansion systems remain deferred.
- Candidate source changes are confined to compact-currency UI rendering and
  coverage. This verifier added a pinned-Playwright adversarial probe and this
  report; no production code, prior report, or implementation test was changed.

## Environment and setup

- macOS 26.6.1 arm64; Node v26.7.0; npm 11.19.0; Git 2.50.1; repository-pinned
  Playwright 1.61.1.
- `./scripts/setup` completed with repository-local ignored npm/browser caches.
  `npm audit --omit=dev --audit-level=high` reports `found 0 vulnerabilities`.
- Chromium cannot launch in the workspace sandbox because macOS blocks Mach-port
  rendezvous registration. Scoped host runs used the pinned repository browser;
  browser verification was not silently skipped. Temporary root previews used
  only `127.0.0.1:5073` and `127.0.0.1:5074`, reached readiness before each
  probe, then were terminated; both ports returned connection-refused after
  cleanup.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; candidate source/diff audit; `git diff --check` | Pass: candidate exact, initial worktree clean, narrow expected source surface, no whitespace error. |
| `./scripts/setup` | Pass: reproducible dependency/browser setup completed. |
| `E2E_PORT=5068 ./scripts/verify` | Static canonical lanes pass: format, lint, typecheck, 42 test files / 199 unit-property tests, deterministic balance. Browser launch is blocked only by the documented sandbox Mach-port limitation. |
| Host-scoped `E2E_PORT=5070 ./scripts/verify` | Pass: canonical browser run completed; Playwright final status `passed` with no failed tests. |
| Host-scoped `E2E_PORT=5071 npm run test:e2e -- --reporter=dot` | Pass: full pinned-browser suite scheduled 201 tests and final Playwright status was `passed`. |
| Host-scoped `E2E_PORT=5072 npm run test:e2e:pages -- --reporter=dot` | Pass: 2/2 Pages-scope tests; Worker-backed offline reload and foreign-cache preservation. |
| Fresh root preview; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5073 OUTPUT_DIR=test-results/round-068-retained-r064 node .agent/verification/round-064-adversarial.mjs` | Pass: retained independent five-tab matrix emitted all 24 320/393 starter/expanded and 200% captures; interaction, focus, scroll, reduced-motion, root PWA/offline, and durable-placement assertions had no findings. Original-resolution expanded 393 px images for Build, Jobs, Career, Upgrades, and Inspect were inspected. |
| Fresh root preview; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5073 OUTPUT_DIR=output/playwright/round-068-retained-r067 node .agent/verification/round-067-adversarial.mjs` | Pass: immutable successor probe reports no findings. It directly confirms the prior V-068–V-070 Career, failed-card, Queue 10 endpoint, and additive-equation repairs. |
| Fresh root build/preview at `127.0.0.1:5074`; `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright BASE_URL=http://127.0.0.1:5074 OUTPUT_DIR=output/playwright/round-068-adversarial node .agent/verification/round-068-adversarial.mjs` | Fail: three deterministic currency-disclosure assertions in V-071. Jobs selected card `$0.00`, Jobs Details `$0.000`, persistence reload, and absence of browser errors pass within the same probe. Screenshots retained under ignored `output/playwright/round-068-adversarial/`. |
| `node --check .agent/verification/round-068-adversarial.mjs`; `npx prettier --check .agent/verification/round-068-adversarial.mjs`; `npx eslint --no-ignore .agent/verification/round-068-adversarial.mjs --max-warnings 0` | Pass. |
| `npm audit --omit=dev --audit-level=high` | Pass: 0 production vulnerabilities. |

## Requirement matrix

| Applicable plan / decision requirement | Independent evidence | Result |
| --- | --- | --- |
| Authorized Bedroom release scope; defer Research, creator, fear, workforce, startup, laboratory, multipipeline, and narrative work | Source/diff audit; candidate changes only Phase 4 presentation. Canonical static and browser suites remain green. | Pass. |
| Reproducible setup, deterministic browser startup, format/lint/types, unit/property/scenario/balance checks, packaging/browser tooling | `./scripts/setup`; canonical static lanes; host canonical `./scripts/verify`; full root browser suite; Pages lane; pinned local browser/cache. | Pass. |
| Retained numeric, deterministic time/update order, versioned save/migration, Worker isolation, queue-time quote, failure/recovery, ledger, content and accessibility contracts (Milestones 0–3.6; §§23–27) | Candidate does not alter engine/Worker/schema/PWA contracts; canonical 199 unit-property tests, balance lane, root and Pages browser suites. Fresh failed-job settlement and reload probe additionally exercises a current UI-to-persisted-state path. | Pass for changed-surface regression. |
| Career ownership, validation, atomic evening/retry, route bounds, persistence/reload, Details/completion/Inspect (20.7 Phases 0–2; D-019–D-025) | Immutable current-candidate r067 probe cleanly starts Career, verifies Cash `$0.00` / Savings `$3.00`, route-specific Freelance terms, mill-exact Details, completion, and Inspect. Canonical coverage passes. | Pass, except the distinct failed-job Inspect exact-disclosure defect below. |
| Stage ordering, compact catalogue, target/replacement actions, selected-stage status, Details, portrait/touch/keyboard geometry (20.7 Phase 3; D-027–D-029) | Current r064 320/393 starter/expanded five-tab matrix; placement/move/replace/bypass/cancel; 200% text; focus restoration; bottom-tab scroll; reduced-motion; visual inspection. | Pass. |
| Compact-money policy: independent summaries cents by default and self-promote only when their own value needs mills (20.7 Phase 4; D-030) | Fresh verifier Playwright probe observes a cents-exact $0.75 action rendered as `$0.750`, and a compact $0 warning rendered as `$0`. | Fail: V-071. |
| Non-additive Queue 10 range: endpoints independently compact; no precision borrowed from undisplayed quotes (D-030) | Immutable current-candidate r067 probe clean: end values stay independently compact while intermediary locked quotes may require mills. | Pass; V-070 resolved. |
| Additive settlement/evening equation: related displayed terms promote together; unrelated Cash/Savings/lifetime remain independent (D-030) | r067 cleanly confirms Career one-hour Freelance equation `$2.276`, `$0.098`, `$0.012`, `$2.166` and Jobs settlement own equation; quick resources independent. | Pass; V-068 resolved. |
| Jobs failed payout card, Details, Queue 10, settlement and exact disclosure (20.7 Phase 4; D-030) | Fresh V-071 probe confirms selected card `$0.00`, Details `$0.000`, failed settlement persistence/reload, and no page/console errors. Same run exposes raw non-exact failed payout and accounting values in Inspect ledger. | Fail only for exact Inspect ledger disclosure: V-071. V-069 resolved. |
| Shared five-tab command deck: glyph/status/card/warning language, Details, focus/scroll, reduced motion, Inspect diagnostic priority | r064 current-candidate matrix plus full canonical browser suite; original-resolution five-tab 393 px visual inspection. Currency policy is a visible cross-surface exception. | Fail: V-071. |
| Portrait visual matrix: five tabs × starter/expanded × 320/393 and 200% text | r064 generated 24 current-candidate captures; all assertions passed; five expanded 393 px images visually inspected. | Pass. |
| Persistence, restart/resume, offline/PWA root and Pages scope, malformed-state/failure recovery | r064 root persistent placement/offline reload, Pages 2/2, canonical root suite, V-071 failed-settlement reload. | Pass. |
| Security boundary and production dependency audit | No runtime security-surface candidate changes; `npm audit --omit=dev --audit-level=high`: zero vulnerabilities. | Pass. |
| Startup readiness and process cleanup | Fresh root previews reached app readiness; verifier sent termination and confirmed both exact loopback ports closed. | Pass. |

## Findings

### V-071 — Currency policy is bypassed in a compact Career action, compact Build warning, and exact Inspect ledger

- Severity: Medium.
- Related requirement: plan §20.7 Phase 4; D-030 shared currency presentation
  policy and exact Details/Inspect/ledger disclosure.
- Expected:
  1. The cents-exact independent Career action cost is `Run private evaluation · $0.75`.
  2. The compact Build no-model warning says failed tasks pay `$0.00 gross`.
  3. The Inspect failed-settlement ledger is an exact disclosure, so it reports
     `$0.000 gross` and fixed three-decimal accounting values, consistent with
     the Jobs Details disclosure.
- Actual:
  1. Career renders `Run private evaluation · $0.750`.
  2. Build renders `accepted tasks fail and pay $0 gross`.
  3. After a supported no-model failure and reload, Inspect renders `Locked quote
     paid $0 gross; configured actual cost was $0.01. $0.00 was paid and $0.01
     remains unpaid because cash cannot go below $0.`
- Reproduction:
  1. Run `E2E_PORT=5074 ./scripts/run` (which builds and starts the deterministic
     loopback preview).
  2. Run the pinned-browser command in the evidence table with a fresh local
     storage context.
  3. The probe opens Career/Evaluation and reads the paid private-evaluation
     button; removes Basic Cleaner, Quantized Model, and Smoke Check with the
     supported bypass actions; expands the Build warning; queues one safe
     Interactive Chat job at 64×; waits for settlement; then reloads and reads
     Inspect's event log.
- Concrete evidence: probe JSON records all three mismatches; screenshots
  `career-private-evaluation-action.png`, `build-no-model-warning.png`, and
  `inspect-failed-settlement-ledger.png` were visually inspected. The same probe
  verifies that the nearby Jobs selected-card and Details surfaces correctly
  render `$0.00` and `$0.000`, respectively, proving this is cross-surface
  formatter bypass rather than an ambiguity in the compact policy. Candidate
  source includes raw literals in `src/ui/App.tsx` and engine-composed ledger
  strings rather than the shared compact/exact formatter at these surfaces.
- Blocks acceptance: Yes. D-030 requires one consistent policy across HUD,
  cards, targets, settlements, warnings, Details/Inspect, and ledger-adjacent
  disclosures; a user can currently see three incompatible presentations of the
  same zero/cents-exact values.

## Prior-finding adjudication

- V-068: resolved. Current immutable r067 evidence confirms Career Cash and
  Savings are independent compact values and route/evening terms retain only
  their own additive precision. The stale r066 initial-Savings fixture is not a
  candidate defect: initial Savings is $3.00 by the intended engine state.
- V-069: resolved. Current Jobs failed-payout selected card is `$0.00`; Details
  is `$0.000`.
- V-070: resolved. Current Queue 10 first/last endpoints no longer inherit
  precision from undisplayed intermediary quotes.

## Unverified areas

- No hosted five-lane aggregate, exact verifier-SHA push/deployment,
  `build-info.json` check, or focused live expert playthrough. The local frozen
  candidate already has a correctable mandatory defect, so those release checks
  cannot establish acceptance.
- No physical mobile device, non-Chromium engine, native screen-reader speech,
  or storage-exhaustion test.

## Residual risks

- V-071 is unresolved and visible in ordinary Career, Build, and Inspect flows.
  Repair must route independent compact summaries through cents-default format
  and route exact ledger/accounting disclosures through fixed mill precision,
  while preserving the resolved Queue 10 and additive-equation distinctions.
- Workspace-sandbox Chromium launch remains macOS-blocked; scoped host runs use
  the same pinned browser and passed. Retain CI/host corroboration after repair.
