import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APP_VERSION } from "virtual:goldilocks-build-info";
import { App } from "./ui/App";
import { setOfflineShellReady } from "./ui/offlineReadiness";
import "./ui/styles.css";

const CONTROLLER_RELOAD_PREFIX = "goldilocks-pwa-controller-version:";

function workerBuildId(
  worker: ServiceWorker | null,
  workerUrl: URL,
): string | null {
  if (!worker) return null;
  const url = new URL(worker.scriptURL);
  if (url.pathname !== workerUrl.pathname) return null;
  return url.searchParams.get("build");
}

function currentCacheName(baseUrl: URL): string {
  return `goldilocks-shell:${baseUrl.pathname}:${APP_VERSION}`;
}

async function hasCompleteCurrentShell(baseUrl: URL): Promise<boolean> {
  const cacheName = currentCacheName(baseUrl);
  if (!(await caches.keys()).includes(cacheName)) return false;
  const cache = await caches.open(cacheName);
  const assetManifestUrl = new URL("asset-manifest.json", baseUrl).toString();
  const buildInfoUrl = new URL("build-info.json", baseUrl).toString();
  const [shell, metadata, assetManifest] = await Promise.all([
    cache.match(baseUrl.toString()),
    cache.match(buildInfoUrl),
    cache.match(assetManifestUrl),
  ]);
  if (!shell || !metadata || !assetManifest) return false;

  try {
    const [buildInfo, assets] = await Promise.all([
      metadata.clone().json() as Promise<{
        version?: unknown;
        scope?: unknown;
        cacheName?: unknown;
      }>,
      assetManifest.clone().json() as Promise<unknown>,
    ]);
    if (
      buildInfo.version !== APP_VERSION ||
      buildInfo.scope !== baseUrl.pathname ||
      buildInfo.cacheName !== cacheName ||
      !Array.isArray(assets)
    )
      return false;

    const urls = [
      baseUrl.toString(),
      new URL("manifest.webmanifest", baseUrl).toString(),
      new URL("icon.svg", baseUrl).toString(),
      assetManifestUrl,
      buildInfoUrl,
    ];
    for (const asset of assets) {
      if (typeof asset !== "string") return false;
      const url = new URL(asset, window.location.origin);
      if (
        url.origin !== window.location.origin ||
        !url.pathname.startsWith(baseUrl.pathname) ||
        url.search ||
        url.hash
      )
        return false;
      urls.push(url.toString());
    }
    if (new Set(urls).size !== urls.length) return false;
    return (await Promise.all(urls.map((url) => cache.match(url)))).every(
      Boolean,
    );
  } catch {
    return false;
  }
}

function reloadOnceForController(buildId: string): void {
  const key = `${CONTROLLER_RELOAD_PREFIX}${buildId}`;
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage denial must not turn a worker update into a reload loop.
    return;
  }
  window.location.reload();
}

async function registerPwa(): Promise<void> {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const workerUrl = new URL("sw.js", baseUrl);
  workerUrl.searchParams.set("build", APP_VERSION);
  // A first install necessarily changes control from no worker to this worker.
  // Reloading then destroys the first page's startup context. Only reload a
  // client that was already controlled, which means this is a real redeploy.
  const controllerAtRegistrationStart = navigator.serviceWorker.controller;
  const hadControllerAtRegistrationStart = Boolean(
    controllerAtRegistrationStart,
  );
  const controllerBuildAtRegistrationStart = workerBuildId(
    controllerAtRegistrationStart,
    workerUrl,
  );

  const refreshReadiness = async (): Promise<void> => {
    const controllerMatchesBuild =
      workerBuildId(navigator.serviceWorker.controller, workerUrl) ===
      APP_VERSION;
    setOfflineShellReady(
      controllerMatchesBuild && (await hasCompleteCurrentShell(baseUrl)),
    );
  };
  const reloadForChangedController = (): void => {
    const controllerBuild = workerBuildId(
      navigator.serviceWorker.controller,
      workerUrl,
    );
    if (!controllerBuild) return;
    void refreshReadiness();
    // Do not interrupt first install. A client already controlled by a
    // different worker reloads exactly once for the newly active build.
    if (
      hadControllerAtRegistrationStart &&
      controllerBuild !== controllerBuildAtRegistrationStart
    )
      reloadOnceForController(controllerBuild);
  };
  // Attach before register(): an update can install and claim very quickly.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    reloadForChangedController();
  });

  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: baseUrl.pathname,
    updateViaCache: "none",
  });

  try {
    await registration.update();
  } catch {
    // Offline reloads retain the last complete shell and cannot check a deploy.
  }
  await navigator.serviceWorker.ready;
  await refreshReadiness();
  // Covers a controller transition that completed before the browser
  // dispatched its event to this document.
  reloadForChangedController();
}

document.documentElement.dataset.appVersion = APP_VERSION;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    setOfflineShellReady(false);
    void registerPwa().catch(() => {
      setOfflineShellReady(false);
    });
  });
}
