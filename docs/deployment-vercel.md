# Panduan Deployment Vercel — Choco AI

Dokumen ini menjelaskan target konfigurasi pada branch migrasi. **Dokumen ini bukan bukti bahwa production sudah ter-deploy.**

## Arsitektur yang digunakan

- Frontend statis disajikan dari direktori `public/`.
- Frontend mengirim chat ke `POST /api/tanya-ai`.
- Endpoint serverless berada di `api/tanya-ai.mjs`.
- Endpoint memanggil Groq dari server, bukan browser.
- Endpoint saat ini menggunakan Supabase untuk memverifikasi sesi pengguna, membaca status langganan, dan menyimpan riwayat chat.
- File fungsi lama di `netlify/functions/` dipertahankan untuk perbandingan selama transisi; endpoint frontend Vercel tidak lagi diarahkan melalui rewrite Netlify. File konfigurasi deployment `netlify.toml` dihapus dari branch migrasi agar konfigurasi target tidak lagi mengarahkan build ke Netlify. Ini tidak menghapus situs atau deployment Netlify lama.

## Environment variables

Atur melalui Project Settings → Environment Variables di dashboard Vercel. Jangan memasukkan nilai secret ke GitHub atau chat.

| Variable | Kebutuhan | Fungsi |
|---|---|---|
| `GROQ_API_KEY` | Wajib untuk balasan AI | Kunci API Groq yang hanya digunakan server |
| `GROQ_MODEL` | Opsional | Model standar fallback |
| `GROQ_MODEL_TEXT` | Opsional | Model mode standard |
| `GROQ_MODEL_REASONING` | Opsional | Model mode reasoning |
| `GROQ_MODEL_VISION` | Opsional | Model mode vision |
| `SUPABASE_URL` | Wajib untuk alur login/chat saat ini | URL proyek Supabase |
| `SUPABASE_ANON_KEY` | Wajib untuk verifikasi token | Kunci anon/public untuk verifikasi Auth di server |
| `SUPABASE_SERVICE_ROLE_KEY` | Wajib untuk database chat/langganan saat ini | Kunci server berprivilege tinggi; jangan pernah ekspos ke frontend |
| `CHOCO_ALLOWED_ORIGIN` | Opsional | Membatasi nilai Origin yang diterima endpoint bila request menyertakan header Origin |

Jika `CHOCO_ALLOWED_ORIGIN` diisi, nilainya harus cocok dengan origin deployment yang sedang diuji. URL Preview Vercel dapat berbeda dari domain produksi; jangan memakai origin Netlify lama untuk Preview. Untuk request same-origin, variabel ini dapat dibiarkan tidak disetel kecuali pembatasan Origin memang diperlukan.

Nama model fallback yang ada di source code adalah `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, dan `qwen/qwen3.8-27b` untuk mode terkait. Ketersediaan model dan akses akun Groq perlu diverifikasi dari dashboard provider; jangan menganggapnya tersedia hanya berdasarkan konfigurasi kode.

## Deploy dan verifikasi

1. Impor repository `chocoanakbaik/AIKEPRIBADIAN` ke Vercel dan pilih branch yang akan ditinjau.
2. Pastikan Root Directory mengarah ke root repository, bukan subfolder.
3. Pastikan output statis menggunakan `public/`; Vercel mendeteksi fungsi di `api/`.
4. Tambahkan environment variables yang diperlukan pada environment Preview terlebih dahulu.
5. Deploy Preview dari branch ini, bukan mengganti produksi secara manual.
6. Uji halaman utama, login, chat, riwayat, status langganan, error provider, dan tampilan mobile.
7. Periksa log function untuk error tanpa mencetak token atau isi percakapan.
8. Jangan menganggap migrasi selesai sampai Preview benar-benar diuji dan konfigurasi production diverifikasi.

## Batasan yang diketahui

- Endpoint chat bergantung pada Supabase. Menghapus Supabase memerlukan penggantian dan pengujian autentikasi, langganan, serta penyimpanan riwayat; itu bukan bagian dari perubahan routing hosting ini.
- Endpoint masih menyimpan pesan pengguna sebelum inference. Jika Groq gagal, pesan pengguna dapat tersimpan tanpa balasan assistant.
- Rate limit berbasis memori proses serverless tidak digunakan sebagai kontrol lintas-instance; jika rate limiting dibutuhkan, gunakan mekanisme terpusat yang sesuai dan diuji.
- File `netlify/functions/tanya-ai.js` masih ada sebagai sumber historis. Jangan menghapusnya sampai perilaku endpoint Vercel telah dibandingkan dan disetujui.
- Domain custom, environment variables dashboard, deployment production, dan status domain Netlify lama belum diverifikasi dari repository saja.
