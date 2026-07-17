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

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;

  expect(navBox.y).toBeGreaterThanOrEqual(0);
  expect(navBox.y + navBox.height).toBeLessThanOrEqual(viewport.height);

  for (const label of ["1×", "4×", "16×", "64×"]) {
    const speed = page.getByRole("button", { name: label, exact: true });
    await speed.scrollIntoViewIfNeeded();
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

    const navAfterTap = await nav.boundingBox();
    expect(navAfterTap).not.toBeNull();
    if (!navAfterTap) return;
    expect(navAfterTap.y).toBeCloseTo(navBox.y, 1);
    expect(navAfterTap.y + navAfterTap.height).toBeCloseTo(viewport.height, 1);
  }
}

async function assertOneHandedContentScroll(page: Page) {
  const content = page.locator(".app-scroll-region");
  const nav = page.getByRole("navigation", { name: "Primary" });
  const navBeforeScroll = await nav.boundingBox();
  expect(navBeforeScroll).not.toBeNull();
  if (!navBeforeScroll) return;

  await content.hover();
  await page.mouse.wheel(0, 420);

  await expect
    .poll(() => content.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  const navAfterScroll = await nav.boundingBox();
  expect(navAfterScroll).not.toBeNull();
  if (!navAfterScroll) return;
  expect(navAfterScroll.y).toBeCloseTo(navBeforeScroll.y, 1);
}

for (const { width, height, rootFontSize, description, requiresScroll } of [
  {
    width: 320,
    height: 568,
    rootFontSize: "16px",
    description: "normal text / short portrait",
    requiresScroll: false,
  },
  {
    width: 393,
    height: 667,
    rootFontSize: "16px",
    description: "normal text / short portrait",
    requiresScroll: false,
  },
  {
    width: 320,
    height: 540,
    rootFontSize: "32px",
    description: "200 percent text / neighboring short portrait",
    requiresScroll: false,
  },
  {
    width: 320,
    height: 568,
    rootFontSize: "32px",
    description: "200 percent text / short portrait",
    requiresScroll: false,
  },
  {
    width: 393,
    height: 640,
    rootFontSize: "32px",
    description: "200 percent text / neighboring short portrait",
    requiresScroll: true,
  },
  {
    width: 393,
    height: 667,
    rootFontSize: "32px",
    description: "200 percent text / verifier portrait",
    requiresScroll: true,
  },
  {
    width: 393,
    height: 700,
    rootFontSize: "32px",
    description: "200 percent text / neighboring tall portrait",
    requiresScroll: false,
  },
  {
    width: 320,
    height: 850,
    rootFontSize: "32px",
    description: "200 percent text / tall portrait",
    requiresScroll: false,
  },
  {
    width: 393,
    height: 850,
    rootFontSize: "32px",
    description: "200 percent text / tall portrait",
    requiresScroll: false,
  },
]) {
  test(`keeps the primary header readable at ${width}x${height}px with ${description}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate((fontSize) => {
      document.documentElement.style.fontSize = fontSize;
    }, rootFontSize);

    await expect(page.getByLabel("Primary resources")).toBeVisible();
    await expect(page.getByRole("group", { name: "Time speed" })).toBeVisible();
    await assertReadableHeader(page);
    if (requiresScroll) await assertOneHandedContentScroll(page);
    await assertSpeedControlsAreTapReachable(page);

    const scrollState = await page
      .locator(".app-scroll-region")
      .evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      }));
    if (requiresScroll) {
      expect(scrollState.scrollHeight).toBeGreaterThan(
        scrollState.clientHeight,
      );
      expect(scrollState.scrollTop).toBeGreaterThan(0);
    }
  });
}
