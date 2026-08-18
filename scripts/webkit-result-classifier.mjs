/*
 * Classify a Playwright JSON report without consulting human-readable runner
 * output. Test/assertion failures always win over infrastructure annotations.
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
          const results = Array.isArray(test?.results) ? test.results : [];
          for (const result of results) {
            inspectAnnotations(result?.annotations, location);
            if (
              failureStatuses.has(result?.status) &&
              isRecognizedInfrastructureError(result?.error)
            )
              infrastructure.push({
                location,
                description: descriptionOf(result.error),
              });
            else if (failureStatuses.has(result?.status))
              failures.push({
                location,
                status: result.status,
                error: descriptionOf(result.error),
              });
          }
          const resultWasRecognizedInfrastructure =
            results.length > 0 &&
            results.every(
              (result) =>
                failureStatuses.has(result?.status) &&
                isRecognizedInfrastructureError(result?.error),
            );
          if (
            (failureStatuses.has(test?.status) ||
              failureStatuses.has(test?.outcome)) &&
            !resultWasRecognizedInfrastructure
          )
            failures.push({
              location,
              status: test.status ?? test.outcome,
              error: "Playwright test outcome was not successful",
            });
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
  if (
    (Number(stats?.unexpected) > 0 || Number(stats?.flaky) > 0) &&
    failures.length === 0 &&
    infrastructure.length === 0
  )
    failures.push({
      location: "Playwright report stats",
      status: Number(stats.unexpected) > 0 ? "unexpected" : "flaky",
      error: "Playwright report contains unexpected or flaky tests",
    });

  for (const error of Array.isArray(report?.errors) ? report.errors : []) {
    const message = descriptionOf(error);
    if (
      typeof message === "string" &&
      infrastructureErrorMarkers.some((marker) => message.includes(marker))
    )
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

export function classifyWebKitReport(report, exitCode) {
  if (!report || typeof report !== "object")
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

  const evidence = collectReportEvidence(report);
  if (evidence.failures.length > 0)
    return {
      ...evidence,
      result: "FAILED",
      reason:
        "Playwright report contains an unexpected, assertion, or unclassified failure",
    };
  if (evidence.infrastructure.length > 0)
    return {
      ...evidence,
      result: "BLOCKED",
      reason:
        "Playwright tests otherwise succeeded but recorded a structured infrastructure blocker",
    };
  if (evidence.testsSeen === 0)
    return {
      ...evidence,
      result: "FAILED",
      reason: "Playwright JSON report contains no executable tests",
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
