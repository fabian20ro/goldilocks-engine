import { expect, test, type Page } from "@playwright/test";
import { settleStarterJob } from "./helpers";
import { openHelpAndMotionSettings } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

function readPersistedJobs(page: Page) {
  return page.evaluate((key) => {
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
}

test.describe("verifier round 003 adversarial accessibility", () => {
  test("keeps every visible interactive control at least 44 CSS pixels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 742 });
    await page.goto("/");

    const undersized: Array<{
      view: string;
      label: string;
      width: number;
      height: number;
    }> = [];
    for (const view of ["Build", "Jobs", "Inspect"] as const) {
      await page.getByRole("button", { name: view, exact: true }).click();
      const controls = await page
        .locator("button:visible, input:visible, [role='button']:visible")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return {
              label:
                element.getAttribute("aria-label") ||
                element.textContent?.trim() ||
                element.tagName,
              width: box.width,
              height: box.height,
            };
          }),
        );
      undersized.push(
        ...controls
          .filter((control) => control.width < 44 || control.height < 44)
          .map((control) => ({ view, ...control })),
      );
    }

    expect(undersized).toEqual([]);
  });

  test("the in-app Animations off mode disables every active animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 393, height: 742 });
    await page.goto("/");
    await page.getByRole("button", { name: "Jobs" }).click();
    await settleStarterJob(page);
    await page.getByRole("button", { name: "Queue 10" }).click();
    await page.getByRole("button", { name: "Build" }).click();
    await openHelpAndMotionSettings(page);
    await page.getByRole("button", { name: "Animations on" }).click();
    await expect(
      page.getByRole("button", { name: "Animations off" }),
    ).toBeVisible();

    const activeAnimations = await page
      .locator(".flow-connector.active span, .status-chip.live, .queue-badge")
      .evaluateAll((elements) =>
        elements
          .map((element) => ({
            className: element.className,
            animationName: getComputedStyle(element).animationName,
          }))
          .filter((entry) => entry.animationName !== "none"),
      );

    expect(activeAnimations).toEqual([]);
  });

  test("stressed dynamic content remains reachable at 320 px and 200 percent text", async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 320, height: 742 });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    await page.getByRole("button", { name: "Jobs" }).click();
    await settleStarterJob(page);
    await page.getByRole("button", { name: /Long Document/ }).click();
    // settleStarterJob intentionally leaves 64× selected. Freeze it before
    // constructing this exact stress backlog so real time cannot consume work.
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
    for (let index = 0; index < 10; index += 1) {
      await page.getByRole("button", { name: "Queue 10" }).click();
      await expect
        .poll(() => readPersistedJobs(page).then((jobs) => jobs.queued))
        .toBe(Math.min((index + 1) * 10, 99));
    }
    expect(await readPersistedJobs(page)).toEqual({
      activeTask: null,
      paused: true,
      queued: 99,
      waitingTaskCount: 99,
    });
    await page.getByRole("button", { name: "Build" }).click();
    await expect(page.getByLabel("99 jobs queued at bottleneck")).toBeVisible();
    await expect(page.getByLabel("100 jobs queued at bottleneck")).toHaveCount(
      0,
    );

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
});
