import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

function readRepositoryFile(path: string): string {
  return readFileSync(`${repositoryRoot}${path}`, "utf8");
}

describe("GitHub Pages workflow", () => {
  it("runs only from a manually supplied exact candidate ref", () => {
    const workflow = readRepositoryFile(".github/workflows/deploy-pages.yml");

    expect(workflow).not.toMatch(/\n {2}push:/);
    expect(workflow).toContain(
      "workflow_dispatch:\n    inputs:\n      candidate_ref:",
    );
    expect(workflow).toContain("ref: ${{ inputs.candidate_ref }}");
    expect(workflow).toContain("- name: Require exact frozen candidate");
    expect(workflow).toContain(
      'expected="$(git rev-parse --verify --end-of-options "${CANDIDATE_REF}^{commit}")"',
    );
    expect(workflow).toContain('test "$actual" = "$expected"');
    expect(workflow).toContain('test "$actual" = "$GITHUB_SHA"');
    expect(workflow).toContain("printf 'candidate_ref=%s\\n'");
    expect(workflow).toContain("printf 'candidate_sha=%s\\n'");
    const candidateGateStart = workflow.indexOf(
      "- name: Require exact frozen candidate",
    );
    const buildStart = workflow.indexOf("run: npm run build:pages");
    expect(candidateGateStart).toBeGreaterThanOrEqual(0);
    expect(buildStart).toBeGreaterThan(candidateGateStart);
  });

  it("applies repository-local npm and browser caches before setup-node and npm ci", () => {
    const workflow = readRepositoryFile(".github/workflows/deploy-pages.yml");
    const buildStart = workflow.indexOf("  build:\n");
    const deployStart = workflow.indexOf("\n  deploy:\n");
    expect(buildStart).toBeGreaterThanOrEqual(0);
    expect(deployStart).toBeGreaterThan(buildStart);

    const buildJob = workflow.slice(buildStart, deployStart);
    const environmentStart = buildJob.indexOf("\n    env:\n");
    const stepsStart = buildJob.indexOf("\n    steps:\n");
    const setupNodeStart = buildJob.indexOf("actions/setup-node@v6");
    const installStart = buildJob.indexOf("run: npm ci");

    expect(environmentStart).toBeGreaterThanOrEqual(0);
    expect(stepsStart).toBeGreaterThan(environmentStart);
    expect(setupNodeStart).toBeGreaterThan(stepsStart);
    expect(installStart).toBeGreaterThan(setupNodeStart);

    const jobEnvironment = buildJob.slice(environmentStart, stepsStart);
    expect(jobEnvironment).toContain(
      "npm_config_cache: ${{ github.workspace }}/.cache/npm",
    );
    expect(jobEnvironment).toContain(
      "PLAYWRIGHT_BROWSERS_PATH: ${{ github.workspace }}/.cache/ms-playwright",
    );
    expect(buildJob).not.toMatch(/\$HOME|~\/\.npm|\/home\/runner\/\.npm/);
    expect(readRepositoryFile(".gitignore")).toContain(".cache/");
  });
});
