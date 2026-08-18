import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error The JavaScript verifier module has no declaration file.
import { classifyWebKitReport } from "../../scripts/webkit-result-classifier.mjs";

const read = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");

describe("M7B evidence tooling contract", () => {
  const structuredReport = (test: Record<string, unknown>) => ({
    stats: { unexpected: 0, flaky: 0 },
    suites: [{ specs: [{ title: "probe", tests: [test] }] }],
  });

  it("fails closed on incomplete structured WebKit results", () => {
    const valid = classifyWebKitReport(
      structuredReport({
        status: "expected",
        results: [{ status: "passed" }],
      }),
      0,
    );
    expect(valid.result).toBe("PASS");

    for (const test of [
      { status: "expected" },
      { status: "expected", results: [] },
      { status: "expected", results: [{ status: "skipped" }] },
      { status: "expected", results: [{ status: "unknown" }] },
    ]) {
      expect(classifyWebKitReport(structuredReport(test), 0).result).toBe(
        "FAILED",
      );
    }

    const infrastructure = classifyWebKitReport(
      {
        stats: { unexpected: 0, flaky: 0 },
        suites: [
          {
            specs: [
              {
                title: "host blocker",
                tests: [
                  {
                    status: "expected",
                    annotations: [
                      { type: "infrastructure", description: "host offline" },
                    ],
                    results: [{ status: "passed" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      0,
    );
    expect(infrastructure.result).toBe("BLOCKED");
  });

  it("requires both configured portrait matrix tests for the lane", () => {
    const matrix = {
      stats: { expected: 2, skipped: 0, unexpected: 0, flaky: 0 },
      suites: [
        {
          specs: [
            {
              title: "portrait matrix",
              tests: [
                { status: "expected", results: [{ status: "passed" }] },
                { status: "expected", results: [{ status: "passed" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(
      classifyWebKitReport(matrix, 0, null, { minimumExpectedTests: 2 }).result,
    ).toBe("PASS");
    expect(
      classifyWebKitReport(
        structuredReport({
          status: "expected",
          results: [{ status: "passed" }],
        }),
        0,
        null,
        { minimumExpectedTests: 2 },
      ).result,
    ).toBe("FAILED");
  });

  it("pins and exposes the WebKit lane without changing the Chromium lane", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(packageJson.devDependencies["@playwright/test"]).toBe("1.61.1");
    expect(packageJson.scripts["test:e2e:webkit"]).toContain(
      "playwright.webkit.config.ts",
    );
    expect(read("playwright.webkit.config.ts")).toContain(
      'browserName: "webkit"',
    );
    expect(read("tests/e2e/m7b-webkit.spec.ts")).toContain("320x693 boundary");
    expect(read("tests/e2e/m7b-webkit.spec.ts")).toContain("200%");
  });

  it("routes native and performance gates through explicit blocked artifacts", () => {
    const verify = read("scripts/verify");
    expect(verify).toContain("M7B_NATIVE_ALLOW_BLOCKED=1");
    expect(verify).toContain("M7B_PERFORMANCE_ALLOW_BLOCKED=1");
    expect(read("scripts/native-accessibility.mjs")).toContain("xcrun");
    expect(read("scripts/native-accessibility.mjs")).toContain("adb");
    expect(read("scripts/native-accessibility.mjs")).toContain('"BLOCKED"');
    expect(read("scripts/native-accessibility.mjs")).toContain(
      "M7B_NATIVE_BROWSER_SETTLE_MS",
    );
    expect(read("scripts/native-accessibility.mjs")).toContain(
      "androidEmulatorInventory",
    );
    expect(read("scripts/native-accessibility.mjs")).toContain(
      "skip locked Android browser capture",
    );
    expect(read("scripts/collect-mobile-performance.mjs")).toContain(
      "PerformanceObserver",
    );
    expect(read("scripts/collect-mobile-performance.mjs")).toContain(
      "same-device-baseline",
    );
    expect(read("scripts/collect-mobile-performance.mjs")).toContain(
      '"localabstract:chrome_devtools_remote"',
    );
    expect(read("scripts/collect-mobile-performance.mjs")).toContain(
      "worker64xMs",
    );
    expect(read("docs/m7b-native-accessibility.md")).toContain(
      "speech transcript remains `UNVERIFIED`/`BLOCKED`",
    );
    expect(read("docs/m7b-native-accessibility.md")).toContain(
      "M7B_NATIVE_BROWSER_SETTLE_MS",
    );
    expect(read("docs/m7b-mobile-performance.md")).toContain(
      "battery/thermal sub-gate",
    );
  });

  it("keeps authenticity seams fail-closed", () => {
    const performance = read("scripts/collect-mobile-performance.mjs");
    const native = read("scripts/native-accessibility.mjs");
    const webkitClassifier = read("scripts/webkit-result-classifier.mjs");
    expect(performance).toContain("authenticated-child-stdout");
    expect(performance).toContain("M7B_FROZEN_CAPTURE_NONCE");
    expect(performance).toContain(
      "caller-supplied baseline paths are rejected",
    );
    expect(performance).not.toContain("readJson(baselinePath)");
    expect(performance).not.toContain(
      "interactionMetrics.inpMs ?? metrics.inpMs ?? interactionMs",
    );
    expect(native).toContain(
      "row.actualCssViewport?.height !== expected.height",
    );
    expect(native).toContain("expectedHeight = width === 320 ? 693 : 742");
    expect(webkitClassifier).toContain("report?.stats");
    expect(webkitClassifier).toContain('result: "FAILED"');
    expect(webkitClassifier).toContain('result: "BLOCKED"');
    expect(read("scripts/run-webkit-e2e.mjs")).not.toContain(
      "const infrastructureFailure =",
    );
  });
});
