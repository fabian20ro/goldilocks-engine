#!/usr/bin/env node

/*
 * Internal child of the current collector. It serves the app bytes archived
 * from the accepted Git object, then invokes the current collector through an
 * absolute path in capture-only target-URL mode. No old-tree tooling or
 * persisted receipt is trusted.
 */

import { execFileSync, spawn, spawnSync } from "node:child_process";
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
const targetPort = Number(
  process.env.M7B_PERFORMANCE_TARGET_PORT ??
    process.env.M7B_PERFORMANCE_PORT ??
    "4373",
);
const targetUrl = `http://127.0.0.1:${targetPort}/goldilocks-engine/`;
const outputPath = path.join(evidenceDir, "summary.json");
const cacheRoot = path.join(root, ".cache");
const npmCache = path.join(cacheRoot, "npm");
const browsersPath = path.join(cacheRoot, "ms-playwright");
const currentCollectorPath = path.join(
  root,
  "scripts/collect-mobile-performance.mjs",
);

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

function fail(message, code = 1) {
  console.error(message);
  process.exitCode = code;
}

function rewriteArtifacts(entries) {
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
    const retainedPath = path.resolve(root, entry.path);
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

async function waitForBuildInfo(url) {
  const deadline = Date.now() + 60_000;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL("build-info.json", url));
      if (response.ok) return await response.json();
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `frozen app preview did not expose build-info.json: ${lastError}`,
  );
}

function stopServer(server) {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // The preview group may already have exited.
  }
}

