#!/usr/bin/env node

/* Independent round-107 evidence/trust probes. */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { classifyWebKitReport } from "../../scripts/webkit-result-classifier.mjs";
import ts from "typescript";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const candidateSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const findings = [];

function check(id, condition, evidence) {
  if (!condition) findings.push({ id, evidence });
}

function reportFor(test) {
  return {
    stats: { unexpected: 0, flaky: 0 },
    suites: [{ specs: [{ title: "probe", tests: [test] }] }],
  };
}

function probeClassifier() {
  const valid = classifyWebKitReport(
    reportFor({
      status: "expected",
      results: [{ status: "passed" }],
    }),
    0,
  );
  const malformed = {};
  for (const [name, test] of Object.entries({
    noResults: { status: "expected" },
    emptyResults: { status: "expected", results: [] },
    skippedResult: {
      status: "expected",
      results: [{ status: "skipped" }],
    },
    unknownResult: {
      status: "expected",
      results: [{ status: "unknown" }],
    },
  })) {
    malformed[name] = classifyWebKitReport(reportFor(test), 0);
  }
  const assertionMarker = classifyWebKitReport(
    reportFor({
      status: "unexpected",
      results: [
        {
          status: "failed",
          error: { message: "assertion: WebKit encountered an internal error" },
        },
      ],
    }),
    1,
  );
  const structuredBlocked = classifyWebKitReport(
    {
      stats: { unexpected: 0, flaky: 0 },
      suites: [
        {
          specs: [
            {
              title: "infrastructure",
              tests: [
                {
                  status: "expected",
                  annotations: [
                    { type: "infrastructure", description: "host unavailable" },
                  ],
                  results: [{ status: "passed" }],
                },
              ],
            },
          ],
        },
      ],
    },
    0,
  );
  check("V-107-001", valid.result === "PASS", {
    expected: "a structured passed Playwright result remains PASS",
    actual: valid,
  });
  check(
    "V-107-001",
    Object.values(malformed).every((result) => result.result === "FAILED"),
    {
      expected:
        "missing, skipped, and unknown structured result statuses fail closed",
      actual: Object.fromEntries(
        Object.entries(malformed).map(([name, result]) => [
          name,
          result.result,
        ]),
      ),
    },
  );
  check("V-107-001", assertionMarker.result === "FAILED", {
    expected: "a failed assertion remains FAILED despite marker text",
    actual: assertionMarker,
  });
  check("V-107-001", structuredBlocked.result === "BLOCKED", {
    expected: "a passed structured infrastructure annotation is BLOCKED",
    actual: structuredBlocked,
  });
  return {
    valid: valid.result,
    malformed: Object.fromEntries(
      Object.entries(malformed).map(([name, result]) => [name, result.result]),
    ),
    assertionMarker: assertionMarker.result,
    structuredBlocked: structuredBlocked.result,
  };
}

function extractCaptureErrors() {
  const source = fs.readFileSync(
    path.join(root, "tests/e2e/m7b-webkit.spec.ts"),
    "utf8",
  );
  const start = source.indexOf("function captureErrors(page: Page)");
  const end = source.indexOf("\n\nasync function assertTargetGeometry", start);
  if (start < 0 || end < 0)
    throw new Error("captureErrors function boundary missing");
  const functionSource = source.slice(start, end);
  const transpiled = ts.transpileModule(functionSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: null };
  vm.runInNewContext(`${transpiled}; module.exports = captureErrors;`, {
    module,
    Date,
    KNOWN_WEBKIT_OFFLINE_CONSOLE_MESSAGE:
      "Failed to load resource: WebKit encountered an internal error",
  });
  return module.exports;
}

function fakeRecorder() {
  const handlers = {};
  let currentUrl = "http://127.0.0.1:43717/";
  const page = {
    on(name, handler) {
      handlers[name] = handler;
    },
    url() {
      return currentUrl;
    },
  };
  const recorder = extractCaptureErrors()(page);
  const known = "Failed to load resource: WebKit encountered an internal error";
  const consoleEvent = (message = known) => ({
    type: () => "error",
    text: () => message,
    location: () => ({ url: currentUrl, lineNumber: 0, columnNumber: 0 }),
  });
  const pageError = (message) => ({ name: "Error", message });
  const navigation = (message = known) => ({
    source: "page.reload",
    operation: "offline-reload",
    message,
    errorType: "Error",
    targetUrl: currentUrl,
    pageUrl: currentUrl,
  });
  return { recorder, handlers, known, consoleEvent, pageError, navigation };
}

