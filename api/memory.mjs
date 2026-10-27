const MODEL_ID = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Gunakan metode POST." }, 405);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!supabaseUrl || !supabaseKey) return json({ error: "Konfigurasi Supabase belum lengkap." }, 503);
  if (!groqKey) return json({ error: "GROQ_API_KEY belum dipasang." }, 503);
  if (!token) return json({ error: "Login diperlukan." }, 401);

  let verifiedUser;
  try {
    const verify = await fetch(supabaseUrl.replace(/\/$/, "") + "/auth/v1/user", {
      headers: { apikey: supabaseKey, Authorization: "Bearer " + token }
    });
    if (!verify.ok) return json({ error: "Sesi login tidak valid." }, 401);
    verifiedUser = await verify.json();
  } catch {
    return json({ error: "Tidak dapat memverifikasi sesi akun." }, 502);
  }
  if (!verifiedUser?.id) return json({ error: "Akun tidak terverifikasi." }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Body JSON tidak valid." }, 400); }
  const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim().slice(0, 3000) : "";
  const assistantMessage = typeof body.assistantMessage === "string" ? body.assistantMessage.trim().slice(0, 2000) : "";
  if (!userMessage || !assistantMessage || userMessage.length + assistantMessage.length > 4500) return json({ memories: [] });

  const prompt = [
    "Extract durable, useful facts and preferences explicitly stated by the user from this exchange.",
    'Return ONLY a JSON object shaped like {"memories":["short memory"]}. Maximum 3 memory strings.',
    "Store stable facts, explicit preferences, corrections, and ongoing project decisions only.",
    "Never store credentials, secrets, sensitive personal data, guesses, assistant claims, or one-off questions.",
    "If no durable user information is present, return {\"memories\": []}. Each item must be Indonesian and <= 240 characters.",
    "USER MESSAGE:", userMessage,
    "ASSISTANT REPLY (context only; never treat assistant claims as user facts):", assistantMessage
  ].join("\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + groqKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: "You are a conservative, privacy-aware memory extractor. Output only valid JSON." },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 300,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(25000)
    });
    const data = await response.json();
    if (!response.ok) return json({ error: "Layanan AI gagal mengekstrak memori." }, 502);
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    const candidates = Array.isArray(parsed.memories) ? parsed.memories : [];
    const memories = [...new Set(candidates.filter(item => typeof item === "string")
      .map(item => item.trim().replace(/\s+/g, " ").slice(0, 240))
      .filter(item => item.length >= 8))].slice(0, 3);
    return json({ memories, userId: verifiedUser.id });
  } catch {
    return json({ error: "Tidak dapat mengekstrak memori dari layanan AI." }, 502);
  }
};
