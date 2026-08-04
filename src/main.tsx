import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APP_VERSION } from "virtual:goldilocks-build-info";
import { App } from "./ui/App";
import { setOfflineShellReady } from "./ui/offlineReadiness";
import "./ui/styles.css";

const CONTROLLER_RELOAD_PREFIX = "goldilocks-pwa-controller-version:";

interface WorkerVersion {
  readonly buildId: string;
  readonly cacheName: string;
}

function workerUrlForBuild(baseUrl: URL, buildId: string): URL {
  const workerUrl = new URL("sw.js", baseUrl);
  workerUrl.searchParams.set("build", buildId);
  return workerUrl;
}

function workerBuildId(
  worker: ServiceWorker | null,
  baseUrl: URL,
): string | null {
  if (!worker) return null;
  const url = new URL(worker.scriptURL);
  if (url.pathname !== new URL("sw.js", baseUrl).pathname) return null;
  if (url.searchParams.getAll("build").length !== 1) return null;
  return url.searchParams.get("build");
}

function cacheNameForBuild(baseUrl: URL, buildId: string): string {
  return `goldilocks-shell:${baseUrl.pathname}:${buildId}`;
}

function isBuildId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{20}$/.test(value);
}

async function workerVersion(
  worker: ServiceWorker,
): Promise<WorkerVersion | null> {
  return new Promise((resolveVersion) => {
    const channel = new MessageChannel();
    let settled = false;
    let timeout: number | null = null;
    const settle = (version: WorkerVersion | null): void => {
      if (settled) return;
      settled = true;
      if (timeout !== null) window.clearTimeout(timeout);
      channel.port1.close();
      resolveVersion(version);
    };
    timeout = window.setTimeout(() => settle(null), 2_000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const message = event.data;
      if (
        !message ||
        typeof message !== "object" ||
        !isBuildId((message as { buildId?: unknown }).buildId) ||
        typeof (message as { cacheName?: unknown }).cacheName !== "string"
      ) {
        settle(null);
        return;
      }
      settle({
        buildId: (message as { buildId: string }).buildId,
        cacheName: (message as { cacheName: string }).cacheName,
      });
    };
    try {
      worker.postMessage({ type: "GOLDILOCKS_PWA_VERSION" }, [channel.port2]);
    } catch {
      settle(null);
    }
  });
}

