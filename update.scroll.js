/* ============================================================
   Nova AI - update.scroll.js - Version 1.0
   Fleche bas + 3 petits points - DEJA BRANCHE
   REGLE D'OR: Ne touche PAS a index.html ni aux autres fichiers
   A: Tu mets juste une ligne dans index.html en bas: <script src="update.scroll.js"></script>
   B: Tout le reste est deja branche dans ce fichier.
   Si ce fichier plante, index.html continue tout seul.
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
        return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
      }

      function estEnBas(zone) {
        try {
          return (zone.scrollHeight - zone.scrollTop - zone.clientHeight) < 100;
        } catch (e) { return true; }
      }

      /* ---------- FLECHE ---------- */
      var fleche = null;
      function creerFleche(zone) {
        try {
          if (fleche && document.body.contains(fleche)) { return fleche; }
          fleche = document.createElement("button");
          fleche.id = "nova-fleche-bas";
          fleche.textContent = "↓";
          fleche.setAttribute("aria-label", "Aller en bas");
          fleche.style.cssText = "display:none;position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;border:none;background:#7c6cff;color:#fff;font-size:22px;line-height:1;cursor:pointer;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,0.35);";
          fleche.addEventListener("click", function () {
            try {
              var z = zoneChat();
              if (!z) { return; }
              z.scrollTo({ top: z.scrollHeight, behavior: "smooth" });
              cacherFleche();
              cacherPoints();
            } catch (e) {}
          });
          // On met la fleche DANS la discussion, nulle part ailleurs
          var parent = zone.parentElement || document.body;
          try {
            var cs = window.getComputedStyle(parent);
            if (cs.position === "static") { parent.style.position = "relative"; }
          } catch (e) {}
          parent.appendChild(fleche);
          return fleche;
        } catch (e) { return null; }
      }

      function montrerFleche() {
        try {
          var z = zoneChat();
          if (!z) { return; }
          var f = creerFleche(z);
          if (f) { f.style.display = "block"; }
        } catch (e) {}
      }

      function cacherFleche() {
        try { if (fleche) { fleche.style.display = "none"; } } catch (e) {}
      }

      /* ---------- 3 PETITS POINTS ---------- */
      var points = null;
      function creerPoints(zone) {
        try {
          if (points && document.body.contains(points)) { return points; }
          points = document.createElement("div");
          points.id = "nova-3-points";
          points.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.2s;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.4s;"></span>';
          points.style.cssText = "display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:16px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,0.55);color:#fff;font-size:12px;z-index:49;pointer-events:none;";
          var style = document.createElement("style");
          style.textContent = "@keyframes novaPoint{0%,100%{opacity:0.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}";
          document.head.appendChild(style);
          var parent = zone.parentElement || document.body;
          parent.appendChild(points);
          return points;
        } catch (e) { return null; }
      }

      function montrerPoints() {
        try {
          var z = zoneChat();
          if (!z) { return; }
          var p = creerPoints(z);
          if (p) { p.style.display = "block"; }
        } catch (e) {}
      }

      function cacherPoints() {
        try { if (points) { points.style.display = "none"; } } catch (e) {}
      }

      function majAffichage() {
        try {
          var z = zoneChat();
          if (!z) { return; }
          var enBas = estEnBas(z);
          utilisateurEnHaut = !enBas;
          if (enBas) {
            cacherFleche();
            cacherPoints();
          } else {
            // En haut : on montre la fleche seulement si Nova a ecrit en bas
            if (novaEcrit) {
              montrerFleche();
              montrerPoints();
            }
          }
        } catch (e) {}
      }

      /* ---------- SURVEILLANCE : NE JAMAIS FORCER LE SCROLL ---------- */
      function demarrer() {
        try {
          var z = zoneChat();
          if (!z) {
            setTimeout(demarrer, 500);
            return;
          }
          creerFleche(z);
          creerPoints(z);

          // 1. Quand l'utilisateur scroll, on met a jour
          z.addEventListener("scroll", function () {
            try {
              var avant = utilisateurEnHaut;
              majAffichage();
              // Si l'utilisateur vient de remonter, on memorise sa position
              if (utilisateurEnHaut) { dernierScrollTop = z.scrollTop; }
              if (!utilisateurEnHaut && avant) { novaEcrit = false; }
            } catch (e) {}
          }, { passive: true });

          // 2. Quand Nova ecrit en bas, on ne force PAS le scroll
          var obs = new MutationObserver(function () {
            try {
              var zone = zoneChat();
              if (!zone) { return; }
              // Si l'utilisateur est en haut, on le laisse en haut
              if (utilisateurEnHaut) {
                // Si index.html a force le scroll en bas, on remet l'utilisateur ou il etait
                if (Math.abs(zone.scrollTop - dernierScrollTop) > 5 && !estEnBas(zone)) {
                  // On ne bloque que si le saut est brutal, sinon on garde la position
                }
                // Cas principal : Nova a ajoute du contenu en bas
                novaEcrit = true;
                montrerFleche();
                montrerPoints();
                // On garde la position de l'utilisateur
                zone.scrollTop = dernierScrollTop;
                // Les points restent 4 secondes, la fleche reste tant qu'il est en haut
                if (timerPoints) { clearTimeout(timerPoints); }
                timerPoints = setTimeout(function () {
                  cacherPoints();
                  // La fleche reste pour redescendre
                }, 4000);
              } else {
                // L'utilisateur est deja en bas : on le laisse en bas, comportement normal
                novaEcrit = false;
                cacherFleche();
                cacherPoints();
              }
            } catch (e) {}
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
