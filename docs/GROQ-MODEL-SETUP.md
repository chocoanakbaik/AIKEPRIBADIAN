# Choco AI — Groq Model Setup

Dokumen ini menjadi daftar konfigurasi model untuk migrasi Choco AI ke Vercel. Jangan masukkan API key ke file ini atau ke kode frontend.

## Model yang dipilih

| Kemampuan | Pilihan | Kegunaan | Status ID |
|---|---|---|---|
| Reasoning | GPT OSS 120B | Tugas penalaran kompleks | Menunggu snippet |
| Function calling / tool use | GPT OSS 20B | Pemanggilan fungsi dan tools | Menunggu snippet tool-use |
| Text-to-speech | Orpheus English | Keluaran suara berbahasa Inggris | Menunggu snippet |
| Speech-to-text | Whisper Large v3 Turbo | Transkripsi audio | Menunggu snippet |
| Text-to-text | GPT OSS 20B | Model chat default | ID dikonfirmasi: `openai/gpt-oss-20b` |
| Vision | Qwen 3.8 27B | Analisis gambar | Menunggu snippet |
| Multilingual | GPT OSS 120B | Percakapan multibahasa | Menunggu snippet |
| Safety / moderation | Safety GPT OSS 20B | Pemeriksaan keamanan konten | Menunggu snippet |

## Snippet yang sudah diterima

### Text-to-text — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: chat completions
- Parameter yang ditunjukkan: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

Contoh yang dikirim pengguna menggunakan Python. Implementasi Vercel akan memakai JavaScript/TypeScript di backend jika proyek Vercel menggunakan runtime Node.js; jangan menempelkan contoh Python langsung ke frontend atau fungsi JavaScript.

## Sebelum integrasi

Nama tampilan di atas belum tentu sama dengan ID API yang harus dipakai di kode. Salin contoh kode/API snippet dari halaman model Groq untuk tiap model, lalu cocokkan ID model dan endpoint yang ditunjukkan Groq. Jangan menebak ID model.

Beberapa kemampuan menggunakan endpoint berbeda. Chat/text, vision, audio transcription, text-to-speech, dan moderation tidak boleh diasumsikan semuanya memakai endpoint chat-completions yang sama. Pastikan snippet yang disalin berasal dari model dan tugas yang tepat.

## Variabel lingkungan Vercel

Tambahkan API key di Vercel Project → Settings → Environment Variables:

- `GROQ_API_KEY` = API key baru dari Groq
- `GROQ_MODEL_TEXT` = `openai/gpt-oss-20b`
- `GROQ_MODEL_REASONING` = ID resmi model reasoning GPT OSS 120B
- `GROQ_MODEL_TOOLS` = ID resmi model function calling GPT OSS 20B
- `GROQ_MODEL_VISION` = ID resmi model vision Qwen 3.8 27B
- `GROQ_MODEL_STT` = ID resmi model Whisper Large v3 Turbo
- `GROQ_MODEL_TTS` = ID/endpoint resmi Orpheus English sesuai dokumentasi Groq
- `GROQ_MODEL_SAFETY` = ID resmi Safety GPT OSS 20B
- `GROQ_MODEL_MULTILINGUAL` = ID resmi model multilingual GPT OSS 120B

Gunakan nama variabel ini sebagai rancangan konfigurasi. Backend harus membaca variabel yang relevan dan memvalidasi model/endpoint sebelum fitur diaktifkan. Jangan menaruh nilai rahasia di variabel berawalan `NEXT_PUBLIC_` atau di file frontend.

## Yang perlu disalin dari Groq

Kirim snippet kode atau setidaknya ID model dan endpoint dari Groq untuk:
1. GPT OSS 120B (reasoning)
2. GPT OSS 20B (function calling/tool use, pastikan contoh menunjukkan tools/function calling)
3. Orpheus English (text-to-speech)
4. Whisper Large v3 Turbo (speech-to-text)
5. Qwen 3.8 27B (vision)
6. Safety GPT OSS 20B (safety/moderation)

GPT OSS 20B untuk text-to-text sudah diterima. GPT OSS 20B untuk tool-use tetap perlu contoh yang memperlihatkan dukungan tools, meskipun ID modelnya sama.

Hapus API key rahasia dari snippet sebelum membagikannya. Setelah ID/endpoint diverifikasi, konfigurasi ini dapat dihubungkan ke backend Vercel.

## Status

- [x] Pilihan model per kemampuan ditetapkan.
- [x] ID GPT OSS 20B untuk text-to-text dikonfirmasi dari snippet pengguna.
- [ ] ID API dan endpoint kemampuan lainnya diverifikasi dari Groq.
- [ ] Backend Vercel dibuat/diadaptasi.
- [ ] Setiap kemampuan diuji menggunakan API key baru.
- [ ] Deployment Vercel diverifikasi sebelum Netlify dipensiunkan.
