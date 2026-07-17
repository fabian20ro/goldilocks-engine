import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, relative, resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = resolve(process.cwd());
const FIXTURE_ROOT = resolve(ROOT, ".cache/pwa-update");
const HOST = "127.0.0.1";
const PORT = 4181;
const SAVE_KEY = "goldilocks-simulation-save-v4";

type Deployment = "a" | "b";
type ManifestFault = "omitted-null" | "duplicate" | "out-of-scope";

interface ScopeDefinition {
  readonly name: "root" | "pages";
  readonly basePath: string;
}

interface BuildInfo {
  readonly version: string;
  readonly scope: string;
  readonly cacheName: string;
}

interface PackageState {
  readonly appVersion: string | null;
  readonly offlineReady: string | null;
  readonly buildInfo: BuildInfo;
  readonly controllerBuild: string | null;
  readonly controllerPath: string | null;
  readonly workerMessage: { buildId: string; cacheName: string } | null;
  readonly scopedCacheNames: readonly string[];
  readonly cachedPaths: readonly string[];
  readonly assets: readonly string[];
}

const SCOPES: readonly ScopeDefinition[] = [
  { name: "root", basePath: "/" },
  { name: "pages", basePath: "/goldlocks-engine/" },
];

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

let deployment: Deployment = "a";
let failedManifestScope: string | null = null;
let failedManifestRequests = 0;
let manifestFaultScope: string | null = null;
let manifestFault: ManifestFault | null = null;
let manifestFaultRequests = 0;
let failedShellPath: string | null = null;
let failedShellRequests = 0;
let server: Server;

function fixtureDirectory(scope: ScopeDefinition, target = deployment): string {
  return resolve(FIXTURE_ROOT, `${scope.name}-${target}`);
}

function scopeForPath(pathname: string): ScopeDefinition | null {
  return (
    [...SCOPES]
      .sort((left, right) => right.basePath.length - left.basePath.length)
      .find((scope) => pathname.startsWith(scope.basePath)) ?? null
  );
}

function fileForRequest(pathname: string): string | null {
  const scope = scopeForPath(pathname);
  if (!scope) return null;
  const requested = pathname.slice(scope.basePath.length) || "index.html";
  const fixture = fixtureDirectory(scope);
  const path = resolve(fixture, requested);
  if (relative(fixture, path).startsWith("..") || path === fixture) return null;
  return path;
}

function startFixtureServer(): Promise<void> {
  server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const scope = scopeForPath(requestUrl.pathname);
    if (
      scope &&
      failedManifestScope === scope.basePath &&
      requestUrl.pathname === `${scope.basePath}asset-manifest.json`
    ) {
      failedManifestRequests += 1;
      response.writeHead(503, { "Cache-Control": "no-store" });
      response.end("deployment manifest unavailable");
      return;
    }

    if (scope && failedShellPath === requestUrl.pathname) {
      failedShellRequests += 1;
      response.writeHead(503, { "Cache-Control": "no-store" });
      response.end("candidate shell response unavailable");
      return;
    }

    const path = fileForRequest(requestUrl.pathname);
    if (!path) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    try {
      let body = await readFile(path);
      if (
        scope &&
        manifestFaultScope === scope.basePath &&
        requestUrl.pathname === `${scope.basePath}asset-manifest.json` &&
        manifestFault
      ) {
        manifestFaultRequests += 1;
        const manifest = JSON.parse(body.toString("utf8")) as string[];
        if (manifestFault === "omitted-null") {
          const requiredIndex = manifest.findIndex((entry) =>
            /\/assets\/index-.*\.js$/.test(entry),
          );
          if (requiredIndex < 0) throw new Error("fixture lacks index script");
          body = Buffer.from(
            JSON.stringify([
              ...manifest.slice(0, requiredIndex),
              ...manifest.slice(requiredIndex + 1),
              null,
            ]),
          );
        } else if (manifestFault === "duplicate") {
          body = Buffer.from(
            JSON.stringify([manifest[0], manifest[0], ...manifest.slice(2)]),
          );
        } else {
          body = Buffer.from(
            JSON.stringify([
              "https://example.invalid/out-of-scope.js",
              ...manifest.slice(1),
            ]),
          );
        }
      }
      const extension = extname(path);
      const headers: Record<string, string> = {
        "Cache-Control": "no-store",
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      };
      if (requestUrl.pathname.endsWith("/sw.js"))
        headers["Service-Worker-Allowed"] = scope?.basePath ?? "/";
      response.writeHead(200, headers);
      response.end(body);
    } catch {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, () => {
      server.off("error", reject);
      resolveServer();
    });
  });
}

