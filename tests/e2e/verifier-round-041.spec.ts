import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`initial controls are above navigation without scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const initial = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".app-scroll-region")?.scrollTop,
    );
    expect(initial).toBe(0);
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .boundingBox();
    const resources = await page.getByLabel("Primary resources").boundingBox();
    const objective = await page
      .getByLabel("Current objective and bottleneck")
      .boundingBox();
    const firstPipelineControl = await page
      .getByTestId("pipeline")
      .getByRole("button")
      .first()
      .boundingBox();
    expect(nav).not.toBeNull();
    expect(resources).not.toBeNull();
    expect(objective).not.toBeNull();
    expect(firstPipelineControl).not.toBeNull();
    expect(resources!.y).toBeGreaterThanOrEqual(0);
    expect(objective!.y).toBeGreaterThanOrEqual(0);
    expect(firstPipelineControl!.y).toBeGreaterThanOrEqual(0);
    expect(
      firstPipelineControl!.y + firstPipelineControl!.height,
    ).toBeLessThanOrEqual(nav!.y);
  });

  test(`initial Jobs dispatch action is above navigation without scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .boundingBox();
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();
    const jobsInitial = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".app-scroll-region")?.scrollTop,
    );
    expect(jobsInitial).toBe(0);
    const selected = await page
      .getByLabel("Selected playable workload")
      .getByText("Interactive Chat", { exact: true })
      .boundingBox();
    const queue = await page
      .getByRole("button", {
        name: "Queue one safe Interactive Chat job",
      })
      .boundingBox();
    expect(selected).not.toBeNull();
    expect(queue).not.toBeNull();
    expect(nav).not.toBeNull();
    expect(selected!.y + selected!.height).toBeLessThanOrEqual(nav!.y);
    expect(queue!.y + queue!.height).toBeLessThanOrEqual(nav!.y);
  });
}

test("a damaged save cannot use a forged installed module to skip the first purchase", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await page.getByRole("button", { name: "64×" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession?: { step?: string };
        } | null;
        return persisted?.firstSession?.step;
      }, SAVE_KEY),
    )
    .toBe("buy-and-install");

  await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: {
        step: string;
        starterTaskId: string | null;
        observedSettlementTaskId: string | null;
        purchasedModuleId: string | null;
      };
      ownedModuleIds: string[];
      slots: { slotId: string; moduleId: string | null }[];
    };
    persisted.ownedModuleIds = [
      ...persisted.ownedModuleIds,
      "precision-cleaner",
    ];
    persisted.slots = persisted.slots.map((slot) =>
      slot.slotId === "prepare"
        ? { ...slot, moduleId: "precision-cleaner" }
        : slot,
    );
    persisted.firstSession = {
      step: "complete",
      starterTaskId: persisted.firstSession.starterTaskId,
      observedSettlementTaskId: persisted.firstSession.starterTaskId,
      purchasedModuleId: "precision-cleaner",
    };
    localStorage.setItem(key, JSON.stringify(persisted));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a real first purchase survives benign stale-save recovery after later work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await page.getByRole("button", { name: "64×" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession?: { step?: string };
        } | null;
        return persisted?.firstSession?.step;
      }, SAVE_KEY),
    )
    .toBe("buy-and-install");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const money = await page.evaluate((key) => {
      const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      return persisted.resources.money;
    }, SAVE_KEY);
    if (money >= 4) break;
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs: { queued: number };
          };
          return persisted.jobs.queued;
        }, SAVE_KEY),
      )
      .toBe(0);
  }
  const funded = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    return persisted.resources.money;
  }, SAVE_KEY);
  expect(funded).toBeGreaterThanOrEqual(4);

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
    .click();
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("first-session-guide")).toHaveCount(0);

  await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      lastUpgradeNotice: unknown;
    };
    persisted.lastUpgradeNotice = null;
    localStorage.setItem(key, JSON.stringify(persisted));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId("first-session-guide")).toHaveCount(0);
});
