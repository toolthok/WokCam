# 08 · Arsitektur Teknis

> Peta dokumen: [07 Panduan Editor UI](07-editor-ui.md) ← | → [09 Panduan Tool](09-panduan-tool.md)

Dokumen ini menjelaskan bagaimana kode disusun, bagaimana "mesin" pratinjau bekerja, dan spesifikasi teknis untuk migrasi ke render nyata.

## 1. Stack

| Lapisan | Teknologi |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| State | **Zustand 5** (satu store global, tanpa Context) |
| Ikon / toast | lucide-react / sonner |
| Font | Geist, Poppins, Montserrat (via `next/font`) |
| Runtime | Node ≥ 20 atau Bun ≥ 1.1 · tanpa API key · tanpa database |

## 2. Struktur folder

```
src/
├── app/
│   ├── layout.tsx              # Font global, metadata, Toaster (theme dark)
│   ├── page.tsx                # Komposisi editor + PlaybackEngine + shortcut Spasi
│   └── globals.css             # Tema + keyframe pratinjau preset (kb-zoom-*, kb-pan-*)
├── components/
│   ├── editor/
│   │   ├── TopBar.tsx          # Brand, nama proyek, rasio, akses dialog
│   │   ├── SceneList.tsx       # Daftar scene, impor naskah, reorder
│   │   ├── PreviewCanvas.tsx   # Pratinjau Ken Burns + subtitle karaoke
│   │   ├── Timeline.tsx        # 4 track: video/suara/musik/teks
│   │   ├── Inspector.tsx       # Wadah 4 tab (Naskah/Suara/Visual/Teks)
│   │   ├── tabs/               # NaskahTab · SuaraTab · VisualTab · TeksTab
│   │   ├── AnimationLibrary.tsx# Dialog Koleksi Animasi (pratinjau CSS per preset)
│   │   ├── DatabasePanel.tsx   # Dialog Google Sheets (TSV/CSV)
│   │   ├── ExportModal.tsx     # Dialog ekspor (simulasi render)
│   │   └── ToolGuidePanel.tsx  # Dialog Panduan Rp0
│   └── ui/                     # Komponen shadcn/ui
└── lib/
    └── editor/
        ├── model.ts            # Tipe + data statis (scene, voices, preset, sumber, kolom sheets)
        ├── engine.ts           # Matematika: durasi, timing, Ken Burns, karaoke, TSV
        └── store.ts            # Zustand: seluruh state + aksi editor
```

**Prinsip pemisahan:** `model.ts` = *data & tipe*, `engine.ts` = *fungsi murni (pure, mudah dites)*, `store.ts` = *state & aksi*, `components/` = *tampilan saja*. Tidak ada komponen yang menghitung matematika sendiri — semuanya memanggil `engine.ts`.

## 3. Model data

```ts
interface Scene {
  id: string                     // "s1", "s2", … (custom: newId())
  script: string                 // naskah scene (dibaca TTS)
  durationOverride: number|null  // durasi manual (detik) atau null = otomatis
  motion: Motion                 // 'zoom-in'|'zoom-out'|'pan-left'|'pan-right'|'pan-up'|'pan-down'|'static'
  animIn: AnimIn                 // 'fade'|'slide-up'|'slide-down'|'zoom'|'none'
  animOut: AnimOut               // 'fade'|'slide-down'|'zoom'|'none'
  loop: boolean                  // gerakan berulang vs sekali
  image: string                  // path/URL visual
  gradient: string               // kelas Tailwind fallback (from-x to-y)
  assetSource: 'stock'|'ai'|'upload'
  assetLabel: string             // label sumber (masuk kolom `aset` saat ekspor)
  status: 'ready'|'pending'      // → 'Siap'|'Draft' di Sheets
}
```

Proyek lengkap = `scenes[]` + `voice{voiceId,speed,pitch,volume}` + `caption{preset,font,size,position,highlight,accent}` + `music{name,volume,enabled}` + `aspect` + `transition` + `zoom` + `projectName`.

## 4. Mesin pratinjau

### 4.1 Waktu & durasi

- `WORDS_PER_SEC = 2.4` — asumsi TTS Indonesia (140–150 kata/menit).
- `estimateDuration(script, speed) = clamp(kata / (2.4·speed) + 0.8, 2.5, 30)`.
- `withTimings(scenes)` menghitung `Segment[]` berisi `start/end/dur` kumulatif — dasar untuk timeline, karaoke, dan render list.
- Playback: `PlaybackEngine` (di `page.tsx`) memakai `requestAnimationFrame`, delta dibatasi 50 ms, berhenti otomatis di akhir total.

### 4.2 Ken Burns (`motionTransform`)

Gerakan kamera dinyatakan sebagai **CSS transform** murni — tanpa canvas, tanpa WebCodecs:

```ts
// parametr: g = 0.16 (besar zoom), pan = 7 (% translate maksimum)
zoom-in   → scale(1 + g·p)                  // p = progres 0..1 scene
zoom-out  → scale(1 + g·(1−p))
pan-left  → scale(1 + g·0.6) translateX((0.5−p)·7%)
pan-right → scale(1 + g·0.6) translateX((p−0.5)·7%)
pan-up    → scale(1 + g·0.6) translateY((0.5−p)·7%)
pan-down  → scale(1 + g·0.6) translateY((p−0.5)·7%)
```

