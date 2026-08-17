# Commercial release acceptance matrix

Status: active Milestone 7 routing and acceptance contract. Navigation only;
`plan.md`, `.agent/DECISIONS.md`, immutable verifier reports, and live
`./scripts/agent-status` remain authoritative. The frozen M7A receipt below is
historical evidence for one exact deployed candidate; it does not close the
remaining commercial-release matrix.

## Release boundary

The first release remains the tested Bedroom Developer → Local AI Laboratory
product. Startup, workforce, government, remote/generative content, and later
expansions remain out of scope under D-040 and `plan.md` §29. The release gate
requires the complete applicable product suite, a fresh independent Verifier
`PASS`, hosted exact-SHA verification, and deployment of that exact accepted
SHA. Optional playtesting never becomes an undocumented blocker.

## Frozen M7A release receipt

The following receipt is retained as historical release evidence under D-043;
it is not a live-HEAD, latest-verdict, or next-gate claim.

| Receipt                  | Evidence                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted candidate       | `d25e80e6781de89e80fc3b3c240a922ada53d978`                                                                                                                                                                                                                                |
| Independent verification | Round 099 report `.agent/verification/round-099.md`; verifier/report commit `efaa1890751588abfc6728fab779a44e2650a2db`                                                                                                                                                    |
| Hosted Verify            | [run 32071396270](https://github.com/fabian20ro/goldilocks-engine/actions/runs/32071396270), attempt 2: all five lanes and aggregate succeeded. The first attempt cancelled portrait setup after a runner-infrastructure stall; only cancelled/dependent jobs were rerun. |
| Candidate handoff        | `main` was fast-forwarded to the exact accepted candidate.                                                                                                                                                                                                                |
| Rejected tag deploy      | [run 32072911527](https://github.com/fabian20ro/goldilocks-engine/actions/runs/32072911527) built successfully, then environment policy disallowed the tag.                                                                                                               |
| Successful deploy        | [main exact-SHA deploy run 32073014870](https://github.com/fabian20ro/goldilocks-engine/actions/runs/32073014870)                                                                                                                                                         |
| Live target              | [GitHub Pages site](https://fabian20ro.github.io/goldilocks-engine/)                                                                                                                                                                                                      |
| Build identity           | Live/local `build-info.json`: version `dc97ee41f6dbbc0e29d2`, scope `/goldilocks-engine/`, matching service-worker ID.                                                                                                                                                    |
| Live smoke               | 320×693 portrait smoke clean; zero console errors.                                                                                                                                                                                                                        |

The receipt confirms the exact accepted M7A candidate was hosted and deployed;
it does not imply that WebKit/native speech, device performance, writing,
save-support, localization, audio, or packaging gates are complete.

## Milestone 7 matrix

| Area                       | Required acceptance evidence                                                                                                                                                                                                | Current routing state                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Balance and strategy       | Deterministic unit/property/scenario checks; balance sweeps for the Bedroom → Lab route; no dominant strategy within declared bounds; viable recoveries and varied endings                                                  | Baseline evidence is retained by round 093; rerun and record the release matrix after M7 changes |
| Accessibility              | 320/393 portrait; 200% and pseudo-localized text; 44px controls; keyboard; touch; visible focus; screen-reader names/live updates; reduced motion; no color-only meaning; WebKit smoke; native VoiceOver/TalkBack checklist | Chromium/M7A evidence and live smoke are retained; WebKit/native speech is the first M7B gate    |
| Mobile performance         | Clean install measurements for representative 320/393 portraits; LCP/INP/CLS budgets; low-end Android CPU/memory; Worker 1×/64× cost; battery/thermal observation; offline startup                                          | Baseline payload is recorded in the audit; measured device evidence is the first M7B gate        |
| Writing and density        | Editorial pass for every primary card and disclosure: consequence, cost/risk, next action; no duplicated onboarding; concise locked states; screenshot review at raw and scaled widths                                      | Open; use the existing progressive-disclosure grammar                                            |
| Audio                      | Small local cue set for important settlement/warning/completion transitions; persistent mute; visual equivalent for every cue; no remote or generative dependency                                                           | Open; not part of the M7A receipt or M7B OIV implementation                                      |
| Save stability             | Golden fixtures for supported schema/content history; malformed/stale/unsealed recovery; reload/offline; update across old saves; explicit supported-version policy; no duplicate commands or deductions                    | Runtime recovery evidence is strong; release fixture matrix and support policy remain open       |
| Localization readiness     | Stable message catalog; locale-aware number/currency/plural formatting; pseudo-localization; expansion-safe cards and disclosures; stable internal IDs                                                                      | Open; translation implementation is not part of M7A/M7B                                          |
| Packaging and distribution | Root and Pages PWA install/update/offline; deterministic build identity; release notes/version display; supported browser/OS matrix; rollback procedure; explicit PWA-only versus store-package decision                    | PWA mechanics are covered; distribution target and release receipt remain open                   |
| Deployment and operations  | Fresh Verifier report names exact candidate SHA; hosted aggregate passes; Pages deploys that SHA; live `build-info.json` matches; clean branch and post-deploy smoke                                                        | External release-owner gate; never inferred from local PASS                                      |

## Milestone 7B OIV-first handoff

Milestone 7B is bounded to closing cross-engine/native accessibility and
measured mobile-performance evidence first. It may correct a concrete product
defect exposed by those checks, but it adds no simulation, content, navigation,
persistence, analytics, audio, localization, or packaging feature.

### Measurable gates

1. **Pinned WebKit:** add a repository-pinned `test:e2e:webkit` lane using the
   ignored repository-local Playwright cache and deterministic loopback startup.
   At 320×693 and 393×742, normal and reduced-motion runs must show all eight
   destinations in stable order, retain 44px targets, keep document overflow at
   zero, reveal the active tab after direct, keyboard, and touch activation, and
   report zero page/console errors. Repeat with 200% text, reload, and offline
   resume. The lane must be invoked by `./scripts/verify`.
2. **Native VoiceOver/TalkBack:** on an available iOS Simulator and available
   unlocked USB Android, exercise the shipped PWA in the native browser. A
   machine-readable or tabular artifact must record device/OS/browser/build
   identity, actual CSS viewport, text-scale/reduced-motion settings, and each
   result. VoiceOver and TalkBack must each announce all eight tab names, the
   active-page state, the 320px horizontal-reveal instruction, and the first
   actionable control; each must activate/reveal the destination at least once
   at both representative portrait widths. Missing device access is BLOCKED
   for that gate, not a Chromium or AX-tree substitute.
3. **Measured mobile performance:** collect five cold clean-install runs per
   device/browser and report raw traces plus median and p95. Gate absolute
   metrics at LCP ≤ 2.5s, INP ≤ 200ms, and CLS ≤ 0.10; record offline startup,
   Worker 1× and 64× cost, JS/CSS transfer, memory, and battery/thermal
   observations. Startup, Worker CPU, memory, and offline startup must also be
   no worse than 120% of the same-device baseline captured from the frozen
   accepted build. A physical-device battery/thermal result is required; a
   simulator-only observation is informative but does not close that sub-gate.
4. **Independent evidence:** the fresh Verifier report maps every result to
   the exact candidate SHA, includes screenshots/traces or artifact checksums,
   names unavailable infrastructure, and exercises the Rule of Three below.

### Rule of Three

- **Normal:** WebKit/native portrait navigation and first-action reachability at
  393px, with the performance baseline and target geometry recorded.
- **Boundary:** 320×693 with 200% text and reduced motion; horizontal reveal,
  accessible names/active state, touch/keyboard activation, and no document
  overflow or clipped target.
- **Lifecycle:** clean install, reload/offline resume, and repeated 1×/64×
  Worker runs with device resource observation; preserve the app/PWA identity
  and report any storage, thermal, or browser failure/recovery.

### Device/browser matrix

| Environment                          | Required use                                     | Required evidence                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository-pinned Chromium           | Retained baseline at 320×693 and 393×742         | Existing root/PWA lane and M7A navigation regressions remain green; capture the same performance counters for baseline comparison.                               |
| Playwright WebKit                    | Cross-engine browser lane at 320×693 and 393×742 | Normal/boundary/lifecycle checks, reduced motion, 200% text, reload/offline, touch/keyboard, target geometry, and zero page/console errors.                      |
| iOS Simulator + Safari               | VoiceOver semantics and iOS startup/reload smoke | Record simulator model/OS, Safari build, actual CSS viewport, VoiceOver announcements/activation, text scale, reduced motion, offline result, and screenshots.   |
| Unlocked USB Android device + Chrome | TalkBack and physical mobile performance         | Record model/OS/Chrome, actual CSS viewport, TalkBack announcements/activation, cold-start traces, memory/CPU, offline startup, and battery/thermal observation. |

### Scripts and artifact expectations

The next candidate must expose exact package-manager commands for the WebKit
lane and performance collection, and call them from `./scripts/verify` after
the catalog/static lanes. Installation must remain local-cache based:

```sh
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
npm ci
npx playwright install webkit
npm run test:e2e:webkit
./scripts/run
```

Native checks should use the existing round-078 patterns (`xcrun simctl` for
the iOS Simulator, `adb`/`adb reverse` for USB Android), with deterministic
loopback URLs and explicit teardown. Commit a small machine-readable summary
containing candidate SHA, device/browser identity, settings, viewport, metric
samples, thresholds, result, and raw-artifact paths/checksums; retain bulky
traces, screenshots, and device logs in ignored `.cache/` or CI artifacts.
The handoff and independent report must record exact commands and cleanup.

### Infrastructure limits and blocked behavior

The managed macOS browser sandbox may require scoped host authority for pinned
Chromium/WebKit launch. An unavailable iOS Simulator, unlocked USB Android,
physical battery/thermal measurement, or browser install is a concrete
infrastructure blocker for its gate. Record the command and error, preserve
partial evidence, and return BLOCKED; never silently mark the gate passed from
Chromium, an in-app browser, an AX tree, or simulator-only thermal data.

### Explicit non-goals and later priorities

M7B does not implement writing/density polish, supported-save fixtures or
version policy, localization readiness, audio, or the PWA-only versus store
packaging/distribution decision. Those remain prioritized later M7 work, in
that order after the OIV gates. It also does not add startup/workforce/
government/remote content, new destinations, new simulation commands,
telemetry, a native wrapper, or a broad architecture rewrite.

## Retained Milestone 7A acceptance slice

This frozen slice prepared the release work without adding startup content or
rewriting the architecture; its navigation/PWA checks remain M7B regressions.

1. `CURRENT_SCOPE.md` and `verification/INDEX.md` route the accepted
   Milestone 6 history and active Milestone 7 work without volatile claims.
2. `verification/catalog.json` is machine-validated by
   `scripts/validate-verification-catalog.mjs` and is called from
   `scripts/verify` before expensive lanes.
3. `.agent/HANDOFF.md` contains only the current candidate handoff; immutable
   reports and Git history retain prior handoffs and findings.
4. The eight primary tabs retain stable order and at least 44px targets. At
   320px the strip exposes a visible direction cue, announces horizontal
   disclosure to assistive technology, and reveals the active destination after
   keyboard, touch, or programmatic tab changes. At 393px all destinations fit
   without an overflow cue.
5. Pinned browser coverage proves the navigation Rule of Three:

   - normal: stable order, complete 393px visibility and target geometry;
   - boundary: 320px overflow cue, horizontal reveal, keyboard and touch;
   - lifecycle: 200% text, resize, active-tab transition, reload and focus.

6. The candidate handoff records exact focused commands, the canonical command,
   the browser cache/startup contract, skipped checks, and independent
   verification requirements.

## Gate order

1. Run the machine-validated catalog and focused M7B tests (retaining M7A
   navigation/PWA regressions).
2. Run one final `./scripts/verify` after executable edits are complete.
3. Freeze the candidate commit and hand only its exact SHA to a fresh Verifier.
4. After an independent `PASS`, run hosted exact-SHA aggregation and Pages
   deployment. Record the receipt separately; do not turn local evidence into
   a release claim.
5. Complete the remaining prioritized Milestone 7 matrix before startup
   expansion.
