# Verification round 094 — Milestone 7A release foundation and navigation

Candidate SHA: `f64ecd78e97ee076b3e0f9a2d94e204791b7e27c`

VERDICT: FAIL

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier write,
`git rev-parse HEAD` matched the supplied SHA. The full release-verification
route was read: `AGENTS.md`, `.codex/agents/verifier.toml`, live
`./scripts/agent-status`, routing maps, the complete `plan.md`, complete
`.agent/DECISIONS.md`, `.agent/RELEASE_ACCEPTANCE.md`, the complete immutable
report archive, catalog, and round-093 accepted Lab evidence/probes.

Independent checklist:

- catalog routing is machine-valid and does not replace immutable authority;
- eight destinations retain stable order, bottom-tab-only routing, and 44px
  targets;
- 393px normal fit, 320px cue/instruction, keyboard/touch reveal, 200% text,
  resize, focus, reload, and document-overflow safety;
- retained deterministic, persistence, offline, PWA, accessibility, and Lab
  contracts remain green;
- the commercial release matrix remains explicit, with open external gates
  honestly recorded.

Routing records and the handoff were treated as navigation only. Candidate
tests and claimed results were not accepted as proof without independent
behavioral evidence.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; Chromium in ignored
  `.cache/ms-playwright`; npm cache in ignored `.cache/npm`.
- The initial sandboxed Chromium launch failed before test bodies with the
  macOS Mach-port rendezvous permission error. The same scoped commands were
  rerun with host authority and passed; no required browser lane was skipped.
- Canonical setup and all preview servers completed cleanup. The independent
  probe kills its detached server group and closes its browser context.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `./scripts/agent-status`; full authority/archive reads | Candidate SHA matched; status parsed cleanly; full route completed. |
| `npm run validate:verification-catalog` before the report | Passed: 93 immutable reports, 94 findings, 4 active requirements. |
| `npm run format:check && npm run lint && npm run typecheck` | Passed after formatting the verifier probe. |
| `E2E_PORT=42496 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts` with host authority | Passed: 3/3 candidate navigation tests. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42494 node .agent/verification/round-094-adversarial.mjs` with host authority | Ran independent 320/393/200%-text lifecycle, CDP touch swipes, keyboard reveals for all eight tabs, cues, focus, overflow, errors, and cleanup. One finding: active World remains clipped after 393→320 resize at normal and 200% text. |
| `node .agent/verification/round-093-adversarial.mjs` | Passed: no findings; Lab normal, malformed/recovery, capacity, non-finite, persistence, and offline checks. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42493 node .agent/verification/round-093-ui-adversarial.mjs` with host authority | Passed: no findings at 320px and 393px; touch, reduced motion, 200% text, reload/offline, Lab lifecycle, and page/console checks. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=42497 VERIFY_EVIDENCE_DIR=.cache/verification/round-094-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` with host authority | Passed once: catalog, setup, format, lint, typecheck, 66 files/305 unit tests, all balance lanes, build, production audit (0 vulnerabilities), root browser/PWA 238/238, Pages/offline 2/2. |
| Focused `npm run validate:verification-catalog` after adding this report and routing its finding | Passed: 94 immutable reports, 95 findings, 4 active requirements. The canonical gate preceded these verifier-only report/catalog changes; per protocol it is recorded as stale for those post-gate artifacts and was not looped. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: current-scope/catalog routing and contradiction checks | Pre-gate catalog validation; post-report focused catalog validation; immutable archive identity checks; `scripts/validate-verification-catalog.mjs` is called first by `scripts/verify`. | Satisfied. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, narrow cue/instruction | Candidate source inspection; candidate 393px and 320px tests; independent probe confirms exact order, one nav button per destination, 44px minima, 320px cue/instruction, no document overflow, and direct touch reveal. | Partially satisfied; lifecycle defect V-094-001 blocks acceptance. |
| `M7A-NAV-002`: normal/boundary/lifecycle pinned browser behavior | Candidate navigation suite passes at 393px, 320px, and 200% text; independent probe passes all eight keyboard reveals, both paced CDP touch directions, reduced motion, focus, error, and cleanup checks. The independent 393→320 resize case leaves active World clipped at both normal and 200% text. | Failed; V-094-001 blocks PASS. |
| `M7A-RELEASE-001`: explicit commercial-release acceptance matrix | `.agent/RELEASE_ACCEPTANCE.md` defines balance, accessibility, performance, writing, audio, save, localization, packaging, deployment, and gate order without claiming completion. | Satisfied as a routing/documentation requirement; remaining matrix gates stay open. |
| Retained deterministic/persistence/offline/PWA/Lab boundaries from `plan.md`, D-040, and round 093 | Canonical unit/balance/build/audit/root/Pages lanes plus independent round-093 engine/UI probes. | Satisfied for the exercised retained scope. |

## Findings

### V-094-001 — Active destination is not re-revealed after narrow resize

- Severity: High / P1 accessibility and navigation correctness.
- Related plan requirement: `plan.md` §20.5/§20.4, D-041 navigation contract,
  `M7A-NAV-002` lifecycle evidence.
- Expected behavior: after World is active and fully visible at 393px, resizing
  to 320px (normal or 200% text) must preserve the active destination while
  automatically revealing its 44px target inside the horizontal strip. The
  direction cue and accessible instruction may remain active, but the player
  must not be left with the active tab clipped.
- Actual behavior: after 393→320 resize, `aria-current="page"` remains on
  World, but the strip remains at `scrollLeft: 0`; at normal text the World
  button is `left: 308, right: 352` while the nav viewport is `0..320`; at
  200% text it is likewise outside the viewport (`left: 308, right: 352`).
  The right cue updates, but active-tab reveal does not.
- Exact reproduction:
  1. Launch the repository preview with the pinned Playwright setup.
  2. Use a 393×742 viewport; open Build, then activate World from the Primary
     bottom navigation.
  3. Resize to 320×693 without activating another tab.
  4. Read `.bottom-nav` and `button[aria-label="World"]` bounding boxes. The
     active button is clipped and `scrollLeft` is zero.
  5. Set `document.documentElement.style.fontSize = "200%"`, repeat the
     Build→World activation at 320px, resize to 393px and back to 320px; the
     same clipping occurs.
- Concrete evidence: verifier-owned
  `.agent/verification/round-094-adversarial.mjs` emitted the failing check
  with both normal and scaled snapshots; the candidate source only invokes
  the reveal `useLayoutEffect` on `[tab, updateBottomNavOverflow]`
  (`src/ui/App.tsx:4347-4360`), while the resize listener only recomputes cue
  state (`src/ui/App.tsx:4335-4345`).
- Blocks PASS: Yes. This is an explicitly required resize/active-tab lifecycle
  behavior, not a cosmetic discrepancy.

## Unverified areas

- Native iOS/Android devices, WebKit, native VoiceOver/TalkBack speech output,
  low-end mobile CPU/memory/battery/thermal measurements, audio, localization
  readiness, packaging/distribution decisions, hosted exact-SHA aggregation,
  and Pages deployment receipts remain open in the active release matrix.
- These open release-matrix areas do not explain the FAIL; the correctable
  navigation defect is independently reproducible on the pinned browser.

## Residual risks

- The sandbox Mach-port restriction may affect equivalent local environments;
  host-authorized pinned reruns passed the required browser lanes.
- The final canonical gate passed the exact candidate before this immutable
  verifier report and its catalog routing were added. Its product evidence is
  valid for candidate SHA; its status is explicitly stale only for those
  post-gate verifier artifacts, and no second full gate was run.
- No production implementation file was modified by this verifier.
