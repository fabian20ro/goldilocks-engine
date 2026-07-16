import { validateUpgradeEconomy } from "./upgradeBalance";

let failures = 0;
let worstModule = 0;
let worstRig = 0;
let maxAttempts = 0;
for (let seed = -10_000; seed <= 10_000; seed += 1) {
  const result = validateUpgradeEconomy(seed);
  worstModule = Math.max(worstModule, result.moduleAffordableAtSuccess);
  worstRig = Math.max(worstRig, result.rigAffordableAtSuccess);
  maxAttempts = Math.max(maxAttempts, result.attempts);
  if (
    !result.valid ||
    !result.purchaseDeductedOnce ||
    result.moduleAffordableAtSuccess > 5 ||
    result.rigAffordableAtSuccess > 15
  )
    failures += 1;
}

console.log(
  JSON.stringify(
    {
      seeds: 20_001,
      failures,
      worstModuleAffordableAtSuccessfulJob: worstModule,
      worstRigAffordableAtSuccessfulJob: worstRig,
      maximumAttemptsToFifteenSuccesses: maxAttempts,
    },
    null,
    2,
  ),
);

if (failures > 0) process.exitCode = 1;
