/* ============================================================
   NOVA AI — UPDATE.SCROLL.JS
   VERSION 3.0 — SCROLL STABLE + PYTHON
   CORRECTIONS :
   1. Un seul système de défilement.
   2. Remontée libre pendant la génération.
   3. Flèche visible uniquement après remontée.
   4. Aucun scroll forcé de la fenêtre.
   5. Clavier : aucune position forcée du compositeur.
   6. Python : Voir / Copier / Fermer conservés.
   7. Protection try/catch.
   ============================================================ */

(function () {
"use strict";

try {
  if (window.NOVA_SCROLL_V3) return;
  window.NOVA_SCROLL_V3 = true;
} catch(e) { return; }

let utilisateurEstRemonte = false;
let suivreConversation = true;
let zoneActive = null;
let dernierScroll = 0;
let observerPython = null;
let observerMessages = null;
let animationScroll = null;
let temporisateurFin = null;

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
   IDENTIFICATION PRUDENTE DE LA CONVERSATION
   Ne choisit plus automatiquement MAIN ou la fenêtre.
   ============================================================ */

function trouverZoneDiscussion() {
  try {
    const selecteurs = [
      '[data-role="discussion"]',
      '[data-role="messages"]',
      '#messages',
      '#chat-messages',
      '.chat-messages',
      '.messages-container',
      '.conversation',
      '.chat-history',
      '.message-list'
    ];

    for (const selecteur of selecteurs) {
      const el = document.querySelector(selecteur);

      if (
        elementValide(el) &&
        el.scrollHeight > el.clientHeight + 30 &&
        getComputedStyle(el).overflowY !== "visible"
      ) {
        return el;
      }
    }

    /* Recherche du parent réellement défilant des messages IA. */
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

    const marge = tolerance || 100;

    return (
      zone.scrollHeight -
      zone.scrollTop -
      zone.clientHeight
    ) <= marge;
  } catch(e) {
    return true;
  }
}

/* ============================================================
   STYLES
   ============================================================ */

function installerStyles() {
  try {
    if (document.getElementById("nova-scroll-v3-style")) return;

    const style = document.createElement("style");
    style.id = "nova-scroll-v3-style";

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
   FLÈCHE — APPARAÎT UNIQUEMENT APRÈS REMONTÉE
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

        const zone = trouverZoneDiscussion();
        if (!zone) return;

        utilisateurEstRemonte = false;
        suivreConversation = true;

        zone.scrollTo({
          top: zone.scrollHeight,
          behavior: "smooth"
        });

        cacherBoutonBas();
      } catch(e) {}
    });

    document.body.appendChild(btn);
    return btn;
  } catch(e) {
    return null;
  }
}

function montrerBoutonBas() {
  try {
    const btn = creerBoutonDescendre();
    if (btn) btn.classList.add("nova-visible");
  } catch(e) {}
}

function cacherBoutonBas() {
  try {
    const btn = document.getElementById("nova-bouton-bas");
    if (btn) btn.classList.remove("nova-visible");
  } catch(e) {}
}

function mettreAJourBoutonBas() {
  try {
    if (!zoneActive || !elementValide(zoneActive)) {
      cacherBoutonBas();
      return;
    }

    if (estEnBas(zoneActive, 90)) {
      utilisateurEstRemonte = false;
      suivreConversation = true;
      cacherBoutonBas();
      return;
    }

    if (utilisateurEstRemonte) {
      montrerBoutonBas();
    } else {
      cacherBoutonBas();
    }
  } catch(e) {}
}

/* ============================================================
   UN SEUL ÉCOUTEUR DE SCROLL
   ============================================================ */

