# Panduan Deployment Vercel — Choco AI

## Model aplikasi saat ini

Choco AI menggunakan **mode pengunjung tanpa akun**, tanpa login, tanpa paket berbayar, dan tanpa database percakapan server. Pendanaan direncanakan melalui iklan yang ditampilkan sesuai pilihan persetujuan pengguna.

- Frontend statis: direktori `public/`.
- Endpoint chat: `POST /api/tanya-ai`.
- Provider inference: Groq; kunci API hanya berada di environment server.
- Riwayat percakapan dikirim dari tab browser saat sesi berjalan. Riwayat tidak disimpan di server dan akan hilang saat halaman dimuat ulang atau sesi berakhir.
- Preferensi antarmuka dapat disimpan di penyimpanan lokal browser. Ini bukan akun atau sinkronisasi lintas perangkat.
- Iklan menggunakan pengaturan persetujuan pada browser. Slot provider yang belum memiliki integrasi resmi tetap nonaktif.

## Environment variables

Atur melalui Project Settings → Environment Variables di dashboard Vercel. Jangan memasukkan nilai secret ke GitHub atau chat.

| Variable | Kebutuhan | Fungsi |
|---|---|---|
| `GROQ_API_KEY` | Wajib untuk balasan AI | Kunci API Groq, digunakan hanya di server |
| `GROQ_MODEL` | Opsional | Model fallback |
| `GROQ_MODEL_TEXT` | Opsional | Model untuk mode standar |
| `GROQ_MODEL_REASONING` | Opsional | Model untuk mode penalaran |
| `GROQ_MODEL_VISION` | Opsional | Model untuk mode analisis gambar |
| `CHOCO_ALLOWED_ORIGIN` | Opsional | Membatasi Origin request jika disetel |

Nama model fallback yang ada di kode adalah `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, dan `qwen/qwen3.8-27b`. Ketersediaan model dan akses akun Groq harus diverifikasi di dashboard provider.

## Deploy dan verifikasi

1. Pastikan Root Directory mengarah ke root repository.
2. Pastikan Vercel menyajikan direktori output `public/` dan mendeteksi fungsi dalam `api/`.
3. Set `GROQ_API_KEY` pada environment Preview.
4. Deploy Preview dari branch migrasi.
5. Uji chat tanpa login, semua mode AI, batas panjang pesan, kegagalan provider, pembatasan permintaan, persetujuan iklan, serta tampilan desktop dan mobile.
6. Periksa log function tanpa mencetak secret atau isi percakapan.
7. Pastikan domain publik stabil dan fungsi chat benar-benar berhasil sebelum mendaftarkan URL ke penyedia iklan.

## Batasan dan keamanan

- **Tidak ada akun, paket Premium, pembayaran, atau riwayat percakapan persisten** pada versi ini.
- Riwayat yang dikirim browser adalah konteks sesi, bukan catatan tepercaya atau memori jangka panjang.
- Rate limit dalam memori fungsi serverless hanya perlindungan dasar per instance; itu bukan pembatasan global yang kuat. Sebelum promosi besar, pantau penggunaan dan biaya Groq serta siapkan kontrol penyalahgunaan yang sesuai dengan infrastruktur yang benar-benar tersedia.
- Endpoint memerlukan `GROQ_API_KEY`. Jika belum disetel, endpoint akan mengembalikan error konfigurasi, bukan meminta login.
- Deployment Preview bukan bukti bahwa deployment produksi, domain custom, atau tayangan iklan nyata telah diverifikasi.
