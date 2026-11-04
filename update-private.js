// NOVA CHAT PRIVE DANS LE + - FICHIER update-private.js
(function(){
  // --- CSS ---
  var css = document.createElement('style');
  css.textContent = `
  #nova-prive-menu{ position:fixed; left:12px; bottom:78px; z-index:99999; background:#1a1a1a; border:1px solid #333; border-radius:14px; padding:8px; width:220px; display:none; box-shadow:0 10px 30px rgba(0,0,0,.5); }
  #nova-prive-menu button{ width:100%; text-align:left; background:transparent; border:0; color:#fff; padding:12px 10px; font-size:15px; border-radius:10px; cursor:pointer; }
  #nova-prive-page{ position:fixed; inset:0; z-index:100000; background:#000; display:none; flex-direction:column; }
  #nova-prive-page .top{ padding:14px; font-weight:700; color:#fff; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; }
  #nova-prive-page .msgs{ flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
  #nova-prive-page .b{ background:#1e1e1e; color:#fff; padding:10px 12px; border-radius:14px; max-width:85%; }
  #nova-prive-page .u{ background:#0b93ff; align-self:flex-end; }
  #nova-prive-page .bar{ display:flex; gap:8px; padding:10px; border-top:1px solid #222; }
  #nova-prive-page input{ flex:1; background:#1a1a1a; border:1px solid #333; color:#fff; border-radius:20px; padding:12px; outline:none; }
  #nova-prive-page .send{ background:#0b93ff; color:#fff; border:0; border-radius:50%; width:44px; height:44px; font-size:18px; }
  `;
  document.head.appendChild(css);

  // --- HTML créé par JS ---
  var menu = document.createElement('div');
  menu.id = 'nova-prive-menu';
  menu.innerHTML = '<button id="nova-open-prive">🔒 &nbsp; Chat privé</button>';
  document.body.appendChild(menu);

  var page = document.createElement('div');
  page.id = 'nova-prive-page';
  page.innerHTML = '<div class="top"><span>🔒 Chat privé - entre nous</span><button id="nova-close-prive" style="background:#222;color:#fff;border:0;border-radius:50%;width:32px;height:32px;">X</button></div><div class="msgs" id="nova-prive-msgs"><div class="b">Bienvenue en privé, BOSS. Ici c’est seulement entre nous. 🔒</div></div><div class="bar"><input id="nova-prive-input" placeholder="Écris en privé..."><button class="send" id="nova-prive-send">➤</button></div>';
  document.body.appendChild(page);

  var msgs = document.getElementById('nova-prive-msgs');
  var input = document.getElementById('nova-prive-input');

  // --- Trouve le bouton + ---
  function findPlus(){
    var btns = document.querySelectorAll('button');
    for(var i=0;i<btns.length;i++){
      var t = (btns[i].innerText||'').trim();
      if(t === '+' || t === '＋') return btns[i];
    }
    return null;
  }
  var plus = findPlus();

  if(plus){
    plus.addEventListener('click', function(){
      setTimeout(function(){
        if(menu.style.display === 'block') menu.style.display = 'none';
        else menu.style.display = 'block';
      }, 100);
    });
  }

  document.addEventListener('click', function(e){
    if(menu.style.display === 'block' && !menu.contains(e.target) && e.target !== plus){
      menu.style.display = 'none';
    }
  });

  document.getElementById('nova-open-prive').onclick = function(){
    menu.style.display = 'none';
    page.style.display = 'flex';
    input.focus();
  };
  document.getElementById('nova-close-prive').onclick = function(){
    page.style.display = 'none';
  };
  function send(){
    var v = input.value.trim();
    if(!v) return;
    var d = document.createElement('div'); d.className='b u'; d.textContent=v; msgs.appendChild(d);
    input.value='';
    setTimeout(function(){
      var r = document.createElement('div'); r.className='b'; r.textContent='Bien reçu en privé, BOSS. Ici c’est seulement entre nous. 🔒';
      msgs.appendChild(r); msgs.scrollTop = msgs.scrollHeight;
    }, 500);
    msgs.scrollTop = msgs.scrollHeight;
  }
  document.getElementById('nova-prive-send').onclick = send;
  input.addEventListener('keydown', function(e){ if(e.key==='Enter') send(); });
})();
