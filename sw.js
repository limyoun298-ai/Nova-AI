const CACHE_NAME = "nova-ai-v43";

const APP_FILES = [
  "./",
  "./index.html?v=43",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try { await cache.addAll(APP_FILES); } catch(e) {}
      for (const file of ["./icon-192.png", "./icon-512.png"]) {
        try { await cache.add(file); } catch(e) { console.log("Icône non mise en cache:", file); }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k.startsWith("nova-ai-") && k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
  
  // Pour HTML: NETWORK FIRST -> toujours frais!
  if (isHTML) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  
  // Pour le reste: Cache first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
