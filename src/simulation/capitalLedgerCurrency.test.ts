import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";
import type { SimulationCommand } from "./types";

function withMoney(seed: number, money: number) {
  const state = createInitialState(seed);
  return { ...state, resources: { ...state.resources, money } };
}

describe("capital and exit ledger money", () => {
  it.each([
    [
      "module",
      { type: "BUY_MODULE", moduleId: "precision-cleaner" },
      4,
      "Precision Cleaner purchased for $4.000",
    ],
    [
      "hardware",
      { type: "BUY_HARDWARE", hardwareId: "used-gpu" },
      14,
      "Used 12 GB GPU purchased for $14.000",
    ],
    [
      "expansion",
      { type: "BUY_EXPANSION", expansionId: "workstation-expansion-i" },
      45,
      "Workstation Expansion I purchased for $45.000",
    ],
  ] as const)(
    "keeps successful %s purchase accounting at fixed three decimals",
    (_, command, money, expected) => {
      const state = applyCommand(
        withMoney(70_001, money),
        command as SimulationCommand,
      );
      expect(
        state.ledger.find((event) => event.message.includes("purchased for"))
          ?.message,
      ).toContain(expected);
    },
  );

  it.each([
    [
      "module",
      { type: "BUY_MODULE", moduleId: "precision-cleaner" },
      3,
      "Precision Cleaner costs $4.000; $1.000 more is required.",
    ],
    [
      "hardware",
      { type: "BUY_HARDWARE", hardwareId: "used-gpu" },
      13,
      "Used 12 GB GPU costs $14.000; $1.000 more is required.",
    ],
    [
      "expansion",
      { type: "BUY_EXPANSION", expansionId: "workstation-expansion-i" },
      44,
      "Workstation Expansion I costs $45.000; $1.000 more is required.",
    ],
  ] as const)(
    "keeps rejected %s purchase accounting at fixed three decimals",
    (_, command, money, expected) => {
      const state = applyCommand(
        withMoney(70_002, money),
        command as SimulationCommand,
      );
      expect(state.ledger.at(-1)?.message).toContain(expected);
    },
  );

  it("keeps the Bedroom exit milestone's savings record at fixed three decimals", () => {
    const initial = createInitialState(70_003);
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
        product: { ...initial.career.product, released: true },
        unlockedModelTierIds: ["lantern-3b", "harbor-7b", "kiln-13b"],
      },
    });

    const state = applyCommand(ready, {
      type: "SET_QUANTIZATION",
      profile: "q8",
    });

    expect(
      state.ledger.find((event) =>
        event.message.startsWith("Bedroom Developer exit reached:"),
      )?.message,
    ).toContain("Bedroom Developer exit reached: $24.000 durable savings");
  });

  it("accepts a legacy cents purchase record only for stale-save recovery", () => {
    let state = createInitialState(70_004);
    state = applyCommand(state, { type: "QUEUE_JOBS", count: 1 });
    state = tick(state, 60);
    state = applyCommand(
      { ...state, resources: { ...state.resources, money: 4 } },
      { type: "BUY_MODULE", moduleId: "precision-cleaner" },
    );
    const legacy = {
      ...state,
      lastUpgradeNotice: null,
      ledger: state.ledger.map((event) => ({
        ...event,
        message: event.message.replace(
          "purchased for $4.000",
          "purchased for $4.00",
        ),
      })),
    };

    const restored = restoreSimulationState(legacy, 70_004);

    expect(restored.firstSession).toMatchObject({
      step: "buy-and-install",
      purchasedModuleId: "precision-cleaner",
    });
    expect(isStateValid(restored)).toBe(true);
  });
});
