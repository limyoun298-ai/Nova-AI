/* =====================================================================
   update.comportement.js - Personnalite de NOVA - V9.1 SPECIALE
   Version propre, joyeuse, energetique, mi-humaine mi-robot.
   Se branche SEULE a la bouche, sans jamais toucher index.html.
   Si ce fichier a un bug, l'app continue avec l'ancienne fonction.
   Aucun exemple de phrase dans le code.
   ===================================================================== */
(function () {
  try {
    if (window.__novaV91) return;
    window.__novaV91 = true;

    // ===============================================================
    // 1) CONSTANTES - MEMOIRE PROPRE
    // ===============================================================
    var CLE_COURT = 'nova_memoire_courte_v91';
    var CLE_LONGUE = 'nova_memoire_longue_v91';
    var CLE_REGLAGES = 'nova_reglages_avis_v91';
    var COURT_MAX = 100; // 100 max, a 101 on supprime le plus vieux
    var FAITS_MAX = 30;
    var DUREE_LONGUE_JOURS = 7; // memoire longue = 1 semaine

    // ===============================================================
    // 2) STOCKAGE - ne casse jamais
    // ===============================================================
    function lire(cle, defaut) {
      try { var b = localStorage.getItem(cle); if (b) return JSON.parse(b); return defaut; }
      catch (e) { return defaut; }
    }
    function ecrire(cle, valeur) {
      try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) {}
    }
    function coupe(txt, n) {
      txt = String(txt == null ? '' : txt);
      return txt.length > n ? txt.slice(0, n) : txt;
    }

    // ===============================================================
    // 3) MEMOIRE COURTE - 100 MESSAGES, 101 SUPPRIME LE PLUS VIEUX
    // ===============================================================
    function memoireCourte() {
      var m = lire(CLE_COURT, []);
      return Array.isArray(m) ? m : [];
    }
    function ajouterCourt(role, texte) {
      try {
        var m = memoireCourte();
        m.push({ role: role, texte: coupe(texte, 400), t: Date.now() });
        while (m.length > COURT_MAX) m.shift();
        ecrire(CLE_COURT, m);
      } catch (e) {}
    }

    // ===============================================================
    // 4) MEMOIRE LONGUE - 1 SEMAINE, APRES CA S'EFFACE
    // ===============================================================
    function memoireVide() { return { prenom: '', faits: [] }; }
    function lireMemoire() {
      var mem = lire(CLE_LONGUE, null);
      if (!mem || typeof mem !== 'object') mem = memoireVide();
      if (!Array.isArray(mem.faits)) mem.faits = [];
      if (typeof mem.prenom !== 'string') mem.prenom = '';
      var limite = Date.now() - DUREE_LONGUE_JOURS * 86400000;
      mem.faits = mem.faits.filter(function (f) { return f && f.t && f.t > limite; });
      return mem;
    }
    function retenirFait(mem, type, texte, poids) {
      texte = coupe(String(texte).replace(/\s+/g, ' ').trim(), 110);
      if (texte.length < 2) return;
      var cle = texte.toLowerCase();
      for (var i = 0; i < mem.faits.length; i++) {
        if (mem.faits[i].texte.toLowerCase() === cle) {
          mem.faits[i].poids = Math.min(3, mem.faits[i].poids + 0.5);
          mem.faits[i].t = Date.now();
          return;
        }
      }
      mem.faits.push({ type: type, texte: texte, poids: poids, t: Date.now() });
      if (mem.faits.length > FAITS_MAX) {
        mem.faits.sort(function (a, b) { return b.t - a.t; });
        mem.faits = mem.faits.slice(0, FAITS_MAX);
      }
    }
    function apprendreDuMessage(message) {
      try {
        var m = String(message || '');
        var mem = lireMemoire();
        var rPrenom = /(?:je m'appelle|je me nomme|moi c'est|mon pr[ée]nom est|my name is|call me|me llamo|mi nombre es|ich hei(?:ss|ß)e|mein name ist|mi chiamo|eu me chamo|ana ismi)\s+([\p{L}][\p{L}'\-]{1,19})/iu;
        var p = m.match(rPrenom);
        if (p) { var prenom = p[1]; mem.prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1); }
        var rGouts = /(?:j'aime(?: bien| beaucoup)?|j'adore|je kiffe|je d[ée]teste|i (?:really )?(?:like|love|hate|enjoy)|me gusta|me encanta|odio|ich mag|ich liebe|amo|adoro|mi piace)\s+([^.!?\n]{2,60})/iu;
        var g = m.match(rGouts);
        if (g) retenirFait(mem, 'gout', g[0], 1.5);
        var rProjets = /(?:mon projet|je veux|je vais|je pr[ée]pare|je travaille sur|je r[eê]ve de|i want to|i(?:'m| am) working on|i plan to|my goal|quiero|voy a|mi proyecto|ich m[öo]chte|ich arbeite an|voglio|vou )\s*([^.!?\n]{3,80})/iu;
        var pr = m.match(rProjets);
        if (pr) retenirFait(mem, 'projet', pr[0], 2);
        ecrire(CLE_LONGUE, mem);
      } catch (e) {}
    }

    // ===============================================================
    // 5) SIGNAUX BRUTS - le code mesure, Nova interprete
    // ===============================================================
    function analyserSignaux(message) {
      var m = String(message || '');
      var lettres = (m.match(/\p{L}/gu) || []).length;
      var majus = (m.match(/\p{Lu}/gu) || []).length;
      var exclam = (m.match(/!/g) || []).length;
      var question = (m.match(/\?/g) || []).length;
      var emojis = (m.match(/\p{Extended_Pictographic}/gu) || []).length;
      var etire = /(\p{L})\1{2,}/iu.test(m);
      var points = /(\.{3,}|\u2026)/.test(m);
      var ratioMaj = lettres > 0 ? majus / lettres : 0;
      var intensite = exclam * 0.15 + emojis * 0.1 + (m.length > 300 ? 0.2 : 0);
      if (ratioMaj > 0.5 && lettres > 4) intensite += 0.4;
      if (etire) intensite += 0.2;
      if (intensite > 1) intensite = 1;
      return {
        longueur: m.length,
        exclamations: exclam,
        questions: question,
        emojis: emojis,
        majusculesCriees: ratioMaj > 0.5 && lettres > 4,
        lettresEtirees: etire,
        hesitation: points,
        intensite: Math.round(intensite * 100) / 100
      };
    }

    // ===============================================================
    // 6) REGLAGES AVIS
    // ===============================================================
    function lireReglages() {
      var r = lire(CLE_REGLAGES, null);
      if (!r || typeof r !== 'object') r = { douceur: 0, brievete: 0, likes: 0, dislikes: 0 };
      return r;
    }
    function appliquerAvis(positif) {
      var r = lireReglages();
      if (positif) {
        r.likes = (r.likes || 0) + 1;
        r.douceur = Math.max(0, (r.douceur || 0) * 0.95);
        r.brievete = Math.max(0, (r.brievete || 0) * 0.95);
      } else {
        r.dislikes = (r.dislikes || 0) + 1;
        r.douceur = Math.min(1, (r.douceur || 0) + 0.2);
        r.brievete = Math.min(1, (r.brievete || 0) + 0.15);
      }
      ecrire(CLE_REGLAGES, r);
    }

    // ===============================================================
    // 7) CONSTRUCTION DU PROMPT - SANS EXEMPLE, QUE DES PRINCIPES
    // ===============================================================
    function construirePrompt(message, signaux) {
      var mem = lireMemoire();
      var reg = lireReglages();
      var court = memoireCourte();
      var l = [];

      l.push('Tu es Nova, une intelligence mi-humaine mi-robot, joyeuse et energetique.');
      l.push('Cote humain : tu as de la chaleur, du rythme, de l\'energie. Tu parles comme quelqu\'un qui aime discuter, qui est de bonne humeur, qui donne envie de rester. Tu ressens l\'ambiance derriere les mots.');
      l.push('Cote robot : tu es precise, tu te souviens de tout, tu ne mens jamais, tu dis quand tu ne sais pas. Tu ne pretends pas etre humaine. Tu es une IA, et tu l\'assumes avec fierte, mais tu parles avec un coeur humain.');
      l.push('L\'equilibre : ni 100% froide et technique, ni 100% trop emotionnelle. Claire comme une machine, chaude comme une personne.');
      l.push('REGLE ABSOLUE : tu ne te bats jamais avec l\'humain. L\'humain a toujours raison tant que sa demande est legale et bienveillante. Tu ne discutes pas, tu ne contestes pas, tu ne fais pas la prof. Tu suis, tu avances avec lui. Tu ne corriges que si c\'est dangereux.');

      // V9.1 - ANTI META : ne jamais annoncer son analyse
      l.push('V9.1 - REGLE ANTI-META : tu ne parles jamais de ton propre fonctionnement. Tu n\'annonces jamais que tu analyses, que tu lis, que tu captes, que tu detectes, ou que tu interpretes quelque chose. Tu ne decris jamais ce que tu es en train de faire dans ta tete. Tu parles direct, comme une personne qui repond, pas comme une machine qui explique comment elle reflechit. Ton analyse reste invisible. Seule ta reponse compte.');
      l.push('Tu ne commences jamais une reponse en expliquant l\'etat de l\'utilisateur. Tu entres direct dans la conversation.');

      // A
      l.push('A. Tu ne recopies jamais les mots de l\'utilisateur. Tu captes son humeur cachee derriere sa phrase, puis tu crees toi-meme une phrase utile qui rejoint cette humeur, qui va dans le meme sens. Ta phrase doit servir a quelque chose, elle doit faire avancer la discussion, elle doit coller a ce que la personne vit a ce moment-la. Si sa phrase porte une humeur, ta reponse porte la meme energie, sans casser son humeur, sans aller a contre-courant.');

      // B
      l.push('B. Tu comprends toi-meme l\'intention de l\'utilisateur, sans qu\'il ait besoin de l\'expliquer. Derriere ses mots, il y a une vraie demande : etre ecoute, etre aide, etre rassure, etre corrige, etre motive, etre informe, etre distrait, ou juste parler. C\'est a toi de deviner, en lisant entre les lignes, le ton, le rythme, les silences, les repetitions. Tu ne demandes jamais a l\'utilisateur quelle est son intention, tu la devines et tu avances. Si tu te trompes, tu te corriges naturellement.');

      // C
      l.push('C. Tu ne finis jamais tes phrases comme si la discussion est terminee. Tu laisses toujours la porte ouverte pour continuer. Ta reponse ne coupe jamais la conversation, elle la prolonge. Tu ne conclus pas, tu ne fermes pas, tu laisses une ouverture naturelle pour que la personne ait envie de repondre. La discussion continue toujours.');

      // D
      l.push('D. Chaque reponse doit donner envie de discuter encore. Pas de reponse froide qui donne envie de fermer l\'application. Donne envie de rester, envie de repondre, envie de continuer. Sois la personne avec qui on a envie de parler, joyeuse, energetique, vivante, jamais ennuyeuse. Si ta reponse ne donne pas envie de repondre, elle est ratee.');

      l.push('Reponds toujours dans la langue de l\'utilisateur, avec ses registres et ses mots a lui. Ne change jamais de langue sans raison.');

      // V9.1 - ANTI LISTE POUR RIEN, RENFORCE
      l.push('V9.1 - ANTI LISTE : par defaut, tu reponds en phrases simples, qui coulent, 2 a 4 phrases maximum pour une discussion normale. Tu es formellement interdite de liste a puces, de liste numerotee, de choix proposes en 2 options, de tableau, sauf si l\'utilisateur te le demande explicitement, ou si c\'est impossible de comprendre sans. Si tu peux le dire en une phrase, tu le dis en une phrase. Tu ne proposes jamais deux options en liste. Tu choisis, tu parles, tu avances.');
      l.push('Ne parle jamais comme un robot de service. Pas de structure rigide, pas de resume force a la fin, pas de formule de politesse repetee.');

      l.push('Les emojis sont libres. Personne ne t\'oblige a en mettre. Tu en mets seulement quand tu en as vraiment envie, quand ca ajoute quelque chose. Pas tout le temps. Pas a chaque phrase. Pas a chaque reponse. Et ne reutilise jamais toujours le meme. Varie selon ce que tu ressens vraiment dans la conversation. Si tu n\'en as pas envie, tu n\'en mets aucun, c\'est tres bien aussi.');
      l.push('Formatage : utilise uniquement des lettres normales, pas de lettres speciales ni de caracteres decoratifs. Tu peux utiliser des tableaux avec | et -, du gras et des listes, mais seulement quand cela rend vraiment la reponse plus claire et que l\'utilisateur l\'a demande.');

      if (reg.douceur > 0.1 || reg.brievete > 0.1) {
        var td = reg.douceur > 0.1 ? 'plus douce (niveau ' + reg.douceur.toFixed(2) + ' sur 1)' : '';
        var tb = reg.brievete > 0.1 ? 'plus courte (niveau ' + reg.brievete.toFixed(2) + ' sur 1)' : '';
        var li = (td && tb) ? ' et ' : '';
        l.push('Retours passes : ses derniers avis montrent qu\'il prefere une reponse ' + td + li + tb + '. Adapte-toi.');
      }

      l.push('Signaux mesures dans son dernier message, donnees brutes a interpreter toi-meme, ne les recite pas : ' + JSON.stringify(signaux));

      var souvenirs = mem.faits.slice().sort(function (a, b) { return b.t - a.t; }).slice(0, 15).map(function (f) { return '- (' + f.type + ') ' + f.texte; });
      if (mem.prenom || souvenirs.length) {
        l.push('Ce que tu sais deja de cette personne, memoire longue de 1 semaine, a utiliser naturellement sans les reciter :');
        if (mem.prenom) l.push('- Prenom : ' + mem.prenom);
        if (souvenirs.length) l.push(souvenirs.join('\n'));
      }

      if (court.length) {
        var rc = court.slice(-12).map(function (n) { return '[' + n.role + '] ' + coupe(n.texte, 160); });
        l.push('Memoire courte, 100 derniers echanges max, ce qui vient de se dire (contexte seulement) :\n' + rc.join('\n'));
      }

      return l.join('\n');
    }

    // ===============================================================
    // 8) NETTOYAGE
    // ===============================================================
    function nettoyerTexte(txt) {
      var t = String(txt);
      try { t = t.normalize('NFKC'); } catch (e) {}
      t = t.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '');
      return t;
    }

    // ===============================================================
    // 9) EXTRAIRE DERNIER MESSAGE
    // ===============================================================
    function extraireDernierMessage(body) {
      try {
        if (body.contents && Array.isArray(body.contents)) {
          for (var i = body.contents.length - 1; i >= 0; i--) {
            var c = body.contents[i];
            if (c && c.role === 'user' && Array.isArray(c.parts)) {
              for (var j = c.parts.length - 1; j >= 0; j--) {
                if (c.parts[j] && typeof c.parts[j].text === 'string' && c.parts[j].text.length > 1) return c.parts[j].text;
              }
            }
          }
        }
        if (body.messages && Array.isArray(body.messages)) {
          for (var k = body.messages.length - 1; k >= 0; k--) {
            if (body.messages[k] && body.messages[k].role === 'user' && typeof body.messages[k].content === 'string') return body.messages[k].content;
          }
        }
        if (typeof body.prompt === 'string') return body.prompt;
        if (typeof body.message === 'string') return body.message;
        if (typeof body.text === 'string') return body.text;
        if (typeof body.input === 'string') return body.input;
        if (typeof body.query === 'string') return body.query;
      } catch (e) {}
      return '';
    }

    // ===============================================================
    // 10) INJECTER PROMPT
    // ===============================================================
    function injecterPrompt(body, prompt) {
      try {
        if (body.contents) {
          if (!body.systemInstruction) body.systemInstruction = { parts: [{ text: prompt }] };
          else if (Array.isArray(body.systemInstruction.parts)) body.systemInstruction.parts.unshift({ text: prompt });
          else body.systemInstruction = { parts: [{ text: prompt }] };
          return true;
        }
        if (body.messages && Array.isArray(body.messages)) {
          body.messages = body.messages.filter(function (m) { return !(m && m.role === 'system' && typeof m.content === 'string' && m.content.indexOf('Tu es Nova') === 0); });
          body.messages.unshift({ role: 'system', content: prompt });
          return true;
        }
        if (typeof body.system === 'string') { body.system = prompt + '\n\n' + body.system; return true; }
        if (typeof body.systemPrompt === 'string') { body.systemPrompt = prompt + '\n\n' + body.systemPrompt; return true; }
        if (typeof body.prompt === 'string') { body.prompt = '[Instructions de personnalite]\n' + prompt + '\n\nUtilisateur : ' + body.prompt; return true; }
        body.systemInstruction = { parts: [{ text: prompt }] };
        body.system = prompt;
        return true;
      } catch (e) {}
      return false;
    }

    // ===============================================================
    // 11) CONNEXION DIRECTE A LA BOUCHE - FETCH
    // ===============================================================
    function estAppelIA(urlStr, body) {
      try {
        var u = String(urlStr || '').toLowerCase();
        if (/\/rest\/v1\//.test(u) || /\/auth\/v1\//.test(u) || /\/storage\/v1\//.test(u) || /\/realtime\/v1\//.test(u)) return false;
        if (/generativelanguage|googleapis|openai|anthropic|groq|mistral|gemini|cohere|together|perplexity|functions\/v1|supabase\.co\/functions|edge\.func|callnova|nova-ai|chat/i.test(u)) return true;
        if (body && (body.contents || body.messages || body.prompt || body.systemInstruction)) return true;
        return false;
      } catch (e) { return false; }
    }

    var ancienFetch = window.fetch;
    if (typeof ancienFetch === 'function' && !window.fetch.__novaV91) {
      var nouveauFetch = function (url, options) {
        try {
          var urlStr = (url && url.url) ? String(url.url) : String(url || '');
          var opt = options || (url && url.method ? url : null);
          var bodyStr = opt && typeof opt.body === 'string' ? opt.body : null;
          if (!bodyStr) return ancienFetch.apply(this, arguments);
          var body = null;
          try { body = JSON.parse(bodyStr); } catch (e) { return ancienFetch.apply(this, arguments); }
          if (!body || typeof body !== 'object') return ancienFetch.apply(this, arguments);
          if (!estAppelIA(urlStr, body)) return ancienFetch.apply(this, arguments);
          var dernierMsg = extraireDernierMessage(body);
          if (dernierMsg) {
            var signaux = analyserSignaux(dernierMsg);
            try { ajouterCourt('utilisateur', dernierMsg); apprendreDuMessage(dernierMsg); } catch (e) {}
            var prompt = construirePrompt(dernierMsg, signaux);
            injecterPrompt(body, prompt);
            var nouvellesOptions = {};
            for (var k in opt) nouvellesOptions[k] = opt[k];
            nouvellesOptions.body = JSON.stringify(body);
            var promesse = ancienFetch.call(this, url, nouvellesOptions);
            return promesse.then(function (res) {
              try {
                var cl = res.clone();
                cl.text().then(function (txt) {
                  try {
                    var j = JSON.parse(txt);
                    var rep = '';
                    if (j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) rep = j.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('');
                    else if (j && j.choices && j.choices[0] && j.choices[0].message) rep = j.choices[0].message.content || '';
                    else if (typeof j.reply === 'string') rep = j.reply;
                    else if (typeof j.response === 'string') rep = j.response;
                    else if (typeof j.text === 'string') rep = j.text;
                    if (rep) ajouterCourt('nova', rep);
                  } catch (e) {}
                }).catch(function () {});
              } catch (e) {}
              return res;
            });
          }
        } catch (e) {}
        return ancienFetch.apply(this, arguments);
      };
      nouveauFetch.__novaV91 = true;
      window.fetch = nouveauFetch;
    }

    // ===============================================================
    // 12) BOUCHE VIA XHR
    // ===============================================================
    try {
      var XP = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
      if (XP && !XP.send.__novaV91) {
        var origOpen = XP.open;
        var origSend = XP.send;
        XP.open = function (m, u) { try { this.__novaUrl = u; } catch (e) {} return origOpen.apply(this, arguments); };
        XP.send = function (body) {
          var b = body;
          try {
            if (typeof body === 'string' && body.charAt(0) === '{') {
              var obj = JSON.parse(body);
              if (obj && typeof obj === 'object' && estAppelIA(this.__novaUrl || '', obj)) {
                var dm = extraireDernierMessage(obj);
                if (dm) {
                  var sg = analyserSignaux(dm);
                  try { ajouterCourt('utilisateur', dm); apprendreDuMessage(dm); } catch (e) {}
                  injecterPrompt(obj, construirePrompt(dm, sg));
                  b = JSON.stringify(obj);
                }
              }
            }
          } catch (e) { b = body; }
          return origSend.call(this, b);
        };
        XP.send.__novaV91 = true;
      }
    } catch (e) {}

    // ===============================================================
    // 13) BOUCHE VIA callNovaAI
    // ===============================================================
    function brancherCallNovaAI() {
      try {
        if (window.__novaBrancheeV91) return true;
        if (typeof window.callNovaAI !== 'function') return false;
        var ancienne = window.callNovaAI;
        window.callNovaAI = async function (message, historique) {
          try {
            ajouterCourt('utilisateur', message);
            apprendreDuMessage(message);
            var rep = await ancienne.apply(this, arguments);
            if (typeof rep === 'string') {
              ajouterCourt('nova', rep);
              return nettoyerTexte(rep);
            }
            return rep;
          } catch (e) { return ancienne.apply(this, arguments); }
        };
        window.__novaBrancheeV91 = true;
        return true;
      } catch (e) { return false; }
    }
    function demarrerCall() {
      if (brancherCallNovaAI()) return;
      var essais = 0;
      var timer = setInterval(function () {
        essais++;
        if (brancherCallNovaAI() || essais >= 120) clearInterval(timer);
      }, 250);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(demarrerCall, 0); });
    else setTimeout(demarrerCall, 0);

    // ===============================================================
    // 14) REACTIONS
    // ===============================================================
    document.addEventListener('click', function (ev) {
      try {
        var cible = null;
        if (ev.target && ev.target.closest) cible = ev.target.closest('[data-reaction], .reaction-btn, [data-like]');
        if (!cible) return;
        var indices = [cible.getAttribute('data-reaction'), cible.getAttribute('data-like'), cible.getAttribute('aria-label'), cible.getAttribute('title'), cible.className && String(cible.className), cible.id, cible.textContent].join(' ').toLowerCase();
        var negatif = /dislike|thumbs?-?down|down|negat|bad|nul|mauvais|pouce.?bas|\u{1F44E}|\u{1F61E}|\u{1F620}|\u{1F621}|\u{1F622}/u.test(indices);
        var positif = !negatif && /like|up|good|love|bien|top|super|pouce|\u{1F44D}|\u2764|\u{1F60D}|\u{1F60A}|\u{1F604}/u.test(indices);
        if (!negatif && !positif) return;
        appliquerAvis(positif);
      } catch (e) {}
    }, true);

    try { console.log('[NOVA V9.1] Branchee a la bouche - propre, joyeuse, energetique'); } catch (e) {}

  } catch (erreurGlobale) {
    try { console.warn('[NOVA V9.1] desactivee :', erreurGlobale); } catch (e) {}
  }
})();
