 /* =====================================================
   NOVA AI — SERVICE WORKER
   VERSION : 5.0
   MODE : ONLINE + OFFLINE
   ===================================================== */

"use strict";

const NOVA_SW_VERSION = "nova-ai-v5";
const NOVA_BASE = "/Nova-AI/";

const NOVA_FILES = [
  NOVA_BASE,
  NOVA_BASE + "index.html",
  NOVA_BASE + "manifest.json",
  NOVA_BASE + "icon-192.png",
  NOVA_BASE + "icon-512.png"
];

/* INSTALLATION */

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(NOVA_SW_VERSION);

      await Promise.all(
        NOVA_FILES.map(async file => {
          try {
            const response = await fetch(file);

            if (response.ok) {
              await cache.put(file, response);
            }
          } catch (error) {
            console.warn("[NOVA] Fichier non téléchargé :", file);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

/* ACTIVATION */

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("nova-ai-") &&
            key !== NOVA_SW_VERSION
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

/* GESTION DES REQUÊTES */

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne jamais intercepter les API externes.
  if (url.origin !== self.location.origin) return;

  // Navigation : réseau prioritaire, cache en secours.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(NOVA_SW_VERSION);
            await cache.put(NOVA_BASE + "index.html", response.clone());
          }

          return response;

        } catch (error) {
          const cached = await caches.match(
            NOVA_BASE + "index.html"
          );

          if (cached) return cached;

          return new Response(
            "NOVA AI est temporairement indisponible.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        }
      })()
    );

    return;
  }

  // Ressources locales : réseau puis cache.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(NOVA_SW_VERSION);
          await cache.put(request, response.clone());
        }

        return response;

      } catch (error) {
        const cached = await caches.match(request);

        if (cached) return cached;

        return new Response("", { status: 503 });
      }
    })()
  );
});

console.info("[NOVA] Service Worker v5 actif.");
