const SUPABASE_FUNCTION_URL = "https://jzatbvxpclwbkjflkyan.supabase.co/functions/v1/tcs-license";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_CXEBG6c3PXW8DuQTn2IOyw_y9ZQdYBz";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const requestToken = typeof body?.requestToken === "string" ? body.requestToken.trim() : "";
  if (!UUID_RE.test(requestId) || requestToken.length < 20 || requestToken.length > 200) {
    return res.status(400).json({ error: "invalid_request" });
  }

  try {
    const upstream = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_PUBLISHABLE_KEY
      },
      cache: "no-store",
      body: JSON.stringify({ action: "status", requestId, requestToken })
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 404 ? 404 : upstream.status >= 500 ? 503 : 400;
      return res.status(status).json({ error: result.error || "license_verification_failed" });
    }
    if (result.productId !== "tcs-stock-sales-basic" || !["pending", "approved", "rejected", "expired"].includes(result.status)) {
      return res.status(502).json({ error: "unexpected_license_response" });
    }
    return res.status(200).json({
      ok: true,
      requestId: result.requestId,
      productId: result.productId,
      status: result.status,
      expiresAt: result.expiresAt || null
    });
  } catch {
    return res.status(503).json({ error: "license_service_unavailable" });
  }
}
