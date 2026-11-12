# PROGRES wokCam — Prototype Web

> Diperbarui: 11 November 2026 · Versi repo: **v0.9.0 — "Render video + geser aset di pratinjau"** (sebelumnya v0.4.x: Deteksi Video + Kirim ke Editor)
> Tahap PRD: ② web prototype (logika siap dipindah ke Kotlin; tahap ③ kerangka app)
> Riwayat versi per rilis: lihat [CHANGELOG.md](CHANGELOG.md)

## Yang sudah selesai

### Suara Gemini & tahan scene (v0.6)
- Provider Gemini (key user, cache IndexedDB), tahan playhead sampai narasi selesai, durasi dari audio asli.
- PERLU DIUJI dengan key nyata: nama model, batas kuota tier gratis, respons CORS dari browser.
- Berikutnya: audio Gemini ikut ke render video (WAV per scene sudah ada di cache).

### Suara TTS (v0.5)
- Dialog Suara + SuaraEngine (Web Speech API) sinkron playhead, ukur & cocokkan durasi. Perlu diuji di
  Chrome Android: ketersediaan suara "id-ID", perilaku volume 0, jeda antar-scene.
- Belum: suara ikut terekam di video (butuh TTS awan/berkas audio → fase render), pemetaan `sfx`.

### Deteksi dari video & serah-terima (v0.4)
- **Deteksi Otomatis dari Video** (Koleksi): transisi, loop, animasi masuk/keluar, gaya teks → usulan
  berpratinjau + centang → Koleksi. Analisis murni di `video-analyzer.ts` (18 uji sintetis lulus).
- **Kirim ke Editor** dari Generator (ganti / tambah), sekali pakai, bisa di-Undo.
- **PERLU DIVERIFIKASI di browser nyata**: sampler (`video-sampler.ts`) dan UI belum dijalankan
  (tsc penuh & `next build` belum dijalankan di lingkungan tanpa node_modules). Coba dengan video
  promo 30–60 dtk; sesuaikan ambang di `video-analyzer.ts` bila banyak salah deteksi.

### Gaya video referensi — promo tipografi terang (v0.3)
- **Bedah video referensi user** (69 dtk, promo ala opencode/insiderforce): latar putih
  dot-grid konsisten, teks muncul **kata-demi-kata** dengan penekanan campuran
  (tebal hitam / italic abu), kartu mockup melayang miring, badge pill atas + tanda air
  bawah persisten, transisi blur antar scene.
- **Vocab baru**: gerakan animasi `kata` (tipe in — render khusus per-kata, bukan keyframe
  blok) dan gerakan transisi `blur` (scene tua mengabur membesar, scene baru jernih dari
  kabur). Prompt generator ikut menyebutkan vocab baru.
- **Teks beranotasi**: penanda `**tebal**` dan `*miring*` di `scene.teks` diurai murni oleh
  `uraiTeks()` (tanda baca menempel kata; penanda tak berpasangan dibiarkan literal) —
  padanan Kotlin nanti: SpanStyle. Render: tebal = 1.12em hitam, miring = italic abu 62%.
- **Kartu mengambang** (`scene.kartu`): mockup putih miring −2,5° dengan bayangan lembut +
  kerangka UI (bar jendela, banner violet, baris abu) — pengganti screenshot video referensi;
  melayang pelan saat diputar.
- **Branding proyek**: `proyek.badge` (pill atas) + `proyek.watermark` (bawah) — tampil di
  SEMUA scene dan tidak ikut transisi; diedit di Inspector bagian "Branding proyek";
  serialisasi toleran (alias `lencana`/`tanda_air` diterima, nilai invalid → null).
- **Latar baru `kertas-grid`**: tekstur titik halus deterministik + flag `terang`
  (dekorasi gelap default dilepas; gradien pembacaan stage juga dilepas di latar terang).
- **PAKET_PROMO** (10 item: 4 animasi · 3 transisi · 3 style) — satu klik di Koleksi;
  otomatis masuk koleksi saat proyek tutorial dimuat (idempoten).
- **Proyek tutorial v2**: 8 scene tetap mengajarkan 6 langkah wokCam, kini BERGAYA VIDEO
  REFERENSI — semua scene kertas-grid (konsistensi branding), overlay tetap berganti per
  scene (8 overlay terpamerkan), 3 scene pakai kartu mengambang, badge "wokCam" + tanda air
  "@wokcam", animasi masuk dominan kata-demi-kata, transisi blur.
- **PanduanEditor 11 langkah**: tambah langkah Branding (badge & tanda air); langkah style
  kini menjelaskan penanda tebal/miring + animasi kata-demi-kata.
- **Label "wokCam" pojok pratinjau dihapus** — digantikan tanda air proyek yang bisa diedit.

### Generator & Koleksi (v0.1)
- Parser naskah toleran: `=== SCENE n ===`, field digabung satu baris, markdown dibersihkan,
  DURASI dijepit 2–15 s langkah 0,5, MOOD dinormalkan, `LATAR | EN:` dipisah.
- Generator prompt naskah & preset (anggaran kata, jumlah scene, CTA, aturan keluaran).
- Validasi preset toleran: nilai di luar daftar **diperbaiki + diberi catatan**, bukan ditolak diam-diam.
- Koleksi Style: impor 2 mode (gabung/ganti), dedupe `kategori|nama|ciri`, paket bawaan
  horror (6) & minimalis (6 animasi · 4 transisi · 4 style), ekspor/impor berkas, roundtrip stabil.
- Ekstraksi JSON dari keluaran AI yang "kotor": fence markdown, basa-basi, komentar,
  koma menggantung, balasan terpotong (deteksi + pesan yang menjelaskan).
