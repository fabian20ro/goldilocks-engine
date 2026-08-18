# Commercial release acceptance matrix

Status: active Milestone 7 routing and acceptance contract. M7D save-stability
candidate work is routed below; navigation only;
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
SHA. Under D-044, unavailable physical/native/WebKit M7B evidence remains an
explicit commercial-release gate; it is never silently skipped or relabeled by
a development-candidate check. Optional playtesting never becomes an
undocumented blocker.

`./scripts/verify --profile=development` is the reproducible local candidate
profile. It runs the locally testable product and browser lanes, records
`m7b-commercial-gate=blocked`, and exits successfully only for candidate
verification. The default `./scripts/verify` and explicit
`./scripts/verify --profile=full-release` retain the WebKit/native/performance
lanes and return BLOCKED when the required physical evidence is unavailable.
The development profile is not commercial-release evidence.

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

| Area                       | Required acceptance evidence                                                                                                                                                                                                | Current routing state                                                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Balance and strategy       | Deterministic unit/property/scenario checks; balance sweeps for the Bedroom → Lab route; no dominant strategy within declared bounds; viable recoveries and varied endings                                                  | Baseline evidence is retained by round 093; rerun and record the release matrix after M7 changes                                                                                                                   |
| Accessibility              | 320/393 portrait; 200% and pseudo-localized text; 44px controls; keyboard; touch; visible focus; screen-reader names/live updates; reduced motion; no color-only meaning; WebKit smoke; native VoiceOver/TalkBack checklist | Chromium/M7A evidence and live smoke are retained; WebKit/native speech is the first M7B gate                                                                                                                      |
| Mobile performance         | Clean install measurements for representative 320/393 portraits; LCP/INP/CLS budgets; low-end Android CPU/memory; Worker 1×/64× cost; battery/thermal observation; offline startup                                          | Baseline payload is recorded in the audit; measured device evidence is the first M7B gate                                                                                                                          |
| Writing and density        | Editorial pass for every primary card and disclosure: consequence, cost/risk, next action; no duplicated onboarding; concise locked states; screenshot review at raw and scaled widths                                      | M7C candidate seam: live summaries, Details preservation, lock/recovery copy, and atlas are routed by D-045; independent verification remains required                                                             |
| Audio                      | Small local cue set for important settlement/warning/completion transitions; persistent mute; visual equivalent for every cue; no remote or generative dependency                                                           | Open; not part of the M7A receipt or M7B OIV implementation                                                                                                                                                        |
| Save stability             | Golden fixtures for supported schema/content history; sealed-only malformed/stale/unsealed recovery; reload/offline; update across old saves; explicit supported-version policy; no duplicate commands or deductions        | M7D candidate route: D-046 catalogue + D-047 trust policy, committed fixture corpus, single-boundary recovery report/status, and focused Browser Rule-of-Three evidence; independent verification remains required |
| Localization readiness     | Stable message catalog; locale-aware number/currency/plural formatting; pseudo-localization; expansion-safe cards and disclosures; stable internal IDs                                                                      | Open; translation implementation is not part of M7A/M7B                                                                                                                                                            |
| Packaging and distribution | Root and Pages PWA install/update/offline; deterministic build identity; release notes/version display; supported browser/OS matrix; rollback procedure; explicit PWA-only versus store-package decision                    | PWA mechanics are covered; distribution target and release receipt remain open                                                                                                                                     |
| Deployment and operations  | Fresh Verifier report names exact candidate SHA; hosted aggregate passes; Pages deploys that SHA; live `build-info.json` matches; clean branch and post-deploy smoke                                                        | External release-owner gate; never inferred from local PASS                                                                                                                                                        |

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

## Milestone 7C writing/density closure

M7C is presentation-only. Across Build, Jobs, Career, Upgrades, Inspect,
Research, Lab, World, and global/onboarding chrome, each primary surface must
state the live current state, consequence, cost or risk, and one next action.
Exact accounting, requirements, and evidence remain available in the existing
Details/ledger/record surfaces. Locked states identify the requirement,
current progress, and unlock action. Failure and recovery copy identifies
preserved work and the next recovery step. Existing inputs, commands,
persistence, navigation, engine, Worker, schema, economy, balance, and PWA
behavior remain unchanged; onboarding is not duplicated by destination copy.

