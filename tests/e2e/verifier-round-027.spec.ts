import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, relative, resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = resolve(process.cwd());
const FIXTURE_ROOT = resolve(ROOT, ".cache/pwa-update");
const HOST = "127.0.0.1";
const PORT = 4182;

type Deployment = "a" | "b";

interface ScopeDefinition {
  readonly name: "root" | "pages";
  readonly basePath: string;
}

interface BuildInfo {
  readonly version: string;
  readonly cacheName: string;
}

interface WorkerState {
  readonly controllerPath: string | null;
  readonly controllerBuild: string | null;
  readonly scopedCaches: readonly string[];
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

let deployments: Record<ScopeDefinition["name"], Deployment> = {
  root: "a",
  pages: "a",
};
let malformedManifestScope: ScopeDefinition["name"] | null = null;
let malformedManifestRequests = 0;
let server: Server;

function resetDeployments(): void {
  deployments = { root: "a", pages: "a" };
  malformedManifestScope = null;
  malformedManifestRequests = 0;
}

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
  return resolve(FIXTURE_ROOT, `${scope.name}-${deployment}`);
}

function fileForRequest(pathname: string): {
  scope: ScopeDefinition;
  file: string;
} | null {
  const scope = scopeForPath(pathname);
  if (!scope) return null;
  const fixture = fixtureDirectory(scope);
  const requested = pathname.slice(scope.basePath.length) || "index.html";
  const file = resolve(fixture, requested);
  if (relative(fixture, file).startsWith("..") || file === fixture) return null;
  return { scope, file };
}

function urlFor(scope: ScopeDefinition): string {
  return `http://${HOST}:${PORT}${scope.basePath}`;
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

async function workerState(
  page: Page,
  scope: ScopeDefinition,
): Promise<WorkerState> {
  return page.evaluate(async (basePath) => {
    const controller = navigator.serviceWorker.controller;
    const names = await caches.keys();
    return {
      controllerPath: controller
        ? new URL(controller.scriptURL).pathname
        : null,
      controllerBuild: controller
        ? new URL(controller.scriptURL).searchParams.get("build")
        : null,
      scopedCaches: names
        .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
        .sort(),
    };
  }, scope.basePath);
}

async function waitForWorker(
  page: Page,
  scope: ScopeDefinition,
  expected: BuildInfo,
  timeout = 15_000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          return await workerState(page, scope);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (message.includes("Execution context was destroyed")) return null;
          throw error;
        }
      },
      { timeout },
    )
    .toEqual({
      controllerPath: `${scope.basePath}sw.js`,
      controllerBuild: expected.version,
      scopedCaches: [expected.cacheName],
    });
}

async function startFixtureServer(): Promise<void> {
  server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const fileRequest = fileForRequest(requestUrl.pathname);
    if (!fileRequest) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    const { scope, file } = fileRequest;
    try {
      let body = await readFile(file);
      if (
        malformedManifestScope === scope.name &&
        deployments[scope.name] === "b" &&
        requestUrl.pathname === `${scope.basePath}asset-manifest.json`
      ) {
        malformedManifestRequests += 1;
        const manifest = JSON.parse(body.toString("utf8")) as unknown[];
        const partialManifest = manifest.filter(
          (entry) =>
            !(
              typeof entry === "string" &&
              entry.includes("/assets/index-") &&
              entry.endsWith(".js")
            ),
        );
        // This is both malformed metadata and an incomplete shell: it omits
        // index.html's required application script, then adds a non-string.
        body = Buffer.from(JSON.stringify([...partialManifest, null]));
      }
      const headers: Record<string, string> = {
        "Cache-Control": "no-store",
        "Content-Type":
          contentTypes[extname(file)] ?? "application/octet-stream",
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

test.describe("verifier round 027: redeploy safety boundaries", () => {
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

  test.afterEach(() => {
    resetDeployments();
  });

  for (const scope of SCOPES) {
    test(`rejects malformed ${scope.name} deployment metadata without activation`, async ({
      page,
      context,
    }) => {
      const buildA = await buildInfo(scope, "a");

      await page.goto(urlFor(scope), { waitUntil: "domcontentloaded" });
      await waitForWorker(page, scope, buildA);

      deployments[scope.name] = "b";
      malformedManifestScope = scope.name;
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect.poll(() => malformedManifestRequests).toBeGreaterThan(0);
      await page.waitForTimeout(1_000);

      // A malformed B manifest must leave the active worker/cache at A.
      await waitForWorker(page, scope, buildA, 5_000);

      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForWorker(page, scope, buildA);
      await context.setOffline(false);
    });
  }

  test("root redeploy retains the independently installed Pages shell", async ({
    page,
    context,
  }) => {
    const root = SCOPES[0];
    const pages = SCOPES[1];
    const rootA = await buildInfo(root, "a");
    const rootB = await buildInfo(root, "b");
    const pagesA = await buildInfo(pages, "a");

    await page.goto(urlFor(root), { waitUntil: "domcontentloaded" });
    await waitForWorker(page, root, rootA);

    const pagesClient = await context.newPage();
    await pagesClient.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForWorker(pagesClient, pages, pagesA);

    deployments.root = "b";
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForWorker(page, root, rootB);
    await waitForWorker(pagesClient, pages, pagesA);

    await pagesClient.close();
  });
});
