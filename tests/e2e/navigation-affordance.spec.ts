import { expect, test, type Page } from "@playwright/test";

const navigationLabels = [
  "Build",
  "Jobs",
  "Career",
  "Upgrades",
  "Inspect",
  "Research",
  "Lab",
  "World",
] as const;

async function assertTouchTargets(page: Page) {
  const buttons = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button");
  await expect(buttons).toHaveCount(navigationLabels.length);
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
}

async function assertVisibleInsideNavigation(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  const button = nav.getByRole("button", { name: label, exact: true });
  const geometry = await page.evaluate((target) => {
    const navElement = document.querySelector<HTMLElement>(".bottom-nav");
    const buttonElement = [
      ...document.querySelectorAll(".bottom-nav button"),
    ].find((candidate) => candidate.getAttribute("aria-label") === target);
    if (!navElement || !buttonElement) return null;
    const navBox = navElement.getBoundingClientRect();
    const buttonBox = buttonElement.getBoundingClientRect();
    return {
      left: buttonBox.left,
      right: buttonBox.right,
      navLeft: navBox.left,
      navRight: navBox.right,
    };
  }, label);
  expect(geometry).not.toBeNull();
  expect(geometry!.left).toBeGreaterThanOrEqual(geometry!.navLeft - 1);
  expect(geometry!.right).toBeLessThanOrEqual(geometry!.navRight + 1);
  await expect(button).toHaveAttribute("aria-current", "page");
}

test("keeps all eight destinations visible and ordered at 393px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(
    nav
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
  ).resolves.toEqual([...navigationLabels]);
  await assertTouchTargets(page);
  await expect(nav).not.toHaveClass(/has-right-overflow/);
  await expect(nav.locator(".bottom-nav-overflow-right")).toHaveCSS(
    "opacity",
    "0",
  );

  await nav.getByRole("button", { name: "World", exact: true }).click();
  await assertVisibleInsideNavigation(page, "World");
});

test("320px overflow is announced and active keyboard/touch tabs are revealed", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 320, height: 693 },
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect
      .poll(() =>
        nav.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true);
    await assertTouchTargets(page);
    await expect(nav).toHaveClass(/has-right-overflow/);
    await expect(nav).toHaveAttribute(
      "aria-describedby",
      "primary-nav-overflow-hint",
    );
    await expect(nav.locator(".bottom-nav-overflow-right")).toHaveCSS(
      "opacity",
      "1",
    );

    const world = nav.getByRole("button", { name: "World", exact: true });
    await nav.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await world.evaluate((element) =>
      (element as HTMLElement).focus({ preventScroll: true }),
    );
    await page.keyboard.press("Enter");
    await assertVisibleInsideNavigation(page, "World");
    await expect
      .poll(() => nav.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    await expect(nav).toHaveClass(/has-left-overflow/);

    await nav.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await nav.getByRole("button", { name: "Jobs", exact: true }).tap();
    await expect(
      nav.getByRole("button", { name: "Jobs", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav).toHaveClass(/has-right-overflow/);
  } finally {
    await context.close();
  }
});

test("200% text retains navigation targets and survives resize/reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("button", { name: "World", exact: true }).click();
  await assertVisibleInsideNavigation(page, "World");

  await page.setViewportSize({ width: 320, height: 693 });
  await expect(nav).toHaveClass(/has-(left|right)-overflow/);
  await assertVisibleInsideNavigation(page, "World");

  await nav
    .getByRole("button", { name: "World", exact: true })
    .evaluate((element) =>
      (element as HTMLElement).focus({ preventScroll: true }),
    );
  await page.keyboard.press("Enter");
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", "World");

  await nav.getByRole("button", { name: "Build", exact: true }).click();
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
  await assertTouchTargets(page);
  await expect(nav).toHaveClass(/has-right-overflow/);

  await nav
    .getByRole("button", { name: "World", exact: true })
    .evaluate((element) =>
      (element as HTMLElement).focus({ preventScroll: true }),
    );
  await page.keyboard.press("Enter");
  await assertVisibleInsideNavigation(page, "World");

  await page.setViewportSize({ width: 393, height: 742 });
  await expect
    .poll(() =>
      nav.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    )
    .toBe(true);
  await expect(nav).not.toHaveClass(/has-right-overflow/);

  await page.setViewportSize({ width: 320, height: 693 });
  await expect(nav).toHaveClass(/has-(left|right)-overflow/);
  await assertVisibleInsideNavigation(page, "World");

  await page.reload();
  await expect(
    nav.getByRole("button", { name: "Build", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await assertVisibleInsideNavigation(page, "Build");
  await assertTouchTargets(page);
});
