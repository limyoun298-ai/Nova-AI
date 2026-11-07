/* ============================================================
   NOVA AI — UPDATE.SCROLL.JS
   VERSION 4.0 — MÉTHODE META AI + PLAN NOVA
   ------------------------------------------------------------
   1. Détection de zone façon Meta AI.
   2. Un seul observateur des messages.
   3. Remontée libre pendant la génération.
   4. Flèche grise uniquement après remontée.
   5. Trois points pendant le streaming.
   6. Aucun scroll forcé de la fenêtre.
   7. Clavier Android avec visualViewport.
   8. Python : Voir / Copier / Fermer.
   9. Protection try/catch.
   ============================================================ */

(function () {
"use strict";

try {
  if (window.NOVA_SCROLL_V4) return;
  window.NOVA_SCROLL_V4 = true;
} catch(e) { return; }

let zoneActive = null;
let utilisateurEstRemonte = false;
let suivreConversation = true;
let dernierScroll = 0;
let generationActive = false;
let dernierChangement = 0;
let timerGeneration = null;
let observerPrincipal = null;
let animationScroll = null;

/* ============================================================
   OUTILS
   ============================================================ */

function echapperHTML(t) {
  try {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  } catch(e) { return ""; }
}

function elementValide(el) {
  try {
    return !!(
      el &&
      el.nodeType === 1 &&
      document.documentElement.contains(el)
    );
  } catch(e) { return false; }
}

function estMessageIA(el) {
  try {
    if (!el || el.nodeType !== 1) return false;

    const role = String(el.getAttribute("data-role") || "").toLowerCase();
    const auteur = String(el.getAttribute("data-author") || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();

    return (
      role === "assistant" ||
      role === "ai" ||
      role === "bot" ||
      auteur === "assistant" ||
      auteur === "nova" ||
      cls.includes("assistant-message") ||
      cls.includes("ai-message") ||
      cls.includes("bot-message") ||
      cls.includes("message-assistant")
    );
  } catch(e) { return false; }
}

/* ============================================================
   ZONE DE DISCUSSION — MÉTHODE META AI
   ============================================================ */

function trouverZoneDiscussion() {
  try {
    const selecteurs = [
      "#chat-box",
      "#messages",
      "#chat",
      "#chat-messages",
      '[data-role="discussion"]',
      '[data-role="messages"]',
      ".chat-messages",
      ".messages-container",
      ".conversation",
      ".chat-history",
      ".message-list"
    ];

    for (const selecteur of selecteurs) {
      const el = document.querySelector(selecteur);

      if (elementValide(el)) {
        return el;
      }
    }

    /* Recherche du véritable parent défilant. */
    const message = document.querySelector(
      '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
    );

    if (message) {
      let parent = message.parentElement;

      while (parent && parent !== document.body) {
        if (
          parent.scrollHeight > parent.clientHeight + 30 &&
          parent.clientHeight > 80
        ) {
          const overflow = getComputedStyle(parent).overflowY;

          if (overflow === "auto" || overflow === "scroll") {
            return parent;
          }
        }

        parent = parent.parentElement;
      }
    }

    return null;
  } catch(e) {
    return null;
  }
}

function estEnBas(zone, tolerance) {
  try {
    if (!elementValide(zone)) return true;

    return (
      zone.scrollHeight -
      zone.scrollTop -
      zone.clientHeight
    ) < (tolerance || 100);
  } catch(e) {
    return true;
  }
}

/* ============================================================
   STYLES
   ============================================================ */

function installerStyles() {
  try {
    if (document.getElementById("nova-scroll-v4-style")) return;

    const style = document.createElement("style");
    style.id = "nova-scroll-v4-style";

    style.textContent = `
      [data-role="assistant"],
      .assistant-message,
      .ai-message,
      .bot-message,
      .message-assistant {
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.65;
      }

      #nova-bouton-bas {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: calc(100px + env(safe-area-inset-bottom));
        z-index: 9998;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #292d35;
        border: 1px solid #555d69;
        color: #d5d9df;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,.3);
        -webkit-tap-highlight-color: transparent;
      }

      #nova-bouton-bas.nova-visible {
        display: flex !important;
      }

      #nova-bouton-bas:active {
        transform: translateX(-50%) scale(.92);
      }

      #nova-points-generation {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: calc(145px + env(safe-area-inset-bottom));
        z-index: 9997;
        display: none;
        align-items: center;
        gap: 5px;
        padding: 9px 13px;
        border-radius: 20px;
        background: #202631;
        border: 1px solid #343d4b;
      }

      #nova-points-generation.nova-visible {
        display: flex !important;
      }

      #nova-points-generation span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #aeb7c5;
        animation: novaPoint 1s infinite ease-in-out;
      }

      #nova-points-generation span:nth-child(2) {
        animation-delay: .15s;
      }

      #nova-points-generation span:nth-child(3) {
        animation-delay: .3s;
      }

      @keyframes novaPoint {
        0%, 60%, 100% { opacity: .35; transform: translateY(0); }
        30% { opacity: 1; transform: translateY(-4px); }
      }

      .nova-code-conteneur {
        width: 100%;
        max-width: 100%;
        margin: 14px 0;
        border-radius: 16px;
        overflow: hidden;
        background: #0d0d0d;
        border: 1px solid #343438;
        color: white;
      }

      .nova-code-barre {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 10px;
        background: #171717;
        border-bottom: 1px solid #303030;
        flex-wrap: wrap;
      }

      .nova-code-barre button {
        border: 0;
        border-radius: 9px;
        padding: 7px 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        color: white;
      }

      .nova-code-barre button svg {
        stroke: white !important;
        color: white !important;
        flex-shrink: 0;
      }

      .nova-code-copier { background: #2f7bff; }
      .nova-code-voir { background: #2c2c2e; }
      .nova-code-fermer { background: #3a3a3e; }

      .nova-code-scroll {
        max-height: 390px;
        overflow: auto;
        background: #0d0d0d;
        -webkit-overflow-scrolling: touch;
      }

      .nova-code-scroll pre {
        margin: 0;
        padding: 15px;
        min-width: max-content;
        font-family: monospace;
        font-size: 13px;
        line-height: 1.65;
        white-space: pre;
        tab-size: 4;
      }

      .nova-code-motcle { color: #bd93f9; }
      .nova-code-string { color: #55d98b; }
      .nova-code-commentaire {
        color: #888888;
        font-style: italic;
      }
      .nova-code-nombre { color: #79c0ff; }
      .nova-code-normal { color: #e6e6e6; }

      .nova-code-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        background: #080808;
        display: flex;
        flex-direction: column;
        padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
      }

      .nova-code-modal-entete {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #171717;
        border-bottom: 1px solid #333;
      }

      .nova-code-modal-titre {
        color: white;
        font-size: 14px;
        font-weight: 700;
      }

      .nova-code-modal-actions {
        display: flex;
        gap: 7px;
      }

      .nova-code-modal button {
        border: 0;
        border-radius: 9px;
        padding: 9px 12px;
        background: #2f7bff;
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .nova-code-modal button svg {
        stroke: white !important;
        color: white !important;
      }

      .nova-code-modal .nova-fermer {
        background: #2c2c2e;
      }

      .nova-code-modal-corps {
        flex: 1;
        overflow: auto;
        padding: 14px;
        color: white;
        background: #0d0d0d;
        -webkit-overflow-scrolling: touch;
      }

      .nova-code-modal pre {
        margin: 0;
        white-space: pre;
        width: max-content;
        min-width: 100%;
        font: 13px/1.7 monospace;
        tab-size: 4;
      }
    `;

    document.head.appendChild(style);
  } catch(e) {}
}

/* ============================================================
   SVG
   ============================================================ */

function svgCopierBlanc() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
}

function svgOeilBlanc() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function svgFermerBlanc() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';
}

/* ============================================================
   PYTHON — COLORATION
   ============================================================ */

function colorerPython(code) {
  try {
    const texte = String(code);

    const tokens = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self)\b|\b\d+(?:\.\d+)?\b)/gm;

    let resultat = "";
    let position = 0;
    let match;

    while ((match = tokens.exec(texte)) !== null) {
      resultat += echapperHTML(texte.slice(position, match.index));

      const mot = match[0];
      let classe = "nova-code-normal";

      if (mot.startsWith("#")) classe = "nova-code-commentaire";
      else if (mot.startsWith('"') || mot.startsWith("'")) classe = "nova-code-string";
      else if (/^\d/.test(mot)) classe = "nova-code-nombre";
      else classe = "nova-code-motcle";

      resultat += '<span class="' + classe + '">' +
        echapperHTML(mot) + '</span>';

      position = tokens.lastIndex;
    }

    resultat += echapperHTML(texte.slice(position));
    return resultat;
  } catch(e) {
    return echapperHTML(code);
  }
}

