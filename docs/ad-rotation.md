# Konfigurasi Iklan Choco AI

## Tujuan

Choco AI direncanakan sebagai layanan gratis tanpa akun dan tanpa paket berbayar. Iklan menjadi model pendanaan, bukan pembelian Premium atau pembayaran pengguna.

## Kondisi kode saat ini

- Slot native banner yang diberi label Adsterra tersedia di `public/index.html`; script memakai host pihak ketiga `bauval.org`. Kepemilikan publisher, kelayakan akun, dan tayangan nyata belum diverifikasi secara independen.
- Provider Adsterra adalah satu-satunya adapter yang saat ini diaktifkan pada rotasi.
- Monetizer dan slot provider tambahan tetap nonaktif sampai integrasi resmi yang valid tersedia.
- Smartlink/social-bar/popunder tidak diaktifkan oleh rotasi iklan. Iklan tidak boleh mengirim pesan chat, riwayat, atau preferensi percakapan ke provider.
- Pemuatan iklan tunduk pada pilihan persetujuan yang tersimpan di browser. Jika pengguna tidak menyetujui, loader iklan tidak dijalankan.
- Slot kosong tetap tersembunyi; kegagalan iklan tidak boleh memblokir chat.

## Sebelum pendaftaran iklan

1. Verifikasi akun publisher dan domain yang akan didaftarkan langsung pada dashboard penyedia.
2. Pastikan URL publik stabil, kebijakan privasi dan pengungkapan iklan sesuai, serta pengalaman pengguna tidak dipenuhi pop-up yang mengganggu.
3. Uji alur persetujuan iklan dan pastikan pilihan pengguna dihormati.
4. Jangan mengklaim tayangan atau pendapatan sebelum provider dashboard mengonfirmasinya.

## Batasan verifikasi

Kode dan smoke test hanya membuktikan perilaku yang diuji pada source. Kode tidak membuktikan persetujuan provider, validitas akun publisher, impresi, atau pendapatan. Monetizer belum memiliki integrasi yang dapat diuji.
