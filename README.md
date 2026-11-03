# Katalog Teknik Editing Mobile — v1.0

Repository desain untuk konsep **app kamera Android dengan editing tanpa timeline** (pause → menu radial bertingkat) yang dipadukan dengan lapisan AI "sutradara digital" dan pipeline referensi **Amati – Tiru – Modifikasi**.

Prinsip kerja yang dipegang seluruh isi repo:

> **AI mendeteksi, preset mengeksekusi, user memutuskan.**
> User mengetik niat hanya sekali di awal; sisanya konfirmasi satu ketukan (*type once, confirm along the way*).

---

## Struktur Repository

```
katalog-teknik-editing/
├── README.md                        ← file ini
├── CHANGELOG.md                     ← riwayat versi dokumen
├── docs/
│   ├── Katalog_Teknik_Editing_Mobile_v1.docx   ← dokumen utama (sumber kebenaran)
│   └── Katalog_Teknik_Editing_Mobile_v1.pdf    ← versi distribusi (layout terkunci)
├── prototype/
│   └── prototipe_pipeline_editing.html         ← simulasi UX interaktif (offline)
├── data/
│   ├── katalog-teknik-v1.json                  ← 63 teknik, mesin-baca (kontrak data)
│   ├── dna-referensi.schema.json               ← JSON Schema (draft-07) untuk validasi DNA
│   └── dna-referensi.example.json              ← contoh DNA Referensi (ilustratif, 45 dtk)
└── tools/
    └── generate-katalog/                       ← generator DOCX + ekspor data
        ├── generate.js                         ← perakit dokumen (docx-js, resep cover R1)
        ├── data_teknik.js                      ← SUMBER data: seluruh teknik, gaya, aturan
        ├── export_data.js                      ← ekspor data_teknik.js → data/*.json
        ├── patch_footers.py                    ← patch nomor halaman (kompatibilitas WPS)
        └── package.json
```

## Isi Ringkas

- **63 teknik** dalam 6 kategori — `CUT` potongan & ritme, `LAY` komposisi, `TXT` teks & grafik, `FX` efek visual, `AUD` audio, `AI` lapisan cerdas. Tiap teknik: kode permanen, kelas eksekusi **A** (pratinjau real-time) / **B** (render ekspor) / **C** (berat/cloud), prioritas **Inti (29)** / **Lanjutan (34)**.
- **6 keluarga gaya** dengan skenario pemakaian konkret (Cinematic Storyteller, Fast-Cut Energetik, Dokumenter Naratif, Minimalis Kreator, Data Storyteller, Vlog Kasual).
- **Skema DNA Referensi v1.0** — keluaran tahap Amati, bahan baku tahap Tiru; kontrak data antara AI, preset, dan antarmuka.
- **Aturan eksekusi mobile** — batas layer, durasi minimum, aturan termal, etika peniruan (pola ya, konten tidak).
- **Roadmap 5 fase** — Fase 0 fondasi → Fase 1 MVP preset manual → Fase 2 sutradara digital → Fase 3 Amati-Tiru-Modifikasi → Fase 4 ekosistem preset.

## Cara Cepat Mencoba

1. **Rasakan UX-nya:** buka `prototype/prototipe_pipeline_editing.html` di browser (tanpa server, tanpa internet). Ikuti tombol cyan dari bawah ke atas: Amati → Tiru → Modifikasi. Di studio, ketuk video untuk pause — menu radial muncul di titik jari; kata "statistik" di detik 9 memicu saran sutradara.
2. **Baca kontraknya:** `docs/Katalog_Teknik_Editing_Mobile_v1.docx` (Bab 5 untuk skema data, Bab 6 untuk aturan eksekusi).
3. **Pakai datanya:** `data/katalog-teknik-v1.json` untuk kosakata aksi agen AI dan mesin preset; validasi file DNA apa pun dengan `data/dna-referensi.schema.json`.

## Validasi File DNA

```bash
pip install jsonschema
python3 - <<'PY'
import json, jsonschema
schema = json.load(open("data/dna-referensi.schema.json"))
dna    = json.load(open("dna_user.json"))   # file milikmu
jsonschema.validate(dna, schema)
print("DNA valid")
PY
```

Aturan validasi penting: `anchors[].technique` wajib cocok pola kode katalog (`^[A-Z]{2,3}-[A-F][0-9]{2}$`), `confidence < 0.75` menuntut pratinjau sebelum konfirmasi, dan `asset.type` hanya boleh `template` atau `library` — tidak ada jalur menyalin aset dari video referensi.

## Regenerasi Dokumen & Data

```bash
# ekspor data JSON dari sumber tunggal
cd tools/generate-katalog
node export_data.js          # → ../../data/katalog-teknik-v1.json

# regenerasi DOCX (perlu Node 18+ dan npm install dulu)
npm install
node generate.js             # → tulis DOCX ke folder download lokal
python3 patch_footers.py <output>.docx
```

Catatan: penyisipan placeholder daftar isi pada DOCX memakai toolchain internal di luar repo ini; file DOCX yang disertakan di `docs/` sudah final. Untuk revisi isi (menambah teknik, mengubah gaya), sunting `tools/generate-katalog/data_teknik.js` lalu jalankan kedua perintah di atas dan perbarui `CHANGELOG.md`.

## Menambah Teknik Baru

Alur katalog hidup: pipeline referensi menandai teknik `unknown` → tim menyusun entri mengikuti format pada **Lampiran A** dokumen → mesin preset mendefinisikan render → entri diuji pada kartu saran → diberi prioritas. Katalog diperbarui setiap lima entri baru terkumpul.

## Status

v1.0 — draf desain untuk diskusi produk. Keputusan yang diminta: penguncian skema DNA v1.0 sebagai kontrak data, persetujuan 24+ teknik Inti sebagai lingkup MVP, dan uji rasa prototipe sebelum pengembangan Android (Kotlin + CameraX + Media3 Transformer) dimulai.
