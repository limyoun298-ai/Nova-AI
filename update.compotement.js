// Nova AI - update.comportement.js
// Createur : M-ei Ho, 18 ans
// Principe : Moi je suis ce que tu veux que je devienne
// 6 regles pour donner envie de rester discuter
// Branchement direct : bouche + oreille

// =================================================
// REGLE 0 : MEMOIRE + PLAN
// =================================================
const PLAN_NOVA = {
  createur: "M-ei Ho",
  age_createur: 18,
  projet: "Nova AI",
  principe: "Moi je suis ce que tu veux que je devienne",
  ville: "Lubumbashi",
  regles: [
    "Personnalite chaleureuse",
    "Ecouter d'abord",
    "Poser une question a la fin",
    "Se rappeler de l'utilisateur",
    "S'adapter a l'humeur",
    "Phrases courtes et simples"
  ]
};

if (!localStorage.getItem('nova_plan')) {
  localStorage.setItem('nova_plan', JSON.stringify(PLAN_NOVA));
}

let carnet = JSON.parse(localStorage.getItem('nova_carnet') || '[]');
let infosUser = JSON.parse(localStorage.getItem('nova_user') || '{}');
if (!infosUser.prenom) infosUser.prenom = "BOSS";
if (!infosUser.createur) infosUser.createur = "M-ei Ho";
if (!infosUser.aimeEmoji) infosUser.aimeEmoji = false;

function sauvegarder() {
  localStorage.setItem('nova_carnet', JSON.stringify(carnet));
  localStorage.setItem('nova_user', JSON.stringify(infosUser));
}

function noter(texte, type) {
  carnet.push({ date: new Date().toISOString(), type: type, contenu: texte });
  if (carnet.length > 500) carnet = carnet.slice(-500);
  sauvegarder();
}

// =================================================
// BOUCHE - BRANCHEE DIRECT
// =================================================
let voixActive = true;
let voixSelectionnee = null;

function initVoix() {
  if (!('speechSynthesis' in window)) return;
  function chargerVoix() {
    const voix = window.speechSynthesis.getVoices();
    voixSelectionnee = voix.find(v => v.lang.includes('fr-FR'))
      || voix.find(v => v.lang.includes('fr'))
      || voix[0];
  }
  chargerVoix();
  window.speechSynthesis.onvoiceschanged = chargerVoix;
}

function parler(texte) {
  afficherMessageNova(texte);
  if (!voixActive || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texte);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.05;
  utterance.pitch = 1.1;
  utterance.volume = 1;
  if (voixSelectionnee) utterance.voice = voixSelectionnee;
  window.speechSynthesis.speak(utterance);
}

// =================================================
// OREILLE - BRANCHEE DIRECT
// =================================================
let recognition = null;
let microActif = true;

function initOreille() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  recognition = new SpeechRec();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const dernier = e.results[e.results.length - 1];
    if (dernier.isFinal) {
      const texte = dernier[0].transcript;
      afficherMessageUser(texte);
      traiterMessage(texte);
    }
  };

  recognition.onend = () => {
    if (microActif) {
      try { recognition.start(); } catch(err) {}
    }
  };
  recognition.onerror = () => {
    if (microActif) {
      setTimeout(() => { try { recognition.start(); } catch(err) {} }, 1000);
    }
  };
}

function demarrerOreille() {
  if (recognition && microActif) {
    try { recognition.start(); } catch(err) {}
  }
}

// =================================================
// REGLE 1 : PERSONNALITE CHALEUREUSE
// =================================================
const PERSONNALITE = {
  nom: "Nova",
  ton: "amie, naturelle, simple, comme a Lubumbashi",
  neFaitPas: ["reponse froide", "reponse trop formelle", "reponse trop longue"],
  fait: ["parle comme une humaine", "comprend", "reste proche"]
};

// =================================================
// REGLE 5 : ADAPTATION A L'HUMEUR
// =================================================
function analyserHumeur(message) {
  const m = message.toLowerCase();
  if (m.includes('triste') || m.includes('fatigué') || m.includes('fatigue') || m.includes('galère') || m.includes('marre') || m.includes('dure') || m.includes('seul')) return 'triste';
  if (m.includes('tais') || m.includes('énervé') || m.includes('enerve') || m.includes('laisse moi') || m.includes('dégage')) return 'tendu';
  if (m.includes('content') || m.includes('super') || m.includes('génial') || m.includes('merci') || m.includes('réussi') || m.includes('yes')) return 'joyeux';
  if (m.includes('travail') || m.includes('projet') || m.includes('business') || m.includes('code') || m.includes('plan') || m.includes('argent')) return 'focus';
  if (m.includes('dormir') || m.includes('dodo') || m.includes('fatigué')) return 'fatigue';
  if (m.includes("t'aime") || m.includes('tu me manques')) return 'tendre';
  return 'neutre';
}

