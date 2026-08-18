import { expect, test, type Page } from "@playwright/test";
import { resealSavedRecord } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function buyAndActivateExpansion(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    state.resources.money = 45;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await resealSavedRecord(page, SAVE_KEY);
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
}

for (const width of [320, 393]) {
  test(`captures starter and expanded pipeline at ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await openTab(page, "Build");
    await expect(page.getByTestId("pipeline")).toBeVisible();
    await page.screenshot({
      path: `output/playwright/round-019-starter-${width}.png`,
      fullPage: true,
    });

    await buyAndActivateExpansion(page);
    await expect(page.getByTestId("slot-process-6")).toBeVisible();
    await page.screenshot({
      path: `output/playwright/round-019-expanded-${width}.png`,
      fullPage: true,
    });
    await page.getByTestId("slot-process-6").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `output/playwright/round-019-expanded-lower-${width}.png`,
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await page.getByTestId("slot-process-6").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `output/playwright/round-019-expanded-200pct-${width}.png`,
    });
    await page.getByTestId("slot-sink").evaluate((element) => {
      element.scrollIntoView({ block: "center" });
    });
    await page.screenshot({
      path: `output/playwright/round-019-output-200pct-${width}.png`,
    });
    expect(errors).toEqual([]);

    if (width === 320) {
      const deliveryWordLines = await page
        .getByTestId("slot-sink")
        .locator(".module-copy strong")
        .evaluate((element) => {
          const text = element.firstChild;
          if (!text) return 0;
          const word = document.createRange();
          word.setStart(text, 0);
          word.setEnd(text, "Delivery".length);
          return word.getClientRects().length;
        });
      expect(deliveryWordLines).toBe(1);
    }
  });
}
