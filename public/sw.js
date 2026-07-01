// Minimal service worker: just enough for installability. The planner's
// data is realtime and always network-fresh, so we deliberately don't cache
// API/navigation responses — only the static build assets and icons get a
// cache-first treatment, which speeds up repeat loads without risking stale data.
const CACHE_NAME = "weekend-planner-shell-v1";
const CACHEABLE_PATH_PREFIXES = ["/_next/static/", "/icons/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isCacheable(url) {
  return CACHEABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !isCacheable(url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
});
