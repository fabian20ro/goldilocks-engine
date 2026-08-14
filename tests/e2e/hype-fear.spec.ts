import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openWorld(page: Page) {
  await page.getByRole("button", { name: "World", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hype & Fear" }),
  ).toBeVisible();
}

test.describe("Hype and Fear narratives", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
      .not.toBeNull();
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources: { reputation: number };
        jobs: { completed: number; paused: boolean };
      };
      state.resources.reputation = 0.2;
      state.jobs.completed = 1;
      state.jobs.paused = true;
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();
  });

  test("normal and recovery: creator coverage, prediction, bounded uncertainty, and response", async ({
    page,
  }) => {
    await openWorld(page);
    await expect(page.getByTestId("narrative-card")).toContainText(
      "A small local tool",
    );
    await page.getByRole("button", { name: "Cover with Rhea Sol" }).click();
    await expect(page.getByText(/Make one explicit prediction/)).toBeVisible();
    await page
      .getByRole("button", { name: "Predict a narrower result" })
      .click();
    await expect(page.getByText(/Countdown active/)).toBeVisible();

    await page
      .getByTestId("simulation-context")
      .locator("summary")
      .first()
      .click();
    await page.getByRole("button", { name: "64×" }).click();
    await expect(page.getByText(/Response required/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator(".world-response .world-uncertainty"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Publish supported evidence" })
      .click();
    await expect(page.getByTestId("narrative-card")).toBeVisible();
  });

  test("lifecycle: 320px, reduced motion, text scaling, keyboard focus, reload, and offline", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 693 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openWorld(page);
    await expect(page.getByText(/Attention cannot exceed 100/)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const cover = page.getByRole("button", { name: "Cover with Rhea Sol" });
    await cover.focus();
    await expect(cover).toBeFocused();
    await cover.click();
    await expect(page.getByText(/Make one explicit prediction/)).toBeVisible();
    await page.reload();
    await openWorld(page);
    await expect(page.getByText(/A small local tool/)).toBeVisible();
    await page.context().setOffline(true);
    await expect(
      page.getByRole("heading", { name: "Hype & Fear" }),
    ).toBeVisible();
    await page.context().setOffline(false);
  });
});
