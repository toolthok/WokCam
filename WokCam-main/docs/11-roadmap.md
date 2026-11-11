# 11 · Roadmap

> Peta dokumen: [10 Strategi Konten](10-strategi-konten.md) ← | → [Kembali ke README](../README.md)

Rencana evolusi wokCam dalam tiga fase. Fase 1 sudah berjalan; Fase 2 adalah lompatan teknis utama (render nyata); Fase 3 adalah otomasi.

## Fase 1 — Blueprint & alur manual (SEKARANG) ✅

Status: **selesai** sebagai mockup fungsional.

- [x] Editor lengkap: scene list, pratinjau Ken Burns, timeline 4 track, inspector 4 tab
- [x] Impor Naskah AI: auto-split kalimat → scene (maks. 22 kata) + estimasi durasi 2,4 kata/dtk
- [x] 8 preset koleksi animasi + preset buatan sendiri (`localStorage` `wokcam-presets`)
- [x] Database Google Sheets: panel 12 kolom, ekspor TSV (tempel A1) & CSV (BOM)
- [x] Sumber aset gratis: 18 situs × 7 kategori dengan catatan lisensi, filter per kategori
- [x] Subtitle: 5 preset, karaoke per kata (timing proporsional), 3 font, posisi & aksen
- [x] Panduan Rp0: tabel biaya, stack gratis, 6 langkah kerja, opsi berbayar ditunda
- [x] Produksi video tetap via CapCut Desktop sesuai blueprint editor

## Fase 2 — Render nyata & voice nyata (BERIKUTNYA) 🚧

Prioritas urut; pemetaan teknis rinci ada di [08-arsitektur-teknis.md §7](08-arsitektur-teknis.md).

### 2.1 TTS nyata
- Integrasi penyedia TTS (kandidat: **ElevenLabs** — kualitas + timestamp per kata; **Edge-TTS** — gratis, suara Indonesia; **TTSMaker API** bila tersedia).
- Mapping `VOICES[].id` → ID suara provider; slider speed/pitch → parameter API.
- Durasi riil per scene menggantikan `estimateDuration()` — timeline & karaoke otomatis akurat.
- Simpan MP3 per scene (`voice/{video_id}/{no_scene}.mp3`).

### 2.2 Persistensi proyek
- Simpan/lanjutkan proyek ke `localStorage` (langkah pertama) dan ekspor JSON proyek (langkah kedua).
- Sinkron dua arah Google Sheets: impor baris → scene, edit scene → update baris (menggantikan tempel TSV manual).

### 2.3 Render MP4
- Jalur A — **FFmpeg** di kontainer: naskah→TTS → klip per scene (Ken Burns via `zoompan`) → `xfade` → subtitle burn-in → H.264 1080p/30.
- Jalur B — **Remotion**: komposisi React yang memakai `Scene` JSON yang sama (struktur data saat ini sudah dirancang 1:1 untuk ini).
- UI: modal Export diganti dari simulasi → pekerjaan render nyata dengan progress per scene.

### 2.4 Aset API
- Pexels/Pixabay API untuk pencarian visual langsung di tab Visual (tanpa keluar editor).
- Sisipkan musik dari file lokal (track Musik jadi nyata).

### 2.5 Kualitas
- Unit test `engine.ts` (durasi, timing, TSV, karaoke) — fungsi murni siap dites.
- Typecheck ketat (hapus `ignoreBuildErrors`).

## Fase 3 — Otomasi & skala 🔮

- **Pipeline 1-klik**: Sheets baris baru → naskah → TTS → render → draf upload, hanya perlu approve.
- **Jadwal upload**: antrean per platform (TikTok/Reels/Shorts) dengan API resmi atau semi-otomatis (notifikasi + tombol buka).
- **Sinkron preset animasi** lintas perangkat (ke Sheets/Gist, bukan hanya localStorage).
- **Multi-bahasa**: naskah satu sumber → terjemahan + voice lokal per bahasa.
- **Analitik balik**: tarik metrik 24 jam pertama ke kolom Sheets otomatis.
- **Batch render**: antrian beberapa video sekaligus dengan prioritas.

## Prinsip antar fase

1. **Database dulu, otomasi kemudian.** Fase 1 memaksa data rapi; otomasi Fase 3 hanya mungkin karena itu.
2. **Struktur `Scene` stabil.** Mockup dan mesin render berbagi satu struktur data — tidak ada migrasi besar.
3. **Rp0 selama mungkin.** Setiap komponen berbayar (TTS API pay-as-you-go, VPS render) masuk hanya kalau sudah ada pendapatan — sejalan dengan [09-panduan-tool.md](09-panduan-tool.md).

---

Riwayat perubahan versi: [CHANGELOG.md](../CHANGELOG.md) · Kontribusi: [CONTRIBUTING.md](../CONTRIBUTING.md)
