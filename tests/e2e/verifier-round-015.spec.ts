import { expect, test, type Page } from "@playwright/test";
import { chooseSimulationSpeed, settleStarterJob } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";

async function openJobs(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
}

async function savedState<T>(page: Page): Promise<T> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null") as T,
    SAVE_KEY,
  );
}

test.describe("verifier round 015 task-market legibility", () => {
  test("the quote shown immediately before acceptance equals the task's locked quote", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openJobs(page);
    await settleStarterJob(page);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

    await page.getByRole("button", { name: "Queue 10" }).click();
    await expect
      .poll(async () => {
        const state = await savedState<{
          jobs: { waitingTasks: unknown[] };
        }>(page);
        return state.jobs.waitingTasks.length;
      })
      .toBe(10);

    const liveQuoteText = await page
      .getByText("Selected-work live quote")
      .locator("xpath=..")
      .textContent();
    const visibleQuote = Number(
      liveQuoteText?.match(/\$(\d+\.\d+) gross if accepted now/)?.[1],
    );
    expect(Number.isFinite(visibleQuote)).toBe(true);

    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(async () => {
        const state = await savedState<{
          jobs: { waitingTasks: unknown[] };
        }>(page);
        return state.jobs.waitingTasks.length;
      })
      .toBe(11);
    const state = await savedState<{
      jobs: { waitingTasks: Array<{ lockedGrossQuote: number }> };
    }>(page);
    const acceptedQuote = state.jobs.waitingTasks.at(-1)!.lockedGrossQuote;

    expect(acceptedQuote).toBeCloseTo(visibleQuote, 2);
  });

  test("pipeline feedback continues to describe the active task after selecting future work", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 850 });
    await page.goto("/");
    await openJobs(page);
    await settleStarterJob(page);
    await chooseSimulationSpeed(page, "1×");
    await page
      .getByRole("button", { name: /^Long Document\. Current quote/ })
      .click();
    await page.getByRole("button", { name: "Queue 1", exact: true }).click();
    await expect
      .poll(async () => {
        const state = await savedState<{
          jobs: { activeTask: { workloadId: string } | null };
        }>(page);
        return state.jobs.activeTask?.workloadId;
      })
      .toBe("long-document");
    await page.getByRole("button", { name: "Pause" }).click();
    const futureWork = page.getByRole("button", {
      name: /^Interactive Chat\. Current quote/,
    });
    await futureWork.click();
    await expect(futureWork).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByLabel("Accepted task queue")).toContainText(
      "Long Document",
    );
    await expect(page.getByLabel("Current warning and actions")).toContainText(
      "Memory limit exceeded",
    );
  });
});
