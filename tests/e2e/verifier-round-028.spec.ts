import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, relative, resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = resolve(process.cwd());
const FIXTURE_ROOT = resolve(ROOT, ".cache/pwa-update");
const HOST = "127.0.0.1";
const PORT = 4183;

type Deployment = "a" | "b";

interface ScopeDefinition {
  readonly name: "root" | "pages";
  readonly basePath: string;
}

interface BuildInfo {
  readonly version: string;
  readonly cacheName: string;
}

interface Identity {
  readonly appVersion: string | null;
  readonly controllerBuild: string | null;
  readonly workerBuild: string | null;
  readonly cacheNames: readonly string[];
  readonly reloadMarker: string | null;
}

const SCOPES: readonly ScopeDefinition[] = [
  { name: "root", basePath: "/" },
  { name: "pages", basePath: "/goldilocks-engine/" },
];

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

let deployments: Record<ScopeDefinition["name"], Deployment> = {
  root: "a",
  pages: "a",
};
let server: Server;

function scopeForPath(pathname: string): ScopeDefinition | null {
  return (
    [...SCOPES]
      .sort((left, right) => right.basePath.length - left.basePath.length)
      .find((scope) => pathname.startsWith(scope.basePath)) ?? null
  );
}

function fixtureDirectory(
  scope: ScopeDefinition,
  deployment = deployments[scope.name],
): string {
  return resolve(FIXTURE_ROOT, scope.name + "-" + deployment);
}

function urlFor(scope: ScopeDefinition): string {
  return "http://" + HOST + ":" + PORT + scope.basePath;
}

async function buildInfo(
  scope: ScopeDefinition,
  deployment: Deployment,
): Promise<BuildInfo> {
  return JSON.parse(
    await readFile(
      resolve(fixtureDirectory(scope, deployment), "build-info.json"),
      "utf8",
    ),
  ) as BuildInfo;
}

async function startFixtureServer(): Promise<void> {
  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://" + HOST + ":" + PORT);
    const scope = scopeForPath(url.pathname);
    if (!scope) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    const fixture = fixtureDirectory(scope);
    const requested = url.pathname.slice(scope.basePath.length) || "index.html";
    const file = resolve(fixture, requested);
    if (relative(fixture, file).startsWith("..") || file === fixture) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    try {
      const body = await readFile(file);
      const headers: Record<string, string> = {
        "Cache-Control": "no-store",
        "Content-Type":
          CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      };
      if (url.pathname.endsWith("/sw.js"))
        headers["Service-Worker-Allowed"] = scope.basePath;
      response.writeHead(200, headers);
      response.end(body);
    } catch {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
    }
  });

  await new Promise<void>((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, () => {
      server.off("error", reject);
      resolveServer();
    });
  });
}

async function stopFixtureServer(): Promise<void> {
  await new Promise<void>((resolveServer, reject) => {
    server.close((error) => (error ? reject(error) : resolveServer()));
  });
}

async function identity(page: Page, scope: ScopeDefinition): Promise<Identity> {
  return page.evaluate(async (basePath) => {
    const controller = navigator.serviceWorker.controller;
    const message = controller
      ? await new Promise<{ buildId?: unknown } | null>((resolveMessage) => {
          const channel = new MessageChannel();
          const timeout = window.setTimeout(() => resolveMessage(null), 2_000);
          channel.port1.onmessage = (event) => {
            window.clearTimeout(timeout);
            resolveMessage(event.data);
          };
          controller.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [
            channel.port2,
          ]);
        })
      : null;
    const cacheNames = await caches.keys();
    const controllerBuild = controller
      ? new URL(controller.scriptURL).searchParams.get("build")
      : null;
    const prefix = "goldilocks-shell:" + basePath + ":";
    const marker = controllerBuild
      ? sessionStorage.getItem(
          "goldilocks-pwa-controller-version:" + controllerBuild,
        )
      : null;
    return {
      appVersion: document.documentElement.dataset.appVersion ?? null,
      controllerBuild,
      workerBuild:
        message && typeof message.buildId === "string" ? message.buildId : null,
      cacheNames: cacheNames.filter((name) => name.startsWith(prefix)).sort(),
      reloadMarker: marker,
    };
  }, scope.basePath);
}

async function waitForIdentity(
  page: Page,
  scope: ScopeDefinition,
  expected: Identity,
): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          return await identity(page, scope);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (
            message.includes("Execution context was destroyed") ||
            message.includes("Failed to fetch")
          )
            return null;
          throw error;
        }
      },
      { timeout: 20_000 },
    )
    .toEqual(expected);
}

test.describe("verifier round 028: stale worker URL identity", () => {
  test.setTimeout(60_000);

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

  test.beforeEach(() => {
    deployments = { root: "a", pages: "a" };
  });

  for (const scope of SCOPES) {
    test(
      "converges an already-open " + scope.name + " client after A to B",
      async ({ page, context }) => {
        const buildA = await buildInfo(scope, "a");
        const buildB = await buildInfo(scope, "b");

        await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
        await waitForIdentity(page, scope, {
          appVersion: buildA.version,
          controllerBuild: buildA.version,
          workerBuild: buildA.version,
          cacheNames: [buildA.cacheName],
          reloadMarker: null,
        });

        deployments[scope.name] = "b";
        await page.evaluate(async (basePath) => {
          const registration =
            await navigator.serviceWorker.getRegistration(basePath);
          if (!registration)
            throw new Error("missing service-worker registration");
          await registration.update();
        }, scope.basePath);

        await waitForIdentity(page, scope, {
          appVersion: buildB.version,
          controllerBuild: buildB.version,
          workerBuild: buildB.version,
          cacheNames: [buildB.cacheName],
          reloadMarker: "1",
        });

        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitForIdentity(page, scope, {
          appVersion: buildB.version,
          controllerBuild: buildB.version,
          workerBuild: buildB.version,
          cacheNames: [buildB.cacheName],
          reloadMarker: "1",
        });
        await context.setOffline(false);
      },
    );
  }
});
