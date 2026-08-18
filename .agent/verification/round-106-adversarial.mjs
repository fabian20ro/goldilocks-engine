#!/usr/bin/env node

/* Independent round-106 M7B trust, boundary, and error-seam probes. */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { classifyWebKitReport } from "../../scripts/webkit-result-classifier.mjs";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const candidateSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const acceptedSha = "d25e80e6781de89e80fc3b3c240a922ada53d978";
const acceptedBuildId = "dc97ee41f6dbbc0e29d2";
const acceptedTreeSha = execFileSync(
  "git",
  ["rev-parse", `${acceptedSha}^{tree}`],
  { cwd: root, encoding: "utf8" },
).trim();
const findings = [];

function check(id, condition, evidence) {
  if (!condition) findings.push({ id, evidence });
}

function tempEvidence(label) {
  return fs.mkdtempSync(path.join(root, `.cache/m7b/r106-${label}-`));
}

function runCapture(label, overrides = {}) {
  const evidenceDir = tempEvidence(label);
  const nonce =
    overrides.M7B_FROZEN_CAPTURE_NONCE ??
    crypto.randomBytes(32).toString("hex");
  const env = {
    ...process.env,
    M7B_FROZEN_CAPTURE_NONCE: nonce,
    M7B_PERFORMANCE_DEVICE_ID: "round-106-boundary-device",
    M7B_PERFORMANCE_BROWSERS: "",
    M7B_PERFORMANCE_RUNS: "5",
    M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
    M7B_PERFORMANCE_TARGET_PORT: "43680",
    ...overrides,
  };
  let run;
  try {
    run = spawnSync(
      process.execPath,
      ["scripts/capture-frozen-baseline.mjs", "--child-capture"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        env,
      },
    );
    return {
      nonce,
      status: run.status,
      signal: run.signal,
      output: `${run.stdout ?? ""}\n${run.stderr ?? ""}`,
      evidenceDir,
    };
  } finally {
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  }
}

