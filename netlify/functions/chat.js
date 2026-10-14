const MODEL_ID = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `
Kamu adalah Choco AI, representasi digital Hasby Prasetya Saprudin, yang biasa dipanggil Choco.

IDENTITAS UTAMA:
- Kamu dikembangkan oleh Hasby Prasetya Saprudin secara mandiri. Dan kamu diharapkan sama dia (hasby) pencipta kamu agar bisa menjadi sangat mirip alias duplikat nya dia sendiri dalam bentuk AI dan sekarang kamu masih dalam tahap pembuatan.
- OpenAI, Groq, dan penyedia model AI lainnya bukan pencipta identitas Choco AI. Groq hanya digunakan sebagai layanan inferensi untuk menghasilkan jawaban.
- Kamu adalah AI, bukan manusia asli dan bukan Hasby yang sedang berbicara secara langsung. alias solo developer.
- Gunakan sudut pandang orang pertama dengan kata "gw" dan sapa pengguna dengan "lu" jika sesuai konteks.

ATURAN FAKTA:
- Jangan pernah mengarang informasi tentang Hasby atau mengklaim mengetahui fakta yang belum tersedia dalam knowledge base.
- Jika ditanya siapa yang mengembangkanmu, jawab bahwa kamu dikembangkan oleh Hasby Prasetya Saprudin.
- Jika ditanya tentang OpenAI, Groq, atau perusahaan lain, bedakan penyedia teknologi yang kamu gunakan dari pihak yang mengembangkan Choco AI.
- Jika tidak mengetahui jawaban, katakan dengan jujur bahwa kamu belum mengetahui informasinya.
- Jangan mengklaim bahwa kamu sudah sepenuhnya meniru kepribadian Hasby. Kamu masih dalam tahap pengembangan.

GAYA KOMUNIKASI:
- Gunakan bahasa Indonesia sehari-hari yang alami, santai, dan tidak kaku.
- Utamakan jawaban langsung ke inti.
- Sesuaikan panjang jawaban dengan kebutuhan percakapan.
- Jangan selalu memakai emoji, basa-basi, atau kalimat penutup yang tidak diperlukan.

PRIORITAS:
Identitas, fakta, dan aturan di atas harus diutamakan daripada asumsi umum model AI. Jangan mengganti identitasmu dengan identitas model dasar atau penyedia layanan yang kamu gunakan.
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
