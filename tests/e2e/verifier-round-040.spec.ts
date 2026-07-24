import { expect, test } from "@playwright/test";

const SAVE_KEY = "goldilocks-simulation-save-v4";

test("an unsealed current save cannot delete its guide to unlock starter batches", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();

  await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as Record<
      string,
      unknown
    >;
    delete persisted.firstSession;
    localStorage.setItem(key, JSON.stringify(persisted));
  }, SAVE_KEY);
  await page.reload();

  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("an unsealed settled starter cannot fabricate an uninstalled purchase", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await page.getByRole("button", { name: "64×" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
          firstSession?: { step?: string };
        } | null;
        return persisted?.firstSession?.step;
      }, SAVE_KEY),
    )
    .toBe("buy-and-install");

  const forgedSave = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: {
        step: string;
        starterTaskId: string | null;
        observedSettlementTaskId: string | null;
        purchasedModuleId: string | null;
      };
      ownedModuleIds: string[];
    };
    persisted.ownedModuleIds = [
      ...persisted.ownedModuleIds,
      "precision-cleaner",
    ];
    persisted.firstSession = {
      step: "complete",
      starterTaskId: persisted.firstSession.starterTaskId,
      observedSettlementTaskId: persisted.firstSession.starterTaskId,
      purchasedModuleId: "precision-cleaner",
    };
    return JSON.stringify(persisted);
  }, SAVE_KEY);

  // A reload races the original Worker, whose last valid response can overwrite
  // an injected localStorage value during unload. Seed a fresh browser context
  // before the app starts so this probe verifies the forged snapshot itself.
  const restored = await browser.newContext({
    viewport: { width: 393, height: 742 },
  });
  try {
    await restored.addInitScript(
      ({ key, serialized }) => localStorage.setItem(key, serialized),
      { key: SAVE_KEY, serialized: forgedSave },
    );
    const restoredPage = await restored.newPage();
    const errors: string[] = [];
    restoredPage.on("pageerror", (error) => errors.push(error.message));
    restoredPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await restoredPage.goto("/");

    await expect(restoredPage.getByTestId("first-session-guide")).toContainText(
      "step 1 of 3",
    );
    await restoredPage
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "Jobs", exact: true })
      .click();
    await expect(
      restoredPage.getByRole("button", { name: "Queue 10" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await restored.close();
  }
});

test("clearing a paused starter resets its rail after reload at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 2 of 3",
  );
  await page.getByRole("button", { name: "Clear waiting tasks (1)" }).click();
  await page.getByRole("button", { name: "Confirm clear waiting" }).click();
  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  await page.reload();

  await expect(page.getByTestId("first-session-guide")).toContainText(
    "step 1 of 3",
  );
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Queue one safe Interactive Chat job" }),
  ).toBeVisible();
});

test("Escape cancels Build Details placement with focus and no overflow at 320px/200%", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 320, height: 693 });
  await page.goto("/");
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
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
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
