/*
 * Hissati offline service worker (NFR-1). Hand-written (no next-pwa/Serwist —
 * those need a webpack hook that Next 16's Turbopack doesn't run).
 *
 * Strategy:
 *  - precache the app-shell routes on install (resilient: one 404 won't abort);
 *  - navigations  -> network-first, fall back to cached shell (works offline);
 *  - static assets (_next/static JS — which inlines programs.json — fonts, icons)
 *    -> cache-first + revalidate. Once the chunks are cached, the whole
 *    deterministic flow (match/score/PDF) runs with no network.
 */
const CACHE = "hissati-v1";
const PRECACHE = ["/", "/questionnaire", "/results", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") return;
  caches.open(CACHE).then((cache) => cache.put(request, response));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache(request, response.clone());
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          putInCache(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
