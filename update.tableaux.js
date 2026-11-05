/* NOVA AI — UPDATE TABLEAUX.JS */
(function () {
  'use strict';

  /* ============================================================
     0. GARDE ANTI-DOUBLE CHARGEMENT + CONSTANTES + ÉTAT
     ============================================================ */
  try {
    if (window.__NOVA_UPDATE_TABLEAUX__) return;
    window.__NOVA_UPDATE_TABLEAUX__ = true;
  } catch (e) {}

  var INSTRUCTION = "Tu es Nova AI. Utilise un tableau Markdown UNIQUEMENT si l'utilisateur le demande explicitement, ou si tu dois expliquer quelque chose de très difficile ou de très important qui serait incompréhensible sans tableau. Sinon, réponds en texte simple, sans tableau. Ne mets jamais de tableau pour rien.";
  var MARK = 'Utilise un tableau Markdown UNIQUEMENT';

  var state = {
    lastActivity: 0,
    lastTarget: null,
    cursorEl: null,
    away: false,      // l'utilisateur est remonté dans la discussion
    chase: false,     // descente automatique via la flèche en cours
    lastTop: 0,
    scroller: null,
    scrollerAt: 0,
    input: null,
    row: null,
    bound: false,
    tickT: null,
    idleT: null,
    moves: { n: 0, t: 0 },
    mic: { rec: null, on: false, base: '', heard: '', timer: null, manual: false }
  };
  var pairs = [];
  var pairMap = new WeakMap();
  var ORIG = {};
  var bodyObs = null, rowObs = null, rowObsEl = null;

  function safeRun(fn) { try { fn(); } catch (e) {} }
  function now() { return Date.now(); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inUi(node) {
    try {
      var el = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
      return !!(el && el.closest && el.closest('[data-nova-ui]'));
    } catch (e) { return false; }
  }

  function isEditable(el) {
    try {
      return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable);
    } catch (e) { return false; }
  }

  /* ============================================================
     1. BRANCHEMENT AU CERVEAU : INSTRUCTION SYSTÈME (fetch + XHR)
     ============================================================ */
  function urlOk(u) {
    try {
      u = String(u || '');
      // On ne touche jamais aux appels Supabase de données / auth / stockage
      return !/\/(rest|auth|storage|realtime)\/v1\//.test(u);
    } catch (e) { return true; }
  }

  function injectInstruction(body) {
    try {
      if (typeof body !== 'string' || body.length < 2 || body.length > 3000000) return body;
      if (body.indexOf(MARK) !== -1) return body; // jamais 2 fois
      if (body.charAt(0) !== '{') return body;
      var obj = JSON.parse(body);
      if (!obj || typeof obj !== 'object') return body;

      var done = false;
      var sysKeys = ['system', 'system_prompt', 'systemPrompt', 'system_instruction', 'systemInstruction'];
      for (var i = 0; i < sysKeys.length && !done; i++) {
        var k = sysKeys[i];
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          var v = obj[k];
          if (typeof v === 'string') { obj[k] = v + '\n\n' + INSTRUCTION; done = true; }
          else if (Array.isArray(v)) { v.push({ type: 'text', text: INSTRUCTION }); done = true; }
          else if (v && Array.isArray(v.parts)) { v.parts.push({ text: INSTRUCTION }); done = true; }
        }
      }
      if (!done && Array.isArray(obj.messages) && obj.messages.length) {
        var m0 = obj.messages[0];
        if (m0 && typeof m0 === 'object' && (m0.role === 'system' || m0.role === 'developer') && typeof m0.content === 'string') {
          m0.content = m0.content + '\n\n' + INSTRUCTION;
          done = true;
        } else if (m0 && typeof m0 === 'object' && 'role' in m0) {
          obj.messages.unshift({ role: 'system', content: INSTRUCTION });
          done = true;
        }
      }
      if (!done && Array.isArray(obj.contents)) {
        obj.systemInstruction = { parts: [{ text: INSTRUCTION }] };
        done = true;
      }
      if (!done) return body;
      return JSON.stringify(obj);
    } catch (e) { return body; }
  }

  function patchFetch() {
    try {
      if (!window.fetch || window.fetch.__novaWrapped) return;
      var orig = window.fetch;
      var wrapped = function (input, init) {
        var args = arguments;
        try {
          var url = typeof input === 'string' ? input : ((input && input.url) || '');
          if (init && typeof init.body === 'string' && urlOk(url)) {
            var nb = injectInstruction(init.body);
            if (nb !== init.body) {
              var ni = {};
              for (var k in init) { if (Object.prototype.hasOwnProperty.call(init, k)) ni[k] = init[k]; }
              ni.body = nb;
              args = [input, ni];
            }
          }
        } catch (e) { args = arguments; }
        return orig.apply(this, args);
      };
      wrapped.__novaWrapped = true;
      window.fetch = wrapped;
    } catch (e) {}
  }

  function patchXHR() {
    try {
      var XP = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
      if (!XP || XP.send.__novaWrapped) return;
      var origOpen = XP.open;
      var origSend = XP.send;
      var openW = function (method, url) {
        try { this.__novaUrl = url; } catch (e) {}
        return origOpen.apply(this, arguments);
      };
      var sendW = function (body) {
        var b = body;
        try {
          if (typeof body === 'string' && urlOk(this.__novaUrl)) b = injectInstruction(body);
        } catch (e) { b = body; }
        return origSend.call(this, b);
      };
      sendW.__novaWrapped = true;
      XP.open = openW;
      XP.send = sendW;
    } catch (e) {}
  }

  /* ============================================================
     2. STYLES (injectés une seule fois) — AUCUNE animation sur le texte
     ============================================================ */
  function ensureStyle() {
    try {
      if (document.getElementById('nova-update-style')) return;
      var css = [
        '.nvt-msg{display:block;width:100%;box-sizing:border-box;color:inherit;font:inherit;line-height:1.55;word-wrap:break-word}',
        '.nvt-u{display:block}',
        '.nvt-line{margin:0;white-space:normal}',
        '.nvt-gap{height:8px}',
        '.nvt-ic{font-family:ui-monospace,Menlo,Consolas,monospace;background:rgba(255,255,255,.12);padding:1px 5px;border-radius:6px;font-size:.92em}',
        /* tableaux */
        '.nvt-tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0;border-radius:16px;background:#1c1c1e;border:1px solid #2c2c2e;max-width:100%;box-sizing:border-box}',
        '.nvt-tbl{border-collapse:collapse!important;width:100%;font-size:13.5px!important;color:#fff!important;background:#1c1c1e!important;margin:0!important;border:0!important}',
        '.nvt-tbl th{background:#2f7bff!important;color:#fff!important;font-weight:700!important;padding:10px!important;font-size:13.5px!important;border:0!important;vertical-align:middle}',
        '.nvt-tbl td{color:#fff!important;padding:10px!important;font-size:13.5px!important;border:0!important;vertical-align:top;min-width:70px}',
        '.nvt-tbl tbody tr:nth-child(odd) td{background:#1c1c1e!important}',
        '.nvt-tbl tbody tr:nth-child(even) td{background:#2c2c2e!important}',
        /* code */
        '.nvt-code{background:#0d0d0d;border-radius:16px;border:1px solid #262626;margin:12px 0;overflow:hidden;color:#e6e6e6;max-width:100%;box-sizing:border-box}',
        '.nvt-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 10px;background:#161616;border-bottom:1px solid #262626}',
        '.nvt-lang{font:600 12px ui-monospace,Menlo,Consolas,monospace;color:#8e8e93;text-transform:lowercase}',
        '.nvt-btns{display:flex;gap:6px;flex-wrap:wrap}',
        '.nvt-u[data-done="0"] .nvt-btns{visibility:hidden}',
        '.nvt-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #333;background:#1c1c1e;color:#fff;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer;font-family:inherit;line-height:1;-webkit-tap-highlight-color:transparent}',
        '.nvt-btn svg{width:14px;height:14px;flex:none}',
        '.nvt-pre{margin:0!important;padding:12px 14px!important;overflow:auto;max-height:420px;background:#0d0d0d!important;-webkit-overflow-scrolling:touch;border:0!important;border-radius:0!important}',
        '.nvt-pre code{display:block;white-space:pre!important;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace!important;font-size:13px!important;line-height:1.55;color:#e6e6e6!important;background:transparent!important;padding:0!important;tab-size:4;word-break:normal;overflow-wrap:normal}',
        '.nvt-k{color:#c678dd}.nvt-s{color:#98c379}.nvt-c{color:#7f848e;font-style:italic}.nvt-n{color:#61afef}',
        /* modale plein écran */
        '.nvt-modal{position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483600;background:rgba(0,0,0,.95);display:flex;flex-direction:column;color:#fff}',
        '.nvt-mhead{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;padding-top:max(12px,env(safe-area-inset-top));border-bottom:1px solid #262626}',
        '.nvt-mbody{flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch}',
        /* petit curseur (seulement le curseur, jamais le texte) */
        '@keyframes nvt-blink{0%,49%{opacity:1}50%,100%{opacity:0}}',
        '.nvt-writing::after{content:"";display:inline-block;width:2px;height:1.05em;margin-left:3px;vertical-align:text-bottom;background:#2f7bff;animation:nvt-blink 1s step-end infinite}',
        /* flèche bas */
        '.nvt-arrow{position:fixed;left:50%;margin-left:-19px;width:38px;height:38px;border-radius:50%;background:#2f7bff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.45);cursor:pointer;z-index:2147482000;opacity:0;transform:translateY(8px) scale(.9);pointer-events:none;transition:opacity .2s,transform .2s;-webkit-tap-highlight-color:transparent}',
        '.nvt-arrow.nvt-on{opacity:1;transform:none;pointer-events:auto}',
        '.nvt-arrow svg{width:18px;height:18px}',
        /* micro qui écoute : rouge + pulse */
        '@keyframes nvt-pulse{0%{box-shadow:0 0 0 0 rgba(255,59,48,.55)}70%{box-shadow:0 0 0 12px rgba(255,59,48,0)}100%{box-shadow:0 0 0 0 rgba(255,59,48,0)}}',
        '[data-nova-voix="micro"].nvt-mic-on{background:#ff3b30!important;color:#fff!important;animation:nvt-pulse 1.1s infinite}',
        '[data-nova-voix="micro"].nvt-mic-on svg{color:#fff!important}'
      ].join('\n');
      var st = document.createElement('style');
      st.id = 'nova-update-style';
      st.setAttribute('data-nova-ui', 'style');
      st.textContent = css;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  /* ============================================================
     3. ICÔNES SVG
     ============================================================ */
  var SVG_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var SVG_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var SVG_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var SVG_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';

  /* ============================================================
     4. LECTURE DU TEXTE BRUT D'UN ÉLÉMENT (garde espaces et sauts de ligne)
     ============================================================ */
  var BLOCK_TAGS = { P: 1, DIV: 1, LI: 1, UL: 1, OL: 1, PRE: 1, TR: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, BLOCKQUOTE: 1, SECTION: 1, ARTICLE: 1, TABLE: 1 };

  function rawText(root) {
    var out = '';
    function walk(n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'BUTTON' || tag === 'svg' || tag === 'SVG') return;
      if (n.hasAttribute && n.hasAttribute('data-nova-ui')) return;
      if (tag === 'BR') { out += '\n'; return; }
      var blk = !!BLOCK_TAGS[tag];
      if (blk && out && out.charAt(out.length - 1) !== '\n') out += '\n';
      for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
      if (blk && out && out.charAt(out.length - 1) !== '\n') out += '\n';
    }
    walk(root);
    return out;
  }

  /* ============================================================
     5. PARSEUR MARKDOWN (tableaux + blocs de code + texte)
     ============================================================ */
  var SEP_RX = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

  function isSep(l) {
    return l.indexOf('|') !== -1 && l.indexOf('-') !== -1 && SEP_RX.test(l);
  }

  function splitRow(line) {
    var s = line.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.length && s.charAt(s.length - 1) === '|' && s.charAt(s.length - 2) !== '\\') s = s.slice(0, -1);
    var cells = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '\\' && s.charAt(i + 1) === '|') { cur += '|'; i++; }
      else if (ch === '|') { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function alignOf(c) {
    c = (c || '').trim();
    var l = c.charAt(0) === ':';
    var r = c.charAt(c.length - 1) === ':';
    if (l && r) return 'center';
    if (r) return 'right';
    return 'left';
  }

  function parseBlocks(text) {
    var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    var out = [], cur = null, i = 0;

    function flush() { if (cur) { out.push(cur); cur = null; } }

    while (i < lines.length) {
      var line = lines[i];
      var tl = line.trim();

      // --- bloc de code ```lang ... ```
      if (tl.indexOf('```') === 0) {
        flush();
        var lang = tl.slice(3).trim().split(/\s+/)[0].toLowerCase();
        var code = [], closed = false;
        i++;
        while (i < lines.length) {
          if (lines[i].trim().indexOf('```') === 0) { closed = true; i++; break; }
          code.push(lines[i]);
          i++;
        }
        out.push({ t: 'code', lang: lang, code: code.join('\n'), closed: closed });
        continue;
      }

      // --- tableau Markdown
      if (line.indexOf('|') !== -1 && i + 1 < lines.length && isSep(lines[i + 1])) {
        flush();
        var head = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(alignOf);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim() !== '' && lines[i].trim().indexOf('```') !== 0) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        out.push({ t: 'table', head: head, aligns: aligns, rows: rows });
        continue;
      }

      // --- texte normal
      if (!cur) cur = { t: 'text', lines: [] };
      cur.lines.push(line);
      i++;
    }
    flush();
    return out;
  }

  /* ============================================================
     6. RENDU HTML : chaque ligne / tableau / code = une "unité" indépendante
        (on ne reconstruit que l'unité qui change, jamais tout le message)
     ============================================================ */
  function inline(s) {
    s = esc(s);
    s = s.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code class="nvt-ic">$1</code>');
    return s;
  }

  // Texte : une unité par ligne (impression ligne par ligne, sans toucher aux lignes déjà écrites)
  function textUnits(b) {
    var lines = b.lines.slice();
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var out = [], gap = false;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (!l.trim()) {
        if (!gap && out.length) { out.push({ cls: 'nvt-u nvt-gap', html: '', done: true }); gap = true; }
        continue;
      }
      gap = false;
      var h = /^\s*#{1,6}\s+(.*)$/.exec(l);
      out.push({ cls: 'nvt-u nvt-line', html: h ? '<strong>' + inline(h[1]) + '</strong>' : inline(l), done: true });
    }
    return out;
  }

  function renderTable(b) {
    var n = b.head.length, i, j;
    for (i = 0; i < b.rows.length; i++) n = Math.max(n, b.rows[i].length);
    var h = '<div class="nvt-tbl-wrap"><table class="nvt-tbl"><thead><tr>';
    for (i = 0; i < n; i++) {
      h += '<th style="text-align:' + (b.aligns[i] || 'left') + '">' + inline(b.head[i] || '') + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (j = 0; j < b.rows.length; j++) {
      h += '<tr>';
      for (i = 0; i < n; i++) {
        h += '<td style="text-align:' + (b.aligns[i] || 'left') + '">' + inline(b.rows[j][i] || '') + '</td>';
      }
      h += '</tr>';
    }
    h += '</tbody></table></div>';
    return h;
  }

  /* --- coloration Python (le texte reste strictement identique) --- */
  var PY_KW = {};
  ('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None')
    .split(' ').forEach(function (k) { PY_KW[k] = 1; });

  var PY_RX = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))|((?:[rRbBfFuU]{1,2})?(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(#[^\n]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

  function highlightPython(code) {
    var out = '', last = 0, m;
    PY_RX.lastIndex = 0;
    while ((m = PY_RX.exec(code)) !== null) {
      if (m[0].length === 0) { PY_RX.lastIndex++; continue; }
      if (m.index > last) out += esc(code.slice(last, m.index));
      var t = m[0], cls = '';
      if (m[1] || m[2]) cls = 'nvt-s';
      else if (m[3]) cls = 'nvt-c';
      else if (m[4]) cls = 'nvt-n';
      else if (m[5]) cls = PY_KW[t] ? 'nvt-k' : '';
      out += cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t);
      last = PY_RX.lastIndex;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  function looksPython(code) {
    return /(^|\n)\s*(def |import |from \w+ import |class \w+|print\()/.test(code);
  }

  function codeHtml(code, lang) {
    var py = (lang === 'python' || lang === 'py' || lang === 'python3' || (!lang && looksPython(code)));
    return py ? highlightPython(code) : esc(code);
  }

  function renderCode(b, idx) {
    var label = b.lang || (looksPython(b.code) ? 'python' : 'code');
    var btns =
      '<span class="nvt-btns">' +
      '<button type="button" class="nvt-btn" data-nova-act="copy" data-i="' + idx + '">' + SVG_COPY + '<span>Copier</span></button>' +
      '<button type="button" class="nvt-btn" data-nova-act="view" data-i="' + idx + '">' + SVG_EYE + '<span>Voir le code en entier</span></button>' +
      '</span>';
    return '<div class="nvt-code"><div class="nvt-bar"><span class="nvt-lang">' + esc(label) + '</span>' + btns +
      '</div><pre class="nvt-pre"><code>' + codeHtml(b.code, b.lang) + '</code></pre></div>';
  }

  function buildUnits(blocks, idle, codes) {
    var units = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.t === 'text') {
        var tu = textUnits(b);
        for (var k = 0; k < tu.length; k++) units.push(tu[k]);
      } else if (b.t === 'table') {
        units.push({ cls: 'nvt-u', html: renderTable(b), done: true });
      } else if (b.t === 'code') {
        var idx = codes.length;
        codes.push({ code: b.code, lang: b.lang });
        units.push({ cls: 'nvt-u', html: renderCode(b, idx), done: !!(b.closed || idle) });
      }
    }
    return units;
  }

  /* ============================================================
     7. DÉTECTION : message utilisateur (jamais touché)
     ============================================================ */
  var USER_RX = /(^|[\s_\-:])(user|human|outgoing|utilisateur|mine)([\s_\-:]|$)/i;
  var AI_RX = /(^|[\s_\-:])(assistant|bot|ai|model)([\s_\-:]|$)/i;

  function blueBg(el) {
    try {
      var cs = window.getComputedStyle(el).backgroundColor;
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(cs);
      if (!m) return false;
      var a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a < 0.5) return false;
      var r = +m[1], g = +m[2], b = +m[3];
      return b >= 170 && r <= 120 && g <= 175 && (b - r) >= 90;
    } catch (e) { return false; }
  }

  function isUserMessage(el) {
    try {
      var a = el, n = 0;
      while (a && a.nodeType === 1 && a !== document.body && n < 10) {
        var cls = (typeof a.className === 'string' ? a.className : '') + ' ' +
          (a.getAttribute('data-role') || '') + ' ' + (a.getAttribute('data-author') || '') + ' ' +
          (a.getAttribute('data-sender') || '') + ' ' + (a.getAttribute('data-from') || '');
        if (USER_RX.test(cls)) return true;
        if (blueBg(a)) return true;
        if (AI_RX.test(cls)) return false;
        a = a.parentElement;
        n++;
      }
    } catch (e) {}
    return false;
  }

  /* ============================================================
     8. TRANSFORMATION DES MESSAGES (mise à jour INCRÉMENTALE)
        On garde l'original (caché) et on insère un rendu propre juste après.
        Ce qui est déjà affiché n'est jamais effacé : seule l'unité qui change est mise à jour.
     ============================================================ */
  function detectLang(pre, text) {
    try {
      var s = (pre.className || '') + ' ' + (pre.getAttribute('data-language') || '');
      var c = pre.querySelector('code');
      if (c) s += ' ' + (c.className || '');
      var m = /language-([\w+-]+)/i.exec(s);
      if (m) return m[1].toLowerCase();
    } catch (e) {}
    return looksPython(text) ? 'python' : '';
  }

  function scheduleTick(delay) {
    if (state.tickT) return;
    state.tickT = setTimeout(function () { state.tickT = null; tick(); }, delay || 90);
  }

  function similar(a, b) {
    var n = Math.min(40, a.length, b.length);
    return a.slice(0, n) === b.slice(0, n);
  }

  // Crée la paire (source cachée + rendu propre), ou réutilise un rendu orphelin
  // (cas où l'app remplace son élément pendant l'écriture : on ne repart pas de zéro).
  function createPair(el, text) {
    var pair = null, i;
    for (i = 0; i < pairs.length; i++) {
      var p = pairs[i];
      if (!p.src.isConnected && p.sib && similar(p.text || '', text)) { pair = p; break; }
    }
    if (pair) {
      try { pairMap.delete(pair.src); } catch (e) {}
      pair.src = el;
      el.parentNode.insertBefore(pair.sib, el.nextSibling);
    } else {
      var sib = document.createElement('div');
      sib.className = 'nvt-msg';
      sib.setAttribute('data-nova-ui', 'msg');
      sib.setAttribute('data-nova-tableau', 'fait');
      el.parentNode.insertBefore(sib, el.nextSibling);
      pair = { src: el, sib: sib, text: '', idle: null, units: [], gone: 0 };
      pairs.push(pair);
    }
    el.style.setProperty('display', 'none', 'important');
    el.setAttribute('data-nova-source', '1');
    pair.gone = 0;
    pair.text = '';
    pair.idle = null;
    pairMap.set(el, pair);
    return pair;
  }

  // Applique les unités : ne touche QUE celles qui ont changé
  function applyUnits(pair, units) {
    var sib = pair.sib, cur = pair.units, i, w, u, c;
    for (i = 0; i < units.length; i++) {
      u = units[i];
      c = cur[i];
      if (!c) {
        w = document.createElement('div');
        w.className = u.cls;
        w.__cls = u.cls;
        w.innerHTML = u.html;
        w.setAttribute('data-done', u.done ? '1' : '0');
        sib.appendChild(w);
        cur[i] = { html: u.html, w: w, done: u.done };
        continue;
      }
      w = c.w;
      if (w.__cls !== u.cls) {
        var writing = w.classList.contains('nvt-writing');
        w.className = u.cls + (writing ? ' nvt-writing' : '');
        w.__cls = u.cls;
      }
      if (c.html !== u.html) {
        var saved = [];
        try {
          var olds = w.querySelectorAll('.nvt-pre');
          for (var a = 0; a < olds.length; a++) saved.push([olds[a].scrollTop, olds[a].scrollLeft]);
        } catch (e) {}
        w.innerHTML = u.html;
        try {
          var news = w.querySelectorAll('.nvt-pre');
          if (news.length === saved.length) {
            for (var b = 0; b < news.length; b++) { news[b].scrollTop = saved[b][0]; news[b].scrollLeft = saved[b][1]; }
          }
        } catch (e) {}
        c.html = u.html;
      }
      if (c.done !== u.done) {
        w.setAttribute('data-done', u.done ? '1' : '0');
        c.done = u.done;
      }
    }
    while (cur.length > units.length) {
      var last = cur.pop();
      try { if (last.w.parentNode) last.w.parentNode.removeChild(last.w); } catch (e) {}
    }
  }

  function stickBottom() {
    try {
      var s = getScroller();
      if (isDocScroller(s)) (ORIG.winScrollTo || window.scrollTo).call(window, 0, document.documentElement.scrollHeight);
      else s.scrollTop = s.scrollHeight;
      state.lastTop = s.scrollTop;
    } catch (e) {}
  }

  function processSource(el, kind) {
    var text, blocks;
    if (!el.parentNode) return;
    if (kind === 'pre') {
      text = el.textContent || '';
      blocks = [{ t: 'code', lang: detectLang(el, text), code: text, closed: true }];
    } else {
      text = rawText(el);
      blocks = parseBlocks(text);
    }
    var idle = (now() - state.lastActivity) > 1200;
    var pair = pairMap.get(el);
    if (pair && pair.text === text && pair.idle === idle) return;

    // Scroll : on ne le touche que si l'utilisateur est déjà tout en bas
    var wasBottom = false;
    try {
      var s = getScroller();
      wasBottom = !state.away && getDist(s) <= 40;
    } catch (e) {}

    var codes = [];
    var units = buildUnits(blocks, idle, codes);

    if (!pair) pair = createPair(el, text);
    applyUnits(pair, units);
    pair.sib.__novaCodes = codes;
    pair.text = text;
    pair.idle = idle;

    if (wasBottom) stickBottom();
    if (!idle) scheduleTick(1300); // pour faire apparaître les boutons quand c'est fini
  }

  function cleanupPairs() {
    for (var i = pairs.length - 1; i >= 0; i--) {
      var p = pairs[i];
      if (p.src.isConnected) { p.gone = 0; continue; }
      if (!p.gone) { p.gone = now(); continue; }
      if (now() - p.gone > 800) {
        try { if (p.sib && p.sib.parentNode) p.sib.parentNode.removeChild(p.sib); } catch (e) {}
        pairs.splice(i, 1);
      }
    }
  }

  function insideSource(el) {
    var a = el.parentElement;
    while (a) {
      if (pairMap.has(a)) return true;
      a = a.parentElement;
    }
    return false;
  }

  function scan() {
    if (!document.body) return;
    cleanupPairs();

    // --- A. éléments texte contenant un tableau ou du code (```)
    var all = document.body.querySelectorAll('div,p,span,li,section,article,blockquote');
    var cands = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      try {
        if (el.closest('[data-nova-ui]')) continue;
        if (el.querySelector('textarea,input')) continue;
        var known = pairMap.has(el);
        if (!known && insideSource(el)) continue;
        var tc = el.textContent;
        if (!tc || tc.length > 80000) continue;
        if (!known) {
          if (tc.indexOf('```') < 0 && !(tc.indexOf('|') > -1 && tc.indexOf('--') > -1)) continue;
          var bl = parseBlocks(rawText(el));
          var ok = false;
          for (var k = 0; k < bl.length; k++) {
            if (bl[k].t === 'table' || (bl[k].t === 'code' && bl[k].code.length > 0)) { ok = true; break; }
          }
          if (!ok) continue;
        }
        cands.push(el);
      } catch (e) {}
    }
    // on garde seulement l'élément le plus profond
    var anc = new Set();
    for (var c = 0; c < cands.length; c++) {
      var a = cands[c].parentElement;
      while (a && !anc.has(a)) { anc.add(a); a = a.parentElement; }
    }
    for (var f = 0; f < cands.length; f++) {
      var cand = cands[f];
      if (anc.has(cand)) continue;
      try {
        if (isUserMessage(cand)) continue;
        processSource(cand, 'text');
      } catch (e) {}
    }

    // --- B. blocs <pre> déjà créés par l'app
    var pres = document.body.querySelectorAll('pre');
    for (var p = 0; p < pres.length; p++) {
      var pre = pres[p];
      try {
        if (pre.closest('[data-nova-ui]')) continue;
        if (!pairMap.has(pre) && insideSource(pre)) continue;
        if (!(pre.textContent || '').trim()) continue;
        if (isUserMessage(pre)) continue;
        processSource(pre, 'pre');
      } catch (e) {}
    }
  }

  /* ============================================================
     9. COPIER + MODALE PLEIN ÉCRAN
     ============================================================ */
  function copyText(t, cb) {
    function done(ok) { try { if (cb) cb(ok); } catch (e) {} }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = t;
        ta.setAttribute('readonly', '');
        ta.setAttribute('data-nova-ui', 'tmp');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try { ta.setSelectionRange(0, t.length); } catch (e) {}
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        done(ok);
      } catch (e) { done(false); }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(t).then(function () { done(true); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  function flashCopied(btn) {
    try {
      var span = btn.querySelector('span');
      if (!span) return;
      var old = btn.__novaLabel || span.textContent;
      btn.__novaLabel = old;
      span.textContent = 'Copié !';
      clearTimeout(btn.__novaT);
      btn.__novaT = setTimeout(function () { try { span.textContent = old; } catch (e) {} }, 2000);
    } catch (e) {}
  }

  function closeModal() {
    try {
      var m = document.querySelector('.nvt-modal');
      if (m && m.parentNode) m.parentNode.removeChild(m);
    } catch (e) {}
  }

  function openModal(code, lang) {
    try {
      closeModal();
      var m = document.createElement('div');
      m.className = 'nvt-modal';
      m.setAttribute('data-nova-ui', 'modal');
      m.__code = code;
      m.innerHTML =
        '<div class="nvt-mhead"><span class="nvt-lang">' + esc(lang || 'code') + '</span>' +
        '<span class="nvt-btns">' +
        '<button type="button" class="nvt-btn" data-nova-act="mcopy">' + SVG_COPY + '<span>Copier</span></button>' +
        '<button type="button" class="nvt-btn" data-nova-act="mclose">' + SVG_X + '<span>Fermer</span></button>' +
        '</span></div>' +
        '<div class="nvt-mbody"><div class="nvt-code" style="margin:0;max-width:none"><pre class="nvt-pre" style="max-height:none;overflow:auto"><code>' +
        codeHtml(code, lang) + '</code></pre></div></div>';
      document.body.appendChild(m);
    } catch (e) {}
  }

  function findMicTarget(t) {
    try {
      var m = t.closest('[data-nova-voix="micro"]');
      if (m) return m;
      var b = t.closest('button,[role="button"]');
      if (b) return b.querySelector('[data-nova-voix="micro"]');
    } catch (e) {}
    return null;
  }

  function onClick(e) {
    try {
      var t = e.target;
      if (!t || !t.closest) return;

      // micro Nova Voix : on prend la main pour éviter tout doublon d'écoute
      if (findMicTarget(t)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        safeRun(onMicClick);
        return;
      }

      // flèche bas
      var arrow = t.closest('.nvt-arrow');
      if (arrow) { e.preventDefault(); e.stopPropagation(); goBottom(); return; }

      var btn = t.closest('[data-nova-act]');
      if (btn) {
        var act = btn.getAttribute('data-nova-act');
        e.preventDefault();
        e.stopPropagation();
        if (act === 'copy' || act === 'view') {
          var sib = btn.closest('[data-nova-ui="msg"]');
          var codes = sib && sib.__novaCodes;
          var item = codes && codes[parseInt(btn.getAttribute('data-i'), 10)];
          if (!item) return;
          if (act === 'copy') copyText(item.code, function (ok) { if (ok) flashCopied(btn); });
          else openModal(item.code, item.lang);
        } else if (act === 'mcopy') {
          var mm = btn.closest('.nvt-modal');
          if (mm) copyText(mm.__code || '', function (ok) { if (ok) flashCopied(btn); });
        } else if (act === 'mclose') {
          closeModal();
        }
        return;
      }

      // un clic dans la zone de saisie (envoi) = l'utilisateur veut voir la réponse
      if (state.row && state.row.contains(t)) state.away = false;
    } catch (err) {}
  }

  // Empêche les autres scripts de réagir à l'appui sur le micro (le clic est géré par onClick)
  function onMicPress(e) {
    try {
      var t = e.target;
      if (t && t.closest && findMicTarget(t)) e.stopPropagation();
    } catch (err) {}
  }

  function onKeydown(e) {
    try {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && !e.shiftKey && isEditable(e.target)) state.away = false;
    } catch (err) {}
  }

  /* ============================================================
     10. ZONE DE SAISIE : détection de la barre + MICRO MORT masqué par position
         (jamais la zone de saisie, jamais le +, jamais l'envoi, jamais data-nova-voix)
     ============================================================ */
  function findInput() {
    try {
      var list = document.querySelectorAll('textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable=""]');
      var first = null, vis = null, ta = null;
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.closest('[data-nova-ui]')) continue;
        var ph = (el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || el.getAttribute('aria-label') || '');
        var r = el.getBoundingClientRect();
        if (/[ée]crivez/i.test(ph) || /nova/i.test(ph)) {
          if (!first) first = el;
          if (!vis && r.width > 0 && r.height > 0) vis = el;
        } else if (!ta && el.tagName === 'TEXTAREA' && r.width > 0 && r.height > 0) {
          ta = el;
        }
      }
      return vis || first || ta;
    } catch (e) { return null; }
  }

  function findRow(input) {
    try {
      var el = input.parentElement, n = 0;
      while (el && n < 6) {
        if (el.querySelectorAll('button,[role="button"]').length >= 2) return el;
        el = el.parentElement;
        n++;
      }
      return input.parentElement;
    } catch (e) { return null; }
  }

  function refreshComposer() {
    var inp = findInput();
    state.input = inp;
    state.row = inp ? findRow(inp) : null;
  }

  function attrText(el) {
    try {
      var cn = typeof el.className === 'string' ? el.className : ((el.className && el.className.baseVal) || '');
      return (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + cn + ' ' +
        (el.id || '') + ' ' + (el.getAttribute('name') || '') + ' ' + (el.getAttribute('data-testid') || '');
    } catch (e) { return ''; }
  }

  var MIC_RX = /(^|[^a-z])(mic|micro|microphone|voice|voix|dict[a-z]*|speech|vocal)([^a-z]|$)/i;
  var SEND_RX = /(^|[^a-z])(send|envoyer|envoi|submit|valider)([^a-z]|$)/i;
  var PLUS_RX = /(^|[^a-z])(plus|add|ajout[a-z]*|attach[a-z]*|joindre|upload|fichier|file|import)([^a-z]|$)/i;

  function isProtected(el) {
    try {
      return !!(el.closest && el.closest('[data-nova-voix]')) || !!(el.querySelector && el.querySelector('[data-nova-voix]'));
    } catch (e) { return false; }
  }

  function killEl(el) {
    try {
      if (el.getAttribute('data-nova-micro-mort') === '1' && el.style.display === 'none') return;
      el.setAttribute('data-nova-micro-mort', '1');
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    } catch (e) {}
  }

  // Analyse la barre : zone de texte, +, envoi, et boutons visibles
  function analyzeRow() {
    try {
      var input = findInput();
      if (!input) return null;
      var row = findRow(input);
      if (!row) return null;

      var cand = [], i, t, sv;
      var btns = row.querySelectorAll('button,[role="button"]');
      for (i = 0; i < btns.length; i++) {
        t = btns[i];
        if (t.closest('[data-nova-ui]') || t.contains(input)) continue;
        if (cand.indexOf(t) === -1) cand.push(t);
      }
      var svgs = row.querySelectorAll('svg');
      for (i = 0; i < svgs.length; i++) {
        sv = svgs[i];
        if (sv.closest('[data-nova-ui]')) continue;
        if (sv.closest('button,[role="button"]')) continue;
        t = sv;
        var par = sv.parentElement;
        if (par && par !== row && !par.contains(input) && par.querySelectorAll('svg').length === 1) t = par;
        if (cand.indexOf(t) === -1) cand.push(t);
      }

      // re-masquer ce qui a déjà été masqué (si l'app remet le style)
      var dead = row.querySelectorAll('[data-nova-micro-mort="1"]');
      for (i = 0; i < dead.length; i++) killEl(dead[i]);

      var live = [];
      for (i = 0; i < cand.length; i++) {
        if (cand[i].getAttribute('data-nova-micro-mort') === '1') continue;
        var rr = cand[i].getBoundingClientRect();
        if (rr.width > 0 && rr.height > 0) live.push(cand[i]);
      }

      // bouton envoyer
      var send = null, sure = false, k, t2;
      for (k = 0; k < live.length; k++) {
        t2 = live[k];
        if (isProtected(t2)) continue;
        if (t2.type === 'submit' || SEND_RX.test(attrText(t2))) { send = t2; sure = true; break; }
      }
      if (!send) {
        for (k = 0; k < live.length; k++) {
          t2 = live[k];
          if (isProtected(t2)) continue;
          if (blueBg(t2) || (t2.firstElementChild && blueBg(t2.firstElementChild))) {
            if (!send || t2.getBoundingClientRect().right > send.getBoundingClientRect().right) { send = t2; sure = true; }
          }
        }
      }
      if (!send) {
        for (k = 0; k < live.length; k++) {
          t2 = live[k];
          if (isProtected(t2)) continue;
          if (!send || t2.getBoundingClientRect().right > send.getBoundingClientRect().right) send = t2;
        }
      }

      // bouton +
      var plus = null;
      for (k = 0; k < live.length; k++) {
        t2 = live[k];
        if (t2 === send || isProtected(t2)) continue;
        if (PLUS_RX.test(attrText(t2)) || (t2.textContent || '').trim() === '+') { plus = t2; break; }
      }

      return { input: input, row: row, live: live, send: send, sendSure: sure, plus: plus };
    } catch (e) { return null; }
  }

  // Masque le micro mort : tout bouton entre la zone de texte et l'envoi
  // qui n'est ni +, ni envoi, ni data-nova-voix
  function hideDeadMic(info) {
    var input = info.input, send = info.send, plus = info.plus, live = info.live;
    var iRect = input.getBoundingClientRect();
    var sRect = send ? send.getBoundingClientRect() : null;

    for (var k = 0; k < live.length; k++) {
      var t2 = live[k];
      if (t2 === send || t2 === plus) continue;
      if (isProtected(t2)) continue;
      if (send && (t2.contains(send) || send.contains(t2))) continue;
      if (plus && (t2.contains(plus) || plus.contains(t2))) continue;

      var r = t2.getBoundingClientRect();
      var byAttr = MIC_RX.test(attrText(t2));
      var byPos = !!sRect &&
        r.left >= iRect.left + iRect.width * 0.6 &&
        r.right <= sRect.left + 6 &&
        r.top < sRect.bottom && r.bottom > sRect.top;

      if (byAttr || byPos) killEl(t2);
    }
  }

  /* ============================================================
     10b. MICRO NOVA VOIX : un seul, seulement dans la vraie barre de saisie
          (on ne le crée JAMAIS : on le montre, le cache et le place)
     ============================================================ */
  function getMics() {
    try { return document.querySelectorAll('[data-nova-voix="micro"]'); } catch (e) { return []; }
  }

  function setHidden(el, hide) {
    try {
      if (hide) {
        if (el.getAttribute('data-nova-vh') === '1' && el.style.display === 'none') return;
        if (el.getAttribute('data-nova-vh') !== '1') {
          el.__novaDV = el.style.getPropertyValue('display');
          el.__novaDP = el.style.getPropertyPriority('display');
          el.setAttribute('data-nova-vh', '1');
        }
        el.style.setProperty('display', 'none', 'important');
      } else if (el.getAttribute('data-nova-vh') === '1') {
        el.style.removeProperty('display');
        if (el.__novaDV) el.style.setProperty('display', el.__novaDV, el.__novaDP || '');
        el.removeAttribute('data-nova-vh');
      }
    } catch (e) {}
  }

  // La vraie barre [ + ] [ Écrivez à Nova AI.. ] [ ➤ ] est-elle visible et au premier plan ?
  function composerVisible(info) {
    try {
      if (!info || !info.input || !info.input.isConnected) return false;
      var input = info.input;
      var ph = (input.getAttribute('placeholder') || input.getAttribute('data-placeholder') || input.getAttribute('aria-label') || '');
      if (!(/[ée]crivez/i.test(ph) || /nova/i.test(ph))) return false;
      var r = input.getBoundingClientRect();
      if (r.width < 20 || r.height < 10) return false;
      var vw = window.innerWidth, vh = window.innerHeight;
      if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return false;
      var cs = window.getComputedStyle(input);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      var cx = Math.min(Math.max(r.left + r.width / 2, 1), vw - 1);
      var cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
      var top = document.elementFromPoint(cx, cy);
      if (top && !(top === input || input.contains(top) || (info.row && info.row.contains(top)))) return false; // couvert par une autre page
      return true;
    } catch (e) { return false; }
  }

  // Place le micro entre la zone de texte et le bouton envoyer
  function placeMic(mic, info) {
    try {
      var send = info.send;
      if (!send || send === mic || mic.contains(send) || send.contains(mic)) return;
      var par = send.parentElement;
      if (!par) return;
      if (mic.parentElement === par && mic.nextElementSibling === send) return;
      var t = now();
      if (t - state.moves.t > 10000) { state.moves.t = t; state.moves.n = 0; }
      if (state.moves.n >= 20) return; // sécurité anti-bagarre avec l'app
      state.moves.n++;
      par.insertBefore(mic, send);
      var cs = window.getComputedStyle(mic);
      if (cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'sticky') {
        mic.style.setProperty('position', 'relative', 'important');
        mic.style.setProperty('top', 'auto', 'important');
        mic.style.setProperty('left', 'auto', 'important');
        mic.style.setProperty('right', 'auto', 'important');
        mic.style.setProperty('bottom', 'auto', 'important');
        mic.style.setProperty('transform', 'none', 'important');
      }
      mic.style.setProperty('flex', 'none', 'important');
    } catch (e) {}
  }

  function syncMic(info) {
    var mics = getMics();
    if (!mics.length) return;
    var visible = composerVisible(info);
    var main = null, i;
    if (visible) {
      for (i = 0; i < mics.length; i++) {
        if (info.row && info.row.contains(mics[i])) { main = mics[i]; break; }
      }
      if (!main) main = mics[0];
    }
    for (i = 0; i < mics.length; i++) setHidden(mics[i], !(visible && mics[i] === main));
    if (main) placeMic(main, info);
    else if (state.mic.on) micAbort();
  }

  function syncComposer() {
    var info = analyzeRow();
    if (info) safeRun(function () { hideDeadMic(info); });
    safeRun(function () { syncMic(info); });
  }

  /* ============================================================
     10c. MICRO : écoute fr-FR, dictée en direct, envoi automatique
     ============================================================ */
  function readInput(inp) {
    try {
      return (inp.tagName === 'TEXTAREA' || inp.tagName === 'INPUT') ? (inp.value || '') : (inp.textContent || '');
    } catch (e) { return ''; }
  }

  function writeInput(inp, val) {
    try {
      if (inp.tagName === 'TEXTAREA' || inp.tagName === 'INPUT') {
        var proto = inp.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var d = Object.getOwnPropertyDescriptor(proto, 'value');
        if (d && d.set) d.set.call(inp, val); else inp.value = val;
      } else {
        inp.textContent = val;
      }
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {}
  }

  function setMicVisual(on) {
    try {
      var mics = getMics();
      for (var i = 0; i < mics.length; i++) {
        if (on) mics[i].classList.add('nvt-mic-on');
        else mics[i].classList.remove('nvt-mic-on');
        mics[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    } catch (e) {}
  }

  function currentInput() {
    return (state.input && state.input.isConnected) ? state.input : findInput();
  }

  // Envoi automatique : uniquement si le vrai bouton envoyer bleu est identifié sans doute
  function trySend() {
    try {
      var info = analyzeRow();
      if (!info || !info.send || !info.sendSure) return;
      if (!readInput(info.input).trim()) return;
      var b = info.send;
      if (b.disabled || b.getAttribute('aria-disabled') === 'true') return;
      b.click();
    } catch (e) {}
  }

  function micFinish(rec) {
    try {
      var M = state.mic;
      if (M.rec !== rec) return;
      clearTimeout(M.timer);
      M.on = false;
      M.rec = null;
      setMicVisual(false);
      var heard = String(M.heard || '').trim();
      var manual = M.manual;
      M.manual = false;
      if (manual || !heard) return; // arrêt manuel : le texte reste dans la zone
      setTimeout(function () { safeRun(trySend); }, 200);
    } catch (e) {}
  }

  function micAbort() {
    try {
      var M = state.mic;
      if (!M.rec) return;
      M.manual = true;
      clearTimeout(M.timer);
      var rec = M.rec;
      try { rec.abort(); } catch (e) {}
      setTimeout(function () { micFinish(rec); }, 300);
    } catch (e) {}
  }

  function micStart() {
    var M = state.mic;
    var inp = currentInput();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      // Navigateur sans reconnaissance vocale : on met le curseur dans la zone (dictée du clavier possible)
      try { if (inp) inp.focus(); } catch (e) {}
      return;
    }
    var rec;
    try { rec = new SR(); } catch (e) { return; }
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    M.rec = rec;
    M.on = true;
    M.manual = false;
    M.heard = '';
    M.base = inp ? readInput(inp) : '';

    rec.onresult = function (ev) {
      try {
        if (M.rec !== rec) return;
        var txt = '';
        for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
        M.heard = txt;
        var cur = currentInput();
        if (cur) {
          var base = M.base || '';
          var sep = base && !/\s$/.test(base) ? ' ' : '';
          writeInput(cur, base + sep + txt.replace(/^\s+/, ''));
        }
        // 1,5 seconde de silence : on arrête l'écoute (puis envoi automatique)
        clearTimeout(M.timer);
        M.timer = setTimeout(function () {
          try { if (M.rec === rec && M.on) rec.stop(); } catch (e) {}
        }, 1500);
      } catch (e) {}
    };
    rec.onerror = function () {
      // permission refusée ou erreur : on ne bloque rien, on n'envoie rien
      try { M.manual = true; } catch (e) {}
      micFinish(rec);
    };
    rec.onend = function () { micFinish(rec); };

    setMicVisual(true);
    try {
      rec.start();
    } catch (e) {
      M.manual = true;
      micFinish(rec);
    }
  }

  function onMicClick() {
    var M = state.mic;
    if (M.on && M.rec) {
      // 2e clic pendant l'écoute : on arrête, sans envoyer, le texte reste dans la zone
      M.manual = true;
      clearTimeout(M.timer);
      var rec = M.rec;
      try { rec.stop(); } catch (e) { micFinish(rec); return; }
      setTimeout(function () { micFinish(rec); }, 1500);
      return;
    }
    micStart();
  }

  /* ============================================================
     11. CLAVIER : la barre d'écriture reste AU-DESSUS (Visual Viewport + focusin)
     ============================================================ */
  function findFixedAncestor(el) {
    try {
      var a = el, n = 0;
      while (a && a !== document.body && a !== document.documentElement && n < 10) {
        var p = window.getComputedStyle(a).position;
        if (p === 'fixed' || p === 'sticky') return a;
        a = a.parentElement;
        n++;
      }
    } catch (e) {}
    return null;
  }

  function applyKeyboard() {
    try {
      var inp = findInput();
      if (!inp) return;
      var vv = window.visualViewport;
      var kb = 0;
      if (vv) {
        kb = Math.round(window.innerHeight - vv.height - vv.offsetTop);
        if (kb < 0) kb = 0;
      }
      var focused = isEditable(document.activeElement);
      var host = findFixedAncestor(inp);
      if (host) {
        if (kb > 80 && focused) {
          if (host.getAttribute('data-nova-kb') !== '1') {
            host.__novaTr = host.style.transform || '';
            host.__novaTn = host.style.transition || '';
          }
          host.style.transition = 'transform .15s ease-out';
          host.style.transform = 'translateY(-' + kb + 'px)';
          host.setAttribute('data-nova-kb', '1');
        } else if (host.getAttribute('data-nova-kb') === '1') {
          host.style.transform = host.__novaTr || '';
          host.style.transition = host.__novaTn || '';
          host.removeAttribute('data-nova-kb');
        }
      } else if (kb > 80 && focused) {
        var row = findRow(inp) || inp;
        var fn = ORIG.scrollIntoView || row.scrollIntoView;
        fn.call(row, { block: 'end', behavior: 'smooth' });
      }
      updateArrow();
    } catch (e) {}
  }

  function onFocusIn(e) {
    try {
      if (!isEditable(e.target)) return;
      setTimeout(function () { safeRun(applyKeyboard); }, 60);
      setTimeout(function () { safeRun(applyKeyboard); }, 300);
      setTimeout(function () { safeRun(applyKeyboard); }, 650);
    } catch (err) {}
  }

  function onFocusOut() {
    setTimeout(function () { safeRun(applyKeyboard); }, 150);
  }

  /* ============================================================
     12. SCROLL LIBRE + FLÈCHE ↓
     ============================================================ */
  function isDocScroller(s) {
    return s === document.scrollingElement || s === document.documentElement || s === document.body;
  }

  function getScroller() {
    try {
      if (state.scroller && state.scroller.isConnected && (now() - state.scrollerAt) < 1500) return state.scroller;
      var best = null, bestArea = 0;
      var els = document.body.querySelectorAll('div,main,section,article,ul');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.closest('[data-nova-ui]')) continue;
        var h = el.clientHeight;
        if (h < 150 || el.scrollHeight <= h + 20) continue;
        var oy = window.getComputedStyle(el).overflowY;
        if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') continue;
        var area = el.clientWidth * h;
        if (area > bestArea) { best = el; bestArea = area; }
      }
      var se = document.scrollingElement || document.documentElement;
      var docScrolls = se.scrollHeight > se.clientHeight + 20;
      if (!best || (docScrolls && bestArea < 0.5 * window.innerWidth * window.innerHeight)) best = se;
      state.scroller = best;
      state.scrollerAt = now();
      return best;
    } catch (e) { return document.scrollingElement || document.documentElement; }
  }

  function getDist(s) {
    return s.scrollHeight - s.scrollTop - s.clientHeight;
  }

  function onScroll(e) {
    try {
      var s = getScroller();
      var t = e.target;
      if (!(t === s || (t === document && isDocScroller(s)))) return;
      var top = s.scrollTop;
      var dist = getDist(s);
      if (!state.chase) {
        if (top < state.lastTop - 1 && dist > 40) state.away = true; // l'utilisateur remonte
      }
      if (dist <= 24) state.away = false;
      state.lastTop = top;
      updateArrow();
    } catch (err) {}
  }

  // Empêche l'app de ramener de force l'utilisateur en bas quand il est remonté
  function patchScroll() {
    try {
      var EP = Element.prototype;
      if (EP.__novaScrollPatched) return;
      Object.defineProperty(EP, '__novaScrollPatched', { value: true, enumerable: false });

      ORIG.scrollIntoView = EP.scrollIntoView;
      ORIG.scrollTo = EP.scrollTo;
      ORIG.scroll = EP.scroll;
      ORIG.scrollBy = EP.scrollBy;
      ORIG.winScrollTo = window.scrollTo;

      function wantsDown(el, a, b, relative) {
        var top = (a && typeof a === 'object') ? a.top : b;
        if (typeof top !== 'number') return false;
        if (relative) return top > 0;
        return top > el.scrollTop + 1;
      }

      function guardEl(origFn, relative) {
        return function (a, b) {
          try {
            if (state.away && !state.chase && this === getScroller() && wantsDown(this, a, b, relative)) return;
          } catch (e) {}
          return origFn.apply(this, arguments);
        };
      }

      if (ORIG.scrollTo) EP.scrollTo = guardEl(ORIG.scrollTo, false);
      if (ORIG.scroll) EP.scroll = guardEl(ORIG.scroll, false);
      if (ORIG.scrollBy) EP.scrollBy = guardEl(ORIG.scrollBy, true);

      if (ORIG.scrollIntoView) {
        EP.scrollIntoView = function () {
          try {
            if (state.away && !state.chase) {
              var s = getScroller();
              if (s && s !== this && s.contains(this) && !(state.row && state.row.contains(this))) {
                var r = this.getBoundingClientRect();
                var bottom = isDocScroller(s) ? window.innerHeight : s.getBoundingClientRect().bottom;
                if (r.bottom > bottom - 2) return;
              }
            }
          } catch (e) {}
          return ORIG.scrollIntoView.apply(this, arguments);
        };
      }

      var desc = Object.getOwnPropertyDescriptor(EP, 'scrollTop');
      if (desc && desc.set && desc.get) {
        Object.defineProperty(EP, 'scrollTop', {
          configurable: true,
          enumerable: desc.enumerable,
          get: function () { return desc.get.call(this); },
          set: function (v) {
            try {
              if (state.away && !state.chase && typeof v === 'number' && this === getScroller() && v > desc.get.call(this) + 1) return;
            } catch (e) {}
            desc.set.call(this, v);
          }
        });
      }

      if (ORIG.winScrollTo) {
        window.scrollTo = function (a, b) {
          try {
            if (state.away && !state.chase && isDocScroller(getScroller())) {
              var top = (a && typeof a === 'object') ? a.top : b;
              if (typeof top === 'number' && top > (window.pageYOffset || 0) + 1) return;
            }
          } catch (e) {}
          return ORIG.winScrollTo.apply(window, arguments);
        };
      }
    } catch (e) {}
  }

  function ensureArrow() {
    var a = document.getElementById('nova-arrow-bas');
    if (a) return a;
    a = document.createElement('div');
    a.id = 'nova-arrow-bas';
    a.className = 'nvt-arrow';
    a.setAttribute('data-nova-ui', 'arrow');
    a.setAttribute('role', 'button');
    a.setAttribute('aria-label', 'Descendre en bas');
    a.innerHTML = SVG_DOWN;
    document.body.appendChild(a);
    return a;
  }

  function updateArrow() {
    try {
      if (!document.body) return;
      var a = ensureArrow();
      var s = getScroller();
      var dist = s ? getDist(s) : 0;
      var bottom = 90;
      var row = state.row;
      if (row && row.isConnected) {
        var r = row.getBoundingClientRect();
        if (r.height > 0) bottom = Math.max(70, Math.round(window.innerHeight - r.top + 12));
      }
      a.style.bottom = bottom + 'px';
      if (dist > 100) a.classList.add('nvt-on');
      else a.classList.remove('nvt-on');
    } catch (e) {}
  }

  function goBottom() {
    try {
      var s = getScroller();
      state.away = false;
      state.chase = true;
      var n = 0;
      var step = function () {
        try {
          var target = s.scrollHeight;
          if (isDocScroller(s)) (ORIG.winScrollTo || window.scrollTo).call(window, { top: target, behavior: 'smooth' });
          else (ORIG.scrollTo || s.scrollTo).call(s, { top: target, behavior: 'smooth' });
        } catch (e) {}
        n++;
        setTimeout(function () {
          try {
            if (getDist(s) > 40 && n < 6) step();
            else { state.chase = false; state.lastTop = s.scrollTop; updateArrow(); }
          } catch (e) { state.chase = false; }
        }, 450);
      };
      step();
    } catch (e) { state.chase = false; }
  }

  /* ============================================================
     13. CURSEUR clignotant pendant l'écriture (aucune animation sur le texte)
     ============================================================ */
  function cursorSpot(sib) {
    var w = sib.lastElementChild;
    while (w && w.classList.contains('nvt-gap')) w = w.previousElementSibling;
    return w || sib;
  }

  function resolveCursorTarget(el) {
    try {
      if (!el || !el.isConnected) return null;
      var a = el;
      while (a && a !== document.body) {
        var pair = pairMap.get(a);
        if (pair) return cursorSpot(pair.sib);
        a = a.parentElement;
      }
      var t = el, n = 0;
      while (t && t.parentElement && n < 4 && window.getComputedStyle(t).display === 'inline') {
        t = t.parentElement;
        n++;
      }
      if (!t || t === document.body || t === document.documentElement) return null;
      return t;
    } catch (e) { return null; }
  }

  function updateCursor() {
    var active = !!state.lastTarget && (now() - state.lastActivity < 900);
    var target = active ? resolveCursorTarget(state.lastTarget) : null;
    if (target && (inUi(target) && !target.closest('[data-nova-ui="msg"]'))) target = null;
    if (target && state.row && state.row.contains(target)) target = null;
    if (target && isUserMessage(target)) target = null;

    if (state.cursorEl && state.cursorEl !== target) {
      try { state.cursorEl.classList.remove('nvt-writing'); } catch (e) {}
      state.cursorEl = null;
    }
    if (target && state.cursorEl !== target) {
      target.classList.add('nvt-writing');
      state.cursorEl = target;
    }
    clearTimeout(state.idleT);
    if (active) state.idleT = setTimeout(tick, 950);
  }

  /* ============================================================
     14. OBSERVATEURS (discussion + zone de saisie) + CYCLE PRINCIPAL
     ============================================================ */
  function onMutations(muts) {
    var relevant = false;
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      try {
        if (inUi(m.target)) continue;
        if (m.type === 'characterData') {
          if (state.row && state.row.contains(m.target)) continue;
          relevant = true;
          state.lastActivity = now();
          state.lastTarget = m.target.parentElement;
        } else {
          var added = m.addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType === 1) {
              if (n.hasAttribute && n.hasAttribute('data-nova-ui')) continue;
              relevant = true;
              state.lastActivity = now();
              state.lastTarget = n;
            } else if (n.nodeType === 3) {
              relevant = true;
              state.lastActivity = now();
              state.lastTarget = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            }
          }
          if (m.removedNodes.length) relevant = true;
        }
      } catch (e) {}
    }
    if (relevant) scheduleTick(90);
  }

  function startObservers() {
    try {
      if (!document.body) return;
      if (!bodyObs) {
        bodyObs = new MutationObserver(function (m) { try { onMutations(m); } catch (e) {} });
        bodyObs.observe(document.body, { childList: true, subtree: true, characterData: true });
      }
      var inp = findInput();
      var row = inp ? findRow(inp) : null;
      if (row && row !== rowObsEl) {
        if (rowObs) { try { rowObs.disconnect(); } catch (e) {} }
        rowObs = new MutationObserver(function () { safeRun(syncComposer); });
        rowObs.observe(row, { childList: true, subtree: true, attributes: true });
        rowObsEl = row;
      }
    } catch (e) {}
  }

  function bindEvents() {
    try {
      if (state.bound) return;
      state.bound = true;
      document.addEventListener('click', onClick, true);
      var pressEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
      for (var i = 0; i < pressEvents.length; i++) document.addEventListener(pressEvents[i], onMicPress, true);
      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('focusin', onFocusIn, true);
      document.addEventListener('focusout', onFocusOut, true);
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', function () { safeRun(applyKeyboard); });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () { safeRun(applyKeyboard); });
        window.visualViewport.addEventListener('scroll', function () { safeRun(applyKeyboard); });
      }
    } catch (e) {}
  }

  var tickBusy = false;
  function tick() {
    if (tickBusy) return;
    tickBusy = true;
    try {
      safeRun(refreshComposer);
      safeRun(scan);
      safeRun(syncComposer);
      safeRun(updateCursor);
      safeRun(updateArrow);
    } finally {
      tickBusy = false;
    }
  }

  /* ============================================================
     15. DÉMARRAGE AUTOMATIQUE (aucune action manuelle)
     ============================================================ */
  function init() {
    safeRun(ensureStyle);
    safeRun(patchFetch);
    safeRun(patchXHR);
    safeRun(patchScroll);
    safeRun(startObservers);
    safeRun(bindEvents);
    safeRun(tick);
  }

  // Branchement immédiat au cerveau (avant même que le DOM soit prêt)
  safeRun(patchFetch);
  safeRun(patchXHR);
  safeRun(patchScroll);

  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (e) {}
  try { window.addEventListener('load', function () { safeRun(init); }); } catch (e) {}

  // Relance de sécurité toutes les 2 secondes
  try {
    setInterval(function () {
      safeRun(patchFetch);
      safeRun(patchXHR);
      safeRun(patchScroll);
      safeRun(ensureStyle);
      safeRun(startObservers);
      safeRun(bindEvents);
      safeRun(tick);
    }, 2000);
  } catch (e) {}

  // Micro mort caché + micro Nova Voix montré/caché selon la page (toutes les 500 ms)
  try { setInterval(function () { safeRun(syncComposer); }, 500); } catch (e) {}
})();
