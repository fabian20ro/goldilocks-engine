import { expect, test, type Locator, type Page } from "@playwright/test";

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
  await expect(
    page.getByText(new RegExp(`^Scheduled: ${hours.toFixed(2)}h\\.`)),
  ).toBeVisible();
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
    await page.reload();
    await openCareer(page);
    await expect(page.getByText("Durable savings")).toBeVisible();
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
    await expect(
      page.getByLabel("Enable safe offline freelance"),
    ).toBeChecked();
    await context.setOffline(false);
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

      await page.getByRole("button", { name: "64×" }).click();
      await waitForHumanPacedWorkerTicks(page);
      await page.getByRole("button", { name: "1×" }).click();
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
      await expect(page.getByText(/^Scheduled: 4\.00h\./)).toBeVisible();
      await waitForHumanPacedWorkerTicks(page);
      await expect(freelance).toHaveValue("3");
      await expect(page.getByText(/^Scheduled: 4\.00h\./)).toBeVisible();
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
    await expect(page.getByText(/^Scheduled: 4\.00h\./)).toBeVisible();
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
