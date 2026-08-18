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

const failureStatuses = new Set([
  "failed",
  "timedOut",
  "interrupted",
  "unexpected",
  "flaky",
]);

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

function collectReportEvidence(report) {
  const failures = [];
  const infrastructure = [];
  let testsSeen = 0;

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
    for (const suite of Array.isArray(suites) ? suites : []) {
      const suiteTitle = [parentTitle, suite?.title]
        .filter((value) => typeof value === "string" && value.length > 0)
        .join("/");
      for (const spec of Array.isArray(suite?.specs) ? suite.specs : []) {
        const specTitle = [suiteTitle, spec?.title]
          .filter((value) => typeof value === "string" && value.length > 0)
          .join("/");
        for (const test of Array.isArray(spec?.tests) ? spec.tests : []) {
          testsSeen += 1;
          const location = specTitle || "Playwright test";
          inspectAnnotations(test?.annotations, location);

          // Test and result status is authenticated structured evidence. Never
          // downgrade it because an error message happens to contain a marker.
          if (
            failureStatuses.has(test?.status) ||
            failureStatuses.has(test?.outcome)
          )
            failures.push({
              location,
              status: test.status ?? test.outcome,
              error: "Playwright test outcome was not successful",
            });
          const results = Array.isArray(test?.results) ? test.results : [];
          for (const result of results) {
            inspectAnnotations(result?.annotations, location);
            if (failureStatuses.has(result?.status))
              failures.push({
                location,
                status: result.status,
                error: descriptionOf(result.error),
              });
          }
          if (
            test?.status === "skipped" &&
            !results.some((result) => result?.status === "skipped")
          )
            failures.push({
              location,
              status: "skipped",
              error:
                "Playwright test was skipped without a recognized infrastructure blocker",
            });
        }
      }
      inspectSuites(suite?.suites, suiteTitle);
    }
  };

  inspectSuites(report?.suites);
  const stats = report?.stats;
  if (Number(stats?.unexpected) > 0)
    failures.push({
      location: "Playwright report stats",
      status: "unexpected",
      error: "Playwright report contains unexpected tests",
    });
  if (Number(stats?.flaky) > 0)
    failures.push({
      location: "Playwright report stats",
      status: "flaky",
      error: "Playwright report contains flaky tests",
    });

  for (const error of Array.isArray(report?.errors) ? report.errors : []) {
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

export function classifyWebKitReport(report, exitCode, processError = null) {
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

  const evidence = collectReportEvidence(report);
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
