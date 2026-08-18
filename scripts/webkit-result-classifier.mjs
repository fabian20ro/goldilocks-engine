/*
 * Classify Playwright's structured JSON report. Human-readable output is not
 * evidence. A structured test failure always wins over any infrastructure
 * annotation or marker embedded in its error text.
 */

const infrastructureErrorMarkers = [
  "WebKit encountered an internal error",
  "bootstrap_check_in",
  "Mach-port",
  "Abort trap: 6",
  "browserType.launch: Target page, context or browser has been closed",
  "browserType.launch: Executable doesn't exist",
];

const recognizedTestStatuses = new Set(["expected", "unexpected", "skipped"]);
const recognizedResultStatuses = new Set(["passed"]);

const launchProcessCodes = new Set(["ENOENT", "EACCES", "EPERM"]);

function descriptionOf(value) {
  return typeof value === "string" ? value : value?.message;
}

function isRecognizedInfrastructureError(value) {
  const message = descriptionOf(value);
  return (
    typeof message === "string" &&
    infrastructureErrorMarkers.some((marker) => message.includes(marker))
  );
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function collectReportEvidence(report, { minimumExpectedTests = 1 } = {}) {
  const failures = [];
  const infrastructure = [];
  let testsSeen = 0;
  const testCounts = {
    expected: 0,
    unexpected: 0,
    skipped: 0,
  };

  const schemaFailure = (location, error) =>
    failures.push({ location, status: "invalid", error });

  const inspectAnnotations = (annotations, location) => {
    for (const annotation of Array.isArray(annotations) ? annotations : []) {
      if (
        annotation?.type === "infrastructure" &&
        typeof annotation.description === "string" &&
        annotation.description.trim() !== ""
      )
        infrastructure.push({
          location,
          description: annotation.description,
        });
    }
  };

  const inspectSuites = (suites, parentTitle = "") => {
    if (!Array.isArray(suites)) {
      schemaFailure(
        parentTitle || "Playwright suites",
        "Playwright report suites must be an array",
      );
      return;
    }
    for (const suite of suites) {
      if (!isObject(suite)) {
        schemaFailure(
          parentTitle || "Playwright suite",
          "Playwright suite must be an object",
        );
        continue;
      }
      const suiteTitle = [parentTitle, suite?.title]
        .filter((value) => typeof value === "string" && value.length > 0)
        .join("/");
      const specs = Array.isArray(suite.specs) ? suite.specs : [];
      const childSuites = Array.isArray(suite.suites) ? suite.suites : [];
      if (!Array.isArray(suite.specs) && !Array.isArray(suite.suites))
        schemaFailure(
          suiteTitle || "Playwright suite",
          "Playwright suite must contain specs or nested suites",
        );
      for (const spec of specs) {
        if (!isObject(spec)) {
          schemaFailure(
            suiteTitle || "Playwright spec",
            "Playwright spec must be an object",
          );
          continue;
        }
        const specTitle = [suiteTitle, spec?.title]
          .filter((value) => typeof value === "string" && value.length > 0)
          .join("/");
        if (!Array.isArray(spec.tests)) {
          schemaFailure(
            specTitle || "Playwright spec",
            "Playwright spec tests must be an array",
          );
          continue;
        }
        for (const test of spec.tests) {
          testsSeen += 1;
          const location = specTitle || "Playwright test";
          if (!isObject(test)) {
            schemaFailure(location, "Playwright test must be an object");
            continue;
          }
          inspectAnnotations(test?.annotations, location);

          const testStatus = test.status;
          if (!recognizedTestStatuses.has(testStatus)) {
            failures.push({
              location,
              status: testStatus ?? "missing",
              error: "Playwright test status is missing or unknown",
            });
          } else {
            testCounts[testStatus] += 1;
            // Test status is authenticated structured evidence. Never
            // downgrade it because an error message happens to contain a
            // marker.
            if (testStatus !== "expected")
              failures.push({
                location,
                status: testStatus,
                error: "Playwright test outcome was not successful",
              });
          }
          if (
            Object.hasOwn(test, "expectedStatus") &&
            test.expectedStatus !== "passed"
          )
            schemaFailure(
              location,
              "Playwright expectedStatus must be passed for this matrix",
            );
          const results = test.results;
          if (!Array.isArray(results) || results.length === 0) {
            schemaFailure(
              location,
              "Playwright test must contain a nonempty results array",
            );
            continue;
          }
          for (const result of results) {
            if (!isObject(result)) {
              schemaFailure(
                location,
                "Playwright test result must be an object",
              );
              continue;
            }
            inspectAnnotations(result?.annotations, location);
            if (!recognizedResultStatuses.has(result.status))
              failures.push({
                location,
                status: result.status,
                error:
                  "Playwright result status is missing, skipped, unknown, or unsuccessful",
              });
          }
          const finalResult = results[results.length - 1];
          if (finalResult?.status !== "passed")
            failures.push({
              location,
              status: finalResult?.status ?? "missing",
              error: "Playwright final result status was not passed",
            });
          if (results.some((result) => isObject(result) && result.error))
            schemaFailure(
              location,
              "A passed Playwright result must not contain an error object",
            );
        }
      }
      inspectSuites(childSuites, suiteTitle);
    }
  };

  if (!isObject(report)) {
    schemaFailure("Playwright report", "Playwright report must be an object");
    return { failures, infrastructure, testsSeen };
  }
  if (!Array.isArray(report.suites) || report.suites.length === 0)
    schemaFailure(
      "Playwright report",
      "Playwright report must contain at least one suite",
    );
  inspectSuites(report.suites);
  const stats = report?.stats;
  if (!isObject(stats))
    schemaFailure("Playwright report stats", "Playwright report stats missing");
  else {
    for (const field of ["expected", "skipped", "unexpected", "flaky"]) {
      if (Object.hasOwn(stats, field) && !isNonNegativeInteger(stats[field]))
        schemaFailure(
          "Playwright report stats",
          `Playwright stats.${field} must be a non-negative integer`,
        );
    }
    for (const field of ["expected", "skipped", "unexpected"]) {
      if (
        isNonNegativeInteger(stats[field]) &&
        stats[field] !== testCounts[field]
      )
        schemaFailure(
          "Playwright report stats",
          `Playwright stats.${field} is inconsistent with observed tests`,
        );
    }
    if (stats.flaky > 0)
      failures.push({
        location: "Playwright report stats",
        status: "flaky",
        error: "Playwright report contains flaky tests",
      });
  }

  if (
    testsSeen < minimumExpectedTests ||
    testCounts.expected < minimumExpectedTests
  )
    schemaFailure(
      "Playwright matrix",
      `Playwright report must contain at least ${minimumExpectedTests} expected matrix tests`,
    );

  if (Object.hasOwn(report, "errors") && !Array.isArray(report.errors))
    schemaFailure(
      "Playwright report errors",
      "Playwright report errors must be an array",
    );
  for (const error of Array.isArray(report.errors) ? report.errors : []) {
    const message = descriptionOf(error);
    if (isRecognizedInfrastructureError(error))
      infrastructure.push({
        location: "Playwright report error",
        description: message,
      });
    else
      failures.push({
        location: "Playwright report error",
        status: "failed",
        error: message ?? "Playwright reported an unclassified error",
      });
  }

  return { failures, infrastructure, testsSeen };
}

function isLaunchProcessBlocker(processError) {
  return (
    processError &&
    launchProcessCodes.has(processError.code) &&
    typeof processError.message === "string"
  );
}

export function classifyWebKitReport(
  report,
  exitCode,
  processError = null,
  { minimumExpectedTests = 1 } = {},
) {
  if (!report || typeof report !== "object") {
    if (isLaunchProcessBlocker(processError))
      return {
        result: "BLOCKED",
        reason: `Playwright could not launch: ${processError.message}`,
        failures: [],
        infrastructure: [
          {
            location: "Playwright process launch",
            description: processError.message,
          },
        ],
        testsSeen: 0,
      };
    return {
      result: "FAILED",
      reason: "Playwright did not produce a parseable JSON report",
      failures: [
        {
          location: "Playwright JSON reporter",
          status: "missing",
          error: "structured report unavailable",
        },
      ],
      infrastructure: [],
      testsSeen: 0,
    };
  }

  const evidence = collectReportEvidence(report, { minimumExpectedTests });
  if (evidence.failures.length > 0)
    return {
      ...evidence,
      result: "FAILED",
      reason:
        "Playwright report contains an unexpected, assertion, or unclassified failure",
    };
  if (evidence.testsSeen === 0)
    return {
      ...evidence,
      result: "FAILED",
      reason: "Playwright JSON report contains no executable tests",
    };
  if (evidence.infrastructure.length > 0)
    return {
      ...evidence,
      result: "BLOCKED",
      reason:
        "Playwright tests otherwise succeeded but recorded a structured infrastructure blocker",
    };
  if (exitCode !== 0)
    return {
      ...evidence,
      result: "FAILED",
      reason: `Playwright exited with status ${exitCode}`,
    };
  return {
    ...evidence,
    result: "PASS",
    reason: "Playwright JSON report contains only successful test results",
  };
}