function stopFixtureServer(): Promise<void> {
  return new Promise((resolveServer, reject) => {
    server.close((error) => (error ? reject(error) : resolveServer()));
  });
}

async function fixtureBuildInfo(
  scope: ScopeDefinition,
  target: Deployment,
): Promise<BuildInfo> {
  return JSON.parse(
    await readFile(
      resolve(fixtureDirectory(scope, target), "build-info.json"),
      "utf8",
    ),
  ) as BuildInfo;
}

function urlFor(scope: ScopeDefinition): string {
  return `http://${HOST}:${PORT}${scope.basePath}`;
}

async function workerVersionMessage(
  page: Page,
): Promise<{ buildId: string; cacheName: string } | null> {
  return page.evaluate(async () => {
    const worker = navigator.serviceWorker.controller;
    if (!worker) return null;
    return new Promise<{ buildId: string; cacheName: string }>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => resolve(event.data);
      worker.postMessage({ type: "GOLDLOCKS_PWA_VERSION" }, [channel.port2]);
    });
  });
}

async function packageState(
  page: Page,
  scope: ScopeDefinition,
  expected: BuildInfo,
): Promise<PackageState> {
  const state = await page.evaluate(
    async ({ basePath, expectedBuild }) => {
      const cacheNames = await caches.keys();
      const cache = cacheNames.includes(expectedBuild.cacheName)
        ? await caches.open(expectedBuild.cacheName)
        : null;
      const [metadata, assetManifest] = cache
        ? await Promise.all([
            cache.match(`${basePath}build-info.json`),
            cache.match(`${basePath}asset-manifest.json`),
          ])
        : [undefined, undefined];
      if (!metadata || !assetManifest)
        throw new Error("Expected shell metadata is absent from the cache");
      const [buildInfo, assets] = (await Promise.all([
        metadata.clone().json(),
        assetManifest.clone().json(),
      ])) as [BuildInfo, string[]];
      const controller = navigator.serviceWorker.controller;
      return {
        appVersion: document.documentElement.dataset.appVersion ?? null,
        offlineReady: document.documentElement.dataset.offlineReady ?? null,
        buildInfo,
        controllerBuild: controller
          ? new URL(controller.scriptURL).searchParams.get("build")
          : null,
        controllerPath: controller
          ? new URL(controller.scriptURL).pathname
          : null,
        scopedCacheNames: cacheNames
          .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
          .sort(),
        cachedPaths: cache
          ? (await cache.keys())
              .map((request) => new URL(request.url).pathname)
              .sort()
          : [],
        assets,
      };
    },
    { basePath: scope.basePath, expectedBuild: expected },
  );
  return { ...state, workerMessage: await workerVersionMessage(page) };
}

async function packageTransitionState(
  page: Page,
  scope: ScopeDefinition,
): Promise<{
  readonly appVersion: string | null;
  readonly offlineReady: string | null;
  readonly controllerBuild: string | null;
  readonly controllerPath: string | null;
  readonly scopedCacheNames: readonly string[];
}> {
  return page.evaluate(async (basePath) => {
    const controller = navigator.serviceWorker.controller;
    const cacheNames = await caches.keys();
    return {
      appVersion: document.documentElement.dataset.appVersion ?? null,
      offlineReady: document.documentElement.dataset.offlineReady ?? null,
      controllerBuild: controller
        ? new URL(controller.scriptURL).searchParams.get("build")
        : null,
      controllerPath: controller
        ? new URL(controller.scriptURL).pathname
        : null,
      scopedCacheNames: cacheNames
        .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
        .sort(),
    };
  }, scope.basePath);
}

function isTransientPwaTransitionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Execution context was destroyed") ||
    message.includes("Failed to fetch")
  );
}