function connecterZoneDiscussion() {
  try {
    const nouvelleZone = trouverZoneDiscussion();

    if (!nouvelleZone) {
      zoneActive = null;
      cacherBoutonBas();
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

    mettreAJourBoutonBas();
  } catch(e) {}
}

function gererScrollUtilisateur() {
  try {
    if (!zoneActive || !elementValide(zoneActive)) return;

    const top = zoneActive.scrollTop || 0;

    if (top < dernierScroll - 4) {
      utilisateurEstRemonte = true;
      suivreConversation = false;
    }

    if (estEnBas(zoneActive, 90)) {
      utilisateurEstRemonte = false;
      suivreConversation = true;
    }

    dernierScroll = top;
    mettreAJourBoutonBas();
  } catch(e) {}
}

/* ============================================================
   STREAMING — NE FORCE PLUS LE SCROLL
   ============================================================ */

function gererStreaming() {
  try {
    if (observerPython) return;

    observerPython = new MutationObserver(function(mutations) {
      try {
        let changementMessage = false;

        for (const mutation of mutations) {
          if (mutation.type === "characterData") {
            const parent = mutation.target.parentElement;

            if (parent && parent.closest(".nova-code-conteneur")) {
              continue;
            }

            changementMessage = true;
            continue;
          }

          mutation.addedNodes.forEach(function(node) {
            try {
              if (node.nodeType !== 1) return;

              if (
                node.closest &&
                node.closest(
                  ".nova-code-conteneur,.nova-code-modal,#nova-bouton-bas"
                )
              ) return;

              if (estMessageIA(node)) {
                changementMessage = true;
                transformerBlocPython(node);
                return;
              }

              const enfants = node.querySelectorAll
                ? node.querySelectorAll(
                    '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
                  )
                : [];

              enfants.forEach(function(enfant) {
                changementMessage = true;
                transformerBlocPython(enfant);
              });
            } catch(e) {}
          });
        }

        if (changementMessage) {
          connecterZoneDiscussion();

          /*
           * Suivi uniquement si l'utilisateur était déjà en bas.
           * Aucun déplacement si l'utilisateur a remonté.
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
                }
              } catch(e) {}
            });
          }

          clearTimeout(temporisateurFin);

          temporisateurFin = setTimeout(function() {
            try {
              mettreAJourBoutonBas();
            } catch(e) {}
          }, 1800);
        }
      } catch(e) {}
    });

    /*
     * Observation limitée aux changements de contenu.
     * Les modifications du bouton et des styles sont ignorées.
     */
    observerPython.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch(e) {}
}

/* ============================================================
   CLAVIER ANDROID
   Ne fixe plus le compositeur et ne fait plus scrollIntoView.
   Laisse le WebView et le CSS existant gérer le clavier.
   ============================================================ */

function gererClavier() {
  try {
    if (window.__NOVA_CLAVIER_V3) return;
    window.__NOVA_CLAVIER_V3 = true;

    const actualiserHauteur = function() {
      try {
        if (!window.visualViewport) return;

        const hauteur = window.visualViewport.height;

        if (hauteur > 0) {
          document.documentElement.style.setProperty(
            "--nova-hauteur-visible",
            hauteur + "px"
          );
        }
      } catch(e) {}
    };

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

    actualiserHauteur();
  } catch(e) {}
}

/* ============================================================
   TRAITEMENT DES MESSAGES
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
   OBSERVATION DES NOUVEAUX MESSAGES
   ============================================================ */

function observerDiscussion() {
  try {
    if (observerMessages || !document.body) return;

    observerMessages = new MutationObserver(function(mutations) {
      try {
        let nouveauMessage = false;

        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            try {
              if (node.nodeType !== 1) return;

              if (
                node.closest &&
                node.closest(
                  ".nova-code-conteneur,.nova-code-modal,#nova-bouton-bas"
                )
              ) return;

              if (estMessageIA(node)) {
                transformerBlocPython(node);
                nouveauMessage = true;
                return;
              }

              if (!node.querySelectorAll) return;

              const enfants = node.querySelectorAll(
                '[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant'
              );

              enfants.forEach(function(enfant) {
                transformerBlocPython(enfant);
                nouveauMessage = true;
              });
            } catch(e) {}
          });
        });

        if (nouveauMessage) {
          connecterZoneDiscussion();
        }
      } catch(e) {}
    });

    observerMessages.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch(e) {}
}

/* ============================================================
   INITIALISATION
   ============================================================ */

function init() {
  try { installerStyles(); } catch(e) {}
  try { creerBoutonDescendre(); } catch(e) {}
  try { connecterZoneDiscussion(); } catch(e) {}
  try { gererStreaming(); } catch(e) {}
  try { gererClavier(); } catch(e) {}
  try { traiterMessages(); } catch(e) {}
  try { observerDiscussion(); } catch(e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

/* Vérification légère : retrouve la zone si l'interface est recréée. */
if (!window.__NOVA_SCROLL_V3_SECOURS) {
  window.__NOVA_SCROLL_V3_SECOURS = setInterval(function() {
    try {
      connecterZoneDiscussion();
      mettreAJourBoutonBas();
    } catch(e) {}
  }, 1200);
}

/* API publique */
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

      cacherBoutonBas();
    } catch(e) {}
  },

  actualiser: function() {
    try {
      connecterZoneDiscussion();
      mettreAJourBoutonBas();
      traiterMessages();
    } catch(e) {}
  },

  estEnCours: function() {
    return !!temporisateurFin;
  }
};

})();
