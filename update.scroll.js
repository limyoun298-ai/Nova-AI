/* ============================================================
   NOVA AI - update.scroll.js
   VERSION : 2.0
   MODULE : SCROLL + FLECHE + 3 POINTS + CODE PYTHON

   OBJECTIFS :
   1. Fleche au milieu de la discussion.
   2. Trois points places a cote de la fleche.
   3. Affichage uniquement pendant l'ecriture de NOVA.
   4. Disparition lorsque NOVA termine.
   5. Disparition lorsque l'utilisateur retourne en bas.
   6. Conservation de la position de lecture.
   7. Detection des blocs Python.
   8. Boutons SVG blancs : VOIR / COPIER / FERMER.
   9. Grande zone de code consultable.
   10. Protection generale try/catch.

   REGLE D'OR :
   NE PAS MODIFIER index.html.
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
        delaiFinEcriture: 1200,
        margeBas: 100,
        largeurBouton: 46,
        hauteurBouton: 46,
        maxHauteurCode: 180
      };

      var utilisateurEnHaut = false;
      var novaEcrit = false;

      var timerFinEcriture = null;
      var timerRecherche = null;

      var dernierScrollTop = 0;

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
         VERIFICATION POSITION BAS
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
         INSTALLATION CSS
      ====================================================== */

      function installerStyle() {

        try {

          if (styleInstalle) return;

          if (document.getElementById("nova-scroll-v2-style")) {
            styleInstalle = true;
            return;
          }

          var style = document.createElement("style");

          style.id = "nova-scroll-v2-style";

          style.textContent = `

            /* GROUPE FLECHE + POINTS */

            #nova-scroll-groupe {

              display: none;

              position: absolute;

              left: 50%;

              bottom: 16px;

              transform: translateX(-50%);

              align-items: center;

              justify-content: center;

              gap: 12px;

              z-index: 999;

              pointer-events: auto;

            }

            /* FLECHE */

            #nova-fleche-bas {

              display: flex;

              align-items: center;

              justify-content: center;

              width: 46px;

              height: 46px;

              border-radius: 50%;

              border: 1px solid rgba(255,255,255,.15);

              background: #2563EB;

              color: white;

              font-size: 25px;

              cursor: pointer;

              box-shadow: 0 4px 15px rgba(0,0,0,.35);

              transition: transform .2s, opacity .2s;

            }

            #nova-fleche-bas:active {

              transform: scale(.90);

            }

            /* TROIS POINTS */

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

              display: block;

              width: 7px;

              height: 7px;

              border-radius: 50%;

              background: white;

              animation: novaPointV2 1s infinite;

            }

            #nova-3-points span:nth-child(2) {

              animation-delay: .2s;

            }

            #nova-3-points span:nth-child(3) {

              animation-delay: .4s;

            }

            @keyframes novaPointV2 {

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

              gap: 9px;

              padding: 10px;

              background: #111b2b;

              border-bottom: 1px solid #26354b;

            }

            .nova-python-btn {

              display: inline-flex;

              align-items: center;

              justify-content: center;

              gap: 6px;

              min-width: 38px;

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

              max-height: ${CONFIG.maxHauteurCode}px;

              overflow: hidden;

              position: relative;

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

              padding: 7px 12px;

              color: #94a3b8;

              font-size: 11px;

              border-top: 1px solid #26354b;

            }

            @media(max-width:480px) {

              #nova-scroll-groupe {

                bottom: 12px;

              }

              .nova-python-btn {

                padding: 7px 8px;

                font-size: 11px;

              }

            }

          `;

          document.head.appendChild(style);

          styleInstalle = true;

        } catch (e) {}

      }

      /* ======================================================
         SVG
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
         CREATION GROUPE SCROLL
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

          groupeScroll = document.createElement("div");

          groupeScroll.id = "nova-scroll-groupe";

          fleche = document.createElement("button");

          fleche.id = "nova-fleche-bas";

          fleche.type = "button";

          fleche.setAttribute(
            "aria-label",
            "Retourner en bas de la discussion"
          );

          fleche.innerHTML = "↓";

          points = document.createElement("div");

          points.id = "nova-3-points";

          points.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
          `;

          groupeScroll.appendChild(fleche);

          groupeScroll.appendChild(points);

          fleche.addEventListener("click", function () {

            try {

              var z = zoneChat();

              if (!z) return;

              z.scrollTo({

                top: z.scrollHeight,

                behavior: "smooth"

              });

              cacherGroupe();

              utilisateurEnHaut = false;

              novaEcrit = false;

            } catch (e) {}

          });

          var parent = zone.parentElement;

          if (!parent) return null;

          try {

            var cs = window.getComputedStyle(parent);

            if (cs.position === "static") {

              parent.style.position = "relative";

            }

          } catch (e) {}

          parent.appendChild(groupeScroll);

          return groupeScroll;

        } catch (e) {

          return null;

        }

      }

      /* ======================================================
         AFFICHAGE GROUPE
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
         FIN ECRITURE
      ====================================================== */

      function terminerEcriture() {

        try {

          novaEcrit = false;

          if (timerFinEcriture) {

            clearTimeout(timerFinEcriture);

            timerFinEcriture = null;

          }

          cacherGroupe();

        } catch (e) {}

      }

      function signalerEcriture() {

        try {

          novaEcrit = true;

          if (timerFinEcriture) {

            clearTimeout(timerFinEcriture);

          }

          var z = zoneChat();

          if (!z) return;

          if (!estEnBas(z)) {

            utilisateurEnHaut = true;

            montrerGroupe();

          }

          timerFinEcriture = setTimeout(function () {

            terminerEcriture();

          }, CONFIG.delaiFinEcriture);

        } catch (e) {}

      }

      /* ======================================================
         SURVEILLANCE DU SCROLL
      ====================================================== */

      function majAffichage() {

        try {

          var z = zoneChat();

          if (!z) return;

          var enBas = estEnBas(z);

          utilisateurEnHaut = !enBas;

          if (enBas) {

            dernierScrollTop = z.scrollTop;

            cacherGroupe();

            if (novaEcrit) {

              // L'utilisateur est revenu en bas.
              // La fleche et les points disparaissent.

            }

          } else {

            dernierScrollTop = z.scrollTop;

            if (novaEcrit) {

              montrerGroupe();

            } else {

              cacherGroupe();

            }

          }

        } catch (e) {}

      }

      /* ======================================================
         DETECTION DES BLOCS PYTHON
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

          if (
            classes.includes("language-python") ||
            classes.includes("lang-python") ||
            classes.includes("python") ||
            langage === "python"
          ) {

            return true;

          }

          return false;

        } catch (e) {

          return false;

        }

      }

      /* ======================================================
         BOUTON PYTHON
      ====================================================== */

      function creerBoutonPython(texte, icone, action) {

        try {

          var btn = document.createElement("button");

          btn.type = "button";

          btn.className = "nova-python-btn";

          btn.innerHTML = icone + "<span>" + texte + "</span>";

          btn.addEventListener("click", function (event) {

            try {

              event.preventDefault();

              event.stopPropagation();

              action();

            } catch (e) {}

          });

          return btn;

        } catch (e) {

          return null;

        }

      }

      /* ======================================================
         INITIALISATION BLOC PYTHON
      ====================================================== */

      function traiterBlocPython(pre) {

        try {

          if (!pre || pre.dataset.novaPythonReady === "1") {

            return;

          }

          if (!estPython(pre)) return;

          pre.dataset.novaPythonReady = "1";

          var parentOriginal = pre.parentElement;

          if (!parentOriginal) return;

          var wrapper = document.createElement("div");

          wrapper.className = "nova-python-wrapper";

          var toolbar = document.createElement("div");

          toolbar.className = "nova-python-toolbar";

          var content = document.createElement("div");

          content.className = "nova-python-content";

          var footer = document.createElement("div");

          footer.className = "nova-python-footer";

          footer.textContent = "Code Python";

          var code = pre.querySelector("code");

          var texteCode = code
            ? code.textContent
            : pre.textContent;

          /* VOIR */

          var boutonVoir = creerBoutonPython(

            "Voir",

            SVG.voir,

            function () {

              content.classList.add("nova-python-ouvert");

              boutonVoir.style.display = "none";

              boutonFermer.style.display = "inline-flex";

            }

          );

          /* COPIER */

          var boutonCopier = creerBoutonPython(

            "Copier",

            SVG.copier,

            function () {

              try {

                var texte = code
                  ? code.textContent
                  : pre.textContent;

                if (navigator.clipboard && navigator.clipboard.writeText) {

                  navigator.clipboard.writeText(texte).then(function () {

                    boutonCopier.querySelector("span").textContent = "Copié";

                    setTimeout(function () {

                      boutonCopier.querySelector("span").textContent = "Copier";

                    }, 1500);

                  }).catch(function () {

                    copierAncienMode(texte);

                  });

                } else {

                  copierAncienMode(texte);

                }

              } catch (e) {}

            }

          );

          /* FERMER */

          var boutonFermer = creerBoutonPython(

            "Fermer",

            SVG.fermer,

            function () {

              content.classList.remove("nova-python-ouvert");

              boutonVoir.style.display = "inline-flex";

              boutonFermer.style.display = "none";

            }

          );

          function copierAncienMode(texte) {

            try {

              var textarea = document.createElement("textarea");

              textarea.value = texte;

              textarea.style.position = "fixed";

              textarea.style.left = "-9999px";

              document.body.appendChild(textarea);

              textarea.select();

              document.execCommand("copy");

              textarea.remove();

              boutonCopier.querySelector("span").textContent = "Copié";

              setTimeout(function () {

                boutonCopier.querySelector("span").textContent = "Copier";

              }, 1500);

            } catch (e) {}

          }

          if (!boutonVoir || !boutonCopier || !boutonFermer) {

            pre.dataset.novaPythonReady = "0";

            return;

          }

          boutonFermer.style.display = "none";

          toolbar.appendChild(boutonVoir);

          toolbar.appendChild(boutonCopier);

          toolbar.appendChild(boutonFermer);

          content.appendChild(pre);

          wrapper.appendChild(toolbar);

          wrapper.appendChild(content);

          wrapper.appendChild(footer);

          parentOriginal.insertBefore(wrapper, pre);

          // Le bloc est maintenant dans le wrapper.
          // On ne supprime ni ne reconstruit son contenu.

        } catch (e) {}

      }

      /* ======================================================
         RECHERCHE DES BLOCS PYTHON
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
         OBSERVATEUR DE LA DISCUSSION
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

                if (
                  mutations[i].type === "childList" ||
                  mutations[i].type === "characterData"
                ) {

                  changement = true;

                  break;

                }

              }

              if (!changement) return;

              rechercherPython(z);

              if (utilisateurEnHaut) {

                // On ne force jamais le scroll.
                // On conserve la position de lecture.

                if (dernierScrollTop >= 0) {

                  if (Math.abs(z.scrollTop - dernierScrollTop) < 5) {

                    // Position stable.

                  }

                }

              }

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
         EVENEMENTS DE SCROLL
      ====================================================== */

      function installerEvenements(zone) {

        try {

          if (zone.dataset.novaScrollV2 === "1") return;

          zone.dataset.novaScrollV2 = "1";

          zone.addEventListener("scroll", function () {

            try {

              var etaitEnHaut = utilisateurEnHaut;

              majAffichage();

              if (utilisateurEnHaut) {

                dernierScrollTop = zone.scrollTop;

              }

              if (!utilisateurEnHaut && etaitEnHaut) {

                terminerEcriture();

              }

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

          if (!zone) {

            setTimeout(demarrer, 500);

            return;

          }

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
         SURVEILLANCE REMPLACEMENT ZONE CHAT
      ====================================================== */

      function surveillerZone() {

        try {

          if (timerRecherche) {

            clearInterval(timerRecherche);

          }

          timerRecherche = setInterval(function () {

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
         LANCEMENT
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

      // NOVA AI continue de fonctionner
      // meme si ce module rencontre une erreur.

    }

  })();

}
