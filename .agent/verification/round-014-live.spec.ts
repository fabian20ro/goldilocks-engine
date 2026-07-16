import { expect, test, type Page } from "@playwright/test";

const liveUrl = "https://fabian20ro.github.io/goldlocks-engine/";
const scope = "/goldlocks-engine/";
const saveKey = "goldilocks-simulation-save-v4";

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

async function openUpgrades(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Upgrades", exact: true })
    .click();
}

test("round 014 exact deployment supports purchase, persistence, and offline operation", async ({
  page,
  context,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 393, height: 850 });
  await page.goto(liveUrl, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await page
    .locator("html[data-offline-ready='true']")
    .waitFor({ timeout: 15_000 });

  const packageState = await page.evaluate(async (basePath) => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find(
      (entry) => new URL(entry.scope).pathname === basePath,
    );
    const assets = (await (
      await fetch(`${basePath}asset-manifest.json`)
    ).json()) as string[];
    const cacheName = `goldilocks-shell:${basePath}:v6`;
    const cachedPaths = (await (await caches.open(cacheName)).keys()).map(
      (request) => new URL(request.url).pathname,
    );
    return {
      assets,
      cacheName,
      cachedPaths,
      registrationScope: registration
        ? new URL(registration.scope).pathname
        : null,
      controllerPath: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
    };
  }, scope);
  expect(packageState.registrationScope).toBe(scope);
  expect(packageState.controllerPath).toBe(`${scope}sw.js`);
  expect(packageState.cacheName).toBe(`goldilocks-shell:${scope}:v6`);
  expect(
    packageState.assets.some((asset) => /worker-.*\.js$/.test(asset)),
  ).toBe(true);
  for (const asset of packageState.assets)
    expect(packageState.cachedPaths).toContain(asset);

  const lockedModule = page.locator(
    '.module-library [data-module-id="precision-cleaner"]',
  );
  await expect(lockedModule).toHaveAccessibleName(/LOCKED · BUY \$4\.00/);
  await lockedModule.click();
  const buyModule = page.getByRole("button", {
    name: "Buy Precision Cleaner for $4.00",
  });
  await expect(buyModule).toBeDisabled();

  await page.getByRole("button", { name: "16×" }).click();
  await page.getByRole("button", { name: "Jobs" }).click();
  await page.getByRole("button", { name: "Queue 10" }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          resources?: { money?: number };
          jobs?: { completed?: number };
        } | null;
        return {
          money: saved?.resources?.money ?? 0,
          completed: saved?.jobs?.completed ?? 0,
        };
      }, saveKey),
    )
    .toMatchObject({ money: expect.any(Number) });
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          resources?: { money?: number };
        } | null;
        return saved?.resources?.money ?? 0;
      }, saveKey),
    )
    .toBeGreaterThanOrEqual(4);

  await openUpgrades(page);
  await expect(buyModule).toBeEnabled();
  await buyModule.click();
  await expect(page.getByLabel("Latest upgrade action")).toContainText(
    "purchased for $4.00 and is now owned",
  );
  await page
    .getByRole("button", { name: "Add Precision Cleaner in Build" })
    .click();
  await page
    .getByTestId("slot-prepare")
    .getByRole("button", { name: "Snap here" })
    .click();
  await expect(page.getByTestId("slot-prepare")).toContainText(
    "Precision Cleaner",
  );
  await expect(page.getByLabel("Latest upgrade action")).toContainText(
    "Observed delta",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await page.reload();
  await expect(page.getByTestId("slot-prepare")).toContainText(
    "Precision Cleaner",
  );
  await page
    .locator("html[data-offline-ready='true']")
    .waitFor({ timeout: 15_000 });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("slot-prepare")).toContainText(
    "Precision Cleaner",
  );
  await page.getByRole("button", { name: "Jobs" }).click();
  await page.getByRole("button", { name: "Queue 10" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();
  await context.setOffline(false);

  expect(errors).toEqual([]);
});
