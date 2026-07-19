import { validateEvaluationReplay } from "./evaluationBalance";

// Positive seeds avoid duplicate normalized seed paths and make the declared
// replay sweep easy to reproduce from the UI's next-scenario control.
const FIRST_SEED = 1;
const LAST_SEED = 121;
const failures: Array<{ seed: number; reasons: readonly string[] }> = [];

for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
  const result = validateEvaluationReplay(seed);
  const reasons = [
    !result.allEndingsReachable && "unreachable-ending",
    !result.noEndingUnavoidable && "unavoidable-ending",
    !result.noUniversallyDominantRoute && "dominant-response",
    !result.materiallyDifferentResponses && "same-response-shape",
    !result.valid && "invalid-or-unretained-causal-evidence",
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
