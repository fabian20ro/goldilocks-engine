import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const statusScript = join(repositoryRoot, "scripts/agent-status");
const temporaryRepositories: string[] = [];

function runGit(root: string, arguments_: string[]): string {
  const result = spawnSync("git", arguments_, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `git ${arguments_.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  return result.stdout.trim();
}

function commit(root: string, message: string): string {
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "--quiet", "-m", message]);
  return runGit(root, ["rev-parse", "HEAD"]);
}

function createRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "goldlocks-agent-status-"));
  temporaryRepositories.push(root);
  runGit(root, ["init", "--quiet"]);
  runGit(root, ["config", "user.email", "agent-status@example.test"]);
  runGit(root, ["config", "user.name", "Agent Status Test"]);
  writeFileSync(join(root, "README.md"), "fixture\n");
  commit(root, "chore: bootstrap fixture");
  return root;
}

function writeReport(
  root: string,
  round: string,
  candidate: string,
  verdict: "PASS" | "FAIL" | "BLOCKED",
  extra = "",
): string {
  const directory = join(root, ".agent", "verification");
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, `round-${round}.md`),
    `# Verification round ${round}\n\nCandidate SHA: \`${candidate}\`\n\nVERDICT: ${verdict}\n${extra}`,
  );
  return commit(root, `verify: record round ${round}`);
}

function createAcceptedPassFixture() {
  const root = createRepository();
  writeFileSync(join(root, "candidate.txt"), "candidate\n");
  const candidate = commit(root, "feat: candidate");
  const reportCommit = writeReport(root, "001", candidate, "PASS");
  return { candidate, reportCommit, root };
}

function runStatus(root: string, json = true) {
  return spawnSync(statusScript, json ? ["--json"] : [], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, LC_ALL: "C" },
  });
}

afterEach(() => {
  for (const root of temporaryRepositories.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("agent-status", () => {
  it("derives an accepted PASS at HEAD in human and JSON forms", () => {
    const { candidate, reportCommit, root } = createAcceptedPassFixture();
    const json = runStatus(root);
    const human = runStatus(root, false);

    expect(json.status).toBe(0);
    expect(human.status).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({
      latest_round: "001",
      latest_verdict: "PASS",
      latest_candidate_sha: candidate,
      latest_report_commit: reportCommit,
      accepted_round: "001",
      accepted_candidate_sha: candidate,
      accepted_verifier_commit: reportCommit,
      head: reportCommit,
      head_relation_to_accepted_verifier: "equal",
      head_equals_or_descends_accepted_verifier: true,
      unverified_later_changes: false,
      latest_is_unresolved_fail: false,
      verification_state: "accepted-pass",
      next_gate: "exact-sha-deployment",
      next_gate_target_sha: candidate,
    });
    expect(human.stdout).toContain("latest immutable round: 001");
    expect(human.stdout).toContain("next gate: exact-sha-deployment");
  });

  it("marks a descendant after an accepted report as unverified", () => {
    const { reportCommit, root } = createAcceptedPassFixture();
    writeFileSync(join(root, "candidate.txt"), "later candidate\n");
    const head = commit(root, "feat: later candidate");
    const status = runStatus(root);

    expect(status.status).toBe(0);
    expect(JSON.parse(status.stdout)).toMatchObject({
      head,
      accepted_verifier_commit: reportCommit,
      head_relation_to_accepted_verifier: "descendant",
      head_equals_or_descends_accepted_verifier: true,
      unverified_later_changes: true,
      verification_state: "unverified-later-changes",
      next_gate: "fresh-independent-verifier",
      next_gate_target_sha: head,
    });
  });

  it("keeps a prior accepted PASS distinct from a latest unresolved FAIL", () => {
    const {
      candidate: acceptedCandidate,
      reportCommit,
      root,
    } = createAcceptedPassFixture();
    writeFileSync(join(root, "candidate.txt"), "failed candidate\n");
    const failedCandidate = commit(root, "feat: failed candidate");
    const failedReportCommit = writeReport(
      root,
      "002",
      failedCandidate,
      "FAIL",
    );
    const status = runStatus(root);

    expect(status.status).toBe(0);
    expect(JSON.parse(status.stdout)).toMatchObject({
      head: failedReportCommit,
      latest_round: "002",
      latest_verdict: "FAIL",
      latest_candidate_sha: failedCandidate,
      latest_report_commit: failedReportCommit,
      latest_is_unresolved_fail: true,
      accepted_round: "001",
      accepted_candidate_sha: acceptedCandidate,
      accepted_verifier_commit: reportCommit,
      head_relation_to_accepted_verifier: "descendant",
      unverified_later_changes: true,
      verification_state: "unresolved-latest-fail",
      next_gate: "fresh-independent-verifier",
      next_gate_target_sha: null,
      next_action:
        "commit a repaired or unblocked candidate before verification",
    });
  });

  it.each([
    [
      "multiple verdicts",
      "Candidate SHA: `%CANDIDATE%`\n\nVERDICT: PASS\nVERDICT: FAIL\n",
      "expected exactly one VERDICT line",
    ],
    [
      "missing verdict",
      "Candidate SHA: `%CANDIDATE%`\n",
      "expected exactly one VERDICT line",
    ],
    [
      "malformed verdict",
      "Candidate SHA: `%CANDIDATE%`\n\nVERDICT: MAYBE\n",
      "malformed VERDICT",
    ],
    [
      "missing or malformed candidate",
      "Candidate SHA: not-a-commit\n\nVERDICT: PASS\n",
      "malformed Candidate SHA",
    ],
    [
      "multiple candidates",
      "Candidate SHA: %CANDIDATE%\nCandidate SHA: %CANDIDATE%\n\nVERDICT: PASS\n",
      "expected exactly one Candidate SHA line",
    ],
  ])("fails fast for %s", (_label, body, expectedError) => {
    const root = createRepository();
    writeFileSync(join(root, "candidate.txt"), "candidate\n");
    const candidate = commit(root, "feat: candidate");
    const directory = join(root, ".agent", "verification");
    mkdirSync(directory, { recursive: true });
    const report = body.replaceAll("%CANDIDATE%", candidate);
    writeFileSync(join(directory, "round-001.md"), `# malformed\n\n${report}`);
    commit(root, "verify: malformed report");

    const status = runStatus(root);
    expect(status.status).toBe(1);
    expect(status.stdout).toBe("");
    expect(status.stderr).toContain(expectedError);
  });
});
