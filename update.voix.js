/* update.voix.js - NOVA AI - Voix Femme / Homme + Barre en haut - 100% SVG */
(function () {
  "use strict";
  if (window.__novaVoixLoaded) return;
  window.__novaVoixLoaded = true;

  function toast(msg){
    if (window.showToast) return window.showToast(msg);
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:999px;z-index:10000;font-size:13px;";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 2000);
  }

  /* ========== SVG BLANC ========== */
  const SVG_BACK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
  const SVG_MIC = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 19v3"/></svg>';
  const SVG_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  const SVG_PAUSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  const SVG_PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#000"><path d="M7 4l13 8-13 8z"/></svg>';
  const SVG_STOP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  /* ========== STYLE ========== */
  const st = document.createElement("style");
  st.id = "nova-voix-css";
  st.textContent = `
    .nova-voice-page{
      position:fixed; inset:0; z-index:9999;
      background:#0f0f0f; color:#fff;
      display:flex; flex-direction:column;
      padding:20px; font-family:inherit;
    }
    .nova-voice-top{
      display:flex; align-items:center; gap:12px; margin-bottom:24px;
    }
    .nova-voice-back{
      width:38px; height:38px; border-radius:999px; border:none;
      background:rgba(255,255,255,0.15); color:#fff;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
    }
    .nova-voice-title{ font-size:20px; font-weight:700; }
    .nova-voice-sub{ font-size:13px; color:#aaa; margin-bottom:18px; }
    .nova-voice-opt{
      display:flex; align-items:center; justify-content:space-between;
      background:#1e1e1e; border:2px solid transparent;
      border-radius:18px; padding:16px; margin-bottom:12px; cursor:pointer;
    }
    .nova-voice-opt.active{ border-color:#7b61ff; background:#2a2a2a; }
    .nova-voice-left{ display:flex; align-items:center; gap:14px; }
    .nova-voice-icon{
      width:44px; height:44px; border-radius:999px; background:rgba(255,255,255,0.12);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .nova-voice-opt b{ font-size:16px; display:block; }
    .nova-voice-opt span{ font-size:12px; color:#aaa; }
    .nova-voice-check{
      width:26px; height:26px; border-radius:999px;
      background:#7b61ff; color:#fff; display:flex;
      align-items:center; justify-content:center; flex-shrink:0;
    }
    .nova-speak-bar{
      position:fixed; top:10px; left:50%; transform:translateX(-50%);
      z-index:9998; background:#1e1e1e; color:#fff;
      border-radius:999px; padding:8px 10px 8px 14px;
      display:flex; align-items:center; gap:10px;
      box-shadow:0 8px 24px rgba(0,0,0,0.35);
      font-size:13px; max-width:92%;
    }
    .nova-speak-dot{
      width:8px; height:8px; border-radius:999px; background:#ff3b30;
      animation:novaBlink 1s infinite; flex-shrink:0;
    }
    @keyframes novaBlink{ 0%,100%{opacity:1} 50%{opacity:0.3} }
    .nova-speak-bar button{
      border:none; cursor:pointer; border-radius:999px;
      width:32px; height:32px; display:flex;
      align-items:center; justify-content:center;
      background:#fff; color:#000; flex-shrink:0;
    }
    .nova-speak-bar .nova-stop{ background:rgba(255,255,255,0.2); color:#fff; }
  `;
  document.head.appendChild(st);

  /* ========== MÉMOIRE VOIX - Dans NOVA AI ========== */
  function getVoix() {
    try { return localStorage.getItem("nova_voice") || null; } catch(e){ return null; }
  }
  function setVoix(v) {
    try { localStorage.setItem("nova_voice", v); } catch(e){}
  }

  /* ========== A. PAGE CHOIX VOIX ========== */
  function ouvrirPageVoix() {
    if (document.querySelector(".nova-voice-page")) return;
    arreterVoix();

    const page = document.createElement("div");
    page.className = "nova-voice-page";
    const actuelle = getVoix() || "femme";

    page.innerHTML = `
      <div class="nova-voice-top">
        <button class="nova-voice-back">${SVG_BACK}</button>
        <div class="nova-voice-title">Voix de NOVA</div>
      </div>
      <div class="nova-voice-sub">Choisis la voix que NOVA utilisera pour te parler. C'est enregistré directement.</div>
      <div class="nova-voice-opt ${actuelle === 'femme' ? 'active' : ''}" data-voice="femme">
        <div class="nova-voice-left">
          <div class="nova-voice-icon">${SVG_MIC}</div>
          <div><b>Voix Femme</b><span>Douce, claire, comme une amie</span></div>
        </div>
        <div class="nova-voice-check" style="display:${actuelle === 'femme' ? 'flex' : 'none'}">${SVG_CHECK}</div>
      </div>
      <div class="nova-voice-opt ${actuelle === 'homme' ? 'active' : ''}" data-voice="homme">
        <div class="nova-voice-left">
          <div class="nova-voice-icon">${SVG_MIC}</div>
          <div><b>Voix Homme</b><span>Calme, posé, comme un grand frère</span></div>
        </div>
        <div class="nova-voice-check" style="display:${actuelle === 'homme' ? 'flex' : 'none'}">${SVG_CHECK}</div>
      </div>
    `;

    page.querySelector(".nova-voice-back").onclick = () => page.remove();

    page.querySelectorAll(".nova-voice-opt").forEach(opt => {
      opt.onclick = () => {
        const v = opt.dataset.voice;
        setVoix(v);
        page.querySelectorAll(".nova-voice-opt").forEach(o => {
          const isActive = o.dataset.voice === v;
          o.classList.toggle("active", isActive);
          o.querySelector(".nova-voice-check").style.display = isActive ? "flex" : "none";
        });
        toast(v === "femme" ? "Voix Femme enregistrée" : "Voix Homme enregistrée");
        setTimeout(() => parler("Bonjour, c'est moi NOVA", true), 400);
        setTimeout(() => page.remove(), 1000);
      };
    });

    document.body.appendChild(page);
  }

  window.novaOpenVoicePage = ouvrirPageVoix;
  window.novaChangeVoice = ouvrirPageVoix;

  /* ========== B. BARRE EN HAUT + MINUTEUR + PAUSE ========== */
  let bar = null;
  let timerEl = null;
  let pauseBtn = null;
  let timerInterval = null;
  let secondes = 0;
  let enPause = false;

  function creerBarre() {
    if (bar) return;
    bar = document.createElement("div");
    bar.className = "nova-speak-bar";
    bar.innerHTML = `
      <div class="nova-speak-dot"></div>
      <span>NOVA parle...</span>
      <b class="nova-timer">00:00</b>
      <button class="nova-pause">${SVG_PAUSE}</button>
      <button class="nova-stop">${SVG_STOP}</button>
    `;
    timerEl = bar.querySelector(".nova-timer");
    pauseBtn = bar.querySelector(".nova-pause");
    pauseBtn.onclick = () => {
      if (!window.speechSynthesis) return;
      if (enPause) {
        window.speechSynthesis.resume();
        pauseBtn.innerHTML = SVG_PAUSE;
        enPause = false;
      } else {
        window.speechSynthesis.pause();
        pauseBtn.innerHTML = SVG_PLAY;
        enPause = true;
      }
    };
    bar.querySelector(".nova-stop").onclick = () => arreterVoix();
    document.body.appendChild(bar);
  }

  function demarrerMinuteur() {
    secondes = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (enPause) return;
      secondes++;
      const m = String(Math.floor(secondes / 60)).padStart(2, "0");
      const s = String(secondes % 60).padStart(2, "0");
      if (timerEl) timerEl.textContent = m + ":" + s;
    }, 1000);
  }

  function arreterVoix() {
    try { window.speechSynthesis.cancel(); } catch(e){}
    clearInterval(timerInterval);
    enPause = false;
    if (bar) { bar.remove(); bar = null; }
  }

  /* ========== PARLER ========== */
  function choisirVoixSysteme(veuxFemme) {
    const voix = window.speechSynthesis.getVoices() || [];
    if (!voix.length) return null;
    const fr = voix.filter(v => v.lang.toLowerCase().startsWith("fr"));
    const liste = fr.length ? fr : voix;
    if (veuxFemme) {
      return liste.find(v => /female|femme|marie|amelie|google français/i.test(v.name)) || liste[0];
    } else {
      return liste.find(v => /male|homme|thomas|paul|daniel/i.test(v.name)) || liste[1] || liste[0];
    }
  }

  function parler(texte, test = false) {
    if (!texte) return;
    if (!("speechSynthesis" in window)) { toast("Voix non disponible sur ce téléphone"); return; }
    arreterVoix();
    if (!test && !getVoix()) { ouvrirPageVoix(); return; }

    const veuxFemme = (getVoix() || "femme") === "femme";
    const utterance = new SpeechSynthesisUtterance(texte);
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    utterance.pitch = veuxFemme ? 1.1 : 0.9;
    const voix = choisirVoixSysteme(veuxFemme);
    if (voix) utterance.voice = voix;
    utterance.onend = () => arreterVoix();
    utterance.onerror = () => arreterVoix();
    creerBarre();
    demarrerMinuteur();
    window.speechSynthesis.speak(utterance);
  }

  window.novaSpeak = (texte) => {
    if (!getVoix()) {
      ouvrirPageVoix();
    } else {
      parler(texte);
    }
  };

  console.log("update.voix.js chargé - SVG + Voix Femme/Homme + Barre en haut");
})();
