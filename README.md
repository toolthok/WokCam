# Katalog Teknik Editing Mobile & Prototipe PauseCut — v1.2

Repository desain untuk konsep **app kamera Android dengan editing tanpa timeline**
(pause → menu radial bertingkat), dipadukan lapisan AI "sutradara digital",
pipeline referensi **Amati – Tiru – Modifikasi**, dan **metode buat-baru**
(naskah/voice-over menjadi timeline lewat kamus pemicu).

> **AI mendeteksi, preset mengeksekusi, user memutuskan.**
> *Type once, confirm along the way* — etika: tiru polanya, bukan kontennya.

---

## Struktur Repository

```
katalog-teknik-editing/
├── README.md                                  ← file ini
├── CHANGELOG.md                               ← riwayat versi
├── .gitignore                                 ← node_modules/ & hasil build tidak ikut
├── docs/                                      ← satu pintu untuk manusia + akar GitHub Pages
│   ├── index.html                             ← halaman muka (link demo & unduhan)
│   ├── prototipe_pipeline_editing.html        ← HTML: demo interaktif v1.1 (KDICT)
│   ├── Katalog_Teknik_Editing_Mobile_v1.docx  ← dokumen utama (biner kecil)
│   └── Katalog_Teknik_Editing_Mobile_v1.pdf   ← versi distribusi (layout terkunci)
├── data/                                      ← kontrak data mesin (teks kecil, ramah git)
│   ├── katalog-teknik-v1.json                 ← 63 teknik, mesin-baca
│   ├── dna-referensi.schema.json              ← JSON Schema (draft-07) untuk validasi DNA
│   ├── dna-referensi.example.json             ← contoh DNA Referensi (ilustratif, 45 dtk)
│   ├── kamus_pemicu_v1.1.tsv                  ← 103 pemicu (98 kata + 3 pola + 2 aturan)
│   ├── aliases_crosswalk.json                 ← crosswalk 900 token viral → 63 teknik
│   └── crosswalk_900token_v1.tsv              ← versi TSV dari crosswalk (900 baris)
├── prototype-src/                             ← sumber perakit prototipe (teks)
│   ├── part1_head.html
│   ├── part2_body.html
│   └── part3_js.html                          ← KDICT & logika studio ada di sini
└── tools/
    ├── generate-katalog/                      ← generator DOCX + ekspor data
    │   ├── generate.js                        ← perakit dokumen (docx-js)
    │   ├── data_teknik.js                     ← SUMBER TUNGGAL data teknik/gaya/aturan
    │   ├── export_data.js                     ← ekspor data_teknik.js → data/*.json
    │   ├── patch_footers.py                   ← patch nomor halaman (kompatibilitas WPS)
    │   └── package.json / package-lock.json
    ├── extract_kdict_tsv.py                   ← KDICT → kamus_pemicu TSV
    └── crosswalk_900.py                       ← 900 token → crosswalk JSON/TSV
```

## Di mana menaruh HTML & DOCX di repository?

**Aturan besar: git sayang teks, alergi biner.** HTML itu teks → aman di-commit,
bisa di-diff baris per baris. DOCX/PDF itu biner → taruh secukupnya.

| Jenis file | Lokasi di repo ini | Alasan |
|---|---|---|
| **HTML** prototipe | `docs/` | Teks kecil → ramah diff; `docs/` bisa dijadikan akar **GitHub Pages**, jadi demo otomatis punya URL hidup |
| **DOCX / PDF** | `docs/` | Saat ini <1 MB dan jarang berubah → boleh di-commit; sumber datanya tetap `data_teknik.js`, dokumen bisa diregenerasi |
| **JSON / TSV** | `data/` | Kontrak data mesin — kecil, diff-able, wajib tervalidasi |
| Kode generator | `tools/` | Kode; `node_modules/` TIDAK pernah di-commit |

Jika kondisinya berubah, tiga jalan yang berlaku umum:

1. **DOCX/PDF membesar atau sering direvisi** → pindahkan hasil jadinya ke
   **GitHub Releases** (lampiran rilis, tanpa membebani riwayat git). Yang
   di-commit cukup sumbernya di `tools/`; pembaca mengunduh dari halaman Releases.
2. **File biner wajib di repo dan berukuran besar (>50 MB)** → pakai **Git LFS**:
   `git lfs track "*.docx" "*.pdf" "*.zip"`.
3. **HTML demo ingin online** → aktifkan Pages:
   *Settings → Pages → Deploy from a branch → folder `/docs`* →
   demo menjadi `https://<user>.github.io/<repo>/prototipe_pipeline_editing.html`.

Yang **tidak boleh** masuk git: `node_modules/`, folder hasil build (`dist/`, `out/`),
unduhan mentah, dan file sementara — sudah ditutup oleh `.gitignore` di repo ini.

## Isi Ringkas

