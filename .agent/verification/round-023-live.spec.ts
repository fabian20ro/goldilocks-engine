import { expect, test, type Page } from "@playwright/test";

const liveUrl = "https://fabian20ro.github.io/goldlocks-engine/";
const scope = "/goldlocks-engine/";
const saveKey = "goldilocks-simulation-save-v4";
const candidateAssets = [
  "/goldlocks-engine/assets/index-C5mGLMDv.js",
  "/goldlocks-engine/assets/index-KpaAuKDr.css",
  "/goldlocks-engine/assets/worker-CkOWgOPt.js",
];

function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(`request: ${request.url()} ${request.failure()?.errorText}`),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`response: ${response.status()} ${response.url()}`);
  });
  return errors;
}

async function openTab(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function waitForSavedState(page: Page) {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), saveKey))
    .not.toBeNull();
}

test("round 023 exact live deployment retains the candidate shell, task contract, and offline resume", async ({
  page,
  context,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto(liveUrl, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await page.locator("html[data-offline-ready='true']").waitFor({
    timeout: 15_000,
  });

  const packageState = await page.evaluate(async (basePath) => {
    const assets = (await (
      await fetch(`${basePath}asset-manifest.json`)
    ).json()) as string[];
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find(
      (entry) => new URL(entry.scope).pathname === basePath,
    );
    return {
      assets,
      scope: registration ? new URL(registration.scope).pathname : null,
      controller: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
      cacheNames: await caches.keys(),
    };
  }, scope);
  expect(packageState.assets).toEqual(candidateAssets);
  expect(packageState.scope).toBe(scope);
  expect(packageState.controller).toBe(`${scope}sw.js`);
  expect(packageState.cacheNames).toContain(`goldilocks-shell:${scope}:v7`);

  await openTab(page, "Jobs");
  await expect(
    page.locator(
      'section[aria-labelledby="workload-title"] .choice-list > button',
    ),
  ).toHaveCount(8);
  await page.getByRole("button", { name: "Queue 10" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          jobs?: {
            activeTask?: { id: string; lockedGrossQuote: number } | null;
            waitingTasks?: unknown[];
          };
          workloadDemand?: unknown;
        } | null;
        return {
          active: state?.jobs?.activeTask ?? null,
          waiting: state?.jobs?.waitingTasks?.length ?? 0,
          demand: state?.workloadDemand,
        };
      }, saveKey),
    )
    .toMatchObject({
      active: { id: expect.any(String), lockedGrossQuote: expect.any(Number) },
      waiting: 9,
    });
  const beforeClear = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      jobs: { activeTask: { id: string; lockedGrossQuote: number } };
      workloadDemand: unknown;
    };
    return {
      active: state.jobs.activeTask,
      demand: state.workloadDemand,
    };
  }, saveKey);
  await page.getByRole("button", { name: /Clear waiting tasks/ }).click();
  await page.getByRole("button", { name: "Confirm clear waiting" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          jobs?: {
            activeTask?: { id: string; lockedGrossQuote: number } | null;
            waitingTasks?: unknown[];
          };
          workloadDemand?: unknown;
        } | null;
        return {
          active: state?.jobs?.activeTask ?? null,
          waiting: state?.jobs?.waitingTasks?.length ?? 0,
          demand: state?.workloadDemand,
        };
      }, saveKey),
    )
    .toEqual({
      active: beforeClear.active,
      waiting: 0,
      demand: beforeClear.demand,
    });

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
          jobs?: {
            activeTask?: { id: string; lockedGrossQuote: number } | null;
          };
        } | null;
        return state?.jobs?.activeTask ?? null;
      }, saveKey),
    )
    .toEqual(beforeClear.active);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test("round 023 exact live deployment keeps the expanded pipeline usable at 320px and 200 percent text", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto(liveUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Dismiss tutorial" }).click();
  await waitForSavedState(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    state.resources.money = 45;
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await expect(page.getByTestId("slot-process-6")).toContainText(
    "Empty / bypassed",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "output/playwright/round-023-live-320-200.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 393, height: 850 });
  await expect(page.getByTestId("slot-process-6")).toContainText(
    "Empty / bypassed",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "output/playwright/round-023-live-393-200.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("round 023 exact live deployment accepts real touch moves across all new process positions", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto(liveUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Dismiss tutorial" }).click();
  await waitForSavedState(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
    };
    state.resources.money = 45;
    localStorage.setItem(key, JSON.stringify(state));
  }, saveKey);
  await page.reload();
  await openTab(page, "Upgrades");
  await page
    .getByRole("button", { name: "Buy Workstation Expansion I for $45.00" })
    .click();
  await page
    .getByRole("button", { name: "Activate six-position pipeline" })
    .click();
  await openTab(page, "Build");

  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: /^Basic Cleaner\. EQUIPPED\./ })
    .click();
  await page
    .getByTestId("slot-process-4")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("slot-process-4")).toContainText(
    "Basic Cleaner",
  );

  await page.getByTestId("pipeline").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const process4 = page
    .getByTestId("slot-process-4")
    .locator('[data-module-id="basic-cleaner"]');
  const process5 = page.getByTestId("slot-process-5");
  const process6 = page.getByTestId("slot-process-6");
  await process4.scrollIntoViewIfNeeded();
  await process5.scrollIntoViewIfNeeded();
  await process6.scrollIntoViewIfNeeded();
  const source = await process4.boundingBox();
  const target6 = await process6.boundingBox();
  expect(source).not.toBeNull();
  expect(target6).not.toBeNull();

  const session = await page.context().newCDPSession(page);
  const sendTouchDrag = async (
    from: { x: number; y: number; width: number; height: number },
    to: { x: number; y: number; width: number; height: number },
  ) => {
    const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    for (let step = 1; step <= 8; step += 1)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * step) / 8,
            y: start.y + ((end.y - start.y) * step) / 8,
            id: 1,
          },
        ],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  };

  await sendTouchDrag(source!, target6!);
  await expect(process6).toContainText("Basic Cleaner");
  const source6 = await process6
    .locator('[data-module-id="basic-cleaner"]')
    .boundingBox();
  const target5 = await process5.boundingBox();
  expect(source6).not.toBeNull();
  expect(target5).not.toBeNull();
  await sendTouchDrag(source6!, target5!);
  await expect(process5).toContainText("Basic Cleaner");
  await expect(page.getByTestId("slot-process-4")).toContainText(
    "Empty / bypassed",
  );
  await expect(process6).toContainText("Empty / bypassed");
  expect(errors).toEqual([]);
});
