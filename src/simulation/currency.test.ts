import { describe, expect, it } from "vitest";
import { currencyDisplayPrecision, formatCurrencyMagnitude } from "./currency";

const parseDisplayed = (amount: number, precision: 2 | 3) =>
  Number(formatCurrencyMagnitude(amount, precision));

describe("currency equation formatting", () => {
  it("keeps ordinary cent partitions concise", () => {
    const precision = currencyDisplayPrecision([0.01, 0, 0.01, -0.01]);

    expect(precision).toBe(2);
    expect(formatCurrencyMagnitude(0.01, precision)).toBe("0.01");
    expect(formatCurrencyMagnitude(0, precision)).toBe("0.00");
  });

  it("uses mills for every member of a sub-cent equation", () => {
    const precision = currencyDisplayPrecision([0.01, 0.005, 0.005, -0.01]);

    expect(precision).toBe(3);
    expect(formatCurrencyMagnitude(0.01, precision)).toBe("0.010");
    expect(formatCurrencyMagnitude(0.005, precision)).toBe("0.005");
  });

  it("keeps all reachable three-decimal paid/unpaid and gross/net partitions additive", () => {
    for (
      let configuredMills = 0;
      configuredMills <= 100;
      configuredMills += 1
    ) {
      const configured = configuredMills / 1000;
      for (let paidMills = 0; paidMills <= configuredMills; paidMills += 1) {
        const paid = paidMills / 1000;
        const unpaid = (configuredMills - paidMills) / 1000;
        const costPrecision = currencyDisplayPrecision([
          configured,
          paid,
          unpaid,
        ]);
        expect(
          parseDisplayed(paid, costPrecision) +
            parseDisplayed(unpaid, costPrecision),
        ).toBeCloseTo(parseDisplayed(configured, costPrecision), 10);
      }

      for (let grossMills = 0; grossMills <= 200; grossMills += 1) {
        const gross = grossMills / 1000;
        const net = (grossMills - configuredMills) / 1000;
        const netPrecision = currencyDisplayPrecision([gross, configured, net]);
        expect(
          parseDisplayed(gross, netPrecision) -
            parseDisplayed(configured, netPrecision),
        ).toBeCloseTo(Math.sign(net) * parseDisplayed(net, netPrecision), 10);
      }
    }
  });
});
