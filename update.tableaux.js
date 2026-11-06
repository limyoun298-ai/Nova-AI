/* NOVA AI — UPDATE TABLEAUX.JS — VERSION VERROUILLEE — CORRIGEE A B C D */
(function () {
  'use strict';
  try {
    if (window.__NOVA_UPDATE_TABLEAUX__) return;
    window.__NOVA_UPDATE_TABLEAUX__ = true;
  } catch (e) {}
  var INSTRUCTION = "Tu es Nova AI. Utilise un tableau Markdown UNIQUEMENT si l'utilisateur le demande explicitement, ou si tu dois expliquer quelque chose de très difficile ou de très important qui serait incompréhensible sans tableau. Sinon, réponds en texte simple, sans tableau. Ne mets jamais de tableau pour rien.";
  var MARK = 'Utilise un tableau Markdown UNIQUEMENT';
  var PRINT_IDLE = 350;
  var PRINT_TICK = 35;
  var state = {
    lastActivity: 0,
    lastTarget: null,
    cursorEl: null,
    away: false,
    chase: false,
    lastTop: 0,
    scroller: null
  };

  /* ---------- Reglages internes ---------- */
  var CONTENEUR_IDS = ['chat-box', 'messages', 'chat', 'chat-messages', 'chatBox', 'chat-container', 'messages-container', 'conversation'];
  var CONTENEUR_SEL = '.chat-box, .chat-messages, .messages, .chat-container, .messages-container';
  var BLOC_ENFANT = 'p, div, ul, ol, table, pre, h1, h2, h3, h4, h5, h6, blockquote';
  var EXCLU_SEL = 'button, input, textarea, select, pre, code, table, style, script, head, [data-nova-table], [contenteditable="true"]';
  var USER_SEL = '.msg-user, .user, .user-message, .message-user, .bubble-user, [data-role="user"]';
  var RE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  var RE_MIC = /(^|[^a-z])(mic|micro|microphone|dictee|dicter|dictée|voice input|speech input)([^a-z]|$)/i;
  var OPTIONS = { childList: true, subtree: true, characterData: true };

  var obs = null;
  var cont = null;
  var timer = null;
  var derniereSig = '';

  /* ---------- A. EXPOSITION (cerveau) ---------- */
  function exposer() {
    try {
      window.NOVA_TABLEAUX = { INSTRUCTION: INSTRUCTION, MARK: MARK, PRINT_IDLE: PRINT_IDLE, PRINT_TICK: PRINT_TICK, state: state };
      if (typeof window.INSTRUCTION === 'undefined') { window.INSTRUCTION = INSTRUCTION; }
      if (typeof window.PRINT_IDLE === 'undefined') { window.PRINT_IDLE = PRINT_IDLE; }
      if (typeof window.PRINT_TICK === 'undefined') { window.PRINT_TICK = PRINT_TICK; }
      if (typeof window.state === 'undefined') { window.state = state; }
    } catch (e) {}
  }

  function contientMarque(msgs) {
    try {
      for (var i = 0; i < msgs.length; i++) {
        if (msgs[i] && typeof msgs[i].content === 'string' && msgs[i].content.indexOf(MARK) !== -1) { return true; }
      }
    } catch (e) {}
    return false;
  }

  function injecterInstruction(args) {
    try {
      var copie = Array.prototype.slice.call(args);
      for (var i = 0; i < copie.length; i++) {
        var a = copie[i];
        if (a && typeof a === 'object' && !Array.isArray(a)) {
          if (Array.isArray(a.messages)) {
            if (contientMarque(a.messages)) { return args; }
            var msgs = a.messages.slice();
            var idx = -1;
            for (var j = 0; j < msgs.length; j++) {
              if (msgs[j] && msgs[j].role === 'system' && typeof msgs[j].content === 'string') { idx = j; break; }
            }
            if (idx >= 0) {
              msgs[idx] = Object.assign({}, msgs[idx], { content: msgs[idx].content + '\n\n' + INSTRUCTION });
            } else {
              msgs.unshift({ role: 'system', content: INSTRUCTION });
            }
            copie[i] = Object.assign({}, a, { messages: msgs });
            return copie;
          }
          var cle = ('system' in a) ? 'system' : (('systemPrompt' in a) ? 'systemPrompt' : '');
          if (cle) {
            if (typeof a[cle] === 'string' && a[cle].indexOf(MARK) !== -1) { return args; }
            var o = Object.assign({}, a);
            o[cle] = String(a[cle] || '') + '\n\n' + INSTRUCTION;
            copie[i] = o;
            return copie;
          }
        }
        if (Array.isArray(a)) {
          if (contientMarque(a)) { return args; }
          var arr = a.slice();
          var k = -1;
          for (var n = 0; n < arr.length; n++) {
            if (arr[n] && arr[n].role === 'system' && typeof arr[n].content === 'string') { k = n; break; }
          }
          if (k >= 0) {
            arr[k] = Object.assign({}, arr[k], { content: arr[k].content + '\n\n' + INSTRUCTION });
          } else {
            arr.unshift({ role: 'system', content: INSTRUCTION });
          }
          copie[i] = arr;
          return copie;
        }
      }
    } catch (e) {}
    return args;
  }

  function brancherCerveau() {
    try {
      if (typeof window.callNovaAI !== 'function') { return false; }
      if (window.callNovaAI.__novaTableaux) { return true; }
      var ancienne = window.callNovaAI;
      var nouvelle = function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        var modifies = args;
        try { modifies = injecterInstruction(args); } catch (e) { modifies = args; }
        var r;
        try {
          r = ancienne.apply(self, modifies);
        } catch (err) {
          if (modifies !== args) { return ancienne.apply(self, args); }
          throw err;
        }
        try {
          if (modifies !== args && r && typeof r.then === 'function') {
            return r.then(function (v) { return v; }, function () { return ancienne.apply(self, args); });
          }
        } catch (e2) {}
        return r;
      };
      nouvelle.__novaTableaux = true;
      window.callNovaAI = nouvelle;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Conteneur des messages ---------- */
  function trouverConteneur() {
    try {
      for (var i = 0; i < CONTENEUR_IDS.length; i++) {
        var el = document.getElementById(CONTENEUR_IDS[i]);
        if (el) { return el; }
      }
      var q = document.querySelector(CONTENEUR_SEL);
      if (q) { return q; }
      var m = document.querySelector('.msg-nova, .msg-user');
      if (m && m.parentElement && m.parentElement !== document.body && m.parentElement !== document.documentElement) {
        return m.parentElement;
      }
    } catch (e) {}
    return null;
  }

  function trouverScroller() {
    try {
      var e = cont;
      while (e && e !== document.body && e !== document.documentElement) {
        var cs = window.getComputedStyle(e);
        var oy = cs ? cs.overflowY : '';
        if (oy === 'auto' || oy === 'scroll') { return e; }
        e = e.parentElement;
      }
      return document.scrollingElement || document.documentElement;
    } catch (e2) { return null; }
  }

  /* ---------- Lecture du texte d'un bloc ---------- */
  function dans(el, sel) {
    try { return !!el.closest(sel); } catch (e) { return true; }
  }

  function estBlocFeuille(el) {
    try {
      return !!el && /^(P|DIV)$/.test(el.tagName) && !el.querySelector(BLOC_ENFANT);
    } catch (e) { return false; }
  }

  function lignesDe(el) {
    try {
      var s = '';
      (function marche(n) {
        var k = n.firstChild;
        while (k) {
          if (k.nodeType === 3) {
            s += k.nodeValue;
          } else if (k.nodeType === 1) {
            var tg = k.tagName;
            if (tg === 'BR') { s += '\n'; }
            else if (tg !== 'STYLE' && tg !== 'SCRIPT') { marche(k); }
          }
          k = k.nextSibling;
        }
      })(el);
      var l = s.split(/\r?\n/);
      for (var i = 0; i < l.length; i++) { l[i] = l[i].trim(); }
      return l;
    } catch (e) { return []; }
  }

  function trouverTableau(lignes) {
    try {
      for (var h = 0; h < lignes.length - 1; h++) {
        var l0 = lignes[h];
        var l1 = lignes[h + 1];
        if (l0.indexOf('|') === -1 || l1.indexOf('|') === -1) { continue; }
        if (RE_SEP.test(l0) || !RE_SEP.test(l1)) { continue; }
        var fin = h + 2;
        while (fin < lignes.length && lignes[fin] !== '' && lignes[fin].indexOf('|') !== -1 && !RE_SEP.test(lignes[fin])) { fin++; }
        return { debut: h, sep: h + 1, fin: fin };
      }
    } catch (e) {}
    return null;
  }

  function decouper(ligne) {
    try {
      var s = String(ligne).trim();
      if (s.charAt(0) === '|') { s = s.slice(1); }
      var n = s.length;
      if (n && s.charAt(n - 1) === '|' && s.charAt(n - 2) !== '\\') { s = s.slice(0, n - 1); }
      var cells = [];
      var cur = '';
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (c === '\\' && s.charAt(i + 1) === '|') { cur += '|'; i++; }
        else if (c === '|') { cells.push(cur.trim()); cur = ''; }
        else { cur += c; }
      }
      cells.push(cur.trim());
      return cells;
    } catch (e) { return []; }
  }

  function alignement(cell) {
    try {
      var c = String(cell).trim();
      var g = c.charAt(0) === ':';
      var d = c.charAt(c.length - 1) === ':';
      if (g && d) { return 'center'; }
      if (d) { return 'right'; }
    } catch (e) {}
    return 'left';
  }

  /* ---------- B. Construction du vrai tableau HTML ---------- */
  function remplirCellule(el, texte) {
    try {
      var t = String(texte || '').replace(/<br\s*\/?>/gi, '\n');
      if (!t) { el.appendChild(document.createTextNode('\u00a0')); return; }
      var lignes = t.split('\n');
      for (var l = 0; l < lignes.length; l++) {
        if (l > 0) { el.appendChild(document.createElement('br')); }
        var morceaux = lignes[l].split(/(\*\*[^*]+\*\*)/);
        for (var m = 0; m < morceaux.length; m++) {
          var p = morceaux[m];
          if (!p) { continue; }
          if (/^\*\*[^*]+\*\*$/.test(p)) {
            var b = document.createElement('strong');
            b.textContent = p.slice(2, -2);
            el.appendChild(b);
          } else {
            el.appendChild(document.createTextNode(p));
          }
        }
      }
    } catch (e) {}
  }

  function construireTableau(lignes, t) {
    try {
      var tete = decouper(lignes[t.debut]);
      var aligns = decouper(lignes[t.sep]).map(alignement);
      var rows = [];
      for (var r = t.sep + 1; r < t.fin; r++) { rows.push(decouper(lignes[r])); }
      var n = tete.length;
      for (var q = 0; q < rows.length; q++) { if (rows[q].length > n) { n = rows[q].length; } }
      if (n < 1) { return null; }

      var wrap = document.createElement('div');
      wrap.setAttribute('data-nova-table', '1');
      wrap.style.cssText = 'display:block;max-width:100%;min-width:0;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0;border:1px solid #34373d;border-radius:12px;background:#17181b;box-sizing:border-box;white-space:normal;text-align:left;';

      var table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;border-spacing:0;width:100%;min-width:' + Math.max(260, n * 96) + 'px;margin:0;font-size:13.5px;line-height:1.4;color:#ececee;background:transparent;';

      var thead = document.createElement('thead');
      var trh = document.createElement('tr');
      for (var c = 0; c < n; c++) {
        var th = document.createElement('th');
        th.style.cssText = 'padding:9px 12px;min-width:76px;text-align:' + (aligns[c] || 'left') + ';background:#25272c;color:#ffffff;font-weight:600;vertical-align:bottom;border-bottom:1px solid #3d4046;' + (c < n - 1 ? 'border-right:1px solid #2f3237;' : '');
        remplirCellule(th, tete[c] || '');
        trh.appendChild(th);
      }
      thead.appendChild(trh);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');
      for (var i = 0; i < rows.length; i++) {
        var tr = document.createElement('tr');
        if (i % 2 === 1) { tr.style.cssText = 'background:rgba(255,255,255,0.03);'; }
        for (var j = 0; j < n; j++) {
          var td = document.createElement('td');
          td.style.cssText = 'padding:9px 12px;min-width:76px;text-align:' + (aligns[j] || 'left') + ';vertical-align:top;word-break:break-word;color:#ececee;border-top:1px solid #2c2f34;' + (j < n - 1 ? 'border-right:1px solid #2c2f34;' : '') + (j === 0 ? 'font-weight:600;' : '');
          remplirCellule(td, rows[i][j] || '');
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    } catch (e) { return null; }
  }

  /* ---------- Remplacement dans la bulle ---------- */
  function vider(el) {
    try { while (el.firstChild) { el.removeChild(el.firstChild); } } catch (e) {}
  }

  function ajouterTexte(noeud, lignes) {
    try {
      var l = lignes.slice();
      while (l.length && l[0] === '') { l.shift(); }
      while (l.length && l[l.length - 1] === '') { l.pop(); }
      for (var i = 0; i < l.length; i++) {
        if (i > 0) { noeud.appendChild(document.createElement('br')); }
        noeud.appendChild(document.createTextNode(l[i]));
      }
      return l.length > 0;
    } catch (e) { return false; }
  }

  function convertirEnPlace(el, lignes, t) {
    try {
      var tab = construireTableau(lignes, t);
      if (!tab) { return false; }
      vider(el);
      ajouterTexte(el, lignes.slice(0, t.debut));
      el.appendChild(tab);
      var post = lignes.slice(t.fin);
      var d = document.createElement('div');
      if (ajouterTexte(d, post)) { el.appendChild(d); }
      state.lastTarget = el;
      return true;
    } catch (e) { return false; }
  }

  function convertirGroupe(groupe, lignes, t) {
    try {
      var tab = construireTableau(lignes, t);
      if (!tab) { return false; }
      var premier = groupe[0];
      vider(premier);
      premier.appendChild(tab);
      for (var i = 1; i < groupe.length; i++) {
        if (groupe[i].parentNode) { groupe[i].parentNode.removeChild(groupe[i]); }
      }
      state.lastTarget = premier;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Recherche des blocs de texte dans les bulles ---------- */
  function collecterBlocs(exigerTiret) {
    var out = [];
    try {
      var liste = cont.querySelectorAll('p, div');
      for (var i = 0; i < liste.length; i++) {
        var el = liste[i];
        var txt = el.textContent || '';
        if (txt.indexOf('|') === -1) { continue; }
        if (exigerTiret && txt.indexOf('-') === -1) { continue; }
        if (txt.indexOf('--bg') !== -1 || txt.indexOf(':root') !== -1) { continue; }
        if (!estBlocFeuille(el)) { continue; }
        if (dans(el, EXCLU_SEL) || dans(el, USER_SEL)) { continue; }
        out.push(el);
      }
    } catch (e) {}
    return out;
  }

  function toutesAvecBarre(lignes) {
    try {
      var vu = 0;
      for (var i = 0; i < lignes.length; i++) {
        if (lignes[i] === '') { continue; }
        if (lignes[i].indexOf('|') === -1) { return false; }
        vu++;
      }
      return vu > 0;
    } catch (e) { return false; }
  }

  function traiter() {
    var pause = false;
    try {
      if (!cont || !document.documentElement.contains(cont)) { return; }
      if (obs) { try { obs.disconnect(); } catch (e0) {} pause = true; }

      var sc = trouverScroller();
      var proche = false;
      try { proche = !!sc && (sc.scrollHeight - sc.scrollTop - sc.clientHeight) < 140; } catch (e1) {}
      var crees = 0;

      /* Passe 1 : tableau complet dans un seul bloc */
      var blocs = collecterBlocs(true);
      for (var i = 0; i < blocs.length; i++) {
        try {
          var lignes = lignesDe(blocs[i]);
          var t = trouverTableau(lignes);
          if (t && convertirEnPlace(blocs[i], lignes, t)) { crees++; }
        } catch (e2) {}
      }

      /* Passe 2 : tableau reparti sur plusieurs blocs voisins */
      try {
        var blocs2 = collecterBlocs(false);
        var vus = [];
        for (var a = 0; a < blocs2.length; a++) {
          try {
            var el = blocs2[a];
            if (vus.indexOf(el) !== -1 || !document.documentElement.contains(el)) { continue; }
            var comb = lignesDe(el);
            if (!toutesAvecBarre(comb)) { continue; }
            var groupe = [el];
            var suivant = el.nextElementSibling;
            while (suivant && blocs2.indexOf(suivant) !== -1 && estBlocFeuille(suivant)) {
              var ls = lignesDe(suivant);
              if (!toutesAvecBarre(ls)) { break; }
              groupe.push(suivant);
              vus.push(suivant);
              comb = comb.concat(ls);
              suivant = suivant.nextElementSibling;
            }
            if (groupe.length < 2) { continue; }
            var t2 = trouverTableau(comb);
            if (t2 && t2.debut === 0 && t2.fin === comb.length) {
              if (convertirGroupe(groupe, comb, t2)) { crees++; }
            }
          } catch (e3) {}
        }
      } catch (e4) {}

      /* Garder le bas du chat visible si l'utilisateur y etait */
      if (crees > 0 && sc) {
        try {
          state.scroller = sc;
          state.chase = proche;
          state.away = !proche;
          state.lastTop = sc.scrollTop;
          if (proche) {
            sc.scrollTop = sc.scrollHeight;
            setTimeout(function () {
              try { if (state.chase && state.scroller) { state.scroller.scrollTop = state.scroller.scrollHeight; } } catch (e5) {}
            }, PRINT_TICK);
          }
        } catch (e6) {}
      }
    } catch (e) {
    } finally {
      try { if (pause && obs && cont) { obs.observe(cont, OPTIONS); } } catch (e7) {}
    }
  }

  /* ---------- Observateur (uniquement sur le conteneur du chat) ---------- */
  function planifier() {
    try {
      if (timer) { clearTimeout(timer); }
      timer = setTimeout(function () {
        timer = null;
        try { traiter(); } catch (e) {}
      }, PRINT_IDLE);
    } catch (e) {}
  }

  function brancherObservateur() {
    try {
      if (obs) { try { obs.disconnect(); } catch (e0) {} obs = null; }
      if (!cont || typeof MutationObserver === 'undefined') { return; }
      obs = new MutationObserver(function () {
        try { state.lastActivity = Date.now(); planifier(); } catch (e) {}
      });
      obs.observe(cont, OPTIONS);
    } catch (e) {}
  }

  function verifierConteneur() {
    try {
      if (cont && document.documentElement.contains(cont)) { return; }
      var c = trouverConteneur();
      if (!c) { cont = null; return; }
      cont = c;
      state.scroller = null;
      brancherObservateur();
      planifier();
    } catch (e) {}
  }

  /* ---------- C. Cacher le bouton micro de la barre d'ecriture ---------- */
  function trouverZoneSaisie() {
    try {
      var inp = document.querySelector('#user-input, #message-input, #msg-input, #chat-input, #input, textarea');
      if (!inp) { return null; }
      var z = inp;
      for (var i = 0; i < 3; i++) {
        var p = z.parentElement;
        if (!p || p === document.body || p === document.documentElement) { break; }
        if (cont && p.contains(cont)) { break; }
        z = p;
      }
      return z;
    } catch (e) { return null; }
  }

  function masquerMicro() {
    try {
      var zone = trouverZoneSaisie();
      if (!zone) { return; }
      var liste = zone.querySelectorAll('button, [role="button"], [id], [class], [aria-label], [title]');
      for (var i = 0; i < liste.length; i++) {
        try {
          var el = liste[i];
          if (el.getAttribute('data-nova-mic') === '1') { continue; }
          var tg = el.tagName;
          if (tg === 'TEXTAREA' || tg === 'INPUT' || tg === 'SVG' || tg === 'svg' || tg === 'PATH' || tg === 'path') { continue; }
          if (el.querySelector('textarea, input')) { continue; }
          if (el.querySelectorAll('button').length > 1) { continue; }
          var cl = el.getAttribute('class') || '';
          var desc = (el.id || '') + ' ' + cl + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '');
          desc = desc.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
          if (RE_MIC.test(desc)) {
            el.style.display = 'none';
            el.setAttribute('data-nova-mic', '1');
          }
        } catch (e1) {}
      }
    } catch (e) {}
  }

  /* ---------- Demarrage ---------- */
  function demarrer() {
    try { exposer(); } catch (e) {}
    try {
      var essais = 0;
      var t = setInterval(function () {
        try {
          essais++;
          if (brancherCerveau() || essais > 150) { clearInterval(t); }
        } catch (e) { clearInterval(t); }
      }, 100);
    } catch (e) {}
    try { verifierConteneur(); } catch (e) {}
    try { masquerMicro(); } catch (e) {}
    try {
      setInterval(function () {
        try { verifierConteneur(); } catch (e) {}
        try { masquerMicro(); } catch (e) {}
        try {
          if (cont && Date.now() - state.lastActivity > PRINT_IDLE) {
            var sig = cont.getElementsByTagName('*').length + ':' + (cont.lastElementChild ? (cont.lastElementChild.textContent || '').length : 0);
            if (sig !== derniereSig) {
              traiter();
              derniereSig = cont.getElementsByTagName('*').length + ':' + (cont.lastElementChild ? (cont.lastElementChild.textContent || '').length : 0);
            }
          }
        } catch (e) {}
      }, 1500);
    } catch (e) {}
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { try { demarrer(); } catch (e) {} });
    } else {
      demarrer();
    }
  } catch (e) {}
})();
