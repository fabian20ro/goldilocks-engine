import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");

describe("M7B evidence tooling contract", () => {
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
    expect(read("docs/m7b-mobile-performance.md")).toContain(
      "battery/thermal sub-gate",
    );
  });

  it("keeps authenticity seams fail-closed", () => {
    const performance = read("scripts/collect-mobile-performance.mjs");
    const native = read("scripts/native-accessibility.mjs");
    const webkitClassifier = read("scripts/webkit-result-classifier.mjs");
    expect(performance).toContain("trustedBaselineProvenanceFindings");
    expect(performance).toContain("M7B_PERFORMANCE_BASELINE");
    expect(performance).toContain(
      "caller-supplied baseline paths are rejected",
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
