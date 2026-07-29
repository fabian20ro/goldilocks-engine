import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function savedCareer(page: Page): Promise<{
  schedule?: { completedEvenings?: number };
}> {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      career?: { schedule?: { completedEvenings?: number } };
    };
    return saved.career ?? {};
  }, SAVE_KEY);
}

async function openCareer(page: Page): Promise<void> {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Career", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Career loop", exact: true }),
  ).toBeVisible();
}

async function openCareerDisclosure(page: Page, title: string): Promise<void> {
  const summary = page.locator(`summary[aria-label="Show ${title}"]`);
  const disclosure = summary.locator("xpath=..");
  await expect(summary).toHaveCount(1);
  if (!(await disclosure.evaluate((element) => element.hasAttribute("open"))))
    await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
}

async function scrollCareerTop(page: Page): Promise<void> {
  await page.locator(".app-scroll-region").evaluate((element) => {
    element.scrollTop = 0;
  });
}

async function touchTap(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("Expected a visible touch target");
  const session = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
}

async function assertPortraitComposer(page: Page): Promise<void> {
  const freelanceInput = page.getByLabel("Freelance delivery evening hours");
  const run = page.getByRole("button", { name: "Run scheduled evening" });
  await expect(page.getByTestId("career-objective")).toBeVisible();
  await expect(page.getByLabel("Tonight's Career resources")).toContainText(
    "Tonight",
  );
  await expect(page.getByTestId("career-unallocated")).toHaveText("4.00h open");
  await expect(freelanceInput).toBeVisible();
  await freelanceInput.scrollIntoViewIfNeeded();
  await run.scrollIntoViewIfNeeded();
  await expect(run).toBeVisible();

  const layout = await page.evaluate(() => {
    const composer = document.querySelector<HTMLElement>(".career-composer");
    const nestedScrollers = composer
      ? Array.from(composer.querySelectorAll<HTMLElement>("*")).filter(
          (element) => {
            const style = getComputedStyle(element);
            return (
              /(auto|scroll)/.test(style.overflowY) &&
              element.scrollHeight > element.clientHeight + 1
            );
          },
        ).length
      : -1;
    return {
      composerFound: composer !== null,
      nestedScrollers,
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  expect(layout).toMatchObject({ composerFound: true, nestedScrollers: 0 });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
}

function exitReadySave(): string {
  const initial = createInitialState(55_207);
  return JSON.stringify(
    sealSimulationState({
      ...initial,
      career: {
        ...initial.career,
        savings: 24,
        competition: { ...initial.career.competition, submissions: 1 },
        product: { ...initial.career.product, released: true, releases: 1 },
        unlockedModelTierIds: [
          ...initial.career.unlockedModelTierIds,
          "kiln-13b",
        ],
        exitAchieved: true,
      },
    }),
  );
}

async function openExitReadyCareer(
  browser: Browser,
  width: number,
  serializedState: string,
): Promise<{
  context: Awaited<ReturnType<Browser["newContext"]>>;
  page: Page;
}> {
  const context = await browser.newContext({
    viewport: { width, height: 742 },
  });
  const page = await context.newPage();
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: SAVE_KEY, value: serializedState },
  );
  await page.goto("/");
  await waitForSave(page);
  await openCareer(page);
  return { context, page };
}

test("Career hierarchy records the empty, partial, full, rejected, completed, locked, and exit-ready portrait deck", async ({
  browser,
}, testInfo) => {
  const exitReady = exitReadySave();
  for (const width of [320, 393]) {
    const context = await browser.newContext({
      viewport: { width, height: 742 },
    });
    const page = await context.newPage();
    try {
      await page.goto("/");
      await waitForSave(page);
      await openCareer(page);
      await assertPortraitComposer(page);
      await scrollCareerTop(page);
      await expect(page.getByTestId("career-objective")).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-empty.png`),
        fullPage: true,
      });

      const freelance = page.getByLabel("Freelance delivery evening hours");
      const competition = page.getByLabel(
        "Bedroom Benchmark Cup evening hours",
      );
      await freelance.focus();
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.type("2");
      await expect(freelance).toHaveValue("2");
      await expect(page.getByTestId("career-run-status")).toContainText(
        "Scheduled: 2.00h / 4.00h.",
      );
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-partial.png`),
        fullPage: true,
      });

      await freelance.fill("3");
      await touchTap(
        page,
        page.getByRole("button", {
          name: "Allocate 1 hours to Bedroom Benchmark Cup",
        }),
      );
      await expect(competition).toHaveValue("1");
      await expect(page.getByTestId("career-run-status")).toContainText(
        "Scheduled: 4.00h / 4.00h.",
      );
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-full.png`),
        fullPage: true,
      });

      await freelance.fill("0");
      await competition.fill("0");
      await page.getByRole("button", { name: "Run scheduled evening" }).click();
      await expect(page.locator(".career-schedule-feedback")).toContainText(
        /Worker rejected the scheduled evening:.*No evening was run/i,
      );
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-rejected.png`),
        fullPage: true,
      });

      await freelance.fill("4");
      await page
        .getByRole("button", { name: "Run scheduled evening" })
        .press("Enter");
      await expect
        .poll(async () => (await savedCareer(page)).schedule?.completedEvenings)
        .toBe(1);
      await expect(
        page.getByRole("status", { name: "Latest evening result" }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-completed.png`),
        fullPage: true,
      });

      await openCareerDisclosure(page, "Model tiers and quantization");
      await expect(
        page.locator(".career-model-list").getByText("LOCKED", { exact: true }),
      ).toHaveCount(2);
      await page.screenshot({
        path: testInfo.outputPath(`career-${width}-locked-route.png`),
        fullPage: true,
      });
    } finally {
      await context.close();
    }

    const exitReadyCareer = await openExitReadyCareer(
      browser,
      width,
      exitReady,
    );
    try {
      await expect(
        exitReadyCareer.page.getByText("EXIT READY", { exact: true }),
      ).toBeVisible();
      await scrollCareerTop(exitReadyCareer.page);
      await exitReadyCareer.page.screenshot({
        path: testInfo.outputPath(`career-${width}-exit-ready.png`),
        fullPage: true,
      });
      await openCareerDisclosure(
        exitReadyCareer.page,
        "Independent conclusion",
      );
      await expect(
        exitReadyCareer.page.getByRole("heading", {
          name: "Independent conclusion",
        }),
      ).toBeVisible();
    } finally {
      await exitReadyCareer.context.close();
    }
  }
});

test("Career hides retained detail in ordered native disclosures with labeled keyboard controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);
  await openCareer(page);

  const titles = await page
    .locator(".career-disclosure > summary")
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute("aria-label")),
    );
  expect(titles).toEqual([
    "Show Career progress and route actions",
    "Show Evaluation discipline",
    "Show Savings and costs",
    "Show Model tiers and quantization",
    "Show Safe freelance-only automation",
    "Show Independent conclusion",
    "Show Diagnostics",
  ]);
  await expect(page.locator(".career-disclosure[open]")).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Run scheduled evening" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Freelance delivery evening hours"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Freelance delivery details" }),
  ).toBeVisible();

  for (const [title, heading] of [
    [
      "Career progress and route actions",
      "Persistent work, not parallel pipelines",
    ],
    ["Evaluation discipline", "Evaluation discipline"],
    ["Savings and costs", "Savings and costs"],
    ["Model tiers and quantization", "Model tiers and quantization"],
    ["Safe freelance-only automation", "Safe freelance-only automation"],
    ["Independent conclusion", "Independent conclusion"],
    ["Diagnostics", "Diagnostic unlocks"],
  ] as const) {
    await openCareerDisclosure(page, title);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
