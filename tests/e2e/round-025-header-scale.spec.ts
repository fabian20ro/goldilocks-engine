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

async function assertSpeedControlsAreTapReachable(page: Page) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  const navBox = await nav.boundingBox();
  expect(navBox).not.toBeNull();
  if (!navBox) return;

  for (const label of ["1×", "4×", "16×", "64×"]) {
    const speed = page.getByRole("button", { name: label, exact: true });
    const speedBox = await speed.boundingBox();
    expect(speedBox).not.toBeNull();
    if (!speedBox) return;

    expect(speedBox.y + speedBox.height).toBeLessThanOrEqual(navBox.y);

    const center = {
      x: speedBox.x + speedBox.width / 2,
      y: speedBox.y + speedBox.height / 2,
    };
    const hitTarget = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return element?.closest("button")?.textContent?.trim() ?? null;
    }, center);
    expect(hitTarget).toBe(label);

    await page.mouse.click(center.x, center.y);
    await expect(speed).toHaveAttribute("aria-pressed", "true");
  }
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
    await assertSpeedControlsAreTapReachable(page);
  });
}
