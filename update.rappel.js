/* NOVA AI — UPDATE.RAPPEL.JS — VERSION FUSIONNÉE FINALE */
(function () {
  'use strict';

  /* GARDE - ne se lance qu'une fois, ne casse JAMAIS Nova */
  try {
    if (window.__NOVA_RAPPEL__) return;
    window.__NOVA_RAPPEL__ = true;
  } catch (e) { return; }

  /* ============================================================
     MICRO MASQUÉ - FUSION des 2 versions
     Dans ce même fichier, tableau DEHORS.
     Micro dans la barre du bas, à côté du bouton d'envoi.
     ============================================================ */
  function hideMicro() {
    try {
      /* 1. CSS fort - par nom */
      try {
        if (!document.getElementById('nova-hide-mic')) {
          var s = document.createElement('style');
          s.id = 'nova-hide-mic';
          s.textContent = '.mic-btn, #mic-btn, #micBtn, #voice-btn, .voice-btn, button[aria-label*="micro"], button[aria-label*="vocal"], button[aria-label*="voice"], button[aria-label*="audio"], button[title*="micro"], button[title*="vocal"], button[title*="voice"], button[title*="audio"], [data-mic], [data-voice], [data-action*="mic"], [data-action*="voice"], .mic, .microphone, .micro, .voice-input, .btn-mic { display:none !important; visibility:hidden !important; width:0 !important; opacity:0 !important; pointer-events:none !important; }';
          if (document.head) document.head.appendChild(s);
        }
      } catch (e) {}

      /* 2. Par nom dans le code - ancienne version */
      try {
        var btns = document.querySelectorAll('button, div[role="button"], span[role="button"]');
        for (var i = 0; i < btns.length; i++) {
          try {
            var b = btns[i];
            var t = (b.innerHTML || '').toLowerCase();
            var a = ((b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.className || '')).toLowerCase();
            if (t.indexOf('mic') !== -1 || a.indexOf('mic') !== -1 || a.indexOf('vocal') !== -1 || a.indexOf('voice') !== -1 || a.indexOf('audio') !== -1) {
              b.style.display = 'none';
            }
          } catch (e) {}
        }
      } catch (e) {}

      /* 3. Par sa place - NOUVELLE version : on trouve la barre "Écrivez à Nova" */
      try {
        var inputs = document.querySelectorAll('input, textarea');
        for (var ii = 0; ii < inputs.length; ii++) {
          try {
            var inp = inputs[ii];
            var ph = (inp.getAttribute('placeholder') || '').toLowerCase();
            if (ph.indexOf('nova') !== -1 || ph.indexOf('crivez') !== -1 || ph.indexOf('message') !== -1 || ph.indexOf('crivez') !== -1) {
              var bar = inp.parentElement;
              for (var k = 0; k < 4 && bar && bar.parentElement; k++) { bar = bar.parentElement; }
              if (bar) {
                var tous = bar.querySelectorAll('button, div, span, svg, i');
                for (var j = 0; j < tous.length; j++) {
                  try {
                    var el = tous[j];
                    if (el === inp || (el.contains && el.contains(inp))) continue;
                    var txt = (el.textContent || '').trim();
                    if (txt === '+') continue;
                    var cls = (el.className || '').toString().toLowerCase();
                    var html = (el.innerHTML || '').toLowerCase();
                    if (cls.indexOf('send') !== -1 || html.indexOf('send') !== -1) continue;
                    if (el.tagName === 'BUTTON' || el.tagName === 'SVG' || el.tagName === 'I' || el.tagName === 'SPAN') {
                      var r = el.getBoundingClientRect();
                      if (r.width > 0 && r.width < 60 && r.height > 0 && r.height < 60) {
                        var style = window.getComputedStyle(el);
                        var bg = style.backgroundColor || '';
                        // On ne touche JAMAIS au bouton bleu d'envoi
                        if (bg.indexOf('0, 122') !== -1 || bg.indexOf('0,122') !== -1) continue;
                        if (cls.indexOf('blue') !== -1 || cls.indexOf('primary') !== -1) continue;
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.width = '0px';
                        el.style.pointerEvents = 'none';
                      }
                    }
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    } catch (e) {}
  }

  /* ============================================================
     RAPPEL - UNIQUEMENT QUAND L'UTILISATEUR DISCUTE
     Toutes les 3h dans la journée, 10min affiché, puis disparaît seul.
     ============================================================ */
  var lastActivity = Date.now();
  var lastRappel = Date.now();
  var DELAI_RAPPEL = 3 * 60 * 60 * 1000;
  var DUREE_AFFICHAGE = 10 * 60 * 1000;
  var ACTIVITE_MAX = 5 * 60 * 1000;

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
      try { hideMicro(); } catch (e) {}
      try { setTimeout(hideMicro, 1000); } catch (e) {}
      try { setTimeout(hideMicro, 3000); } catch (e) {}
      try {
        var obs = new MutationObserver(function(){ try{ hideMicro(); }catch(e){} });
        if (document.body) obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}

      try { document.addEventListener('keydown', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('click', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('input', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('submit', toucherActivite, true); } catch (e) {}
      try { document.addEventListener('touchstart', toucherActivite, true); } catch (e) {}

      setInterval(function() {
        try {
          var maintenant = Date.now();
          var discute = (maintenant - lastActivity) <= ACTIVITE_MAX;
          var troisHeures = (maintenant - lastRappel) >= DELAI_RAPPEL;
          if (troisHeures && discute) {
            lastRappel = maintenant;
            montrerRappel();
          }
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
