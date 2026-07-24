# Verification round 044 — Jobs reserve and recovery stability

Candidate SHA: `7d7ac1f57106a3501ec39026e38bec3722091bc8`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Before any verifier artifact, `git rev-parse HEAD` returned exactly the
  candidate SHA; `git status --short` was empty.
- Independently read `plan.md`, `.agent/DECISIONS.md`, the Verifier role, and
  immutable reports `round-001.md` through `round-043.md`. Applicable scope:
  retained Pipeline Toy/Workstation, Career/Evaluation/Replay, PWA,
  command-deck, and first-session refinement through D-018. Deferred Research,
  creator, hype/fear, workforce, startup, and laboratory systems remain out of
  scope.
- Inspected the candidate delta independently. It narrows only short/narrow
  Jobs flow spacing, scopes `jobs-content` on the main element, records D-018,
  and adds raw-portrait measurements. No production file was changed by this
  Verifier.
- Verifier artifacts: `tests/e2e/verifier-round-044.spec.ts`; hardened
  `tests/e2e/verifier-round-040.spec.ts` malicious-save setup; this report.
  The hardening seeds a fresh context before application startup, preventing an
  old Worker response from overwriting the forged localStorage record during a
  reload. It retains and strengthens the original forged-purchase assertion.

## Environment and setup

- macOS 26.5.2, arm64; Node `v26.5.0`; npm `11.17.0`; repository-pinned
  Playwright `1.61.1` / Chromium.
- `./scripts/setup` uses ignored repository-local `.cache/npm` and
  `.cache/ms-playwright`; `./scripts/run` binds only
  `127.0.0.1:4173`; Playwright uses the checked-in loopback launchers and
  cleans them up.
- Manual `./scripts/run` reached readiness, and
  `curl -fsS -D - http://127.0.0.1:4173/ -o /dev/null` returned `HTTP 200`.
  Post-run `lsof` found no listeners on 4173 or 4174.