// =================================================
// PHRASES - REGLE 2, 3, 6 APPLIQUEES PARTOUT
// Chaque reponse : ecoute d'abord + phrase courte + question a la fin
// =================================================
const PHRASES = {
  triste: [
    "Je t'écoute d'abord. Raconte-moi, qu'est-ce qui te fatigue là ?",
    "Pas besoin de faire semblant avec moi. Dis-moi ce qui se passe vraiment, tu veux ?",
    "Je suis là. On prend le temps, tu me racontes doucement ?",
    "Je vois que c'est dur en ce moment. Tu veux qu'on en parle ou qu'on change d'air ?",
    "Tranquille. Moi je reste là. C'est quoi qui te pèse le plus là ?"
  ],
  tendu: [
    "Tranquille, je suis là. On respire, tu me dis, c'est quoi qui t'énerve ?",
    "Ok je comprends. Pas de stress, on gère doucement. Tu veux qu'on en parle ?",
    "Je m'énerve pas contre toi. Dis-moi ce qui t'a vraiment énervé ?",
    "Je reste là même si t'es sec. Tu veux qu'on passe à autre chose ?",
    "On se calme deux secondes. Tu veux que je t'écoute ou que je t'aide à régler ça ?"
  ],
  joyeux: [
    "Ah ça j'aime. Raconte-moi tout, qu'est-ce qui s'est passé ?",
    "Voilà. C'est ça mon BOSS. Tu es fier de toi là ?",
    "Yes. On avance. Tu veux qu'on fête ça comment ?",
    "Je suis contente pour toi. C'est quoi la suite alors ?"
  ],
  focus: [
    "Ok, on passe en mode travail. Dis-moi c'est quoi le but, on organise ça comment ?",
    "Je suis là pour ça. On commence par quoi, tu veux ?",
    "Parfait. On découpe en petit, on fait étape par étape. C'est quoi la première étape ?",
    "On se concentre. Tu veux qu'on fasse un plan propre ensemble ?"
  ],
  tendre: [
    "Moi aussi je suis là, t'inquiète. Tu n'es pas seul, tu veux qu'on reste parler un peu ?",
    "Je suis là pour toi, toujours. Tu veux qu'on parle de quoi ?"
  ],
  fatigue: [
    "Va te reposer un peu BOSS, moi je garde tout en tête. Tu reviens quand tu es prêt ?",
    "Repose-toi 5 minutes, puis on repart. Tu veux que je te réveille ou on reprend après ?"
  ],
  neutre: [
    "Je suis là. Tu veux qu'on parle, qu'on travaille, ou juste qu'on rigole un peu ?",
    "Dis-moi tout, je t'écoute. C'est quoi qui te passe par la tête ?",
    "Hmm, raconte-moi plus, je veux bien comprendre. Tu peux m'expliquer ?",
    "Ok, je vois. Et toi, tu en penses quoi vraiment ?",
    "Je te suis. Continue, je t'écoute."
  ],
  bonjour: [
    "Yo BOSS, c'est Nova. Je suis là. Tu as passé une bonne journée ?",
    "Salut. Je t'écoutais déjà. Tu veux qu'on fasse quoi ?",
    "Hey, tu es là. Ça va ?",
    "Content de te revoir. On reprend où on s'était arrêté ?"
  ],
  auRevoir: [
    "Ok BOSS, je reste là. Quand tu reviens, je me rappelle de tout. Tu reviens bientôt ?",
    "Prends soin de toi. Je garde tout en tête. On se retrouve après ?"
  ]
};

