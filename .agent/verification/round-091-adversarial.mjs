import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const FIXTURE_ROOT = resolve(ROOT, ".cache/pwa-update");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? "42406");

const scopes = [
  { name: "root", basePath: "/" },
  { name: "pages", basePath: "/goldilocks-engine/" },
];
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};
let deployments = { root: "a", pages: "a" };
let server;

function scopeForPath(pathname) {
  return [...scopes]
    .sort((left, right) => right.basePath.length - left.basePath.length)
    .find((scope) => pathname.startsWith(scope.basePath));
}

function fixturePath(scope) {
  return resolve(FIXTURE_ROOT, `${scope.name}-${deployments[scope.name]}`);
}

function urlFor(scope) {
  return `http://${HOST}:${PORT}${scope.basePath}`;
}

async function buildInfo(scope, deployment) {
  return JSON.parse(
    await readFile(
      resolve(FIXTURE_ROOT, `${scope.name}-${deployment}`, "build-info.json"),
      "utf8",
    ),
  );
}

async function startServer() {
  server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const scope = scopeForPath(requestUrl.pathname);
    if (!scope) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }

    const fixture = fixturePath(scope);
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
      const headers = {
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

  await new Promise((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, () => {
      server.off("error", reject);
      resolveServer();
    });
  });
}

async function stopServer() {
  await new Promise((resolveServer, reject) => {
    server.close((error) => (error ? reject(error) : resolveServer()));
  });
}

async function readIdentity(page, scope) {
  return page.evaluate(async (basePath) => {
    const controller = navigator.serviceWorker.controller;
    const controllerBuild = controller
      ? new URL(controller.scriptURL).searchParams.get("build")
      : null;
    const workerBuild = controller
      ? await new Promise((resolveMessage) => {
          const channel = new MessageChannel();
          const timeout = window.setTimeout(() => {
            channel.port1.close();
            resolveMessage(null);
          }, 2_000);
          channel.port1.onmessage = (event) => {
            window.clearTimeout(timeout);
            channel.port1.close();
            const data = event.data;
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
    const reloadMarker = controllerBuild
      ? sessionStorage.getItem(
          `goldilocks-pwa-controller-version:${controllerBuild}`,
        )
      : null;
    return {
      appVersion: document.documentElement.dataset.appVersion ?? null,
      controllerBuild,
      workerBuild,
      cacheNames: cacheNames
        .filter((name) => name.startsWith(`goldilocks-shell:${basePath}:`))
        .sort(),
      reloadMarker,
    };
  }, scope.basePath);
}

async function waitForIdentity(page, scope, expected, label) {
  const deadline = Date.now() + 20_000;
  let actual;
  while (Date.now() < deadline) {
    try {
      actual = await readIdentity(page, scope);
      if (JSON.stringify(actual) === JSON.stringify(expected)) return actual;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("Execution context was destroyed") &&
        !message.includes("Failed to fetch")
      )
        throw error;
    }
    await page.waitForTimeout(50);
  }
  throw new Error(
    `${label} identity did not settle: ${JSON.stringify(actual)}`,
  );
}

async function confirmActiveWorker(page, scope, expectedBuild) {
  await page.evaluate(
    async ({ basePath, expected }) => {
      const registration =
        await navigator.serviceWorker.getRegistration(basePath);
      const active = registration?.active;
      if (
        !active ||
        active.state !== "activated" ||
        navigator.serviceWorker.controller !== active
      )
        throw new Error("nested worker was not active and controlling");
      await new Promise((resolveMessage, reject) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
          channel.port1.close();
          reject(new Error("nested worker did not answer"));
        }, 2_000);
        channel.port1.onmessage = (event) => {
          window.clearTimeout(timeout);
          channel.port1.close();
          if (event.data?.buildId !== expected)
            reject(new Error("nested worker identity mismatch"));
          else resolveMessage();
        };
        active.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [channel.port2]);
      });
    },
    { basePath: scope.basePath, expected: expectedBuild },
  );
  await page.waitForLoadState("networkidle");
}

