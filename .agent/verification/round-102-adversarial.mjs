import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const findings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function check(id, condition, evidence) {
  if (!condition) findings.push({ id, evidence });
}

const verify = read("scripts/verify");
const native = read("scripts/native-accessibility.mjs");
const performance = read("scripts/collect-mobile-performance.mjs");
const webkit = read("tests/e2e/m7b-webkit.spec.ts");

// The canonical gate must not turn an explicitly BLOCKED M7B artifact into a
// passed step merely because the lane was allowed to continue to later checks.
const canonicalMasksBlocked =
  /run_step native-accessibility env M7B_NATIVE_ALLOW_BLOCKED=1/.test(verify) &&
  /run_step mobile-performance env M7B_PERFORMANCE_ALLOW_BLOCKED=1/.test(
    verify,
  ) &&
  !/summary\.json|result.*BLOCKED|BLOCKED.*result/.test(verify);
check("V-102-001", !canonicalMasksBlocked, {
  expected:
    "./scripts/verify must inspect both M7B summaries and fail/return BLOCKED when either lane is BLOCKED",
  actual:
    "run_step marks both allow-blocked commands passed from exit code alone; no summary result is inspected",
});

// Every generated native artifact is required to carry a digest. The Android
// screenshot path is the one candidate path that is appended as a bare string.
const androidScreenshotHasDigest =
  !/deviceResult\.artifacts\.push\(path\.relative\(root, screenshotPath\)\)/.test(
    native,
  );
check("V-102-002", androidScreenshotHasDigest, {
  expected: "Android screenshot manifest entries include a SHA-256 digest",
  actual:
    "captureAndroid appends android-chrome.png as a bare path without sha256",
});

// The documented operator workflow says to fill speech/viewport/checklist
// artifacts, but this implementation recreates UNVERIFIED rows and
// unconditionally adds speech blockers on every invocation. There is no
// validation/ingestion path that can turn the manual artifact into PASS.
check(
  "V-102-003",
  !/status: "UNVERIFIED"/.test(native) ||
    !/Edit \.cache\/m7b\/native\/ios-voiceover-speech\.txt/.test(native) ||
    /readFileSync\([^)]*checklist|JSON\.parse\([^)]*checklist|speech.*status.*PASS/i.test(
      native,
    ),
  {
    expected:
      "native rerun validates retained manual speech/viewport/checklist evidence",
    actual:
      "nativeChecklist always creates UNVERIFIED rows and the speech blockers are unconditional; the operator-edited artifact is never read",
  },
);

// CDP Performance.TaskDuration is renderer/main-thread work, not Dedicated
// Worker CPU attribution. The shipped collector labels it only as a proxy and
// never instruments the Worker or collects a Worker performance sample.
check(
  "V-102-004",
  !/Performance\.getMetrics/.test(performance) ||
    !/mainThreadTaskDurationMs/.test(performance) ||
    /worker\.postMessage|DedicatedWorkerGlobalScope|workerCpu/i.test(
      performance,
    ),
  {
    expected: "Worker 1x/64x CPU cost is measured from the simulation Worker",
    actual:
      "collector's worker1xMs/worker64xMs are renderer TaskDuration proxy values; no Worker instrumentation or CPU sample exists",
  },
);

// A frozen baseline must be authenticated as the accepted build, not accepted
// solely because its cells have matching browser/width labels.
check(
  "V-102-005",
  /baseline\.candidateSha|accepted.*candidate|frozen.*sha/i.test(performance),
  {
    expected:
      "baseline validation rejects a self/current/unrelated candidate baseline",
    actual:
      "baselineFindings matches cells and metrics but never validates baseline candidate SHA/build identity",
  },
);

// The WebKit lane catches the known offline navigation error, records an
// annotation, and continues to pass the test. This cannot be a passing
// canonical offline-resume result under the M7B zero-error/blocked contract.
const offlineBlock = webkit.slice(
  webkit.indexOf("let offlineNavigationError"),
  webkit.indexOf(
    "const cacheProof",
    webkit.indexOf("let offlineNavigationError"),
  ),
);
check(
  "V-102-006",
  !/offlineNavigationError = String\(error\)/.test(offlineBlock) ||
    /test\.fail|process\.exitCode|result.*BLOCKED/i.test(offlineBlock),
  {
    expected:
      "known WebKit offline navigation failure fails or produces a BLOCKED lane result",
    actual:
      "test annotation preserves the error but then asserts cached shell and exits 0",
  },
);

const nativeSummary = path.join(
  root,
  ".cache/m7b/native/round-102-default/summary.json",
);
if (fs.existsSync(nativeSummary)) {
  const summary = JSON.parse(fs.readFileSync(nativeSummary, "utf8"));
  const bareArtifacts = summary.devices
    .flatMap((device) => device.artifacts ?? [])
    .filter((entry) => typeof entry === "string");
  if (
    bareArtifacts.length > 0 &&
    !findings.some((finding) => finding.id === "V-102-002")
  )
    findings.push({
      id: "V-102-002",
      evidence: {
        expected: "all native artifact entries are {path, sha256}",
        actual: bareArtifacts,
      },
    });
}

console.log(JSON.stringify({ findings }, null, 2));
process.exitCode = findings.length === 0 ? 0 : 1;