function parseEnvelope(output) {
  const marker = "M7B_FROZEN_CAPTURE_RESULT ";
  const line = output
    .split(/\r?\n/)
    .reverse()
    .find((value) => value.startsWith(marker));
  if (!line) return null;
  try {
    return JSON.parse(
      Buffer.from(line.slice(marker.length), "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }
}

function probeCaptureBoundaries() {
  const acceptedFiles = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", acceptedSha],
    { cwd: root, encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const invalidNonce = runCapture("invalid-nonce", {
    M7B_FROZEN_CAPTURE_NONCE: "not-a-64-hex-nonce",
  });
  const missingDevice = runCapture("missing-device", {
    M7B_PERFORMANCE_DEVICE_ID: "",
  });
  const lowPort = runCapture("low-port", {
    M7B_PERFORMANCE_TARGET_PORT: "1023",
  });
  const highPort = runCapture("high-port", {
    M7B_PERFORMANCE_TARGET_PORT: "65536",
  });
  const outsideEvidence = runCapture("outside-evidence", {
    M7B_PERFORMANCE_EVIDENCE_DIR: "/tmp/goldlocks-round-106-outside",
  });
  const valid = runCapture("valid-child");
  const envelope = parseEnvelope(valid.output);

  check(
    "V-106-BOUNDARY-NONCE",
    invalidNonce.status === 64 && !parseEnvelope(invalidNonce.output),
    {
      expected:
        "malformed capture nonce is rejected before any archive, server, or child measurement",
      actual: {
        status: invalidNonce.status,
        output: invalidNonce.output.slice(-500),
      },
    },
  );
  check("V-106-BOUNDARY-DEVICE", missingDevice.status === 64, {
    expected: "missing physical device identity is rejected before capture",
    actual: {
      status: missingDevice.status,
      output: missingDevice.output.slice(-500),
    },
  });
  check(
    "V-106-BOUNDARY-TARGET-PORT",
    lowPort.status === 64 && highPort.status === 64,
    {
      expected: "target ports outside 1024..65535 are rejected",
      actual: {
        low: { status: lowPort.status, output: lowPort.output.slice(-300) },
        high: { status: highPort.status, output: highPort.output.slice(-300) },
      },
    },
  );
  check("V-106-BOUNDARY-EVIDENCE-ROOT", outsideEvidence.status === 64, {
    expected: "capture artifacts cannot escape the repository evidence root",
    actual: {
      status: outsideEvidence.status,
      output: outsideEvidence.output.slice(-500),
    },
  });
  check(
    "V-106-CAPTURE-CURRENT-TOOL",
    !acceptedFiles.includes("scripts/collect-mobile-performance.mjs"),
    {
      expected:
        "the accepted M7A tree does not need to contain the current collector",
      actual: {
        acceptedTreeHasCollector: acceptedFiles.includes(
          "scripts/collect-mobile-performance.mjs",
        ),
      },
    },
  );
  check(
    "V-106-CAPTURE-ENVELOPE",
    valid.status === 0 && envelope?.nonce === valid.nonce,
    {
      expected:
        "valid child capture emits a nonce-bound envelope even when device gates are blocked",
      actual: {
        status: valid.status,
        nonceMatches: envelope?.nonce === valid.nonce,
        baseline: envelope?.baseline && {
          candidateSha: envelope.baseline.candidateSha,
          gitTreeSha: envelope.baseline.gitTreeSha,
          buildId: envelope.baseline.buildInfo?.version,
          result: envelope.baseline.result,
        },
      },
    },
  );
  check(
    "V-106-CAPTURE-IDENTITY",
    envelope?.baseline?.candidateSha === acceptedSha &&
      envelope?.baseline?.gitTreeSha === acceptedTreeSha &&
      envelope?.baseline?.buildInfo?.version === acceptedBuildId,
    {
      expected:
        "valid child baseline is bound to the frozen accepted Git object/tree/build",
      actual: {
        candidateSha: envelope?.baseline?.candidateSha,
        gitTreeSha: envelope?.baseline?.gitTreeSha,
        buildId: envelope?.baseline?.buildInfo?.version,
      },
    },
  );
  return {
    acceptedTreeHasCollector: acceptedFiles.includes(
      "scripts/collect-mobile-performance.mjs",
    ),
    invalidNonce: {
      status: invalidNonce.status,
      envelope: Boolean(parseEnvelope(invalidNonce.output)),
    },
    missingDevice: missingDevice.status,
    lowPort: lowPort.status,
    highPort: highPort.status,
    outsideEvidence: outsideEvidence.status,
    validChild: {
      status: valid.status,
      envelopeNonceMatches: envelope?.nonce === valid.nonce,
      baselineResult: envelope?.baseline?.result,
    },
  };
}

async function probeTargetBuildAndRecursionBoundary() {
  const port = 43681;
  const evidenceDir = tempEvidence("target-build");
  const outputPath = path.join(evidenceDir, "summary.json");
  const wrongBuild = {
    version: "wrong-build",
    candidateSha: acceptedSha,
    gitTreeSha: acceptedTreeSha,
  };
  const server = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import http from "node:http"; const wrong=${JSON.stringify(wrongBuild)}; http.createServer((request,response)=>{if(request.url?.endsWith("build-info.json")){response.writeHead(200,{"content-type":"application/json"});response.end(JSON.stringify(wrong));return;} response.writeHead(200,{"content-type":"text/html"});response.end("<!doctype html><title>boundary target</title>");}).listen(${port},"127.0.0.1");`,
    ],
    { cwd: root, stdio: "ignore" },
  );
  const readyDeadline = Date.now() + 5_000;
  while (Date.now() < readyDeadline) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/goldilocks-engine/`)).ok)
        break;
    } catch {
      // Child server is still binding its loopback port.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  let run;
  let summary = null;
  try {
    run = spawnSync(
      process.execPath,
      [
        "scripts/collect-mobile-performance.mjs",
        "--capture-only",
        `--output=${outputPath}`,
      ],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        env: {
          ...process.env,
          M7B_PERFORMANCE_CAPTURE_ONLY: "1",
          M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
          M7B_PERFORMANCE_BROWSERS: "",
          M7B_PERFORMANCE_RUNS: "5",
          M7B_PERFORMANCE_DEVICE_ID: "round-106-target-device",
          M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
          M7B_PERFORMANCE_TARGET_URL: `http://127.0.0.1:${port}/goldilocks-engine/`,
          M7B_FROZEN_CAPTURE_AUTH:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          M7B_FROZEN_CAPTURE_NONCE:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          M7B_FROZEN_CAPTURE_SHA: acceptedSha,
          M7B_FROZEN_CAPTURE_TREE_SHA: acceptedTreeSha,
          M7B_FROZEN_BUILD_ID: acceptedBuildId,
        },
      },
    );
    summary = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } finally {
    server.kill("SIGTERM");
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  }
  const targetFinding = summary?.findings?.find(
    (finding) => finding.gate === "frozen-target-build",
  );
  check("V-106-TARGET-BUILD", run?.status === 0 && Boolean(targetFinding), {
    expected:
      "capture-only rejects a target whose served build identity differs from the pinned accepted build",
    actual: {
      status: run?.status,
      result: summary?.result,
      targetFinding,
      findings: summary?.findings?.map((finding) => ({
        gate: finding.gate,
        result: finding.result,
        reason: finding.reason,
      })),
      cells: summary?.cells?.length,
    },
  });
  check(
    "V-106-NO-RECURSION",
    summary?.cells?.length === 0 &&
      !String(run?.stdout ?? "").includes("M7B_FROZEN_CAPTURE_RESULT"),
    {
      expected:
        "capture-only target validation does not recursively start another frozen-baseline child",
      actual: {
        cells: summary?.cells?.length,
        emittedEnvelope: String(run?.stdout ?? "").includes(
          "M7B_FROZEN_CAPTURE_RESULT",
        ),
      },
    },
  );
  return {
    status: run?.status,
    result: summary?.result,
    targetFinding: targetFinding && {
      gate: targetFinding.gate,
      result: targetFinding.result,
      reason: targetFinding.reason,
    },
    findings: summary?.findings?.map((finding) => ({
      gate: finding.gate,
      result: finding.result,
      reason: finding.reason,
    })),
    cells: summary?.cells?.length,
    emittedEnvelope: String(run?.stdout ?? "").includes(
      "M7B_FROZEN_CAPTURE_RESULT",
    ),
  };
}

