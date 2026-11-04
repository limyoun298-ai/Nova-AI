// ============================================================
// NOVA AI - sw.js - CORRIGÉ BOSS - 1 MIN pour TOUS les fichiers, même les NOUVEAUX
// CACHE_NAME fixe à vie. Ne jamais le modifier.
// ============================================================

const CACHE_NAME = 'nova-ai-live';      // NE PAS TOUCHER
const STAGING    = 'nova-ai-staging';   // zone d'attente 60s
const DELAY_MS   = 60000;               // 1 minute pile
const CORE       = ['./', './index.html', './manifest.json'];
const META       = new Request(self.registration.scope + '__nova_staged_at__');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function keyOf(url) {
  const u = new URL(url, self.registration.scope);
  return new Request(u.origin + u.pathname);
}

async function hash(res) {
  const buf = await res.clone().arrayBuffer();
  const d = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function notifyClients() {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  list.forEach((c) => c.postMessage({ type: 'NOVA_UPDATE_READY' }));
}

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  const first = !self.registration.active;
  event.waitUntil((async () => {
    if (first) {
      const live = await caches.open(CACHE_NAME);
      await Promise.all(CORE.map(async (p) => {
        try {
          const res = await fetch(p, { cache: 'no-store' });
          if (res.ok) await live.put(keyOf(p), res);
        } catch (e) {}
      }));
      await self.skipWaiting();
    } else {
      await sleep(DELAY_MS);
      await self.skipWaiting();
    }
  })());
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await notifyClients();
    await settle();
  })());
});

// ---------- DÉTECTION - CORRIGÉ POUR NOUVEAUX FICHIERS ----------
async function checkUpdate(key) {
  const live = await caches.open(CACHE_NAME);
  const old = await live.match(key);

  let net;
  try { net = await fetch(key.url, { cache: 'no-store' }); } catch (e) { return; }
  if (!net || !net.ok) return;

  const staging = await caches.open(STAGING);
  const staged = await staging.match(key);
  const base = staged || old;

  // CORRECTION 1 : Si pas d'ancien, c'est un NOUVEAU fichier -> on le met en staging aussi
  if (!base) {
    await staging.put(key, net.clone());
    if (!(await staging.match(META))) {
      await staging.put(META, new Response(String(Date.now())));
    }
    console.log("[NOVA SW] NOUVEAU fichier détecté, en attente 1 min :", key.url);
    return;
  }

  if ((await hash(net)) === (await hash(base))) return;

  await staging.put(key, net.clone());
  if (!(await staging.match(META))) {
    await staging.put(META, new Response(String(Date.now())));
  }
}

async function checkAll() {
  const live = await caches.open(CACHE_NAME);
  const keys = await live.keys();
  await Promise.all(keys.map((k) => checkUpdate(k)));
}

// ---------- ATTENTE 60s PUIS PROMOTION ----------
async function timeLeft() {
  const st = await caches.open(STAGING);
  const m = await st.match(META);
  if (!m) return null;
  const t = Number(await m.text());
  return Math.max(0, DELAY_MS - (Date.now() - t));
}

async function promote() {
  const staging = await caches.open(STAGING);
  const live = await caches.open(CACHE_NAME);
  const keys = await staging.keys();
  let changed = false;

  for (const req of keys) {
    if (req.url === META.url) continue;
    const res = await staging.match(req);
    if (!res) continue;
    await live.delete(req);     // supprime l'ancien
    await live.put(req, res);   // met le nouveau en première
    await staging.delete(req);
    changed = true;
    console.log("[NOVA SW] Après 1 min : ANCIEN supprimé, NOUVEAU approuvé :", req.url);
  }
  await staging.delete(META);
  if (changed) await notifyClients(); // recharge la page
}

let pending = null;
function settle() {
  if (!pending) {
    pending = (async () => {
      const left = await timeLeft();
      if (left === null) return;
      await sleep(left);
      await promote();
    })().catch(() => {}).finally(() => { pending = null; });
  }
  return pending;
}

// ---------- MESSAGE DE LA PAGE ----------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK') {
    event.waitUntil((async () => { await checkAll(); await settle(); })());
  }
});

// ---------- FETCH - CORRIGÉ ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;

  const key = keyOf(req.url);

  event.respondWith((async () => {
    const live = await caches.open(CACHE_NAME);
    const cached = await live.match(key);

    if (cached) {
      event.waitUntil((async () => { await checkUpdate(key); await settle(); })());
      return cached;
    }

    // CORRECTION 2 : Nouveau fichier jamais vu -> on le met en STAGING, pas en LIVE, il attend 1 min
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const staging = await caches.open(STAGING);
        await staging.put(key, res.clone());
        if (!(await staging.match(META))) {
          await staging.put(META, new Response(String(Date.now())));
        }
        event.waitUntil(settle());
        console.log("[NOVA SW] Nouveau fichier en staging, 1 min :", url.pathname);
        return res; // On sert le nouveau la 1ère fois, mais le cache LIVE ne l'aura qu'après 1 min
      }
      return res;
    } catch (e) {
      if (req.mode === 'navigate') {
        const fallback =
          (await live.match(keyOf('./index.html'))) || (await live.match(keyOf('./')));
        if (fallback) return fallback;
      }
      return new Response('Hors ligne', { status: 503, statusText: 'Offline' });
    }
  })());
});
