# 01 · Ikhtisar wokCam

> Peta dokumen: [02 Alur Kerja Rp0](02-alur-kerja-rp0.md) → | ← [Kembali ke README](../README.md)

## 1. Masalah yang dipecahkan

Membuat video faceless (video tanpa menampilkan wajah) untuk TikTok / Reels / Shorts punya tiga hambatan klasik:

1. **Biaya bulanan SaaS** — tool all-in-one seperti InVideo AI ($20/bln), Fliki ($28/bln), atau Pictory ($29/bln) membebankan langganan sebelum channel menghasilkan uang.
2. **Tidak ada jejak produksi** — naskah tercecer di chat AI, aset tercecer di folder download, status produksi hanya ada di kepala. Ketika satu video ternyata viral, tidak ada data tentang video itu yang bisa diulang.
3. **Gerakan visual tidak konsisten** — scene dibuat asal-asalan sehingga satu video terasa seperti rangkaian slide, bukan satu karya utuh.

**wokCam** menjawab ketiganya: seluruh tahap awal dikerjakan dengan tool **gratis (Rp0)**, setiap video **wajib punya baris database di Google Sheets**, dan konsistensi visual dijaga lewat **koleksi animasi preset** yang bisa diterapkan ke satu scene atau seluruh video sekaligus.

## 2. Komponen wokCam

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  AI CHAT     │    │  GOOGLE SHEETS   │    │  SUMBER ASET    │
│  (naskah)    │───▶│  (database per   │    │  GRATIS         │
│ ChatGPT/Gemini│    │   video, 12 kol) │    │  Pexels·Pixabay │
└─────────────┘    └────────┬─────────┘    │  TTSMaker·CapCut│
                            │              └────────┬────────┘
                            ▼                       ▼
                   ┌────────────────────────────────────┐
                   │        EDITOR wokCAM (repo ini)     │
                   │  Impor naskah · scene · timeline    │
                   │  koleksi animasi · subtitle · export│
                   └────────────────┬───────────────────┘
                                    ▼
                   ┌────────────────────────────────────┐
                   │  CapCut Desktop (render 1080p) →    │
                   │  TikTok / Reels / Shorts →          │
                   │  update kolom status di Sheets      │
                   └────────────────────────────────────┘
```

| Komponen | Fungsi | Lokasi |
|---|---|---|
| **Editor web** | Merakit scene, gerakan kamera, subtitle, durasi — blueprint visual sebelum render | `src/components/editor/` |
| **Koleksi Animasi** | 8 preset bawaan + preset buatan sendiri (tersimpan di `localStorage`) | `docs/05-koleksi-animasi.md` |
| **Database Sheets** | 12 kolom per video: naskah, aset, gerakan, voice, status | `docs/03-database-google-sheets.md` |
| **Sumber Aset Gratis** | 18 situs di 7 kategori, semua berlisensi bebas | `docs/04-aset-gratis.md` |
| **Panduan Rp0** | Tabel biaya nol per tahap + opsi berbayar untuk nanti | `docs/02-alur-kerja-rp0.md` · `docs/09-panduan-tool.md` |

## 3. Status proyek: mockup fungsional

Editor saat ini adalah **mockup UI fungsional** — semua interaksi nyata (klik scene, geser timeline, terapkan preset, ekspor TSV/CSV, simpan preset), tetapi:

- **Pratinjau** dirender di browser dengan CSS transform + `requestAnimationFrame`, bukan video asli.
- **Track Suara** menampilkan waveform *simulasi* (deterministik, bukan audio nyata).
- **Export** mensimulasikan proses render — belum menghasilkan file MP4.
- **Voice-over** belum memanggil TTS API; durasi dihitung dari estimasi kecepatan bicara.

Ini disengaja: blueprint UI dulu, mesin render belakangan. Rencana nyata (ElevenLabs/Edge-TTS API + FFmpeg/Remotion) sudah dirinci di [docs/11-roadmap.md](11-roadmap.md), dan pemetaan teknisnya di [docs/08-arsitektur-teknis.md](08-arsitektur-teknis.md).

## 4. Prinsip desain

1. **Rp0 dulu, SaaS nanti.** Tidak ada langganan di jalur produksi tahap awal. Opsi berbayar hanya muncul di bagian "nanti kalau sudah monetisasi".
2. **Satu video = satu baris set scene di Sheets.** Database bukan opsional — kolom status memaksa setiap video punya jejak: Draft → Siap → Render → Upload.
3. **Blueprint dulu, render belakangan.** Editor menghasilkan keputusan produksi (naskah per scene, gerakan, animasi masuk/keluar, durasi) yang 1:1 bisa dipindahkan ke CapCut atau ke mesin render sendiri nanti.
4. **Bahasa Indonesia untuk semua.** UI, dokumentasi, dan template prompt — supaya alur kerja tidak terpecah dua bahasa.

## 5. Untuk siapa?

- **Kreator solo** yang ingin mulai channel faceless tanpa modal.
- **Pembelajar** yang mau melihat arsitektur editor video berbasis web (Zustand + CSS transform engine) sebelum menulis mesin render sendiri.
- **Tim kecil** yang butuh alur kerja terdokumentasi agar 5 video per minggu tetap terkendali.
