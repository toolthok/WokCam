# Changelog

Semua perubahan penting pada proyek wokCam dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/); versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Rencana (Fase 2) — lihat [docs/11-roadmap.md](docs/11-roadmap.md)
- TTS nyata (ElevenLabs/Edge-TTS) + durasi riil per scene
- Persistensi proyek & sinkron dua arah Google Sheets
- Render MP4 nyata (FFmpeg / Remotion)
- Pencarian aset Pexels API langsung di tab Visual

## [0.1.0] — 2026-11-10

Rilis awal: mockup editor fungsional + seluruh playbook produksi Rp0.

### Ditambahkan
- **Editor timeline** bergaya studio (tema gelap, aksen violet):
  - Daftar scene dengan thumbnail, drag-reorder, tambah/duplikat/hapus
  - Pratinjau langsung 9:16 / 1:1 / 16:9 dengan gerakan Ken Burns real-time (CSS transform + rAF)
  - Timeline 4 track: Video, Suara (waveform simulasi), Musik, Teks
  - Transisi crossfade 0,1–1,5 s (default 0,5 s)
- **Impor Naskah AI**: tempel naskah → auto-split per kalimat → scene maks. 22 kata
- **Estimasi durasi otomatis** dari kecepatan bicara TTS Indonesia (2,4 kata/dtk) + override manual
- **Koleksi Animasi** (dialog): 8 preset bawaan dengan pratinjau bergerak CSS + simpan/hapus preset buatan sendiri (persist di `localStorage`, key `wokcam-presets`)
- **Panel Database Google Sheets**: struktur 12 kolom A–L, pratinjau live status per scene, ekspor **TSV siap tempel di A1** dan **CSV (BOM)** dengan quoting aman
- **Sumber Aset Gratis (Rp0)**: 18 situs × 7 kategori (video, foto, musik, SFX, TTS, gambar AI, font) dengan catatan lisensi + filter kategori
- **Voice-over**: 6 profil suara AI Indonesia (Sari/Arif/Dimas/Ratna/Bagas/Nayla) + kontrol speed/pitch/volume
- **Subtitle**: 5 preset (Karaoke Neon, TikTok Tebal, Kotak Sorot, Bersih, Tanpa Teks) + karaoke per kata (timing proporsional berbobot panjang kata) + 3 font (Poppins/Montserrat/Geist) + posisi & 5 warna aksen
- **Modal Export**: ringkasan proyek, salin naskah TTS, salin TSV untuk Sheets, simulasi tahapan render
- **Dialog Panduan Tool**: tabel biaya Rp0 per tahap, 4 kartu stack gratis, 6 langkah alur kerja, opsi SaaS berbayar ditunda ke bagian "nanti kalau sudah monetisasi"
- **Playbook dokumentasi** (`docs/` 11 dokumen) + template produksi (`templates/`: CSV database, prompt AI, checklist)
- **Aset demo**: 5 gambar scene vertikal 9:16 di `public/scenes/`
- Responsif: layout akordeon di layar < 1024px, uji 390px

### Teknis
- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand 5 · sonner · lucide-react
- Pemisahan tegas: `model.ts` (data) / `engine.ts` (fungsi murni) / `store.ts` (state) / `components/` (tampilan)
- ESLint: 0 error/warning

[Unreleased]: https://github.com/USERNAME/wokCam/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/USERNAME/wokCam/releases/tag/v0.1.0
