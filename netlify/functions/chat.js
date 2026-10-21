const WORKER_URL = process.env.CHOCO_AI_WORKER_URL || "https://choco-ai.hasbyprasetya09.workers.dev";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Gunakan metode POST." }, { status: 405 });
  }

  const proxySecret = process.env.CHOCO_WORKER_PROXY_SECRET;
  if (!proxySecret) {
    return Response.json(
      { error: "Backend Cloudflare belum dikonfigurasi. Secret proxy Netlify belum tersedia." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.text();
    if (!body || body.length > 100_000) {
      return Response.json({ error: "Body request kosong atau terlalu besar." }, { status: 400 });
    }
    JSON.parse(body);
  } catch {
    return Response.json({ error: "Body request bukan JSON yang valid." }, { status: 400 });
  }

  const clientIp = request.headers.get("x-nf-client-connection-ip") || "";
  try {
    const upstream = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Choco-Proxy-Secret": proxySecret,
        ...(clientIp ? { "X-Choco-Client-IP": clientIp } : {})
      },
      body
    });

    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return Response.json(
      { error: "Backend Cloudflare belum bisa dihubungi. Periksa deployment Worker." },
      { status: 502 }
    );
  }
};
