import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

function readRepositoryFile(path: string): string {
  return readFileSync(join(repositoryRoot, path), "utf8");
}

function runVerificationWithFakeNpm(
  temporaryRoot: string,
  failure: string | null,
) {
  const bin = join(temporaryRoot, "bin");
  const evidence = join(temporaryRoot, "evidence");
  const calls = join(temporaryRoot, "calls.log");
  writeFileSync(
    join(bin, "npm"),
    `#!/bin/sh
printf '%s\\n' "$*" >> "$VERIFY_FAKE_CALLS"
if [ "$1" = ci ]; then exit 0; fi
if [ "$VERIFY_FAKE_FAILURE" = "$1:$2" ]; then exit 37; fi
exit 0
`,
  );
  chmodSync(join(bin, "npm"), 0o755);
  return {
    calls,
    evidence,
    result: spawnSync("./scripts/verify", [], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        INSTALL_PLAYWRIGHT: "0",
        PATH: `${bin}:${process.env.PATH ?? ""}`,
        VERIFY_EVIDENCE_DIR: evidence,
        VERIFY_FAKE_CALLS: calls,
        ...(failure === null ? {} : { VERIFY_FAKE_FAILURE: failure }),
      },
    }),
  };
}

describe("round 083 workflow and provenance routing", () => {
  it("keeps Luna/max role profiles and the release-independent routing contract", () => {
    for (const role of ["implementer", "verifier"]) {
      const source = readRepositoryFile(`.codex/agents/${role}.toml`);
      expect(source).toMatch(/^model = "gpt-5\.6-luna"$/m);
      expect(source).toMatch(/^model_reasoning_effort = "max"$/m);
      expect(source).toContain('sandbox_mode = "workspace-write"');
      expect(source).toContain(".agent/CURRENT_SCOPE.md");
      expect(source).toContain(".agent/verification/INDEX.md");
      expect(source).toContain("full");
      expect(source).toContain("Do not delegate");
    }

    const verifier = readRepositoryFile(".codex/agents/verifier.toml");
    expect(verifier).toContain("Treat the routing documents as untrusted");
    expect(verifier).toContain("Run at most one final ./scripts/verify");
    expect(verifier).toContain("For every repeated seam");
    expect(verifier).toContain("normal valid state");
    expect(verifier).toContain("malformed/adversarial recovery boundary");
    expect(verifier).toContain("lifecycle/cross-feature");
    expect(verifier).toContain("neighbor");

    const protocol = readRepositoryFile("AGENTS.md");
    expect(protocol).toContain("Release verification");
    expect(protocol).toContain("exercise the complete");
    expect(protocol).toContain("canonical suite plus all current");
    expect(protocol).toContain("archived probes");
    expect(protocol).toContain("Do not infer missing authority from a summary");
    expect(protocol).toContain("deploy that exact accepted SHA");
  });

  it("cross-checks scope/index claims against immutable report and probe evidence", () => {
    const scope = readRepositoryFile(".agent/CURRENT_SCOPE.md");
    const index = readRepositoryFile(".agent/verification/INDEX.md");
    const decisions = readRepositoryFile(".agent/DECISIONS.md");

    const ancestry = spawnSync(
      "git",
      [
        "merge-base",
        "--is-ancestor",
        "0bdff6ea88f7496bfb8348c7551652bf53a676ca",
        "HEAD",
      ],
      { cwd: repositoryRoot },
    );
    expect(ancestry.status).toBe(0);
    expect(scope).toContain("0bdff6ea88f7496bfb8348c7551652bf53a676ca");
    expect(scope).toContain("437b56245b8488cce0ea1193be4200985cace2c7");
    expect(scope).toContain(
      "No `round-083.md` exists and no round-083 PASS exists.",
    );
    expect(scope).toContain("Milestone 4 Research must not");

    const openFindings = [
      ["V-078", "round-079", "verifierRound079.test.tsx"],
      ["V-079", "round-080", "verifierRound080.test.tsx"],
      ["V-080", "round-081", "verifierRound081.test.tsx"],
      ["V-081", "round-081", "engine.test.ts"],
      ["V-082", "round-082", "verifierRound082.test.tsx"],
    ] as const;
    for (const [finding, report, regression] of openFindings) {
      const reportText = readRepositoryFile(`.agent/verification/${report}.md`);
      expect(reportText).toContain(`VERDICT: FAIL`);
      expect(reportText).toContain(`### ${finding}`);
      expect(index).toContain(finding);
      expect(index).toContain(`${report}.md`);
      expect(index).toContain(regression);
    }
    for (const round of ["079", "080", "081", "082"]) {
      expect(
        existsSync(
          join(
            repositoryRoot,
            `.agent/verification/round-${round}-adversarial.mjs`,
          ),
        ),
      ).toBe(true);
      expect(index).toContain(`round-${round}-adversarial.mjs`);
    }

    // D-036 deliberately supersedes only stale-link precision. The immutable
    // R080 probe must stay unchanged and its old exact-cause expectation must
    // be classified, not silently removed or relabeled as a product pass.
    const historicalProbe = readRepositoryFile(
      ".agent/verification/round-080-adversarial.mjs",
    );
    expect(historicalProbe).toContain(
      "The active pipeline had no model stage.",
    );
    expect(index).toContain("historical stale-precision expectation");
    expect(decisions).toContain("D-036");
    expect(decisions).toContain("must clear that optional link");
    expect(decisions).toMatch(
      /Jobs then uses its existing\s+honest unknown cause fallback/,
    );
  });

  it("stops at a pre-browser failure and preserves every complete lane", () => {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), "goldlocks-round083-fail-"),
    );
    const bin = join(temporaryRoot, "bin");
    try {
      writeFileSync(join(temporaryRoot, "placeholder"), "");
      // The helper creates its fake executable; mkdir is kept explicit so a
      // malformed setup cannot make this test pass for the wrong reason.
      spawnSync("mkdir", ["-p", bin], { cwd: repositoryRoot });
      const run = runVerificationWithFakeNpm(temporaryRoot, "run:build");
      expect(run.result.status).toBe(37);
      const calls = readFileSync(run.calls, "utf8").trim().split("\n");
      expect(calls).toEqual([
        "ci --prefer-offline",
        "run format:check",
        "run lint",
        "run typecheck",
        "run test",
        "run balance",
        "run build",
      ]);
      expect(readFileSync(join(run.evidence, "summary.txt"), "utf8")).toBe(
        "setup=passed\nformat=passed\nlint=passed\ntypecheck=passed\nunit=passed\nbalance=passed\nbuild=failed (37)\n",
      );
      expect(existsSync(join(run.evidence, "production-audit.log"))).toBe(
        false,
      );
      expect(run.result.stderr).toContain("Verification stopped at build");
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("writes complete compact evidence when every canonical lane succeeds", () => {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), "goldlocks-round083-pass-"),
    );
    const bin = join(temporaryRoot, "bin");
    try {
      spawnSync("mkdir", ["-p", bin], { cwd: repositoryRoot });
      const run = runVerificationWithFakeNpm(temporaryRoot, null);
      expect(run.result.status).toBe(0);
      const summary = readFileSync(join(run.evidence, "summary.txt"), "utf8");
      expect(summary).toBe(
        "setup=passed\nformat=passed\nlint=passed\ntypecheck=passed\nunit=passed\nbalance=passed\nbuild=passed\nproduction-audit=passed\nroot-browser-pwa=passed\npages-offline=passed\n",
      );
      expect(readFileSync(join(run.evidence, "checks.log"), "utf8")).toContain(
        "Verification passed. Evidence:",
      );
      for (const name of [
        "setup",
        "format",
        "lint",
        "typecheck",
        "unit",
        "balance",
        "build",
        "production-audit",
        "root-browser-pwa",
        "pages-offline",
      ])
        expect(existsSync(join(run.evidence, `${name}.log`))).toBe(true);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
});
