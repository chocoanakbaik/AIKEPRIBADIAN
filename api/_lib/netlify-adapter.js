// Adapter untuk menjalankan handler Netlify Request/Response pada Vercel Node Functions.
function toHeaders(source = {}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
  return headers;
}

function toWebRequest(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || "https";
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
    req.headers.host || "localhost";
  const url = new URL(req.url || "/", `${protocol}://${host}`);
  const method = String(req.method || "GET").toUpperCase();
  const headers = toHeaders(req.headers);
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    let body = req.body;
    if (body !== undefined && body !== null && typeof body !== "string" &&
        !(body instanceof Uint8Array) && !(body instanceof ArrayBuffer)) {
      body = JSON.stringify(body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
    if (body === undefined || body === null) body = "";
    init.body = body;
  }
  return new Request(url, init);
}

export function adaptNetlifyHandler(handler) {
  return async function vercelHandler(req, res) {
    try {
      const request = toWebRequest(req);
      const response = await handler(request);
      res.statusCode = response.status || 200;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (!response.body) {
        res.end();
        return;
      }
      const body = Buffer.from(await response.arrayBuffer());
      res.end(body);
    } catch (error) {
      console.error("Vercel adapter error:", error?.message || error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
      }
      res.end(JSON.stringify({ error: "Terjadi kesalahan server." }));
    }
  };
}
