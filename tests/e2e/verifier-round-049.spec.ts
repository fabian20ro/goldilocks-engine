import { expect, test, type Page } from "@playwright/test";
import { sealSaveRecord } from "../../src/simulation/engine";
import { chooseSimulationSpeed } from "./helpers";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const baseURL = `http://127.0.0.1:${process.env.E2E_PORT ?? "4173"}/`;

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function waitForSave(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function waitForGuideStep(page: Page, step: string) {
  await expect(page.getByTestId("first-session-guide")).toContainText(step, {
    timeout: 10_000,
  });
}

async function reachPurchaseStep(page: Page) {
  await page.goto(baseURL);
  await waitForSave(page);
  await waitForGuideStep(page, "step 1 of 3");
  await openTab(page, "Jobs");
  await page
    .getByRole("button", { name: "Queue one safe Interactive Chat job" })
    .click();
  await waitForGuideStep(page, "step 2 of 3");
  await chooseSimulationSpeed(page, "64×");
  await waitForGuideStep(page, "step 3 of 3");
}

async function seedBeforeBoot(page: Page, money: number): Promise<Page> {
  const serialized = await page.evaluate(
    (key) => localStorage.getItem(key),
    SAVE_KEY,
  );
  if (serialized === null)
    throw new Error("Expected a persisted simulation state");

  const state = JSON.parse(serialized) as { resources: { money: number } };
  state.resources.money = money;

  const context = page.context();
  await page.close();
  await context.addInitScript(
    ({ key, saved, marker }) => {
      // Deliberately one-shot: the subsequent reload must use app persistence,
      // not reapply this test fixture.
      if (sessionStorage.getItem(marker) !== "seeded") {
        sessionStorage.setItem(marker, "seeded");
        localStorage.setItem(key, saved);
      }
    },
    {
      key: SAVE_KEY,
      saved: JSON.stringify(sealSaveRecord(state)),
      marker: "verifier-round-049-seeded",
    },
  );

  const restored = await context.newPage();
  await restored.goto(baseURL);
  await waitForSave(restored);
  return restored;
}

async function restoreForgedCompletionBeforeBoot(page: Page): Promise<Page> {
  const serialized = await page.evaluate((key) => {
    const persisted = JSON.parse(localStorage.getItem(key) ?? "null") as {
      firstSession: {
        step: string;
        starterTaskId: string | null;
        observedSettlementTaskId: string | null;
        purchasedModuleId: string | null;
      };
      ownedModuleIds: string[];
      slots: { slotId: string; moduleId: string | null }[];
    };
    persisted.ownedModuleIds = [
      ...persisted.ownedModuleIds,
      "precision-cleaner",
    ];
    persisted.slots = persisted.slots.map((slot) =>
      slot.slotId === "prepare"
        ? { ...slot, moduleId: "precision-cleaner" }
        : slot,
    );
    persisted.firstSession = {
      step: "complete",
      starterTaskId: persisted.firstSession.starterTaskId,
      observedSettlementTaskId: persisted.firstSession.starterTaskId,
      purchasedModuleId: "precision-cleaner",
    };
    return JSON.stringify(persisted);
  }, SAVE_KEY);

  const context = page.context();
  await page.close();
  await context.addInitScript(
    ({ key, saved, marker }) => {
      if (sessionStorage.getItem(marker) !== "seeded") {
        sessionStorage.setItem(marker, "seeded");
        localStorage.setItem(key, saved);
      }
    },
    {
      key: SAVE_KEY,
      saved: serialized,
      marker: "verifier-round-049-forged-completion",
    },
  );
  const restored = await context.newPage();
  await restored.goto(baseURL);
  await waitForSave(restored);
  return restored;
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`verifier round 049: pre-boot seed persists through reload at ${viewport.width}px`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: "allow",
      locale: "en-US",
      timezoneId: "Europe/Bucharest",
    });
    const errors: string[] = [];
    const observeErrors = (page: Page) => {
      page.on("pageerror", (error) =>
        errors.push(`pageerror: ${error.message}`),
      );
      page.on("console", (message) => {
        if (message.type() === "error")
          errors.push(`console: ${message.text()}`);
      });
    };

    try {
      let page = await context.newPage();
      observeErrors(page);
      await reachPurchaseStep(page);

      await openTab(page, "Jobs");
      const [queueAction, primaryNavigation] = await Promise.all([
        page
          .getByRole("button", { name: "Queue 1", exact: true })
          .boundingBox(),
        page.getByRole("navigation", { name: "Primary" }).boundingBox(),
      ]);
      expect(queueAction).not.toBeNull();
      expect(primaryNavigation).not.toBeNull();
      expect(queueAction!.y + queueAction!.height).toBeLessThanOrEqual(
        primaryNavigation!.y - 8,
      );

      page = await seedBeforeBoot(page, 4);
      observeErrors(page);
      await waitForGuideStep(page, "step 3 of 3");
      expect(
        await page.evaluate((key) => {
          const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
            resources: { money: number };
          };
          return saved.resources.money;
        }, SAVE_KEY),
      ).toBe(4);

      await openTab(page, "Upgrades");
      const purchase = page.getByRole("button", {
        name: "Buy Precision Cleaner for $4.00",
      });
      await expect(purchase).toBeEnabled();

      // The one-shot init script cannot mask this reload: the button and money
      // must come from the application's persisted state.
      await page.reload();
      await waitForSave(page);
      await waitForGuideStep(page, "step 3 of 3");
      expect(
        await page.evaluate((key) => {
          const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
            resources: { money: number };
          };
          return saved.resources.money;
        }, SAVE_KEY),
      ).toBe(4);
      await openTab(page, "Upgrades");
      await expect(purchase).toBeEnabled();
      await purchase.click();
      await page
        .getByRole("button", { name: "Place Precision Cleaner in Build" })
        .click();
      await openTab(page, "Build");
      await expect(page.locator(".placement-tray")).toContainText(
        "Place Precision Cleaner",
      );
      await page.screenshot({
        path: testInfo.outputPath(`restored-${viewport.width}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("verifier round 049: a pre-boot forged completion cannot bypass the rail", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 393, height: 742 },
    serviceWorkers: "allow",
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
  });
  const errors: string[] = [];
  const observeErrors = (page: Page) => {
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
  };

  try {
    let page = await context.newPage();
    observeErrors(page);
    await reachPurchaseStep(page);
    page = await restoreForgedCompletionBeforeBoot(page);
    observeErrors(page);
    await waitForGuideStep(page, "step 1 of 3");
    await openTab(page, "Jobs");
    await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);

    // The one-shot init fixture cannot reseed this reload. The fail-closed
    // recovery must remain durable after the app writes its fresh state.
    await page.reload();
    await waitForSave(page);
    await waitForGuideStep(page, "step 1 of 3");
    await openTab(page, "Jobs");
    await expect(page.getByRole("button", { name: "Queue 10" })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
