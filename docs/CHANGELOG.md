# CHANGELOG wokCam

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/);
versi mengikuti SemVer (`MAJOR.MINOR.PATCH` — tahap prototype memakai 0.x).

> Rincian status & rencana: lihat [PROGRES.md](PROGRES.md).

## [0.3.0] — 2026-11-11

Tema: **Gaya video referensi — promo tipografi terang** (meniru video promo
69 dtk ala opencode/insiderforce) + packaging ZIP repo.

### Ditambahkan
- Gaya latar putih dot-grid konsisten (`kertas-grid`, flag `terang`) dengan
  dekorasi gelap default dilepas.
- Vocab baru: gerakan animasi `kata` (tipe in — reveal kata-demi-kata, render
  khusus per-kata) dan gerakan transisi `blur` (scene tua mengabur membesar,
  scene baru jernih dari kabur). Prompt generator ikut menyebutkan vocab baru.
- Teks beranotasi: penanda `**tebal**` dan `*miring*` di `scene.teks` diurai
  `uraiTeks()` — render tebal 1.12em hitam, miring italic abu 62%
  (padanan Kotlin: SpanStyle).
- Kartu mengambang (`scene.kartu`): mockup putih miring −2,5° dengan kerangka
  UI, melayang pelan saat diputar.
- Branding proyek: `proyek.badge` (pill atas) + `proyek.watermark` (bawah) —
  tampil di semua scene, tidak ikut transisi; diedit di Inspector
  "Branding proyek"; serialisasi toleran (alias `lencana`/`tanda_air`).
- **PAKET_PROMO** (10 item: 4 animasi · 3 transisi · 3 style) — satu klik di
  Koleksi; otomatis masuk koleksi saat proyek tutorial dimuat (idempoten).
- Proyek tutorial v2: 8 scene mengajarkan 6 langkah wokCam, kini bergaya video
  referensi (semua scene kertas-grid, 8 overlay dipamerkan, 3 kartu mengambang,
  badge "wokCam" + tanda air "@wokcam", dominan animasi kata, transisi blur).
- PanduanEditor: tur interaktif kini **11 langkah** (tambah langkah Branding;
  langkah style menjelaskan teks beranotasi + animasi kata).
- ZIP repo terkontrol versi: `scripts/build_wokcam_zip.py` menyusun staging
  bersih (v0.3.0, 112 file), verifikasi CRC/kompresi, salin ke `public/` untuk
  halaman `/unduhan`.

### Diubah
- Label "wokCam" di pojok pratinjau dihapus — digantikan tanda air proyek
  yang bisa diedit.
- README & docs dimutakhirkan (angka uji, struktur komponen).

### Kualitas
- **430 uji regresi di 10 rangkaian** (bun) — semua lulus; `tsc` bersih.
  Rangkaian baru: `test-promo-style.ts` (56) dan `test-tutorial.ts` (68).

## [0.2.0] — 2026-11-10

Tema: **Editor timeline baru** menggantikan editor versi database.

### Ditambahkan
- Editing langsung di timeline: seret blok scene untuk urutkan, tarik tepi
  kanan untuk trim durasi (2–15 s, langkah 0,5, gelembung angka), klik-dua-kali
  = kartu edit (teks/naskah/durasi/mood), chip ⚡ antar blok untuk transisi.
- Toolbar aksi cepat: Tambah / Pisah (batas kalimat) / Duplikat / Hapus.
- Penugasan Animasi Masuk · Loop · Keluar · Transisi→ · Style dari Koleksi
  (pratinjau per item; fallback "Masukkan Paket Minimalis" saat koleksi kosong).
- Inspector: field scene lengkap + tombol "→ semua scene" per kategori.
- Pratinjau panggung: latar gradien mood, teks dengan style Koleksi, animasi
  in/out, gerak loop latar, transisi antar scene (crossfade/slide/wipe/zoom/
  flip) dengan badge persentase.
- Undo/redo (≤60 langkah) + autosave `localStorage` (`wokcam.proyek.v1`).
- Impor Naskah (tempel naskah ATAU JSON proyek; mode ganti/tambah; contoh
  satu klik) dan Ekspor JSON proyek + panduan rekam layar.
- PickerKatalog: katalog latar (10 tema gradien) & overlay (8 efek) bawaan
  aplikasi — terpisah dari Koleksi Style milik user.
- ZIP repo otomatis pertama (v0.2.0) + `scripts/uji-semua.sh`.

### Dihapus
- **Seluruh jejak database**: Prisma, SQLite, route `/api`, DatabasePanel
  Google Sheets, ekspor TSV `SHEET_COLUMNS`, tab editor lama, engine/model lama.
  Data kini hidup di memori + `localStorage` saja.

### Kualitas
- Rangkaian uji baru `test-editor-proyek.ts` (kini 91 uji): clamp durasi,
  reorder, pisah scene, serialisasi proyek, transisi, gelombang suara.

## [0.1.0] — 2026-11-10

Tema: **Fondasi kontrak** — naskah, koleksi, generator.

### Ditambahkan
- Parser naskah toleran: `=== SCENE n ===`, field digabung satu baris,
  markdown dibersihkan, DURASI dijepit 2–15 s langkah 0,5, MOOD dinormalkan
  (tenang/energik/dramatis/ceria/misterius/fokus), `LATAR | EN:` dipisah,
  ritme ±2,4 kata/detik.
- Generator prompt naskah & preset (anggaran kata, jumlah scene, CTA,
  aturan keluaran JSON).
- Validasi preset toleran: nilai di luar daftar **diperbaiki + diberi
  catatan**, bukan ditolak diam-diam.
- Koleksi Style: impor 2 mode (gabung/ganti), dedupe `kategori|nama|ciri`,
  paket bawaan horror (6) & minimalis (6 animasi · 4 transisi · 4 style),
  ekspor/impor berkas, roundtrip stabil.
- Ekstraksi JSON dari keluaran AI yang "kotor": fence markdown, basa-basi,
  komentar, koma menggantung, balasan terpotong (deteksi + pesan menjelaskan).
- Prompt bedah video referensi (vibe opsional).
- Pratinjau animasi/transisi/style memakai WAAPI murni
  (`src/components/preset-preview.tsx` — satu sumber keyframes untuk koleksi
  dan panggung editor).

### Kualitas
- Rangkaian uji bun pertama: parser (37), preset-store (57), impor-toleran
  (16), koleksi-user (33), horror-joglo (21), alam-semesta (43), kuantum (8).
