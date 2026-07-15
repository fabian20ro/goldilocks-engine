import { validatePrototype } from "./numericPrototype";

const report = validatePrototype();
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.viable || !report.noDominantStrategy || !report.upgradeTradeoffs)
  process.exitCode = 1;
