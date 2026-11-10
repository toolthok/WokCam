# wokCam — Prototype Web (Studio Video Faceless)

Prototype web untuk **wokCam Mobile**: aplikasi penyusun video faceless (Android/Kotlin)
yang sedang dikembangkan sesuai PRD v1.0. Semua logika di repo ini dirancang sebagai
**sumber tunggal kontrak** yang nanti dipindah (hampir baris-per-baris) ke app Kotlin:

> Prompt Generator → ChatGPT → tempel hasil → validasi toleran → susun scene
> → atur animasi/transisi/style dari Koleksi → pratinjau → **rekam layar** jadi video.

**TANPA DATABASE.** Tidak ada Prisma/SQL/Google Sheets. Data hidup di objek JSON
dalam memori + `localStorage`:

| Kunci localStorage | Isi |
| --- | --- |
| `wokcam.koleksi.v1` | Koleksi Style (presets in/out/loop · transitions · styles) |
| `wokcam.proyek.v1` | Proyek timeline aktif (judul · rasio · scene + penugasan) |

## Halaman

| Rute | Fungsi |
| --- | --- |
| `/` | **Editor Timeline** — drag-reorder, trim durasi (2–15 s, langkah 0,5), edit teks langsung di blok, chip ⚡ transisi, penugasan animasi/style, katalog latar & overlay, undo/redo, autosave; proyek **Tutorial** 8 scene (contoh video + cara pakai) dan **Panduan** tur 10 langkah |
| `/generator` | Prompt naskah & prompt preset → salin ke ChatGPT/Claude → tempel balik → divalidasi |
| `/koleksi` | Koleksi Style: **deteksi otomatis dari video (tanpa AI)**, bedah video referensi lewat AI, impor JSON toleran, paket siap pakai (horror/minimalis), ekspor/impor berkas |
| `/unduhan` | Berkas untuk diunduh (repo ZIP + PRD) |

## Kontrak data (versi 1)

1. **Naskah** (`src/lib/naskah-parser.ts`) — `=== SCENE n ===` + `NASKAH/TEKS/DURASI/MOOD/LATAR`;
   DURASI 2–15 s langkah 0,5; MOOD tertutup: `tenang energik dramatis ceria misterius fokus`;
   ritme ±2,4 kata/detik.
2. **Koleksi** (`src/lib/preset-store.ts`) — `{version:1, presets:[{nama,tipe:"in|out|loop",gerakan,arah,durasi_ms,easing,intensitas,tag[],sfx}], transitions:[…], styles:[{nama,font,ukuran,warna_teks,tebal_outline,warna_outline,posisi,tag[]}]}`.
3. **Proyek timeline** (`src/lib/editor/proyek.ts`) — field naskah + penugasan
   `{animasi:{in,out,loop}, transisi_ke_berikutnya, style}`; ekspor via tombol **Ekspor** di editor.

## Menjalankan

```bash
bun install          # atau npm install
bun run dev          # http://localhost:3000
```

## Menguji (448 uji · 11 rangkaian)

```bash
bun scripts/test-parser.ts          # 37 — parser naskah
bun scripts/test-preset-store.ts    # 57 — koleksi, dedupe, prompt urai video
bun scripts/test-impor-toleran.ts   # 16 — impor JSON toleran (fence, basa-basi, terpotong)
bun scripts/test-koleksi-user.ts    # 33 — impor paket user & paket bawaan
bun scripts/test-horror-joglo.ts    # 21 — paket horror
bun scripts/test-alam-semesta.ts    # 43 — paket alam semesta
bun scripts/test-kuantum.ts         # 8  — naskah panjang
bun scripts/test-editor-proyek.ts   # 91 — model timeline: clamp durasi, reorder, pisah,
                                    #     serialisasi proyek, transisi, gelombang suara
bun scripts/test-promo-style.ts     # 56 — pratinjau WAAPI: keyframes animasi/transisi/style
bun scripts/test-tutorial.ts        # 68 — proyek tutorial: 8 scene, katalog latar/overlay
bun scripts/test-video-analyzer.ts  # 18 — deteksi transisi/loop/animasi/gaya dari frame video
```

## Struktur

```
src/lib/naskah-parser.ts   parser naskah (kontrak 1)
src/lib/preset-store.ts    koleksi + impor toleran (kontrak 2)
src/lib/editor/proyek.ts   model proyek + engine pratinjau (kontrak 3, fungsi murni)
src/lib/editor/store.ts    zustand: undo/redo + autosave
src/components/editor/     Timeline · PreviewCanvas · Inspector · SceneList ·
                           TopBar · AssignMenu · PickerKatalog · PanduanEditor ·
                           ImportNaskahDialog · ExportDialog
src/components/preset-preview.tsx  pratinjau animasi/transisi/style (WAAPI, dipakai
                                   koleksi & panggung editor — satu sumber keyframes)
scripts/test-*.ts          uji regresi bun
scripts/build_wokcam_zip.py  susun ZIP repo (kompatibel gitUploader)
docs/PROGRES.md            status, masalah terbuka, rencana berikutnya
docs/CHANGELOG.md          riwayat versi per rilis
```

Detail status & rencana: lihat [docs/PROGRES.md](docs/PROGRES.md).
Riwayat versi per rilis: lihat [docs/CHANGELOG.md](docs/CHANGELOG.md).
