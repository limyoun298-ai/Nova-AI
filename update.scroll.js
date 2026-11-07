/* V9 - MASQUE TOTAL - Ne touche PAS index.html */
if(window.NOVA_SCROLL_V9){}else{
window.NOVA_SCROLL_V9=true;
(function(){
"use strict";
try{

var utilisateurEnHaut=false, dernierTop=0, dernierWinY=0, clicFleche=false, rafActif=false, timerTrans=null;

function zoneChat(){
  return document.getElementById("chat-box")||document.getElementById("messages")||document.getElementById("chat")||document.querySelector("main");
}
function echapperHTML(t){ try{return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}catch(e){return"";} }
function svgCopier(){return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';}
function svgOeil(){return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';}
function svgFermer(){return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';}
function svgFleche(){return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';}

function installerStyle(){
  try{
    if(document.getElementById("nova-v9-style"))return;
    var s=document.createElement("style"); s.id="nova-v9-style";
    // A. ON MASQUE L'EFFET DE INDEX.HTML : on coupe son scroll-behavior, son anchor, et sa vieille barre
    s.textContent='#chat-box,#messages,#chat{scroll-behavior:auto!important;overflow-anchor:none!important;}#nova-fleche-bas{display:none;position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;border:none;background:#292d35;cursor:pointer;z-index:50;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35);}#nova-3-points{display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:16px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,.55);z-index:49;pointer-events:none;}@keyframes novaPoint{0%,100%{opacity:.3}50%{opacity:1}}.nova-code-conteneur{width:100%;margin:14px 0;border-radius:16px;overflow:hidden;background:#0d0d0d;border:1px solid #343438;color:#fff;}.nova-code-barre{display:flex;gap:7px;padding:9px 10px;background:#171717;border-bottom:1px solid #303030;}.nova-code-barre button{border:0;border-radius:9px;padding:7px 10px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;color:#fff;}.nova-code-copier{background:#2f7bff;}.nova-code-voir{background:#2c2c2e;}.nova-code-fermer{background:#3a3a3e;}.nova-code-scroll{max-height:390px;overflow:auto;}.nova-code-scroll pre{margin:0;padding:15px;font:13px/1.65 monospace;white-space:pre;}.nova-code-modal{position:fixed;inset:0;z-index:2147483000;background:#080808;display:flex;flex-direction:column;}.nova-code-modal-entete{display:flex;justify-content:space-between;padding:12px;background:#171717;}.nova-code-modal button{border:0;border-radius:9px;padding:9px 12px;background:#2f7bff;color:#fff;display:inline-flex;gap:6px;}.nova-code-cache-ancien{display:none!important;}';
    document.head.appendChild(s);
  }catch(e){}
}

// ---------- A. ON MASQUE L'IMPRESSION DE INDEX.HTML ----------
// On intercepte TOUTES les façons dont index.html force le scroll.
// Si l'utilisateur est en haut, on ignore. Si c'est le clic flèche, on laisse passer.
try{
  var _sTo=Element.prototype.scrollTo, _wTo=window.scrollTo, _sBy=Element.prototype.scrollBy, _wBy=window.scrollBy, _into=Element.prototype.scrollIntoView;
  Element.prototype.scrollTo=function(){ try{ if(utilisateurEnHaut && !clicFleche) return; return _sTo.apply(this,arguments);}catch(e){} };
  window.scrollTo=function(){ try{ if(utilisateurEnHaut && !clicFleche) return; return _wTo.apply(window,arguments);}catch(e){} };
  Element.prototype.scrollBy=function(){ try{ if(utilisateurEnHaut && !clicFleche) return; return _sBy.apply(this,arguments);}catch(e){} };
  window.scrollBy=function(){ try{ if(utilisateurEnHaut && !clicFleche) return; return _wBy.apply(window,arguments);}catch(e){} };
  Element.prototype.scrollIntoView=function(){ try{ if(utilisateurEnHaut && !clicFleche) return; return _into.apply(this,arguments);}catch(e){} };
  // Bloque aussi le scrollTop direct : index.html fait chat.scrollTop = chat.scrollHeight
  // On le bloque en redéfinissant scrollTop sur la zone de chat dès qu'elle existe
  function bloquerScrollTop(){
    try{
      var z=zoneChat(); if(!z || z.__novaBloque) return;
      z.__novaBloque=true;
      var _val=z.scrollTop;
      // On garde la vraie valeur dans _val, mais si index.html écrit pendant que l'utilisateur est en haut, on ignore l'écriture
      Object.defineProperty(z, 'scrollTop', {
        get:function(){ return _val; },
        set:function(v){
          try{
            if(utilisateurEnHaut && !clicFleche){
              // MASQUÉ : on n'applique pas, on garde la position de l'utilisateur
              return;
            }
            _val=v;
            // Applique vraiment via le prototype pour ne pas boucler
            Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop').set.call(this, v);
            _val=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop').get.call(this);
          }catch(e){}
        },
        configurable:true
      });
    }catch(e){}
  }
  setInterval(bloquerScrollTop, 500);
}catch(e){}

// ---------- B. SCROLL LIBRE EN HAUT ----------
var fleche=null, points=null;
function creerUI(z){
  try{
    if(!fleche){
      fleche=document.createElement("button"); fleche.id="nova-fleche-bas"; fleche.innerHTML=svgFleche();
      fleche.addEventListener("click", function(){
        try{
          clicFleche=true; utilisateurEnHaut=false;
          setTimeout(function(){clicFleche=false;},1000);
          var el=zoneChat();
          if(el) el.scrollTo({top:el.scrollHeight, behavior:"smooth"});
          window.scrollTo({top:document.documentElement.scrollHeight, behavior:"smooth"});
          fleche.style.display="none"; if(points) points.style.display="none";
        }catch(e){clicFleche=false;}
      });
      var p=z.parentElement||document.body;
      try{ if(window.getComputedStyle(p).position==="static") p.style.position="relative"; }catch(e){}
      p.appendChild(fleche);
    }
    if(!points){
      points=document.createElement("div"); points.id="nova-3-points";
      points.innerHTML='<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite .2s;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite .4s;"></span>';
      var p2=z.parentElement||document.body; p2.appendChild(points);
    }
  }catch(e){}
}
function boucle(){
  try{
    if(!utilisateurEnHaut || clicFleche){ rafActif=false; return; }
    rafActif=true;
    var z=zoneChat();
    if(z){
      // Si index.html a quand même réussi à bouger, on remet
      if(Math.abs(z.scrollTop-dernierTop)>2) z.scrollTop=dernierTop;
    }
    if(Math.abs(window.scrollY-dernierWinY)>2 && dernierWinY!==0) window.scrollTo(0,dernierWinY);
    requestAnimationFrame(boucle);
  }catch(e){ rafActif=false; }
}
function memoriser(){
  try{ var z=zoneChat(); if(z) dernierTop=z.scrollTop; dernierWinY=window.scrollY; }catch(e){}
}
function onScroll(){
  try{
    var z=zoneChat(); if(!z) return;
    var enBas=(z.scrollHeight - z.scrollTop - z.clientHeight)<120;
    // Si chat-box ne scrolle pas, on regarde window
    if(z.scrollHeight<=z.clientHeight+10){ enBas=(document.documentElement.scrollHeight - window.scrollY - window.innerHeight)<120; }
    utilisateurEnHaut=!enBas;
    if(utilisateurEnHaut){
      memoriser();
      if(!rafActif) boucle();
      if(fleche) fleche.style.display="flex";
      if(points) points.style.display="block";
    } else {
      if(fleche) fleche.style.display="none";
      if(points) points.style.display="none";
    }
  }catch(e){}
}

// ---------- PYTHON : UNIQUEMENT APRES 800ms DE CALME = VITESSE NATURELLE ----------
// Pendant que Nova écrit, on ne touche à RIEN. C'est ça qui rend l'impression rapide et naturelle, comme Meta AI.
function colorer(code){
  try{
    var t=String(code), rg=/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:def|import|from|print|if|else|for|while|return|class|True|False|None)\b|\b\d+\b/g, r="", p=0, m;
    while((m=rg.exec(t))!==null){ r+=echapperHTML(t.slice(p,m.index)); var w=m[0], c="color:#e6e6e6;"; if(w[0]==="#")c="color:#888;font-style:italic;"; else if(w[0]==='"'||w[0]==="'")c="color:#55d98b;"; else if(/^\d/.test(w))c="color:#79c0ff;"; else c="color:#bd93f9;"; r+='<span style="'+c+'">'+echapperHTML(w)+'</span>'; p=rg.lastIndex; }
    r+=echapperHTML(t.slice(p)); return r;
  }catch(e){ return echapperHTML(code); }
}
function transformer(){
  try{
    var z=zoneChat(); if(!z) return;
    z.querySelectorAll("pre").forEach(function(pre){
      try{
        if(pre.closest(".nova-code-conteneur"))return;
        if(pre.dataset.novaV9==="1")return;
        var codeEl=pre.querySelector("code")||pre; var txt=codeEl.textContent||""; if(!txt) return;
        var cls=String((codeEl.className||"")+" "+(pre.className||"")).toLowerCase();
        if(!(cls.includes("python")||cls.includes("py")||txt.includes("def ")||txt.includes("print("))) return;
        var orig=txt;
        var parent=pre.parentElement;
        if(parent){ for(var i=0;i<parent.children.length;i++){ var f=parent.children[i]; if(f!==pre && f.textContent && (f.textContent.toLowerCase().includes("copier")||f.textContent.toLowerCase().includes("python"))){ if(f.querySelector && f.querySelector("pre"))continue; f.classList.add("nova-code-cache-ancien"); } } }
        var cont=document.createElement("div"); cont.className="nova-code-conteneur";
        cont.innerHTML='<div class="nova-code-scroll"><pre><code></code></pre></div>';
        cont.querySelector("code").innerHTML=colorer(orig);
        var barre=document.createElement("div"); barre.className="nova-code-barre";
        var b1=document.createElement("button"); b1.className="nova-code-voir"; b1.innerHTML=svgOeil()+"<span>Voir</span>"; b1.onclick=function(){ var mo=document.createElement("div"); mo.className="nova-code-modal"; mo.innerHTML='<div class="nova-code-modal-entete"><span style="color:#fff;font-weight:700;">Code Python</span><div><button id="mc">'+svgCopier()+'<span>Copier</span></button> <button id="mf">'+svgFermer()+'<span>Fermer</span></button></div></div><div style="flex:1;overflow:auto;padding:14px;"><pre style="color:#fff;white-space:pre;"></pre></div>'; mo.querySelector("pre").textContent=orig; document.body.appendChild(mo); mo.querySelector("#mf").onclick=function(){mo.remove();}; mo.querySelector("#mc").onclick=function(){ try{navigator.clipboard.writeText(orig);}catch(e){} }; };
        var b2=document.createElement("button"); b2.className="nova-code-copier"; b2.innerHTML=svgCopier()+"<span>Copier</span>"; b2.onclick=function(){ try{navigator.clipboard.writeText(orig); b2.textContent="Copié !"; setTimeout(function(){b2.innerHTML=svgCopier()+"<span>Copier</span>";},1500);}catch(e){} };
        var b3=document.createElement("button"); b3.className="nova-code-fermer"; b3.innerHTML=svgFermer()+"<span>Fermer</span>"; b3.onclick=function(){ var sc=cont.querySelector(".nova-code-scroll"); var c=sc.style.display==="none"; sc.style.display=c?"":"none"; b3.innerHTML=c?svgFermer()+"<span>Fermer</span>":svgOeil()+"<span>Ouvrir</span>"; };
        barre.appendChild(b1); barre.appendChild(b2); barre.appendChild(b3); cont.insertBefore(barre, cont.firstChild);
        pre.dataset.novaV9="1";
        var cible=pre; if(parent && parent!==z && parent.className && String(parent.className).toLowerCase().includes("code")) cible=parent;
        cible.replaceWith(cont);
      }catch(e){}
    });
    // ```python fermé uniquement
    var walker=document.createTreeWalker(z, NodeFilter.SHOW_TEXT, {acceptNode:function(n){ try{ if(!n.nodeValue.includes("```"))return NodeFilter.FILTER_REJECT; if(n.parentElement.closest("pre,code,.nova-code-conteneur"))return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; }catch(e){return NodeFilter.FILTER_REJECT;}}});
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      try{
        var txt=node.nodeValue, rg=/```(?:python|py)?\s*\n([\s\S]*?)```/g, m, di=0, tr=false, frag=document.createDocumentFragment();
        while((m=rg.exec(txt))!==null){ tr=true; var av=txt.slice(di,m.index); if(av) frag.appendChild(document.createTextNode(av)); var orig=m[1]; var cont=document.createElement("div"); cont.className="nova-code-conteneur"; cont.innerHTML='<div class="nova-code-scroll"><pre><code></code></pre></div>'; cont.querySelector("code").innerHTML=colorer(orig); var barre=document.createElement("div"); barre.className="nova-code-barre"; var bb=document.createElement("button"); bb.className="nova-code-copier"; bb.innerHTML=svgCopier()+"<span>Copier</span>"; bb.onclick=function(){try{navigator.clipboard.writeText(orig);}catch(e){}}; barre.appendChild(bb); cont.insertBefore(barre, cont.firstChild); frag.appendChild(cont); di=rg.lastIndex; }
        if(tr && node.parentNode){ var ap=txt.slice(di); if(ap) frag.appendChild(document.createTextNode(ap)); node.parentNode.replaceChild(frag, node); }
      }catch(e){}
    });
  }catch(e){}
}

function demarrer(){
  try{
    var z=zoneChat(); if(!z){ setTimeout(demarrer,500); return; }
    installerStyle(); creerUI(z);
    z.addEventListener("scroll", onScroll, {passive:true, capture:true});
    window.addEventListener("scroll", onScroll, {passive:true, capture:true});
    window.addEventListener("wheel", function(){ setTimeout(onScroll,20); }, {passive:true});
    window.addEventListener("touchmove", function(){ setTimeout(onScroll,20); }, {passive:true});
    var obs=new MutationObserver(function(){
      try{
        // A. On ne transforme PAS pendant l'écriture, on attend 800ms de calme -> impression rapide naturelle
        if(timerTrans) clearTimeout(timerTrans);
        timerTrans=setTimeout(transformer, 800);
        // B. Si l'utilisateur est en haut, on relance la boucle de blocage
        if(utilisateurEnHaut && !rafActif) boucle();
      }catch(e){}
    });
    obs.observe(z, {childList:true, subtree:true, characterData:true});
  }catch(e){}
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();

}catch(e){}
})();
   }
