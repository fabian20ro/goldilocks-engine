# Release receipt — Round 116 M7D exact-SHA deployment

Receipt status: DEPLOYED

This receipt records the external release-owner actions performed after the
independent Round 116 PASS. It identifies the exact M7D candidate deployed to
`main` and GitHub Pages; it does not close the parked M7B commercial gate.

Candidate SHA: `caa334945f5b0a89bc1452609e9b118ba042df01`
Verifier report: `.agent/verification/round-116.md`
Verifier commit: `2012dcddf6a25fc781fbd7efe0b6b133f148ad2b`

Hosted Verify run: [32582068882](https://github.com/fabian20ro/goldilocks-engine/actions/runs/32582068882)
Hosted Verify branch: `release/round-116-candidate`
Hosted Verify head SHA: `caa334945f5b0a89bc1452609e9b118ba042df01`
Hosted Verify conclusion: `success`

Pages deployment run: [32582472823](https://github.com/fabian20ro/goldilocks-engine/actions/runs/32582472823)
Pages deployment branch: `main`
Pages deployment head SHA: `caa334945f5b0a89bc1452609e9b118ba042df01`
Pages deployment conclusion: `success`
Remote main SHA: `caa334945f5b0a89bc1452609e9b118ba042df01`

Live URL: https://fabian20ro.github.io/goldilocks-engine/
Live HTTP status: `200`
Live build-info version: `45330c2e3a0014a55b93`
Live build-info scope: `/goldilocks-engine/`
Live build-info cache name: `goldilocks-shell:/goldilocks-engine/:45330c2e3a0014a55b93`
Live service-worker build ID: `45330c2e3a0014a55b93`
Live smoke: PASS — 320×693 portrait, no document overflow, Jobs navigation and
dominant action reachable, zero console errors and zero console warnings.

Observed: `2026-08-23` Europe/Bucharest; live `build-info.json` and generated
service-worker identity were fetched after the Pages run completed.

Commercial status: M7D exact-SHA deployment is recorded. M7B WebKit/native /
physical-performance evidence remains an explicit parked BLOCKED gate under
D-043/D-044 and requires the operator actions in `.agent/HANDOFF.md`.
