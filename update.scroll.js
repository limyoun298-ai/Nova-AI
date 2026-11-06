/* ============================================================
   NOVA AI - UPDATE.TABLEAUX.JS - VERSION RENOUVELÉE
   SCROLL + PYTHON + VITESSE IMPRESSION COMME META AI
   100% CONNECTÉ - NE CASSE RIEN
   ============================================================ */
(function () {
"use strict";
try { if (window.NOVA_RENOUVELE) return; window.NOVA_RENOUVELE = true; } catch(e){ return; }

let NOVA_UTILISATEUR_EN_HAUT = false;
let NOVA_AI_ECRIT = false;

/* ================= OUTILS ================= */
function echapperHTML(t){ try{ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }catch(e){ return ""; } }
function elementValide(el){ try{ return !!(el && el.nodeType===1 && document.documentElement.contains(el)); }catch(e){ return false; } }
function estMessageIA(el){
  try{
    if(!el) return false;
    const role = String(el.getAttribute("data-role")||"").toLowerCase();
    const auteur = String(el.getAttribute("data-author")||"").toLowerCase();
    const cls = String(el.className||"").toLowerCase();
    if(role==="assistant"||role==="ai"||role==="bot"||auteur==="assistant"||auteur==="nova") return true;
    if(cls.includes("assistant-message")||cls.includes("ai-message")||cls.includes("bot-message")||cls.includes("message-assistant")) return true;
    if(el.textContent && el.textContent.length>2 && !el.closest('form,textarea,input')) return true;
    return false;
  }catch(e){ return false; }
}

/* ================= ZONES ================= */
function trouverZoneDiscussion(){
  try{
    const cands = [document.querySelector('[data-role="discussion"]'), document.querySelector('.chat-messages'), document.querySelector('.messages-container'), document.querySelector('.conversation'), document.querySelector('main'), document.scrollingElement];
    for(const c of cands){ if(c && c.scrollHeight > c.clientHeight + 50) return c; }
    return document.scrollingElement || document.documentElement || document.body;
  }catch(e){ return document.scrollingElement || document.body; }
}
function trouverZoneSaisie(){
  try{
    const ta = document.querySelector('textarea');
    if(ta) return ta.closest('form') || ta.parentElement.parentElement || ta.parentElement;
    return document.querySelector('form');
  }catch(e){ return null; }
}
function estEnBas(zone, tol){
  try{ const t = tol || 120; return (zone.scrollHeight - zone.scrollTop - zone.clientHeight) < t; }catch(e){ return true; }
}

/* ================= STYLES ================= */
function installerStyles(){
  try{
    if(document.getElementById('nova-renouvele-style')) return;
    const style = document.createElement('style');
    style.id = 'nova-renouvele-style';
    style.textContent = `
      /* A - Impression propre ligne par ligne */
      [data-role="assistant"], .assistant-message, .ai-message, .bot-message, .message-assistant {
        white-space: pre-wrap; word-break: break-word; line-height: 1.65;
      }
      /* A - Zone texte au-dessus du clavier */
      .nova-clavier-au-dessus { position: fixed !important; left: 0 !important; right: 0 !important; bottom: var(--nova-clavier-hauteur, 0px) !important; z-index: 9999 !important; background: #0a0a0a !important; padding-bottom: env(safe-area-inset-bottom) !important; }
      /* B - Flèche bas */
      #nova-bouton-bas { position: fixed; left: 50%; transform: translateX(-50%); bottom: 92px; z-index: 2147483001; width: 38px; height: 38px; border-radius: 50%; background: #2f7bff; border: 1px solid #478bff; color: white; display: none; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
      #nova-bouton-bas:active { transform: translateX(-50%) scale(.93); }
      #nova-bouton-bas.nova-visible { display: flex !important; }

      /* PYTHON - Conteneur */
      .nova-code-conteneur { width: 100%; max-width: 100%; margin: 14px 0; border-radius: 16px; overflow: hidden; background: #0d0d0d; border: 1px solid #343438; color: white; }
      /* PYTHON - Barre Voir / Copier / Fermé - SVG BLANCHE */
      .nova-code-barre { display: flex; align-items: center; gap: 7px; padding: 9px 10px; background: #171717; border-bottom: 1px solid #303030; flex-wrap: wrap; }
      .nova-code-barre button { border: 0; border-radius: 9px; padding: 7px 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; cursor: pointer; color: white; }
      .nova-code-barre button svg { stroke: white !important; color: white !important; flex-shrink: 0; }
      .nova-code-copier { background: #2f7bff; }
      .nova-code-voir { background: #2c2c2e; }
      .nova-code-fermer { background: #3a3a3e; }
      .nova-code-barre button:active { transform: scale(.97); }
      .nova-code-scroll { max-height: 390px; overflow: auto; background: #0d0d0d; -webkit-overflow-scrolling: touch; }
      .nova-code-scroll pre { margin: 0; padding: 15px; min-width: max-content; font-family: monospace; font-size: 13px; line-height: 1.65; white-space: pre; tab-size: 4; }
      .nova-code-motcle { color: #bd93f9; } .nova-code-string { color: #55d98b; } .nova-code-commentaire { color: #888888; font-style: italic; } .nova-code-nombre { color: #79c0ff; } .nova-code-normal { color: #e6e6e6; }

      /* PYTHON - Modale plein écran */
      .nova-code-modal { position: fixed; inset: 0; z-index: 2147483000; background: #080808; display: flex; flex-direction: column; padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); }
      .nova-code-modal-entete { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px; background: #171717; border-bottom: 1px solid #333; }
      .nova-code-modal-titre { color: white; font-size: 14px; font-weight: 700; }
      .nova-code-modal-actions { display: flex; gap: 7px; }
      .nova-code-modal button { border: 0; border-radius: 9px; padding: 9px 12px; background: #2f7bff; color: white; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .nova-code-modal button svg { stroke: white !important; color: white !important; }
      .nova-code-modal .nova-fermer { background: #2c2c2e; }
      .nova-code-modal-corps { flex: 1; overflow: auto; padding: 14px; color: white; background: #0d0d0d; -webkit-overflow-scrolling: touch; }
      .nova-code-modal pre { margin: 0; white-space: pre; width: max-content; min-width: 100%; font: 13px/1.7 monospace; tab-size: 4; }
    `;
    document.head.appendChild(style);
  }catch(e){}
}

/* ================= SVG BLANCHE - VOIR / COPIER / FERMÉ ================= */
function svgCopierBlanc(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'; }
function svgOeilBlanc(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'; }
function svgFermerBlanc(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>'; }

/* ================= PYTHON ================= */
function colorerPython(code){
  try{
    const texte = String(code);
    const tokens = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self)\b|\b\d+(?:\.\d+)?\b)/gm;
    let res = ""; let pos = 0; let m;
    while((m = tokens.exec(texte)) !== null){
      res += echapperHTML(texte.slice(pos, m.index));
      const tok = m[0]; let cls = "nova-code-normal";
      if(tok.startsWith("#")) cls = "nova-code-commentaire";
      else if(tok.startsWith('"') || tok.startsWith("'")) cls = "nova-code-string";
      else if(/^\d/.test(tok)) cls = "nova-code-nombre";
      else cls = "nova-code-motcle";
      res += '<span class="'+cls+'">'+echapperHTML(tok)+'</span>'; pos = tokens.lastIndex;
    }
    res += echapperHTML(texte.slice(pos)); return res;
  }catch(e){ return echapperHTML(code); }
}

async function copierTexte(code, bouton){
  try{
    const texte = String(code); let ok = false;
    if(navigator.clipboard && window.isSecureContext){ try{ await navigator.clipboard.writeText(texte); ok = true; }catch(e){} }
    if(!ok){
      const zone = document.createElement("textarea"); zone.value = texte; zone.setAttribute("readonly",""); zone.style.position="fixed"; zone.style.opacity="0"; zone.style.left="-9999px"; document.body.appendChild(zone); zone.select(); try{ ok = document.execCommand("copy"); }catch(e){ ok=false; } zone.remove();
    }
    if(bouton && ok){ const ancien = bouton.innerHTML; bouton.textContent = "Copié !"; setTimeout(function(){ try{ bouton.innerHTML = ancien; }catch(e){} }, 2000); }
    return ok;
  }catch(e){ return false; }
}

function ouvrirModaleCode(codeOriginal){
  try{
    const ancienne = document.getElementById("nova-code-modal"); if(ancienne) ancienne.remove();
    const modal = document.createElement("div"); modal.className = "nova-code-modal"; modal.id = "nova-code-modal";
    const entete = document.createElement("div"); entete.className = "nova-code-modal-entete";
    const titre = document.createElement("div"); titre.className = "nova-code-modal-titre"; titre.textContent = "Code Python";
    const actions = document.createElement("div"); actions.className = "nova-code-modal-actions";
    const copier = document.createElement("button"); copier.type="button"; copier.innerHTML = svgCopierBlanc() + "<span>Copier</span>"; copier.addEventListener("click", function(){ copierTexte(codeOriginal, copier); });
    const fermer = document.createElement("button"); fermer.className="nova-fermer"; fermer.type="button"; fermer.innerHTML = svgFermerBlanc() + "<span>Fermé</span>";
    const corps = document.createElement("div"); corps.className="nova-code-modal-corps";
    const pre = document.createElement("pre"); const code = document.createElement("code"); code.textContent = String(codeOriginal); pre.appendChild(code); corps.appendChild(pre);
    const closeModal = function(){ try{ modal.remove(); document.body.style.overflow=""; }catch(e){} };
    fermer.addEventListener("click", closeModal);
    actions.appendChild(copier); actions.appendChild(fermer); entete.appendChild(titre); entete.appendChild(actions); modal.appendChild(entete); modal.appendChild(corps);
    document.body.appendChild(modal); document.body.style.overflow="hidden";
    modal.addEventListener("click", function(e){ if(e.target===modal) closeModal(); });
    const touche = function(e){ if(e.key==="Escape"){ closeModal(); document.removeEventListener("keydown", touche); } };
    document.addEventListener("keydown", touche);
  }catch(e){ try{ document.body.style.overflow=""; }catch(er){} }
}

function creerBarrePython(conteneur, codeOriginal){
  try{
    if(!elementValide(conteneur)) return;
    if(conteneur.dataset.novaBoutonsCode==="oui") return;
    const barre = document.createElement("div"); barre.className="nova-code-barre";

    // Bouton VOIR
    const btnVoir = document.createElement("button"); btnVoir.className="nova-code-voir"; btnVoir.type="button";
    btnVoir.innerHTML = svgOeilBlanc() + "<span>Voir</span>";
    btnVoir.addEventListener("click", function(){ ouvrirModaleCode(codeOriginal); });

    // Bouton COPIER
    const btnCopier = document.createElement("button"); btnCopier.className="nova-code-copier"; btnCopier.type="button";
    btnCopier.innerHTML = svgCopierBlanc() + "<span>Copier</span>";
    btnCopier.addEventListener("click", function(){ copierTexte(codeOriginal, btnCopier); });

    // Bouton FERMÉ - cache le bloc, ne supprime pas le code
    const btnFermer = document.createElement("button"); btnFermer.className="nova-code-fermer"; btnFermer.type="button";
    btnFermer.innerHTML = svgFermerBlanc() + "<span>Fermé</span>";
    btnFermer.addEventListener("click", function(){
      try{
        const scroll = conteneur.querySelector(".nova-code-scroll");
        if(scroll){
          const cache = scroll.style.display === "none";
          scroll.style.display = cache ? "" : "none";
          btnFermer.innerHTML = cache ? svgFermerBlanc() + "<span>Fermé</span>" : svgOeilBlanc() + "<span>Ouvrir</span>";
        }
      }catch(e){}
    });

    barre.appendChild(btnVoir); barre.appendChild(btnCopier); barre.appendChild(btnFermer);
    conteneur.insertBefore(barre, conteneur.firstChild);
    conteneur.dataset.novaBoutonsCode = "oui";
  }catch(e){}
}

function transformerBlocPython(element){
  try{
    if(!elementValide(element)) return;
    if(!estMessageIA(element)) return;

    // Cas 1 : <pre><code>
    const blocs = element.querySelectorAll("pre");
    blocs.forEach(function(pre){
      try{
        if(pre.dataset.novaPythonTraite==="oui") return;
        const codeEl = pre.querySelector("code"); if(!codeEl) return;
        const txt = codeEl.textContent || "";
        const cls = String(codeEl.getAttribute("class")||"").toLowerCase();
        const isPy = cls.includes("python") || cls.includes("py") || txt.includes("def ") || txt.includes("import ") || txt.includes("print(");
        if(!isPy) return;
        const codeOriginal = codeEl.textContent;
        const conteneur = document.createElement("div"); conteneur.className="nova-code-conteneur";
        const barreScroll = document.createElement("div"); barreScroll.className="nova-code-scroll";
        const nouveauPre = document.createElement("pre"); const nouveauCode = document.createElement("code");
        nouveauCode.className="language-python"; nouveauCode.innerHTML = colorerPython(codeOriginal);
        nouveauPre.appendChild(nouveauCode); barreScroll.appendChild(nouveauPre); conteneur.appendChild(barreScroll);
        creerBarrePython(conteneur, codeOriginal);
        pre.replaceWith(conteneur);
      }catch(e){}
    });

    // Cas 2 : texte ```python ... ```
    const zones = [];
    const arbre = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, { acceptNode: function(node){
      try{ if(!node.nodeValue.includes("```")) return NodeFilter.FILTER_REJECT; if(node.parentElement.closest("pre,code,script,style,textarea,.nova-code-conteneur")) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; }catch(e){ return NodeFilter.FILTER_REJECT; }
    }});
    while(arbre.nextNode()) zones.push(arbre.currentNode);
    zones.forEach(function(node){
      try{
        const texte = node.nodeValue; if(!texte.includes("```")) return;
        const regex = /```(?:python|py)?\s*\n([\s\S]*?)```/g; let match; let lastIndex=0; const frag=document.createDocumentFragment(); let trouve=false;
        while((match=regex.exec(texte))!==null){
          trouve=true; const avant=texte.slice(lastIndex, match.index); if(avant) frag.appendChild(document.createTextNode(avant));
          const codeOriginal=match[1];
          const conteneur=document.createElement("div"); conteneur.className="nova-code-conteneur";
          const barreScroll=document.createElement("div"); barreScroll.className="nova-code-scroll";
          const nouveauPre=document.createElement("pre"); const nouveauCode=document.createElement("code");
          nouveauCode.className="language-python"; nouveauCode.innerHTML=colorerPython(codeOriginal);
          nouveauPre.appendChild(nouveauCode); barreScroll.appendChild(nouveauPre); conteneur.appendChild(barreScroll);
          creerBarrePython(conteneur, codeOriginal);
          frag.appendChild(conteneur); lastIndex=regex.lastIndex;
        }
        if(trouve){ const apres=texte.slice(lastIndex); if(apres) frag.appendChild(document.createTextNode(apres)); node.parentNode.replaceChild(frag, node); }
      }catch(e){}
    });
  }catch(e){}
}

/* ================= SCROLL A + B ================= */
function creerBoutonDescendre(){
  try{
    if(document.getElementById('nova-bouton-bas')) return document.getElementById('nova-bouton-bas');
    const btn=document.createElement('button'); btn.id='nova-bouton-bas'; btn.type='button'; btn.setAttribute('aria-label','Descendre en bas');
    btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
    btn.addEventListener('click', function(){
      try{ NOVA_UTILISATEUR_EN_HAUT=false; const zone=trouverZoneDiscussion(); zone.scrollTo({top:zone.scrollHeight, behavior:'smooth'}); window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}); cacherBoutonBas(); }catch(e){}
    });
    document.body.appendChild(btn); return btn;
  }catch(e){ return null; }
}
function montrerBoutonBas(){ try{ const b=creerBoutonDescendre(); if(b) b.classList.add('nova-visible'); }catch(e){} }
function cacherBoutonBas(){ try{ const b=document.getElementById('nova-bouton-bas'); if(b) b.classList.remove('nova-visible'); }catch(e){} }
function mettreAJourBoutonBas(){
  try{
    const zone=trouverZoneDiscussion();
    if(estEnBas(zone,140)){ cacherBoutonBas(); NOVA_UTILISATEUR_EN_HAUT=false; }
    else montrerBoutonBas();
  }catch(e){}
}
function gererScrollUtilisateur(){
  try{
    if(window.__NOVA_SCROLL_ECOUTE) return; window.__NOVA_SCROLL_ECOUTE=true;
    const zone=trouverZoneDiscussion(); let dernierTop=zone.scrollTop||window.scrollY||0;
    const onScroll=function(){
      try{
        const topActuel=zone.scrollTop||window.scrollY||0;
        if(topActuel < dernierTop - 5) NOVA_UTILISATEUR_EN_HAUT=true;
        if(estEnBas(zone,120)) NOVA_UTILISATEUR_EN_HAUT=false;
        mettreAJourBoutonBas(); dernierTop=topActuel;
      }catch(e){}
    };
    zone.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('scroll', onScroll, {passive:true});
    document.addEventListener('touchmove', onScroll, {passive:true});
  }catch(e){}
}

