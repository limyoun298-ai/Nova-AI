/* update.js - NOVA AI - Recherche Wiki Gratuit + Animations par site + Fix Clavier */
console.log("✅ NOVA Recherche Wiki branchée");

// ================= FIX CLAVIER - HAUTEUR PARFAITE =================
(function fixKeyboard(){
  const css = document.createElement("style");
  css.id = "nova-keyboard-fix";
  css.innerHTML = `
    html, body { height: 100dvh !important; overflow: hidden !important; }
    body { display: flex !important; flex-direction: column !important; }
    #chatMessages, .messages, #messages, [class*="messages"] {
      flex: 1 !important; overflow-y: auto !important; padding-bottom: 10px !important;
    }
    #inputContainer, [class*="input-container"], form:has(input), .input-area {
      position: sticky !important; bottom: 0 !important;
      height: 60px !important; min-height: 60px !important; max-height: 60px !important;
      background: #0a0a0a !important; border-top: 1px solid #222 !important;
      padding: 8px 10px !important; padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
      display: flex !important; align-items: center !important; gap: 8px !important;
      flex-shrink: 0 !important; z-index: 9999 !important;
    }
    #inputContainer input, #inputContainer textarea {
      height: 42px !important; min-height: 42px !important; max-height: 42px !important; border-radius: 22px !important;
    }
    #inputContainer button { height: 42px !important; width: 42px !important; border-radius: 50% !important; }
  `;
  document.head.appendChild(css);
  console.log("⌨️ Clavier fixé");
})();

const SITES_CONFIG = { 
  "whatsapp": { nom: "page officiel de WhatsApp", logo: "🟢", couleur: "#25D366", domain: "whatsapp.com" }, 
  "chatgpt": { nom: "page officiel de ChatGPT", logo: "🤖", couleur: "#10a37f", domain: "openai.com" }, 
  "facebook": { nom: "page officiel de Facebook", logo: "📘", couleur: "#1877F2", domain: "facebook.com" }, 
  "youtube": { nom: "page officiel de YouTube", logo: "▶️", couleur: "#FF0000", domain: "youtube.com" }, 
  "wikipedia": { nom: "Wikipédia", logo: "📚", couleur: "#636466", domain: "wikipedia.org" }, 
  "default": { nom: "documentation officielle", logo: "🔍", couleur: "#333", domain: "web" } 
}; 

function getSiteConfig(query){ 
  const q = query.toLowerCase(); 
  for(let key in SITES_CONFIG){ if(q.includes(key)) return SITES_CONFIG[key]; } 
  return SITES_CONFIG["default"]; 
} 

function showSearchAnimation(query){ 
  const config = getSiteConfig(query); 
  const safe = String(query).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  hideSearchAnimation(); 
  const anim = document.createElement("div"); 
  anim.id = "nova-search-anim"; 
  anim.innerHTML = ` 
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;margin:12px 0;background:#111;border:1px solid ${config.couleur};border-radius:14px;font-family:system-ui;font-size:13px;color:#eee;animation:slideIn 0.3s ease"> 
      <span style="font-size:18px;animation:spin 1.5s linear infinite">${config.logo}</span> 
      <div style="display:flex;flex-direction:column;line-height:1.2"> 
        <span style="font-weight:600">Recherche sur le Web...</span> 
        <span style="opacity:0.7;font-size:11px">Requête: "${safe}" • ${config.domain}</span> 
      </div> 
      <span style="margin-left:auto;display:flex;gap:2px"><span class="dot">.</span><span class="dot" style="animation-delay:0.2s">.</span><span class="dot" style="animation-delay:0.4s">.</span></span> 
    </div> 
    <style> 
      @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} 
      @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}} 
      .dot{animation:blink 1s infinite;font-weight:bold} 
      @keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}} 
    </style> 
  `; 
  const container = document.querySelector("#chatMessages") || document.querySelector(".messages") || document.querySelector("#messages") || document.body; 
  container.appendChild(anim); 
  anim.scrollIntoView({behavior:"smooth"}); 
  return config; 
} 

function hideSearchAnimation(){ 
  const el = document.getElementById("nova-search-anim"); 
  if(el) el.remove(); 
} 

async function searchWiki(query){ 
  try{ 
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`; 
    const res = await fetch(searchUrl); 
    const data = await res.json(); 
    if(!data.query.search.length) return null; 
    const title = data.query.search[0].title; 
    const summaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`; 
    const res2 = await fetch(summaryUrl); 
    const summary = await res2.json(); 
    return { title: summary.title, extract: summary.extract, url: summary.content_urls.desktop.page }; 
  }catch(e){ console.error("Wiki error", e); return null; } 
} 