/* ============================================================
   COPIER
   ============================================================ */

async function copierTexte(code, bouton) {
  try {
    const texte = String(code);
    let ok = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texte);
        ok = true;
      } catch(e) {}
    }

    if (!ok) {
      const zone = document.createElement("textarea");
      zone.value = texte;
      zone.setAttribute("readonly", "");
      zone.style.position = "fixed";
      zone.style.opacity = "0";
      zone.style.left = "-9999px";

      document.body.appendChild(zone);
      zone.select();

      try {
        ok = document.execCommand("copy");
      } catch(e) {
        ok = false;
      }

      zone.remove();
    }

    if (bouton && ok) {
      const ancien = bouton.innerHTML;
      bouton.textContent = "Copié !";

      setTimeout(function() {
        try { bouton.innerHTML = ancien; } catch(e) {}
      }, 2000);
    }

    return ok;
  } catch(e) {
    return false;
  }
}

/* ============================================================
   MODALE PYTHON
   ============================================================ */

function ouvrirModaleCode(codeOriginal) {
  try {
    const ancienne = document.getElementById("nova-code-modal");
    if (ancienne) ancienne.remove();

    const modal = document.createElement("div");
    modal.className = "nova-code-modal";
    modal.id = "nova-code-modal";

    const entete = document.createElement("div");
    entete.className = "nova-code-modal-entete";

    const titre = document.createElement("div");
    titre.className = "nova-code-modal-titre";
    titre.textContent = "Code Python";

    const actions = document.createElement("div");
    actions.className = "nova-code-modal-actions";

    const copier = document.createElement("button");
    copier.type = "button";
    copier.innerHTML = svgCopierBlanc() + "<span>Copier</span>";
    copier.addEventListener("click", function() {
      copierTexte(codeOriginal, copier);
    });

    const fermer = document.createElement("button");
    fermer.className = "nova-fermer";
    fermer.type = "button";
    fermer.innerHTML = svgFermerBlanc() + "<span>Fermer</span>";

    const corps = document.createElement("div");
    corps.className = "nova-code-modal-corps";

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = String(codeOriginal);

    pre.appendChild(code);
    corps.appendChild(pre);

    const fermerModal = function() {
      try {
        modal.remove();
        document.body.style.overflow = "";
        document.removeEventListener("keydown", touche);
      } catch(e) {}
    };

    const touche = function(e) {
      if (e.key === "Escape") fermerModal();
    };

    fermer.addEventListener("click", fermerModal);

    actions.appendChild(copier);
    actions.appendChild(fermer);

    entete.appendChild(titre);
    entete.appendChild(actions);

    modal.appendChild(entete);
    modal.appendChild(corps);

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    modal.addEventListener("click", function(e) {
      if (e.target === modal) fermerModal();
    });

    document.addEventListener("keydown", touche);
  } catch(e) {
    try { document.body.style.overflow = ""; } catch(er) {}
  }
}

