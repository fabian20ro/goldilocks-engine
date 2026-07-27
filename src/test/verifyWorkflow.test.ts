import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

function readRepositoryFile(path: string): string {
  return readFileSync(`${repositoryRoot}${path}`, "utf8");
}

describe("Linux verification workflow", () => {
  it("splits complete frozen-candidate verification into explicit required lanes", () => {
    const workflow = readRepositoryFile(".github/workflows/verify.yml");
    const preparation = readRepositoryFile(
      ".github/actions/prepare-verification-lane/action.yml",
    );
    const environmentStart = workflow.indexOf("env:\n");
    const jobsStart = workflow.indexOf("jobs:\n");
    const lanes = [
      "static-unit-build",
      "balances",
      "portrait-smoke",
      "root-browser-pwa",
      "pages-offline",
    ];

    expect(environmentStart).toBeGreaterThanOrEqual(0);
    expect(jobsStart).toBeGreaterThan(environmentStart);
    const environment = workflow.slice(environmentStart, jobsStart);
    expect(environment).toContain(
      "npm_config_cache: ${{ github.workspace }}/.cache/npm",
    );
    expect(environment).toContain(
      "PLAYWRIGHT_BROWSERS_PATH: ${{ github.workspace }}/.cache/ms-playwright",
    );
    expect(environment).toContain('PLAYWRIGHT_INSTALL_DEPS: "1"');
    expect(environment).toContain(
      "XDG_CACHE_HOME: ${{ github.workspace }}/.cache/xdg",
    );

    for (const lane of lanes) expect(workflow).toContain(`  ${lane}:\n`);
    expect(
      workflow.match(/uses: \.\/\.github\/actions\/prepare-verification-lane/g),
    ).toHaveLength(lanes.length);
    expect(workflow.match(/actions\/checkout@v6/g)).toHaveLength(
      lanes.length + 1,
    );
    expect(workflow.match(/actions\/upload-artifact@v7/g)).toHaveLength(
      lanes.length,
    );
    expect(workflow).not.toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("run_logged() {");
    expect(workflow).toContain("npm audit --omit=dev --audit-level=high");
    expect(workflow).toContain("npm run balance");
    expect(workflow).toContain("Early 320px portrait smoke");
    expect(workflow).toContain("npm run test:e2e");
    expect(workflow).toContain("npm run test:e2e:pages");
    expect(workflow).toContain("Verification aggregate");
    expect(workflow).toContain("if: always()");
    for (const result of [
      "STATIC_UNIT_BUILD",
      "BALANCES",
      "PORTRAIT_SMOKE",
      "ROOT_BROWSER_PWA",
      "PAGES_OFFLINE",
    ])
      expect(workflow).toContain(`test "$${result}" = success`);
    expect(workflow).not.toMatch(/\$HOME|~\/\.npm|\/home\/runner\/\.npm/);

    expect(preparation).toContain("actions/setup-node@v6");
    expect(preparation).toContain('test "$actual" = "$GITHUB_SHA"');
    expect(preparation).toContain("VERIFICATION_EVIDENCE_DIR");
    expect(preparation).toContain("run: ./scripts/setup");
  });

  it("pins the supported action generations for verification and Pages", () => {
    const verification = readRepositoryFile(".github/workflows/verify.yml");
    const pages = readRepositoryFile(".github/workflows/deploy-pages.yml");

    expect(verification).toContain("actions/upload-artifact@v7");
    expect(verification).toContain("actions/checkout@v6");
    expect(verification).not.toContain("actions/upload-artifact@v4");
    expect(pages).toContain("actions/checkout@v6");
    expect(pages).toContain("actions/setup-node@v6");
    expect(pages).toContain("actions/configure-pages@v6");
    expect(pages).toContain("actions/upload-pages-artifact@v5");
    expect(pages).toContain("actions/deploy-pages@v5");
  });

  it("keeps browser installation optional and repository-local", () => {
    const setup = readRepositoryFile("scripts/setup");
    expect(setup).toContain('export npm_config_cache="$ROOT/.cache/npm"');
    expect(setup).toContain(
      'export PLAYWRIGHT_BROWSERS_PATH="$ROOT/.cache/ms-playwright"',
    );
    expect(setup).toContain('case "${INSTALL_PLAYWRIGHT:-1}" in');
    expect(setup).toContain("npx playwright install --with-deps chromium");
    expect(setup).toContain("npx playwright install chromium");
  });

  it("keeps every local verification check in the canonical command", () => {
    const verification = readRepositoryFile("scripts/verify");
    const rootBrowser = verification.indexOf("run_step npm run test:e2e\n");
    const pagesBrowser = verification.indexOf(
      "run_step npm run test:e2e:pages\n",
    );
    const finalExit = verification.indexOf('exit "$failed"');

    expect(verification).toContain("failed=0");
    expect(verification).toContain("run_step() {");
    expect(verification).toContain("if ! ./scripts/setup; then");
    expect(verification).toContain(
      "run_step npm audit --omit=dev --audit-level=high",
    );
    expect(rootBrowser).toBeGreaterThanOrEqual(0);
    expect(pagesBrowser).toBeGreaterThan(rootBrowser);
    expect(finalExit).toBeGreaterThan(pagesBrowser);
  });
});
