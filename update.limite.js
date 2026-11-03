/* update.limite.js - NOVA AI - Limites, personnalité, mémoire, clavier, modification de message */
(function () {
  "use strict";
  if (window.__novaLimiteLoaded) return;
  window.__novaLimiteLoaded = true;

  /* ================= RÉGLAGES (modifie ici) ================= */
  const DAILY_LIMIT_HOURS = 5;      // limite de discussion : entre 5 et 8
  const BASIC_HOURS = 1;            // durée du mode basique (sans forfait)
  const OFFLINE_FREE_HOURS = 1;     // heure gratuite sans connexion
  const RESET_HOURS = 24;           // attente avant réinitialisation
  const FORFAIT_SEC = 7200;         // 120 min, comme dans index.html
  const HISTORY_WINDOW = 60;        // messages envoyés en entier à l'IA

  const H = 3600000;
  const DAILY_MS = DAILY_LIMIT_HOURS * H;
  const BASIC_MS = BASIC_HOURS * H;
  const FREE_SEC = OFFLINE_FREE_HOURS * 3600;
  const RESET_MS = RESET_HOURS * H;

  /* ================= ÉTAT ================= */
  const KEY = "nova_limit_v1";
  let L = { dayStart: 0, ann: "", freeUsed: 0, freeStart: 0, reason: "" };
  try { L = { ...L, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}
  function saveL() { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) {} }

  function safe(name, fn) {
    try { fn(); } catch (e) { console.error("update.limite.js [" + name + "] :", e); }
  }

  function fmt(ms) {
    const total = Math.max(1, Math.ceil(ms / 60000));
    const h = Math.floor(total / 60), m = total % 60;
    return h ? h + " h " + (m ? m + " min" : "") : m + " min";
  }

  /* Limite de discussion : démarre au premier message, coupe après DAILY_LIMIT_HOURS,
     puis se réinitialise RESET_HOURS après la coupure */
  function dailyUntil() {
    if (!L.dayStart) return 0;
    const now = Date.now();
    const end = L.dayStart + DAILY_MS;
    const unlock = end + RESET_MS;
    if (now >= unlock) { L.dayStart = 0; L.ann = ""; saveL(); return 0; }
    return now >= end ? unlock : 0;
  }

  function lockInfo() {
    const d = dailyUntil();
    if (d) return { reason: "daily", until: d };
    if (plan.lockUntil && Date.now() < plan.lockUntil) {
      return { reason: L.reason || "basic", until: plan.lockUntil };
    }
    return null;
  }

  function lockText(li) {
    const t = fmt(li.until - Date.now());
    const rappel = "Nous vous rappelons que vous discutez avec une AI et non une vraie personne.";
    let head;
    if (li.reason === "daily") head = "⏳ La limite d'utilisation est atteinte. NOVA AI pourra de nouveau répondre dans " + t + ".";
    else if (li.reason === "offline") head = "⏳ L'heure gratuite sans connexion est terminée. Retour possible dans " + t + ".";
    else head = "⏳ Le mode basique (" + BASIC_HOURS + " h sans forfait) est terminé. Retour possible dans " + t + ".";
    return head + "\n\n" + rappel;
  }

  /* Message de l'AI affiché dans la discussion (jamais envoyé à l'IA : failed:true) */
  function pushNotice(text, conversationId) {
    const c = conversations.find(x => x.id === conversationId) || currentConversation();
    if (!c) return;
    const m = { id: uid(), role: "assistant", text, timestamp: Date.now(), failed: true, notice: true };
    c.messages.push(m);
    saveData();
    if (currentConversationId === c.id && currentPage === "chatPage") renderMessage(m);
  }

  /* ================= 1. ÉTATS DU FORFAIT : full / limited (basique) / locked ================= */
  safe("planState", () => {
    planState = function () {
      const now = Date.now();
      if (dailyUntil()) return "locked";

      if (plan.lockUntil) {
        if (now >= plan.lockUntil) {
          plan = { used: 0, limitedStart: 0, lockUntil: 0 };
          L.freeUsed = 0; L.freeStart = 0; L.reason = "";
          planSave(); saveL();
        } else return "locked";
      }

      if (L.freeUsed >= FREE_SEC) {
        plan.lockUntil = now + RESET_MS;
        L.reason = "offline";
        planSave(); saveL();
        return "locked";
      }

      if (plan.used >= FORFAIT_SEC) {
        if (!plan.limitedStart) { plan.limitedStart = now; planSave(); }
        if (now - plan.limitedStart >= BASIC_MS) {
          plan.lockUntil = now + RESET_MS;
          L.reason = "basic";
          planSave(); saveL();
          return "locked";
        }
        return "limited";
      }
      return "full";
    };

    showRecharge = function () {
      const li = lockInfo();
      if (!li) return;
      showToast((li.reason === "daily" ? "Limite atteinte" : "Mode basique terminé") + " · retour dans " + fmt(li.until - Date.now()));
    };
  });

  /* ================= 2. ENVOI BLOQUÉ : message dans la discussion ================= */
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
    um.failed = true;               // exclu de l'historique envoyé à l'IA
    setStatus(cid, um.id, "");      // retire "Envoi..." et enregistre
    pushNotice(lockText(li), cid);
  }

  safe("sendMessage", () => {
    const _send = sendMessage;
    sendMessage = async function (opts) {
      if (sending) return;
      const has = (opts && opts.imagePrompt) || $("messageInput").value.trim() || pendingImage;
      if (!has) return _send(opts);

      const li = planState() === "locked" ? lockInfo() : null;
      if (li) { blockedSend(opts, li); return; }

      if (!L.dayStart) { L.dayStart = Date.now(); L.ann = ""; saveL(); }
      return _send(opts);
    };
  });

  safe("runTool", () => {
    const _runTool = runTool;
    runTool = function (action) {
      if (!toolBusy && $("toolInput").value.trim() && planState() === "locked") {
        const li = lockInfo();
        if (li) {
          const out = $("toolResult");
          out.innerHTML = "";
          const d = document.createElement("div");
          d.className = "info-card";
          d.style.whiteSpace = "pre-wrap";
          d.textContent = lockText(li);
          out.appendChild(d);
          return;
        }
      }
      if (!L.dayStart && !toolBusy) { L.dayStart = Date.now(); saveL(); }
      return _runTool(action);
    };
  });

  /* ================= 3. COMPTEUR INVISIBLE (hors connexion) + ANNONCE ================= */
  safe("tick", () => {
    let n = 0;
    setInterval(() => {
      try {
        n++;
        const now = Date.now();

        if (!navigator.onLine && !document.hidden && planState() !== "locked") {
          if (!L.freeStart) L.freeStart = now;
          if (now - L.freeStart >= RESET_MS) { L.freeUsed = 0; L.freeStart = now; }
          L.freeUsed++;
          if (L.freeUsed % 15 === 0) saveL();
          planState();
        }

        if (n % 20 === 0) {
          const li = planState() === "locked" ? lockInfo() : null;
          if (li && currentPage === "chatPage") {
            const key = li.reason + ":" + li.until;
            const c = currentConversation();
            if (L.ann !== key && c && c.messages.length) {
              L.ann = key; saveL();
              pushNotice(lockText(li), c.id);
            }
          }
        }
      } catch (e) {}
    }, 1000);
  });

  /* ================= 4. PERSONNALITÉ + CRÉATEUR ================= */
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

  /* ================= 5. MÉMOIRE DE LA DISCUSSION (60 messages + résumé des anciens) ================= */
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

    /* "Tu as mémorisé quoi ?" ne doit plus enregistrer quelque chose */
    MEMORY_TRIGGER.test = function (t) {
      t = String(t || "");
      if (t.includes("?")) return false;
      if (/m[ée]moris(er|é|ée|és)\b/i.test(t)) return false;
      return /(m[ée]morise|rappelle[- ]toi|souviens[- ]toi)/i.test(t);
    };
  });

  /* ================= 6. MODIFIER UN MESSAGE -> LA RÉPONSE DE L'AI EST REFAITE ================= */
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
    showToast("Je corrige ma réponse...");
    showAIStatus("je corrige ma réponse...");
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
      const atEnd = j >= c.messages.length;

      c.messages.splice(i2 + 1, j - (i2 + 1));   // retire l'ancienne réponse

      if (atEnd) {
        saveData(); renderMessages();
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

  /* ================= 7. ZONE DE TEXTE JUSTE AU-DESSUS DU CLAVIER ================= */
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

  console.log("update.limite.js chargé");
})();
