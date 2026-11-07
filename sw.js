// sw.js - V9 - SANS COMPTEUR
const VERSION = "v10";
const CACHE_NAME = "nova-" + VERSION + "-offline";

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes("supabase")) return;
  // On ne met plus jamais index.html en cache
  if (e.request.url.includes("index.html") || e.request.url.endsWith("/")) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.status === 200 && e.request.method === "GET") {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
