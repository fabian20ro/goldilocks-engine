# Verification round 095 — Milestone 7A navigation repair

Candidate SHA: `bf8bdd7ff669ddfe32eacef118bb8e989c9ec6ef`

VERDICT: PASS

## Scope and authority

Evaluated exactly the supplied candidate SHA. Before any verifier artifact was
written, `git rev-parse HEAD` matched the supplied SHA. The progressive route
read `AGENTS.md`, `.codex/agents/verifier.toml`, live
`./scripts/agent-status`, `.agent/CURRENT_SCOPE.md`,
`.agent/verification/INDEX.md`, the active catalog, `plan.md` §§2.4, 20, 24,
27, 29, and 34, D-040–D-041, `.agent/RELEASE_ACCEPTANCE.md`, the accepted
round-093 report and probes, the unresolved round-094 report and probe, and
the exact candidate navigation sources.

Independent checklist:

- catalog routing is machine-valid and does not replace immutable authority;
- eight destinations retain stable order, bottom-tab-only routing, and 44px
  targets;
- 393px normal fit, 320px cue/instruction, keyboard/touch reveal, 200% text,
  resize, focus, reload, offline, and document-overflow safety;
- retained deterministic, persistence, offline, PWA, accessibility, and Lab
  contracts remain green;
- the commercial release matrix remains explicit, with open external gates
  honestly recorded.

Routing records, handoff text, implementation tests, and claimed results were
treated as untrusted guidance. The candidate implementation was inspected and
behavior was exercised independently.

## Environment and setup

- macOS arm64; Node `v26.7.0`; npm `11.19.0`.
- Repository-pinned Playwright `1.61.1`; Chromium in ignored
  `.cache/ms-playwright`; npm cache in ignored `.cache/npm`.
- The initial sandboxed Chromium launch failed before test bodies with the
  macOS Mach-port rendezvous permission error. The same scoped commands were
  rerun with host authority and passed; no required browser lane was skipped.
- Pinned preview servers became ready on loopback and were terminated by each
  probe. Ports 42493–42496 were confirmed clean after the focused runs.

## Commands executed and results

| Command / evidence | Result |
| --- | --- |
| `git rev-parse HEAD`; `./scripts/agent-status`; authority and routing reads | Candidate SHA matched; status parsed cleanly; active scope and cited authorities were read. |
| `npm run validate:verification-catalog` before verifier artifacts | Passed: 94 immutable reports, 95 findings, 4 active requirements. |
| `npm run format:check && npm run lint && npm run typecheck` before and after the verifier probe | Passed both times. |
| `E2E_PORT=42496 npm run test:e2e -- tests/e2e/navigation-affordance.spec.ts` with host authority | Passed 3/3 pinned navigation tests. The first sandboxed launch failed before test bodies due only to the documented Mach-port restriction. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42494 node .agent/verification/round-094-adversarial.mjs` with host authority | Passed with `findings: []`; prior V-094-001 resize case no longer reproduced. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42495 node .agent/verification/round-095-adversarial.mjs` with host authority | Passed with `findings: []`; independent all-tab 393/320/200%-text resize, keyboard activation, touch edge recovery, reload/offline, cue, target, overflow, and page/console checks. |
| `node .agent/verification/round-093-adversarial.mjs` | Passed with `findings: []`; retained Lab normal, malformed/recovery, capacity, persistence, and offline engine checks. |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright PORT=42493 node .agent/verification/round-093-ui-adversarial.mjs` with host authority | Passed with `findings: []`; retained Lab UI at 320/393, touch, reduced motion, 200% text, reload/offline, and error checks. |
| `INSTALL_PLAYWRIGHT=0 E2E_PORT=42497 VERIFY_EVIDENCE_DIR=.cache/verification/round-095-final npm_config_cache="$PWD/.cache/npm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright" ./scripts/verify` with host authority | Passed once after all executable verifier artifacts were ready: catalog, setup, format, lint, typecheck, 66 files/305 unit tests, all balance lanes, build, production audit (0 vulnerabilities), root browser/PWA 238/238, Pages/offline 2/2. |
| `npm run validate:verification-catalog` after this report and catalog resolution | Passed: immutable report archive and resolved finding routing remain machine-valid. |

## Requirement evidence matrix

| Applicable requirement | Evidence | Result |
| --- | --- | --- |
| `M7A-ROUTING-001`: current-scope/catalog routing and contradiction checks | Active catalog validation before the gate, canonical catalog lane, and post-report catalog validation. Immutable reports remain untouched. | Satisfied. |
| `M7A-NAV-001`: eight stable destinations, bottom-tab-only routing, 44px targets, narrow cue/instruction, active reveal | Candidate `App.tsx`/CSS inspection; pinned 3-test navigation suite; round-094 and independent round-095 probes confirm exact order, one primary nav, 44px minima, 393px fit, 320px cue/instruction, direct activation reveal, touch reveal, and no document overflow. | Satisfied. |
| `M7A-NAV-002`: normal/boundary/lifecycle browser behavior | Independent round-095 probe covers all eight destinations at normal 393px, narrow 320px, 200% text, keyboard activation, touch swipes, every-tab 393→320 resize, reload, offline loaded navigation, reduced motion, and page/console errors; canonical root browser passes 238/238. | Satisfied; V-094-001 resolved. |
| `M7A-RELEASE-001`: explicit commercial-release acceptance matrix | `.agent/RELEASE_ACCEPTANCE.md` explicitly records balance, accessibility, performance, writing, audio, save, localization, packaging, deployment, and gate order without claiming completion. | Satisfied as the active routing/documentation requirement; external matrix gates remain open. |
| Retained deterministic, persistence, offline, PWA, accessibility, and Lab boundaries from `plan.md`, D-040, and round 093 | Canonical unit/property/balance/build/audit/root/Pages lanes plus retained round-093 engine/UI probes. | Satisfied for exercised retained scope. |

## Findings

None. The active round-094 finding V-094-001 was not reproduced on the exact
candidate: active destinations remain visible after 393→320 resize at normal
and 200% text, including every tab in the independent probe. No material
applicable requirement remains without evidence.

## Unverified areas

- Native iOS/Android devices, WebKit, native VoiceOver/TalkBack speech output,
  low-end CPU/memory/battery/thermal measurements, audio, localization
  readiness, packaging/distribution decisions, hosted exact-SHA aggregation,
  and Pages deployment receipts remain open in the active commercial-release
  matrix.
- These open Milestone 7 matrix items are outside the bounded M7A navigation
  slice and do not prevent this candidate's scoped verdict.

## Residual risks

- The sandbox Mach-port restriction may affect equivalent local environments;
  host-authorized pinned reruns passed all required browser checks.
- The canonical gate ran before this immutable report and its catalog routing
  update. Its product evidence is valid for the candidate SHA; the focused
  post-report catalog check confirms only the verifier metadata update and the
  gate was not looped.
