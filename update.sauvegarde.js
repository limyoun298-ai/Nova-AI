/* ==========================================================
   NOVA AI — SAUVEGARDE CLOUD SUPABASE
   Fichier : update.sauvegarde.js
   Version : 1.0
   Rôle : synchroniser les conversations avec Supabase
   ========================================================== */

(() => {
  "use strict";

  try {
    const SUPABASE_URL = "https://ykzfpwsmxlunmntbqzyy.supabase.co";
    const SUPABASE_KEY = "sb_publishable_Ce_uBAfrR_jTE3EyzlGvhg_YgR7bU2V";

    const SESSION_KEY = "nova_cloud_session_v1";
    const STORAGE_KEY = "nova";

    let session = null;
    let syncing = false;
    let lastSnapshot = "";
    let timer = null;

    const log = (...args) =>
      console.log("[NOVA CLOUD]", ...args);

    function readLocal() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      } catch {
        return {};
      }
    }

    function saveSession(value) {
      session = value;
      localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    }

    function readSession() {
      try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      } catch {
        return null;
      }
    }

    async function authRequest(path, body) {
      const response = await fetch(
        SUPABASE_URL + "/auth/v1/" + path,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.message || "Erreur authentification");
      }

      return data;
    }

    async function ensureSession() {
      if (session?.access_token) {
        const expires = session.expires_at
          ? session.expires_at * 1000
          : 0;

        if (expires > Date.now() + 60000) {
          return session;
        }
      }

      session = readSession();

      if (session?.refresh_token) {
        try {
          const refreshed = await authRequest("token?grant_type=refresh_token", {
            refresh_token: session.refresh_token
          });

          saveSession(refreshed);
          return session;
        } catch (error) {
          log("Renouvellement de session impossible.");
        }
      }

      const created = await authRequest("signup", {});
      if (!created.access_token || !created.user?.id) {
        throw new Error("Session anonyme non créée.");
      }

      saveSession(created);
      return session;
    }

    async function dbRequest(path, options = {}) {
      await ensureSession();

      const response = await fetch(
        SUPABASE_URL + "/rest/v1/" + path,
        {
          method: options.method || "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + session.access_token,
            "Content-Type": "application/json",
            Prefer: options.prefer || "return=minimal"
          },
          body: options.body
            ? JSON.stringify(options.body)
            : undefined
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Erreur base de données");
      }

      if (response.status === 204) return null;

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    function getConversations() {
      const state = readLocal();
      return Array.isArray(state.convs) ? state.convs : [];
    }

    function getMessageRows(conversation, ownerId) {
      const messages = Array.isArray(conversation.msgs)
        ? conversation.msgs
        : [];

      return messages.map((message, index) => ({
        id: String(conversation.id) + "_" + index,
        conversation_id: String(conversation.id),
        owner_id: ownerId,
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.text || ""),
        attachments: Array.isArray(message.atts)
          ? message.atts.map(file => ({
              name: file.name || "",
              kind: file.kind || "",
              mime: file.mime || ""
            }))
          : [],
        created_at: new Date().toISOString()
      }));
    }

    async function syncNow() {
      if (syncing || !navigator.onLine) return;

      syncing = true;

      try {
        const current = await ensureSession();
        const state = readLocal();
        const conversations = getConversations();

        if (!conversations.length) return;

        const ownerId = current.user.id;

        const conversationRows = conversations.map(conversation => ({
          id: String(conversation.id),
          owner_id: ownerId,
          title: String(conversation.title || "Nouvelle discussion"),
          archived: !!conversation.archived,
          updated_at: new Date().toISOString()
        }));

        await dbRequest(
          "nova_conversations?on_conflict=id",
          {
            method: "POST",
            prefer: "resolution=merge-duplicates,return=minimal",
            body: conversationRows
          }
        );

        const messageRows = conversations.flatMap(conversation =>
          getMessageRows(conversation, ownerId)
        );

        if (messageRows.length) {
          await dbRequest(
            "nova_messages?on_conflict=id",
            {
              method: "POST",
              prefer: "resolution=merge-duplicates,return=minimal",
              body: messageRows
            }
          );
        }

        lastSnapshot = JSON.stringify(state);
        log("Synchronisation terminée.");
      } catch (error) {
        log("Synchronisation impossible :", error.message);
      } finally {
        syncing = false;
      }
    }

    async function restoreCloud() {
      try {
        const current = await ensureSession();
        const ownerId = current.user.id;

        const conversations = await dbRequest(
          "nova_conversations?select=*&order=updated_at.desc"
        );

        const messages = await dbRequest(
          "nova_messages?select=*&order=created_at.asc"
        );

        if (!Array.isArray(conversations)) return;

        const state = readLocal();
        const localConversations = Array.isArray(state.convs)
          ? state.convs
          : [];

        const restored = conversations.map(cloudConversation => {
          const local = localConversations.find(
            item => String(item.id) === String(cloudConversation.id)
          );

          const cloudMessages = (messages || [])
            .filter(message =>
              String(message.conversation_id) === String(cloudConversation.id)
            )
            .map(message => ({
              role: message.role,
              text: message.content || "",
              atts: []
            }));

          return {
            id: cloudConversation.id,
            title: cloudConversation.title || "Nouvelle discussion",
            archived: !!cloudConversation.archived,
            project: local?.project || null,
            msgs: local && local.msgs?.length > cloudMessages.length
              ? local.msgs
              : cloudMessages
          };
        });

        for (const local of localConversations) {
          if (!restored.some(item => String(item.id) === String(local.id))) {
            restored.push(local);
          }
        }

        state.convs = restored;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        lastSnapshot = JSON.stringify(state);
        log("Restauration terminée.");
      } catch (error) {
        log("Restauration impossible :", error.message);
      }
    }

    function scheduleSync() {
      clearTimeout(timer);
      timer = setTimeout(syncNow, 1500);
    }

    function monitorChanges() {
      setInterval(() => {
        try {
          const snapshot = localStorage.getItem(STORAGE_KEY) || "";

          if (snapshot !== lastSnapshot) {
            scheduleSync();
          }
        } catch (error) {
          log("Surveillance locale indisponible.");
        }
      }, 2000);
    }

    window.addEventListener("online", scheduleSync);

    window.addEventListener("pagehide", () => {
      syncNow();
    });

    window.NOVA_CLOUD = {
      sync: syncNow,
      restore: restoreCloud,
      status: () => ({
        connected: !!session?.access_token,
        syncing
      })
    };

    async function start() {
      await ensureSession();
      await restoreCloud();
      monitorChanges();
      log("Module de sauvegarde activé.");
    }

    start().catch(error => {
      log("Mode local conservé :", error.message);
    });

  } catch (error) {
    console.error("[NOVA CLOUD] Module désactivé :", error);
  }
})();
