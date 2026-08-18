import { expect, test, type Page } from "@playwright/test";
import { sealSaveRecord } from "../../src/simulation/engine";

const SAVE_KEY = "goldilocks-simulation-save-v4";
const SAVE_BOOTSTRAP_KEY = "goldilocks-e2e-phase-3-save-bootstrap-v1";
let nextSaveBootstrapToken = 0;

async function openTab(page: Page, name: "Build" | "Upgrades") {
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

/**
 * A live page can receive a final periodic Worker publication while reload is
 * tearing it down. Close that Worker-owning page before the next app boot,
 * then seed exactly one new document and wait for its durable publication.
 */
async function setSavedMoney(page: Page, money: number): Promise<Page> {
  await waitForSave(page);
  const [serialized, viewport] = await Promise.all([
    page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    })),
  ]);
  if (serialized === null)
    throw new Error("Expected a persisted simulation state");

  const state = JSON.parse(serialized) as { resources: { money: number } };
  state.resources.money = money;
  const seededState = JSON.stringify(sealSaveRecord(state));
  const token = `money-${++nextSaveBootstrapToken}`;
  await page.evaluate(
    ({ markerKey, nextToken }) => localStorage.setItem(markerKey, nextToken),
    { markerKey: SAVE_BOOTSTRAP_KEY, nextToken: token },
  );

  const context = page.context();
  await context.addInitScript(
    ({ markerKey, nextToken, saveKey, saved }) => {
      try {
        if (localStorage.getItem(markerKey) !== nextToken) return;
        localStorage.setItem(saveKey, saved);
        localStorage.removeItem(markerKey);
      } catch {
        // An initial opaque document has no localStorage; the app navigation does.
      }
    },
    {
      markerKey: SAVE_BOOTSTRAP_KEY,
      nextToken: token,
      saveKey: SAVE_KEY,
      saved: seededState,
    },
  );
  await page.close();

  const restoredPage = await context.newPage();
  await restoredPage.setViewportSize(viewport);
  await restoredPage.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() =>
      restoredPage.evaluate(
        ({ saveKey, markerKey }) => {
          const saved = localStorage.getItem(saveKey);
          if (saved === null) return null;
          try {
            return {
              money: (JSON.parse(saved) as { resources?: { money?: unknown } })
                .resources?.money,
              marker: localStorage.getItem(markerKey),
            };
          } catch {
            return null;
          }
        },
        { saveKey: SAVE_KEY, markerKey: SAVE_BOOTSTRAP_KEY },
      ),
    )
    .toEqual({ money, marker: null });
  return restoredPage;
}

async function buyAndActivateExpansion(page: Page): Promise<Page> {
  page = await setSavedMoney(page, 45);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", {
      name: "Buy Workstation Expansion I for $45.00",
    })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
  return page;
}

async function revealInventory(page: Page) {
  await page
    .locator(".library-panel")
    .evaluate((panel) =>
      panel.scrollIntoView({ block: "start", behavior: "auto" }),
    );
}

async function setTwoHundredPercentText(page: Page) {
  await page.addStyleTag({
    content: ":root { font-size: 200% !important; }",
  });
}

