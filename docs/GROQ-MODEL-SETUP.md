# Choco AI — Groq Model Setup

Dokumen ini menjadi daftar konfigurasi model untuk migrasi Choco AI ke Vercel. Jangan masukkan API key ke file ini atau ke kode frontend.

## Model yang dipilih

| Kemampuan | Pilihan | Kegunaan |
|---|---|---|
| Reasoning | GPT OSS 120B | Tugas penalaran kompleks |
| Function calling / tool use | GPT OSS 20B | Pemanggilan fungsi dan tools |
| Text-to-speech | Orpheus English | Keluaran suara berbahasa Inggris |
| Speech-to-text | Whisper Large v3 Turbo | Transkripsi audio |
| Text-to-text | GPT OSS 20B | Model chat default |
| Vision | Qwen 3.8 27B | Analisis gambar |
| Multilingual | GPT OSS 120B | Percakapan multibahasa |
| Safety / moderation | Safety GPT OSS 20B | Pemeriksaan keamanan konten |

## Sebelum integrasi

Nama tampilan di atas belum tentu sama dengan ID API yang harus dipakai di kode. Salin contoh kode/API snippet dari halaman model Groq untuk tiap model, lalu cocokkan ID model dan endpoint yang ditunjukkan Groq. Jangan menebak ID model.

Beberapa kemampuan menggunakan endpoint berbeda. Chat/text, vision, audio transcription, text-to-speech, dan moderation tidak boleh diasumsikan semuanya memakai endpoint chat-completions yang sama. Pastikan snippet yang disalin berasal dari model dan tugas yang tepat.

## Variabel lingkungan Vercel

Tambahkan API key di Vercel Project → Settings → Environment Variables:

- `GROQ_API_KEY` = API key baru dari Groq
- `GROQ_MODEL_TEXT` = ID resmi model text-to-text GPT OSS 20B
- `GROQ_MODEL_REASONING` = ID resmi model reasoning GPT OSS 120B
- `GROQ_MODEL_TOOLS` = ID resmi model function calling GPT OSS 20B
- `GROQ_MODEL_VISION` = ID resmi model vision Qwen 3.8 27B
- `GROQ_MODEL_STT` = ID resmi model Whisper Large v3 Turbo
- `GROQ_MODEL_TTS` = ID/endpoint resmi Orpheus English sesuai dokumentasi Groq
- `GROQ_MODEL_SAFETY` = ID resmi Safety GPT OSS 20B
- `GROQ_MODEL_MULTILINGUAL` = ID resmi model multilingual GPT OSS 120B

Gunakan nama variabel ini sebagai rancangan konfigurasi. Backend harus membaca variabel yang relevan dan memvalidasi model/endpoint sebelum fitur diaktifkan. Jangan menaruh nilai rahasia di variabel berawalan `NEXT_PUBLIC_` atau di file frontend.

## Yang perlu disalin dari Groq

Salin kode contoh untuk masing-masing model berikut dari Groq Console / dokumentasi model:
1. GPT OSS 120B (reasoning)
2. GPT OSS 20B (function calling/tool use)
3. Orpheus English (text-to-speech)
4. Whisper Large v3 Turbo (speech-to-text)
5. GPT OSS 20B (text-to-text)
6. Qwen 3.8 27B (vision)
7. GPT OSS 120B (multilingual)
8. Safety GPT OSS 20B (safety/moderation)

Kirim snippet kode atau setidaknya ID model dan endpoint yang diberikan Groq. Hapus API key dari snippet sebelum membagikannya. Setelah ID/endpoint diverifikasi, konfigurasi ini dapat dihubungkan ke backend Vercel.

## Status

- [x] Pilihan model per kemampuan ditetapkan.
- [ ] ID API dan endpoint resmi diverifikasi dari Groq.
- [ ] Backend Vercel dibuat/diadaptasi.
- [ ] Setiap kemampuan diuji menggunakan API key baru.
- [ ] Deployment Vercel diverifikasi sebelum Netlify dipensiunkan.
