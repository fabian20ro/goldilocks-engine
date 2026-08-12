import { expect, test, type Page } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function safeOfflineSave(maxHours: number): string {
  const state = createInitialState(59_059);
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

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
}

async function openDisclosure(page: Page, title: string): Promise<void> {
  const summary = page.locator(`summary[aria-label="Show ${title}"]`);
  const disclosure = summary.locator("xpath=..");
  if (!(await disclosure.evaluate((element) => element.hasAttribute("open"))))
    await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
}

async function bufferCommandReplies(page: Page, count: number): Promise<void> {
  await page.addInitScript((replyCount) => {
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
    workerPrototype.addEventListener = function interceptReplies(
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
        function releaseOneOrderedBatch(this: Worker, event: MessageEvent) {
          const requestId = (event.data as { requestId?: unknown }).requestId;
          if (typeof requestId !== "number") {
            listener.call(this, event);
            return;
          }
          pending.push(event);
          if (pending.length !== replyCount) return;
          for (const response of pending.splice(0))
            listener.call(this, response);
        },
        options,
      );
    };
  }, count);
}

async function savedCareer(page: Page): Promise<{
  completedEvenings: number;
  maxHours: number;
  offlineHours: number;
}> {
  return page.evaluate((key) => {
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
      completedEvenings: saved.career?.schedule?.completedEvenings ?? -1,
      maxHours: saved.career?.offlinePolicy?.maxHours ?? -1,
      offlineHours: saved.career?.offlinePolicy?.lastReport?.appliedHours ?? -1,
    };
  }, SAVE_KEY);
}

test("verifier round 059: four batched responses retain the latest completed recap across a later zero-hour reply", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 393, height: 742 });
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: safeOfflineSave(4) },
  );
  await bufferCommandReplies(page, 4);
  await page.goto("/");
  await waitForSave(page);
  await openCareer(page);
  await page.getByLabel("Freelance delivery evening hours").fill("4");
  await openDisclosure(page, "Safe freelance-only automation");

  // Four real Worker replies are released in one browser task: scheduled Run,
  // completing offline apply, policy save, then zero-hour apply. The final
  // non-completion may not erase either independently claimed completion.
  await page.getByRole("button", { name: "Run scheduled evening" }).click();
  await page
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();
  await page.getByLabel("Offline maximum hours").fill("0");
  await page.getByRole("button", { name: "Save safe offline policy" }).click();
  await page
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();

  await expect
    .poll(() => savedCareer(page))
    .toEqual({
      completedEvenings: 2,
      maxHours: 0,
      offlineHours: 0,
    });
  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 2 result");
  await expect(result).toContainText("4.00h used");
  expect(errors).toEqual([]);
});

test("verifier round 059: direct offline completion waits for durable recovery before displaying once", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript((key) => {
    const appWindow = window as Window & {
      __round059StorageFailure?: { failWrites: boolean };
    };
    const originalSetItem = Storage.prototype.setItem;
    appWindow.__round059StorageFailure = { failWrites: false };
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, candidateKey: string, value: string): void {
        if (
          candidateKey === key &&
          appWindow.__round059StorageFailure?.failWrites
        )
          throw new DOMException(
            "storage quota exhausted",
            "QuotaExceededError",
          );
        originalSetItem.call(this, candidateKey, value);
      },
    });
  }, SAVE_KEY);
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: safeOfflineSave(4) },
  );
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await waitForSave(page);
  await openCareer(page);
  await openDisclosure(page, "Safe freelance-only automation");
  await page.evaluate(() => {
    const appWindow = window as Window & {
      __round059StorageFailure?: { failWrites: boolean };
    };
    if (!appWindow.__round059StorageFailure)
      throw new Error("Expected storage-failure fixture");
    appWindow.__round059StorageFailure.failWrites = true;
  });
  await page
    .getByRole("button", { name: "Apply safe offline policy now" })
    .click();

  await expect(page.getByText(/Offline report: 4\.00h applied/)).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Latest evening result" }),
  ).toHaveCount(0);
  await expect
    .poll(() => savedCareer(page))
    .toEqual({
      completedEvenings: 0,
      maxHours: 4,
      offlineHours: -1,
    });

  await page.evaluate(() => {
    const appWindow = window as Window & {
      __round059StorageFailure?: { failWrites: boolean };
    };
    if (!appWindow.__round059StorageFailure)
      throw new Error("Expected storage-recovery fixture");
    appWindow.__round059StorageFailure.failWrites = false;
  });
  await expect
    .poll(() => savedCareer(page).then((saved) => saved.completedEvenings))
    .toBe(1);
  const result = page.getByRole("status", { name: "Latest evening result" });
  await expect(result).toContainText("Night 1 result");
  await expect(result).toContainText("4.00h used");
  await page.waitForTimeout(1_100);
  await expect(
    page.getByRole("status", { name: "Latest evening result" }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});