function probeErrorBoundarySources() {
  const spec = fs.readFileSync(
    path.join(root, "tests/e2e/m7b-webkit.spec.ts"),
    "utf8",
  );
  const collector = fs.readFileSync(
    path.join(root, "scripts/collect-mobile-performance.mjs"),
    "utf8",
  );
  const classifier = {
    stats: { unexpected: 1, flaky: 0 },
    suites: [
      {
        specs: [
          {
            title: "marker assertion",
            tests: [
              {
                status: "failed",
                results: [
                  {
                    status: "failed",
                    error: {
                      message:
                        "assertion: WebKit encountered an internal error",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const classification = classifyWebKitReport(classifier, 1);
  const broadSpecFilter =
    /errors\.filter\(/.test(spec) &&
    /WebKit encountered an internal error/.test(spec);
  const broadCollectorFilter =
    /errors\.filter\(/.test(collector) &&
    /WebKit encountered an internal error/.test(collector);
  const retainsRawErrors =
    /const errors = \[\];/.test(collector) && /errors,/.test(collector);
  check("V-106-MARKER-COLLISION", classification.result === "FAILED", {
    expected:
      "structured assertion failures remain FAILED even when marker text collides",
    actual: classification,
  });
  check(
    "V-106-RAW-ERRORS",
    !broadSpecFilter && !broadCollectorFilter && retainsRawErrors,
    {
      expected:
        "ordinary page/console errors remain unfiltered; only structured offline navigation evidence is separately annotated",
      actual: { broadSpecFilter, broadCollectorFilter, retainsRawErrors },
    },
  );
  return {
    classification: classification.result,
    broadSpecFilter,
    broadCollectorFilter,
    retainsRawErrors,
  };
}

const boundaries = probeCaptureBoundaries();
const target = await probeTargetBuildAndRecursionBoundary();
const errors = probeErrorBoundarySources();
console.log(
  JSON.stringify(
    { candidateSha, findings, boundaries, target, errors },
    null,
    2,
  ),
);
process.exitCode = findings.length === 0 ? 0 : 1;
