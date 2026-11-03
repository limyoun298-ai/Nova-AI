/* update.js - NOVA AI - Fix Recherche sur ordre uniquement */
console.log(" Fix recherche sur ordre");

// ================= FIX CLAVIER =================
(function fixKeyboard(){
  const css = document.createElement("style");
  css.id = "nova-keyboard-fix";
  css.innerHTML = `
    html, body { height: 100dvh !important; overflow: hidden !important; }
    body { display: flex !important; flex-direction: column !important; }
    #chatMessages, .messages, #messages, [class*="messages"] {
      flex: 1 !important; overflow-y: auto !important; padding-bottom: 70px !important;
    }
    #inputContainer, [class*="input-container"], form:has(input), .input-area {
      position: sticky !important; bottom: 0 !important;
      height: 60px !important; min-height: 60px !important; max-height: 60px !important;
      background: #0a0a0a !important; border-top: 1px solid #222 !important;
      padding: 8px 10px !important; padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
      display: flex !important; align-items: center !important; gap: 8px !important;
      flex-shrink: 0 !important; z-index: 9999 !important;
    }
    /* Barre recherche avec globe */
    #nova-search-bar {
      position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
      background: #111; border: 1px solid #333; border-radius: 20px;
      padding: 7px 14px; font-size: 12px; color: #eee;
      font-family: system-ui; display: flex; align-items: center; gap: 8px;
      z-index: 9998; display: none;
    }
    #nova-search-bar.show { display: flex; animation: slideUp 0.2s ease; }
    @keyframes slideUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  `;
  document.head.appendChild(css);
})();

function showSearchBar(query){
  let bar = document.getElementById("nova-search-bar");
  if(!bar){
    bar = document.createElement("div");
    bar.id = "nova-search-bar";
    document.body.appendChild(bar);
  }
  const safe = query.slice(0,40).replace(/</g,"&lt;");
  bar.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
    <span>Recherche sur la page du message ordonné: "${safe}"</span>
  `;
  bar.classList.add("show");
}
function hideSearchBar(){
  const bar = document.getElementById("nova-search-bar");
  if(bar) bar.classList.remove("show");
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
  }catch(e){ return null; } 
} 

// ================= FIX DU BUG =================
(function(){
  // AVANT ton bug: QUESTION + KEYWORDS déclenchait tout
  // MAINTENANT: seulement sur ordre
  const ORDRE = /(vas[- ]?y recherche|recherche sur le web|cherche sur le web|vas y recherche sur le web)/i;

  window.SEARCH_TRIGGER = {
    test: function(t){
      return ORDRE.test(String(t||""));
    },
    extractQuery: function(t){
      return String(t).replace(ORDRE, "").trim();
    }
  };

  window.webSearch = async function(q){
    const query = SEARCH_TRIGGER.extractQuery(q) || q;
    if(!query) return "";
    
    showSearchBar(query);
    
    let result = null;
    try{
      result = await Promise.race([
        searchWiki(query),
        new Promise(r => setTimeout(()=>r(null), 6000))
      ]);
    }catch(e){}
    
    hideSearchBar();
    
    if(!result) return "";
    return `Source : Wikipédia\n- ${result.title} : ${result.extract}\nLien : ${result.url}`.slice(0,1500);
  };

  console.log(" Fix: recherche seulement sur 'vas-y recherche sur le web...'");
})();
