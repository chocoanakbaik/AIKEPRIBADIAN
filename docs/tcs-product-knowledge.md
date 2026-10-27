# Basis Pengetahuan Produk TCS

## Sumber dan batas penggunaan

Data yang digunakan runtime disimpan di `data/knowledge/tcs-products.mjs`. Isinya merupakan ringkasan customer-safe, status snapshot, fakta yang didukung, hal yang belum terverifikasi, dan tautan ke README publik masing-masing repositori.

Sepuluh repositori yang diperiksa:

1. [TCS UMKM Stock & Sales Tracker](https://github.com/chocoanakbaik/TCS-UMKM-Stock-Sales-Tracker)
2. [TCS Business Document Kit](https://github.com/chocoanakbaik/TCS-Business-Document-Kit)
3. [TCS Professional CV Kit](https://github.com/chocoanakbaik/-TCS-Professional-CV-Kit)
4. [TCS Social Media Business Kit](https://github.com/chocoanakbaik/-TCS-Social-Media-Business-Kit)
5. [TCS Business Presentation Kit](https://github.com/chocoanakbaik/TCS-Business-Presentation-Kit)
6. [TCS Finance & Cashflow Pro](https://github.com/chocoanakbaik/TCS-Finance-Cashflow-Pro)
7. [TCS UMKM Website Kit](https://github.com/chocoanakbaik/TCS-UMKM-Website-Kit)
8. [TCS Admin Dashboard UI Kit](https://github.com/chocoanakbaik/TCS-Admin-Dashboard-UI-Kit)
9. [TCS Business Management System](https://github.com/chocoanakbaik/TCS-Business-Management-System)
10. [TCS Complete UMKM Suite](https://github.com/chocoanakbaik/TCS-Complete-UMKM-Suite)

Semua 10 file `READMEGPT.md` yang diperiksa berisi rangkaian bit 8-bit yang dapat dipulihkan menjadi teks UTF-8. Proses decoding dilakukan dengan memisahkan byte biner dan mengubah byte tersebut menjadi teks. Isi internal tidak disalin mentah ke runtime atau README publik. Fakta yang aman dan relevan disarikan bersama README publik.

## Retrieval

`api/tanya-ai.mjs` memanggil `buildProductContext(message)` sebelum request ke Groq. Retrieval memilih produk yang cocok dengan nama, alias, atau kategori; pertanyaan umum tentang TCS dapat mengambil semua sepuluh ringkasan. Konteks yang diteruskan hanya berisi ringkasan yang aman, status, fakta terverifikasi, hal yang belum terverifikasi, dan sumber publik.

## Status snapshot saat audit

- Stock & Sales Tracker: README dan artefak produk terdokumentasi, termasuk workbook Excel dan companion browser local-first. Sebagian pengujian lintas browser/edge case belum terbukti lulus.
- Sembilan repositori lain: README menjelaskan tujuan/ruang lingkup, tetapi snapshot yang diperiksa hanya menunjukkan README dan READMEGPT. Artefak implementasi atau paket rilis tidak ditemukan, sehingga fitur aktual dan kesiapan jual belum terverifikasi.

Status ini tidak membuktikan keadaan repositori hari ini. Sebelum mengklaim fitur atau rilis, periksa ulang source dan paket rilis yang terbaru.

## Memperbarui data

1. Periksa README publik dan artefak source terbaru dari produk terkait.
2. Catat fakta yang dapat diverifikasi dan bedakan implementasi, rencana, serta hal yang belum diketahui.
3. Perbarui entry terkait di `data/knowledge/tcs-products.mjs`; jangan menyalin READMEGPT internal ke konteks runtime.
4. Jalankan `node --test tests/vercel-api.test.mjs`.
5. Tinjau diff dan pastikan tidak ada harga, tanggal rilis, lisensi, fitur, atau hasil tes yang dikarang.
