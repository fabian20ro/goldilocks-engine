import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";
import { chooseSimulationSpeed, resealSavedRecord } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSavedState(page: Page): Promise<void> {
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

async function openCareerDisclosure(page: Page, title: string): Promise<void> {
  const summary = page.locator(`summary[aria-label="Show ${title}"]`);
  const disclosure = summary.locator("xpath=..");
  await expect(summary).toHaveCount(1);
  if (!(await disclosure.evaluate((element) => element.hasAttribute("open"))))
    await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
}

async function openTab(page: Page, name: string): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function waitForHumanPacedWorkerTicks(page: Page): Promise<void> {
  // The Worker ticks every 500ms. Wait through two real publications rather
  // than asserting immediately after an input change.
  await page.waitForTimeout(1_150);
}

async function touchTap(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("Expected a visible Career hour token");
  const session = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

async function expectFreelanceDraft(page: Page, hours: number): Promise<void> {
  await expect(page.getByLabel("Freelance delivery evening hours")).toHaveValue(
    String(hours),
  );
  await expect(page.getByTestId("career-run-status")).toContainText(
    new RegExp(`Scheduled: ${hours.toFixed(2)}h / 4\\.00h\\.`),
  );
}

async function savedCareer(page: Page): Promise<{
  schemaVersion?: number;
  migration?: { steps?: string[] };
  career?: {
    schedule?: {
      completedEvenings?: number;
      allocations?: Record<string, number>;
      day?: number;
      hoursRemaining?: number;
    };
    freelanceHours?: number;
    competition?: { progress?: number };
    product?: { buildProgress?: number };
    offlinePolicy?: {
      enabled?: boolean;
      maxHours?: number;
      lastReport?: { appliedHours?: number };
    };
  };
}> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as {
      schemaVersion?: number;
      migration?: { steps?: string[] };
      career?: {
        schedule?: {
          completedEvenings?: number;
          allocations?: Record<string, number>;
        };
        freelanceHours?: number;
        offlinePolicy?: {
          enabled?: boolean;
          lastReport?: { appliedHours?: number };
        };
      };
    };
  }, SAVE_KEY);
}