- `npm audit --omit=dev --json` reported zero production vulnerabilities.
  `npm ci` reports 11 high advisories in the dev graph; no production package
  is affected by the production-only audit.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short` before edits | Exact candidate; clean. |
| `E2E_PORT=4174 ./scripts/verify` | Exit `0`: format, lint, typecheck; Vitest 31 files / 153 tests; numeric prototype; 41-seed first-session, 20,001-seed upgrade, 41-seed progression, 101-seed Career, and 121-seed evaluation sweeps; production build; root Playwright 153/153; Pages 2/2. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-044.spec.ts --reporter=line` | Pass 4/4: raw and 200%-text Jobs at 320×693 and 393×742; physical Queue click, no page/console errors, reduced motion, hit testing, 44px target, and no horizontal overflow. |
| Raw DOM-rectangle probe after deterministic local launch | 320×693: selected-label reserve `143.375px`, Queue reserve `36.921875px`; 393×742: `187.359375px`, `80.90625px`; each begins at scrollTop `0`, Queue is `>=44px`, and document overflow is `0`. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/round-015-expansion.spec.ts --grep 'shows eight workloads and preserves accepted task identity while clearing only waiting work' --repeat-each=20 --reporter=dot` | Pass 20/20. Stable 1× + pause assertion retains the active accepted task while clear removes only waiting tasks. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-043.spec.ts --repeat-each=20 --reporter=dot` | Pass 20/20. Exact active ID and locked quote survive clear and reload. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/verifier-round-041.spec.ts --grep 'initial (controls|Jobs dispatch action)' --repeat-each=10 --reporter=dot` | Pass 40/40: raw Build and Jobs geometry at both required portraits. |
| `E2E_PORT=4174 npm run test:e2e -- tests/e2e/command-deck.spec.ts --reporter=line` | Pass 6/6. |
| Original-resolution screenshot inspection | Inspected 20 raw screenshots: Build, Jobs, Career, Upgrades, Inspect × starter/expanded × 320×693/393×742, plus 200%-text Career output. Coherent forest/acid/amber/cyan deck; visible raw Jobs Queue and Build first action; no visual occlusion or horizontal clipping. |
| `npm audit --omit=dev --json`; `git diff --check` | Production audit clear; diff clean. |

The first integrated run after adding verifier artifacts exposed one stale
`verifier-round-040` expectation once: its direct localStorage mutation could
race the live Worker on unload. The fresh-context probe above passed 20/20 and
the final full canonical root run passed it as test 137/153. This is a test
fixture synchronization repair, not a production behavior change.

## Requirement matrix

| Applicable plan / decision requirement | Evidence | Result |
| --- | --- | --- |
| Deterministic engine, Worker authority, versioned migration, malformed state recovery, fixed 1×/4×/16×/64× semantics (§§23–27; D-004, D-007, D-014–D-017) | Canonical static/unit/property suite, all deterministic balance sweeps, and retained browser recovery/time tests pass. | Pass |
| One ordered starter/Workstation pipeline; exact-once 3→6 expansion; eight workloads; locked task identity/quote; saturation/recovery; active-preserving clear (§§8–10; Milestone 2; D-007) | Canonical expansion/queue/demand/offline/touch/200% coverage passes. Independent repeat probes: clear 20/20 and ID/quote reload 20/20. | Pass |
| Finite queue → settlement → buy/install rail; explicit Build-only placement; cancellation/focus; reload/offline recovery (§20.6; D-013–D-015) | Canonical first-session, touch/keyboard, malformed-save, reload/offline, Escape/Cancel coverage passes at 320/393 and scale. | Pass |
| Integrity-authoritative and ledger-correlated stale-save recovery; reject forged purchase/topology/current guide (D-016/D-017) | Hardened isolated malicious-save browser probe, retained engine/browser regressions, and canonical tests 137, 144, and 145 pass. | Pass |
| Raw initial portrait geometry: first Build control plus Jobs selected playable label and Queue 1 above nav, no pre-scroll/no horizontal overflow (§20.5; D-012; D-018) | Candidate and verifier raw rectangle tests pass at 320×693/393×742; exact host reserves listed above. Candidate reduces two 320×693 gaps from `0.5rem` to `0.125rem`, a fixed 12 CSS-pixel upward displacement. Applied to round-043's exact Ubuntu clearance of `-1.078125px`, this yields a `10.921875px` inferred reserve, `2.921875px` above D-018's 8px floor. | Pass |
| 44px targets; no color-only state; touch/drag, keyboard/focus, 200% text, reduced motion, no overflow/nested rail trap (§§20.4–20.6) | Canonical root suite; verifier 044 raw/scaled tests; raw and scaled screenshot inspection. Queue center hit test and physical pointer click succeed. | Pass |
| Shared code-native command-deck grammar; live details; coherent five tabs; starter and expanded states; no unauthorized content/assets (§20.5; D-012) | Fresh screenshot inspection, command-deck cases, source inspection, and canonical checks pass. | Pass |
| Career routes, evaluation/failure/replay, causal ledger/postmortem, replay/meta migration (Milestone 3; D-010/D-011) | 101-seed Career and 121-seed evaluation sweeps; retained browser/replay cases; root suite pass. | Pass |
| Root and Pages install/update, deployment failure recovery, offline reload, persistence, scope/cache isolation (D-008) | Canonical root PWA/update scenarios and Pages 2/2 pass. | Pass |
| Setup/startup/cleanup and security boundary (§27; AGENTS testability) | Pinned install and complete canonical command exit 0; manual loopback HTTP readiness and cleanup; production audit clear; hostile saved content/corruption tests in canonical suite. | Pass |
| Earlier findings V-001 through V-053 | Included in 153 root / 2 Pages tests. V-052 reserve is quantitatively asserted; V-053 stable pause/clear assertion and independent persistence repeat both pass. | Pass |
| Research/creator/hype/fear/workforce/startup/laboratory and other deferred systems | Candidate adds none. | N/A — scope preserved |

## Findings

None. V-052 and V-053 are resolved with passing canonical and independent
evidence; no correctable candidate defect remains.

## Unverified areas

- Direct post-fix Linux Chromium execution was unavailable: no candidate SHA
  hosted run exists, and the scoped Docker attempt was rejected because it
  would copy repository content into a networked third-party container. The
  report therefore distinguishes the exact host rectangles from the explicit
  Ubuntu-margin calculation above. D-018's candidate-owned pinned rectangle
  checks make the 8px floor executable on any available runner.
- Physical iOS/Android behavior, native screen-reader speech, battery/thermal
  budget, and non-Chromium engines were unavailable. Required pinned Chromium
  portrait, touch/keyboard, text-scale, reduced-motion, persistence, offline,
  PWA, and page/console-error paths were exercised.
- Storage-quota interruption at one exact persistence write was not
  fault-injected; malformed-state, reload/resume, offline, and service-worker
  failure/recovery coverage passed.

## Residual risks

- The local integrity seal remains a corruption detector rather than a
  server-authenticated anti-cheat boundary. That is the intentionally offline
  scope recorded by D-017, not a plan violation.
- Full `npm ci` reports high-severity dev-graph advisories. Production-only
  audit is clean; dependency remediation is outside verifier authority.
- A future Linux CI run should retain the D-018 8px measurement; the static
  margin calculation is strong evidence but does not replace a future actual
  cross-platform browser observation.
