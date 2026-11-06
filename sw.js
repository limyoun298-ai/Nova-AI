// sw.js - VIGILE GENTIL V6 - Ne cache plus index.html, popup tue
const CACHE_NAME = "nova-v6-offline";

const FILES_TO_CACHE = [
  "./",
  "./update.compteur.js",
  "./manifest.json"
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
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
  if (e.request.url.includes("supabase")) {
    return;
  }

  // index.html et update.compteur.js : TOUJOURS frais, jamais cache
  if (e.request.url.includes("index.html") || e.request.url.includes("update.compteur.js") || e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((res) => {
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Ancien fichier bloque
  if (e.request.url.includes("update.limite.js")) {
    e.respondWith(new Response("", { status: 404 }));
    return;
  }

  // Autres fichiers : cache d'abord
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request);
    })
  );
});