function safeOfflineReadySave(maxHours = 4): string {
  const state = createInitialState(56_061);
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

async function bufferTwoWorkerCommandResponses(page: Page): Promise<void> {
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
}

async function bufferThreeWorkerCommandResponses(page: Page): Promise<void> {
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
}

async function assertPortraitControls(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  const undersized = await page.locator("button:visible").evaluateAll((items) =>
    items
      .map((item) => {
        const box = item.getBoundingClientRect();
        return {
          label: item.textContent?.trim(),
          width: box.width,
          height: box.height,
        };
      })
      .filter((item) => item.width < 44 || item.height < 44),
  );
  expect(undersized).toEqual([]);
}

test.describe("Bedroom Developer career acceptance", () => {
  for (const width of [320, 393]) {
    test(`schedules finite keyboard-accessible evenings at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 742 });
      await page.goto("/");
      await waitForSavedState(page);
      await openCareer(page);

      const freelanceHours = page.getByLabel(
        "Freelance delivery evening hours",
      );
      const competitionHours = page.getByLabel(
        "Bedroom Benchmark Cup evening hours",
      );
      await freelanceHours.fill("3");
      await expect(freelanceHours).toHaveValue("3");
      await competitionHours.focus();
      await competitionHours.fill("1");
      await competitionHours.press("Tab");
      await expect(competitionHours).toHaveValue("1");

      const run = page.getByRole("button", { name: "Run scheduled evening" });
      await run.focus();
      await page.keyboard.press("Enter");
      await expect
        .poll(
          async () =>
            (await savedCareer(page)).career?.schedule?.completedEvenings,
        )
        .toBe(1);
      await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
      await assertPortraitControls(page);
    });
  }

  test("migrates a deployed schema-v6 save and persists Career work through reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as Record<
        string,
        unknown
      >;
      state.schemaVersion = 6;
      state.contentVersion = "bedroom-career-1";
      state.migration = { sourceSchemaVersion: 6, steps: [] };
      const career = state.career as Record<string, unknown>;
      delete career.evaluation;
      delete career.runEnding;
      delete state.meta;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await resealSavedRecord(page, SAVE_KEY);
    await page.reload();
    await openCareer(page);
    await expect(page.getByLabel("Tonight's Career resources")).toContainText(
      "Savings",
    );
    await expect
      .poll(async () => {
        const state = await savedCareer(page);
        return {
          schemaVersion: state.schemaVersion,
          migrated: state.migration?.steps?.includes(
            "schema-6-to-7-evaluation-replay",
          ),
        };
      })
      .toEqual({ schemaVersion: 7, migrated: true });

    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect
      .poll(async () => (await savedCareer(page)).career?.freelanceHours)
      .toBe(4);
    await page.reload();
    await openCareer(page);
    await openCareerDisclosure(page, "Career progress and route actions");
    await expect(page.getByText(/gross from 4\.00h/)).toBeVisible();
  });

  test("keeps offline policy bounded, recovers visibly, and persists through an offline reload", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await openCareerDisclosure(page, "Safe freelance-only automation");
    await page.getByLabel("Enable safe offline freelance").check();
    await page.getByLabel("Offline maximum hours").fill("1");
    await page.getByLabel("Offline minimum reliability").fill("0.999");
    await page
      .getByRole("button", { name: "Save safe offline policy" })
      .click();
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await expect(
      page.getByText(/Offline report: 0\.00h applied/),
    ).toBeVisible();
    await expect(
      page.getByText(/reliability below player minimum/),
    ).toBeVisible();

    await page.getByLabel("Offline minimum reliability").fill("0.9");
    await page
      .getByRole("button", { name: "Save safe offline policy" })
      .click();
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await expect(
      page.getByText(/Offline report: 1\.00h applied/),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.offlinePolicy?.lastReport
            ?.appliedHours,
      )
      .toBe(1);

    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await openCareer(page);
    await openCareerDisclosure(page, "Safe freelance-only automation");
    await expect(
      page.getByLabel("Enable safe offline freelance"),
    ).toBeChecked();
    await context.setOffline(false);
  });

  test("clears a rejected schedule projection before reporting a later safe offline completion", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 393, height: 742 });
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: SAVE_KEY, value: safeOfflineReadySave() },
    );
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);

    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect(page.locator(".career-schedule-feedback")).toContainText(
      /Worker rejected the scheduled evening:.*No evening was run/i,
    );

    await openCareerDisclosure(page, "Safe freelance-only automation");
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await expect
      .poll(async () => {
        const saved = await savedCareer(page);
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? 0,
        };
      })
      .toEqual({ completedEvenings: 1, offlineHours: 4 });

    const result = page.getByRole("status", { name: "Latest evening result" });
    await expect(result).toContainText("4.00h used");
    await expect(result).not.toContainText("0.00h used");
    expect(pageErrors).toEqual([]);
  });

  test("attributes concurrent Run and safe-offline completions to their own Worker responses", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 393, height: 742 });
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: SAVE_KEY, value: safeOfflineReadySave() },
    );
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await openCareerDisclosure(page, "Safe freelance-only automation");

    // Browser events can enqueue both valid commands before either response
    // renders. The latest recap must use the offline command's own boundary.
    await page.locator("button").evaluateAll((buttons) => {
      const run = buttons.find(
        (button) => button.textContent?.trim() === "Run scheduled evening",
      ) as HTMLButtonElement | undefined;
      const offline = buttons.find(
        (button) =>
          button.textContent?.trim() === "Apply safe offline policy now",
      ) as HTMLButtonElement | undefined;
      if (!run || !offline)
        throw new Error("Expected concurrent Career action controls");
      run.click();
      offline.click();
    });

    await expect
      .poll(async () => {
        const saved = await savedCareer(page);
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? 0,
        };
      })
      .toEqual({ completedEvenings: 2, offlineHours: 4 });

    const result = page.getByRole("status", { name: "Latest evening result" });
    await expect(result).toContainText("Night 2 result");
    await expect(result).toContainText("4.00h used");
    expect(pageErrors).toEqual([]);
  });

  test("keeps a completed Run recap when a batched later offline response applies zero hours", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 393, height: 742 });
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: SAVE_KEY, value: safeOfflineReadySave(0) },
    );
    await bufferTwoWorkerCommandResponses(page);
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await openCareerDisclosure(page, "Safe freelance-only automation");

    // Release both real Worker responses in one browser task. The second
    // policy response is valid but cannot complete an evening, so it must not
    // consume the preceding Run's response-bound recap.
    await page.locator("button").evaluateAll((buttons) => {
      const run = buttons.find(
        (button) => button.textContent?.trim() === "Run scheduled evening",
      ) as HTMLButtonElement | undefined;
      const offline = buttons.find(
        (button) =>
          button.textContent?.trim() === "Apply safe offline policy now",
      ) as HTMLButtonElement | undefined;
      if (!run || !offline)
        throw new Error("Expected concurrent Career action controls");
      run.click();
      offline.click();
    });

    await expect
      .poll(async () => {
        const saved = await savedCareer(page);
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? -1,
        };
      })
      .toEqual({ completedEvenings: 1, offlineHours: 0 });

    const result = page.getByRole("status", { name: "Latest evening result" });
    await expect(result).toContainText("Night 1 result");
    await expect(result).toContainText("4.00h used");
    expect(pageErrors).toEqual([]);
  });

  test("keeps an earlier completed offline recap through a batched policy change and zero-hour apply", async ({
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
      { key: SAVE_KEY, value: safeOfflineReadySave(4) },
    );
    await bufferThreeWorkerCommandResponses(page);
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await openCareerDisclosure(page, "Safe freelance-only automation");

    // Three real Worker responses arrive in one browser task: a completing
    // safe apply, a policy save, then a valid zero-hour apply. Only the two
    // apply requests have recap transactions, so the last response cannot
    // replace or erase the first completed result.
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();
    await page.getByLabel("Offline maximum hours").fill("0");
    await page
      .getByRole("button", { name: "Save safe offline policy" })
      .click();
    await page
      .getByRole("button", { name: "Apply safe offline policy now" })
      .click();

    await expect
      .poll(async () => {
        const saved = await savedCareer(page);
        return {
          completedEvenings: saved.career?.schedule?.completedEvenings ?? 0,
          maxHours: saved.career?.offlinePolicy?.maxHours ?? -1,
          offlineHours:
            saved.career?.offlinePolicy?.lastReport?.appliedHours ?? -1,
        };
      })
      .toEqual({ completedEvenings: 1, maxHours: 0, offlineHours: 0 });

    const result = page.getByRole("status", { name: "Latest evening result" });
    await expect(result).toContainText("Night 1 result");
    await expect(result).toContainText("4.00h used");
    expect(pageErrors).toEqual([]);
  });

  test("remains readable at 200 percent text with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openCareer(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await openCareerDisclosure(page, "Safe freelance-only automation");
    await expect(
      page.getByRole("heading", { name: "Safe freelance-only automation" }),
    ).toBeVisible();
    await page.getByLabel("Offline maximum hours").scrollIntoViewIfNeeded();
    await expect(page.getByLabel("Offline maximum hours")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  for (const { width, height } of [
    { width: 320, height: 693 },
    { width: 393, height: 742 },
  ]) {
    test(`keeps a human-paced App-session draft through Worker ticks, speed, pause, and tabs at ${width}px`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await waitForSavedState(page);
      await openCareer(page);

      const freelance = page.getByLabel("Freelance delivery evening hours");
      await freelance.focus();
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.type("3");
      await expectFreelanceDraft(page, 3);

      await waitForHumanPacedWorkerTicks(page);
      await expectFreelanceDraft(page, 3);

      await chooseSimulationSpeed(page, "64×");
      await waitForHumanPacedWorkerTicks(page);
      await chooseSimulationSpeed(page, "1×");
      await expectFreelanceDraft(page, 3);

      await openTab(page, "Jobs");
      await page.getByRole("button", { name: "Pause" }).click();
      await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
      await waitForHumanPacedWorkerTicks(page);
      await openTab(page, "Inspect");
      await waitForHumanPacedWorkerTicks(page);
      await openTab(page, "Upgrades");
      await openCareer(page);
      await expectFreelanceDraft(page, 3);

      const competitionToken = page.getByRole("button", {
        name: "Allocate 1 hours to Bedroom Benchmark Cup",
      });
      await touchTap(page, competitionToken);
      await expect(
        page.getByLabel("Bedroom Benchmark Cup evening hours"),
      ).toHaveValue("1");
      await expect(page.getByTestId("career-run-status")).toContainText(
        "Scheduled: 4.00h / 4.00h.",
      );
      await waitForHumanPacedWorkerTicks(page);
      await expect(freelance).toHaveValue("3");
      await expect(page.getByTestId("career-run-status")).toContainText(
        "Scheduled: 4.00h / 4.00h.",
      );
      expect(errors).toEqual([]);
    });
  }

  test("keeps drafts session-only, then records exactly one completed evening and its durable outcome", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);

    const freelance = page.getByLabel("Freelance delivery evening hours");
    await freelance.fill("3");
    await waitForHumanPacedWorkerTicks(page);
    await expectFreelanceDraft(page, 3);
    expect(
      (await savedCareer(page)).career?.schedule?.allocations?.freelance,
    ).toBe(0);

    await page.reload();
    await openCareer(page);
    await expectFreelanceDraft(page, 0);

    await page.getByLabel("Freelance delivery evening hours").fill("3");
    await page
      .getByRole("button", {
        name: "Allocate 1 hours to Bedroom Benchmark Cup",
      })
      .click();
    await expect(page.getByTestId("career-run-status")).toContainText(
      "Scheduled: 4.00h / 4.00h.",
    );
    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.schedule?.completedEvenings,
      )
      .toBe(1);

    const completed = await savedCareer(page);
    expect(completed.career?.schedule).toMatchObject({
      completedEvenings: 1,
      day: 2,
      hoursRemaining: 4,
      allocations: {
        freelance: 0,
        competition: 0,
        product: 0,
        maintenance: 0,
      },
    });
    expect(completed.career?.freelanceHours).toBe(3);
    expect(completed.career?.competition?.progress).toBeGreaterThan(0);
    expect(completed.career?.product?.buildProgress).toBe(0);
    await expectFreelanceDraft(page, 0);
    await waitForHumanPacedWorkerTicks(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      1,
    );

    await page.reload();
    await openCareer(page);
    await expectFreelanceDraft(page, 0);
    const reloaded = await savedCareer(page);
    expect(reloaded.career?.schedule?.completedEvenings).toBe(1);
    expect(reloaded.career?.freelanceHours).toBe(3);
    await openCareerDisclosure(page, "Career progress and route actions");
    await expect(page.getByText(/gross from 3\.00h/)).toBeVisible();
  });

  test("serializes rapid Run activation into one durable evening", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);

    await page.getByLabel("Freelance delivery evening hours").fill("4");
    const run = page.getByRole("button", { name: "Run scheduled evening" });
    await run.evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.schedule?.completedEvenings,
      )
      .toBe(1);
    await waitForHumanPacedWorkerTicks(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      1,
    );
  });

  test("visibly holds a failed Career save until a later Worker persistence retry succeeds", async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      const state = window as Window & {
        __careerPersistenceFailure?: { failWrites: boolean };
      };
      const originalSetItem = Storage.prototype.setItem;
      state.__careerPersistenceFailure = { failWrites: false };
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, candidateKey: string, value: string): void {
          if (
            candidateKey === key &&
            state.__careerPersistenceFailure?.failWrites
          )
            throw new DOMException(
              "storage quota exhausted",
              "QuotaExceededError",
            );
          originalSetItem.call(this, candidateKey, value);
        },
      });
    }, SAVE_KEY);

    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await page.evaluate(() => {
      const state = window as Window & {
        __careerPersistenceFailure?: { failWrites: boolean };
      };
      if (!state.__careerPersistenceFailure)
        throw new Error("Expected Career persistence failure fixture");
      state.__careerPersistenceFailure.failWrites = true;
    });

    const run = page.getByRole("button", { name: "Run scheduled evening" });
    await run.click();
    await expect(page.getByText("Night 2", { exact: true })).toBeVisible();
    await expect(run).toBeDisabled();
    await expect(
      page.getByText(/Saving is temporarily unavailable/i),
    ).toBeVisible();
    await waitForHumanPacedWorkerTicks(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      0,
    );

    await page.evaluate(() => {
      const state = window as Window & {
        __careerPersistenceFailure?: { failWrites: boolean };
      };
      if (!state.__careerPersistenceFailure)
        throw new Error("Expected Career persistence recovery fixture");
      state.__careerPersistenceFailure.failWrites = false;
    });
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.schedule?.completedEvenings,
      )
      .toBe(1);
    await expect(run).toBeEnabled();
    await expect(
      page.getByText(/Saving is temporarily unavailable/i),
    ).toBeHidden();
    await page.reload();
    await openCareer(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      1,
    );
  });

  test("keeps an unsubmitted Career evening blocked through an unrelated save failure, then records one after recovery", async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      const state = window as Window & {
        __careerAvailabilityFailure?: { failWrites: boolean };
      };
      const originalSetItem = Storage.prototype.setItem;
      state.__careerAvailabilityFailure = { failWrites: false };
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value(this: Storage, candidateKey: string, value: string): void {
          if (
            candidateKey === key &&
            state.__careerAvailabilityFailure?.failWrites
          )
            throw new DOMException(
              "storage quota exhausted",
              "QuotaExceededError",
            );
          originalSetItem.call(this, candidateKey, value);
        },
      });
    }, SAVE_KEY);

    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await page.evaluate(() => {
      const state = window as Window & {
        __careerAvailabilityFailure?: { failWrites: boolean };
      };
      if (!state.__careerAvailabilityFailure)
        throw new Error("Expected Career availability failure fixture");
      state.__careerAvailabilityFailure.failWrites = true;
    });

    await openTab(page, "Jobs");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await openCareer(page);

    const run = page.getByRole("button", { name: "Run scheduled evening" });
    await expect(
      page.getByText(/Saving is temporarily unavailable/i),
    ).toBeVisible();
    await expect(run).toBeDisabled();
    await expectFreelanceDraft(page, 4);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      0,
    );

    await page.evaluate(() => {
      const state = window as Window & {
        __careerAvailabilityFailure?: { failWrites: boolean };
      };
      if (!state.__careerAvailabilityFailure)
        throw new Error("Expected Career availability recovery fixture");
      state.__careerAvailabilityFailure.failWrites = false;
    });
    await expect(run).toBeEnabled();
    await expect(
      page.getByText(/Saving is temporarily unavailable/i),
    ).toBeHidden();

    await run.click();
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.schedule?.completedEvenings,
      )
      .toBe(1);
    await waitForHumanPacedWorkerTicks(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      1,
    );
    await page.reload();
    await openCareer(page);
    expect((await savedCareer(page)).career?.schedule?.completedEvenings).toBe(
      1,
    );
  });

  test("shows a Worker rejection without replacing the current valid draft", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await openCareer(page);
    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect(page.locator(".career-schedule-feedback")).toContainText(
      /Worker rejected the scheduled evening:.*No evening was run/i,
    );
    await expectFreelanceDraft(page, 0);
    await page.getByLabel("Freelance delivery evening hours").fill("4");
    await page.getByRole("button", { name: "Run scheduled evening" }).click();
    await expect
      .poll(
        async () =>
          (await savedCareer(page)).career?.schedule?.completedEvenings,
      )
      .toBe(1);
  });

  test("recovers a malformed durable Career schedule without reviving a draft", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await waitForSavedState(page);
    await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
        career?: { schedule?: { allocations?: Record<string, unknown> } };
      };
      if (!saved.career?.schedule?.allocations)
        throw new Error("Expected a Career schedule fixture");
      saved.career.schedule.allocations = {
        freelance: 4,
        competition: 4,
        product: 4,
        maintenance: 4,
      };
      localStorage.setItem(key, JSON.stringify(saved));
    }, SAVE_KEY);

    await page.reload();
    await waitForSavedState(page);
    await openCareer(page);
    await expectFreelanceDraft(page, 0);
    expect((await savedCareer(page)).career?.schedule?.allocations).toEqual({
      freelance: 0,
      competition: 0,
      product: 0,
      maintenance: 0,
    });
    expect(errors).toEqual([]);
  });
});
