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
  const [shell, metadata] = await Promise.all([
    cache.match(baseUrl.toString()),
    cache.match(new URL("build-info.json", baseUrl).toString()),
  ]);
  return Boolean(shell && metadata);
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

function requestWaitingWorkerActivation(
  worker: ServiceWorker | null,
  workerUrl: URL,
): void {
  if (workerBuildId(worker, workerUrl) !== APP_VERSION) return;
  worker?.postMessage({ type: "GOLDLOCKS_PWA_ACTIVATE" });
}

async function registerPwa(): Promise<void> {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const workerUrl = new URL("sw.js", baseUrl);
  workerUrl.searchParams.set("build", APP_VERSION);
  // A first install necessarily changes control from no worker to this worker.
  // Reloading then destroys the first page's startup context. Only reload a
  // client that was already controlled, which means this is a real redeploy.
  const hadControllerAtRegistrationStart = Boolean(
    navigator.serviceWorker.controller,
  );
  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: baseUrl.pathname,
    updateViaCache: "none",
  });

  const refreshReadiness = async (): Promise<void> => {
    const controllerMatchesBuild =
      workerBuildId(navigator.serviceWorker.controller, workerUrl) ===
      APP_VERSION;
    setOfflineShellReady(
      controllerMatchesBuild && (await hasCompleteCurrentShell(baseUrl)),
    );
  };
  const activateWaitingWorker = (): void => {
    requestWaitingWorkerActivation(registration.waiting, workerUrl);
  };
  let activationAttempts = 0;
  let activationTimer: number | null = null;
  const stopActivationRetry = (): void => {
    if (activationTimer !== null) window.clearTimeout(activationTimer);
    activationTimer = null;
  };
  const retryWaitingWorkerActivation = (): void => {
    const controllerMatchesBuild =
      workerBuildId(navigator.serviceWorker.controller, workerUrl) ===
      APP_VERSION;
    if (controllerMatchesBuild || activationAttempts >= 80) {
      stopActivationRetry();
      return;
    }
    activationAttempts += 1;
    // `register()` can begin an update before its promise resolves. Recheck
    // briefly so an already-installing worker cannot miss the first message.
    activateWaitingWorker();
    activationTimer = window.setTimeout(retryWaitingWorkerActivation, 250);
  };
  const observeInstallingWorker = (): void => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed") activateWaitingWorker();
    });
  };

  registration.addEventListener("updatefound", observeInstallingWorker);
  observeInstallingWorker();
  activateWaitingWorker();

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const controllerBuild = workerBuildId(
      navigator.serviceWorker.controller,
      workerUrl,
    );
    if (!controllerBuild) return;
    stopActivationRetry();
    void refreshReadiness();
    if (hadControllerAtRegistrationStart && controllerBuild === APP_VERSION) {
      reloadOnceForController(controllerBuild);
    }
  });

  try {
    await registration.update();
  } catch {
    // Offline reloads retain the last complete shell and cannot check a deploy.
  }
  retryWaitingWorkerActivation();
  await navigator.serviceWorker.ready;
  await refreshReadiness();
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
