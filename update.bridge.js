/* ============================================================
   NOVA AI — UPDATE.BRIDGE.JS
   VERSION : 1.0.0
   MODULE : CENTRE DE CONNEXION

   OBJECTIFS :
   1. Centraliser les modules NOVA AI.
   2. Détecter les fonctionnalités disponibles.
   3. Connecter les modules sans reconstruire leurs codes.
   4. Éviter les doubles connexions.
   5. Isoler les erreurs.
   6. Préserver le fonctionnement original de NOVA.
============================================================ */

(function () {
  "use strict";

  try {

    if (window.NovaBridge && window.NovaBridge.version) {
      console.info("[NOVA BRIDGE] Déjà chargé.");
      return;
    }

    const BRIDGE = {
      version: "1.0.0",
      modules: {},
      erreurs: [],
      actif: true
    };

    /* ========================================================
       1. REGISTRE DES MODULES
    ======================================================== */

    const CONFIG = [
      {
        nom: "personnalite",
        proprietes: [
          "NovaComportement",
          "NOVA_PERSONNALITE"
        ]
      },
      {
        nom: "recherche",
        proprietes: [
          "NovaRecherche",
          "NOVA_RECHERCHE"
        ]
      },
      {
        nom: "tableaux",
        proprietes: [
          "NovaTableaux",
          "NOVA_TABLEAUX"
        ]
      },
      {
        nom: "python",
        proprietes: [
          "NovaPython",
          "NOVA_PYTHON"
        ]
      },
      {
        nom: "fichiers",
        proprietes: [
          "NovaFichiers",
          "NOVA_FICHIERS"
        ]
      }
    ];

    /* ========================================================
       2. PROTECTION DES ERREURS
    ======================================================== */

    function enregistrerErreur(module, erreur) {
      try {
        BRIDGE.erreurs.push({
          module: module,
          message: String(
            erreur && erreur.message
              ? erreur.message
              : erreur
          ),
          date: new Date().toISOString()
        });

        console.error(
          "[NOVA BRIDGE] Erreur dans " + module,
          erreur
        );

      } catch (_) {}
    }

    /* ========================================================
       3. DÉTECTION DES MODULES
    ======================================================== */

    function detecterModules() {

      CONFIG.forEach(function (config) {

        try {

          let instance = null;

          for (const propriete of config.proprietes) {

            try {
              if (window[propriete]) {
                instance = window[propriete];
                break;
              }
            } catch (erreur) {
              enregistrerErreur(config.nom, erreur);
            }

          }

          if (instance) {

            BRIDGE.modules[config.nom] = {
              disponible: true,
              instance: instance,
              connecte: true,
              dateConnexion: new Date().toISOString()
            };

            console.info(
              "[NOVA BRIDGE] Module détecté :",
              config.nom
            );

          } else {

            if (!BRIDGE.modules[config.nom]) {
              BRIDGE.modules[config.nom] = {
                disponible: false,
                instance: null,
                connecte: false
              };
            }

          }

        } catch (erreur) {
          enregistrerErreur(config.nom, erreur);
        }

      });

    }

    /* ========================================================
       4. ENREGISTREMENT MANUEL D'UN MODULE
    ======================================================== */

    BRIDGE.register = function (nom, instance) {

      try {

        if (!nom || !instance) return false;

        BRIDGE.modules[nom] = {
          disponible: true,
          instance: instance,
          connecte: true,
          dateConnexion: new Date().toISOString()
        };

        console.info(
          "[NOVA BRIDGE] Module enregistré :",
          nom
        );

        return true;

      } catch (erreur) {
        enregistrerErreur(nom, erreur);
        return false;
      }

    };

    /* ========================================================
       5. RÉCUPÉRATION D'UN MODULE
    ======================================================== */

    BRIDGE.get = function (nom) {

      try {

        const module = BRIDGE.modules[nom];

        if (!module || !module.disponible) {
          return null;
        }

        return module.instance || null;

      } catch (erreur) {
        enregistrerErreur(nom, erreur);
        return null;
      }

    };

    /* ========================================================
       6. VÉRIFICATION DES CONNEXIONS
    ======================================================== */

    BRIDGE.status = function () {

      try {

        const resultat = {};

        Object.keys(BRIDGE.modules).forEach(function (nom) {

          const module = BRIDGE.modules[nom];

          resultat[nom] = {
            disponible: module.disponible,
            connecte: module.connecte
          };

        });

        return {
          version: BRIDGE.version,
          actif: BRIDGE.actif,
          modules: resultat,
          nombreErreurs: BRIDGE.erreurs.length
        };

      } catch (erreur) {
        enregistrerErreur("status", erreur);
        return null;
      }

    };

    /* ========================================================
       7. RECHARGEMENT DE LA DÉTECTION
    ======================================================== */

    BRIDGE.refresh = function () {

      try {
        detecterModules();
        return BRIDGE.status();

      } catch (erreur) {
        enregistrerErreur("refresh", erreur);
        return null;
      }

    };

    /* ========================================================
       8. EXÉCUTION SÉCURISÉE
    ======================================================== */

    BRIDGE.execute = async function (nom, methode, ...args) {

      try {

        const instance = BRIDGE.get(nom);

        if (!instance) {
          return null;
        }

        if (typeof instance[methode] !== "function") {
          return null;
        }

        return await instance[methode](...args);

      } catch (erreur) {
        enregistrerErreur(nom + "." + methode, erreur);
        return null;
      }

    };

    /* ========================================================
       9. INITIALISATION
    ======================================================== */

    window.NovaBridge = BRIDGE;

    detecterModules();

    /* Détecte aussi les modules chargés ultérieurement. */

    let tentatives = 0;

    const surveillance = setInterval(function () {

      try {

        detecterModules();

        tentatives++;

        if (tentatives >= 100) {
          clearInterval(surveillance);
        }

      } catch (erreur) {
        enregistrerErreur("surveillance", erreur);
      }

    }, 500);

    console.info(
      "[NOVA BRIDGE] Centre de connexion initialisé.",
      BRIDGE.version
    );

  } catch (erreur) {

    console.error(
      "[NOVA BRIDGE] Initialisation impossible :",
      erreur
    );

  }

})();
