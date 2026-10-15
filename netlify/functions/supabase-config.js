export default async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ error: "Konfigurasi Supabase belum lengkap di Netlify." }, { status: 503 });
  }
  return Response.json({ url, key }, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json"
    }
  });
};
