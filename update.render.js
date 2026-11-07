/* ============================================================
   NOVA AI — UPDATE.RENDER.JS
   VERSION : 1.0.0
   MODULE : RENDU RAPIDE + CODE + AFFICHAGE

   OBJECTIFS :
   1. Améliorer la fluidité d'affichage de NOVA.
   2. Éviter les animations artificielles du texte.
   3. Ajouter trois commandes SVG aux blocs de code.
   4. Voir le code dans une fenêtre agrandie.
   5. Fermer la fenêtre avec une croix visible.
   6. Copier intégralement le code.
   7. Préserver le système de génération existant.
   8. Ne pas entrer en conflit avec UPDATE.SCROLL.JS.
   9. Connexion automatique avec NOVABRIDGE.
  10. Isolation complète des erreurs.
============================================================ */

(function () {

  "use strict";

  try {

    /* ========================================================
       1. PROTECTION CONTRE LES DOUBLONS
    ======================================================== */

    if (window.NovaRender &&
        window.NovaRender.version === "1.0.0") {

      console.info("[NOVA RENDER] Déjà chargé.");
      return;

    }

    const NOVA = {

      version: "1.0.0",

      actif: true,

      blocs: 0,

      erreurs: [],

      observer: null,

      modal: null

    };


    /* ========================================================
       2. ENREGISTREMENT DES ERREURS
    ======================================================== */

    function erreur(module, e) {

      try {

        NOVA.erreurs.push({

          module: module,

          message: String(
            e && e.message ? e.message : e
          ),

          date: Date.now()

        });

        console.error(
          "[NOVA RENDER] " + module,
          e
        );

      } catch (_) {}

    }


    /* ========================================================
       3. STYLE DU MODULE
    ======================================================== */

    function installerStyles() {

      try {

        if (document.getElementById(
          "nova-render-styles"
        )) return;

        const style = document.createElement("style");

        style.id = "nova-render-styles";

        style.textContent = `

          /* RENDU RAPIDE */

          .nova-render-code,
          .nova-render-code pre,
          .nova-render-code code {

            animation: none !important;

            transition: none !important;

          }


          /* BARRE DES COMMANDES */

          .nova-code-toolbar {

            display: flex;

            align-items: center;

            justify-content: flex-end;

            gap: 7px;

            margin: 8px 0 5px;

            position: relative;

            z-index: 2;

          }


          /* BOUTONS SVG */

          .nova-code-action {

            width: 32px;

            height: 30px;

            min-width: 32px;

            border: 1px solid rgba(255,255,255,.10);

            border-radius: 8px;

            background: rgba(120,130,150,.10);

            color: inherit;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            padding: 0;

            cursor: pointer;

            -webkit-tap-highlight-color: transparent;

          }


          .nova-code-action svg {

            width: 17px;

            height: 17px;

            fill: none;

            stroke: currentColor;

            stroke-width: 1.8;

            stroke-linecap: round;

            stroke-linejoin: round;

          }


          .nova-code-action:active {

            transform: scale(.94);

          }


          /* FENÊTRE DU CODE */

          .nova-code-modal {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: none;

            flex-direction: column;

            background: #080B12;

            color: #fff;

            padding:

              env(safe-area-inset-top)

              12px

              env(safe-area-inset-bottom);

          }


          .nova-code-modal.active {

            display: flex;

          }


          .nova-code-modal-header {

            min-height: 55px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 12px;

            border-bottom: 1px solid #263044;

          }


          .nova-code-modal-title {

            font-size: 15px;

            font-weight: 600;

          }


          .nova-code-modal-close {

            width: 42px;

            height: 42px;

            border: none;

            border-radius: 12px;

            background: rgba(255,255,255,.10);

            color: white;

            font-size: 30px;

            line-height: 1;

            cursor: pointer;

          }


          .nova-code-modal-content {

            flex: 1;

            min-height: 0;

            overflow: auto;

            padding: 12px 0;

            -webkit-overflow-scrolling: touch;

          }


          .nova-code-modal-content pre {

            margin: 0;

            padding: 14px;

            background: #101725;

            border-radius: 12px;

            overflow: auto;

            white-space: pre;

            font-size: 13px;

            line-height: 1.65;

            tab-size: 2;

          }


          .nova-code-modal-content code {

            font-family: monospace;

          }


          .nova-code-copy-all {

            min-height: 43px;

            margin: 10px 0;

            border: none;

            border-radius: 10px;

            background: #2563EB;

            color: white;

            font-size: 14px;

            font-weight: 600;

            cursor: pointer;

          }


          .nova-code-copy-all:active {

            opacity: .8;

          }

        `;

        document.head.appendChild(style);

      } catch (e) {

        erreur("styles", e);

      }

    }


    /* ========================================================
       4. RÉCUPÉRATION DU CODE
    ======================================================== */

    function recupererCode(pre) {

      try {

        if (!pre) return "";

        const code = pre.querySelector("code");

        return code
          ? code.textContent || ""
          : pre.textContent || "";

      } catch (e) {

        erreur("recupererCode", e);

        return "";

      }

    }


    /* ========================================================
       5. ICÔNES SVG
    ======================================================== */

    const ICONES = {

      voir: `

        <svg viewBox="0 0 24 24">

          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>

          <circle cx="12" cy="12" r="3"/>

        </svg>

      `,

      copier: `

        <svg viewBox="0 0 24 24">

          <rect x="8" y="8" width="12" height="13" rx="2"/>

          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3"/>

        </svg>

      `,

      fermer: `

        <svg viewBox="0 0 24 24">

          <path d="M18 6 6 18M6 6l12 12"/>

        </svg>

      `

    };


    /* ========================================================
       6. COPIE DU CODE
    ======================================================== */

    async function copierTexte(texte, bouton) {

      try {

        if (!texte) return false;

        if (navigator.clipboard &&
            window.isSecureContext) {

          await navigator.clipboard.writeText(texte);

        } else {

          const zone = document.createElement("textarea");

          zone.value = texte;

          zone.style.position = "fixed";

          zone.style.left = "-9999px";

          document.body.appendChild(zone);

          zone.select();

          const resultat = document.execCommand("copy");

          zone.remove();

          if (!resultat) return false;

        }

        if (bouton) {

          const ancien = bouton.innerHTML;

          bouton.innerHTML = "✓";

          setTimeout(function () {

            bouton.innerHTML = ancien;

          }, 1200);

        }

        return true;

      } catch (e) {

        erreur("copier", e);

        return false;

      }

    }


    /* ========================================================
       7. FENÊTRE DE VISUALISATION
    ======================================================== */

    function creerModal() {

      try {

        if (NOVA.modal) return NOVA.modal;

        const modal = document.createElement("div");

        modal.className = "nova-code-modal";

        modal.innerHTML = `

          <div class="nova-code-modal-header">

            <div class="nova-code-modal-title">

              Code source

            </div>

            <button
              type="button"
              class="nova-code-modal-close"
              aria-label="Fermer"
            >

              ×

            </button>

          </div>

          <div class="nova-code-modal-content">

            <pre><code></code></pre>

          </div>

          <button
            type="button"
            class="nova-code-copy-all"
          >

            Copier tout le code

          </button>

        `;

        document.body.appendChild(modal);

        const fermer = modal.querySelector(
          ".nova-code-modal-close"
        );

        fermer.addEventListener("click", fermerModal);

        modal.addEventListener("click", function (e) {

          if (e.target === modal) {

            fermerModal();

          }

        });

        const copier = modal.querySelector(
          ".nova-code-copy-all"
        );

        copier.addEventListener("click", async function () {

          const code = modal.querySelector(
            ".nova-code-modal-content code"
          );

          const resultat = await copierTexte(
            code.textContent,
            copier
          );

          if (resultat) {

            copier.textContent = "Code copié !";

            setTimeout(function () {

              copier.textContent = "Copier tout le code";

            }, 1300);

          }

        });

        NOVA.modal = modal;

        return modal;

      } catch (e) {

        erreur("creerModal", e);

        return null;

      }

    }


    /* ========================================================
       8. OUVRIR LE CODE EN ENTIER
    ======================================================== */

    function ouvrirCode(pre) {

      try {

        const modal = creerModal();

        if (!modal) return;

        const code = modal.querySelector(
          ".nova-code-modal-content code"
        );

        code.textContent = recupererCode(pre);

        modal.classList.add("active");

        document.body.style.overflow = "hidden";

      } catch (e) {

        erreur("ouvrirCode", e);

      }

    }


    /* ========================================================
       9. FERMER LE CODE
    ======================================================== */

    function fermerModal() {

      try {

        if (!NOVA.modal) return;

        NOVA.modal.classList.remove("active");

        document.body.style.overflow = "";

      } catch (e) {

        erreur("fermerModal", e);

      }

    }


    document.addEventListener("keydown", function (e) {

      try {

        if (e.key === "Escape") {

          fermerModal();

        }

      } catch (_) {}

    });


    /* ========================================================
       10. CRÉATION DE LA BARRE SVG
    ======================================================== */

    function installerCommandes(pre) {

      try {

        if (!pre || pre.dataset.novaRender === "1") {

          return;

        }

        const parent = pre.parentElement;

        if (!parent) return;

        const barre = document.createElement("div");

        barre.className = "nova-code-toolbar";

        /* VOIR LE CODE */

        const voir = document.createElement("button");

        voir.type = "button";

        voir.className = "nova-code-action";

        voir.innerHTML = ICONES.voir;

        voir.title = "Voir le code en entier";

        voir.setAttribute(
          "aria-label",
          "Voir le code en entier"
        );

        voir.addEventListener("click", function () {

          ouvrirCode(pre);

        });


        /* COPIER TOUT */

        const copier = document.createElement("button");

        copier.type = "button";

        copier.className = "nova-code-action";

        copier.innerHTML = ICONES.copier;

        copier.title = "Copier tout";

        copier.setAttribute(
          "aria-label",
          "Copier tout le code"
        );

        copier.addEventListener("click", async function () {

          await copierTexte(
            recupererCode(pre),
            copier
          );

        });


        barre.appendChild(voir);

        barre.appendChild(copier);

        parent.insertBefore(barre, pre);

        pre.dataset.novaRender = "1";

        pre.classList.add("nova-render-code");

        NOVA.blocs++;

      } catch (e) {

        erreur("installerCommandes", e);

      }

    }


    /* ========================================================
       11. DÉTECTION DES BLOCS DE CODE
    ======================================================== */

    function detecterCode(racine) {

      try {

        if (!racine) return;

        if (racine.nodeType !== 1 &&
            racine.nodeType !== 9) {

          return;

        }

        if (racine.matches &&
            racine.matches("pre")) {

          installerCommandes(racine);

        }

        const blocs = racine.querySelectorAll
          ? racine.querySelectorAll("pre")
          : [];

        blocs.forEach(function (pre) {

          try {

            installerCommandes(pre);

          } catch (e) {

            erreur("bloc", e);

          }

        });

      } catch (e) {

        erreur("detecterCode", e);

      }

    }


    /* ========================================================
       12. SURVEILLANCE DU RENDU
    ======================================================== */

    function observerDOM() {

      try {

        if (NOVA.observer) return;

        if (!document.body) return;

        NOVA.observer = new MutationObserver(function (mutations) {

          try {

            mutations.forEach(function (mutation) {

              mutation.addedNodes.forEach(function (node) {

                try {

                  detecterCode(node);

                } catch (e) {

                  erreur("mutation", e);

                }

              });

            });

          } catch (e) {

            erreur("observer", e);

          }

        });

        NOVA.observer.observe(document.body, {

          childList: true,

          subtree: true

        });

        detecterCode(document.body);

      } catch (e) {

        erreur("observerDOM", e);

      }

    }


    /* ========================================================
       13. PERFORMANCE DU TEXTE
    ======================================================== */

    function optimiserAffichage() {

      try {

        /*
          Aucune animation artificielle.

          Aucun délai ajouté aux caractères.

          Aucun remplacement du moteur de streaming.

          Aucun changement des réponses reçues
          depuis Supabase.

          Le rythme de génération reste celui
          du moteur IA et du réseau.
        */

        document.documentElement.classList.add(
          "nova-render-active"
        );

      } catch (e) {

        erreur("optimiserAffichage", e);

      }

    }


    /* ========================================================
       14. ÉTAT DU MODULE
    ======================================================== */

    NOVA.status = function () {

      return {

        version: NOVA.version,

        actif: NOVA.actif,

        blocs: NOVA.blocs,

        erreurs: NOVA.erreurs.length,

        observerActif: !!NOVA.observer

      };

    };


    /* ========================================================
       15. INITIALISATION
    ======================================================== */

    function initialiser() {

      try {

        installerStyles();

        optimiserAffichage();

        observerDOM();

        console.info(
          "[NOVA RENDER] Module initialisé.",
          NOVA.version
        );

      } catch (e) {

        erreur("initialisation", e);

      }

    }


    /* ========================================================
       16. CONNEXION NOVABRIDGE
    ======================================================== */

    window.NovaRender = NOVA;

    try {

      if (window.NovaBridge &&
          typeof window.NovaBridge.register === "function") {

        window.NovaBridge.register(
          "render",
          NOVA
        );

      }

    } catch (e) {

      erreur("bridge", e);

    }


    /* ========================================================
       17. DÉMARRAGE
    ======================================================== */

    if (document.readyState === "loading") {

      document.addEventListener(
        "DOMContentLoaded",
        initialiser,
        { once: true }
      );

    } else {

      initialiser();

    }


    console.info(
      "[NOVA RENDER] Chargement terminé."
    );


  } catch (e) {

    console.error(
      "[NOVA RENDER] Erreur générale :",
      e
    );

  }

})();
