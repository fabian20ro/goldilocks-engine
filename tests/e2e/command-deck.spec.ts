import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"] as const;

async function openTab(page: Page, name: (typeof tabs)[number]) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function assertPortrait(page: Page) {
  const shape = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    nestedPipelineScroll:
      document.querySelector<HTMLElement>("[data-testid=pipeline]")
        ?.scrollHeight !==
      document.querySelector<HTMLElement>("[data-testid=pipeline]")
        ?.clientHeight,
  }));
  expect(shape.scroll).toBeLessThanOrEqual(shape.client);
  expect(shape.nestedPipelineScroll).toBe(false);
  const small = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons.flatMap((button) => {
      const box = button.getBoundingClientRect();
      return box.width < 44 || box.height < 44
        ? [
            {
              name: button.getAttribute("aria-label") ?? button.textContent,
              box,
            },
          ]
        : [];
    }),
  );
  expect(small).toEqual([]);
}

async function assertInitialGeometry(page: Page) {
  const nav = await page
    .getByRole("navigation", { name: "Primary" })
    .boundingBox();
  expect(nav).not.toBeNull();
  const firstPipelineControl = page
    .getByTestId("pipeline")
    .getByRole("button")
    .first();
  const control = await firstPipelineControl.boundingBox();
  expect(control).not.toBeNull();
  expect(control!.y + control!.height).toBeLessThanOrEqual(nav!.y);
  expect(
    await page.locator(".app-scroll-region").evaluate((node) => node.scrollTop),
  ).toBe(0);

  await openTab(page, "Jobs");
  const selected = await page
    .getByLabel("Selected playable workload")
    .boundingBox();
  const queue = await page
    .getByRole("button", { name: "Queue 1", exact: true })
    .boundingBox();
  expect(selected).not.toBeNull();
  expect(queue).not.toBeNull();
  expect(queue!.y + queue!.height).toBeLessThanOrEqual(nav!.y);
  expect(
    await page.locator(".app-scroll-region").evaluate((node) => node.scrollTop),
  ).toBe(0);
}

async function activateExpansion(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate(
    ({ key }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = 45;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY },
  );
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
    })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`command deck geometry and visual evidence at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await assertInitialGeometry(page);

    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page);
      await page.screenshot({
        path: `test-results/command-deck/${viewport.width}-starter-${tab.toLowerCase()}.png`,
      });
    }

    await activateExpansion(page);
    await expect(
      page.getByTestId("pipeline").locator(".pipeline-slot"),
    ).toHaveCount(8);
    for (const id of ["process-4", "process-5", "process-6"])
      await expect(page.getByTestId(`slot-${id}`)).toContainText(
        "Empty / bypassed",
      );

    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page);
      await page.screenshot({
        path: `test-results/command-deck/${viewport.width}-expanded-${tab.toLowerCase()}.png`,
      });
    }
  });
}

test("stage details replace, restore focus, and Build/Run is presentation-only", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  const before = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      slots: unknown;
      hardwareId: string;
      workloadId: string;
    };
    return JSON.stringify({
      slots: state.slots,
      hardwareId: state.hardwareId,
      workloadId: state.workloadId,
    });
  }, SAVE_KEY);
  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.click();
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toContainText("0.8 GB");
  const model = page
    .getByTestId("slot-runtime")
    .getByRole("button", { name: /^Quantized Model/ });
  await model.click();
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Quantized Model details" }),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(model).toBeFocused();

  await page
    .locator(".app-scroll-region")
    .evaluate((region) => region.scrollTo({ top: 0, behavior: "auto" }));
  const presentation = page.locator(".presentation-toggle");
  await presentation.locator("button").filter({ hasText: "Run" }).click();
  await expect(page.getByText(/Observation presentation/)).toBeVisible();
  await presentation.locator("button").filter({ hasText: "Edit" }).click();
  const after = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      slots: unknown;
      hardwareId: string;
      workloadId: string;
    };
    return JSON.stringify({
      slots: state.slots,
      hardwareId: state.hardwareId,
      workloadId: state.workloadId,
    });
  }, SAVE_KEY);
  expect(after).toBe(before);
});

test("upgrade details replace across every item type and restore origin focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await openTab(page, "Upgrades");

  const openDetails = page.locator("article.upgrade-card details[open]");
  await expect(openDetails).toHaveCount(1);

  const expansionSummary = page.getByText(
    "Compare expansion details and tradeoffs",
  );
  await expansionSummary.click();
  await expect(openDetails).toHaveCount(1);
  await expect(openDetails).toContainText(
    "Three new positions begin empty/bypassed",
  );

  const moduleSummary = page
    .getByText("Compare module details and tradeoffs")
    .first();
  await moduleSummary.click();
  await expect(openDetails).toHaveCount(1);
  await expect(openDetails).toContainText("Compatibility");
  await openDetails.getByRole("button", { name: /Close .* details/ }).click();
  await expect(openDetails).toHaveCount(0);
  await expect(moduleSummary).toBeFocused();

  await expansionSummary.click();
  await page.keyboard.press("Escape");
  await expect(openDetails).toHaveCount(0);
  await expect(expansionSummary).toBeFocused();
});

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`Career tokens stay visible at 200% text at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await openTab(page, "Career");

    const tokens = page.locator(".hour-tokens button");
    await expect(tokens).toHaveCount(16);
    const geometry = await tokens.evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          height: box.height,
        };
      }),
    );
    expect(
      geometry.every(
        (box) =>
          box.left >= 0 &&
          box.right <= viewport.width &&
          box.width >= 44 &&
          box.height >= 44,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await tokens.first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/command-deck/${viewport.width}-career-200-percent.png`,
    });
  });
}
