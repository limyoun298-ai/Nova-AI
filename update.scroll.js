/* ============================================================
   NOVA AI - update.scroll.js - VERSION 1.0 + PYTHON
   FLECHE BAS + 3 PETITS POINTS + AFFICHAGE CODE PYTHON

   BASE : VERSION 1.0 ORIGINALE
   AJOUT : PRESENTATION DES BLOCS PYTHON

   REGLE D'OR :
   NE PAS TOUCHER A INDEX.HTML NI AUX AUTRES FICHIERS.

   SI CE MODULE PLANTE, NOVA CONTINUE DE FONCTIONNER.
   ============================================================ */


/* ============================================================
   PARTIE 1 - SCROLL ORIGINAL V1.0
   ============================================================ */

if (window.NOVA_SCROLL_INITIALISE) {

} else {

  window.NOVA_SCROLL_INITIALISE = true;

  (function () {

    "use strict";

    try {

      var utilisateurEnHaut = false;
      var novaEcrit = false;
      var timerPoints = null;
      var dernierScrollTop = 0;

      function zoneChat() {

        return (
          document.getElementById("chat-box") ||
          document.getElementById("messages") ||
          document.getElementById("chat")
        );

      }

      function estEnBas(zone) {

        try {

          return (
            zone.scrollHeight -
            zone.scrollTop -
            zone.clientHeight
          ) < 100;

        } catch (e) {

          return true;

        }

      }

      /* ---------- FLECHE ---------- */

      var fleche = null;

      function creerFleche(zone) {

        try {

          if (
            fleche &&
            document.body.contains(fleche)
          ) {

            return fleche;

          }

          fleche = document.createElement("button");

          fleche.id = "nova-fleche-bas";

          fleche.textContent = "↓";

          fleche.setAttribute(
            "aria-label",
            "Aller en bas"
          );

          fleche.style.cssText =
            "display:none;" +
            "position:absolute;" +
            "right:16px;" +
            "bottom:16px;" +
            "width:44px;" +
            "height:44px;" +
            "border-radius:50%;" +
            "border:none;" +
            "background:#7c6cff;" +
            "color:#fff;" +
            "font-size:22px;" +
            "line-height:1;" +
            "cursor:pointer;" +
            "z-index:50;" +
            "box-shadow:0 4px 14px rgba(0,0,0,0.35);";

          fleche.addEventListener("click", function () {

            try {

              var z = zoneChat();

              if (!z) return;

              z.scrollTo({

                top: z.scrollHeight,

                behavior: "smooth"

              });

              cacherFleche();

              cacherPoints();

            } catch (e) {}

          });

          // FLECHE UNIQUEMENT DANS LA DISCUSSION

          var parent = zone.parentElement || document.body;

          try {

            var cs = window.getComputedStyle(parent);

            if (cs.position === "static") {

              parent.style.position = "relative";

            }

          } catch (e) {}

          parent.appendChild(fleche);

          return fleche;

        } catch (e) {

          return null;

        }

      }

      function montrerFleche() {

        try {

          var z = zoneChat();

          if (!z) return;

          var f = creerFleche(z);

          if (f) {

            f.style.display = "block";

          }

        } catch (e) {}

      }

      function cacherFleche() {

        try {

          if (fleche) {

            fleche.style.display = "none";

          }

        } catch (e) {}

      }


      /* ---------- 3 PETITS POINTS ---------- */

      var points = null;

      function creerPoints(zone) {

        try {

          if (
            points &&
            document.body.contains(points)
          ) {

            return points;

          }

          points = document.createElement("div");

          points.id = "nova-3-points";

          points.innerHTML =

            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite;"></span>' +

            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.2s;"></span>' +

            '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.4s;"></span>';

          points.style.cssText =
            "display:none;" +
            "position:absolute;" +
            "left:50%;" +
            "transform:translateX(-50%);" +
            "bottom:16px;" +
            "padding:8px 14px;" +
            "border-radius:20px;" +
            "background:rgba(0,0,0,0.55);" +
            "color:#fff;" +
            "font-size:12px;" +
            "z-index:49;" +
            "pointer-events:none;";

          var style = document.createElement("style");

          style.textContent =

            "@keyframes novaPoint{" +

            "0%,100%{" +
            "opacity:0.3;" +
            "transform:translateY(0)" +
            "}" +

            "50%{" +
            "opacity:1;" +
            "transform:translateY(-3px)" +
            "}" +

            "}";

          document.head.appendChild(style);

          var parent = zone.parentElement || document.body;

          parent.appendChild(points);

          return points;

        } catch (e) {

          return null;

        }

      }

      function montrerPoints() {

        try {

          var z = zoneChat();

          if (!z) return;

          var p = creerPoints(z);

          if (p) {

            p.style.display = "block";

          }

        } catch (e) {}

      }

      function cacherPoints() {

        try {

          if (points) {

            points.style.display = "none";

          }

        } catch (e) {}

      }


      /* ---------- AFFICHAGE ---------- */

      function majAffichage() {

        try {

          var z = zoneChat();

          if (!z) return;

          var enBas = estEnBas(z);

          utilisateurEnHaut = !enBas;

          if (enBas) {

            cacherFleche();

            cacherPoints();

          } else {

            if (novaEcrit) {

              montrerFleche();

              montrerPoints();

            }

          }

        } catch (e) {}

      }


      /* ---------- SURVEILLANCE ---------- */

      function demarrer() {

        try {

          var z = zoneChat();

          if (!z) {

            setTimeout(demarrer, 500);

            return;

          }

          creerFleche(z);

          creerPoints(z);

          z.addEventListener("scroll", function () {

            try {

              var avant = utilisateurEnHaut;

              majAffichage();

              if (utilisateurEnHaut) {

                dernierScrollTop = z.scrollTop;

              }

              if (!utilisateurEnHaut && avant) {

                novaEcrit = false;

              }

            } catch (e) {}

          }, {

            passive: true

          });


          var obs = new MutationObserver(function () {

            try {

              var zone = zoneChat();

              if (!zone) return;

              if (utilisateurEnHaut) {

                if (
                  Math.abs(
                    zone.scrollTop - dernierScrollTop
                  ) > 5 &&
                  !estEnBas(zone)
                ) {

                  // POSITION CONSERVEE PAR LE SYSTEME EXISTANT

                }

                novaEcrit = true;

                montrerFleche();

                montrerPoints();

                zone.scrollTop = dernierScrollTop;

                if (timerPoints) {

                  clearTimeout(timerPoints);

                }

                timerPoints = setTimeout(function () {

                  cacherPoints();

                }, 4000);

              } else {

                novaEcrit = false;

                cacherFleche();

                cacherPoints();

              }

            } catch (e) {}

          });

          obs.observe(z, {

            childList: true,

            subtree: true,

            characterData: true

          });

        } catch (e) {}

      }


      if (document.readyState === "loading") {

        document.addEventListener(
          "DOMContentLoaded",
          demarrer
        );

      } else {

        demarrer();

      }

    } catch (e) {}

  })();

}


