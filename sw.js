// NOVA AI - sw.js AUTO-UPDATE FINAL - Ne plus toucher au CACHE_NAME
const CACHE_NAME = "nova-ai-live"; // reste fixe à vie

self.addEventListener("install", () => {
  console.log("[NOVA SW] Nouvelle version détectée -> installation");
  self.skipWaiting(); // prend le pouvoir direct
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => {
        console.log("[NOVA SW] Ancien cache supprimé, nouveau actif");
        return self.clients.claim(); // contrôle toutes les pages ouvertes
      })
  );
});

// Stratégie AUTO: Réseau d'abord, toujours frais
async function fresh(req) {
  const url = new URL(req.url);
  
  // Fichiers critiques: TOUJOURS réseau, jamais cache
  const ALWAYS_FRESH = ['update.js', 'index.html', 'sw.js', 'manifest.json'];
  const isCritical = ALWAYS_FRESH.some(f => url.pathname.includes(f));

  try {
    const request = new Request(req.url, { 
      cache: isCritical ? "no-store" : "reload", // no-store pour update.js
      credentials: "same-origin" 
    });
    
    const res = await fetch(request);
    
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
      if(isCritical) console.log("[NOVA SW] Fichier frais:", url.pathname);
    }
    return res;
  } catch (e) {
    // Hors ligne -> cache
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      console.log("[NOVA SW] Hors ligne, cache:", url.pathname);
      return cached;
    }
    if (req.mode === "navigate") {
      const page = await caches.match("./index.html", { ignoreSearch: true });
      if (page) return page;
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // API externes (Supabase, Wikipedia) -> laisse passer direct
  if (url.origin !== self.location.origin) return;

  event.respondWith(fresh(req));
});
