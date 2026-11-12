# Antrian pengembangan WokCam

Aturan: prompt Generator (mode *Rancangan visual*) harus mengerjakan ±50% pekerjaan awal.
Yang belum ada di WokCam dicatat di sini (atau otomatis lewat `kebutuhan_baru` dari hasil AI).

Sumber awal: bedah video referensi 69 dtk (*insiderforce*, 9:16, 30 fps), dianalisis Nov 2026.

## A. Gaya, animasi, efek yang belum ada

| # | Jenis | Nama usulan | Deskripsi singkat | Status |
|---|-------|-------------|-------------------|--------|
| A1 | animasi | Kata Naik Blur | tiap kata naik 10–20 px, dari abu-abu 40% + blur, jadi hitam pekat dalam 0,3 dtk | belum |
| A2 | efek | Caption Kotak Hitam | teks putih di kotak hitam membulat (subtitle highlight) | belum |
| A3 | efek | Garis Kuas | garis tangan (brush underline) di bawah frasa penekanan | belum |
| A4 | efek | Kartu 3D Miring | kartu mockup dengan perspektif 3D, bayangan panjang lembut ke kanan-bawah | sebagian (kartu sudah miring 2,5°, belum 3D & bayangan panjang) |
| A5 | animasi | Bullet Bertahap | ikon ✦ muncul satu per satu (±1 dtk) sebelum tiap baris | belum |
| A6 | efek | Pill Logo 3D | lencana pil berlogo bersudut 3D, meluncur dari kanan lalu menetap | belum |
| A7 | loop | Geser Berlawanan | dua elemen digeser horizontal berlawanan arah terus-menerus | belum |
| A8 | transisi | Sapuan Abu | sapuan gradien abu-abu yang menutup layar | belum |
| A9 | transisi | Balik Halaman | efek buku dibuka (page flip 3D) | belum (kontrak sudah mengenal `flip`, belum digambar) |
| A10 | animasi | Terbang Kiri 3D | objek 3D miring terbang masuk dari kiri | belum |
| A11 | animasi | Kartu Geser Vertikal | kartu naik/turun dengan ease in-out, dipakai bergantian dengan scene | sebagian (*Geser Kartu Naik* ada) |
| A12 | efek | Grid Titik Halus | latar kertas dengan pola titik | sudah ada (*kertas-grid*) |
| A13 | efek | Vignette Lembut | gelap tepi halus | sudah ada (*vignette*) |

## B. Fitur yang belum ada

| # | Fitur | Alasan | Status |
|---|-------|--------|--------|
| B1 | Keyframe posisi teks (geser per waktu, drag di pratinjau) | teks terasa kaku | **dikerjakan v0.10** (perlu diuji) |
| B2 | Slot aset dari AI (`aset_slot`) → placeholder foto/video yang bisa diisi | AI sudah bisa menentukan posisi aset | belum (data ditolak diam-diam, perlu UI) |
| B3 | Antrian kebutuhan dari impor AI: lihat daftar di editor | kebutuhan baru sudah tersimpan | data tersimpan di `wokcam.antrian.v1`, belum ada layar |
| B4 | Keyframe teks di timeline (blok keyframe bisa diseret) | editor keyframe baru ada di tab Teks | belum |
| B5 | Render: font pratinjau (bukan sans-serif sistem) | hasil render beda dengan pratinjau | belum |
| B6 | Render: grain & bokeh | overlay belum digambar | belum |
| B7 | Analyzer: bedakan hard cut dari crossfade; buang animasi teks dari daftar transisi; cek arah slide | dari uji video referensi: 5 dari 12 batas tertangkap, jenis sering salah | belum |
| B8 | Geser & ubah ukuran kartu di pratinjau | sama seperti aset | belum |
| B9 | Hilangkan latar aset (remove background) | butuh model di browser | belum (setelah render stabil) |

## C. Catatan uji
- Render sebelumnya: video hanya 1,4 dtk dari 52 dtk (perekam berhenti). v0.9.2 mengganti ke WebM dan melepas track audio kosong. Belum terverifikasi di perangkat.
