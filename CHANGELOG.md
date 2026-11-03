# Changelog

## v6 (3 November 2026)
- VO diubah jadi subtitle bergaya film dengan timestamp per kata (Whisper lewat transformers.js, diunduh sekali dari CDN).
- Efek dipicu per kata lewat database kata → editing; database bisa diedit, diekspor/impor, dan belajar dari koreksi.
- Hingga 3 efek per subtitle; `jump-cut` dan `b-roll` kini punya efek.
- Perbaikan: pemotongan subjek terbalik (kini dibalik secara default, ada kotak centang untuk membalik lagi).
- Ekspor SRT.

## v5 (3 November 2026)
- Dokumen proyek lengkap di `docs/DOKUMEN_PROYEK.md`; README ditulis ulang.

## v4 (3 November 2026)
- Katalog naik dari 15 menjadi 27 teknik: Cutout Outline, Latar Blur, Ganti Latar, Subjek Mengecil, Subjek Geser, Miring, Zoom Out, Hitam Putih, Warna Pop, Pulse Beat, Cermin, RGB Split.
- Pemotong latar (MediaPipe Selfie Segmenter) dan unggahan latar pengganti.
- Kamus pemicu diperluas untuk teknik baru (tingkat konfirmasi).

## v3 (3 November 2026)
- Studio: upload footage dan voice-over, pratinjau kanvas 9:16, ekspor rekam real-time.
- Subtitel kata-per-kata (estimasi), tombol "Terima saran" menampilkan jumlah tersisa.

## v2 (3 November 2026)
- Rombak total: PWA "naskah → kartu segmen → gaya otomatis".
- 15 teknik inti dan kamus pemicu dua tingkat (auto/cek).

## v1.x
- Repo awal (katalog 63 teknik, prototipe PauseCut) diganti seluruhnya pada v2.
