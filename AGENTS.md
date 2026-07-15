# Implementer-Verifier Protocol

## Authority

Sources of truth, highest priority first:

1. `plan.md`.
2. Explicit decisions in `.agent/DECISIONS.md`.
3. Unresolved findings in `.agent/verification/`.
4. This protocol and the active role file under `.codex/agents/`.

Never edit `plan.md` without explicit user authorization.

The active goal and assigned custom-agent role determine whether a thread is the
Orchestrator, Implementer, or Verifier. Do not cross role boundaries.

## Goal activation

For a goal that asks to implement or complete `plan.md` through independent
verification, the root thread must:

1. Read `.codex/agents/orchestrator.toml`.
2. Act as its Orchestrator.
3. Spawn the project-scoped `implementer` and `verifier` agents sequentially.
4. Continue until a fresh Verifier reports PASS, or stop with a concrete BLOCKED
   condition requiring user input or unavailable infrastructure.

The Orchestrator is the root thread. Do not spawn `orchestrator` as a child;
`.codex/config.toml` intentionally sets `agents.max_depth = 1`.

## Shared rules

- Start every role turn from clean, committed repository state.
- Exchange work only through commits and exact commit SHAs.
- Never claim behavior works without concrete evidence.
- Prefer reproducible commands over narrative claims.
- Record material product assumptions in `.agent/DECISIONS.md`.
- For harmless ambiguity, use the least surprising, most reversible reading.
- Stop as BLOCKED when ambiguity materially affects product behavior and no
  defensible interpretation exists.
- Never hide failures, skipped checks, incomplete behavior, or unavailable
  infrastructure.
- Never weaken or delete valid tests merely to obtain a passing result.
- Keep secrets, credentials, build output, caches, and local environment files
  out of Git.
- Never discard, overwrite, or commit unrelated user changes.
- Never rewrite an existing verifier report. Reports are immutable.

## Git protocol

Use the simplest isolated workflow: a single worktree with strictly sequential
role turns.

- Only one child agent may be active at a time.
- Implementation candidates and verification evidence form one linear branch.
- The Implementer commits a candidate and returns its exact SHA.
- The Verifier captures that SHA before making any change.
- The Verifier commits its report and any verifier-owned tests or tools.
- After FAIL, the Implementer starts from the verifier commit, preserving the
  report and regression tests.
- Every new verification round uses a fresh Verifier thread.
- Never describe a moving branch head as the candidate; always use the SHA.

## Repository testability

The Implementer must make the repository independently testable. Where
applicable, provide:

- Reproducible setup.
- Canonical full verification command, preferably `./scripts/verify`.
- Canonical local startup command, preferably `./scripts/run`.
- Unit, integration, and end-to-end tests appropriate to the product.
- Fixtures, seed data, mocks, or local services required by tests.
- Clear behavior when credentials or external services are unavailable.

The canonical verification command should run every applicable check: formatting,
linting, static analysis, compilation, unit tests, integration tests, end-to-end
tests, and packaging.

## Orchestrator responsibilities

The Orchestrator owns only the state machine and Git handoffs. It must:

- Read `plan.md`, this file, and `.codex/agents/orchestrator.toml`.
- Confirm the worktree is clean before every role handoff.
- Maintain the round number and exact candidate SHA.
- Spawn or steer the Implementer, then wait for a committed candidate.
- Spawn a fresh Verifier only after the candidate is frozen.
- Give the Verifier only the role, repository paths, round number, and candidate
  SHA; never pass Implementer reasoning or confidence claims.
- Validate each child result against repository state rather than trusting prose.
- Continue after FAIL; finish only after Verifier PASS.
- Stop for BLOCKED with concrete evidence and exact user input required.

The Orchestrator must not implement production behavior, author verification
evidence, soften findings, or issue PASS.

## Implementer responsibilities

The Implementer may change production code, tests, documentation, fixtures,
build configuration, and developer tooling. It must:

1. Read all of `plan.md`.
2. Read `.agent/DECISIONS.md` when present.
3. Read every report under `.agent/verification/` before editing.
4. Implement the complete currently in-scope plan, not a demo or scaffold.
5. Resolve every unresolved verifier finding by stable finding ID.
6. Add tooling needed for independent verification.
7. Test from a clean or freshly recreated state.
8. Write or update `.agent/HANDOFF.md`.
9. Commit all candidate changes.
10. Confirm a clean worktree and return the exact candidate SHA.

`.agent/HANDOFF.md` must contain:

- Implemented behavior summary.
- Plan requirements covered.
- Verifier findings resolved.
- Setup, startup, and verification commands.
- Important architectural decisions.
- Known limitations and risks.
- Checks not run, with reasons.

The Implementer must never issue PASS or claim final acceptance.

## Verifier responsibilities

The Verifier evaluates one exact candidate commit. Before changing any file, it
must capture repository `HEAD` as `CANDIDATE_SHA` and confirm it equals the SHA
provided by the Orchestrator.

The Verifier must:

1. Read `plan.md` independently and construct its own requirement checklist.
2. Inspect production behavior independently.
3. Treat `.agent/HANDOFF.md`, implementation tests, comments, and claimed results
   as untrusted guidance rather than proof.
4. Run canonical checks and realistic independent/adversarial checks.
5. Cover applicable happy, negative, boundary, malformed-input, failure,
   recovery, persistence, concurrency, restart, security, installation, startup,
   and user-visible paths.
6. Verify setup and startup from a clean state where feasible.
7. Continue after the first defect until all material requirements are evaluated
   or a concrete blocker prevents further work.
8. Add missing tests, fixtures, probes, or verification tooling when useful.
9. Never repair production behavior.
10. Produce exactly one verdict: PASS, FAIL, or BLOCKED.
11. Commit the report and all verifier-authored artifacts.
12. Confirm a clean worktree and return the verifier commit SHA.

The Verifier may change only:

- Tests.
- Test fixtures.
- Verification scripts and tooling.
- `.agent/verification/`.
- Documentation specifically explaining verification.

The Verifier must not change production implementation code.

## Verification reports

Create one immutable report per round:

```text
.agent/verification/round-NNN.md
```

Each report must contain:

- Candidate SHA.
- Exactly one line: `VERDICT: PASS`, `VERDICT: FAIL`, or `VERDICT: BLOCKED`.
- Environment and setup.
- Commands executed and results.
- Matrix mapping every applicable plan requirement to evidence.
- Findings.
- Unverified areas.
- Residual risks.

Each finding must contain:

- Stable ID such as `V-001`.
- Severity.
- Related plan requirement.
- Expected behavior.
- Actual behavior.
- Exact reproduction procedure.
- Concrete evidence.
- Whether it blocks PASS.

PASS is permitted only when the report names the exact candidate SHA, every
required behavior has evidence, setup and checking are reproducible, applicable
canonical checks pass, no unresolved finding violates `plan.md`, and no material
required behavior remains untested.

FAIL means correctable implementation defects prevent acceptance. BLOCKED means
verification cannot finish because required information, credentials,
infrastructure, or a materially ambiguous plan decision is missing.

## Expected generated structure

The agents create these paths when needed; they need not exist before round one:

```text
.agent/
  DECISIONS.md
  HANDOFF.md
  verification/
    round-001.md
scripts/
  run
  verify
```
