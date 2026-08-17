#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const verificationDir = path.join(root, ".agent", "verification");
const decisionsPath = path.join(root, ".agent", "DECISIONS.md");

function fail(message) {
  console.error(`Verification catalog invalid: ${message}`);
  process.exitCode = 1;
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON (${error.message})`);
    return null;
  }
}

function requireFile(relativePath, label) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`${label ?? "referenced file"} does not exist: ${relativePath}`);
    return false;
  }
  return true;
}

function reportPath(relativePath) {
  return path.join(root, relativePath);
}

function parseReports() {
  const names = fs
    .readdirSync(verificationDir)
    .filter((name) => /^round-\d{3}\.md$/.test(name))
    .sort();
  const rounds = new Map();
  const findings = new Set();

  for (const name of names) {
    const round = Number(name.slice(6, 9));
    if (rounds.has(round)) fail(`duplicate immutable report round ${round}`);
    const relativePath = `.agent/verification/${name}`;
    const content = fs.readFileSync(reportPath(relativePath), "utf8");
    const verdicts = [
      ...content.matchAll(/^VERDICT:\s*(PASS|FAIL|BLOCKED)\s*$/gm),
    ].map((match) => match[1]);
    const candidates = [
      ...content.matchAll(/^Candidate SHA:\s*`?([0-9a-f]{40})`?\s*$/gim),
    ].map((match) => match[1].toLowerCase());
    if (verdicts.length !== 1)
      fail(`${relativePath} must contain exactly one VERDICT line`);
    if (candidates.length !== 1)
      fail(`${relativePath} must contain exactly one candidate SHA line`);
    const reportFindings = [
      ...content.matchAll(/^###\s+((?:V|B)-\d+(?:-\d+)?)\s+[—-]/gm),
    ].map((match) => match[1]);
    for (const finding of reportFindings) findings.add(finding);
    rounds.set(round, {
      name,
      path: relativePath,
      verdict: verdicts[0] ?? null,
      candidateSha: candidates[0] ?? null,
      findings: reportFindings,
    });
  }

  if (names.length === 0) fail("no immutable round reports found");
  return { rounds, findings };
}

function matchesGroup(group, finding) {
  if (group.match?.exact?.includes(finding)) return true;
  const prefix = group.match?.prefix;
  const number = Number(finding.slice(prefix?.length ?? 0));
  return (
    typeof prefix === "string" &&
    Number.isInteger(number) &&
    number >= group.match.from &&
    number <= group.match.to &&
    finding === `${prefix}${String(number).padStart(3, "0")}`
  );
}

function validateCatalog(catalog, reports) {
  if (!catalog) return;
  if (catalog.schemaVersion !== 1)
    fail(`unsupported schemaVersion ${catalog.schemaVersion}`);
  if (catalog.catalogKind !== "active-verification")
    fail("catalogKind must be active-verification");

  const accepted = catalog.historicalAcceptedSnapshot;
  if (!accepted || accepted.verdict !== "PASS")
    fail("historicalAcceptedSnapshot must identify a PASS report");
  if (!accepted?.report || !requireFile(accepted.report, "accepted report"))
    return;
  const acceptedReport = reports.rounds.get(accepted.round);
  if (!acceptedReport || acceptedReport.path !== accepted.report)
    fail("accepted snapshot round/report do not match the immutable archive");
  if (acceptedReport?.verdict !== "PASS")
    fail("accepted snapshot report is not PASS");
  if (acceptedReport?.candidateSha !== accepted.candidateSha.toLowerCase())
    fail("accepted snapshot candidate SHA disagrees with its report");
  if (!/^[0-9a-f]{40}$/i.test(accepted.verifierCommit ?? ""))
    fail("accepted snapshot verifierCommit is not a commit SHA");

  const scope = catalog.activeScope;
  if (!scope || scope.status !== "active")
    fail("activeScope must be present with status active");
  const requirementIds = new Set();
  for (const requirement of scope?.requirements ?? []) {
    if (requirementIds.has(requirement.id))
      fail(`duplicate active requirement ${requirement.id}`);
    requirementIds.add(requirement.id);
    if (requirement.status !== "active")
      fail(`active requirement ${requirement.id} has contradictory status`);
    for (const source of requirement.sources ?? [])
      requireFile(source, requirement.id);
    for (const check of requirement.checks ?? [])
      requireFile(check, requirement.id);
  }
  if (requirementIds.size === 0) fail("activeScope has no requirements");

  const groups = catalog.findingGroups ?? [];
  const coveredBy = new Map();
  for (const group of groups) {
    const statuses = new Set(["active", "resolved", "superseded", "archival"]);
    if (!statuses.has(group.status))
      fail(`${group.id} has an unsupported status ${group.status}`);
    for (const finding of reports.findings) {
      if (!matchesGroup(group, finding)) continue;
      const previous = coveredBy.get(finding);
      if (previous)
        fail(`${finding} is routed by both ${previous} and ${group.id}`);
      coveredBy.set(finding, group.id);
    }
    if (group.status === "active")
      fail(
        `${group.id} is an unresolved active finding; use activeScope for new work`,
      );
    if (group.status === "resolved" && !group.resolutionReport)
      fail(`${group.id} resolved status has no resolutionReport`);
    if (group.status === "superseded" && !group.supersededByDecision)
      fail(`${group.id} superseded status has no superseding decision`);
    if (group.status === "archival" && !group.note)
      fail(`${group.id} archival status has no explanatory note`);
    if (group.resolutionReport) {
      requireFile(group.resolutionReport, `${group.id} resolution report`);
      const report = [...reports.rounds.values()].find(
        (candidate) => candidate.path === group.resolutionReport,
      );
      if (report?.verdict !== "PASS")
        fail(`${group.id} resolution report is not PASS`);
    }
    for (const evidence of group.regressionEvidence ?? [])
      requireFile(evidence, `${group.id} regression evidence`);
    if (group.supersededByDecision) {
      const decisions = fs.readFileSync(decisionsPath, "utf8");
      if (!decisions.includes(group.supersededByDecision))
        fail(`${group.id} cites missing ${group.supersededByDecision}`);
    }
  }
  for (const finding of reports.findings) {
    if (!coveredBy.has(finding))
      fail(`${finding} from the immutable archive has no catalog status`);
  }

  for (const probe of catalog.supersededProbes ?? []) {
    if (!["superseded", "archival"].includes(probe.status))
      fail(`${probe.id} has an invalid historical probe status`);
    requireFile(probe.source, `${probe.id} source`);
    requireFile(probe.replacementEvidence, `${probe.id} replacement evidence`);
    const decisions = fs.readFileSync(decisionsPath, "utf8");
    if (!decisions.includes(probe.supersededByDecision))
      fail(`${probe.id} cites missing ${probe.supersededByDecision}`);
  }

  for (const [round, report] of reports.rounds) {
    if (round === accepted.round && report.path !== accepted.report)
      fail(`round ${round} has contradictory accepted report routing`);
  }
}

const catalog = readJson(".agent/verification/catalog.json");
const reports = parseReports();
validateCatalog(catalog, reports);

if (!process.exitCode) {
  console.log(
    `Verification catalog valid: ${reports.rounds.size} immutable reports, ${reports.findings.size} findings, ${catalog.activeScope.requirements.length} active requirements`,
  );
}
