// sw.js - V8 - SANS COMPTEUR
const VERSION = "v8";
const CACHE_NAME = "nova-" + VERSION + "-offline";

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes("supabase")) return;
  if (e.request.url.includes("update.compteur.js")) {
    e.respondWith(new Response("", { status: 404 }));
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
