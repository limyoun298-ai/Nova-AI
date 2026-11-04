// sw.js - VIGILE GENTIL QUI APPROUVE TOUT SANS OBJECTION
self.addEventListener('install', (e) => {
  self.skipWaiting(); // il n'attend pas, il approuve direct
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))) // il jette tous les anciens blocages
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // LE VIGILE DIT: "Tout ce qui arrive, je laisse passer sans objection"
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
  );
});
