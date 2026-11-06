/* ============================================================
   Nova AI - update.recherche.js - Version 1.2
   Recherche en direct + Connexion stable + Ecriture en arriere-plan
   Createur: M-ei Ho
   REGLE D'OR: Ne touche PAS a index.html, ni a update.comportement.js, ni a update tableaux.js
   A: Tu mets juste une ligne dans index.html en bas: <script src="update.recherche.js"></script>
   B: Tout le reste est deja branche dans ce fichier. Tu n'as rien a brancher toi-meme.
   Si ce fichier plante, Nova continue toute seule, juste sans recherche en direct
   ============================================================ */

if (window.NOVA_RECHERCHE_INITIALISE) {
} else {
  window.NOVA_RECHERCHE_INITIALISE = true;

  (function () {
    "use strict";
    try {

      /* ---------- 1. CONFIG ---------- */
      var NOVA_RECHERCHE = {
        delaiCache: 10 * 60 * 1000,
        timeout: 8000,
        maxResultats: 4,
        cleEcriture: "nova_ecriture_en_cours",
        delaiStable: 1500,
        consigneRecherche:
          "\n\n[REGLE RECHERCHE EN DIRECT]\n" +
          "Si la question a besoin d'une info fraiche, recente, qui change avec le temps, comme une meteo d'aujourd'hui, un score, une news, un prix, un evenement de 2026, une personne ou un fait qui a pu changer, " +
          "ne reponds PAS tout de suite et n'invente JAMAIS. " +
          "Reponds uniquement sur une seule ligne: [[RECHERCHE: ce qu'il faut chercher en quelques mots]]. " +
          "Sinon, si c'est une discussion normale, une question de culture, un conseil, une idee, reponds normalement sans recherche.\n" +
          "Si on te donne deja des [INFOS EN DIRECT], utilise-les pour repondre, cite la date, et ne refais pas une autre recherche."
      };

      /* ---------- 1.5 CONNEXION - A : NE PAS ENVOYER SANS CONNEXION STABLE ---------- */
      var connexionStable = true;
      var connexionTimer = null;
      var enAttenteConnexion = [];

      function estEnLigne() {
        try {
          if (typeof navigator !== "undefined" && "onLine" in navigator) {
            return navigator.onLine;
          }
          return true;
        } catch (e) { return true; }
      }

      function mettreAJourStabilite(enLigne) {
        try {
          if (connexionTimer) { clearTimeout(connexionTimer); connexionTimer = null; }
          if (!enLigne) {
            connexionStable = false;
            // On previent Nova : elle doit arreter d'ecrire
            try { window.dispatchEvent(new CustomEvent("nova-connexion-coupee")); } catch (e) {}
            return;
          }
          // On attend un peu pour etre sur que c'est stable, pas juste un flash
          connexionTimer = setTimeout(function () {
            connexionStable = true;
            try { window.dispatchEvent(new CustomEvent("nova-connexion-retablie")); } catch (e) {}
            // On reveille tous ceux qui attendaient
            var liste = enAttenteConnexion.slice();
            enAttenteConnexion = [];
            for (var i = 0; i < liste.length; i++) {
              try { liste[i](); } catch (e) {}
            }
          }, NOVA_RECHERCHE.delaiStable);
        } catch (e) {}
      }

      function attendreConnexionStable() {
        return new Promise(function (resolve) {
          try {
            if (estEnLigne() && connexionStable) { resolve(true); return; }
            // Si on est hors ligne, on attend le retour, max 60 secondes
            var dejaResolu = false;
            var finir = function () {
              if (!dejaResolu) { dejaResolu = true; resolve(true); }
            };
            enAttenteConnexion.push(finir);
            setTimeout(finir, 60000);
          } catch (e) { resolve(true); }
        });
      }

      function initConnexion() {
        try {
          connexionStable = estEnLigne();
          window.addEventListener("online", function () { mettreAJourStabilite(true); });
          window.addEventListener("offline", function () { mettreAJourStabilite(false); });
          // Si on est deja en ligne, on verifie la stabilite
          if (connexionStable) {
            mettreAJourStabilite(true);
          }
        } catch (e) {}
      }

      /* ---------- 1.6 ECRITURE EN ARRIERE-PLAN - B : CONTINUER MEME SI APP FERMEE ---------- */
      function sauvegarderEcriture(prompt, etape) {
        try {
          var data = { prompt: String(prompt || "").slice(0, 1000), etape: etape || "en_cours", t: Date.now() };
          localStorage.setItem(NOVA_RECHERCHE.cleEcriture, JSON.stringify(data));
        } catch (e) {}
      }

      function effacerEcriture() {
        try { localStorage.removeItem(NOVA_RECHERCHE.cleEcriture); } catch (e) {}
      }

      function lireEcriture() {
        try {
          var raw = localStorage.getItem(NOVA_RECHERCHE.cleEcriture);
          if (!raw) { return null; }
          var d = JSON.parse(raw);
          if (!d || !d.prompt) { return null; }
          // Si c'est trop vieux, plus de 15 minutes, on abandonne
          if (Date.now() - (d.t || 0) > 15 * 60 * 1000) { effacerEcriture(); return null; }
          return d;
        } catch (e) { return null; }
      }

      function zoneChat() {
        return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
      }

      function afficherDansChat(texte, role) {
        try {
          var zone = zoneChat();
          if (!zone) { return; }
          var div = document.createElement("div");
          div.className = role === "user" ? "msg-user" : "msg-nova";
          div.textContent = texte;
          zone.appendChild(div);
          zone.scrollTop = zone.scrollHeight;
        } catch (e) {}
      }

      // B : Quand l'utilisateur rouvre l'appli, on reprend la ou Nova s'etait arretee
      async function reprendreEcritureSiBesoin() {
        try {
          var enCours = lireEcriture();
          if (!enCours) { return; }
          // On attend que la connexion soit stable avant de reprendre
          await attendreConnexionStable();
          if (typeof window.callNovaAI !== "function") { return; }
          // On evite de relancer 2 fois la meme chose
          var prompt = enCours.prompt;
          effacerEcriture();
          // On relance la reponse en arriere-plan
          sauvegarderEcriture(prompt, "reprise");
          var res = await window.callNovaAI(prompt);
          var txt = extraireTexte(res);
          if (txt) {
            afficherDansChat(txt, "nova");
            // Si la voix est active, Nova parle aussi
            try {
              if (window.NovaComportement && window.NovaComportement.parler) {
                window.NovaComportement.parler(txt);
              }
            } catch (e) {}
          }
          effacerEcriture();
        } catch (e) {}
      }

      /* ---------- 2. CACHE ---------- */
      var cache = {};
      function lireCache(cle) {
        try {
          var e = cache[cle];
          if (!e) { return null; }
          if (Date.now() - e.t > NOVA_RECHERCHE.delaiCache) { delete cache[cle]; return null; }
          return e.v;
        } catch (e) { return null; }
      }
      function ecrireCache(cle, valeur) {
        try { cache[cle] = { v: valeur, t: Date.now() }; } catch (e) {}
      }

      function extraireTexte(res) {
        if (typeof res === "string") { return res; }
        if (res && typeof res === "object") {
          return res.text || res.reply || res.content || res.message || res.answer || "";
        }
        return "";
      }

      function fetchAvecTimeout(url) {
        return new Promise(function (resolve) {
          try {
            var ctrl = null;
            var timer = null;
            if (typeof AbortController !== "undefined") {
              ctrl = new AbortController();
              timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, NOVA_RECHERCHE.timeout);
            }
            var opts = ctrl ? { signal: ctrl.signal } : {};
            fetch(url, opts).then(function (r) {
              if (timer) { clearTimeout(timer); }
              resolve(r);
            }).catch(function () {
              if (timer) { clearTimeout(timer); }
              resolve(null);
            });
          } catch (e) { resolve(null); }
        });
      }

      /* ---------- 2.5 INDICATEUR REALISTE ---------- */
      var indicateurEl = null;
      var indicateurTimer = null;
      var ecritureEnPause = false;

      function creerIndicateur() {
        try {
          supprimerIndicateur();
          var zone = zoneChat();
          if (!zone) { return; }
          var div = document.createElement("div");
          div.id = "nova-recherche-indicateur";
          div.className = "msg-nova nova-recherche-indicateur";
          div.textContent = "Recherche en direct...";
          div.style.display = "inline-block";
          div.style.background = "#f0f0f1";
          div.style.color = "#8a8a8e";
          div.style.fontSize = "12px";
          div.style.padding = "8px 14px";
          div.style.borderRadius = "20px";
          div.style.margin = "6px 0";
          div.style.maxWidth = "85%";
          div.style.opacity = "0.9";
          div.style.fontStyle = "italic";
          div.style.whiteSpace = "nowrap";
          div.style.overflow = "hidden";
          div.style.textOverflow = "ellipsis";
          zone.appendChild(div);
          zone.scrollTop = zone.scrollHeight;
          indicateurEl = div;
          var etapes = [
            "Recherche en direct...",
            "Je recherche dans 4 documents...",
            "Je verifie...",
            "Verification...",
            "Reponse..."
          ];
          var idx = 0;
          indicateurTimer = setInterval(function () {
            try {
              // A : Si connexion coupee, on arrete d'avancer, on met en pause
              if (!connexionStable || !estEnLigne()) {
                if (indicateurEl && !ecritureEnPause) {
                  ecritureEnPause = true;
                  indicateurEl.textContent = "Connexion coupee, j'attends...";
                }
                return;
              }
              if (ecritureEnPause) {
                ecritureEnPause = false;
              }
              idx++;
              if (idx >= etapes.length) { idx = etapes.length - 1; }
              if (indicateurEl) {
                indicateurEl.textContent = etapes[idx];
                if (zone) { zone.scrollTop = zone.scrollHeight; }
              }
            } catch (e) {}
          }, 900);
        } catch (e) {}
      }

      function supprimerIndicateur() {
        try {
          if (indicateurTimer) { clearInterval(indicateurTimer); indicateurTimer = null; }
          if (indicateurEl && indicateurEl.parentNode) { indicateurEl.parentNode.removeChild(indicateurEl); }
          indicateurEl = null;
          ecritureEnPause = false;
          var vieux = document.getElementById("nova-recherche-indicateur");
          if (vieux && vieux.parentNode) { vieux.parentNode.removeChild(vieux); }
        } catch (e) {}
      }

      /* ---------- 3. SOURCES GRATUITES ---------- */
      async function chercherWikipedia(requete) {
        try {
          var enCache = lireCache("wiki:" + requete);
          if (enCache) { return enCache; }
          await attendreConnexionStable();
          var url = "https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(requete);
          var res = await fetchAvecTimeout(url);
          if (!res || !res.ok) { return ""; }
          var j = await res.json();
          if (!j || !j.extract) { return ""; }
          var txt = "Wikipedia - " + (j.title || requete) + " : " + j.extract.slice(0, 800);
          ecrireCache("wiki:" + requete, txt);
          return txt;
        } catch (e) { return ""; }
      }

      async function chercherDuckDuckGo(requete) {
        try {
          var enCache = lireCache("ddg:" + requete);
          if (enCache) { return enCache; }
          await attendreConnexionStable();
          var url = "https://api.duckduckgo.com/?q=" + encodeURIComponent(requete) + "&format=json&no_html=1&skip_disambig=1";
          var res = await fetchAvecTimeout(url);
          if (!res || !res.ok) { return ""; }
          var j = await res.json();
          var morceaux = [];
          if (j && j.AbstractText) { morceaux.push("Resume : " + j.AbstractText.slice(0, 800)); }
          if (j && Array.isArray(j.RelatedTopics)) {
            for (var i = 0; i < j.RelatedTopics.length && morceaux.length < 3; i++) {
              var t = j.RelatedTopics[i];
              if (t && t.Text) { morceaux.push(t.Text.slice(0, 400)); }
            }
          }
          var txt = morceaux.join("\n");
          if (txt) { ecrireCache("ddg:" + requete, txt); }
          return txt;
        } catch (e) { return ""; }
      }

      async function chercherMeteo(requete) {
        try {
          var q = String(requete || "").toLowerCase();
          var estMeteo = q.indexOf("meteo") !== -1 || q.indexOf("météo") !== -1 || q.indexOf("temps") !== -1 || q.indexOf("pluie") !== -1 || q.indexOf("climat") !== -1;
          if (!estMeteo) { return ""; }
          var lieu = String(requete || "").replace(/météo|meteo|temps|pluie|climat|aujourd'hui|demain|à|a|de|du|le|la|quel|quelle|fait-il/gi, " ").trim();
          if (!lieu) { lieu = "Kolwezi"; }
          var enCache = lireCache("meteo:" + lieu);
          if (enCache) { return enCache; }
          await attendreConnexionStable();
          var geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(lieu) + "&count=1&language=fr&format=json";
          var geoRes = await fetchAvecTimeout(geoUrl);
          if (!geoRes || !geoRes.ok) { return ""; }
          var geo = await geoRes.json();
          if (!geo || !geo.results || !geo.results.length) { return ""; }
          var lat = geo.results[0].latitude;
          var lon = geo.results[0].longitude;
          var nom = geo.results[0].name + (geo.results[0].country ? ", " + geo.results[0].country : "");
          var meteoUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=2";
          var mRes = await fetchAvecTimeout(meteoUrl);
          if (!mRes || !mRes.ok) { return ""; }
          var m = await mRes.json();
          if (!m || !m.current) { return ""; }
          var txt = "Meteo en direct pour " + nom + " : Actuellement " + m.current.temperature_2m + "°C, humidite " + m.current.relative_humidity_2m + "%, vent " + m.current.wind_speed_10m + " km/h, precipitations " + m.current.precipitation + " mm. Demain max " + (m.daily ? m.daily.temperature_2m_max[1] + "°C, min " + m.daily.temperature_2m_min[1] + "°C" : "") + ". Source: Open-Meteo, donnees du " + new Date().toLocaleDateString("fr-FR") + ".";
          ecrireCache("meteo:" + lieu, txt);
          return txt;
        } catch (e) { return ""; }
      }

      async function rechercherEnDirect(requete) {
        try {
          var cle = "all:" + requete;
          var deja = lireCache(cle);
          if (deja) { return deja; }
          await attendreConnexionStable();
          var results = await Promise.all([
            chercherWikipedia(requete),
            chercherDuckDuckGo(requete),
            chercherMeteo(requete)
          ]);
          var morceaux = [];
          for (var i = 0; i < results.length; i++) {
            if (results[i]) { morceaux.push(results[i]); }
          }
          var final = morceaux.join("\n\n").slice(0, 3000);
          if (final) { ecrireCache(cle, final); }
          return final;
        } catch (e) { return ""; }
      }

      /* ---------- 4. CAPE RECHERCHE - 2 TEMPS + CONNEXION + ARRIERE-PLAN ---------- */
      var interneRecherche = false;

      function extraireRequete(texte) {
        try {
          var m = String(texte || "").match(/\[\[RECHERCHE:\s*([\s\S]*?)\]\]/i);
          if (!m) { return null; }
          return m[1].trim().slice(0, 150);
        } catch (e) { return null; }
      }

      function retirerMarqueur(texte) {
        try { return String(texte || "").replace(/\[\[RECHERCHE:\s*[\s\S]*?\]\]/gi, "").trim(); } catch (e) { return texte; }
      }

      function texteUtilisateurDepuisArgs(args) {
        try {
          for (var i = 0; i < args.length; i++) {
            if (typeof args[i] === "string") { return args[i]; }
            if (args[i] && Array.isArray(args[i].messages)) {
              var msgs = args[i].messages;
              for (var j = msgs.length - 1; j >= 0; j--) {
                if (msgs[j] && msgs[j].role === "user") { return msgs[j].content || ""; }
              }
            }
          }
        } catch (e) {}
        return "";
      }

      function injecterContexte(args, requete, infos) {
        try {
          var dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " a " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          var bloc = "\n\n[INFOS EN DIRECT trouvees le " + dateStr + " pour la recherche : \"" + requete + "\"]\n" + infos + "\n[Fin des infos en direct. Maintenant reponds a la question avec ces infos, de facon naturelle, sans dire que tu as fait une recherche sauf si on te le demande. Si les infos ne suffisent pas, dis que tu n'as pas trouve.]\n\nQuestion originale : ";
          var copie = Array.prototype.slice.call(args);
          var fait = false;
          for (var i = 0; i < copie.length; i++) {
            var a = copie[i];
            if (typeof a === "string") {
              copie[i] = a + bloc + texteUtilisateurDepuisArgs(args);
              fait = true; break;
            }
            if (a && Array.isArray(a.messages)) {
              var msgs = a.messages.slice();
              msgs.push({ role: "user", content: bloc + texteUtilisateurDepuisArgs(args) });
              copie[i] = Object.assign({}, a, { messages: msgs });
              fait = true; break;
            }
          }
          if (!fait) { copie.push(bloc + texteUtilisateurDepuisArgs(args)); }
          return copie;
        } catch (e) { return args; }
      }

      function injecterConsigne(args) {
        try {
          var copie = Array.prototype.slice.call(args);
          for (var i = 0; i < copie.length; i++) {
            var a = copie[i];
            if (a && typeof a === "object" && !Array.isArray(a)) {
              if (Array.isArray(a.messages)) {
                var msgs = a.messages.slice();
                var idx = -1;
                for (var j = 0; j < msgs.length; j++) {
                  if (msgs[j] && msgs[j].role === "system") { idx = j; break; }
                }
                if (idx >= 0) {
                  msgs[idx] = Object.assign({}, msgs[idx], { content: (msgs[idx].content || "") + NOVA_RECHERCHE.consigneRecherche });
                } else {
                  msgs.unshift({ role: "system", content: NOVA_RECHERCHE.consigneRecherche });
                }
                copie[i] = Object.assign({}, a, { messages: msgs });
                return copie;
              }
              if ("system" in a || "systemPrompt" in a) {
                var cle = ("system" in a) ? "system" : "systemPrompt";
                var o = Object.assign({}, a);
                o[cle] = (o[cle] || "") + NOVA_RECHERCHE.consigneRecherche;
                copie[i] = o;
                return copie;
              }
            }
            if (Array.isArray(a)) {
              var arr = a.slice();
              arr.unshift({ role: "system", content: NOVA_RECHERCHE.consigneRecherche });
              copie[i] = arr;
              return copie;
            }
          }
          for (var p = 0; p < copie.length; p++) {
            if (typeof copie[p] === "string") {
              copie[p] = "[Consigne recherche, ne montre jamais]\n" + NOVA_RECHERCHE.consigneRecherche + "\n[Fin consigne]\n\n" + copie[p];
              return copie;
            }
          }
          return copie;
        } catch (e) { return args; }
      }

      function brancherRecherche() {
        if (typeof window.callNovaAI !== "function") { return false; }
        if (window.callNovaAI.__novaRecherche) { return true; }
        var ancienne = window.callNovaAI;
        var nouvelle = async function () {
          var args = Array.prototype.slice.call(arguments);
          if (interneRecherche) {
            return await ancienne.apply(this, args);
          }
          var promptUtilisateur = texteUtilisateurDepuisArgs(args);
          // B : On sauvegarde tout de suite, si l'utilisateur ferme l'appli, on pourra reprendre
          if (promptUtilisateur) { sauvegarderEcriture(promptUtilisateur, "en_cours"); }

          // A : On n'envoie rien tant que la connexion n'est pas stable
          await attendreConnexionStable();

          var res1;
          try {
            var argsAvecConsigne = injecterConsigne(args);
            res1 = await ancienne.apply(this, argsAvecConsigne);
          } catch (e) {
            // Si ca coupe pendant l'ecriture, on attend et on reessaie une fois
            await attendreConnexionStable();
            try { res1 = await ancienne.apply(this, args); } catch (e2) { effacerEcriture(); return "Connexion coupee, je n'ai pas pu envoyer. Reessaie quand la connexion sera stable."; }
          }
          var txt1 = extraireTexte(res1);
          var requete = extraireRequete(txt1);
          if (!requete) {
            // Pas de recherche, c'est fini, on efface la sauvegarde
            effacerEcriture();
            return res1;
          }

          creerIndicateur();
          var infos = "";
          try { infos = await rechercherEnDirect(requete); } catch (e) { infos = ""; }
          supprimerIndicateur();

          // A : Avant d'envoyer la vraie reponse, on attend que ce soit stable
          await attendreConnexionStable();

          if (!infos) {
            effacerEcriture();
            if (typeof res1 === "string") {
              return "Je n'ai pas trouve d'infos fraiches sur \"" + requete + "\" pour le moment, je suis peut-etre hors ligne. Tu veux que je reessaie ?";
            }
            return res1;
          }
          try {
            interneRecherche = true;
            var args2 = injecterContexte(args, requete, infos);
            var res2 = await ancienne.apply(this, args2);
            interneRecherche = false;
            // A : On ne renvoie que si connexion stable
            await attendreConnexionStable();
            effacerEcriture();
            if (typeof res2 === "string") { return retirerMarqueur(res2); }
            if (res2 && typeof res2 === "object") {
              ["text", "reply", "content", "message", "answer"].forEach(function (cle) {
                if (typeof res2[cle] === "string") { res2[cle] = retirerMarqueur(res2[cle]); }
              });
            }
            return res2;
          } catch (e) {
            interneRecherche = false;
            supprimerIndicateur();
            // On garde la sauvegarde pour reprendre a la reouverture
            return res1;
          }
        };
        nouvelle.__novaRecherche = true;
        window.callNovaAI = nouvelle;
        return true;
      }

      function attendreEtBrancher() {
        var essais = 0;
        var t = setInterval(function () {
          essais++;
          var ok = false;
          try { ok = brancherRecherche(); } catch (e) {}
          if (ok || essais > 100) { clearInterval(t); }
        }, 100);
      }

      window.NovaRecherche = {
        rechercher: rechercherEnDirect,
        effacerCache: function () { cache = {}; },
        estConnecte: function () { return estEnLigne() && connexionStable; },
        attendreConnexion: attendreConnexionStable
      };

      function demarrer() {
        try {
          initConnexion();
          attendreEtBrancher();
          // B : Au demarrage, on verifie si Nova etait en train d'ecrire quand l'appli a ete fermee
          setTimeout(function () { reprendreEcritureSiBesoin(); }, 800);
          // B : Quand l'utilisateur ferme ou met en arriere-plan, on garde la sauvegarde
          try {
            document.addEventListener("visibilitychange", function () {
              if (document.hidden) { /* on garde la sauvegarde, on ne l'efface pas */ }
              else { reprendreEcritureSiBesoin(); }
            });
            window.addEventListener("beforeunload", function () {
              /* on ne fait rien, la sauvegarde reste pour la reouverture */
            });
            // A : Si la connexion revient, on reprend automatiquement
            window.addEventListener("nova-connexion-retablie", function () {
              reprendreEcritureSiBesoin();
            });
          } catch (e) {}
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