async function hasCompleteShell(
  baseUrl: URL,
  buildId: string,
): Promise<boolean> {
  const cacheName = cacheNameForBuild(baseUrl, buildId);
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
      buildInfo.version !== buildId ||
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
  const workerUrl = workerUrlForBuild(baseUrl, APP_VERSION);
  // register() performs the update check for this versioned worker URL. A
  // second explicit update while that worker is still installing can race a
  // sibling scope's initial shell and leave the candidate needlessly waiting.
  // A first install necessarily changes control from no worker to this worker.
  // Record that first verified controller without reloading its startup page;
  // every later verified build transition is a real redeploy.
  const controllerAtRegistrationStart = navigator.serviceWorker.controller;
  const controllerBuildAtRegistrationStart = workerBuildId(
    controllerAtRegistrationStart,
    baseUrl,
  );
  let observedControllerBuild = controllerBuildAtRegistrationStart;
  let reconciliationSequence = 0;
  let registrationReconciliationSequence = 0;
  let repairInFlightFor: string | null = null;
  const observedInstallingWorkers = new WeakSet<ServiceWorker>();

  const repairRegistrationIdentity = async (buildId: string): Promise<void> => {
    if (repairInFlightFor === buildId) return;
    repairInFlightFor = buildId;
    try {
      await navigator.serviceWorker.register(
        workerUrlForBuild(baseUrl, buildId),
        {
          scope: baseUrl.pathname,
          updateViaCache: "none",
        },
      );
    } catch {
      // Do not reload into a potentially incomplete deployment when its
      // versioned controller URL cannot be restored.
    } finally {
      repairInFlightFor = null;
    }
  };

  const reconcileRegistration = async (
    registration: ServiceWorkerRegistration,
  ): Promise<void> => {
    const sequence = ++registrationReconciliationSequence;
    const active = registration.active;
    if (!active) return;
    const activeBuild = workerBuildId(active, baseUrl);
    const version = await workerVersion(active);
    if (
      sequence !== registrationReconciliationSequence ||
      active !== registration.active ||
      !activeBuild ||
      !version ||
      version.cacheName !== cacheNameForBuild(baseUrl, version.buildId)
    )
      return;

    if (activeBuild !== version.buildId) {
      await repairRegistrationIdentity(version.buildId);
      return;
    }

    // Do not turn a first install into a second navigation. In particular,
    // activation can reach this listener just before `clients.claim()` has
    // dispatched controllerchange. That controller acquisition is recorded by
    // reconcileController below; only a later, already-observed deployment may
    // ask the page to converge through a reload.
    if (
      controllerBuildAtRegistrationStart === null &&
      observedControllerBuild === null
    )
      return;

    // A root worker intentionally avoids global `clients.claim()` while a
    // complete nested Pages shell exists. Its own already-open page still
    // needs to converge, so use the registration lifecycle (not polling) to
    // reload only when a different verified active build is ready.
    if (activeBuild === observedControllerBuild) return;
    const completeShell = await hasCompleteShell(baseUrl, activeBuild);
    if (
      sequence !== registrationReconciliationSequence ||
      active !== registration.active ||
      !completeShell
    )
      return;
    const controllerBuild = workerBuildId(
      navigator.serviceWorker.controller,
      baseUrl,
    );
    if (activeBuild !== controllerBuild || activeBuild !== APP_VERSION)
      reloadOnceForController(activeBuild);
  };

  const reconcileController = async (): Promise<void> => {
    const sequence = ++reconciliationSequence;
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      setOfflineShellReady(false);
      return;
    }
    const controllerBuild = workerBuildId(controller, baseUrl);
    const version = await workerVersion(controller);
    if (
      sequence !== reconciliationSequence ||
      controller !== navigator.serviceWorker.controller ||
      !controllerBuild ||
      !version ||
      version.cacheName !== cacheNameForBuild(baseUrl, version.buildId)
    ) {
      setOfflineShellReady(false);
      return;
    }

    // Static file hosts normally ignore a worker URL's query string. During an
    // A-to-B deployment Chromium can therefore execute B bytes at the retained
    // `sw.js?build=A` registration URL. The worker's embedded build/cache
    // response is the only reliable identity at this point. Re-registering B
    // under its matching URL creates one event-driven controller transition;
    // only that matching controller is allowed to reload the page.
    if (controllerBuild !== version.buildId) {
      setOfflineShellReady(false);
      await repairRegistrationIdentity(version.buildId);
      return;
    }

    const controllerMatchesApp = controllerBuild === APP_VERSION;
    const completeCurrentShell =
      controllerMatchesApp && (await hasCompleteShell(baseUrl, APP_VERSION));
    if (
      sequence !== reconciliationSequence ||
      controller !== navigator.serviceWorker.controller
    )
      return;
    setOfflineShellReady(completeCurrentShell);
    // The first controller acquired by an uncontrolled page is its initial
    // install and must not reload the startup page. Every later verified
    // controller build is a deploy transition, including one that happens
    // after that initial install has completed.
    if (observedControllerBuild === null) {
      observedControllerBuild = controllerBuild;
      if (controllerBuild !== APP_VERSION)
        reloadOnceForController(controllerBuild);
      return;
    }
    if (controllerBuild !== observedControllerBuild) {
      observedControllerBuild = controllerBuild;
      reloadOnceForController(controllerBuild);
    }
  };
  // Attach before register(): an update can install and claim very quickly.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void reconcileController();
  });

  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: baseUrl.pathname,
    updateViaCache: "none",
  });
  const observeInstallingWorker = (worker: ServiceWorker): void => {
    if (observedInstallingWorkers.has(worker)) return;
    observedInstallingWorkers.add(worker);
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated" || worker.state === "redundant")
        void reconcileRegistration(registration);
    });
  };
  const observeRegistration = (): void => {
    if (registration.installing)
      observeInstallingWorker(registration.installing);
    if (registration.waiting) observeInstallingWorker(registration.waiting);
  };
  registration.addEventListener("updatefound", observeRegistration);
  observeRegistration();

  await navigator.serviceWorker.ready;
  await reconcileRegistration(registration);
  await reconcileController();
  // Covers a controller transition that completed before the browser
  // dispatched its event to this document.
  await reconcileController();
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
