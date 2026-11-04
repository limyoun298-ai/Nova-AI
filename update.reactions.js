/* update.reactions.js - NOVA AI - Réactions du message de l'AI - SVG blanc */
(function () {
  "use strict";
  if (window.__novaReactionsLoaded) return;
  window.__novaReactionsLoaded = true;

  const EMOJIS = ["😂", "👀", "😦", "😍", "😇", "😏", "😳", "🥺", "😴", "😎"];

  /* ========== STYLE - TOUT ALIGNÉ ========== */
  const st = document.createElement("style");
  st.id = "nova-reactions-css";
  st.textContent = `
    .nova-reactions{
      display:flex; gap:4px; margin-top:6px; align-items:center;
    }
    .nova-reactions button{
      background:transparent; border:none; width:32px; height:32px;
      border-radius:999px; cursor:pointer; padding:0;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .nova-reactions button svg{
      width:20px; height:20px; fill:none; stroke:#fff; stroke-width:1.8;
      stroke-linecap:round; stroke-linejoin:round;
    }
    .nova-reactions button.active{
      background:rgba(255,255,255,0.25);
    }
    .nova-reactions button.active svg{
      stroke:#fff; fill:rgba(255,255,255,0.3);
    }
    .nova-emoji-picker{
      display:flex; gap:6px; background:#fff; border-radius:999px;
      padding:6px 10px; box-shadow:0 8px 24px rgba(0,0,0,0.2);
      position:absolute; z-index:99; margin-top:-46px;
    }
    .nova-emoji-picker span{
      font-size:22px; cursor:pointer;
    }
    .nova-emoji-picked{
      font-size:18px; margin-top:4px;
    }
  `;
  document.head.appendChild(st);

  /* ========== SVG BLANC ========== */
  const SVG_UP = '<svg viewBox="0 0 24 24"><path d="M7 10v12H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0l4-7a2 2 0 0 1 3.5 1.3L16 10h4a2 2 0 0 1 2 2.2l-1.5 7A2 2 0 0 1 18.5 21H7"/></svg>';
  const SVG_DOWN = '<svg viewBox="0 0 24 24"><path d="M7 14V2H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3zm0 0l4 7a2 2 0 0 0 3.5-1.3L16 14h4a2 2 0 0 0 2-2.2l-1.5-7A2 2 0 0 0 18.5 3H7"/></svg>';
  const SVG_COPY = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const SVG_SHARE = '<svg viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/></svg>';
  const SVG_SPEAKER = '<svg viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  /* ========== CRÉER LES RÉACTIONS ========== */
  function creerReactions(messageEl, messageText) {
    const wrap = document.createElement("div");
    wrap.className = "nova-reactions";

    function makeBtn(svg, onClick) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = svg;
      b.onclick = (e) => { e.stopPropagation(); onClick(b); };
      return b;
    }

    // 1. Pouce en haut
    let upBtn, downBtn;
    upBtn = makeBtn(SVG_UP, (btn) => {
      btn.classList.add("active");
      if (downBtn) downBtn.classList.remove("active");
      showToast("Avis envoyé");
      try { localStorage.setItem("nova_last_like", "up"); } catch (err) {}
    });

    // 2. Pouce en bas
    downBtn = makeBtn(SVG_DOWN, (btn) => {
      btn.classList.add("active");
      if (upBtn) upBtn.classList.remove("active");
      showToast("Avis envoyé");
      try { localStorage.setItem("nova_last_like", "down"); } catch (err) {}
    });

    // 3. Copier
    const copyBtn = makeBtn(SVG_COPY, () => {
      navigator.clipboard.writeText(messageText || "");
      showToast("Copié");
    });

    // 4. Partager
    const shareBtn = makeBtn(SVG_SHARE, () => {
      if (navigator.share) navigator.share({ text: messageText || "" });
      else {
        navigator.clipboard.writeText(messageText || "");
        showToast("Copié pour partager");
      }
    });

    // 5. Haut-parleur - MÊME TAILLE, MÊME ALIGNEMENT QUE LES AUTRES
    const speakerBtn = makeBtn(SVG_SPEAKER, () => {
      if (window.novaSpeak) window.novaSpeak(messageText || "");
      else showToast("Voix en cours d'activation");
    });

    wrap.append(upBtn, downBtn, copyBtn, shareBtn, speakerBtn);
    return wrap;
  }

  /* ========== APPUI LONG = 10 EMOJIS ========== */
  function ajouterAppuiLong(messageEl) {
    let timer = null;
    let picker = null;

    function ouvrirPicker() {
      if (messageEl.querySelector(".nova-emoji-picker")) return;
      picker = document.createElement("div");
      picker.className = "nova-emoji-picker";
      EMOJIS.forEach((em) => {
        const s = document.createElement("span");
        s.textContent = em;
        s.onclick = (e) => {
          e.stopPropagation();
          let old = messageEl.querySelector(".nova-emoji-picked");
          if (!old) {
            old = document.createElement("div");
            old.className = "nova-emoji-picked";
            messageEl.appendChild(old);
          }
          old.textContent = em;
          picker.remove();
          picker = null;
        };
        picker.appendChild(s);
      });
      messageEl.style.position = "relative";
      messageEl.appendChild(picker);
      setTimeout(() => {
        document.addEventListener("click", function closeOnce() {
          if (picker) picker.remove();
          picker = null;
        }, { once: true });
      }, 100);
    }

    messageEl.addEventListener("touchstart", () => { timer = setTimeout(ouvrirPicker, 500); });
    messageEl.addEventListener("touchend", () => clearTimeout(timer));
    messageEl.addEventListener("mousedown", () => { timer = setTimeout(ouvrirPicker, 500); });
    messageEl.addEventListener("mouseup", () => clearTimeout(timer));
  }

  /* ========== RÈGLE A : SEUL LE DERNIER MESSAGE DE NOVA A LES RÉACTIONS ========== */
  function appliquerReactions() {
    const allAi = document.querySelectorAll(".message.assistant, .ai-message, .msg-ai, [data-role='assistant']");
    if (!allAi.length) return;
    allAi.forEach((el, index) => {
      const isLast = index === allAi.length - 1;
      let existing = el.querySelector(".nova-reactions");
      if (!isLast) {
        if (existing) existing.remove();
      } else {
        if (!existing) {
          const text = el.innerText || el.textContent || "";
          const reactions = creerReactions(el, text);
          el.appendChild(reactions);
        }
      }
      if (!el.dataset.novaLong) {
        el.dataset.novaLong = "1";
        ajouterAppuiLong(el);
      }
    });
  }

  const observer = new MutationObserver(() => appliquerReactions());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(appliquerReactions, 800);
  setInterval(appliquerReactions, 1500);

  console.log("update.reactions.js chargé - SVG blanc + aligné + 10 emojis");
})();
