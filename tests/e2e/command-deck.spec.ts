import { expect, test, type Page } from "@playwright/test";
import {
  chooseSimulationSpeed,
  openHelpAndMotionSettings,
  openSimulationContext,
} from "./helpers";
import { sealSaveRecord } from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const tabs = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
] as const;

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

async function assertEditorialSummary(page: Page, destination: string) {
  const summary = page.getByTestId("destination-decision");
  await expect(summary).toHaveCount(1);
  await expect(summary).toHaveAttribute(
    "data-editorial-destination",
    destination,
  );
  for (const label of [
    "Current state",
    "Consequence",
    "Cost / risk",
    "Next action",
  ])
    await expect(summary.getByText(label, { exact: true })).toBeVisible();
  await expect(summary.locator(".destination-details-hint")).toContainText(
    "Details",
  );
  await expect(page.getByTestId("first-session-guide")).toHaveCount(
    destination === "Inspect" ? 0 : 1,
  );
}

async function assertTabScrollContract(
  page: Page,
  destination: (typeof tabs)[number],
) {
  const region = page.locator(".app-scroll-region");
  await region.evaluate((element) => {
    element.scrollTop = Math.min(
      180,
      element.scrollHeight - element.clientHeight,
    );
  });
  const saved = await region.evaluate((element) => element.scrollTop);
  expect(saved).toBeGreaterThan(0);

  await openTab(page, destination);
  await expect
    .poll(() => region.evaluate((element) => element.scrollTop))
    .toBe(0);
  await openTab(page, "Build");
  await expect
    .poll(() => region.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
}

async function assertInspectPriority(page: Page) {
  const priority = page.getByTestId("inspect-priority");
  await expect(priority).toContainText("Dominant bottleneck");
  await expect(priority).toContainText("Baseline delta");
  await expect(priority).toContainText("Latest causal evidence");
  const order = await page.evaluate(() => {
    const main = document.querySelector(".main-content");
    const priority = document.querySelector(".inspect-priority");
    const gauges = document.querySelector(".instrument-grid");
    const guide = document.querySelector(".first-session-guide");
    const top = (element: Element | null) =>
      element?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    return {
      mainTop: top(main),
      priority: top(priority),
      gauges: top(gauges),
      guide: top(guide),
    };
  });
  expect(order.priority).toBeGreaterThanOrEqual(order.mainTop);
  expect(order.priority).toBeLessThan(order.gauges);
  expect(order.priority).toBeLessThan(order.guide);
}

async function assertInitialGeometry(page: Page) {
  expect(
    await page
      .locator(".app-scroll-region")
      .evaluate((region) => region.scrollTop),
  ).toBe(0);
  const nav = await page
    .getByRole("navigation", { name: "Primary" })
    .boundingBox();
  expect(nav).not.toBeNull();
  const resources = await page.getByLabel("Primary resources").boundingBox();
  const objective = await page
    .getByLabel("Current objective and bottleneck")
    .boundingBox();
  await expect(page.getByTestId("first-session-guide")).toBeVisible();
  const firstPipelineControl = page
    .getByTestId("pipeline")
    .getByRole("button")
    .first();
  const control = await firstPipelineControl.boundingBox();
  expect(resources).not.toBeNull();
  expect(objective).not.toBeNull();
  expect(control).not.toBeNull();
  expect(resources!.y).toBeGreaterThanOrEqual(0);
  expect(objective!.y).toBeGreaterThanOrEqual(0);
  expect(control!.y).toBeGreaterThanOrEqual(0);
  expect(control!.y + control!.height).toBeLessThanOrEqual(nav!.y);

  await openTab(page, "Jobs");
  expect(
    await page
      .locator(".app-scroll-region")
      .evaluate((region) => region.scrollTop),
  ).toBe(0);
  const selected = await page
    .getByLabel("Selected playable workload")
    .boundingBox();
  const queue = await page.getByRole("button", {
    name: /^Queue (one safe Interactive Chat job|1)$/,
  });
  const queueBox = await queue.boundingBox();
  expect(selected).not.toBeNull();
  expect(queueBox).not.toBeNull();
  expect(queueBox!.y + queueBox!.height).toBeLessThanOrEqual(nav!.y);
}

async function assertCompactGlobalChrome(page: Page) {
  const context = page.getByTestId("simulation-context");
  const headerSettings = page.locator(".header-settings");
  await expect(context).toBeVisible();
  await expect(headerSettings).toBeVisible();
  await expect(context).not.toHaveAttribute("open", "");
  await expect(headerSettings).not.toHaveAttribute("open", "");
  await expect(context).toContainText("Simulation");
  await expect(context).toContainText("Evaluation blind spots widen");
  await expect(context.locator(".simulation-context-panel")).toBeHidden();
}

async function assertCareerControlGeometry(page: Page, viewportWidth: number) {
  const tokens = page.locator(".hour-tokens button");
  const inputs = page.locator('.career-route input[type="number"]');
  await expect(tokens).toHaveCount(16);
  await expect(inputs).toHaveCount(4);

  for (const control of await tokens.or(inputs).all()) {
    const geometry = await control.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const route = element.closest(".career-route")?.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        left: box.left,
        right: box.right,
        routeLeft: route?.left ?? Number.NaN,
        routeRight: route?.right ?? Number.NaN,
      };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(44);
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.left).toBeGreaterThanOrEqual(geometry.routeLeft);
    expect(geometry.right).toBeLessThanOrEqual(geometry.routeRight);
    expect(geometry.right).toBeLessThanOrEqual(viewportWidth);
  }
}

