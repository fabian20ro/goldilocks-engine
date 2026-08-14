import {
  researchCatalogBalance,
  runResearchScenario,
  validateResearchBalance,
} from "./researchBalance";

const FIRST_SEED = 1;
const LAST_SEED = 121;
const failures = [] as Array<{
  seed: number;
  result: ReturnType<typeof runResearchScenario>;
}>;
const outcomeKinds = new Set<string>();
for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
  const result = runResearchScenario(seed);
  if (result.outcomeKind) outcomeKinds.add(result.outcomeKind);
  if (!validateResearchBalance(seed)) failures.push({ seed, result });
}
const valid =
  researchCatalogBalance() && failures.length === 0 && outcomeKinds.size >= 2;
console.log(
  JSON.stringify(
    {
      seeds: LAST_SEED - FIRST_SEED + 1,
      failures: failures.length,
      outcomeKinds: [...outcomeKinds],
      catalog: researchCatalogBalance(),
      valid,
    },
    null,
    2,
  ),
);
if (!valid) process.exitCode = 1;
