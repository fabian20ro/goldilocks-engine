export interface RandomSample {
  state: number;
  value: number;
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 0x6d2b79f5;
  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? 0x6d2b79f5 : normalized;
}

export function nextRandom(state: number): RandomSample {
  let value = normalizeSeed(state);
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  const next = value >>> 0;
  return { state: next, value: next / 0x1_0000_0000 };
}
