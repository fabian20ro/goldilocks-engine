import { describe, expect, it } from "vitest";
import { applyCommand, createInitialState, isStateValid, tick } from "./engine";

describe("verifier round 007 malformed numeric inputs", () => {
  it("preserves state invariants when non-finite numeric inputs arrive", () => {
    const initial = createInitialState(7);
    const cases = [
      ["tick seconds", tick(initial, Number.NaN)],
      [
        "compute allocation",
        applyCommand(initial, {
          type: "SET_COMPUTE_ALLOCATION",
          percent: Number.NaN,
        }),
      ],
      [
        "memory reserve",
        applyCommand(initial, {
          type: "SET_MEMORY_RESERVE",
          percent: Number.NaN,
        }),
      ],
      [
        "queue count",
        applyCommand(initial, {
          type: "QUEUE_JOBS",
          count: Number.NaN,
        }),
      ],
    ] as const;

    expect(
      cases.filter(([, state]) => !isStateValid(state)).map(([name]) => name),
    ).toEqual([]);
  });
});
