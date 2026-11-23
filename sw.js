/* =====================================================
   NOVA AI — SERVICE WORKER
   VERSION : 2.0
   PROJET : /Nova-AI/
   OBJECTIF : Cache intelligent et démarrage fiable
===================================================== */

"use strict";

const CACHE_NAME = "nova-ai-v2";

const BASE = new URL("./", self.location.href);

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* INSTALLATION */
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.allSettled(
      APP_FILES.map(file =>
        cache.add(new URL(file, BASE).href)
      )
    );

    await self.skipWaiting();
  })());
});

/* ACTIVATION ET NETTOYAGE */
self.addEventListener("activate", event => {
  event.waitUntil((async () => {

    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("nova-ai-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

  })());
});

/* GESTION DES REQUÊTES */
self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne pas intercepter les services externes.
  if (url.origin !== self.location.origin) return;

  // Navigation : toujours essayer le réseau en premier.
  if (request.mode === "navigate") {

    event.respondWith((async () => {

      try {

        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;

      } catch (error) {

        const cached = await caches.match(request);

        if (cached) return cached;

        const fallback = await caches.match(
          new URL("./index.html", BASE).href
        );

        if (fallback) return fallback;

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

    })());

    return;
  }

  // Ressources locales : réseau en priorité, cache en secours.
  event.respondWith((async () => {

    try {

      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }

      return response;

    } catch (error) {

      const cached = await caches.match(request);

      if (cached) return cached;

      return new Response("", { status: 503 });
    }

  })());

});

console.log("NOVA AI Service Worker v2 actif.");
