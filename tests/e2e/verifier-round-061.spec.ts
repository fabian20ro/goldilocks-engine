import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, relative, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import {
  createInitialState,
  sealSimulationState,
} from "../../src/simulation/engine";

const ROOT = resolve(process.cwd());
const VITE = resolve(ROOT, "node_modules/vite/bin/vite.js");
const FIXTURE = resolve(ROOT, ".cache/verification/verifier-round-061-pages");
const HOST = "127.0.0.1";
const ACTIVE_SCOPE = "/goldilocks-engine/";
const LEGACY_SCOPE = "/goldlocks-engine/";
const SAVE_KEY = "goldilocks-simulation-save-v4";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

let server: Server;
let origin = "";

function legacyTransferPage(): string {
  const initial = createInitialState(61_061);
  const saved = JSON.stringify(
    sealSimulationState({
      ...initial,
      resources: { ...initial.resources, money: 45 },
    }),
  );
  return `<!doctype html><script>localStorage.setItem(${JSON.stringify(
    SAVE_KEY,
  )}, ${JSON.stringify(saved)});location.replace(${JSON.stringify(
    ACTIVE_SCOPE,
  )});</script>`;
}

async function startServer(): Promise<void> {
  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", origin || `http://${HOST}`);
    if (url.pathname === `${LEGACY_SCOPE}legacy-transfer.html`) {
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      });
      response.end(legacyTransferPage());
      return;
    }

    if (!url.pathname.startsWith(ACTIVE_SCOPE)) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
      return;
    }
    const requested = url.pathname.slice(ACTIVE_SCOPE.length) || "index.html";
    const file = resolve(FIXTURE, requested);
    if (relative(FIXTURE, file).startsWith("..") || file === FIXTURE) {
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
        headers["Service-Worker-Allowed"] = ACTIVE_SCOPE;
      response.writeHead(200, headers);
      response.end(body);
    } catch {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("not found");
    }
  });

  await new Promise<void>((resolveServer, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, () => {
      server.off("error", reject);
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Verifier fixture server did not expose a TCP port"));
        return;
      }
      origin = `http://${HOST}:${address.port}`;
      resolveServer();
    });
  });
}

async function stopServer(): Promise<void> {
  await new Promise<void>((resolveServer, reject) => {
    server.close((error) => (error ? reject(error) : resolveServer()));
  });
}

test.describe("verifier round 061: publication-path compatibility", () => {
  test.beforeAll(async () => {
    execFileSync(
      process.execPath,
      [VITE, "build", "--base", ACTIVE_SCOPE, "--outDir", FIXTURE],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          GOLDILOCKS_BUILD_MARKER: "verifier-round-061",
        },
        stdio: "inherit",
      },
    );
    await startServer();
  });

  test.afterAll(async () => {
    await stopServer();
  });

  test("restores an old-path save under the active Pages path and remains offline-operable", async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });

    await page.setViewportSize({ width: 393, height: 742 });
    await Promise.all([
      page.waitForURL(`${origin}${ACTIVE_SCOPE}`, {
        waitUntil: "domcontentloaded",
      }),
      page.goto(`${origin}${LEGACY_SCOPE}legacy-transfer.html`),
    ]);
    await expect(
      page.getByRole("heading", { name: "Goldilocks Engine" }),
    ).toBeVisible();
    await page
      .locator("html[data-offline-ready='true']")
      .waitFor({ timeout: 15_000 });

    const state = await page.evaluate(async (key) => {
      const controller = navigator.serviceWorker.controller;
      const newProtocol = controller
        ? await new Promise<{ buildId?: unknown; cacheName?: unknown } | null>(
            (resolveMessage) => {
              const channel = new MessageChannel();
              const timeout = window.setTimeout(
                () => resolveMessage(null),
                2_000,
              );
              channel.port1.onmessage = (event) => {
                window.clearTimeout(timeout);
                resolveMessage(event.data);
              };
              controller.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [
                channel.port2,
              ]);
            },
          )
        : null;
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
        resources?: { money?: number };
      };
      return {
        cacheNames: await caches.keys(),
        controllerPath: controller
          ? new URL(controller.scriptURL).pathname
          : null,
        money: saved.resources?.money ?? null,
        newProtocol,
        saveKeyPresent: localStorage.getItem(key) !== null,
      };
    }, SAVE_KEY);

    expect(state.saveKeyPresent).toBe(true);
    expect(state.money).toBe(45);
    expect(state.controllerPath).toBe(`${ACTIVE_SCOPE}sw.js`);
    expect(state.newProtocol).toMatchObject({
      buildId: expect.any(String),
      cacheName: expect.stringMatching(
        /^goldilocks-shell:\/goldilocks-engine\/[a-z0-9:]*$/,
      ),
    });
    expect(
      state.cacheNames.some((name) =>
        name.startsWith("goldilocks-shell:/goldilocks-engine/:"),
      ),
    ).toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Goldilocks Engine" }),
    ).toBeVisible();
    expect(
      await page.evaluate((key) => {
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
          resources?: { money?: number };
        };
        return saved.resources?.money ?? null;
      }, SAVE_KEY),
    ).toBe(45);
    await context.setOffline(false);
    expect(errors).toEqual([]);
  });
});