async function main() {
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce))
    return fail(
      "M7B_FROZEN_CAPTURE_NONCE must be a fresh 32-byte hexadecimal nonce",
      64,
    );
  if (!deviceId || deviceId === "unidentified-device")
    return fail(
      "M7B_PERFORMANCE_DEVICE_ID must identify the physical baseline device",
      64,
    );
  if (!insideRoot(evidenceDir))
    return fail(
      "frozen baseline evidence must remain inside the repository",
      64,
    );
  if (!fs.existsSync(currentCollectorPath))
    return fail("current mobile-performance collector is missing", 64);
  if (!Number.isInteger(targetPort) || targetPort < 1024 || targetPort > 65535)
    return fail("M7B_PERFORMANCE_TARGET_PORT must be a valid TCP port", 64);

  const frozenRoot = fs.mkdtempSync(path.join(cacheRoot, "m7b-frozen-app-"));
  let server;
  let exitCode = 0;
  try {
    const treeSha = gitTreeSha();
    execFileSync("git", ["cat-file", "-e", `${acceptedSha}^{commit}`], {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const archive = execFileSync(
      "git",
      ["archive", "--format=tar", acceptedSha],
      { cwd: root, maxBuffer: 128 * 1024 * 1024 },
    );
    execFileSync("tar", ["-xf", "-", "-C", frozenRoot], {
      cwd: root,
      input: archive,
      stdio: ["pipe", "ignore", "pipe"],
    });

    const env = {
      ...process.env,
      npm_config_cache: npmCache,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      M7B_FROZEN_ACCEPTED_SHA: acceptedSha,
      M7B_FROZEN_BUILD_ID: acceptedBuildId,
      M7B_FROZEN_CAPTURE_SHA: acceptedSha,
      M7B_FROZEN_CAPTURE_TREE_SHA: treeSha,
      M7B_FROZEN_CAPTURE_AUTH: nonce,
      M7B_FROZEN_CAPTURE_NONCE: nonce,
      M7B_PERFORMANCE_DEVICE_ID: deviceId,
      M7B_PERFORMANCE_ALLOW_BLOCKED: "1",
      M7B_PERFORMANCE_EVIDENCE_DIR: evidenceDir,
      M7B_PERFORMANCE_TARGET_URL: targetUrl,
      M7B_PERFORMANCE_TARGET_PORT: String(targetPort),
      M7B_PERFORMANCE_CAPTURE_ONLY: "1",
    };
    fs.mkdirSync(evidenceDir, { recursive: true });
    execFileSync("npm", ["ci", "--prefer-offline"], {
      cwd: frozenRoot,
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    execFileSync("npm", ["run", "build:pages"], {
      cwd: frozenRoot,
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });

    const buildInfoPath = path.join(frozenRoot, "dist/build-info.json");
    if (!fs.existsSync(buildInfoPath))
      throw new Error("frozen app build did not produce dist/build-info.json");
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));
    if (buildInfo.version !== acceptedBuildId)
      throw new Error(
        `frozen app build ID mismatch: ${buildInfo.version ?? "missing"}`,
      );
    fs.writeFileSync(
      buildInfoPath,
      JSON.stringify(
        {
          ...buildInfo,
          candidateSha: acceptedSha,
          gitTreeSha: treeSha,
        },
        null,
        2,
      ) + "\n",
    );
    const scopedDist = path.join(frozenRoot, "dist/goldilocks-engine");
    fs.mkdirSync(scopedDist, { recursive: true });
    for (const entry of fs.readdirSync(path.join(frozenRoot, "dist"))) {
      if (entry === "goldilocks-engine") continue;
      fs.cpSync(
        path.join(frozenRoot, "dist", entry),
        path.join(scopedDist, entry),
        { recursive: true },
      );
    }

    server = spawn(
      path.join(frozenRoot, "node_modules/.bin/vite"),
      [
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(targetPort),
        "--strictPort",
      ],
      { cwd: frozenRoot, env, detached: true, stdio: "ignore" },
    );
    const liveBuildInfo = await waitForBuildInfo(targetUrl);
    if (
      liveBuildInfo.version !== acceptedBuildId ||
      liveBuildInfo.candidateSha !== acceptedSha ||
      liveBuildInfo.gitTreeSha !== treeSha
    )
      throw new Error(
        "live frozen app build-info identity did not match the accepted Git object/tree/build",
      );

    const child = spawnSync(
      process.execPath,
      [
        currentCollectorPath,
        "--capture-frozen-baseline",
        "--capture-only",
        `--output=${outputPath}`,
      ],
      {
        cwd: root,
        env,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
    );
    if (child.status !== 0 || child.signal)
      throw new Error(
        `current collector failed (${child.status ?? child.signal}): ${String(
          child.stderr ?? child.stdout ?? "",
        ).slice(-2_000)}`,
      );
    const baseline = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (
      baseline.candidateSha !== acceptedSha ||
      baseline.gitTreeSha !== treeSha ||
      baseline.buildInfo?.version !== acceptedBuildId ||
      baseline.buildInfo?.candidateSha !== acceptedSha ||
      baseline.buildInfo?.gitTreeSha !== treeSha
    )
      throw new Error(
        "current collector did not retain the live accepted app identity",
      );
    if (baseline.environment?.deviceId !== deviceId)
      throw new Error("current collector returned a different device ID");
    if (!insideRoot(outputPath))
      throw new Error("baseline output escaped repository");
    baseline.artifacts = rewriteArtifacts(baseline.artifacts);
    if (baseline.physicalDevice)
      baseline.physicalDevice = {
        ...baseline.physicalDevice,
        artifacts: rewriteArtifacts(baseline.physicalDevice.artifacts),
      };
    if (baseline.androidBrowser)
      baseline.androidBrowser = {
        ...baseline.androidBrowser,
        artifacts: rewriteArtifacts(baseline.androidBrowser.artifacts),
      };
    const envelope = { channelVersion: 1, nonce, baseline };
    process.stdout.write(
      `M7B_FROZEN_CAPTURE_RESULT ${Buffer.from(
        JSON.stringify(envelope),
      ).toString("base64url")}\n`,
    );
  } catch (error) {
    exitCode = Number.isInteger(error?.status) ? error.status : 1;
    fail(String(error));
  } finally {
    stopServer(server);
    fs.rmSync(frozenRoot, { recursive: true, force: true });
  }
  process.exitCode = exitCode;
}

main().catch((error) => {
  fail(String(error));
});
