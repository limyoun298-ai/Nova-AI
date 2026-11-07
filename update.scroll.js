/* ============================================================
   NOVA AI — UPDATE.SCROLL.JS
   VERSION : 2.0.0

   MODULE :
   - SCROLL INTELLIGENT
   - FLÈCHE SVG GRISE
   - INDICATEUR D'ÉCRITURE
   - FLUIDITÉ D'AFFICHAGE
   - CLAVIER ANDROID
   - MODULE PYTHON

   PRIORITÉ :
   - Respecter le défilement manuel.
   - Ne pas forcer l'utilisateur vers le bas.
   - Ne pas casser les fonctions originales.
   - Isoler les erreurs.
============================================================ */

(function () {
"use strict";

try {

  if (window.__NOVA_SCROLL_V2) return;
  window.__NOVA_SCROLL_V2 = true;

  const VERSION = "2.0.0";

  let utilisateurEnHaut = false;
  let suivreConversation = true;
  let derniereActiviteIA = 0;
  let minuterieEcriture = null;
  let zoneDiscussion = null;
  let boutonBas = null;
  let observationActive = false;
  let dernierContenu = "";

  /* ========================================================
     1. OUTILS DE SÉCURITÉ
  ======================================================== */

  function securise(fn) {
    try {
      return fn();
    } catch (e) {
      console.warn("[NOVA SCROLL]", e);
      return null;
    }
  }

  function echapperHTML(t) {
    try {
      return String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    } catch (e) {
      return "";
    }
  }

  function elementValide(el) {
    try {
      return !!(
        el &&
        el.nodeType === 1 &&
        document.documentElement.contains(el)
      );
    } catch (e) {
      return false;
    }
  }

  function estVisible(el) {
    try {
      if (!elementValide(el)) return false;

      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    } catch (e) {
      return false;
    }
  }

  /* ========================================================
     2. IDENTIFICATION DES MESSAGES
  ======================================================== */

  function estMessageIA(el) {
    try {
      if (!el || el.nodeType !== 1) return false;

      const role = String(
        el.getAttribute("data-role") || ""
      ).toLowerCase();

      const auteur = String(
        el.getAttribute("data-author") || ""
      ).toLowerCase();

      const cls = String(
        typeof el.className === "string" ? el.className : ""
      ).toLowerCase();

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
    } catch (e) {
      return false;
    }
  }

  function trouverMessagesIA() {
    try {
      return document.querySelectorAll(
        '[data-role="assistant"],' +
        '.assistant-message,' +
        '.ai-message,' +
        '.bot-message,' +
        '.message-assistant'
      );
    } catch (e) {
      return [];
    }
  }

  /* ========================================================
     3. DÉTECTION DE LA DISCUSSION
  ======================================================== */

  function trouverZoneDiscussion() {
    try {

      const selecteurs = [
        '[data-role="discussion"]',
        '#chat-messages',
        '#messages',
        '#chat-box',
        '.chat-messages',
        '.messages-container',
        '.conversation',
        '.chat-container',
        '.message-list'
      ];

      for (const selecteur of selecteurs) {

        const el = document.querySelector(selecteur);

        if (!el || !estVisible(el)) continue;

        if (
          el.scrollHeight > el.clientHeight + 20 ||
          el.querySelector(
            '[data-role="assistant"],' +
            '.assistant-message,' +
            '.ai-message,' +
            '.bot-message,' +
            '.message-assistant'
          )
        ) {
          return el;
        }
      }

      const messages = trouverMessagesIA();

      if (messages.length) {

        let parent = messages[messages.length - 1].parentElement;

        for (let i = 0; i < 6 && parent; i++) {

          if (
            parent.scrollHeight >
            parent.clientHeight + 20
          ) {
            return parent;
          }

          parent = parent.parentElement;
        }
      }

      return null;

    } catch (e) {
      return null;
    }
  }

  function estEnBas(zone, tolerance) {
    try {
      if (!zone) return true;

      return (
        zone.scrollHeight -
        zone.scrollTop -
        zone.clientHeight
      ) < (tolerance || 100);

    } catch (e) {
      return true;
    }
  }

  /* ========================================================
     4. STYLES
  ======================================================== */

  function installerStyles() {
    try {

      if (document.getElementById("nova-scroll-v2-style")) {
        return;
      }

      const style = document.createElement("style");

      style.id = "nova-scroll-v2-style";

      style.textContent = `

        /* ===============================
           FLÈCHE SVG GRISE
        =============================== */

        #nova-bouton-bas {
          position: fixed !important;
          left: 50% !important;
          bottom: calc(88px + env(safe-area-inset-bottom)) !important;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          padding: 0;
          border-radius: 50%;
          border: 1px solid rgba(150,150,150,.25);
          background: #252525;
          color: #bdbdbd;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(0,0,0,.25);
          -webkit-tap-highlight-color: transparent;
        }

        #nova-bouton-bas.nova-visible {
          display: flex !important;
        }

        #nova-bouton-bas svg {
          width: 19px;
          height: 19px;
          stroke: #bdbdbd;
          fill: none;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        #nova-bouton-bas:active {
          transform: translateX(-50%) scale(.92);
        }

        /* ===============================
           INDICATEUR D'ÉCRITURE
        =============================== */

        .nova-typing-hidden {
          display: none !important;
          visibility: hidden !important;
          animation: none !important;
        }

        /* ===============================
           MESSAGES
        =============================== */

        [data-role="assistant"],
        .assistant-message,
        .ai-message,
        .bot-message,
        .message-assistant {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* ===============================
           CLAVIER
        =============================== */

        :root {
          --nova-keyboard-height: 0px;
          --nova-visual-height: 100dvh;
        }

        /* ===============================
           PYTHON
        =============================== */

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
          flex-shrink: 0;
        }

        .nova-code-copier {
          background: #2f7bff;
        }

        .nova-code-voir,
        .nova-code-fermer {
          background: #303034;
        }

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

        .nova-code-motcle {
          color: #bd93f9;
        }

        .nova-code-string {
          color: #55d98b;
        }

        .nova-code-commentaire {
          color: #888;
          font-style: italic;
        }

        .nova-code-nombre {
          color: #79c0ff;
        }

        .nova-code-normal {
          color: #e6e6e6;
        }

        /* ===============================
           MODALE PYTHON
        =============================== */

        .nova-code-modal {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          background: #080808;
          display: flex;
          flex-direction: column;
          padding:
            env(safe-area-inset-top)
            0
            env(safe-area-inset-bottom);
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
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nova-code-modal .nova-fermer {
          background: #303034;
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

    } catch (e) {}
  }

  /* ========================================================
     5. SVG PYTHON
  ======================================================== */

  function svgCopierBlanc() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
  }

  function svgOeilBlanc() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  }

  function svgFermerBlanc() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';
  }

  /* ========================================================
     6. COLORATION PYTHON
  ======================================================== */

  function colorerPython(code) {
    try {

      const texte = String(code);

      const tokens =
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self)\b|\b\d+(?:\.\d+)?\b)/gm;

      let resultat = "";
      let position = 0;
      let match;

      while ((match = tokens.exec(texte)) !== null) {

        resultat += echapperHTML(
          texte.slice(position, match.index)
        );

        const token = match[0];
        let classe = "nova-code-normal";

        if (token.startsWith("#")) {
          classe = "nova-code-commentaire";
        } else if (
          token.startsWith('"') ||
          token.startsWith("'")
        ) {
          classe = "nova-code-string";
        } else if (/^\d/.test(token)) {
          classe = "nova-code-nombre";
        } else {
          classe = "nova-code-motcle";
        }

        resultat +=
          '<span class="' + classe + '">' +
          echapperHTML(token) +
          '</span>';

        position = tokens.lastIndex;
      }

      resultat += echapperHTML(texte.slice(position));

      return resultat;

    } catch (e) {
      return echapperHTML(code);
    }
  }

  /* ========================================================
     7. COPIER CODE
  ======================================================== */

  async function copierTexte(code, bouton) {
    try {

      const texte = String(code);
      let ok = false;

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        try {
          await navigator.clipboard.writeText(texte);
          ok = true;
        } catch (e) {}
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
        } catch (e) {
          ok = false;
        }

        zone.remove();
      }

      if (bouton && ok) {

        const ancien = bouton.innerHTML;

        bouton.textContent = "Copié !";

        setTimeout(function () {
          try {
            bouton.innerHTML = ancien;
          } catch (e) {}
        }, 1800);
      }

      return ok;

    } catch (e) {
      return false;
    }
  }

  /* ========================================================
     8. MODALE CODE PYTHON
  ======================================================== */

  function ouvrirModaleCode(codeOriginal) {
    try {

      const ancienne = document.getElementById(
        "nova-code-modal"
      );

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
      copier.innerHTML =
        svgCopierBlanc() + "<span>Copier</span>";

      copier.addEventListener("click", function () {
        copierTexte(codeOriginal, copier);
      });

      const fermer = document.createElement("button");

      fermer.className = "nova-fermer";
      fermer.type = "button";

      fermer.innerHTML =
        svgFermerBlanc() + "<span>Fermer</span>";

      const corps = document.createElement("div");
      corps.className = "nova-code-modal-corps";

      const pre = document.createElement("pre");
      const code = document.createElement("code");

      code.textContent = String(codeOriginal);

      pre.appendChild(code);
      corps.appendChild(pre);

      function fermerModal() {
        try {
          modal.remove();
          document.body.style.overflow = "";
          document.removeEventListener("keydown", touche);
        } catch (e) {}
      }

      fermer.addEventListener("click", fermerModal);

      actions.appendChild(copier);
      actions.appendChild(fermer);

      entete.appendChild(titre);
      entete.appendChild(actions);

      modal.appendChild(entete);
      modal.appendChild(corps);

      document.body.appendChild(modal);

      document.body.style.overflow = "hidden";

      modal.addEventListener("click", function (e) {
        if (e.target === modal) fermerModal();
      });

      const touche = function (e) {
        if (e.key === "Escape") fermerModal();
      };

      document.addEventListener("keydown", touche);

    } catch (e) {
      try {
        document.body.style.overflow = "";
      } catch (er) {}
    }
  }

  /* ========================================================
     9. BARRE PYTHON
  ======================================================== */

  function creerBarrePython(conteneur, codeOriginal) {
    try {

      if (!elementValide(conteneur)) return;

      if (conteneur.dataset.novaBoutonsCode === "oui") {
        return;
      }

      const barre = document.createElement("div");

      barre.className = "nova-code-barre";

      const voir = document.createElement("button");

      voir.className = "nova-code-voir";
      voir.type = "button";

      voir.innerHTML =
        svgOeilBlanc() + "<span>Voir</span>";

      voir.addEventListener("click", function () {
        ouvrirModaleCode(codeOriginal);
      });

      const copier = document.createElement("button");

      copier.className = "nova-code-copier";
      copier.type = "button";

      copier.innerHTML =
        svgCopierBlanc() + "<span>Copier</span>";

      copier.addEventListener("click", function () {
        copierTexte(codeOriginal, copier);
      });

      const fermer = document.createElement("button");

      fermer.className = "nova-code-fermer";
      fermer.type = "button";

      fermer.innerHTML =
        svgFermerBlanc() + "<span>Fermer</span>";

      fermer.addEventListener("click", function () {

        const scroll = conteneur.querySelector(
          ".nova-code-scroll"
        );

        if (!scroll) return;

        const cache = scroll.style.display === "none";

        scroll.style.display = cache ? "" : "none";

        fermer.innerHTML = cache
          ? svgFermerBlanc() + "<span>Fermer</span>"
          : svgOeilBlanc() + "<span>Ouvrir</span>";
      });

      barre.appendChild(voir);
      barre.appendChild(copier);
      barre.appendChild(fermer);

      conteneur.insertBefore(barre, conteneur.firstChild);

      conteneur.dataset.novaBoutonsCode = "oui";

    } catch (e) {}
  }

  /* ========================================================
     10. TRANSFORMATION PYTHON
  ======================================================== */

  function transformerBlocPython(element) {
    try {

      if (!elementValide(element)) return;
      if (!estMessageIA(element)) return;

      const blocs = element.querySelectorAll("pre");

      blocs.forEach(function (pre) {

        try {

          if (pre.dataset.novaPythonTraite === "oui") {
            return;
          }

          const codeEl = pre.querySelector("code");

          if (!codeEl) return;

          const texte = codeEl.textContent || "";

          const classe = String(
            codeEl.getAttribute("class") || ""
          ).toLowerCase();

          const estPython =
            classe.includes("python") ||
            classe.includes("language-py") ||
            classe.includes("language-python") ||
            (
              !classe.includes("javascript") &&
              !classe.includes("html") &&
              !classe.includes("css") &&
              (
                texte.includes("def ") ||
                texte.includes("import ") ||
                texte.includes("print(")
              )
            );

          if (!estPython) return;

          const original = texte;

          const conteneur = document.createElement("div");

          conteneur.className = "nova-code-conteneur";

          const scroll = document.createElement("div");

          scroll.className = "nova-code-scroll";

          const nouveauPre = document.createElement("pre");
          const nouveauCode = document.createElement("code");

          nouveauCode.className = "language-python";

          nouveauCode.innerHTML = colorerPython(original);

          nouveauPre.appendChild(nouveauCode);
          scroll.appendChild(nouveauPre);

          conteneur.appendChild(scroll);

          creerBarrePython(conteneur, original);

          pre.dataset.novaPythonTraite = "oui";

          pre.replaceWith(conteneur);

        } catch (e) {}
      });

      /* Code Markdown */

      const arbre = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {

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

            } catch (e) {
              return NodeFilter.FILTER_REJECT;
            }
          }
        }
      );

      const zones = [];

      while (arbre.nextNode()) {
        zones.push(arbre.currentNode);
      }

      zones.forEach(function (node) {

        try {

          const texte = node.nodeValue;

          const regex =
            /```(?:python|py)\s*\n([\s\S]*?)```/gi;

          let match;
          let dernierIndex = 0;
          let trouve = false;

          const fragment = document.createDocumentFragment();

          while ((match = regex.exec(texte)) !== null) {

            trouve = true;

            const avant = texte.slice(
              dernierIndex,
              match.index
            );

            if (avant) {
              fragment.appendChild(
                document.createTextNode(avant)
              );
            }

            const original = match[1];

            const conteneur = document.createElement("div");

            conteneur.className = "nova-code-conteneur";

            const scroll = document.createElement("div");

            scroll.className = "nova-code-scroll";

            const pre = document.createElement("pre");
            const code = document.createElement("code");

            code.className = "language-python";

            code.innerHTML = colorerPython(original);

            pre.appendChild(code);
            scroll.appendChild(pre);
            conteneur.appendChild(scroll);

            creerBarrePython(conteneur, original);

            fragment.appendChild(conteneur);

            dernierIndex = regex.lastIndex;
          }

          if (trouve) {

            const apres = texte.slice(dernierIndex);

            if (apres) {
              fragment.appendChild(
                document.createTextNode(apres)
              );
            }

            node.parentNode.replaceChild(fragment, node);
          }

        } catch (e) {}
      });

    } catch (e) {}
  }

  function traiterMessagesPython() {
    try {
      trouverMessagesIA().forEach(function (message) {
        try {
          transformerBlocPython(message);
        } catch (e) {}
      });
    } catch (e) {}
  }

  /* ========================================================
     11. FLÈCHE SVG GRISE
  ======================================================== */

  function creerBoutonDescendre() {
    try {

      if (boutonBas && elementValide(boutonBas)) {
        return boutonBas;
      }

      const ancien = document.getElementById(
        "nova-bouton-bas"
      );

      if (ancien) {
        boutonBas = ancien;
        return ancien;
      }

      const btn = document.createElement("button");

      btn.id = "nova-bouton-bas";
      btn.type = "button";

      btn.setAttribute(
        "aria-label",
        "Descendre en bas de la conversation"
      );

      btn.innerHTML = `
        <svg viewBox="0 0 24 24"
          aria-hidden="true">
          <path d="M12 4v15"></path>
          <path d="m6 13 6 6 6-6"></path>
        </svg>
      `;

      btn.addEventListener("click", function (e) {

        try {

          e.preventDefault();
          e.stopPropagation();

          utilisateurEnHaut = false;
          suivreConversation = true;

          const zone = trouverZoneDiscussion();

          if (!zone) return;

          zone.scrollTo({
            top: zone.scrollHeight,
            behavior: "smooth"
          });

          cacherBoutonBas();

        } catch (erreur) {}
      });

      document.body.appendChild(btn);

      boutonBas = btn;

      return btn;

    } catch (e) {
      return null;
    }
  }

  function montrerBoutonBas() {
    try {

      const zone = trouverZoneDiscussion();

      if (!zone) {
        cacherBoutonBas();
        return;
      }

      const btn = creerBoutonDescendre();

      if (btn) {
        btn.classList.add("nova-visible");
      }

    } catch (e) {}
  }

  function cacherBoutonBas() {
    try {

      const btn = document.getElementById(
        "nova-bouton-bas"
      );

      if (btn) {
        btn.classList.remove("nova-visible");
      }

    } catch (e) {}
  }

  function mettreAJourBoutonBas() {
    try {

      const zone = trouverZoneDiscussion();

      if (!zone) {
        cacherBoutonBas();
        return;
      }

      zoneDiscussion = zone;

      if (estEnBas(zone, 130)) {
        cacherBoutonBas();
      } else {
        montrerBoutonBas();
      }

    } catch (e) {}
  }

  /* ========================================================
     12. SCROLL INTELLIGENT
  ======================================================== */

  function allerEnBas(force) {
    try {

      const zone = trouverZoneDiscussion();

      if (!zone) return;

      if (!force && !suivreConversation) return;

      zone.scrollTop = zone.scrollHeight;

    } catch (e) {}
  }

  function gererScrollUtilisateur() {
    try {

      if (window.__NOVA_SCROLL_ECOUTE_V2) return;

      window.__NOVA_SCROLL_ECOUTE_V2 = true;

      let dernierePosition = 0;

      function ecouter(zone) {

        if (!zone || zone.dataset.novaScrollV2 === "oui") {
          return;
        }

        zone.dataset.novaScrollV2 = "oui";

        dernierePosition = zone.scrollTop;

        zone.addEventListener("scroll", function () {

          try {

            const position = zone.scrollTop;

            if (position < dernierePosition - 5) {

              utilisateurEnHaut = true;
              suivreConversation = false;

            }

            if (estEnBas(zone, 130)) {

              utilisateurEnHaut = false;
              suivreConversation = true;

              cacherBoutonBas();

            } else {

              montrerBoutonBas();

            }

            dernierePosition = position;

          } catch (e) {}

        }, { passive: true });

      }

      const zone = trouverZoneDiscussion();

      if (zone) ecouter(zone);

      window.addEventListener("wheel", function (e) {

        try {

          if (e.deltaY < -5) {
            utilisateurEnHaut = true;
            suivreConversation = false;
          }

        } catch (erreur) {}

      }, { passive: true });

      document.addEventListener("touchstart", function (e) {

        try {
          window.__NOVA_TOUCH_Y =
            e.touches[0].clientY;
        } catch (erreur) {}

      }, { passive: true });

      document.addEventListener("touchend", function (e) {

        try {

          const debut = window.__NOVA_TOUCH_Y;

          if (typeof debut !== "number") return;

          const fin = e.changedTouches[0].clientY;

          if (fin > debut + 20) {

            utilisateurEnHaut = true;
            suivreConversation = false;

          }

        } catch (erreur) {}

      }, { passive: true });

    } catch (e) {}
  }

  /* ========================================================
     13. DÉTECTION DE L'ÉCRITURE
  ======================================================== */

  function detecterIndicateurs() {
    try {

      const selecteurs = [
        ".typing-indicator",
        ".typing",
        ".typing-dots",
        ".loading-dots",
        ".thinking-indicator",
        ".nova-thinking",
        "[data-typing]",
        "[data-status='typing']",
        "#typing-indicator"
      ];

      const resultat = [];

      selecteurs.forEach(function (selecteur) {

        try {

          document.querySelectorAll(selecteur).forEach(function (el) {

            if (
              estVisible(el) &&
              !el.closest(".nova-code-conteneur")
            ) {
              resultat.push(el);
            }

          });

        } catch (e) {}

      });

      return resultat;

    } catch (e) {
      return [];
    }
  }

  function actualiserIndicateur() {
    try {

      const indicateurs = detecterIndicateurs();

      const enCours = indicateurs.some(function (el) {
        return estVisible(el);
      });

      indicateurs.forEach(function (el) {

        if (!enCours) {
          el.classList.add("nova-typing-hidden");
        }

      });

      return enCours;

    } catch (e) {
      return false;
    }
  }

  function signalerActiviteIA() {
    try {

      derniereActiviteIA = Date.now();

      clearTimeout(minuterieEcriture);

      minuterieEcriture = setTimeout(function () {

        try {

          const indicateurs = detecterIndicateurs();

          /*
           * On ne supprime pas les indicateurs originaux.
           * On ne modifie que ceux qui sont déjà terminés.
           */

          const inactif =
            Date.now() - derniereActiviteIA > 1500;

          if (inactif) {

            indicateurs.forEach(function (el) {

              try {

                el.classList.add("nova-typing-hidden");

              } catch (e) {}

            });

          }

          mettreAJourBoutonBas();

        } catch (e) {}

      }, 1600);

    } catch (e) {}
  }

  /* ========================================================
     14. OBSERVATION DU STREAMING
  ======================================================== */

  function gererStreaming() {
    try {

      if (window.__NOVA_STREAMING_V2) return;

      window.__NOVA_STREAMING_V2 = true;

      const observer = new MutationObserver(function (mutations) {

        try {

          let changementTexte = false;
          let changementStructure = false;

          mutations.forEach(function (mutation) {

            try {

              if (mutation.type === "characterData") {

                changementTexte = true;

              }

              if (mutation.type === "childList") {

                if (
                  mutation.addedNodes.length ||
                  mutation.removedNodes.length
                ) {
                  changementStructure = true;
                }

              }

            } catch (e) {}

          });

          if (!changementTexte && !changementStructure) {
            return;
          }

          const messages = trouverMessagesIA();

          if (!messages.length) return;

          signalerActiviteIA();

          if (changementStructure) {
            traiterMessagesPython();
          }

          /*
           * Respecte toujours le choix de l'utilisateur.
           */

          if (suivreConversation && !utilisateurEnHaut) {

            requestAnimationFrame(function () {
              allerEnBas(false);
            });

          } else {

            montrerBoutonBas();

          }

          mettreAJourBoutonBas();

        } catch (e) {}

      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });

    } catch (e) {}
  }

  /* ========================================================
     15. CLAVIER ANDROID
  ======================================================== */

  function trouverZoneSaisie() {
    try {

      const selecteurs = [
        "#composer",
        ".composer",
        ".chat-input-container",
        ".input-container",
        "form"
      ];

      for (const selecteur of selecteurs) {

        const el = document.querySelector(selecteur);

        if (el && estVisible(el)) {

          if (
            el.querySelector("textarea,input") ||
            el.matches("form")
          ) {
            return el;
          }

        }

      }

      const input = document.querySelector(
        "textarea, input:not([type='hidden'])"
      );

      return input
        ? input.closest("form") || input.parentElement
        : null;

    } catch (e) {
      return null;
    }
  }

  function gererClavier() {
    try {

      if (window.__NOVA_CLAVIER_V2) return;

      window.__NOVA_CLAVIER_V2 = true;

      function actualiser() {

        try {

          const viewport = window.visualViewport;

          if (!viewport) return;

          const hauteurClavier = Math.max(
            0,
            window.innerHeight - viewport.height - viewport.offsetTop
          );

          document.documentElement.style.setProperty(
            "--nova-keyboard-height",
            hauteurClavier + "px"
          );

          document.documentElement.style.setProperty(
            "--nova-visual-height",
            viewport.height + "px"
          );

          /*
           * Important :
           * Aucun positionnement fixed forcé du composer.
           * On laisse le système Android gérer sa position.
           */

        } catch (e) {}

      }

      if (window.visualViewport) {

        window.visualViewport.addEventListener(
          "resize",
          actualiser,
          { passive: true }
        );

        window.visualViewport.addEventListener(
          "scroll",
          actualiser,
          { passive: true }
        );

      }

      window.addEventListener(
        "resize",
        actualiser,
        { passive: true }
      );

      document.addEventListener("focusin", function (e) {

        try {

          if (
            e.target &&
            (
              e.target.tagName === "TEXTAREA" ||
              e.target.tagName === "INPUT"
            )
          ) {

            setTimeout(function () {

              try {

                const zone = trouverZoneSaisie();

                if (!zone) return;

                const rect = zone.getBoundingClientRect();

                const hauteur =
                  window.visualViewport
                    ? window.visualViewport.height
                    : window.innerHeight;

                if (rect.bottom > hauteur - 10) {

                  zone.scrollIntoView({
                    block: "nearest",
                    behavior: "auto"
                  });

                }

              } catch (e) {}

            }, 150);

          }

        } catch (erreur) {}

      });

      actualiser();

    } catch (e) {}
  }

  /* ========================================================
     16. OBSERVATION DES NOUVELLES DISCUSSIONS
  ======================================================== */

  function observerDiscussion() {
    try {

      if (observationActive || !document.body) return;

      observationActive = true;

      const observer = new MutationObserver(function () {

        try {

          const nouvelleZone = trouverZoneDiscussion();

          if (nouvelleZone && nouvelleZone !== zoneDiscussion) {

            zoneDiscussion = nouvelleZone;

            /*
             * Une nouvelle conversation commence.
             * La flèche est actualisée selon sa position.
             */

            mettreAJourBoutonBas();

          }

          if (!trouverMessagesIA().length) {
            cacherBoutonBas();
          }

        } catch (e) {}

      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

    } catch (e) {}
  }

  /* ========================================================
     17. INITIALISATION
  ======================================================== */

  function initialiser() {

    try { installerStyles(); } catch (e) {}

    try { zoneDiscussion = trouverZoneDiscussion(); } catch (e) {}

    try { creerBoutonDescendre(); } catch (e) {}

    try { gererScrollUtilisateur(); } catch (e) {}

    try { gererStreaming(); } catch (e) {}

    try { gererClavier(); } catch (e) {}

    try { traiterMessagesPython(); } catch (e) {}

    try { observerDiscussion(); } catch (e) {}

    try { mettreAJourBoutonBas(); } catch (e) {}

    console.info(
      "[NOVA SCROLL] Version " + VERSION + " initialisée."
    );
  }

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      initialiser,
      { once: true }
    );

  } else {

    initialiser();

  }

  /* ========================================================
     18. SURVEILLANCE DE SECOURS
  ======================================================== */

  if (!window.__NOVA_SCROLL_SECOURS_V2) {

    window.__NOVA_SCROLL_SECOURS_V2 = setInterval(function () {

      try {

        if (!elementValide(boutonBas)) {
          boutonBas = null;
        }

        const zone = trouverZoneDiscussion();

        if (zone) {
          zoneDiscussion = zone;
        }

        mettreAJourBoutonBas();

      } catch (e) {}

    }, 1200);

  }

  /* ========================================================
     19. API PUBLIQUE
  ======================================================== */

  window.NOVA_SCROLL = {

    version: VERSION,

    descendreEnBas: function () {
      try {

        utilisateurEnHaut = false;
        suivreConversation = true;

        const zone = trouverZoneDiscussion();

        if (zone) {
          zone.scrollTo({
            top: zone.scrollHeight,
            behavior: "smooth"
          });
        }

        cacherBoutonBas();

      } catch (e) {}
    },

    actualiser: function () {
      try {
        mettreAJourBoutonBas();
        traiterMessagesPython();
      } catch (e) {}
    },

    estEnCours: function () {
      try {
        return Date.now() - derniereActiviteIA < 1600;
      } catch (e) {
        return false;
      }
    }

  };

  console.info("[NOVA SCROLL] Module chargé.");

} catch (erreur) {

  console.error(
    "[NOVA SCROLL] Erreur isolée :",
    erreur
  );

}

})();
