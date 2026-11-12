# CHANGELOG wokCam

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/);
versi mengikuti SemVer (`MAJOR.MINOR.PATCH` — tahap prototype memakai 0.x).

> Rincian status & rencana: lihat [PROGRES.md](PROGRES.md).

## [0.12.0] — 2026-11-12

Tema: **Aset bawaan untuk slot prompt.**

### Ditambahkan
- 6 aset SVG generik di `public/aset/` (chart persen, kartu kode gelap, kartu prompt putih, tombol bulat 3D,
  logo mahkota, kartu foto bingkai) + katalog `lib/editor/aset-bawaan.ts`.
- Prompt rancangan memakai `jenis_aset`: slot yang cocok langsung terisi aset bawaan, tanpa perlu diisi berkas.
- Docs: `docs/ANTRIAN.md` diperbarui dengan hasil bedah video 52 detik.

### Batas yang diketahui
- Mockup buku 3D dan screenshot web belum ada sebagai aset bawaan.
- Analyzer masih lemah pada video dengan hard cut rapat (lihat B11).

## [0.11.0] — 2026-11-12

Tema: **Teks terbaca di semua latar + saran aset dari prompt.**

### Ditambahkan
- **Kontras teks otomatis** (pratinjau dan render): bila warna teks tidak kontras ≥ 4,5 terhadap latar,
  warnanya diganti ke charcoal atau putih, mana yang lebih terbaca. Berlaku untuk latar gelap, hijau, maupun terang.
- Latar **Putih Polos** baru (gaya referensi terang).
- **Saran aset dari prompt**: prompt meminta slot aset per scene (`aset_slot`) dengan keterangan dan kata
  kunci pencarian. Di editor, slot muncul di panel Aset sebagai placeholder berstatus “Belum ada berkas”
  dan bisa diisi langsung dengan tombol 📁 Isi berkas.
- Prompt rancangan meminta latar terang dan teks gelap, sesuai gaya referensi.
- `scripts/test-kontras.ts` (9 uji).

### Batas yang diketahui
- Slot yang belum diisi belum tampil sebagai kotak di pratinjau; hanya di panel.
- Dua video referensi belum dianalisis: belum terlampir di folder unggahan.

## [0.10.1] — 2026-11-12

### Diperbaiki
- Build GitHub Actions gagal: `'use client'` harus berada di baris paling atas. Import antrian di `store.ts` dipindah ke bawahnya.

## [0.10.0] — 2026-11-12

Tema: **Prompt Generator mengerjakan ±50% + teks bisa digeser per keyframe.**

### Ditambahkan
- **Mode Rancangan visual** di Generator: prompt meminta JSON proyek lengkap (scene, durasi, teks,
  gaya, animasi, transisi, latar, overlay, kartu, keyframe teks, slot aset, dan `kebutuhan_baru`).
  Hasil JSON ditempel → ringkasan → Kirim ke Editor / Tambah ke proyek.
- **Keyframe posisi teks**: geser teks langsung di pratinjau (saat scene dipilih) — setiap gerak menulis
  keyframe pada posisi playhead; posisi di antara keyframe digeser linear. Tab Teks punya editor keyframe
  (waktu, X, Y, hapus, + di playhead). Renderer memakai posisi yang sama.
- **Antrian kebutuhan**: `kebutuhan_baru` dari hasil AI dicatat ke antrian lokal (`wokcam.antrian.v1`).
  Daftar utama ada di `docs/ANTRIAN.md`.
- `lib/editor/teks-kf.ts` (murni) + `scripts/test-teks-kf.ts` (11 uji), `lib/editor/prompt-rancangan.ts`, `lib/editor/antrian.ts`.

### Batas yang diketahui
- Keyframe teks belum tampil di timeline; hanya di tab Teks dan drag di pratinjau.
- Slot aset dari AI (`aset_slot`) belum punya UI; ditolak diam-diam.
- Belum diuji di perangkat nyata.

## [0.9.2] — 2026-11-11

### Diperbaiki
- Render hanya menghasilkan ±1,4 dtk dari 52 dtk, padahal loop render berjalan penuh (3100 frame).
  Perekaman berhenti menulis data. Perubahan: WebM (VP8) diutamakan dibanding MP4, dan track audio
  kosong tidak lagi dipasang bila tidak ada suara.

## [0.9.1] — 2026-11-11

### Diperbaiki / Diagnosis
- Video render terbaca sangat pendek (±0,01 dtk) di perangkat uji. Penyebab belum dipastikan.
  Dialog render sekarang menampilkan durasi target, durasi waktu nyata, jumlah frame, dan durasi
  yang terbaca dari berkas, sehingga bisa dibedakan: rekaman berhenti awal, atau metadata berkas rusak.

