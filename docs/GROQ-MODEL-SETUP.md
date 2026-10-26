# Choco AI — Groq Model Setup

Dokumen ini menjadi daftar konfigurasi model untuk migrasi Choco AI ke Vercel. Jangan masukkan API key ke file ini atau ke kode frontend.

## Model yang dipilih

| Kemampuan | Pilihan | Kegunaan | Status ID |
|---|---|---|---|
| Reasoning | GPT OSS 120B | Tugas penalaran kompleks | ID dikonfirmasi: `openai/gpt-oss-120b` |
| Function calling / tool use | GPT OSS 20B | Pemanggilan fungsi dan tools | ID dikonfirmasi: `openai/gpt-oss-20b`; alur tools belum diimplementasikan |
| Text-to-speech | Orpheus English | Keluaran suara | ID dikonfirmasi: `canopylabs/orpheus-v1-english` |
| Speech-to-text | Whisper Large v3 Turbo | Transkripsi audio | ID dikonfirmasi: `whisper-large-v3-turbo` |
| Text-to-text | GPT OSS 20B | Model chat default | ID dikonfirmasi: `openai/gpt-oss-20b` |
| Vision | Qwen 3.8 27B | Analisis gambar | Menunggu snippet |
| Multilingual | GPT OSS 120B | Percakapan multibahasa | ID model sama terkonfirmasi; penggunaan khusus multilingual belum diuji |
| Safety / moderation | Safety GPT OSS 20B | Pemeriksaan keamanan konten | Menunggu snippet |

## Snippet yang sudah diterima

### Reasoning — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: chat completions
- Parameter: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

### Reasoning — GPT OSS 120B

- Model ID: `openai/gpt-oss-120b`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: chat completions
- Parameter: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

GPT OSS 120B mengonfirmasi model untuk pilihan Reasoning. GPT OSS 20B juga dicatat untuk Function Calling sesuai pembagian kemampuan yang ditentukan pengguna; snippet yang diberikan sejauh ini belum menunjukkan parameter `tools`, jadi alur pemanggilan tools tetap harus diimplementasikan dan diuji.

### Text-to-speech — Orpheus English

- Model ID: `canopylabs/orpheus-v1-english`
- SDK: Python `groq`
- Endpoint: `client.audio.speech.create(...)`
- Voice: `autumn`
- Format respons: `wav`
- Input teks: field `input`
- File output contoh: `speech.wav`

Snippet ini mengonfirmasi ID dan bentuk endpoint speech generation. Contoh memakai `Path` tanpa memperlihatkan import-nya; implementasi final perlu mengurus path dan penanganan file dengan benar. Nama model menunjukkan keluaran berfokus pada bahasa Inggris, jadi dukungan suara bahasa Indonesia perlu diuji sebelum dipakai di Choco AI.

### Speech-to-text — Whisper Large v3 Turbo

- Model ID: `whisper-large-v3-turbo`
- SDK: Python `groq`
- Endpoint: `client.audio.transcriptions.create(...)`
- Format respons: `verbose_json`
- Temperature: `0`
- Contoh sumber audio: file `audio.m4a`
- Teks hasil transkripsi: `transcription.text`

Backend Vercel perlu menangani unggahan audio secara aman, membatasi ukuran file, dan tidak mengasumsikan path lokal contoh Python tersedia di deployment serverless.

### Text-to-text — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK: Python `groq`
- Endpoint: chat completions
- Parameter: `temperature=1`, `max_completion_tokens=2048`, `top_p=1`, `reasoning_effort="medium"`, streaming aktif, `stop=None`.

Snippet ini mengonfirmasi GPT OSS 20B sebagai model untuk chat text-to-text sesuai pembagian kemampuan yang pengguna tetapkan. Implementasi Vercel akan memakai JavaScript/TypeScript di backend jika runtime proyek menggunakan Node.js; jangan menempelkan kode Python langsung ke frontend atau fungsi JavaScript.

## Sebelum integrasi

Nama tampilan di atas belum tentu sama dengan ID API yang harus dipakai di kode. Gunakan ID dan endpoint dari snippet resmi Groq, jangan menebak ID model.

Chat/text, vision, audio transcription, text-to-speech, dan moderation dapat memakai endpoint berbeda. Jangan asumsikan semuanya memakai chat completions.

## Variabel lingkungan Vercel

Tambahkan API key di Vercel Project → Settings → Environment Variables:

- `GROQ_API_KEY` = API key baru dari Groq
- `GROQ_MODEL_TEXT` = `openai/gpt-oss-20b`
- `GROQ_MODEL_REASONING` = `openai/gpt-oss-120b`
- `GROQ_MODEL_TOOLS` = `openai/gpt-oss-20b` (alur tools perlu diimplementasikan dan diuji)
- `GROQ_MODEL_VISION` = ID resmi model vision Qwen 3.8 27B
- `GROQ_MODEL_STT` = `whisper-large-v3-turbo`
- `GROQ_MODEL_TTS` = `canopylabs/orpheus-v1-english`
- `GROQ_MODEL_SAFETY` = ID resmi Safety GPT OSS 20B
- `GROQ_MODEL_MULTILINGUAL` = `openai/gpt-oss-120b` (perilaku multilingual perlu diuji)

Jangan taruh nilai rahasia di variabel berawalan `NEXT_PUBLIC_` atau file frontend.

## Yang perlu disalin dari Groq

Kirim snippet kode atau setidaknya ID model dan endpoint dari Groq untuk:
1. Qwen 3.8 27B (vision)
2. Safety GPT OSS 20B (safety/moderation)

ID model untuk reasoning, text-to-text, function calling, text-to-speech, dan speech-to-text sudah dicatat. Untuk Function Calling, contoh `tools` masih dibutuhkan agar alur tool-calling dapat dibangun dengan benar.

Hapus API key rahasia dari snippet sebelum membagikannya. Setelah ID/endpoint diverifikasi, konfigurasi ini dapat dihubungkan ke backend Vercel.

## Status

- [x] Pilihan model per kemampuan ditetapkan sebagai rancangan awal.
- [x] ID GPT OSS 20B untuk text-to-text dan GPT OSS 120B untuk reasoning dicatat.
- [x] ID Orpheus English dan endpoint text-to-speech dicatat.
- [x] ID Whisper Large v3 Turbo dan endpoint transkripsi dicatat.
- [ ] ID API dan endpoint kemampuan vision serta safety/moderation diverifikasi.
- [ ] Backend Vercel dibuat/diadaptasi.
- [ ] Setiap kemampuan diuji menggunakan API key baru.
- [ ] Deployment Vercel diverifikasi sebelum Netlify dipensiunkan.
