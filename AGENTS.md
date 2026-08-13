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

## Progressive-disclosure reading

`plan.md`, decisions, and immutable reports remain the authority order above.
The following records are a compact routing layer, never a substitute for that
authority:

```text
.agent/CURRENT_SCOPE.md
.agent/verification/INDEX.md
```

For a narrow repair, read in this order:

1. This protocol and the active role file.
2. Run `./scripts/agent-status` (or `./scripts/agent-status --json`) from the
   repository. It is the live, read-only Git/report status source; it must
   succeed before a lean route is trusted.
3. `CURRENT_SCOPE.md`.
4. `verification/INDEX.md`.
5. The exact plan sections, decisions, unresolved reports, last accepted PASS,
   regression tests, and archived probes named there.

Read the full plan, complete decisions log, and complete verification archive
when doing release verification, broad architectural or cross-milestone work,
when the routing records are missing/incomplete/conflicting, or when explicitly
requested. Expand immediately whenever the cited sources do not establish a
safe scope. Do not infer missing authority from a summary.

`CURRENT_SCOPE.md` and `INDEX.md` are stable routing maps: label frozen
history/scope explicitly and name exact source references, but never make a
live current-HEAD, latest-round, acceptance, or next-gate claim. The status
command derives those facts from immutable reports and Git. `INDEX.md` maps
the relevant finding history to its report, candidate regression, canonical
lane, and retained adversarial probe. A failed status command, stale map, or
incomplete routing record triggers the full-read route until corrected in an
authorized commit.

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
- Use at most three ordinary milestone checkpoints per role turn: scope/root
  cause, focused evidence, and final evidence/hand-off. A direct user status
  request may receive an immediate concise answer without opening a new work
  phase.
- Use focused checks while changing a seam. Run at most one final
  `./scripts/verify` per role turn, after all intended executable changes. If
  material executable work changes after that gate, do not conceal the stale
  result: hand off the delta or begin a fresh role turn rather than looping
  canonical runs.

### Lean and release loops

- **Lean repair:** use the routing order above, inspect the exact production
  seam, prove a Rule-of-Three invariant review, run mapped focused checks, and
  run one final canonical gate when the changed product/tooling risk warrants
  it. Record any skipped canonical gate and its rationale.
- **Release verification:** take the full-read route, exercise the complete
  canonical suite plus all current archived probes, obtain a fresh independent
  Verifier `PASS`, and deploy that exact accepted SHA. A local candidate or
  passing implementation test is never a release substitute.

### Rule-of-Three same-seam review

For a repeated defect seam, name and test three connected cases before handoff:

1. Normal valid-state behavior.
2. The closest malformed, recovery, or adversarial boundary.
3. A lifecycle or cross-feature neighbor (for example reload/offline, later
   event ordering, concurrency, or an adjacent UI input path).

The current scope/index may supply the exact three cases. Do not replace them
with a broader but unrelated smoke test.

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

### Browser and JavaScript testability

When the candidate includes a browser UI or PWA:

- Pin Playwright as a project dependency; do not rely on a global CLI, an
  existing browser profile, or the in-app Browser.
- Expose a canonical package-manager `test:e2e` command and invoke it from
  `./scripts/verify`.
- Make dependency and browser installation work without writing to a user home
  cache. Use ignored repository-local caches or an operating-system temporary
  directory, and keep every cache and downloaded browser out of Git.
- Start the application on a deterministic loopback address through
  `./scripts/run` or Playwright-managed server configuration, wait for readiness,
  and clean up every process after verification.
- Exercise representative portrait widths, including 320 and 393 CSS pixels,
  and the applicable touch/drag, text-scaling, reduced-motion, persistence,
  reload/resume, offline, and failure/recovery paths.
- Treat Playwright automation as reproducible acceptance evidence. The in-app
  Browser may supplement exploratory or visual inspection but never replaces
  committed checks.
- Never silently skip required browser checks because installation or launch is
  unavailable. Record the failure and return BLOCKED when infrastructure, rather
  than a correctable candidate defect, prevents verification.

## Orchestrator responsibilities

The Orchestrator owns only the state machine and Git handoffs. It must:

- Follow the progressive-disclosure reading route before each handoff; take the
  full-read route when its escalation conditions apply.
- Confirm the worktree is clean before every role handoff.
- Maintain the round number and exact candidate SHA.
- Spawn or steer the Implementer, then wait for a committed candidate.
- Spawn a fresh Verifier only after the candidate is frozen.
- Give the Verifier only the role, current-scope/index paths, repository paths,
  round number, and candidate SHA; never pass Implementer reasoning or
  confidence claims.
- Validate each child result against repository state rather than trusting prose.
- For candidates with a browser UI, validate that `.agent/HANDOFF.md` names the
  reproducible browser install, startup, and end-to-end verification commands.
- Continue after FAIL; finish only after Verifier PASS.
- Stop for BLOCKED with concrete evidence and exact user input required.

The Orchestrator must not implement production behavior, author verification
evidence, soften findings, or issue PASS.

## Implementer responsibilities

The Implementer may change production code, tests, documentation, fixtures,
build configuration, and developer tooling. It must:

1. Follow the progressive-disclosure reading route before editing.
2. Independently read every exact source cited by the current scope/index.
3. Take the full-read route when its listed escalation conditions apply.
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

1. Follow the progressive-disclosure reading route independently and construct
   its own requirement checklist from the cited authoritative sources.
2. Take the full-read route for release/broad/missing-index/explicit-request
   conditions or whenever a cited source is insufficient.
3. Inspect production behavior independently.
4. Treat `CURRENT_SCOPE.md`, `INDEX.md`, `.agent/HANDOFF.md`, implementation
   tests, comments, and claimed results as untrusted guidance rather than proof.
5. Run canonical checks and realistic independent/adversarial checks.
6. Cover applicable happy, negative, boundary, malformed-input, failure,
   recovery, persistence, concurrency, restart, security, installation, startup,
   and user-visible paths.
7. Verify setup and startup from a clean state where feasible.
8. Continue after the first defect until all material requirements are evaluated
   or a concrete blocker prevents further work.
9. Add missing tests, fixtures, probes, or verification tooling when useful.
10. Never repair production behavior.
11. Produce exactly one verdict: PASS, FAIL, or BLOCKED.
12. Commit the report and all verifier-authored artifacts.
13. Confirm a clean worktree and return the verifier commit SHA.

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
