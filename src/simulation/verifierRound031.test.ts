import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  isStateValid,
  restoreSimulationState,
  tick,
} from "./engine";
import type { SimulationCommand } from "./types";
import { reduceWorkerRequest } from "./workerProtocol";

describe("verifier round 031: evaluation evidence boundaries", () => {
  it("keeps public preview, private payment failure, and funded retry distinct", () => {
    let state = createInitialState(31_030);
    state = applyCommand(state, { type: "RUN_PUBLIC_EVALUATION" });
    const afterPublic = state.career.evaluation;

    expect(afterPublic.publicScore).toEqual(expect.any(Number));
    expect(afterPublic.publicEvaluations).toBe(1);
    expect(afterPublic.privateAssessment).toBe("not-run");
    expect(afterPublic.leakageRisk).toBeGreaterThan(0);

    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    expect(state.career.evaluation).toEqual(afterPublic);

    state = applyCommand(state, { type: "WITHDRAW_SAVINGS", amount: 1 });
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    const afterPrivate = state.career.evaluation;

    expect(afterPrivate).toMatchObject({
      coverage: expect.any(Number),
      evaluationSpend: 0.75,
      privateEvaluations: 1,
    });
    expect(afterPrivate.coverage).toBeGreaterThan(0);
    expect(afterPrivate.privateAssessment).not.toBe("not-run");
    expect(afterPrivate.leakageRisk).toBeLessThan(afterPublic.leakageRisk);

    const beforeUnaffordableRetry = state;
    state = applyCommand(state, { type: "RUN_PRIVATE_EVALUATION" });
    expect(state.career.evaluation).toEqual(
      beforeUnaffordableRetry.career.evaluation,
    );
    expect(isStateValid(state)).toBe(true);
  });

  it("records an ignored tutorial warning in the append-only causal ledger", () => {
    let state = createInitialState(31_031);
    for (let index = 0; index < 3; index += 1) {
      state = applyCommand(state, {
        type: "SET_QUANTIZATION",
        profile: index % 2 === 0 ? "q8" : "q4",
      });
    }

    expect(state.career.evaluation.warnings.tutorial).toBe(1);
    const ledgerLengthBeforeIgnoring = state.ledger.length;
    state = applyCommand(state, { type: "SET_QUANTIZATION", profile: "q4" });

    expect(state.career.evaluation.ignoredWarnings).toBe(1);
    expect(
      state.ledger
        .slice(ledgerLengthBeforeIgnoring)
        .some((event) =>
          /ignored.*tutorial|tutorial.*ignored/i.test(event.message),
        ),
    ).toBe(true);
  });

  it("recovers an impossible current private-evaluation record instead of resealing it", () => {
    const initial = createInitialState(31_032);
    const malformed = JSON.parse(JSON.stringify(initial)) as Record<
      string,
      unknown
    >;
    const career = malformed.career as Record<string, unknown>;
    career.evaluation = {
      ...(career.evaluation as Record<string, unknown>),
      privateAssessment: "credible",
      coverage: 0,
      privateEvaluations: 0,
      evaluationSpend: 0,
    };

    const restored = restoreSimulationState(malformed, 31_032);

    expect(restored.career.evaluation).toEqual(initial.career.evaluation);
    expect(isStateValid(restored)).toBe(true);
  });

  // Keep the complete 17-seed × 120-step corpus: hosted coverage workers can
  // exceed Vitest's default five-second budget without changing its result.
  it("keeps mixed evaluation, failure, replay, and timing commands deterministic", () => {
    const commands: readonly SimulationCommand[] = [
      { type: "RUN_PUBLIC_EVALUATION" },
      { type: "RUN_PRIVATE_EVALUATION" },
      { type: "SET_QUANTIZATION", profile: "q4" },
      { type: "SET_QUANTIZATION", profile: "q8" },
      { type: "SET_EVENING_ALLOCATION", route: "freelance", hours: 4 },
      { type: "SET_EVENING_ALLOCATION", route: "competition", hours: 4 },
      { type: "SET_EVENING_ALLOCATION", route: "product", hours: 4 },
      { type: "SET_EVENING_ALLOCATION", route: "maintenance", hours: 4 },
      { type: "RUN_EVENING" },
      { type: "SUBMIT_COMPETITION" },
      { type: "RELEASE_PRODUCT" },
      { type: "CONCLUDE_INDEPENDENT_RUN" },
      { type: "RESET", seed: 31_033 },
    ];

    for (let seed = 1; seed <= 17; seed += 1) {
      const play = () => {
        let state = createInitialState(seed);
        for (let step = 0; step < 120; step += 1) {
          state = applyCommand(
            state,
            commands[(seed + step * 7) % commands.length]!,
          );
          state = tick(state, [0, 0.5, 1, 17, 60][(seed + step) % 5]!);
          expect(isStateValid(state)).toBe(true);
        }
        return state;
      };

      expect(play()).toEqual(play());
    }
  }, 20_000);

  it("freezes an ending within a Worker batch until an explicit reset", () => {
    const switches: SimulationCommand[] = Array.from(
      { length: 8 },
      (_, index) => ({
        type: "SET_QUANTIZATION" as const,
        profile: index % 2 === 0 ? "q8" : "q4",
      }),
    );
    const closed = reduceWorkerRequest(createInitialState(31_034), {
      type: "COMMAND_BATCH",
      commands: [...switches, { type: "RUN_PUBLIC_EVALUATION" }],
    });

    expect(closed.career.runEnding?.id).toBe("tutorial-loop");
    expect(closed.career.evaluation.publicEvaluations).toBe(0);

    const replayed = reduceWorkerRequest(closed, {
      type: "COMMAND_BATCH",
      commands: [
        { type: "RUN_PUBLIC_EVALUATION" },
        { type: "RESET", seed: 31_035 },
        { type: "RUN_PUBLIC_EVALUATION" },
      ],
    });

    expect(replayed.career.runEnding).toBeNull();
    expect(replayed.seed).toBe(31_035);
    expect(replayed.career.evaluation.publicEvaluations).toBe(1);
    expect(replayed.meta.completedEndingIds).toEqual(["tutorial-loop"]);
    expect(isStateValid(replayed)).toBe(true);
  });
});