async function activateExpansion(page: Page): Promise<Page> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  const [saved, viewport] = await Promise.all([
    page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
  ]);
  if (saved === null) throw new Error("Expected a persisted simulation state");

  const state = JSON.parse(saved) as { resources: { money: number } };
  state.resources.money = 45;

  // Closing the source page terminates its Worker before this synthetic save
  // reaches the next app boot, preventing an unload-time stale overwrite.
  const context = page.context();
  await page.close();
  await context.addInitScript(
    ({ key, serialized, marker }) => {
      if (sessionStorage.getItem(marker) === "seeded") return;
      sessionStorage.setItem(marker, "seeded");
      localStorage.setItem(key, serialized);
    },
    {
      key: SAVE_KEY,
      serialized: JSON.stringify(sealSaveRecord(state)),
      marker: "command-deck-expansion-seeded",
    },
  );
  const restoredPage = await context.newPage();
  await restoredPage.setViewportSize(viewport);
  await restoredPage.goto("/");
  await openTab(restoredPage, "Upgrades");
  await restoredPage
    .getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
    })
    .click();
  await restoredPage
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(restoredPage, "Build");
  return restoredPage;
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
    await assertCompactGlobalChrome(page);

    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page);
      await assertEditorialSummary(page, tab === "Lab" ? "Lab" : tab);
      if (tab === "Career")
        await assertCareerControlGeometry(page, viewport.width);
      if (tab === "Inspect") await assertInspectPriority(page);
      await page.screenshot({
        path: `test-results/command-deck/${viewport.width}-starter-${tab.toLowerCase()}.png`,
      });
    }

    page = await activateExpansion(page);
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
      await assertEditorialSummary(page, tab === "Lab" ? "Lab" : tab);
      if (tab === "Career")
        await assertCareerControlGeometry(page, viewport.width);
      if (tab === "Inspect") await assertInspectPriority(page);
      await page.screenshot({
        path: `test-results/command-deck/${viewport.width}-expanded-${tab.toLowerCase()}.png`,
      });
    }
  });
}

test("bottom tabs retain their own scroll position instead of inheriting another tab", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await assertTabScrollContract(page, "Jobs");
});

test("Inspect priority remains readable with reduced motion at 200 percent text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
  await openTab(page, "Inspect");
  await assertInspectPriority(page);
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await expect(
    page.getByLabel("Throughput compared with baseline: 0/m"),
  ).toBeVisible();
  await assertPortrait(page);
  await page.getByTestId("inspect-priority").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("inspect-priority")).toBeInViewport();
  await page.screenshot({
    path: "test-results/command-deck/320-inspect-priority-200-percent.png",
  });
});

test("compact global disclosures accept keyboard and touch without covering the tab", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? "4173"}`,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 320, height: 693 },
  });
  const page = await context.newPage();
  try {
    await page.goto("/");

    const settings = page.locator(".header-settings");
    const settingsSummary = settings.locator(":scope > summary");
    await settingsSummary.focus();
    await page.keyboard.press("Space");
    await expect(settings).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(settings).not.toHaveAttribute("open", "");

    const simulationContext = page.getByTestId("simulation-context");
    const summary = simulationContext.locator(":scope > summary");
    await summary.tap();
    await expect(simulationContext).toHaveAttribute("open", "");
    await expect(
      simulationContext.getByRole("group", { name: "Time speed" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`compact global chrome keeps full controls and focus at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await openTab(page, "Jobs");

    const context = await openSimulationContext(page);
    await expect(context).toHaveAttribute("open", "");
    await expect(
      context.getByRole("group", { name: "Time speed" }),
    ).toBeVisible();
    await chooseSimulationSpeed(page, "16×");
    await expect(context).not.toHaveAttribute("open", "");
    const reopened = await openSimulationContext(page);
    await expect(
      reopened.getByRole("button", { name: "16×", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await context
      .getByText("Warning details and valid responses", { exact: true })
      .click();
    await expect(
      context.getByLabel("Current warning and actions"),
    ).toContainText(
      "more evidence narrows blind spots without guaranteeing correctness",
    );

    const settings = await openHelpAndMotionSettings(page);
    const help = settings.getByRole("button", { name: "Help / Quick start" });
    await help.click();
    await expect(page.getByTestId("quick-start")).toBeVisible();
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await expect(settings.locator(":scope > summary")).toBeFocused();

    const geometry = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      undersized: [...document.querySelectorAll("button, summary")]
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden";
        })
        .flatMap((element) => {
          const box = element.getBoundingClientRect();
          return box.width < 44 || box.height < 44
            ? [element.getAttribute("aria-label") ?? element.textContent]
            : [];
        }),
    }));
    expect(geometry.overflow).toBe(false);
    expect(geometry.undersized).toEqual([]);
    await page.screenshot({
      path: `test-results/command-deck/${viewport.width}-global-context-200-percent.png`,
    });
  });
}

test("stage details replace, restore focus, and Configure/Observe is presentation-only", async ({
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
  await presentation.locator("button").filter({ hasText: "Observe" }).click();
  await expect(page.getByText(/Observation presentation/)).toBeVisible();
  await presentation.locator("button").filter({ hasText: "Configure" }).click();
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

    await assertCareerControlGeometry(page, viewport.width);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.locator(".hour-tokens button").first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/command-deck/${viewport.width}-career-200-percent.png`,
    });
  });
}
