#!/usr/bin/env node

import fs from "node:fs";

const summaryPath = process.argv[2];
if (!summaryPath) {
  console.error("usage: read-evidence-result.mjs <summary.json>");
  process.exit(64);
}

let summary;
try {
  summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
} catch (error) {
  console.error(`Cannot read evidence summary ${summaryPath}: ${error}`);
  process.exit(64);
}

if (!["PASS", "BLOCKED", "FAILED"].includes(summary?.result)) {
  console.error(
    `Evidence summary has invalid result: ${summary?.result ?? "missing"}`,
  );
  process.exit(64);
}

console.log(summary.result);
process.exitCode =
  summary.result === "PASS" ? 0 : summary.result === "BLOCKED" ? 2 : 1;
