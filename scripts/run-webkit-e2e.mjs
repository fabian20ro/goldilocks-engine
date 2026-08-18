#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = path.resolve(
  root,
  process.env.M7B_WEBKIT_EVIDENCE_DIR ?? ".cache/m7b/webkit",
);
const reportPath = path.join(evidenceDir, "playwright-report.json");
const stderrPath = path.join(evidenceDir, "playwright-stderr.log");
const summaryPath = path.join(evidenceDir, "summary.json");
const playwrightBin = path.join(root, "node_modules/.bin/playwright");
const configArg =
  process.argv.find((value) => value.startsWith("--config=")) ??
  "--config=playwright.webkit.config.ts";

fs.mkdirSync(evidenceDir, { recursive: true });

function candidateSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function artifact(filePath) {
  return {
    path: path.relative(root, filePath),
    sha256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex"),
  };
}

const run = spawnSync(playwrightBin, ["test", configArg, "--reporter=json"], {
  cwd: root,
  env: process.env,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const stdout = String(run.stdout ?? "");
const stderr = String(run.stderr ?? "");
fs.writeFileSync(reportPath, stdout);
fs.writeFileSync(stderrPath, stderr);

const infrastructureFailure =
  /WebKit encountered an internal error|WebKit.*(?:Abort trap|Mach-port)|bootstrap_check_in|process launch failed|browserType\.launch|WebKit offline reload reported:/i.test(
    `${stdout}\n${stderr}`,
  );
const blocked = infrastructureFailure;
const result = blocked ? "BLOCKED" : run.status === 0 ? "PASS" : "FAILED";
const summary = {
  schemaVersion: 1,
  kind: "m7b-webkit-e2e",
  candidateSha: candidateSha(),
  result,
  exitCode: run.status ?? 1,
  command: `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright playwright test ${configArg} --reporter=json`,
  reason: blocked
    ? "WebKit reported a known navigation or browser-launch infrastructure failure; inspect retained report and stderr"
    : result === "FAILED"
      ? "Pinned WebKit test failed"
      : "Pinned WebKit test completed without blocked annotations",
  artifacts: [artifact(reportPath), artifact(stderrPath)],
};
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));

process.exitCode = result === "PASS" ? 0 : result === "BLOCKED" ? 2 : 1;
