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

  var BLUE = '#2f7bff';
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
    idleT: null
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
     2. STYLES (injectés une seule fois)
     ============================================================ */
  function ensureStyle() {
    try {
      if (document.getElementById('nova-update-style')) return;
      var css = [
        '.nvt-msg{display:block;width:100%;box-sizing:border-box;color:inherit;font:inherit;line-height:1.55;word-wrap:break-word}',
        '.nvt-text{margin:8px 0;white-space:normal}',
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
        '.nvt-btns.nvt-hide{visibility:hidden}',
        '.nvt-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #333;background:#1c1c1e;color:#fff;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer;font-family:inherit;line-height:1;-webkit-tap-highlight-color:transparent}',
        '.nvt-btn svg{width:14px;height:14px;flex:none}',
        '.nvt-pre{margin:0!important;padding:12px 14px!important;overflow:auto;max-height:420px;background:#0d0d0d!important;-webkit-overflow-scrolling:touch;border:0!important;border-radius:0!important}',
        '.nvt-pre code{display:block;white-space:pre!important;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace!important;font-size:13px!important;line-height:1.55;color:#e6e6e6!important;background:transparent!important;padding:0!important;tab-size:4;word-break:normal;overflow-wrap:normal}',
        '.nvt-k{color:#c678dd}.nvt-s{color:#98c379}.nvt-c{color:#7f848e;font-style:italic}.nvt-n{color:#61afef}',
        /* modale plein écran */
        '.nvt-modal{position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483600;background:rgba(0,0,0,.95);display:flex;flex-direction:column;color:#fff}',
        '.nvt-mhead{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;padding-top:max(12px,env(safe-area-inset-top));border-bottom:1px solid #262626}',
        '.nvt-mbody{flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch}',
        /* curseur + apparition douce */
        '@keyframes nvt-blink{0%,49%{opacity:1}50%,100%{opacity:0}}',
        '.nvt-writing::after{content:"";display:inline-block;width:2px;height:1.05em;margin-left:3px;vertical-align:text-bottom;background:#2f7bff;animation:nvt-blink 1s step-end infinite}',
        '@keyframes nvt-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
        '.nvt-in{animation:nvt-in .22s ease-out backwards}',
        /* flèche bas */
        '.nvt-arrow{position:fixed;left:50%;margin-left:-19px;width:38px;height:38px;border-radius:50%;background:#2f7bff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.45);cursor:pointer;z-index:2147482000;opacity:0;transform:translateY(8px) scale(.9);pointer-events:none;transition:opacity .2s,transform .2s;-webkit-tap-highlight-color:transparent}',
        '.nvt-arrow.nvt-on{opacity:1;transform:none;pointer-events:auto}',
        '.nvt-arrow svg{width:18px;height:18px}'
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
     6. RENDU HTML : texte / tableau / code
     ============================================================ */
  function inline(s) {
    s = esc(s);
    s = s.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code class="nvt-ic">$1</code>');
    return s;
  }

  function renderText(b) {
    var lines = b.lines.slice();
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) return '';
    var html = '', para = [];
    function endPara() {
      if (para.length) {
        html += '<div class="nvt-text">' + para.join('<br>') + '</div>';
        para = [];
      }
    }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (!l.trim()) { endPara(); continue; }
      var h = /^\s*#{1,6}\s+(.*)$/.exec(l);
      if (h) para.push('<strong>' + inline(h[1]) + '</strong>');
      else para.push(inline(l));
    }
    endPara();
    return html;
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

  function renderCode(b, idx, done) {
    var label = b.lang || (looksPython(b.code) ? 'python' : 'code');
    var btns =
      '<span class="nvt-btns' + (done ? '' : ' nvt-hide') + '">' +
      '<button type="button" class="nvt-btn" data-nova-act="copy" data-i="' + idx + '">' + SVG_COPY + '<span>Copier</span></button>' +
      '<button type="button" class="nvt-btn" data-nova-act="view" data-i="' + idx + '">' + SVG_EYE + '<span>Voir le code en entier</span></button>' +
      '</span>';
    return '<div class="nvt-code"><div class="nvt-bar"><span class="nvt-lang">' + esc(label) + '</span>' + btns +
      '</div><pre class="nvt-pre"><code>' + codeHtml(b.code, b.lang) + '</code></pre></div>';
  }

  function renderBlocks(blocks, idle, codes) {
    var html = '';
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.t === 'text') html += renderText(b);
      else if (b.t === 'table') html += renderTable(b);
      else if (b.t === 'code') {
        var idx = codes.length;
        codes.push({ code: b.code, lang: b.lang });
        html += renderCode(b, idx, b.closed || idle);
      }
    }
    return html;
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
     8. TRANSFORMATION DES MESSAGES (tableaux + code), sans casser le DOM de l'app
        Principe : on garde l'original (caché) et on insère un rendu propre juste après.
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
    state.tickT = setTimeout(function () { state.tickT = null; tick(); }, delay || 60);
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
    var sig = kind + '|' + idle + '|' + text;
    var pair = pairMap.get(el);
    if (pair && pair.sig === sig) return;

    var codes = [];
    var html = renderBlocks(blocks, idle, codes);

    if (!pair) {
      var sib = document.createElement('div');
      sib.className = 'nvt-msg';
      sib.setAttribute('data-nova-ui', 'msg');
      sib.setAttribute('data-nova-tableau', 'fait');
      el.parentNode.insertBefore(sib, el.nextSibling);
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('data-nova-source', '1');
      pair = { src: el, sib: sib, sig: '' };
      pairMap.set(el, pair);
      pairs.push(pair);
    }

    // conserver le scroll des blocs de code pendant le streaming
    var saved = [];
    try {
      var olds = pair.sib.querySelectorAll('.nvt-pre');
      for (var i = 0; i < olds.length; i++) saved.push([olds[i].scrollTop, olds[i].scrollLeft]);
    } catch (e) {}
    pair.sib.innerHTML = html;
    pair.sib.__novaCodes = codes;
    try {
      var news = pair.sib.querySelectorAll('.nvt-pre');
      if (news.length === saved.length) {
        for (var j = 0; j < news.length; j++) { news[j].scrollTop = saved[j][0]; news[j].scrollLeft = saved[j][1]; }
      }
    } catch (e) {}
    pair.sig = sig;

    if (!idle) scheduleTick(1300); // pour faire apparaître les boutons quand c'est fini
  }

  function cleanupPairs() {
    for (var i = pairs.length - 1; i >= 0; i--) {
      var p = pairs[i];
      if (!p.src.isConnected) {
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

  function onClick(e) {
    try {
      var t = e.target;
      if (!t || !t.closest) return;

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

  function onKeydown(e) {
    try {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && !e.shiftKey && isEditable(e.target)) state.away = false;
    } catch (err) {}
  }

  /* ============================================================
     10. MICRO MORT : masquage (jamais le micro qui marche, le +, ni l'envoi)
     ============================================================ */
  function findInput() {
    try {
      var list = document.querySelectorAll('textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable=""]');
      var best = null;
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.closest('[data-nova-ui]')) continue;
        var ph = (el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || el.getAttribute('aria-label') || '');
        if (/[ée]crivez/i.test(ph) || /nova/i.test(ph)) return el;
        if (!best && el.tagName === 'TEXTAREA') {
          var r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) best = el;
        }
      }
      return best;
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

  function hideDeadMic() {
    var input = state.input && state.input.isConnected ? state.input : findInput();
    if (!input) return;
    var row = findRow(input);
    if (!row) return;

    var svgs = row.querySelectorAll('svg');
    var targets = [];
    for (var i = 0; i < svgs.length; i++) {
      var sv = svgs[i];
      if (sv.closest('[data-nova-ui]')) continue;
      var t = sv.closest('button,[role="button"]');
      if (!t || !row.contains(t)) t = sv;
      if (t === row) continue;
      if (targets.indexOf(t) === -1) targets.push(t);
    }

    // re-masquer ce qui a déjà été masqué (si l'app remet le style)
    var dead = row.querySelectorAll('[data-nova-micro-mort="1"]');
    for (var d = 0; d < dead.length; d++) killEl(dead[d]);

    var live = [];
    for (var a = 0; a < targets.length; a++) {
      if (targets[a].getAttribute('data-nova-micro-mort') === '1') continue;
      var rr = targets[a].getBoundingClientRect();
      if (rr.width > 0 && rr.height > 0) live.push(targets[a]);
    }

    // bouton envoyer
    var send = null, k, t2;
    for (k = 0; k < live.length; k++) {
      t2 = live[k];
      if (t2.type === 'submit' || SEND_RX.test(attrText(t2))) { send = t2; break; }
    }
    if (!send) {
      for (k = 0; k < live.length; k++) {
        t2 = live[k];
        if (blueBg(t2) || (t2.firstElementChild && blueBg(t2.firstElementChild))) {
          if (!send || t2.getBoundingClientRect().right > send.getBoundingClientRect().right) send = t2;
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
      if (t2 === send) continue;
      if (PLUS_RX.test(attrText(t2)) || (t2.textContent || '').trim() === '+') { plus = t2; break; }
    }

    var iRect = input.getBoundingClientRect();
    var sRect = send ? send.getBoundingClientRect() : null;

    for (k = 0; k < live.length; k++) {
      t2 = live[k];
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
     13. IMPRESSION : curseur clignotant + apparition douce des lignes
     ============================================================ */
  function fadeIn(n) {
    try {
      if (n.nodeType !== 1) return;
      if (n.id === 'nova-arrow-bas') return;
      if (n.querySelector && n.querySelector('textarea,input')) return;
      if (state.row && state.row.contains(n)) return;
      if (n.querySelectorAll('*').length > 150) return;
      if (isUserMessage(n)) return;
      n.classList.add('nvt-in');
      setTimeout(function () { try { n.classList.remove('nvt-in'); } catch (e) {} }, 400);
    } catch (e) {}
  }

  function resolveCursorTarget(el) {
    try {
      if (!el || !el.isConnected) return null;
      var a = el;
      while (a && a !== document.body) {
        var pair = pairMap.get(a);
        if (pair) return pair.sib.lastElementChild || pair.sib;
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
    if (target) {
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
              fadeIn(n);
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
    if (relevant) scheduleTick(60);
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
        rowObs = new MutationObserver(function () { safeRun(hideDeadMic); });
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
      safeRun(hideDeadMic);
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

  // Le micro mort reste caché même si l'app le recrée (toutes les 500 ms)
  try { setInterval(function () { safeRun(hideDeadMic); }, 500); } catch (e) {}
})();
