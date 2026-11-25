/* =====================================================
   NOVA AI — SERVICE WORKER
   VERSION : 4.0
   STRATÉGIE : RÉSEAU DIRECT
   ===================================================== */

"use strict";

const NOVA_SW_VERSION = "nova-ai-v4";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();

        await Promise.all(
          keys
            .filter(key =>
              key.startsWith("nova-ai-") &&
              key !== NOVA_SW_VERSION
            )
            .map(key => caches.delete(key))
        );
      } catch (error) {
        console.warn("[NOVA] Cache cleanup:", error);
      }

      await self.clients.claim();
    })()
  );
});

/*
  Aucun cache forcé.

  NOVA charge directement :
  - index.html
  - fichiers JavaScript
  - manifest.json
  - icônes
  - ressources Supabase

  Les conversations restent gérées
  par le système de stockage de NOVA.
*/

console.info("[NOVA] Service Worker v4 actif.");