async function waitForPackage(
  page: Page,
  scope: ScopeDefinition,
  expected: BuildInfo,
): Promise<PackageState> {
  let latestState: unknown = null;
  try {
    await expect
      .poll(
        async () => {
          try {
            const state = await packageTransitionState(page, scope);
            latestState = state;
            return (
              state.appVersion === expected.version &&
              state.offlineReady === "true" &&
              state.controllerBuild === expected.version &&
              state.controllerPath === `${scope.basePath}sw.js` &&
              state.scopedCacheNames.length === 1 &&
              state.scopedCacheNames[0] === expected.cacheName
            );
          } catch (error) {
            if (isTransientPwaTransitionError(error)) return false;
            throw error;
          }
        },
        { timeout: 20_000 },
      )
      .toBe(true);
  } catch (error) {
    let registration: unknown = "unavailable during navigation";
    try {
      registration = await page.evaluate(async (basePath) => {
        const entry = await navigator.serviceWorker.getRegistration(basePath);
        return entry
          ? {
              active: entry.active?.scriptURL ?? null,
              installing: entry.installing?.scriptURL ?? null,
              waiting: entry.waiting?.scriptURL ?? null,
            }
          : null;
      }, scope.basePath);
    } catch (diagnosticError) {
      registration = `unavailable: ${
        diagnosticError instanceof Error
          ? diagnosticError.message
          : String(diagnosticError)
      }`;
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\nLast PWA state: ${JSON.stringify(latestState)}\nRegistration: ${JSON.stringify(registration)}`,
    );
  }
  const state = await packageState(page, scope, expected);
  expect(state.buildInfo).toEqual(expected);
  expect(state.workerMessage).toEqual({
    buildId: expected.version,
    cacheName: expected.cacheName,
  });
  return state;
}

async function activeShellState(
  page: Page,
  scope: ScopeDefinition,
): Promise<{
  readonly controllerBuild: string | null;
  readonly scopedCacheNames: readonly string[];
}> {
  return page.evaluate(async (basePath) => {
    const controller = navigator.serviceWorker.controller;
    const cacheNames = await caches.keys();
    return {
      controllerBuild: controller
        ? new URL(controller.scriptURL).searchParams.get("build")
        : null,
      scopedCacheNames: cacheNames
        .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
        .sort(),
    };
  }, scope.basePath);
}

async function expectActiveShell(
  page: Page,
  scope: ScopeDefinition,
  expected: BuildInfo,
): Promise<void> {
  await expect
    .poll(() => activeShellState(page, scope), { timeout: 20_000 })
    .toEqual({
      controllerBuild: expected.version,
      scopedCacheNames: [expected.cacheName],
    });
}

async function controllerReloadMarker(
  page: Page,
  buildId: string,
): Promise<string | null> {
  return page.evaluate(
    (key) => sessionStorage.getItem(key),
    `goldilocks-pwa-controller-version:${buildId}`,
  );
}

function expectCompleteCache(
  state: PackageState,
  scope: ScopeDefinition,
): void {
  const expectedPaths = [
    scope.basePath,
    `${scope.basePath}manifest.webmanifest`,
    `${scope.basePath}icon.svg`,
    `${scope.basePath}asset-manifest.json`,
    `${scope.basePath}build-info.json`,
    ...state.assets,
  ];
  for (const path of expectedPaths) expect(state.cachedPaths).toContain(path);
}

async function waitForSave(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
    .not.toBeNull();
}

async function establishNonDefaultPausedSave(page: Page): Promise<unknown> {
  await waitForSave(page);
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      resources: { money: number };
      computeAllocation: number;
      memoryReserve: number;
      jobs: { paused: boolean };
    };
    state.resources.money = 37.25;
    state.computeAllocation = 73;
    state.memoryReserve = 17;
    state.jobs.paused = true;
    localStorage.setItem(key, JSON.stringify(state));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForSave(page);
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      schemaVersion: number;
      contentVersion: string;
      resources: { money: number };
      computeAllocation: number;
      memoryReserve: number;
      jobs: {
        paused: boolean;
        queued: number;
        completed: number;
        failed: number;
        activeTask: unknown;
        waitingTasks: unknown;
      };
      eventSequence: number;
      ledger: unknown;
    };
    return {
      schemaVersion: state.schemaVersion,
      contentVersion: state.contentVersion,
      money: state.resources.money,
      computeAllocation: state.computeAllocation,
      memoryReserve: state.memoryReserve,
      jobs: state.jobs,
      eventSequence: state.eventSequence,
      ledger: state.ledger,
    };
  }, SAVE_KEY);
}

async function savedProjection(page: Page): Promise<unknown> {
  return page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as {
      schemaVersion: number;
      contentVersion: string;
      resources: { money: number };
      computeAllocation: number;
      memoryReserve: number;
      jobs: unknown;
      eventSequence: number;
      ledger: unknown;
    };
    return {
      schemaVersion: state.schemaVersion,
      contentVersion: state.contentVersion,
      money: state.resources.money,
      computeAllocation: state.computeAllocation,
      memoryReserve: state.memoryReserve,
      jobs: state.jobs,
      eventSequence: state.eventSequence,
      ledger: state.ledger,
    };
  }, SAVE_KEY);
}

test.describe("atomic PWA redeployment contract", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    execFileSync(process.execPath, ["scripts/build-pwa-update-fixtures.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    await startFixtureServer();
  });

  test.afterAll(async () => {
    await stopFixtureServer();
  });

  test.afterEach(() => {
    deployment = "a";
    failedManifestScope = null;
    failedManifestRequests = 0;
    manifestFaultScope = null;
    manifestFault = null;
    manifestFaultRequests = 0;
    failedShellPath = null;
    failedShellRequests = 0;
  });

  for (const scope of SCOPES) {
    test(`installs and atomically refreshes ${scope.name} from A to B`, async ({
      page,
      context,
    }) => {
      const buildA = await fixtureBuildInfo(scope, "a");
      const buildB = await fixtureBuildInfo(scope, "b");
      expect(buildA.version).not.toBe(buildB.version);
      expect(buildA.cacheName).not.toBe(buildB.cacheName);

      await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      let stateA = await waitForPackage(page, scope, buildA);
      expectCompleteCache(stateA, scope);

      const cdp = await context.newCDPSession(page);
      const installability = await cdp.send("Page.getInstallabilityErrors");
      await cdp.detach();
      expect(installability.installabilityErrors).toEqual([]);

      const savedBeforeUpdate = await establishNonDefaultPausedSave(page);
      stateA = await waitForPackage(page, scope, buildA);
      expectCompleteCache(stateA, scope);

      const peer = await context.newPage();
      await peer.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      await waitForPackage(peer, scope, buildA);

      deployment = "b";
      await page.reload({ waitUntil: "domcontentloaded" });
      const stateB = await waitForPackage(page, scope, buildB);
      expectCompleteCache(stateB, scope);

      const peerStateB = await waitForPackage(peer, scope, buildB);
      expectCompleteCache(peerStateB, scope);
      expect(await controllerReloadMarker(page, buildB.version)).toBe("1");
      expect(await controllerReloadMarker(peer, buildB.version)).toBe("1");
      await peer.close();

      expect(await savedProjection(page)).toEqual(savedBeforeUpdate);
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      const offlineState = await waitForPackage(page, scope, buildB);
      expectCompleteCache(offlineState, scope);
      expect(await savedProjection(page)).toEqual(savedBeforeUpdate);
      await context.setOffline(false);
    });

    test(`repairs a stale ${scope.name} worker URL identity after A to B`, async ({
      page,
      context,
    }) => {
      const buildA = await fixtureBuildInfo(scope, "a");
      const buildB = await fixtureBuildInfo(scope, "b");
      await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      await waitForPackage(page, scope, buildA);

      // A static host resolves the retained `sw.js?build=A` request by
      // pathname, so B bytes can activate while the browser retains A in the
      // controller URL. The app must restore B's versioned URL before its one
      // controller-change reload; no page reload is used to initiate this.
      deployment = "b";
      await page.evaluate(async (basePath) => {
        const registration =
          await navigator.serviceWorker.getRegistration(basePath);
        if (!registration)
          throw new Error("missing service-worker registration");
        await registration.update();
      }, scope.basePath);

      const repaired = await waitForPackage(page, scope, buildB);
      expectCompleteCache(repaired, scope);
      expect(await controllerReloadMarker(page, buildB.version)).toBe("1");

      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      const offlineState = await waitForPackage(page, scope, buildB);
      expectCompleteCache(offlineState, scope);
      await context.setOffline(false);
    });

    test(`keeps ${scope.name} version A usable when version B cannot complete its cache`, async ({
      page,
      context,
    }) => {
      const buildA = await fixtureBuildInfo(scope, "a");
      await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      await waitForPackage(page, scope, buildA);

      deployment = "b";
      failedManifestScope = scope.basePath;
      await page.reload({ waitUntil: "domcontentloaded" });
      await expectActiveShell(page, scope, buildA);
      expect(failedManifestRequests).toBeGreaterThan(0);

      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      const recovered = await waitForPackage(page, scope, buildA);
      expectCompleteCache(recovered, scope);
      await context.setOffline(false);
    });

    for (const fault of [
      "omitted-null",
      "duplicate",
      "out-of-scope",
    ] as const) {
      test(`rejects ${fault} ${scope.name} manifest metadata without activating B`, async ({
        page,
        context,
      }) => {
        const buildA = await fixtureBuildInfo(scope, "a");
        await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
        await waitForPackage(page, scope, buildA);

        deployment = "b";
        manifestFaultScope = scope.basePath;
        manifestFault = fault;
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect.poll(() => manifestFaultRequests).toBeGreaterThan(0);
        await expectActiveShell(page, scope, buildA);

        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForPackage(page, scope, buildA);
        await context.setOffline(false);
      });
    }

    test(`rejects a partial ${scope.name} shell response without activating B`, async ({
      page,
      context,
    }) => {
      const buildA = await fixtureBuildInfo(scope, "a");
      await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      await waitForPackage(page, scope, buildA);

      deployment = "b";
      // build-info is a required precache response requested only by the
      // candidate worker, so this proves response completeness, not merely
      // page-resource failure handling.
      failedShellPath = `${scope.basePath}build-info.json`;
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect.poll(() => failedShellRequests).toBeGreaterThan(0);
      await expectActiveShell(page, scope, buildA);

      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForPackage(page, scope, buildA);
      await context.setOffline(false);
    });
  }

  test("root B activation never evicts the independently installed Pages A shell", async ({
    page,
    context,
  }) => {
    const root = SCOPES[0];
    const pages = SCOPES[1];
    const rootA = await fixtureBuildInfo(root, "a");
    const rootB = await fixtureBuildInfo(root, "b");
    const pagesA = await fixtureBuildInfo(pages, "a");

    await page.goto(urlFor(root), { waitUntil: "domcontentloaded" });
    await waitForPackage(page, root, rootA);
    const pagesClient = await context.newPage();
    await pagesClient.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForPackage(pagesClient, pages, pagesA);

    deployment = "b";
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForPackage(page, root, rootB);
    await expectActiveShell(pagesClient, pages, pagesA);

    await context.setOffline(true);
    await pagesClient.reload({ waitUntil: "domcontentloaded" });
    await waitForPackage(pagesClient, pages, pagesA);
    await context.setOffline(false);
    await pagesClient.close();
  });

  test("root B remains controllable when only a Pages A cache remains", async ({
    page,
    context,
  }) => {
    const root = SCOPES[0];
    const pages = SCOPES[1];
    const rootA = await fixtureBuildInfo(root, "a");
    const rootB = await fixtureBuildInfo(root, "b");
    const pagesA = await fixtureBuildInfo(pages, "a");

    await page.goto(urlFor(root), { waitUntil: "domcontentloaded" });
    await waitForPackage(page, root, rootA);
    const pagesClient = await context.newPage();
    await pagesClient.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForPackage(pagesClient, pages, pagesA);
    await pagesClient.close();

    deployment = "b";
    await page.reload({ waitUntil: "domcontentloaded" });
    const rootState = await waitForPackage(page, root, rootB);
    expectCompleteCache(rootState, root);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForPackage(page, root, rootB);
    await context.setOffline(false);
  });
});
