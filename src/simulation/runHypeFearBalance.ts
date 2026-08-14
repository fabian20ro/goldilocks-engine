import {
  runHypeFearScenario,
  validateHypeFearBalance,
} from "./hypeFearBalance";

const FIRST_SEED = 1;
const LAST_SEED = 121;
const failures = [] as Array<{
  seed: number;
  result: ReturnType<typeof runHypeFearScenario>;
}>;
for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
  const result = runHypeFearScenario(seed);
  if (!validateHypeFearBalance(seed)) failures.push({ seed, result });
}
const valid = failures.length === 0;
console.log(
  JSON.stringify(
    {
      seeds: LAST_SEED - FIRST_SEED + 1,
      failures: failures.length,
      valid,
      firstFailure: failures[0] ?? null,
    },
    null,
    2,
  ),
);
if (!valid) process.exitCode = 1;
