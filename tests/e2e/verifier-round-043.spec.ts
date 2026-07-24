import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

type QueueSnapshot = {
  activeId: string | null;
  activeQuote: number | null;
  waiting: number;
  paused: boolean;
};

async function savedQueue(page: Page) {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      jobs?: {
        activeTask?: { id: string; lockedGrossQuote: number } | null;
        waitingTasks?: unknown[];
        paused?: boolean;
      };
    } | null;
    return {
      activeId: state?.jobs?.activeTask?.id ?? null,
      activeQuote: state?.jobs?.activeTask?.lockedGrossQuote ?? null,
      waiting: state?.jobs?.waitingTasks?.length ?? 0,
      paused: state?.jobs?.paused ?? false,
    } satisfies QueueSnapshot;
  }, SAVE_KEY);
}

test("clear waiting preserves a paused accepted task through reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await page.getByRole("button", { name: "64×" }).click();
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 3 of 3",
  );

  // Queue at 1x and pause before confirming the clear. This removes the
  // separate simulation clock as a confounder while exercising the same
  // user-visible command and durable worker path.
  await page.getByRole("button", { name: "1×" }).click();
  await expect(page.getByRole("button", { name: "1×" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /^Queue 10/ }).click();
  await expect
    .poll(() => savedQueue(page))
    .toMatchObject({
      activeId: expect.any(String),
      activeQuote: expect.any(Number),
      waiting: 9,
      paused: false,
    });
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

  await expect
    .poll(() => savedQueue(page))
    .toMatchObject({
      activeId: expect.any(String),
      activeQuote: expect.any(Number),
      waiting: 9,
      paused: true,
    });
  const before = await savedQueue(page);

  await page.getByRole("button", { name: /Clear waiting tasks/ }).click();
  await expect(
    page.getByRole("group", { name: "Confirm clearing waiting tasks" }),
  ).toContainText("The active task stays");
  await page.getByRole("button", { name: "Confirm clear waiting" }).click();
  await expect
    .poll(() => savedQueue(page))
    .toEqual({
      activeId: before.activeId,
      activeQuote: before.activeQuote,
      waiting: 0,
      paused: true,
    });

  await page.reload();
  await expect
    .poll(() => savedQueue(page))
    .toEqual({
      activeId: before.activeId,
      activeQuote: before.activeQuote,
      waiting: 0,
      paused: true,
    });
  expect(errors).toEqual([]);
});
