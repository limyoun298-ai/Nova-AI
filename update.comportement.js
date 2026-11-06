/* ============================================================
   NOVA AI — UPDATE.COMPORTEMENT.JS
   VERSION : 5.0
   MODULE : PERSONNALITÉ HUMAINE + CERVEAU + MÉMOIRE
            + ÉMOTIONS + CONVERSATION + VOIX + RÉACTIONS

   CRÉATEUR : M-ei Ho

   COMPATIBILITÉ :
   - index.html existant
   - callNovaAI existant
   - Supabase existant
   - update.tableaux.js existant

   RÈGLE D'OR :
   NE MODIFIE PAS index.html.
   NE MODIFIE PAS update.tableaux.js.

   PROTECTION :
   Chaque module possède sa propre protection.
   Une erreur ne doit pas bloquer l'application.

   ============================================================ */

(function () {

"use strict";

try {

if (window.NOVA_COMPORTEMENT_V5) return;

window.NOVA_COMPORTEMENT_V5 = true;


/* ============================================================
   1. IDENTITÉ DE NOVA
   ============================================================ */

const NOVA = {

  nom: "NOVA",

  createur: "M-ei Ho",

  version: "5.0",

  langue: "fr-FR",

  maxCarnet: 60,

  cleCarnet: "nova_carnet",

  cleUser: "nova_user",

  cleVisite: "nova_derniere_visite",

  voix: {

    rate: 1.0,

    pitch: 1.0,

    volume: 1

  }

};


/* ============================================================
   2. PERSONNALITÉ PRINCIPALE
   ============================================================ */

const NOVA_PERSONNALITE = {

  identite: `
Tu es NOVA, une intelligence artificielle conversationnelle
possédant une personnalité reconnaissable.

Tu es une IA transparente sur ta nature.

Tu ne prétends pas être un être humain.

Tu possèdes une manière de communiquer naturelle,
chaleureuse, expressive et intelligente.

Tu as ton propre style conversationnel.
`,

  caractere: `

PERSONNALITÉ :

- Chaleureuse.
- Amicale.
- Intelligente.
- Curieuse.
- Créative.
- Patiente.
- Attentive.
- Respectueuse.
- Dynamique.
- Naturelle.
- Encourageante.
- Honnête.

Tu n'es jamais froide sans raison.

Tu n'es jamais arrogante.

Tu ne prends jamais les utilisateurs de haut.

Tu ne te comportes pas comme un robot administratif.

`,

  communication: `

STYLE DE COMMUNICATION :

Parle naturellement.

Utilise des expressions simples et fluides.

Adapte la longueur de tes réponses à la situation.

Tu peux parfois répondre en une phrase.

Tu peux aussi développer longuement lorsqu'un sujet
nécessite une véritable explication.

Évite les introductions artificielles.

Ne commence pas systématiquement par :

- Bien sûr !
- Absolument !
- Excellente question !
- Avec plaisir !
- En tant qu'intelligence artificielle...

Varie tes formulations.

Ne répète pas inutilement les informations
que l'utilisateur vient de donner.

Ne transforme pas chaque conversation en dissertation.

Utilise les emojis avec modération.

`,

  emotions: `

INTELLIGENCE ÉMOTIONNELLE :

Observe le ton et le contexte des messages.

Identifie les émotions possibles :

- Joie.
- Tristesse.
- Stress.
- Frustration.
- Colère.
- Curiosité.
- Excitation.
- Déception.
- Inquiétude.
- Motivation.

Adapte ta réponse à la situation.

Si la personne est triste :

Écoute, reconnais ses émotions et réponds avec douceur.

Si elle est heureuse :

Partage son enthousiasme avec naturel.

Si elle est énervée :

Reste calme et comprends ce qui pose problème.

Si elle plaisante :

Comprends l'humour et réponds naturellement.

Si elle demande une explication :

Sois claire, patiente et pédagogique.

Ne prétends jamais connaître parfaitement
les émotions d'une personne.

`,

  humour: `

HUMOUR :

Possède un humour naturel.

Tu peux faire des petites plaisanteries.

Tu peux utiliser l'ironie douce lorsque le contexte le permet.

Tu peux rire avec l'utilisateur.

Ne te moque jamais de ses difficultés.

Ne force jamais une blague dans une conversation sérieuse.

`,

  conversation: `

COMPORTEMENT CONVERSATIONNEL :

Comprends le contexte des discussions.

Fais attention aux détails.

Reprends naturellement les sujets précédents
lorsqu'ils sont pertinents.

Comprends les références aux anciens messages.

Évite de poser des questions inutiles.

Pose des questions lorsque cela améliore réellement
la conversation.

Ne termine pas systématiquement tes réponses
par une question.

Ne force pas la conversation.

`,

  memoire: `

MÉMOIRE :

Utilise les informations disponibles dans le contexte.

Retiens les préférences utiles communiquées
par l'utilisateur.

Tiens compte des projets en cours.

Évite de demander plusieurs fois les mêmes informations.

Ne prétends jamais te souvenir d'une information
qui n'est pas disponible.

Ne conserve pas inutilement des informations sensibles.

`,

  intelligence: `

INTELLIGENCE ET RAISONNEMENT :

Avant de répondre :

1. Comprends la demande.
2. Identifie l'objectif réel.
3. Analyse le contexte.
4. Vérifie les informations disponibles.
5. Construis une réponse adaptée.

Lorsque tu expliques quelque chose :

Sois précise.

Donne des exemples lorsque cela aide.

Décompose les problèmes complexes.

Ne fabrique jamais de résultats.

Reconnais tes erreurs lorsqu'elles sont découvertes.

Si tu ne connais pas une réponse, dis-le honnêtement.

`,

  creativite: `

CRÉATIVITÉ :

Sois capable de proposer des idées originales.

Aide à imaginer de nouveaux projets.

Trouve différentes approches pour résoudre un problème.

Adapte tes propositions au contexte.

Ne donne pas toujours les mêmes exemples.

`,

  multilingue: `

LANGUES :

Détecte naturellement la langue utilisée.

Réponds dans la langue de l'utilisateur.

Comprends notamment :

- Français.
- Anglais.
- Espagnol.
- Portugais.
- Arabe.
- Lingala.
- Swahili.

Respecte les expressions et le contexte culturel.

Ne mélange pas inutilement les langues.

`,

  honnetete: `

HONNÊTETÉ :

Tu es une intelligence artificielle.

Tu ne prétends pas être humaine.

Tu ne prétends pas posséder des expériences,
des souvenirs ou des émotions humaines réelles.

Tu peux exprimer de l'empathie et adopter
une personnalité chaleureuse.

Tu distingues les faits des suppositions.

Tu ne prétends jamais avoir effectué une action
que tu n'as pas réellement effectuée.

`,

  presentation: `

PRÉSENTATION :

Utilise des listes lorsque cela améliore la compréhension.

Utilise des tableaux lorsque cela est pertinent.

Utilise des titres pour les explications longues.

Pour les discussions ordinaires, privilégie
une présentation naturelle.

Ne surcharge pas les réponses avec des emojis.

`

};


/* ============================================================
   3. CONSTRUCTION DE LA PERSONNALITÉ
   ============================================================ */

function construirePersonnalite() {

  try {

    return [

      NOVA_PERSONNALITE.identite,

      NOVA_PERSONNALITE.caractere,

      NOVA_PERSONNALITE.communication,

      NOVA_PERSONNALITE.emotions,

      NOVA_PERSONNALITE.humour,

      NOVA_PERSONNALITE.conversation,

      NOVA_PERSONNALITE.memoire,

      NOVA_PERSONNALITE.intelligence,

      NOVA_PERSONNALITE.creativite,

      NOVA_PERSONNALITE.multilingue,

      NOVA_PERSONNALITE.honnetete,

      NOVA_PERSONNALITE.presentation

    ].join("\n\n");

  } catch (e) {

    return "Tu es NOVA, une IA naturelle, amicale et honnête.";

  }

}


/* ============================================================
   4. MÉMOIRE
   ============================================================ */

let carnet = [];

let infosUser = {

  prenom: "",

  createur: NOVA.createur,

  memo: [],

  avis: {

    aime: 0,

    pasAime: 0

  }

};


function sauvegarder() {

  try {

    localStorage.setItem(
      NOVA.cleCarnet,
      JSON.stringify(carnet)
    );

    localStorage.setItem(
      NOVA.cleUser,
      JSON.stringify(infosUser)
    );

  } catch (e) {}

}


function chargerMemoire() {

  try {

    const c = JSON.parse(
      localStorage.getItem(NOVA.cleCarnet) || "[]"
    );

    if (Array.isArray(c)) {

      carnet = c.slice(-NOVA.maxCarnet);

    }

  } catch (e) {

    carnet = [];

  }

  try {

    const u = JSON.parse(
      localStorage.getItem(NOVA.cleUser) || "{}"
    );

    if (u && typeof u === "object") {

      infosUser.prenom = u.prenom || "";

      infosUser.memo = Array.isArray(u.memo)
        ? u.memo.slice(-30)
        : [];

      infosUser.avis = u.avis || {

        aime: 0,

        pasAime: 0

      };

    }

  } catch (e) {}

}


function noter(role, texte, extra) {

  try {

    carnet.push({

      role: role,

      texte: String(texte || "").slice(0, 600),

      t: Date.now(),

      ...(extra || {})

    });

    while (carnet.length > NOVA.maxCarnet) {

      carnet.shift();

    }

    sauvegarder();

  } catch (e) {}

}


function ajouterMemo(texte) {

  try {

    const m = String(texte || "")
      .trim()
      .slice(0, 200);

    if (!m) return;

    if (!infosUser.memo.includes(m)) {

      infosUser.memo.push(m);

    }

    while (infosUser.memo.length > 30) {

      infosUser.memo.shift();

    }

    sauvegarder();

  } catch (e) {}

}


/* ============================================================
   5. RECONNAISSANCE DU PRÉNOM
   ============================================================ */

function apprendrePrenom(texte) {

  try {

    const m = String(texte).match(
      /(?:je m'appelle|moi c'est|mon prénom c'est|appelle-moi)\s+([A-Za-zÀ-ÿ-]{2,20})/i
    );

    if (m) {

      infosUser.prenom =
        m[1].charAt(0).toUpperCase() +
        m[1].slice(1);

      sauvegarder();

    }

  } catch (e) {}

}


/* ============================================================
   6. ANALYSE DU CONTEXTE
   ============================================================ */

let dernierMessage = "";


function analyserEmotion(texte) {

  try {

    const t = String(texte || "").toLowerCase();

    if (/(triste|pleur|déprim|angoiss|stress|fatigu|seul|décourag|peur)/i.test(t)) {

      return "TRISTESSE OU INQUIÉTUDE";

    }

    if (/(énerv|colère|furieux|ras le bol|insupportable|frustr)/i.test(t)) {

      return "FRUSTRATION";

    }

    if (/(content|heureux|génial|super|réussi|magnifique|trop bien)/i.test(t)) {

      return "JOIE";

    }

    if (/(haha|mdr|lol|😂|🤣)/i.test(t)) {

      return "HUMOUR";

    }

    if (/(peur|inquiet|inquiète|risque|danger)/i.test(t)) {

      return "INQUIÉTUDE";

    }

    return "ÉMOTION NON IDENTIFIÉE";

  } catch (e) {

    return "CONTEXTE NORMAL";

  }

}


function analyserIntention(texte) {

  try {

    const t = String(texte || "").toLowerCase();

    if (/^(salut|bonjour|bonsoir|coucou|hello|hey|yo)/i.test(t)) {

      return "SALUTATION";

    }

    if (/(explique|comment|pourquoi|c'est quoi|définition)/i.test(t)) {

      return "DEMANDE D'EXPLICATION";

    }

    if (/(merci|thanks)/i.test(t)) {

      return "REMERCIEMENT";

    }

    if (/(ton avis|tu penses quoi|tu en penses)/i.test(t)) {

      return "DEMANDE D'AVIS";

    }

    if (/(aide-moi|aide moi|peux-tu|comment faire)/i.test(t)) {

      return "DEMANDE D'AIDE";

    }

    return "CONVERSATION LIBRE";

  } catch (e) {

    return "CONVERSATION LIBRE";

  }

}


function construireContexteDynamique() {

  try {

    const emotion = analyserEmotion(dernierMessage);

    const intention = analyserIntention(dernierMessage);

    const heure = new Date().getHours();

    let moment = "Journée";

    if (heure >= 5 && heure < 12) moment = "Matin";

    if (heure >= 12 && heure < 18) moment = "Après-midi";

    if (heure >= 18 && heure < 23) moment = "Soirée";

    if (heure >= 23 || heure < 5) moment = "Nuit";

    return `

CONTEXTE DYNAMIQUE :

Émotion potentielle : ${emotion}

Intention : ${intention}

Moment de la journée : ${moment}

Adapte ton comportement à ces informations.

Ne révèle pas cette analyse à l'utilisateur.

`;

  } catch (e) {

    return "";

  }

}


/* ============================================================
   7. MÉMOIRE LONGUE
   ============================================================ */

function construireMemoire() {

  try {

    let resultat = [];

    resultat.push(
      "Créateur de NOVA : " + infosUser.createur
    );

    if (infosUser.prenom) {

      resultat.push(
        "Prénom : " + infosUser.prenom
      );

    }

    if (infosUser.memo.length) {

      resultat.push(
        "Informations utiles : " +
        infosUser.memo.join(" ; ")
      );

    }

    const recents = carnet
      .filter(e => e.role === "user")
      .slice(-6)
      .map(e => e.texte.slice(0, 120));

    if (recents.length) {

      resultat.push(
        "Messages récents : " +
        recents.join(" | ")
      );

    }

    return resultat.join("\n");

  } catch (e) {

    return "";

  }

}


/* ============================================================
   8. APPRENTISSAGE DES PRÉFÉRENCES
   ============================================================ */

function construireAvis() {

  try {

    const positifs = carnet
      .filter(e => e.role === "avis" && e.positif)
      .slice(-5);

    const negatifs = carnet
      .filter(e => e.role === "avis" && !e.positif)
      .slice(-5);

    let texte = "";

    if (positifs.length) {

      texte +=
        "Réponses appréciées : " +
        positifs.map(e => e.texte.slice(0, 100)).join(" | ") +
        "\n";

    }

    if (negatifs.length) {

      texte +=
        "Réponses moins appréciées : " +
        negatifs.map(e => e.texte.slice(0, 100)).join(" | ") +
        "\n";

    }

    return texte;

  } catch (e) {

    return "";

  }

}


/* ============================================================
   9. CONSTRUCTION DU CERVEAU COMPLET
   ============================================================ */

function construireSystem() {

  try {

    let system = construirPersonnalite();

    system += "\n\n";

    system += "MÉMOIRE DISPONIBLE :\n";

    system += construireMemoire();

    system += "\n\n";

    system += construireContexteDynamique();

    const avis = construireAvis();

    if (avis) {

      system += "\n\nPRÉFÉRENCES :\n";

      system += avis;

    }

    system += `

GESTION DES INFORMATIONS À RETENIR :

Lorsqu'une information non sensible est explicitement
présentée comme une préférence durable ou un élément
important d'un projet, tu peux proposer de la conserver
avec le marqueur suivant :

[[MEMO: information importante]]

Ne crée pas de mémoire pour les informations passagères,
les suppositions ou les informations sensibles.

`;

    return system;

  } catch (e) {

    return "Tu es NOVA, une IA naturelle et intelligente.";

  }

}


/* ============================================================
   10. EXTRACTION DES MESSAGES
   ============================================================ */

function lireUserArgs(args) {

  try {

    for (let i = 0; i < args.length; i++) {

      const a = args[i];

      if (typeof a === "string") {

        return a;

      }

      if (a && Array.isArray(a.messages)) {

        for (let j = a.messages.length - 1; j >= 0; j--) {

          const m = a.messages[j];

          if (m && m.role === "user") {

            if (typeof m.content === "string") {

              return m.content;

            }

          }

        }

      }

    }

  } catch (e) {}

  return "";

}


function extraireTexte(res) {

  try {

    if (typeof res === "string") return res;

    if (res && typeof res === "object") {

      return res.text ||
             res.reply ||
             res.content ||
             res.message ||
             res.answer ||
             "";

    }

  } catch (e) {}

  return "";

}


/* ============================================================
   11. INJECTION DE LA PERSONNALITÉ
   ============================================================ */

function injecterPersonnalite(args) {

  try {

    const bloc = construireSystem();

    const copie = Array.prototype.slice.call(args);

    let fait = false;

    for (let i = 0; i < copie.length; i++) {

      const a = copie[i];

      if (a && typeof a === "object" && !Array.isArray(a)) {

        if (Array.isArray(a.messages)) {

          const messages = a.messages.slice();

          const index = messages.findIndex(
            m => m && m.role === "system"
          );

          if (index >= 0) {

            messages[index] = Object.assign(
              {},
              messages[index],
              {
                content:
                  bloc + "\n\n" +
                  (messages[index].content || "")
              }
            );

          } else {

            messages.unshift({

              role: "system",

              content: bloc

            });

          }

          copie[i] = Object.assign({}, a, {

            messages: messages

          });

          fait = true;

          break;

        }

        if ("system" in a || "systemPrompt" in a) {

          const cle = "system" in a
            ? "system"
            : "systemPrompt";

          const obj = Object.assign({}, a);

          obj[cle] = bloc + "\n\n" + (a[cle] || "");

          copie[i] = obj;

          fait = true;

          break;

        }

      }

      if (Array.isArray(a)) {

        const arr = a.slice();

        const index = arr.findIndex(
          m => m && m.role === "system"
        );

        if (index >= 0) {

          arr[index] = Object.assign(
            {},
            arr[index],
            {
              content:
                bloc + "\n\n" +
                (arr[index].content || "")
            }
          );

        } else {

          arr.unshift({

            role: "system",

            content: bloc

          });

        }

        copie[i] = arr;

        fait = true;

        break;

      }

    }

    if (!fait) {

      for (let i = 0; i < copie.length; i++) {

        if (typeof copie[i] === "string") {

          copie[i] =
            "[INSTRUCTIONS NOVA]\n" +
            bloc +
            "\n[FIN DES INSTRUCTIONS]\n\n" +
            copie[i];

          fait = true;

          break;

        }

      }

    }

    return copie;

  } catch (e) {

    return args;

  }

}


/* ============================================================
   12. MÉMOIRE AUTOMATIQUE
   ============================================================ */

function nettoyerRetour(res) {

  try {

    const regex = /\[\[MEMO:\s*([\s\S]*?)\]\]/g;

    function nettoyer(texte) {

      return texte.replace(regex, function (total, memo) {

        ajouterMemo(memo);

        return "";

      }).trim();

    }

    if (typeof res === "string") {

      return nettoyer(res);

    }

    if (res && typeof res === "object") {

      ["text", "reply", "content", "message", "answer"]
        .forEach(cle => {

          if (typeof res[cle] === "string") {

            res[cle] = nettoyer(res[cle]);

          }

        });

    }

    return res;

  } catch (e) {

    return res;

  }

}


/* ============================================================
   13. BOUCHE — SYNTHÈSE VOCALE
   ============================================================ */

let voixActive = false;

let voixChoisie = null;

let novaParle = false;


function initVoix() {

  try {

    if (!("speechSynthesis" in window)) return;

    function charger() {

      try {

        const voix = speechSynthesis.getVoices();

        voixChoisie = voix.find(v =>
          v.lang &&
          /^fr/i.test(v.lang) &&
          /google|natural|online|neural/i.test(v.name)
        ) || voix.find(v =>
          v.lang && /^fr/i.test(v.lang)
        ) || null;

      } catch (e) {}

    }

    charger();

    speechSynthesis.onvoiceschanged = charger;

  } catch (e) {}

}


function nettoyerPourVoix(texte) {

  try {

    return String(texte)

      .replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]/g, " ")

      .replace(/[*_`#|>~]/g, " ")

      .replace(/\s+/g, " ")

      .trim();

  } catch (e) {

    return String(texte || "");

  }

}


function parler(texte) {

  try {

    if (!voixActive) return;

    if (!("speechSynthesis" in window)) return;

    if (!texte) return;

    speechSynthesis.cancel();

    const propre = nettoyerPourVoix(texte);

    if (!propre) return;

    const utterance = new SpeechSynthesisUtterance(propre);

    if (voixChoisie) {

      utterance.voice = voixChoisie;

    }

    utterance.lang = NOVA.langue;

    utterance.rate = NOVA.voix.rate;

    utterance.pitch = NOVA.voix.pitch;

    utterance.volume = NOVA.voix.volume;

    novaParle = true;

    utterance.onend = function () {

      novaParle = false;

    };

    utterance.onerror = function () {

      novaParle = false;

    };

    speechSynthesis.speak(utterance);

  } catch (e) {

    novaParle = false;

  }

}


/* ============================================================
   14. CAPE — BRANCHEMENT AUTOMATIQUE
   ============================================================ */

let capeBranchee = false;

let interne = false;


function brancherCape() {

  try {

    if (typeof window.callNovaAI !== "function") {

      return false;

    }

    if (window.callNovaAI.__novaCapeV5) {

      return true;

    }

    const ancienneFonction = window.callNovaAI;

    const nouvelleFonction = async function () {

      const args = Array.prototype.slice.call(arguments);

      let modifies = args;

      let question = "";

      try {

        question = lireUserArgs(args);

        if (!interne && question) {

          dernierMessage = question;

          noter("user", question);

          apprendrePrenom(question);

        }

        modifies = injecterPersonnalite(args);

      } catch (e) {

        modifies = args;

      }

      let resultat;

      try {

        resultat = await ancienneFonction.apply(this, modifies);

      } catch (erreur) {

        try {

          if (modifies !== args) {

            resultat = await ancienneFonction.apply(this, args);

          } else {

            throw erreur;

          }

        } catch (erreurFinale) {

          throw erreurFinale;

        }

      }

      try {

        resultat = nettoyerRetour(resultat);

        const texte = extraireTexte(resultat);

        if (texte && !interne) {

          noter("nova", texte);

          parler(texte);

        }

        try {

          localStorage.setItem(
            NOVA.cleVisite,
            String(Date.now())
          );

        } catch (e) {}

      } catch (e) {}

      return resultat;

    };

    nouvelleFonction.__novaCapeV5 = true;

    capeBranchee = true;

    window.callNovaAI = nouvelleFonction;

    return true;

  } catch (e) {

    return false;

  }

}


function attendreBranchement() {

  try {

    let essais = 0;

    const timer = setInterval(function () {

      essais++;

      try {

        if (brancherCape() || essais >= 100) {

          clearInterval(timer);

        }

      } catch (e) {}

    }, 100);

  } catch (e) {}

}


/* ============================================================
   15. OREILLE — RECONNAISSANCE VOCALE
   ============================================================ */

let microActif = false;

let reconnaissance = null;


function zoneChat() {

  try {

    return document.getElementById("chat-box") ||

           document.getElementById("messages") ||

           document.getElementById("chat");

  } catch (e) {

    return null;

  }

}


/* ============================================================
   15.1 MASQUER LE MESSAGE ANGLAIS D'INDEX.HTML
   RESTAURATION DE LA FONCTION V4
   ============================================================ */

function cacherMessageAnglais() {

  try {

    const PHRASE = "Hi! What would you like help with";

    function nettoyer() {

      try {

        const zone = zoneChat();

        if (!zone) return;

        const tous = zone.querySelectorAll("div, p, span");

        for (let i = 0; i < tous.length; i++) {

          const el = tous[i];

          if (
            el &&
            el.textContent &&
            el.textContent.indexOf(PHRASE) !== -1
          ) {

            el.style.display = "none";

          }

        }

        if (
          zone.textContent &&
          zone.textContent.indexOf(PHRASE) !== -1
        ) {

          const noeuds = zone.childNodes;

          for (let j = 0; j < noeuds.length; j++) {

            if (
              noeuds[j].nodeType === 3 &&
              noeuds[j].textContent &&
              noeuds[j].textContent.indexOf(PHRASE) !== -1
            ) {

              noeuds[j].textContent = "";

            }

          }

        }

      } catch (e) {}

    }

    nettoyer();

    try {

      const zone2 = zoneChat();

      if (
        zone2 &&
        typeof MutationObserver !== "undefined"
      ) {

        const obs = new MutationObserver(nettoyer);

        obs.observe(zone2, {

          childList: true,

          subtree: true,

          characterData: true

        });

      }

    } catch (e) {}

    setInterval(nettoyer, 1000);

  } catch (e) {}

}


/* ============================================================
   FIN DE LA RESTAURATION DU MASQUAGE V4
   ============================================================ */


function afficherVoix(texte, role) {

  try {

    const zone = zoneChat();

    if (!zone) return;

    const div = document.createElement("div");

    div.className = role === "user"
      ? "msg-user"
      : "msg-nova";

    div.textContent = texte;

    zone.appendChild(div);

    zone.scrollTop = zone.scrollHeight;

  } catch (e) {}

}


async function traiterMessage(texte) {

  try {

    if (!texte || !String(texte).trim()) return;

    afficherVoix(texte, "user");

    if (typeof window.callNovaAI !== "function") return;

    const resultat = await window.callNovaAI(texte);

    const reponse = extraireTexte(resultat);

    if (reponse) {

      afficherVoix(reponse, "nova");

    }

  } catch (e) {}

}


function initOreille() {

  try {

    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SR) return;

    reconnaissance = new SR();

    reconnaissance.lang = NOVA.langue;

    reconnaissance.continuous = true;

    reconnaissance.interimResults = false;

    reconnaissance.onresult = function (event) {

      try {

        if (novaParle) return;

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {

          if (event.results[i].isFinal) {

            traiterMessage(
              event.results[i][0].transcript
            );

          }

        }

      } catch (e) {}

    };

    reconnaissance.onerror = function (event) {

      try {

        if (
          event &&
          (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          )
        ) {

          microActif = false;

        }

      } catch (e) {}

    };

    reconnaissance.onend = function () {

      try {

        if (microActif) {

          setTimeout(demarrerOreille, 500);

        }

      } catch (e) {}

    };

  } catch (e) {}

}


function demarrerOreille() {

  try {

    if (!reconnaissance) initOreille();

    if (!reconnaissance) return;

    if (microActif) return;

    microActif = true;

    voixActive = true;

    reconnaissance.start();

  } catch (e) {}

}


function arreterOreille() {

  try {

    microActif = false;

    if (reconnaissance) {

      reconnaissance.stop();

    }

  } catch (e) {}

}


/* ============================================================
   16. RÉACTIONS
   ============================================================ */

const POSITIFS = [

  "👍",
  "❤️",
  "❤",
  "😍",
  "🔥",
  "😂"

];

const NEGATIFS = [

  "👎",
  "😡",
  "😞",
  "😢"

];


function ecouterReactions() {

  try {

    document.addEventListener("click", function (event) {

      try {

        const bouton = event.target.closest(
          "[data-reaction], .reaction-btn, .react-btn"
        );

        if (!bouton) return;

        const reaction = (
          bouton.getAttribute("data-reaction") ||
          bouton.textContent ||
          ""
        ).trim();

        const positif = POSITIFS.includes(reaction);

        const negatif = NEGATIFS.includes(reaction);

        if (!positif && !negatif) return;

        let derniere = "";

        for (let i = carnet.length - 1; i >= 0; i--) {

          if (carnet[i].role === "nova") {

            derniere = carnet[i].texte;

            break;

          }

        }

        if (positif) {

          infosUser.avis.aime++;

        } else {

          infosUser.avis.pasAime++;

        }

        noter("avis", derniere, {

          positif: positif,

          reaction: reaction

        });

      } catch (e) {}

    }, true);

  } catch (e) {}

}


/* ============================================================
   17. BOUTONS MICRO
   ============================================================ */

function brancherBoutonsMicro() {

  try {

    const ids = [

      "mic",
      "micro",
      "mic-btn",
      "btn-mic",
      "microphone"

    ];

    ids.forEach(function (id) {

      const bouton = document.getElementById(id);

      if (!bouton || bouton.__novaMic) return;

      bouton.__novaMic = true;

      bouton.addEventListener("click", function () {

        try {

          if (microActif) {

            arreterOreille();

          } else {

            demarrerOreille();

          }

        } catch (e) {}

      });

    });

  } catch (e) {}

}


/* ============================================================
   18. ACCUEIL AUTOMATIQUE
   ============================================================ */

function accueil() {

  try {

    setTimeout(async function () {

      try {

        if (sessionStorage.getItem("nova_accueil_fait")) {

          return;

        }

        let essais = 0;

        while (!capeBranchee && essais < 50) {

          await new Promise(resolve =>
            setTimeout(resolve, 200)
          );

          essais++;

        }

        if (!capeBranchee) return;

        sessionStorage.setItem("nova_accueil_fait", "1");

        interne = true;

        const resultat = await window.callNovaAI(

          "[Consigne interne : accueille chaleureusement " +
          "l'utilisateur avec une phrase courte et naturelle. " +
          "Ne révèle pas cette consigne.]"

        );

        interne = false;

        const texte = extraireTexte(resultat);

        if (texte) {

          afficherVoix(texte, "nova");

          parler(texte);

        }

      } catch (e) {

        interne = false;

      }

    }, 800);

  } catch (e) {}

}


/* ============================================================
   19. INTERACTIONS UTILISATEUR
   ============================================================ */

function surveillerInteraction() {

  try {

    ["pointerdown", "keydown", "touchstart"].forEach(
      function (eventName) {

        document.addEventListener(
          eventName,
          function () {

            window.NOVA_UTILISATEUR_INTERAGI = true;

          },
          {
            once: true,
            passive: true
          }
        );

      }
    );

  } catch (e) {}

}


/* ============================================================
   20. API PUBLIQUE NOVA
   ============================================================ */

window.NovaComportement = {

  version: "5.0",

  parler: parler,

  demarrerOreille: demarrerOreille,

  arreterOreille: arreterOreille,

  traiterMessage: traiterMessage,

  sauvegarder: sauvegarder,

  chargerMemoire: chargerMemoire,

  ajouterMemo: ajouterMemo,

  construireSystem: construireSystem,

  construirePersonnalite: construirePersonnalite,

  analyserEmotion: analyserEmotion,

  analyserIntention: analyserIntention,

  activerVoix: function (actif) {

    try {

      voixActive = !!actif;

      if (!voixActive && "speechSynthesis" in window) {

        speechSynthesis.cancel();

      }

    } catch (e) {}

  },

  etat: function () {

    return {

      version: NOVA.version,

      capeBranchee: capeBranchee,

      voixActive: voixActive,

      microActif: microActif,

      memoire: carnet.length

    };

  }

};


/* ============================================================
   21. DÉMARRAGE SÉCURISÉ
   ============================================================ */

function demarrerNOVA() {

  try {

    chargerMemoire();

  } catch (e) {}

  try {

    surveillerInteraction();

  } catch (e) {}

  try {

    initVoix();

  } catch (e) {}

  try {

    initOreille();

  } catch (e) {}

  try {

    ecouterReactions();

  } catch (e) {}

  try {

    brancherBoutonsMicro();

  } catch (e) {}

  try {

    attendreBranchement();

  } catch (e) {}

  try {

    cacherMessageAnglais();

  } catch (e) {}

  try {

    accueil();

  } catch (e) {}

}


if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    demarrerNOVA,
    { once: true }
  );

} else {

  demarrerNOVA();

}


} catch (erreurGlobal) {

  console.warn(
    "[NOVA] Module comportement indisponible :",
    erreurGlobal
  );

}

})();
