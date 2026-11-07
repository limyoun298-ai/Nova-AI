/* ============================================================
   NOVA AI - update.scroll.js - VERSION 7.0 CAPE
   Base V1 + SVG + scroll libre + Python rapide
   REGLE: Ne touche PAS a index.html
   Usage: <script src="update.scroll.js"></script>
   Si ce fichier plante, index.html continue de marcher.
   ============================================================ */

if (window.NOVA_SCROLL_V7) {
} else {
window.NOVA_SCROLL_V7 = true;
(function () {
  "use strict";
  try {

    /* ---------- ETAT ---------- */
    var modeLecture = false;      /* l'utilisateur a remonte volontairement */
    var dernierScrollTop = 0;
    var dernierWindowY = 0;
    var derniereMutation = 0;
    var derniereTransfo = 0;
    var dernierMajUI = 0;
    var graceJusqua = 0;
    var toucheActif = false;
    var pointeurActif = false;
    var toucheY = 0;
    var timerPoints = 0;
    var timerPython = 0;
    var transfoRaf = 0;
    var boucleId = 0;
    var obs = null;
    var fleche = null;
    var points = null;
    var flecheVisible = false;
    var pointsVisibles = false;

    var QUIET_MS = 600;           /* silence requis avant de toucher au DOM */
    var MIN_MS = 300;             /* jamais plus d'une transformation / 300ms */
    var FENCE = String.fromCharCode(96, 96, 96);

    /* ---------- OUTILS ---------- */
    function zoneChat() {
      return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
    }
    function distanceBas(zone) {
      try { return zone.scrollHeight - zone.scrollTop - zone.clientHeight; }
      catch (e) { return 0; }
    }
    function echapperHTML(t) {
      try { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
      catch (e) { return ""; }
    }
    function poserScroll(z, y) {
      try { z.scrollTo({ top: y, behavior: "instant" }); }
      catch (e) { try { z.scrollTop = y; } catch (e2) {} }
    }
    function poserWindow(y) {
      try { window.scrollTo({ top: y, left: window.pageXOffset || 0, behavior: "instant" }); }
      catch (e) { try { window.scrollTo(window.pageXOffset || 0, y); } catch (e2) {} }
    }
    function utilisateurAgit() {
      return toucheActif || pointeurActif || Date.now() < graceJusqua;
    }
    function grace(ms) {
      var t = Date.now() + ms;
      if (t > graceJusqua) graceJusqua = t;
    }
    function dansCodeScroll(el) {
      try { return !!(el && el.closest && el.closest(".nova-code-scroll")); }
      catch (e) { return false; }
    }

    /* ---------- ICONES SVG (blanches, aucun emoji) ---------- */
    function svgOeil() {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
    function svgCopier() {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
    }
    function svgFermer() {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';
    }
    function svgFlecheBas() {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
    }

    /* ---------- STYLES ---------- */
    function installerStyles() {
      try {
        if (document.getElementById("nova-v7-style")) return;
        var s = document.createElement("style");
        s.id = "nova-v7-style";
        s.textContent = [
          "@keyframes novaPoint{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}",
          ".nova-code-conteneur{width:100%;max-width:100%;margin:14px 0;border-radius:16px;overflow:hidden;background:#0d0d0d;border:1px solid #343438;color:white;}",
          ".nova-code-barre{display:flex;align-items:center;gap:7px;padding:9px 10px;background:#171717;border-bottom:1px solid #303030;flex-wrap:wrap;}",
          ".nova-code-barre button{border:0;border-radius:9px;padding:7px 10px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;color:white;}",
          ".nova-code-barre button svg{stroke:white!important;color:white!important;flex-shrink:0;}",
          ".nova-code-copier{background:#2f7bff;} .nova-code-voir{background:#2c2c2e;} .nova-code-fermer{background:#3a3a3e;}",
          ".nova-code-scroll{max-height:390px;overflow:auto;background:#0d0d0d;-webkit-overflow-scrolling:touch;}",
          ".nova-code-scroll pre{margin:0;padding:15px;min-width:max-content;font-family:monospace;font-size:13px;line-height:1.65;white-space:pre;tab-size:4;background:transparent;}",
          ".nova-code-motcle{color:#bd93f9;} .nova-code-builtin{color:#79c0ff;} .nova-code-string{color:#55d98b;} .nova-code-commentaire{color:#888888;font-style:italic;} .nova-code-nombre{color:#ffb86c;} .nova-code-normal{color:#e6e6e6;}",
          ".nova-code-modal{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;background:#080808;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);}",
          ".nova-code-modal-entete{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px;background:#171717;border-bottom:1px solid #333;}",
          ".nova-code-modal-titre{color:white;font-size:14px;font-weight:700;}",
          ".nova-code-modal-actions{display:flex;gap:7px;}",
          ".nova-code-modal button{border:0;border-radius:9px;padding:9px 12px;background:#2f7bff;color:white;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}",
          ".nova-code-modal button svg{stroke:white!important;flex-shrink:0;}",
          ".nova-code-modal .nova-fermer{background:#2c2c2e;}",
          ".nova-code-modal-corps{flex:1;overflow:auto;padding:14px;color:white;background:#0d0d0d;-webkit-overflow-scrolling:touch;}",
          ".nova-code-modal pre{margin:0;white-space:pre;width:max-content;min-width:100%;font:13px/1.7 monospace;tab-size:4;background:transparent;color:#e6e6e6;}",
          ".nova-code-cache-ancien{display:none !important;}"
        ].join("\n");
        document.head.appendChild(s);
      } catch (e) {}
    }

    /* ---------- COLORATION PYTHON ---------- */
    var MOTS_CLES = /^(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)$/;
    var TOKENS = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[^\n]*|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self|input|open|enumerate|zip|map|sum|min|max|abs|bool|type)\b|\b\d+(?:\.\d+)?\b)/g;
    function colorerPython(code) {
      try {
        var texte = String(code);
        var re = new RegExp(TOKENS.source, "g");
        var resultat = "";
        var position = 0;
        var m;
        while ((m = re.exec(texte)) !== null) {
          resultat += echapperHTML(texte.slice(position, m.index));
          var mot = m[0];
          var classe;
          var c = mot.charAt(0);
          if (c === "#") classe = "nova-code-commentaire";
          else if (c === '"' || c === "'") classe = "nova-code-string";
          else if (/^\d/.test(mot)) classe = "nova-code-nombre";
          else if (MOTS_CLES.test(mot)) classe = "nova-code-motcle";
          else classe = "nova-code-builtin";
          resultat += '<span class="' + classe + '">' + echapperHTML(mot) + "</span>";
          position = re.lastIndex;
          if (mot.length === 0) re.lastIndex++;
        }
        resultat += echapperHTML(texte.slice(position));
        return resultat;
      } catch (e) { return echapperHTML(code); }
    }

    /* ---------- COPIE ---------- */
    function copierTexte(code, bouton) {
      try {
        var texte = String(code);
        var fini = function (ok) {
          try {
            if (bouton && ok) {
              var ancien = bouton.innerHTML;
              bouton.textContent = "Copi\u00e9 !";
              setTimeout(function () { try { bouton.innerHTML = ancien; } catch (e) {} }, 2000);
            }
          } catch (e) {}
        };
        var secours = function () {
          var ok = false;
          try {
            var zone = document.createElement("textarea");
            zone.value = texte;
            zone.style.position = "fixed";
            zone.style.opacity = "0";
            zone.style.left = "-9999px";
            document.body.appendChild(zone);
            zone.select();
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            zone.remove();
          } catch (e) {}
          fini(ok);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(texte).then(function () { fini(true); }, secours);
        } else {
          secours();
        }
      } catch (e) {}
    }

    /* ---------- MODALE PLEIN ECRAN ---------- */
    function ouvrirModaleCode(codeOriginal) {
      try {
        var ancienne = document.getElementById("nova-code-modal");
        if (ancienne) ancienne.remove();
        var ancienOverflow = document.body.style.overflow;
        var modal = document.createElement("div");
        modal.className = "nova-code-modal";
        modal.id = "nova-code-modal";
        modal.innerHTML =
          '<div class="nova-code-modal-entete"><div class="nova-code-modal-titre">Code Python</div>' +
          '<div class="nova-code-modal-actions">' +
          '<button type="button" id="nova-modal-copier">' + svgCopier() + "<span>Copier</span></button>" +
          '<button type="button" class="nova-fermer" id="nova-modal-fermer">' + svgFermer() + "<span>Fermer</span></button>" +
          "</div></div>" +
          '<div class="nova-code-modal-corps"><pre><code></code></pre></div>';
        modal.querySelector("code").innerHTML = colorerPython(codeOriginal);
        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        var surEsc = function (e) { if (e.key === "Escape") fermerModal(); };
        var fermerModal = function () {
          try {
            modal.remove();
            document.body.style.overflow = ancienOverflow;
            document.removeEventListener("keydown", surEsc, true);
          } catch (e) {}
        };
        document.addEventListener("keydown", surEsc, true);
        modal.querySelector("#nova-modal-fermer").addEventListener("click", fermerModal);
        modal.querySelector("#nova-modal-copier").addEventListener("click", function () { copierTexte(codeOriginal, this); });
      } catch (e) { try { document.body.style.overflow = ""; } catch (er) {} }
    }

    /* ---------- BARRE VOIR / COPIER / FERMER ---------- */
    function creerBarrePython(conteneur, codeOriginal) {
      try {
        if (conteneur.getAttribute("data-nova-boutons") === "oui") return;
        var barre = document.createElement("div");
        barre.className = "nova-code-barre";

        var btnVoir = document.createElement("button");
        btnVoir.className = "nova-code-voir";
        btnVoir.type = "button";
        btnVoir.innerHTML = svgOeil() + "<span>Voir</span>";
        btnVoir.addEventListener("click", function () { ouvrirModaleCode(codeOriginal); });

        var btnCopier = document.createElement("button");
        btnCopier.className = "nova-code-copier";
        btnCopier.type = "button";
        btnCopier.innerHTML = svgCopier() + "<span>Copier</span>";
        btnCopier.addEventListener("click", function () { copierTexte(codeOriginal, btnCopier); });

        var btnFermer = document.createElement("button");
        btnFermer.className = "nova-code-fermer";
        btnFermer.type = "button";
        btnFermer.innerHTML = svgFermer() + "<span>Fermer</span>";
        btnFermer.addEventListener("click", function () {
          try {
            var zone = conteneur.querySelector(".nova-code-scroll");
            if (!zone) return;
            var cache = zone.style.display === "none";
            zone.style.display = cache ? "" : "none";
            btnFermer.innerHTML = cache ? svgFermer() + "<span>Fermer</span>" : svgOeil() + "<span>Ouvrir</span>";
          } catch (e) {}
        });

        barre.appendChild(btnVoir);
        barre.appendChild(btnCopier);
        barre.appendChild(btnFermer);
        conteneur.insertBefore(barre, conteneur.firstChild);
        conteneur.setAttribute("data-nova-boutons", "oui");
      } catch (e) {}
    }

    function creerConteneur(original) {
      var c = document.createElement("div");
      c.className = "nova-code-conteneur";
      c.innerHTML = '<div class="nova-code-scroll"><pre><code class="language-python"></code></pre></div>';
      c.querySelector("code").innerHTML = colorerPython(original);
      creerBarrePython(c, original);
      return c;
    }

    /* ---------- DETECTION PYTHON ---------- */
    function estPython(pre, codeEl, texte) {
      try {
        var cls = String((codeEl.getAttribute && codeEl.getAttribute("class") || "") + " " + (pre.getAttribute("class") || "")).toLowerCase();
        if (/(^|[\s-])(python|python3|py)(\s|$)/.test(cls)) return true;
        if (/(^|\s)(language|lang)-/.test(cls)) return false;
        return /(^|\n)\s*(def\s+\w+\s*\(|import\s+[\w.]+(\s+as\s+\w+)?\s*($|\n|,)|from\s+[\w.]+\s+import\s|class\s+\w+.*:|print\s*\()/.test(texte);
      } catch (e) { return false; }
    }

    /* cache (sans supprimer) la vieille barre "python / Copier" d'index.html */
    function masquerVieillesBarres(el) {
      try {
        var p = el.parentElement;
        if (!p) return;
        var fr = p.children;
        for (var i = 0; i < fr.length; i++) {
          var f = fr[i];
          if (f === el) continue;
          if (f.classList.contains("nova-code-conteneur")) continue;
          if (f.querySelector && f.querySelector("pre")) continue;
          var t = String(f.textContent || "").trim().toLowerCase();
          if (t.length > 40) continue;
          var barre = /(copier|copy|copi|python)/.test(t) || t === "py";
          var boutonVide = t.length < 3 && (f.tagName === "BUTTON" || (f.querySelector && f.querySelector("button")));
          if (barre || boutonVide) f.classList.add("nova-code-cache-ancien");
        }
      } catch (e) {}
    }

    /* ---------- TRANSFORMATION PYTHON (appelee seulement quand Nova se tait) ---------- */
    function transformerPythonDans(element) {
      try {
        if (!element || !element.querySelectorAll) return;

        /* 1) blocs <pre> deja crees par index.html : on les cache, on ne les remplace pas */
        var blocs = element.querySelectorAll("pre");
        Array.prototype.forEach.call(blocs, function (pre) {
          try {
            if (pre.closest(".nova-code-conteneur")) return;
            if (pre.getAttribute("data-nova-v7") === "oui") return;
            var codeEl = pre.querySelector("code") || pre;
            var texte = String(codeEl.textContent || "").replace(/\n+$/, "");
            if (!texte.trim()) return;
            if (!estPython(pre, codeEl, texte)) return;
            var parent = pre.parentNode;
            if (!parent) return;
            masquerVieillesBarres(pre);
            var p2 = pre.parentElement;
            if (p2 && p2 !== element) {
              var nomP = String(p2.getAttribute("class") || "").toLowerCase();
              if (/code|python|highlight|snippet/.test(nomP)) masquerVieillesBarres(p2);
            }
            parent.insertBefore(creerConteneur(texte), pre);
            pre.classList.add("nova-code-cache-ancien");
            pre.setAttribute("data-nova-v7", "oui");
          } catch (e) {}
        });

        /* 2) blocs ecrits en texte brut avec trois accents graves */
        if (String(element.textContent || "").indexOf(FENCE) === -1) return;
        var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
          acceptNode: function (node) {
            try {
              if (node.nodeValue.indexOf(FENCE) === -1) return NodeFilter.FILTER_REJECT;
              if (node.parentElement.closest("pre,code,script,style,textarea,.nova-code-conteneur,.nova-code-modal")) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            } catch (e) { return NodeFilter.FILTER_REJECT; }
          }
        });
        var noeuds = [];
        while (walker.nextNode()) noeuds.push(walker.currentNode);
        noeuds.forEach(function (node) {
          try {
            var texte = node.nodeValue;
            var regex = new RegExp("\\x60{3}(?:python|py)?\\s*\\n([\\s\\S]*?)\\x60{3}", "g");
            var match;
            var dernierIndex = 0;
            var trouve = false;
            var fragment = document.createDocumentFragment();
            while ((match = regex.exec(texte)) !== null) {
              trouve = true;
              var avant = texte.slice(dernierIndex, match.index);
              if (avant) fragment.appendChild(document.createTextNode(avant));
              fragment.appendChild(creerConteneur(String(match[1]).replace(/\n+$/, "")));
              dernierIndex = regex.lastIndex;
            }
            if (trouve && node.parentNode) {
              var apres = texte.slice(dernierIndex);
              if (apres) fragment.appendChild(document.createTextNode(apres));
              node.parentNode.replaceChild(fragment, node);
            }
          } catch (e) {}
        });
      } catch (e) {}
    }

    /* Debounce + throttle : on attend que Nova se taise, puis 1 passage dans un rAF */
    function executerPython() {
      timerPython = 0;
      try {
        var reste = QUIET_MS - (Date.now() - derniereMutation);
        if (reste > 0) { timerPython = setTimeout(executerPython, reste); return; }
        var delai = MIN_MS - (Date.now() - derniereTransfo);
        if (delai > 0) { timerPython = setTimeout(executerPython, delai); return; }
        if (transfoRaf) return;
        transfoRaf = requestAnimationFrame(function () {
          transfoRaf = 0;
          try {
            if (Date.now() - derniereMutation < QUIET_MS - 100) {
              if (!timerPython) timerPython = setTimeout(executerPython, QUIET_MS);
              return;
            }
            var z = zoneChat();
            if (!z) return;
            derniereTransfo = Date.now();
            transformerPythonDans(z);
            if (obs) { try { obs.takeRecords(); } catch (e) {} }
          } catch (e) {}
        });
      } catch (e) {}
    }

    /* ---------- FLECHE BAS + 3 POINTS (absolute dans le parent du chat) ---------- */
    function positionner() {
      try {
        var z = zoneChat();
        if (!z || !fleche) return;
        var parent = fleche.parentElement;
        if (!parent) return;
        var bas = 16;
        if (z.offsetParent === parent) {
          var reste = parent.clientHeight - (z.offsetTop + z.offsetHeight);
          if (reste > 0 && reste < 400) bas = reste + 16;
        }
        fleche.style.bottom = bas + "px";
        if (points) points.style.bottom = (bas + 9) + "px";
      } catch (e) {}
    }
    function creerFleche(zone) {
      try {
        if (fleche && document.body.contains(fleche)) return fleche;
        fleche = document.createElement("button");
        fleche.id = "nova-fleche-bas";
        fleche.type = "button";
        fleche.innerHTML = svgFlecheBas();
        fleche.setAttribute("aria-label", "Aller en bas");
        fleche.style.cssText = "display:none;position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;border:none;background:#292d35;padding:0;cursor:pointer;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,0.35);align-items:center;justify-content:center;";
        fleche.addEventListener("click", function () {
          try {
            var z = zoneChat();
            if (!z) return;
            sortirLecture();
            try { z.scrollTo({ top: z.scrollHeight, behavior: "smooth" }); }
            catch (e) { z.scrollTop = z.scrollHeight; }
          } catch (e) {}
        });
        var parent = zone.parentElement || document.body;
        try {
          var cs = window.getComputedStyle(parent);
          if (cs.position === "static") parent.style.position = "relative";
        } catch (e) {}
        parent.appendChild(fleche);
        return fleche;
      } catch (e) { return null; }
    }
    function montrerFleche() {
      try {
        if (flecheVisible) return;
        var z = zoneChat();
        if (!z) return;
        var f = creerFleche(z);
        if (f) { positionner(); f.style.display = "flex"; flecheVisible = true; }
      } catch (e) {}
    }
    function cacherFleche() {
      try { if (fleche) fleche.style.display = "none"; flecheVisible = false; } catch (e) {}
    }
    function creerPoints(zone) {
      try {
        if (points && document.body.contains(points)) return points;
        points = document.createElement("div");
        points.id = "nova-3-points";
        var pt = function (delai) {
          return '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite ' + delai + ';"></span>';
        };
        points.innerHTML = pt("0s") + pt("0.2s") + pt("0.4s");
        points.style.cssText = "display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:25px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,0.55);z-index:49;pointer-events:none;";
        var parent = zone.parentElement || document.body;
        parent.appendChild(points);
        return points;
      } catch (e) { return null; }
    }
    function montrerPoints() {
      try {
        if (pointsVisibles) return;
        var z = zoneChat();
        if (!z) return;
        var p = creerPoints(z);
        if (p) { p.style.display = "block"; pointsVisibles = true; }
      } catch (e) {}
    }
    function cacherPoints() {
      try { if (points) points.style.display = "none"; pointsVisibles = false; } catch (e) {}
    }
    function majUI() {
      try {
        var z = zoneChat();
        if (!z) return;
        if (modeLecture && distanceBas(z) >= 100) montrerFleche(); else cacherFleche();
        if (modeLecture && Date.now() - derniereMutation < 1500) montrerPoints(); else cacherPoints();
      } catch (e) {}
    }

    /* ---------- MODE LECTURE : index.html ne reprend jamais la main ---------- */
    function entrerLecture() {
      try {
        var z = zoneChat();
        if (!z) return;
        if (!modeLecture) {
          modeLecture = true;
          dernierScrollTop = z.scrollTop;
          dernierWindowY = window.pageYOffset || 0;
          lancerBoucle();
        }
        majUI();
      } catch (e) {}
    }
    function sortirLecture() {
      try {
        modeLecture = false;
        cacherFleche();
        cacherPoints();
      } catch (e) {}
    }
    function lancerBoucle() {
      try { if (!boucleId) boucleId = requestAnimationFrame(tick); } catch (e) {}
    }
    /* boucle douce : tant que l'utilisateur lit en haut, tout scroll vers le bas force par index.html est annule */
    function tick() {
      boucleId = 0;
      try {
        if (!modeLecture) return;
        var z = zoneChat();
        if (z) {
          var st = z.scrollTop;
          var wy = window.pageYOffset || 0;
          if (utilisateurAgit()) {
            dernierScrollTop = st;
            dernierWindowY = wy;
          } else {
            if (st > dernierScrollTop + 1) poserScroll(z, dernierScrollTop);
            else if (st < dernierScrollTop) dernierScrollTop = st;
            if (wy > dernierWindowY + 1) poserWindow(dernierWindowY);
            else if (wy < dernierWindowY) dernierWindowY = wy;
          }
          var maintenant = Date.now();
          if (maintenant - dernierMajUI > 250) { dernierMajUI = maintenant; majUI(); }
        }
      } catch (e) {}
      if (modeLecture) { try { boucleId = requestAnimationFrame(tick); } catch (e) {} }
    }

    /* ---------- DEMARRAGE ---------- */
    function demarrer() {
      try {
        var z = zoneChat();
        if (!z) { setTimeout(demarrer, 500); return; }
        installerStyles();
        creerFleche(z);
        creerPoints(z);
        try { transformerPythonDans(z); } catch (e) {}

        function peutRemonter() {
          return z.scrollTop > 0 && z.scrollHeight > z.clientHeight + 20;
        }

        /* intentions de l'utilisateur */
        z.addEventListener("wheel", function (e) {
          try {
            grace(400);
            if (e.deltaY < 0 && !dansCodeScroll(e.target) && peutRemonter()) entrerLecture();
          } catch (er) {}
        }, { passive: true });

        z.addEventListener("touchstart", function (e) {
          try {
            toucheActif = true;
            toucheY = e.touches[0].clientY;
          } catch (er) {}
        }, { passive: true });
        z.addEventListener("touchmove", function (e) {
          try {
            var y = e.touches[0].clientY;
            if (y - toucheY > 8 && !dansCodeScroll(e.target) && peutRemonter()) entrerLecture();
          } catch (er) {}
        }, { passive: true });
        var finTouch = function () { toucheActif = false; grace(900); };
        z.addEventListener("touchend", finTouch, { passive: true });
        z.addEventListener("touchcancel", finTouch, { passive: true });

        z.addEventListener("pointerdown", function (e) {
          try { if (e.pointerType === "mouse") pointeurActif = true; } catch (er) {}
        }, { passive: true });
        var finPointeur = function () {
          if (pointeurActif) { pointeurActif = false; grace(400); }
        };
        window.addEventListener("pointerup", finPointeur, { passive: true });
        window.addEventListener("pointercancel", finPointeur, { passive: true });

        document.addEventListener("keydown", function (e) {
          try {
            var t = e.target;
            if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) {
              if (e.key === "Enter" && !e.shiftKey && modeLecture) sortirLecture();
              return;
            }
            var k = e.key;
            if (k === "ArrowUp" || k === "PageUp" || k === "Home") {
              grace(400);
              if (peutRemonter()) entrerLecture();
            } else if (k === "ArrowDown" || k === "PageDown" || k === "End" || k === " ") {
              grace(400);
            }
          } catch (er) {}
        }, true);

        /* envoi d'un nouveau message : l'utilisateur veut voir la suite, on relache le verrou */
        document.addEventListener("click", function (e) {
          try {
            if (!modeLecture) return;
            var t = e.target;
            if (!t || !t.closest) return;
            if (t.closest("#nova-fleche-bas, .nova-code-modal")) return;
            var zc = zoneChat();
            if (zc && zc.contains(t)) return;
            var b = t.closest("button,[role=button],input[type=submit]");
            if (!b) return;
            var id = (String(b.id || "") + " " + String(b.className || "") + " " + String(b.getAttribute("aria-label") || "") + " " + String(b.getAttribute("type") || "")).toLowerCase();
            if (/send|envoy|envoi|submit/.test(id)) sortirLecture();
          } catch (er) {}
        }, true);

        /* le scroll lui-meme */
        z.addEventListener("scroll", function () {
          try {
            if (utilisateurAgit()) {
              dernierScrollTop = z.scrollTop;
              var d = distanceBas(z);
              if (modeLecture && d < 30) sortirLecture();
              else if (!modeLecture && d >= 100) entrerLecture();
            }
            majUI();
          } catch (er) {}
        }, { passive: true });

        window.addEventListener("resize", function () { positionner(); }, { passive: true });

        /* observateur ultra leger : il note l'heure, rien d'autre (aucune lecture de layout) */
        obs = new MutationObserver(function () {
          try {
            derniereMutation = Date.now();
            if (!timerPython) timerPython = setTimeout(executerPython, QUIET_MS);
            if (modeLecture) {
              montrerPoints();
              if (timerPoints) clearTimeout(timerPoints);
              timerPoints = setTimeout(cacherPoints, 1500);
            }
          } catch (er) {}
        });
        obs.observe(z, { childList: true, subtree: true, characterData: true });
      } catch (e) {}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", demarrer);
    } else {
      demarrer();
    }
  } catch (e) {}
})();
}
