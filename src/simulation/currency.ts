export type CurrencyDisplayPrecision = 2 | 3;

const CENT_EPSILON = 1e-9;

export function currencyDisplayPrecision(
  amounts: readonly number[],
): CurrencyDisplayPrecision {
  return amounts.some((amount) => {
    const roundedToCents = Math.round(amount * 100) / 100;
    return Math.abs(amount - roundedToCents) > CENT_EPSILON;
  })
    ? 3
    : 2;
}

export function formatCurrencyMagnitude(
  amount: number,
  precision: CurrencyDisplayPrecision,
): string {
  const normalized = Math.abs(amount) < 0.0005 ? 0 : Math.abs(amount);
  return normalized.toFixed(precision);
}

/** Shared compact money text; detailed accounting retains its explicit fields. */
export function formatCurrency(
  amount: number,
  precision: CurrencyDisplayPrecision,
): string {
  const normalized = Math.abs(amount) < 0.0005 ? 0 : amount;
  return `${normalized < 0 ? "-$" : "$"}${formatCurrencyMagnitude(
    normalized,
    precision,
  )}`;
}

/**
 * Shared compact presentation policy: use cents until a displayed value or
 * its related accounting equation needs mills. Callers that show a single
 * summary can omit `relatedAmounts`; settlements and projections pass their
 * complete equation so every displayed term remains legible together.
 */
export function formatCompactCurrency(
  amount: number,
  relatedAmounts: readonly number[] = [],
): string {
  return formatCurrency(
    amount,
    currencyDisplayPrecision([amount, ...relatedAmounts]),
  );
}

/** Exact Details, Inspect, and ledger-adjacent accounting remains mill-based. */
export function formatExactCurrency(amount: number): string {
  return formatCurrency(amount, 3);
}
