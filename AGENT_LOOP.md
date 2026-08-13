# Sequential agent loop

This repository uses one root Orchestrator and sequential Implementer/Verifier
subagents in one worktree. Git commits are the mailbox and audit trail.

## Read scope first

For a narrow repair, read `AGENTS.md` and the active role, then
`.agent/CURRENT_SCOPE.md`, `.agent/verification/INDEX.md`, and every source they
cite. Those compact files route attention; `plan.md`, decisions, and immutable
reports remain authoritative. Use the full plan/decisions/archive route for
release verification, broad architecture, missing/conflicting index coverage,
or an explicit request.

## Start

1. Commit and push this setup.
2. Open a fresh Codex task at the repository root so project `.codex` settings
   and custom agents are loaded.
3. Ensure the repository is trusted and choose a permission mode that allows
   workspace edits and Git commits.
4. Enter this goal:

```text
/goal Act as the root Orchestrator defined in .codex/agents/orchestrator.toml. Implement every currently in-scope requirement in plan.md through the sequential Implementer-Verifier loop in AGENTS.md. Continue through fresh verification rounds until the Verifier commits VERDICT: PASS, or stop VERDICT: BLOCKED with concrete evidence and the exact human input required. Do not merge main or publish remote changes unless I explicitly authorize it.
```

The root task reads `orchestrator.toml`; it does not spawn that profile. With
`agents.max_depth = 1`, the root can spawn `implementer` and fresh `verifier`
children, while children cannot recursively delegate.

## Loop discipline

- Lean repair: exact seam, Rule-of-Three normal/adversarial/lifecycle review,
  mapped focused checks, then at most one final canonical gate.
- Release: full read, canonical gate plus archived probes, fresh independent
  PASS, then exact-SHA deployment.
- Keep at most three ordinary updates per role: scope/root cause, focused
  evidence, final handoff. Git SHAs—not summaries—carry state.

## Expected history

```text
chore: define agent implementation protocol
feat: implementation candidate 1
test: independent verification round 001 (FAIL)
fix: implementation candidate 2
test: independent verification round 002 (PASS)
```

Reports remain immutable under `.agent/verification/`. Verifier-authored tests
remain in later candidates as regression coverage.

## Inspect progress

```bash
git status --short --branch
git log --oneline --decorate --graph -20
grep -R "^VERDICT:" .agent/verification/
```

Use `/goal` to view status, `/goal pause`, `/goal resume`, `/goal edit`, or
`/goal clear` to control the active goal.
