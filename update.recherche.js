/* Nova AI - update.recherche.js - Version 2.0
   Recherche en direct gratuite, sans cle. Ne touche a rien d'autre.
   Ligne a mettre en bas de index.html : <script src="update.recherche.js"></script> */
(function () {
  "use strict";
  if (window.NOVA_RECHERCHE_V2) { return; }
  window.NOVA_RECHERCHE_V2 = true;
  try {

    var TIMEOUT = 8000;
    var CACHE_MS = 10 * 60 * 1000;
    var cache = {};
    var occupe = false;

    /* ---------- Connexion ---------- */
    function attendreConnexion() {
      return new Promise(function (ok) {
        if (navigator.onLine !== false) { ok(); return; }
        var fini = false;
        function f() { if (!fini) { fini = true; window.removeEventListener("online", f); ok(); } }
        window.addEventListener("online", function () { setTimeout(f, 1200); });
        setTimeout(f, 30000);
      });
    }

    /* ---------- Outils ---------- */
    function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function getJSON(url) {
      return new Promise(function (ok) {
        try {
          var c = typeof AbortController !== "undefined" ? new AbortController() : null;
          var t = setTimeout(function () { try { c && c.abort(); } catch (e) {} ok(null); }, TIMEOUT);
          fetch(url, c ? { signal: c.signal } : {}).then(function (r) {
            return r.ok ? r.json() : null;
          }).then(function (j) { clearTimeout(t); ok(j); })
            .catch(function () { clearTimeout(t); ok(null); });
        } catch (e) { ok(null); }
      });
    }

    function getTexte(url) {
      return new Promise(function (ok) {
        try {
          var c = typeof AbortController !== "undefined" ? new AbortController() : null;
          var t = setTimeout(function () { try { c && c.abort(); } catch (e) {} ok(""); }, TIMEOUT);
          fetch(url, c ? { signal: c.signal } : {}).then(function (r) {
            return r.ok ? r.text() : "";
          }).then(function (x) { clearTimeout(t); ok(x || ""); })
            .catch(function () { clearTimeout(t); ok(""); });
        } catch (e) { ok(""); }
      });
    }

    function lire(c) {
      var e = cache[c];
      if (!e) { return null; }
      if (Date.now() - e.t > CACHE_MS) { delete cache[c]; return null; }
      return e.v;
    }
    function ecrire(c, v) { cache[c] = { v: v, t: Date.now() }; }

    /* ---------- Faut-il chercher ? (decide par le code, pas par l'IA) ---------- */
    var RE_FRAIS = /(m[ée]t[ée]o|temps qu.il fait|il pleut|pluie|temp[ée]rature|score|match|r[ée]sultat|classement|actualit|actu\b|news|derni[eè]re|aujourd|ce soir|demain|cette semaine|en ce moment|maintenant|prix|cours d|taux|combien co[uû]te|2025|2026|actuel|qui est le|champion|vient de|nouveau|nouvelle|sorti|recherche|cherche sur (le )?(web|internet)|sur internet)/i;
    var RE_METEO = /(m[ée]t[ée]o|temps qu.il fait|il pleut|pluie|temp[ée]rature)/i;

    function lieuMeteo(t) {
      try {
        var m = t.match(/(?:\bà|\ba|\bde|\bpour|\bsur|\ben|\bau|\bdu)\s+([A-Za-zÀ-ÿ'\- ]{2,30})/gi);
        if (m && m.length) {
          var d = m[m.length - 1].replace(/^(à|a|de|pour|sur|en|au|du)\s+/i, "");
          d = d.replace(/\b(aujourd'hui|aujourd|demain|maintenant|ce soir|ce matin|svp|stp|please)\b.*$/i, "").replace(/[?!.]/g, "").trim();
          if (d.length > 1) { return d; }
        }
      } catch (e) {}
      return "Kolwezi";
    }

    /* ---------- Sources gratuites ---------- */
    async function meteo(t) {
      var lieu = lieuMeteo(t);
      var k = "m:" + lieu.toLowerCase();
      var c = lire(k); if (c) { return c; }
      var g = await getJSON("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(lieu) + "&count=1&language=fr&format=json");
      if (!g || !g.results || !g.results.length) { return ""; }
      var r = g.results[0];
      var m = await getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + r.latitude + "&longitude=" + r.longitude +
        "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=2");
      if (!m || !m.current) { return ""; }
      var x = "Meteo en direct a " + r.name + (r.country ? " (" + r.country + ")" : "") + " : " +
        m.current.temperature_2m + "°C, humidite " + m.current.relative_humidity_2m + "%, vent " +
        m.current.wind_speed_10m + " km/h, pluie " + m.current.precipitation + " mm.";
      if (m.daily && m.daily.temperature_2m_max) {
        x += " Aujourd'hui max " + m.daily.temperature_2m_max[0] + "°C / min " + m.daily.temperature_2m_min[0] + "°C, risque de pluie " + m.daily.precipitation_probability_max[0] + "%.";
        if (m.daily.temperature_2m_max[1] !== undefined) {
          x += " Demain max " + m.daily.temperature_2m_max[1] + "°C / min " + m.daily.temperature_2m_min[1] + "°C, risque de pluie " + m.daily.precipitation_probability_max[1] + "%.";
        }
      }
      x += " (Source : Open-Meteo)";
      ecrire(k, x); return x;
    }

    async function wikipedia(q) {
      var k = "w:" + q.toLowerCase();
      var c = lire(k); if (c) { return c; }
      var j = await getJSON("https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(q) +
        "&gsrlimit=2&prop=extracts&exintro=1&explaintext=1&exchars=600&format=json&origin=*");
      if (!j || !j.query || !j.query.pages) { return ""; }
      var out = [];
      var p = j.query.pages;
      Object.keys(p).forEach(function (id) {
        if (p[id] && p[id].extract) { out.push("Wikipedia - " + p[id].title + " : " + p[id].extract); }
      });
      var x = out.join("\n");
      if (x) { ecrire(k, x); }
      return x;
    }

    async function actualites(q) {
      var k = "n:" + q.toLowerCase();
      var c = lire(k); if (c) { return c; }
      var rss = "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=fr&gl=FR&ceid=FR:fr";
      var xml = await getTexte("https://api.allorigins.win/raw?url=" + encodeURIComponent(rss));
      if (!xml) { return ""; }
      var out = [];
      try {
        var doc = new DOMParser().parseFromString(xml, "text/xml");
        var items = doc.getElementsByTagName("item");
        for (var i = 0; i < items.length && out.length < 5; i++) {
          var ti = items[i].getElementsByTagName("title")[0];
          var da = items[i].getElementsByTagName("pubDate")[0];
          if (ti) { out.push("- " + ti.textContent + (da ? " (" + da.textContent.slice(0, 16) + ")" : "")); }
        }
      } catch (e) {}
      var x = out.length ? "Actualites recentes :\n" + out.join("\n") : "";
      if (x) { ecrire(k, x); }
      return x;
    }

    async function chercher(texte) {
      var q = String(texte || "").replace(/[?!]/g, " ").trim().slice(0, 150);
      var liste = [];
      if (RE_METEO.test(texte)) { liste.push(meteo(texte)); }
      else {
        liste.push(actualites(q));
        liste.push(wikipedia(q));
      }
      var res = await Promise.all(liste.map(function (p) { return p.catch(function () { return ""; }); }));
      return res.filter(function (r) { return r; }).join("\n\n").slice(0, 3000);
    }

    /* ---------- Petite barre ronde discrete ---------- */
    var barre = null;
    function zone() {
      return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
    }
    function barreAfficher(texte) {
      try {
        if (!barre) {
          var z = zone(); if (!z) { return; }
          barre = document.createElement("div");
          barre.id = "nova-recherche-barre";
          var s = barre.style;
          s.display = "inline-block"; s.background = "rgba(120,120,128,0.12)"; s.color = "rgba(60,60,67,0.55)";
          s.fontSize = "12px"; s.padding = "6px 14px"; s.borderRadius = "999px"; s.margin = "6px 0";
          s.fontStyle = "italic"; s.opacity = "0.75"; s.transition = "opacity .3s"; s.maxWidth = "85%";
          s.whiteSpace = "nowrap"; s.overflow = "hidden"; s.textOverflow = "ellipsis";
          z.appendChild(barre);
        }
        barre.textContent = texte;
        var zz = zone(); if (zz) { zz.scrollTop = zz.scrollHeight; }
      } catch (e) {}
    }
    function barreCacher() {
      try { if (barre && barre.parentNode) { barre.parentNode.removeChild(barre); } } catch (e) {}
      barre = null;
      try { var v = document.getElementById("nova-recherche-barre"); if (v && v.parentNode) { v.parentNode.removeChild(v); } } catch (e) {}
    }

    /* ---------- Lire / remplacer le message utilisateur ---------- */
    function lireUser(args) {
      for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === "string") { return args[i]; }
        if (args[i] && Array.isArray(args[i].messages)) {
          var m = args[i].messages;
          for (var j = m.length - 1; j >= 0; j--) {
            if (m[j] && m[j].role === "user" && typeof m[j].content === "string") { return m[j].content; }
          }
        }
      }
      return "";
    }

    function remplacerUser(args, nouveau) {
      var copie = Array.prototype.slice.call(args);
      for (var i = 0; i < copie.length; i++) {
        if (typeof copie[i] === "string") { copie[i] = nouveau; return copie; }
        if (copie[i] && Array.isArray(copie[i].messages)) {
          var m = copie[i].messages.slice();
          for (var j = m.length - 1; j >= 0; j--) {
            if (m[j] && m[j].role === "user") {
              m[j] = Object.assign({}, m[j], { content: nouveau });
              break;
            }
          }
          copie[i] = Object.assign({}, copie[i], { messages: m });
          return copie;
        }
      }
      return copie;
    }

    function construire(question, infos) {
      var d = new Date();
      var date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " a " +
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      return "[INFOS EN DIRECT trouvees le " + date + "]\n" + infos +
        "\n[Fin des infos en direct. Reponds a la question ci-dessous en utilisant ces infos, de facon naturelle, " +
        "et mentionne la date. Si les infos ne suffisent pas, dis-le honnetement sans inventer.]\n\nQuestion : " + question;
    }

    /* ---------- Branchement sur le cerveau (callNovaAI) ---------- */
    function brancher() {
      if (typeof window.callNovaAI !== "function") { return false; }
      if (window.callNovaAI.__nr2) { return true; }
      var ancienne = window.callNovaAI;
      var nouvelle = async function () {
        var args = Array.prototype.slice.call(arguments);
        var ctx = this;
        if (occupe) { return ancienne.apply(ctx, args); }
        var question = "";
        try { question = lireUser(args); } catch (e) {}
        if (!question || !RE_FRAIS.test(question)) { return ancienne.apply(ctx, args); }

        occupe = true;
        try {
          barreAfficher("Recherche en cours...");
          await attendreConnexion();
          await pause(500);
          barreAfficher("Je prepare la demande...");
          var infos = await chercher(question);
          barreAfficher("Verification...");
          await pause(500);
          barreAfficher("Finalisation...");
          await pause(400);
          barreAfficher("D'apres ce que j'ai trouve...");
          var args2 = infos ? remplacerUser(args, construire(question, infos)) : args;
          var res = await ancienne.apply(ctx, args2);
          barreCacher();
          occupe = false;
          return res;
        } catch (e) {
          barreCacher();
          occupe = false;
          return ancienne.apply(ctx, args);
        }
      };
      nouvelle.__nr2 = true;
      window.callNovaAI = nouvelle;
      return true;
    }

    function demarrer() {
      var essais = 0;
      var t = setInterval(function () {
        essais++;
        var ok = false;
        try { ok = brancher(); } catch (e) {}
        if (ok || essais > 300) { clearInterval(t); }
      }, 100);
    }

    window.NovaRecherche = {
      rechercher: chercher,
      effacerCache: function () { cache = {}; }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", demarrer);
    } else {
      demarrer();
    }

  } catch (e) { /* si ca plante, Nova continue sans recherche */ }
})();
