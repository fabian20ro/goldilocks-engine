# Verification round 082 — untrusted canonical ledger provenance

Candidate SHA: `104541b2d91eadffc16cb66cc553e8d6f1b9430d`

VERDICT: FAIL

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `104541b2d91eadffc16cb66cc553e8d6f1b9430d`. It exactly matched the supplied
  candidate SHA. Initial `git status --short` was empty.
- Independently read full `plan.md`, `.agent/DECISIONS.md` through D-035,
  `AGENTS.md`, `.codex/agents/verifier.toml`, and immutable reports through
  round 081. `.agent/HANDOFF.md`, candidate tests, and implementation comments
  were used only as leads.
- Candidate production delta adds ledger-ID canonicalization/allocation and
  applies it only to stale/invalid-integrity current-schema restores. Audit
  covered `restoreSimulationState`, integrity/reseal order, structural state
  validation, bounded ledger behavior, append allocation, settlement event
  creation, and Jobs provenance selection.
- Verifier added only the focused regression
  `src/ui/verifierRound082.test.tsx`, the independent browser probe
  `round-082-adversarial.mjs`, and this report. No production source, product
  test, decision, plan, or prior immutable report was changed.

## Independent requirement checklist

1. Plan §§17, 24.1, 24.5–24.6; D-034/D-035: a failed settlement may name a
   precise cause only from its genuine engine-owned event; untrusted/stale,
   missing, malformed, reordered, colliding, bounded-out, or legacy evidence
   must remain structurally verified or honestly unknown.
2. D-035: invalid-integrity schema-7 tails reconstruct deterministically;
   future/colliding IDs cannot freeze later ticks; allocator remains unique and
   transactional; valid-seal current saves remain unchanged.
3. Preserve V-078/V-079/V-080/V-081: later unrelated failure, same-task
   free-text decoy, structural relink/reordering, and predicted future-ID
   attacks cannot alter causal truth or freeze restored progress.
4. Preserve D-033/D-030: latest Jobs settlement gives outcome, actual cash
   change, workload, cause/recovery or honest unknown, one native exact
   accounting disclosure, fixed-three accounting, raw Jobs navigation reserve.
5. Preserve all applicable prior current Bedroom behavior: deterministic
   Worker simulation, first-session recovery, Career draft/exact-once flows,
   one-pipeline editing/placement, portrait accessibility, reload/resume,
   offline/PWA root and Pages recovery, startup/install/security.

## Environment and setup

- macOS/Darwin arm64; locked Node `v22.23.2` through
  `npm exec --yes --package=node@22`; repository-pinned Playwright `1.61.1`.
- Clean setup in the canonical lane used ignored repository-local caches:
  `.cache/npm` and `.cache/ms-playwright`; `./scripts/setup` ran locked
  `npm ci` plus pinned Chromium install.
- The workspace sandbox denied Chromium's macOS Mach-port rendezvous before a
  test body. Scoped host invocations used the same repository-pinned browser,
  local cache, and loopback preview; browser verification was not skipped.
