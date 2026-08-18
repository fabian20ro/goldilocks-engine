#!/usr/bin/env node

/* Recreate the frozen accepted build in an isolated worktree, then collect its
 * baseline with the same repository-local dependency and browser caches. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const acceptedSha =
  process.env.M7B_FROZEN_ACCEPTED_SHA ??
  "d25e80e6781de89e80fc3b3c240a922ada53d978";
const deviceId = process.env.M7B_PERFORMANCE_DEVICE_ID;
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const outputPath = path.resolve(
  root,
  outputArg?.slice("--output=".length) ??
    ".cache/m7b/performance/frozen-baseline.json",
);
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
  if (baseline.buildInfo?.version !== "dc97ee41f6dbbc0e29d2")
    throw new Error(
      `captured baseline build mismatch: ${baseline.buildInfo?.version ?? "missing"}`,
    );
  const rewriteArtifacts = (entries) =>
    (Array.isArray(entries) ? entries : []).map((entry) => ({
      ...entry,
      path: path.relative(root, path.resolve(worktree, entry.path)),
    }));
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
  fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2) + "\n");
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
process.exitCode = exitCode;
