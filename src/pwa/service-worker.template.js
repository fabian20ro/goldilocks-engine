const BUILD_ID = "__GOLDLOCKS_BUILD_ID__";
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_NAMESPACE = `goldilocks-shell:${SCOPE_URL.pathname}:`;
const CACHE = `${CACHE_NAMESPACE}${BUILD_ID}`;

function scopedUrl(path = "") {
  return new URL(path, SCOPE_URL).toString();
}

function scopedAssetUrl(value) {
  if (typeof value !== "string") return null;
  const url = new URL(value, self.location.origin);
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(SCOPE_URL.pathname)
  )
    return null;
  return url.toString();
}

const CORE = [
  scopedUrl(),
  scopedUrl("manifest.webmanifest"),
  scopedUrl("icon.svg"),
  scopedUrl("asset-manifest.json"),
  scopedUrl("build-info.json"),
];

async function precacheCompleteShell() {
  const manifestResponse = await fetch(
    new Request(scopedUrl("asset-manifest.json"), { cache: "no-store" }),
  );
  if (!manifestResponse.ok)
    throw new Error(`Asset manifest failed: ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  if (!Array.isArray(manifest)) throw new Error("Asset manifest is malformed");

  const assets = manifest.map(scopedAssetUrl).filter(Boolean);
  const urls = [...new Set([...CORE, ...assets])];
  const cache = await caches.open(CACHE);

  try {
    await cache.addAll(
      urls.map((url) => new Request(url, { cache: "reload" })),
    );
  } catch (error) {
    await caches.delete(CACHE);
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precacheCompleteShell();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_NAMESPACE) && name !== CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "GOLDLOCKS_PWA_VERSION") {
    event.ports[0]?.postMessage({ buildId: BUILD_ID, cacheName: CACHE });
    return;
  }
  if (event.data.type === "GOLDLOCKS_PWA_ACTIVATE") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !requestUrl.pathname.startsWith(SCOPE_URL.pathname)
  )
    return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return (await cache.match(scopedUrl())) ?? Response.error();
        return Response.error();
      }
    })(),
  );
});
