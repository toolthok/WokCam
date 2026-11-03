# WokCam

Video pendek dengan cepat: tulis narasi, app memilihkan gaya editing per kalimat, kamu mengoreksi, lalu ekspor. Tanpa timeline.

PWA statis, tanpa server. Aktifkan GitHub Pages (branch `main`, folder root) lalu buka URL-nya di browser Chromium.

## Yang sudah jalan
- Naskah dipecah per kalimat, gaya dipilih otomatis dari kamus pemicu (≥85% pasti, sisanya bertanda ?).
- 27 teknik: potongan visual, teks, efek, serta potong subjek dan ganti latar.
- Studio: upload footage, voice-over, dan latar pengganti; pratinjau; ekspor MP4/WebM.

## Dokumentasi
- [Dokumen proyek lengkap](docs/DOKUMEN_PROYEK.md): tujuan, arsitektur, katalog, format data, batasan, peta jalan sampai tujuan akhir.
- [Changelog](CHANGELOG.md)

## Struktur
```
index.html          aplikasi (CSS + HTML + JS)
sw.js               service worker
manifest.webmanifest, icon.svg
data/teknik.json    katalog teknik
data/pemicu.json    kamus pemicu
docs/               dokumentasi
```

## Berikutnya
Transkripsi VO dengan timestamp per kata, banyak klip, audio, ekspor lebih kuat, jalur ATM. Lihat peta jalan di dokumen proyek.