function probeOperationBoundaries() {
  const normal = fakeRecorder();
  const normalOperation = normal.recorder.beginOperation(
    normal.navigation().targetUrl,
  );
  normal.handlers.console(normal.consoleEvent());
  normal.recorder.finishOperation(normalOperation);
  const normalEvidence = normal.recorder.evidence(
    normalOperation,
    normal.navigation(),
  );

  const outside = fakeRecorder();
  outside.handlers.console(outside.consoleEvent());
  const outsideOperation = outside.recorder.beginOperation(
    outside.navigation().targetUrl,
  );
  outside.recorder.finishOperation(outsideOperation);
  const outsideEvidence = outside.recorder.evidence(
    outsideOperation,
    outside.navigation(),
  );

  const additional = fakeRecorder();
  const additionalOperation = additional.recorder.beginOperation(
    additional.navigation().targetUrl,
  );
  additional.handlers.console(additional.consoleEvent());
  additional.handlers.console(additional.consoleEvent("unrelated failure"));
  additional.recorder.finishOperation(additionalOperation);
  const additionalEvidence = additional.recorder.evidence(
    additionalOperation,
    additional.navigation(),
  );

  const pageError = fakeRecorder();
  const pageErrorOperation = pageError.recorder.beginOperation(
    pageError.navigation().targetUrl,
  );
  pageError.handlers.console(pageError.consoleEvent());
  pageError.handlers.pageerror(pageError.pageError("uncaught page failure"));
  pageError.recorder.finishOperation(pageErrorOperation);
  const pageErrorEvidence = pageError.recorder.evidence(
    pageErrorOperation,
    pageError.navigation(),
  );

  const assertion = fakeRecorder();
  const assertionOperation = assertion.recorder.beginOperation(
    assertion.navigation().targetUrl,
  );
  assertion.handlers.console(
    assertion.consoleEvent("assertion: WebKit encountered an internal error"),
  );
  assertion.recorder.finishOperation(assertionOperation);
  const assertionEvidence = assertion.recorder.evidence(
    assertionOperation,
    assertion.navigation(),
  );

  check("V-107-CORRELATION", normalEvidence.correlatedOfflineError !== null, {
    expected: "one exact in-window known console event correlates",
    actual: normalEvidence,
  });
  check(
    "V-107-CORRELATION",
    outsideEvidence.correlatedOfflineError === null &&
      outsideEvidence.uncorrelatedErrors.length === 1,
    {
      expected: "an outside-window error remains uncorrelated and blocks",
      actual: {
        correlated: Boolean(outsideEvidence.correlatedOfflineError),
        uncorrelated: outsideEvidence.uncorrelatedErrors.length,
      },
    },
  );
  check(
    "V-107-CORRELATION",
    additionalEvidence.correlatedOfflineError === null &&
      additionalEvidence.uncorrelatedErrors.length === 2,
    {
      expected:
        "an additional in-window error prevents infrastructure correlation",
      actual: {
        correlated: Boolean(additionalEvidence.correlatedOfflineError),
        uncorrelated: additionalEvidence.uncorrelatedErrors.length,
      },
    },
  );
  check(
    "V-107-CORRELATION",
    pageErrorEvidence.correlatedOfflineError === null &&
      pageErrorEvidence.uncorrelatedErrors.some(
        (event) => event.kind === "pageerror",
      ),
    {
      expected: "a pageerror prevents correlation and remains retained",
      actual: {
        correlated: Boolean(pageErrorEvidence.correlatedOfflineError),
        uncorrelated: pageErrorEvidence.uncorrelatedErrors,
      },
    },
  );
  check(
    "V-107-CORRELATION",
    assertionEvidence.correlatedOfflineError === null &&
      assertionEvidence.uncorrelatedErrors.length === 1,
    {
      expected: "marker-containing assertion/console text remains uncorrelated",
      actual: {
        correlated: Boolean(assertionEvidence.correlatedOfflineError),
        uncorrelated: assertionEvidence.uncorrelatedErrors,
      },
    },
  );
  return {
    normal: {
      correlated: Boolean(normalEvidence.correlatedOfflineError),
      uncorrelated: normalEvidence.uncorrelatedErrors.length,
    },
    outsideWindow: {
      correlated: Boolean(outsideEvidence.correlatedOfflineError),
      uncorrelated: outsideEvidence.uncorrelatedErrors.length,
    },
    additional: {
      correlated: Boolean(additionalEvidence.correlatedOfflineError),
      uncorrelated: additionalEvidence.uncorrelatedErrors.length,
    },
    pageerror: {
      correlated: Boolean(pageErrorEvidence.correlatedOfflineError),
      uncorrelated: pageErrorEvidence.uncorrelatedErrors.length,
    },
    assertion: {
      correlated: Boolean(assertionEvidence.correlatedOfflineError),
      uncorrelated: assertionEvidence.uncorrelatedErrors.length,
    },
  };
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

function probeHostArtifacts() {
  const webkit = readJson(
    ".cache/m7b/webkit/round-107-independent/summary.json",
  );
  const performance = readJson(
    ".cache/m7b/performance/round-107-independent/summary.json",
  );
  const native = readJson(
    ".cache/m7b/native/round-107-independent/summary.json",
  );
  const webkitFailure = webkit?.playwright?.failures?.find((failure) =>
    String(failure.error).includes("toBeNull"),
  );
  const webkitTests = webkit?.playwright?.testsSeen === 2;
  const performanceCells = performance?.cells?.map(
    (cell) => cell.summary.sampleCount,
  );
  check(
    "V-106-001",
    webkit?.result === "FAILED" && webkitTests && Boolean(webkitFailure),
    {
      expected:
        "host WebKit executes both portraits and exposes the uncorrelated offline navigation failure",
      actual: {
        result: webkit?.result,
        testsSeen: webkit?.playwright?.testsSeen,
        failure: webkitFailure,
      },
    },
  );
  check(
    "V-106-001",
    performance?.result === "FAILED" &&
      Array.isArray(performanceCells) &&
      performanceCells.length === 2 &&
      performanceCells.every((count) => count === 5) &&
      performance.findings.some((finding) => finding.gate === "page-errors") &&
      performance.findings.some(
        (finding) => finding.gate === "offline-navigation-correlation",
      ),
    {
      expected:
        "the performance collector retains five-run raw errors and does not convert the real mismatch into BLOCKED",
      actual: {
        result: performance?.result,
        cells: performanceCells,
        gates: performance?.findings?.map((finding) => finding.gate),
      },
    },
  );
  const nativeCommands = (native?.blockers ?? [])
    .filter((blocker) =>
      ["voiceover-speech", "talkback-speech"].includes(blocker.gate),
    )
    .map((blocker) => blocker.command)
    .filter((command) => typeof command === "string");
  check(
    "V-106-002",
    nativeCommands.length === 0 ||
      nativeCommands.every(
        (command) =>
          command.includes("operator-submission.json") &&
          !/Complete\s+\S*checklist\.json/.test(command),
      ),
    {
      expected:
        "native blocker recovery names the validator-consumed operator-submission.json",
      actual: nativeCommands,
    },
  );
  return {
    webkit: {
      result: webkit?.result,
      testsSeen: webkit?.playwright?.testsSeen,
      assertionFailure: Boolean(webkitFailure),
    },
    performance: {
      result: performance?.result,
      cells: performanceCells,
      gates: performance?.findings?.map((finding) => finding.gate),
    },
    native: {
      result: native?.result,
      commands: nativeCommands,
    },
  };
}

const classifier = probeClassifier();
const correlation = probeOperationBoundaries();
const hosts = probeHostArtifacts();
console.log(
  JSON.stringify(
    { candidateSha, findings, classifier, correlation, hosts },
    null,
    2,
  ),
);
process.exitCode = findings.length === 0 ? 0 : 1;
