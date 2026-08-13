# Verification round 078 — contextual global chrome

Candidate SHA: `88fdc4df1ef86fe7b5c1e584c08df868e580b767`

VERDICT: PASS

## Candidate freeze and verifier boundary

- Captured `git rev-parse HEAD` before any verifier write:
  `88fdc4df1ef86fe7b5c1e584c08df868e580b767`. It exactly matched the
  supplied candidate SHA. Initial `git status --short` was empty.
- Independently reviewed `plan.md`, `AGENTS.md`,
  `.codex/agents/verifier.toml`, all decisions through D-032, and immutable
  verifier records through round 077. Retained V-001–V-077 regression paths
  were then exercised by the clean canonical suite; D-018 and V-077 received
  fresh direct evidence below.
- Candidate production delta is restricted to `src/ui/App.tsx` and
  `src/ui/styles.css`: compact native Help/motion and Simulation disclosures,
  their presentation CSS, and Configure/Observe wording. Diff/source audit
  found no Worker, simulation, schema, persistent-state, routing, tab-scroll,
  onboarding, Career, Jobs settlement, placement, resource, PWA, navigation,
  or dependency-manifest modification. `git diff --check` passed.
- Verifier added only `round-078-adversarial.mjs` and this immutable report;
  no production repair was made. The immutable round-076 probe was not edited.

## Environment and setup

- Darwin 25.6.0 arm64; locked Node `v22.23.2` via
  `npm exec --package=node@22`; repository-pinned `@playwright/test` 1.61.1;
  ignored local npm/browser caches at `.cache/npm` and `.cache/ms-playwright`.
- The workspace sandbox denied Chromium's macOS Mach-port rendezvous before
  browser test bodies. Scoped host execution used the same project-pinned
  browser/cache and completed all browser evidence; browser verification was
  not skipped.
- A preliminary direct root-suite attempt encountered concurrent external
  Pages-output interference: after 90 passes its served `dist/index.html`
  carried `/goldilocks-engine/` asset paths. The candidate's PWA fixture alone
  did not mutate root `dist`; the exact `pwa-update.spec.ts` then
  `round-009-usability.spec.ts` sequence passed 22/22. A later isolated clean
  canonical run completed 217/217 root and 2/2 Pages cases. This was not a
  candidate defect.
- Independent preview: `./scripts/run-e2e` on loopback `127.0.0.1:42184`;
  title readiness confirmed. Its temporary tmux session was stopped afterward;
  subsequent loopback request failed to connect.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| Candidate SHA/status; parent diff/name/status; `git diff --check` | Pass: exact frozen candidate; clean initial tree; constrained presentation/test delta; no whitespace error. |
| Sandboxed clean Node-22 canonical command | Static, unit, balance, build, and audit lanes passed; pinned Chromium launch alone hit documented macOS Mach-port denial before test bodies. Superseded by host run below. |
| `E2E_PORT=42183 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm_config_cache="$PWD/.cache/npm" npm exec --yes --package=node@22 -- sh ./scripts/verify` | Pass, exit 0: locked setup; format; lint; typecheck; 45 unit/property files / 223 tests; numeric, first-session, 20,001-seed upgrade, progression, Career, and evaluation balance gates; build; production audit; root Playwright 217/217 in 3.2m; Pages 2/2. |
| Focused isolated `pwa-update.spec.ts tests/e2e/round-009-usability.spec.ts` sequence | Pass: 22/22 in 24.2s. This ruled out the preliminary external build-output interference as a candidate regression. |
| `BASE_URL=http://127.0.0.1:42184 ... node .agent/verification/round-078-adversarial.mjs` | Pass, `findings: []`. Fresh 40-state portrait screenshot/matrix; native details + AX-name inspection; keyboard/touch; exact speed, warning, focus, state-boundary, D-018/V-077, malformed/PWA, and pointer/CDP-touch evidence. |
| `prettier --check`, `eslint --max-warnings 0`, `node --check` for the verifier probe | Pass. |
| Original-resolution inspection of all 40 `/tmp/goldlocks-r078/*.png` captures | Pass. Raw five-tab starter/expanded deck is coherent at both required sizes. 200%-text/reduced-motion deck preserves readable resources, disclosures, tab labels, and no visual collision/clip. |
| iOS simulator: `xcrun simctl openurl booted http://127.0.0.1:42184/`; temporary simulator screenshot | Pass smoke: existing iPhone SE simulator loaded the candidate shell; inspected capture shows HUD, Help & motion, one Build action, Configure/Observe, and bottom navigation. Safari was terminated and simulator returned to Shutdown. |
| Connected Android: `adb -s 25121JEGR11385 reverse tcp:42184 tcp:42184`; browser open; real `input tap` Jobs; temporary screenshots | Pass smoke: connected Pixel 6a loaded Build, then real tapped Jobs; inspected capture shows Simulation summary, Jobs action, selected-work card, and fixed navigation. Reverse tunnel removed afterward. |

## Requirement matrix

