// sw.js - VIGILE GENTIL V4 - Marche même hors-ligne pour 1h gratuit
const CACHE_NAME = "nova-v4-offline";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./update.limite.js",
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
  // On ne gère que les requêtes de notre app, pas Supabase
  if (e.request.url.includes("supabase")) {
    return;
  }

  // Pour la navigation (ouvrir l'app) : essaie réseau, sinon cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Pour les autres fichiers (js, css, images) : cache d'abord, sinon réseau
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        // En arrière-plan, on met à jour le cache pour la prochaine fois
        fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
