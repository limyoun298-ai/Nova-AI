// NOVA SW - AUTO DETECTE TOUS LES FICHIERS - N'IMPORTE QUEL NOM
const CACHE = 'nova-v10';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // On ne gère que les fichiers de ton site, pas les autres
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = e.request.url;

  // 1. Pour index.html et les .js : TOUJOURS prendre le NOUVEAU sur internet d'abord
  // C'est ça qui fait que tous les nouveaux fichiers sont détectés
  const isHTMLorJS = url.includes('.html') || url.includes('.js') || url.endsWith('/') || url.includes('index');

  if (isHTMLorJS) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then((res) => {
        // Si internet marche, on sauvegarde le nouveau fichier dans le cache
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => {
        // Si pas d'internet, on prend l'ancien en cache
        return caches.match(e.request);
      })
    );
    return;
  }

  // 2. Pour les autres fichiers (images, css, icones, n'importe quel nom) : Cache d'abord, mais on met à jour après
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => cached);

      // Si on a déjà en cache, on montre tout de suite, sinon on attend internet
      return cached || network;
    })
  );
});
