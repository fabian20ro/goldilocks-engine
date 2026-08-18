#!/usr/bin/env node

/* Independent round-105 M7B baseline and WebKit error-boundary probes. */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { classifyWebKitReport } from "../../scripts/webkit-result-classifier.mjs";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const candidateSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const findings = [];

function check(id, condition, evidence) {
  if (!condition) findings.push({ id, evidence });
}

function baselineChildProbe() {
  const acceptedSha = "d25e80e6781de89e80fc3b3c240a922ada53d978";
  const acceptedFiles = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", acceptedSha],
    { cwd: root, encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const evidenceDir = fs.mkdtempSync(
    path.join(root, ".cache/m7b/r105-capture-probe-"),
  );
  const nonce = crypto.randomBytes(32).toString("hex");
  let run;
  try {
    run = spawnSync(
      process.execPath,
      ["scripts/capture-frozen-baseline.mjs", "--child-capture"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        env: {
          ...process.env,
          M7B_FROZEN_CAPTURE_NONCE: nonce,
          M7B_PERFORMANCE_DEVICE_ID: "round-105-baseline-probe-device",
          M7B_PERFORMANCE_BROWSERS: "",
          M7B_PERFORMANCE_RUNS: "5",
          M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
          M7B_PERFORMANCE_PORT: "43581",
        },
      },
    );
    const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
    const moduleMissing =
      /Cannot find module .*scripts\/collect-mobile-performance\.mjs/.test(
        output,
      );
    check("V-105-001", !moduleMissing, {
      expected:
        "same-invocation baseline capture must execute trusted current measurement tooling against the frozen accepted app without requiring that tooling to exist in the old accepted commit",
      actual: {
        acceptedTreeHasCollector: acceptedFiles.includes(
          "scripts/collect-mobile-performance.mjs",
        ),
        captureExit: run.status,
        moduleMissing,
        output: output.slice(-4_000),
      },
    });
    return {
      acceptedTreeHasCollector: acceptedFiles.includes(
        "scripts/collect-mobile-performance.mjs",
      ),
      captureExit: run.status,
      moduleMissing,
      output: output.slice(-4_000),
    };
  } finally {
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  }
}

function webkitErrorBoundaryProbe() {
  const webkitSpec = fs.readFileSync(
    path.join(root, "tests/e2e/m7b-webkit.spec.ts"),
    "utf8",
  );
  const performanceCollector = fs.readFileSync(
    path.join(root, "scripts/collect-mobile-performance.mjs"),
    "utf8",
  );
  const broadSpecFilter =
    /errors\.filter\(\s*\(error\)\s*=>\s*!\/WebKit encountered an internal error\/i\.test\(error\)\s*,?\s*\)/s.test(
      webkitSpec,
    );
  const broadCollectorFilter =
    /errors:\s*errors\.filter\(\s*\(error\)\s*=>\s*!\/WebKit encountered an internal error\/i\.test\(error\)\s*,?\s*\)/s.test(
      performanceCollector,
    );
  const successful = {
    stats: { unexpected: 0, flaky: 0 },
    suites: [
      {
        specs: [
          {
            title: "successful test",
            tests: [{ status: "expected", results: [{ status: "passed" }] }],
          },
        ],
      },
    ],
  };
  const markerFailure = {
    stats: { unexpected: 1, flaky: 0 },
    suites: [
      {
        specs: [
          {
            title: "assertion includes marker",
            tests: [
              {
                status: "failed",
                results: [
                  {
                    status: "failed",
                    error: { message: "WebKit encountered an internal error" },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const cleanResult = classifyWebKitReport(successful, 0);
  const markerResult = classifyWebKitReport(markerFailure, 1);
  check("V-105-002", !broadSpecFilter && !broadCollectorFilter, {
    expected:
      "a real page/console error containing an infrastructure marker must remain visible to the zero-error WebKit/performance gates; only the captured structured navigation blocker may be downgraded",
    actual: {
      broadSpecFilter,
      broadCollectorFilter,
      cleanStructuredResult: cleanResult.result,
      markerStructuredResult: markerResult.result,
    },
  });
  return {
    broadSpecFilter,
    broadCollectorFilter,
    cleanStructuredResult: cleanResult.result,
    markerStructuredResult: markerResult.result,
  };
}

const baseline = baselineChildProbe();
const webkit = webkitErrorBoundaryProbe();
console.log(
  JSON.stringify({ candidateSha, findings, baseline, webkit }, null, 2),
);
process.exitCode = findings.length === 0 ? 0 : 1;
