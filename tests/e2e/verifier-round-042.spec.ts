import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const tabs = ["Build", "Jobs", "Career", "Upgrades", "Inspect"] as const;

async function openTab(page: Page, name: (typeof tabs)[number]) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function assertPortrait(page: Page, width: number) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    pipelineClientHeight:
      document.querySelector<HTMLElement>("[data-testid=pipeline]")
        ?.clientHeight ?? 0,
    pipelineScrollHeight:
      document.querySelector<HTMLElement>("[data-testid=pipeline]")
        ?.scrollHeight ?? 0,
  }));
  expect(geometry.clientWidth).toBe(width);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  expect(geometry.pipelineScrollHeight).toBe(geometry.pipelineClientHeight);

  const undersized = await page.locator("button:visible").evaluateAll((items) =>
    items.flatMap((item) => {
      const box = item.getBoundingClientRect();
      return box.width < 44 || box.height < 44
        ? [item.getAttribute("aria-label") ?? item.textContent]
        : [];
    }),
  );
  expect(undersized).toEqual([]);
}

async function activateExpansion(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    save.resources.money = 45;
    localStorage.setItem(key, JSON.stringify(save));
  }, SAVE_KEY);
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
    })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`round 042 visual deck inspection at raw ${viewport.width} portrait`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") pageErrors.push(message.text());
    });
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByTestId("first-session-guide")).toBeVisible();
    expect(
      await page
        .locator(".app-scroll-region")
        .evaluate((region) => region.scrollTop),
    ).toBe(0);
    const nav = await page
      .getByRole("navigation", { name: "Primary" })
      .boundingBox();
    const firstPipelineControl = await page
      .getByTestId("pipeline")
      .getByRole("button")
      .first()
      .boundingBox();
    expect(nav).not.toBeNull();
    expect(firstPipelineControl).not.toBeNull();
    expect(
      firstPipelineControl!.y + firstPipelineControl!.height,
    ).toBeLessThanOrEqual(nav!.y);

    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page, viewport.width);
      await page.screenshot({
        path: `test-results/verifier-round-042/${viewport.width}-starter-${tab.toLowerCase()}.png`,
      });
    }

    await activateExpansion(page);
    await expect(
      page.getByTestId("pipeline").locator(".pipeline-slot"),
    ).toHaveCount(8);
    for (const tab of tabs) {
      await openTab(page, tab);
      await assertPortrait(page, viewport.width);
      await page.screenshot({
        path: `test-results/verifier-round-042/${viewport.width}-expanded-${tab.toLowerCase()}.png`,
      });
    }
    expect(pageErrors).toEqual([]);
  });
}

test("round 042 200 percent text keeps queue and detail cancellation reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await openTab(page, "Jobs");
  const queue = page.getByRole("button", {
    name: "Queue one safe Interactive Chat job",
  });
  await queue.scrollIntoViewIfNeeded();
  await expect(queue).toBeVisible();
  await queue.click();
  await page.screenshot({
    path: "test-results/verifier-round-042/320-200-percent-jobs.png",
  });

  await openTab(page, "Build");
  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.scrollIntoViewIfNeeded();
  await cleaner.click();
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cleaner).toBeFocused();
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  await page.screenshot({
    path: "test-results/verifier-round-042/320-200-percent-build.png",
  });
});
