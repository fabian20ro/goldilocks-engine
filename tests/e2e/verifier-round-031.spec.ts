import { expect, test, type Browser, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type ReplaySnapshot = {
  seed?: number;
  career?: {
    evaluation?: { modelSwitches?: number };
    runEnding?: { id?: string } | null;
  };
  meta?: {
    completedEndingIds?: readonly string[];
    replayCount?: number;
    unlockedDiagnosticIds?: readonly string[];
  };
};

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function savedState(page: Page): Promise<ReplaySnapshot> {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "null") as ReplaySnapshot;
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

async function createTutorialLoop(page: Page): Promise<void> {
  const q4 = page.getByRole("button", { name: /^Q4 fast \/ lower memory$/ });
  const q8 = page.getByRole("button", {
    name: /^Q8 quality \/ higher memory$/,
  });
  await q8.focus();
  await page.keyboard.press("Enter");
  for (let index = 1; index < 8; index += 1) {
    await (index % 2 === 0 ? q8 : q4).click();
    await expect
      .poll(
        async () => (await savedState(page)).career?.evaluation?.modelSwitches,
      )
      .toBe(index + 1);
  }
  await expect
    .poll(async () => (await savedState(page)).career?.runEnding?.id)
    .toBe("tutorial-loop");
}

async function assertScaledPostmortem(
  browser: Browser,
  width: number,
  screenshotPath: string,
): Promise<void> {
  const context = await browser.newContext({
    viewport: { width, height: 742 },
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForSave(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await openCareer(page);
    await createTutorialLoop(page);

    for (const label of [
      "Direct causes",
      "Contributing factors",
      "Correlated conditions",
      "Player-visible hypotheses",
      "Unknowns",
    ])
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Replay next scenario" }),
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button")).filter(
        (button) => {
          const style = getComputedStyle(button);
          return style.display !== "none" && style.visibility !== "hidden";
        },
      );
      return {
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        undersized: buttons
          .map((button) => {
            const box = button.getBoundingClientRect();
            return { height: box.height, width: box.width };
          })
          .filter((box) => box.width < 44 || box.height < 44),
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.undersized).toEqual([]);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const beforeReplay = await savedState(page);
    await page.getByRole("button", { name: "Replay next scenario" }).click();
    await expect
      .poll(async () => (await savedState(page)).career?.runEnding ?? null)
      .toBeNull();
    const replayed = await savedState(page);
    expect(replayed.seed).toBe((beforeReplay.seed ?? 0) + 1);
    expect(replayed.meta).toEqual({
      completedEndingIds: ["tutorial-loop"],
      replayCount: 1,
      unlockedDiagnosticIds: ["decision-history"],
    });
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context.close();
  }
}

test("postmortem and next-seed replay remain usable at 320 and 393px with 200% text", async ({
  browser,
}, testInfo) => {
  await assertScaledPostmortem(
    browser,
    320,
    testInfo.outputPath("postmortem-320-scaled.png"),
  );
  await assertScaledPostmortem(
    browser,
    393,
    testInfo.outputPath("postmortem-393-scaled.png"),
  );
});
