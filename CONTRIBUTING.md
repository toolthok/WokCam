# Berkontribusi ke wokCam

Terima kasih mau ikut membangun! Dokumen ini menjelaskan cara setup dan aturan mainnya.

## 1. Setup pengembangan

```bash
# clone + install (Bun disarankan; npm/pnpm juga jalan)
git clone https://github.com/USERNAME/wokCam.git && cd wokCam
bun install

# server dev → http://localhost:3000
bun run dev

# lint (wajib lolos sebelum PR)
bun run lint

# build produksi
bun run build && bun run start
```

Tidak perlu file `.env`, API key, atau database — semua data demo ada di kode, state di memori + `localStorage`.

## 2. Arsitektur singkat (wajib dibaca sebelum PR)

Lihat [docs/08-arsitektur-teknis.md](docs/08-arsitektur-teknis.md) untuk detail. Aturan pemisahan tanggung jawab:

| File | Boleh berisi | TIDAK boleh berisi |
|---|---|---|
| `src/lib/editor/model.ts` | Tipe, konstanta, data statis | Logika perhitungan, akses state |
| `src/lib/editor/engine.ts` | Fungsi murni (durasi, timing, transform, TSV) | `useState`, akses `store`, efek samping |
| `src/lib/editor/store.ts` | State + aksi Zustand, persistensi localStorage | Manipulasi DOM, styling |
| `src/components/**` | Tampilan, panggil aksi store/engine | Perhitungan baru (tambahkan di engine) |

Penambahan preset animasi/sumber aset/suara cukup di `model.ts` (lihat panduan di [docs/05-koleksi-animasi.md §5](docs/05-koleksi-animasi.md)).

## 3. Area yang paling dibutuhkan

1. **TTS nyata** (Fase 2.1) — integrasi ElevenLabs/Edge-TTS + durasi riil.
2. **Render MP4** (Fase 2.3) — pipeline FFmpeg atau komposisi Remotion dari JSON `Scene`.
3. **Persistensi proyek** (Fase 2.2) — simpan/muat proyek + sinkron Sheets dua arah.
4. **Unit test engine.ts** — fungsi murninya sudah dirancang mudah dites.
5. **Koreksi dokumen** — semua `docs/*.md` bahasa Indonesia; perbaiki bila ada data harga/kuota yang kedaluwarsa (sertakan sumber).

## 4. Konvensi commit

Format: `tipe: deskripsi singkat` (huruf kecil, bahasa Indonesia atau Inggris bebas).

```
feat: tambah preset animasi konferensi
fix: durasi scene manual tidak ter-clamp
docs: perbarui harga tool di 09-panduan-tool
refactor: pindah perhitungan waveform ke engine
```

Tipe: `feat` · `fix` · `docs` · `style` · `refactor` · `chore`.

## 5. Aturan konten & lisensi

- Semua teks UI dan dokumentasi berbahasa Indonesia; istilah teknis boleh tetap Inggris.
- Jangan commit binary besar (>2 MB) atau file node_modules/`.next`.
- Jangan tambahkan sumber aset yang lisensinya tidak jelas — lihat standar di [docs/04-aset-gratis.md](docs/04-aset-gratis.md).
- Pull request menjelaskan: apa yang berubah, kenapa, dan cara mengujinya.

## 6. Melaporkan bug

Buka Issue dengan format: langkah reproduksi → yang diharapkan → yang terjadi → screenshot/layar → versi (commit/branch). Bug visual diunggah sebagai gambar di `docs/img/`-gaya (PNG, tidak di-resize).
