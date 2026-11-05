// NOVA AI V4 - Compteur Hybride - Plan Verrouillé
// Yeux = ce fichier / Cerveau = Supabase nova_usage_v4

(function(){
  const KEY_DEVICE = "nova_device_id_v4";
  const KEY_LOCAL = "nova_usage_local_v4";

  let deviceId = localStorage.getItem(KEY_DEVICE);
  if(!deviceId){
    deviceId = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY_DEVICE, deviceId);
  }

  let usedSeconds = 0;
  let cycleStart = Date.now();
  let sessionStart = null;
  let timer = null;

  // --- Mode : 5h si connexion, 1h si pas de connexion ---
  function getMode(){
    return navigator.onLine ? "forfait" : "gratuit";
  }
  function getLimit(){
    return getMode() === "forfait" ? 5*3600 : 1*3600;
  }

  // --- Charger depuis Supabase ---
  async function loadFromSupabase(){
    try{
      if(!window.supabaseClient) return false;
      const {data} = await window.supabaseClient
        .from("nova_usage_v4")
        .select("*")
        .eq("device_id", deviceId)
        .maybeSingle();
      if(!data) return false;

      const start = new Date(data.cycle_start).getTime();
      // Reset 24h automatique
      if(Date.now() - start >= 24*3600*1000){
        usedSeconds = 0;
        cycleStart = Date.now();
        await saveToSupabase(true);
        return true;
      }
      usedSeconds = data.used_seconds || 0;
      cycleStart = start;
      return true;
    }catch(e){ return false; }
  }

  // --- Sauvegarder ---
  async function saveToSupabase(reset=false){
    const payload = {
      device_id: deviceId,
      cycle_start: new Date(reset ? Date.now() : cycleStart).toISOString(),
      used_seconds: usedSeconds,
      last_seen: new Date().toISOString()
    };
    try{
      if(window.supabaseClient){
        await window.supabaseClient.from("nova_usage_v4").upsert(payload);
      }
    }catch(e){}
    localStorage.setItem(KEY_LOCAL, JSON.stringify({usedSeconds, cycleStart}));
  }

  // --- Compteur ---
  function startCounting(){
    if(sessionStart) return;
    sessionStart = Date.now();
    clearInterval(timer);
    timer = setInterval(async ()=>{
      if(sessionStart){
        const add = Math.floor((Date.now() - sessionStart)/1000);
        // On ne double pas, on recalcule
        // On sauvegarde toutes les 10 sec
        if(add % 10 === 0) await saveToSupabase();
      }
      window.NOVA_USAGE = { usedSeconds: getTotalUsed(), limit: getLimit(), mode: getMode(), remaining: Math.max(0, getLimit() - getTotalUsed()) };
    }, 1000);
  }

  function stopCounting(){
    if(!sessionStart) return;
    const add = Math.floor((Date.now() - sessionStart)/1000);
    usedSeconds += add;
    sessionStart = null;
    clearInterval(timer);
    saveToSupabase();
  }

  function getTotalUsed(){
    if(!sessionStart) return usedSeconds;
    return usedSeconds + Math.floor((Date.now() - sessionStart)/1000);
  }

  function isBlocked(){
    return getTotalUsed() >= getLimit();
  }

  // --- Message arrondi en dessous de la discussion ---
  function showLimitMessage(){
    let el = document.getElementById("nova-limit-msg");
    if(!el){
      el = document.createElement("div");
      el.id = "nova-limit-msg";
      el.style.cssText = "margin:10px auto;max-width:90%;padding:10px 14px;border-radius:18px;background:rgba(0,0,0,0.55);color:#fff;font-size:13px;text-align:center;backdrop-filter:blur(6px);";
      el.textContent = "nous vous rappelons que vous discutez avec une AI et non une vraie personne";
      const chat = document.querySelector("#chat, .chat, main") || document.body;
      chat.appendChild(el);
    }
    el.style.display = "block";
  }

  function hideLimitMessage(){
    const el = document.getElementById("nova-limit-msg");
    if(el) el.style.display = "none";
  }

  // --- Intercepter l'envoi ---
  function hookSend(){
    document.addEventListener("click", (e)=>{
      const btn = e.target.closest("button[type=submit], #send-btn, .send-btn");
      if(!btn) return;
      if(isBlocked()){
        e.preventDefault(); e.stopPropagation();
        showLimitMessage();
      }
    }, true);
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" && !e.shiftKey && isBlocked()){
        e.preventDefault();
        showLimitMessage();
      }
    }, true);
  }

  // --- Bascule C : online / offline ---
  window.addEventListener("online", ()=>{
    // On garde le temps déjà utilisé, on passe juste en 5h
    hideLimitMessage();
    startCounting();
  });
  window.addEventListener("offline", ()=>{
    // On garde le temps, on passe en 1h
    if(isBlocked()) showLimitMessage();
  });

  // --- Ouverture / Fermeture ---
  document.addEventListener("visibilitychange", ()=>{
    if(document.hidden) stopCounting();
    else startCounting();
  });
  window.addEventListener("beforeunload", stopCounting);
  window.addEventListener("pagehide", stopCounting);

  // --- Init ---
  (async ()=>{
    // Local d'abord pour démarrer vite
    try{
      const local = JSON.parse(localStorage.getItem(KEY_LOCAL)||"{}");
      if(local.usedSeconds) usedSeconds = local.usedSeconds;
      if(local.cycleStart) cycleStart = local.cycleStart;
    }catch(e){}
    await loadFromSupabase();
    startCounting();
    hookSend();
    // Exposer pour index.html
    window.NOVA_LIMIT = { getTotalUsed, isBlocked, getMode, getLimit, showLimitMessage };
    window.NOVA_CHECK_LIMIT = isBlocked;
  })();
})();
