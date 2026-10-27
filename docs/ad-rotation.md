# Konfigurasi Rotasi Iklan Choco AI

## Kondisi yang ditemukan

- Slot native banner yang diberi label Adsterra sudah ada di `public/index.html`. Script-nya memakai URL host pihak ketiga `bauval.org`; kepemilikan/provider-nya belum diverifikasi secara independen.
- Tidak ditemukan integrasi Monetizer yang dapat diaktifkan secara nyata pada snapshot source yang diperiksa.
- Slot responsive banner sebelumnya menampilkan placeholder meskipun belum ada kode unit. Sekarang slot itu disembunyikan sampai ada integrasi yang benar-benar tersedia.
- Smartlink dan social-bar/popunder lama tidak lagi diaktifkan oleh alur persetujuan iklan pada branch ini, karena tidak tersedia konfigurasi provider yang tervalidasi dan format tersebut dapat mengganggu chat.
- Persetujuan iklan pengguna tetap menjadi prasyarat pemuatan iklan.

## Konfigurasi terpusat

Daftar provider dan durasi berada di `public/ad-rotation.js`.

- Adsterra: aktif menggunakan loader native-banner yang sudah ada.
- Monetizer: nonaktif sampai kode integrasi resmi/URL unit yang benar tersedia.
- Provider slot 3–6: nonaktif sampai provider dipilih dan integrasinya tersedia.
- Durasi rotasi: 15 detik.
- Timer dibuat hanya ketika setidaknya dua provider aktif dengan slot dan adapter yang valid. Saat ini hanya satu provider yang dapat dipakai, sehingga tidak ada pergantian palsu atau timer berulang yang tidak berguna.
- Loader provider hanya dipanggil sekali per siklus objek provider; skrip native lama juga memiliki guard `data-requested` agar tidak dimuat berulang.
- Slot kosong tetap tersembunyi. Kegagalan pemuatan tidak menghalangi fungsi chat.

## Aktivasi Monetizer atau provider tambahan

Sebelum mengaktifkan provider, masukkan integrasi resmi yang memang diberikan oleh provider ke adapter yang sesuai, verifikasi domain/script, tambahkan slot yang cocok, dan uji consent, error, tab tersembunyi, pergantian provider, serta cleanup timer. Jangan memasukkan URL contoh atau URL yang ditebak. Jangan kirim pesan chat, token, atau data pengguna ke provider iklan.

## Batasan verifikasi

Kode rotasi dan smoke tests tersedia di branch migrasi, tetapi tayangan iklan nyata, validitas akun publisher, persetujuan provider, dan pendapatan iklan tidak dapat diverifikasi hanya dari source code. Karena Monetizer belum memiliki kode integrasi yang terverifikasi, urutan Adsterra → Monetizer belum dapat diuji sebagai dua provider aktif.
