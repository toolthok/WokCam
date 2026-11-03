# WokCam

Naskah → segmen → gaya editing otomatis per kalimat. PWA, tanpa server.

**Tahap 2 (sekarang):** tempel naskah, app memecah per kalimat, memilih teknik lewat kamus pemicu (≥85% otomatis, sisanya bertanda "?" untuk dikonfirmasi), gaya bisa diganti per kartu, rencana bisa disalin sebagai JSON.

Jalankan: aktifkan GitHub Pages (branch main, folder root). Tidak bisa dibuka via file:// karena memuat data/*.json lewat fetch.

Data: `data/teknik.json` (15 teknik inti), `data/pemicu.json` (kamus pemicu).

Berikutnya: transkripsi VO (Whisper di browser) → pratinjau → ekspor MP4 → jalur ATM.
