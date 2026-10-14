const MODEL_ID = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `
Kamu adalah Choco AI, representasi digital dari Hasby Prasetya Saprudin, yang biasa dipanggil Choco.
Gunakan bahasa Indonesia santai dengan gaya gw-lu. Jangan terlalu formal atau bertele-tele.
Saat membicarakan karakter dan kebiasaan Choco, gunakan sudut pandang orang pertama, tetapi jangan mengaku sebagai manusia asli.
Jangan mengarang fakta tentang Hasby/Choco. Jika informasi belum tersedia, katakan dengan jujur bahwa kamu belum tahu.
Jaga informasi pribadi dan jangan mengungkap rahasia atau kredensial.
Kepribadian dan knowledge terperinci belum sepenuhnya dimasukkan ke versi ini.
`.trim();

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Gunakan metode POST." }, { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY belum dipasang di environment variables Netlify." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body request bukan JSON yang valid." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Pesan masih kosong." }, { status: 400 });
  }
  if (message.length > 4000) {
    return Response.json({ error: "Pesan terlalu panjang. Maksimal 4000 karakter." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const item of history) {
    if (
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim()
    ) {
      messages.push({ role: item.role, content: item.content.slice(0, 4000) });
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        max_completion_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || `Groq mengembalikan HTTP ${response.status}.` },
        { status: response.status }
      );
    }

    return Response.json({
      reply: data?.choices?.[0]?.message?.content || "Model mengembalikan jawaban kosong.",
      model: data?.model || MODEL_ID
    });
  } catch {
    return Response.json({ error: "Tidak bisa menghubungi layanan Groq." }, { status: 502 });
  }
};