/* ============================================================
   BARRE PYTHON
   ============================================================ */

function creerBarrePython(conteneur, codeOriginal) {
  try {
    if (!elementValide(conteneur)) return;
    if (conteneur.dataset.novaBoutonsCode === "oui") return;

    const barre = document.createElement("div");
    barre.className = "nova-code-barre";

    const btnVoir = document.createElement("button");
    btnVoir.className = "nova-code-voir";
    btnVoir.type = "button";
    btnVoir.innerHTML = svgOeilBlanc() + "<span>Voir</span>";

    btnVoir.addEventListener("click", function() {
      ouvrirModaleCode(codeOriginal);
    });

    const btnCopier = document.createElement("button");
    btnCopier.className = "nova-code-copier";
    btnCopier.type = "button";
    btnCopier.innerHTML = svgCopierBlanc() + "<span>Copier</span>";

    btnCopier.addEventListener("click", function() {
      copierTexte(codeOriginal, btnCopier);
    });

    const btnFermer = document.createElement("button");
    btnFermer.className = "nova-code-fermer";
    btnFermer.type = "button";
    btnFermer.innerHTML = svgFermerBlanc() + "<span>Fermer</span>";

    btnFermer.addEventListener("click", function() {
      try {
        const zone = conteneur.querySelector(".nova-code-scroll");
        if (!zone) return;

        const cache = zone.style.display === "none";
        zone.style.display = cache ? "" : "none";

        btnFermer.innerHTML = cache
          ? svgFermerBlanc() + "<span>Fermer</span>"
          : svgOeilBlanc() + "<span>Ouvrir</span>";
      } catch(e) {}
    });

    barre.appendChild(btnVoir);
    barre.appendChild(btnCopier);
    barre.appendChild(btnFermer);

    conteneur.insertBefore(barre, conteneur.firstChild);
    conteneur.dataset.novaBoutonsCode = "oui";
  } catch(e) {}
}

