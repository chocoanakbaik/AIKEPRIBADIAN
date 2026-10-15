# Choco AI: Pengaturan dan Profil

Folder ini memisahkan dua area aplikasi:

- `settings.js`: pengaturan aplikasi.
- `profile.js`: profil pengguna yang sedang login.
- `settings.css`: styling untuk panel Pengaturan dan Profil.

## Status saat ini

File masih berupa kerangka dan belum dihubungkan ke `public/index.html` atau Supabase. Sebelum implementasi, periksa handler frontend, tabel Supabase, dan kebijakan Row Level Security (RLS) yang sudah ada agar tidak membuat logika ganda. Setiap data harus dibatasi ke `user_id` pengguna yang terautentikasi.

## Aturan penyimpanan

Supabase menjadi sumber utama data Pengaturan dan Profil. Jangan gunakan `localStorage` sebagai penyimpanan persisten untuk kedua fitur ini. Jika penyimpanan gagal, tampilkan pesan kegagalan dan jangan berpura-pura bahwa data berhasil disimpan.
