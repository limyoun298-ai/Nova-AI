const CACHE_NAME = "nova-ai-v44";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./update.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Chaque fichier est ajouté séparément : s'il en manque un, les autres sont quand même mis en cache
      for (const file of APP_FILES) {
        try { await cache.add(file); }
        catch (e) { console.log("Non mis en cache :", file); }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("nova-ai-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord, cache si hors ligne
function networkFirst(req, fallbackUrl) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone));
      }
      return res;
    })
    .catch(async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (fallbackUrl) {
        const fallback = await caches.match(fallbackUrl, { ignoreSearch: true });
        if (fallback) return fallback;
      }
      return Response.error();
    });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // On ne touche qu'aux GET du même site : Supabase, DuckDuckGo et Wikipedia passent directement
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages HTML : réseau d'abord, avec index.html en secours hors ligne
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    event.respondWith(networkFirst(req, "./index.html"));
    return;
  }

  // Images et icônes : cache d'abord
  if (/\.(png|jpg|jpeg|svg|ico|webp)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || networkFirst(req))
    );
    return;
  }

  // update.js, manifest.json, etc. : réseau d'abord, donc toujours à jour
  event.respondWith(networkFirst(req));
});
