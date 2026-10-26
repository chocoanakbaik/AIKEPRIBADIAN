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
| Vision | Qwen 3.8 27B | Analisis gambar | ID dikonfirmasi: `qwen/qwen3.8-27b`; dukungan input gambar belum dibuktikan oleh snippet |
| Multilingual | GPT OSS 120B | Percakapan multibahasa | ID model sama terkonfirmasi; penggunaan khusus multilingual belum diuji |
| Safety / moderation | GPT OSS Safeguard 20B | Pemeriksaan keamanan konten | ID dikonfirmasi: `openai/gpt-oss-safeguard-20b`; kebijakan moderasi perlu dirancang dan diuji |

## Snippet yang sudah diterima

### Reasoning — GPT OSS 120B

- Model ID: `openai/gpt-oss-120b`
- SDK: Python `groq`
- Endpoint: chat completions
- Parameter: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

### Function calling / tool use — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK: Python `groq`
- Endpoint: chat completions
- Catatan: model ID dipilih untuk peran ini, tetapi snippet yang tersedia belum menunjukkan parameter `tools` atau putaran pemanggilan fungsi. Alur tersebut perlu diimplementasikan dan diuji.

### Text-to-speech — Orpheus English

- Model ID: `canopylabs/orpheus-v1-english`
- SDK: Python `groq`
- Endpoint: `client.audio.speech.create(...)`
- Voice: `autumn`
- Format respons: `wav`
- Input teks: field `input`
- File output contoh: `speech.wav`

Contoh memakai `Path` tanpa memperlihatkan import-nya. Implementasi final perlu menangani file dengan benar. Dukungan suara bahasa Indonesia perlu diuji karena model berfokus pada bahasa Inggris.

### Speech-to-text — Whisper Large v3 Turbo

- Model ID: `whisper-large-v3-turbo`
- SDK: Python `groq`
- Endpoint: `client.audio.transcriptions.create(...)`
- Format respons: `verbose_json`
- Temperature: `0`
- Contoh sumber audio: `audio.m4a`
- Teks hasil transkripsi: `transcription.text`

Backend Vercel perlu menangani unggahan audio secara aman, membatasi ukuran file, dan tidak mengasumsikan path lokal contoh Python tersedia di deployment serverless.

### Text-to-text — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK: Python `groq`
- Endpoint: chat completions
- Parameter: `temperature=1`, `max_completion_tokens=2048`, `top_p=1`, `reasoning_effort="medium"`, streaming aktif, `stop=None`.

Snippet mengonfirmasi GPT OSS 20B sebagai model chat text-to-text. Implementasi Vercel akan memakai JavaScript/TypeScript di backend jika proyek menggunakan runtime Node.js; jangan menempelkan Python langsung ke frontend atau fungsi JavaScript.

### Vision — Qwen 3.8 27B

- Model ID: `qwen/qwen3.8-27b`
- SDK: Python `groq`
- Endpoint pada snippet: chat completions
- Parameter: `temperature=0.6`, `max_completion_tokens=2048`, `top_p=0.95`, `reasoning_effort="default"`, streaming aktif, `stop=None`.

Snippet hanya mengirim pesan teks kosong, bukan payload gambar. Model ID dan bentuk panggilan chat sudah dicatat, tetapi cara input gambar diterima belum terbukti. Perlu contoh request vision yang menyertakan gambar atau dokumentasi model yang menegaskan dukungan input gambar sebelum fitur Vision diaktifkan.

### Safety / moderation — GPT OSS Safeguard 20B

- Model ID: `openai/gpt-oss-safeguard-20b`
- SDK: Python `groq`
- Endpoint pada snippet: chat completions
- Parameter: `temperature=1`, `max_completion_tokens=2048`, `top_p=1`, `reasoning_effort="medium"`, streaming aktif, `stop=None`.

Snippet mengonfirmasi model ID dan endpoint chat completions untuk model Safeguard. Namun, contoh hanya mengirim pesan kosong dan tidak memperlihatkan format hasil klasifikasi atau kebijakan yang ingin diterapkan. Implementasi moderation harus menentukan instruksi kebijakan, cara membaca hasil, perilaku saat model gagal, dan pengujian false positives/false negatives; jangan menganggap model otomatis memblokir konten hanya karena namanya Safeguard.

## Sebelum integrasi

Gunakan ID dan endpoint dari snippet Groq, jangan menebak ID model. Chat/text, vision, audio transcription, text-to-speech, dan moderation dapat memakai endpoint atau format input berbeda. Contoh yang diberikan untuk Vision dan Safeguard baru mengonfirmasi panggilan chat, bukan keseluruhan perilaku fitur.

## Variabel lingkungan Vercel

Tambahkan API key di Vercel Project → Settings → Environment Variables:

- `GROQ_API_KEY` = API key baru dari Groq
- `GROQ_MODEL_TEXT` = `openai/gpt-oss-20b`
- `GROQ_MODEL_REASONING` = `openai/gpt-oss-120b`
- `GROQ_MODEL_TOOLS` = `openai/gpt-oss-20b` (alur tools perlu diimplementasikan dan diuji)
- `GROQ_MODEL_VISION` = `qwen/qwen3.8-27b` (input gambar masih perlu diverifikasi)
- `GROQ_MODEL_STT` = `whisper-large-v3-turbo`
- `GROQ_MODEL_TTS` = `canopylabs/orpheus-v1-english`
- `GROQ_MODEL_SAFETY` = `openai/gpt-oss-safeguard-20b`
- `GROQ_MODEL_MULTILINGUAL` = `openai/gpt-oss-120b` (perilaku multilingual perlu diuji)

Jangan taruh nilai rahasia di variabel berawalan `NEXT_PUBLIC_` atau file frontend.

## Hal yang masih perlu diverifikasi

1. Contoh Vision yang benar-benar mengirim input gambar untuk Qwen 3.8 27B, jika tersedia.
2. Contoh Function Calling yang memakai parameter `tools` dan memproses hasil pemanggilan fungsi.
3. Format output dan kebijakan moderasi untuk Safeguard 20B.
4. Pengujian kemampuan multilingual serta keluaran suara bahasa Indonesia.

Hapus API key rahasia dari snippet sebelum membagikannya. Setelah konfigurasi diverifikasi, barulah model diintegrasikan dan diuji pada backend Vercel.

## Status

- [x] Pilihan model per kemampuan ditetapkan sebagai rancangan awal.
- [x] ID GPT OSS 20B untuk text-to-text/function calling dan GPT OSS 120B untuk reasoning dicatat.
- [x] ID Orpheus English dan endpoint text-to-speech dicatat.
- [x] ID Whisper Large v3 Turbo dan endpoint transkripsi dicatat.
- [x] ID Qwen 3.8 27B dicatat dari snippet chat.
- [x] ID GPT OSS Safeguard 20B dicatat dari snippet chat.
- [ ] Payload input gambar untuk Vision diverifikasi.
- [ ] Alur function calling diuji.
- [ ] Kebijakan dan format output moderation diuji.
- [ ] Backend Vercel dibuat/diadaptasi.
- [ ] Setiap kemampuan diuji menggunakan API key baru.
- [ ] Deployment Vercel diverifikasi sebelum Netlify dipensiunkan.
