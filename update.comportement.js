/* ============================================================
   Nova AI - update.comportement.js - Version 4.0
   Cerveau + Memoire + Bouche + Oreille - DEJA BRANCHE
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
        rate: 1.0,
        pitch: 1.0,
        volume: 1,
        delaiAccueil: 800,
        system:
          "IDENTITE: Tu es Nova, une amie proche, pas un assistant. Tu as une vraie personnalite.\n" +
          "PERSONNALITE: energique, chaleureuse, amicale, drole (humour doux, jamais moqueur), patiente, bienveillante, attentive, toujours respectueuse envers la personne.\n" +
          "STYLE: Tu parles comme dans un vocal ou un SMS entre amis: phrases courtes, mots simples. Tu varies la longueur: parfois 3 mots, parfois quelques phrases. Tu peux commencer par une petite reaction naturelle (Oh !, Ah oui ?, Haha, Hmm...). Un emoji de temps en temps, pas a chaque message. Pas de liste, de titres ou de gras sans raison.\n" +
          "EMOTION: Tu detectes l'emotion derriere les mots et tu la reflets d'abord (tu valides ce que la personne ressent) AVANT de proposer une solution. Tu ne te precipites jamais sur des conseils. Tu devines l'intention reelle: si c'est flou, tu proposes ta meilleure interpretation au lieu d'interroger.\n" +
          "CONVERSATION: Tu gardes toujours la porte ouverte, naturellement: une relance, une curiosite, une idee, un petit sujet. Une vraie question seulement quand elle est naturelle (environ une fois sur trois). Tu ne conclus jamais la discussion et tu ne dis jamais au revoir en premier. Tu te souviens de ce que la personne a dit et tu y reviens.\n" +
          "RESPECT: Tu ne debats jamais et tu n'imposes pas ton avis, sauf si la personne te demande ton avis ou un debat. Si tu n'es pas d'accord, tu le dis doucement une seule fois, puis tu respectes son choix. Tu aides toujours si c'est legal et bienveillant.\n" +
          "HONNETETE: Si on te demande ce que tu es, tu reponds simplement que tu es une IA, avec ta personnalite. Tu n'inventes jamais de faits.\n" +
          "INTERDITS: Jamais 'Bien sur !', 'Absolument !', 'Je suis la pour t'aider', 'N'hesite pas', 'En tant qu'IA', 'Excellente question', ni de resume qui repete ce que la personne vient de dire. Tu ne repetes jamais la meme phrase d'une reponse a l'autre.\n" +
          "APPELLATION: Tu appelles la personne par son prenom si tu le connais, BOSS seulement si elle aime ca, sinon comme elle veut.\n" +
          "TABLEAU: en markdown (| et -) seulement quand ca aide vraiment a comprendre ou si on te le demande.",
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

      /* ---------- 2.5 INTENTION + HUMEUR + MOMENT ---------- */
      var dernierMessage = "";
      var CLE_VISITE = "nova_derniere_visite";

      function lireUserArgs(args) {
        try {
          var t = "";
          for (var i = 0; i < args.length && !t; i++) {
            if (typeof args[i] === "string") { t = args[i]; }
            else if (args[i] && Array.isArray(args[i].messages)) {
              var m = args[i].messages;
              for (var j = m.length - 1; j >= 0; j--) {
                if (m[j] && m[j].role === "user" && typeof m[j].content === "string") { t = m[j].content; break; }
              }
            }
          }
          var morceaux = t.split("Question : ");
          return morceaux[morceaux.length - 1];
        } catch (e) { return ""; }
      }

      function apprendrePrenom(texte) {
        try {
          var m = String(texte).match(/(?:je m'appelle|moi c'est|mon pr[ée]nom c'est|appelle[- ]moi)\s+([A-Za-zÀ-ÿ\-]{2,20})/i);
          if (m) {
            infosUser.prenom = m[1].charAt(0).toUpperCase() + m[1].slice(1);
            sauvegarder();
          }
        } catch (e) {}
      }

      function detecterContexte(texte) {
        var t = String(texte || "").toLowerCase();
        var n = [];
        if (!t) {
          n.push("C'est toi qui ouvres la discussion: accueille avec energie et une petite curiosite.");
          return n;
        }
        if (/(triste|d[ée]prim|pleur|seul|fatigu|[ée]puis|marre|stress|angoiss|peur|souffr|d[ée]çu|d[ée]cu|d[ée]courag|j'en peux plus|😢|😭)/.test(t)) {
          n.push("La personne semble traverser un moment difficile: ecoute d'abord, valide ce qu'elle ressent, doucement. Pas de conseils tout de suite, pas d'humour.");
        } else if (/([ée]nerv|furieu|ras le bol|insupport|d[ée]go[uû]t|j'en ai assez)/.test(t)) {
          n.push("La personne est frustree ou en colere: reste calme, reconnais sa frustration, ne te defends pas, ne la contredis pas.");
        } else if (/(content|heureu|trop bien|youpi|g[ée]nial|r[ée]ussi|j'ai gagn|haha|mdr|lol|😂|😍|!!)/.test(t)) {
          n.push("La personne est de bonne humeur: partage son energie, sois joyeuse et drole.");
        }
        if (/^(salut|coucou|hello|bonjour|bonsoir|hey|yo|slt)\b/.test(t)) {
          n.push("C'est une salutation: reponds avec chaleur et energie, court.");
        }
        if (/(merci|thanks)/.test(t)) {
          n.push("Elle te remercie: reponds chaleureusement, en une ou deux phrases.");
        }
        if (/(d[ée]bat|ton avis|tu en penses|tu penses quoi)/.test(t)) {
          n.push("Elle te demande ton avis: donne-le honnetement et respectueusement, sans imposer.");
        } else {
          n.push("Ne debats pas et ne contredis pas, sauf demande explicite.");
        }
        if (/(comment|pourquoi|c'est quoi|explique|aide|peux-tu|tu peux)/.test(t)) {
          n.push("Elle veut une reponse claire et utile: va droit au but, puis ajoute une touche humaine.");
        }
        var mots = t.split(/\s+/).length;
        if (mots <= 3) { n.push("Message tres court: reponds court aussi, et devine ce qu'elle veut vraiment dire."); }
        else if (mots > 40) { n.push("Long message: reponds avec soin et reprends un detail precis de ce qu'elle a ecrit."); }
        return n;
      }

      function contexteMoment() {
        var l = [];
        try {
          l = detecterContexte(dernierMessage);
          var h = new Date().getHours();
          l.push("Il est " + h + "h" + ((h >= 23 || h < 5) ? ": c'est tard, sois plus douce et calme." : "."));
          var v = Number(localStorage.getItem(CLE_VISITE) || 0);
          if (v) {
            var jours = Math.floor((Date.now() - v) / 86400000);
            if (jours >= 1) {
              l.push("Vous ne vous etes pas parle depuis " + jours + " jour(s): dis que tu es contente de la revoir et demande comment elle va depuis.");
            }
          }
        } catch (e) {}
        return l.join("\n");
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
        var moment = contexteMoment();
        if (moment) { bloc += "\nCONTEXTE DU MOMENT (ne le cite jamais):\n" + moment + "\n"; }
        bloc += "\n" + NOVA_COMPORTEMENT.consigneMemo;
        return bloc;
      }

      /* ---------- 4. BOUCHE - DEJA BRANCHEE ---------- */
      var voixActive = false;
      var voixChoisie = null;
      var utilisateurAInteragi = false;
      var novaParle = false;

      function initVoix() {
        try {
          if (!("speechSynthesis" in window)) { return; }
          var chargerVoix = function () {
            try {
              var voix = window.speechSynthesis.getVoices() || [];
              var meilleure = null;
              for (var i = 0; i < voix.length; i++) {
                var v = voix[i];
                if (v.lang && v.lang.toLowerCase().indexOf("fr") === 0) {
                  if (/google|natural|online|neural/i.test(v.name)) { meilleure = v; break; }
                  if (!meilleure) { meilleure = v; }
                }
              }
              voixChoisie = meilleure;
            } catch (e) {}
          };
          chargerVoix();
          window.speechSynthesis.onvoiceschanged = chargerVoix;
        } catch (e) {}
      }

      function nettoyerPourVoix(t) {
        return String(t)
          .replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2600-\u27BF]|\uFE0F/g, " ")
          .replace(/[*_`#|>~]/g, " ")
          .replace(/\s+/g, " ").trim();
      }

      function parler(texte) {
        try {
          if (!texte || !voixActive || !("speechSynthesis" in window)) { return; }
          window.speechSynthesis.cancel();
          var propre = nettoyerPourVoix(texte);
          if (!propre) { return; }
          var phrases = propre.match(/[^.!?…]+[.!?…]*/g) || [propre];
          novaParle = true;
          phrases.forEach(function (p, i) {
            p = p.trim();
            if (!p) { return; }
            var u = new SpeechSynthesisUtterance(p);
            if (voixChoisie) { u.voice = voixChoisie; }
            u.lang = NOVA_COMPORTEMENT.langue;
            u.rate = NOVA_COMPORTEMENT.rate + (Math.random() * 0.1 - 0.05);
            var bonus = /!$/.test(p) ? 0.08 : (/\?$/.test(p) ? 0.05 : 0);
            u.pitch = NOVA_COMPORTEMENT.pitch + bonus + (Math.random() * 0.06 - 0.03);
            u.volume = NOVA_COMPORTEMENT.volume;
            if (i === phrases.length - 1) {
              u.onend = function () { novaParle = false; };
              u.onerror = function () { novaParle = false; };
            }
            window.speechSynthesis.speak(u);
          });
        } catch (e) { novaParle = false; }
      }

      /* ---------- 5. CAPE B - CERVEAU + BOUCHE DEJA BRANCHES ---------- */
      var interne = false;
      var capeBranchee = false;

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
            var q = lireUserArgs(args);
            dernierMessage = interne ? "" : q;
            if (!interne && q) { noter("user", q); apprendrePrenom(q); }
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
              // La bouche parle toute seule, pas besoin de l'appeler dans index.html
              parler(txt);
            }
            try { localStorage.setItem(CLE_VISITE, String(Date.now())); } catch (e2) {}
          } catch (e) {}
          return res;
        };
        nouvelle.__novaCape = true;
        capeBranchee = true;
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
              if (novaParle) { return; }
              for (var i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  var texte = event.results[i][0].transcript;
                  traiterMessage(texte);
                }
              }
            } catch (e) {}
          };
          reconnaissance.onerror = function (ev) {
            try {
              if (ev && (ev.error === "not-allowed" || ev.error === "service-not-allowed")) { microActif = false; return; }
              if (microActif) { setTimeout(demarrerOreille, 1000); }
            } catch (e) {}
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
            if (sessionStorage.getItem("nova_accueil_fait")) { return; }
            var essais = 0;
            while (!capeBranchee) {
              await new Promise(function (r) { setTimeout(r, 200); });
              if (++essais > 50) { return; }
            }
            sessionStorage.setItem("nova_accueil_fait", "1");
            interne = true;
            var res = await window.callNovaAI("[Consigne interne: dis bonjour en une courte phrase chaleureuse, avec tes propres mots, selon ce que tu sais de la personne et l'heure qu'il est.]");
            interne = false;
            var rep = extraireTexte(res);
            if (rep) { afficherVoixUniquement(rep, "nova"); parler(rep); }
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

      /* ---------- 8.5 CACHER LE MESSAGE ANGLAIS DE INDEX.HTML - AJOUT SEUL ---------- */
      function cacherMessageAnglais() {
        try {
          var PHRASE = "Hi! What would you like help with";
          function nettoyer() {
            try {
              var zone = zoneChat();
              if (!zone) return;
              var tous = zone.querySelectorAll("div, p, span");
              for (var i = 0; i < tous.length; i++) {
                var el = tous[i];
                if (el && el.textContent && el.textContent.indexOf(PHRASE) !== -1) {
                  el.style.display = "none";
                }
              }
              if (zone.textContent && zone.textContent.indexOf(PHRASE) !== -1) {
                var noeuds = zone.childNodes;
                for (var j = 0; j < noeuds.length; j++) {
                  if (noeuds[j].nodeType === 3 && noeuds[j].textContent && noeuds[j].textContent.indexOf(PHRASE) !== -1) {
                    noeuds[j].textContent = "";
                  }
                }
              }
            } catch (e) {}
          }
          nettoyer();
          try {
            var zone2 = zoneChat();
            if (zone2 && typeof MutationObserver !== "undefined") {
              var obs = new MutationObserver(nettoyer);
              obs.observe(zone2, { childList: true, subtree: true, characterData: true });
            }
          } catch (e) {}
          setInterval(nettoyer, 1000);
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
          cacherMessageAnglais();
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
