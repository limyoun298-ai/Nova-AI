/* ============================================================
   NOVA AI - update.scroll.js - VERSION 8.0 CAPE TOTALE
   BASE V1 QUI MARCHE + VITESSE META AI + SCROLL LIBRE
   REGLE: Ne touche PAS a index.html
   Tu mets juste: <script src="update.scroll.js"></script>
   ============================================================ */
if (window.NOVA_SCROLL_V8) {} else {
window.NOVA_SCROLL_V8 = true;
(function(){
"use strict";
try{

var utilisateurEnHaut=false, novaEcrit=false, timerPoints=null, dernierScrollTop=0, dernierWindowY=0, clicFleche=false, derniereMutation=0, timerTransform=null, timerFinEcriture=null, rafScroll=null, rafActif=false;

function zoneChat(){
  return document.getElementById("chat-box")||document.getElementById("messages")||document.getElementById("chat")||document.querySelector("[data-chat]")||document.querySelector("main");
}
function getScroller(){
  try{
    var z=zoneChat();
    if(z && z.scrollHeight>z.clientHeight+10) return {el:z, isWindow:false};
    // si chat-box ne scrolle pas, c'est la page qui scrolle
    if(document.scrollingElement && document.scrollingElement.scrollHeight>window.innerHeight+10) return {el:document.scrollingElement, isWindow:true};
    if(z) return {el:z, isWindow:false};
    return {el:document.scrollingElement||document.body, isWindow:true};
  }catch(e){ return {el:document.scrollingElement, isWindow:true}; }
}
function getScrollTop(sc){
  try{ return sc.isWindow ? window.scrollY : sc.el.scrollTop; }catch(e){ return 0; }
}
function setScrollTop(sc, v){
  try{ if(sc.isWindow) window.scrollTo(0,v); else sc.el.scrollTop=v; }catch(e){}
}
function estEnBas(){
  try{
    var sc=getScroller();
    var el=sc.el, h=sc.isWindow?window.innerHeight:el.clientHeight, sh=sc.isWindow?document.documentElement.scrollHeight:el.scrollHeight, top=getScrollTop(sc);
    return (sh-top-h)<120;
  }catch(e){ return true; }
}
function echapperHTML(t){ try{ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }catch(e){ return ""; } }

// ---------- SVG - ZERO EMOJI ----------
function svgCopier(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'; }
function svgOeil(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'; }
function svgFermer(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>'; }
function svgFlecheBas(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>'; }

function installerStyles(){
  try{
    if(document.getElementById("nova-v8-style")) return;
    var s=document.createElement("style"); s.id="nova-v8-style";
    s.textContent='#nova-fleche-bas{display:none;position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;border:none;background:#292d35;color:#fff;cursor:pointer;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,0.35);align-items:center;justify-content:center;}#nova-fleche-bas svg{stroke:white!important;}#nova-3-points{display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:16px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,0.55);z-index:49;pointer-events:none;}@keyframes novaPoint{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}.nova-code-conteneur{width:100%;max-width:100%;margin:14px 0;border-radius:16px;overflow:hidden;background:#0d0d0d;border:1px solid #343438;color:white;}.nova-code-barre{display:flex;align-items:center;gap:7px;padding:9px 10px;background:#171717;border-bottom:1px solid #303030;flex-wrap:wrap;}.nova-code-barre button{border:0;border-radius:9px;padding:7px 10px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;color:white;}.nova-code-barre button svg{stroke:white!important;flex-shrink:0;}.nova-code-copier{background:#2f7bff;}.nova-code-voir{background:#2c2c2e;}.nova-code-fermer{background:#3a3a3e;}.nova-code-scroll{max-height:390px;overflow:auto;background:#0d0d0d;-webkit-overflow-scrolling:touch;}.nova-code-scroll pre{margin:0;padding:15px;min-width:max-content;font-family:monospace;font-size:13px;line-height:1.65;white-space:pre;tab-size:4;}.nova-code-motcle{color:#bd93f9;}.nova-code-string{color:#55d98b;}.nova-code-commentaire{color:#888888;font-style:italic;}.nova-code-nombre{color:#79c0ff;}.nova-code-normal{color:#e6e6e6;}.nova-code-modal{position:fixed;inset:0;z-index:2147483000;background:#080808;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);}.nova-code-modal-entete{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px;background:#171717;border-bottom:1px solid #333;}.nova-code-modal-titre{color:white;font-size:14px;font-weight:700;}.nova-code-modal-actions{display:flex;gap:7px;}.nova-code-modal button{border:0;border-radius:9px;padding:9px 12px;background:#2f7bff;color:white;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}.nova-code-modal .nova-fermer{background:#2c2c2e;}.nova-code-modal-corps{flex:1;overflow:auto;padding:14px;color:white;background:#0d0d0d;}.nova-code-modal pre{margin:0;white-space:pre;width:max-content;min-width:100%;font:13px/1.7 monospace;tab-size:4;}.nova-code-cache-ancien{display:none!important;}';
    document.head.appendChild(s);
  }catch(e){}
}

// ---------- PYTHON - NE TOURNE PAS PENDANT L'ECRITURE ----------
function colorerPython(code){
  try{
    var texte=String(code);
    var tokens=/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|print|len|range|str|int|float|list|dict|tuple|set|self)\b|\b\d+(?:\.\d+)?\b/g;
    var res="", pos=0, m; tokens.lastIndex=0;
    while((m=tokens.exec(texte))!==null){
      res+=echapperHTML(texte.slice(pos,m.index));
      var mot=m[0], cls="nova-code-normal";
      if(mot.charAt(0)==="#") cls="nova-code-commentaire";
      else if(mot.charAt(0)==='"'||mot.charAt(0)==="'") cls="nova-code-string";
      else if(/^\d/.test(mot)) cls="nova-code-nombre";
      else cls="nova-code-motcle";
      res+='<span class="'+cls+'">'+echapperHTML(mot)+'</span>'; pos=tokens.lastIndex;
    }
    res+=echapperHTML(texte.slice(pos)); return res;
  }catch(e){ return echapperHTML(code); }
}
async function copierTexte(code, bouton){
  try{
    var texte=String(code), ok=false;
    if(navigator.clipboard && window.isSecureContext){ try{ await navigator.clipboard.writeText(texte); ok=true; }catch(e){} }
    if(!ok){ var zone=document.createElement("textarea"); zone.value=texte; zone.style.position="fixed"; zone.style.opacity="0"; zone.style.left="-9999px"; document.body.appendChild(zone); zone.select(); try{ ok=document.execCommand("copy"); }catch(e){ ok=false; } zone.remove(); }
    if(bouton && ok){ var ancien=bouton.innerHTML; bouton.textContent="Copié !"; setTimeout(function(){ try{ bouton.innerHTML=ancien; }catch(e){} },2000); }
    return ok;
  }catch(e){ return false; }
}
function ouvrirModaleCode(codeOriginal){
  try{
    var a=document.getElementById("nova-code-modal"); if(a) a.remove();
    var modal=document.createElement("div"); modal.className="nova-code-modal"; modal.id="nova-code-modal";
    modal.innerHTML='<div class="nova-code-modal-entete"><div class="nova-code-modal-titre">Code Python</div><div class="nova-code-modal-actions"><button type="button" id="nova-modal-copier">'+svgCopier()+'<span>Copier</span></button><button type="button" class="nova-fermer" id="nova-modal-fermer">'+svgFermer()+'<span>Fermer</span></button></div></div><div class="nova-code-modal-corps"><pre></pre></div>';
    modal.querySelector("pre").textContent=String(codeOriginal);
    document.body.appendChild(modal); document.body.style.overflow="hidden";
    var fermer=function(){ try{ modal.remove(); document.body.style.overflow=""; }catch(e){} };
    modal.querySelector("#nova-modal-fermer").addEventListener("click", fermer);
    modal.querySelector("#nova-modal-copier").addEventListener("click", function(){ copierTexte(codeOriginal, this); });
    modal.addEventListener("click", function(e){ if(e.target===modal) fermer(); });
  }catch(e){ try{ document.body.style.overflow=""; }catch(er){} }
}
function creerBarrePython(conteneur, codeOriginal){
  try{
    if(conteneur.dataset.novaBoutonsCode==="oui") return;
    var barre=document.createElement("div"); barre.className="nova-code-barre";
    var b1=document.createElement("button"); b1.className="nova-code-voir"; b1.type="button"; b1.innerHTML=svgOeil()+"<span>Voir</span>"; b1.addEventListener("click", function(){ ouvrirModaleCode(codeOriginal); });
    var b2=document.createElement("button"); b2.className="nova-code-copier"; b2.type="button"; b2.innerHTML=svgCopier()+"<span>Copier</span>"; b2.addEventListener("click", function(){ copierTexte(codeOriginal, b2); });
    var b3=document.createElement("button"); b3.className="nova-code-fermer"; b3.type="button"; b3.innerHTML=svgFermer()+"<span>Fermer</span>"; b3.addEventListener("click", function(){ try{ var z=conteneur.querySelector(".nova-code-scroll"); if(!z) return; var c=z.style.display==="none"; z.style.display=c?"":"none"; b3.innerHTML=c?svgFermer()+"<span>Fermer</span>":svgOeil()+"<span>Ouvrir</span>"; }catch(e){} });
    barre.appendChild(b1); barre.appendChild(b2); barre.appendChild(b3);
    conteneur.insertBefore(barre, conteneur.firstChild); conteneur.dataset.novaBoutonsCode="oui";
  }catch(e){}
}
function transformerPythonDans(element){
  try{
    if(!element || !element.querySelectorAll) return;
    var blocs=element.querySelectorAll("pre");
    blocs.forEach(function(pre){
      try{
        if(pre.closest(".nova-code-conteneur")) return;
        if(pre.dataset.novaV8Traite==="oui") return;
        var codeEl=pre.querySelector("code")||pre;
        var texte=codeEl.textContent||""; if(!texte) return;
        if(texte.trim().length<5) return;
        // Ne transforme PAS un bloc en cours d'écriture : il doit être fermé (```) ou avoir un saut de ligne final stable. Si Nova écrit encore, on attend.
        // On détecte : si le bloc est le dernier enfant et que l'écriture est en cours, on saute.
        var classe=String((codeEl.getAttribute && codeEl.getAttribute("class")||"")+" "+(pre.getAttribute("class")||"")).toLowerCase();
        var estPython=classe.includes("python")||classe.includes("py")||texte.includes("def ")||texte.includes("import ")||texte.includes("print(");
        if(!estPython) return;
        var original=texte;
        var parent=pre.parentElement;
        if(parent){
          var fr=parent.children;
          for(var i=0;i<fr.length;i++){ var f=fr[i]; if(f!==pre && f.textContent && (f.textContent.toLowerCase().includes("copier")||f.textContent.toLowerCase().includes("python"))){ if(f.querySelector && f.querySelector("pre")) continue; f.classList.add("nova-code-cache-ancien"); } }
        }
        var cont=document.createElement("div"); cont.className="nova-code-conteneur";
        cont.innerHTML='<div class="nova-code-scroll"><pre><code class="language-python"></code></pre></div>';
        cont.querySelector("code").innerHTML=colorerPython(original);
        creerBarrePython(cont, original);
        pre.dataset.novaV8Traite="oui";
        var cible=pre;
        if(parent && parent!==element && parent.className && (String(parent.className).toLowerCase().includes("code")||String(parent.className).toLowerCase().includes("python"))) cible=parent;
        cible.replaceWith(cont);
      }catch(e){}
    });
    // ```python en texte brut - même règle : on attend que le bloc soit fermé
    var walker=document.createTreeWalker(element, NodeFilter.SHOW_TEXT, { acceptNode:function(n){ try{ if(!n.nodeValue.includes("```")) return NodeFilter.FILTER_REJECT; if(n.parentElement.closest("pre,code,script,style,textarea,.nova-code-conteneur,#nova-fleche-bas,#nova-3-points")) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; }catch(e){ return NodeFilter.FILTER_REJECT; } } });
    var zones=[]; while(walker.nextNode()) zones.push(walker.currentNode);
    zones.forEach(function(node){
      try{
        var texte=node.nodeValue; var regex=/```(?:python|py)?\s*\n([\s\S]*?)```/g; var match, di=0, trouve=false; var frag=document.createDocumentFragment();
        while((match=regex.exec(texte))!==null){ trouve=true; var av=texte.slice(di,match.index); if(av) frag.appendChild(document.createTextNode(av)); var orig=match[1]; var cont=document.createElement("div"); cont.className="nova-code-conteneur"; cont.innerHTML='<div class="nova-code-scroll"><pre><code class="language-python"></code></pre></div>'; cont.querySelector("code").innerHTML=colorerPython(orig); creerBarrePython(cont, orig); frag.appendChild(cont); di=regex.lastIndex; }
        if(trouve && node.parentNode){ var ap=texte.slice(di); if(ap) frag.appendChild(document.createTextNode(ap)); node.parentNode.replaceChild(frag, node); }
      }catch(e){}
    });
  }catch(e){}
}
// Debounce VITESSE : on ne transforme JAMAIS pendant l'écriture, on attend 600ms de calme
function demanderTransformation(){
  try{
    if(timerTransform) clearTimeout(timerTransform);
    timerTransform=setTimeout(function(){ try{ var z=zoneChat(); if(z) transformerPythonDans(z); }catch(e){} }, 600);
  }catch(e){}
}

// ---------- FLECHE + POINTS DANS LA DISCUSSION ----------
var fleche=null, points=null;
function creerFleche(zone){
  try{
    if(fleche && document.body.contains(fleche)) return fleche;
    fleche=document.createElement("button"); fleche.id="nova-fleche-bas"; fleche.innerHTML=svgFlecheBas(); fleche.setAttribute("aria-label","Aller en bas");
    fleche.addEventListener("click", function(){
      try{
        clicFleche=true; utilisateurEnHaut=false; novaEcrit=false;
        var sc=getScroller();
        // On autorise ce scroll-là, c'est l'utilisateur qui l'a demandé
        setTimeout(function(){ clicFleche=false; }, 800);
        if(sc.isWindow) window.scrollTo({top:document.documentElement.scrollHeight, behavior:"smooth"});
        else sc.el.scrollTo({top:sc.el.scrollHeight, behavior:"smooth"});
        cacherFleche(); cacherPoints();
      }catch(e){ clicFleche=false; }
    });
    var parent=zone.parentElement||document.body;
    try{ var cs=window.getComputedStyle(parent); if(cs.position==="static") parent.style.position="relative"; }catch(e){}
    parent.appendChild(fleche); return fleche;
  }catch(e){ return null; }
}
function montrerFleche(){ try{ var z=zoneChat(); if(!z) return; var f=creerFleche(z); if(f){ f.style.display="flex"; } }catch(e){} }
function cacherFleche(){ try{ if(fleche) fleche.style.display="none"; }catch(e){} }
function creerPoints(zone){
  try{
    if(points && document.body.contains(points)) return points;
    points=document.createElement("div"); points.id="nova-3-points";
    points.innerHTML='<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.2s;"></span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin:0 2px;animation:novaPoint 1s infinite 0.4s;"></span>';
    var parent=zone.parentElement||document.body; parent.appendChild(points); return points;
  }catch(e){ return null; }
}
function montrerPoints(){ try{ var z=zoneChat(); if(!z) return; var p=creerPoints(z); if(p) p.style.display="block"; }catch(e){} }
function cacherPoints(){ try{ if(points) points.style.display="none"; }catch(e){} }

// ---------- CAPE TOTALE : BLOQUE LE FORCAGE DE INDEX.HTML ----------
function boucleGarderPosition(){
  try{
    if(!utilisateurEnHaut || clicFleche){ rafActif=false; return; }
    rafActif=true;
    var sc=getScroller();
    var cur=getScrollTop(sc);
    // Si index.html a forcé, on remet à la position de l'utilisateur, pour chat-box ET window
    if(Math.abs(cur-dernierScrollTop)>2){
      setScrollTop(sc, dernierScrollTop);
    }
    // Aussi bloquer l'autre scroller si les deux scrollent
    try{
      var z=zoneChat();
      if(z && !sc.isWindow && Math.abs(window.scrollY-dernierWindowY)>2 && dernierWindowY!==0) window.scrollTo(0, dernierWindowY);
      if(z && sc.isWindow && Math.abs(z.scrollTop-dernierScrollTop)>2) z.scrollTop=dernierScrollTop;
    }catch(e){}
    rafScroll=requestAnimationFrame(boucleGarderPosition);
  }catch(e){ rafActif=false; }
}
function demarrerBoucle(){
  try{ if(!rafActif){ boucleGarderPosition(); } }catch(e){}
}
function memoriserPosition(){
  try{
    var sc=getScroller();
    dernierScrollTop=getScrollTop(sc);
    dernierWindowY=window.scrollY;
  }catch(e){}
}

// Intercepte scrollTo / scrollIntoView de index.html : si l'utilisateur est en haut, on ignore, sauf si c'est le clic flèche
try{
  var _origScrollTo = Element.prototype.scrollTo;
  Element.prototype.scrollTo = function(){
    try{
      if(utilisateurEnHaut && !clicFleche){
        var z=zoneChat();
        if(z && (this===z || z.contains(this))){ return; }
      }
      return _origScrollTo.apply(this, arguments);
    }catch(e){ try{ return _origScrollTo.apply(this, arguments); }catch(er){} }
  };
  var _origWinScrollTo = window.scrollTo;
  window.scrollTo = function(){
    try{ if(utilisateurEnHaut && !clicFleche){ return; } return _origWinScrollTo.apply(window, arguments); }catch(e){ try{ return _origWinScrollTo.apply(window, arguments); }catch(er){} }
  };
  var _origIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function(){
    try{ if(utilisateurEnHaut && !clicFleche){ return; } return _origIntoView.apply(this, arguments); }catch(e){}
  };
}catch(e){}

function demarrer(){
  try{
    var z=zoneChat();
    if(!z){ setTimeout(demarrer, 500); return; }
    installerStyles(); creerFleche(z); creerPoints(z);
    // 1er passage Python après chargement, pas pendant l'écriture
    demanderTransformation();

    // Détection du geste utilisateur sur TOUS les scrollers possibles
    function onUserScroll(){
      try{
        var enBas=estEnBas();
        var avant=utilisateurEnHaut;
        utilisateurEnHaut=!enBas;
        if(utilisateurEnHaut){
          memoriserPosition();
          demarrerBoucle();
        }
        if(!utilisateurEnHaut && avant){ novaEcrit=false; }
        if(enBas){ cacherFleche(); cacherPoints(); }
        else if(novaEcrit){ montrerFleche(); montrerPoints(); }
      }catch(e){}
    }
    // On écoute chat-box + window + document en capture, pour ne rater aucun scroll
    try{ z.addEventListener("scroll", onUserScroll, {passive:true, capture:true}); }catch(e){}
    try{ window.addEventListener("scroll", onUserScroll, {passive:true, capture:true}); }catch(e){}
    try{ document.addEventListener("scroll", onUserScroll, {passive:true, capture:true}); }catch(e){}
    try{ window.addEventListener("wheel", function(){ try{ setTimeout(onUserScroll, 30); }catch(e){} }, {passive:true}); }catch(e){}
    try{ window.addEventListener("touchmove", function(){ try{ setTimeout(onUserScroll, 30); }catch(e){} }, {passive:true}); }catch(e){}

    // Observer : on ne touche PLUS au DOM pendant l'écriture, on note juste l'heure - c'est ça qui accélère comme Meta AI
    var obs=new MutationObserver(function(){
      try{
        derniereMutation=Date.now();
        var zone=zoneChat(); if(!zone) return;
        if(utilisateurEnHaut){
          novaEcrit=true; montrerFleche(); montrerPoints();
          // On bloque sans toucher au DOM, juste le scroll
          demarrerBoucle();
          if(timerPoints) clearTimeout(timerPoints);
          timerPoints=setTimeout(function(){ cacherPoints(); }, 4000);
        } else {
          novaEcrit=false; cacherFleche(); cacherPoints();
        }
        // Python : seulement après 600ms de calme
        demanderTransformation();
        if(timerFinEcriture) clearTimeout(timerFinEcriture);
        timerFinEcriture=setTimeout(function(){
          try{ novaEcrit=false; var zz=zoneChat(); if(zz) transformerPythonDans(zz); }catch(e){}
        }, 800);
      }catch(e){}
    });
    obs.observe(z, {childList:true, subtree:true, characterData:true});
    // Si index.html remplace chat-box, on ré-observe le nouveau
    try{
      var obsBody=new MutationObserver(function(){
        try{ var nz=zoneChat(); if(nz && !nz.dataset.novaV8Observe){ nz.dataset.novaV8Observe="1"; obs.observe(nz, {childList:true, subtree:true, characterData:true}); } }catch(e){}
      });
      obsBody.observe(document.body, {childList:true, subtree:true});
    }catch(e){}
  }catch(e){}
}
if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", demarrer); } else { demarrer(); }

}catch(e){}
})();
   }
