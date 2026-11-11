# 06 · Voice-over & TTS

> Peta dokumen: [05 Koleksi Animasi](05-koleksi-animasi.md) ← | → [07 Panduan Editor UI](07-editor-ui.md)

Tab **Suara** di Inspector mengatur karakter suara, kecepatan, pitch, dan volume. Saat ini nilainya menggerakkan **estimasi durasi & simulasi waveform** — pada [Fase 2 roadmap](11-roadmap.md) pengaturan yang sama akan dikirim ke TTS API sungguhan.

## 1. Enam karakter suara

Definisi ada di `src/lib/editor/model.ts` (`VOICES`) — enam profil untuk gaya konten faceless yang umum:

| Voice | Profil | Tag gaya | Warna tag di UI |
|---|---|---|---|
| **Sari** | Wanita · santai hangat | Storytelling | pink `#F472B6` |
| **Arif** | Pria · berita formal | Dokumenter | violet `#A78BFA` |
| **Dimas** | Pria · energik muda | Hype | emerald `#34D399` |
| **Ratna** | Wanita · jernih tenang | Edukatif | kuning `#FACC15` |
| **Bagas** | Pria · berat sinematik | Sinematik | oranye `#FB923C` |
| **Nayla** | Wanita · ceria cepat | Vlog | cyan `#22D3EE` |

**Default proyek:** `Sari` · speed ×1.0 · pitch 0 · volume 80.

### Panduan memilih per niche

| Jenis konten | Suara pas | Alasan |
|---|---|---|
| Storytelling / kisah personal | Sari | Hangat, penonton betah |
| Edukasi / tutorial | Ratna | Jernih, tidak menantang |
| Fakta / berita / mystery | Arif | Formal, terasa kredibel |
| Listicle cepat / humor | Dimas atau Nayla | Energi tinggi |
| Motivasi sinematik | Bagas | Berat, dramatis |

## 2. Rumus durasi otomatis

Karena editor belum memanggil TTS nyata, durasi scene dihitung dari kecepatan bicara:

```
WORDS_PER_SEC = 2.4          (≈ 140–150 kata/menit, khas TTS bahasa Indonesia)
durasi = kata / (2.4 × speed) + 0.8 detik
```

- Jeda +0,8 detik memberi ruang napas antar scene.
- Hasil di-clamp ke rentang **2,5 – 30 detik**; durasi manual (opsi *Manual* di tab Naskah) di-clamp ke **1 – 60 detik**.
- Contoh: naskah 12 kata → `12/2.4 + 0.8 = 5.8 detik` (persis seperti Scene 1 di video demo).
- Naikkan **speed** ke ×1.1 untuk gaya cepat TikTok — semua durasi scene turun otomatis dan timeline ikut menyusut.

Kode: `estimateDuration()`, `sceneDuration()`, `WORDS_PER_SEC` di `src/lib/editor/engine.ts`.

## 3. Menghasilkan voice-over gratis (tahap manual)

Sampai integrasi API jadi, voice-over dibuat di luar editor:

| Tool | Cara | Catatan |
|---|---|---|
| **TTSMaker** | Tempel naskah per scene → pilih suara Indonesia → unduh MP3 | Boleh komersial; rotasi kuota harian |
| **CapCut TTS** | Tempel naskah di CapCut Desktop → Text to speech | Paling instan; langsung sinkron dengan timeline render |
| **ElevenLabs free** | 10.000 karakter/bulan | Kualitas terbaik — sisihkan untuk video penting |

**Alur per scene (dari Sheets):** filter kolom D per `video_id` → tempel ke TTS satu per satu → beri nama file sesuai `no_scene` (`001.mp3`, `002.mp3`, …) → di CapCut, urutkan sesuai kolom E (`durasi_detik`).

## 4. Pengaturan di tab Suara

| Kontrol | Efek sekarang (mockup) | Efek nanti (Fase 2) |
|---|---|---|
| Pilih voice (6 kartu) | Mengubah label di timeline + kolom `voice` saat ekspor TSV | Menentukan `voice_id` yang dikirim ke TTS API |
| Kecepatan ×0.5–×2.0 | Mengubah estimasi durasi semua scene | `speed` parameter TTS + penyesuaian durasi |
| Pitch −5–+5 | Simulasi label | `pitch` parameter TTS |
| Volume 0–100 | Skala kekuatan waveform simulasi | `gain` saat mixing audio |

## 5. Tips voice-over faceless

1. **Satu suara per channel.** Konsistensi suara = identitas; penonton merasa "suara yang sama" sebelum melihat nama channel.
2. **Kalimat pendek.** Naskah dengan kalimat ≤ 12 kata menghasilkan scene 4–6 detik — pas dengan ritme Shorts.
3. **Hindari angka rumit di naskah.** TTS sering salah baca ("1.000" vs "seribu"). Tulis apa adanya cara baca: `seribu`.
4. **Cek hasil satu scene dulu** sebelum generate semua — suara Indonesia kadang salah aksen untuk istilah asing (mis. "schedule", "apps").
5. **Simpan file TTS asli** per video (folder `voice/`) — bila perlu re-render, tidak perlu generate ulang dan kuota tidak terpakai dua kali.

## 6. Catatan teknis untuk Fase 2

Yang sudah disiapkan agar migrasi API mudah:

- `voice.id` akan dipetakan langsung ke ID penyedia (mis. ElevenLabs `voice_id`).
- `sceneDuration()` tinggal diganti: estimasi → durasi **riil** dari respons TTS (`audio_duration`), sisa logika (timeline, karaoke, TSV) tidak berubah.
- `wordTimings()` di `engine.ts` sudah menghitung timing per kata secara proporsional (berbobot panjang kata) — ketika API mengembalikan timestamp asli, fungsi ini tinggal diganti sumber datanya dan subtitle karaoke otomatis akurat sampai kata.
