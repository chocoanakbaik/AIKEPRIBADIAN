# Migrasi Choco AI ke Vercel

Dokumen ini menyiapkan deployment Vercel tanpa menghapus konfigurasi Netlify yang masih digunakan oleh deployment lama.

## Routing

- Frontend statis disajikan dari `public/`.
- Vercel API functions berada di `api/`.
- Rewrite `/.netlify/functions/*` ke `/api/*` menjaga endpoint yang dipanggil frontend tetap kompatibel.
- Handler bisnis tetap berada di `netlify/functions/` dan dijalankan melalui adapter di `api/_lib/netlify-adapter.js`.

## Environment Variables

Tambahkan variabel berikut di Vercel Project Settings > Environment Variables. Gunakan nama persis seperti di bawah ini.

| Variable | Keterangan |
| --- | --- |
| `GROQ_API_KEY` | Secret API key Groq |
| `GROQ_MODEL` | Model default, saat ini direncanakan `openai/gpt-oss-20b` |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon/public key Supabase untuk verifikasi sesi |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret server-side yang dipakai operasi database; jangan pernah taruh di frontend |
| `MIDTRANS_SERVER_KEY` | Secret webhook pembayaran, jika fitur pembayaran diaktifkan |
| `PREMIUM_PRICE_IDR` | Harga premium yang dibaca oleh integrasi pembayaran jika diperlukan |
| `CHOCO_ALLOWED_ORIGIN` | Origin frontend produksi Vercel, tanpa path |

Jangan membuat beberapa entri dengan nama `GROQ_MODEL` yang sama. Model pilihan tambahan harus diatur di kode aplikasi, bukan lewat variabel duplikat.

## Deployment

1. Import repository ini ke Vercel.
2. Pilih branch `vercel-migration` untuk preview terlebih dahulu.
3. Atur Environment Variables untuk Preview dan Production sesuai kebutuhan.
4. Deploy preview dan uji halaman, chat, autentikasi Supabase, memori, serta webhook pembayaran sebelum menggabungkan pull request.
5. Setelah domain Vercel ditetapkan, atur `CHOCO_ALLOWED_ORIGIN` ke origin tersebut dan redeploy preview.
6. Jangan hapus situs Netlify lama sampai alur utama di Vercel teruji.

## Batas validasi

Penambahan file konfigurasi bukan bukti bahwa deployment sudah berhasil. Build dan pengujian endpoint tetap harus dijalankan di preview Vercel karena membutuhkan environment variables dan layanan Supabase/Groq yang aktif.
