import { expect, test, type Page } from "@playwright/test";
import {
  beginStagePlacement,
  chooseSimulationSpeed,
  settleStarterJob,
} from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSavedState(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function setSavedMoney(page: Page, money: number) {
  await waitForSavedState(page);
  await page.evaluate(
    ({ key, money }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { money: number };
      };
      state.resources.money = money;
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key: SAVE_KEY, money },
  );
  await page.reload();
}

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function buyAndActivateExpansion(page: Page) {
  await setSavedMoney(page, 45);
  await openTab(page, "Upgrades");
  const buy = page.getByRole("button", {
    name: "Buy Workstation Expansion I for $45.00",
  });
  await expect(buy).toBeEnabled();
  await buy.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(
    page.getByRole("button", { name: "Activate six-position pipeline" }),
  ).toBeVisible();
  await expect(page.getByText("$0.00 available")).toBeVisible();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
}

async function assertPortraitIntegrity(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.right > document.documentElement.clientWidth + 0.5 &&
          !element.closest(".module-library")
        );
      })
      .slice(0, 12)
      .map((element) => ({
        element: `${element.tagName.toLowerCase()}.${element.className || "no-class"}`,
        right: Math.round(element.getBoundingClientRect().right),
        text: element.textContent?.trim().slice(0, 60),
      })),
    widths: [
      document.documentElement,
      document.body,
      ...document.querySelectorAll<HTMLElement>(
        "#root, .app-shell, .main-content, .library-panel, .module-library",
      ),
    ].map((element) => ({
      element: `${element.tagName.toLowerCase()}.${element.className || "no-class"}`,
      client: element.clientWidth,
      scroll: element.scrollWidth,
      rect: Math.round(element.getBoundingClientRect().width),
      overflow: getComputedStyle(element).overflowX,
    })),
  }));
  expect(
    dimensions.scrollWidth,
    JSON.stringify({
      offenders: dimensions.offenders,
      widths: dimensions.widths,
    }),
  ).toBeLessThanOrEqual(dimensions.clientWidth);
  const undersized = await page
    .locator("button:visible")
    .evaluateAll((buttons) =>
      buttons
        .map((button) => {
          const box = button.getBoundingClientRect();
          return {
            label: button.getAttribute("aria-label") ?? button.textContent,
            width: box.width,
            height: box.height,
          };
        })
        .filter((button) => button.width < 44 || button.height < 44),
    );
  expect(undersized).toEqual([]);
}

test.describe("round 015 task market and workstation expansion", () => {
  test("shows eight workloads and preserves accepted task identity while clearing only waiting work", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openTab(page, "Jobs");
    await settleStarterJob(page);

    await expect(
      page.locator(
        'section[aria-labelledby="workload-title"] .choice-list > button',
      ),
    ).toHaveCount(8);
    await expect(
      page.getByRole("button", { name: /^Code Generation locked\./ }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /^Interactive Chat\. Current quote/ }),
    ).toHaveAccessibleName(/Demand \d+ percent/);

    // The assertion below is about clear semantics, not whether 64x work may
    // naturally settle while the confirmation is being operated. Freeze an
    // already-active task so its identity is a stable comparison target.
    await chooseSimulationSpeed(page, "1×");
    await page.getByRole("button", { name: "Queue 10" }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs?: { activeTask?: unknown; waitingTasks?: unknown[] };
          } | null;
          return Boolean(
            state?.jobs?.activeTask &&
              (state.jobs.waitingTasks?.length ?? 0) > 0,
          );
        }, SAVE_KEY),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
    const beforeClear = await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        jobs: {
          activeTask: { id: string; lockedGrossQuote: number };
          waitingTasks: Array<{ id: string; lockedGrossQuote: number }>;
        };
      };
      return {
        activeId: state.jobs.activeTask.id,
        activeQuote: state.jobs.activeTask.lockedGrossQuote,
        waitingIds: state.jobs.waitingTasks.map((task) => task.id),
      };
    }, SAVE_KEY);
    expect(new Set(beforeClear.waitingIds).size).toBe(
      beforeClear.waitingIds.length,
    );

    await page.getByRole("button", { name: /Clear waiting tasks/ }).click();
    await expect(
      page.getByRole("group", { name: "Confirm clearing waiting tasks" }),
    ).toContainText("The active task stays");
    await page.getByRole("button", { name: "Confirm clear waiting" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          ({ key, activeId, activeQuote }) => {
            const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
              jobs?: {
                activeTask?: { id: string; lockedGrossQuote: number } | null;
                waitingTasks?: unknown[];
              };
            } | null;
            return (
              state?.jobs?.activeTask?.id === activeId &&
              state.jobs.activeTask.lockedGrossQuote === activeQuote &&
              state.jobs.waitingTasks?.length === 0
            );
          },
          {
            key: SAVE_KEY,
            activeId: beforeClear.activeId,
            activeQuote: beforeClear.activeQuote,
          },
        ),
      )
      .toBe(true);

    await page
      .getByRole("button", { name: /^Batch Classification\. Current quote/ })
      .click();
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect(page.getByLabel("Accepted task queue")).toContainText(
      "Changing the selected workload affects new tasks only",
    );
  });

  test("buys expansion exactly once, starts empty, supports placement, preset reload, and offline resume", async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await buyAndActivateExpansion(page);
    await openTab(page, "Build");
    await expect(page.getByText(/Expanded: 8 stages/)).toContainText(
      "Process 4–6 and Output",
    );

    for (const slotId of [
      "prepare",
      "runtime",
      "verify",
      "process-4",
      "process-5",
      "process-6",
    ])
      await expect(page.getByTestId(`slot-${slotId}`)).toBeVisible();
    await expect(page.getByTestId("slot-process-4")).toContainText(
      "Empty / bypassed",
    );
    await expect(page.getByTestId("slot-process-5")).toContainText(
      "Empty / bypassed",
    );
    await expect(page.getByTestId("slot-process-6")).toContainText(
      "Empty / bypassed",
    );

    await beginStagePlacement(page, "Basic Cleaner", "prepare");
    await page
      .getByTestId("slot-process-4")
      .getByRole("button", { name: "Snap here" })
      .click();
    await expect(page.getByTestId("slot-process-4")).toContainText(
      "Basic Cleaner",
    );
    await expect(page.getByTestId("slot-prepare")).toContainText(
      "Empty / bypassed",
    );

    await openTab(page, "Inspect");
    await page.getByRole("button", { name: "Save current" }).click();
    await page.reload();
    await openTab(page, "Inspect");
    await page.getByRole("button", { name: "Load Preset 1" }).click();
    await expect(page.getByTestId("slot-process-4")).toContainText(
      "Basic Cleaner",
    );
    await expect(page.getByTestId("pipeline")).toContainText("Process 6");

    await page.locator("html[data-offline-ready='true']").waitFor();
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("slot-process-4")).toContainText(
      "Basic Cleaner",
    );
    await context.setOffline(false);
    expect(errors).toEqual([]);
  });

  for (const width of [320, 393]) {
    test(`keeps the expanded six-position pipeline usable at ${width}px and 200% text`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/");
      await buyAndActivateExpansion(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px";
      });
      await openTab(page, "Build");
      await expect(page.getByTestId("slot-process-6")).toBeVisible();
      await expect(
        page.locator("main").getByRole("button", {
          name: "Upgrades",
          exact: true,
        }),
      ).toHaveCount(0);
      await assertPortraitIntegrity(page);
    });
  }
});