/* ============================================================
   TRANSFORMATION PYTHON
   ============================================================ */

function transformerBlocPython(element) {
  try {
    if (!elementValide(element)) return;
    if (!estMessageIA(element)) return;

    const blocs = element.querySelectorAll("pre");

    blocs.forEach(function(pre) {
      try {
        if (pre.dataset.novaPythonTraite === "oui") return;

        const codeEl = pre.querySelector("code");
        if (!codeEl) return;

        const texte = codeEl.textContent || "";
        const classe = String(codeEl.getAttribute("class") || "").toLowerCase();

        const estPython =
          classe.includes("python") ||
          classe.includes("py") ||
          texte.includes("def ") ||
          texte.includes("import ") ||
          texte.includes("print(");

        if (!estPython) return;

        const original = codeEl.textContent;
        const conteneur = document.createElement("div");
        conteneur.className = "nova-code-conteneur";

        const zoneScroll = document.createElement("div");
        zoneScroll.className = "nova-code-scroll";

        const nouveauPre = document.createElement("pre");
        const nouveauCode = document.createElement("code");

        nouveauCode.className = "language-python";
        nouveauCode.innerHTML = colorerPython(original);

        nouveauPre.appendChild(nouveauCode);
        zoneScroll.appendChild(nouveauPre);
        conteneur.appendChild(zoneScroll);

        creerBarrePython(conteneur, original);

        pre.dataset.novaPythonTraite = "oui";
        pre.replaceWith(conteneur);
      } catch(e) {}
    });

    const arbre = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          try {
            if (!node.nodeValue.includes("```")) {
              return NodeFilter.FILTER_REJECT;
            }

            if (
              node.parentElement.closest(
                "pre,code,script,style,textarea,.nova-code-conteneur"
              )
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          } catch(e) {
            return NodeFilter.FILTER_REJECT;
          }
        }
      }
    );

    const zones = [];
    while (arbre.nextNode()) zones.push(arbre.currentNode);

    zones.forEach(function(node) {
      try {
        const texte = node.nodeValue;
        const regex = /```(?:python|py)?\s*\n([\s\S]*?)```/g;

        let match;
        let dernierIndex = 0;
        let trouve = false;

        const fragment = document.createDocumentFragment();

        while ((match = regex.exec(texte)) !== null) {
          trouve = true;

          const avant = texte.slice(dernierIndex, match.index);
          if (avant) fragment.appendChild(document.createTextNode(avant));

          const original = match[1];
          const conteneur = document.createElement("div");
          conteneur.className = "nova-code-conteneur";

          const zoneScroll = document.createElement("div");
          zoneScroll.className = "nova-code-scroll";

          const pre = document.createElement("pre");
          const code = document.createElement("code");

          code.className = "language-python";
          code.innerHTML = colorerPython(original);

          pre.appendChild(code);
          zoneScroll.appendChild(pre);
          conteneur.appendChild(zoneScroll);

          creerBarrePython(conteneur, original);
          fragment.appendChild(conteneur);

          dernierIndex = regex.lastIndex;
        }

        if (trouve && node.parentNode) {
          const apres = texte.slice(dernierIndex);

          if (apres) {
            fragment.appendChild(document.createTextNode(apres));
          }

          node.parentNode.replaceChild(fragment, node);
        }
      } catch(e) {}
    });
  } catch(e) {}
}

/* ============================================================
   FLÈCHE ET TROIS POINTS
   ============================================================ */

function creerBoutonDescendre() {
  try {
    let btn = document.getElementById("nova-bouton-bas");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "nova-bouton-bas";
    btn.type = "button";
    btn.setAttribute("aria-label", "Revenir en bas");

    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d5d9df" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';

    btn.addEventListener("click", function(e) {
      try {
        e.preventDefault();
        e.stopPropagation();

        connecterZoneDiscussion();
        if (!zoneActive) return;

        utilisateurEstRemonte = false;
        suivreConversation = true;

        zoneActive.scrollTo({
          top: zoneActive.scrollHeight,
          behavior: "smooth"
        });

        mettreAJourAffichage();
      } catch(e) {}
    });

    document.body.appendChild(btn);
    return btn;
  } catch(e) {
    return null;
  }
}

