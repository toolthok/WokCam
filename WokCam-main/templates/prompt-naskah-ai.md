# Template Prompt Naskah AI (ChatGPT / Gemini / Claude)

> Salin blok di bawah, ganti bagian dalam `{kurung}`, tempel ke AI chat favoritmu.
> Naskah hasilnya dirancang pas dengan **Impor Naskah AI** di editor wokCam (potong per kalimat, maks. 22 kata/scene).

## Prompt utama — video faceless short

```text
Kamu penulis naskah video faceless untuk TikTok/Reels/Shorts berbahasa Indonesia santai.

TOPIK: {topik, mis. "3 kebiasaan pagi yang mengubah hidup"}
DURASI TARGET: {30–45} detik
SUARA: {mis. Sari — wanita santai hangat} (untuk gaya penulisan, bukan teknis)

ATURAN WAJIB:
1. Tulis SETIAP KALIMAT pada baris baru sendiri (satu baris = satu kalimat).
2. Baris pertama = HOOK maksimal 12 kata. Tanpa sapaan ("halo guys" dilarang).
3. Tengah = {2–4} POIN. Satu baris = satu ide. Maksimal 12 kata per baris.
4. Gunakan kata aktif + konkrit. Hindari angka rumit; tulis cara baca ("seribu", bukan "1.000").
5. Baris terakhir = CTA maksimal 12 kata (ajakan simpan + follow).
6. Total seluruh naskah: {60–110} kata.
7. Akhiri dengan blok "VISUAL:" berisi 1 baris saran visual gratis (Pexels/Pixabay keyword, orientasi vertikal) untuk setiap kalimat.

FORMAT KELUARAN:
HOOK:
{kalinat}
POIN:
{kalimat}
{kalimat}
CTA:
{kalimat}
VISUAL:
1. {keyword}
2. {keyword}
...
```

## Contoh hasil (video demo repo)

```
HOOK:
Kebanyakan orang gagal bukan karena malas, tapi karena urutan pagi mereka salah.
POIN:
Kebiasaan pertama: bangun dan jangan sentuh HP selama 10 menit pertama.
Otakmu akan jauh lebih tenang.
Kebiasaan kedua: tulis 3 target terpenting sebelum jam 9 pagi.
Yang tidak ditulis, tidak akan dikerjakan.
Kebiasaan ketiga: gerakkan badan 15 menit.
Bukan demi sixpack, tapi demi fokus sepanjang hari.
CTA:
Simpan video ini, lalu coba besok pagi.
Follow untuk tips produktivitas lainnya.
VISUAL:
1. sunrise city aerial vertical
2. desk morning coffee journal
3. planner writing goals close up
4. rooftop workout morning
5. neon arrow sign follow
```

> Baris POIN dengan >22 kata otomatis digabung jadi satu scene oleh editor — inilah kenapa "satu kalimat per baris" penting.

## Prompt lanjutan

### Revisi hook (kalau retensi 3 detik rendah)
```text
Naskah ini retensi 3 detiknya rendah:
"{naskah hook}"
Buat 5 alternatif hook (maks 12 kata): 2 versi pertanyaan, 2 versi pernyataan kontras, 1 versi angka spesifik. Baris baru per versi, tanpa penjelasan.
```

### Ubah jadi series
```text
Dari naskah ini, buat 5 ide video lanjutan untuk series yang sama.
Format per ide: JUDUL | HOOK (maks 12 kata) | 3 POIN (maks 12 kata/point) | CTA.
Baris baru per ide.
```

### Perpendek (kalau durasi kelebihan)
```text
Perpendek naskah ini jadi {60} kata dengan aturan yang sama (hook/POIN/CTA per baris). Pertahankan angka dan kata kunci konkret.
```

## Checklist setelah naskah jadi

- [ ] Hook ≤ 12 kata, tanpa sapaan pembuka
- [ ] Setiap baris ≤ 12 kata (kalau lebih → scene-nya >6 dtk, masih oke tapi cek ritme)
- [ ] CTA ≤ 12 kata, satu ajakan saja
- [ ] Tidak ada istilah asing yang sering salah dibaca TTS (ubah ke ejaan cara baca)
- [ ] Blok VISUAL terisi — langsung tempel ke kolom `aset` di Google Sheets
- [ ] Tempel HOOK+POIN+CTA ke editor → **Impor Naskah AI** → jumlah scene & durasi masuk akal (30–45 dtk)
