import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

function readRepositoryFile(path: string): string {
  return readFileSync(`${repositoryRoot}${path}`, "utf8");
}

describe("Linux canonical verification workflow", () => {
  it("runs the complete pinned browser gate against the frozen GitHub SHA", () => {
    const workflow = readRepositoryFile(".github/workflows/verify.yml");
    const jobStart = workflow.indexOf("  canonical:\n");
    expect(jobStart).toBeGreaterThanOrEqual(0);

    const job = workflow.slice(jobStart);
    const environmentStart = job.indexOf("    env:\n");
    const stepsStart = job.indexOf("    steps:\n");
    const setupNodeStart = job.indexOf("actions/setup-node@v6");
    const verificationStart = job.indexOf("run: ./scripts/verify");

    expect(job).toContain("runs-on: ubuntu-24.04");
    expect(environmentStart).toBeGreaterThanOrEqual(0);
    expect(stepsStart).toBeGreaterThan(environmentStart);
    expect(setupNodeStart).toBeGreaterThan(stepsStart);
    expect(verificationStart).toBeGreaterThan(setupNodeStart);

    const environment = job.slice(environmentStart, stepsStart);
    expect(environment).toContain(
      "npm_config_cache: ${{ github.workspace }}/.cache/npm",
    );
    expect(environment).toContain(
      "PLAYWRIGHT_BROWSERS_PATH: ${{ github.workspace }}/.cache/ms-playwright",
    );
    expect(environment).toContain('PLAYWRIGHT_INSTALL_DEPS: "1"');
    expect(job).toContain('test "$actual" = "$GITHUB_SHA"');
    expect(job).toContain("actions/upload-artifact@v4");
    expect(job).toContain("if: always()");
    expect(job).not.toMatch(/\$HOME|~\/\.npm|\/home\/runner\/\.npm/);
  });

  it("keeps Linux dependency installation opt-in and repository-local browser caching", () => {
    const setup = readRepositoryFile("scripts/setup");
    expect(setup).toContain('export npm_config_cache="$ROOT/.cache/npm"');
    expect(setup).toContain(
      'export PLAYWRIGHT_BROWSERS_PATH="$ROOT/.cache/ms-playwright"',
    );
    expect(setup).toContain(
      'if [ "${PLAYWRIGHT_INSTALL_DEPS:-0}" = "1" ]; then',
    );
    expect(setup).toContain("npx playwright install --with-deps chromium");
    expect(setup).toContain("npx playwright install chromium");
  });

  it("runs both root and Pages browser gates before reporting failure", () => {
    const verification = readRepositoryFile("scripts/verify");
    const rootBrowser = verification.indexOf("run_step npm run test:e2e\n");
    const pagesBrowser = verification.indexOf(
      "run_step npm run test:e2e:pages\n",
    );
    const finalExit = verification.indexOf('exit "$failed"');

    expect(verification).toContain("failed=0");
    expect(verification).toContain("run_step() {");
    expect(verification).toContain("if ! ./scripts/setup; then");
    expect(rootBrowser).toBeGreaterThanOrEqual(0);
    expect(pagesBrowser).toBeGreaterThan(rootBrowser);
    expect(finalExit).toBeGreaterThan(pagesBrowser);
  });
});