| Applicable requirement / decision | Independent evidence | Result |
| --- | --- | --- |
| D-032 permanent identity, live Resource HUD, and one bottom-tab grammar | Fresh raw deck: HUD bounds `59.98–87.64` at 320×693 and `59.98–90.64` at 393×742; main begins 9px later. All five tabs/states retain only bottom global routing. Simulator/Pixel screenshots corroborate. | Pass |
| D-032 Simulation summary is native, closed initially, names exact active speed/current warning, retains exact 1×/4×/16×/64× controls | Fresh `DETAILS` tag/state probe; AX partial tree exposes `Simulation time 1×. Evaluation blind spots widen observed uncertainty...`; each exact choice updates its summary and `aria-pressed` selected button. | Pass |
| D-032 speed selection closes Simulation and restores tab priority | Fresh loop across 1×/4×/16×/64× records `closed: true`, updated accessible summary, and reopened selected control. Raw Build/Jobs first-action geometry remains above nav: starter Build `358.03–408.63`, Jobs `430.77–482.77` at 320; `362.47–406.47`, `458.91–510.91` at 393. | Pass |
| D-032 full warning evidence and valid responses remain on demand; no hidden required consequence | Fresh native Warning details opening contains current warning, full response/caveat and bottom-tab guidance. Memory stress gives “Lower the reserve”; after reserve=0 it updates to `0 GB (0%)`, removes that invalid action, retains lighter-module/lower-memory actions and no single-cause claim. | Pass |
| D-032 Help & motion is native, keeps Help/motion names/state, dismissal returns focus | Fresh `DETAILS` tag/state and AX name `Help and motion settings`; visible text `Help & motion`; Space opens it, native touch tap opens Simulation, Quick Start dismissal focuses the Help summary. Motion `aria-pressed` changes while Simulation remains `1×`; document animations become zero under motion-off. | Pass |
| D-032 Configure/Observe wording only; no mechanics/routing/state effect | Fresh serialised state projection (slots, equipment, policies, owned items, workload) identical before/after Observe→Configure; Build stays `aria-current=page`. | Pass |
| Required portrait raw/200%-reduced visual geometry: 320×693 and 393×742, all five tabs, starter/expanded | Verifier probe captures 40 original-resolution states. Every state: no horizontal overflow, no nested pipeline/library/tray scroll, HUD visible in first viewport, fixed nav within viewport, D-032 summaries/visible controls at least 44px. Visual inspection confirms readable raw and scaled decks. | Pass |
| D-018 raw Jobs 8px safety reserve; V-077 selected-card raw/scaled regression | Fresh raw initial Queue 1 clearance: `136.45px` at 320×693 and `157.31px` at 393×742. Post-settlement raw card retains three tracks/one-row title-price; 200%-reduced card has two tracks, separate grid areas, complete in-viewport text, zero intersections, no horizontal overflow. | Pass |
| Keyboard, screen-reader names, representative real touch, touch target, reduced motion | Touch context reports `navigator.maxTouchPoints: 1`; keyboard Space and `.tap()` flows work. AX inspection records native summary names. Fresh global-scope target audit and canonical all-control regressions report no undersized actionable control. | Pass |
| No unintended routing/state consequence: tab-scroll, placement cancellation/focus, Career App-session draft | Fresh probe: Escape restores detail-origin focus; tab change clears pending placement; per-tab scroll restores after clean route; Career draft survives 64×/tabs but resets on reload (`3` → `0`). Canonical retained cancellation/focus/Career concurrency/recovery tests pass. | Pass |
| Retained pointer and actual CDP-touch drag / durable reload | Fresh visible 393×900 coordinate drags both swap Prepare to Quantized Model and Runtime to Basic Cleaner in DOM and durable slots; both survive reload. | Pass |
| Persistence, malformed recovery, root/Pages PWA and offline | Fresh invalid JSON save recovers to Queue-one route without errors. Fresh root controlled offline reload retains save and service-worker controller. Canonical PWA A/B/rejection/cache isolation/root+Pages cases and Pages offline cases pass. | Pass |
| Retained first-session, Jobs, Worker/determinism, balance, integrity/security boundaries | Candidate diff excludes these production boundaries; clean canonical 223-unit / all six balance lanes / root 217 / Pages 2 and `npm audit --omit=dev --audit-level=high` zero production vulnerabilities pass. | Pass |
| Candidate E2E migration preserves valid assertions | Audited each changed candidate test. Direct speed/help selectors were replaced with helpers that open the new native disclosures, while retaining the original semantic assertion (selected speed, warning, motion, settlement, persistence, focus, geometry). Candidate additionally adds compact global keyboard/touch, 200%-geometry, warning-details, focus-return, and Configure/Observe-invariance coverage. No valid assertion was deleted or weakened; immutable round-076 remained untouched. | Pass |
| Scope boundary | Source/diff audit and fresh state invariance: no new framework, Worker message, simulation/state/schema/persistence/routing/onboarding/Career/Jobs/placement/resource/PWA/bottom-nav behavior. | Pass |

## Findings

None. The candidate meets the owner-authorized first-viewport/global-chrome scope and all applicable retained regression gates.

## Unverified areas

- No hosted deployment of this exact verifier commit, non-Chromium engine, or native screen-reader speech session. AX-tree names are concrete accessibility evidence but do not replace human speech/navigation testing.
- iOS and Android were genuine smoke opens/navigation screenshots, not an exhaustive install/offline/accessibility test on physical devices. Repository-pinned Playwright remains the acceptance authority.

## Residual risks

- macOS workspace sandbox requires scoped host browser launch because of its Mach-port policy; all authoritative browser checks used the repository-pinned browser/cache under that scoped launch.
- Ordinary locked install reports four development-chain advisories. Candidate has no dependency change; production-only audit is clean.
- The preliminary concurrent build-output interference demonstrates that parallel writers to shared `dist` can corrupt an in-flight suite. The candidate's isolated fixture sequence and clean canonical run both pass; keep verification roles sequential as required by `AGENTS.md`.
