# Siklus pengembangan AI Choco

Dokumen ini menetapkan proses kerja yang bisa diuji untuk pengembangan bertahap dengan anggaran terbatas. Targetnya adalah sistem yang dapat dipelihara, bukan klaim bahwa model telah dilatih dari nol.

## 1. Definisi masalah

Fokus produk: representasi digital personal yang menggunakan identitas terstruktur, preferensi, contoh perilaku, memori, dan referensi pengetahuan tanpa mengarang fakta yang belum tersedia.

Sebelum fitur baru dibuat, tentukan:
- masalah pengguna yang diselesaikan;
- data yang dibutuhkan dan siapa yang boleh mengaksesnya;
- perilaku yang dianggap benar;
- pengujian penerimaan;
- biaya atau kuota yang boleh dipakai.

## 2. Rekayasa data

Sumber pengetahuan repository berada di `data/knowledge/`. Fakta proyek yang dapat diverifikasi dipisahkan dari konsep umum. Pengalaman pribadi tidak boleh dibuat-buat; `experiences.json` tetap kosong sampai ada data nyata yang disetujui.

GitHub Actions memvalidasi bentuk data, batas panjang, ID duplikat, dan kemampuan retrieval. Jangan memasukkan token, kredensial, percakapan pribadi, atau data pengguna lain ke file publik.

## 3. Model dan pelatihan

Runtime saat ini menggunakan Groq API, dengan model yang dapat dipilih lewat `GROQ_MODEL`. Pengetahuan yang berubah lebih sering ditangani lewat RAG terlebih dahulu. Fine-tuning baru layak dicoba ketika dataset contoh telah ditinjau, ada baseline evaluasi, dan tersedia runtime yang cukup.

Tidak ada klaim bahwa model fondasi dilatih dari nol dalam repository ini.

## 4. MLOps dan deployment

Workflow AI Quality Checks menjalankan pemeriksaan sintaks, validasi data, pemeriksaan keamanan migrasi, unit test, dan benchmark retrieval pada runner GitHub. Migrasi Supabase disimpan sebagai SQL berurutan di `supabase/migrations/`.

Kredensial hanya boleh disimpan sebagai GitHub Actions secrets. Jangan menaruh service-role key atau kata sandi database di source code. Migrasi produksi harus ditinjau sebelum diterapkan; workflow tidak membuktikan migrasi sukses diterapkan ke proyek Supabase kecuali run deployment menunjukkan keberhasilan.

## 5. Deployment dan monitoring

Setiap perubahan harus memiliki sinyal yang bisa diperiksa:
- pemeriksaan build/sintaks dan test lulus;
- benchmark retrieval menunjukkan hasil yang diharapkan;
- kegagalan layanan menghasilkan error yang terkendali, bukan kebocoran secret;
- perubahan skema memiliki migrasi yang dapat ditinjau;
- hasil workflow dan commit yang diuji dapat ditelusuri.

CI menggunakan fixture lokal dan tidak memanggil Groq API, sehingga pengujian tidak menghabiskan kuota inferensi. Pemantauan layanan live dan pengujian autentikasi Supabase tetap membutuhkan konfigurasi layanan yang valid; hasil CI lokal tidak boleh diklaim sebagai bukti bahwa layanan produksi sudah sehat.
