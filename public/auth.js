(() => {
  const style = document.createElement("style");
  style.textContent = `
    .auth-controls{display:flex;align-items:center;gap:8px;margin-left:8px}
    .auth-button{border:1px solid rgba(135,148,191,.25);border-radius:10px;padding:9px 12px;background:#151b2b;color:#eef2ff;font:inherit;font-size:12px;cursor:pointer}
    .auth-button.primary{background:linear-gradient(115deg,#648bff,#a76cff);border:0}
    .auth-label{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aab4ce;font-size:11px}
    @media(max-width:720px){.auth-label{display:none}.auth-button{padding:8px;font-size:11px}}
  `;
  document.head.appendChild(style);

  const controls = document.createElement("div");
  controls.className = "auth-controls";
  controls.innerHTML = '<span class="auth-label" id="authLabel">Memuat akun…</span><button class="auth-button primary" id="authLogin" type="button">Login Google</button><button class="auth-button" id="authLogout" type="button" hidden>Keluar</button>';
  document.querySelector(".top-actions")?.prepend(controls);

  const label = controls.querySelector("#authLabel");
  const login = controls.querySelector("#authLogin");
  const logout = controls.querySelector("#authLogout");
  let db = null;
  let currentUser = null;
  let activeConversationId = null;
  let saveQueue = Promise.resolve();
  let savedMemories = [];
  let lastUserId = null;
  let authEventVersion = 0;
  let warnedDatabase = false;

  function notify(message) {
    if (typeof window.showToast === "function") window.showToast(message);
    else console.warn(message);
  }

  async function init() {
    try {
      const response = await fetch("/.netlify/functions/supabase-config", { cache: "no-store" });
      const config = await response.json();
      if (!response.ok) throw new Error(config.error || "Konfigurasi Supabase gagal dimuat.");
      if (!window.supabase?.createClient) throw new Error("Library Supabase gagal dimuat.");
      db = window.supabase.createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });

      db.auth.onAuthStateChange((eventType, session) => {
        // Supabase meminta callback auth tidak menjalankan operasi database di dalam callback.
        queueMicrotask(() => { void setUser(session?.user || null, eventType); });
      });
      const { data, error } = await db.auth.getSession();
      if (error) throw error;
      await setUser(data.session?.user || null, "INITIAL_SESSION");
    } catch (error) {
      label.textContent = "Auth belum siap";
      login.disabled = true;
      login.title = error.message;
      console.error("Supabase init:", error);
    }
  }

  async function setUser(user, eventType = "UNKNOWN") {
    const version = ++authEventVersion;
    currentUser = user || null;
    const userId = currentUser?.id || null;
    if (userId !== lastUserId) {
      activeConversationId = null;
      savedMemories = [];
      lastUserId = userId;
    }

    if (!currentUser) {
      label.textContent = "Belum login";
      login.hidden = false;
      login.disabled = !db;
      logout.hidden = true;
      window.dispatchEvent(new CustomEvent("choco:auth-changed", { detail: { user: null, eventType } }));
      return;
    }

    label.textContent = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email || "Akun aktif";
    login.hidden = true;
    logout.hidden = false;

    try {
      const profile = await db.from("profiles").upsert({
        id: userId,
        display_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email || "Pengguna",
        email: currentUser.email || null,
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
      if (profile.error) throw profile.error;

      const result = await db.from("memories").select("id,content,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
      if (result.error) throw result.error;
      if (version !== authEventVersion || currentUser?.id !== userId) return;
      savedMemories = (result.data || []).map(row => row.content);
      window.dispatchEvent(new CustomEvent("choco:memories-updated", { detail: { count: savedMemories.length } }));
    } catch (error) {
      console.error("Pemuatan profil/memori gagal:", error);
      if (!warnedDatabase) {
        notify("Akun berhasil login, tetapi tabel database belum siap atau policy Supabase menolak akses. Riwayat/memori belum bisa disinkronkan.");
        warnedDatabase = true;
      }
    }

    if (version !== authEventVersion || currentUser?.id !== userId) return;
    window.dispatchEvent(new CustomEvent("choco:auth-changed", { detail: { user: currentUser, eventType } }));
  }

  login.addEventListener("click", async () => {
    if (!db) return notify("Koneksi Supabase belum siap.");
    login.disabled = true;
    try {
      const { error } = await db.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      notify("Login Google gagal: " + error.message);
    } finally {
      login.disabled = false;
    }
  });

  logout.addEventListener("click", async () => {
    if (!db) return;
    logout.disabled = true;
    const { error } = await db.auth.signOut();
    logout.disabled = false;
    if (error) notify("Gagal keluar: " + error.message);
    else {
      activeConversationId = null;
      savedMemories = [];
      notify("Berhasil logout.");
    }
  });

  window.chocoGetMemories = () => savedMemories.slice(0, 20);
  window.chocoGetAccessToken = async () => {
    if (!db) return null;
    try {
      const { data, error } = await db.auth.getSession();
      if (error) return null;
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };
  window.chocoIsAuthenticated = () => Boolean(currentUser && db);

  window.chocoListConversations = async () => {
    if (!currentUser || !db) return [];
    const userId = currentUser.id;
    const { data, error } = await db.from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Daftar obrolan gagal dimuat:", error);
      notify("Riwayat gagal dimuat. Pastikan migration database sudah dijalankan.");
      return null;
    }
    return currentUser?.id === userId ? (data || []) : [];
  };

  window.chocoOpenConversation = async (id) => {
    if (!currentUser || !db || !id) return null;
    const userId = currentUser.id;
    const { data, error } = await db.from("messages")
      .select("role,content,created_at,id")
      .eq("conversation_id", id).eq("user_id", userId)
      .order("created_at", { ascending: true }).order("id", { ascending: true });
    if (error) {
      console.error("Pesan gagal dimuat:", error);
      notify("Pesan percakapan gagal dimuat.");
      return null;
    }
    if (currentUser?.id !== userId) return null;
    activeConversationId = id;
    return data || [];
  };

  async function extractMemories(userMessage, assistantMessage, userId) {
    try {
      const { data, error } = await db.auth.getSession();
      if (error || !data.session?.access_token || currentUser?.id !== userId) return;
      const response = await fetch("/.netlify/functions/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token },
        body: JSON.stringify({ userMessage, assistantMessage })
      });
      if (!response.ok) {
        console.warn("Ekstraksi memori gagal:", await response.text());
        return;
      }
      const result = await response.json();
      if (result.userId !== userId || currentUser?.id !== userId) {
        console.warn("Respons memori tidak cocok dengan akun aktif; diabaikan.");
        return;
      }
      const known = new Set(savedMemories.map(item => item.toLocaleLowerCase()));
      const rows = [...new Set((Array.isArray(result.memories) ? result.memories : [])
        .filter(item => typeof item === "string")
        .map(item => item.trim().replace(/\s+/g, " ").slice(0, 240))
        .filter(item => item.length >= 8 && !known.has(item.toLocaleLowerCase())))].slice(0, 3)
        .map(content => ({ user_id: userId, content }));
      if (!rows.length || currentUser?.id !== userId) return;
      const { error: insertError } = await db.from("memories").insert(rows);
      if (insertError) throw insertError;
      savedMemories = [...rows.map(row => row.content), ...savedMemories].slice(0, 30);
      window.dispatchEvent(new CustomEvent("choco:memories-updated", { detail: { count: savedMemories.length } }));
    } catch (error) {
      console.error("Memori jangka panjang gagal disimpan:", error);
    }
  }

  window.chocoSaveMessagePair = async ({ userMessage, assistantMessage, title }) => {
    if (!currentUser || !db) {
      notify("Pesan ini belum tersimpan ke akun. Login dulu agar riwayat tersinkron lintas perangkat.");
      return false;
    }
    const userId = currentUser.id;
    const task = async () => {
      if (currentUser?.id !== userId) throw new Error("Akun berubah sebelum pesan tersimpan.");
      let conversationId = activeConversationId;
      if (!conversationId) {
        const { data, error } = await db.from("conversations").insert({
          user_id: userId,
          title: String(title || userMessage).slice(0, 120)
        }).select("id").single();
        if (error) throw error;
        conversationId = data.id;
        if (currentUser?.id !== userId) throw new Error("Akun berubah saat percakapan dibuat.");
        activeConversationId = conversationId;
      }
      const rows = [
        { conversation_id: conversationId, user_id: userId, role: "user", content: userMessage },
        { conversation_id: conversationId, user_id: userId, role: "assistant", content: assistantMessage }
      ];
      const { error } = await db.from("messages").insert(rows);
      if (error) throw error;
      const { error: updateError } = await db.from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId).eq("user_id", userId);
      if (updateError) throw updateError;
      window.dispatchEvent(new CustomEvent("choco:conversations-changed"));
      await extractMemories(userMessage, assistantMessage, userId);
      return true;
    };
    const pending = saveQueue.then(task, task);
    saveQueue = pending.catch(error => console.error("Queue penyimpanan:", error));
    try {
      await pending;
      return true;
    } catch (error) {
      console.error("Penyimpanan percakapan gagal:", error);
      notify("Pesan gagal tersimpan ke akun: " + (error.message || "periksa tabel dan policy Supabase."));
      return false;
    }
  };

  window.addEventListener("choco:save-message-pair", event => {
    const detail = event.detail || {};
    if (detail.userMessage && detail.assistantMessage) void window.chocoSaveMessagePair(detail);
  });
  window.addEventListener("choco:new-chat", () => { activeConversationId = null; });
  window.chocoSupabaseReady = init();
})();