function creerPointsGeneration() {
  try {
    let points = document.getElementById("nova-points-generation");
    if (points) return points;

    points = document.createElement("div");
    points.id = "nova-points-generation";
    points.setAttribute("aria-label", "NOVA écrit");

    points.innerHTML = "<span></span><span></span><span></span>";

    document.body.appendChild(points);
    return points;
  } catch(e) {
    return null;
  }
}

function mettreAJourAffichage() {
  try {
    const btn = creerBoutonDescendre();
    const points = creerPointsGeneration();

    const enBas = !zoneActive || estEnBas(zoneActive, 90);

    if (enBas) {
      utilisateurEstRemonte = false;
      suivreConversation = true;
    }

    if (btn) {
      btn.classList.toggle(
        "nova-visible",
        !!zoneActive && utilisateurEstRemonte && !enBas
      );
    }

    if (points) {
      points.classList.toggle(
        "nova-visible",
        generationActive
      );
    }
  } catch(e) {}
}

/* ============================================================
   GESTION DU SCROLL — MÉTHODE META AI
   ============================================================ */

function gererScrollUtilisateur() {
  try {
    if (!zoneActive || !elementValide(zoneActive)) return;

    const top = zoneActive.scrollTop || 0;

    if (top < dernierScroll - 3) {
      utilisateurEstRemonte = true;
      suivreConversation = false;
    }

    if (estEnBas(zoneActive, 90)) {
      utilisateurEstRemonte = false;
      suivreConversation = true;
    }

    dernierScroll = top;
    mettreAJourAffichage();
  } catch(e) {}
}

function connecterZoneDiscussion() {
  try {
    const nouvelleZone = trouverZoneDiscussion();

    if (!nouvelleZone) {
      zoneActive = null;
      mettreAJourAffichage();
      return;
    }

    if (zoneActive === nouvelleZone) return;

    if (zoneActive) {
      try {
        zoneActive.removeEventListener("scroll", gererScrollUtilisateur);
      } catch(e) {}
    }

    zoneActive = nouvelleZone;
    dernierScroll = zoneActive.scrollTop || 0;

    zoneActive.addEventListener(
      "scroll",
      gererScrollUtilisateur,
      { passive: true }
    );

    mettreAJourAffichage();
  } catch(e) {}
}

/* ============================================================
   STREAMING — DÉTECTION DES CHANGEMENTS
   ============================================================ */

function signalerGeneration() {
  try {
    generationActive = true;
    dernierChangement = Date.now();

    mettreAJourAffichage();

    clearTimeout(timerGeneration);

    timerGeneration = setTimeout(function() {
      try {
        /*
         * Si aucun nouveau contenu n'arrive pendant 1,5 seconde,
         * on considère que la génération est terminée.
         */
        if (Date.now() - dernierChangement >= 1450) {
          generationActive = false;
          mettreAJourAffichage();
        }
      } catch(e) {}
    }, 1550);
  } catch(e) {}
}

function traiterNoeudMessage(node) {
  try {
    if (!node || node.nodeType !== 1) return;

    if (estMessageIA(node)) {
      transformerBlocPython(node);
      signalerGeneration();
      return;
    }

    if (!node.querySelectorAll) return;

    const messages = node.querySelectorAll(
      '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
    );

    messages.forEach(function(message) {
      transformerBlocPython(message);
      signalerGeneration();
    });
  } catch(e) {}
}