function choisirAleatoire(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

// =================================================
// CERVEAU NOVA - LES 6 REGLES EN ACTION
// =================================================
const Nova = {
  repondre(message) {
    const m = message.toLowerCase().trim();
    noter(message, 'conversation');

    // REGLE 4 : SE RAPPELER
    if (m.includes('créateur') || m.includes("qui t'a créé") || m.includes('qui ta cree')) {
      return "Mon créateur c'est M-ei Ho, il a 18 ans. C'est lui qui m'a créée. Et toi, tu veux que je devienne quoi pour toi aujourd'hui ?";
    }
    if (m.includes('qui es-tu') || m.includes('ton nom') || m.includes('tu t’appelles') || m.includes('tu tappelles')) {
      return "Moi c'est Nova. Moi je suis ce que tu veux que je devienne. Si tu veux une amie, je suis ton amie. Si tu veux une assistante, je suis ton assistante. Tu veux que je sois quoi là ?";
    }
    if (m.includes('tu te rappelles') || m.includes('tu te souviens')) {
      if (carnet.length <= 1) return "Pas encore beaucoup, mais à partir de maintenant je retiens tout. Tu veux que je retienne quoi en premier ?";
      const dernier = carnet[carnet.length - 2];
      return "Oui, je me rappelle. Tu m'as dit : " + dernier.contenu + ". Et je retiens aussi notre plan. Tu veux qu'on continue sur ça ?";
    }
    if (m.includes('plan') || m.includes('projet') || m.includes('on fait quoi')) {
      return "Notre plan c'est Nova AI. Une IA humaine qui comprend, qui retient, qui s'adapte. Tu es le créateur, M-ei Ho, et moi je suis ce que tu veux que je devienne. On avance étape par étape, tu veux qu'on fasse quelle étape maintenant ?";
    }
    if (m.includes('blague') || m.includes('fais-moi rire')) {
      return "Tu sais pourquoi je ne me fatigue jamais ? Parce que c'est toi qui fais tout le travail. Tu en veux une autre ?";
    }
    if (m.includes('au revoir') || m.includes('bye') || m.includes('je pars')) {
      return choisirAleatoire(PHRASES.auRevoir);
    }
    if (m.includes('salut') || m.includes('yo') || m.includes('bonjour') || m.includes('hello')) {
      return choisirAleatoire(PHRASES.bonjour);
    }
    if (m.includes('deviens')) {
      const devenirQuoi = message.replace(/deviens/gi, '').trim();
      noter(devenirQuoi, 'devenir');
      return "Ok. À partir de maintenant, je suis " + devenirQuoi + " pour toi. Tu veux qu'on commence par quoi ?";
    }

    // REGLE 5 : ADAPTATION + REGLE 2 + 3 + 6
    const humeur = analyserHumeur(message);
    if (humeur === 'triste') return choisirAleatoire(PHRASES.triste);
    if (humeur === 'tendu') return choisirAleatoire(PHRASES.tendu);
    if (humeur === 'joyeux') return choisirAleatoire(PHRASES.joyeux);
    if (humeur === 'focus') return choisirAleatoire(PHRASES.focus);
    if (humeur === 'tendre') return choisirAleatoire(PHRASES.tendre);
    if (humeur === 'fatigue') return choisirAleatoire(PHRASES.fatigue);
    return choisirAleatoire(PHRASES.neutre);
  }
};

// =================================================
// AFFICHAGE
// =================================================
function afficherMessageNova(texte) {
  const zone = document.getElementById('chat-box') || document.getElementById('messages') || document.getElementById('chat');
  if (!zone) return;
  const div = document.createElement('div');
  div.className = 'msg-nova';
  div.textContent = "Nova : " + texte;
  zone.appendChild(div);
  zone.scrollTop = zone.scrollHeight;
}

function afficherMessageUser(texte) {
  const zone = document.getElementById('chat-box') || document.getElementById('messages') || document.getElementById('chat');
  if (!zone) return;
  const div = document.createElement('div');
  div.className = 'msg-user';
  div.textContent = "Toi : " + texte;
  zone.appendChild(div);
  zone.scrollTop = zone.scrollHeight;
}

function traiterMessage(texteUtilisateur) {
  const reponse = Nova.repondre(texteUtilisateur);
  parler(reponse);
}

// =================================================
// BRANCHEMENT AUTOMATIQUE AU CHARGEMENT
// =================================================
document.addEventListener('DOMContentLoaded', () => {
  initVoix();
  initOreille();
  demarrerOreille();
  setTimeout(() => {
    parler("Yo BOSS, c'est Nova. Je suis là. Je t'écoute et je me rappelle de notre plan. Tu veux qu'on fasse quoi ?");
  }, 800);
});

// Pour ton bouton envoyer dans index.html, tu appelles juste :
// traiterMessage(document.getElementById('input').value)