async function assertPortrait(page: Page) {
  const geometry = await page.evaluate(() => {
    const tray = document.querySelector<HTMLElement>(".placement-tray");
    const nav = document.querySelector<HTMLElement>(".bottom-nav");
    const trayBox = tray?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    return {
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      nestedPipelineScroll:
        document.querySelector<HTMLElement>("[data-testid=pipeline]")
          ?.scrollHeight !==
        document.querySelector<HTMLElement>("[data-testid=pipeline]")
          ?.clientHeight,
      trayClear: !trayBox || !navBox || trayBox.bottom <= navBox.top + 0.5,
    };
  });
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client);
  expect(geometry.nestedPipelineScroll).toBe(false);
  expect(geometry.trayClear).toBe(true);
  const tooSmall = await page.locator("button:visible").evaluateAll((items) =>
    items.flatMap((item) => {
      const box = item.getBoundingClientRect();
      return box.width < 44 || box.height < 44
        ? [item.getAttribute("aria-label") ?? item.textContent]
        : [];
    }),
  );
  expect(tooSmall).toEqual([]);
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`Phase 3 groups, details, and every-item route at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForSave(page);

    const rail = page.getByTestId("pipeline");
    const context = page.getByLabel("Selected stage context");
    const owned = page.getByRole("region", { name: "Owned" });
    const available = page.getByRole("region", {
      name: "Affordable / available",
    });
    const locked = page.getByRole("region", { name: "Locked" });
    await expect(rail).toBeVisible();
    await expect(context).toContainText("Prepare · process");
    await expect(owned).toBeVisible();
    await expect(available).toBeVisible();
    await expect(locked).toContainText("Need $");
    expect(await owned.locator(".module-card").count()).toBeLessThanOrEqual(3);
    expect(await locked.locator(".module-card").count()).toBeLessThanOrEqual(3);
    const order = await page.locator(".library-panel").evaluate(() => {
      const rail =
        document
          .querySelector("[data-testid=pipeline]")
          ?.getBoundingClientRect().bottom ?? 0;
      const context =
        document
          .querySelector(".selected-stage-context")
          ?.getBoundingClientRect().top ?? 0;
      const inventory =
        document
          .querySelector(".module-inventory-sections")
          ?.getBoundingClientRect().top ?? 0;
      return { rail, context, inventory };
    });
    expect(order.context).toBeGreaterThanOrEqual(order.rail);
    expect(order.inventory).toBeGreaterThanOrEqual(order.context);

    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-owned-small-100.png`,
    });

    const lockedPrecision = locked.locator(
      '[data-module-id="precision-cleaner"]',
    );
    await lockedPrecision.click();
    await expect(
      page.getByRole("region", { name: "Precision Cleaner details" }),
    ).toContainText("Need $4.00 more");
    await page
      .getByRole("button", { name: "Close Precision Cleaner details" })
      .click();

    await page.getByRole("button", { name: "Show every module (17)" }).click();
    await expect(
      page.locator('.library-panel [data-module-id="resilient-delivery"]'),
    ).toBeVisible();
    await expect(page.locator(".library-panel .module-card")).toHaveCount(17);

    page = await setSavedMoney(page, 10);
    const affordableAfterMoney = page.getByRole("region", {
      name: "Affordable / available",
    });
    await expect(affordableAfterMoney).toContainText("Precision Cleaner");
    await expect(affordableAfterMoney).toContainText("Available now for $4.00");
    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-catalogue-rich-100.png`,
    });

    page = await buyAndActivateExpansion(page);
    await expect(page.getByTestId("slot-process-4")).toContainText(
      "Empty / bypassed",
    );
    await page
      .getByRole("button", { name: "Select Process 4 empty bypassed stage" })
      .click();
    await expect(page.getByLabel("Selected stage context")).toContainText(
      "Process 4 · process",
    );
    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-expanded-100.png`,
    });
  });
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`Phase 3 density stays reachable at 200% text on ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForSave(page);
    await setTwoHundredPercentText(page);
    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-owned-small-200.png`,
    });

    page = await setSavedMoney(page, 10);
    await setTwoHundredPercentText(page);
    await expect(
      page.getByRole("region", { name: "Affordable / available" }),
    ).toContainText("Precision Cleaner");
    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-catalogue-rich-200.png`,
    });

    page = await buyAndActivateExpansion(page);
    await setTwoHundredPercentText(page);
    await page
      .getByRole("button", { name: "Select Process 4 empty bypassed stage" })
      .click();
    await expect(page.getByLabel("Selected stage context")).toContainText(
      "Process 4 · process",
    );
    await revealInventory(page);
    await assertPortrait(page);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-expanded-200.png`,
    });
  });
}

