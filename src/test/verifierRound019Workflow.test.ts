import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("verifier round 019 canonical workflow", () => {
  it("keeps the required Pages Playwright report outside the lint scope", async () => {
    const eslint = new ESLint({ cwd: process.cwd() });
    const generatedReportFile = `${process.cwd()}/playwright-pages-report/trace/generated.js`;

    await expect(eslint.isPathIgnored(generatedReportFile)).resolves.toBe(true);
  });
});
