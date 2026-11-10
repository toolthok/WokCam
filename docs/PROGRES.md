# PROGRES wokCam — Prototype Web

> Diperbarui: 10 November 2026 · Versi repo: **v0.2.0 — "Editor Timeline Baru"**
> Tahap PRD: ② web prototype (logika siap dipindah ke Kotlin; tahap ③ kerangka app)

## Yang sudah selesai

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
- **284 uji regresi di 8 rangkaian** (bun) — semuanya lulus; `tsc` bersih.
- Fungsi model timeline murni (tanpa React) supaya mudah diuji & diporting ke Kotlin.

## Yang masih bermasalah / keterbatasan

1. **Audio masih simulasi** — track "Suara" di timeline hanya estimasi kepadatan kata
   (gelombang deterministik); belum ada TTS nyata; field `sfx` di kontrak belum dipakai.
2. **Video keluaran masih rekam layar manual** — sesuai PRD untuk tahap ini, tapi belum ada
   perekaman/render otomatis.
3. **Generator → Editor belum tersambung otomatis** — hasil JSON/naskah masih disalin-tempel
   manual (belum ada tombol "kirim ke editor" via localStorage/berkas).
4. **Layar sentuh belum dioptimalkan** — drag/trim memakai pointer events dan bekerja di mouse;
   belum diuji/disesuaikan untuk HP (touch-action, target jempol).
5. **Uji #6 (proyek kuantum 48 scene) belum divalidasi otomatis** secara end-to-end di editor.
6. **Font pratinjau = pendekatan web** (kelas font menyerupai), bukan font asli — di Kotlin nanti
   memakai font asli.
7. **Latar pratinjau = gradien mood** + label kata kunci — belum ada gambar stok/AI nyata
   (LATAR baru berupa kata kunci pencarian).
8. **Satu slot proyek** — `wokcam.proyek.v1` hanya menyimpan proyek aktif; belum ada daftar
   multi-proyek.
9. Kilat kecil saat hidrasi: proyek contoh tampil sejenak sebelum proyek tersimpan dimuat.

## Rencana berikutnya (urutan usulan)

1. **Sinkronisasi Generator → Editor**: tombol "Kirim ke Editor" di halaman generator
   (localStorage handoff + toast), supaya tanpa salin-tempel manual.
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
