import { expect, test, type Page } from "@playwright/test";

async function assertPortraitIntegrity(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
  const smallTargets = await page
    .locator("button:visible")
    .evaluateAll((buttons) =>
      buttons
        .map((button) => {
          const box = button.getBoundingClientRect();
          return {
            label:
              button.getAttribute("aria-label") || button.textContent?.trim(),
            width: box.width,
            height: box.height,
          };
        })
        .filter((box) => box.width < 44 || box.height < 44),
    );
  expect(smallTargets).toEqual([]);
}

test.describe("portrait pipeline acceptance", () => {
  for (const width of [320, 393]) {
    test(`renders and remains reachable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 742 });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Goldilocks Engine" }),
      ).toBeVisible();
      await expect(page.getByTestId("pipeline")).toBeVisible();
      await assertPortraitIntegrity(page);
      await page.getByRole("button", { name: "Jobs" }).click();
      await expect(
        page.getByRole("heading", { name: "Workloads" }),
      ).toBeVisible();
      await assertPortraitIntegrity(page);
    });
  }

  test("supports one-handed tap placement, branching, queueing, and comparison", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: /Robust Evaluation/ }).click();
    await page
      .getByTestId("slot-verify")
      .getByRole("button", { name: "Snap here" })
      .click();
    await expect(page.getByTestId("slot-verify")).toContainText(
      "Robust Evaluation",
    );
    await page.getByRole("button", { name: /Shadow evaluation/ }).click();
    await expect(
      page.getByRole("button", { name: /Shadow evaluation/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: "Queue 10" }).click();
    await page.getByRole("button", { name: "Build" }).click();
    await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await expect(page.getByRole("table")).toContainText("Evaluation coverage");
    await expect(page.getByRole("table")).toContainText("Before branch change");
  });

  test("supports pointer drag and compatible active-module reordering", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 900 });
    await page.goto("/");
    const source = page
      .getByTestId("slot-prepare")
      .locator('[data-module-id="basic-cleaner"]');
    const destination = page.getByTestId("slot-runtime");
    const from = await source.boundingBox();
    const to = await destination.boundingBox();
    expect(from).not.toBeNull();
    expect(to).not.toBeNull();
    await page.mouse.move(
      from!.x + from!.width / 2,
      from!.y + from!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    await expect(page.getByTestId("slot-runtime")).toContainText(
      "Basic Cleaner",
    );
    await expect(page.getByTestId("slot-prepare")).toContainText(
      "Quantized Model",
    );
    await expect(page.getByText(/Pipeline order anomaly/)).toBeVisible();
  });

  test("makes failure propagation legible and permits recovery", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: /Full Precision Model/ }).click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await page.getByRole("button", { name: "Jobs" }).click();
    await page.getByRole("button", { name: /Long Document/ }).click();
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await page.getByRole("button", { name: "Build" }).click();
    await expect(page.getByText(/Memory limit exceeded/)).toBeVisible();
    await expect(page.getByText("FAULT ORIGIN")).toBeVisible({
      timeout: 12_000,
    });
    await expect(page.getByText("OUTPUT REJECTED").first()).toBeVisible();
    await page
      .getByRole("button", { name: /Quantized Model/ })
      .last()
      .click();
    await page
      .getByTestId("slot-runtime")
      .getByRole("button", { name: "Snap here" })
      .click();
    await expect(page.getByText("FAULT ORIGIN")).toHaveCount(0);
  });

  test("persists player-authored presets across reload", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await page.getByRole("button", { name: "Save current" }).click();
    await expect(page.getByRole("button", { name: /Preset 1/ })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    await expect(page.getByRole("button", { name: /Preset 1/ })).toBeVisible();
  });

  test("honors reduced motion and remains usable at 150% text scale", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 742 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Motion off" }),
    ).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "24px";
    });
    await expect(page.getByRole("button", { name: "Jobs" })).toBeVisible();
    const horizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBe(false);
  });

  test("reloads the visited application shell while offline", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Goldilocks Engine" }),
    ).toBeVisible();
    await context.setOffline(false);
  });
});
