#!/usr/bin/env node

/*
 * Internal child of collect-mobile-performance.mjs. It recreates the accepted
 * Git object in an isolated extracted tree and returns the freshly measured baseline
 * over a nonce-authenticated stdout channel. No persisted receipt is read or
 * treated as a trust root.
 */

import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const acceptedSha = "d25e80e6781de89e80fc3b3c240a922ada53d978";
const acceptedBuildId = "dc97ee41f6dbbc0e29d2";
const nonce = process.env.M7B_FROZEN_CAPTURE_NONCE;
const deviceId = process.env.M7B_PERFORMANCE_DEVICE_ID;
const evidenceDir = path.resolve(
  root,
  process.env.M7B_PERFORMANCE_EVIDENCE_DIR ??
    ".cache/m7b/performance/frozen-baseline-child",
);
const outputPath = path.join(evidenceDir, "summary.json");
const cacheRoot = path.join(root, ".cache");
const npmCache = path.join(cacheRoot, "npm");
const browsersPath = path.join(cacheRoot, "ms-playwright");

function fail(message, code = 1) {
  console.error(message);
  process.exitCode = code;
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function gitTreeSha() {
  return execFileSync("git", ["rev-parse", `${acceptedSha}^{tree}`], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function insideRoot(filePath) {
  const resolved = path.resolve(filePath);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

function rewriteArtifacts(entries, worktree) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      Object.keys(entry).length !== 2 ||
      typeof entry.path !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    )
      throw new Error("frozen baseline artifact entries must be {path,sha256}");
    const retainedPath = path.resolve(worktree, entry.path);
    if (
      !insideRoot(retainedPath) ||
      !retainedPath.startsWith(`${evidenceDir}${path.sep}`) ||
      !fs.existsSync(retainedPath)
    )
      throw new Error(`frozen baseline artifact is missing: ${entry.path}`);
    return {
      path: path.relative(root, retainedPath),
      sha256: sha256(retainedPath),
    };
  });
}

if (!nonce || !/^[a-f0-9]{64}$/.test(nonce))
  fail(
    "M7B_FROZEN_CAPTURE_NONCE must be a fresh 32-byte hexadecimal nonce",
    64,
  );
else if (!deviceId || deviceId === "unidentified-device")
  fail(
    "M7B_PERFORMANCE_DEVICE_ID must identify the physical baseline device",
    64,
  );
else if (!insideRoot(evidenceDir))
  fail("frozen baseline evidence must remain inside the repository", 64);
else {
  const worktree = fs.mkdtempSync(
    path.join(cacheRoot, "m7b-frozen-baseline-worktree-"),
  );
  let exitCode = 0;
  try {
    execFileSync("git", ["cat-file", "-e", `${acceptedSha}^{commit}`], {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const archive = execFileSync(
      "git",
      ["archive", "--format=tar", acceptedSha],
      {
        cwd: root,
        maxBuffer: 128 * 1024 * 1024,
      },
    );
    execFileSync("tar", ["-xf", "-", "-C", worktree], {
      cwd: root,
      input: archive,
      stdio: ["pipe", "ignore", "pipe"],
    });
    fs.mkdirSync(evidenceDir, { recursive: true });
    const env = {
      ...process.env,
      npm_config_cache: npmCache,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      M7B_FROZEN_ACCEPTED_SHA: acceptedSha,
      M7B_FROZEN_BUILD_ID: acceptedBuildId,
      M7B_FROZEN_CAPTURE_SHA: acceptedSha,
      M7B_FROZEN_CAPTURE_TREE_SHA: gitTreeSha(),
      M7B_FROZEN_CAPTURE_AUTH: nonce,
      M7B_PERFORMANCE_DEVICE_ID: deviceId,
      M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
      M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
    };
    execFileSync("npm", ["ci", "--prefer-offline"], {
      cwd: worktree,
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    execFileSync(
      path.join(worktree, "node_modules/.bin/playwright"),
      ["install", "chromium", "webkit"],
      { cwd: worktree, env, stdio: ["ignore", "ignore", "pipe"] },
    );
    const child = spawnSync(
      process.execPath,
      [
        "scripts/collect-mobile-performance.mjs",
        "--capture-frozen-baseline",
        `--output=${outputPath}`,
      ],
      {
        cwd: worktree,
        env,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    if (child.status !== 0 || child.signal)
      throw new Error(
        `accepted-build collector failed (${child.status ?? child.signal}): ${String(
          child.stderr ?? child.stdout ?? "",
        ).slice(-2_000)}`,
      );
    const baseline = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    const expectedTreeSha = gitTreeSha();
    if (
      baseline.candidateSha !== acceptedSha ||
      baseline.gitTreeSha !== expectedTreeSha ||
      baseline.buildInfo?.version !== acceptedBuildId
    )
      throw new Error(
        "accepted-build collector did not return the pinned Git object/tree/build",
      );
    if (baseline.environment?.deviceId !== deviceId)
      throw new Error(
        "accepted-build collector returned a different device ID",
      );
    if (!insideRoot(outputPath))
      throw new Error("baseline output escaped repository");
    baseline.artifacts = rewriteArtifacts(baseline.artifacts, worktree);
    if (baseline.physicalDevice)
      baseline.physicalDevice = {
        ...baseline.physicalDevice,
        artifacts: rewriteArtifacts(
          baseline.physicalDevice.artifacts,
          worktree,
        ),
      };
    if (baseline.androidBrowser)
      baseline.androidBrowser = {
        ...baseline.androidBrowser,
        artifacts: rewriteArtifacts(
          baseline.androidBrowser.artifacts,
          worktree,
        ),
      };
    const envelope = {
      channelVersion: 1,
      nonce,
      baseline,
    };
    process.stdout.write(
      `M7B_FROZEN_CAPTURE_RESULT ${Buffer.from(
        JSON.stringify(envelope),
      ).toString("base64url")}\n`,
    );
  } catch (error) {
    exitCode = Number.isInteger(error?.status) ? error.status : 1;
    fail(String(error));
  } finally {
    fs.rmSync(worktree, { recursive: true, force: true });
  }
  process.exitCode = exitCode;
}
