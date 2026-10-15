export default async () => {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return Response.json(
      { error: "Konfigurasi Supabase belum lengkap di environment variables Netlify." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(
    { url, publishableKey },
    { headers: { "Cache-Control": "no-store" } }
  );
};
