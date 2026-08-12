import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  sealSimulationState,
} from "./engine";
import type { SimulationCommand } from "./types";

function withMoney(seed: number, money: number) {
  const state = createInitialState(seed);
  return { ...state, resources: { ...state.resources, money } };
}

describe("verifier round 069: exact capital-accounting ledger text", () => {
  it.each([
    [
      "module",
      {
        type: "BUY_MODULE",
        moduleId: "precision-cleaner",
      } satisfies SimulationCommand,
      4,
      "Precision Cleaner purchased for $4.000 and is now owned.",
    ],
    [
      "hardware",
      {
        type: "BUY_HARDWARE",
        hardwareId: "used-gpu",
      } satisfies SimulationCommand,
      14,
      "Used 12 GB GPU purchased for $14.000 and is now owned.",
    ],
    [
      "expansion",
      {
        type: "BUY_EXPANSION",
        expansionId: "workstation-expansion-i",
      } satisfies SimulationCommand,
      45,
      "Workstation Expansion I purchased for $45.000 and is now owned.",
    ],
  ])(
    "writes an exact successful %s purchase record",
    (_, command, money, text) => {
      const state = applyCommand(withMoney(69_001, money), command);
      const purchase = state.ledger.find((event) =>
        /purchased for \$/.test(event.message),
      );
      expect(purchase?.message).toContain(text);
    },
  );

  it.each([
    [
      "module",
      {
        type: "BUY_MODULE",
        moduleId: "precision-cleaner",
      } satisfies SimulationCommand,
      3,
      "Precision Cleaner costs $4.000; $1.000 more is required.",
    ],
    [
      "hardware",
      {
        type: "BUY_HARDWARE",
        hardwareId: "used-gpu",
      } satisfies SimulationCommand,
      13,
      "Used 12 GB GPU costs $14.000; $1.000 more is required.",
    ],
    [
      "expansion",
      {
        type: "BUY_EXPANSION",
        expansionId: "workstation-expansion-i",
      } satisfies SimulationCommand,
      44,
      "Workstation Expansion I costs $45.000; $1.000 more is required.",
    ],
  ])(
    "writes an exact rejected %s purchase record",
    (_, command, money, text) => {
      const state = applyCommand(withMoney(69_002, money), command);
      expect(state.ledger.at(-1)?.message).toContain(text);
    },
  );

  it("keeps the completed Bedroom exit ledger milestone exact", () => {
    const initial = createInitialState(69_003);
    const ready = sealSimulationState({
      ...initial,
      career: {
        ...initial.career,
        savings: 24,
        competition: {
          ...initial.career.competition,
          submissions: 1,
          prizeClaimed: true,
        },
        product: {
          ...initial.career.product,
          released: true,
        },
        unlockedModelTierIds: ["lantern-3b", "harbor-7b", "kiln-13b"],
      },
    });
    const state = applyCommand(ready, {
      type: "SET_QUANTIZATION",
      profile: "q8",
    });
    const exit = state.ledger.find((event) =>
      event.message.startsWith("Bedroom Developer exit reached:"),
    );
    expect(exit?.message).toContain(
      "Bedroom Developer exit reached: $24.000 durable savings",
    );
  });
});
