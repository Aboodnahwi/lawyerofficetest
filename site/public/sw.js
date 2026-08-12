// sw.js - Unified Service Worker for Offline-First Lawyer Management App
const CACHE_NAME = "lawyer-app-cache-v2026-08-06";

// App Shell core assets precached on first install
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Pre-caching app shell assets.");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachePromises = urlsToCache.map(async (url) => {
        try {
          const req = new Request(url, {
            mode: url.startsWith("http") ? "cors" : "no-cors",
          });
          const response = await fetch(req);
          if (response.ok || response.type === "opaque") {
            return await cache.put(url, response);
          }
        } catch (error) {
          console.warn(`Failed to precache ${url}:`, error);
        }
      });
      await Promise.all(cachePromises);
      console.log("Service Worker: Pre-caching completed.");
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating and clearing old caches.");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Removing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass Service Worker for cloud database & API calls
  if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return;
  }

  // Bypass HMR & dev server internal assets
  if (
    url.pathname.includes("@vite") ||
    url.pathname.includes("?import") ||
    url.pathname.includes("__vite_ping") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".tsx")
  ) {
    return;
  }

  // Bypass the Service Worker script itself
  if (url.pathname.endsWith("sw.js")) {
    return;
  }

  // Handle Allowed Cross-Origin resources (Tailwind CDN, Google Fonts)
  const isCrossOrigin = url.origin !== self.location.origin;
  const allowedOrigins = [
    "cdn.tailwindcss.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com"
  ];
  const isAllowedOrigin = allowedOrigins.some((origin) => url.hostname.includes(origin));

  if (isCrossOrigin && !isAllowedOrigin) {
    return;
  }

  // Navigation requests: Serve cached index.html immediately for instant offline app boot
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cachedIndex) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedIndex || caches.match("/index.html") || caches.match("/"));

        return cachedIndex || fetchPromise;
      })
    );
    return;
  }

  // Static assets & script bundles: Cache-first with background network update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh
        fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === "opaque")
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          })
          .catch(() => {/* Ignore background update failures offline */});

        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === "opaque")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.warn("Offline fetch failed for asset:", url.href, error);
          return new Response("Offline Resource", {
            status: 503,
            statusText: "Offline",
          });
        });
    })
  );
});