/* VITESSE IMPRESSION : RAPIDE MAIS BIEN PRÉPARÉE, COMME MOI */
function gererStreaming(){
  try{
    if(window.__NOVA_STREAMING_OBSERVE) return; window.__NOVA_STREAMING_OBSERVE=true;
    const observer=new MutationObserver(function(){
      try{
        NOVA_AI_ECRIT=true;
        // On ne force JAMAIS l'utilisateur en bas s'il est en haut
        if(!NOVA_UTILISATEUR_EN_HAUT){
          const zone=trouverZoneDiscussion();
          if(estEnBas(zone, 350)){
            // Vitesse rapide mais douce : requestAnimationFrame, pas de saut brutal
            requestAnimationFrame(function(){
              try{ if(!NOVA_UTILISATEUR_EN_HAUT) zone.scrollTop=zone.scrollHeight; }catch(e){}
            });
          }
        } else montrerBoutonBas();
        mettreAJourBoutonBas();
        clearTimeout(window.__NOVA_FIN_ECRITURE);
        window.__NOVA_FIN_ECRITURE=setTimeout(function(){ NOVA_AI_ECRIT=false; mettreAJourBoutonBas(); }, 1200);
      }catch(e){}
    });
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
  }catch(e){}
}
function gererClavier(){
  try{
    if(window.__NOVA_CLAVIER_GERE) return; window.__NOVA_CLAVIER_GERE=true;
    const appliquer=function(h){
      try{ const zone=trouverZoneSaisie(); if(!zone) return; document.documentElement.style.setProperty('--nova-clavier-hauteur', h+'px'); if(h>0) zone.classList.add('nova-clavier-au-dessus'); else zone.classList.remove('nova-clavier-au-dessus'); }catch(e){}
    };
    if(window.visualViewport){
      const maj=function(){ try{ const diff=window.innerHeight-window.visualViewport.height; appliquer(diff>20?diff:0); }catch(e){} };
      window.visualViewport.addEventListener('resize', maj); window.visualViewport.addEventListener('scroll', maj);
    }
    document.addEventListener('focusin', function(e){
      try{ if(e.target && (e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT')){ setTimeout(function(){ const z=trouverZoneSaisie(); if(z) z.scrollIntoView({block:'end', behavior:'smooth'}); }, 250); } }catch(err){}
    });
  }catch(e){}
}

/* ================= OBSERVATION ================= */
function traiterMessages(){
  try{
    const msgs = document.querySelectorAll('[data-role="assistant"], .assistant-message, .ai-message, .bot-message, .message-assistant');
    msgs.forEach(function(m){ try{ transformerBlocPython(m); }catch(e){} });
  }catch(e){}
}
function observerDiscussion(){
  try{
    if(window.__NOVA_DISCUSSION_OBSERVEE) return; if(!document.body) return; window.__NOVA_DISCUSSION_OBSERVEE=true;
    const obs=new MutationObserver(function(muts){
      try{
        let nouveau=false;
        muts.forEach(function(mut){
          try{
            if(mut.type==='characterData'){ nouveau=true; return; }
            mut.addedNodes.forEach(function(node){
              try{
                if(node.nodeType!==1) return;
                if(node.closest && node.closest('.nova-code-conteneur,.nova-code-modal,#nova-bouton-bas')) return;
                if(estMessageIA(node)){ transformerBlocPython(node); nouveau=true; return; }
                const enfants=node.querySelectorAll('[data-role="assistant"],.assistant-message,.ai-message,.bot-message,.message-assistant');
                enfants.forEach(function(enf){ transformerBlocPython(enf); nouveau=true; });
              }catch(e){}
            });
          }catch(e){}
        });
        if(nouveau) setTimeout(traiterMessages, 150);
      }catch(e){}
    });
    obs.observe(document.body, {childList:true, subtree:true, characterData:true});
  }catch(e){}
}

function init(){
  try{ installerStyles(); }catch(e){}
  try{ creerBoutonDescendre(); }catch(e){}
  try{ gererScrollUtilisateur(); }catch(e){}
  try{ gererStreaming(); }catch(e){}
  try{ gererClavier(); }catch(e){}
  try{ traiterMessages(); }catch(e){}
  try{ observerDiscussion(); }catch(e){}
}
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init, {once:true}); } else { init(); }
if(!window.__NOVA_SCROLL_SECOURS){ window.__NOVA_SCROLL_SECOURS=setInterval(function(){ try{ mettreAJourBoutonBas(); }catch(e){} try{ traiterMessages(); }catch(e){} }, 2000); }

window.NOVA_SCROLL = { descendreEnBas: function(){ try{ const z=trouverZoneDiscussion(); z.scrollTo({top:z.scrollHeight, behavior:'smooth'}); }catch(e){} } };

})();
