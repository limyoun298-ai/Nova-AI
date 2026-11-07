/* ============================================================
   NOVA AI — MASTER BRIDGE
   VERSION : 2.0.0
   MODULE : CENTRE DE CONNEXION INTELLIGENT

   OBJECTIFS :
   1. Centraliser tous les modules NOVA AI.
   2. Charger dynamiquement les fichiers externes.
   3. Détecter automatiquement les modules disponibles.
   4. Éviter les doubles chargements.
   5. Centraliser la personnalité principale.
   6. Organiser le cerveau et les capacités de NOVA.
   7. Permettre la communication entre modules.
   8. Isoler les erreurs.
   9. Préserver les fonctions originales.
  10. Ne jamais reconstruire index.html.
============================================================ */

(function () {
  "use strict";

  try {

    if (window.NovaBridge &&
        window.NovaBridge.version === "2.0.0") {
      console.info("[NOVA MASTER] Déjà initialisé.");
      return;
    }

    /* ========================================================
       1. CENTRE DE CONTRÔLE
    ======================================================== */

    const BRIDGE = {

      version: "2.0.0",

      actif: true,

      modules: {},

      erreurs: [],

      scripts: {},

      events: {},

      personality: {
        principale: null,
        verrouillee: false
      },

      config: {

        surveillance: true,

        intervalle: 1000,

        maximumTentatives: 120,

        chargementDynamique: true,

        personnaliteUnique: true

      }

    };


    /* ========================================================
       2. REGISTRE DES MODULES
    ======================================================== */

    const CONFIG = [

      {
        nom: "personnalite",

        proprietes: [
          "NovaComportement",
          "NOVA_PERSONNALITE",
          "NovaPersonnalite",
          "NOVA_COMPORTEMENT"
        ],

        type: "personality"

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

      },

      {
        nom: "memoire",

        proprietes: [
          "NovaMemoire",
          "NOVA_MEMOIRE"
        ]

      },

      {
        nom: "cerveau",

        proprietes: [
          "NovaCerveau",
          "NOVA_CERVEAU"
        ]

      },

      {
        nom: "bouche",

        proprietes: [
          "NovaBouche",
          "NOVA_BOUCHE"
        ]

      }

    ];


    /* ========================================================
       3. PROTECTION DES ERREURS
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
          "[NOVA MASTER] Erreur :",
          module,
          erreur
        );

      } catch (_) {}

    }


    /* ========================================================
       4. SYSTÈME DE COMMUNICATION
    ======================================================== */

    BRIDGE.on = function (evenement, callback) {

      try {

        if (
          !evenement ||
          typeof callback !== "function"
        ) {
          return false;
        }

        if (!BRIDGE.events[evenement]) {
          BRIDGE.events[evenement] = [];
        }

        BRIDGE.events[evenement].push(callback);

        return true;

      } catch (erreur) {

        enregistrerErreur("events.on", erreur);

        return false;

      }

    };


    BRIDGE.emit = function (evenement, donnees) {

      try {

        const listeners = BRIDGE.events[evenement] || [];

        listeners.forEach(function (callback) {

          try {

            callback(donnees);

          } catch (erreur) {

            enregistrerErreur(
              "events." + evenement,
              erreur
            );

          }

        });

        return true;

      } catch (erreur) {

        enregistrerErreur("events.emit", erreur);

        return false;

      }

    };


    /* ========================================================
       5. ENREGISTREMENT DES MODULES
    ======================================================== */

    BRIDGE.register = function (nom, instance) {

      try {

        if (!nom || !instance) {
          return false;
        }

        const existant = BRIDGE.modules[nom];

        if (
          existant &&
          existant.instance === instance
        ) {
          return true;
        }

        BRIDGE.modules[nom] = {

          disponible: true,

          connecte: true,

          instance: instance,

          dateConnexion: new Date().toISOString()

        };

        console.info(
          "[NOVA MASTER] Module connecté :",
          nom
        );

        BRIDGE.emit("module:connected", {

          nom: nom,

          instance: instance

        });

        return true;

      } catch (erreur) {

        enregistrerErreur(nom, erreur);

        return false;

      }

    };


    /* ========================================================
       6. RÉCUPÉRATION DES MODULES
    ======================================================== */

    BRIDGE.get = function (nom) {

      try {

        const module = BRIDGE.modules[nom];

        if (!module || !module.disponible) {
          return null;
        }

        return module.instance || null;

      } catch (erreur) {

        enregistrerErreur("get", erreur);

        return null;

      }

    };


    /* ========================================================
       7. DÉTECTION AUTOMATIQUE
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

              enregistrerErreur(
                config.nom,
                erreur
              );

            }

          }

          if (instance) {

            BRIDGE.register(
              config.nom,
              instance
            );

            if (config.type === "personality") {

              BRIDGE.setPersonality(
                instance,
                config.nom
              );

            }

          } else if (!BRIDGE.modules[config.nom]) {

            BRIDGE.modules[config.nom] = {

              disponible: false,

              connecte: false,

              instance: null

            };

          }

        } catch (erreur) {

          enregistrerErreur(
            config.nom,
            erreur
          );

        }

      });

    }


    /* ========================================================
       8. PERSONNALITÉ PRINCIPALE UNIQUE
    ======================================================== */

    BRIDGE.setPersonality = function (
      instance,
      origine
    ) {

      try {

        if (!instance) {
          return false;
        }

        if (
          BRIDGE.personality.verrouillee &&
          BRIDGE.personality.principale
        ) {

          return (
            BRIDGE.personality.principale.instance ===
            instance
          );

        }

        BRIDGE.personality.principale = {

          instance: instance,

          origine: origine || "personnalite",

          date: new Date().toISOString()

        };

        BRIDGE.personality.verrouillee = true;

        console.info(
          "[NOVA MASTER] Personnalité principale définie."
        );

        BRIDGE.emit("personality:ready", {

          instance: instance,

          origine: origine

        });

        return true;

      } catch (erreur) {

        enregistrerErreur(
          "personality",
          erreur
        );

        return false;

      }

    };


    BRIDGE.getPersonality = function () {

      try {

        return BRIDGE.personality.principale
          ? BRIDGE.personality.principale.instance
          : null;

      } catch (erreur) {

        enregistrerErreur(
          "getPersonality",
          erreur
        );

        return null;

      }

    };


    /* ========================================================
       9. CHARGEMENT DYNAMIQUE DES FICHIERS
    ======================================================== */

    BRIDGE.load = function (url, nom) {

      return new Promise(function (resolve) {

        try {

          if (!url) {

            resolve(false);

            return;

          }

          const cle = String(url);

          if (BRIDGE.scripts[cle]) {

            resolve(BRIDGE.scripts[cle].promise);

            return;

          }

          const script = document.createElement("script");

          script.src = url;

          script.async = true;

          script.dataset.novaModule = nom || "external";

          const entree = {

            url: url,

            nom: nom || "external",

            etat: "chargement",

            promise: null

          };

          entree.promise = new Promise(function (fin) {

            script.onload = function () {

              try {

                entree.etat = "charge";

                detecterModules();

                BRIDGE.emit("script:loaded", {

                  nom: entree.nom,

                  url: url

                });

                console.info(
                  "[NOVA MASTER] Fichier chargé :",
                  entree.nom
                );

                fin(true);

              } catch (erreur) {

                enregistrerErreur(
                  entree.nom,
                  erreur
                );

                fin(false);

              }

            };


            script.onerror = function () {

              entree.etat = "erreur";

              enregistrerErreur(
                entree.nom,
                "Impossible de charger " + url
              );

              fin(false);

            };


            document.head.appendChild(script);

          });

          BRIDGE.scripts[cle] = entree;

          resolve(entree.promise);

        } catch (erreur) {

          enregistrerErreur("loader", erreur);

          resolve(false);

        }

      });

    };


    /* ========================================================
       10. CHARGEMENT DE PLUSIEURS MODULES
    ======================================================== */

    BRIDGE.loadMany = async function (liste) {

      try {

        if (!Array.isArray(liste)) {
          return [];
        }

        const resultats = [];

        for (const element of liste) {

          try {

            const resultat = await BRIDGE.load(

              element.url,

              element.nom

            );

            resultats.push({

              nom: element.nom,

              charge: resultat

            });

          } catch (erreur) {

            enregistrerErreur(
              element.nom,
              erreur
            );

            resultats.push({

              nom: element.nom,

              charge: false

            });

          }

        }

        return resultats;

      } catch (erreur) {

        enregistrerErreur("loadMany", erreur);

        return [];

      }

    };


    /* ========================================================
       11. EXÉCUTION SÉCURISÉE
    ======================================================== */

    BRIDGE.execute = async function (
      nom,
      methode,
      ...args
    ) {

      try {

        const instance = BRIDGE.get(nom);

        if (!instance) {
          return null;
        }

        if (
          typeof instance[methode] !== "function"
        ) {
          return null;
        }

        return await instance[methode](...args);

      } catch (erreur) {

        enregistrerErreur(
          nom + "." + methode,
          erreur
        );

        return null;

      }

    };


    /* ========================================================
       12. COMMUNICATION AVEC LES MODULES
    ======================================================== */

    BRIDGE.broadcast = function (
      methode,
      ...args
    ) {

      try {

        const resultats = {};

        Object.keys(BRIDGE.modules).forEach(function (nom) {

          try {

            const instance = BRIDGE.get(nom);

            if (
              instance &&
              typeof instance[methode] === "function"
            ) {

              resultats[nom] = instance[methode](...args);

            }

          } catch (erreur) {

            enregistrerErreur(
              nom + "." + methode,
              erreur
            );

          }

        });

        return resultats;

      } catch (erreur) {

        enregistrerErreur("broadcast", erreur);

        return {};

      }

    };


    /* ========================================================
       13. ÉTAT GLOBAL
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

          personnalite: !!BRIDGE.getPersonality(),

          scripts: Object.keys(BRIDGE.scripts).length,

          erreurs: BRIDGE.erreurs.length

        };

      } catch (erreur) {

        enregistrerErreur("status", erreur);

        return null;

      }

    };


    /* ========================================================
       14. RAFRAÎCHISSEMENT
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
       15. INITIALISATION
    ======================================================== */

    window.NovaBridge = BRIDGE;

    detecterModules();

    console.info(
      "[NOVA MASTER] Centre de connexion opérationnel.",
      BRIDGE.version
    );


    /* ========================================================
       16. SURVEILLANCE DES MODULES
    ======================================================== */

    if (BRIDGE.config.surveillance) {

      let tentatives = 0;

      const surveillance = setInterval(function () {

        try {

          detecterModules();

          tentatives++;

          if (
            tentatives >=
            BRIDGE.config.maximumTentatives
          ) {

            clearInterval(surveillance);

          }

        } catch (erreur) {

          enregistrerErreur(
            "surveillance",
            erreur
          );

        }

      }, BRIDGE.config.intervalle);

    }


    /* ========================================================
       17. ÉVÉNEMENT DE DISPONIBILITÉ
    ======================================================== */

    BRIDGE.emit("bridge:ready", {

      version: BRIDGE.version,

      date: new Date().toISOString()

    });


  } catch (erreur) {

    console.error(
      "[NOVA MASTER] Initialisation impossible.",
      erreur
    );

  }

})();
