import { expect, test, type Page } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function offlineReadySave(maxHours = 4): string {
  const state = createInitialState(57_057);
  return JSON.stringify(
    sealSimulationState({
      ...state,
      career: {
        ...state.career,
        offlinePolicy: {
          ...state.career.offlinePolicy,
          enabled: true,
          maxHours,
          maxElectricityCost: 5,
          maxOperatingCost: 5,
          minReliability: 0.7,
        },
      },
    }),
  );
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
}

test("verifier round 057: a later non-completing offline response cannot erase the preceding Run recap", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: offlineReadySave(0) },
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
    workerPrototype.addEventListener = function bufferCommandResponses(
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
        function releaseTwoCommandResponsesTogether(
          this: Worker,
          event: MessageEvent,
        ) {
          const requestId = (event.data as { requestId?: unknown }).requestId;
          if (typeof requestId !== "number") {
            listener.call(this, event);
            return;
          }
          pending.push(event);
          if (pending.length < 2) return;
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
  await openCareer(page);
  await page.getByLabel("Freelance delivery evening hours").fill("4");

  const disclosure = page
    .locator('summary[aria-label="Show Safe freelance-only automation"]')
    .locator("xpath=..");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  // Queue both valid player actions, then deliver their real Worker responses
  // together in one browser task. The second action is intentionally safe but
  // non-completing (0h limit), so it must not consume the first action's
  // response-bound Career result.
  await page.locator("button").evaluateAll((buttons) => {
    const run = buttons.find(
      (button) => button.textContent?.trim() === "Run scheduled evening",
    ) as HTMLButtonElement | undefined;
    const offline = buttons.find(
      (button) =>
        button.textContent?.trim() === "Apply safe offline policy now",
    ) as HTMLButtonElement | undefined;
    if (!run || !offline) throw new Error("Missing concurrent Career actions");
    run.click();
    offline.click();
  });

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: {
            schedule?: { completedEvenings?: number };
            offlinePolicy?: { lastReport?: { appliedHours?: number } };
          };
        };
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? -1,
        };
      }, SAVE_KEY),
    )
    .toEqual({ completedEvenings: 1, offlineHours: 0 });

  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 1 result");
  await expect(result).toContainText("4.00h used");
  expect(pageErrors).toEqual([]);
});

test("verifier round 057: later durable offline completion recovers a failed preceding Run save", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: offlineReadySave() },
  );
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await openCareer(page);
  await page.getByLabel("Freelance delivery evening hours").fill("4");

  const disclosure = page
    .locator('summary[aria-label="Show Safe freelance-only automation"]')
    .locator("xpath=..");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");

  // Force only the first response's save to fail. The second ordered response
  // contains both commands, so it is the durable acknowledgement boundary for
  // the latest (offline) completion.
  await page.locator("button").evaluateAll((buttons, key) => {
    const prototype = Storage.prototype;
    const original = prototype.setItem;
    let failNextSave = true;
    prototype.setItem = function patchedSetItem(name, value) {
      if (name === key && failNextSave) {
        failNextSave = false;
        throw new DOMException(
          "temporary verifier storage failure",
          "QuotaExceededError",
        );
      }
      return original.call(this, name, value);
    };
    const run = buttons.find(
      (button) => button.textContent?.trim() === "Run scheduled evening",
    ) as HTMLButtonElement | undefined;
    const offline = buttons.find(
      (button) =>
        button.textContent?.trim() === "Apply safe offline policy now",
    ) as HTMLButtonElement | undefined;
    if (!run || !offline) throw new Error("Missing concurrent Career actions");
    run.click();
    offline.click();
  }, SAVE_KEY);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: {
            schedule?: { completedEvenings?: number };
            offlinePolicy?: { lastReport?: { appliedHours?: number } };
          };
        };
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? 0,
        };
      }, SAVE_KEY),
    )
    .toEqual({ completedEvenings: 2, offlineHours: 4 });

  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 2 result");
  await expect(result).toContainText("4.00h used");
  expect(pageErrors).toEqual([]);
});
