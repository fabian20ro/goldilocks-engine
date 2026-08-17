# Verification round 097 — Linux-sensitive navigation lifecycle

Candidate SHA: `099e7ef55400b0d5420ea7dc8ec8762e24e22909`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier artifact was
written, `git rev-parse HEAD` matched `099e7ef55400b0d5420ea7dc8ec8762e24e22909`.
The candidate production delta is the synchronous active-tab reveal in
`src/ui/App.tsx`; the candidate navigation test extends the 200% reduced-motion
stress case. No production file was changed by this verifier.

The required routing sources were read in order: `AGENTS.md`,
`.codex/agents/verifier.toml`, live `./scripts/agent-status`,
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, and
`.agent/verification/catalog.json`. Direct authorities read for this bounded
M7A slice were `plan.md` §§2.4, 20, 24, 27, 29, and 34; D-040 and D-041 in
`.agent/DECISIONS.md`; `.agent/RELEASE_ACCEPTANCE.md`; the exact navigation
implementation/test sources; and the retained round-093, round-095, and
round-096 evidence. The retained PWA A/B contract was also read and exercised
through the round-029 probe and PWA update suite. Routing summaries, handoff,
implementation tests, comments, and claimed results were treated as untrusted
hints.

Independent checklist:

- machine-valid M7A routing and contradiction checks;
- eight stable bottom-only destinations, no duplicate global routing, and 44px
  targets;
- strict normal 393px fit;
- explicit 320px horizontal disclosure, truthful direction cues, accessible
  swipe instruction, and active reveal;
- Linux-sensitive 200% text lifecycle across repeated 320→393→320 resizes,
  reduced motion, direct activation, keyboard/focus, touch, reload, offline,
  document-fit, and page/console-error boundaries;
- retained root/Pages PWA A/B convergence, scope isolation, malformed-cache
  fail-closed behavior, and offline operation;
- explicit commercial-release matrix with open external gates honestly kept
  open.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned `@playwright/test` `1.61.1`; Chromium and npm caches in
  ignored repository-local `.cache/` paths.
- The initial sandboxed Chromium launch failed before page creation with
  `MachPortRendezvousServer ... Permission denied`. The same pinned commands
  were rerun with scoped host authority; all required browser lanes then ran.
- `./scripts/run-e2e`/Playwright web servers became ready on deterministic
  loopback ports. Independent probe cleanup closed browser/context and its
  detached server group. `lsof` over all round ports after verification found
  no listening process.

## Commands executed and results

| Command or evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `git status --short --branch`; `./scripts/agent-status` | Supplied SHA matched before writes; clean candidate start; live status parsed cleanly and identified round 097 as the next gate. |
| Required authority/routing/archive/source reads | Completed; candidate and prior evidence were independently inspected. |
| `npm run validate:verification-catalog` | Passed: 96 immutable reports, 95 findings, 4 active requirements. |
| `npm run format:check`; `npm run lint -- --quiet`; `npm run typecheck`; `git diff --check`; `node --check .agent/verification/round-097-adversarial.mjs` | Passed. |
| Sandboxed `E2E_PORT=42797 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts` | Blocked before test bodies by the macOS Chromium Mach-port permission. |
| Host-authorized `E2E_PORT=42798 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts --workers=1 --reporter=line` | Passed 3/3. Normal 393px, 320px keyboard/touch boundary, and 200% reduced-motion resize/reload. |
| Host-authorized `E2E_PORT=42799 npm run test:e2e -- tests/e2e/verifier-round-029.spec.ts --workers=1 --reporter=line` | Passed 1/1. Root A-query/B-body repair while live Pages A remains isolated. |
| Host-authorized `E2E_PORT=42800 npm run test:e2e -- tests/e2e/pwa-update.spec.ts --workers=1 --reporter=line` | Passed 16/16. Root/Pages A→B update, stale URL repair, partial/malformed metadata and shell rejection, rollback, scope isolation, and orphan-cache recovery. |
| Host-authorized `PORT=42805 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node .agent/verification/round-097-adversarial.mjs` | Passed with `findings: []`; all eight tabs, three repeated 200%-text 320→393→320 cycles, reduced motion, direct click, keyboard/focus, touch, cues, 44px geometry, document fit, reload, offline, and zero page/console errors. |
| Final `INSTALL_PLAYWRIGHT=0 E2E_PORT=42806 VERIFY_EVIDENCE_DIR=.cache/verification/round-097-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` with scoped host authority | Passed once after executable verifier artifacts were ready: catalog, locked setup, format, lint, typecheck, 66 unit files/305 tests, all balance lanes, build, production audit (0 vulnerabilities), root browser/PWA 238/238, and Pages/offline 2/2. |
| `lsof -nP -iTCP:42806 ... -sTCP:LISTEN` after the final gate | No round listener remained. |

