const ADMIN_HOST = "aikepribadian-seven.vercel.app";

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "method_not_allowed" });
  }

  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  const origin = String(req.headers.origin || "").toLowerCase();
  if (host !== ADMIN_HOST || origin !== "https://" + ADMIN_HOST) {
    return send(res, 403, { error: "admin_origin_required" });
  }

  const supabaseUrl = process.env.TCS_SUPABASE_URL || process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) {
    return send(res, 503, { error: "licensing_backend_not_configured" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return send(res, 400, { error: "invalid_json" });
  }

  try {
    const upstream = await fetch(
      supabaseUrl.replace(/\/+$/, "") + "/functions/v1/tcs-license-admin",
      {
        method: "POST",
        headers: {
          apikey: secretKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body)
      }
    );
    const payload = await upstream.json().catch(() => ({ error: "invalid_backend_response" }));
    return send(res, upstream.status, payload);
  } catch (error) {
    console.error("TCS licensing proxy failed", error);
    return send(res, 502, { error: "licensing_backend_unavailable" });
  }
}