/* ============================================================
   PARTIE 2 - AFFICHAGE PYTHON
   MODULE INDEPENDANT
   NE MODIFIE PAS LE SYSTEME SCROLL ORIGINAL
   ============================================================ */

(function () {

  "use strict";

  try {

    if (window.NOVA_PYTHON_DISPLAY_INITIALISE) return;

    window.NOVA_PYTHON_DISPLAY_INITIALISE = true;


    /* ========================================================
       STYLE PYTHON
    ======================================================== */

    function installerStylePython() {

      try {

        if (
          document.getElementById(
            "nova-python-display-style"
          )
        ) return;

        var style = document.createElement("style");

        style.id = "nova-python-display-style";

        style.textContent = `

          .nova-python-wrapper {

            width:100%;

            max-width:100%;

            margin:14px 0;

            overflow:hidden;

            border-radius:14px;

            background:#0b1220;

            border:1px solid #26354b;

            box-sizing:border-box;

          }

          .nova-python-toolbar {

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:8px;

            padding:11px 12px;

            background:#111b2b;

            border-bottom:1px solid #26354b;

          }

          .nova-python-title {

            color:#ffffff;

            font-size:13px;

            font-weight:600;

          }

          .nova-python-actions {

            display:flex;

            align-items:center;

            gap:7px;

          }

          .nova-python-btn {

            display:inline-flex;

            align-items:center;

            justify-content:center;

            gap:5px;

            min-height:34px;

            padding:6px 9px;

            background:#1d293b;

            border:1px solid #39485d;

            border-radius:8px;

            color:#ffffff;

            font-size:12px;

            cursor:pointer;

            -webkit-tap-highlight-color:transparent;

          }

          .nova-python-btn:active {

            transform:scale(.96);

          }

          .nova-python-btn svg {

            width:17px;

            height:17px;

            stroke:#ffffff;

            fill:none;

            stroke-width:2;

            stroke-linecap:round;

            stroke-linejoin:round;

          }

          .nova-python-content {

            max-height:170px;

            overflow:hidden;

            position:relative;

            transition:max-height .3s ease;

          }

          .nova-python-content.ouvert {

            max-height:20000px;

            overflow-x:auto;

            overflow-y:visible;

          }

          .nova-python-content pre {

            margin:0 !important;

            padding:15px !important;

            overflow-x:auto;

            background:transparent !important;

            color:#e5e7eb;

            font-size:13px;

            line-height:1.65;

            white-space:pre;

            box-sizing:border-box;

          }

          .nova-python-content code {

            font-family:Consolas,Monaco,monospace;

          }

          .nova-python-footer {

            padding:8px 12px;

            color:#94a3b8;

            font-size:11px;

            border-top:1px solid #26354b;

          }

          @media(max-width:400px) {

            .nova-python-btn {

              padding:6px;

              font-size:11px;

            }

            .nova-python-title {

              font-size:12px;

            }

          }

        `;

        document.head.appendChild(style);

      } catch (e) {}

    }


    /* ========================================================
       SVG BLANCS
    ======================================================== */

    var ICONES = {

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


    /* ========================================================
       DETECTION PYTHON
    ======================================================== */

    function estPython(pre) {

      try {

        var code = pre.querySelector("code");

        var classes = (

          (pre.className || "") +

          " " +

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

          classes.indexOf("python") !== -1 ||

          langage === "python"

        );

      } catch (e) {

        return false;

      }

    }


    /* ========================================================
       BOUTONS
    ======================================================== */

    function creerBouton(nom, svg, action) {

      try {

        var bouton = document.createElement("button");

        bouton.type = "button";

        bouton.className = "nova-python-btn";

        bouton.innerHTML =
          svg +
          "<span>" +
          nom +
          "</span>";

        bouton.addEventListener("click", function (event) {

          try {

            event.preventDefault();

            event.stopPropagation();

            action(bouton);

          } catch (e) {}

        });

        return bouton;

      } catch (e) {

        return null;

      }

    }


    /* ========================================================
       COPIER LE CODE
    ======================================================== */

    function copierCode(texte, bouton) {

      try {

        function confirmation() {

          try {

            var label = bouton.querySelector("span");

            label.textContent = "Copié";

            setTimeout(function () {

              label.textContent = "Copier";

            }, 1500);

          } catch (e) {}

        }

        function ancienneCopie() {

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

            if (resultat) confirmation();

          } catch (e) {}

        }

        if (
          navigator.clipboard &&
          navigator.clipboard.writeText
        ) {

          navigator.clipboard.writeText(texte).then(

            confirmation,

            ancienneCopie

          );

        } else {

          ancienneCopie();

        }

      } catch (e) {}

    }


    /* ========================================================
       TRANSFORMATION DU BLOC PYTHON
    ======================================================== */

    function traiterPython(pre) {

      try {

        if (!pre || !estPython(pre)) return;

        if (pre.dataset.novaPythonDisplay === "1") return;

        var parent = pre.parentElement;

        if (!parent) return;

        var wrapper = document.createElement("div");

        wrapper.className = "nova-python-wrapper";

        var toolbar = document.createElement("div");

        toolbar.className = "nova-python-toolbar";

        var titre = document.createElement("div");

        titre.className = "nova-python-title";

        titre.textContent = "Python";

        var actions = document.createElement("div");

        actions.className = "nova-python-actions";

        var content = document.createElement("div");

        content.className = "nova-python-content";

        var footer = document.createElement("div");

        footer.className = "nova-python-footer";

        footer.textContent = "Code Python";


        /* VOIR */

        var boutonVoir;

        /* COPIER */

        var boutonCopier;

        /* FERMER */

        var boutonFermer;


        boutonVoir = creerBouton(

          "Voir",

          ICONES.voir,

          function () {

            content.classList.add("ouvert");

            boutonVoir.style.display = "none";

            boutonFermer.style.display = "inline-flex";

          }

        );


        boutonCopier = creerBouton(

          "Copier",

          ICONES.copier,

          function (bouton) {

            var code = pre.querySelector("code");

            var texte = code
              ? code.textContent
              : pre.textContent;

            copierCode(texte, bouton);

          }

        );


        boutonFermer = creerBouton(

          "Fermer",

          ICONES.fermer,

          function () {

            content.classList.remove("ouvert");

            boutonVoir.style.display = "inline-flex";

            boutonFermer.style.display = "none";

          }

        );


        if (
          !boutonVoir ||
          !boutonCopier ||
          !boutonFermer
        ) return;


        boutonFermer.style.display = "none";


        /* ASSEMBLAGE */

        actions.appendChild(boutonVoir);

        actions.appendChild(boutonCopier);

        actions.appendChild(boutonFermer);

        toolbar.appendChild(titre);

        toolbar.appendChild(actions);


        pre.dataset.novaPythonDisplay = "1";

        parent.insertBefore(wrapper, pre);

        content.appendChild(pre);

        wrapper.appendChild(toolbar);

        wrapper.appendChild(content);

        wrapper.appendChild(footer);


      } catch (e) {}

    }


    /* ========================================================
       RECHERCHE DES BLOCS
    ======================================================== */

    function rechercherPython() {

      try {

        var zone =

          document.getElementById("chat-box") ||

          document.getElementById("messages") ||

          document.getElementById("chat");

        if (!zone) return;

        var blocs = zone.querySelectorAll("pre");

        for (var i = 0; i < blocs.length; i++) {

          traiterPython(blocs[i]);

        }

      } catch (e) {}

    }


    /* ========================================================
       OBSERVATEUR PYTHON INDEPENDANT
    ======================================================== */

    function demarrerPython() {

      try {

        installerStylePython();

        rechercherPython();

        var zone =

          document.getElementById("chat-box") ||

          document.getElementById("messages") ||

          document.getElementById("chat");

        if (!zone) {

          setTimeout(demarrerPython, 700);

          return;

        }

        var observerPython = new MutationObserver(function () {

          try {

            rechercherPython();

          } catch (e) {}

        });

        observerPython.observe(zone, {

          childList: true,

          subtree: true,

          characterData: true

        });

      } catch (e) {}

    }


    /* ========================================================
       LANCEMENT PYTHON
    ======================================================== */

    if (document.readyState === "loading") {

      document.addEventListener(
        "DOMContentLoaded",
        demarrerPython
      );

    } else {

      demarrerPython();

    }

  } catch (e) {}

})();
