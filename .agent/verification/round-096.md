# Verification round 096 — hosted navigation and PWA fixture repair

Candidate SHA: `ff7855546ebf8abae04d5c70a485c75617328d48`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier artifact was
written, `git rev-parse HEAD` matched the supplied SHA. The candidate diff is
limited to verifier-owned navigation/PWA tests and the current handoff; no
production implementation, plan, decision, catalog, or immutable report was
changed.

The full release-read route covered `plan.md`, complete `.agent/DECISIONS.md`,
`.agent/RELEASE_ACCEPTANCE.md`, the routing records and catalog, accepted round
093 Lab evidence, the round-029 PWA A/B report and test, round-091's retained
independent mixed-scope probe, round-095 navigation evidence, and the exact
candidate sources. Handoff text, routing summaries, candidate-authored tests,
and claimed hosted results were treated as untrusted hints.

Independent checklist:

- eight destinations retain stable order, bottom-tab-only routing, 44px targets,
  and no duplicate global route controls;
- normal 393px fit, narrow 320px overflow disclosure, keyboard/touch reveal,
  200% text, resize, focus, reload, offline, and document-overflow safety;
- the Linux-sensitive 393px/200%-text case permits only inner-strip overflow
  with truthful cues and active-target visibility, while 393px normal remains a
  strict fit requirement;
- round-029 root A-query/B-body repair converges root to B exactly once while
  a live Pages A shell remains isolated, persistent, and offline-usable;
- malformed/partial/unavailable PWA candidates fail closed and retained
  deterministic, persistence, accessibility, offline, and Lab contracts stay
  green; and
- the commercial release matrix remains explicit without claiming external
  WebKit/device/deployment gates are complete.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; Chromium and npm dependencies used
  ignored repository-local `.cache/ms-playwright` and `.cache/npm` paths.
- The initial sandboxed Chromium launch failed before test bodies with the
  macOS Mach-port permission error. The identical pinned commands were rerun
  with scoped host authority; no browser lane was silently skipped.
- Loopback preview/fixture processes were terminated by their test cleanup;
  ports used by this round were checked afterward and no listener remained.

## Commands executed and results

| Command or evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `./scripts/agent-status`; required authority/routing reads | Supplied SHA matched; status parsed cleanly; full plan/decision/archive route and exact cited sources were read. |
| Candidate diff/source inspection | Test/docs-only candidate. Navigation assertions and the round-029 root lifecycle barrier were inspected against `App.tsx`, CSS, PWA client/worker, and release requirements. |
| `node --check .agent/verification/round-096-adversarial.mjs`; targeted Prettier and ESLint | Passed. |
| `E2E_PORT=42596 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts tests/e2e/verifier-round-029.spec.ts --workers=1 --reporter=line` | Host-authorized rerun passed 4/4. The preceding sandbox attempt was blocked before browser startup only by Mach-port permission. |
| `E2E_PORT=42597 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts --repeat-each=3 --workers=1 --reporter=line` | Passed 9/9. |
| `E2E_PORT=42598 npm run test:e2e -- tests/e2e/verifier-round-029.spec.ts --repeat-each=5 --workers=1 --reporter=line` | Passed 5/5 mixed-scope A/B lifecycle repetitions. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42601 node .agent/verification/round-095-adversarial.mjs` | Passed with `findings: []`; independent all-tab 393/320/200%-text resize, keyboard, touch, reload, offline, cue, target, overflow, and error checks. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42602 node .agent/verification/round-091-adversarial.mjs` | Passed 4/4: two repetitions at 320×693 and two at 393×742; independent root/Pages A/B identity, save preservation, isolation, offline restart, geometry, and error checks. |
| `E2E_PORT=42599 npm run test:e2e -- tests/e2e/pwa-update.spec.ts --workers=1 --reporter=line` | Passed 16/16 root/Pages install/update, stale URL, malformed metadata, partial shell, rollback, isolation, and orphan-cache cases. |
| `E2E_PORT=42603 npm run test:e2e:pages -- --reporter=line` | Passed 2/2 Pages/offline and foreign-cache isolation cases. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42604 node .agent/verification/round-096-adversarial.mjs` | Passed with `findings: []`; strict 393px normal fit, 320px disclosure/reveal, 393px/200%-text metric-safe cues, 320px/200%-text lifecycle, reload, offline navigation, 44px targets, document fit, and zero page/console errors. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=42605 VERIFY_EVIDENCE_DIR=.cache/verification/round-096-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` | One final canonical gate passed: catalog, clean setup, format, lint, typecheck, 66 unit files/305 tests, all balance lanes, build, production audit with 0 vulnerabilities, root browser/PWA 238/238, and Pages/offline 2/2. |
| Post-gate listener cleanup check on all round ports | No listener remained. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: machine-valid current routing and contradiction checks | Canonical catalog lane passed before executable verification; routing and immutable archive remained unchanged. | Satisfied. |
| `M7A-NAV-001`: eight stable destinations, bottom-only routing, 44px targets, narrow cue/instruction, active reveal | `App.tsx`/CSS/glyph inspection; focused 4/4, repeat 9/9, independent round-095 and round-096 probes, and canonical root 238/238. | Satisfied. |
| `M7A-NAV-002`: normal/boundary/lifecycle browser behavior | Independent strict 393px normal fit; 320px horizontal disclosure, keyboard and touch semantics; 200% text, resize, focus, reload, offline, document fit, target geometry, and error checks. | Satisfied. |
| `M7A-RELEASE-001`: explicit commercial-release matrix | `.agent/RELEASE_ACCEPTANCE.md` preserves open balance/accessibility/performance/writing/audio/save/localization/packaging/deployment entries and gate order without volatile acceptance claims. | Satisfied as the active documentation requirement; external gates remain open. |
| D-008 / `plan.md` §§19, 23–24: installable root and Pages PWA, atomic update, stale URL repair, scope isolation, persistence, rollback, offline | Canonical root PWA 16/16 plus root 238/238 and Pages 2/2; round-029 5/5; independent round-091 4/4; exact app/controller/worker/cache/reload identities, save preservation, live Pages A isolation, offline restart, malformed/partial rollback. | Satisfied. |
| `plan.md` §§2.4, 20, 27, 29, 34 and D-040 retained product/accessibility boundaries | Final canonical deterministic/unit/balance/build/audit/browser lanes plus retained round-093 engine/UI evidence and independent navigation/PWA probes. | Satisfied for the exercised retained scope. |
| Installation/startup/reproducibility/process cleanup | Locked setup, repository-pinned browser/cache paths, deterministic loopback readiness, host-authorized reruns, and post-run listener checks. | Satisfied. |

## Findings

None. No unresolved correctable candidate defect was found.

## Unverified areas

- Native iOS/Android devices, WebKit, native VoiceOver/TalkBack speech output,
  low-end CPU/memory/battery/thermal measurements, audio, localization,
  packaging decisions, hosted exact-SHA aggregation, and Pages deployment
  receipts remain open in the commercial-release matrix.
- These are outside this bounded test/PWA repair and do not prevent the scoped
  candidate verdict.

## Residual risks

- Linux font metrics can make the navigation strip itself overflow at 393px
  under injected 200% text. The active target, truthful cue/instruction,
  target-size, and document-fit contract passed independently; 393px normal
  fit remains strict.
- The macOS sandbox cannot launch Chromium without host authority; the same
  pinned browser commands passed with scoped host access.
- External hosted verification and deployment of this exact accepted SHA remain
  Orchestrator/release-owner actions; this report makes no deployment claim.
