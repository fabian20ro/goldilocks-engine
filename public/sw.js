const CACHE = "goldilocks-shell-v2";
const CORE = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      let assets = [];
      try {
        const response = await fetch("/asset-manifest.json");
        if (response.ok) assets = await response.json();
      } catch {
        // Development mode has no generated manifest; cache the core shell.
      }
      const cache = await caches.open(CACHE);
      await cache.addAll([...CORE, ...assets]);
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
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
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
        const cached = await caches.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return (await caches.match("/")) || Response.error();
        return Response.error();
      }
    })(),
  );
});
