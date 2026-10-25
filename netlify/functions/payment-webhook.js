// Webhook pembayaran untuk Midtrans Snap/Core API.
// Webhook tidak pernah mempercayai userId dari metadata tanpa verifikasi signature transaksi.
const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

// Menghasilkan respons JSON tanpa membocorkan kredensial atau detail internal.
function respond(statusCode, payload) {
  return new Response(JSON.stringify(payload), { status: statusCode, headers: HEADERS });
}

// Bandingkan signature sebagai string tetap-panjang untuk mengurangi kebocoran waktu perbandingan.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Midtrans signature_key = SHA512(order_id + status_code + gross_amount + server_key).
async function sha512Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-512", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

// Supabase service-role hanya berada di lingkungan server.
async function supabase(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Konfigurasi database server belum lengkap.");
  const response = await fetch(base.replace(/\/$/, "") + "/rest/v1/" + path, {
    ...options,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error("Operasi database gagal (" + response.status + "): " + body.slice(0, 250));
  return body ? JSON.parse(body) : null;
}

export default async (request) => {
  if (request.method !== "POST") return respond(405, { error: "Metode tidak diizinkan." });
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return respond(503, { error: "Webhook pembayaran belum dikonfigurasi." });
    let event;
    try { event = await request.json(); } catch { return respond(400, { error: "Payload JSON tidak valid." }); }

    // Validasi signature sebelum membaca metadata atau mengubah langganan.
    const expected = await sha512Hex(String(event.order_id || "") + String(event.status_code || "") + String(event.gross_amount || "") + serverKey);
    if (!safeEqual(expected, String(event.signature_key || "").toLowerCase())) return respond(401, { error: "Signature pembayaran tidak valid." });

    // Hanya transaksi settlement atau capture yang sukses dan bukan fraud yang diproses.
    const paid = event.transaction_status === "settlement" ||
      (event.transaction_status === "capture" && event.fraud_status === "accept");
    if (!paid) return respond(200, { received: true, ignored: true });

    // Order ID harus memuat UUID user secara eksplisit: choco_<user-uuid>_<unique-order>.
    const orderId = String(event.order_id || "");
    const match = orderId.match(/^choco_([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})_[A-Za-z0-9-]{6,80}$/i);
    if (!match) return respond(400, { error: "Format order_id tidak valid. Gunakan choco_<user-uuid>_<order-unik>." });
    const userId = match[1];

    // Jangan mengaktifkan premium jika jumlah pembayaran tidak memenuhi harga yang ditetapkan.
    const expectedAmount = Number(process.env.PREMIUM_PRICE_IDR || 0);
    const paidAmount = Number(event.gross_amount);
    if (!expectedAmount || !Number.isFinite(paidAmount) || paidAmount < expectedAmount) return respond(400, { error: "Nominal pembayaran tidak memenuhi harga premium yang dikonfigurasi." });

    // Catat order agar webhook yang dikirim ulang tidak menambah masa aktif berkali-kali.
    const orders = await supabase("payment_events?order_id=eq." + encodeURIComponent(orderId) + "&select=order_id&limit=1");
    if (orders?.length) return respond(200, { received: true, duplicate: true });

    // Kunci order_id dengan unique constraint di database; penambahan masa aktif dilakukan satu kali.
    await supabase("payment_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ order_id: orderId, user_id: userId, gross_amount: paidAmount, transaction_status: event.transaction_status })
    });

    // Tambahkan 30 hari dari tanggal expired mendatang, atau dari sekarang jika sudah free/kedaluwarsa.
    const rows = await supabase("user_subscriptions?user_id=eq." + encodeURIComponent(userId) + "&select=user_id,status,expires_at&limit=1");
    const current = rows?.[0];
    const now = Date.now();
    const previousExpiry = current?.status === "premium" && current.expires_at && new Date(current.expires_at).getTime() > now
      ? new Date(current.expires_at).getTime()
      : now;
    const expiresAt = new Date(previousExpiry + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (current) {
      await supabase("user_subscriptions?user_id=eq." + encodeURIComponent(userId), {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "premium", expires_at: expiresAt, updated_at: new Date().toISOString() })
      });
    } else {
      await supabase("user_subscriptions", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: userId, status: "premium", expires_at: expiresAt })
      });
    }
    return respond(200, { received: true, premiumActivated: true, expiresAt });
  } catch (error) {
    console.error("payment-webhook error:", error.message);
    return respond(500, { error: "Webhook gagal diproses. Provider dapat mengirim ulang notifikasi." });
  }
};
