import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const MINIMUM_NAV_CLEARANCE_PX = 8;
const portraitViewports = [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
];

async function openJobs(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
}

async function waitForSave(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function setSavedMoney(page: Page, money: number) {
  await waitForSave(page);
  await page.evaluate(
    ({ key, value }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = value;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY, value: money },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function removeStarterProcessingModules(page: Page) {
  for (const [slotId, moduleName, stageName] of [
    ["prepare", "Basic Cleaner", "Prepare"],
    ["runtime", "Quantized Model", "Runtime"],
    ["verify", "Smoke Check", "Verify"],
  ] as const) {
    await page
      .getByTestId(`slot-${slotId}`)
      .getByRole("button", { name: new RegExp(`^${moduleName}`) })
      .click();
    await page
      .getByRole("button", {
        name: `Remove ${moduleName} from ${stageName} and bypass position`,
        exact: true,
      })
      .click();
  }
}

async function queueAndSettleStarter(page: Page) {
  await page
    .getByRole("button", {
      name: "Queue one safe Interactive Chat job",
      exact: true,
    })
    .click();
  await chooseSimulationSpeed(page, "64×");
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          lastSettlement: unknown;
        };
        return state.lastSettlement !== null;
      }, SAVE_KEY),
    )
    .toBe(true);
}

async function openSettlementAccounting(page: Page) {
  const details = page.getByTestId("settlement-accounting");
  const summary = details.locator(":scope > summary");
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(details).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  return details;
}

async function assertPortraitIntegrity(page: Page) {
  const shape = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    nestedMoneyLoop:
      document.querySelector<HTMLElement>(".money-loop")?.scrollHeight !==
      document.querySelector<HTMLElement>(".money-loop")?.clientHeight,
  }));
  expect(shape.scroll).toBeLessThanOrEqual(shape.client);
  expect(shape.nestedMoneyLoop).toBe(false);
  const undersized = await page
    .locator("button:visible, summary:visible")
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const box = element.getBoundingClientRect();
        return box.width < 44 || box.height < 44
          ? [element.textContent?.trim()]
          : [];
      }),
    );
  expect(undersized).toEqual([]);
}

async function assertInitialJobsReserve(page: Page) {
  const geometry = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(".bottom-nav");
    const queue = document.querySelector<HTMLElement>(".queue-one");
    const selected = document.querySelector<HTMLElement>(
      ".selected-dispatch strong",
    );
    const region = document.querySelector<HTMLElement>(".app-scroll-region");
    if (!nav || !queue || !selected || !region) return null;
    const navTop = nav.getBoundingClientRect().top;
    return {
      scrollTop: region.scrollTop,
      queueClearance: navTop - queue.getBoundingClientRect().bottom,
      selectedClearance: navTop - selected.getBoundingClientRect().bottom,
    };
  });
  expect(geometry).not.toBeNull();
  expect(geometry?.scrollTop).toBe(0);
  expect(geometry?.queueClearance).toBeGreaterThanOrEqual(
    MINIMUM_NAV_CLEARANCE_PX,
  );
  expect(geometry?.selectedClearance).toBeGreaterThanOrEqual(
    MINIMUM_NAV_CLEARANCE_PX,
  );
}

