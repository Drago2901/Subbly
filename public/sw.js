// Subbly Production Service Worker
// Version: 1.0.0
const CACHE_NAME = "subbly-cache-v1.0.0";
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/logo.svg"
];

// 1. Install: Precache shell and immediately activate
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Precache failed, continuing install:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate: Purge obsolete cache stores and claim open clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("subbly-") && name !== CACHE_NAME)
          .map((obsoleteName) => {
            console.log("[SW] Deleting obsolete cache:", obsoleteName);
            return caches.delete(obsoleteName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // B. Never cache Supabase auth, Edge Functions, or dynamic APIs
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/functions/v1") ||
    url.pathname.startsWith("/api/") ||
    url.searchParams.has("apiKey")
  ) {
    return;
  }

  // C. Navigation requests (HTML document): Network-First
  // Guarantees installed Chrome PWA always receives the latest index.html on launch
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackShell = await caches.match("/");
          if (fallbackShell) return fallbackShell;
          return new Response("You are currently offline. Please check your connection.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // D. Hashed static assets (/assets/*): Cache-First / Stale-While-Revalidate
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // E. Other static assets (images, fonts, manifest): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message handler for immediate manual or automatic skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
