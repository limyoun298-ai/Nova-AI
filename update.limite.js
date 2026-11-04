/* =====================================
   NOVA AI - GESTION DES LIMITES
   Version 1.0
   ===================================== */

(function () {
    "use strict";

    // Éviter les chargements multiples
    if (window.NOVA_LIMITES_INITIALISEES) {
        return;
    }

    window.NOVA_LIMITES_INITIALISEES = true;

    // État initial du système
    window.NOVA_LIMITES = {
        actif: false,
        mode: "normal",
        forfait: null,
        tempsUtilise: 0,
        initialisé: true
    };

    console.info("NOVA AI : module de limites chargé.");

})();
