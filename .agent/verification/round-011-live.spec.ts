import { expect, test, type Page } from "@playwright/test";

const liveUrl = "https://fabian20ro.github.io/goldlocks-engine/";

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

test("round 011 exact deployment remains worker-backed offline", async ({
  page,
  context,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto(liveUrl, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await expect(page.getByTestId("quick-start")).toContainText(
    "CU means normalized Compute Units",
  );
  await page
    .locator("html[data-offline-ready='true']")
    .waitFor({ timeout: 15_000 });

  const packageState = await page.evaluate(async () => {
    const scope = "/goldlocks-engine/";
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find(
      (entry) => new URL(entry.scope).pathname === scope,
    );
    const assetResponse = await fetch(`${scope}asset-manifest.json`);
    const assets = (await assetResponse.json()) as string[];
    const cache = await caches.open(`goldilocks-shell:${scope}:v4`);
    return {
      registrationScope: registration
        ? new URL(registration.scope).pathname
        : null,
      controllerPath: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
      assets,
      cachedPaths: (await cache.keys()).map(
        (request) => new URL(request.url).pathname,
      ),
    };
  });
  expect(packageState.registrationScope).toBe("/goldlocks-engine/");
  expect(packageState.controllerPath).toBe("/goldlocks-engine/sw.js");
  expect(
    packageState.assets.some((asset) => /worker-.*\.js$/.test(asset)),
  ).toBe(true);
  for (const asset of packageState.assets)
    expect(packageState.cachedPaths).toContain(asset);

  await page.getByRole("button", { name: "Jobs" }).click();
  await page.getByRole("button", { name: "Queue 10" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jobs" }).click();
  await page.getByRole("button", { name: "Queue 10" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