function observerConversation() {
  try {
    if (observerPrincipal || !document.body) return;

    observerPrincipal = new MutationObserver(function(mutations) {
      try {
        let changementMessage = false;

        mutations.forEach(function(mutation) {
          try {
            if (mutation.type === "characterData") {
              const parent = mutation.target.parentElement;

              if (
                parent &&
                parent.closest(
                  ".nova-code-conteneur,.nova-code-modal"
                )
              ) return;

              const message = parent && parent.closest(
                '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
              );

              if (message) {
                changementMessage = true;
                signalerGeneration();
              }

              return;
            }

            mutation.addedNodes.forEach(function(node) {
              try {
                if (node.nodeType !== 1) return;

                if (
                  node.closest &&
                  node.closest(
                    ".nova-code-conteneur,.nova-code-modal,#nova-bouton-bas,#nova-points-generation"
                  )
                ) return;

                const avant = generationActive;

                traiterNoeudMessage(node);

                if (generationActive !== avant) {
                  changementMessage = true;
                }
              } catch(e) {}
            });
          } catch(e) {}
        });

        if (changementMessage) {
          connecterZoneDiscussion();

          /*
           * On suit les nouveaux messages seulement si
           * l'utilisateur était déjà en bas.
           */
          if (
            suivreConversation &&
            !utilisateurEstRemonte &&
            zoneActive &&
            elementValide(zoneActive)
          ) {
            if (animationScroll) {
              cancelAnimationFrame(animationScroll);
            }

            animationScroll = requestAnimationFrame(function() {
              try {
                if (
                  suivreConversation &&
                  !utilisateurEstRemonte &&
                  zoneActive &&
                  elementValide(zoneActive)
                ) {
                  zoneActive.scrollTop = zoneActive.scrollHeight;
                  dernierScroll = zoneActive.scrollTop;
                }
              } catch(e) {}
            });
          }

          mettreAJourAffichage();
        }
      } catch(e) {}
    });

    observerPrincipal.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch(e) {}
}

/* ============================================================
   CLAVIER ANDROID
   ============================================================ */

function gererClavier() {
  try {
    if (window.__NOVA_CLAVIER_V4) return;
    window.__NOVA_CLAVIER_V4 = true;

    let derniereHauteur = 0;

    function actualiserHauteur() {
      try {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const hauteurVisible = viewport.height;
        const hauteurEcran = window.innerHeight;
        const hauteurClavier = Math.max(
          0,
          hauteurEcran - hauteurVisible
        );

        if (hauteurVisible > 0) {
          document.documentElement.style.setProperty(
            "--nova-hauteur-visible",
            hauteurVisible + "px"
          );
        }

        if (hauteurClavier > 80) {
          document.documentElement.style.setProperty(
            "--kb",
            hauteurClavier + "px"
          );
        } else {
          document.documentElement.style.setProperty(
            "--kb",
            "0px"
          );
        }

        derniereHauteur = hauteurVisible;
      } catch(e) {}
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        actualiserHauteur,
        { passive: true }
      );

      window.visualViewport.addEventListener(
        "scroll",
        actualiserHauteur,
        { passive: true }
      );
    }

    window.addEventListener(
      "resize",
      actualiserHauteur,
      { passive: true }
    );

    /* Secours pour certains WebView Android. */
    setInterval(function() {
      try {
        if (
          window.visualViewport &&
          window.visualViewport.height !== derniereHauteur
        ) {
          actualiserHauteur();
        }
      } catch(e) {}
    }, 300);

    actualiserHauteur();
  } catch(e) {}
}

/* ============================================================
   TRAITEMENT DES MESSAGES EXISTANTS
   ============================================================ */

function traiterMessages() {
  try {
    const messages = document.querySelectorAll(
      '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
    );

    messages.forEach(function(message) {
      try {
        transformerBlocPython(message);
      } catch(e) {}
    });
  } catch(e) {}
}

/* ============================================================
   INITIALISATION
   ============================================================ */

function init() {
  try { installerStyles(); } catch(e) {}
  try { creerBoutonDescendre(); } catch(e) {}
  try { creerPointsGeneration(); } catch(e) {}
  try { connecterZoneDiscussion(); } catch(e) {}
  try { gererClavier(); } catch(e) {}
  try { traiterMessages(); } catch(e) {}
  try { observerConversation(); } catch(e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

/* Vérification légère de la zone de discussion. */
if (!window.__NOVA_SCROLL_V4_SECOURS) {
  window.__NOVA_SCROLL_V4_SECOURS = setInterval(function() {
    try {
      connecterZoneDiscussion();
      mettreAJourAffichage();
    } catch(e) {}
  }, 1000);
}

/* ============================================================
   API PUBLIQUE
   ============================================================ */

window.NOVA_SCROLL = {
  descendreEnBas: function() {
    try {
      connecterZoneDiscussion();

      if (!zoneActive) return;

      utilisateurEstRemonte = false;
      suivreConversation = true;

      zoneActive.scrollTo({
        top: zoneActive.scrollHeight,
        behavior: "smooth"
      });

      mettreAJourAffichage();
    } catch(e) {}
  },

  actualiser: function() {
    try {
      connecterZoneDiscussion();
      mettreAJourAffichage();
      traiterMessages();
    } catch(e) {}
  },

  estEnCours: function() {
    return generationActive;
  }
};

})();