- Prompt bedah video referensi (vibe opsional) + pratinjau animasi/transisi/style (WAAPI murni).

### Editor Timeline baru (v0.2 — pengganti editor versi database)
- **Editing langsung di timeline**: seret blok scene untuk urutkan, tarik tepi kanan untuk
  trim durasi (gelembung angka saat menarik), klik-dua-kali = kartu edit di atas blok
  (teks/naskah/durasi/mood), chip ⚡ antar blok untuk transisi.
- Toolbar aksi cepat: Tambah / Pisah (batas kalimat) / Duplikat / Hapus + penugasan
  Animasi Masuk · Loop · Keluar · Transisi→ · Style dari Koleksi (pratinjau per item,
  fallback "Masukkan Paket Minimalis" saat koleksi kosong).
- Inspector: field scene lengkap + penugasan + tombol "→ semua scene" per kategori.
- Pratinjau panggung: latar gradien mood + label kata kunci LATAR, teks dengan style Koleksi
  (font/ukuran/warna/outline/posisi), animasi teks in/out memakai keyframes yang sama dengan
  kartu pratinjau, gerak loop pada latar, transisi antar scene per batas
  (crossfade/slide/wipe/zoom/flip) dengan badge persentase.
- Undo/redo (≤60 langkah) + **autosave** localStorage; Impor Naskah (tempel naskah ATAU
  JSON proyek, mode ganti/tambah, contoh satu klik); Ekspor JSON proyek + panduan rekam layar.
- **Seluruh jejak database dihapus**: Prisma, SQLite, `/api`, DatabasePanel Google Sheets,
  ekspor TSV `SHEET_COLUMNS`, tab-tab editor lama, engine/model lama.

### Kualitas
- **430 uji regresi di 10 rangkaian** (bun) — semuanya lulus; `tsc` bersih. Rangkaian baru:
  `test-tutorial.ts` (68 — kontrak tutorial v2) dan `test-promo-style.ts` (56 — vocab kata/blur,
  uraiTeks, polaAnimasiKata, transisi blur, kertas-grid, badge/watermark/kartu).
- Fungsi model timeline murni (tanpa React) supaya mudah diuji & diporting ke Kotlin.

## Yang masih bermasalah / keterbatasan

1. **Audio masih simulasi** — track "Suara" di timeline hanya estimasi kepadatan kata
   (gelombang deterministik); belum ada TTS nyata; field `sfx` di kontrak belum dipakai.
2. **Video keluaran masih rekam layar manual** — sesuai PRD untuk tahap ini, tapi belum ada
   perekaman/render otomatis.
3. ~~Generator → Editor~~ — sudah tersambung (v0.4: tombol Kirim ke Editor).
4. **Layar sentuh belum dioptimalkan** — drag/trim memakai pointer events dan bekerja di mouse;
   belum diuji/disesuaikan untuk HP (touch-action, target jempol).
5. **Uji #6 (proyek kuantum 48 scene) belum divalidasi otomatis** secara end-to-end di editor.
6. **Font pratinjau = pendekatan web** (kelas font menyerupai), bukan font asli — di Kotlin nanti
   memakai font asli.
7. **Latar pratinjau = gradien/tekstur CSS** + label kata kunci — belum ada gambar stok/AI nyata
   (LATAR baru berupa kata kunci pencarian); kartu mengambang juga masih mockup CSS, bukan
   gambar nyata.
8. **Satu slot proyek** — `wokcam.proyek.v1` hanya menyimpan proyek aktif; belum ada daftar
   multi-proyek.
9. Kilat kecil saat hidrasi: proyek contoh tampil sejenak sebelum proyek tersimpan dimuat.
10. **Animasi kata-demi-kata dimainkan ulang dari awal scene** saat seek — pratinjau ok, tapi
   belum mengikuti posisi playhead di tengah reveal (perbaikan kecil nanti di Kotlin: offset
   delay dari waktu scene).

## Rencana berikutnya (urutan usulan)

1. ~~Sinkronisasi Generator → Editor~~ (selesai v0.4). Berikutnya: **uji deteksi video pada video nyata**
   & kalibrasi ambang; tambah deteksi "flip"; render video otomatis (MediaRecorder dari kanvas).
2. **Fase audio**: pemutaran TTS sinkron dengan playhead (pilih suara, kecepatan), pemetaan
   `sfx`, dan estimasi ulang durasi dari audio nyata.
3. **Mulai tahap ③ — kerangka app Kotlin**: port kontrak (naskah-parser, koleksi v1, proyek v1)
   + pratinjau scene; kontrak sudah stabil dan teruji.
4. **Uji sentuh & mobile**: touch-action untuk drag/trim, target ≥44 px, verifikasi di Chrome Android.
5. **Verifikasi otomatis uji #6** (48 scene) + uji proyek besar di editor (zoom, autosave).
6. **Multi-proyek** (daftar proyek tersimpan + salin/hapus) dan kelola varian/duplikat koleksi
   (filter berbasis tag — keputusan desain: tetap daftar datar + dedupe nama+ciri).

## Catatan porting ke Kotlin

- Semua daftar tertutup ada di `naskah-parser.ts` (MOODS) dan `preset-store.ts`
  (GERAKAN/EASING/ARAH/POSISI) — jadikan enum di Kotlin dari sumber yang sama.
- `proyek.ts` sengaja fungsi murni → padanan langsung di Kotlin (data class + fungsi).
- Keyframes pratinjau (`preset-preview.tsx`) memakai WAAPI → padanan Compose `Animatable`/
  `TweenSpec` dengan kurva easing yang sama (`cssEasing`).
- Autosave: ganti `localStorage` dengan berkas JSON di storage internal app.
