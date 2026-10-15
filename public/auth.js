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
  controls.innerHTML = '<span class="auth-label" id="authLabel">Belum login</span><button class="auth-button primary" id="authLogin" type="button">Login</button><button class="auth-button" id="authLogout" type="button" hidden>Keluar</button>';
  const topActions = document.querySelector(".top-actions");
  if (topActions) topActions.prepend(controls);

  const label = controls.querySelector("#authLabel");
  const login = controls.querySelector("#authLogin");
  const logout = controls.querySelector("#authLogout");
  let db = null;
  let currentUser = null;
  let activeConversationId = null;
  let saveQueue = Promise.resolve();

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
    activeConversationId = null;
    if (currentUser) {
      label.textContent = currentUser.user_metadata?.full_name || currentUser.email || "Akun aktif";
      login.hidden = true;
      logout.hidden = false;
      try {
        const { error } = await db.from("profiles").upsert({
          id: currentUser.id,
          display_name: currentUser.user_metadata?.full_name || currentUser.email || "Pengguna",
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
        if (error) console.warn("Profil belum tersimpan:", error.message);
      } catch (e) { console.warn("Profil:", e); }
    } else {
      label.textContent = "Belum login";
      login.hidden = false;
      logout.hidden = true;
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

  logout.addEventListener("click", async () => {
    if (!db) return;
    const { error } = await db.auth.signOut();
    if (error) notify("Gagal keluar: " + error.message);
    else notify("Berhasil logout.");
  });

  window.addEventListener("choco:save-message-pair", event => {
    const detail = event.detail || {};
    if (!currentUser || !db || !detail.userMessage || !detail.assistantMessage) return;
    saveQueue = saveQueue.then(async () => {
      if (!activeConversationId) {
        const { data, error } = await db.from("conversations").insert({
          user_id: currentUser.id,
          title: String(detail.title || detail.userMessage).slice(0, 120)
        }).select("id").single();
        if (error) throw error;
        activeConversationId = data.id;
      }
      const rows = [
        { conversation_id: activeConversationId, user_id: currentUser.id, role: "user", content: detail.userMessage },
        { conversation_id: activeConversationId, user_id: currentUser.id, role: "assistant", content: detail.assistantMessage }
      ];
      const { error } = await db.from("messages").insert(rows);
      if (error) throw error;
      await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConversationId).eq("user_id", currentUser.id);
    }).catch(error => {
      console.error("Penyimpanan percakapan gagal:", error);
      notify("Jawaban tampil, tetapi belum tersimpan ke akun. Periksa policy database.");
    });
  });

  window.addEventListener("choco:new-chat", () => { activeConversationId = null; });
  window.chocoSupabaseReady = init();
})();
