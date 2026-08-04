const BUILD_ID = "__GOLDILOCKS_BUILD_ID__";
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_NAMESPACE = `goldilocks-shell:${SCOPE_URL.pathname}:`;
const CACHE = `${CACHE_NAMESPACE}${BUILD_ID}`;
// Generated from this exact build's Rollup output. The remotely fetched
// manifest is metadata to verify, never authority to expand the cache.
const EXPECTED_ASSETS = JSON.parse(
  String.raw`__GOLDILOCKS_EXPECTED_ASSETS_JSON__`,
);

function scopedUrl(path = "") {
  return new URL(path, SCOPE_URL).toString();
}

function scopedAssetUrl(value) {
  if (typeof value !== "string")
    throw new Error("Asset manifest entry is not a string");
  const url = new URL(value, self.location.origin);
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(SCOPE_URL.pathname) ||
    url.search ||
    url.hash
  )
    throw new Error("Asset manifest entry escapes this deployment scope");
  return url.toString();
}

const CORE = [
  scopedUrl(),
  scopedUrl("manifest.webmanifest"),
  scopedUrl("icon.svg"),
  scopedUrl("asset-manifest.json"),
  scopedUrl("build-info.json"),
];

const EXPECTED_ASSET_URLS = EXPECTED_ASSETS.map(scopedAssetUrl);

function cacheScope(cacheName) {
  if (!cacheName.startsWith("goldilocks-shell:")) return null;
  const buildSeparator = cacheName.lastIndexOf(":");
  if (buildSeparator <= "goldilocks-shell:".length) return null;
  return cacheName.slice("goldilocks-shell:".length, buildSeparator);
}

function nestedGoldilocksScopes(cacheNames) {
  return cacheNames.flatMap((cacheName) => {
    const scope = cacheScope(cacheName);
    return scope !== null &&
      scope !== SCOPE_URL.pathname &&
      scope.startsWith(SCOPE_URL.pathname)
      ? [scope]
      : [];
  });
}

async function hasLiveNestedGoldilocksClient(cacheNames) {
  const nestedScopes = nestedGoldilocksScopes(cacheNames);
  if (nestedScopes.length === 0) return false;
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  return clients.some((client) => {
    const pathname = new URL(client.url).pathname;
    return nestedScopes.some((scope) => pathname.startsWith(scope));
  });
}

function assertExactAssetManifest(manifest) {
  if (!Array.isArray(manifest)) throw new Error("Asset manifest is malformed");
  if (manifest.length !== EXPECTED_ASSET_URLS.length)
    throw new Error("Asset manifest has an unexpected number of entries");

  const actual = manifest.map(scopedAssetUrl);
  if (new Set(actual).size !== actual.length)
    throw new Error("Asset manifest contains duplicate entries");

  for (let index = 0; index < EXPECTED_ASSET_URLS.length; index += 1) {
    if (actual[index] !== EXPECTED_ASSET_URLS[index])
      throw new Error("Asset manifest does not match this worker build");
  }

  return actual;
}

async function fetchRequired(request) {
  const response = await fetch(request);
  if (!response.ok || response.type === "opaque")
    throw new Error(`Required shell asset failed: ${request.url}`);
  // Fully consume each network response before requesting the next one. Keeping
  // several unread bodies open can exhaust a browser's per-origin connection
  // pool during install and strand the transaction before cache validation.
  const cacheableResponse = response.clone();
  await response.arrayBuffer();
  return cacheableResponse;
}

async function assertBuildInfo(response) {
  let buildInfo;
  try {
    buildInfo = await response.clone().json();
  } catch {
    throw new Error("Build metadata is malformed");
  }

  if (
    !buildInfo ||
    buildInfo.version !== BUILD_ID ||
    buildInfo.scope !== SCOPE_URL.pathname ||
    buildInfo.cacheName !== CACHE
  )
    throw new Error("Build metadata does not match this worker build");
}

function requiredResponse(responses, url) {
  const response = responses.get(url);
  if (!response) throw new Error(`Required shell response is missing: ${url}`);
  return response;
}

async function precacheCompleteShell() {
  const manifestUrl = scopedUrl("asset-manifest.json");
  const manifestResponse = await fetchRequired(
    new Request(scopedUrl("asset-manifest.json"), { cache: "no-store" }),
  );
  let manifest;
  try {
    manifest = await manifestResponse.clone().json();
  } catch {
    throw new Error("Asset manifest is malformed");
  }
  const assets = assertExactAssetManifest(manifest);
  const urls = [...CORE, ...assets];
  if (new Set(urls).size !== urls.length)
    throw new Error("Shell asset set contains duplicates");

  // Fetch and validate every response before opening the candidate cache.
  // A partial response can therefore never activate or evict the old shell.
  const responses = new Map([[manifestUrl, manifestResponse]]);
  for (const url of urls) {
    if (url === manifestUrl) continue;
    responses.set(
      url,
      await fetchRequired(new Request(url, { cache: "reload" })),
    );
  }
  await assertBuildInfo(
    requiredResponse(responses, scopedUrl("build-info.json")),
  );

  try {
    const cache = await caches.open(CACHE);
    await Promise.all(
      urls.map(async (url) => {
        await cache.put(url, requiredResponse(responses, url));
      }),
    );
    const cached = await Promise.all(urls.map((url) => cache.match(url)));
    if (cached.some((response) => !response))
      throw new Error("Candidate shell cache is incomplete");
  } catch (error) {
    await caches.delete(CACHE);
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheCompleteShell()
      .then(() => self.skipWaiting())
      .catch(async (error) => {
        await caches.delete(CACHE);
        console.error("Goldilocks PWA install rejected", error);
        throw error;
      }),
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
      // `clients.claim()` applies to every client under this scope. A root
      // worker would otherwise take over an independently installed, more
      // specific Pages client at `/goldilocks-engine/`. Preserve a live nested
      // client with its complete shell; a stale nested cache alone must not
      // stop the root worker from controlling a new root install. The root
      // page observes its registration activation and reloads without a global
      // claim when a nested client is present.
      if (!(await hasLiveNestedGoldilocksClient(cacheNames)))
        await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "GOLDILOCKS_PWA_VERSION") {
    event.ports[0]?.postMessage({ buildId: BUILD_ID, cacheName: CACHE });
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
