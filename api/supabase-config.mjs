export default async function handler(request) {
  if (request.method !== "GET") {
    return Response.json({ error: "Metode tidak diizinkan." }, { status: 405, headers: { "Cache-Control": "no-store" } });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ error: "Konfigurasi Supabase belum lengkap di environment Vercel." }, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Type": "application/json" }
    });
  }

  return Response.json({ url, key }, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json"
    }
  });
}
