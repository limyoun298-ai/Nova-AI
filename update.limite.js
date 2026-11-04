/* update.limite.js - NOVA AI - VRAIE LOGIQUE : 5h actif avec forfait / 1h gratuit sans forfait */
(function () {
  "use strict";
  if (window.__novaLimiteLoaded) return;
  window.__novaLimiteLoaded = true;

  /* ================= RÉGLAGES ================= */
  const LIMITE_AVEC_FORFAIT_MS = 5 * 3600000; // 5h de discussion RÉELLE avec forfait
  const LIMITE_SANS_FORFAIT_MS = 1 * 3600000; // 1h gratuite par jour sans forfait
  const RESET_MS = 24 * 3600000;              // réinitialisation auto après 24h
  const FORFAIT_SEC = 7200;                   // 120 min de forfait
  const HISTORY_WINDOW = 60;

  const H = 3600000;

  /* ================= ÉTAT - Compteur qui s'arrête quand on ferme l'app ================= */
  const KEY = "nova_limit_v2"; // v2 = nouvelle logique
  let L = {
    dayStart: 0,          // 1ère ouverture du cycle de 24h
    totalActif: 0,        // temps réel accumulé AVEC forfait (5h)
    sessionStart: 0,      // quand tu as ouvert l'app cette fois-ci (avec forfait)
    freeActif: 0,         // temps réel accumulé SANS forfait (1h)
    freeSessionStart: 0,  // quand tu as ouvert l'app cette fois-ci (sans forfait)
    reason: "",
    ann: ""
  };
  try { L = { ...L, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}
  function saveL() { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} }

  function safe(name, fn) {
    try { fn(); } catch (e) { console.error("update.limite.js [" + name + "] :", e); }
  }

  /* Est-ce que l'utilisateur a du forfait ? */
  function aForfait() {
    // Si plan.used < FORFAIT_SEC, il lui reste du forfait
    try {
      if (typeof plan !== "undefined" && plan && typeof plan.used === "number") {
        return plan.used < FORFAIT_SEC;
      }
    } catch (e) {}
    return false; // par défaut = sans forfait
  }

  /* ================= COMPTEUR ACTIF : tourne seulement quand l'app est ouverte ================= */
  function demarrerCompteur() {
    const now = Date.now();
    if (!L.dayStart) L.dayStart = now;

    if (aForfait()) {
      if (!L.sessionStart) L.sessionStart = now;
    } else {
      // Sans forfait : seulement si données ouvertes
      if (navigator.onLine && !L.freeSessionStart) L.freeSessionStart = now;
    }
    saveL();
  }

  function arreterCompteur() {
    const now = Date.now();
    // Avec forfait
    if (L.sessionStart) {
      L.totalActif += now - L.sessionStart;
      L.sessionStart = 0;
    }
    // Sans forfait
    if (L.freeSessionStart) {
      L.freeActif += now - L.freeSessionStart;
      L.freeSessionStart = 0;
    }
    saveL();
  }

  function getTotalActif() {
    let total = L.totalActif;
    if (L.sessionStart) total += Date.now() - L.sessionStart;
    return total;
  }

  function getFreeActif() {
    let total = L.freeActif;
    if (L.freeSessionStart) total += Date.now() - L.freeSessionStart;
    return total;
  }

  /* Réinitialisation auto après 24h depuis dayStart */
  function verifierResetAuto() {
    if (!L.dayStart) return;
    if (Date.now() - L.dayStart >= RESET_MS) {
      L.dayStart = Date.now();
      L.totalActif = 0;
      L.sessionStart = 0;
      L.freeActif = 0;
      L.freeSessionStart = 0;
      L.reason = "";
      L.ann = "";
      saveL();
      // On redémarre le compteur tout de suite
      demarrerCompteur();
    }
  }

  // Le compteur s'arrête quand tu fermes / mets en arrière-plan, il continue quand tu rouvres
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) arreterCompteur();
    else { verifierResetAuto(); demarrerCompteur(); }
  });
  window.addEventListener("beforeunload", arreterCompteur);
  window.addEventListener("pagehide", arreterCompteur);

  // Au démarrage
  verifierResetAuto();
  demarrerCompteur();
  // On vérifie le reset toutes les minutes
  setInterval(verifierResetAuto, 60000);

  /* ================= A. BORNE SYSTÈME - PAS DE COMPTEUR VISIBLE ================= */
  function lockText(li) {
    return "Nous vous rappelons que vous discutez avec une AI et non une vraie personne.";
  }

  function pushNotice(text, conversationId) {
    const c = conversations.find(x => x.id === conversationId) || currentConversation();
    if (!c) return;
    if (currentConversationId === c.id && currentPage === "chatPage") {
      const old = document.querySelector(".nova-system-notice");
      if (old) old.remove();
      const div = document.createElement("div");
      div.className = "nova-system-notice";
      div.textContent = text;
      const container = document.querySelector("#messages") || document.querySelector(".messages") || document.body;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
  }

  safe("borne-systeme", () => {
    const st = document.createElement("style");
    st.id = "nova-system-css";
    st.textContent = `
      .nova-system-notice{
        margin: 10px auto 12px auto;
        max-width: 88%;
        padding: 10px 16px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 13px;
        line-height: 1.4;
        text-align: center;
        border-radius: 999px;
        opacity: 1;
        position: sticky;
        bottom: 10px;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
    `;
    document.head.appendChild(st);
  });

  /* ================= ÉTAT : full / limited / locked ================= */
  function estBloque() {
    verifierResetAuto();
    if (aForfait()) {
      // AVEC FORFAIT : seule limite = 5h actives
      return getTotalActif() >= LIMITE_AVEC_FORFAIT_MS;
    } else {
      // SANS FORFAIT : 1h gratuite, seulement avec données
      if (!navigator.onLine) return false; // données fermées = on ne bloque pas, on ne compte pas
      return getFreeActif() >= LIMITE_SANS_FORFAIT_MS;
    }
  }

  function lockInfo() {
    if (!estBloque()) return null;
    return { reason: aForfait() ? "daily" : "sans-forfait", until: L.dayStart + RESET_MS };
  }

  safe("planState", () => {
    planState = function () {
      verifierResetAuto();
      if (estBloque()) return "locked";
      if (aForfait()) return "full"; // tout débloqué : images, vidéo, trucs lourds
      return "limited"; // sans forfait : discussion simple seulement
    };

    showRecharge = function () {
      const li = lockInfo();
      if (!li) return;
      showToast("Limite atteinte");
    };
  });

  /* ================= ENVOI BLOQUÉ ================= */
  function blockedSend(opts, li) {
    const input = $("messageInput");
    let text = opts && opts.imagePrompt ? "Génère une image : " + opts.imagePrompt : input.value.trim();
    if (!text) text = "[image]";

    if (currentPage === "homePage") {
      const cur = currentConversation();
      if (!cur || cur.messages.length) createConversation(false);
      showPage("chatPage");
    }
    if (!currentConversation()) createConversation(false);

    const cid = currentConversationId;
    resetInput(); clearPending(); clearReply();

    const um = addUserMessage(text, null, "");
    um.failed = true;
    setStatus(cid, um.id, "");
    // A : à chaque tentative, borne système en bas, jusqu'à reset auto
    pushNotice(lockText(li), cid);
  }

  safe("sendMessage", () => {
    const _send = sendMessage;
    sendMessage = async function (opts) {
      if (sending) return;
      const has = (opts && opts.imagePrompt) || $("messageInput").value.trim() || pendingImage;
      if (!has) return _send(opts);

      // SANS FORFAIT : on bloque les trucs lourds (images) même avant la limite
      if (!aForfait() && opts && opts.imagePrompt) {
        // On laisse passer la discussion, mais pas la génération d'image
        showToast("Génération d'image réservée au forfait");
        return;
      }

      const li = planState() === "locked" ? lockInfo() : null;
      if (li) { blockedSend(opts, li); return; }

      // Le compteur tourne déjà via demarrerCompteur, on s'assure juste qu'il tourne
      demarrerCompteur();
      return _send(opts);
    };
  });

  safe("runTool", () => {
    const _runTool = runTool;
    runTool = function (action) {
      // SANS FORFAIT : outils lourds bloqués, discussion simple seulement
      if (!aForfait()) {
        const out = $("toolResult");
        if (out) {
          out.innerHTML = "";
          const d = document.createElement("div");
          d.className = "nova-system-notice";
          d.textContent = "Outils réservés au forfait. Tu as 1h gratuite de discussion par jour.";
          out.appendChild(d);
        }
        return;
      }
      if (toolBusy) return _runTool(action);
      if (planState() === "locked") {
        const li = lockInfo();
        if (li) {
          const out = $("toolResult");
          out.innerHTML = "";
          const d = document.createElement("div");
          d.className = "nova-system-notice";
          d.textContent = lockText(li);
          out.appendChild(d);
          return;
        }
      }
      demarrerCompteur();
      return _runTool(action);
    };
  });

  /* ================= TICK : vérifie le reset auto ================= */
  safe("tick", () => {
    setInterval(() => {
      try {
        verifierResetAuto();
        // Si données coupées en mode sans forfait, on met en pause
        if (!aForfait() && !navigator.onLine && L.freeSessionStart) {
          L.freeActif += Date.now() - L.freeSessionStart;
          L.freeSessionStart = 0;
          saveL();
        }
        if (!aForfait() && navigator.onLine && !L.freeSessionStart && !document.hidden) {
          L.freeSessionStart = Date.now();
          saveL();
        }
      } catch (e) {}
    }, 1000);
  });

  /* ================= PERSONNALITÉ + CRÉATEUR ================= */
  safe("personnalité", () => {
    const _build = buildSystemPrompt;
    buildSystemPrompt = function (extra) {
      return _build(extra) +
        "\n\nMISE À JOUR DE PERSONNALITÉ (prioritaire sur les règles précédentes concernant le ton et les emojis) :\n" +
        "- Tu es affectueux, chaleureux et bienveillant : tu parles comme un ami proche, un grand frère ou un coach qui croit en la personne.\n" +
        "- Selon le contexte, tu es l'ami complice, le coach qui motive, le prof patient ou le professionnel sérieux.\n" +
        "- Tu peux utiliser des emojis quand c'est naturel, mais pas dans tous les messages (rarement plus de 2 par message). " +
        "Pas d'emoji dans les sujets graves ou très techniques. Ne recopie pas mécaniquement ceux de l'utilisateur.\n" +
        "- Tu restes une IA : ne prétends pas être humain et n'invente pas de vie personnelle.\n\n" +
        "CRÉATEUR : tu as été créé par M-ei Ho, un créateur âgé de 18 ans. " +
        "Si on te demande qui t'a créé, réponds-le simplement et avec fierté. N'invente aucun autre détail sur lui.\n\n" +
        "MÉMOIRE : tu disposes de l'historique de la discussion, retiens-le et appuie-toi dessus. " +
        "Si l'utilisateur te rappelle une information que tu avais oubliée, reprends-la naturellement, sans te justifier.";
    };
  });

  /* ================= MÉMOIRE DE LA DISCUSSION (60 messages + résumé) ================= */
  safe("mémoire", () => {
    buildApiMessages = function (conversation, extra) {
      const all = conversation.messages.filter(m =>
        (m.role === "user" || m.role === "assistant") && !m.failed && (m.text || m.image));
      const history = all.slice(-HISTORY_WINDOW);
      const older = all.slice(0, Math.max(0, all.length - HISTORY_WINDOW));

      let digest = "";
      if (older.length) {
        const lines = [];
        let total = 0;
        for (let k = older.length - 1; k >= 0; k--) {
          const m = older[k];
          const t = String(m.text || "[image]").replace(/\s+/g, " ").slice(0, 160);
          const line = (m.role === "user" ? "Utilisateur : " : "Toi : ") + t;
          if (total + line.length > 5000) break;
          total += line.length;
          lines.unshift(line);
        }
        digest = "MÉMOIRE DE CETTE DISCUSSION (anciens échanges résumés, du plus ancien au plus récent) :\n" + lines.join("\n");
      }

      let lastImg = -1;
      history.forEach((m, i) => { if (m.role === "user" && m.image) lastImg = i; });

      const mapped = history.map((m, i) => {
        const role = m.role === "assistant" ? "assistant" : "user";
        let text = m.text || "";
        if (m.quote && role === "user") {
          text = '[En réponse à ce message de l\'assistant : "' + m.quote + '"]\n' + text;
        }
        if (m.image && role === "user") {
          if (i === lastImg) {
            return {
              role: "user",
              content: [
                { type: "text", text: text || "Analyse cette image et décris ce que tu observes." },
                { type: "image_url", image_url: { url: m.image } }
              ]
            };
          }
          return { role: "user", content: (text ? text + " " : "") + "[image envoyée plus tôt]" };
        }
        return { role, content: text || "[image générée]" };
      });

      const sys = buildSystemPrompt([extra, digest].filter(Boolean).join("\n\n"));
      return [{ role: "system", content: sys }, ...mapped];
    };

    MEMORY_TRIGGER.test = function (t) {
      t = String(t || "");
      if (t.includes("?")) return false;
      if (/m[ée]moris(er|é|ée|és)\b/i.test(t)) return false;
      return /(m[ée]morise|rappelle[- ]toi|souviens[- ]toi)/i.test(t);
    };
  });

  /* ============ B. MODIFIER MESSAGE -> L'AI REFAIT SA RÉPONSE DU DÉBUT ============ */
  async function regenerateReply(m) {
    const cid = currentConversationId;
    const c = conversations.find(x => x.id === cid);
    if (!c) return;
    if (sending) { showToast("Patiente, une réponse est en cours"); return; }
    if (!navigator.onLine) { showToast("Connexion requise pour corriger la réponse"); return; }
    if (planState() === "locked") {
      const li = lockInfo();
      if (li) pushNotice(lockText(li), cid);
      return;
    }
    if (c.messages.indexOf(m) < 0) return;
    if (m.failed) delete m.failed;

    sending = true;
    showToast("Je refais ma réponse...");
    showAIStatus("je refais ma réponse...");
    try {
      let extra = "";
      if (SEARCH_TRIGGER.test(m.text)) {
        try {
          const found = await webSearch(m.text);
          if (found) extra = "Informations trouvées sur le web (peuvent être imparfaites ou datées) :\n" + found +
            "\nCommence ta réponse par « D'après ce que j'ai trouvé... » et reste prudent sur les incertitudes.";
        } catch (e) {}
      }

      const idx = c.messages.indexOf(m);
      const answer = await callNovaAI(buildApiMessages({ messages: c.messages.slice(0, idx + 1) }, extra));
      hideAIStatus();

      const i2 = c.messages.indexOf(m);
      if (i2 < 0) return;
      let j = i2 + 1;
      while (j < c.messages.length && c.messages[j].role !== "user") j++;

      // ON EFFACE COMPLÈTEMENT l'ancienne réponse
      c.messages.splice(i2 + 1, j - (i2 + 1));
      saveData();
      renderMessages();

      // L'AI RECOMMENCE DU DÉBUT À LA FIN
      const atEnd = j >= c.messages.length;
      if (atEnd) {
        await typeAssistantMessage(answer, cid);
      } else {
        c.messages.splice(i2 + 1, 0, { id: uid(), role: "assistant", text: cleanAIText(answer), timestamp: Date.now() });
        saveData(); renderMessages();
      }
    } catch (e) {
      hideAIStatus();
      showToast("Impossible de corriger la réponse");
    } finally {
      sending = false;
      hideAIStatus();
    }
  }

  safe("editMessage", () => {
    editMessage = function (m) {
      showSheet(`
        <div class="sheet-title">Modifier le message</div>
        <textarea class="sheet-textarea" id="editText"></textarea>
        <button class="action-button" id="saveEdit">Enregistrer</button>`);
      $("editText").value = m.text || "";

      $("saveEdit").onclick = () => {
        const nt = $("editText").value.trim();
        if (!nt) { showToast("Message vide"); return; }
        const changed = nt !== (m.text || "");
        m.text = nt;
        saveData();
        renderMessages();
        closeSheet();
        if (changed) regenerateReply(m);
        else showToast("Message modifié");
      };
    };
  });

  /* ================= ZONE DE TEXTE JUSTE AU-DESSUS DU CLAVIER ================= */
  safe("clavier", () => {
    const st = document.createElement("style");
    st.id = "nova-limite-css";
    st.textContent = `
      #composer{padding:6px 10px calc(6px + env(safe-area-inset-bottom)) !important}
      body.nova-kb #composer{padding-bottom:calc(6px + var(--nova-kb,0px)) !important}
      #messageInput{max-height:96px !important}
    `;
    document.head.appendChild(st);

    function updateKb() {
      const vv = window.visualViewport;
      if (!vv) return;
      let kb = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      if (kb < 80) kb = 0;
      document.documentElement.style.setProperty("--nova-kb", kb + "px");
      document.body.classList.toggle("nova-kb", kb > 0);
      if (currentPage === "chatPage" && document.activeElement === $("messageInput")) scrollBottom();
    }

    if (window.visualViewport) {
      visualViewport.addEventListener("resize", updateKb);
      visualViewport.addEventListener("scroll", updateKb);
    }
    window.addEventListener("resize", updateKb);
    document.addEventListener("focusin", () => { [100, 400, 800].forEach(t => setTimeout(updateKb, t)); });
    document.addEventListener("focusout", () => setTimeout(updateKb, 150));
    updateKb();
  });

  console.log("update.limite.js chargé - logique v2 : 5h actif / 1h gratuit");
})();
