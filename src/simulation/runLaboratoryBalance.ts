import { laboratoryBalanceSummary } from "./laboratoryBalance";

const summary = laboratoryBalanceSummary(24);
console.log(
  `laboratory balance: ${summary.validRuns}/${summary.seedCount} valid, ${summary.completedRuns} completed, ${summary.endings} endings, ${summary.passedExperiments} passed experiments`,
);
if (
  summary.validRuns !== summary.seedCount ||
  summary.completedRuns !== summary.seedCount ||
  summary.endings !== summary.seedCount
)
  process.exitCode = 1;
