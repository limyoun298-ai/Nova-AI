// ======================================================
// NOVA AI — SERVICE WORKER
// VERSION 3.0
// MISE À JOUR PRIORITAIRE + NETTOYAGE AUTOMATIQUE
// ======================================================

"use strict";

const CACHE_NAME = "nova-ai-v3";
const CACHE_PREFIX = "nova-ai-";

const APP_URL = new URL("./", self.location.href);
const APP_PATH = APP_URL.pathname;

// ======================================================
// INSTALLATION : ACTIVER LA NOUVELLE VERSION
// ======================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    self.skipWaiting()
  );
});

// ======================================================
// ACTIVATION : SUPPRIMER LES ANCIENS CACHES
// ======================================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {

      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) =>
            key.startsWith(CACHE_PREFIX) &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();

    })()
  );
});

// ======================================================
// RÉSEAU PRIORITAIRE : RÉCUPÉRER LES NOUVEAUX FICHIERS
// ======================================================

self.addEventListener("fetch", (event) => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne jamais intercepter les API externes
  if (url.origin !== self.location.origin) return;

  // Ne pas mettre en cache les données dynamiques
  if (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/storage/")
  ) return;

  // Limiter le service worker aux fichiers de NOVA AI
  if (!url.pathname.startsWith(APP_PATH)) return;

  event.respondWith(
    (async () => {

      const cache = await caches.open(CACHE_NAME);

      try {

        // Toujours essayer le réseau en premier
        const response = await fetch(request, {
          cache: "no-store"
        });

        // Ne conserver que les réponses valides
        if (
          response &&
          response.ok &&
          response.type === "basic" &&
          !response.headers.get("Cache-Control")?.includes("no-store")
        ) {

          await cache.put(
            request,
            response.clone()
          );

        }

        return response;

      } catch (error) {

        // Réseau indisponible : utiliser le dernier fichier disponible
        const cached = await cache.match(request);

        if (cached) return cached;

        // Secours pour ouvrir l'application hors connexion
        if (request.mode === "navigate") {

          const fallback = await cache.match(
            new URL("./", self.location.href).href
          );

          if (fallback) return fallback;
        }

        return new Response(
          "Connexion Internet indisponible.",
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

});

// ======================================================
// FIN — NOVA AI SERVICE WORKER
// ======================================================