- Temporary production previews used `./scripts/run-e2e` at 127.0.0.1 ports
  43382 and 43384. Readiness was confirmed by the rendered app; both were
  interrupted after probes. A final loopback request to port 43384 failed to
  connect, confirming cleanup.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short`; source/diff audit; `git diff --check` | Pass before verifier writes: exact frozen SHA and clean tree. Final verifier artifact diff has no whitespace error. |
| `E2E_PORT=43383 ... npm exec --yes --package=node@22 -- sh ./scripts/verify` | Exit 1 as expected. The full gate continued after failures: candidate lanes passed format except initially unformatted new verifier probe, lint, typecheck, 50/51 unit files and 241/242 tests, all six deterministic/balance lanes, build, production audit, root Playwright 228/228, and Pages 2/2. Its one semantic failure is V-082. The verifier probe was then formatted; its direct Prettier/lint/syntax checks pass below. |
| `npm exec --package=node@22 -- npx prettier --write/check src/ui/verifierRound082.test.tsx .agent/verification/round-082-adversarial.mjs`; ESLint; `node --check` | Pass after final verifier artifacts were formatted. |
| Focused Node-22 Vitest: `verifierRound079`, `verifierRound080`, `verifierRound081`, `verifierRound082`, `settlementProvenance`, `engine.test` | 64/65 pass. V-078 through V-081 regressions pass; only V-082 fails with expected `undefined`, actual `Required memory exceeded available memory.` |
| Scoped loopback `round-079-adversarial.mjs` at port 43384 | Pass. Normal success/zero/partial settlement accounting, D-018 raw reserve (320: 136.453125px; 393: 157.3125px), native keyboard disclosure, touch, 200%-text/reduced-motion, no overflow/nested scroll, and no errors. |
| Scoped loopback `round-080-adversarial.mjs` | Pass, `findings: []`: stale same-task free-text decoy remains unknown, including portrait/offline path. |
| Scoped loopback `round-081-adversarial.mjs` | Pass, `findings: []`: stale structural relink stays unknown; future ID restore remains unique and progresses across reload/resume. |
| Scoped loopback `round-082-adversarial.mjs` at 320×693 keyboard and 393×742 touch | Fails exactly as V-082. Both raw and offline reload show the forged `Required memory exceeded available memory.` cause. 200%-text/reduced-motion screenshots inspected at `/private/tmp/goldlocks-r082/canonical-id-marker-{320,393}-200-reduced.png`; controls remain visible/reachable and no console/page errors occurred. |

## Requirement matrix

| Applicable requirement | Independent evidence | Result |
| --- | --- | --- |
| Plan §17 truthful causal postmortem; D-034/D-035 exact provenance or honest unknown | **FAIL — V-082.** A stale integrity record retains canonical IDs/order/link but changes its real settlement event's typed failure marker. Restore reseals and Jobs presents the altered marker as an engine fact. | Fail |
| D-035 canonicalize untrusted tail and avoid collision/progression freeze | Candidate engine inspection plus retained V-081 unit/browser probe: stale future ID is rebuilt; post-restore IDs unique; ticks and second reload/resume progress. | Pass |
| D-035 reordered/structural forged event link must not become proof | Retained V-080/V-081 unit and browser probes pass. Same-task free-text decoy, later/relinked record, and reordered tail render unknown. | Pass |
| D-034 normal failure and V-078 later unrelated Career event preservation | Focused provenance suite passes. Original Job failure remains selected after later Career activity; typed marker maps to engine copy rather than mutable prose. | Pass |
| Legacy/missing/bounded-out provenance fallback | Focused retained suites and V-080 probe pass: absent or invalid link shows existing `Cause unknown` fallback. | Pass |
| D-033/D-030 settlement card, exact accounting, cash-floor distinction, native disclosure | Independent V-079 browser probe passes success, zero-payout/full-payment, partial payment, keyboard/touch Details, exact three-decimal fields, actual `netChange`, and no false `$0.000 unpaid`. | Pass |
| D-018 / plan §20 portrait accessibility: 320/393 raw and 200%, 44px, reduced motion, keyboard/touch, no horizontal/nested scroll | Root canonical 228/228 plus independent V-079 and V-082 probes. At the defect view, both inspected scaled screenshots remain navigable; defect is content truthfulness, not geometry. | Pass with V-082 content failure |
| D-014–D-025 first-session, placement, Career draft, persistence, concurrency/recovery | Canonical retained engine/component/browser regressions pass, including human-paced Career at 320/393, exact-once persistence recovery, first-session malformed-state, Escape/focus and drag flows. Candidate source does not modify those boundaries. | Pass |
| Plan §§8–10 and Milestones 1–3.6: pipeline, jobs, workloads/economy, expansion, deterministic balance | Canonical static/unit/balance lanes pass: numeric prototype, 41-seed first-session/progression, 20,001-seed upgrade, 101-seed Career, and 121-seed evaluation sweeps; root E2E pipeline/jobs/upgrade/ending cases pass. | Pass |
| Plan §19, D-008, §20 PWA/reload/offline/root/Pages | Canonical root PWA update cases and Pages 2/2 pass. V-080/V-081 probes cover stale restore and offline; V-082 additionally proves the causal misinformation persists after offline reload, so overall recovery truthfulness fails. | Fail via V-082 |
| Install/startup/security/process cleanup | Clean locked setup/build, loopback readiness, `npm audit --omit=dev --audit-level=high` zero production findings, and preview-port closure pass. | Pass |
| Scope boundary | Candidate source diff is limited to persistence/ledger/provenance plus tests/docs. No new navigation, feature system, Worker protocol, PWA architecture, content, or dependency change. | Pass |

## Findings

### V-082 — canonical-looking stale ledger tail can forge a precise settlement cause

- Severity: High.
- Related plan requirement: Plan §17 causal truthfulness; §§20.7 and 24.1,
  24.5, 24.6 recovery/determinism; D-034 structural provenance and D-035
  untrusted restored-ledger canonicalization.
- Expected behavior: A schema-7 save with invalid integrity may be repaired for
  operability, but canonical-shaped event IDs/order cannot authenticate mutable
  event semantics. If the exact settlement event's typed failure marker is
  altered, Jobs must retain a safe state but show `Cause unknown` rather than
  a precise engine cause.
- Actual behavior: `normalizeUntrustedLedgerState` records only whether IDs
  are canonical, then preserves the settlement link when it points to the
  first event at the settlement tick. It does not neutralize a changed
  `settlementFailureCause` on that genuine linked event. The record is resealed
  and Jobs maps the forged marker to `Required memory exceeded available
  memory.` even though the genuine failure was `no-model-stage`.
- Exact reproduction:
  1. Start a fresh state; remove Runtime; queue one Interactive Chat job; tick
     60 seconds. It emits failed `task-0-1`, linked `evt-10000-5`, marker
     `no-model-stage`, and the real no-model cause.
  2. Alter only persisted ledger event `evt-10000-5`'s
     `settlementFailureCause` to `memory-capacity-exceeded`. Keep all IDs,
     ordering, tick, event sequence, linked task ID, and settlement link
     unchanged; this makes the existing integrity stale.
  3. Restore through `restoreSimulationState`, or write that payload to
     localStorage and reload the app. Candidate reseals the state and Jobs
     displays `Failure record: Required memory exceeded available memory.`
     instead of the honest unknown fallback.
  4. Repeat browser flow in `round-082-adversarial.mjs`: raw 320×693 keyboard
     and raw 393×742 touch reproduce; root service-worker offline reload
     reproduces at both widths.
- Concrete evidence: `src/ui/verifierRound082.test.tsx` receives expected
  `undefined`, actual `Required memory exceeded available memory.` The browser
  probe records before `{id:"evt-10000-5", marker:"no-model-stage",
  sequence:5, tick:32000}` and after the same ID/sequence/tick with marker
  `memory-capacity-exceeded`; both rendered recovery records contain the
  forged cause. Original-resolution scaled screenshots show the visible false
  cause at the two required widths.
- Blocks PASS: Yes. This converts mutable stale save data into a player-visible
  mechanically certain cause, contrary to the explicit engine-owned-or-unknown
  provenance contract.

## Unverified areas

- No hosted deployment of this failing verifier commit; exact-SHA deployment
  follows acceptance and is not appropriate for a failing candidate.
- No non-Chromium browser or native screen-reader speech session. Native
  Details semantics, programmatic labels, keyboard, touch, focus, 44px sizing,
  text scaling, reduced motion, and no-overflow behavior have concrete pinned
  Chromium evidence.

## Residual risks

- Current D-035 canonicalization authenticates ordering/identity syntax but
  not immutable event semantics. A repair must preserve valid current saves
  and V-078–V-081 while ensuring a stale/resealed event cannot retain a precise
  settlement failure marker merely because its ID tail is canonical-looking.
- The verifier regression intentionally remains failing until production
  behavior is corrected; do not weaken or delete it.
- The canonical gate was run once, as required. Its pre-format verifier-probe
  formatting failure was corrected afterward; its material semantic failure is
  V-082.