## [0.9.0] — 2026-11-11

Tema: **Render video di browser + geser/ubah aset langsung di pratinjau.**

### Ditambahkan
- **Render video** (tombol 🎬 Render di TopBar). Menggambar ulang setiap scene ke kanvas, memutar audio
  Gemini per scene, lalu merekam dengan MediaRecorder. Format: MP4 bila didukung, jika tidak WebM.
  Hasil bisa diunduh, atau dibagikan lewat share sheet Android.
- Render memakai resolusi 720×1280 (9:16), 1080×1080 (1:1), atau 1280×720 (16:9).
- **Geser & ubah ukuran aset di pratinjau**: seret aset untuk memindahkan, seret kotak di pojok kanan bawah
  untuk mengubah lebar. Aktif saat scene dipilih.
- `lib/editor/render-math.ts` (murni: animasi masuk/keluar, loop, transisi, warna) + `scripts/test-render-math.ts` (23 uji).
- `lib/editor/render-video.ts` (renderer kanvas) dan `components/editor/RenderDialog.tsx` (UI).

### Batas yang diketahui
- Render berjalan **sebenar waktu**: video 60 dtk membutuhkan ±60 dtk. Layar harus tetap menyala.
- Suara browser (Web Speech) tidak ikut; hanya audio Gemini.
- Font memakai sans-serif sistem, bukan font pratinjau. Grain dan bokeh tidak digambar.
- Animasi di renderer memakai kurva linear, jadi gerakannya bisa sedikit berbeda dari pratinjau.
- Belum diuji di perangkat nyata. Hasilnya perlu dicek visual sebelum dianggap identik dengan pratinjau.

## [0.8.0] — 2026-11-11

Tema: **Inspector per komponen (tab) + animasi & gaya di setiap komponen.**

### Diubah
- Inspector dikelompokkan dalam tab: **Scene** (durasi, mood, transisi) · **Teks** (isi, naskah, anim masuk/keluar,
  gaya teks) · **Latar** (tema, overlay efek, anim masuk/keluar latar, gerak loop) · **Kartu** (judul, anim
  masuk/keluar) · **Aset** (foto/video). Branding proyek tetap di atas.
- `BarisAssign` dipindah ke komponen sendiri (`components/editor/BarisAssign.tsx`) agar dipakai juga di panel aset.

### Ditambahkan
- **Latar**: animasi masuk & keluar (`animLatar`); gerak loop tetap (`animLoop`) dan kini diatur di tab Latar.
- **Kartu**: animasi masuk & keluar (`animKartu`).
- **Aset**: gaya (Polos / Bulat / Bingkai / Bayangan), serta animasi masuk, keluar, dan loop per aset.
  Animasi aset bisa di-scrub saat jeda (posisi sesuai playhead).
- "→ semua" untuk anim latar dan kartu (menerapkan ke semua scene).

### Batas yang diketahui
- Animasi latar, kartu, dan teks baru berjalan saat diputar (belum saat scrub), seperti sebelumnya.
- Belum diuji di browser: pastikan preset Koleksi yang tipenya cocok (in/out/loop) muncul di pemilih tiap tab.

## [0.7.0] — 2026-11-11

Tema: **Lebih sederhana di timeline + aset overlay foto/video.**

### Diubah
- Daftar scene di bawah/samping timeline **dihapus** dari layout. Pilih scene cukup dengan klik blok di timeline.
- **Klik scene saat ▶ Putar** → video otomatis jeda dan jarum langsung di awal scene yang dipilih.

### Ditambahkan
- **Aset overlay foto & video** per scene (Inspector → "Aset overlay"): banyak aset sekaligus (mis. foto 1,
  foto 2, video 3). Atur posisi X/Y, lebar, transparansi, detik muncul, dan durasi tampil.
- Video overlay mengikuti playhead (main, jeda, scrub) dan selalu dibisukan.
- Gambar dikecilkan otomatis (≤1280 px) sebelum disimpan; berkas disimpan di IndexedDB perangkat.
- `lib/editor/aset-store.ts` (penyimpanan berkas), `components/editor/AsetOverlay.tsx` (render),
  `components/editor/AsetPanel.tsx` (Inspector).

### Batas yang diketahui
- Aset hanya tersimpan di perangkat yang sama (berkas tidak ikut ekspor JSON).
- Posisi diatur lewat slider; geser langsung di pratinjau belum ada.
- Hapus-aset tidak bisa dikembalikan dengan Undo (berkasnya sudah dibuang).

## [0.6.0] — 2026-11-11

