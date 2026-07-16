import { describe, expect, it } from "vitest";
import { workloads } from "./catalog";
import {
  applyCommand,
  calculateMetrics,
  createInitialState,
  estimateWorkloadOffer,
  getWorkloadQuote,
  isStateValid,
  restoreSimulationState,
  sealSimulationState,
  tick,
} from "./engine";

function withoutProcessModules(seed: number) {
  let state = createInitialState(seed);
  for (const slotId of ["prepare", "runtime", "verify"])
    state = applyCommand(state, { type: "REMOVE_MODULE", slotId });
  return state;
}

function settleTasks(
  state: ReturnType<typeof createInitialState>,
  count: number,
) {
  let next = applyCommand(state, { type: "QUEUE_JOBS", count });
  for (let minute = 0; minute < 50 && next.jobs.queued > 0; minute += 1)
    next = tick(next, 60);
  expect(next.jobs.queued).toBe(0);
  return next;
}

const settleOneTask = (state: ReturnType<typeof createInitialState>) =>
  settleTasks(state, 1);

describe("verifier round 017 task-economy boundaries", () => {
  it("prices every guaranteed-failure workload at zero expected gross", () => {
    const noModel = withoutProcessModules(1701);

    for (const workload of workloads) {
      const metrics = calculateMetrics({
        ...noModel,
        workloadId: workload.id,
      });
      const offer = estimateWorkloadOffer(
        metrics,
        getWorkloadQuote(noModel, workload.id),
      );

      expect(metrics.orderWarnings).toContain("no model stage");
      expect(offer.guaranteedFailure).toBe(true);
      expect(offer.expectedGrossPayout).toBe(0);
      expect(offer.expectedNet).toBe(-metrics.operatingCost);
    }

    const memoryFailureMetrics = calculateMetrics({
      ...createInitialState(1702),
      workloadId: "long-document",
    });
    const memoryFailureOffer = estimateWorkloadOffer(
      memoryFailureMetrics,
      getWorkloadQuote(createInitialState(1702), "long-document"),
    );
    expect(memoryFailureMetrics.memoryPressure).toBeGreaterThan(1);
    expect(memoryFailureOffer).toEqual({
      guaranteedFailure: true,
      expectedGrossPayout: 0,
      expectedNet: -memoryFailureMetrics.operatingCost,
    });
  });

  it.each([
    { label: "zero cash", money: 0 },
    { label: "partial cash", money: 0.005 },
    { label: "exact cash", money: 0.01 },
    { label: "ample cash", money: 1 },
  ])(
    "reconciles configured, paid, and unpaid cost with $label",
    ({ money }) => {
      const noModel = withoutProcessModules(1710);
      const configuredCost = calculateMetrics(noModel).operatingCost;
      expect(configuredCost).toBe(0.01);

      const initial = sealSimulationState({
        ...noModel,
        resources: { ...noModel.resources, money },
      });
      expect(isStateValid(initial)).toBe(true);

      const settled = settleOneTask(initial);
      const paidCost = Math.min(configuredCost, money);
      const unpaidCost = configuredCost - paidCost;
      const netChange = paidCost === 0 ? 0 : -paidCost;

      expect(settled.lastSettlement).toMatchObject({
        completed: 0,
        failed: 1,
        grossPayout: 0,
        operatingCost: configuredCost,
        netChange,
      });
      expect(settled.jobs.operatingCostsPaid).toBe(paidCost);
      expect(settled.resources.money).toBe(money - paidCost);
      expect(settled.ledger.at(-1)?.message).toContain(
        `configured actual cost was $${configuredCost.toFixed(2)}`,
      );
      if (unpaidCost > 0)
        expect(settled.ledger.at(-1)?.message).toMatch(/paid and .*unpaid/i);
      else expect(settled.ledger.at(-1)?.message).toMatch(/paid in full/i);
      expect(isStateValid(settled)).toBe(true);

      const restored = restoreSimulationState(
        JSON.parse(JSON.stringify(settled)) as unknown,
      );
      expect(restored.lastSettlement).toEqual(settled.lastSettlement);
      expect(restored.jobs.operatingCostsPaid).toBe(
        settled.jobs.operatingCostsPaid,
      );
      expect(restored.resources.money).toBe(settled.resources.money);
    },
  );

  it("keeps the displayed paid and unpaid partition equal to configured cost", () => {
    let partialCash = settleOneTask(createInitialState(7));
    expect(partialCash.resources.money).toBe(1.335);
    for (const slotId of ["prepare", "runtime", "verify"])
      partialCash = applyCommand(partialCash, {
        type: "REMOVE_MODULE",
        slotId,
      });
    for (const count of [50, 50, 33])
      partialCash = settleTasks(partialCash, count);
    expect(partialCash.resources.money).toBe(0.005);

    const settled = settleOneTask(partialCash);
    const message = settled.ledger.at(-1)?.message ?? "";
    const amounts = message.match(
      /configured actual cost was \$(\d+\.\d+).*?\$(\d+\.\d+) was paid and \$(\d+\.\d+) remains unpaid/,
    );

    expect(amounts).not.toBeNull();
    const [, configured = "0", paid = "0", unpaid = "0"] = amounts ?? [];
    expect(Number(paid) + Number(unpaid)).toBe(Number(configured));
  });
});
