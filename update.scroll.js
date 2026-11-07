/* ============================================================
   NOVA AI - update.scroll.js - VERSION 5.0
   V1 qui marche + FONCTIONS V4
   REGLE D'OR: Ne touche PAS a index.html
   Tu mets juste: <script src="update.scroll.js"></script>
   ============================================================ */

if (window.NOVA_SCROLL_V5) {
} else {
window.NOVA_SCROLL_V5 = true;
(function () {
  "use strict";
  try {

    // ---------- V1 : ETAT ----------
    var utilisateurEnHaut = false;
    var novaEcrit = false;
    var timerPoints = null;
    var dernierScrollTop = 0;
    var generationActive = false;
    var timerGeneration = null;

    function zoneChat() {
      return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
    }
    function estEnBas(zone) {
      try { return (zone.scrollHeight - zone.scrollTop - zone.clientHeight) < 100; }
      catch (e) { return true; }
    }
    function echapperHTML(t) {
      try { return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
      catch(e){ return ""; }
    }

    // ---------- V4 : STYLES ----------
    function installerStyles() {
      try {
        if (document.getElementById("nova-v5-style")) return;
        var s = document.createElement("style");
        s.id = "nova-v5-style";
        s.textContent = `
          #nova-fleche-bas{display:none;position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;border:none;background:#292d35;color:#d5d9df;font-size:22px;line-height:1;cursor:pointer;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,0.35);}
          #nova-3-points{display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:16px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,0.55);z-index:49;pointer-events:none;}
          @keyframes novaPoint{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
          .nova-code-conteneur{width:100%;max-width:100%;margin:14px 0;border-radius:16px;overflow:hidden;background:#0d0d0d;border:1px solid #343438;color:white;}
          .nova-code-barre{display:flex;align-items:center;gap:7px;padding:9px 10px;background:#171717;border-bottom:1px solid #303030;flex-wrap:wrap;}
          .nova-code-barre button{border:0;border-radius:9px;padding:7px 10px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;color:white;}
          .nova-code-copier{background:#2f7bff;} .nova-code-voir{background:#2c2c2e;} .nova-code-fermer{background:#3a3a3e;}
          .nova-code-scroll{max-height:390px;overflow:auto;background:#0d0d0d;-webkit-overflow-scrolling:touch;}
          .nova-code-scroll pre{margin:0;padding:15px;min-width:max-content;font-family:monospace;font-size:13px;line-height:1.65;white-space:pre;tab-size:4;}
          .nova-code-motcle{color:#bd93f9;} .nova-code-string{color:#55d98b;} .nova-code-commentaire{color:#888888;font-style:italic;} .nova-code-nombre{color:#79c0ff;} .nova-code-normal{color:#e6e6e6;}
          .nova-code-modal{position:fixed;inset:0;z-index:2147483000;background:#080808;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);}
          .nova-code-modal-entete{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px;background:#171717;border-bottom:1px solid #333;}
          .nova-code-modal-titre{color:white;font-size:14px;font-weight:700;}
          .nova-code-modal-actions{display:flex;gap:7px;}
          .nova-code-modal button{border:0;border-radius:9px;padding:9px 12px;background:#2f7bff;color:white;font-size:12px;font-weight:600;cursor:pointer;}
          .nova-code-modal .nova-fermer{background:#2c2c2e;}
          .nova-code-modal-corps{flex:1;overflow:auto;padding:14px;color:white;background:#0d0d0d;}
          .nova-code-modal pre{margin:0;white-space:pre;width:max-content;min-width:100%;font:13px/1.7 monospace;tab-size:4;}
        `;
        document.head.appendChild(s);
      } catch(e){}
    }

    // ---------- V4 : PYTHON - COPIER / VOIR ----------
    function colorerPython(code) {
      try {
        var texte = String(code);
        var tokens = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self)\b|\b\d+(?:\.\d+)?\b)/gm;
        var resultat = ""; var position = 0; var match;
        while ((match = tokens.exec(texte)) !== null) {
          resultat += echapperHTML(texte.slice(position, match.index));
          var mot = match[0]; var classe = "nova-code-normal";
          if (mot.charAt(0) === "#") classe = "nova-code-commentaire";
          else if (mot.charAt(0) === '"' || mot.charAt(0) === "'") classe = "nova-code-string";
          else if (/^\d/.test(mot)) classe = "nova-code-nombre";
          else classe = "nova-code-motcle";
          resultat += '<span class="' + classe + '">' + echapperHTML(mot) + '</span>';
          position = tokens.lastIndex;
        }
        resultat += echapperHTML(texte.slice(position));
        return resultat;
      } catch(e){ return echapperHTML(code); }
    }

    async function copierTexte(code, bouton) {
      try {
        var texte = String(code); var ok = false;
        if (navigator.clipboard && window.isSecureContext) {
          try { await navigator.clipboard.writeText(texte); ok = true; } catch(e){}
        }
        if (!ok) {
          var zone = document.createElement("textarea");
          zone.value = texte; zone.style.position="fixed"; zone.style.opacity="0"; zone.style.left="-9999px";
          document.body.appendChild(zone); zone.select();
          try { ok = document.execCommand("copy"); } catch(e){ ok=false; }
          zone.remove();
        }
        if (bouton && ok) {
          var ancien = bouton.innerHTML; bouton.textContent = "Copié !";
          setTimeout(function(){ try{ bouton.innerHTML = ancien; }catch(e){} }, 2000);
        }
        return ok;
      } catch(e){ return false; }
    }

    function ouvrirModaleCode(codeOriginal) {
      try {
        var ancienne = document.getElementById("nova-code-modal");
        if (ancienne) ancienne.remove();
        var modal = document.createElement("div");
        modal.className = "nova-code-modal"; modal.id = "nova-code-modal";
        modal.innerHTML = '<div class="nova-code-modal-entete"><div class="nova-code-modal-titre">Code Python</div><div class="nova-code-modal-actions"><button type="button" id="nova-modal-copier">Copier</button><button type="button" class="nova-fermer" id="nova-modal-fermer">Fermer</button></div></div><div class="nova-code-modal-corps"><pre></pre></div>';
        var pre = modal.querySelector("pre");
        pre.textContent = String(codeOriginal);
        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        var fermerModal = function(){ try{ modal.remove(); document.body.style.overflow=""; }catch(e){} };
        modal.querySelector("#nova-modal-fermer").addEventListener("click", fermerModal);
        modal.querySelector("#nova-modal-copier").addEventListener("click", function(){ copierTexte(codeOriginal, this); });
        modal.addEventListener("click", function(e){ if(e.target===modal) fermerModal(); });
      } catch(e){ try{ document.body.style.overflow=""; }catch(er){} }
    }

    function creerBarrePython(conteneur, codeOriginal) {
      try {
        if (conteneur.dataset.novaBoutonsCode === "oui") return;
        var barre = document.createElement("div");
        barre.className = "nova-code-barre";
        barre.innerHTML = '<button type="button" class="nova-code-voir">👁 Voir</button><button type="button" class="nova-code-copier">📋 Copier</button><button type="button" class="nova-code-fermer">✕ Fermer</button>';
        var btnVoir = barre.children[0], btnCopier = barre.children[1], btnFermer = barre.children[2];
        btnVoir.addEventListener("click", function(){ ouvrirModaleCode(codeOriginal); });
        btnCopier.addEventListener("click", function(){ copierTexte(codeOriginal, btnCopier); });
        btnFermer.addEventListener("click", function(){
          try {
            var zone = conteneur.querySelector(".nova-code-scroll");
            if(!zone) return;
            var cache = zone.style.display === "none";
            zone.style.display = cache ? "" : "none";
            btnFermer.textContent = cache ? "✕ Fermer" : "👁 Ouvrir";
          } catch(e){}
        });
        conteneur.insertBefore(barre, conteneur.firstChild);
        conteneur.dataset.novaBoutonsCode = "oui";
      } catch(e){}
    }

    function transformerPythonDans(element) {
      try {
        if (!element || !element.querySelectorAll) return;
        // 1. Cas <pre><code> deja existant
        var blocs = element.querySelectorAll("pre");
        blocs.forEach(function(pre){
          try {
            if (pre.dataset.novaPythonTraite === "oui") return;
            if (pre.closest(".nova-code-conteneur")) return;
            var codeEl = pre.querySelector("code");
            if (!codeEl) return;
            var texte = codeEl.textContent || "";
            var classe = String(codeEl.getAttribute("class") || "").toLowerCase();
            var estPython = classe.includes("python") || classe.includes("py") || texte.includes("def ") || texte.includes("import ") || texte.includes("print(");
            if (!estPython) return;
            var original = codeEl.textContent;
            var conteneur = document.createElement("div");
            conteneur.className = "nova-code-conteneur";
            conteneur.innerHTML = '<div class="nova-code-scroll"><pre><code class="language-python"></code></pre></div>';
            conteneur.querySelector("code").innerHTML = colorerPython(original);
            creerBarrePython(conteneur, original);
            pre.dataset.novaPythonTraite = "oui";
            pre.replaceWith(conteneur);
          } catch(e){}
        });
        // 2. Cas texte ```python ... ``` - on ne touche que si c'est un noeud texte simple
        var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node){
            try {
              if (!node.nodeValue.includes("```")) return NodeFilter.FILTER_REJECT;
              if (node.parentElement.closest("pre,code,script,style,textarea,.nova-code-conteneur,#nova-fleche-bas,#nova-3-points")) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            } catch(e){ return NodeFilter.FILTER_REJECT; }
          }
        });
        var zones = []; while (walker.nextNode()) zones.push(walker.currentNode);
        zones.forEach(function(node){
          try {
            var texte = node.nodeValue;
            var regex = /```(?:python|py)?\s*\n([\s\S]*?)```/g;
            var match, dernierIndex = 0, trouve = false;
            var fragment = document.createDocumentFragment();
            while ((match = regex.exec(texte)) !== null) {
              trouve = true;
              var avant = texte.slice(dernierIndex, match.index);
              if (avant) fragment.appendChild(document.createTextNode(avant));
              var original = match[1];
              var conteneur = document.createElement("div");
              conteneur.className = "nova-code-conteneur";
              conteneur.innerHTML = '<div class="nova-code-scroll"><pre><code class="language-python"></code></pre></div>';
              conteneur.querySelector("code").innerHTML = colorerPython(original);
              creerBarrePython(conteneur, original);
              fragment.appendChild(conteneur);
              dernierIndex = regex.lastIndex;
            }
            if (trouve && node.parentNode) {
              var apres = texte.slice(dernierIndex);
              if (apres) fragment.appendChild(document.createTextNode(apres));
              node.parentNode.replaceChild(fragment, node);
            }
          } catch(e){}
        });
      } catch(e){}
    }

    // ---------- V1 : FLECHE + POINTS ----------
    var fleche = null, points = null;
    function creerFleche(zone) {
      try {
        if (fleche && document.body.contains(fleche)) return fleche;
        fleche = document.createElement("button");
        fleche.id = "nova-fleche-bas";
        fleche.textContent = "↓";
        fleche.setAttribute("aria-label", "Aller en bas");
        fleche.addEventListener("click", function(){
          try {
            var z = zoneChat(); if(!z) return;
            z.scrollTo({ top: z.scrollHeight, behavior: "smooth" });
            cacherFleche(); cacherPoints();
          } catch(e){}
        });
        var parent = zone.parentElement || document.body;
        try { var cs = window.getComputedStyle(parent); if (cs.position === "static") parent.style.position = "relative"; } catch(e){}
        parent.appendChild(fleche);
        return fleche;
      } catch(e){ return null; }
    }
    function montrerFleche(){ try{ var z=zoneChat(); if(!z) return; var f=creerFleche(z); if(f) f.style.display="block"; }catch(e){} }
    function cacherFleche(){ try{ if(fleche) fleche.style.display="none"; }catch(e){} }

    function creerPoints(zone) {
      try {
        if (points && document.body.contains(points)) return points;
        points = document.createElement("div");
        points.id = "nova-3-points";
        points.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.2s;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.4s;"></span>';
        var parent = zone.parentElement || document.body;
        parent.appendChild(points);
        return points;
      } catch(e){ return null; }
    }
    function montrerPoints(){ try{ var z=zoneChat(); if(!z) return; var p=creerPoints(z); if(p) p.style.display="block"; }catch(e){} }
    function cacherPoints(){ try{ if(points) points.style.display="none"; }catch(e){} }

    function majAffichage() {
      try {
        var z = zoneChat(); if(!z) return;
        var enBas = estEnBas(z);
        utilisateurEnHaut = !enBas;
        if (enBas) { cacherFleche(); cacherPoints(); }
        else { if (novaEcrit) { montrerFleche(); montrerPoints(); } }
      } catch(e){}
    }

    // ---------- V4 : CLAVIER ANDROID (version douce, ne casse rien) ----------
    function gererClavier() {
      try {
        if (window.__NOVA_CLAVIER_V5) return;
        window.__NOVA_CLAVIER_V5 = true;
        function actualiser(){
          try {
            var vp = window.visualViewport; if(!vp) return;
            var clavier = Math.max(0, window.innerHeight - vp.height);
            document.documentElement.style.setProperty("--kb", clavier > 80 ? clavier + "px" : "0px");
          } catch(e){}
        }
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", actualiser, { passive:true });
          window.visualViewport.addEventListener("scroll", actualiser, { passive:true });
        }
        window.addEventListener("resize", actualiser, { passive:true });
        actualiser();
      } catch(e){}
    }

    // ---------- V1 : SURVEILLANCE - NE JAMAIS FORCER ----------
    function demarrer() {
      try {
        var z = zoneChat();
        if (!z) { setTimeout(demarrer, 500); return; }
        installerStyles();
        creerFleche(z); creerPoints(z); gererClavier();
        // Traiter les anciens messages Python au chargement
        try { transformerPythonDans(z); } catch(e){}

        z.addEventListener("scroll", function(){
          try {
            var avant = utilisateurEnHaut;
            majAffichage();
            if (utilisateurEnHaut) dernierScrollTop = z.scrollTop;
            if (!utilisateurEnHaut && avant) novaEcrit = false;
          } catch(e){}
        }, { passive:true });

        // Observer SEULEMENT la zone de chat, pas tout le body (fix du V4)
        var enTrainDeTransformer = false;
        var obs = new MutationObserver(function(){
          try {
            var zone = zoneChat(); if(!zone) return;
            // V4 : transformer le Python sans declencher de boucle
            if (!enTrainDeTransformer) {
              enTrainDeTransformer = true;
              try { transformerPythonDans(zone); } catch(e){}
              // On laisse le navigateur respirer avant de re-observer
              setTimeout(function(){ enTrainDeTransformer = false; }, 50);
            }
            // V1 : gestion scroll
            if (utilisateurEnHaut) {
              novaEcrit = true;
              generationActive = true;
              montrerFleche(); montrerPoints();
              zone.scrollTop = dernierScrollTop; // ON TE LAISSE OU TU ES
              if (timerPoints) clearTimeout(timerPoints);
              timerPoints = setTimeout(function(){ cacherPoints(); }, 4000);
              if (timerGeneration) clearTimeout(timerGeneration);
              timerGeneration = setTimeout(function(){ generationActive = false; }, 1500);
            } else {
              novaEcrit = false; cacherFleche(); cacherPoints();
            }
          } catch(e){}
        });
        obs.observe(z, { childList:true, subtree:true, characterData:true });
      } catch(e){}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", demarrer);
    } else { demarrer(); }

  } catch(e){}
})();
   }
