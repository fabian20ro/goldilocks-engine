# Candidate handoff — Round 099 workflow injection repair

## Implemented behavior summary

- Verify's aggregate step binds `inputs.candidate_ref` through the step
  environment and prints only the quoted `$CANDIDATE_REF` value.
- Audited every shell `run:` block in Verify and Pages. Dispatch input
  expressions remain only as checkout/action data or environment bindings; no
  `${{ inputs.* }}` expression is interpolated into shell text.
- Added workflow regression coverage for the complete shell-block audit and
  the exact round-098 payload `"; printf WORKFLOW_INJECTION_MARKER; #`. The
  payload is recorded as candidate data, with no second-command output or
  marker side effect.
- Preserved the immutable round-098 report, catalog history, exact-SHA gates,
  manual dispatch boundary, and all product behavior.

## Plan requirements covered

- D-042 / M7A-RELEASE-001: candidate identity remains a required frozen ref,
  exact checkout identity remains gated, and candidate summary output is
  shell-safe.
- Workflow verification remains manual-dispatch only, repository-cache based,
  and independently testable.
- No `plan.md` or immutable verifier report was edited; no new product scope or
  decision was introduced.

## Verifier findings resolved

- V-098-001: repaired the Verify aggregate's direct shell interpolation and
  added a regression that rejects the vulnerable pattern across both release
  workflows. A fresh independent Verifier must recheck the exact candidate.

## Setup, startup, and verification commands

Dependencies and browser assets use ignored repository-local caches:

```sh
./scripts/setup
./scripts/run
export npm_config_cache="$PWD/.cache/npm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
```

Focused and static checks run for this candidate:

```sh
npx vitest run --coverage=false src/test/verifyWorkflow.test.ts src/test/pagesWorkflow.test.ts
npm run validate:verification-catalog
npm run format:check
npm run lint -- --quiet
npm run typecheck
git diff --check
```

Canonical verification command for the next complete gate:

```sh
./scripts/verify
```

## Important architectural decisions

- GitHub Actions expressions are data-bound through `env`; shell code uses
  quoted environment variables. Checkout `with.ref` expressions are retained
  because they are action inputs, not shell interpolation.
- The exact malicious payload is executed only as a positional shell argument
  in the regression harness; the production pattern writes it as one summary
  field.

## Known limitations and risks

- This candidate requires a fresh independent Verifier run at its exact commit
  SHA. Hosted Verify/Pages dispatch, deployment, and live receipt remain
  external release gates.
- Native/WebKit accessibility, mobile performance, writing, audio,
  localization, packaging, and other Milestone 7 matrix items remain open.

## Checks not run / final evidence

- `./scripts/verify` was not rerun: this repair changes only release workflow
  YAML, workflow tests, and this handoff; Round-098's complete canonical gate
  already passed before V-098-001 was isolated. Rerunning product/browser/
  balance lanes would add no evidence for this narrow seam.
- Full `npm test`, browser E2E, balance, build, audit, and hosted dispatch were
  not rerun for the same scoped reason. The focused workflow suite passed 8/8;
  catalog validation, Prettier, lint, typecheck, and diff checks passed.
