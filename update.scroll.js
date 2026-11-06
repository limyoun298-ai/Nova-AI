/* ============================================================
   NOVA AI - UPDATE.SCROLL.JS
   VERSION 2.1
   MODULE : SCROLL + FLECHE + POINTS + PYTHON

   CORRECTION PRINCIPALE :
   - DEFILEMENT LIBRE.
   - AUCUN SCROLLTOP FORCE.
   - AUCUN BLOCAGE TACTILE.
   - AUCUNE INTERCEPTION DU GESTE UTILISATEUR.

   REGLE D'OR :
   NE PAS MODIFIER INDEX.HTML.
   NE PAS MODIFIER LES AUTRES FICHIERS.
   ============================================================ */

if (!window.NOVA_SCROLL_INITIALISE) {

  window.NOVA_SCROLL_INITIALISE = true;

  (function () {

    "use strict";

    try {

      /* ======================================================
         CONFIGURATION
      ====================================================== */

      var CONFIG = {
        margeBas: 100,
        delaiFinEcriture: 1400,
        hauteurApercuPython: 180
      };

      var utilisateurEnHaut = false;
      var novaEcrit = false;

      var timerFin = null;
      var timerSurveillance = null;

      var zoneObservee = null;
      var observer = null;

      var groupeScroll = null;
      var fleche = null;
      var points = null;

      var styleInstalle = false;

      /* ======================================================
         RECHERCHE DE LA DISCUSSION
      ====================================================== */

      function zoneChat() {

        try {

          return (
            document.getElementById("chat-box") ||
            document.getElementById("messages") ||
            document.getElementById("chat")
          );

        } catch (e) {

          return null;

        }

      }

      /* ======================================================
         POSITION DE L'UTILISATEUR
      ====================================================== */

      function estEnBas(zone) {

        try {

          return (
            zone.scrollHeight -
            zone.scrollTop -
            zone.clientHeight
          ) < CONFIG.margeBas;

        } catch (e) {

          return true;

        }

      }

      /* ======================================================
         CSS
      ====================================================== */

      function installerStyle() {

        try {

          if (styleInstalle) return;

          if (document.getElementById("nova-scroll-v21-style")) {
            styleInstalle = true;
            return;
          }

          var style = document.createElement("style");

          style.id = "nova-scroll-v21-style";

          style.textContent = `

            #nova-scroll-groupe {

              display: none;

              position: absolute;

              left: 50%;

              bottom: 16px;

              transform: translateX(-50%);

              align-items: center;

              justify-content: center;

              gap: 10px;

              z-index: 999;

              pointer-events: auto;

            }

            #nova-fleche-bas {

              width: 46px;

              height: 46px;

              display: flex;

              align-items: center;

              justify-content: center;

              border-radius: 50%;

              border: 1px solid rgba(255,255,255,.15);

              background: #2563EB;

              color: white;

              font-size: 25px;

              cursor: pointer;

              box-shadow: 0 4px 14px rgba(0,0,0,.35);

              -webkit-tap-highlight-color: transparent;

            }

            #nova-fleche-bas:active {

              transform: scale(.92);

            }

            #nova-3-points {

              display: flex;

              align-items: center;

              justify-content: center;

              gap: 4px;

              padding: 12px 15px;

              border-radius: 25px;

              background: rgba(15,23,42,.95);

              border: 1px solid rgba(255,255,255,.12);

              pointer-events: none;

            }

            #nova-3-points span {

              width: 7px;

              height: 7px;

              display: block;

              border-radius: 50%;

              background: white;

              animation: novaPointV21 1s infinite;

            }

            #nova-3-points span:nth-child(2) {

              animation-delay: .2s;

            }

            #nova-3-points span:nth-child(3) {

              animation-delay: .4s;

            }

            @keyframes novaPointV21 {

              0%,100% {

                opacity: .3;

                transform: translateY(0);

              }

              50% {

                opacity: 1;

                transform: translateY(-4px);

              }

            }

            /* PYTHON */

            .nova-python-wrapper {

              width: 100%;

              max-width: 100%;

              margin: 14px 0;

              overflow: hidden;

              border-radius: 13px;

              background: #0b1220;

              border: 1px solid #26354b;

              box-sizing: border-box;

            }

            .nova-python-toolbar {

              display: flex;

              align-items: center;

              justify-content: flex-end;

              flex-wrap: wrap;

              gap: 8px;

              padding: 10px;

              background: #111b2b;

              border-bottom: 1px solid #26354b;

            }

            .nova-python-btn {

              display: inline-flex;

              align-items: center;

              justify-content: center;

              gap: 6px;

              min-height: 36px;

              padding: 7px 10px;

              border-radius: 8px;

              border: 1px solid rgba(255,255,255,.13);

              background: #1c293c;

              color: white;

              font-size: 12px;

              cursor: pointer;

            }

            .nova-python-btn svg {

              width: 17px;

              height: 17px;

              stroke: white;

              fill: none;

              stroke-width: 2;

              stroke-linecap: round;

              stroke-linejoin: round;

            }

            .nova-python-content {

              max-height: ${CONFIG.hauteurApercuPython}px;

              overflow: hidden;

              transition: max-height .3s ease;

            }

            .nova-python-content.nova-python-ouvert {

              max-height: 20000px;

              overflow-x: auto;

              overflow-y: visible;

            }

            .nova-python-content pre {

              margin: 0 !important;

              padding: 16px !important;

              overflow-x: auto;

              background: transparent !important;

              color: #e5e7eb;

              white-space: pre;

              font-size: 13px;

              line-height: 1.65;

              box-sizing: border-box;

            }

            .nova-python-content code {

              font-family: Consolas, Monaco, monospace;

            }

            .nova-python-footer {

              padding: 8px 12px;

              color: #94a3b8;

              font-size: 11px;

              border-top: 1px solid #26354b;

            }

          `;

          document.head.appendChild(style);

          styleInstalle = true;

        } catch (e) {}

      }

      /* ======================================================
         SVG BLANCS
      ====================================================== */

      var SVG = {

        voir: `
          <svg viewBox="0 0 24 24">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        `,

        copier: `
          <svg viewBox="0 0 24 24">
            <rect x="8" y="8" width="13" height="13" rx="2"/>
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
          </svg>
        `,

        fermer: `
          <svg viewBox="0 0 24 24">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        `

      };

      /* ======================================================
         CREATION FLECHE ET POINTS
      ====================================================== */

      function creerGroupe(zone) {

        try {

          if (
            groupeScroll &&
            document.body.contains(groupeScroll) &&
            groupeScroll.parentElement === zone.parentElement
          ) {

            return groupeScroll;

          }

          if (groupeScroll) {

            groupeScroll.remove();

          }

          var parent = zone.parentElement;

          if (!parent) return null;

          var cs = window.getComputedStyle(parent);

          if (cs.position === "static") {

            parent.style.position = "relative";

          }

          groupeScroll = document.createElement("div");

          groupeScroll.id = "nova-scroll-groupe";

          fleche = document.createElement("button");

          fleche.id = "nova-fleche-bas";

          fleche.type = "button";

          fleche.setAttribute(
            "aria-label",
            "Retourner en bas de la discussion"
          );

          fleche.textContent = "↓";

          points = document.createElement("div");

          points.id = "nova-3-points";

          points.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
          `;

          groupeScroll.appendChild(fleche);

          groupeScroll.appendChild(points);

          fleche.addEventListener("click", function (event) {

            try {

              event.preventDefault();

              event.stopPropagation();

              var z = zoneChat();

              if (!z) return;

              z.scrollTo({

                top: z.scrollHeight,

                behavior: "smooth"

              });

              cacherGroupe();

            } catch (e) {}

          });

          parent.appendChild(groupeScroll);

          return groupeScroll;

        } catch (e) {

          return null;

        }

      }

      /* ======================================================
         AFFICHAGE
      ====================================================== */

      function montrerGroupe() {

        try {

          var z = zoneChat();

          if (!z) return;

          creerGroupe(z);

          if (groupeScroll) {

            groupeScroll.style.display = "flex";

          }

        } catch (e) {}

      }

      function cacherGroupe() {

        try {

          if (groupeScroll) {

            groupeScroll.style.display = "none";

          }

        } catch (e) {}

      }

      /* ======================================================
         GESTION DE L'ECRITURE
      ====================================================== */

      function terminerEcriture() {

        try {

          novaEcrit = false;

          if (timerFin) {

            clearTimeout(timerFin);

            timerFin = null;

          }

          cacherGroupe();

        } catch (e) {}

      }

      function signalerEcriture() {

        try {

          novaEcrit = true;

          if (timerFin) {

            clearTimeout(timerFin);

          }

          timerFin = setTimeout(function () {

            terminerEcriture();

          }, CONFIG.delaiFinEcriture);

          var z = zoneChat();

          if (!z) return;

          if (!estEnBas(z)) {

            montrerGroupe();

          } else {

            cacherGroupe();

          }

        } catch (e) {}

      }

      /* ======================================================
         MISE A JOUR SCROLL

         IMPORTANT :
         AUCUNE MODIFICATION DE scrollTop ICI.
         AUCUN BLOCAGE DU DEFILEMENT.
      ====================================================== */

      function majAffichage() {

        try {

          var z = zoneChat();

          if (!z) return;

          var enBas = estEnBas(z);

          utilisateurEnHaut = !enBas;

          if (enBas) {

            cacherGroupe();

          } else if (novaEcrit) {

            montrerGroupe();

          } else {

            cacherGroupe();

          }

        } catch (e) {}

      }

      /* ======================================================
         DETECTION PYTHON
      ====================================================== */

      function estPython(pre) {

        try {

          if (!pre) return false;

          var code = pre.querySelector("code");

          var classes = (
            (pre.className || "") + " " +
            (code ? code.className : "")
          ).toLowerCase();

          var langage = (
            pre.getAttribute("data-language") ||
            (code && code.getAttribute("data-language")) ||
            ""
          ).toLowerCase();

          return (
            classes.indexOf("language-python") !== -1 ||
            classes.indexOf("lang-python") !== -1 ||
            langage === "python"
          );

        } catch (e) {

          return false;

        }

      }

      /* ======================================================
         BOUTONS PYTHON
      ====================================================== */

      function creerBoutonPython(nom, icone, action) {

        try {

          var btn = document.createElement("button");

          btn.type = "button";

          btn.className = "nova-python-btn";

          btn.innerHTML = icone + "<span>" + nom + "</span>";

          btn.addEventListener("click", function (event) {

            try {

              event.preventDefault();

              event.stopPropagation();

              action(btn);

            } catch (e) {}

          });

          return btn;

        } catch (e) {

          return null;

        }

      }

      /* ======================================================
         COPIE PYTHON
      ====================================================== */

      function copierTexte(texte, bouton) {

        try {

          function confirmation() {

            try {

              var label = bouton.querySelector("span");

              if (!label) return;

              label.textContent = "Copié";

              setTimeout(function () {

                label.textContent = "Copier";

              }, 1500);

            } catch (e) {}

          }

          if (
            navigator.clipboard &&
            navigator.clipboard.writeText
          ) {

            navigator.clipboard.writeText(texte).then(

              confirmation,

              function () {

                copierAncienMode();

              }

            );

          } else {

            copierAncienMode();

          }

          function copierAncienMode() {

            try {

              var textarea = document.createElement("textarea");

              textarea.value = texte;

              textarea.style.position = "fixed";

              textarea.style.left = "-9999px";

              textarea.style.top = "0";

              document.body.appendChild(textarea);

              textarea.select();

              var resultat = document.execCommand("copy");

              textarea.remove();

              if (resultat) {

                confirmation();

              }

            } catch (e) {}

          }

        } catch (e) {}

      }

      /* ======================================================
         TRAITEMENT PYTHON
      ====================================================== */

      function traiterBlocPython(pre) {

        try {

          if (!pre) return;

          if (pre.dataset.novaPythonReady === "1") return;

          if (!estPython(pre)) return;

          var parent = pre.parentElement;

          if (!parent) return;

          var wrapper = document.createElement("div");

          wrapper.className = "nova-python-wrapper";

          var toolbar = document.createElement("div");

          toolbar.className = "nova-python-toolbar";

          var content = document.createElement("div");

          content.className = "nova-python-content";

          var footer = document.createElement("div");

          footer.className = "nova-python-footer";

          footer.textContent = "Code Python";

          var boutonVoir;
          var boutonCopier;
          var boutonFermer;

          boutonVoir = creerBoutonPython(

            "Voir",

            SVG.voir,

            function () {

              content.classList.add("nova-python-ouvert");

              boutonVoir.style.display = "none";

              boutonFermer.style.display = "inline-flex";

            }

          );

          boutonCopier = creerBoutonPython(

            "Copier",

            SVG.copier,

            function (btn) {

              var code = pre.querySelector("code");

              var texte = code
                ? code.textContent
                : pre.textContent;

              copierTexte(texte, btn);

            }

          );

          boutonFermer = creerBoutonPython(

            "Fermer",

            SVG.fermer,

            function () {

              content.classList.remove("nova-python-ouvert");

              boutonVoir.style.display = "inline-flex";

              boutonFermer.style.display = "none";

            }

          );

          if (!boutonVoir || !boutonCopier || !boutonFermer) {

            return;

          }

          boutonFermer.style.display = "none";

          toolbar.appendChild(boutonVoir);

          toolbar.appendChild(boutonCopier);

          toolbar.appendChild(boutonFermer);

          /*

            Marquer avant le déplacement pour éviter
            les traitements répétés par MutationObserver.

          */

          pre.dataset.novaPythonReady = "1";

          parent.insertBefore(wrapper, pre);

          content.appendChild(pre);

          wrapper.appendChild(toolbar);

          wrapper.appendChild(content);

          wrapper.appendChild(footer);

        } catch (e) {}

      }

      /* ======================================================
         RECHERCHE PYTHON
      ====================================================== */

      function rechercherPython(zone) {

        try {

          if (!zone) return;

          var blocs = zone.querySelectorAll("pre");

          for (var i = 0; i < blocs.length; i++) {

            traiterBlocPython(blocs[i]);

          }

        } catch (e) {}

      }

      /* ======================================================
         OBSERVATEUR
      ====================================================== */

      function installerObservateur(zone) {

        try {

          if (observer) {

            observer.disconnect();

            observer = null;

          }

          zoneObservee = zone;

          observer = new MutationObserver(function (mutations) {

            try {

              var z = zoneChat();

              if (!z) return;

              var changement = false;

              for (var i = 0; i < mutations.length; i++) {

                var mutation = mutations[i];

                if (
                  mutation.type === "characterData" ||
                  mutation.type === "childList"
                ) {

                  changement = true;

                  break;

                }

              }

              if (!changement) return;

              rechercherPython(z);

              signalerEcriture();

              majAffichage();

            } catch (e) {}

          });

          observer.observe(zone, {

            childList: true,

            subtree: true,

            characterData: true

          });

        } catch (e) {}

      }

      /* ======================================================
         EVENEMENTS SCROLL

         PASSIVE = TRUE
         LE NAVIGATEUR GARDE LE CONTROLE DU GESTE TACTILE.
      ====================================================== */

      function installerEvenements(zone) {

        try {

          if (zone.dataset.novaScrollV21 === "1") return;

          zone.dataset.novaScrollV21 = "1";

          zone.addEventListener("scroll", function () {

            try {

              majAffichage();

            } catch (e) {}

          }, {

            passive: true

          });

        } catch (e) {}

      }

      /* ======================================================
         DEMARRAGE
      ====================================================== */

      function demarrer() {

        try {

          installerStyle();

          var zone = zoneChat();

          if (!zone) return;

          if (zoneObservee !== zone) {

            installerEvenements(zone);

            installerObservateur(zone);

          }

          creerGroupe(zone);

          rechercherPython(zone);

          majAffichage();

        } catch (e) {}

      }

      /* ======================================================
         SURVEILLANCE DU REMPLACEMENT DE DISCUSSION
      ====================================================== */

      function surveillerZone() {

        try {

          if (timerSurveillance) {

            clearInterval(timerSurveillance);

          }

          timerSurveillance = setInterval(function () {

            try {

              var nouvelleZone = zoneChat();

              if (!nouvelleZone) return;

              if (nouvelleZone !== zoneObservee) {

                demarrer();

              }

            } catch (e) {}

          }, 1500);

        } catch (e) {}

      }

      /* ======================================================
         LANCEMENT FINAL
      ====================================================== */

      if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", function () {

          demarrer();

          surveillerZone();

        });

      } else {

        demarrer();

        surveillerZone();

      }

    } catch (e) {

      // Le module ne doit pas empêcher
      // le fonctionnement principal de NOVA AI.

    }

  })();

      }
