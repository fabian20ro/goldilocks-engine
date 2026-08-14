import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, relative, resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = resolve(process.cwd());
const FIXTURE_ROOT = resolve(ROOT, ".cache/pwa-update");
const HOST = "127.0.0.1";
const PORT = 4184;

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
  readonly offlineReady: string | null;
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

function fixtureDirectory(scope: ScopeDefinition): string {
  return resolve(FIXTURE_ROOT, `${scope.name}-${deployments[scope.name]}`);
}

function urlFor(scope: ScopeDefinition): string {
  return `http://${HOST}:${PORT}${scope.basePath}`;
}

async function readBuild(
  scope: ScopeDefinition,
  deployment: Deployment,
): Promise<BuildInfo> {
  return JSON.parse(
    await readFile(
      resolve(FIXTURE_ROOT, `${scope.name}-${deployment}`, "build-info.json"),
      "utf8",
    ),
  ) as BuildInfo;
}

async function startFixtureServer(): Promise<void> {
  server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const scope = scopeForPath(requestUrl.pathname);
    if (!scope) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    const fixture = fixtureDirectory(scope);
    const requested =
      requestUrl.pathname.slice(scope.basePath.length) || "index.html";
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
      if (requestUrl.pathname.endsWith("/sw.js"))
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
    const controllerBuild = controller
      ? new URL(controller.scriptURL).searchParams.get("build")
      : null;
    const workerBuild = controller
      ? await new Promise<string | null>((resolveMessage) => {
          const channel = new MessageChannel();
          const timeout = window.setTimeout(() => {
            channel.port1.close();
            resolveMessage(null);
          }, 2_000);
          channel.port1.onmessage = (event) => {
            window.clearTimeout(timeout);
            channel.port1.close();
            const data = event.data as { buildId?: unknown } | null;
            resolveMessage(
              data && typeof data.buildId === "string" ? data.buildId : null,
            );
          };
          controller.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [
            channel.port2,
          ]);
        })
      : null;
    const cacheNames = await caches.keys();
    return {
      appVersion: document.documentElement.dataset.appVersion ?? null,
      offlineReady: document.documentElement.dataset.offlineReady ?? null,
      controllerBuild,
      workerBuild,
      cacheNames: cacheNames
        .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
        .sort(),
      reloadMarker: controllerBuild
        ? sessionStorage.getItem(
            `goldilocks-pwa-controller-version:${controllerBuild}`,
          )
        : null,
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

async function settleControlledWorker(
  page: Page,
  scope: ScopeDefinition,
  expected: BuildInfo,
): Promise<void> {
  await page.evaluate(
    async ({ basePath, expectedBuild }) => {
      const registration =
        await navigator.serviceWorker.getRegistration(basePath);
      const active = registration?.active;
      if (
        !active ||
        active.state !== "activated" ||
        navigator.serviceWorker.controller !== active
      )
        throw new Error("controlled worker is not fully active");

      await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
          channel.port1.close();
          reject(new Error("controlled worker did not answer"));
        }, 2_000);
        channel.port1.onmessage = (event) => {
          window.clearTimeout(timeout);
          channel.port1.close();
          const data = event.data as { buildId?: unknown } | null;
          if (data?.buildId !== expectedBuild) {
            reject(new Error("controlled worker identity is not settled"));
            return;
          }
          resolve();
        };
        active.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [channel.port2]);
      });
    },
    { basePath: scope.basePath, expectedBuild: expected.version },
  );
  await page.waitForLoadState("networkidle");
}

function expectedIdentity(build: BuildInfo, marker: string | null): Identity {
  return {
    appVersion: build.version,
    offlineReady: "true",
    controllerBuild: build.version,
    workerBuild: build.version,
    cacheNames: [build.cacheName],
    reloadMarker: marker,
  };
}

test.describe("verifier round 029: live nested shell during stale-URL repair", () => {
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

  test("repairs root A-query/B-body while a live Pages A shell remains isolated", async ({
    page,
    context,
  }) => {
    const root = SCOPES[0];
    const pages = SCOPES[1];
    const rootA = await readBuild(root, "a");
    const rootB = await readBuild(root, "b");
    const pagesA = await readBuild(pages, "a");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(urlFor(root), { waitUntil: "domcontentloaded" });
    await waitForIdentity(page, root, expectedIdentity(rootA, null));
    await page.evaluate(() =>
      localStorage.setItem("verifier-round-029", "keep"),
    );

    const pagesClient = await context.newPage();
    await pagesClient.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForIdentity(pagesClient, pages, expectedIdentity(pagesA, null));
    // Let the controlled Pages client settle before the root worker's activate
    // handler snapshots nested clients. This is a fixture lifecycle barrier,
    // not a product delay: the assertion below still requires Pages A to stay
    // isolated through the mixed-version update and offline reload.
    await settleControlledWorker(pagesClient, pages, pagesA);

    // The server deliberately ignores the retained A query, like a static host:
    // root's A registration therefore receives B worker bytes while Pages A is
    // alive. The root page must repair the URL/worker/cache identity itself.
    deployments.root = "b";
    await page.evaluate(async (basePath) => {
      const registration =
        await navigator.serviceWorker.getRegistration(basePath);
      if (!registration) throw new Error("missing root registration");
      await registration.update();
    }, root.basePath);

    await waitForIdentity(page, root, expectedIdentity(rootB, "1"));
    await expect(
      page.evaluate(() => localStorage.getItem("verifier-round-029")),
    ).resolves.toBe("keep");
    await waitForIdentity(pagesClient, pages, expectedIdentity(pagesA, null));

    await context.setOffline(true);
    await pagesClient.reload({ waitUntil: "domcontentloaded" });
    await waitForIdentity(pagesClient, pages, expectedIdentity(pagesA, null));
    await context.setOffline(false);
    await pagesClient.close();
    expect(errors).toEqual([]);
  });
});
