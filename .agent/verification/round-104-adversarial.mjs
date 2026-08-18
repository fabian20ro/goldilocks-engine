#!/usr/bin/env node

/* Independent round-104 trust-boundary probes. */

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

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function settingsFingerprint(browsers) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        hasTouch: true,
        isMobile: true,
        textScale: "100%",
        reducedMotion: "no-preference",
        viewportHeights: { 320: 693, 393: 742 },
        browsers,
        widths: [320, 393],
      }),
    )
    .digest("hex");
}

function gitTreeSha(commitSha) {
  return execFileSync("git", ["rev-parse", `${commitSha}^{tree}`], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function probeMutableCanonicalBaseline() {
  const canonicalDir = path.join(root, ".cache/m7b/performance");
  const baselinePath = path.join(canonicalDir, "frozen-baseline.json");
  const provenancePath = `${baselinePath}.provenance.json`;
  const scratch = fs.mkdtempSync(path.join(root, ".cache/m7b/r104-receipt-"));
  const artifactPath = path.join(scratch, "forged-artifact.txt");
  const outputPath = path.join(scratch, "collector-summary.json");
  const evidenceDir = path.join(scratch, "evidence");
  const backup = path.join(scratch, "backup");
  fs.mkdirSync(backup, { recursive: true });

  const existing = new Map();
  for (const filePath of [baselinePath, provenancePath]) {
    if (fs.existsSync(filePath)) {
      const copyPath = path.join(backup, path.basename(filePath));
      fs.copyFileSync(filePath, copyPath);
      existing.set(filePath, copyPath);
    }
  }

  const acceptedSha = "d25e80e6781de89e80fc3b3c240a922ada53d978";
  const acceptedBuildId = "dc97ee41f6dbbc0e29d2";
  const treeSha = gitTreeSha(acceptedSha);
  fs.writeFileSync(artifactPath, "forged receipt artifact\n");
  const artifact = {
    path: path.relative(root, artifactPath),
    sha256: sha256(artifactPath),
  };
  const forged = {
    schemaVersion: 1,
    kind: "m7b-mobile-performance",
    mode: "frozen-baseline",
    candidateSha: acceptedSha,
    gitTreeSha: treeSha,
    buildInfo: { version: acceptedBuildId },
    environment: {
      deviceId: "r104-forged-device",
      browserSet: [],
      settingsFingerprint: settingsFingerprint([]),
    },
    cells: [],
    artifacts: [artifact],
    provenance: {
      captureId: "r104-forged-capture",
      path: path.relative(root, provenancePath),
    },
  };
  fs.mkdirSync(canonicalDir, { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(forged, null, 2) + "\n");
  fs.writeFileSync(
    provenancePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        kind: "m7b-frozen-baseline-provenance",
        generatedBy: "scripts/capture-frozen-baseline.mjs",
        captureId: "r104-forged-capture",
        acceptedSha,
        gitTreeSha: treeSha,
        buildId: acceptedBuildId,
        summaryPath: path.relative(root, baselinePath),
        summarySha256: sha256(baselinePath),
        artifacts: [artifact],
      },
      null,
      2,
    ) + "\n",
  );

  let run;
  let collector = null;
  try {
    run = spawnSync(
      process.execPath,
      ["scripts/collect-mobile-performance.mjs", `--output=${outputPath}`],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
          M7B_PERFORMANCE_BROWSERS: "",
          M7B_PERFORMANCE_DEVICE_ID: "r104-forged-device",
          M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
          M7B_PERFORMANCE_PORT: "43570",
        },
      },
    );
    collector = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const provenanceFindings = collector.findings.filter((finding) =>
      String(finding.gate ?? "").startsWith("same-device-baseline-provenance"),
    );
    check("V-104-001", provenanceFindings.length > 0, {
      expected:
        "a forged canonical baseline/provenance pair must be rejected by an authenticity boundary",
      actual: {
        collectorExit: run.status,
        result: collector.result,
        provenanceFindings,
        forgedCaptureId: forged.provenance.captureId,
      },
    });
    return {
      skipped: false,
      collectorExit: run.status,
      result: collector.result,
      provenanceFindings,
    };
  } finally {
    for (const filePath of [baselinePath, provenancePath]) {
      if (existing.has(filePath))
        fs.copyFileSync(existing.get(filePath), filePath);
      else fs.rmSync(filePath, { force: true });
    }
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

function probeWebKitMarkerCollision() {
  const report = {
    stats: { unexpected: 1, flaky: 0 },
    suites: [
      {
        title: "candidate assertion",
        specs: [
          {
            title: "assertion text includes a browser marker",
            tests: [
              {
                status: "failed",
                results: [
                  {
                    status: "failed",
                    error: {
                      message:
                        "expect(received).not.toContain('WebKit encountered an internal error')",
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
  const classification = classifyWebKitReport(report, 1);
  check("V-104-002", classification.result === "FAILED", {
    expected:
      "an actual Playwright assertion failure remains FAILED even if its error text contains a recognized WebKit marker",
    actual: classification,
  });
  return classification;
}

function probeInpFallback() {
  const source = fs.readFileSync(
    path.join(root, "scripts/collect-mobile-performance.mjs"),
    "utf8",
  );
  const fallback =
    /interactionMetrics\.inpMs\s*\?\?\s*metrics\.inpMs\s*\?\?\s*interactionMs/.test(
      source,
    );
  check("V-104-003", !fallback, {
    expected:
      "unsupported Event Timing must remain null/BLOCKED rather than being reported as INP from wall-clock click duration",
    actual:
      "runBrowserSample falls back from missing Event Timing INP to interactionMs",
  });
  return { fallback };
}

const receipt = probeMutableCanonicalBaseline();
const webkitMarkerCollision = probeWebKitMarkerCollision();
const inpFallback = probeInpFallback();
console.log(
  JSON.stringify(
    { candidateSha, findings, receipt, webkitMarkerCollision, inpFallback },
    null,
    2,
  ),
);
process.exitCode = findings.length === 0 ? 0 : 1;