window.novaWebSearch = async function(query){ 
  const config = showSearchAnimation(query); 
  const result = await searchWiki(query); 
  hideSearchAnimation(); 
  if(!result){ return `❌ Aucun résultat trouvé sur la ${config.nom} pour "${query}"`; } 
  return `✅ [Résultat ${config.nom} - ${config.logo} ${result.title}]\n${result.extract}\n\nSource: ${result.url}`; 
}; 

// ================= BRANCHEMENT SUR NOVA : "RECHERCHE SUR LE WEB" =================
(function brancherRechercheWeb(){
  try{
    /* 1. Texte du statut : "recherche sur le Web..." */
    const _showAIStatus = showAIStatus;
    showAIStatus = function(label){
      if(label === "recherche sur les documents...") label = "recherche sur le Web...";
      return _showAIStatus(label);
    };

    /* 2. La recherche se déclenche pour la plupart des questions */
    const QUESTION = /(\?|^\s*(qui|quoi|que|qu['’]|quel|quelle|quels|quelles|quand|où|combien|comment|pourquoi|c['’]est quoi|cherche|recherche|explique|définition|parle[- ]moi|dis[- ]moi)\b)/i;
    const KEYWORDS = /\b(date|prix|actu|actualit[ée]s?|20[2-3]\d|m[ée]t[ée]o|score|aujourd|capitale|population|pr[ée]sident|badge|v[ée]rifi|wikip[ée]dia|internet|google|histoire)/i;
    const SKIP = /(m[ée]morise|rappelle[- ]toi|souviens[- ]toi|^\/image)/i;
    const CHAT = /^\s*(salut|bonjour|bonsoir|coucou|hello|hey|merci|ok\b|ça va|ca va)/i;

    SEARCH_TRIGGER.test = function(t){
      t = String(t || "");
      if(t.length < 8 || SKIP.test(t) || CHAT.test(t)) return false;
      if(typeof looksLikeCode === "function" && looksLikeCode(t)) return false;
      return QUESTION.test(t) || KEYWORDS.test(t);
    };

    /* 3. Nettoyage de la requête : "C'est quoi le badge WhatsApp ?" -> "badge whatsapp" */
    const STOP = new Set(("le la les un une des de du d l est sont et ou à au aux en pour sur dans que qui quoi " +
      "ce cet cette ces mon ma mes ton ta tes avec par pas se sa son ses il elle on nous vous ils elles je tu " +
      "peux peut dis moi toi cherche recherche explique parle comment pourquoi quand où quel quelle quels quelles " +
      "c qu s t n m j").split(" "));

    function nettoyerRequete(q){
      return String(q).toLowerCase()
        .replace(/[?!.,;:()«»"]/g, " ")
        .replace(/['’]/g, " ")
        .split(/\s+/)
        .filter(w => w && !STOP.has(w))
        .slice(0, 8)
        .join(" ");
    }

    /* 4. webSearch de NOVA utilise maintenant ta recherche Wiki + ton animation */
    webSearch = async function(q){
      const query = nettoyerRequete(q);
      if(!query) return "";

      try{ hideAIStatus(); }catch(e){}
      showSearchAnimation(query);

      let result = null;
      try{
        result = await Promise.race([
          searchWiki(query),
          new Promise(r => setTimeout(() => r(null), 7000))
        ]);
      }catch(e){}

      hideSearchAnimation();
      try{ showAIStatus("en train de réfléchir..."); }catch(e){}

      if(!result) return "";
      return ("Source : Wikipédia\n- " + result.title + " : " + result.extract + "\nLien : " + result.url).slice(0, 1500);
    };

    /* 5. L'IA sait qu'elle a une recherche et n'invente plus de fonction */
    const _buildSystemPrompt = buildSystemPrompt;
    buildSystemPrompt = function(extra){
      return _buildSystemPrompt(extra) +
        "\n\nRECHERCHE WEB : l'application peut chercher sur le Web (via Wikipédia) et te donner les résultats dans ce message. " +
        "Tu n'as aucune fonction à appeler : n'écris jamais de nom de fonction ni de code pour chercher. " +
        "Si des informations web sont fournies, appuie-toi dessus. " +
        "Sinon, réponds avec tes connaissances et précise que tu n'as pas pu vérifier en ligne.";
    };

    console.log("🌐 Recherche sur le Web branchée sur NOVA");
  }catch(e){
    console.error("update.js (branchement recherche) :", e);
  }
})();

console.log("🔌 Prêt Boss. Test: novaWebSearch('WhatsApp') ou novaWebSearch('ChatGPT')");