- **63 teknik** dalam 6 kategori — `CUT` potongan & ritme, `LAY` komposisi,
  `TXT` teks & grafik, `FX` efek visual, `AUD` audio, `AI` lapisan cerdas.
  Tiap teknik: kode permanen, kelas eksekusi **A** (pratinjau real-time) /
  **B** (render ekspor) / **C** (berat/cloud), prioritas **Inti (29)** / **Lanjutan (34)**.
- **6 keluarga gaya** dengan skenario pemakaian konkret.
- **Skema DNA Referensi v1.0** — kontrak data antara AI, preset, dan antarmuka.
- **Kamus pemicu v1.1** — 27 entri → 98 kata (ID+EN) + 3 pola angka
  ("N%", "N persen", "N kali lipat") + 2 aturan struktur (kalimat pembuka → hook,
  kalimat penutup → CTA) = **103 baris**; 83 pemicu AUTO (keyakinan ≥85%),
  20 konfirmasi satu ketukan.
- **Crosswalk 900 token viral** — hasil pemetaan 900 token dari 9 screenshot ke
  katalog, dikelas: ALIAS (sinonim), PARAM (nilai parameter), RESEP (paket gaya),
  BARU (kandidat teknik baru), TOLAK (subjek/konten — bukan teknik editing).
- **Aturan eksekusi mobile** — batas layer, durasi minimum, aturan termal,
  etika peniruan (pola ya, konten tidak).
- **Roadmap 5 fase** — Fase 0 fondasi → Fase 4 ekosistem preset.

## Dua Metode Kerja

1. **Metode 1 — ATM** (Amati · Tiru · Modifikasi): analisis video referensi →
   DNA JSON → anchor dipetakan ke video user → studio.
2. **Metode 2 — Buat Baru**: naskah/voice-over menjadi timeline. ASR memberi
   timestamp per kata; kamus pemicu mencocokkan kata → teknik katalog.
   Hybrid: yakin ≥85% terpasang otomatis, sisanya kartu konfirmasi satu ketukan.

Kedua metode berbagi katalog dan studio yang sama (pause + menu radial dua
tingkat, kartu sutradara, undo, ekspor).

## Cara Cepat Mencoba

1. **Rasakan UX-nya:** buka `docs/prototipe_pipeline_editing.html` di browser
   (tanpa server, tanpa internet). Rekam VO memakai Web Speech API bila tersedia;
   tanpa mic, gunakan tombol *Pakai naskah contoh*.
2. **Baca kontraknya:** `docs/Katalog_Teknik_Editing_Mobile_v1.docx`
   (Bab 5 skema data, Bab 6 aturan eksekusi).
3. **Pakai datanya:** `data/katalog-teknik-v1.json` untuk kosakata aksi agen AI
   dan mesin preset; validasi file DNA dengan `data/dna-referensi.schema.json`;
   petakan sinonim viral lewat `data/aliases_crosswalk.json`.

### Validasi File DNA

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

Aturan validasi penting: `anchors[].technique` wajib cocok pola kode katalog
(`^[A-Z]{2,3}-[A-F][0-9]{2}$`), `confidence < 0.75` menuntut pratinjau sebelum
konfirmasi, dan `asset.type` hanya boleh `template` atau `library`.

### Regenerasi Dokumen & Data

```bash
# ekspor data JSON dari sumber tunggal
cd tools/generate-katalog && node export_data.js   # → ../../data/katalog-teknik-v1.json

# regenerasi DOCX (perlu Node 18+, npm install dulu)
npm install && node generate.js && python3 patch_footers.py <output>.docx

# regenerasi kamus TSV dari prototipe
python3 tools/extract_kdict_tsv.py

# regenerasi crosswalk dari daftar token
python3 tools/crosswalk_900.py
```

## Hal yang Diketahui (perbaiki sebelum skema v1.0 dibekukan)

- **4 kode kamus belum sinkron dengan katalog:**
  `CUT-A03` (kamus "Hard Cut Flash" vs katalog "Beat Cut"),
  `CUT-A06` (kamus "Freeze Frame", katalog "Speed Ramp" — Freeze Frame sebenarnya
  `CUT-A07`),
  `CUT-B02` "Fade to Black" belum ada di katalog,
  `FX-D08` (kamus "Slow Motion", katalog "Glitch Effect" — Slow Motion masuk
  crosswalk sebagai kandidat teknik baru `FX-D16`).
- **Kamus pemicu menyangkup 18/63 kode.** 10 teknik AI memang internal (bukan
  pemicu kata); sisanya teknik visual/audio (mis. Jump Cut, J/L-Cut) lebih cocok
  dideteksi lewat analisis visual/audio, bukan kata.

## Status

v1.2 — paket lengkap siap distribusi. Keputusan yang diminta: bekukan skema DNA
v1.0, setujui 24+ teknik Inti sebagai lingkup MVP, sinkronkan 4 kode kamus↔katalog,
dan uji rasa prototipe sebelum pengembangan Android (Kotlin + CameraX + Media3
Transformer) dimulai.
