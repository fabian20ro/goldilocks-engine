import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
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

test("current-save recovery does not display forged one-sample private evidence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await waitForSave(page);

  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      career: { evaluation: Record<string, unknown> };
    };
    saved.career.evaluation = {
      ...saved.career.evaluation,
      privateAssessment: "credible",
      privateEvaluations: 1,
      evaluationSpend: 0.75,
      coverage: 0.9,
    };
    localStorage.setItem(key, JSON.stringify(saved));
  }, SAVE_KEY);

  await page.reload();
  await expect
    .poll(async () => {
      return page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          career?: { evaluation?: Record<string, unknown> };
        };
        return saved.career?.evaluation;
      }, SAVE_KEY);
    })
    .toMatchObject({
      privateAssessment: "not-run",
      privateEvaluations: 0,
      evaluationSpend: 0,
      coverage: 0,
    });
});

test("evaluation and replay UI stays portrait-readable at 320 and 393px", async ({
  browser,
}, testInfo) => {
  for (const width of [320, 393]) {
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
      const evaluationHeading = page.getByRole("heading", {
        name: "Evaluation discipline",
      });
      await expect(evaluationHeading).toBeVisible();
      await evaluationHeading.scrollIntoViewIfNeeded();

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
            .map((button) => button.getBoundingClientRect())
            .filter((box) => box.width < 44 || box.height < 44).length,
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.undersized).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`evaluation-${width}-scaled.png`),
        fullPage: true,
      });
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