function expected(build, marker) {
  return {
    appVersion: build.version,
    controllerBuild: build.version,
    workerBuild: build.version,
    cacheNames: [build.cacheName],
    reloadMarker: marker,
  };
}

function observeErrors(page, errors) {
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(`${label} has horizontal overflow`);
}

async function mixedLifecycle(browser, viewport, repetition) {
  deployments = { root: "a", pages: "a" };
  const root = scopes[0];
  const pages = scopes[1];
  const rootA = await buildInfo(root, "a");
  const rootB = await buildInfo(root, "b");
  const pagesA = await buildInfo(pages, "a");
  const context = await browser.newContext({
    hasTouch: true,
    locale: "en-US",
    serviceWorkers: "allow",
    timezoneId: "Europe/Bucharest",
    viewport,
  });
  const rootPage = await context.newPage();
  const pagesPage = await context.newPage();
  const errors = [];
  observeErrors(rootPage, errors);
  observeErrors(pagesPage, errors);

  try {
    await rootPage.goto(urlFor(root), { waitUntil: "domcontentloaded" });
    await waitForIdentity(rootPage, root, expected(rootA, null), "root A");
    await rootPage.evaluate(() =>
      localStorage.setItem("round-091-independent", "preserve"),
    );

    await pagesPage.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForIdentity(pagesPage, pages, expected(pagesA, null), "Pages A");
    // Explicitly drain the nested worker's activation event before the root
    // update. This is an independent lifecycle handshake, not a fixed delay.
    await confirmActiveWorker(pagesPage, pages, pagesA.version);

    // Static-host adversarial boundary: the server serves B worker bytes for
    // the retained A-query URL. Final identity must agree across app,
    // controller URL, worker message, cache, and one reload marker.
    deployments.root = "b";
    await rootPage.evaluate(async (basePath) => {
      const registration =
        await navigator.serviceWorker.getRegistration(basePath);
      if (!registration) throw new Error("root registration missing");
      await registration.update();
    }, root.basePath);
    await waitForIdentity(rootPage, root, expected(rootB, "1"), "root B");
    await waitForIdentity(
      pagesPage,
      pages,
      expected(pagesA, null),
      "Pages A after root B",
    );
    if (
      (await rootPage.evaluate(() =>
        localStorage.getItem("round-091-independent"),
      )) !== "preserve"
    )
      throw new Error("root localStorage was not preserved");
    await assertNoHorizontalOverflow(rootPage, `root ${viewport.width}`);
    await assertNoHorizontalOverflow(pagesPage, `Pages ${viewport.width}`);

    // Lifecycle neighbor: remove the live nested client, then prove that its
    // complete scoped cache can still restore the Pages A shell offline.
    await pagesPage.close();
    await context.setOffline(true);
    const offlinePages = await context.newPage();
    observeErrors(offlinePages, errors);
    await offlinePages.goto(urlFor(pages), { waitUntil: "domcontentloaded" });
    await waitForIdentity(
      offlinePages,
      pages,
      expected(pagesA, null),
      "Pages A offline restart",
    );
    await offlinePages.close();
    await context.setOffline(false);
    if (errors.length) throw new Error(`browser errors: ${errors.join(" | ")}`);
  } finally {
    await context.close();
  }
  return { repetition, viewport, result: "pass" };
}

execFileSync(process.execPath, ["scripts/build-pwa-update-fixtures.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  await startServer();
  for (const viewport of [
    { width: 320, height: 693 },
    { width: 393, height: 742 },
  ]) {
    for (let repetition = 1; repetition <= 2; repetition += 1)
      results.push(await mixedLifecycle(browser, viewport, repetition));
  }
} finally {
  await browser.close();
  if (server) await stopServer();
}

console.log(JSON.stringify({ results }, null, 2));
