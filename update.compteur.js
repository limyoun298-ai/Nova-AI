/* ============================================================
   Nova AI - update.compteur.js - Compteur de messages
   Forfait gratuit sans internet = 100 messages
   Forfait gratuit avec internet = 1000 messages
   Ne touche PAS à index.html, ni à update.comportement.js
   ============================================================ */

(function () {
  "use strict";
  try {

    if (window.NOVA_COMPTEUR_INITIALISE) { return; }
    window.NOVA_COMPTEUR_INITIALISE = true;

    /* ---------- CONFIG ---------- */
    var CLE_COMPTE = "nova_compteur";
    var CLE_HISTORIQUE = "nova_compteur_historique";
    var CLE_ATTENTE = "nova_compteur_attente";
    var LIMITE_SANS_INTERNET = 100;
    var LIMITE_AVEC_INTERNET = 1000;
    var VERIFICATION_MS = 30000;
    var ID_BARRE = "nova-limite-barre";

    /* ---------- STOCKAGE (avec filet de sécurité en mémoire) ---------- */
    var memoire = {};

    function lire(cle, defaut) {
      try {
        var v = localStorage.getItem(cle);
        if (v !== null && v !== undefined) { return JSON.parse(v); }
      } catch (e) {}
      return (cle in memoire) ? memoire[cle] : defaut;
    }

    function ecrire(cle, valeur) {
      memoire[cle] = valeur;
      try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) {}
    }

    /* ---------- COMPTEUR UNIQUE ---------- */
    function compte() {
      var n = Number(lire(CLE_COMPTE, 0));
      return (isFinite(n) && n > 0) ? Math.floor(n) : 0;
    }

    function enregistrerEnvoi(type) {
      var n = compte() + 1;
      ecrire(CLE_COMPTE, n);
      var h = lire(CLE_HISTORIQUE, []);
      if (!Array.isArray(h)) { h = []; }
      h.push({ n: n, t: Date.now(), type: type });
      ecrire(CLE_HISTORIQUE, h);
    }

    /* ---------- FORFAIT ---------- */
    var limite = LIMITE_SANS_INTERNET;

    function enLigne() {
      try { return navigator.onLine !== false; } catch (e) { return true; }
    }

    function verifierForfait() {
      limite = enLigne() ? LIMITE_AVEC_INTERNET : LIMITE_SANS_INTERNET;
    }

    function bloque() {
      return compte() >= limite;
    }

    /* ---------- AFFICHAGE (zones existantes) ---------- */
    function zoneChat() {
      return document.getElementById("chat-box") ||
             document.getElementById("messages") ||
             document.getElementById("chat");
    }

    function afficherReponse(texte) {
      try {
        var zone = zoneChat();
        if (!zone || !texte) { return; }
        var div = document.createElement("div");
        div.className = "msg-nova";
        div.textContent = String(texte);
        zone.appendChild(div);
        zone.scrollTop = zone.scrollHeight;
      } catch (e) {}
    }

    function trouverBouton() {
      var ids = ["send-btn", "send", "btn-send", "sendBtn", "send-button", "envoyer"];
      for (var i = 0; i < ids.length; i++) {
        var b = document.getElementById(ids[i]);
        if (b) { return b; }
      }
      return document.querySelector('button[type="submit"]');
    }

    function majBouton() {
      try {
        var b = trouverBouton();
        if (!b) { return; }
        if (bloque()) {
          b.disabled = true;
          b.setAttribute("aria-disabled", "true");
          b.__novaBloque = true;
        } else if (b.__novaBloque) {
          b.disabled = false;
          b.removeAttribute("aria-disabled");
          b.__novaBloque = false;
        }
      } catch (e) {}
    }

    function majBarre() {
      try {
        var existante = document.getElementById(ID_BARRE);
        if (bloque()) {
          if (existante) { return; }
          var zone = zoneChat();
          if (!zone) { return; }
          var barre = document.createElement("div");
          barre.id = ID_BARRE;
          barre.setAttribute("role", "status");
          barre.style.cssText =
            "position:sticky;bottom:8px;margin:8px auto;width:fit-content;max-width:90%;" +
            "padding:8px 16px;border-radius:999px;background:rgba(60,60,60,0.92);" +
            "color:#fff;font-size:13px;line-height:1.3;text-align:center;z-index:5;";
          barre.textContent = "Limite de messages atteinte";
          zone.appendChild(barre);
          zone.scrollTop = zone.scrollHeight;
        } else if (existante && existante.parentNode) {
          existante.parentNode.removeChild(existante);
        }
      } catch (e) {}
    }

    function majInterface() {
      majBouton();
      majBarre();
    }

    /* ---------- FILE D'ATTENTE (sans internet) ---------- */
    var ancienneRef = null;
    var resolveurs = {};
    var vidage = false;

    function mettreEnAttente(args) {
      return new Promise(function (resolve) {
        var id = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
        var file = lire(CLE_ATTENTE, []);
        if (!Array.isArray(file)) { file = []; }
        var sauvables = [];
        try { sauvables = JSON.parse(JSON.stringify(args)); } catch (e) { sauvables = args.slice(); }
        file.push({ id: id, args: sauvables });
        ecrire(CLE_ATTENTE, file);
        resolveurs[id] = resolve;
      });
    }

    async function vider() {
      if (vidage || !ancienneRef || !enLigne()) { return; }
      vidage = true;
      try {
        var file = lire(CLE_ATTENTE, []);
        while (Array.isArray(file) && file.length && enLigne()) {
          var entree = file[0];
          var res;
          try {
            res = await ancienneRef.apply(null, entree.args);
          } catch (e) { break; }
          file = lire(CLE_ATTENTE, []);
          file.shift();
          ecrire(CLE_ATTENTE, file);
          var r = resolveurs[entree.id];
          if (r) {
            delete resolveurs[entree.id];
            r(res);
          } else {
            var txt = (typeof res === "string") ? res :
              (res && (res.text || res.reply || res.content || res.message || res.answer)) || "";
            afficherReponse(txt);
          }
        }
      } catch (e) {}
      vidage = false;
    }

    /* ---------- BRANCHEMENT SUR callNovaAI ---------- */
    function estInterne(args) {
      for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === "string") {
          return args[i].indexOf("[Consigne interne") === 0;
        }
      }
      return false;
    }

    function brancher() {
      if (typeof window.callNovaAI !== "function") { return false; }
      if (window.callNovaAI.__novaCompteur) { return true; }
      var ancienne = window.callNovaAI;
      ancienneRef = ancienne;

      var nouvelle = async function () {
        var args = Array.prototype.slice.call(arguments);
        var hors = false;
        try {
          if (!estInterne(args)) {
            if (bloque()) { majInterface(); return ""; }
            enregistrerEnvoi(typeof args[0] === "string" ? "texte" : "autre");
            majInterface();
            hors = !enLigne();
          }
        } catch (e) { hors = false; }

        if (hors) { return mettreEnAttente(args); }

        var res = await ancienne.apply(this, args);
        try { majInterface(); } catch (e) {}
        return res;
      };
      nouvelle.__novaCompteur = true;
      window.callNovaAI = nouvelle;
      return true;
    }

    function attendreEtBrancher() {
      var essais = 0;
      var t = setInterval(function () {
        essais++;
        var ok = false;
        try { ok = brancher(); } catch (e) {}
        if (ok) { try { vider(); } catch (e) {} }
        if (ok || essais > 100) { clearInterval(t); }
      }, 100);
    }

    /* ---------- BLOCAGE DE LA TOUCHE ENTRÉE ---------- */
    function bloquerEntree() {
      try {
        document.addEventListener("keydown", function (ev) {
          try {
            if (ev.key === "Enter" && !ev.shiftKey && bloque()) {
              var cible = ev.target;
              var nom = cible && cible.tagName ? String(cible.tagName).toLowerCase() : "";
              if (nom === "input" || nom === "textarea") {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                majInterface();
              }
            }
          } catch (e) {}
        }, true);
      } catch (e) {}
    }

    /* ---------- VÉRIFICATION TOUTES LES 30 SECONDES ---------- */
    function verification() {
      try {
        verifierForfait();
        majInterface();
        vider();
      } catch (e) {}
    }

    function demarrer() {
      try {
        verifierForfait();
        majInterface();
        bloquerEntree();
        attendreEtBrancher();
        setInterval(verification, VERIFICATION_MS);
      } catch (e) {}
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", demarrer);
    } else {
      demarrer();
    }

  } catch (e) { /* ne jamais casser Nova AI */ }
})();