The final canonical gate was not rerun after this Markdown report was created;
the report is non-executable evidence only.

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| M7A-ROUTING-001: machine-valid active routing and contradiction checks | Catalog validator passed before focused work and in the final canonical gate; immutable reports and routing sources were not rewritten. | Satisfied. |
| M7A-NAV-001: eight destinations, stable order, bottom-tab-only routing, 44px targets, visible narrow cue/instruction, active reveal | `navigationItems`/App/CSS inspection; focused 3/3; independent all-tab probe; canonical root 238/238. | Satisfied. |
| M7A-NAV-002 normal rule: 393px stable order and complete fit without cue | Focused normal test; independent launch/activation checks; canonical root browser coverage. | Satisfied. |
| M7A-NAV-002 boundary rule: 320px overflow disclosure, truthful direction cues, keyboard/touch reveal | Focused 320px test; independent direct click for every tab, keyboard World with focus, touch Jobs, cue/ARIA/opacity checks, 44px geometry, and document-fit checks. | Satisfied. |
| M7A-NAV-002 lifecycle rule: 200% text, reduced motion, repeated resize, focus, reload, and offline | Independent probe ran three 320→393→320 cycles for all eight destinations under injected 200% text and reduced motion, then keyboard/touch/focus, scaled reload, offline navigation, and error checks; focused 200% test passed. | Satisfied. |
| D-041 / plan §§20, 27, 29, 34 retained accessibility boundary | Chromium evidence covers portrait widths, scalable text, reduced motion, keyboard/touch semantics, visible active state, no document overflow, and reachable targets. | Satisfied for the scoped Chromium contract. |
| D-040 and plan §§19, 24 retained PWA/offline lifecycle | Round-029 live nested-shell A/B probe 1/1; PWA update suite 16/16; final root PWA 238/238 and Pages/offline 2/2. | Satisfied. |
| M7A-RELEASE-001: explicit commercial-release acceptance matrix | `.agent/RELEASE_ACCEPTANCE.md` remains concrete and current; open WebKit/native, performance-device, writing, audio, localization, packaging, hosted deployment, and release-receipt items remain explicitly open. | Satisfied as documentation; open external gates are not falsely claimed complete. |
| Reproducible install/startup/cleanup | Locked setup and repository-local caches; deterministic loopback readiness; scoped host-authorized pinned browser; no post-run listeners. | Satisfied. |

## Findings

None. The initial sandbox failures were infrastructure-only and were resolved
by the documented scoped host-authority reruns. No correctable candidate defect
or unresolved applicable requirement was found.

## Unverified areas

- Native iOS/Android devices, WebKit, VoiceOver/TalkBack speech output,
  low-end CPU/memory/battery/thermal measurements, audio, localization,
  packaging decisions, hosted exact-SHA aggregation, and Pages deployment
  receipts remain open in the commercial-release matrix.
- These open release-matrix items are outside this bounded M7A navigation and
  retained PWA verification and do not block the scoped result.

## Residual risks

- Linux font metrics can leave the navigation strip itself one CSS pixel wider
  at 393px under injected 200% text. The tested contract treats only more than
  one pixel of scroll range as semantic overflow; active-target visibility,
  truthful cues/instruction, 44px targets, and document fit passed through
  repeated cycles.
- The managed macOS sandbox cannot launch pinned Chromium without host
  authority; equivalent host-authorized commands passed all required browser
  lanes.
- Exact-SHA hosted aggregation and deployment remain release-owner actions and
  are not implied by this local verification.
