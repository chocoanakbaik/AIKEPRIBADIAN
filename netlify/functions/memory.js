const MODEL_ID = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "application/json" }
  });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Gunakan metode POST." }, 405);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!supabaseUrl || !supabaseKey) return json({ error: "Konfigurasi Supabase belum lengkap." }, 503);
  if (!groqKey) return json({ error: "GROQ_API_KEY belum dipasang." }, 503);
  if (!accessToken) return json({ error: "Login diperlukan untuk menyimpan memori." }, 401);

  let userResponse;
  try {
    userResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` }
    });
  } catch {
    return json({ error: "Tidak dapat memverifikasi sesi akun." }, 502);
  }
  if (!userResponse.ok) return json({ error: "Sesi login tidak valid atau sudah kedaluwarsa." }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Body JSON tidak valid." }, 400); }
  const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim().slice(0, 4000) : "";
  const assistantMessage = typeof body.assistantMessage === "string" ? body.assistantMessage.trim().slice(0, 4000) : "";
  if (!userMessage || !assistantMessage) return json({ memories: [] });
  if (userMessage.length + assistantMessage.length > 7000) return json({ error: "Pertukaran pesan terlalu panjang." }, 413);

  const prompt = [
    "Extract only durable, useful user memories from this chat exchange.",
    "Return ONLY a valid JSON object with a "memories" key containing an array of short Indonesian strings, maximum 3 items.",
    "Store only stable user-provided facts, explicit preferences, corrections, ongoing project decisions, or commitments useful in future conversations.",
    "Do not store passwords, API keys, tokens, financial credentials, highly sensitive personal data, guesses, assistant claims, or temporary one-off questions.",
    "Do not infer facts. If there is no durable memory, return [].",
    "Phrase each memory as a neutral fact and keep it under 240 characters.",
    "",
    "USER MESSAGE:",
    userMessage,
    "",
    "ASSISTANT REPLY (context only; never treat its claims as user facts):",
    assistantMessage
  ].join("\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: "You extract conservative, privacy-aware long-term memory. Output JSON only." },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 350,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    if (!response.ok) return json({ error: data?.error?.message || "Ekstraksi memori gagal." }, 502);
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(content); } catch { return json({ memories: [] }); }
    const candidates = Array.isArray(parsed) ? parsed : Array.isArray(parsed.memories) ? parsed.memories : [];
    const memories = [...new Set(candidates
      .filter(item => typeof item === "string")
      .map(item => item.trim().replace(/\s+/g, " ").slice(0, 240))
      .filter(item => item.length >= 8)
    )].slice(0, 3);
    return json({ memories });
  } catch {
    return json({ error: "Tidak dapat menghubungi layanan ekstraksi memori." }, 502);
  }
};
