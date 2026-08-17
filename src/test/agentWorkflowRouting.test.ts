import {
  chmodSync,
  existsSync,
  mkdirSync,
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
  return readFileSync(`${repositoryRoot}${path}`, "utf8");
}

function repositoryFileExists(path: string): boolean {
  return existsSync(`${repositoryRoot}${path}`);
}

describe("progressive-disclosure agent workflow", () => {
  it("pins the implementer and verifier to the required deliberation model", () => {
    for (const role of ["implementer", "verifier"]) {
      const source = readRepositoryFile(`.codex/agents/${role}.toml`);
      expect(source).toMatch(/^model = "gpt-5\.6-luna"$/m);
      expect(source).toMatch(/^model_reasoning_effort = "max"$/m);
      expect(source).toContain("./scripts/agent-status");
      expect(source).toContain(".agent/CURRENT_SCOPE.md");
      expect(source).toContain(".agent/verification/INDEX.md");
    }
  });

  it("routes narrow work to authoritative current sources without weakening verifier independence", () => {
    const protocol = readRepositoryFile("AGENTS.md");
    const scope = readRepositoryFile(".agent/CURRENT_SCOPE.md");
    const index = readRepositoryFile(".agent/verification/INDEX.md");

    expect(protocol).toContain("## Progressive-disclosure reading");
    expect(protocol).toContain("For a narrow repair, read in this order:");
    expect(protocol).toContain("Run `./scripts/agent-status`");
    expect(protocol).toContain("Read the full plan, complete decisions log");
    expect(protocol).toContain("Release verification");
    expect(protocol).toContain("Rule-of-Three same-seam review");
    expect(protocol).toContain("at most one final");
    expect(protocol).toContain("at most three ordinary milestone checkpoints");
    expect(protocol).toContain("untrusted guidance rather than proof");

    expect(scope).toContain(
      "accepted Milestone 7A release and active Milestone 7B",
    );
    expect(scope).toContain("./scripts/agent-status");
    expect(scope).toContain("Historical accepted boundaries");
    expect(scope).toContain("Frozen boundaries");
    expect(scope).toContain(".agent/verification/catalog.json");
    expect(scope).not.toContain("Current product candidate:");

    expect(index).toContain(
      "accepted Milestone 7A release and active Milestone 7B",
    );
    expect(index).toContain("catalog.json");
    expect(index).toContain("./scripts/agent-status");
    expect(index).not.toContain("Current unverified candidate");
    expect(index).toContain("round-080 stale-cause precision expectation");
    expect(index).toContain("round-092 malformed duplicate-machine fixture");
  });

  it("maps historical findings to the machine-checked catalog and retained evidence", () => {
    const catalog = readRepositoryFile(".agent/verification/catalog.json");
    const evidence = [
      ["V-078", "round-079.md", "src/ui/verifierRound079.test.tsx"],
      ["V-079", "round-080.md", "src/ui/verifierRound080.test.tsx"],
      ["V-080", "round-081.md", "src/ui/verifierRound081.test.tsx"],
      ["V-081", "round-081.md", "src/simulation/engine.test.ts"],
      ["V-082", "round-082.md", "src/ui/verifierRound082.test.tsx"],
    ] as const;

    for (const [finding, report, regression] of evidence) {
      expect(finding).toMatch(/^V-\d{3}$/);
      expect(catalog).toContain('"id": "V-001..V-082"');
      expect(catalog).toContain(
        '"resolutionReport": ".agent/verification/round-083.md"',
      );
      expect(catalog).toContain('"regressionEvidence":');
      expect(catalog).toContain("./scripts/verify");
      expect(report).toMatch(/^round-\d{3}\.md$/);
      expect(repositoryFileExists(`.agent/verification/${report}`)).toBe(true);
      expect(repositoryFileExists(regression)).toBe(true);
    }

    for (const probe of ["079", "080", "081", "082"])
      expect(
        repositoryFileExists(
          `.agent/verification/round-${probe}-adversarial.mjs`,
        ),
      ).toBe(true);
  });

  it("keeps the canonical script fail-fast while retaining every complete lane", () => {
    const verification = readRepositoryFile("scripts/verify");
    const orderedSteps = [
      "run_step verification-catalog npm run validate:verification-catalog",
      "run_step setup ./scripts/setup",
      "run_step format npm run format:check",
      "run_step lint npm run lint",
      "run_step typecheck npm run typecheck",
      "run_step unit npm run test",
      "run_step balance npm run balance",
      "run_step build npm run build",
      "run_step production-audit npm audit --omit=dev --audit-level=high",
      "run_step root-browser-pwa npm run test:e2e",
      "run_step pages-offline npm run test:e2e:pages",
    ];

    expect(verification).toMatch(/^#!\/bin\/sh\nset -eu$/m);
    expect(verification).toContain("VERIFY_EVIDENCE_DIR");
    expect(verification).toContain("summary.txt");
    expect(verification).toContain('if "$@" >"$step_log" 2>&1; then');
    expect(verification).toContain("Verification stopped at $name");

    let previous = -1;
    for (const step of orderedSteps) {
      const position = verification.indexOf(step);
      expect(position).toBeGreaterThan(previous);
      previous = position;
    }

    const syntax = spawnSync("sh", ["-n", "scripts/verify"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    expect(syntax.status).toBe(0);
    expect(syntax.stderr).toBe("");
  });

  it("stops before expensive lanes and leaves compact evidence after preflight failure", () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), "goldlocks-verify-"));
    const bin = join(temporaryRoot, "bin");
    const evidence = join(temporaryRoot, "evidence");
    const calls = join(temporaryRoot, "npm-calls.log");
    mkdirSync(bin);
    writeFileSync(
      join(bin, "npm"),
      `#!/bin/sh
printf '%s\\n' "$*" >> "$VERIFY_FAKE_CALLS"
if [ "$1" = ci ]; then exit 0; fi
if [ "$1" = run ] && [ "$2" = validate:verification-catalog ]; then exit 0; fi
if [ "$1" = run ] && [ "$2" = format:check ]; then exit 23; fi
exit 99
`,
    );
    chmodSync(join(bin, "npm"), 0o755);

    try {
      const run = spawnSync("./scripts/verify", [], {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          INSTALL_PLAYWRIGHT: "0",
          PATH: `${bin}:${process.env.PATH ?? ""}`,
          VERIFY_EVIDENCE_DIR: evidence,
          VERIFY_FAKE_CALLS: calls,
        },
      });

      expect(run.status).toBe(23);
      expect(readFileSync(calls, "utf8").trim().split("\n")).toEqual([
        "run validate:verification-catalog",
        "ci --prefer-offline",
        "run format:check",
      ]);
      expect(readFileSync(join(evidence, "summary.txt"), "utf8")).toBe(
        "verification-catalog=passed\nsetup=passed\nformat=failed (23)\n",
      );
      expect(existsSync(join(evidence, "balance.log"))).toBe(false);
      expect(run.stderr).toContain("Verification stopped at format");
    } finally {
      rmSync(temporaryRoot, { force: true, recursive: true });
    }
  });
});
