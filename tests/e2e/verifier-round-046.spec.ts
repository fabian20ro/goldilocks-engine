import { expect, test, type Page } from "@playwright/test";
import { settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test("verifier round 046: paused 320px queue stress honors the waiting-task cap", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 320, height: 742 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });

  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await settleStarterJob(page);
  await page.getByRole("button", { name: /Long Document/ }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();

  for (let index = 0; index < 10; index += 1) {
    await page.getByRole("button", { name: "Queue 10" }).click();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
            jobs: { queued: number };
          };
          return persisted.jobs.queued;
        }, SAVE_KEY),
      )
      .toBe(Math.min((index + 1) * 10, 99));
  }

  const queuedState = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      jobs: {
        activeTask: unknown;
        paused: boolean;
        queued: number;
        waitingTasks: unknown[];
      };
    };
    return {
      activeTask: persisted.jobs.activeTask,
      paused: persisted.jobs.paused,
      queued: persisted.jobs.queued,
      waitingTaskCount: persisted.jobs.waitingTasks.length,
    };
  }, SAVE_KEY);
  expect(queuedState).toEqual({
    activeTask: null,
    paused: true,
    queued: 99,
    waitingTaskCount: 99,
  });

  await page.getByRole("button", { name: "Build", exact: true }).click();
  await expect(page.getByLabel("99 jobs queued at bottleneck")).toBeVisible();
  await expect(page.getByLabel("100 jobs queued at bottleneck")).toHaveCount(0);

  for (const view of ["Build", "Jobs", "Inspect"] as const) {
    await page.getByRole("button", { name: view, exact: true }).click();
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll, view).toBeLessThanOrEqual(dimensions.client);
  }

  expect(errors).toEqual([]);
});
