// public/service-worker.js

const CACHE_NAME = "flatchat-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Install: cache important files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch: respond from cache if available
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
