# Choco AI — Groq Model Setup

Dokumen ini menjadi daftar konfigurasi model untuk migrasi Choco AI ke Vercel. Jangan masukkan API key ke file ini atau ke kode frontend.

## Model yang dipilih

| Kemampuan | Pilihan | Kegunaan | Status ID |
|---|---|---|---|
| Reasoning | GPT OSS 120B | Tugas penalaran kompleks | ID dikonfirmasi: `openai/gpt-oss-120b` |
| Function calling / tool use | GPT OSS 20B | Pemanggilan fungsi dan tools | ID terlihat: `openai/gpt-oss-20b`; contoh tools belum diterima |
| Text-to-speech | Orpheus English | Keluaran suara | ID dikonfirmasi: `canopylabs/orpheus-v1-english` |
| Speech-to-text | Whisper Large v3 Turbo | Transkripsi audio | Menunggu snippet |
| Text-to-text | GPT OSS 20B | Model chat default | ID terlihat: `openai/gpt-oss-20b`; penetapan tugas chat default belum dikonfirmasi |
| Vision | Qwen 3.8 27B | Analisis gambar | Menunggu snippet |
| Multilingual | GPT OSS 120B | Percakapan multibahasa | ID model sama terkonfirmasi; penggunaan khusus multilingual belum diuji |
| Safety / moderation | Safety GPT OSS 20B | Pemeriksaan keamanan konten | Menunggu snippet |

## Snippet yang sudah diterima

### Reasoning — GPT OSS 20B

- Model ID: `openai/gpt-oss-20b`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: chat completions
- Parameter yang ditunjukkan: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

### Reasoning — GPT OSS 120B

- Model ID: `openai/gpt-oss-120b`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: chat completions
- Parameter yang ditunjukkan: `reasoning_effort="medium"`, streaming aktif, `max_completion_tokens=2048`.

Snippet GPT OSS 120B mengonfirmasi ID model untuk pilihan Reasoning yang direncanakan. GPT OSS 20B juga telah diberikan untuk peran yang pengguna sebut Function Calling; model ID-nya diketahui, tetapi contoh yang diterima sejauh ini belum menunjukkan parameter `tools` atau pemanggilan fungsi yang sebenarnya.

### Text-to-speech — Orpheus English

- Model ID: `canopylabs/orpheus-v1-english`
- SDK pada contoh pengguna: Python `groq`
- Endpoint: `client.audio.speech.create(...)`
- Voice: `autumn`
- Format respons: `wav`
- Input teks: field `input`
- File output contoh: `speech.wav`

Snippet ini mengonfirmasi ID dan bentuk endpoint speech generation pada contoh Groq. Contoh mengimpor `os` dan memakai `Path`, tetapi tidak memperlihatkan import `Path`; implementasi final perlu mengurus path dan penanganan file dengan benar. Nama model menunjukkan keluaran berfokus pada bahasa Inggris, jadi dukungan suara bahasa Indonesia perlu diuji sebelum dipakai di Choco AI.

Contoh yang dikirim pengguna menggunakan Python. Implementasi Vercel akan memakai JavaScript/TypeScript di backend jika proyek Vercel menggunakan runtime Node.js; jangan menempelkan contoh Python langsung ke frontend atau fungsi JavaScript.

## Sebelum integrasi

Nama tampilan di atas belum tentu sama dengan ID API yang harus dipakai di kode. Salin contoh kode/API snippet dari halaman model Groq untuk tiap model, lalu cocokkan ID model dan endpoint yang ditunjukkan Groq. Jangan menebak ID model.

Beberapa kemampuan menggunakan endpoint berbeda. Chat/text, vision, audio transcription, text-to-speech, dan moderation tidak boleh diasumsikan semuanya memakai endpoint chat-completions yang sama. Pastikan snippet yang disalin berasal dari model dan tugas yang tepat.

## Variabel lingkungan Vercel

Tambahkan API key di Vercel Project → Settings → Environment Variables:

- `GROQ_API_KEY` = API key baru dari Groq
- `GROQ_MODEL_TEXT` = `openai/gpt-oss-20b` setelah peran chat default dikonfirmasi
- `GROQ_MODEL_REASONING` = `openai/gpt-oss-120b`
- `GROQ_MODEL_TOOLS` = `openai/gpt-oss-20b` (ID diketahui; implementasi tools perlu dibuat dan diuji)
- `GROQ_MODEL_VISION` = ID resmi model vision Qwen 3.8 27B
- `GROQ_MODEL_STT` = ID resmi model Whisper Large v3 Turbo
- `GROQ_MODEL_TTS` = `canopylabs/orpheus-v1-english`
- `GROQ_MODEL_SAFETY` = ID resmi Safety GPT OSS 20B
- `GROQ_MODEL_MULTILINGUAL` = `openai/gpt-oss-120b` (ID terkonfirmasi; perilaku multilingual perlu diuji)

Gunakan nama variabel ini sebagai rancangan konfigurasi. Backend harus membaca variabel yang relevan dan memvalidasi model/endpoint sebelum fitur diaktifkan. Jangan menaruh nilai rahasia di variabel berawalan `NEXT_PUBLIC_` atau di file frontend.

## Yang perlu disalin dari Groq

Kirim snippet kode atau setidaknya ID model dan endpoint dari Groq untuk:
1. Whisper Large v3 Turbo (speech-to-text)
2. GPT OSS 20B (text-to-text, model chat default)
3. Qwen 3.8 27B (vision)
4. Safety GPT OSS 20B (safety/moderation)

ID GPT OSS 20B untuk Function Calling sudah diketahui; contoh `tools` masih dibutuhkan untuk implementasi. Orpheus English dan GPT OSS 120B untuk reasoning sudah dicatat.

Hapus API key rahasia dari snippet sebelum membagikannya. Setelah ID/endpoint diverifikasi, konfigurasi ini dapat dihubungkan ke backend Vercel.

## Status

- [x] Pilihan model per kemampuan ditetapkan sebagai rancangan awal.
- [x] ID GPT OSS 20B dan GPT OSS 120B dicatat dari snippet pengguna.
- [x] ID Orpheus English dan endpoint text-to-speech dicatat dari snippet pengguna.
- [ ] ID API dan endpoint kemampuan lainnya diverifikasi dari Groq.
- [ ] Backend Vercel dibuat/diadaptasi.
- [ ] Setiap kemampuan diuji menggunakan API key baru.
- [ ] Deployment Vercel diverifikasi sebelum Netlify dipensiunkan.
