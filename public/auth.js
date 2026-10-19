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
  controls.innerHTML = '<span class="auth-label" id="authLabel">Belum login</span><button class="auth-button" id="authMemory" type="button" title="Simpan memori" hidden>+ Memori</button><button class="auth-button primary" id="authLogin" type="button">Login</button><button class="auth-button" id="authLogout" type="button" hidden>Keluar</button>';
  const topActions = document.querySelector(".top-actions");
  if (topActions) topActions.prepend(controls);

  const label = controls.querySelector("#authLabel");
  const login = controls.querySelector("#authLogin");
  const logout = controls.querySelector("#authLogout");
  const memoryButton = controls.querySelector("#authMemory");
  let db = null;
  let currentUser = null;
  let activeConversationId = null;
  let saveQueue = Promise.resolve();
  let savedMemories = [];
  let lastUserId = null;

  function notify(text) {
    if (typeof window.showToast === "function") window.showToast(text);
    else alert(text);
  }

  async function init() {
    try {
      const configResponse = await fetch("/.netlify/functions/supabase-config", { cache: "no-store" });
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error || "Konfigurasi Supabase gagal dimuat.");
      if (!window.supabase || !window.supabase.createClient) throw new Error("Library Supabase gagal dimuat.");
      db = window.supabase.createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data, error } = await db.auth.getSession();
      if (error) throw error;
      await setUser(data.session?.user || null);
      db.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
    } catch (error) {
      label.textContent = "Auth belum siap";
      login.disabled = true;
      login.title = error.message;
      console.error("Supabase init:", error);
    }
  }

  async function setUser(user) {
    currentUser = user || null;
    const newUserId = currentUser ? currentUser.id : null;
    // Reset percakapan aktif hanya kalau akunnya beneran ganti (login/logout),
    // bukan tiap token refresh atau tab balik fokus.
    if (newUserId !== lastUserId) activeConversationId = null;
    lastUserId = newUserId;
    if (currentUser) {
      label.textContent = currentUser.user_metadata?.full_name || currentUser.email || "Akun aktif";
      login.hidden = true;
      logout.hidden = false;
      memoryButton.hidden = false;
      try {
        const { error } = await db.from("profiles").upsert({
          id: currentUser.id,
          display_name: currentUser.user_metadata?.full_name || currentUser.email || "Pengguna",
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
        if (error) console.warn("Profil belum tersimpan:", error.message);
        const memoryResult = await db.from("memories").select("content").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(20);
        if (memoryResult.error) console.warn("Memori gagal dimuat:", memoryResult.error.message);
        else savedMemories = memoryResult.data.map(item => item.content);
      } catch (e) { console.warn("Profil:", e); }
    } else {
      label.textContent = "Belum login";
      login.hidden = false;
      logout.hidden = true;
      memoryButton.hidden = true;
      savedMemories = [];
    }
    window.dispatchEvent(new CustomEvent("choco:auth-changed", { detail: { user: currentUser } }));
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
    } finally { login.disabled = false; }
  });

  memoryButton.addEventListener("click", async () => {
    if (!currentUser || !db) return notify("Login dulu untuk menyimpan memori.");
    const content = prompt("Memori apa yang ingin Choco AI ingat untuk akun ini?");
    if (!content || !content.trim()) return;
    const clean = content.trim().slice(0, 1500);
    const { error } = await db.from("memories").insert({ user_id: currentUser.id, content: clean });
    if (error) return notify("Memori gagal disimpan: " + error.message);
    savedMemories.unshift(clean);
    savedMemories = savedMemories.slice(0, 20);
    notify("Memori berhasil disimpan.");
  });

  window.chocoGetMemories = () => savedMemories.slice(0, 20);

  window.chocoListConversations = async () => {
    if (!currentUser || !db) return [];
    const { data, error } = await db.from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", currentUser.id)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) {
      console.warn("Daftar obrolan gagal dimuat:", error.message);
      notify("Riwayat obrolan belum bisa dimuat. Periksa policy database.");
      return [];
    }
    return data || [];
  };

  window.chocoOpenConversation = async (id) => {
    if (!currentUser || !db || !id) return null;
    const { data, error } = await db.from("messages")
      .select("role,content")
      .eq("conversation_id", id)
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) {
      console.warn("Pesan gagal dimuat:", error.message);
      return null;
    }
    activeConversationId = id;
    return data || [];
  };

  logout.addEventListener("click", async () => {
    if (!db) return;
    const { error } = await db.auth.signOut();
    if (error) notify("Gagal keluar: " + error.message);
    else notify("Berhasil logout.");
  });

  async function saveLongTermMemories(userMessage, assistantMessage, userId) {
    try {
      const { data } = await db.auth.getSession();
      const token = data?.session?.access_token;
      if (!token || !currentUser || currentUser.id !== userId) return;
      const response = await fetch("/.netlify/functions/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ userMessage, assistantMessage })
      });
      if (!response.ok) return;
      const result = await response.json();
      const candidates = Array.isArray(result.memories) ? result.memories : [];
      const known = new Set(savedMemories.map(value => value.toLowerCase()));
      const rows = candidates.filter(value => typeof value === "string")
        .map(value => value.trim().replace(/\s+/g, " ").slice(0, 240))
        .filter(value => value.length >= 8 && !known.has(value.toLowerCase()))
        .slice(0, 3).map(content => ({ user_id: userId, content }));
      if (!rows.length || !currentUser || currentUser.id !== userId) return;
      const { error } = await db.from("memories").insert(rows);
      if (error) { console.warn("Memori tidak tersimpan:", error.message); return; }
      savedMemories = [...rows.map(row => row.content), ...savedMemories].slice(0, 20);
    } catch (error) {
      console.warn("Memori jangka panjang:", error);
    }
  }

  window.addEventListener("choco:save-message-pair", event => {
    const detail = event.detail || {};
    if (!currentUser || !db || !detail.userMessage || !detail.assistantMessage) return;
    const expectedUserId = currentUser.id;
    void saveLongTermMemories(detail.userMessage, detail.assistantMessage, expectedUserId);
    saveQueue = saveQueue.then(async () => {
      if (!currentUser || currentUser.id !== expectedUserId) return;
      if (!activeConversationId) {
        const { data, error } = await db.from("conversations").insert({
          user_id: expectedUserId,
          title: String(detail.title || detail.userMessage).slice(0, 120)
        }).select("id").single();
        if (error) throw error;
        activeConversationId = data.id;
      }
      const rows = [
        { conversation_id: activeConversationId, user_id: expectedUserId, role: "user", content: detail.userMessage },
        { conversation_id: activeConversationId, user_id: expectedUserId, role: "assistant", content: detail.assistantMessage }
      ];
      const { error } = await db.from("messages").insert(rows);
      if (error) throw error;
      await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConversationId).eq("user_id", currentUser.id);
      window.dispatchEvent(new CustomEvent("choco:conversations-changed"));
    }).catch(error => {
      console.error("Penyimpanan percakapan gagal:", error);
      notify("Jawaban tampil, tetapi belum tersimpan ke akun. Periksa policy database.");
    });
  });

  window.addEventListener("choco:new-chat", () => { activeConversationId = null; });
  window.chocoSupabaseReady = init();
})();
