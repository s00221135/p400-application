const CACHE_NAME = "flatchat-cache-v2";
const urlsToCache = ["/", "/manifest.json"]; // Notice we do not pre-cache index.html

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // For navigation requests: use network-first approach
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Update the cache with the new HTML
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If network fails, fallback to a previously cached index.html
          return caches.match("/index.html");
        })
    );
  } else {
    // For other requests: use cache-first approach
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
