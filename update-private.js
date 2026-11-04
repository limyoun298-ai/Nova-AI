// NOVA - CHAT PRIVE V1 - BOSS TEST
(function(){
  if(document.getElementById('btn-private-chat')) return;

  // 1. LE BOUTON DANS LE MENU +
  // On cherche le menu du +
  const plusBtn = document.querySelector('button'); // ton bouton +
  // On crée le bouton Chat Privé
  const btn = document.createElement('button');
  btn.id = 'btn-private-chat';
  btn.innerHTML = `
    <span style="display:flex;align-items:center;gap:10px;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        <circle cx="12" cy="11" r="1" fill="white"/>
      </svg>
      Chat privé
      <span style="font-size:10px;background:#222;padding:2px 6px;border-radius:10px;color:#aaa;">🔒 Secret</span>
    </span>
  `;
  btn.style.cssText = "width:100%;text-align:left;padding:12px;background:#111;color:white;border:none;border-radius:12px;margin-top:8px;cursor:pointer;";
  
  // On l'ajoute à côté du bouton + / dans le menu
  // Si tu as un menu, il va apparaître là
  const inputArea = document.querySelector('input')?.parentElement;
  if(inputArea) inputArea.parentElement.appendChild(btn);
  else document.body.appendChild(btn);

  // 2. LA PAGE CHAT PRIVE (cachée au début)
  const prive = document.createElement('div');
  prive.id = 'private-chat-view';
  prive.style.cssText = "display:none;position:fixed;inset:0;background:#000;z-index:9999;flex-direction:column;";
  prive.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #222;">
      <button id="back-private" style="background:none;border:none;color:white;font-size:22px;">←</button>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      <div><b>Chat privé</b><div style="font-size:11px;color:#888;">Enregistré seulement ici • Mystérieux</div></div>
      <span style="margin-left:auto;font-size:20px;">🔒</span>
    </div>
    <div id="private-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
    <div style="display:flex;gap:8px;padding:10px;border-top:1px solid #222;">
      <input id="private-input" placeholder="Écris en privé..." style="flex:1;background:#111;border:none;padding:12px;border-radius:20px;color:white;outline:none;">
      <button id="private-send" style="background:#0af;color:white;border:none;width:44px;height:44px;border-radius:50%;font-size:18px;">➤</button>
    </div>
  `;
  document.body.appendChild(prive);

  // 3. LOGIQUE : SEPARÉ DU CHAT NORMAL
  const KEY = 'nova_private_messages'; // boîte séparée, rien ne sort d'ici
  function load(){
    const box = document.getElementById('private-messages');
    const msgs = JSON.parse(localStorage.getItem(KEY) || '[]');
    box.innerHTML = msgs.map(m => `<div style="align-self:${m.who==='moi'?'flex-end':'flex-start'};background:${m.who==='moi'?'#0af':'#222'};color:white;padding:10px 14px;border-radius:16px;max-width:80%;">${m.text}</div>`).join('');
    box.scrollTop = box.scrollHeight;
  }
  function save(text, who){
    const msgs = JSON.parse(localStorage.getItem(KEY) || '[]');
    msgs.push({text, who, time: Date.now()});
    localStorage.setItem(KEY, JSON.stringify(msgs));
    load();
  }

  btn.onclick = () => { prive.style.display = 'flex'; load(); };
  document.getElementById('back-private').onclick = () => { prive.style.display = 'none'; };
  document.getElementById('private-send').onclick = () => {
    const inp = document.getElementById('private-input');
    if(!inp.value.trim()) return;
    save(inp.value, 'moi');
    // Réponse simple pour le test
    setTimeout(()=> save("Bien reçu en privé, BOSS. Ici, c'est seulement entre nous. 🔒", 'nova'), 500);
    inp.value = '';
  };
  console.log('CHAT PRIVE ACTIVE');
})();
