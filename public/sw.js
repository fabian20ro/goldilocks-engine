const SCOPE_URL = new URL(self.registration.scope);
const CACHE_NAMESPACE = `goldilocks-shell:${SCOPE_URL.pathname}:`;
const CACHE = `${CACHE_NAMESPACE}v5`;

function scopedUrl(path = "") {
  return new URL(path, SCOPE_URL).toString();
}

const CORE = [
  scopedUrl(),
  scopedUrl("manifest.webmanifest"),
  scopedUrl("icon.svg"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      let assets = [];
      try {
        const response = await fetch(scopedUrl("asset-manifest.json"));
        if (response.ok) {
          const manifest = await response.json();
          if (Array.isArray(manifest)) {
            assets = [
              scopedUrl("asset-manifest.json"),
              ...manifest
                .filter((asset) => typeof asset === "string")
                .map((asset) => new URL(asset, self.location.origin))
                .filter(
                  (asset) =>
                    asset.origin === self.location.origin &&
                    asset.pathname.startsWith(SCOPE_URL.pathname),
                )
                .map((asset) => asset.toString()),
            ];
          }
        }
      } catch {
        // Development mode has no generated manifest; cache the core shell.
      }
      const cache = await caches.open(CACHE);
      await cache.addAll([...new Set([...CORE, ...assets])]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_NAMESPACE) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin ||
    !new URL(event.request.url).pathname.startsWith(SCOPE_URL.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return (await cache.match(scopedUrl())) || Response.error();
        return Response.error();
      }
    })(),
  );
});
