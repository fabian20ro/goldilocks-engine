import { expect, test, type Page } from "@playwright/test";
import { settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type PersistedJobs = {
  activeTask: { id: string; workloadId: string } | null;
  paused: boolean;
  queued: number;
  waitingTasks: Array<{ id: string; workloadId: string }>;
};

async function readJobs(page: Page): Promise<PersistedJobs> {
  return page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      jobs: PersistedJobs;
    };
    return saved.jobs;
  }, SAVE_KEY);
}

test("verifier round 047: rapid queue dispatch caps, persists, and resumes without a phantom backlog", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

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

  const queueTen = page.getByRole("button", { name: "Queue 10" });
  await queueTen.evaluate((element) => {
    const button = element as HTMLButtonElement;
    for (let index = 0; index < 10; index += 1) button.click();
  });
  await expect.poll(async () => (await readJobs(page)).queued).toBe(99);

  const queued = await readJobs(page);
  expect(queued).toMatchObject({
    activeTask: null,
    paused: true,
    queued: 99,
  });
  expect(queued.waitingTasks).toHaveLength(99);
  expect(new Set(queued.waitingTasks.map((task) => task.id)).size).toBe(99);
  expect(
    queued.waitingTasks.every((task) => task.workloadId === "long-document"),
  ).toBe(true);

  await page.reload();
  await expect.poll(async () => (await readJobs(page)).queued).toBe(99);
  expect(await readJobs(page)).toMatchObject({
    activeTask: null,
    paused: true,
    queued: 99,
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

  await page.getByRole("button", { name: "Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
