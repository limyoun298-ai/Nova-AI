// update.limite.js - NOVA V4 TOUT-EN-UN
// Il se branche tout seul au cerveau déjà dans index.html
// Il n'a besoin d'AUCUNE clé. Il utilise window.supabaseClient
// Il enregistre tout seul sw.js. On ne touche PLUS à index.html.
(function () {
  try {

    // 1. ENREGISTRER LE VIGILE SW.JS TOUT SEUL
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    // 2. CONFIG LIMITES
    const LIMITE_GRATUIT = 3600; // 1h = 3600 sec
    const LIMITE_FORFAIT = 18000; // 5h = 18000 sec
    const DELAI_RESET = 24 * 60 * 60 * 1000; // 24h

    // 3. ID UTILISATEUR - reste le même même sans internet
    let userId = localStorage.getItem('nova_user_id');
    if (!userId) {
      userId = 'nova_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('nova_user_id', userId);
    }

    // 4. TROUVER LE CERVEAU DÉJÀ DANS INDEX.HTML
    function getSupabase() {
      if (window.supabaseClient) return window.supabaseClient;
      if (window.supabase) return window.supabase;
      if (window._supabaseClient) return window._supabaseClient;
      return null;
    }

    // 5. LIRE LE TEMPS LOCAL (marche hors-ligne)
    function getLocal() {
      try {
        const raw = localStorage.getItem('nova_usage_v4_local');
        if (!raw) return { used: 0, start: Date.now(), hasForfait: false };
        const d = JSON.parse(raw);
        // Si 24h passées, on remet à zéro tout seul
        if (Date.now() - d.start > DELAI_RESET) {
          return { used: 0, start: Date.now(), hasForfait: d.hasForfait || false };
        }
        return d;
      } catch (e) {
        return { used: 0, start: Date.now(), hasForfait: false };
      }
    }

    function saveLocal(data) {
      try { localStorage.setItem('nova_usage_v4_local', JSON.stringify(data)); } catch (e) {}
    }

    let local = getLocal();
    let blocked = false;
    let lastSync = 0;

    // 6. SYNCHRONISER AVEC SUPABASE QUAND IL Y A INTERNET (sans casser si pas de cerveau)
    async function syncAvecSupabase() {
      const sb = getSupabase();
      if (!sb) return; // Pas de cerveau encore, on continue en local, on ne casse rien
      if (Date.now() - lastSync < 10000) return; // pas plus d'une fois toutes les 10 sec
      lastSync = Date.now();
      try {
        // On lit ce qui est dans Supabase
        const { data } = await sb.from('nova_usage_v4').select('*').eq('user_id', userId).maybeSingle();
        if (data) {
          // Si Supabase a plus de temps que local, on prend Supabase (anti-triche)
          if (data.used_seconds > local.used) {
            local.used = data.used_seconds;
            local.hasForfait = !!data.has_forfait;
            if (data.start_at) local.start = new Date(data.start_at).getTime();
            saveLocal(local);
          }
        }
        // On envoie notre temps local vers Supabase
        await sb.from('nova_usage_v4').upsert({
          user_id: userId,
          used_seconds: Math.floor(local.used),
          has_forfait: local.hasForfait,
          start_at: new Date(local.start).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (e) { /* hors-ligne = on continue, on ne bloque pas */ }
    }

    // 7. VÉRIFIER SI L'UTILISATEUR A UN FORFAIT (via le cerveau)
    async function checkForfait() {
      const sb = getSupabase();
      if (!sb) return;
      try {
        const { data } = await sb.from('nova_usage_v4').select('has_forfait').eq('user_id', userId).maybeSingle();
        if (data && data.has_forfait) {
          local.hasForfait = true;
          saveLocal(local);
        }
      } catch (e) {}
    }

    // 8. AFFICHER LE MESSAGE DE RAPPEL + BLOQUER L'ENVOI
    function afficherBlocage() {
      if (document.getElementById('nova-limite-msg')) return;
      const div = document.createElement('div');
      div.id = 'nova-limite-msg';
      div.style.cssText = 'position:fixed;left:12px;right:12px;bottom:90px;z-index:9999;background:#1a1a2e;color:#fff;padding:14px;border-radius:14px;text-align:center;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.4);border:1px solid #ff5e8a;';
      div.innerHTML = '💙 Nous vous rappelons que vous discutez avec une AI et non une vraie personne.<br><b>Votre 1h gratuite est terminée.</b><br>Elle se renouvelle dans 24h, ou prenez un forfait pour 5h.';
      document.body.appendChild(div);
    }

    function retirerBlocage() {
      const el = document.getElementById('nova-limite-msg');
      if (el) el.remove();
    }

    function bloquerEnvoi(bloquer) {
      blocked = bloquer;
      // On bloque tous les boutons d'envoi possibles, sans casser l'app
      const boutons = document.querySelectorAll('button[type="submit"], button.send-btn, #send-btn, [data-send]');
      boutons.forEach(b => {
        if (bloquer) {
          b.dataset.novaOldDisabled = b.disabled;
          b.disabled = true;
          b.style.opacity = '0.5';
        } else {
          if (b.dataset.novaOldDisabled === 'false') b.disabled = false;
          b.style.opacity = '1';
        }
      });
      if (bloquer) afficherBlocage(); else retirerBlocage();
    }

    // 9. COMPTEUR - 1 SECONDE = 1 SECONDE
    function tick() {
      const limite = local.hasForfait ? LIMITE_FORFAIT : LIMITE_GRATUIT;

      // Reset 24h
      if (Date.now() - local.start > DELAI_RESET) {
        local.used = 0;
        local.start = Date.now();
        saveLocal(local);
        bloquerEnvoi(false);
      }

      // Si pas encore bloqué, on compte
      if (local.used < limite) {
        local.used += 1;
        saveLocal(local);
      }

      // Si limite atteinte
      if (local.used >= limite) {
        bloquerEnvoi(true);
      } else {
        bloquerEnvoi(false);
      }

      // Sync discrète avec Supabase
      syncAvecSupabase();
    }

    // 10. BLOQUER L'ENVOI MÊME SI L'UTILISATEUR CLIQUE VITE (capture)
    document.addEventListener('click', function (e) {
      if (!blocked) return;
      const btn = e.target.closest('button[type="submit"], button.send-btn, #send-btn, [data-send]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        afficherBlocage();
      }
    }, true);

    document.addEventListener('submit', function (e) {
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        afficherBlocage();
      }
    }, true);

    // 11. DÉMARRAGE
    checkForfait();
    syncAvecSupabase();
    setInterval(tick, 1000);
    setInterval(checkForfait, 30000); // re-vérifie le forfait toutes les 30 sec
    setInterval(syncAvecSupabase, 30000);

    // Exposer pour debug, sans casser
    window.NOVA_LIMIT = {
      getUsed: () => Math.floor(local.used),
      getLimite: () => local.hasForfait ? LIMITE_FORFAIT : LIMITE_GRATUIT,
      isBlocked: () => blocked,
      setForfait: (v) => { local.hasForfait = !!v; saveLocal(local); }
    };

  } catch (err) {
    // Même si tout casse, on ne casse PAS l'application
    console.log('Nova limite en pause:', err);
  }
})();
