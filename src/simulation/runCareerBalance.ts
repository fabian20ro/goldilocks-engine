import { validateCareerEconomy } from "./careerBalance";

const FIRST_SEED = -50;
const LAST_SEED = 50;
const failures: Array<{ seed: number; reasons: readonly string[] }> = [];

for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
  const result = validateCareerEconomy(seed);
  const reasons = [
    !result.valid && "route-viability-or-accounting",
    !result.noWaitOnlyExploit && "wait-only-exploit",
    !result.noDominantRoute && "dominant-route",
    !result.opportunityCostBounded && "unbounded-evening-allocation",
  ].filter((reason): reason is string => typeof reason === "string");
  if (reasons.length) failures.push({ seed, reasons });
}

console.log(
  JSON.stringify(
    {
      seeds: LAST_SEED - FIRST_SEED + 1,
      failures: failures.length,
      failedSeeds: failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exitCode = 1;
