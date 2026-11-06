// sw.js - V7 - TOUT FRAIS APRES DEPLOIEMENT
// Regle : Reseau d'abord, cache seulement si pas d'internet

const VERSION = "v7"; // <-- A CHAQUE DEPLOIEMENT, tu changes juste ici : v8, v9, v10...
const CACHE_NAME = "nova-" + VERSION + "-offline";

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // On ne pre-cache presque rien, pour ne pas garder du vieux
  e.waitUntil(caches.open(CACHE_NAME).then(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => {
        // On supprime TOUS les vieux caches : v4, v5, v6...
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // On ne touche pas a Supabase
  if (e.request.url.includes("supabase")) {
    return;
  }

  // Ancien fichier, on le bloque pour toujours
  if (e.request.url.includes("update.limite.js")) {
    e.respondWith(new Response("", { status: 404 }));
    return;
  }

  // POUR TOUS LES FICHIERS : RESEAU D'ABORD
  e.respondWith(
    fetch(e.request).then((res) => {
      // Si le reseau marche, on prend la version FRAICHE
      // Et on la met en cache pour le mode hors-ligne
      if (res && res.status === 200 && e.request.method === "GET") {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, copy);
        });
      }
      return res;
    }).catch(() => {
      // Si pas d'internet, on prend le cache
      return caches.match(e.request).then((cached) => {
        if (cached) return cached;
        // Si pas de cache pour la navigation, on renvoie index.html
        if (e.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
