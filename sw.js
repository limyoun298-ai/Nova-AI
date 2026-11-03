// NOVA AI - sw.js : toujours la dernière version, jamais d'ancienne
const CACHE_NAME = "nova-ai-live"; // nom fixe : plus besoin de changer de version

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord, en ignorant le cache du navigateur. Le cache ne sert que hors ligne.
async function fresh(req) {
  try {
    const res = await fetch(
      new Request(req.url, { cache: "no-store", credentials: "same-origin" })
    );
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
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
  // Supabase, Wikipedia, etc. passent directement
  if (url.origin !== self.location.origin) return;

  event.respondWith(fresh(req));
});
