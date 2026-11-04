// === NOVA - MÉMOIRE 1 SEMAINE QUI GLISSE ===
class HumanPersonaBase {
  constructor(personaJson) {
    this.name = personaJson.name;
    this.warmUp = personaJson.warmUp;
    this.min = personaJson.min;
    this.max = personaJson.max;
    this.LIMITE = 60; // Carnet du jour
    this.LIMITE_LONGUE = 500; // Mémoire de la semaine
    this.DUREE_MEMOIRE = 7 * 24 * 60 * 60 * 1000; // 7 JOURS EN MILLISECONDES

    // Chargement au démarrage
    try {
      const sauve = JSON.parse(localStorage.getItem("nova_memory") || "null");
      if (sauve) {
        this.previousStatements = sauve.carnet || [];
        this.memoireLongue = sauve.longue || [];
        this.exchangeCount = sauve.count || 0;
        // On nettoie direct au démarrage les trucs vieux de +7 jours
        this.nettoyerVieuxSouvenirs();
        console.log(`[NOVA] Lundi à Dimanche chargé: ${this.memoireLongue.length} souvenirs`);
      } else {
        this.previousStatements = [];
        this.memoireLongue = [];
        this.exchangeCount = 0;
      }
    } catch(e) {
      this.previousStatements = [];
      this.memoireLongue = [];
      this.exchangeCount = 0;
    }
  }

  // La fonction qui oublie le vieux Lundi quand Mardi arrive
  nettoyerVieuxSouvenirs() {
    const maintenant = Date.now();
    const limite = maintenant - this.DUREE_MEMOIRE;
    
    // On garde seulement ce qui a moins de 7 jours
    this.memoireLongue = this.memoireLongue.filter(m => m.date > limite);
    
    // Carnet rapide = seulement aujourd'hui, donc on le garde tel quel, 
    // il sera géré par le shift() de 50
  }

  remember(message) {
    if (!message || !message.trim()) return;
    
    const maintenant = Date.now();
    const souvenir = { text: message.trim(), date: maintenant };

    // 1. On nettoie d'abord les vieux souvenirs de +7 jours
    this.nettoyerVieuxSouvenirs();

    // 2. Carnet rapide - 50 max (la journée d'aujourd'hui)
    this.previousStatements.push(message.trim());
    if (this.previousStatements.length > this.LIMITE) {
      this.previousStatements.shift(); // Oublie le début de Lundi
    }

    // 3. Mémoire longue - 500 max mais avec date de 7 jours
    this.memoireLongue.push(souvenir);
    if (this.memoireLongue.length > this.LIMITE_LONGUE) {
      this.memoireLongue.shift(); // Oublie le plus vieux si trop plein
    }
    
    this.exchangeCount++;

    // 4. Sauvegarde dans le téléphone
    try {
      localStorage.setItem("nova_memory", JSON.stringify({
        carnet: this.previousStatements,
        longue: this.memoireLongue,
        count: this.exchangeCount
      }));
    } catch(e) {
      localStorage.removeItem("nova_memory");
    }
  }
  
  // Reste de ton code parler() et calculateDelay() inchangé...
  }