for (const viewport of [
  { width: 320, height: 693 },
  { width: 393, height: 742 },
]) {
  test(`Phase 3 placement tray remains cancellable at 200% text on ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForSave(page);
    await setTwoHundredPercentText(page);

    await page
      .getByRole("button", { name: "Select Input stage", exact: true })
      .click();
    const alternate = page.locator(
      '[data-inventory-section="owned"] [data-module-id="stream-intake"]',
    );
    await alternate.click();
    await page
      .getByRole("button", {
        name: "Place Stream Intake in Build",
        exact: true,
      })
      .click();

    const tray = page.locator(".placement-tray");
    await tray.scrollIntoViewIfNeeded();
    await assertPortrait(page);
    const geometry = await page.evaluate(() => {
      const tray = document.querySelector<HTMLElement>(".placement-tray");
      const copy = tray?.querySelector<HTMLElement>("div");
      const cancel = tray?.querySelector<HTMLElement>("button");
      if (!tray || !copy || !cancel) throw new Error("Missing placement tray");
      const cancelBox = cancel.getBoundingClientRect();
      const copyRange = document.createRange();
      copyRange.selectNodeContents(copy);
      return {
        tray: tray.getBoundingClientRect().toJSON(),
        cancel: cancelBox.toJSON(),
        copy: copy.getBoundingClientRect().toJSON(),
        overlapCount: Array.from(copyRange.getClientRects()).filter(
          (rect) =>
            rect.left < cancelBox.right &&
            rect.right > cancelBox.left &&
            rect.top < cancelBox.bottom &&
            rect.bottom > cancelBox.top,
        ).length,
        viewportHeight: window.innerHeight,
      };
    });
    expect(geometry.tray.top).toBeGreaterThanOrEqual(0);
    expect(geometry.tray.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.cancel.top).toBeGreaterThanOrEqual(0);
    expect(geometry.cancel.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.copy.width).toBeGreaterThan(0);
    expect(geometry.overlapCount).toBe(0);
    await page.screenshot({
      path: `test-results/phase-3/${viewport.width}-placement-tray-200.png`,
    });

    await page.getByRole("button", { name: "Cancel placement" }).click();
    await expect(tray).toHaveCount(0);
    await expect(alternate).toBeFocused();
  });
}

test("Phase 3 explicit placement, tab cancellation, keyboard, and touch-drag retain one pipeline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto("/");
  page = await setSavedMoney(page, 4);
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Precision Cleaner for $4.00" })
    .click();
  await page
    .getByRole("button", { name: "Place Precision Cleaner in Build" })
    .click();
  await openTab(page, "Build");
  const tray = page.locator(".placement-tray");
  await expect(tray).toContainText("Place Precision Cleaner");
  await tray.scrollIntoViewIfNeeded();
  await assertPortrait(page);
  await openTab(page, "Upgrades");
  await openTab(page, "Build");
  await expect(page.locator(".placement-tray")).toHaveCount(0);

  const cleaner = page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner/ });
  await cleaner.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Place Basic Cleaner in Build" })
    .click();
  await page.keyboard.press("Escape");
  await expect(cleaner).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Select Runtime stage" }).click();
  await expect(
    page.getByRole("region", { name: "Basic Cleaner details" }),
  ).toHaveCount(0);

  const source = page
    .getByTestId("slot-prepare")
    .locator('[data-module-id="basic-cleaner"]');
  const destination = page.getByTestId("slot-runtime");
  const [from, to] = await Promise.all([
    source.boundingBox(),
    destination.boundingBox(),
  ]);
  if (!from || !to) throw new Error("Expected active touch-drag endpoints");
  const session = await page.context().newCDPSession(page);
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  for (let step = 1; step <= 6; step += 1)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 6,
          y: start.y + ((end.y - start.y) * step) / 6,
          id: 1,
        },
      ],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("slot-runtime")).toContainText("Basic Cleaner");
  await expect(
    page.getByTestId("pipeline").locator(".pipeline-slot"),
  ).toHaveCount(5);
  await assertPortrait(page);
});
