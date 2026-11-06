// sw.js - VIGILE GENTIL V5 - Marche meme hors-ligne pour 100 / 1000 messages
const CACHE_NAME = "nova-v5-offline";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
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
  // On ne gere que les requetes de notre app, pas Supabase
  if (e.request.url.includes("supabase")) {
    return;
  }

  // Pour update.compteur.js : TOUJOURS prendre la nouvelle version, jamais le vieux cache
  if (e.request.url.includes("update.compteur.js")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Si quelqu'un demande encore l'ancien fichier, on ne le sert plus
  if (e.request.url.includes("update.limite.js")) {
    e.respondWith(new Response("", { status: 404 }));
    return;
  }

  // Pour la navigation (ouvrir l'app) : essaie reseau, sinon cache
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

  // Pour les autres fichiers (js, css, images) : cache d'abord, sinon reseau
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        // En arriere-plan, on met a jour le cache pour la prochaine fois
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
