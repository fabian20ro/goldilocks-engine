import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const OFFLINE_SAVED_AT_KEY = "goldilocks-simulation-offline-saved-at-v1";

async function openJobs(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
}

test("starter navigation emits no page or console errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  for (const tab of ["Jobs", "Career", "Upgrades", "Inspect", "Build"])
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: tab, exact: true })
      .click();

  expect(problems).toEqual([]);
});

test("clearing the accepted waiting starter leaves a player-actionable path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await openJobs(page);
  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 2 of 3",
  );

  const clearWaiting = page.getByRole("button", {
    name: "Clear waiting tasks (1)",
  });
  if (await clearWaiting.count()) {
    const savedAtBefore = await page.evaluate(
      (key) => localStorage.getItem(key),
      OFFLINE_SAVED_AT_KEY,
    );
    await clearWaiting.click();
    await page.getByRole("button", { name: "Confirm clear waiting" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm clear waiting" }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          ({ key, before }) => localStorage.getItem(key) !== before,
          { key: OFFLINE_SAVED_AT_KEY, before: savedAtBefore },
        ),
      )
      .toBe(true);
  }

  const recoverable = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: { step: string; starterTaskId: string | null };
      jobs: {
        activeTask: { id: string } | null;
        waitingTasks: Array<{ id: string }>;
      };
    };
    const starterStillExists =
      state.jobs.activeTask?.id === state.firstSession.starterTaskId ||
      state.jobs.waitingTasks.some(
        (task) => task.id === state.firstSession.starterTaskId,
      );
    return starterStillExists || state.firstSession.step === "queue-starter";
  }, SAVE_KEY);
  expect(recoverable).toBe(true);
});

test("malformed current first-session completion cannot bypass the starter rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: unknown;
    };
    state.firstSession = {
      step: "complete",
      starterTaskId: "not-a-task",
      observedSettlementTaskId: "not-a-task",
      purchasedModuleId: "not-a-module",
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  await openJobs(page);
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
});

test("Escape cancels a pending placement and restores the originating control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.click();
  await page
    .getByRole("button", { name: "Place Basic Cleaner in Build" })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel placement" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("button", { name: "Cancel placement" }),
  ).toHaveCount(0);
  await expect(cleaner).toBeFocused();
});

test("Cancel placement restores the originating control", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.click();
  await page
    .getByRole("button", { name: "Place Basic Cleaner in Build" })
    .click();
  await page.getByRole("button", { name: "Cancel placement" }).click();

  await expect(cleaner).toBeFocused();
});
