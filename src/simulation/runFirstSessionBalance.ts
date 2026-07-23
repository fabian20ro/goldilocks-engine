import { validateFirstSessionEconomy } from "./firstSessionBalance";

const firstSeed = -20;
const lastSeed = 20;
const failures: Array<{ seed: number; reasons: string[] }> = [];

for (let seed = firstSeed; seed <= lastSeed; seed += 1) {
  const result = validateFirstSessionEconomy(seed);
  const reasons = [
    result.safeRoute.reliability < 0.9 && "safe-route-not-reliable",
    result.safeRoute.expectedNet <= 0 && "safe-route-not-positive",
    result.riskyRoute.reliability >= result.safeRoute.reliability &&
      "risky-route-not-distinct",
    result.riskyRoute.expectedNet <= 0 && "risky-route-not-positive",
    !result.safeRouteReachedModule && "safe-route-misses-first-module",
    !result.riskyRouteReachedModule && "risky-route-misses-first-module",
    result.chatQueueTen.finalQuote >= result.chatQueueTen.firstQuote &&
      "chat-queue-does-not-saturate",
    result.batchQueueTen.finalQuote >= result.batchQueueTen.firstQuote &&
      "batch-queue-does-not-saturate",
    result.chatGuidedFour.expectedNet <= result.chatQueueTen.expectedNet &&
      "chat-queue-ten-dominant",
    result.batchGuidedFive.expectedNet <= result.batchQueueTen.expectedNet &&
      "batch-queue-ten-dominant",
    !result.recoveryRaisesQuote && "recovery-not-visible",
    !result.noIdleMoney && "idle-money",
    !result.valid && "invalid-state",
  ].filter((reason): reason is string => typeof reason === "string");
  if (reasons.length) failures.push({ seed, reasons });
}

console.log(
  JSON.stringify(
    {
      seeds: lastSeed - firstSeed + 1,
      failures: failures.length,
      failedSeeds: failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exitCode = 1;
