# Konfigurasi SaaS Choco AI (Netlify + Supabase + Groq)

Dokumen ini menjelaskan konfigurasi backend baru tanpa framework frontend berat.

## 1. Jalankan SQL

1. Buka Supabase Dashboard milik proyek Choco AI.
2. Buka SQL Editor.
3. Jalankan seluruh isi `supabase/setup.sql`.
4. Pastikan tabel `chat_history`, `user_subscriptions`, dan `payment_events` berhasil dibuat.

Tabel lama `profiles`, `conversations`, `messages`, dan `memories` tetap dipakai oleh UI yang sudah ada. Endpoint baru menyimpan salinan percakapan di `chat_history`.

## 2. Variabel lingkungan Netlify

Atur nilai berikut di Site configuration → Environment variables. Jangan menaruh nilai rahasia di JavaScript frontend.

| Variabel | Kegunaan |
| --- | --- |
| `GROQ_API_KEY` | API key Groq untuk inference |
| `GROQ_MODEL` | Model Groq yang tersedia untuk akun, contoh `llama-3.3-70b-versatile` |
| `SUPABASE_URL` | URL proyek Supabase |
| `SUPABASE_ANON_KEY` | Public anon key untuk validasi sesi Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Rahasia server untuk operasi tabel subscription dan riwayat |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans untuk memverifikasi signature webhook |
| `PREMIUM_PRICE_IDR` | Harga minimum Premium dalam rupiah, tanpa pemisah ribuan |
| `CHOCO_ALLOWED_ORIGIN` | Domain frontend, misalnya `https://choco-ai-platform.netlify.app` |

Gunakan key server hanya di environment Netlify. Jika service role key pernah masuk ke repository publik, segera rotasi di Supabase.

## 3. Magic Link / Email OTP

1. Di Supabase Dashboard, buka Authentication → URL Configuration.
2. Set Site URL ke domain Choco AI.
3. Tambahkan domain Netlify dan URL preview yang benar-benar digunakan ke Redirect URLs.
4. Di Authentication → Providers, pastikan Email aktif.
5. Atur SMTP/email delivery dan batas pengiriman sesuai kebutuhan. Pengiriman email bawaan Supabase dapat memiliki batas rendah; produksi SaaS mungkin memerlukan SMTP sendiri.

Frontend kini memakai `signInWithOtp` dan tidak meminta Google OAuth. Supabase akan mengirim link login atau OTP sesuai template email dan konfigurasi proyek.

## 4. Chat dan langganan

- Frontend memanggil `/.netlify/functions/tanya-ai`.
- Fungsi memverifikasi access token ke Supabase Auth dan mengambil riwayat dari database, bukan mempercayai user ID dari browser.
- Maksimal 10 pesan terdahulu dimasukkan ke konteks Groq.
- Setiap request mengecek `expires_at`; langganan premium yang kedaluwarsa diturunkan ke `free`.
- `subscriptionExpired: true` membuat frontend menampilkan notifikasi kedaluwarsa.
- Tabel baru tidak dapat dibaca/ditulis langsung oleh role anon atau authenticated; operasi dilakukan lewat service role di server.

## 5. Webhook Midtrans

Endpoint: `POST /.netlify/functions/payment-webhook`.

Webhook memverifikasi `signature_key` Midtrans, memproses transaksi `settlement` atau `capture` yang diterima, dan memerlukan nominal setidaknya sebesar `PREMIUM_PRICE_IDR`. Format `order_id` yang didukung:

`choco_<UUID_USER>_<ID_ORDER_UNIK>`

Contoh format (gunakan UUID user dan ID unik sungguhan saat membuat transaksi): `choco_123e4567-e89b-42d3-a456-426614174000_orderA12345`.

Aktivasi menggunakan RPC SQL atomik agar pengiriman webhook berulang tidak menambahkan 30 hari berkali-kali. Konfigurasikan URL webhook ini di dashboard Midtrans. Gunakan sandbox untuk uji coba sebelum transaksi nyata.

Sociabuzz tidak diperlakukan sebagai Midtrans: jangan arahkan webhook provider lain ke endpoint ini kecuali signature dan payload provider tersebut sudah diimplementasikan serta diverifikasi secara terpisah.

## 6. Sebelum menerima pembayaran sungguhan

- Pastikan seluruh environment variables terisi.
- Jalankan SQL setup.
- Uji email login, chat, pemulihan riwayat setelah refresh, dan expiry dengan data uji.
- Uji webhook Midtrans sandbox dengan order ID yang cocok dan nominal yang benar.
- Tambahkan halaman harga/checkout dan proses pembuatan transaksi Midtrans sebelum menjual paket. Webhook ini menangani konfirmasi pembayaran, bukan membuat halaman checkout atau invoice.
- Periksa kebijakan, pajak, dukungan pelanggan, privasi, serta biaya dan batas gratis dari setiap penyedia sebelum meluncurkan SaaS.
