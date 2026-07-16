import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";

function settleOne(state: ReturnType<typeof createInitialState>) {
  let next = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
  for (let minute = 0; minute < 60 && next.jobs.queued > 0; minute += 1)
    next = tick(next, 60);
  expect(next.jobs.queued).toBe(0);
  return next;
}

function noModelState(seed: number, money: number) {
  let state = createInitialState(seed);
  for (const slotId of ["prepare", "runtime", "verify"])
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId });
  return sealSimulationState({
    ...state,
    resources: { ...state.resources, money },
  });
}

const decimalPlaces = (value: string) => value.split(".")[1]?.length ?? 0;

describe("verifier round 018 settlement equations", () => {
  it("keeps every reachable mill-level paid/unpaid partition additive", () => {
    for (let cashMills = 0; cashMills <= 15; cashMills += 1) {
      const settled = settleOne(
        noModelState(1800 + cashMills, cashMills / 1000),
      );
      const message = settled.ledger.at(-1)?.message ?? "";
      const amounts = message.match(
        /configured actual cost was \$(\d+\.\d+).*?\$(\d+\.\d+) was paid and \$(\d+\.\d+) remains unpaid/,
      );

      if (cashMills < 10) {
        expect(amounts, `cash mills ${cashMills}: ${message}`).not.toBeNull();
        const [, configured = "", paid = "", unpaid = ""] = amounts ?? [];
        expect(
          new Set([configured, paid, unpaid].map(decimalPlaces)).size,
        ).toBe(1);
        const displayedUnits = (value: string) =>
          Number.parseInt(value.replace(".", ""), 10);
        expect(displayedUnits(paid) + displayedUnits(unpaid)).toBe(
          displayedUnits(configured),
        );
        expect(Number(configured)).toBe(settled.lastSettlement?.operatingCost);
      } else {
        expect(message).toMatch(/configured cost was paid in full/i);
      }

      const restored = restoreSimulationState(
        JSON.parse(JSON.stringify(settled)) as unknown,
      );
      expect(restored.lastSettlement).toEqual(settled.lastSettlement);
      expect(restored.ledger.at(-1)?.message).toBe(message);
    }
  });

  it("keeps a successful sub-cent gross/cost/net equation additive", () => {
    const settled = settleOne(createInitialState(7));
    expect(settled.lastSettlement?.completed).toBe(1);

    const message = settled.ledger.at(-1)?.message ?? "";
    const amounts = message.match(
      /completed; \$(\d+\.\d+) gross.*?− \$(\d+\.\d+) configured actual cost = ([+−])\$(\d+\.\d+) net/,
    );
    expect(amounts, message).not.toBeNull();
    const [, gross = "", cost = "", sign = "+", magnitude = ""] = amounts ?? [];
    expect(new Set([gross, cost, magnitude].map(decimalPlaces)).size).toBe(1);
    const displayedNet = (sign === "−" ? -1 : 1) * Number(magnitude);
    expect(Number(gross) - Number(cost)).toBeCloseTo(displayedNet, 10);
    expect(Number(gross)).toBe(settled.lastSettlement?.grossPayout);
    expect(Number(cost)).toBe(settled.lastSettlement?.operatingCost);
  });
});