for (const viewport of portraitViewports) {
  test(`keeps the successful settlement one-scan and exact on demand at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await setSavedMoney(page, 10);
    await openJobs(page);
    await queueAndSettleStarter(page);

    const settlement = page.locator(".settlement");
    await expect(settlement).toContainText("+$1.335 cash change");
    await expect(page.getByTestId("settlement-overview")).toContainText(
      "Successful delivery Interactive Chat delivered successfully.",
    );
    await expect(page.locator(".settlement-recognition")).toContainText(
      "First successful delivery recorded",
    );
    await expect(settlement.locator(".settlement-accounting")).toHaveCount(1);
    const closedAccounting = settlement.getByTestId("settlement-accounting");
    await expect(
      closedAccounting.locator(".settlement-accounting-body"),
    ).toBeHidden();
    expect(
      await settlement.evaluate((element) =>
        [...element.children]
          .filter((child) => child.tagName !== "DETAILS")
          .map((child) => child.textContent ?? "")
          .join(" "),
      ),
    ).not.toContain("task-0-1");

    const accounting = await openSettlementAccounting(page);
    expect(await accounting.evaluate((element) => element.tagName)).toBe(
      "DETAILS",
    );
    await expect(accounting).toContainText(
      "Task ID task-0-1 · locked gross quote $1.400.",
    );
    await expect(accounting).toContainText("1 completed · 0 failed.");
    await expect(accounting).toContainText(
      "$1.400 gross payout − $0.065 configured actual cost = +$1.335 economic net.",
    );
    await expect(accounting).toContainText(
      "$0.065 configured actual costs · $0.065 paid in full.",
    );
    await expect(accounting).toContainText(
      "Three decimals shown to preserve sub-cent accounting.",
    );
    await page.keyboard.press("Space");
    await expect(accounting).not.toHaveAttribute("open", "");
    await expect(accounting.locator(":scope > summary")).toBeFocused();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await settlement.scrollIntoViewIfNeeded();
    await assertPortraitIntegrity(page);
    expect(
      await settlement.evaluate(
        (element) =>
          window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          ["0s", "0.01ms"].includes(
            getComputedStyle(element).animationDuration,
          ),
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(
        `settlement-success-${viewport.width}-200-percent.png`,
      ),
    });
  });
}

for (const viewport of portraitViewports) {
  test(`keeps a zero-payout failure exact and recoverable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await setSavedMoney(page, 10);
    await removeStarterProcessingModules(page);
    await openJobs(page);
    await queueAndSettleStarter(page);

    const settlement = page.locator(".settlement");
    await expect(settlement).toContainText("−$0.01 cash change");
    await expect(page.getByTestId("settlement-overview")).toContainText(
      "Failed delivery Interactive Chat failed before delivery.",
    );
    await expect(page.locator(".settlement-recovery")).toContainText(
      "The active pipeline had no model stage.",
    );
    await expect(settlement.locator(".settlement-accounting")).toHaveCount(1);

    const accounting = await openSettlementAccounting(page);
    await expect(accounting).toContainText(
      "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
    );
    await expect(accounting).toContainText(
      "$0.010 configured actual costs · $0.010 paid in full.",
    );
    await expect(accounting).toContainText(
      "−$0.010 cash change after the cash floor.",
    );
    await assertPortraitIntegrity(page);
    await page.screenshot({
      path: testInfo.outputPath(
        `settlement-zero-payout-failure-${viewport.width}.png`,
      ),
    });
  });

  test(`keeps a partial-payment failure recoverable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await setSavedMoney(page, 0.005);
    await removeStarterProcessingModules(page);
    await openJobs(page);
    await queueAndSettleStarter(page);

    const settlement = page.locator(".settlement");
    await expect(settlement).toContainText("−$0.005 cash change");
    await expect(page.getByTestId("settlement-overview")).toContainText(
      "Failed delivery Interactive Chat failed before delivery.",
    );
    await expect(page.locator(".settlement-recovery")).toContainText(
      "The active pipeline had no model stage.",
    );
    await expect(page.locator(".settlement-recovery")).toContainText(
      "Recovery forecast: steady quote $1.40",
    );
    // The finite guide owns the next action during onboarding, so it is not
    // duplicated inside the settlement card.
    await expect(page.getByTestId("first-session-guide")).toContainText(
      "Review failed settlement",
    );
    await expect(settlement.locator(".settlement-next-cue")).toHaveCount(0);

    const accounting = await openSettlementAccounting(page);
    await expect(accounting).toContainText(
      "$0.000 gross payout − $0.010 configured actual cost = −$0.010 economic net.",
    );
    await expect(accounting).toContainText(
      "$0.010 configured actual costs · $0.005 paid · $0.005 unpaid because cash cannot go below $0.000.",
    );
    await expect(accounting).toContainText(
      "−$0.005 cash change after the cash floor.",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content: ":root { font-size: 200% !important; }",
    });
    await settlement.scrollIntoViewIfNeeded();
    await assertPortraitIntegrity(page);
    await page.screenshot({
      path: testInfo.outputPath(
        `settlement-partial-failure-${viewport.width}-200-percent.png`,
      ),
    });
  });
}

for (const viewport of portraitViewports) {
  test(`keeps no-settlement, global context, and the Jobs navigation reserve distinct at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await openJobs(page);
    await assertInitialJobsReserve(page);
    await expect(page.getByTestId("settlement-overview")).toHaveText(
      "No payout yet — queue a job.",
    );
    await expect(page.getByTestId("settlement-accounting")).toHaveCount(0);

    const simulation = page.getByTestId("simulation-context");
    await simulation.locator(":scope > summary").click();
    await expect(simulation).toHaveAttribute("open", "");
    await expect(
      simulation.getByRole("group", { name: "Time speed" }),
    ).toBeVisible();
    await expect(page.getByTestId("settlement-overview")).toBeVisible();
    await assertPortraitIntegrity(page);
  });
}

test("uses native touch semantics for settlement accounting and persists the exact record through reload", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? "4173"}`,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 393, height: 742 },
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await setSavedMoney(page, 10);
    await openJobs(page);
    await queueAndSettleStarter(page);
    const accounting = page.getByTestId("settlement-accounting");
    await accounting.locator(":scope > summary").tap();
    await expect(accounting).toHaveAttribute("open", "");
    await expect(accounting).toContainText("Task ID task-0-1");
    await page.reload({ waitUntil: "domcontentloaded" });
    await openJobs(page);
    await expect(page.getByTestId("settlement-overview")).toContainText(
      "Successful delivery",
    );
    await accounting.locator(":scope > summary").tap();
    await expect(accounting).toContainText(
      "$1.400 gross payout − $0.065 configured actual cost = +$1.335 economic net.",
    );
  } finally {
    await context.close();
  }
});
