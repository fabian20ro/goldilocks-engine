import { expect, test, type Page } from "@playwright/test";

const pagesPath = "/goldlocks-engine/";

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

test("the GitHub Pages build loads and remains worker-backed offline", async ({
  page,
  context,
}) => {
  const errors = captureErrors(page);
  const requestedPaths: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === "http://127.0.0.1:4173")
      requestedPaths.push(url.pathname);
  });

  await page.setViewportSize({ width: 393, height: 742 });
  await page.goto(pagesPath);
  await expect(
    page.getByRole("heading", { name: "Goldilocks Engine" }),
  ).toBeVisible();
  await page
    .locator("html[data-offline-ready='true']")
    .waitFor({ timeout: 15_000 });

  const packageState = await page.evaluate(async (basePath) => {
    const manifestLink = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );
    const iconLink =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!manifestLink || !iconLink) throw new Error("PWA links are missing");

    const manifestResponse = await fetch(manifestLink.href);
    const manifest = (await manifestResponse.json()) as {
      start_url: string;
      scope: string;
      icons: Array<{ src: string }>;
    };
    const assetManifestResponse = await fetch(`${basePath}asset-manifest.json`);
    const assets = (await assetManifestResponse.json()) as string[];
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find(
      (entry) => new URL(entry.scope).pathname === basePath,
    );
    const cacheName = `goldilocks-shell:${basePath}:v3`;
    const cache = await caches.open(cacheName);

    return {
      manifestPath: new URL(manifestLink.href).pathname,
      iconPath: new URL(iconLink.href).pathname,
      manifest,
      assets,
      registrationScope: registration
        ? new URL(registration.scope).pathname
        : null,
      controllerPath: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
      cacheNames: await caches.keys(),
      cachedPaths: (await cache.keys()).map(
        (request) => new URL(request.url).pathname,
      ),
      resourcePaths: performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).pathname),
    };
  }, pagesPath);

  expect(packageState.manifestPath).toBe(`${pagesPath}manifest.webmanifest`);
  expect(packageState.iconPath).toBe(`${pagesPath}icon.svg`);
  expect(packageState.manifest).toMatchObject({
    start_url: "./",
    scope: "./",
    icons: [{ src: "icon.svg" }],
  });
  expect(packageState.registrationScope).toBe(pagesPath);
  expect(packageState.controllerPath).toBe(`${pagesPath}sw.js`);
  expect(packageState.cacheNames).toContain(`goldilocks-shell:${pagesPath}:v3`);
  expect(
    packageState.assets.some((asset) => /worker-.*\.js$/.test(asset)),
  ).toBe(true);
  expect(packageState.assets.some((asset) => asset.endsWith(".css"))).toBe(
    true,
  );

  const expectedCachedPaths = [
    pagesPath,
    `${pagesPath}manifest.webmanifest`,
    `${pagesPath}icon.svg`,
    `${pagesPath}asset-manifest.json`,
    ...packageState.assets,
  ];
  for (const path of expectedCachedPaths)
    expect(packageState.cachedPaths).toContain(path);
  for (const path of [
    ...requestedPaths,
    ...packageState.resourcePaths,
    ...packageState.assets,
  ])
    expect(path).toMatch(/^\/goldlocks-engine\//);

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
