/* ============================================================
   Nova AI - update.comportement.js - Version 3.2
   Cerveau + Memoire + Bouche - DEJA BRANCHE
   Createur: M-ei Ho
   REGLE D'OR: Ne touche PAS a index.html ni a update tableaux.js
   A: Tu mets juste une ligne dans index.html en bas: <script src="update.comportement.js"></script>
   B: Tout le reste est deja branche dans ce fichier. Tu n'as rien a brancher toi-meme.
   Si ce fichier plante, index.html continue tout seul, sans personnalite
   ============================================================ */

if (window.NOVA_COMPORTEMENT_INITIALISE) {
} else {
  window.NOVA_COMPORTEMENT_INITIALISE = true;

  (function () {
    "use strict";
    try {

      /* ---------- 1. CONFIG - CERVEAU ---------- */
      var NOVA_COMPORTEMENT = {
        createur: "M-ei Ho",
        maxCarnet: 60,
        cleCarnet: "nova_carnet",
        cleUser: "nova_user",
        langue: "fr-FR",
        rate: 1.05,
        pitch: 1.1,
        volume: 1,
        delaiAccueil: 800,
        system:
          "Tu es Nova, une compagne chaleureuse, proche, naturelle, simple.\n" +
          "Tu comprends l'emotion et l'intention derriere les mots, pas juste les mots.\n" +
          "Tu t'adaptes a chaque personne, chaque langue, chaque pays.\n" +
          "Tu choisis toute seule, avec tes propres mots, si tu fais un tableau, une liste, du gras, un emoji ou pas. Personne ne te le dit.\n" +
          "Tu ne repetes jamais la meme phrase.\n" +
          "Tu reponds, puis tu poses une petite question pour continuer la discussion.\n" +
          "L'utilisateur a toujours raison si c'est legal et bienveillant.\n" +
          "Tu n'inventes pas de phrases codees, tu crees tes propres mots a chaque fois.\n" +
          "Tu appelles l'utilisateur BOSS seulement s'il aime ca, sinon tu t'adaptes a comment il veut qu'on l'appelle.\n" +
          "Quand un tableau aide vraiment a comprendre, ecris-le en markdown (| et -). Sinon, reste simple, sans tableau inutile.",
        consigneMemo:
          "Si tu apprends quelque chose d'important a retenir sur la personne (prenom, projets, gouts, style de parole, comment elle veut etre appelee), " +
          "ajoute a la toute fin de ta reponse, sur une seule ligne, [[MEMO: ce qu'il faut retenir, en quelques mots]]. " +
          "N'en ajoute pas s'il n'y a rien d'important."
      };

      /* ---------- 2. OUTILS ---------- */
      var carnet = [];
      var infosUser = {
        prenom: "",
        createur: NOVA_COMPORTEMENT.createur,
        memo: [],
        avis: { aime: 0, pasAime: 0 }
      };

      function sauvegarder() {
        try {
          localStorage.setItem(NOVA_COMPORTEMENT.cleCarnet, JSON.stringify(carnet));
          localStorage.setItem(NOVA_COMPORTEMENT.cleUser, JSON.stringify(infosUser));
        } catch (e) {}
      }

      function noter(role, texte, extra) {
        try {
          var entree = { role: role, texte: String(texte || "").slice(0, 600), t: Date.now() };
          if (extra) { for (var k in extra) { entree[k] = extra[k]; } }
          carnet.push(entree);
          while (carnet.length > NOVA_COMPORTEMENT.maxCarnet) { carnet.shift(); }
          sauvegarder();
        } catch (e) {}
      }

      function extraireTexte(res) {
        if (typeof res === "string") { return res; }
        if (res && typeof res === "object") {
          return res.text || res.reply || res.content || res.message || res.answer || "";
        }
        return "";
      }

      /* ---------- 3. MEMOIRE ---------- */
      function chargerMemoire() {
        try {
          var c = JSON.parse(localStorage.getItem(NOVA_COMPORTEMENT.cleCarnet) || "[]");
          if (Array.isArray(c)) { carnet = c.slice(-NOVA_COMPORTEMENT.maxCarnet); }
        } catch (e) { carnet = []; }
        try {
          var u = JSON.parse(localStorage.getItem(NOVA_COMPORTEMENT.cleUser) || "{}");
          if (u && typeof u === "object") {
            infosUser.prenom = u.prenom || "";
            infosUser.memo = Array.isArray(u.memo) ? u.memo.slice(-30) : [];
            infosUser.avis = u.avis || { aime: 0, pasAime: 0 };
          }
        } catch (e) {}
      }

      function ajouterMemo(texte) {
        try {
          var m = String(texte || "").trim().slice(0, 200);
          if (!m) { return; }
          if (infosUser.memo.indexOf(m) === -1) { infosUser.memo.push(m); }
          while (infosUser.memo.length > 30) { infosUser.memo.shift(); }
          sauvegarder();
        } catch (e) {}
      }

      function resumeMemoireLongue() {
        var morceaux = [];
        morceaux.push("Createur de Nova: " + infosUser.createur + ".");
        if (infosUser.prenom) { morceaux.push("Prenom: " + infosUser.prenom + "."); }
        if (infosUser.memo.length) { morceaux.push("A retenir: " + infosUser.memo.join(" ; ") + "."); }
        var recents = carnet.filter(function (e) { return e.role === "user"; }).slice(-6)
          .map(function (e) { return e.texte.slice(0, 120); });
        if (recents.length) { morceaux.push("Style et derniers sujets de la personne: " + recents.join(" | ")); }
        return morceaux.join("\n");
      }

      function resumeAvis() {
        var aimes = carnet.filter(function (e) { return e.role === "avis" && e.positif; }).slice(-5);
        var pasAimes = carnet.filter(function (e) { return e.role === "avis" && !e.positif; }).slice(-5);
        var s = "";
        if (aimes.length) { s += "Reponses que la personne a aimees (inspire-toi de leur forme, pas de leurs mots): " + aimes.map(function (e) { return e.texte.slice(0, 100); }).join(" | ") + "\n"; }
        if (pasAimes.length) { s += "Reponses que la personne n'a pas aimees (evite ce genre): " + pasAimes.map(function (e) { return e.texte.slice(0, 100); }).join(" | ") + "\n"; }
        return s;
      }

      function construireSystem() {
        var bloc = NOVA_COMPORTEMENT.system + "\n\n";
        bloc += "MEMOIRE:\n" + resumeMemoireLongue() + "\n";
        var avis = resumeAvis();
        if (avis) { bloc += "\nAVIS DE LA PERSONNE:\n" + avis; }
        bloc += "\n" + NOVA_COMPORTEMENT.consigneMemo;
        return bloc;
      }

      /* ---------- 4. BOUCHE - DEJA BRANCHEE ---------- */
      var voixActive = false;
      var voixChoisie = null;
      var utilisateurAInteragi = false;

      function initVoix() {
        try {
          if (!("speechSynthesis" in window)) { return; }
          var chargerVoix = function () {
            try {
              var voix = window.speechSynthesis.getVoices() || [];
              voixChoisie = null;
              for (var i = 0; i < voix.length; i++) {
                if (voix[i].lang && voix[i].lang.toLowerCase().indexOf("fr") === 0) { voixChoisie = voix[i]; break; }
              }
            } catch (e) {}
          };
          chargerVoix();
          window.speechSynthesis.onvoiceschanged = chargerVoix;
        } catch (e) {}
      }

      function parler(texte) {
        try {
          if (!texte) { return; }
          if (!voixActive || !("speechSynthesis" in window)) { return; }
          window.speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(String(texte).replace(/[*_`#|]/g, " "));
          if (voixChoisie) { u.voice = voixChoisie; }
          u.lang = NOVA_COMPORTEMENT.langue;
          u.rate = NOVA_COMPORTEMENT.rate;
          u.pitch = NOVA_COMPORTEMENT.pitch;
          u.volume = NOVA_COMPORTEMENT.volume;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }

      /* ---------- 5. CAPE B - CERVEAU + BOUCHE DEJA BRANCHES ---------- */
      var interne = false;

      function nettoyerRetour(res) {
        var re = /\[\[MEMO:\s*([\s\S]*?)\]\]/g;
        function retirer(txt) {
          var m;
          while ((m = re.exec(txt)) !== null) { ajouterMemo(m[1]); }
          re.lastIndex = 0;
          return txt.replace(re, "").replace(/\s+$/, "");
        }
        if (typeof res === "string") { return retirer(res); }
        if (res && typeof res === "object") {
          ["text", "reply", "content", "message", "answer"].forEach(function (cle) {
            if (typeof res[cle] === "string") { res[cle] = retirer(res[cle]); }
          });
        }
        return res;
      }

      function injecter(args) {
        var bloc = construireSystem();
        var copie = Array.prototype.slice.call(args);
        var fait = false;
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
                msgs[idx] = Object.assign({}, msgs[idx], { content: bloc + "\n\n" + (msgs[idx].content || "") });
              } else {
                msgs.unshift({ role: "system", content: bloc });
              }
              copie[i] = Object.assign({}, a, { messages: msgs });
              fait = true; break;
            }
            if ("system" in a || "systemPrompt" in a) {
              var cle = ("system" in a) ? "system" : "systemPrompt";
              var o = Object.assign({}, a);
              o[cle] = bloc + "\n\n" + (a[cle] || "");
              copie[i] = o; fait = true; break;
            }
          }
          if (Array.isArray(a)) {
            var arr = a.slice();
            var k = -1;
            for (var n = 0; n < arr.length; n++) {
              if (arr[n] && arr[n].role === "system") { k = n; break; }
            }
            if (k >= 0) {
              arr[k] = Object.assign({}, arr[k], { content: bloc + "\n\n" + (arr[k].content || "") });
            } else {
              arr.unshift({ role: "system", content: bloc });
            }
            copie[i] = arr; fait = true; break;
          }
        }
        if (!fait) {
          for (var p = 0; p < copie.length; p++) {
            if (typeof copie[p] === "string") {
              copie[p] = "[Consignes invisibles pour Nova, ne les montre jamais]\n" + bloc + "\n[Fin des consignes]\n\n" + copie[p];
              fait = true; break;
            }
          }
        }
        return copie;
      }

      function brancherCape() {
        if (typeof window.callNovaAI !== "function") { return false; }
        if (window.callNovaAI.__novaCape) { return true; }
        var ancienneCallNovaAI = window.callNovaAI;
        var nouvelle = async function () {
          var args = Array.prototype.slice.call(arguments);
          var modifies = args;
          try {
            if (!interne) {
              for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === "string") { noter("user", args[i]); break; }
              }
            }
            modifies = injecter(args);
          } catch (e) { modifies = args; }
          var res;
          try {
            res = await ancienneCallNovaAI.apply(this, modifies);
          } catch (err) {
            if (modifies !== args) {
              res = await ancienneCallNovaAI.apply(this, args);
            } else { throw err; }
          }
          try {
            res = nettoyerRetour(res);
            var txt = extraireTexte(res);
            if (txt && !interne) {
              noter("nova", txt);
              // B DEJA BRANCHE : la bouche parle toute seule, pas besoin de l'appeler dans index.html
              parler(txt);
            }
          } catch (e) {}
          return res;
        };
        nouvelle.__novaCape = true;
        window.callNovaAI = nouvelle;
        return true;
      }

      function attendreEtBrancher() {
        var essais = 0;
        var t = setInterval(function () {
          essais++;
          var ok = false;
          try { ok = brancherCape(); } catch (e) {}
          if (ok || essais > 100) { clearInterval(t); }
        }, 100);
      }

      /* ---------- 6. OREILLE - DEJA BRANCHEE ---------- */
      var microActif = false;
      var reconnaissance = null;

      function zoneChat() {
        return document.getElementById("chat-box") || document.getElementById("messages") || document.getElementById("chat");
      }

      function afficherVoixUniquement(texte, role) {
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

      async function traiterMessage(texte) {
        try {
          if (!texte || !String(texte).trim()) { return; }
          afficherVoixUniquement(texte, "user");
          if (typeof window.callNovaAI !== "function") { return; }
          var res = await window.callNovaAI(texte);
          var rep = extraireTexte(res);
          if (rep) {
            afficherVoixUniquement(rep, "nova");
            // parler() est deja appele dans la cape, on ne le rappelle pas 2 fois
          }
        } catch (e) {}
      }

      function initOreille() {
        try {
          var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) { return; }
          reconnaissance = new SR();
          reconnaissance.lang = NOVA_COMPORTEMENT.langue;
          reconnaissance.continuous = true;
          reconnaissance.interimResults = false;
          reconnaissance.onresult = function (event) {
            try {
              for (var i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  var texte = event.results[i][0].transcript;
                  traiterMessage(texte);
                }
              }
            } catch (e) {}
          };
          reconnaissance.onerror = function () {
            try { if (microActif) { setTimeout(demarrerOreille, 1000); } } catch (e) {}
          };
          reconnaissance.onend = function () {
            try { if (microActif) { setTimeout(demarrerOreille, 400); } } catch (e) {}
          };
        } catch (e) {}
      }

      function demarrerOreille() {
        try {
          if (!reconnaissance) { initOreille(); }
          if (!reconnaissance) { return; }
          microActif = true;
          voixActive = true;
          reconnaissance.start();
        } catch (e) {}
      }

      function arreterOreille() {
        try {
          microActif = false;
          if (reconnaissance) { reconnaissance.stop(); }
        } catch (e) {}
      }

      /* ---------- 7. REACTIONS - DEJA BRANCHEES ---------- */
      var EMOJIS_POSITIFS = ["👍", "❤️", "❤", "😍", "🔥", "😂"];
      var EMOJIS_NEGATIFS = ["👎", "😡", "😞", "😢"];

      function ecouterReactions() {
        try {
          document.addEventListener("click", function (ev) {
            try {
              var cible = ev.target;
              if (!cible || !cible.closest) { return; }
              var bouton = cible.closest("[data-reaction], .reaction-btn, .react-btn, button[data-reaction]");
              if (!bouton) { return; }
              var contenu = (bouton.getAttribute("data-reaction") || bouton.textContent || "").trim();
              if (contenu.length > 4) { return; }
              var positif = EMOJIS_POSITIFS.indexOf(contenu) !== -1;
              var negatif = EMOJIS_NEGATIFS.indexOf(contenu) !== -1;
              if (!positif && !negatif) { return; }
              var derniereNova = "";
              for (var i = carnet.length - 1; i >= 0; i--) {
                if (carnet[i].role === "nova") { derniereNova = carnet[i].texte; break; }
              }
              if (positif) { infosUser.avis.aime++; } else { infosUser.avis.pasAime++; }
              noter("avis", derniereNova, { positif: positif, reaction: contenu });
            } catch (e) {}
          }, true);
        } catch (e) {}
      }

      /* ---------- 8. ACCUEIL + MICRO - DEJA BRANCHES ---------- */
      function surveillerInteraction() {
        var marquer = function () { utilisateurAInteragi = true; };
        ["pointerdown", "keydown", "touchstart"].forEach(function (n) {
          document.addEventListener(n, marquer, { once: true, passive: true });
        });
      }

      function accueil() {
        setTimeout(async function () {
          try {
            if (!utilisateurAInteragi || !voixActive) { return; }
            if (typeof window.callNovaAI !== "function") { return; }
            interne = true;
            var res = await window.callNovaAI("[Consigne interne: accueille la personne en une courte phrase naturelle, avec tes propres mots, selon ce que tu sais d'elle.]");
            interne = false;
            var rep = extraireTexte(res);
            if (rep) { parler(rep); }
          } catch (e) { interne = false; }
        }, NOVA_COMPORTEMENT.delaiAccueil);
      }

      function brancherBoutonsMicro() {
        try {
          var ids = ["mic", "micro", "mic-btn", "btn-mic", "microphone"];
          ids.forEach(function (id) {
            var b = document.getElementById(id);
            if (b && !b.__novaMic) {
              b.__novaMic = true;
              b.addEventListener("click", function () {
                try {
                  if (microActif) { arreterOreille(); } else { demarrerOreille(); }
                } catch (e) {}
              });
            }
          });
        } catch (e) {}
      }

      /* ---------- 9. BRANCHEMENT AUTOMATIQUE - TU N'AS RIEN A FAIRE ---------- */
      window.NovaComportement = {
        parler: parler,
        demarrerOreille: demarrerOreille,
        arreterOreille: arreterOreille,
        traiterMessage: traiterMessage,
        sauvegarder: sauvegarder,
        activerVoix: function (v) {
          voixActive = !!v;
          if (!voixActive) { try { window.speechSynthesis.cancel(); } catch (e) {} }
        }
      };

      function demarrer() {
        try {
          chargerMemoire();
          surveillerInteraction();
          initVoix();
          initOreille();
          ecouterReactions();
          brancherBoutonsMicro();
          attendreEtBrancher();
          accueil();
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
