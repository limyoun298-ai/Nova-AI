const CACHE_NAME = "nova-ai-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_FILES);

      await Promise.all(
        ["./icon-192.png", "./icon-512.png"].map(async (file) => {
          try {
            await cache.add(file);
          } catch (error) {
            console.log("Icône non mise en cache :", file);
          }
        })
      );
    })
  );

  self.skipWaiting();
});

// Activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("nova-ai-")
