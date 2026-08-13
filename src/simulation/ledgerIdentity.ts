import type { LedgerEvent } from "./types";

const LEDGER_EVENT_ID = /^evt-(0|[1-9]\d*)-([1-9]\d*)$/;

export interface LedgerEventIdentity {
  tick: number;
  sequence: number;
}

export interface LedgerEventAllocation {
  id: string;
  eventSequence: number;
}

function isNonnegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/** The only ID shape emitted by the deterministic ledger allocator. */
export function formatLedgerEventId(tick: number, sequence: number): string {
  return `evt-${tick}-${sequence}`;
}

/**
 * Ledger IDs are structured engine data, not player-facing prose. The parsed
 * sequence is useful for validating append order after a stale save restore.
 */
export function parseLedgerEventId(value: unknown): LedgerEventIdentity | null {
  if (typeof value !== "string") return null;
  const match = LEDGER_EVENT_ID.exec(value);
  if (!match) return null;
  const tick = Number(match[1]);
  const sequence = Number(match[2]);
  return isNonnegativeSafeInteger(tick) &&
    Number.isSafeInteger(sequence) &&
    sequence > 0
    ? { tick, sequence }
    : null;
}

/**
 * A retained ledger is the contiguous tail of the engine's event sequence.
 * Rebuilding only IDs preserves its events while removing a stale/future ID
 * that could otherwise collide with the next deterministic append.
 */
export function canonicalizeLedgerEventIds(
  ledger: readonly LedgerEvent[],
  eventSequence: number,
): readonly LedgerEvent[] | null {
  if (
    !Number.isSafeInteger(eventSequence) ||
    eventSequence < ledger.length ||
    eventSequence < 0
  )
    return null;
  const firstSequence = eventSequence - ledger.length + 1;
  if (firstSequence < 1) return null;
  const repaired = ledger.map((event, index) => {
    if (typeof event.id !== "string" || !isNonnegativeSafeInteger(event.tick))
      return null;
    return {
      ...event,
      id: formatLedgerEventId(event.tick, firstSequence + index),
    };
  });
  return repaired.some((event) => event === null)
    ? null
    : (repaired as readonly LedgerEvent[]);
}

/**
 * Return the first engine event emitted at one simulation tick. A Job
 * settlement appends before later same-tick unlocks or player commands.
 */
export function firstLedgerEventAtTick(
  ledger: readonly LedgerEvent[],
  tick: number,
): LedgerEvent | null {
  let first: LedgerEvent | null = null;
  let firstSequence = Number.POSITIVE_INFINITY;
  for (const event of ledger) {
    const identity = parseLedgerEventId(event.id);
    if (
      identity === null ||
      event.tick !== tick ||
      identity.tick !== tick ||
      identity.sequence >= firstSequence
    )
      continue;
    first = event;
    firstSequence = identity.sequence;
  }
  return first;
}

/**
 * Event sequences are monotonic, but restored data is external input. Scan
 * retained IDs before allocating so even a valid-looking future collision
 * cannot make the next transactional append duplicate an ID.
 */
export function allocateNextLedgerEvent(
  state: Pick<
    SimulationStateForLedgerAllocation,
    "eventSequence" | "tick" | "ledger"
  >,
): LedgerEventAllocation | null {
  if (
    !isNonnegativeSafeInteger(state.tick) ||
    !isNonnegativeSafeInteger(state.eventSequence)
  )
    return null;
  const used = new Set(state.ledger.map((event) => event.id));
  let sequence = state.eventSequence;
  while (sequence < Number.MAX_SAFE_INTEGER) {
    sequence += 1;
    const id = formatLedgerEventId(state.tick, sequence);
    if (!used.has(id)) return { id, eventSequence: sequence };
  }
  return null;
}

interface SimulationStateForLedgerAllocation {
  eventSequence: number;
  tick: number;
  ledger: readonly LedgerEvent[];
}
