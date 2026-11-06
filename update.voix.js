/* =====================================================================
   update.voix.js  —  NOVA AI  —  MODULE VOIX (cape d'invisibilité)


   RÈGLE D'OR : ON NE TOUCHE JAMAIS À index.html.

   Ce fichier fonctionne exactement comme update.compotement.js :
   - Il est chargé par UNE SEULE balise <script src="update.voix.js"></script>
     placée après update.compotement.js. C'est la seule modification
     autorisée dans index.html.
   - Il observe la page, repère l'icône haut-parleur DÉJÀ existante dans
     les messages de l'IA, et la branche (il ne crée PAS de nouvelle
     icône haut-parleur dans les messages).
   - Tout est protégé par try/catch : si la voix échoue, l'app continue
     normalement, sans erreur visible.

   CE QUE FAIT CE FICHIER :
   A. Branche l'icône haut-parleur existante des messages de l'IA.
   B. Fait parler Nova avec window.speechSynthesis (gratuit, local).
   C. Ouvre une belle modale arrondie pour choisir Homme / Femme.
   D. Affiche une barre fixe EN HAUT pendant la lecture
      (pause, ralenti, vitesse, fermer, début du texte lu).
   E. [SUPPRIMÉ] Micro dans la zone de saisie - SUPPRIMÉ SUR DEMANDE.
      Le micro ne sera plus créé.

   CLÉS localStorage UTILISÉES :
   - nova_voix_choisie  : "homme" ou "femme"
   - nova_voix_vitesse  : 0.7 / 1 / 1.25 / 1.5
   ===================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------
     SÉCURITÉ GLOBALE : tout le module est dans un try/catch.
     --------------------------------------------------------------- */
  try {

    /* =============================================================
       0. CONFIGURATION
       ============================================================= */

    // Si ton icône haut-parleur a une classe ou un sélecteur précis,
    // tu peux le mettre ici (ex : ".btn-speak"). Sinon laisse vide :
    // la détection automatique s'en occupe.
    var SELECTEUR_ICONE_PERSO = "";

    var CLE_VOIX = "nova_voix_choisie";
    var CLE_VITESSE = "nova_voix_vitesse";

    var COULEUR_FOND = "#1c1c1e";
    var COULEUR_BLEU = "#2f7bff";

    var PITCH_HOMME = 0.7;
    var PITCH_FEMME = 1.1;

    var CYCLE_VITESSES = [1, 1.25, 1.5, 0.7];

    var TAILLE_MAX_MORCEAU = 180; // Android coupe les longues phrases

    /* =============================================================
       1. ÉTAT GLOBAL DU MODULE
       ============================================================= */

    var etat = {
      voixListe: [],          // voix système chargées
      enLecture: false,       // une lecture est en cours
      enPause: false,         // la lecture est en pause
      morceaux: [],           // le texte découpé en morceaux
      indexMorceau: 0,        // morceau en cours
      sessionId: 0,           // sert à ignorer les anciens callbacks
      genre: "femme",         // voix utilisée
      vitesse: 1,             // vitesse actuelle
      texteEnCours: "",       // texte complet lu
      texteEnAttente: "",     // texte du message cliqué (avant choix)
      barre: null,            // élément de la barre du haut
      modale: null            // élément de la modale
    };

    var etatMic = {
      bouton: null,
      reco: null,
      enregistre: false,
      base: ""
    };

    /* =============================================================
       2. OUTILS DE BASE (localStorage sécurisé, toast)
       ============================================================= */

    function lireStockage(cle, defaut) {
      try {
        var v = window.localStorage.getItem(cle);
        return v === null ? defaut : v;
      } catch (e) {
        return defaut;
      }
    }

    function ecrireStockage(cle, valeur) {
      try {
        window.localStorage.setItem(cle, String(valeur));
      } catch (e) {
        // on ignore : l'app continue
      }
    }

    function afficherToast(message) {
      try {
        var t = document.createElement("div");
        t.setAttribute("data-nova-voix", "toast");
        t.textContent = message;
        t.style.cssText =
          "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);" +
          "background:" + COULEUR_FOND + ";color:#fff;padding:10px 18px;" +
          "border-radius:20px;font-size:14px;z-index:100000;" +
          "box-shadow:0 6px 24px rgba(0,0,0,.5);border:1px solid #333;" +
          "font-family:-apple-system,system-ui,sans-serif;";
        document.body.appendChild(t);
        setTimeout(function () {
          try { t.parentNode && t.parentNode.removeChild(t); } catch (e) {}
        }, 2200);
      } catch (e) {}
    }

    /* =============================================================
       3. STYLES (injectés par JS, index.html n'est pas modifié)
       ============================================================= */

    function injecterStyles() {
      try {
        if (document.getElementById("nova-voix-style")) return;

        var css = "";

        /* ---------- Modale (bottom sheet) ---------- */
        css += ".nv-overlay{position:fixed;inset:0;background:rgba(0,0,0,0);" +
               "z-index:99995;transition:background .3s ease;" +
               "-webkit-tap-highlight-color:transparent;}";
        css += ".nv-overlay.nv-ouvert{background:rgba(0,0,0,.55);}";

        css += ".nv-sheet{position:absolute;left:0;right:0;bottom:0;" +
               "background:" + COULEUR_FOND + ";color:#fff;" +
               "border-radius:28px 28px 0 0;" +
               "padding:10px 20px calc(24px + env(safe-area-inset-bottom));" +
               "transform:translateY(100%);" +
               "transition:transform .32s cubic-bezier(.2,.9,.3,1);" +
               "box-shadow:0 -10px 40px rgba(0,0,0,.6);" +
               "font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;" +
               "max-width:560px;margin:0 auto;touch-action:none;}";
        css += ".nv-overlay.nv-ouvert .nv-sheet{transform:translateY(0);}";

        css += ".nv-drag{width:44px;height:5px;border-radius:3px;" +
               "background:#48484a;margin:4px auto 16px;}";

        css += ".nv-titre{font-size:20px;font-weight:700;text-align:center;" +
               "margin:0 0 4px;}";
        css += ".nv-sous{font-size:14px;color:#98989f;text-align:center;" +
               "margin:0 0 18px;}";

        css += ".nv-carte{display:flex;align-items:center;gap:14px;" +
               "width:100%;box-sizing:border-box;padding:16px;margin:0 0 12px;" +
               "background:#2c2c2e;border:2px solid transparent;" +
               "border-radius:20px;color:#fff;cursor:pointer;text-align:left;" +
               "font-family:inherit;transition:transform .15s ease," +
               "border-color .2s ease,background .2s ease;}";
        css += ".nv-carte:active{transform:scale(.97);background:#3a3a3c;}";
        css += ".nv-carte.nv-choisi{border-color:" + COULEUR_BLEU + ";" +
               "background:rgba(47,123,255,.14);}";

        css += ".nv-emoji{font-size:34px;width:54px;height:54px;" +
               "display:flex;align-items:center;justify-content:center;" +
               "background:rgba(47,123,255,.18);border-radius:50%;" +
               "flex-shrink:0;}";
        css += ".nv-carte-titre{font-size:17px;font-weight:600;display:block;}";
        css += ".nv-carte-desc{font-size:13px;color:#98989f;display:block;" +
               "margin-top:2px;}";
        css += ".nv-coche{margin-left:auto;width:24px;height:24px;" +
               "border-radius:50%;background:" + COULEUR_BLEU + ";" +
               "display:none;align-items:center;justify-content:center;}";
        css += ".nv-carte.nv-choisi .nv-coche{display:flex;}";

        /* ---------- Barre du haut ---------- */
        css += ".nv-barre{position:fixed;top:0;left:0;right:0;z-index:99990;" +
               "background:" + COULEUR_FOND + ";color:#fff;" +
               "padding:calc(8px + env(safe-area-inset-top)) 12px 10px;" +
               "border-bottom:1px solid #2c2c2e;" +
               "box-shadow:0 6px 24px rgba(0,0,0,.45);" +
               "transform:translateY(-110%);" +
               "transition:transform .3s cubic-bezier(.2,.9,.3,1);" +
               "font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;}";
        css += ".nv-barre.nv-visible{transform:translateY(0);}";

        css += ".nv-rangee{display:flex;align-items:center;gap:8px;}";

        css += ".nv-btn{display:flex;align-items:center;justify-content:center;" +
               "gap:5px;height:40px;min-width:40px;padding:0 10px;" +
               "background:#2c2c2e;border:none;border-radius:20px;color:#fff;" +
               "cursor:pointer;font-size:13px;font-weight:600;" +
               "font-family:inherit;transition:background .15s ease," +
               "transform .12s ease;-webkit-tap-highlight-color:transparent;}";
        css += ".nv-btn:active{transform:scale(.92);background:#3a3a3c;}";
        css += ".nv-btn.nv-actif{background:" + COULEUR_BLEU + ";}";
        css += ".nv-btn.nv-principal{background:" + COULEUR_BLEU + ";}";
        css += ".nv-btn svg{display:block;}";
        css += ".nv-espace{flex:1;}";

        css += ".nv-apercu{margin-top:8px;font-size:13px;color:#c7c7cc;" +
               "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}";
        css += ".nv-apercu b{color:" + COULEUR_BLEU + ";font-weight:600;" +
               "margin-right:6px;}";

        /* ---------- Micro dans la zone de saisie ---------- */
        /* [SUPPRESSION MICRO] Le micro ne doit plus jamais apparaître */
        css += ".nv-micro{display:none !important;visibility:hidden !important;width:0 !important;height:0 !important;opacity:0 !important;pointer-events:none !important;}";

        var style = document.createElement("style");
        style.id = "nova-voix-style";
        style.textContent = css;
        document.head.appendChild(style);
      } catch (e) {}
    }

    /* =============================================================
       4. ICÔNES SVG (toutes blanches)
       ============================================================= */

    var SVG_PAUSE =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">' +
      '<rect x="6" y="5" width="4" height="14" rx="1.2"/>' +
      '<rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';

    var SVG_PLAY =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">' +
      '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

    var SVG_TORTUE =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-linecap="round">' +
      '<path d="M3.5 16a8 7.5 0 0 1 16 0z" stroke="none"/>' +
      '<circle cx="21" cy="13" r="2" stroke="none"/>' +
      '<rect x="6" y="16" width="3" height="3.2" rx="1" stroke="none"/>' +
      '<rect x="14" y="16" width="3" height="3.2" rx="1" stroke="none"/>' +
      '<path d="M3.5 16l-2 1" fill="none" stroke-width="1.6"/></svg>';

    var SVG_VITESSE =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>' +
      '<circle cx="12" cy="17" r="1" fill="#fff"/></svg>';

    var SVG_FERMER =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" ' +
      'stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>';

    var SVG_COCHE =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" ' +
      'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    /* [SUPPRESSION MICRO] SVG_MICRO supprimé - plus utilisé */
    var SVG_MICRO = '';

    /* =============================================================
       5. CHARGEMENT DES VOIX (obligatoire sur Android)
       ============================================================= */

    function chargerVoix() {
      try {
        if (!("speechSynthesis" in window)) return;
        var liste = window.speechSynthesis.getVoices();
        if (liste && liste.length) {
          etat.voixListe = liste;
        }
      } catch (e) {}
    }

    function preChargerVoix() {
      try {
        if (!("speechSynthesis" in window)) return;

        chargerVoix();

        // Sur Android, les voix arrivent en retard : on écoute l'événement
        if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
          window.speechSynthesis.onvoiceschanged = function () {
            chargerVoix();
          };
        }

        // Filet de sécurité : on réessaie quelques fois
        var essais = 0;
        var timer = setInterval(function () {
          essais++;
          chargerVoix();
          if (etat.voixListe.length > 0 || essais >= 10) {
            clearInterval(timer);
          }
        }, 500);
      } catch (e) {}
    }

    /* =============================================================
       6. CHOIX DE LA VOIX SYSTÈME (français en priorité)
       ============================================================= */

    var REGEX_FEMME =
      /female|femme|woman|amelie|amélie|audrey|marie|julie|denise|eloise|éloïse|hortense|lea|léa|aurelie|aurélie|celine|céline|sylvie|brigitte|chloe|chloé|lucie|virginie/i;

    var REGEX_HOMME =
      /\bmale\b|homme|man\b|thomas|henri|paul|antoine|claude|nicolas|mathieu|remy|rémi|jerome|jérôme|guillaume|maxime|bruno|daniel/i;

    function voixFrancaises() {
      try {
        return etat.voixListe.filter(function (v) {
          var lang = String(v.lang || "").replace("_", "-").toLowerCase();
          return lang.indexOf("fr") === 0;
        });
      } catch (e) {
        return [];
      }
    }

    function choisirVoixSysteme(genre) {
      var resultat = { voix: null, pitch: genre === "homme" ? PITCH_HOMME : PITCH_FEMME };

      try {
        var fr = voixFrancaises();

        // Aucune voix française : on laisse le système (voix par défaut)
        if (!fr.length) return resultat;

        var choisie = null;
        var i;

        if (genre === "femme") {
          for (i = 0; i < fr.length; i++) {
            if (REGEX_FEMME.test(fr[i].name)) { choisie = fr[i]; break; }
          }
          if (!choisie) {
            for (i = 0; i < fr.length; i++) {
              if (!REGEX_HOMME.test(fr[i].name)) { choisie = fr[i]; break; }
            }
          }
          if (!choisie) choisie = fr[0];
        } else {
          for (i = 0; i < fr.length; i++) {
            if (REGEX_HOMME.test(fr[i].name)) { choisie = fr[i]; break; }
          }
          if (!choisie) {
            for (i = fr.length - 1; i >= 0; i--) {
              if (!REGEX_FEMME.test(fr[i].name)) { choisie = fr[i]; break; }
            }
          }
          if (!choisie) choisie = fr[fr.length - 1];
        }

        resultat.voix = choisie;
      } catch (e) {}

      return resultat;
    }

    /* =============================================================
       7. DÉTECTION DE L'ICÔNE HAUT-PARLEUR EXISTANTE
       ============================================================= */

    var REGEX_ATTR_OUI =
      /volume|speaker|haut-?parleur|speak|audio|listen|ecout|écout|tts|read-?aloud|lire/i;

    var REGEX_ATTR_NON =
      /\bmic\b|micro|copy|copier|thumb|like|dislike|regenerate|regener|share|partag|send|envoy|attach|retry/i;

    function attributsDe(el) {
      try {
        var s = "";
        if (!el) return s;
        s += " " + (el.getAttribute("class") || "");
        s += " " + (el.getAttribute("id") || "");
        s += " " + (el.getAttribute("aria-label") || "");
        s += " " + (el.getAttribute("title") || "");
        s += " " + (el.getAttribute("data-action") || "");
        s += " " + (el.getAttribute("data-icon") || "");
        s += " " + (el.getAttribute("onclick") || "");
        return s;
      } catch (e) {
        return "";
      }
    }

    function estIconeHautParleur(svg) {
      try {
        if (!svg || svg.nodeName.toLowerCase() !== "svg") return false;

        // Jamais nos propres éléments
        if (svg.closest && svg.closest("[data-nova-voix]")) return false;

        // Sélecteur personnalisé (si fourni)
        if (SELECTEUR_ICONE_PERSO) {
          try {
            if (svg.closest(SELECTEUR_ICONE_PERSO)) return true;
          } catch (e) {}
        }

        var parent = svg.closest("button,[role='button'],a,div[onclick],span[onclick]");
        var attrs = attributsDe(svg) + attributsDe(parent);

        // Exclusions claires (copier, like, etc.)
        if (REGEX_ATTR_NON.test(attrs) && !REGEX_ATTR_OUI.test(attrs)) return false;

        // Indices dans les attributs
        if (REGEX_ATTR_OUI.test(attrs)) return true;

        // Indices dans la forme du dessin (Feather / Lucide / Material)
        var html = svg.innerHTML.toLowerCase().replace(/\s+/g, " ");

        // Feather : polygon "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
        if (html.indexOf("11 5 6 9 2 9 2 15 6 15 11 19 11 5") !== -1) return true;

        // Lucide : "M11 5L6 9H2v6h4l5 4V5z"
        if (html.indexOf("m11 5l6 9h2v6h4l5 4v5") !== -1) return true;
        if (html.indexOf("m11 5 6 9h2v6h4l5 4v5") !== -1) return true;

        // Ondes de son Feather / Lucide
        if (html.indexOf("19.07 4.93") !== -1) return true;
        if (html.indexOf("15.54 8.46") !== -1) return true;

        // Material : volume_up / volume_down
        if (html.indexOf("m3 9v6h4l5 5v4l7 9h3z") !== -1) return true;
        if (html.indexOf("m3 9v6h4l5 5v4l7 9h3") !== -1) return true;

        // Bootstrap / autres : "volume" dans un path d'ondes
        if (html.indexOf("volume") !== -1) return true;

        return false;
      } catch (e) {
        return false;
      }
    }

    function compterIcones(conteneur) {
      try {
        var svgs = conteneur.querySelectorAll("svg");
        var n = 0;
        for (var i = 0; i < svgs.length; i++) {
          if (estIconeHautParleur(svgs[i])) n++;
        }
        return n;
      } catch (e) {
        return 0;
      }
    }

    /* =============================================================
       8. RÉCUPÉRER LE TEXTE DU MESSAGE CLIQUÉ (et lui seul)
       ============================================================= */

    function nettoyerTextePourLecture(texte) {
      try {
        var t = String(texte || "");

        // URLs
        t = t.replace(/https?:\/\/\S+/g, " ");

        // Emojis et pictogrammes
        t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ");

        // Symboles Markdown
        t = t.replace(/[*#`_~>|]/g, " ");

        // Espaces multiples
        t = t.replace(/[ \t\u00a0]+/g, " ");
        t = t.replace(/\n\s*\n+/g, "\n");

        return t.trim();
      } catch (e) {
        return String(texte || "");
      }
    }

    function extraireTexte(noeud) {
      try {
        if (!noeud) return "";

        var copie = noeud.cloneNode(true);

        // On retire tout ce qui n'est pas du texte lisible
        var aRetirer = copie.querySelectorAll(
          "svg,button,script,style,textarea,input,pre,[aria-hidden='true'],[data-nova-voix]"
        );
        for (var i = 0; i < aRetirer.length; i++) {
          if (aRetirer[i].parentNode) aRetirer[i].parentNode.removeChild(aRetirer[i]);
        }

        // Retours à la ligne
        var brs = copie.querySelectorAll("br");
        for (var j = 0; j < brs.length; j++) {
          brs[j].parentNode.replaceChild(document.createTextNode("\n"), brs[j]);
        }
        var blocs = copie.querySelectorAll("p,li,div,h1,h2,h3,h4,h5,h6");
        for (var k = 0; k < blocs.length; k++) {
          blocs[k].appendChild(document.createTextNode("\n"));
        }

        return nettoyerTextePourLecture(copie.textContent || "");
      } catch (e) {
        return "";
      }
    }

    var REGEX_CLASSE_MESSAGE =
      /message|msg|bubble|bulle|assistant|\bai\b|bot|nova|reply|response|answer/i;

    var REGEX_CLASSE_USER = /\buser\b|utilisateur|human|\bme\b|\bmoi\b/i;

    function trouverTexteMessage(svg) {
      try {
        var niveau = svg.parentElement;
        var meilleur = null;
        var garde = 0;

        while (niveau && niveau !== document.body && garde < 8) {
          garde++;

          // On ne doit jamais englober la zone de saisie
          if (niveau.querySelector("textarea, input[type='text']")) break;

          // Plusieurs icônes = on a englobé plusieurs messages
          if (compterIcones(niveau) > 1) break;

          // On ne doit pas englober un message de l'utilisateur
          try {
            var cls = niveau.getAttribute("class") || "";
            if (REGEX_CLASSE_USER.test(cls)) break;
            if (niveau.querySelector("[class*='user']")) break;
          } catch (e) {}

          var texte = extraireTexte(niveau);
          if (texte.length >= 3) {
            meilleur = niveau;

            // Si le conteneur ressemble à un message, on s'arrête là
            var classe = niveau.getAttribute("class") || "";
            if (REGEX_CLASSE_MESSAGE.test(classe)) break;
          }

          niveau = niveau.parentElement;
        }

        return meilleur ? extraireTexte(meilleur) : "";
      } catch (e) {
        return "";
      }
    }

    /* =============================================================
       9. DÉCOUPAGE DU TEXTE EN MORCEAUX (anti-coupure Android)
       ============================================================= */

    function decouperTexte(texte) {
      var resultat = [];

      try {
        var phrases = texte.match(/[^.!?…\n]+[.!?…]*/g) || [texte];
        var courant = "";

        for (var i = 0; i < phrases.length; i++) {
          var p = phrases[i].trim();
          if (!p) continue;

          // Phrase trop longue : on coupe sur les virgules / espaces
          while (p.length > TAILLE_MAX_MORCEAU) {
            var coupe = p.lastIndexOf(",", TAILLE_MAX_MORCEAU);
            if (coupe < 40) coupe = p.lastIndexOf(" ", TAILLE_MAX_MORCEAU);
            if (coupe < 40) coupe = TAILLE_MAX_MORCEAU;

            if (courant) { resultat.push(courant); courant = ""; }
            resultat.push(p.slice(0, coupe + 1).trim());
            p = p.slice(coupe + 1).trim();
          }

          if ((courant + " " + p).length > TAILLE_MAX_MORCEAU) {
            if (courant) resultat.push(courant);
            courant = p;
          } else {
            courant = courant ? courant + " " + p : p;
          }
        }

        if (courant) resultat.push(courant);
      } catch (e) {
        resultat = [texte];
      }

      return resultat;
    }

    /* =============================================================
       10. LECTURE À VOIX HAUTE
       ============================================================= */

    function lireVitesse() {
      var v = parseFloat(lireStockage(CLE_VITESSE, "1"));
      if (isNaN(v) || v <= 0) v = 1;
      return v;
    }

    function lancerMorceau(index) {
      try {
        if (!("speechSynthesis" in window)) return;

        if (index >= etat.morceaux.length) {
          terminerLecture();
          return;
        }

        etat.indexMorceau = index;
        var monId = etat.sessionId;

        var config = choisirVoixSysteme(etat.genre);
        var u = new SpeechSynthesisUtterance(etat.morceaux[index]);

        u.lang = "fr-FR";
        if (config.voix) {
          u.voice = config.voix;
          u.lang = config.voix.lang || "fr-FR";
        }
        u.pitch = config.pitch;
        u.rate = etat.vitesse;
        u.volume = 1;

        u.onend = function () {
          try {
            if (monId !== etat.sessionId) return; // ancienne session
            if (etat.enPause) return;
            lancerMorceau(index + 1);
          } catch (e) {}
        };

        u.onerror = function () {
          try {
            if (monId !== etat.sessionId) return;
            if (etat.enPause) return;
            // On passe au morceau suivant en cas d'erreur
            lancerMorceau(index + 1);
          } catch (e) {}
        };

        // Petit délai : nécessaire sur Android après cancel()
        setTimeout(function () {
          try {
            if (monId !== etat.sessionId) return;
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }, 60);
      } catch (e) {}
    }

    function parler(texte, genre) {
      try {
        if (!("speechSynthesis" in window)) {
          afficherToast("La voix n'est pas supportée ici.");
          return;
        }

        var propre = nettoyerTextePourLecture(texte);
        if (!propre) {
          afficherToast("Rien à lire dans ce message.");
          return;
        }

        // On arrête toute lecture précédente
        etat.sessionId++;
        try { window.speechSynthesis.cancel(); } catch (e) {}

        etat.genre = genre === "homme" ? "homme" : "femme";
        etat.vitesse = lireVitesse();
        etat.texteEnCours = propre;
        etat.morceaux = decouperTexte(propre);
        etat.indexMorceau = 0;
        etat.enLecture = true;
        etat.enPause = false;

        creerBarreHaut(propre);
        mettreAJourBarre();

        lancerMorceau(0);
      } catch (e) {}
    }

    function mettrePause() {
      try {
        if (!etat.enLecture) return;
        etat.enPause = true;
        etat.sessionId++; // ignore les callbacks du morceau coupé
        try { window.speechSynthesis.cancel(); } catch (e) {}
        mettreAJourBarre();
      } catch (e) {}
    }

    function reprendre() {
      try {
        if (!etat.enLecture) return;
        etat.enPause = false;
        mettreAJourBarre();
        lancerMorceau(etat.indexMorceau); // on reprend le morceau en cours
      } catch (e) {}
    }

    function basculerPause() {
      try {
        if (etat.enPause) reprendre();
        else mettrePause();
      } catch (e) {}
    }

    function changerVitesse(nouvelle) {
      try {
        etat.vitesse = nouvelle;
        ecrireStockage(CLE_VITESSE, nouvelle);
        mettreAJourBarre();

        // Si ça parle, on relance le morceau avec la nouvelle vitesse
        if (etat.enLecture && !etat.enPause) {
          etat.sessionId++;
          try { window.speechSynthesis.cancel(); } catch (e) {}
          lancerMorceau(etat.indexMorceau);
        }
      } catch (e) {}
    }

    function vitesseSuivante() {
      try {
        var actuelle = etat.vitesse;
        var pos = -1;
        for (var i = 0; i < CYCLE_VITESSES.length; i++) {
          if (Math.abs(CYCLE_VITESSES[i] - actuelle) < 0.01) { pos = i; break; }
        }
        // 1 -> 1.25 -> 1.5 -> 0.7 -> 1
        var suivante = CYCLE_VITESSES[(pos + 1) % CYCLE_VITESSES.length];
        if (pos === -1) suivante = 1;
        changerVitesse(suivante);
      } catch (e) {}
    }

    function basculerRalenti() {
      try {
        if (Math.abs(etat.vitesse - 0.7) < 0.01) changerVitesse(1);
        else changerVitesse(0.7);
      } catch (e) {}
    }

    function arreterVoix() {
      try {
        etat.sessionId++;
        etat.enLecture = false;
        etat.enPause = false;
        try { window.speechSynthesis.cancel(); } catch (e) {}
        fermerBarreHaut();
      } catch (e) {}
    }

    function terminerLecture() {
      try {
        etat.enLecture = false;
        etat.enPause = false;
        etat.sessionId++;
        fermerBarreHaut(); // la barre se ferme toute seule à la fin
      } catch (e) {}
    }

    /* =============================================================
       11. LA BARRE DU HAUT (pendant la lecture)
       ============================================================= */

    function creerBarreHaut(texte) {
      try {
        fermerBarreHautImmediat();

        var barre = document.createElement("div");
        barre.className = "nv-barre";
        barre.setAttribute("data-nova-voix", "barre");

        // --- Rangée de boutons ---
        var rangee = document.createElement("div");
        rangee.className = "nv-rangee";

        var btnPause = document.createElement("button");
        btnPause.className = "nv-btn nv-principal";
        btnPause.setAttribute("data-role", "pause");
        btnPause.setAttribute("aria-label", "Pause");
        btnPause.innerHTML = SVG_PAUSE;
        btnPause.addEventListener("click", function (e) {
          e.stopPropagation();
          basculerPause();
        });

        var btnRalenti = document.createElement("button");
        btnRalenti.className = "nv-btn";
        btnRalenti.setAttribute("data-role", "ralenti");
        btnRalenti.setAttribute("aria-label", "Ralenti 0.7x");
        btnRalenti.innerHTML = SVG_TORTUE;
        btnRalenti.addEventListener("click", function (e) {
          e.stopPropagation();
          basculerRalenti();
        });

        var btnVitesse = document.createElement("button");
        btnVitesse.className = "nv-btn";
        btnVitesse.setAttribute("data-role", "vitesse");
        btnVitesse.setAttribute("aria-label", "Vitesse");
        btnVitesse.innerHTML = SVG_VITESSE + '<span data-role="vitesse-txt">1x</span>';
        btnVitesse.addEventListener("click", function (e) {
          e.stopPropagation();
          vitesseSuivante();
        });

        var espace = document.createElement("div");
        espace.className = "nv-espace";

        var btnFermer = document.createElement("button");
        btnFermer.className = "nv-btn";
        btnFermer.setAttribute("data-role", "fermer");
        btnFermer.setAttribute("aria-label", "Fermer");
        btnFermer.innerHTML = SVG_FERMER;
        btnFermer.addEventListener("click", function (e) {
          e.stopPropagation();
          arreterVoix();
        });

        rangee.appendChild(btnPause);
        rangee.appendChild(btnRalenti);
        rangee.appendChild(btnVitesse);
        rangee.appendChild(espace);
        rangee.appendChild(btnFermer);

        // --- Aperçu du début du message lu ---
        var apercu = document.createElement("div");
        apercu.className = "nv-apercu";
        var debut = String(texte || "").replace(/\s+/g, " ").slice(0, 60);
        if (texte.length > 60) debut += "…";
        apercu.innerHTML = "<b>Nova lit</b>";
        var spanTexte = document.createElement("span");
        spanTexte.textContent = debut;
        apercu.appendChild(spanTexte);

        barre.appendChild(rangee);
        barre.appendChild(apercu);
        document.body.appendChild(barre);

        etat.barre = barre;

        // Animation d'entrée
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            try { barre.classList.add("nv-visible"); } catch (e) {}
          });
        });
      } catch (e) {}
    }

    function mettreAJourBarre() {
      try {
        var barre = etat.barre;
        if (!barre) return;

        var btnPause = barre.querySelector("[data-role='pause']");
        var btnRalenti = barre.querySelector("[data-role='ralenti']");
        var txtVitesse = barre.querySelector("[data-role='vitesse-txt']");

        if (btnPause) {
          btnPause.innerHTML = etat.enPause ? SVG_PLAY : SVG_PAUSE;
          btnPause.setAttribute("aria-label", etat.enPause ? "Reprendre" : "Pause");
        }

        if (btnRalenti) {
          if (Math.abs(etat.vitesse - 0.7) < 0.01) btnRalenti.classList.add("nv-actif");
          else btnRalenti.classList.remove("nv-actif");
        }

        if (txtVitesse) {
          txtVitesse.textContent = String(etat.vitesse).replace(/^0\./, "0.") + "x";
        }
      } catch (e) {}
    }

    function fermerBarreHaut() {
      try {
        var barre = etat.barre;
        if (!barre) return;
        etat.barre = null;
        barre.classList.remove("nv-visible");
        setTimeout(function () {
          try { barre.parentNode && barre.parentNode.removeChild(barre); } catch (e) {}
        }, 320);
      } catch (e) {}
    }

    function fermerBarreHautImmediat() {
      try {
        if (etat.barre && etat.barre.parentNode) {
          etat.barre.parentNode.removeChild(etat.barre);
        }
        etat.barre = null;
      } catch (e) {}
    }

    /* =============================================================
       12. LA MODALE DE CHOIX : HOMME / FEMME
       ============================================================= */

    function fermerModale(callback) {
      try {
        var overlay = etat.modale;
        if (!overlay) { if (callback) callback(); return; }
        etat.modale = null;
        overlay.classList.remove("nv-ouvert");
        setTimeout(function () {
          try { overlay.parentNode && overlay.parentNode.removeChild(overlay); } catch (e) {}
          if (callback) callback();
        }, 320);
      } catch (e) {
        if (callback) callback();
      }
    }

    function creerCarteVoix(genre, emoji, titre, desc, choisi) {
      var carte = document.createElement("button");
      carte.className = "nv-carte" + (choisi ? " nv-choisi" : "");
      carte.setAttribute("data-genre", genre);

      carte.innerHTML =
        '<span class="nv-emoji">' + emoji + "</span>" +
        "<span>" +
          '<span class="nv-carte-titre">' + titre + "</span>" +
          '<span class="nv-carte-desc">' + desc + "</span>" +
        "</span>" +
        '<span class="nv-coche">' + SVG_COCHE + "</span>";

      carte.addEventListener("click", function (e) {
        e.stopPropagation();
        choisirGenre(genre);
      });

      return carte;
    }

    function choisirGenre(genre) {
      try {
        ecrireStockage(CLE_VOIX, genre);

        var texte = etat.texteEnAttente;
        etat.texteEnAttente = "";

        // La page se ferme, PUIS la voix démarre
        fermerModale(function () {
          try { parler(texte, genre); } catch (e) {}
        });
      } catch (e) {}
    }

    function activerGlisserPourFermer(sheet) {
      try {
        var departY = 0;
        var decalage = 0;
        var actif = false;

        sheet.addEventListener("touchstart", function (e) {
          try {
            departY = e.touches[0].clientY;
            decalage = 0;
            actif = true;
            sheet.style.transition = "none";
          } catch (err) {}
        }, { passive: true });

        sheet.addEventListener("touchmove", function (e) {
          try {
            if (!actif) return;
            var dy = e.touches[0].clientY - departY;
            decalage = dy > 0 ? dy : 0;
            sheet.style.transform = "translateY(" + decalage + "px)";
          } catch (err) {}
        }, { passive: true });

        sheet.addEventListener("touchend", function () {
          try {
            if (!actif) return;
            actif = false;
            sheet.style.transition = "";
            if (decalage > 110) {
              sheet.style.transform = "";
              etat.texteEnAttente = "";
              fermerModale();
            } else {
              sheet.style.transform = "";
            }
          } catch (err) {}
        }, { passive: true });
      } catch (e) {}
    }

    function ouvrirModaleChoixVoix(texteMessage) {
      try {
        // Une seule modale à la fois
        if (etat.modale) {
          try { etat.modale.parentNode.removeChild(etat.modale); } catch (e) {}
          etat.modale = null;
        }

        etat.texteEnAttente = texteMessage;

        var choixActuel = lireStockage(CLE_VOIX, "");

        var overlay = document.createElement("div");
        overlay.className = "nv-overlay";
        overlay.setAttribute("data-nova-voix", "modale");

        var sheet = document.createElement("div");
        sheet.className = "nv-sheet";

        // Petite barre de drag au centre en haut
        var drag = document.createElement("div");
        drag.className = "nv-drag";

        var titre = document.createElement("h3");
        titre.className = "nv-titre";
        titre.textContent = "Choisis la voix de Nova";

        var sous = document.createElement("p");
        sous.className = "nv-sous";
        sous.textContent = "Nova va lire ce message à voix haute";

        var carteHomme = creerCarteVoix(
          "homme", "👨", "Voix Homme", "Grave et calme", choixActuel === "homme"
        );
        var carteFemme = creerCarteVoix(
          "femme", "👩", "Voix Femme", "Douce et chaleureuse", choixActuel === "femme"
        );

        sheet.appendChild(drag);
        sheet.appendChild(titre);
        sheet.appendChild(sous);
        sheet.appendChild(carteHomme);
        sheet.appendChild(carteFemme);
        overlay.appendChild(sheet);

        // Clic dans le vide = fermer sans parler
        overlay.addEventListener("click", function (e) {
          if (e.target === overlay) {
            etat.texteEnAttente = "";
            fermerModale();
          }
        });

        document.body.appendChild(overlay);
        etat.modale = overlay;

        activerGlisserPourFermer(sheet);

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            try { overlay.classList.add("nv-ouvert"); } catch (e) {}
          });
        });
      } catch (e) {}
    }

    /* =============================================================
       13. BRANCHEMENT DE L'ICÔNE HAUT-PARLEUR (délégation de clic)
       ============================================================= */

    function gererClicHautParleur(evenement) {
      try {
        var cible = evenement.target;
        if (!cible || !cible.closest) return;

        // Les éléments du module eux-mêmes sont ignorés
        if (cible.closest("[data-nova-voix]")) return;

        var svg = cible.closest("svg");

        // Le clic peut tomber sur un bouton qui contient le svg
        if (!svg) {
          var bouton = cible.closest("button,[role='button']");
          if (bouton) svg = bouton.querySelector("svg");
        }
        if (!svg) return;

        if (!estIconeHautParleur(svg)) return;

        var texte = trouverTexteMessage(svg);
        if (!texte) return; // on ne casse rien si on ne trouve pas

        // On neutralise l'ancien comportement "mort"
        evenement.preventDefault();
        evenement.stopPropagation();
        if (evenement.stopImmediatePropagation) evenement.stopImmediatePropagation();

        // Si on coupe une lecture, on l'arrête avant de rouvrir
        if (etat.enLecture) arreterVoix();

        ouvrirModaleChoixVoix(texte);
      } catch (e) {
        // Jamais d'erreur visible : l'app continue
      }
    }

    function brancherHautParleur() {
      try {
        // Phase de capture : on passe AVANT les anciens handlers
        document.addEventListener("click", gererClicHautParleur, true);
      } catch (e) {}
    }

    /* =============================================================
       14. MICRO DANS LA ZONE DE SAISIE (dictée fr-FR) - SUPPRIMÉ
       ============================================================= */
    /* [SUPPRESSION MICRO] Toute la section 14 est neutralisée.
       Les fonctions ci-dessous restent présentes pour ne pas casser
       les appels existants, mais elles ne font plus rien. */

    function trouverZoneSaisie() {
      try { return null; } catch (e) { return null; }
    }

    function lireValeurSaisie(el) {
      try { return ""; } catch (e) { return ""; }
    }

    function ecrireValeurSaisie(el, valeur) {
      try {} catch (e) {}
    }

    function positionnerMicro() {
      try {} catch (e) {}
    }

    function mettreAJourMicro() {
      try {} catch (e) {}
    }

    function arreterDictee() {
      try {} catch (e) {}
    }

    function demarrerDictee() {
      try {} catch (e) {}
    }

    function basculerDictee() {
      try {} catch (e) {}
    }

    function installerMicro() {
      return; // MICRO SUPPRIMÉ - ne crée plus aucun bouton micro
    }

    /* =============================================================
       15. DÉMARRAGE DU MODULE
       ============================================================= */

    function demarrer() {
      try {
        injecterStyles();
        preChargerVoix();
        brancherHautParleur();
        installerMicro();

        // Sécurité : on coupe la voix si la page se ferme
        window.addEventListener("beforeunload", function () {
          try { window.speechSynthesis.cancel(); } catch (e) {}
        });
      } catch (e) {}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", demarrer);
    } else {
      demarrer();
    }

  } catch (erreurGlobale) {
    // Si quoi que ce soit échoue, l'app continue normalement.
    try { console.warn("[update.voix.js] module désactivé :", erreurGlobale); } catch (e) {}
  }
})();
