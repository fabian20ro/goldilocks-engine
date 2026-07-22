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
  await expect(page.getByTestId("quick-start")).toContainText(
    "CU means normalized Compute Units",
  );
  await expect(
    page.getByRole("button", { name: "Help / Quick start" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "16×" })).toBeVisible();
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
    const buildInfoResponse = await fetch(`${basePath}build-info.json`);
    const buildInfo = (await buildInfoResponse.json()) as {
      version: string;
      scope: string;
      cacheName: string;
    };
    const registrations = await navigator.serviceWorker.getRegistrations();
    const registration = registrations.find(
      (entry) => new URL(entry.scope).pathname === basePath,
    );
    const cache = await caches.open(buildInfo.cacheName);

    return {
      manifestPath: new URL(manifestLink.href).pathname,
      iconPath: new URL(iconLink.href).pathname,
      manifest,
      assets,
      buildInfo,
      appVersion: document.documentElement.dataset.appVersion ?? null,
      registrationScope: registration
        ? new URL(registration.scope).pathname
        : null,
      controllerPath: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
      controllerBuild: navigator.serviceWorker.controller
        ? new URL(
            navigator.serviceWorker.controller.scriptURL,
          ).searchParams.get("build")
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
  expect(packageState.buildInfo.scope).toBe(pagesPath);
  expect(packageState.appVersion).toBe(packageState.buildInfo.version);
  expect(packageState.controllerBuild).toBe(packageState.buildInfo.version);
  expect(packageState.cacheNames).toContain(packageState.buildInfo.cacheName);
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
    `${pagesPath}build-info.json`,
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
  await expect(page.getByRole("button", { name: "16×" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Animations (on|off)/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jobs" }).click();
  await page.getByRole("button", { name: "Queue 10" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await expect(page.getByLabel(/jobs queued at bottleneck/)).toBeVisible();
  await context.setOffline(false);

  expect(errors).toEqual([]);
});

test("verifier round 006: scoped activation preserves foreign caches", async ({
  page,
}, testInfo) => {
  const errors = captureErrors(page);

  await page.route("**/cache-seed", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>cache seed</title>",
    });
  });
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  await page.goto(`${origin}/cache-seed`);
  await page.evaluate(async (basePath) => {
    const stale = await caches.open(`goldilocks-shell:${basePath}:v3`);
    await stale.put(
      `${basePath}stale.js`,
      new Response("stale Goldilocks asset"),
    );
    const sibling = await caches.open("goldilocks-shell:/other-app/:v7");
    await sibling.put(
      "/other-app/asset.js",
      new Response("sibling application asset"),
    );
    const unrelated = await caches.open("third-party-test-cache");
    await unrelated.put(
      "/shared/asset.txt",
      new Response("unrelated cached data"),
    );
  }, pagesPath);

  await page.goto(pagesPath);
  await page
    .locator("html[data-offline-ready='true']")
    .waitFor({ timeout: 15_000 });

  const cacheState = await page.evaluate(async (basePath) => {
    const buildInfo = (await (
      await fetch(`${basePath}build-info.json`)
    ).json()) as { cacheName: string };
    const names = await caches.keys();
    const sibling = await caches.open("goldilocks-shell:/other-app/:v7");
    const unrelated = await caches.open("third-party-test-cache");
    return {
      names,
      cacheName: buildInfo.cacheName,
      controllerPath: navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null,
      siblingBody: await (await sibling.match("/other-app/asset.js"))?.text(),
      unrelatedBody: await (await unrelated.match("/shared/asset.txt"))?.text(),
    };
  }, pagesPath);

  expect(cacheState.controllerPath).toBe(`${pagesPath}sw.js`);
  expect(cacheState.names).toContain(cacheState.cacheName);
  expect(cacheState.names).not.toContain(`goldilocks-shell:${pagesPath}:v3`);
  expect(cacheState.names).toContain("goldilocks-shell:/other-app/:v7");
  expect(cacheState.names).toContain("third-party-test-cache");
  expect(cacheState.siblingBody).toBe("sibling application asset");
  expect(cacheState.unrelatedBody).toBe("unrelated cached data");
  expect(errors).toEqual([]);
});
