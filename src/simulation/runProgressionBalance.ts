import { validateProgressionEconomy } from "./progressionBalance";

let failures = 0;
let earliestExpansion = Number.POSITIVE_INFINITY;
let latestExpansion = 0;
let earliestFullCatalogue = Number.POSITIVE_INFINITY;
let latestFullCatalogue = 0;
const failedSeeds: Array<{ seed: number; reasons: string[] }> = [];
const FIRST_SEED = -20;
const LAST_SEED = 20;

for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
  const result = validateProgressionEconomy(seed);
  earliestExpansion = Math.min(earliestExpansion, result.expansionHour);
  latestExpansion = Math.max(latestExpansion, result.expansionHour);
  earliestFullCatalogue = Math.min(
    earliestFullCatalogue,
    result.fullCatalogueHour,
  );
  latestFullCatalogue = Math.max(latestFullCatalogue, result.fullCatalogueHour);
  const reasons = [
    !result.valid && "invalid-state",
    !result.noIdleMoney && "idle-money",
    !result.singleWorkloadEventuallyNonpositive && "single-workload-farming",
    !result.rotationRestoresProfit && "rotation-unprofitable",
    result.firstModuleSuccess > 5 && "module-after-five-successes",
    result.firstRigSuccess > 15 && "rig-after-fifteen-successes",
    (result.expansionHour < 8 || result.expansionHour > 16) &&
      `expansion-at-${result.expansionHour.toFixed(2)}h`,
    (result.fullCatalogueHour < 24 || result.fullCatalogueHour > 72) &&
      `catalogue-at-${result.fullCatalogueHour.toFixed(2)}h`,
  ].filter((reason): reason is string => typeof reason === "string");
  if (reasons.length > 0) {
    failures += 1;
    failedSeeds.push({ seed, reasons });
  }
}

console.log(
  JSON.stringify(
    {
      seeds: LAST_SEED - FIRST_SEED + 1,
      failures,
      expansionHours: { earliest: earliestExpansion, latest: latestExpansion },
      fullCatalogueHours: {
        earliest: earliestFullCatalogue,
        latest: latestFullCatalogue,
      },
      failedSeeds,
    },
    null,
    2,
  ),
);

if (failures > 0) process.exitCode = 1;