Tema: **Suara Gemini + suara tidak terpotong.**

### Ditambahkan
- Penyedia suara **Gemini TTS** (key milik user, dikirim langsung ke Google; audio asli, jalan di semua browser).
  Audio per scene di-cache permanen (IndexedDB, kunci = teks+model+suara+gaya) → tak dibuat ulang,
  hemat kuota tier gratis; otomatis menunggu & mencoba ulang saat kena batas (429).
- **Tahan scene sampai suara selesai**: bila narasi masih berjalan di akhir scene, playhead menunggu
  (berlaku untuk suara browser maupun Gemini). Bisa dimatikan.
- Resume di tengah scene dengan audio Gemini tepat ke posisi playhead.
- Setelah "Buat suara semua scene", durasi disarankan dari panjang audio sebenarnya → Terapkan (Undo).
- `lib/editor/suara-audio.ts` (murni) + `scripts/test-suara-audio.ts` (31 uji).

### Batas yang diketahui
- Model Gemini TTS masih preview (nama bisa berubah; kolom model bisa diedit). Belum diuji dengan key nyata.
- Suara belum otomatis tersambung ke ekspor video (fase render).

## [0.5.0] — 2026-11-11

Tema: **Suara (TTS) di editor** — gratis, tanpa key, tanpa server.

### Ditambahkan
- Tombol **Suara** di TopBar → dialog: pilih suara (Bahasa Indonesia diprioritaskan), kecepatan, nada, tes.
- **SuaraEngine**: saat ▶ Putar, naskah tiap scene dibacakan mengikuti playhead (resume di tengah scene
  melompati kata yang sudah lewat; loncat/ulang aman).
- **Ukur & cocokkan durasi**: membacakan tiap scene (volume 0) untuk mengukur lama bicara nyata →
  menyarankan durasi (langkah 0,5 dtk, 2–15 dtk) → Terapkan (bisa di-Undo).
- `lib/editor/suara-util.ts` (murni) + `scripts/test-suara.ts` (16 uji).

### Batas yang diketahui
- Memakai Web Speech API: suara TIDAK ikut terekam ke berkas video; pengukuran volume 0 tidak
  dihormati sebagian perangkat; belum diuji di browser nyata.

## [0.4.2] — 2026-11-11

### Dihapus
- Sisa editor lama yang tak terpakai & gagal type-check saat `next build`: `AnimationLibrary`, `DatabasePanel`,
  `ExportModal`, `ToolGuidePanel`, `editor/tabs/*`, `lib/editor/engine.ts`, `lib/editor/model.ts`.

## [0.4.1] — 2026-11-11

### Diubah
- Ekspor statis (`output: "export"`) + workflow `.github/workflows/pages.yml` → deploy ke GitHub Pages
  (tanpa Vercel/Termux). Rute dummy `/api` dihapus (tidak dipakai).

## [0.4.0] — 2026-11-11

Tema: **Deteksi gaya langsung dari video (tanpa AI)** + serah-terima Generator → Editor.

### Ditambahkan
- **Deteksi Otomatis dari Video** di halaman Koleksi: pilih video referensi → dibaca di
  perangkat (tidak diunggah) → usulan **transisi** (potong/pudar silang/blur/sapuan+arah/geser+arah/zoom),
  **loop** (pan 4 arah, zoom in/out), **animasi teks masuk/keluar** (fade/slide+arah/wipe/zoom/shrink/
  kata-demi-kata) dan **gaya teks** (warna, outline, posisi, ukuran, tebal font). Hasil tampil dengan
  pratinjau + kotak centang, lalu disimpan lewat jalur impor Koleksi yang sama (validasi + dedupe).
- `src/lib/video-analyzer.ts` — analisis murni (tanpa DOM, siap diport ke Kotlin);
  `src/lib/video-sampler.ts` — pencuplik frame browser; `components/koleksi/DeteksiVideo.tsx` — UI.
- **Kirim ke Editor**: tombol di Generator (ganti proyek / tambah ke proyek) lewat serah-terima
  localStorage sekali pakai (`wokcam.kirim.v1`); hasil "Perbaiki Ritme" ikut terbawa; bisa di-Undo.
- `scripts/test-video-analyzer.ts` — 18 uji sintetis (potong, pudar silang, blur, sapuan, geser, pan,
  statis, animasi masuk fade/slide, gaya teks, integrasi koleksi).

### Batas yang diketahui
- Transisi "flip" belum dikenali; animasi teks hanya terbaca pada latar yang relatif diam;
  font hanya ditebak dari ketebalan goresan. Belum diuji pada video nyata di browser.

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