M7C evidence is a pure-presenter Rule-of-Three unit suite plus a data-driven
Playwright screenshot atlas covering starter/expanded states for all eight
destinations at 320×693 and 393×742. The atlas also checks 100/200% text,
reduced motion, touch/drag, reload/resume, offline, failure/recovery, target
size, and overflow contracts. It is an implementation candidate gate only;
the parked M7B physical evidence remains required for commercial release.

## Milestone 7D save-stability closure

M7D is the bounded save-support and recovery slice authorized by D-046 and
the D-047 trust-boundary decision. It does not change `plan.md`, bump schema
7, add content, or close the parked M7B commercial gate.

### Audited support policy

The committed policy in `src/simulation/saveSupport.ts` is derived from exact
historical source commits and surviving deployment evidence, not guessed test
values. It supports schema 3 `pipeline-toy-2`, schema 4 `pipeline-toy-3`,
schema 5 `pipeline-toy-4`, schema 6 `bedroom-career-1`, and schema 7
`evaluation-replay-1`, `research-1`, `hype-fear-1`, and `local-lab-1`.
Round-061's live Pages inspection is the surviving public evidence for the
evaluation publication; D-043 and round 100 identify the exact Local
Laboratory deployment candidate and build `dc97ee41f6dbbc0e29d2`. Earlier
generations are explicitly legacy compatibility because their source and
migration history are auditable but no independent public deployment receipt
survives. Schema 1/2, unknown content, future records, and malformed records
fail closed.

### Fixture and transaction contract

`fixtures/save-fixtures/` contains one provenance/checksum/invariant-bearing
golden fixture for every supported generation. The data-driven
`src/simulation/saveFixtures.test.ts` harness proves deterministic migration,
serialize/restore idempotence, seed/RNG/task/quote/topology/accounting and
Career/Research/Hype/Laboratory/history retention where applicable, unique
event IDs, and no duplicate commands, tasks, deductions, rewards, money, or
events. Malformed, stale, unsealed, tampered, unsupported, and future
boundaries are covered explicitly. Schema 3–6 fixtures carry a documented
current deterministic seal over the audited reconstructed historical payload;
the generator does not claim those seals were present in the unavailable old
deployment artifacts.

The single restore boundary validates the applicable original seal before any
migration read. Valid sealed saves migrate fully and idempotently; absent,
stale, malformed, or otherwise invalid integrity preserves one bounded,
versioned raw source backup and resets the simulation to a fresh safe run.
No simulation progression is salvaged from that untrusted payload. Independent
UI preferences may remain. Future/unsupported records are never partially
interpreted. The UI status names what was preserved/reset and the next action;
storage failure leaves the run operable without claiming a backup.

### Rule of Three and retained contracts

1. Normal: supported sealed generation migration and deterministic
   serialize/restore idempotence.
2. Boundary: malformed/stale/unsealed/tampered/future/unsupported recovery,
   bounded raw backup before reset, no untrusted progression salvage, no
   partial future interpretation, and no duplicate effects.
3. Lifecycle: Worker publication, reload, offline shell resume, PWA A/B update
   regression, and 320/393 portraits retain a valid sealed run or the fresh
   reset baseline while preserving the M7C editorial/M7B parked contracts.

The focused commands are `npm run generate:save-fixtures`,
`npm run test:save-stability`, and `npm run test:e2e --
tests/e2e/save-stability.spec.ts`; the canonical development profile invokes
the committed fixture and root browser lanes through `./scripts/verify`.

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

1. Run the machine-validated catalog and focused M7C tests (retaining M7A
   navigation/PWA regressions and the parked M7B lane contract).
2. Run one final `./scripts/verify --profile=development` for a local
   candidate, or the default/full-release profile when release infrastructure
   is available; the latter must retain and report any M7B blocker.
3. Freeze the candidate commit and hand only its exact SHA to a fresh Verifier.
4. After an independent `PASS`, run hosted exact-SHA aggregation and Pages
   deployment. Record the receipt separately; do not turn local evidence into
   a release claim.
5. Complete the remaining prioritized Milestone 7 matrix before startup
   expansion.
