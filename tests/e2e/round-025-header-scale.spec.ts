import { expect, test, type Page } from "@playwright/test";

async function assertReadableHeader(page: Page) {
  const clippedText = await page
    .locator(".resource-strip dt, .resource-strip dd, .time-controls small")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        element.scrollWidth > element.clientWidth + 1
          ? [element.textContent?.trim()]
          : [],
      ),
    );
  expect(clippedText).toEqual([]);

  const documentWidth = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.viewport);

  const undersizedSpeedButtons = await page
    .locator(".speed-options button")
    .evaluateAll((buttons) =>
      buttons.flatMap((button) => {
        const { width, height } = button.getBoundingClientRect();
        return width < 44 || height < 44
          ? [{ label: button.textContent?.trim(), width, height }]
          : [];
      }),
    );
  expect(undersizedSpeedButtons).toEqual([]);
}

for (const { width, rootFontSize, description } of [
  { width: 320, rootFontSize: "16px", description: "normal text" },
  { width: 393, rootFontSize: "16px", description: "normal text" },
  { width: 320, rootFontSize: "32px", description: "200 percent text" },
  { width: 393, rootFontSize: "32px", description: "200 percent text" },
]) {
  test(`keeps the primary header readable at ${width}px with ${description}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await page.evaluate((fontSize) => {
      document.documentElement.style.fontSize = fontSize;
    }, rootFontSize);

    await expect(page.getByLabel("Primary resources")).toBeVisible();
    await expect(page.getByRole("group", { name: "Time speed" })).toBeVisible();
    await assertReadableHeader(page);
  });
}
