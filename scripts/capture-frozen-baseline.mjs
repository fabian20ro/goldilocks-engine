#!/usr/bin/env node

/* Recreate the frozen accepted build in an isolated worktree, then collect its
 * baseline with the same repository-local dependency and browser caches. */

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const acceptedSha = "d25e80e6781de89e80fc3b3c240a922ada53d978";
const requestedAcceptedSha = process.env.M7B_FROZEN_ACCEPTED_SHA;
const acceptedBuildId = "dc97ee41f6dbbc0e29d2";
const deviceId = process.env.M7B_PERFORMANCE_DEVICE_ID;
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const outputPath = path.resolve(
  root,
  outputArg?.slice("--output=".length) ??
    ".cache/m7b/performance/frozen-baseline.json",
);
const provenancePath = `${outputPath}.provenance.json`;
const captureId = crypto.randomUUID();
const cacheRoot = path.join(root, ".cache");
const npmCache = path.join(cacheRoot, "npm");
const browsersPath = path.join(cacheRoot, "ms-playwright");
const retainedEvidence = path.join(
  cacheRoot,
  "m7b/performance",
  `frozen-baseline-${Date.now()}`,
);

if (!deviceId || deviceId === "unidentified-device") {
  console.error(
    "M7B_PERFORMANCE_DEVICE_ID must name the physical device used for the baseline",
  );
  process.exit(64);
}
if (requestedAcceptedSha && requestedAcceptedSha !== acceptedSha) {
  console.error(
    `M7B_FROZEN_ACCEPTED_SHA must equal the trusted accepted object ${acceptedSha}`,
  );
  process.exit(64);
}
if (!outputPath.startsWith(`${root}${path.sep}`)) {
  console.error("Frozen baseline output must remain inside the repository");
  process.exit(64);
}

const worktree = fs.mkdtempSync(
  path.join(cacheRoot, "m7b-frozen-baseline-worktree-"),
);

let exitCode = 0;
try {
  execFileSync("git", ["cat-file", "-e", `${acceptedSha}^{commit}`], {
    cwd: root,
    stdio: "inherit",
  });
  execFileSync("git", ["worktree", "add", "--detach", worktree, acceptedSha], {
    cwd: root,
    stdio: "inherit",
  });
  const env = {
    ...process.env,
    npm_config_cache: npmCache,
    PLAYWRIGHT_BROWSERS_PATH: browsersPath,
    M7B_FROZEN_ACCEPTED_SHA: acceptedSha,
    M7B_PERFORMANCE_DEVICE_ID: deviceId,
    M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
    M7B_PERFORMANCE_EVIDENCE_DIR: retainedEvidence,
  };
  execFileSync("npm", ["ci", "--prefer-offline"], {
    cwd: worktree,
    env,
    stdio: "inherit",
  });
  execFileSync(
    path.join(worktree, "node_modules/.bin/playwright"),
    ["install", "chromium", "webkit"],
    { cwd: worktree, env, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      "scripts/collect-mobile-performance.mjs",
      "--capture-frozen-baseline",
      `--output=${outputPath}`,
    ],
    { cwd: worktree, env, stdio: "inherit" },
  );
  const baseline = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (baseline.candidateSha !== acceptedSha)
    throw new Error(
      `captured baseline candidate mismatch: ${baseline.candidateSha}`,
    );
  if (baseline.buildInfo?.version !== acceptedBuildId)
    throw new Error(
      `captured baseline build mismatch: ${baseline.buildInfo?.version ?? "missing"}`,
    );
  const rewriteArtifacts = (entries) =>
    (Array.isArray(entries) ? entries : []).map((entry) => {
      if (
        !entry ||
        typeof entry.path !== "string" ||
        !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
      )
        throw new Error(
          "frozen baseline artifact entries must be {path,sha256}",
        );
      const retainedPath = path.resolve(worktree, entry.path);
      if (!fs.existsSync(retainedPath))
        throw new Error(`frozen baseline artifact is missing: ${entry.path}`);
      return {
        path: path.relative(root, retainedPath),
        sha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(retainedPath))
          .digest("hex"),
      };
    });
  baseline.artifacts = rewriteArtifacts(baseline.artifacts);
  baseline.physicalDevice = baseline.physicalDevice
    ? {
        ...baseline.physicalDevice,
        artifacts: rewriteArtifacts(baseline.physicalDevice.artifacts),
      }
    : baseline.physicalDevice;
  baseline.androidBrowser = baseline.androidBrowser
    ? {
        ...baseline.androidBrowser,
        artifacts: rewriteArtifacts(baseline.androidBrowser.artifacts),
      }
    : baseline.androidBrowser;
  const gitTreeSha = execFileSync(
    "git",
    ["rev-parse", `${acceptedSha}^{tree}`],
    { cwd: root, encoding: "utf8" },
  ).trim();
  baseline.gitTreeSha = gitTreeSha;
  baseline.provenance = {
    captureId,
    path: path.relative(root, provenancePath),
  };
  fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2) + "\n");
  const artifactEntries = [
    ...(Array.isArray(baseline.artifacts) ? baseline.artifacts : []),
    ...(Array.isArray(baseline.physicalDevice?.artifacts)
      ? baseline.physicalDevice.artifacts
      : []),
    ...(Array.isArray(baseline.androidBrowser?.artifacts)
      ? baseline.androidBrowser.artifacts
      : []),
  ];
  fs.writeFileSync(
    provenancePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        kind: "m7b-frozen-baseline-provenance",
        generatedBy: "scripts/capture-frozen-baseline.mjs",
        captureId,
        acceptedSha,
        gitTreeSha,
        buildId: acceptedBuildId,
        summaryPath: path.relative(root, outputPath),
        summarySha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(outputPath))
          .digest("hex"),
        artifacts: artifactEntries,
      },
      null,
      2,
    ) + "\n",
  );
} catch (error) {
  console.error(String(error));
  exitCode = Number.isInteger(error?.status) ? error.status : 1;
} finally {
  try {
    execFileSync("git", ["worktree", "remove", "--force", worktree], {
      cwd: root,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(
      `Unable to remove temporary frozen worktree: ${String(error)}`,
    );
    exitCode ||= 1;
  }
  fs.rmSync(worktree, { recursive: true, force: true });
}

if (fs.existsSync(outputPath))
  console.log(`Frozen baseline artifact: ${path.relative(root, outputPath)}`);
if (fs.existsSync(provenancePath))
  console.log(
    `Frozen baseline provenance: ${path.relative(root, provenancePath)}`,
  );
process.exitCode = exitCode;
