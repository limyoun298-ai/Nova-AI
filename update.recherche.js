/* ============================================================
   NOVA AI — UPDATE.RECHERCHE.JS
   VERSION : 3.0
   MODULE : RECHERCHE INTERNET AUTOMATIQUE

   OBJECTIFS :
   1. Recherche Internet gratuite.
   2. Informations complémentaires via DuckDuckGo.
   3. Actualités via Google News.
   4. Informations via Wikipédia.
   5. Météo en direct via Open-Meteo.
   6. Connexion automatique à callNovaAI.
   7. Transmission des informations au cerveau de NOVA.
   8. Conservation des messages et images.
   9. Cache intelligent.
   10. Protection contre les erreurs.

   AUCUNE CLE API NECESSAIRE.
   AUCUNE MODIFICATION DE SUPABASE.
   AUCUNE MODIFICATION DE POLLINATIONS.

   Si ce module échoue, NOVA continue normalement.
============================================================ */

(function () {
  "use strict";

  /* ==========================================================
     PROTECTION GENERALE
  ========================================================== */

  if (window.NOVA_RECHERCHE_V3) return;

  window.NOVA_RECHERCHE_V3 = true;

  try {

    /* ========================================================
       CONFIGURATION
    ======================================================== */

    var TIMEOUT = 9000;
    var CACHE_MS = 10 * 60 * 1000;

    var cache = {};

    var occupe = false;

    var barre = null;

    var derniereRecherche = "";

    /* ========================================================
       OUTILS GENERAUX
    ======================================================== */

    function pause(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }

    function nettoyerTexte(t) {
      return String(t || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function attendreConnexion() {

      return new Promise(function (resolve) {

        if (navigator.onLine !== false) {
          resolve();
          return;
        }

        var fini = false;

        function terminer() {

          if (fini) return;

          fini = true;

          window.removeEventListener("online", terminer);

          resolve();
        }

        window.addEventListener("online", function () {
          setTimeout(terminer, 1000);
        }, { once: true });

        setTimeout(terminer, 15000);

      });

    }

    /* ========================================================
       REQUETES HTTP SECURISEES
    ======================================================== */

    function requete(url, mode) {

      return new Promise(function (resolve) {

        var termine = false;

        var controle = null;

        var timer = null;

        function finir(resultat) {

          if (termine) return;

          termine = true;

          if (timer) clearTimeout(timer);

          resolve(resultat);

        }

        try {

          if (typeof AbortController !== "undefined") {
            controle = new AbortController();
          }

          timer = setTimeout(function () {

            try {
              if (controle) controle.abort();
            } catch (e) {}

            finir(null);

          }, TIMEOUT);

          var options = {};

          if (controle) {
            options.signal = controle.signal;
          }

          fetch(url, options)

            .then(function (response) {

              if (!response || !response.ok) {
                return null;
              }

              if (mode === "text") {
                return response.text();
              }

              return response.json();

            })

            .then(function (resultat) {

              finir(resultat);

            })

            .catch(function () {

              finir(null);

            });

        } catch (e) {

          finir(null);

        }

      });

    }

    function getJSON(url) {
      return requete(url, "json");
    }

    function getTexte(url) {
      return requete(url, "text");
    }

    /* ========================================================
       CACHE
    ======================================================== */

    function lireCache(cle) {

      try {

        var element = cache[cle];

        if (!element) return null;

        if (Date.now() - element.date > CACHE_MS) {

          delete cache[cle];

          return null;

        }

        return element.valeur;

      } catch (e) {

        return null;

      }

    }

    function ecrireCache(cle, valeur) {

      try {

        cache[cle] = {
          valeur: valeur,
          date: Date.now()
        };

      } catch (e) {}

    }

    /* ========================================================
       DETECTION DES QUESTIONS NECESSITANT UNE RECHERCHE
    ======================================================== */

    var RE_FRAIS = new RegExp(
      [
        "m[ée]t[ée]o",
        "temps qu.il fait",
        "il pleut",
        "pluie",
        "temp[ée]rature",
        "score",
        "match",
        "r[ée]sultat",
        "classement",
        "actualit",
        "actu\\\\b",
        "news",
        "derni[eè]re",
        "aujourd",
        "ce soir",
        "demain",
        "cette semaine",
        "en ce moment",
        "maintenant",
        "prix",
        "cours d",
        "taux",
        "combien co[uû]te",
        "2025",
        "2026",
        "2027",
        "actuel",
        "qui est le",
        "qui est la",
        "champion",
        "vient de",
        "nouveau",
        "nouvelle",
        "sorti",
        "sortie",
        "recherche",
        "cherche sur",
        "sur internet",
        "sur le web",
        "informations r[ée]centes",
        "derniers",
        "derni[eè]res",
        "en direct",
        "version actuelle"
      ].join("|"),
      "i"
    );

    var RE_METEO =
      /(m[ée]t[ée]o|temps qu.il fait|il pleut|pluie|temp[ée]rature)/i;

    /* ========================================================
       DETECTION DU LIEU
    ======================================================== */

    function lieuMeteo(texte) {

      try {

        var m = texte.match(
          /(?:\bà|\ba|\bde|\bpour|\bsur|\ben|\bau|\bdu)\s+([A-Za-zÀ-ÿ'\- ]{2,35})/i
        );

        if (m && m[1]) {

          var lieu = m[1];

          lieu = lieu.replace(
            /\b(aujourd'hui|aujourd|demain|maintenant|ce soir|ce matin|svp|stp|please)\b.*$/i,
            ""
          );

          lieu = lieu.replace(/[?!.:,;]/g, "").trim();

          if (lieu.length > 1) {
            return lieu;
          }

        }

      } catch (e) {}

      return "Kolwezi";

    }

    /* ========================================================
       METEO — OPEN METEO
    ======================================================== */

    async function meteo(texte) {

      try {

        var lieu = lieuMeteo(texte);

        var cle = "meteo:" + lieu.toLowerCase();

        var ancien = lireCache(cle);

        if (ancien) return ancien;

        var geo = await getJSON(
          "https://geocoding-api.open-meteo.com/v1/search?name=" +
          encodeURIComponent(lieu) +
          "&count=1&language=fr&format=json"
        );

        if (!geo || !geo.results || !geo.results.length) {
          return "";
        }

        var ville = geo.results[0];

        var donnees = await getJSON(
          "https://api.open-meteo.com/v1/forecast?" +
          "latitude=" + ville.latitude +
          "&longitude=" + ville.longitude +
          "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m" +
          "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
          "&timezone=auto&forecast_days=2"
        );

        if (!donnees || !donnees.current) {
          return "";
        }

        var c = donnees.current;

        var resultat =
          "METEO EN DIRECT : " +
          ville.name +
          (ville.country ? " (" + ville.country + ")" : "") +
          "\nTemperature : " + c.temperature_2m + " °C" +
          "\nHumidite : " + c.relative_humidity_2m + "%" +
          "\nVent : " + c.wind_speed_10m + " km/h" +
          "\nPrecipitations : " + c.precipitation + " mm";

        if (donnees.daily) {

          var j = donnees.daily;

          resultat +=
            "\nAujourd'hui : maximum " +
            j.temperature_2m_max[0] +
            " °C, minimum " +
            j.temperature_2m_min[0] +
            " °C.";

          resultat +=
            "\nProbabilite de pluie : " +
            j.precipitation_probability_max[0] +
            "%.";

          if (j.temperature_2m_max[1] !== undefined) {

            resultat +=
              "\nDemain : maximum " +
              j.temperature_2m_max[1] +
              " °C, minimum " +
              j.temperature_2m_min[1] +
              " °C.";

          }

        }

        resultat += "\nSource : Open-Meteo.";

        ecrireCache(cle, resultat);

        return resultat;

      } catch (e) {

        return "";

      }

    }

    /* ========================================================
       WIKIPEDIA
    ======================================================== */

    async function wikipedia(question) {

      try {

        var cle = "wiki:" + question.toLowerCase();

        var ancien = lireCache(cle);

        if (ancien) return ancien;

        var url =
          "https://fr.wikipedia.org/w/api.php?" +
          "action=query" +
          "&generator=search" +
          "&gsrsearch=" + encodeURIComponent(question) +
          "&gsrlimit=3" +
          "&prop=extracts" +
          "&exintro=1" +
          "&explaintext=1" +
          "&exchars=900" +
          "&format=json" +
          "&origin=*";

        var data = await getJSON(url);

        if (!data || !data.query || !data.query.pages) {
          return "";
        }

        var pages = data.query.pages;

        var resultat = [];

        Object.keys(pages).forEach(function (id) {

          var p = pages[id];

          if (p && p.extract) {

            resultat.push(
              "WIKIPEDIA : " +
              p.title +
              "\n" +
              p.extract
            );

          }

        });

        var texte = resultat.join("\n\n");

        if (texte) {
          ecrireCache(cle, texte);
        }

        return texte;

      } catch (e) {

        return "";

      }

    }

    /* ========================================================
       DUCKDUCKGO — RECHERCHE COMPLEMENTAIRE
    ======================================================== */

    async function duckduckgo(question) {

      try {

        var cle = "ddg:" + question.toLowerCase();

        var ancien = lireCache(cle);

        if (ancien) return ancien;

        var url =
          "https://api.duckduckgo.com/?" +
          "q=" + encodeURIComponent(question) +
          "&format=json" +
          "&no_html=1" +
          "&skip_disambig=0";

        var data = await getJSON(url);

        if (!data) return "";

        var resultat = [];

        if (data.Heading && data.AbstractText) {

          resultat.push(
            "DUCKDUCKGO : " +
            data.Heading +
            "\n" +
            data.AbstractText
          );

          if (data.AbstractURL) {
            resultat.push("Source : " + data.AbstractURL);
          }

        }

        if (data.Answer) {

          resultat.push(
            "REPONSE DIRECTE : " + data.Answer
          );

        }

        if (data.RelatedTopics) {

          data.RelatedTopics.forEach(function (item) {

            if (
              item &&
              item.Text &&
              resultat.length < 5
            ) {

              resultat.push(
                "Information complémentaire : " +
                item.Text
              );

            }

          });

        }

        var texte = resultat.join("\n\n");

        if (texte) {
          ecrireCache(cle, texte);
        }

        return texte;

      } catch (e) {

        return "";

      }

    }

    /* ========================================================
       ACTUALITES — GOOGLE NEWS RSS
    ======================================================== */

    async function actualites(question) {

      try {

        var cle = "news:" + question.toLowerCase();

        var ancien = lireCache(cle);

        if (ancien) return ancien;

        var rss =
          "https://news.google.com/rss/search?q=" +
          encodeURIComponent(question) +
          "&hl=fr&gl=FR&ceid=FR:fr";

        var proxy =
          "https://api.allorigins.win/raw?url=" +
          encodeURIComponent(rss);

        var xml = await getTexte(proxy);

        if (!xml) return "";

        var doc = new DOMParser().parseFromString(
          xml,
          "text/xml"
        );

        if (doc.querySelector("parsererror")) {
          return "";
        }

        var items = doc.getElementsByTagName("item");

        var resultat = [];

        for (
          var i = 0;
          i < items.length && resultat.length < 5;
          i++
        ) {

          var titre = items[i].getElementsByTagName("title")[0];

          var date = items[i].getElementsByTagName("pubDate")[0];

          var lien = items[i].getElementsByTagName("link")[0];

          if (titre) {

            var ligne = "- " + titre.textContent;

            if (date) {
              ligne += "\nDate : " + date.textContent;
            }

            if (lien) {
              ligne += "\nSource : " + lien.textContent;
            }

            resultat.push(ligne);

          }

        }

        var texte = resultat.length
          ? "ACTUALITES RECENTES :\n" + resultat.join("\n\n")
          : "";

        if (texte) {
          ecrireCache(cle, texte);
        }

        return texte;

      } catch (e) {

        return "";

      }

    }

    /* ========================================================
       MOTEUR PRINCIPAL DE RECHERCHE
    ======================================================== */

    async function chercher(texte) {

      try {

        var question = nettoyerTexte(texte).slice(0, 200);

        if (!question) return "";

        if (RE_METEO.test(question)) {

          return await meteo(question);

        }

        var recherches = await Promise.all([

          duckduckgo(question).catch(function () {
            return "";
          }),

          wikipedia(question).catch(function () {
            return "";
          }),

          actualites(question).catch(function () {
            return "";
          })

        ]);

        var resultat = recherches.filter(function (x) {
          return !!x;
        });

        if (!resultat.length) return "";

        return resultat.join("\n\n").slice(0, 5500);

      } catch (e) {

        return "";

      }

    }

    /* ========================================================
       BARRE DE RECHERCHE DISCRETE
    ======================================================== */

    function zone() {

      return (
        document.getElementById("chat-box") ||
        document.getElementById("messages") ||
        document.getElementById("chat")
      );

    }

    function barreAfficher(texte) {

      try {

        var z = zone();

        if (!z) return;

        if (!barre || !document.body.contains(barre)) {

          barre = document.createElement("div");

          barre.id = "nova-recherche-barre";

          var s = barre.style;

          s.display = "inline-block";

          s.background = "rgba(120,120,128,0.12)";

          s.color = "rgba(150,150,160,0.85)";

          s.fontSize = "12px";

          s.padding = "6px 14px";

          s.borderRadius = "999px";

          s.margin = "6px 0";

          s.fontStyle = "italic";

          s.opacity = "0.85";

          s.transition = "opacity .3s";

          s.maxWidth = "85%";

          s.whiteSpace = "nowrap";

          s.overflow = "hidden";

          s.textOverflow = "ellipsis";

          z.appendChild(barre);

        }

        barre.textContent = texte;

        z.scrollTop = z.scrollHeight;

      } catch (e) {}

    }

    function barreCacher() {

      try {

        if (barre && barre.parentNode) {
          barre.parentNode.removeChild(barre);
        }

        var ancienne = document.getElementById(
          "nova-recherche-barre"
        );

        if (ancienne && ancienne.parentNode) {
          ancienne.parentNode.removeChild(ancienne);
        }

      } catch (e) {}

      barre = null;

    }

    /* ========================================================
       EXTRACTION DU MESSAGE UTILISATEUR
    ======================================================== */

    function lireContenu(contenu) {

      if (typeof contenu === "string") {
        return contenu;
      }

      if (Array.isArray(contenu)) {

        return contenu.map(function (partie) {

          if (typeof partie === "string") {
            return partie;
          }

          if (partie && typeof partie.text === "string") {
            return partie.text;
          }

          return "";

        }).join(" ");

      }

      return "";

    }

    function lireMessages(messages) {

      if (!Array.isArray(messages)) return "";

      for (var i = messages.length - 1; i >= 0; i--) {

        var message = messages[i];

        if (
          message &&
          message.role === "user"
        ) {

          return lireContenu(message.content);

        }

      }

      return "";

    }

    function lireUser(args) {

      try {

        for (var i = 0; i < args.length; i++) {

          var objet = args[i];

          if (
            objet &&
            typeof objet === "object" &&
            Array.isArray(objet.messages)
          ) {

            var q = lireMessages(objet.messages);

            if (q) return q;

          }

          if (Array.isArray(objet)) {

            var qa = lireMessages(objet);

            if (qa) return qa;

          }

        }

        for (var j = args.length - 1; j >= 0; j--) {

          if (
            typeof args[j] === "string" &&
            args[j].trim()
          ) {

            return args[j];

          }

        }

      } catch (e) {}

      return "";

    }

    /* ========================================================
       REMPLACEMENT SANS DETRUIRE L'HISTORIQUE
    ======================================================== */

    function ajouterInfosAuContenu(contenu, texte) {

      var ajout = "\n\n" + texte;

      if (typeof contenu === "string") {

        return contenu + ajout;

      }

      if (Array.isArray(contenu)) {

        var copie = contenu.slice();

        copie.push({
          type: "text",
          text: ajout
        });

        return copie;

      }

      return texte;

    }

    function remplacerUser(args, nouveau) {

      try {

        var copie = Array.prototype.slice.call(args);

        for (var i = 0; i < copie.length; i++) {

          var objet = copie[i];

          if (
            objet &&
            typeof objet === "object" &&
            Array.isArray(objet.messages)
          ) {

            var messages = objet.messages.slice();

            for (var j = messages.length - 1; j >= 0; j--) {

              if (
                messages[j] &&
                messages[j].role === "user"
              ) {

                var ancien = messages[j];

                messages[j] = Object.assign(
                  {},
                  ancien,
                  {
                    content: ajouterInfosAuContenu(
                      ancien.content,
                      nouveau
                    )
                  }
                );

                copie[i] = Object.assign(
                  {},
                  objet,
                  {
                    messages: messages
                  }
                );

                return copie;

              }

            }

          }

          if (Array.isArray(objet)) {

            var liste = objet.slice();

            for (var k = liste.length - 1; k >= 0; k--) {

              if (
                liste[k] &&
                liste[k].role === "user"
              ) {

                liste[k] = Object.assign(
                  {},
                  liste[k],
                  {
                    content: ajouterInfosAuContenu(
                      liste[k].content,
                      nouveau
                    )
                  }
                );

                copie[i] = liste;

                return copie;

              }

            }

          }

        }

        /* Mode simple : callNovaAI(question) */

        for (var n = copie.length - 1; n >= 0; n--) {

          if (
            typeof copie[n] === "string" &&
            copie[n].trim()
          ) {

            copie[n] = nouveau;

            return copie;

          }

        }

        return copie;

      } catch (e) {

        return Array.prototype.slice.call(args);

      }

    }

    /* ========================================================
       PREPARATION DES INFORMATIONS POUR NOVA
    ======================================================== */

    function construire(question, infos) {

      var d = new Date();

      var date =
        d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) +
        " à " +
        d.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        });

      return (
        "\n\n" +
        "[INFORMATIONS INTERNET RECUPEREES PAR NOVA]\n" +
        "Date de recherche : " + date + "\n\n" +
        infos +
        "\n\n" +
        "[INSTRUCTIONS POUR NOVA]\n" +
        "Tu disposes maintenant d'informations récupérées " +
        "automatiquement sur Internet.\n" +
        "Utilise ces informations pour répondre naturellement " +
        "à la question de l'utilisateur.\n" +
        "Ne prétends pas avoir vérifié une information " +
        "qui n'apparaît pas dans les résultats.\n" +
        "Si les résultats sont insuffisants, indique-le honnêtement.\n" +
        "Conserve les sources disponibles.\n" +
        "Ne répète pas inutilement les informations techniques.\n" +
        "Question originale : " + question
      );

    }

    /* ========================================================
       CONNEXION AU CERVEAU DE NOVA
    ======================================================== */

    function brancher() {

      if (typeof window.callNovaAI !== "function") {
        return false;
      }

      if (window.callNovaAI.__nr3) {
        return true;
      }

      var ancienne = window.callNovaAI;

      var nouvelle = async function () {

        var args = Array.prototype.slice.call(arguments);

        var contexte = this;

        var question = "";

        try {

          if (occupe) {
            return ancienne.apply(contexte, args);
          }

          question = lireUser(args);

          if (
            !question ||
            !RE_FRAIS.test(question)
          ) {

            return ancienne.apply(contexte, args);

          }

          if (
            question === derniereRecherche
          ) {

            return ancienne.apply(contexte, args);

          }

          occupe = true;

          derniereRecherche = question;

          var infos = "";

          try {

            barreAfficher("Recherche en cours...");

            await attendreConnexion();

            barreAfficher("Recherche des informations...");

            infos = await chercher(question);

            if (infos) {

              barreAfficher("Informations récupérées...");

              await pause(300);

            }

          } catch (rechercheErreur) {

            infos = "";

          }

          barreCacher();

          /*
             IMPORTANT :
             callNovaAI original est appelé UNE SEULE FOIS.
             Si la recherche échoue, le message original
             est transmis normalement.
          */

          var nouveauxArguments = infos
            ? remplacerUser(
                args,
                construire(question, infos)
              )
            : args;

          try {

            return await ancienne.apply(
              contexte,
              nouveauxArguments
            );

          } finally {

            occupe = false;

            barreCacher();

          }

        } catch (erreur) {

          occupe = false;

          barreCacher();

          /*
             Protection finale :
             ne pas bloquer le fonctionnement normal.
          */

          return ancienne.apply(
            contexte,
            args
          );

        }

      };

      nouvelle.__nr3 = true;

      window.callNovaAI = nouvelle;

      return true;

    }

    /* ========================================================
       DEMARRAGE AUTOMATIQUE
    ======================================================== */

    function demarrer() {

      var essais = 0;

      var maximum = 1200;

      var timer = setInterval(function () {

        essais++;

        try {

          if (brancher()) {

            clearInterval(timer);

            console.log(
              "NOVA RECHERCHE V3 : CONNECTEE"
            );

            return;

          }

        } catch (e) {}

        if (essais >= maximum) {

          clearInterval(timer);

          console.warn(
            "NOVA RECHERCHE : callNovaAI non detecte."
          );

        }

      }, 250);

    }

    /* ========================================================
       API PUBLIQUE DU MODULE
    ======================================================== */

    window.NovaRecherche = {

      rechercher: chercher,

      effacerCache: function () {

        cache = {};

      },

      statut: function () {

        return {

          actif: true,

          connecte:
            typeof window.callNovaAI === "function" &&
            !!window.callNovaAI.__nr3,

          rechercheEnCours: occupe

        };

      }

    };

    /* ========================================================
       INITIALISATION
    ======================================================== */

    if (document.readyState === "loading") {

      document.addEventListener(
        "DOMContentLoaded",
        demarrer,
        { once: true }
      );

    } else {

      demarrer();

    }

  } catch (erreurGlobal) {

    /*
       SECURITE MAXIMALE :
       une erreur dans ce module ne doit pas
       arrêter le reste de NOVA AI.
    */

    console.warn(
      "NOVA RECHERCHE : module désactivé sans bloquer NOVA.",
      erreurGlobal
    );

  }

})();
