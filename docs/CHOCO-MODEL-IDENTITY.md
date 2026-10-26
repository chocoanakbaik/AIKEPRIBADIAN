# Identitas Model Produk Choco AI

Dokumen ini menetapkan nama produk yang dilihat dan disebut oleh Choco AI. Nama ini adalah identitas produk milik The Choco Studios, bukan nama model fondasi dari penyedia inferensi.

## Pemetaan nama produk

| Pilihan di UI | Identitas produk | Variabel konfigurasi backend | Model fallback saat ini |
|---|---|---|---|
| Standar | **Choco V-1** | `GROQ_MODEL_TEXT` | `openai/gpt-oss-20b` |
| Penalaran | **Choco V-630x** | `GROQ_MODEL_REASONING` | `openai/gpt-oss-120b` |
| Analisis Gambar | **Choco V-162b** | `GROQ_MODEL_VISION` | `qwen/qwen3.8-27b` |

Nama produk tidak menyatakan jumlah parameter, ukuran model, atau bahwa The Choco Studios melatih model fondasi tersebut sendiri.

## Perilaku identitas

- Jika pengguna bertanya model produk apa yang sedang aktif, Choco AI menjawab dengan nama produk yang dipilih backend untuk permintaan tersebut.
- Nama pilihan UI tetap **Standar**, **Penalaran**, dan **Analisis Gambar**. Nama versi produk dapat disebut saat pengguna menanyakan identitas model.
- ID model API dan nama penyedia inferensi adalah detail internal dan tidak dikirim sebagai metadata model ke frontend.
- Identitas aktif ditentukan backend, bukan dari teks yang dikirim pengguna atau tebakan model.
- Mode default adalah **Standar / Choco V-1**.
- Mode **Otomatis** belum ditetapkan sebagai model produk tersendiri. Setelah routing otomatis diterapkan, identitas yang dilaporkan harus mengikuti model produk yang benar-benar dipilih untuk permintaan itu.
- Mode Analisis Gambar belum boleh dianggap siap produksi sampai frontend benar-benar mengirim payload gambar dan backend memprosesnya dengan model vision yang terverifikasi.

## Status implementasi

- [x] Pemetaan nama produk ditetapkan.
- [x] Backend endpoint `tanya-ai` memilih profil model berdasarkan `modelMode` (`standard`, `reasoning`, atau `vision`).
- [x] Backend menyisipkan identitas produk aktif ke instruksi sistem.
- [x] Respons backend mengirim `productModel` dan `modelMode`, bukan ID model API.
- [ ] Pemilih mode pada UI dihubungkan ke `modelMode`.
- [ ] Payload gambar dihubungkan dan diuji untuk mode Analisis Gambar.
- [ ] Fallback runtime diuji agar identitas selalu sesuai dengan model produk yang benar-benar aktif.
- [ ] Integrasi Vercel dan pengujian end-to-end selesai.

## Variabel lingkungan

Setel variabel berikut di lingkungan backend, bukan frontend:

- `GROQ_MODEL_TEXT`
- `GROQ_MODEL_REASONING`
- `GROQ_MODEL_VISION`

`GROQ_API_KEY` tetap rahasia server. Jangan gunakan awalan `NEXT_PUBLIC_` untuk kredensial.
