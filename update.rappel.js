/* NOVA AI — UPDATE.RAPPEL.JS — VERSION VERROUILLEE V3 */
(function () {
  'use strict';

  /* GARDE - ne se lance qu'une fois, ne casse jamais Nova */
  try {
    if (window.__NOVA_RAPPEL__) return;
    window.__NOVA_RAPPEL__ = true;
  } catch (e) { return; }

  /* ============================================================
     B + C. MICRO MASQUE DANS CE MEME FICHIER
     Micro posé dans la barre du bas, à côté du bouton d'envoi.
     Tableau est DEHORS, on ne touche pas au tableau ici.
     ============================================================ */
  function hideMicro() {
    try {
      if (!document.getElementById('nova-hide-mic')) {
        var s = document.createElement('style');
        s.id = 'nova-hide-mic';
        s.textContent = '.mic-btn, #mic-btn, #micBtn, #voice-btn, .voice-btn, button[aria-label*="micro"], button[aria-label*="vocal"], button[aria-label*="voice"], button[title*="micro"], button[title*="vocal"], button[title*="voice"], [data-mic], [data-voice], [data-action*="mic"], [data-action*="voice"], .mic, .microphone, .micro, .voice-input, .btn-mic { display:none !important; visibility:hidden !important; width:0 !important; opacity:0 !important; pointer-events:none !important; }';
        if (document.head) document.head.appendChild(s);
      }
      var btns = document.querySelectorAll('button, div[role="button"], span[role="button"]');
      for (var i = 0; i < btns.length; i++) {
        try {
          var b = btns[i];
          var t = (b.innerHTML || '').toLowerCase();
          var a = ((b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.className || '')).toLowerCase();
          if (t.indexOf('mic') !== -1 || a.indexOf('mic') !== -1 || a.indexOf('vocal') !== -1 || a.indexOf('voice') !== -1) {
            b.style.display = 'none';
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  /* ============================================================
     A. RAPPEL - UNIQUEMENT QUAND L'UTILISATEUR DISCUTE
     Toutes les 3h dans la journée, 10min affiché, puis disparaît seul.
     Pas de coupure, pas de bug, juste un rappel.
     ============================================================ */
  var lastActivity = Date.now();
  var lastRappel = Date.now(); // départ du compteur 3h
  var DELAI_RAPPEL = 3 * 60 * 60 * 1000; // 3h
  var DUREE_AFFICHAGE = 10 * 60 * 1000; // 10min
  var ACTIVITE_MAX = 5 * 60 * 1000; // l'utilisateur a discuté dans les 5 dernières min = il discute

  // On détecte que l'utilisateur discute : il tape, il clique, il envoie
  function toucherActivite() {
    try { lastActivity = Date.now(); } catch (e) {}
  }

  function montrerRappel() {
    try {
      if (document.getElementById('nova-rappel-ai')) return;
      var div = document.createElement('div');
      div.id = 'nova-rappel-ai';
      div.textContent = 'nous vous rappelons que vous discutez avec une AI et non une vraie personne';
      div.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:9999;max-width:90%;padding:10px 16px;border-radius:999px;background:rgba(0,0,0,0.65);color:#fff;font-size:13px;text-align:center;pointer-events:none;opacity:0.85;';
      if (document.body) document.body.appendChild(div);

      // Disparaît seul après 10min
      setTimeout(function() {
        try {
          var el = document.getElementById('nova-rappel-ai');
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch (e) {}
      }, DUREE_AFFICHAGE);
    } catch (e) {}
  }

  function startTout() {
    try {
      // Micro
      try { hideMicro(); } catch (e) {}
      try { setTimeout(hideMicro, 1000); } catch (e) {}
      try { setTimeout(hideMicro, 3000); } catch (e) {}
      try {
        var obs = new MutationObserver(function(){ try{ hideMicro(); }catch(e){} });
        if (document.body) obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}

      // Ecoute discussion
      try { document.addEventListener('keydown', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('click', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('input', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('submit', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('touchstart', toucherActivite, true); } catch (e) {}

      // Vérifie chaque minute : 3h passées + utilisateur discute vraiment ?
      setInterval(function() {
        try {
          var maintenant = Date.now();
          var discute = (maintenant - lastActivity) <= ACTIVITE_MAX;
          var troisHeures = (maintenant - lastRappel) >= DELAI_RAPPEL;
          if (troisHeures && discute) {
            lastRappel = maintenant;
            montrerRappel();
          }
          // Si 3h passées mais utilisateur ne discute pas, on attend qu'il revienne discuter.
          // On ne montre pas le rappel dans le vide.
        } catch (e) {}
      }, 60 * 1000);
    } catch (e) {}
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startTout);
    } else {
      startTout();
    }
  } catch (e) {}
})();
