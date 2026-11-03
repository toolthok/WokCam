# Changelog

## v1.2 — 3 November 2026

- Kamus pemicu v1.1 diekspor ke `data/kamus_pemicu_v1.1.tsv` — 103 baris pemicu:
  98 kata (27 entri KDICT) + 3 pola angka ("N%", "N persen", "N kali lipat") +
  2 aturan struktur (kalimat pembuka → hook, kalimat penutup → CTA).
  83 pemicu AUTO (keyakinan ≥85%), 20 konfirmasi satu ketukan.
- Crosswalk 900 token viral → katalog 63 teknik: `data/aliases_crosswalk.json`
  + `data/crosswalk_900token_v1.tsv` (kelas ALIAS / PARAM / RESEP / BARU / TOLAK).
- Prototipe v1.1 (`docs/prototipe_pipeline_editing.html`): KDICT, Metode 2
  "Buat Baru" (naskah/voice-over → ASR → timeline), rekam VO via Web Speech API,
  subtitel kata-per-kata dengan sorot pemicu. Sumber perakit dipisah ke
  `prototype-src/`.
- Skrip alat: `tools/extract_kdict_tsv.py` (KDICT → TSV) dan
  `tools/crosswalk_900.py` (900 token → crosswalk).
- Struktur repo dirapikan: semua keluaran siap-baca dipusatkan di `docs/`
  (siap GitHub Pages), ditambah `.gitignore`.

## v1.1 — 3 November 2026

- Prototipe: Metode 2 "Buat Baru" + kamus pemicu ID+EN dengan perilaku hybrid
  (AUTO ≥85% / konfirmasi satu ketukan).

## v1.0 — 3 November 2026

Rilis awal.

- Katalog 63 teknik dalam 6 kategori (CUT, LAY, TXT, FX, AUD, AI) dengan kelas
  eksekusi A/B/C dan prioritas Inti/Lanjutan (29/34).
- Enam keluarga gaya lengkap dengan karakter, teknik andalan, dan skenario pemakaian.
- Skema data DNA Referensi v1.0 (JSON Schema draft-07) + contoh terverifikasi.
- Aturan eksekusi mobile (8 aturan) dan etika pipeline referensi (pola, bukan konten).
- Peta jalan implementasi 5 fase.
- Prototipe interaktif alur Amati – Tiru – Modifikasi (HTML mandiri, offline).
