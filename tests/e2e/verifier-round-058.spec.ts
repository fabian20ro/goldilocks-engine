import { expect, test } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function offlineReadySave(): string {
  const state = createInitialState(58_058);
  return JSON.stringify(
    sealSimulationState({
      ...state,
      career: {
        ...state.career,
        offlinePolicy: {
          ...state.career.offlinePolicy,
          enabled: true,
          maxHours: 4,
          maxElectricityCost: 5,
          maxOperatingCost: 5,
          minReliability: 0.7,
        },
      },
    }),
  );
}

test("verifier round 058: later policy and zero-hour responses cannot hide an earlier completed offline recap", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: offlineReadySave() },
  );
  await page.addInitScript(() => {
    type WorkerMessageListener = (this: Worker, event: MessageEvent) => void;
    type InterceptableWorkerPrototype = {
      addEventListener: (
        type: string,
        listener: WorkerMessageListener | null,
        options?: boolean | AddEventListenerOptions,
      ) => void;
    };
    const workerPrototype = Worker.prototype as InterceptableWorkerPrototype;
    const addEventListener = workerPrototype.addEventListener;
    workerPrototype.addEventListener = function bufferThreeCommandResponses(
      this: Worker,
      type: string,
      listener: WorkerMessageListener | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type !== "message" || listener === null)
        return addEventListener.call(this, type, listener, options);

      const pending: MessageEvent[] = [];
      return addEventListener.call(
        this,
        type,
        function releaseThreeCommandResponsesTogether(
          this: Worker,
          event: MessageEvent,
        ) {
          const requestId = (event.data as { requestId?: unknown }).requestId;
          if (typeof requestId !== "number") {
            listener.call(this, event);
            return;
          }
          pending.push(event);
          if (pending.length < 3) return;
          for (const response of pending.splice(0))
            listener.call(this, response);
        },
        options,
      );
    };
  });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();

  const disclosure = page
    .locator('summary[aria-label="Show Safe freelance-only automation"]')
    .locator("xpath=..");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  await page
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();
  await page.getByLabel("Offline maximum hours").fill("0");
  await page.getByRole("button", { name: "Save safe offline policy" }).click();
  await page
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: {
            schedule?: { completedEvenings?: number };
            offlinePolicy?: {
              maxHours?: number;
              lastReport?: { appliedHours?: number };
            };
          };
        };
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          maxHours: saved.career?.offlinePolicy?.maxHours ?? -1,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? -1,
        };
      }, SAVE_KEY),
    )
    .toEqual({ completedEvenings: 1, maxHours: 0, offlineHours: 0 });

  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 1 result");
  await expect(result).toContainText("4.00h used");
  expect(pageErrors).toEqual([]);
});