- Jika `loop = true`, progres memakai `p` penuh dan pratinjau bergantian arah (ease-in-out) — seperti kamera "bernapas".
- Jika `loop = false`, gerakan selesai di 40% durasi (`p/0.4`) lalu diam — efek *settle*.

### 4.3 Transisi & entrance (`getRenderList`)

Pada setiap frame, fungsi mengembalikan **daftar layer** yang harus digambar:

- Layer dasar = scene aktif dengan `motion: local/dur`.
- Jika `t` berada dalam jendela transisi (0,5 s sebelum akhir scene), scene berikutnya ditambahkan di atas dengan `entrance` 0→1 → **crossfade**.
- `entranceStyle()` menerjemahkan `animIn` menjadi opacity/transform dengan easing cubic (`1−(1−e)³`): fade = opacity; slide = translateY ±10%; zoom = scale 0.82→1.

Karena render adalah "daftar layer per waktu", pipeline render nyata nanti tinggal mengganti implementasi CSS dengan komposisi frame (Remotion/FFmpeg) tanpa mengubah logika keputusan.

### 4.4 Subtitle karaoke (`wordTimings`)

- Kata diberi bobot `max(2, panjangHuruf+1)` — kata panjang tampil lebih lama, proporsional.
- Timing kumulatif dinormalisasi ke durasi scene → tiap kata punya `start/end`.
- `PreviewCanvas` menyorot kata yang sedang berjalan dengan warna aksen preset.
- Saat TTS API nyata memberi timestamp kata, fungsi ini tinggal diganti sumbernya — komponen tidak berubah.

## 5. State (Zustand)

Satu store `useEditor` berisi seluruh state + aksi. Aksi penting:

| Grup | Aksi |
|---|---|
| Scene | `addScene`, `deleteScene`, `duplicateScene`, `moveScene`, `reorder`, `updateScene`, `splitScene`, `summarizeScene` |
| Naskah | `importScript` → `splitSentences` → `groupIntoScenes(maks 22 kata)` → scene baru |
| Animasi | `applyPreset(id, 'all'|sceneId)`, `savePresetFromScene`, `deletePreset` |
| Playback | `setTime`, `togglePlay`, `seekScene` |
| Global | `setAspect`, `setZoom`, `setTransition` (0,1–1,5), `setVoice`, `setCaption`, `setMusic`, `setProjectName`, `reset` |

**Persistensi:** hanya preset custom — `localStorage` key `wokcam-presets` (SSR-safe: `loadCustomPresets()` cek `typeof window`). Sisanya in-memory (reload = video demo).

## 6. Ekspor TSV (`buildSheetTsv`)

- `projectSlug(judul)` → huruf kecil, bukan alfanumerik dihapus, maks 40 karakter.
- Baris: header 12 kolom + 1 baris/scene. `video_id = slug-001`.
- `esc()` membersihkan tab & newline dari naskah (agar tidak merusak struktur TSV).
- `durasi_detik` memakai `sceneDuration().toFixed(1)`; `status` dipetakan `ready→Siap`, `pending→Draft`.
- Panel Database mengonversi TSV → CSV per-sel dengan quoting benar (sel berisi koma/kutip dibungkus `"…"` dan `"` di-escape `""`) + BOM `\uFEFF`.

## 7. Spesifikasi migrasi ke render nyata

Pemetaan konsep → implementasi target:

| Konsep sekarang (mockup) | Target Fase 2 |
|---|---|
| `motionTransform` → CSS transform | **Remotion** `<Sequence>` + `interpolate()` (React → frame video) atau filter FFmpeg `zoompan` |
| `entranceStyle` (fade/slide/zoom) | Opacity/scale keyframe di Remotion, atau `fade`/`xfade` di FFmpeg |
| `getRenderList` crossfade 0,5 s | FFmpeg `xfade=transition=fade:duration=0.5:offset=t` antar klip |
| `wordTimings` proporsional | Timestamp kata dari TTS API (ElevenLabs `with-timestamps`) |
| Track Suara waveform simulasi | `showwavespic` FFmpeg dari MP3 nyata |
| Voice kartu (6 profil) | Mapping `voice.id` → `voice_id` provider |
| Export simulasi | Pipeline: naskah→TTS per scene → `ffmpeg concat` + `xfade` + subtitle burn (`subtitles=.srt`) → MP4 H.264 1080p/30 |

**Urutan rekomendasi implementasi (lihat [roadmap](11-roadmap.md)):**
1. TTS nyata per scene (durasi riil menggantikan estimasi).
2. Render server-side pakai FFmpeg (kontainer) dengan input = JSON scene yang **sudah ada sekarang** — struktur `Scene` dirancang agar 1:1 jadi parameter render.
3. Remotion sebagai alternatif bila ingin render React-declarative.

## 8. Pengujian & kualitas

- `bun run lint` — ESLint flat config (eslint-config-next), saat ini **0 error/warning**.
- TypeScript strict (`tsconfig.json`), `ignoreBuildErrors` di next.config untuk MVP.
- Fungsi murni di `engine.ts` (durasi, timing, TSV, karaoke) dirancang mudah dites unit — pengujian formal masuk roadmap Fase 2.
