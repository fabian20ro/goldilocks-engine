# Commercial release acceptance matrix

Status: active Milestone 7 routing and acceptance contract. Navigation only;
`plan.md`, `.agent/DECISIONS.md`, immutable verifier reports, and live
`./scripts/agent-status` remain authoritative. This document does not claim
that a release gate has passed.

## Release boundary

The first release remains the tested Bedroom Developer → Local AI Laboratory
product. Startup, workforce, government, remote/generative content, and later
expansions remain out of scope under D-040 and `plan.md` §29. The release gate
requires the complete applicable product suite, a fresh independent Verifier
`PASS`, hosted exact-SHA verification, and deployment of that exact accepted
SHA. Optional playtesting never becomes an undocumented blocker.

## Milestone 7 matrix

| Area                       | Required acceptance evidence                                                                                                                                                                                                | Current routing state                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Balance and strategy       | Deterministic unit/property/scenario checks; balance sweeps for the Bedroom → Lab route; no dominant strategy within declared bounds; viable recoveries and varied endings                                                  | Baseline evidence is retained by round 093; rerun and record the release matrix after M7 changes |
| Accessibility              | 320/393 portrait; 200% and pseudo-localized text; 44px controls; keyboard; touch; visible focus; screen-reader names/live updates; reduced motion; no color-only meaning; WebKit smoke; native VoiceOver/TalkBack checklist | Chromium evidence is strong; WebKit/native speech evidence remains open                          |
| Mobile performance         | Clean install measurements for representative 320/393 portraits; LCP/INP/CLS budgets; low-end Android CPU/memory; Worker 1×/64× cost; battery/thermal observation; offline startup                                          | Baseline payload is recorded in the audit; budgets and device evidence remain open               |
| Writing and density        | Editorial pass for every primary card and disclosure: consequence, cost/risk, next action; no duplicated onboarding; concise locked states; screenshot review at raw and scaled widths                                      | Open; use the existing progressive-disclosure grammar                                            |
| Audio                      | Small local cue set for important settlement/warning/completion transitions; persistent mute; visual equivalent for every cue; no remote or generative dependency                                                           | Open; not part of Milestone 7A implementation                                                    |
| Save stability             | Golden fixtures for supported schema/content history; malformed/stale/unsealed recovery; reload/offline; update across old saves; explicit supported-version policy; no duplicate commands or deductions                    | Runtime recovery evidence is strong; release fixture matrix and support policy remain open       |
| Localization readiness     | Stable message catalog; locale-aware number/currency/plural formatting; pseudo-localization; expansion-safe cards and disclosures; stable internal IDs                                                                      | Open; translation implementation is not part of Milestone 7A                                     |
| Packaging and distribution | Root and Pages PWA install/update/offline; deterministic build identity; release notes/version display; supported browser/OS matrix; rollback procedure; explicit PWA-only versus store-package decision                    | PWA mechanics are covered; distribution target and release receipt remain open                   |
| Deployment and operations  | Fresh Verifier report names exact candidate SHA; hosted aggregate passes; Pages deploys that SHA; live `build-info.json` matches; clean branch and post-deploy smoke                                                        | External release-owner gate; never inferred from local PASS                                      |

## Milestone 7A acceptance slice

This bounded slice prepares the release work without adding startup content or
rewriting the architecture.

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

1. Run the machine-validated catalog and focused M7A tests.
2. Run one final `./scripts/verify` after executable edits are complete.
3. Freeze the candidate commit and hand only its exact SHA to a fresh Verifier.
4. After an independent `PASS`, run hosted exact-SHA aggregation and Pages
   deployment. Record the receipt separately; do not turn local evidence into
   a release claim.
5. Complete the remaining Milestone 7 matrix before startup expansion.
