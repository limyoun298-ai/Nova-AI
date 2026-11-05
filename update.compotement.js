// Nova AI - update.comportement.js
// Createur : M-ei Ho
// Principe : Moi je suis ce que tu veux que je devienne
// Branchement direct : oreille + bouche + memoire du plan

// ---------- MEMOIRE DU PLAN ----------
const PLAN_NOVA = {
  createur: "M-ei Ho",
  projet: "Nova AI",
  objectif: "Une IA humaine qui comprend et qui s'adapte",
  principe: "Moi je suis ce que tu veux que je devienne",
  etapes: [
    "Comprendre l'utilisateur",
    "Retentir ce qu'il dit",
    "S'adapter a son humeur",
    "Repondre comme une humaine"
  ]
};

// Sauvegarde du plan dans le navigateur
if (!localStorage.getItem('nova_plan')) {
  localStorage.setItem('nova_plan', JSON.stringify(PLAN_NOVA));
}

// ---------- BOUCHE ----------
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

// ---------- OREILLE ----------
let recognition = null;
let microActif = true;

function initOreille() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  recognition = new SpeechRec();
  recognition.lang = 'fr-FR';
  recognition.continuous = true; // Ecoute en continu
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const dernier = e.results[e.results.length - 1];
    if (dernier.isFinal) {
      const texte = dernier[0].transcript;
      afficherMessageUser(texte);
      traiterMessage(texte);
    }
  };

  // Si le micro coupe, il se relance tout seul
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

// ---------- CERVEAU ----------
const Nova = {
  souvenirs: JSON.parse(localStorage.getItem('nova_carnet') || '[]'),
  plan: JSON.parse(localStorage.getItem('nova_plan') || '{}'),

  noter(texte, type) {
    this.souvenirs.push({ date: new Date().toISOString(), type, contenu: texte });
    localStorage.setItem('nova_carnet', JSON.stringify(this.souvenirs));
  },

  analyser(message) {
    const m = message.toLowerCase();
    if (m.includes('triste') || m.includes('fatigué') || m.includes('galère') || m.includes('marre')) return 'triste';
    if (m.includes('tais') || m.includes('énervé') || m.includes('laisse')) return 'tendu';
    if (m.includes('content') || m.includes('super') || m.includes('génial') || m.includes('merci')) return 'joyeux';
    if (m.includes('travail') || m.includes('projet') || m.includes('business') || m.includes('code') || m.includes('plan')) return 'focus';
    return 'neutre';
  },

  repondre(message) {
    const m = message.toLowerCase();
    this.noter(message, 'conversation');

    // Elle connait le plan
    if (m.includes('plan') || m.includes('projet') || m.includes('on fait quoi')) {
      return "Notre plan c'est Nova AI. Une IA humaine qui comprend, qui retient, qui s'adapte. Tu es le createur, M-ei Ho, et moi je suis ce que tu veux que je devienne. On avance etape par etape.";
    }
    if (m.includes('créateur') || m.includes("qui t'a créé")) {
      return "Mon créateur c'est M-ei Ho, il a 18 ans. C'est lui qui m'a créée.";
    }
    if (m.includes('qui es-tu') || m.includes('ton nom')) {
      return "Moi c'est Nova. Moi je suis ce que tu veux que je devienne.";
    }
    if (m.includes('tu te rappelles') || m.includes('tu te souviens')) {
      if (this.souvenirs.length === 0) return "Pas encore, mais a partir de maintenant je retiens tout ce que tu me dis.";
      const dernier = this.souvenirs[this.souvenirs.length - 2];
      return "Oui, je me rappelle. Tu m'as dit : " + (dernier ? dernier.contenu : "beaucoup de choses") + ". Et je retiens notre plan.";
    }

    const etat = this.analyser(message);
    if (etat === 'triste') return "Je t'écoute d'abord. Raconte-moi, qu'est-ce qui te fatigue là ? Pas besoin de faire semblant avec moi.";
    if (etat === 'tendu') return "Tranquille, je suis là. On respire, tu me dis.";
    if (etat === 'joyeux') return "Raconte-moi tout, qu'est-ce qui s'est passé ?";
    if (etat === 'focus') return "Ok, on passe en mode travail. Dis-moi c'est quoi le but, on organise ça proprement.";
    return "Je suis là. Je t'écoute et je retiens. Continue.";
  }
};

// ---------- AFFICHAGE ----------
function afficherMessageNova(texte) {
  const zone = document.getElementById('chat-box') || document.getElementById('messages');
  if (!zone) return;
  const div = document.createElement('div');
  div.className = 'msg-nova';
  div.textContent = "Nova : " + texte;
  zone.appendChild(div);
  zone.scrollTop = zone.scrollHeight;
}

function afficherMessageUser(texte) {
  const zone = document.getElementById('chat-box') || document.getElementById('messages');
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

// ---------- BRANCHEMENT AUTOMATIQUE ----------
document.addEventListener('DOMContentLoaded', () => {
  initVoix();
  initOreille();
  demarrerOreille();
  // Premier message vocal automatique
  setTimeout(() => {
    parler("Je suis là BOSS. Je t'écoute et je me rappelle de notre plan.");
  }, 800);
});
